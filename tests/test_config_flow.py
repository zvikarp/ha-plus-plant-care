"""Tests for plant creation and care-profile validation."""

from unittest.mock import patch

from homeassistant import config_entries
from homeassistant.const import CONF_NAME
from homeassistant.data_entry_flow import FlowResultType

from custom_components.plant_care_plus.const import (
    CONF_LOCATION_TYPE,
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
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"],
            {
                CONF_NAME: "ZZ Plant",
                CONF_LOCATION_TYPE: "indoor",
                CONF_WATERING_INTERVAL: 18,
                CONF_MOISTURE_MINIMUM: 20,
                CONF_MOISTURE_TARGET: 35,
            },
        )

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["data"][CONF_PLANT_ID]
    assert "sensor" not in result["data"]


async def test_rejects_invalid_moisture_range(hass) -> None:
    """The user target must remain above the low threshold."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {
            CONF_NAME: "ZZ Plant",
            CONF_LOCATION_TYPE: "indoor",
            CONF_WATERING_INTERVAL: 18,
            CONF_MOISTURE_MINIMUM: 40,
            CONF_MOISTURE_TARGET: 35,
        },
    )

    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {CONF_MOISTURE_TARGET: "target_not_above_minimum"}
