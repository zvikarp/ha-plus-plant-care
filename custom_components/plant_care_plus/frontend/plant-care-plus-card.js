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

class PlantCarePlusCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._renderBase();
  }

  setConfig(config) {
    if (!config?.entity || !config.entity.startsWith("sensor.")) {
      throw new Error("Plant Care Plus card requires a care-status sensor entity");
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
      <style>
        :host { display: block; }
        ha-card { overflow: hidden; }
        .header {
          align-items: center;
          cursor: pointer;
          display: grid;
          gap: 16px;
          grid-template-columns: 64px 1fr;
          padding: 20px 20px 12px;
        }
        .picture {
          align-items: center;
          background: var(--secondary-background-color);
          border-radius: 50%;
          display: flex;
          height: 64px;
          justify-content: center;
          overflow: hidden;
          width: 64px;
        }
        .picture img { height: 100%; object-fit: cover; width: 100%; }
        .picture ha-icon { color: var(--primary-color); --mdc-icon-size: 34px; }
        h2 { font-size: 1.25rem; line-height: 1.3; margin: 0 0 4px; }
        .status { font-weight: 600; text-transform: capitalize; }
        .status.ok { color: var(--success-color, #43a047); }
        .status.approaching, .status.check { color: var(--warning-color, #ff9800); }
        .status.needs_attention, .status.overdue { color: var(--error-color, #db4437); }
        .reason { color: var(--secondary-text-color); margin: 0; padding: 0 20px 16px; }
        .stats {
          display: grid;
          gap: 1px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          background: var(--divider-color);
          border-block: 1px solid var(--divider-color);
        }
        .stat {
          align-items: center;
          background: var(--card-background-color);
          border: 0;
          color: var(--primary-text-color);
          cursor: pointer;
          display: grid;
          font: inherit;
          gap: 10px;
          grid-template-columns: 24px minmax(0, 1fr);
          min-height: 64px;
          padding: 10px 14px;
          text-align: left;
        }
        .stat:hover { background: var(--secondary-background-color); }
        .stat ha-icon { color: var(--state-icon-color); }
        .stat-label { color: var(--secondary-text-color); display: block; font-size: 0.78rem; }
        .stat-value { display: block; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .actions { display: flex; gap: 8px; padding: 16px 20px 20px; }
        .water {
          align-items: center;
          background: var(--primary-color);
          border: 0;
          border-radius: 20px;
          color: var(--text-primary-color, white);
          cursor: pointer;
          display: inline-flex;
          font: inherit;
          font-weight: 600;
          gap: 8px;
          min-height: 40px;
          padding: 0 18px;
        }
        .water:disabled { cursor: wait; opacity: 0.6; }
        .message { align-self: center; color: var(--secondary-text-color); font-size: 0.85rem; }
        @media (max-width: 420px) {
          .stats { grid-template-columns: 1fr; }
        }
      </style>
      <ha-card>
        <div class="header">
          <div class="picture"><ha-icon icon="mdi:sprout"></ha-icon></div>
          <div><h2></h2><span class="status"></span></div>
        </div>
        <p class="reason"></p>
        <div class="stats"></div>
        <div class="actions">
          <button class="water" type="button"><ha-icon icon="mdi:watering-can"></ha-icon>Mark watered</button>
          <span class="message" role="status" aria-live="polite"></span>
        </div>
      </ha-card>`;

    const stats = this.shadowRoot.querySelector(".stats");
    for (const [key, label, icon] of STAT_ROWS) {
      const button = document.createElement("button");
      button.className = "stat";
      button.type = "button";
      button.dataset.key = key;
      button.innerHTML = `<ha-icon icon="${icon}"></ha-icon><span><span class="stat-label">${label}</span><span class="stat-value">—</span></span>`;
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
        "Select an HA Plus Plant Care status sensor.";
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
    status.className = `status ${statusEntity.state}`;
    this.shadowRoot.querySelector(".reason").textContent =
      statusEntity.attributes.reason || "No care recommendation available.";
    this.shadowRoot.querySelector(".water").disabled = false;

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
      row.querySelector(".stat-value").textContent = this._formatState(entity);
    }
  }

  _formatState(entity) {
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
    const name = this.shadowRoot.querySelector("h2").textContent;
    if (!window.confirm(`Mark ${name} as watered now?`)) return;
    const button = this.shadowRoot.querySelector(".water");
    const message = this.shadowRoot.querySelector(".message");
    button.disabled = true;
    message.textContent = "Recording…";
    try {
      await this._hass.callService(DOMAIN, "water", {
        entity_id: this._config.entity,
      });
      message.textContent = "Watering recorded";
    } catch (error) {
      message.textContent = "Could not record watering";
      console.error("Plant Care Plus could not record watering", error);
    } finally {
      button.disabled = false;
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
    name: "Plant Care Plus",
    description: "Plant status, measurements, watering schedule, and care action.",
  });
}
