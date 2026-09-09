"""Shared Plant Care Plus entity behavior."""

from __future__ import annotations

from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN
from .coordinator import PlantCoordinator


class PlantCareEntity(CoordinatorEntity[PlantCoordinator]):
    """Base entity tied to a permanent plant, never to a source sensor."""

    _attr_has_entity_name = True

    def __init__(self, coordinator: PlantCoordinator, key: str) -> None:
        """Initialize a plant entity."""
        super().__init__(coordinator)
        plant = coordinator.plant
        self._attr_unique_id = f"{plant.plant_id}_{key}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, plant.plant_id)},
            name=plant.name,
            manufacturer="Plant Care Plus",
            model=plant.common_name or plant.scientific_name or "Plant",
            suggested_area=plant.area_id,
        )
