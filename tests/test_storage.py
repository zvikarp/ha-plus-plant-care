"""Durability tests for history and mutable sensor relationships."""

from custom_components.plant_care_plus.const import CareEventType, Measurement
from custom_components.plant_care_plus.storage import PlantCareStore


async def test_history_and_assignments_survive_reload(hass) -> None:
    """A fresh store instance restores history and assignment identity."""
    original = PlantCareStore(hass)
    await original.async_load()
    event = await original.async_record_event("zz-plant", CareEventType.WATERED)
    await original.async_assign(
        "zz-plant", Measurement.MOISTURE, "sensor.plant_sensor_3"
    )

    restored = PlantCareStore(hass)
    await restored.async_load()

    assert (
        restored.last_event("zz-plant", CareEventType.WATERED).event_id
        == event.event_id
    )
    assert (
        restored.assignments_for("zz-plant")[Measurement.MOISTURE].entity_id
        == "sensor.plant_sensor_3"
    )
