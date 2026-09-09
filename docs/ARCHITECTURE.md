# Architecture

Plant Care Plus is plant-centric, useful without hardware, progressively
enhanced by sensors, Home Assistant-native, and loosely coupled from Plant
Monitor and OpenPlantbook.

Each real plant is a Home Assistant config entry with a generated UUID. Its
profile contains user-owned identity, species, location, and care thresholds.
Sensor entity IDs are never part of plant identity.

Shared versioned storage owns two kinds of durable state:

1. Care and assignment history keyed by plant UUID.
2. Mutable `(plant, measurement, entity)` assignments and reminder snoozes.

One coordinator per plant observes its currently assigned source entities and
runs the pure care engine. Stable Plant Care Plus entities subscribe to that
coordinator. When a sensor moves, only assignments and subscriptions change.

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

User options override initial/reference values. The OpenPlantbook ID and an
existing `plant.*` entity may be linked, but this release deliberately performs
no undocumented calls into either integration.

## Invariants

- Plant IDs never derive from entity IDs.
- History always belongs to a plant UUID.
- A measurement source can belong to at most one plant at a time.
- Reassignment records unassignment and assignment events atomically in one
  storage save.
- Missing source states do not remove assignments.
- Missing measurements remain unavailable.
- Care actions are persisted before new entity state is published.
