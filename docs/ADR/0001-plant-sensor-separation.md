# ADR 0001: Separate plants and sensors

**Status:** Accepted

Plants represent real-world plants. Sensors are explicitly assigned observation
sources. Physical sensors move, so plant identity, entities, profile, and
history must survive assignment changes. This requires a relationship model and
sensorless care, and prevents destructive sensor-centric behavior.
