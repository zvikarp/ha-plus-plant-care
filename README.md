# HA Plus Plant Care

HA Plus Plant Care is a plant-centric companion integration for Home Assistant. It
tracks care, schedules checks, keeps durable history, and progressively uses
existing sensor entities when they are available.

> **Plants are permanent entities. Sensors are optional, replaceable inputs.**

A sensorless plant gets the same identity, history, schedule, actions, and care
entities as a sensor-backed plant. Moving a sensor between plants never moves
history or recreates either plant.

## Features

- Sensorless watering schedules and manual care history
- Moisture-assisted recommendations with automatic schedule fallback
- Independent moisture, temperature, humidity, conductivity, and illuminance
  assignments
- Transactional sensor reassignment between plants
- `water`, `fertilize`, `repot`, `assign_sensor`, `unassign_sensor`, and `snooze`
  actions
- Care status, timestamps, measurements, and automation-friendly binary sensors
- Optional links to existing Home Assistant plant entities and OpenPlantbook IDs
- Durable Home Assistant storage; no cloud account or custom notification system

## Install

### HACS

1. In HACS, open **Integrations**, choose **Custom repositories**, and add
   `https://github.com/zvikarp/ha-plus-plant-care` with the **Integration** type.
2. Search for **HA Plus Plant Care** and install it. HACS installs directly from
   the repository, so a GitHub Release is not required for personal use.
3. Restart Home Assistant.
4. Open **Settings → Devices & services → Add integration**, search for
   **HA Plus Plant Care**, and add each real plant.

### Manual

Copy `custom_components/plant_care_plus` into the `custom_components` directory
in your Home Assistant configuration, restart Home Assistant, then add the
integration from **Settings → Devices & services**.

## Use

Adding a plant asks for its name, optional species/reference information,
indoor/outdoor location, watering interval, and moisture thresholds. No sensor
is required.

Each plant exposes:

- Care status
- Last watered and estimated next watering check
- Days since watered
- Moisture, temperature, humidity, conductivity, and illuminance (unavailable
  until assigned)
- Needs water and needs attention binary sensors

Use Home Assistant's action UI to target any entity belonging to the plant.
For example:

```yaml
action: plant_care_plus.water
target:
  entity_id: sensor.living_room_zz_plant_care_status
```

Assign an existing sensor entity:

```yaml
action: plant_care_plus.assign_sensor
target:
  entity_id: sensor.living_room_zz_plant_care_status
data:
  measurement: moisture
  source_entity_id: sensor.plant_sensor_3_moisture
```

Calling the same assignment action for another plant moves that measurement.
The old plant retains all care history and immediately falls back to its
schedule.

Notification delivery stays Home Assistant-native. A simple automation can
trigger on `binary_sensor.<plant>_needs_attention` and use any notify action the
household prefers.

## Care decisions

Available moisture is the primary watering signal. A healthy reading prevents a
schedule-only watering recommendation. If the source is unavailable, its
assignment remains visible and the integration falls back to the fixed schedule.
Without a recorded watering or available moisture reading, the status is
`unknown` rather than fabricated.

Statuses are `ok`, `approaching`, `check`, `needs_attention`, `overdue`, and
`unknown`. Schedule-based `check` means exactly that: inspect the plant before
watering.

## Development

```bash
python3.13 -m venv .venv
.venv/bin/pip install --no-deps homeassistant==2025.1.3 pytest-homeassistant-custom-component==0.13.204
.venv/bin/python -c "import homeassistant,pathlib,subprocess,sys; constraints=pathlib.Path(homeassistant.__file__).with_name('package_constraints.txt'); subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-c', str(constraints), '.[test]'])"
.venv/bin/ruff check .
.venv/bin/mypy custom_components/plant_care_plus
.venv/bin/pytest
```

### Optional releases

Personal HACS installations do not need a release. After changes are merged,
use HACS's **Redownload** action for the integration and restart Home Assistant.

If a packaged release is wanted later, update the version in
`custom_components/plant_care_plus/manifest.json` and `pyproject.toml`, update
`CHANGELOG.md`, then publish a matching GitHub tag and release. The Release
workflow will attach `plant_care_plus.zip` automatically. For example:

```bash
gh release create v0.1.0 --generate-notes
```

The current implementation intentionally provides the tested foundation and sensor
layer. Weather prediction, automatic OpenPlantbook retrieval, photos, learning,
and custom dashboards remain roadmap work; existing integrations continue to
own sensor communication and plant reference data.

See [Architecture](docs/ARCHITECTURE.md), [Actions](docs/ACTIONS.md), and the
[roadmap](docs/ROADMAP.md) for details.

## License

MIT
