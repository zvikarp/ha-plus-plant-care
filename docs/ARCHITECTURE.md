# Architecture

HA Plus Plant Care is plant-centric, useful without hardware, progressively
enhanced by sensors, Home Assistant-native, and loosely coupled from Plant
Monitor and OpenPlantbook.

Each real plant is a Home Assistant config entry with a generated UUID. Its
profile contains user-owned identity, area, reference ID, and care thresholds.
Sensor entity IDs are never part of plant identity.

Shared versioned storage owns two kinds of durable state:

1. Care and assignment history keyed by plant UUID.
2. Mutable `(plant, measurement, entity)` assignments and reminder snoozes.

One coordinator per plant resolves explicit assignments, linked-plant sensors,
and ambient area sensors, observes those source entities, and runs the pure care
engine. Stable HA Plus Plant Care entities subscribe to that coordinator. When
a manual sensor moves, only assignments and subscriptions change.

```text
HA sensor entities ── observations ──► Plant coordinator
                                            │
Config entry ── permanent plant/profile ────┤
Shared storage ── history/assignments ──────┤
                                            ▼
                                      Care decision
                                            │
                                            ▼
                              HA entities and actions
```

User options override initial/reference values. Selecting an existing `plant.*`
entity prefills its public name, Home Assistant area, and OpenPlantbook ID and
reuses the public sensor mapping exposed in its state attributes. Bulk import
discovers Plant Monitor through Home Assistant's config-entry and entity
registries, then creates one normal HA Plus Plant Care config flow per missing
plant. Source config-entry IDs provide stable duplicate detection even if a
linked entity is renamed.

## Invariants

- Plant IDs never derive from entity IDs.
- History always belongs to a plant UUID.
- A manually assigned plant-specific source can belong to at most one plant at
  a time; ambient area sources may be shared.
- Reassignment records unassignment and assignment events atomically in one
  storage save.
- Missing source states do not remove assignments.
- Missing measurements remain unavailable.
- Care actions are persisted before new entity state is published.
