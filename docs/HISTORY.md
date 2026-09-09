# History

History is stored durably by plant UUID. Initial events are `watered`,
`fertilized`, `repotted`, `sensor_assigned`, and `sensor_unassigned`. Each event
has a UUID, timezone-aware timestamp, source, and details.

Moving a source records assignment events for the affected plants but never
rewrites earlier care events. Restarting Home Assistant reloads the versioned
store before plant entities are set up. Removing a temporarily unavailable
source entity does not delete either its assignment or history.
