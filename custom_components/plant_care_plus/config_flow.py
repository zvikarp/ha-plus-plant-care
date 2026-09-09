"""Config and options flows for HA Plus Plant Care."""

from __future__ import annotations

from typing import Any
from uuid import uuid4

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.const import CONF_NAME
from homeassistant.helpers import selector

from .const import (
    CONF_AREA_ID,
    CONF_LINKED_PLANT_ENTITY,
    CONF_MOISTURE_MINIMUM,
    CONF_MOISTURE_TARGET,
    CONF_OPENPLANTBOOK_ID,
    CONF_PLANT_ID,
    CONF_WATERING_INTERVAL,
    DEFAULT_MOISTURE_MINIMUM,
    DEFAULT_MOISTURE_TARGET,
    DEFAULT_WATERING_INTERVAL,
    DOMAIN,
)
from .sources import linked_plant_defaults


def _linked_plant_schema(linked_plant_entity: str | None) -> vol.Schema:
    """Return the first-step selector for an existing HA plant."""
    description = (
        {"suggested_value": linked_plant_entity} if linked_plant_entity else None
    )
    marker = vol.Optional(CONF_LINKED_PLANT_ENTITY, description=description)
    return vol.Schema(
        {marker: selector.EntitySelector(selector.EntitySelectorConfig(domain="plant"))}
    )


def _profile_schema(defaults: dict[str, Any]) -> vol.Schema:
    """Return the plant profile form shared by setup and editing."""
    area_id = defaults.get(CONF_AREA_ID)
    area_marker = (
        vol.Required(CONF_AREA_ID, default=area_id)
        if area_id
        else vol.Required(CONF_AREA_ID)
    )
    return vol.Schema(
        {
            vol.Required(CONF_NAME, default=defaults.get(CONF_NAME, "")): str,
            vol.Optional(
                CONF_OPENPLANTBOOK_ID,
                default=defaults.get(CONF_OPENPLANTBOOK_ID, ""),
            ): str,
            area_marker: selector.AreaSelector(),
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

    def __init__(self) -> None:
        """Initialize setup state shared across the two steps."""
        self._linked_plant_entity: str | None = None
        self._profile_defaults: dict[str, Any] = {}

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> config_entries.ConfigFlowResult:
        """Optionally choose an existing Home Assistant plant first."""
        errors: dict[str, str] = {}
        if user_input is not None:
            linked_plant_entity = user_input.get(CONF_LINKED_PLANT_ENTITY)
            if (
                linked_plant_entity is not None
                and self.hass.states.get(linked_plant_entity) is None
            ):
                errors[CONF_LINKED_PLANT_ENTITY] = "linked_plant_not_found"
            else:
                self._linked_plant_entity = linked_plant_entity
                self._profile_defaults = (
                    linked_plant_defaults(self.hass, linked_plant_entity)
                    if linked_plant_entity
                    else {}
                )
                return await self.async_step_profile()
        return self.async_show_form(
            step_id="user",
            data_schema=_linked_plant_schema(
                (user_input or {}).get(CONF_LINKED_PLANT_ENTITY)
            ),
            errors=errors,
        )

    async def async_step_profile(
        self, user_input: dict[str, Any] | None = None
    ) -> config_entries.ConfigFlowResult:
        """Create one plant from its area-based care profile."""
        errors: dict[str, str] = {}
        if user_input is not None:
            errors = _validate_profile(user_input)
            if not errors:
                plant_id = str(uuid4())
                await self.async_set_unique_id(plant_id)
                data = {**user_input, CONF_PLANT_ID: plant_id}
                if self._linked_plant_entity is not None:
                    data[CONF_LINKED_PLANT_ENTITY] = self._linked_plant_entity
                return self.async_create_entry(title=user_input[CONF_NAME], data=data)
        return self.async_show_form(
            step_id="profile",
            data_schema=_profile_schema(user_input or self._profile_defaults),
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
        self._linked_plant_entity: str | None = None
        self._profile_defaults: dict[str, Any] = {}

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> config_entries.ConfigFlowResult:
        """Choose the optional linked Home Assistant plant first."""
        errors: dict[str, str] = {}
        if user_input is not None:
            linked_plant_entity = user_input.get(CONF_LINKED_PLANT_ENTITY)
            if (
                linked_plant_entity is not None
                and self.hass.states.get(linked_plant_entity) is None
            ):
                errors[CONF_LINKED_PLANT_ENTITY] = "linked_plant_not_found"
            else:
                defaults = {**self._entry.data, **self._entry.options}
                previous_link = defaults.get(CONF_LINKED_PLANT_ENTITY) or None
                if linked_plant_entity and linked_plant_entity != previous_link:
                    defaults.update(
                        linked_plant_defaults(self.hass, linked_plant_entity)
                    )
                self._linked_plant_entity = linked_plant_entity
                self._profile_defaults = defaults
                return await self.async_step_profile()
        defaults = {**self._entry.data, **self._entry.options}
        return self.async_show_form(
            step_id="init",
            data_schema=_linked_plant_schema(
                (user_input or defaults).get(CONF_LINKED_PLANT_ENTITY) or None
            ),
            errors=errors,
        )

    async def async_step_profile(
        self, user_input: dict[str, Any] | None = None
    ) -> config_entries.ConfigFlowResult:
        """Edit area-based plant and care profile values."""
        errors: dict[str, str] = {}
        if user_input is not None:
            errors = _validate_profile(user_input)
            if not errors:
                self.hass.config_entries.async_update_entry(
                    self._entry, title=user_input[CONF_NAME]
                )
                return self.async_create_entry(
                    title="",
                    data={
                        **user_input,
                        CONF_LINKED_PLANT_ENTITY: self._linked_plant_entity or "",
                    },
                )
        return self.async_show_form(
            step_id="profile",
            data_schema=_profile_schema(user_input or self._profile_defaults),
            errors=errors,
        )
