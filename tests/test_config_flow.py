"""Tests for plant creation and care-profile validation."""

from unittest.mock import patch

from homeassistant import config_entries
from homeassistant.const import CONF_NAME
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import entity_registry as er
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.plant_care_plus.const import (
    CONF_AREA_ID,
    CONF_LINKED_PLANT_ENTITY,
    CONF_MOISTURE_MINIMUM,
    CONF_MOISTURE_TARGET,
    CONF_PLANT_ID,
    CONF_WATERING_INTERVAL,
    DOMAIN,
)


async def test_create_sensorless_plant(hass) -> None:
    """A plant can be created without any source sensor."""
    with patch(
        "custom_components.plant_care_plus.async_setup_entry", return_value=True
    ):
        result = await hass.config_entries.flow.async_init(
            DOMAIN, context={"source": config_entries.SOURCE_USER}
        )
        assert result["step_id"] == "user"
        first_field = next(iter(result["data_schema"].schema))
        assert first_field.schema == CONF_LINKED_PLANT_ENTITY

        result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
        assert result["step_id"] == "profile"
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"],
            {
                CONF_NAME: "ZZ Plant",
                CONF_AREA_ID: "living_room",
                CONF_WATERING_INTERVAL: 18,
                CONF_MOISTURE_MINIMUM: 20,
                CONF_MOISTURE_TARGET: 35,
            },
        )

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["data"][CONF_PLANT_ID]
    assert "sensor" not in result["data"]
    assert "common_name" not in result["data"]
    assert "scientific_name" not in result["data"]
    assert "location_type" not in result["data"]


async def test_linked_plant_prefills_name_and_area(hass) -> None:
    """Selecting an existing plant prefills the profile on the next step."""
    area = ar.async_get(hass).async_create("Living room")
    registry = er.async_get(hass)
    plant = registry.async_get_or_create(
        "plant", "test", "monstera", suggested_object_id="monstera"
    )
    registry.async_update_entity(plant.entity_id, area_id=area.id)
    hass.states.async_set(
        plant.entity_id,
        "ok",
        {
            "friendly_name": "Window Monstera",
            "sensors": {"moisture": "sensor.monstera_moisture"},
        },
    )

    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_LINKED_PLANT_ENTITY: plant.entity_id}
    )

    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "profile"
    defaults = result["data_schema"]({})
    assert defaults[CONF_NAME] == "Window Monstera"
    assert defaults[CONF_AREA_ID] == area.id

    result = await hass.config_entries.flow.async_configure(result["flow_id"], defaults)
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["data"][CONF_LINKED_PLANT_ENTITY] == plant.entity_id
    assert result["data"][CONF_NAME] == "Window Monstera"
    assert result["data"][CONF_AREA_ID] == area.id


async def test_rejects_invalid_moisture_range(hass) -> None:
    """The user target must remain above the low threshold."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {
            CONF_NAME: "ZZ Plant",
            CONF_AREA_ID: "living_room",
            CONF_WATERING_INTERVAL: 18,
            CONF_MOISTURE_MINIMUM: 40,
            CONF_MOISTURE_TARGET: 35,
        },
    )

    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {CONF_MOISTURE_TARGET: "target_not_above_minimum"}


async def test_options_link_change_prefills_name_and_area(hass) -> None:
    """Linking a plant while editing refreshes the editable profile defaults."""
    area = ar.async_get(hass).async_create("Office")
    registry = er.async_get(hass)
    plant = registry.async_get_or_create(
        "plant", "test", "office_fern", suggested_object_id="office_fern"
    )
    registry.async_update_entity(plant.entity_id, area_id=area.id)
    hass.states.async_set(
        plant.entity_id, "ok", {"friendly_name": "Office Fern", "sensors": {}}
    )
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Old name",
        data={
            CONF_PLANT_ID: "office-fern",
            CONF_NAME: "Old name",
            CONF_AREA_ID: "old_area",
            CONF_WATERING_INTERVAL: 14,
            CONF_MOISTURE_MINIMUM: 20,
            CONF_MOISTURE_TARGET: 35,
        },
    )
    entry.add_to_hass(hass)

    result = await hass.config_entries.options.async_init(entry.entry_id)
    assert result["step_id"] == "init"
    first_field = next(iter(result["data_schema"].schema))
    assert first_field.schema == CONF_LINKED_PLANT_ENTITY

    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {CONF_LINKED_PLANT_ENTITY: plant.entity_id}
    )
    assert result["step_id"] == "profile"
    defaults = result["data_schema"]({})
    assert defaults[CONF_NAME] == "Office Fern"
    assert defaults[CONF_AREA_ID] == area.id

    result = await hass.config_entries.options.async_configure(
        result["flow_id"], defaults
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert entry.options[CONF_LINKED_PLANT_ENTITY] == plant.entity_id
    assert entry.options[CONF_AREA_ID] == area.id
