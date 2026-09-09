"""Pure care-decision logic."""

from __future__ import annotations

from datetime import datetime, timedelta

from .const import CareStatus
from .models import CareDecision, PlantConfig


def calculate_care(
    plant: PlantConfig,
    *,
    now: datetime,
    last_watered: datetime | None,
    moisture: float | None,
    moisture_assigned: bool,
    snoozed_until: datetime | None,
) -> CareDecision:
    """Calculate care state, preferring available moisture over the schedule."""
    next_watering = None
    days_since = None
    if last_watered is not None:
        next_watering = last_watered + timedelta(days=plant.watering_interval_days)
        days_since = max(0, (now.date() - last_watered.date()).days)

    moisture_available = moisture is not None
    if moisture is not None:
        if moisture <= plant.moisture_minimum:
            status = CareStatus.NEEDS_ATTENTION
            needs_water = True
            reason = "Moisture is below the configured minimum"
        elif moisture < plant.moisture_target:
            status = CareStatus.APPROACHING
            needs_water = False
            reason = "Moisture is below the configured target"
        else:
            status = CareStatus.OK
            needs_water = False
            reason = "Moisture is healthy"
    elif last_watered is None:
        status = CareStatus.UNKNOWN
        needs_water = False
        reason = (
            "Assigned moisture sensor is unavailable and no watering is recorded"
            if moisture_assigned
            else "Record watering to start schedule-based care"
        )
    else:
        assert days_since is not None
        ratio = days_since / plant.watering_interval_days
        if ratio >= 1.5:
            status = CareStatus.OVERDUE
            needs_water = True
            reason = "Watering check is substantially overdue"
        elif ratio >= 1:
            status = CareStatus.CHECK
            needs_water = False
            reason = "Watering check is due"
        elif ratio >= 0.8:
            status = CareStatus.APPROACHING
            needs_water = False
            reason = "Watering check is approaching"
        else:
            status = CareStatus.OK
            needs_water = False
            reason = "Watering check is not due"

        if moisture_assigned:
            reason = f"Moisture sensor unavailable; {reason.lower()}"

    needs_attention = status in {
        CareStatus.CHECK,
        CareStatus.NEEDS_ATTENTION,
        CareStatus.OVERDUE,
    }
    active_snooze = snoozed_until if snoozed_until and snoozed_until > now else None
    if active_snooze is not None:
        needs_attention = False
        needs_water = False
        reason = f"Reminder snoozed until {active_snooze.isoformat()}"

    return CareDecision(
        status=status,
        last_watered=last_watered,
        next_watering=next_watering,
        days_since_watered=days_since,
        needs_water=needs_water,
        needs_attention=needs_attention,
        moisture=moisture,
        moisture_available=moisture_available,
        sensor_assisted=moisture_assigned and moisture_available,
        snoozed_until=active_snooze,
        reason=reason,
    )
