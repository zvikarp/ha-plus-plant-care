# UI

The integration prioritizes standard Home Assistant UI primitives. Each plant
is a device with a rich care-status sensor, automation-friendly binary sensors,
measurement entities, and actions. Users can build a dashboard grouping plants
by needs attention, upcoming checks, and healthy state without installing a
custom card.

Plant setup and profile editing use native config flows. The optional existing
plant selector comes first and prefills the following name, area, and
OpenPlantbook ID fields. The same first screen offers a bulk action that adds
every Plant Monitor plant not already linked, with a separate config entry and
care history for each plant. Linked-plant and area sensors are resolved
automatically; explicit source assignment remains available through the native
action UI for overrides.
