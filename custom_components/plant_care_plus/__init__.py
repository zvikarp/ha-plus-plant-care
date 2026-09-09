"""HA Plus Plant Care integration."""

from __future__ import annotations

from typing import TYPE_CHECKING

from homeassistant.core import HomeAssistant

from .const import DOMAIN, PLATFORMS
from .coordinator import PlantCareManager, PlantCoordinator
from .models import PlantConfig
from .services import async_register_services

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry


async def async_setup(hass: HomeAssistant, _config: dict) -> bool:
    """Set up shared HA Plus Plant Care storage and actions."""
    manager = PlantCareManager(hass)
    await manager.async_load()
    hass.data[DOMAIN] = manager
    async_register_services(hass, manager)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up one permanent plant."""
    manager: PlantCareManager = hass.data[DOMAIN]
    plant = PlantConfig.from_entry(entry)
    coordinator = PlantCoordinator(hass, entry, plant, manager.store)
    manager.add(coordinator)
    await coordinator.async_start()
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(entry.add_update_listener(_async_reload_entry))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a plant while preserving its durable data."""
    manager: PlantCareManager = hass.data[DOMAIN]
    plant = PlantConfig.from_entry(entry)
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded:
        await manager.async_remove(plant.plant_id)
    return unloaded


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Delete durable data only after explicit config-entry removal."""
    manager: PlantCareManager = hass.data[DOMAIN]
    await manager.store.async_remove_plant(PlantConfig.from_entry(entry).plant_id)


async def _async_reload_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Reload after a care profile is edited."""
    await hass.config_entries.async_reload(entry.entry_id)
