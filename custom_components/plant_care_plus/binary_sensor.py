"""Plant Care Plus binary sensor entities."""

from __future__ import annotations

from typing import TYPE_CHECKING

from homeassistant.components.binary_sensor import BinarySensorEntity

from .const import DOMAIN
from .coordinator import PlantCareManager, PlantCoordinator
from .entity import PlantCareEntity
from .models import PlantConfig

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant
    from homeassistant.helpers.entity_platform import AddEntitiesCallback


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up binary sensors for one plant."""
    manager: PlantCareManager = hass.data[DOMAIN]
    coordinator = manager.coordinators[PlantConfig.from_entry(entry).plant_id]
    async_add_entities(
        [NeedsWaterBinarySensor(coordinator), NeedsAttentionBinarySensor(coordinator)]
    )


class NeedsWaterBinarySensor(PlantCareEntity, BinarySensorEntity):
    """Evidence-backed watering recommendation."""

    _attr_translation_key = "needs_water"
    _attr_icon = "mdi:watering-can"

    def __init__(self, coordinator: PlantCoordinator) -> None:
        """Initialize the watering binary sensor."""
        super().__init__(coordinator, "needs_water")

    @property
    def is_on(self) -> bool:
        """Return whether evidence currently supports watering."""
        return self.coordinator.data.needs_water


class NeedsAttentionBinarySensor(PlantCareEntity, BinarySensorEntity):
    """General care-attention signal for HA-native notifications."""

    _attr_translation_key = "needs_attention"
    _attr_icon = "mdi:alert-circle-outline"

    def __init__(self, coordinator: PlantCoordinator) -> None:
        """Initialize the attention binary sensor."""
        super().__init__(coordinator, "needs_attention")

    @property
    def is_on(self) -> bool:
        """Return whether this plant should be checked."""
        return self.coordinator.data.needs_attention
