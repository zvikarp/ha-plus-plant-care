# Sensors

Sensors are mutable observations, not plants. Assignments are independent per
measurement type, so one device may supply moisture, temperature, and
conductivity while another supplies illuminance.

Sources resolve in this order: an explicit manual assignment, a sensor exposed
by the linked Home Assistant plant, then an ambient sensor in the selected area.
Area discovery applies to temperature, humidity, and illuminance. Moisture and
conductivity remain plant-specific and are never guessed from another plant in
the same area. The first matching area entity ID is selected deterministically,
so users can make a different source authoritative with the assign action.

Assigning the same measurement source to a new plant moves it: the former plant
keeps its UUID, entities, profile, and history, and immediately falls back to
sensorless schedule care. Measurements and actions from the past are never
retroactively reassigned. Area ambient sensors may be shared by multiple plants.
