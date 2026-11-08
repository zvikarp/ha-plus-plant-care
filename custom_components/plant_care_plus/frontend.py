"""Serve the Plant Care panel and its existing dashboard cards."""

from pathlib import Path
from typing import Final

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.components.panel_custom import async_register_panel
from homeassistant.core import HomeAssistant

from .const import DOMAIN

CARD_URL: Final = "/plant_care_plus/plant-care-plus-card.js"
CARD_PATH: Final = Path(__file__).parent / "frontend" / "plant-care-plus-card.js"


async def async_register_card(hass: HomeAssistant) -> None:
    """Expose the shared card module and built-in sidebar panel once."""
    from homeassistant.loader import async_get_integration

    integration = await async_get_integration(hass, DOMAIN)
    url = f"{CARD_URL}?v={integration.version}"
    if not hass.data.get("plant_care_plus_frontend_registered"):
        await hass.http.async_register_static_paths(
            [
                StaticPathConfig(CARD_URL, str(CARD_PATH), cache_headers=False),
                StaticPathConfig(
                    "/plant_care_plus/icon.png",
                    str(Path(__file__).parent / "brand/icon.png"),
                    cache_headers=False,
                ),
            ]
        )
        add_extra_js_url(hass, url)
        hass.data["plant_care_plus_frontend_registered"] = True
    await async_register_panel(
        hass,
        webcomponent_name="plant-care-plus-panel",
        frontend_url_path="ha-plus-plant-care",
        sidebar_title="HA+ Plant Care",
        sidebar_icon="plant-care-plus:logo",
        module_url=url,
        require_admin=False,
        config={"version": str(integration.version)},
    )
