# Bundled from @ha-plus/frontend 0.1.2. Rebuild with ha-plus-frontend-vendor.
"""Shared Home Assistant panel, asset, and icon module registration."""

from __future__ import annotations

import asyncio
from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
from urllib.parse import quote

from homeassistant.components import frontend, websocket_api
from homeassistant.components.frontend import add_extra_js_url, remove_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.components.panel_custom import async_register_panel
from homeassistant.core import HomeAssistant
from homeassistant.loader import async_get_integration


@dataclass
class _FrontendState:
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    paths_registered: bool = False
    extra_js: dict[str, str] = field(default_factory=dict)
    commands: set[Callable[..., Any]] = field(default_factory=set)
    panel_version: str | None = None


async def async_register_frontend(
    hass: HomeAssistant,
    *,
    domain: str,
    module_url: str,
    static_paths: Mapping[str, Path],
    frontend_url_path: str,
    webcomponent_name: str,
    sidebar_title: str,
    sidebar_icon: str,
    require_admin: bool = False,
    extra_js_urls: Sequence[str] = (),
    commands: Sequence[Callable[..., Any]] = (),
) -> None:
    """Register assets once and restore a panel after an integration reload.

    Icon modules precede the panel module in extra-JS registration. Successful
    stages are retained if a later stage fails, so retrying never adds duplicate
    static routes. Each integration owns an independent runtime state.
    """
    key = f"{domain}_ha_plus_frontend"
    if key not in hass.data:
        state = _FrontendState()
        # Adopt registrations created by HA+ versions before this extraction.
        legacy = (
            hass.data.get(f"{domain}_frontend_registered") is True
            or hass.data.get(f"{domain}_frontend") is True
        )
        if legacy:
            state.paths_registered = True
            manager = hass.data.get(frontend.DATA_EXTRA_MODULE_URL)
            registered_urls = manager.urls if manager is not None else ()
            for url in (*extra_js_urls, module_url):
                previous = next(
                    (item for item in registered_urls if item.startswith(f"{url}?v=")),
                    None,
                )
                if previous is not None:
                    state.extra_js[url] = previous
            panel = hass.data.get(frontend.DATA_PANELS, {}).get(frontend_url_path)
            config = panel.config if panel is not None else None
            if (
                config
                and config.get("_panel_custom", {}).get("name") == webcomponent_name
            ):
                state.panel_version = str(config.get("version", ""))
        hass.data[key] = state
    state = hass.data[key]
    async with state.lock:
        integration = await async_get_integration(hass, domain)
        version = str(integration.version)
        if not state.paths_registered:
            await hass.http.async_register_static_paths(
                [
                    StaticPathConfig(url, str(path), cache_headers=False)
                    for url, path in static_paths.items()
                ]
            )
            state.paths_registered = True
        for url in (*extra_js_urls, module_url):
            versioned_url = f"{url}?v={quote(version, safe='')}"
            previous = state.extra_js.get(url)
            if previous != versioned_url:
                add_extra_js_url(hass, versioned_url)
                if previous is not None:
                    remove_extra_js_url(hass, previous)
                state.extra_js[url] = versioned_url
        for command in commands:
            if command not in state.commands:
                websocket_api.async_register_command(hass, command)
                state.commands.add(command)
        exists = frontend_url_path in hass.data.get(frontend.DATA_PANELS, {})
        if state.panel_version == version and exists:
            return
        if state.panel_version is not None and exists:
            frontend.async_remove_panel(hass, frontend_url_path)
        await async_register_panel(
            hass,
            webcomponent_name=webcomponent_name,
            frontend_url_path=frontend_url_path,
            sidebar_title=sidebar_title,
            sidebar_icon=sidebar_icon,
            module_url=f"{module_url}?v={quote(version, safe='')}",
            require_admin=require_admin,
            config={"version": version},
        )
        state.panel_version = version


def async_unregister_frontend(hass: HomeAssistant, frontend_url_path: str) -> None:
    """Remove the panel while retaining the runtime's static routes and modules."""
    frontend.async_remove_panel(hass, frontend_url_path)
