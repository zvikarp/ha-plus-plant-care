"""Plant Care Plus domain models."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_NAME
from homeassistant.util import dt as dt_util

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
    CareEventType,
    CareStatus,
    LocationType,
    Measurement,
)


@dataclass(frozen=True, slots=True)
class PlantConfig:
    """The stable plant identity and user-owned care profile."""

    plant_id: str
    name: str
    common_name: str | None
    scientific_name: str | None
    openplantbook_id: str | None
    location_type: LocationType
    area_id: str | None
    linked_plant_entity: str | None
    watering_interval_days: int
    moisture_minimum: float
    moisture_target: float

    @classmethod
    def from_entry(cls, entry: ConfigEntry) -> PlantConfig:
        """Build a plant config, with user options taking precedence."""
        values = {**entry.data, **entry.options}
        return cls(
            plant_id=values[CONF_PLANT_ID],
            name=values[CONF_NAME],
            common_name=values.get(CONF_COMMON_NAME) or None,
            scientific_name=values.get(CONF_SCIENTIFIC_NAME) or None,
            openplantbook_id=values.get(CONF_OPENPLANTBOOK_ID) or None,
            location_type=LocationType(
                values.get(CONF_LOCATION_TYPE, LocationType.INDOOR)
            ),
            area_id=values.get(CONF_AREA_ID),
            linked_plant_entity=values.get(CONF_LINKED_PLANT_ENTITY) or None,
            watering_interval_days=int(
                values.get(CONF_WATERING_INTERVAL, DEFAULT_WATERING_INTERVAL)
            ),
            moisture_minimum=float(
                values.get(CONF_MOISTURE_MINIMUM, DEFAULT_MOISTURE_MINIMUM)
            ),
            moisture_target=float(
                values.get(CONF_MOISTURE_TARGET, DEFAULT_MOISTURE_TARGET)
            ),
        )


@dataclass(frozen=True, slots=True)
class CareEvent:
    """A durable event belonging to a plant."""

    event_id: str
    plant_id: str
    event_type: CareEventType
    timestamp: datetime
    source: str
    details: dict[str, Any]

    def as_dict(self) -> dict[str, Any]:
        """Return a JSON-serializable representation."""
        return {
            "event_id": self.event_id,
            "plant_id": self.plant_id,
            "event_type": self.event_type,
            "timestamp": self.timestamp.isoformat(),
            "source": self.source,
            "details": self.details,
        }

    @classmethod
    def from_dict(cls, value: dict[str, Any]) -> CareEvent:
        """Restore an event from storage."""
        timestamp = dt_util.parse_datetime(value["timestamp"])
        if timestamp is None:
            msg = "Stored event has an invalid timestamp"
            raise ValueError(msg)
        return cls(
            event_id=value["event_id"],
            plant_id=value["plant_id"],
            event_type=CareEventType(value["event_type"]),
            timestamp=timestamp,
            source=value["source"],
            details=dict(value.get("details", {})),
        )


@dataclass(frozen=True, slots=True)
class SensorAssignment:
    """A mutable relationship between a plant and a HA sensor entity."""

    plant_id: str
    measurement: Measurement
    entity_id: str
    assigned_at: datetime

    def as_dict(self) -> dict[str, str]:
        """Return a JSON-serializable representation."""
        return {
            "plant_id": self.plant_id,
            "measurement": self.measurement,
            "entity_id": self.entity_id,
            "assigned_at": self.assigned_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, value: dict[str, Any]) -> SensorAssignment:
        """Restore an assignment from storage."""
        assigned_at = dt_util.parse_datetime(value["assigned_at"])
        if assigned_at is None:
            msg = "Stored assignment has an invalid timestamp"
            raise ValueError(msg)
        return cls(
            plant_id=value["plant_id"],
            measurement=Measurement(value["measurement"]),
            entity_id=value["entity_id"],
            assigned_at=assigned_at,
        )


@dataclass(frozen=True, slots=True)
class CareDecision:
    """Calculated care state for a plant."""

    status: CareStatus
    last_watered: datetime | None
    next_watering: datetime | None
    days_since_watered: int | None
    needs_water: bool
    needs_attention: bool
    moisture: float | None
    moisture_available: bool
    sensor_assisted: bool
    snoozed_until: datetime | None
    reason: str
