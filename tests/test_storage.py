"""Durability tests for history and mutable sensor relationships."""

from datetime import timedelta
from unittest.mock import AsyncMock, patch

from homeassistant.util import dt as dt_util

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


async def test_watering_records_history_and_clears_snooze_in_one_commit(hass) -> None:
    """Readers must never observe new watering history with the old snooze."""
    store = PlantCareStore(hass)
    await store.async_load()
    await store.async_set_snooze("fern", dt_util.utcnow() + timedelta(days=1))
    with patch.object(store._store, "async_save", new_callable=AsyncMock) as save:
        event = await store.async_record_event("fern", CareEventType.WATERED)

    save.assert_awaited_once()
    snapshot = save.call_args.args[0]
    assert snapshot["events"] == [event.as_dict()]
    assert snapshot["snoozes"] == {}
    assert store.snoozed_until("fern") is None
