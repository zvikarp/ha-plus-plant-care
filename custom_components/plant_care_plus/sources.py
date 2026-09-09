"""Resolve Home Assistant entities that supply plant measurements."""

from __future__ import annotations

from collections.abc import Mapping

from homeassistant.components.sensor import SensorDeviceClass
from homeassistant.const import ATTR_DEVICE_CLASS, CONF_NAME
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er

from .const import CONF_AREA_ID, CONF_OPENPLANTBOOK_ID, DOMAIN, Measurement

_AMBIENT_DEVICE_CLASSES: dict[str, Measurement] = {
    SensorDeviceClass.TEMPERATURE: Measurement.TEMPERATURE,
    SensorDeviceClass.HUMIDITY: Measurement.HUMIDITY,
    SensorDeviceClass.ILLUMINANCE: Measurement.ILLUMINANCE,
}

_LINKED_PLANT_READINGS = {
    Measurement.MOISTURE: "moisture",
    Measurement.TEMPERATURE: "temperature",
    Measurement.CONDUCTIVITY: "conductivity",
    Measurement.ILLUMINANCE: "brightness",
}


def entity_area_id(hass: HomeAssistant, entity_id: str) -> str | None:
    """Resolve an entity's explicit area or its device's area."""
    entry = er.async_get(hass).async_get(entity_id)
    if entry is None:
        return None
    if entry.area_id is not None:
        return entry.area_id
    if entry.device_id is None:
        return None
    device = dr.async_get(hass).async_get(entry.device_id)
    return device.area_id if device is not None else None


def linked_plant_defaults(hass: HomeAssistant, entity_id: str) -> dict[str, str]:
    """Return profile values exposed by an existing Home Assistant plant."""
    state = hass.states.get(entity_id)
    if state is None:
        return {}
    defaults = {CONF_NAME: state.name}
    if area_id := entity_area_id(hass, entity_id):
        defaults[CONF_AREA_ID] = area_id
    species = state.attributes.get("species_original") or state.attributes.get(
        "species"
    )
    if isinstance(species, str) and species.strip():
        defaults[CONF_OPENPLANTBOOK_ID] = species.strip()
    return defaults


def linked_plant_source(
    hass: HomeAssistant,
    entity_id: str | None,
    measurement: Measurement,
) -> str | None:
    """Return a sensor exposed by a linked Home Assistant plant."""
    if entity_id is None or measurement not in _LINKED_PLANT_READINGS:
        return None
    state = hass.states.get(entity_id)
    if state is None:
        return None
    sensors = state.attributes.get("sensors")
    if not isinstance(sensors, Mapping):
        return None
    source = sensors.get(_LINKED_PLANT_READINGS[measurement])
    if not isinstance(source, str) or not source.startswith("sensor."):
        return None
    return source


def area_source(
    hass: HomeAssistant,
    area_id: str | None,
    measurement: Measurement,
) -> str | None:
    """Choose a stable ambient sensor assigned to an area."""
    if area_id is None or measurement not in _AMBIENT_DEVICE_CLASSES.values():
        return None

    entity_registry = er.async_get(hass)
    device_registry = dr.async_get(hass)
    area_device_ids = {
        device.id for device in dr.async_entries_for_area(device_registry, area_id)
    }
    candidates = sorted(
        (
            entry
            for entry in entity_registry.entities.values()
            if entry.domain == "sensor"
            and entry.platform != DOMAIN
            and entry.disabled_by is None
            and (
                entry.area_id == area_id
                or (
                    entry.area_id is None
                    and entry.device_id is not None
                    and entry.device_id in area_device_ids
                )
            )
        ),
        key=lambda entry: entry.entity_id,
    )
    for entry in candidates:
        state = hass.states.get(entry.entity_id)
        device_class = (
            entry.device_class
            or entry.original_device_class
            or (state.attributes.get(ATTR_DEVICE_CLASS) if state is not None else None)
        )
        if (
            isinstance(device_class, str)
            and _AMBIENT_DEVICE_CLASSES.get(device_class) == measurement
        ):
            return entry.entity_id
    return None
