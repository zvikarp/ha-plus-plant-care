"""HA Plus Plant Care sensor entities."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorStateClass,
)
from homeassistant.const import (
    ATTR_UNIT_OF_MEASUREMENT,
    STATE_UNAVAILABLE,
    STATE_UNKNOWN,
    UnitOfTime,
)

from .const import DOMAIN, Measurement
from .coordinator import PlantCareManager, PlantCoordinator
from .entity import PlantCareEntity
from .models import PlantConfig

if TYPE_CHECKING:
    from datetime import datetime

    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant, State
    from homeassistant.helpers.entity_platform import AddEntitiesCallback


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up sensors for one plant."""
    manager: PlantCareManager = hass.data[DOMAIN]
    coordinator = manager.coordinators[PlantConfig.from_entry(entry).plant_id]
    async_add_entities(
        [
            CareStatusSensor(coordinator),
            LastWateredSensor(coordinator),
            NextWateringSensor(coordinator),
            DaysSinceWateredSensor(coordinator),
            *(
                MeasurementSensor(coordinator, measurement)
                for measurement in Measurement
            ),
        ]
    )


class CareStatusSensor(PlantCareEntity, SensorEntity):
    """Rich primary care state."""

    _attr_translation_key = "care_status"
    _attr_icon = "mdi:sprout"

    def __init__(self, coordinator: PlantCoordinator) -> None:
        """Initialize the status sensor."""
        super().__init__(coordinator, "care_status")

    @property
    def native_value(self) -> str:
        """Return current care state."""
        return self.coordinator.data.status

    def _source_available(self, entity_id: str) -> bool:
        """Return whether Home Assistant currently has a usable source state."""
        state = self.hass.states.get(entity_id)
        return state is not None and state.state not in {
            STATE_UNKNOWN,
            STATE_UNAVAILABLE,
        }

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Expose concise decision evidence and assignment health."""
        plant_id = self.coordinator.plant.plant_id
        last_event = self.coordinator.store.events_for(plant_id)
        sources = {
            measurement: source
            for measurement in Measurement
            if (source := self.coordinator.source_entity_id(measurement)) is not None
        }
        return {
            "reason": self.coordinator.data.reason,
            "sensor_assisted": self.coordinator.data.sensor_assisted,
            "snoozed_until": self.coordinator.data.snoozed_until,
            "area_id": self.coordinator.plant.area_id,
            "linked_plant_entity": self.coordinator.plant.linked_plant_entity,
            "sensor_assignments": {
                measurement: {
                    "entity_id": source,
                    "available": self._source_available(source),
                }
                for measurement, source in sources.items()
            },
            "last_care_event": (
                {
                    "type": last_event[0].event_type,
                    "timestamp": last_event[0].timestamp,
                }
                if last_event
                else None
            ),
        }


class LastWateredSensor(PlantCareEntity, SensorEntity):
    """Timestamp of the latest watering event."""

    _attr_translation_key = "last_watered"
    _attr_device_class = SensorDeviceClass.TIMESTAMP
    _attr_icon = "mdi:water-check"

    def __init__(self, coordinator: PlantCoordinator) -> None:
        """Initialize the last-watered sensor."""
        super().__init__(coordinator, "last_watered")

    @property
    def native_value(self) -> datetime | None:
        """Return latest watering timestamp."""
        return self.coordinator.data.last_watered


class NextWateringSensor(PlantCareEntity, SensorEntity):
    """Estimated next schedule check."""

    _attr_translation_key = "next_watering"
    _attr_device_class = SensorDeviceClass.TIMESTAMP
    _attr_icon = "mdi:calendar-clock"

    def __init__(self, coordinator: PlantCoordinator) -> None:
        """Initialize the next-watering sensor."""
        super().__init__(coordinator, "next_watering")

    @property
    def native_value(self) -> datetime | None:
        """Return next schedule timestamp."""
        return self.coordinator.data.next_watering


class DaysSinceWateredSensor(PlantCareEntity, SensorEntity):
    """Days elapsed since latest watering."""

    _attr_translation_key = "days_since_watered"
    _attr_device_class = SensorDeviceClass.DURATION
    _attr_native_unit_of_measurement = UnitOfTime.DAYS
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_icon = "mdi:calendar-range"

    def __init__(self, coordinator: PlantCoordinator) -> None:
        """Initialize the duration sensor."""
        super().__init__(coordinator, "days_since_watered")

    @property
    def native_value(self) -> int | None:
        """Return whole calendar days since watering."""
        return self.coordinator.data.days_since_watered


MEASUREMENT_METADATA = {
    Measurement.MOISTURE: (SensorDeviceClass.MOISTURE, "mdi:water-percent"),
    Measurement.TEMPERATURE: (
        SensorDeviceClass.TEMPERATURE,
        "mdi:thermometer",
    ),
    Measurement.HUMIDITY: (SensorDeviceClass.HUMIDITY, "mdi:water-percent"),
    Measurement.CONDUCTIVITY: (
        None,
        "mdi:flash",
    ),
    Measurement.ILLUMINANCE: (SensorDeviceClass.ILLUMINANCE, "mdi:brightness-5"),
}


class MeasurementSensor(PlantCareEntity, SensorEntity):
    """A stable plant measurement entity backed by a replaceable source."""

    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, coordinator: PlantCoordinator, measurement: Measurement) -> None:
        """Initialize a measurement proxy."""
        super().__init__(coordinator, measurement)
        self.measurement = measurement
        self._attr_translation_key = measurement
        device_class, icon = MEASUREMENT_METADATA[measurement]
        self._attr_device_class = device_class
        self._attr_icon = icon

    @property
    def _source_state(self) -> State | None:
        source = self.coordinator.source_entity_id(self.measurement)
        return self.hass.states.get(source) if source else None

    @property
    def available(self) -> bool:
        """Remain unavailable rather than inventing missing measurements."""
        state = self._source_state
        if (
            not super().available
            or state is None
            or state.state in {STATE_UNKNOWN, STATE_UNAVAILABLE}
        ):
            return False
        try:
            float(state.state)
        except (TypeError, ValueError):
            return False
        return True

    @property
    def native_unit_of_measurement(self) -> str | None:
        """Preserve the source's real unit rather than relabeling its data."""
        state = self._source_state
        return state.attributes.get(ATTR_UNIT_OF_MEASUREMENT) if state else None

    @property
    def native_value(self) -> float | None:
        """Return the source's numeric reading."""
        state = self._source_state
        if state is None or state.state in {STATE_UNKNOWN, STATE_UNAVAILABLE}:
            return None
        try:
            return float(state.state)
        except (TypeError, ValueError):
            return None

    @property
    def extra_state_attributes(self) -> dict[str, str | None]:
        """Identify the replaceable source entity."""
        return {"source_entity_id": self.coordinator.source_entity_id(self.measurement)}
