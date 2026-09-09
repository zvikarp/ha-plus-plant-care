"""Constants for HA Plus Plant Care."""

from datetime import timedelta
from enum import StrEnum
from typing import Final

DOMAIN: Final = "plant_care_plus"
PLATFORMS: Final = ["sensor", "binary_sensor"]
STORAGE_KEY: Final = DOMAIN
STORAGE_VERSION: Final = 1
UPDATE_INTERVAL: Final = timedelta(minutes=15)

CONF_PLANT_ID: Final = "plant_id"
CONF_AREA_ID: Final = "area_id"
CONF_COMMON_NAME: Final = "common_name"
CONF_SCIENTIFIC_NAME: Final = "scientific_name"
CONF_OPENPLANTBOOK_ID: Final = "openplantbook_id"
CONF_LOCATION_TYPE: Final = "location_type"
CONF_LINKED_PLANT_ENTITY: Final = "linked_plant_entity"
CONF_WATERING_INTERVAL: Final = "watering_interval_days"
CONF_MOISTURE_MINIMUM: Final = "moisture_minimum"
CONF_MOISTURE_TARGET: Final = "moisture_target"

DEFAULT_WATERING_INTERVAL: Final = 14
DEFAULT_MOISTURE_MINIMUM: Final = 20.0
DEFAULT_MOISTURE_TARGET: Final = 35.0

SERVICE_WATER: Final = "water"
SERVICE_FERTILIZE: Final = "fertilize"
SERVICE_REPOT: Final = "repot"
SERVICE_ASSIGN_SENSOR: Final = "assign_sensor"
SERVICE_UNASSIGN_SENSOR: Final = "unassign_sensor"
SERVICE_SNOOZE: Final = "snooze"

ATTR_MEASUREMENT: Final = "measurement"
ATTR_SOURCE_ENTITY_ID: Final = "source_entity_id"
ATTR_TIMESTAMP: Final = "timestamp"
ATTR_HOURS: Final = "hours"


class LocationType(StrEnum):
    """Supported plant locations."""

    INDOOR = "indoor"
    OUTDOOR = "outdoor"


class Measurement(StrEnum):
    """Measurements that can be assigned independently."""

    MOISTURE = "moisture"
    TEMPERATURE = "temperature"
    HUMIDITY = "humidity"
    CONDUCTIVITY = "conductivity"
    ILLUMINANCE = "illuminance"


class CareEventType(StrEnum):
    """Durable care history event types."""

    WATERED = "watered"
    FERTILIZED = "fertilized"
    REPOTTED = "repotted"
    SENSOR_ASSIGNED = "sensor_assigned"
    SENSOR_UNASSIGNED = "sensor_unassigned"


class CareStatus(StrEnum):
    """Care states exposed to Home Assistant."""

    OK = "ok"
    APPROACHING = "approaching"
    CHECK = "check"
    NEEDS_ATTENTION = "needs_attention"
    OVERDUE = "overdue"
    UNKNOWN = "unknown"
