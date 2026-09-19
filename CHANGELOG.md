# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/) and
releases use semantic versioning.

## Unreleased

### Added

- A bundled `custom:plant-care-plus-card` with plant imagery, care status,
  measurements, watering dates, drill-down details, and a confirmed watering
  action.

### Changed

- Existing Home Assistant plants are selected first and prefill their name and
  area while reusing their exposed sensors.
- Home Assistant areas replace indoor/outdoor context and automatically provide
  ambient temperature, humidity, and illuminance sources.
- Common-name and scientific-name profile fields were removed.
- A guarded manual GitHub Actions workflow now bumps versions and creates tagged
  releases with the HACS archive attached.
- Linked Plant Monitor entities now prefill their OpenPlantbook ID.
- The initial setup screen can import every Plant Monitor plant that has not
  already been added, while keeping one HA Plus entry per plant.

## [0.1.0] - 2026-09-09

### Added

- Plant-centric Home Assistant config flow and stable entities
- Durable care history, schedules, actions, and reminder snoozing
- Independent sensor assignments with reassignment and graceful fallback
- HACS metadata, release packaging, documentation, and automated validation

[0.1.0]: https://github.com/zvikarp/ha-plus-plant-care/releases/tag/v0.1.0
