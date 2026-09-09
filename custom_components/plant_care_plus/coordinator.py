"""Runtime coordination for each plant."""

from __future__ import annotations

import logging
from datetime import timedelta
from typing import TYPE_CHECKING, Any

from homeassistant.const import (
    ATTR_UNIT_OF_MEASUREMENT,
    PERCENTAGE,
    STATE_UNAVAILABLE,
    STATE_UNKNOWN,
)
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers.event import (
    EventStateChangedData,
    async_track_state_change_event,
)
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator
from homeassistant.util import dt as dt_util

from .care import calculate_care
from .const import DOMAIN, UPDATE_INTERVAL, CareEventType, Measurement
from .models import CareDecision, PlantConfig
from .storage import PlantCareStore

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry

_LOGGER = logging.getLogger(__name__)


class PlantCoordinator(DataUpdateCoordinator[CareDecision]):
    """Observe assigned HA entities and calculate a plant's care state."""

    def __init__(
        self,
        hass: HomeAssistant,
        entry: ConfigEntry,
        plant: PlantConfig,
        store: PlantCareStore,
    ) -> None:
        """Initialize the coordinator."""
        super().__init__(
            hass,
            logger=_LOGGER,
            name=f"{DOMAIN}_{plant.plant_id}",
            update_interval=UPDATE_INTERVAL,
        )
        self.entry = entry
        self.plant = plant
        self.store = store
        self._remove_state_listener: Any = None

    async def async_start(self) -> None:
        """Begin tracking assigned entities and perform the first calculation."""
        self._subscribe_to_assignments()
        await self.async_config_entry_first_refresh()

    @callback
    def _subscribe_to_assignments(self) -> None:
        """Track assignment state changes without owning source sensors."""
        if self._remove_state_listener is not None:
            self._remove_state_listener()
        entity_ids = {
            item.entity_id
            for item in self.store.assignments_for(self.plant.plant_id).values()
        }
        self._remove_state_listener = (
            async_track_state_change_event(
                self.hass, entity_ids, self._async_source_state_changed
            )
            if entity_ids
            else None
        )

    @callback
    def _async_source_state_changed(self, _event: Event[EventStateChangedData]) -> None:
        """Recalculate immediately when a source sensor changes."""
        self.async_set_updated_data(self._calculate())

    def assignments_changed(self) -> None:
        """Resubscribe after a sensor is assigned, removed, or moved."""
        self._subscribe_to_assignments()

    async def _async_update_data(self) -> CareDecision:
        """Calculate current care state."""
        return self._calculate()

    def _calculate(self) -> CareDecision:
        assignments = self.store.assignments_for(self.plant.plant_id)
        moisture_assignment = assignments.get(Measurement.MOISTURE)
        moisture = None
        if moisture_assignment is not None:
            state = self.hass.states.get(moisture_assignment.entity_id)
            if (
                state is not None
                and state.state
                not in {
                    STATE_UNKNOWN,
                    STATE_UNAVAILABLE,
                }
                and state.attributes.get(ATTR_UNIT_OF_MEASUREMENT) == PERCENTAGE
            ):
                try:
                    moisture = float(state.state)
                except (TypeError, ValueError):
                    moisture = None

        last_watered = self.store.last_event(self.plant.plant_id, CareEventType.WATERED)
        return calculate_care(
            self.plant,
            now=dt_util.utcnow(),
            last_watered=last_watered.timestamp if last_watered else None,
            moisture=moisture,
            moisture_assigned=moisture_assignment is not None,
            snoozed_until=self.store.snoozed_until(self.plant.plant_id),
        )

    async def async_record_care(
        self, event_type: CareEventType, timestamp: Any = None
    ) -> None:
        """Record one care action and publish its new state."""
        await self.store.async_record_event(
            self.plant.plant_id, event_type, timestamp=timestamp
        )
        if event_type == CareEventType.WATERED:
            await self.store.async_set_snooze(self.plant.plant_id, None)
        await self.async_request_refresh()

    async def async_snooze(self, hours: int) -> None:
        """Temporarily suppress attention and watering booleans."""
        await self.store.async_set_snooze(
            self.plant.plant_id, dt_util.utcnow() + timedelta(hours=hours)
        )
        await self.async_request_refresh()

    async def async_stop(self) -> None:
        """Stop source-state tracking."""
        if self._remove_state_listener is not None:
            self._remove_state_listener()
            self._remove_state_listener = None


class PlantCareManager:
    """Own shared storage and active plant runtimes."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the manager."""
        self.hass = hass
        self.store = PlantCareStore(hass)
        self.coordinators: dict[str, PlantCoordinator] = {}

    async def async_load(self) -> None:
        """Load shared durable data."""
        await self.store.async_load()

    def add(self, coordinator: PlantCoordinator) -> None:
        """Register an active plant."""
        self.coordinators[coordinator.plant.plant_id] = coordinator

    async def async_remove(self, plant_id: str) -> None:
        """Remove an active plant runtime."""
        coordinator = self.coordinators.pop(plant_id, None)
        if coordinator is not None:
            await coordinator.async_stop()

    async def async_refresh(self, plant_ids: set[str]) -> None:
        """Refresh plants affected by an assignment transaction."""
        for plant_id in plant_ids:
            if coordinator := self.coordinators.get(plant_id):
                coordinator.assignments_changed()
                await coordinator.async_request_refresh()
