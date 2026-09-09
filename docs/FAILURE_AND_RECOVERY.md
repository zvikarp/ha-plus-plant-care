# Failure and recovery

- Unavailable or missing sensor: keep assignment visible, mark measurement
  unavailable, and use schedule care.
- Invalid non-numeric measurement: treat as unavailable; never fabricate data.
- OpenPlantbook unavailable: user profile and stored ID remain usable because
  this release has no runtime dependency on it.
- Weather unavailable: the normal fixed schedule is already authoritative.
- Home Assistant restart: config entries restore plants and versioned storage
  restores history, assignments, and snoozes before entity setup.
- Permanently removed entity: care-status attributes continue to expose the
  source ID with `available: false` until the user unassigns or replaces it.
