"""Tests for care-decision invariants."""

from datetime import UTC, datetime, timedelta

from custom_components.plant_care_plus.care import calculate_care
from custom_components.plant_care_plus.const import CareStatus, LocationType
from custom_components.plant_care_plus.models import PlantConfig

NOW = datetime(2026, 9, 9, 12, tzinfo=UTC)


def plant(interval: int = 10) -> PlantConfig:
    """Return a sensor-independent test plant."""
    return PlantConfig(
        plant_id="plant-1",
        name="ZZ Plant",
        common_name="ZZ Plant",
        scientific_name="Zamioculcas zamiifolia",
        openplantbook_id=None,
        location_type=LocationType.INDOOR,
        area_id=None,
        linked_plant_entity=None,
        watering_interval_days=interval,
        moisture_minimum=20,
        moisture_target=35,
    )


def test_sensorless_schedule_progresses_conservatively() -> None:
    """A due calendar tells the user to check rather than blindly water."""
    result = calculate_care(
        plant(),
        now=NOW,
        last_watered=NOW - timedelta(days=10),
        moisture=None,
        moisture_assigned=False,
        snoozed_until=None,
    )

    assert result.status == CareStatus.CHECK
    assert result.needs_attention
    assert not result.needs_water


def test_available_moisture_is_primary() -> None:
    """A healthy reading suppresses a stale schedule recommendation."""
    result = calculate_care(
        plant(),
        now=NOW,
        last_watered=NOW - timedelta(days=20),
        moisture=50,
        moisture_assigned=True,
        snoozed_until=None,
    )

    assert result.status == CareStatus.OK
    assert result.sensor_assisted
    assert not result.needs_attention


def test_unavailable_sensor_falls_back_to_schedule() -> None:
    """An unavailable source retains context while schedule care continues."""
    result = calculate_care(
        plant(),
        now=NOW,
        last_watered=NOW - timedelta(days=16),
        moisture=None,
        moisture_assigned=True,
        snoozed_until=None,
    )

    assert result.status == CareStatus.OVERDUE
    assert result.needs_water
    assert "sensor unavailable" in result.reason.lower()


def test_snooze_suppresses_booleans_but_retains_rich_status() -> None:
    """Snoozing changes delivery signals, not underlying evidence."""
    result = calculate_care(
        plant(),
        now=NOW,
        last_watered=NOW - timedelta(days=16),
        moisture=None,
        moisture_assigned=False,
        snoozed_until=NOW + timedelta(hours=3),
    )

    assert result.status == CareStatus.OVERDUE
    assert not result.needs_water
    assert not result.needs_attention
