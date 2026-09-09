# Sensors

Sensors are mutable observations, not plants. Assignments are independent per
measurement type, so one device may supply moisture, temperature, and
conductivity while another supplies illuminance.

Assigning the same measurement source to a new plant moves it: the former plant
keeps its UUID, entities, profile, and history, and immediately falls back to
sensorless schedule care. Measurements and actions from the past are never
retroactively reassigned.
