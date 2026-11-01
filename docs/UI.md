# UI

The integration prioritizes standard Home Assistant UI primitives. Each plant
is a device with a rich care-status sensor, automation-friendly binary sensors,
measurement entities, and actions. The bundled `custom:plant-care-plus-card`
uses those same public entities and actions to provide a compact plant panel;
it does not duplicate care decisions or history in the browser. Standard HA
cards remain fully supported.

Plant setup and profile editing use native config flows. The optional existing
plant selector comes first and prefills the following name, area, and
OpenPlantbook ID fields. The same first screen offers a bulk action that adds
every Plant Monitor plant not already linked, with a separate config entry and
care history for each plant. Linked-plant and area sensors are resolved
automatically; explicit source assignment remains available through the native
action UI for overrides.

## Plants dashboard

Replace the grid of individual plant cards in the Plants view with one dashboard
card to enable the Cards/Table switch and bulk watering:

```yaml
type: custom:plant-care-plus-dashboard
```

By default it discovers loaded care-status sensors. To show only specific plants,
provide their care-status sensor IDs:

```yaml
type: custom:plant-care-plus-dashboard
entities:
  - sensor.fern_care_status
  - sensor.palm_care_status
```

For a full-width dashboard, use a panel view containing this card. Table view
includes all measurements and supports horizontal scrolling on narrow screens.
Select rows (or use Select all), then choose **Mark selected watered**. A themed
confirmation lists the plants before recording. Successful selections are cleared;
failed plants stay selected with an error summary so they can be retried.

Both the individual card and dashboard display Last watered and Next check as
relative calendar days in Home Assistant's configured timezone. Unknown dates
remain unknown. Single-plant watering and successful bulk watering show a green
check with a splash animation for three seconds before restoring the action.
The animation respects reduced-motion preferences. No live dashboard configuration
is modified by installing this integration update.

Frontend regression checks: `cd tests/frontend && npm ci && npm test`.
