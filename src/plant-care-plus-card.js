import messages from "./translations/en.json";
import { localize, haContext } from "@ha-plus/ui";
const t = (key, values) => localize(haContext(), messages, key, values);

import { appStyles, confirmDialog, actionButton, applyPreferences, formatEntityState, relativeCalendarDate, showMoreInfo, showToast, setActionState, loadNativeComponents, iconButton, integrationUrl, navigate } from "@ha-plus/ui";

const CARD_TAG = "plant-care-plus-card";
const DOMAIN = "plant_care_plus";

const STAT_ROWS = [
  ["last_watered", t("last_watered"), "mdi:water-check"],
  ["next_watering", t("next_check"), "mdi:calendar-clock"],
  ["days_since_watered", t("days_since"), "mdi:calendar-range"],
  ["moisture", t("moisture"), "mdi:water-percent"],
  ["temperature", t("temperature"), "mdi:thermometer"],
  ["humidity", t("humidity"), "mdi:water-percent"],
  ["illuminance", t("illuminance"), "mdi:brightness-5"],
  ["conductivity", t("conductivity"), "mdi:flash"],
];

function confirmWater(host, names) {
  return confirmDialog(host, {
    title: host._t("record_watering"),
    message: host._t(names.length === 1 ? "confirm_water_one" : "confirm_water_many", { name: names[0], count: names.length }) + (names.length > 1 ? `\n\n${names.join("\n")}` : ""),
    confirmLabel: host._t("mark_watered"),
    cancelLabel: host._t("common.cancel"),
  });
}

function relativeDate(entity, key, hass) {
  if (!entity || !["last_watered", "next_watering"].includes(key)) return null;
  const result = relativeCalendarDate(hass, entity.state);
  return result ? result[0].toUpperCase() + result.slice(1) : null;
}

class PlantCarePlusCard extends HTMLElement {
  _t(key, values) { return localize(this._hass, messages, key, values); }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._renderBase();
  }

  setConfig(config) {
    if (!config?.entity || !config.entity.startsWith("sensor.")) {
      throw new Error("HA+ Plant Care card requires a care-status sensor entity");
    }
    this._config = { ...config };
    this._update();
  }

  set hass(hass) {
    this._hass = hass;
    applyPreferences(this, hass);
    if (hass.connection && !this._nativeLoading && !this._nativeReady) {
      this._nativeLoading = true;
      loadNativeComponents(this).then(() => {
        this._nativeReady = true;
        this._upgradeActions();
      }).catch(error => {
        const message = this.shadowRoot.querySelector(".message");
        if (message) message.textContent = error.message;
      }).finally(() => { this._nativeLoading = false; });
    }
    const toolbar = this.shadowRoot.querySelector(".toolbar");
    const settings = toolbar?.querySelector("[data-settings]");
    if (toolbar && hass.user?.is_admin && !settings) {
      const control = iconButton(this._t("integration_settings"), "mdi:cog", () => {
        if (this._hass?.user?.is_admin) navigate(this, integrationUrl(DOMAIN));
      });
      control.dataset.settings = "";
      toolbar.append(control);
    } else if (!hass.user?.is_admin) settings?.remove();
    this._update();
  }

  _upgradeActions() {
    const current = this.shadowRoot.querySelector(".water");
    if (!current || current.localName !== "button" || this._watering) return;
    const control = actionButton(current.textContent, () => {
      if (this.localName === "plant-care-plus-dashboard") this._markSelected();
      else this._markWatered();
    }, current.disabled, "accent");
    control.className = current.className;
    control.hidden = current.hidden;
    control.innerHTML = current.innerHTML;
    current.replaceWith(control);
    for (const selector of [".card-view", ".table-view"]) {
      const old = this.shadowRoot.querySelector(selector);
      if (!old) continue;
      const replacement = actionButton(old.textContent, () => this._setView(selector === ".table-view"));
      replacement.className = old.className;
      replacement.setAttribute("aria-pressed", old.getAttribute("aria-pressed"));
      old.replaceWith(replacement);
    }
  }

  getCardSize() {
    return 9;
  }

  static getStubConfig() {
    return { entity: "sensor.plant_care_status" };
  }

  _renderBase() {
    this.shadowRoot.innerHTML = `
      <style>${appStyles}</style>
      <ha-card class="ha-plus-detail-card">
        <div class="header ha-plus-card-header">
          <div class="picture ha-plus-avatar"><ha-icon icon="mdi:sprout"></ha-icon></div>
          <div><h2></h2><span class="status ha-plus-status"></span></div>
        </div>
        <p class="reason ha-plus-description"></p>
        <div class="stats ha-plus-stats"></div>
        <div class="ha-plus-card-actions">
          <button class="water primary ha-plus-feedback" type="button"><ha-icon icon="mdi:watering-can"></ha-icon>${this._t("mark_watered")}</button>
          <span class="message ha-plus-message" role="status" aria-live="polite"></span>
        </div>
      </ha-card>`;

    const stats = this.shadowRoot.querySelector(".stats");
    for (const [key, label, icon] of STAT_ROWS) {
      const button = document.createElement("button");
      button.className = "stat ha-plus-stat";
      button.type = "button";
      button.dataset.key = key;
      button.innerHTML = `<ha-icon icon="${icon}"></ha-icon><span><span class="ha-plus-stat-label">${label}</span><span class="stat-value ha-plus-stat-value">—</span></span>`;
      button.addEventListener("click", () => this._showMoreInfo(key));
      stats.append(button);
    }
    const header = this.shadowRoot.querySelector(".header");
    header.tabIndex = 0;
    header.setAttribute("role", "button");
    header.addEventListener("click", () => this._showEntity(this._config?.entity));
    header.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        this._showEntity(this._config?.entity);
      }
    });
    this.shadowRoot.querySelector(".water").addEventListener("click", () =>
      this._markWatered(),
    );
  }

  _update() {
    if (!this._hass || !this._config) return;
    const statusEntity = this._hass.states[this._config.entity];
    if (!statusEntity) {
      this.shadowRoot.querySelector("h2").textContent = this._t("plant_unavailable");
      this.shadowRoot.querySelector(".status").textContent = this._config.entity;
      this.shadowRoot.querySelector(".reason").textContent =
        this._t("select_an_ha_plant_care_status_sensor");
      this.shadowRoot.querySelector(".water").disabled = true;
      return;
    }

    this._statusEntity = statusEntity;
    this._related = statusEntity.attributes.related_entities || {};
    const linkedEntity = this._hass.states[statusEntity.attributes.linked_plant_entity];
    const name =
      this._config.name ||
      statusEntity.attributes.plant_name ||
      linkedEntity?.attributes.friendly_name ||
      statusEntity.attributes.friendly_name ||
      this._config.entity;

    this.shadowRoot.querySelector("h2").textContent = name;
    const status = this.shadowRoot.querySelector(".status");
    status.textContent = this._label(statusEntity.state);
    const tones = { ok: "success", approaching: "warning", check: "warning", needs_attention: "error", overdue: "error" };
    status.dataset.tone = tones[statusEntity.state] || "";
    this.shadowRoot.querySelector(".reason").textContent =
      statusEntity.attributes.reason || this._t("no_care_recommendation_available");
    this.shadowRoot.querySelector(".water").disabled = Boolean(this._watering);

    const picture = linkedEntity?.attributes.entity_picture;
    const pictureContainer = this.shadowRoot.querySelector(".picture");
    const currentImage = pictureContainer.querySelector("img");
    if (picture) {
      const image = currentImage || document.createElement("img");
      image.src = picture;
      image.alt = "";
      if (!currentImage) pictureContainer.replaceChildren(image);
    } else if (currentImage) {
      const icon = document.createElement("ha-icon");
      icon.icon = "mdi:sprout";
      pictureContainer.replaceChildren(icon);
    }

    for (const [key] of STAT_ROWS) {
      const entityId = this._related[key];
      const entity = entityId ? this._hass.states[entityId] : undefined;
      const row = this.shadowRoot.querySelector(`[data-key="${key}"]`);
      row.disabled = !entity;
      row.querySelector(".stat-value").textContent = this._formatState(entity, key);
    }
  }

  _formatState(entity, key) {
    const relative = relativeDate(entity, key, this._hass);
    if (relative) return relative;
    if (!entity) return this._t("not_available");
    return formatEntityState(this._hass, entity);
  }

  _label(value) {
    return this._t(`state_${value || "unknown"}`);
  }

  _showMoreInfo(key) {
    this._showEntity(this._related?.[key]);
  }

  _showEntity(entityId) {
    if (!entityId) return;
    showMoreInfo(this, entityId);
  }

  async _markWatered() {
    if (this._watering) return;
    this._watering = true;
    const button = this.shadowRoot.querySelector(".water");
    const message = this.shadowRoot.querySelector(".message");
    button.disabled = true;
    try {
      const name = this.shadowRoot.querySelector("h2").textContent;
      if (!await confirmWater(this, [name])) return;
      message.textContent = "";
      await this._hass.callService(DOMAIN, "water", { entity_id: this._config.entity });
      setActionState(button, { success: true });
      showToast(this, this._t("watering_recorded"));
      button.setAttribute("aria-label", this._t("watering_recorded"));
      button.innerHTML = '<ha-icon icon="mdi:check"></ha-icon>';
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error) {
      message.textContent = this._t("could_not_record_watering_please_try_again");
      console.error("HA+ Plant Care could not record watering", error);
    } finally {
      this._watering = false;
      setActionState(button);
      button.removeAttribute("aria-label");
      button.innerHTML = '<ha-icon icon="mdi:watering-can"></ha-icon>';
      button.append(document.createTextNode(this._t("mark_watered")));
      this._update();
      if (this._nativeReady) this._upgradeActions();
    }
  }

}

if (!customElements.get(CARD_TAG)) {
  customElements.define(CARD_TAG, PlantCarePlusCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === CARD_TAG)) {
  window.customCards.push({
    type: CARD_TAG,
    name: "HA+ Plant Care",
    description: t("plant_status_measurements_watering_schedule_and_care_action"),
  });
}

class PlantCarePlusDashboard extends PlantCarePlusCard {
  setConfig(config) {
    if (config.entities !== undefined && (!Array.isArray(config.entities) || config.entities.some((id) => typeof id !== "string" || !id.startsWith("sensor.")))) {
      throw new Error("entities must be a list of care-status sensor IDs");
    }
    this._config = { ...config };
    this._update();
  }

  static getStubConfig() { return {}; }

  _renderBase() {
    this._selected = new Set();
    this._items = new Map();
    this.shadowRoot.innerHTML = `<style>${appStyles}</style><div class="toolbar ha-plus-toolbar" aria-label="${this._t("plant_view")}"><button class="card-view" aria-pressed="true">${this._t("cards")}</button><button class="table-view" aria-pressed="false">${this._t("table")}</button><button class="water primary ha-plus-feedback" hidden>${this._t("mark_selected_watered_2")}</button><span class="message ha-plus-message" role="status" aria-live="polite"></span></div><div class="cards ha-plus-card-grid"></div><div class="table ha-plus-table" hidden tabindex="0" role="region" aria-label="${this._t("plants_table")}"><table><thead><tr><th><input type="checkbox" aria-label="${this._t("select_all_plants")}"></th><th scope="col">${this._t("plant")}</th><th scope="col">${this._t("status")}</th>${STAT_ROWS.map(([, label]) => `<th scope="col">${label}</th>`).join("")}</tr></thead><tbody></tbody></table></div><p class="empty" hidden>${this._t("no_plants_available")}</p>`;
    this.shadowRoot.querySelector(".card-view").onclick = () => this._setView(false);
    this.shadowRoot.querySelector(".table-view").onclick = () => this._setView(true);
    this.shadowRoot.querySelector("thead input").onchange = (event) => {
      this._selected = new Set(event.target.checked ? this._items.keys() : []);
      this._updateSelection();
    };
    this.shadowRoot.querySelector(".water").onclick = () => this._markSelected();
  }

  _setView(table) {
    this.shadowRoot.querySelector(".cards").hidden = table;
    this.shadowRoot.querySelector(".table").hidden = !table;
    this.shadowRoot.querySelector(".water").hidden = !table;
    this.shadowRoot.querySelector(".card-view").setAttribute("aria-pressed", String(!table));
    this.shadowRoot.querySelector(".table-view").setAttribute("aria-pressed", String(table));
  }

  _update() {
    if (!this._hass || !this._config) return;
    const ids = this._config.entities || Object.keys(this._hass.states).filter((id) => {
      const attrs = this._hass.states[id].attributes;
      return id.startsWith("sensor.") && attrs.plant_name && attrs.related_entities?.last_watered;
    }).sort();
    for (const [id, item] of this._items) {
      if (!ids.includes(id) || !this._hass.states[id]) {
        item.card.remove(); item.row.remove(); this._items.delete(id); this._selected.delete(id);
      }
    }
    for (const id of new Set(ids)) {
      const entity = this._hass.states[id];
      if (!entity) continue;
      let item = this._items.get(id);
      if (!item) {
        const card = document.createElement(CARD_TAG);
        card.setConfig({ entity: id });
        this.shadowRoot.querySelector(".cards").append(card);
        const row = document.createElement("tr");
        row.innerHTML = `<td><input type="checkbox"></td><th scope="row"><button class="name ha-plus-text-button"></button></th><td class="status ha-plus-status"></td>${STAT_ROWS.map(([key]) => `<td data-key="${key}"></td>`).join("")}`;
        row.querySelector("input").onchange = (event) => {
          if (event.target.checked) this._selected.add(id); else this._selected.delete(id);
          this._updateSelection();
        };
        row.querySelector(".name").onclick = () => this._showEntity(id);
        this.shadowRoot.querySelector("tbody").append(row);
        item = { card, row }; this._items.set(id, item);
      }
      item.card.hass = this._hass;
      const name = entity.attributes.plant_name || entity.attributes.friendly_name || id;
      item.row.querySelector(".name").textContent = name;
      item.row.querySelector("input").setAttribute("aria-label", this._t("select", { value1: name }));
      item.row.querySelector(".status").textContent = this._label(entity.state);
      for (const [key] of STAT_ROWS) {
        const related = this._hass.states[entity.attributes.related_entities?.[key]];
        item.row.querySelector(`[data-key="${key}"]`).textContent = this._formatState(related, key);
      }
    }
    this.shadowRoot.querySelector(".empty").hidden = this._items.size > 0;
    this._updateSelection();
  }

  _updateSelection() {
    for (const [id, { row }] of this._items) {
      const input = row.querySelector("input");
      input.checked = this._selected.has(id);
      input.disabled = Boolean(this._watering);
    }
    const all = this.shadowRoot.querySelector("thead input");
    all.checked = this._items.size > 0 && this._selected.size === this._items.size;
    all.indeterminate = this._selected.size > 0 && !all.checked;
    all.disabled = Boolean(this._watering) || !this._items.size;
    const button = this.shadowRoot.querySelector(".water");
    button.disabled = Boolean(this._watering) || !this._selected.size;
    if (!button.classList.contains("success")) button.textContent = this._t("mark_selected_watered", { value1: this._selected.size });
  }

  async _markSelected() {
    if (this._watering || !this._selected.size) return;
    this._watering = true;
    this._updateSelection();
    const ids = [...this._selected];
    const button = this.shadowRoot.querySelector(".water");
    const message = this.shadowRoot.querySelector(".message");
    try {
      const names = ids.map((id) => this._items.get(id).row.querySelector(".name").textContent);
      if (!await confirmWater(this, names)) return;
      message.textContent = "";
      // Individual calls let failures retain only the affected selections for retry.
      const failed = [];
      for (const id of ids) {
        try {
          await this._hass.callService(DOMAIN, "water", { entity_id: id });
          this._selected.delete(id);
        } catch { failed.push(id); }
      }
      if (failed.length) {
        message.textContent = this._t("of_plants_recorded_could_not_record_they_remain_selected_for_retry", { value1: ids.length - failed.length, value2: ids.length, value3: failed.length });
      } else {
        setActionState(button, { success: true });
      showToast(this, this._t("watering_recorded"));
        button.setAttribute("aria-label", this._t("watering_recorded_for_selected_plants"));
        button.innerHTML = '<ha-icon icon="mdi:check"></ha-icon>';
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    } finally {
      this._watering = false;
      setActionState(button);
      button.removeAttribute("aria-label");
      this._updateSelection();
      if (this._nativeReady) this._upgradeActions();
    }
  }
}

if (!customElements.get("plant-care-plus-dashboard")) {
  customElements.define("plant-care-plus-dashboard", PlantCarePlusDashboard);
}
if (!window.customCards.some((card) => card.type === "plant-care-plus-dashboard")) {
  window.customCards.push({ type: "plant-care-plus-dashboard", name: "HA+ Plant Care Dashboard", description: t("all_plants_with_card_and_table_views_and_bulk_watering") });
}
