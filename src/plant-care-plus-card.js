import { appStyles, confirmDialog } from "@ha-plus/ui";

const CARD_TAG = "plant-care-plus-card";
const DOMAIN = "plant_care_plus";

const STAT_ROWS = [
  ["last_watered", "Last watered", "mdi:water-check"],
  ["next_watering", "Next check", "mdi:calendar-clock"],
  ["days_since_watered", "Days since", "mdi:calendar-range"],
  ["moisture", "Moisture", "mdi:water-percent"],
  ["temperature", "Temperature", "mdi:thermometer"],
  ["humidity", "Humidity", "mdi:water-percent"],
  ["illuminance", "Illuminance", "mdi:brightness-5"],
  ["conductivity", "Conductivity", "mdi:flash"],
];

function confirmWater(host, names) {
  return confirmDialog(host, {
    title: "Record watering?",
    message: `Mark ${names.length === 1 ? names[0] : `${names.length} plants`} as watered now?` + (names.length > 1 ? `\n\n${names.join("\n")}` : ""),
    confirmLabel: "Mark watered",
  });
}

function relativeDate(entity, key, hass) {
  if (!entity || !["last_watered", "next_watering"].includes(key)) return null;
  const timestamp = Date.parse(entity.state);
  if (!Number.isFinite(timestamp)) return null;
  // Compare calendar dates in Home Assistant's timezone, including DST boundaries.
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: hass.config?.time_zone, year: "numeric", month: "2-digit", day: "2-digit" });
  const day = (date) => {
    const parts = Object.fromEntries(formatter.formatToParts(date).map(({ type, value }) => [type, value]));
    return Date.UTC(+parts.year, +parts.month - 1, +parts.day) / 86400000;
  };
  const days = day(timestamp) - day(Date.now());
  if (days === 0) return "Today";
  const count = Math.abs(days);
  return days < 0 ? `${count} day${count === 1 ? "" : "s"} ago` : `In ${count} day${count === 1 ? "" : "s"}`;
}

class PlantCarePlusCard extends HTMLElement {
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
    this._update();
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
          <button class="water primary ha-plus-feedback" type="button"><ha-icon icon="mdi:watering-can"></ha-icon>Mark watered</button>
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
      this.shadowRoot.querySelector("h2").textContent = "Plant unavailable";
      this.shadowRoot.querySelector(".status").textContent = this._config.entity;
      this.shadowRoot.querySelector(".reason").textContent =
        "Select an HA+ Plant Care status sensor.";
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
      statusEntity.attributes.reason || "No care recommendation available.";
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
    if (!entity) return "Not available";
    if (typeof this._hass.formatEntityState === "function") {
      return this._hass.formatEntityState(entity);
    }
    const unit = entity.attributes.unit_of_measurement;
    return unit ? `${entity.state} ${unit}` : this._label(entity.state);
  }

  _label(value) {
    return String(value || "unknown").replaceAll("_", " ");
  }

  _showMoreInfo(key) {
    this._showEntity(this._related?.[key]);
  }

  _showEntity(entityId) {
    if (!entityId) return;
    this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        bubbles: true,
        composed: true,
        detail: { entityId },
      }),
    );
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
      button.classList.add("success");
      button.setAttribute("aria-label", "Watering recorded");
      button.innerHTML = '<ha-icon icon="mdi:check"></ha-icon>';
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error) {
      message.textContent = "Could not record watering. Please try again.";
      console.error("HA+ Plant Care could not record watering", error);
    } finally {
      this._watering = false;
      button.classList.remove("success");
      button.removeAttribute("aria-label");
      button.innerHTML = '<ha-icon icon="mdi:watering-can"></ha-icon>Mark watered';
      this._update();
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
    description: "Plant status, measurements, watering schedule, and care action.",
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
    this.shadowRoot.innerHTML = `<style>${appStyles}</style><div class="toolbar ha-plus-toolbar" aria-label="Plant view"><button class="card-view" aria-pressed="true">Cards</button><button class="table-view" aria-pressed="false">Table</button><button class="water primary ha-plus-feedback" hidden>Mark selected watered</button><span class="message ha-plus-message" role="status" aria-live="polite"></span></div><div class="cards ha-plus-card-grid"></div><div class="table ha-plus-table" hidden tabindex="0" role="region" aria-label="Plants table"><table><thead><tr><th><input type="checkbox" aria-label="Select all plants"></th><th scope="col">Plant</th><th scope="col">Status</th>${STAT_ROWS.map(([, label]) => `<th scope="col">${label}</th>`).join("")}</tr></thead><tbody></tbody></table></div><p class="empty" hidden>No plants available.</p>`;
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
      item.row.querySelector("input").setAttribute("aria-label", `Select ${name}`);
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
    if (!button.classList.contains("success")) button.textContent = `Mark selected watered (${this._selected.size})`;
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
        message.textContent = `${ids.length - failed.length} of ${ids.length} plants recorded. Could not record ${failed.length}; they remain selected for retry.`;
      } else {
        button.classList.add("success");
        button.setAttribute("aria-label", "Watering recorded for selected plants");
        button.innerHTML = '<ha-icon icon="mdi:check"></ha-icon>';
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    } finally {
      this._watering = false;
      button.classList.remove("success");
      button.removeAttribute("aria-label");
      this._updateSelection();
    }
  }
}

if (!customElements.get("plant-care-plus-dashboard")) {
  customElements.define("plant-care-plus-dashboard", PlantCarePlusDashboard);
}
if (!window.customCards.some((card) => card.type === "plant-care-plus-dashboard")) {
  window.customCards.push({ type: "plant-care-plus-dashboard", name: "HA+ Plant Care Dashboard", description: "All plants with card and table views and bulk watering." });
}
