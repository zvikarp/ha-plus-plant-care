"""Config and options flows for HA Plus Plant Care."""

from __future__ import annotations

from typing import Any
from uuid import uuid4

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.const import CONF_NAME
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import selector

from .const import (
    CONF_AREA_ID,
    CONF_IMPORT_PLANT_MONITOR,
    CONF_LINKED_PLANT_ENTITY,
    CONF_MOISTURE_MINIMUM,
    CONF_MOISTURE_TARGET,
    CONF_OPENPLANTBOOK_ID,
    CONF_PLANT_ID,
    CONF_PLANT_MONITOR_ENTRY_ID,
    CONF_WATERING_INTERVAL,
    DEFAULT_MOISTURE_MINIMUM,
    DEFAULT_MOISTURE_TARGET,
    DEFAULT_WATERING_INTERVAL,
    DOMAIN,
)
from .sources import linked_plant_defaults

PLANT_MONITOR_DOMAIN = "plant"


def _linked_plant_schema(
    linked_plant_entity: str | None, *, include_bulk_import: bool = False
) -> vol.Schema:
    """Return the first-step selector for an existing HA plant."""
    description = (
        {"suggested_value": linked_plant_entity} if linked_plant_entity else None
    )
    marker = vol.Optional(CONF_LINKED_PLANT_ENTITY, description=description)
    schema: dict[vol.Marker, Any] = {
        marker: selector.EntitySelector(
            selector.EntitySelectorConfig(domain=PLANT_MONITOR_DOMAIN)
        )
    }
    if include_bulk_import:
        schema[vol.Optional(CONF_IMPORT_PLANT_MONITOR, default=False)] = bool
    return vol.Schema(schema)


def _plant_monitor_entities(hass: HomeAssistant) -> list[tuple[str, str, str]]:
    """Return Plant Monitor entry IDs, entity IDs, and fallback names."""
    registry = er.async_get(hass)
    plants: list[tuple[str, str, str]] = []
    for entry in hass.config_entries.async_entries(PLANT_MONITOR_DOMAIN):
        entities = sorted(
            (
                entity
                for entity in er.async_entries_for_config_entry(
                    registry, entry.entry_id
                )
                if entity.domain == PLANT_MONITOR_DOMAIN
                and entity.platform == PLANT_MONITOR_DOMAIN
            ),
            key=lambda entity: entity.entity_id,
        )
        if entities:
            plants.append((entry.entry_id, entities[0].entity_id, entry.title))
    return plants


def _existing_plant_monitor_links(
    hass: HomeAssistant,
) -> tuple[set[str], set[str]]:
    """Return linked Plant Monitor entry IDs and entity IDs already configured."""
    registry = er.async_get(hass)
    source_entry_ids: set[str] = set()
    entity_ids: set[str] = set()
    for entry in hass.config_entries.async_entries(DOMAIN):
        values = {**entry.data, **entry.options}
        if source_entry_id := values.get(CONF_PLANT_MONITOR_ENTRY_ID):
            source_entry_ids.add(source_entry_id)
        if linked_entity_id := values.get(CONF_LINKED_PLANT_ENTITY):
            entity_ids.add(linked_entity_id)
            if (
                (registry_entry := registry.async_get(linked_entity_id))
                and registry_entry.config_entry_id
            ):
                source_entry_ids.add(registry_entry.config_entry_id)
    return source_entry_ids, entity_ids


def _plant_monitor_entry_id(hass: HomeAssistant, entity_id: str) -> str | None:
    """Return the Plant Monitor config entry that owns a plant entity."""
    registry_entry = er.async_get(hass).async_get(entity_id)
    if registry_entry is None or registry_entry.config_entry_id is None:
        return None
    source_entry = hass.config_entries.async_get_entry(registry_entry.config_entry_id)
    if source_entry is None or source_entry.domain != PLANT_MONITOR_DOMAIN:
        return None
    return source_entry.entry_id


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
            if user_input.get(CONF_IMPORT_PLANT_MONITOR):
                return await self._async_import_plant_monitor()
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
                (user_input or {}).get(CONF_LINKED_PLANT_ENTITY),
                include_bulk_import=True,
            ),
            errors=errors,
        )

    async def _async_import_plant_monitor(self) -> config_entries.ConfigFlowResult:
        """Create one HA Plus entry for every unlinked Plant Monitor plant."""
        source_entry_ids, linked_entity_ids = _existing_plant_monitor_links(self.hass)
        plants = _plant_monitor_entities(self.hass)
        if not plants:
            return self.async_abort(reason="no_plant_monitor_plants")

        imported = 0
        skipped = 0
        for source_entry_id, entity_id, fallback_name in plants:
            if source_entry_id in source_entry_ids or entity_id in linked_entity_ids:
                skipped += 1
                continue
            defaults = linked_plant_defaults(self.hass, entity_id)
            result = await self.hass.config_entries.flow.async_init(
                DOMAIN,
                context={"source": config_entries.SOURCE_IMPORT},
                data={
                    **defaults,
                    CONF_NAME: defaults.get(CONF_NAME, fallback_name),
                    CONF_LINKED_PLANT_ENTITY: entity_id,
                    CONF_PLANT_MONITOR_ENTRY_ID: source_entry_id,
                },
            )
            if result["type"] is FlowResultType.CREATE_ENTRY:
                imported += 1
            else:
                skipped += 1

        if imported == 0:
            return self.async_abort(reason="no_new_plant_monitor_plants")
        return self.async_abort(
            reason="plant_monitor_import_complete",
            description_placeholders={
                "imported": str(imported),
                "skipped": str(skipped),
            },
        )

    async def async_step_import(
        self, import_input: dict[str, Any]
    ) -> config_entries.ConfigFlowResult:
        """Import one Plant Monitor plant through Home Assistant's flow API."""
        source_entry_id = import_input[CONF_PLANT_MONITOR_ENTRY_ID]
        await self.async_set_unique_id(f"plant-monitor:{source_entry_id}")
        self._abort_if_unique_id_configured()
        plant_id = str(uuid4())
        return self.async_create_entry(
            title=import_input[CONF_NAME],
            data={
                **import_input,
                CONF_PLANT_ID: plant_id,
                CONF_WATERING_INTERVAL: DEFAULT_WATERING_INTERVAL,
                CONF_MOISTURE_MINIMUM: DEFAULT_MOISTURE_MINIMUM,
                CONF_MOISTURE_TARGET: DEFAULT_MOISTURE_TARGET,
            },
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
                    if source_entry_id := _plant_monitor_entry_id(
                        self.hass, self._linked_plant_entity
                    ):
                        data[CONF_PLANT_MONITOR_ENTRY_ID] = source_entry_id
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
                        CONF_PLANT_MONITOR_ENTRY_ID: (
                            _plant_monitor_entry_id(
                                self.hass, self._linked_plant_entity
                            )
                            if self._linked_plant_entity
                            else ""
                        ),
                    },
                )
        return self.async_show_form(
            step_id="profile",
            data_schema=_profile_schema(user_input or self._profile_defaults),
            errors=errors,
        )
