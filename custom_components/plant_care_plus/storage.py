"""Durable history and sensor assignment storage."""

from __future__ import annotations

import asyncio
from collections.abc import Iterable
from datetime import datetime
from typing import Any
from uuid import uuid4

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import STORAGE_KEY, STORAGE_VERSION, CareEventType, Measurement
from .models import CareEvent, SensorAssignment


class PlantCareStore:
    """Own persistent state whose lifetime is independent of sensors."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the store."""
        self._store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self._events: list[CareEvent] = []
        self._assignments: list[SensorAssignment] = []
        self._snoozes: dict[str, datetime] = {}
        self._lock = asyncio.Lock()

    async def async_load(self) -> None:
        """Load durable state."""
        data = await self._store.async_load() or {}
        self._events = [CareEvent.from_dict(item) for item in data.get("events", [])]
        self._assignments = [
            SensorAssignment.from_dict(item) for item in data.get("assignments", [])
        ]
        self._snoozes = {
            plant_id: parsed
            for plant_id, value in data.get("snoozes", {}).items()
            if (parsed := dt_util.parse_datetime(value)) is not None
        }

    async def _async_commit(
        self,
        *,
        events: list[CareEvent] | None = None,
        assignments: list[SensorAssignment] | None = None,
        snoozes: dict[str, datetime] | None = None,
    ) -> None:
        """Persist a complete snapshot before publishing it in memory."""
        next_events = events if events is not None else self._events
        next_assignments = assignments if assignments is not None else self._assignments
        next_snoozes = snoozes if snoozes is not None else self._snoozes
        await self._store.async_save(
            {
                "events": [event.as_dict() for event in next_events],
                "assignments": [
                    assignment.as_dict() for assignment in next_assignments
                ],
                "snoozes": {
                    plant_id: value.isoformat()
                    for plant_id, value in next_snoozes.items()
                },
            }
        )
        self._events = next_events
        self._assignments = next_assignments
        self._snoozes = next_snoozes

    def events_for(
        self,
        plant_id: str,
        event_type: CareEventType | None = None,
    ) -> list[CareEvent]:
        """Return a plant's events in reverse chronological order."""
        events = [
            event
            for event in self._events
            if event.plant_id == plant_id
            and (event_type is None or event.event_type == event_type)
        ]
        return sorted(events, key=lambda event: event.timestamp, reverse=True)

    def last_event(self, plant_id: str, event_type: CareEventType) -> CareEvent | None:
        """Return the latest event of a type for a plant."""
        events = self.events_for(plant_id, event_type)
        return events[0] if events else None

    async def async_record_event(
        self,
        plant_id: str,
        event_type: CareEventType,
        *,
        timestamp: datetime | None = None,
        source: str = "manual",
        details: dict[str, Any] | None = None,
    ) -> CareEvent:
        """Append a durable plant event."""
        event = CareEvent(
            event_id=str(uuid4()),
            plant_id=plant_id,
            event_type=event_type,
            timestamp=timestamp or dt_util.utcnow(),
            source=source,
            details=details or {},
        )
        async with self._lock:
            await self._async_commit(events=[*self._events, event])
        return event

    def assignments_for(self, plant_id: str) -> dict[Measurement, SensorAssignment]:
        """Return assignments keyed by independent measurement type."""
        return {
            assignment.measurement: assignment
            for assignment in self._assignments
            if assignment.plant_id == plant_id
        }

    async def async_assign(
        self,
        plant_id: str,
        measurement: Measurement,
        entity_id: str,
    ) -> set[str]:
        """Assign a sensor, moving it cleanly from any prior plant."""
        async with self._lock:
            now = dt_util.utcnow()
            removed = [
                assignment
                for assignment in self._assignments
                if (
                    assignment.measurement == measurement
                    and (
                        assignment.plant_id == plant_id
                        or assignment.entity_id == entity_id
                    )
                )
            ]
            unchanged = any(
                assignment.plant_id == plant_id and assignment.entity_id == entity_id
                for assignment in removed
            )
            if unchanged and len(removed) == 1:
                return {plant_id}

            affected = {plant_id, *(item.plant_id for item in removed)}
            next_assignments = [
                assignment
                for assignment in self._assignments
                if assignment not in removed
            ]
            next_events = list(self._events)
            for assignment in removed:
                next_events.append(
                    CareEvent(
                        event_id=str(uuid4()),
                        plant_id=assignment.plant_id,
                        event_type=CareEventType.SENSOR_UNASSIGNED,
                        timestamp=now,
                        source="manual",
                        details={
                            "measurement": assignment.measurement,
                            "entity_id": assignment.entity_id,
                        },
                    )
                )

            next_assignments.append(
                SensorAssignment(
                    plant_id=plant_id,
                    measurement=measurement,
                    entity_id=entity_id,
                    assigned_at=now,
                )
            )
            next_events.append(
                CareEvent(
                    event_id=str(uuid4()),
                    plant_id=plant_id,
                    event_type=CareEventType.SENSOR_ASSIGNED,
                    timestamp=now,
                    source="manual",
                    details={"measurement": measurement, "entity_id": entity_id},
                )
            )
            await self._async_commit(events=next_events, assignments=next_assignments)
            return affected

    async def async_unassign(self, plant_id: str, measurement: Measurement) -> set[str]:
        """Remove an assignment without deleting plant or history."""
        async with self._lock:
            removed = [
                assignment
                for assignment in self._assignments
                if assignment.plant_id == plant_id
                and assignment.measurement == measurement
            ]
            if not removed:
                return {plant_id}
            next_assignments = [
                assignment
                for assignment in self._assignments
                if assignment not in removed
            ]
            now = dt_util.utcnow()
            next_events = [
                *self._events,
                *(
                    CareEvent(
                        event_id=str(uuid4()),
                        plant_id=plant_id,
                        event_type=CareEventType.SENSOR_UNASSIGNED,
                        timestamp=now,
                        source="manual",
                        details={
                            "measurement": measurement,
                            "entity_id": assignment.entity_id,
                        },
                    )
                    for assignment in removed
                ),
            ]
            await self._async_commit(events=next_events, assignments=next_assignments)
            return {plant_id}

    def snoozed_until(self, plant_id: str) -> datetime | None:
        """Return a plant's active or expired snooze timestamp."""
        return self._snoozes.get(plant_id)

    async def async_set_snooze(
        self, plant_id: str, snoozed_until: datetime | None
    ) -> None:
        """Set or clear a plant reminder snooze."""
        async with self._lock:
            next_snoozes = dict(self._snoozes)
            if snoozed_until is None:
                next_snoozes.pop(plant_id, None)
            else:
                next_snoozes[plant_id] = snoozed_until
            await self._async_commit(snoozes=next_snoozes)

    async def async_remove_plant(self, plant_id: str) -> None:
        """Remove data after the user explicitly deletes a plant entry."""
        async with self._lock:
            next_snoozes = dict(self._snoozes)
            next_snoozes.pop(plant_id, None)
            await self._async_commit(
                events=[event for event in self._events if event.plant_id != plant_id],
                assignments=[
                    assignment
                    for assignment in self._assignments
                    if assignment.plant_id != plant_id
                ],
                snoozes=next_snoozes,
            )

    def plant_ids_with_assignments(self) -> Iterable[str]:
        """Return plant IDs referenced by assignments."""
        return {assignment.plant_id for assignment in self._assignments}
