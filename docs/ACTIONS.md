# Actions

All actions target any Plant Care Plus entity belonging to the intended plant.

| Action | Data | Effect |
|---|---|---|
| `plant_care_plus.water` | optional `timestamp` | Records watering, clears snooze, recalculates |
| `plant_care_plus.fertilize` | optional `timestamp` | Records fertilizing |
| `plant_care_plus.repot` | optional `timestamp` | Records repotting |
| `plant_care_plus.assign_sensor` | `measurement`, `source_entity_id` | Assigns or moves one source |
| `plant_care_plus.unassign_sensor` | `measurement` | Removes the relationship only |
| `plant_care_plus.snooze` | `hours` (1–720) | Suppresses boolean reminders temporarily |

Action targets are validated through Home Assistant's entity registry. Invalid
or unloaded targets fail visibly instead of mutating unrelated data.
