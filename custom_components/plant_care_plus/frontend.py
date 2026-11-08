"""Register app-owned frontend assets through the shared HA+ lifecycle."""

from pathlib import Path
from typing import Final

from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .ha_plus_frontend import (
    async_register_frontend as register_frontend,
)

CARD_URL: Final = "/plant_care_plus/plant-care-plus-card.js"
CARD_PATH: Final = Path(__file__).parent / "frontend" / "plant-care-plus-card.js"


async def async_register_card(hass: HomeAssistant) -> None:
    root = Path(__file__).parent
    await register_frontend(
        hass,
        domain=DOMAIN,
        module_url=CARD_URL,
        static_paths={
            CARD_URL: CARD_PATH,
            "/plant_care_plus/icon.png": root / "brand/icon.png",
        },
        webcomponent_name="plant-care-plus-panel",
        frontend_url_path="ha-plus-plant-care",
        sidebar_title="HA+ Plant Care",
        sidebar_icon="plant-care-plus:logo",
        require_admin=False,
    )
