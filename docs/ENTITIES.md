# Entities

Every plant exposes stable entities for care status, last watered, next watering
check, days since watered, needs water, and needs attention. It also exposes one
stable proxy entity for each supported measurement: moisture, temperature,
humidity, conductivity, and illuminance.

Measurement proxies use explicit assignments first, then linked-plant sensors,
then ambient area sensors. A proxy remains unavailable when no applicable source
exists. If a source disappears or reports `unknown`/`unavailable`, the proxy
becomes unavailable and its source ID remains visible. The care-status attributes
expose source availability and the decision reason without destroying explicit
assignments.

All entities share a Home Assistant device identified by the plant UUID.
