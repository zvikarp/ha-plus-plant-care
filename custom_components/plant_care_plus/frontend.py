"""Serve and register the HA Plus Plant Care Lovelace card."""

from pathlib import Path
from typing import Final

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

CARD_URL: Final = "/plant_care_plus/plant-care-plus-card.js"
CARD_PATH: Final = Path(__file__).parent / "frontend" / "plant-care-plus-card.js"


async def async_register_card(hass: HomeAssistant) -> None:
    """Expose the card module and load it in the Home Assistant frontend."""
    await hass.http.async_register_static_paths(
        [StaticPathConfig(CARD_URL, str(CARD_PATH), cache_headers=False)]
    )
    add_extra_js_url(hass, CARD_URL)
