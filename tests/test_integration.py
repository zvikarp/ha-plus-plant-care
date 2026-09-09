"""Core integration promise: plants and their history outlive sensor movement."""

from datetime import UTC, datetime

from homeassistant.components.sensor import SensorDeviceClass
from homeassistant.const import ATTR_ENTITY_ID, CONF_NAME, STATE_UNAVAILABLE
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import service as service_helper
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.plant_care_plus.const import (
    ATTR_MEASUREMENT,
    ATTR_SOURCE_ENTITY_ID,
    ATTR_TIMESTAMP,
    CONF_AREA_ID,
    CONF_LINKED_PLANT_ENTITY,
    CONF_MOISTURE_MINIMUM,
    CONF_MOISTURE_TARGET,
    CONF_PLANT_ID,
    CONF_WATERING_INTERVAL,
    DOMAIN,
    SERVICE_ASSIGN_SENSOR,
    SERVICE_WATER,
    CareEventType,
    Measurement,
)
from custom_components.plant_care_plus.coordinator import PlantCareManager


def make_entry(
    plant_id: str,
    name: str,
    area_id: str = "living_room",
    linked_plant_entity: str | None = None,
) -> MockConfigEntry:
    """Create a complete plant config entry."""
    data = {
        CONF_PLANT_ID: plant_id,
        CONF_NAME: name,
        CONF_AREA_ID: area_id,
        CONF_WATERING_INTERVAL: 18,
        CONF_MOISTURE_MINIMUM: 20,
        CONF_MOISTURE_TARGET: 35,
    }
    if linked_plant_entity is not None:
        data[CONF_LINKED_PLANT_ENTITY] = linked_plant_entity
    return MockConfigEntry(
        domain=DOMAIN,
        title=name,
        unique_id=plant_id,
        data=data,
    )


async def test_sensor_move_preserves_plant_and_history(hass) -> None:
    """Exercise the architectural promise from creation through reassignment."""
    zz = make_entry("zz-plant", "ZZ Plant")
    basil = make_entry("basil-plant", "Basil")
    zz.add_to_hass(hass)
    basil.add_to_hass(hass)
    assert await hass.config_entries.async_setup(zz.entry_id)
    await hass.async_block_till_done()

    registry = er.async_get(hass)
    zz_status = registry.async_get_entity_id("sensor", DOMAIN, "zz-plant_care_status")
    basil_status = registry.async_get_entity_id(
        "sensor", DOMAIN, "basil-plant_care_status"
    )
    assert zz_status is not None
    assert basil_status is not None
    descriptions = await service_helper.async_get_all_descriptions(hass)
    assert SERVICE_ASSIGN_SENSOR in descriptions[DOMAIN]

    watered_at = datetime(2026, 9, 7, 17, tzinfo=UTC)
    await hass.services.async_call(
        DOMAIN,
        SERVICE_WATER,
        {ATTR_ENTITY_ID: [zz_status], ATTR_TIMESTAMP: watered_at},
        blocking=True,
    )

    hass.states.async_set("sensor.plant_sensor_3", "17", {"unit_of_measurement": "%"})
    await hass.services.async_call(
        DOMAIN,
        SERVICE_ASSIGN_SENSOR,
        {
            ATTR_ENTITY_ID: [zz_status],
            ATTR_MEASUREMENT: Measurement.MOISTURE,
            ATTR_SOURCE_ENTITY_ID: "sensor.plant_sensor_3",
        },
        blocking=True,
    )
    await hass.services.async_call(
        DOMAIN,
        SERVICE_ASSIGN_SENSOR,
        {
            ATTR_ENTITY_ID: [basil_status],
            ATTR_MEASUREMENT: Measurement.MOISTURE,
            ATTR_SOURCE_ENTITY_ID: "sensor.plant_sensor_3",
        },
        blocking=True,
    )

    manager: PlantCareManager = hass.data[DOMAIN]
    assert "zz-plant" in manager.coordinators
    assert "basil-plant" in manager.coordinators
    assert (
        manager.store.last_event("zz-plant", CareEventType.WATERED).timestamp
        == watered_at
    )
    assert Measurement.MOISTURE not in manager.store.assignments_for("zz-plant")
    assert (
        manager.store.assignments_for("basil-plant")[Measurement.MOISTURE].entity_id
        == "sensor.plant_sensor_3"
    )
    assert manager.coordinators["zz-plant"].data.sensor_assisted is False
    assert manager.coordinators["basil-plant"].data.moisture == 17

    hass.states.async_set("sensor.plant_sensor_3", STATE_UNAVAILABLE)
    await hass.async_block_till_done()
    assert manager.coordinators["basil-plant"].data.moisture_available is False
    assert Measurement.MOISTURE in manager.store.assignments_for("basil-plant")


async def test_area_ambient_sensor_is_used_automatically(hass) -> None:
    """An area temperature sensor backs the plant proxy without manual setup."""
    area = ar.async_get(hass).async_create("Greenhouse")
    registry = er.async_get(hass)
    source = registry.async_get_or_create(
        "sensor",
        "test",
        "greenhouse_temperature",
        suggested_object_id="greenhouse_temperature",
        original_device_class=SensorDeviceClass.TEMPERATURE,
    )
    registry.async_update_entity(source.entity_id, area_id=area.id)
    hass.states.async_set(
        source.entity_id,
        "24.5",
        {"device_class": SensorDeviceClass.TEMPERATURE, "unit_of_measurement": "°C"},
    )

    entry = make_entry("fern", "Fern", area.id)
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    proxy_id = registry.async_get_entity_id("sensor", DOMAIN, "fern_temperature")
    assert proxy_id is not None
    proxy = hass.states.get(proxy_id)
    assert proxy is not None
    assert proxy.state == "24.5"
    assert proxy.attributes["source_entity_id"] == source.entity_id


async def test_linked_plant_sensor_is_reused_automatically(hass) -> None:
    """A linked HA plant's public sensor mapping backs the matching proxy."""
    hass.states.async_set(
        "sensor.fern_moisture_source", "18", {"unit_of_measurement": "%"}
    )
    hass.states.async_set(
        "plant.existing_fern",
        "ok",
        {"sensors": {"moisture": "sensor.fern_moisture_source"}},
    )
    entry = make_entry(
        "linked-fern",
        "Linked Fern",
        linked_plant_entity="plant.existing_fern",
    )
    entry.add_to_hass(hass)

    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    manager: PlantCareManager = hass.data[DOMAIN]
    coordinator = manager.coordinators["linked-fern"]
    assert coordinator.data.moisture == 18
    assert coordinator.data.sensor_assisted


async def test_legacy_profile_without_area_still_loads(hass) -> None:
    """Removed profile keys remain readable during a rollback-safe transition."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Legacy plant",
        unique_id="legacy-plant",
        data={
            CONF_PLANT_ID: "legacy-plant",
            CONF_NAME: "Legacy plant",
            "common_name": "Fern",
            "scientific_name": "Nephrolepis exaltata",
            "location_type": "indoor",
            CONF_WATERING_INTERVAL: 18,
            CONF_MOISTURE_MINIMUM: 20,
            CONF_MOISTURE_TARGET: 35,
        },
    )
    entry.add_to_hass(hass)

    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    manager: PlantCareManager = hass.data[DOMAIN]
    assert manager.coordinators["legacy-plant"].plant.area_id is None
