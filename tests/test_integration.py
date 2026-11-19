"""Core integration promise: plants and their history outlive sensor movement."""

from datetime import UTC, datetime, timedelta
from typing import cast
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.components.http import StaticPathConfig
from homeassistant.components.sensor import SensorDeviceClass
from homeassistant.const import ATTR_ENTITY_ID, CONF_NAME, STATE_UNAVAILABLE
from homeassistant.core import HomeAssistant, ServiceValidationError
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import service as service_helper
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.plant_care_plus import async_setup, async_setup_entry
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
from custom_components.plant_care_plus.coordinator import (
    PlantCareManager,
    PlantCoordinator,
)
from custom_components.plant_care_plus.frontend import (
    CARD_PATH,
    CARD_URL,
    async_register_card,
)


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


async def test_card_registration_uses_supported_frontend_apis() -> None:
    """Cards and the built-in panel share versioned assets and register once."""
    hass = cast(HomeAssistant, MagicMock())
    hass.data = {}
    hass.http.async_register_static_paths = AsyncMock()
    with (
        patch(
            "custom_components.plant_care_plus.ha_plus_frontend.async_get_integration",
            new=AsyncMock(return_value=MagicMock(version="0.1.8")),
        ),
        patch(
            "custom_components.plant_care_plus.ha_plus_frontend.add_extra_js_url"
        ) as add,
        patch(
            "custom_components.plant_care_plus.ha_plus_frontend.async_register_panel",
            new=AsyncMock(),
        ) as panel,
    ):
        await async_register_card(hass)
        await async_register_card(hass)
    paths = hass.http.async_register_static_paths.call_args.args[0]
    assert paths[0] == StaticPathConfig(CARD_URL, str(CARD_PATH), cache_headers=False)
    assert paths[1].url_path == "/plant_care_plus/icon.png"
    assert hass.http.async_register_static_paths.await_count == 1
    add.assert_called_once_with(hass, f"{CARD_URL}?v=0.1.8")
    assert panel.call_args.kwargs["frontend_url_path"] == "ha-plus-plant-care"
    assert panel.call_args.kwargs["require_admin"] is False
    assert panel.call_args.kwargs["sidebar_icon"] == "plant-care-plus:logo"
    assert panel.call_args.kwargs["config"] == {"version": "0.1.8"}


async def test_care_status_exposes_current_card_entities(hass) -> None:
    """The card receives registry-safe sibling IDs instead of guessing names."""
    entry = make_entry("card-plant", "Card Plant")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    registry = er.async_get(hass)
    status_id = registry.async_get_entity_id("sensor", DOMAIN, "card-plant_care_status")
    assert status_id is not None
    status = hass.states.get(status_id)
    assert status is not None
    related = status.attributes["related_entities"]

    assert status.attributes["plant_name"] == "Card Plant"
    assert set(related) == {
        "last_watered",
        "next_watering",
        "days_since_watered",
        *Measurement,
    }
    assert related["moisture"] == registry.async_get_entity_id(
        "sensor", DOMAIN, "card-plant_moisture"
    )


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


async def test_invalid_moisture_readings_are_unavailable(hass) -> None:
    """Invalid percentages cannot suppress or trigger watering."""
    entry = make_entry("fern", "Fern")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    registry = er.async_get(hass)
    status = registry.async_get_entity_id("sensor", DOMAIN, "fern_care_status")
    proxy = registry.async_get_entity_id("sensor", DOMAIN, "fern_moisture")
    assert status is not None
    assert proxy is not None
    source = "sensor.fern_moisture_source"
    hass.states.async_set(source, "45", {"unit_of_measurement": "%"})
    await hass.services.async_call(
        DOMAIN,
        SERVICE_ASSIGN_SENSOR,
        {
            ATTR_ENTITY_ID: [status],
            ATTR_MEASUREMENT: Measurement.MOISTURE,
            ATTR_SOURCE_ENTITY_ID: source,
        },
        blocking=True,
    )
    manager: PlantCareManager = hass.data[DOMAIN]
    for value in ("nan", "inf", "-1", "101"):
        hass.states.async_set(source, value, {"unit_of_measurement": "%"})
        await hass.async_block_till_done()
        assert manager.coordinators["fern"].data.moisture is None
        assert hass.states.get(proxy).state == STATE_UNAVAILABLE
        assert not hass.states.get(status).attributes["sensor_assignments"]["moisture"][
            "available"
        ]
    hass.states.async_set(source, "0", {"unit_of_measurement": "%"})
    await hass.async_block_till_done()
    assert manager.coordinators["fern"].data.needs_water


async def test_future_care_event_is_rejected_before_writing_history(hass) -> None:
    """Future manual timestamps cannot postpone today's schedule."""
    entry = make_entry("fern", "Fern")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    status = er.async_get(hass).async_get_entity_id(
        "sensor", DOMAIN, "fern_care_status"
    )
    assert status is not None
    with pytest.raises(ServiceValidationError, match="future"):
        await hass.services.async_call(
            DOMAIN,
            SERVICE_WATER,
            {
                ATTR_ENTITY_ID: [status],
                ATTR_TIMESTAMP: dt_util.utcnow() + timedelta(days=1),
            },
            blocking=True,
        )
    manager: PlantCareManager = hass.data[DOMAIN]
    assert manager.store.events_for("fern") == []


async def test_assign_rejects_multiple_plants_before_moving_sensor(hass) -> None:
    """An exclusive assignment must have a single distinct destination."""
    for name in ("fern", "basil"):
        entry = make_entry(name, name)
        entry.add_to_hass(hass)
        assert await hass.config_entries.async_setup(entry.entry_id)
    registry = er.async_get(hass)
    targets = [
        registry.async_get_entity_id("sensor", DOMAIN, f"{name}_care_status")
        for name in ("fern", "basil")
    ]
    hass.states.async_set("sensor.probe", "25", {"unit_of_measurement": "%"})
    with pytest.raises(ServiceValidationError, match="one plant"):
        await hass.services.async_call(
            DOMAIN,
            SERVICE_ASSIGN_SENSOR,
            {
                ATTR_ENTITY_ID: targets,
                ATTR_MEASUREMENT: Measurement.MOISTURE,
                ATTR_SOURCE_ENTITY_ID: "sensor.probe",
            },
            blocking=True,
        )
    manager: PlantCareManager = hass.data[DOMAIN]
    assert not list(manager.store.plant_ids_with_assignments())


async def test_failed_setup_releases_active_coordinator(hass) -> None:
    """An exception during startup must not leave a stale active plant."""
    assert await async_setup(hass, {})
    entry = make_entry("fern", "Fern")
    entry.add_to_hass(hass)
    with (
        patch.object(
            PlantCoordinator, "async_start", side_effect=RuntimeError("failed")
        ),
        patch.object(PlantCoordinator, "async_stop", autospec=True) as stop,
        pytest.raises(RuntimeError, match="failed"),
    ):
        await async_setup_entry(hass, entry)
    manager: PlantCareManager = hass.data[DOMAIN]
    assert "fern" not in manager.coordinators
    stop.assert_awaited_once()


async def test_ambient_source_uses_healthy_backup(hass) -> None:
    """An unavailable candidate must not mask a usable sensor in the same area."""
    area = ar.async_get(hass).async_create("Greenhouse")
    registry = er.async_get(hass)
    for name, value in (
        ("first_temperature", STATE_UNAVAILABLE),
        ("second_temperature", "24"),
    ):
        source = registry.async_get_or_create(
            "sensor",
            "test",
            name,
            suggested_object_id=name,
            original_device_class=SensorDeviceClass.TEMPERATURE,
        )
        registry.async_update_entity(source.entity_id, area_id=area.id)
        hass.states.async_set(source.entity_id, value, {"unit_of_measurement": "°C"})
    entry = make_entry("fern", "Fern", area.id)
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    proxy = registry.async_get_entity_id("sensor", DOMAIN, "fern_temperature")
    assert proxy is not None
    assert hass.states.get(proxy).state == "24.0"


async def test_periodic_refresh_subscribes_to_new_ambient_source(hass) -> None:
    """A source discovered after startup must get immediate state tracking."""
    area = ar.async_get(hass).async_create("Greenhouse")
    entry = make_entry("fern", "Fern", area.id)
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    registry = er.async_get(hass)
    source = registry.async_get_or_create(
        "sensor",
        "test",
        "late_temperature",
        original_device_class=SensorDeviceClass.TEMPERATURE,
    )
    registry.async_update_entity(source.entity_id, area_id=area.id)
    hass.states.async_set(source.entity_id, "24", {"unit_of_measurement": "°C"})
    manager: PlantCareManager = hass.data[DOMAIN]
    await manager.coordinators["fern"].async_refresh()
    hass.states.async_set(source.entity_id, "26", {"unit_of_measurement": "°C"})
    await hass.async_block_till_done()
    proxy = registry.async_get_entity_id("sensor", DOMAIN, "fern_temperature")
    assert proxy is not None
    assert hass.states.get(proxy).state == "26.0"
