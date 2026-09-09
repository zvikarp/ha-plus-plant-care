"""Shared HA Plus Plant Care test fixtures."""

import pytest

pytest_plugins = "pytest_homeassistant_custom_component"


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    """Allow the test Home Assistant instance to discover this integration."""
    return None
