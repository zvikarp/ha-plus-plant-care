"""Config and options flows for Plant Care Plus."""

from __future__ import annotations

from typing import Any
from uuid import uuid4

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.const import CONF_NAME
from homeassistant.helpers import selector

from .const import (
    CONF_AREA_ID,
    CONF_COMMON_NAME,
    CONF_LINKED_PLANT_ENTITY,
    CONF_LOCATION_TYPE,
    CONF_MOISTURE_MINIMUM,
    CONF_MOISTURE_TARGET,
    CONF_OPENPLANTBOOK_ID,
    CONF_PLANT_ID,
    CONF_SCIENTIFIC_NAME,
    CONF_WATERING_INTERVAL,
    DEFAULT_MOISTURE_MINIMUM,
    DEFAULT_MOISTURE_TARGET,
    DEFAULT_WATERING_INTERVAL,
    DOMAIN,
    LocationType,
)


def _plant_schema(defaults: dict[str, Any]) -> vol.Schema:
    """Return the plant form shared by setup and editing."""
    return vol.Schema(
        {
            vol.Required(CONF_NAME, default=defaults.get(CONF_NAME, "")): str,
            vol.Optional(
                CONF_COMMON_NAME, default=defaults.get(CONF_COMMON_NAME, "")
            ): str,
            vol.Optional(
                CONF_SCIENTIFIC_NAME,
                default=defaults.get(CONF_SCIENTIFIC_NAME, ""),
            ): str,
            vol.Optional(
                CONF_OPENPLANTBOOK_ID,
                default=defaults.get(CONF_OPENPLANTBOOK_ID, ""),
            ): str,
            vol.Required(
                CONF_LOCATION_TYPE,
                default=defaults.get(CONF_LOCATION_TYPE, LocationType.INDOOR),
            ): selector.SelectSelector(
                selector.SelectSelectorConfig(
                    options=[item.value for item in LocationType],
                    translation_key="location_type",
                    mode=selector.SelectSelectorMode.DROPDOWN,
                )
            ),
            vol.Optional(
                CONF_AREA_ID,
                description={"suggested_value": defaults.get(CONF_AREA_ID)},
            ): selector.AreaSelector(),
            vol.Optional(
                CONF_LINKED_PLANT_ENTITY,
                description={"suggested_value": defaults.get(CONF_LINKED_PLANT_ENTITY)},
            ): selector.EntitySelector(selector.EntitySelectorConfig(domain="plant")),
            vol.Required(
                CONF_WATERING_INTERVAL,
                default=defaults.get(CONF_WATERING_INTERVAL, DEFAULT_WATERING_INTERVAL),
            ): selector.NumberSelector(
                selector.NumberSelectorConfig(
                    min=1,
                    max=365,
                    step=1,
                    mode=selector.NumberSelectorMode.BOX,
                )
            ),
            vol.Required(
                CONF_MOISTURE_MINIMUM,
                default=defaults.get(CONF_MOISTURE_MINIMUM, DEFAULT_MOISTURE_MINIMUM),
            ): selector.NumberSelector(
                selector.NumberSelectorConfig(
                    min=0,
                    max=100,
                    step=1,
                    unit_of_measurement="%",
                    mode=selector.NumberSelectorMode.BOX,
                )
            ),
            vol.Required(
                CONF_MOISTURE_TARGET,
                default=defaults.get(CONF_MOISTURE_TARGET, DEFAULT_MOISTURE_TARGET),
            ): selector.NumberSelector(
                selector.NumberSelectorConfig(
                    min=0,
                    max=100,
                    step=1,
                    unit_of_measurement="%",
                    mode=selector.NumberSelectorMode.BOX,
                )
            ),
        }
    )


def _validate_profile(values: dict[str, Any]) -> dict[str, str]:
    """Validate invariants that cannot be expressed by individual selectors."""
    if values[CONF_MOISTURE_TARGET] <= values[CONF_MOISTURE_MINIMUM]:
        return {CONF_MOISTURE_TARGET: "target_not_above_minimum"}
    return {}


class PlantCarePlusConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Create permanent plants independently from sensors."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> config_entries.ConfigFlowResult:
        """Create one plant config entry."""
        errors: dict[str, str] = {}
        if user_input is not None:
            errors = _validate_profile(user_input)
            if not errors:
                plant_id = str(uuid4())
                await self.async_set_unique_id(plant_id)
                return self.async_create_entry(
                    title=user_input[CONF_NAME],
                    data={**user_input, CONF_PLANT_ID: plant_id},
                )
        return self.async_show_form(
            step_id="user",
            data_schema=_plant_schema(user_input or {}),
            errors=errors,
        )

    @staticmethod
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> PlantOptionsFlow:
        """Return the plant care profile editor."""
        return PlantOptionsFlow(config_entry)


class PlantOptionsFlow(config_entries.OptionsFlow):
    """Edit a plant without changing its identity or history."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        """Initialize options."""
        self._entry = config_entry

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> config_entries.ConfigFlowResult:
        """Edit user-owned plant and care profile values."""
        errors: dict[str, str] = {}
        if user_input is not None:
            errors = _validate_profile(user_input)
            if not errors:
                self.hass.config_entries.async_update_entry(
                    self._entry, title=user_input[CONF_NAME]
                )
                return self.async_create_entry(title="", data=user_input)
        defaults = {**self._entry.data, **self._entry.options}
        return self.async_show_form(
            step_id="init",
            data_schema=_plant_schema(user_input or defaults),
            errors=errors,
        )
