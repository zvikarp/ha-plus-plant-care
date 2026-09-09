"""Core integration promise: plants and their history outlive sensor movement."""

from datetime import UTC, datetime

from homeassistant.const import ATTR_ENTITY_ID, CONF_NAME, STATE_UNAVAILABLE
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import service as service_helper
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.plant_care_plus.const import (
    ATTR_MEASUREMENT,
    ATTR_SOURCE_ENTITY_ID,
    ATTR_TIMESTAMP,
    CONF_LOCATION_TYPE,
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


def make_entry(plant_id: str, name: str) -> MockConfigEntry:
    """Create a complete plant config entry."""
    return MockConfigEntry(
        domain=DOMAIN,
        title=name,
        unique_id=plant_id,
        data={
            CONF_PLANT_ID: plant_id,
            CONF_NAME: name,
            CONF_LOCATION_TYPE: "indoor",
            CONF_WATERING_INTERVAL: 18,
            CONF_MOISTURE_MINIMUM: 20,
            CONF_MOISTURE_TARGET: 35,
        },
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
