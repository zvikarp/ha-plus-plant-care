Plant Care card responsiveness
==============================

The Lovelace card now uses its own width to choose one or two statistics columns.
Long plant names, unavailable entity IDs and care messages wrap within the card,
and watering feedback can wrap below the action. The action has a 44px minimum
height and keyboard controls have an explicit focus outline.

Before: [320px narrow card](before-320.png). After: [320px narrow card](after-320.png).
The fixture intentionally uses a long unbroken name to expose intrinsic sizing.
Home Assistant custom elements are lightweight style fixtures; this does not
validate a real HA installation, dialogs, translations or authenticated backend.

Run the browser regression from the repository root with Playwright and Chromium:

```sh
node docs/responsive/check.cjs custom_components/plant_care_plus/frontend/plant-care-plus-card.js after
```

Set PLAYWRIGHT_MODULE to an installed Playwright module path and CHROMIUM_PATH if
Chromium is not at /usr/bin/chromium. The check mocks hass.callService and emits
only local screenshots and JSON in /tmp. It covers 320/375/390/768/1440px browser
widths with a 320px dashboard column, doubled text, keyboard Enter/Space, cancelled
watering, pending button disabling and exactly one successful watering call.

Validation: browser regression and `node --check` pass. Python 3.13 Home Assistant
harness, ruff and mypy are unavailable in this cloud environment (Python 3.12 only);
Python code and care logic are unchanged. CI/release workflows are unchanged.
