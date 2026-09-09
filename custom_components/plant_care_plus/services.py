"""Home Assistant actions for HA Plus Plant Care."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from datetime import datetime
from typing import TYPE_CHECKING, Any

import voluptuous as vol
from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import (
    HomeAssistant,
    ServiceCall,
    ServiceValidationError,
    callback,
)
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util

from .const import (
    ATTR_HOURS,
    ATTR_MEASUREMENT,
    ATTR_SOURCE_ENTITY_ID,
    ATTR_TIMESTAMP,
    DOMAIN,
    SERVICE_ASSIGN_SENSOR,
    SERVICE_FERTILIZE,
    SERVICE_REPOT,
    SERVICE_SNOOZE,
    SERVICE_UNASSIGN_SENSOR,
    SERVICE_WATER,
    CareEventType,
    Measurement,
)

if TYPE_CHECKING:
    from .coordinator import PlantCareManager, PlantCoordinator

TARGET_SCHEMA = vol.Schema({vol.Required(ATTR_ENTITY_ID): cv.comp_entity_ids})
CARE_SCHEMA = TARGET_SCHEMA.extend({vol.Optional(ATTR_TIMESTAMP): cv.datetime})
ASSIGN_SCHEMA = TARGET_SCHEMA.extend(
    {
        vol.Required(ATTR_MEASUREMENT): vol.Coerce(Measurement),
        vol.Required(ATTR_SOURCE_ENTITY_ID): cv.entity_domain("sensor"),
    }
)
UNASSIGN_SCHEMA = TARGET_SCHEMA.extend(
    {vol.Required(ATTR_MEASUREMENT): vol.Coerce(Measurement)}
)
SNOOZE_SCHEMA = TARGET_SCHEMA.extend(
    {
        vol.Optional(ATTR_HOURS, default=24): vol.All(
            vol.Coerce(int), vol.Range(min=1, max=720)
        )
    }
)


@callback
def _coordinators_for_call(
    hass: HomeAssistant,
    manager: PlantCareManager,
    call: ServiceCall,
) -> list[PlantCoordinator]:
    """Resolve action targets through HA's entity registry."""
    registry = er.async_get(hass)
    coordinators: dict[str, PlantCoordinator] = {}
    for entity_id in call.data[ATTR_ENTITY_ID]:
        entity = registry.async_get(entity_id)
        if (
            entity is None
            or entity.platform != DOMAIN
            or entity.config_entry_id is None
        ):
            msg = f"{entity_id} is not an HA Plus Plant Care entity"
            raise ServiceValidationError(msg)
        coordinator = next(
            (
                item
                for item in manager.coordinators.values()
                if item.entry.entry_id == entity.config_entry_id
            ),
            None,
        )
        if coordinator is None:
            msg = f"Plant for {entity_id} is not loaded"
            raise ServiceValidationError(msg)
        coordinators[coordinator.plant.plant_id] = coordinator
    return list(coordinators.values())


def async_register_services(hass: HomeAssistant, manager: PlantCareManager) -> None:
    """Register all user-facing actions once."""

    def care_handler(
        event_type: CareEventType,
    ) -> Callable[[ServiceCall], Awaitable[None]]:
        async def handle(call: ServiceCall) -> None:
            timestamp: datetime | None = call.data.get(ATTR_TIMESTAMP)
            if timestamp is not None and timestamp.tzinfo is None:
                timezone = dt_util.get_time_zone(hass.config.time_zone)
                if timezone is None:
                    msg = f"Unknown Home Assistant time zone: {hass.config.time_zone}"
                    raise ServiceValidationError(msg)
                timestamp = timestamp.replace(tzinfo=timezone)
            for coordinator in _coordinators_for_call(hass, manager, call):
                await coordinator.async_record_care(event_type, timestamp)

        return handle

    async def handle_assign(call: ServiceCall) -> None:
        source_entity_id = call.data[ATTR_SOURCE_ENTITY_ID]
        registry_entry = er.async_get(hass).async_get(source_entity_id)
        if registry_entry is None and hass.states.get(source_entity_id) is None:
            msg = f"Source sensor {source_entity_id} does not exist"
            raise ServiceValidationError(msg)
        if registry_entry is not None and registry_entry.platform == DOMAIN:
            msg = "An HA Plus Plant Care proxy cannot be used as a source sensor"
            raise ServiceValidationError(msg)
        coordinators = _coordinators_for_call(hass, manager, call)
        for coordinator in coordinators:
            affected = await manager.store.async_assign(
                coordinator.plant.plant_id,
                call.data[ATTR_MEASUREMENT],
                source_entity_id,
            )
            await manager.async_refresh(affected)

    async def handle_unassign(call: ServiceCall) -> None:
        for coordinator in _coordinators_for_call(hass, manager, call):
            affected = await manager.store.async_unassign(
                coordinator.plant.plant_id, call.data[ATTR_MEASUREMENT]
            )
            await manager.async_refresh(affected)

    async def handle_snooze(call: ServiceCall) -> None:
        for coordinator in _coordinators_for_call(hass, manager, call):
            await coordinator.async_snooze(call.data[ATTR_HOURS])

    services: tuple[tuple[str, Callable[..., Any], vol.Schema], ...] = (
        (SERVICE_WATER, care_handler(CareEventType.WATERED), CARE_SCHEMA),
        (SERVICE_FERTILIZE, care_handler(CareEventType.FERTILIZED), CARE_SCHEMA),
        (SERVICE_REPOT, care_handler(CareEventType.REPOTTED), CARE_SCHEMA),
        (SERVICE_ASSIGN_SENSOR, handle_assign, ASSIGN_SCHEMA),
        (SERVICE_UNASSIGN_SENSOR, handle_unassign, UNASSIGN_SCHEMA),
        (SERVICE_SNOOZE, handle_snooze, SNOOZE_SCHEMA),
    )
    for name, handler, schema in services:
        hass.services.async_register(DOMAIN, name, handler, schema=schema)
