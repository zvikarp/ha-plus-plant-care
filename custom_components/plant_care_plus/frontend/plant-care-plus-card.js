(() => {
  // node_modules/@ha-plus/ui/src/index.js
  /*! @ha-plus/ui v0.1.0 | MIT | Copyright (c) 2026 HA+ contributors | https://github.com/zvikarp/ha-plus-packages/blob/main/LICENSE */
  var themeStyles = `
  :host { display:block; color:var(--primary-text-color,#212121); font-family:var(--primary-font-family,var(--paper-font-body1_-_font-family,Roboto,sans-serif)); }
  *, *::before, *::after { box-sizing:border-box; }
  [hidden] { display:none !important; }
  a { color:var(--primary-color,#03a9f4); }
  ha-icon { flex-shrink:0; }
  button, input, select, textarea { font:inherit; }
  button { min-height:44px; padding:10px 16px; border:0; border-radius:var(--ha-button-border-radius,999px); background:var(--secondary-background-color,#f5f5f5); color:var(--primary-color,#03a9f4); cursor:pointer; font-weight:500; }
  button:hover { filter:brightness(.96); }
  button.primary { background:var(--primary-color,#03a9f4); color:var(--text-primary-color,#fff); }
  button.danger { color:var(--error-color,#db4437); }
  button:disabled { opacity:.5; cursor:default; }
  :is(button,input,select,textarea,a,summary,[tabindex]):focus-visible { outline:2px solid var(--primary-color,#03a9f4); outline-offset:3px; }
  .icon-button { display:grid; place-items:center; width:44px; height:44px; min-width:44px; padding:0; border-radius:50%; color:inherit; background:transparent; }
  .icon-button:hover { background:var(--secondary-background-color,#f5f5f5); }
  input:not([type=checkbox]):not([type=radio]), textarea { min-height:48px; border:1px solid var(--divider-color,#e0e0e0); border-radius:var(--ha-input-border-radius,14px); padding:10px 14px; color:var(--primary-text-color,#212121); background:var(--secondary-background-color,#f5f5f5); max-width:100%; }
  ha-card { display:block; background:var(--ha-card-background,var(--card-background-color,#fff)); color:var(--primary-text-color,#212121); border-radius:var(--ha-card-border-radius,12px); box-shadow:var(--ha-card-box-shadow,none); border:var(--ha-card-border-width,1px) solid var(--ha-card-border-color,var(--divider-color,#e0e0e0)); }
  .field { position:relative; min-width:0; }
  .field-label { display:block; margin-bottom:8px; color:var(--secondary-text-color,#727272); font-size:14px; }
  .combobox { display:flex; align-items:center; gap:8px; width:100%; justify-content:space-between; text-align:start; border:1px solid var(--divider-color,#e0e0e0); border-radius:14px; color:var(--primary-text-color,#212121); min-height:48px; padding:10px 14px; }
  .combobox span { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .listbox { position:absolute; z-index:10; inset-inline:0; top:100%; margin-top:4px; max-height:300px; overflow:auto; padding:6px; background:var(--card-background-color,#fff); border:1px solid var(--divider-color,#e0e0e0); border-radius:14px; box-shadow:var(--ha-card-box-shadow,0 4px 16px #0003); }
  .option { display:block; width:100%; text-align:start; border-radius:10px; background:transparent; color:var(--primary-text-color,#212121); white-space:normal; overflow-wrap:anywhere; }
  .option[aria-selected=true] { color:var(--primary-color,#03a9f4); background:var(--secondary-background-color,#f5f5f5); }
  .ha-plus-header { display:flex; align-items:center; gap:12px; padding:12px 16px; min-height:64px; background:var(--app-header-background-color,var(--primary-background-color,#fafafa)); color:var(--app-header-text-color,var(--primary-text-color,#212121)); }
  .ha-plus-header h1 { font-size:20px; font-weight:400; flex:1; margin:0; }
  .ha-plus-content { max-width:1000px; margin:auto; padding:24px; }
  .notice { padding:12px 16px; margin-bottom:16px; background:var(--secondary-background-color,#f5f5f5); border-radius:14px; overflow-wrap:anywhere; }
  .error { color:var(--error-color,#db4437); white-space:pre-wrap; }
  dialog { font:inherit; background:var(--ha-card-background,var(--card-background-color,#fff)); color:var(--primary-text-color,#212121); border:1px solid var(--divider-color,#e0e0e0); border-radius:var(--ha-dialog-border-radius,20px); padding:24px; width:420px; max-width:calc(100% - 32px); max-height:calc(100% - 32px); overflow:auto; }
  dialog::backdrop { background:#0008; }
  dialog h2 { margin:0 0 16px; font-size:1.3rem; }
  dialog p { white-space:pre-line; overflow-wrap:anywhere; }
  dialog form { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:12px; margin-top:24px; }
  @media(max-width:700px) { .ha-plus-content { padding:16px; } .ha-plus-header h1 { font-size:18px; } }
`;
  function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== void 0) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  var nextId = 0;
  function confirmDialog(host, { title, message, confirmLabel = "Confirm", cancelLabel = "Cancel" }) {
    const dialog = el("dialog");
    const id = `ha-plus-dialog-${++nextId}`;
    const heading = el("h2", title);
    heading.id = `${id}-title`;
    const description = el("p", message);
    description.id = `${id}-description`;
    dialog.setAttribute("aria-labelledby", heading.id);
    dialog.setAttribute("aria-describedby", description.id);
    const form = el("form");
    form.method = "dialog";
    const cancel = el("button", cancelLabel);
    cancel.type = "submit";
    cancel.value = "cancel";
    cancel.autofocus = true;
    const confirm = el("button", confirmLabel, "primary");
    confirm.type = "submit";
    confirm.value = "confirm";
    form.append(cancel, confirm);
    dialog.append(heading, description, form);
    host.shadowRoot.append(dialog);
    return new Promise((resolve, reject) => {
      dialog.addEventListener("close", () => {
        const confirmed = dialog.returnValue === "confirm";
        dialog.remove();
        resolve(confirmed);
      }, { once: true });
      try {
        dialog.showModal();
      } catch (error) {
        dialog.remove();
        reject(error);
      }
    });
  }

  // src/plant-care-plus-card.js
  var CARD_TAG = "plant-care-plus-card";
  var DOMAIN = "plant_care_plus";
  var STAT_ROWS = [
    ["last_watered", "Last watered", "mdi:water-check"],
    ["next_watering", "Next check", "mdi:calendar-clock"],
    ["days_since_watered", "Days since", "mdi:calendar-range"],
    ["moisture", "Moisture", "mdi:water-percent"],
    ["temperature", "Temperature", "mdi:thermometer"],
    ["humidity", "Humidity", "mdi:water-percent"],
    ["illuminance", "Illuminance", "mdi:brightness-5"],
    ["conductivity", "Conductivity", "mdi:flash"]
  ];
  var ACTION_STYLES = `
  .water { position: relative; overflow: hidden; justify-content: center; }
  .water.success { background: var(--success-color, #43a047); opacity: 1; cursor: default; }
  .water.success::after { content: ""; position: absolute; inset: 0; border-radius: inherit; background: #fff6; animation: splash 600ms ease-out forwards; }
  .water.success ha-icon { animation: check-in 350ms ease-out; }
  @keyframes splash { from { transform: scale(0); opacity: 1; } to { transform: scale(2); opacity: 0; } }
  @keyframes check-in { from { transform: scale(0.4); } to { transform: scale(1); } }
  @media (prefers-reduced-motion: reduce) { .water.success::after, .water.success ha-icon { animation: none; } .water.success::after { display: none; } }
`;
  function confirmWater(host, names) {
    return confirmDialog(host, {
      title: "Record watering?",
      message: `Mark ${names.length === 1 ? names[0] : `${names.length} plants`} as watered now?` + (names.length > 1 ? `

${names.join("\n")}` : ""),
      confirmLabel: "Mark watered"
    });
  }
  function relativeDate(entity, key, hass) {
    if (!entity || !["last_watered", "next_watering"].includes(key)) return null;
    const timestamp = Date.parse(entity.state);
    if (!Number.isFinite(timestamp)) return null;
    const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: hass.config?.time_zone, year: "numeric", month: "2-digit", day: "2-digit" });
    const day = (date) => {
      const parts = Object.fromEntries(formatter.formatToParts(date).map(({ type, value }) => [type, value]));
      return Date.UTC(+parts.year, +parts.month - 1, +parts.day) / 864e5;
    };
    const days = day(timestamp) - day(Date.now());
    if (days === 0) return "Today";
    const count = Math.abs(days);
    return days < 0 ? `${count} day${count === 1 ? "" : "s"} ago` : `In ${count} day${count === 1 ? "" : "s"}`;
  }
  var PlantCarePlusCard = class extends HTMLElement {
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
      <style>${themeStyles}${ACTION_STYLES}
        :host { container-type: inline-size; }
        ha-card { overflow: hidden; }
        .header {
          align-items: center;
          cursor: pointer;
          display: grid;
          gap: 16px;
          grid-template-columns: 64px minmax(0, 1fr);
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
        h2 { font-size: 1.25rem; line-height: 1.3; margin: 0 0 4px; overflow-wrap: anywhere; }
        .status { font-weight: 600; text-transform: capitalize; overflow-wrap: anywhere; }
        .status.ok { color: var(--success-color, #43a047); }
        .status.approaching, .status.check { color: var(--warning-color, #ff9800); }
        .status.needs_attention, .status.overdue { color: var(--error-color, #db4437); }
        .reason { color: var(--secondary-text-color); margin: 0; padding: 0 20px 16px; overflow-wrap: anywhere; }
        .stats {
          display: grid;
          gap: 1px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          background: var(--divider-color);
          border-block: 1px solid var(--divider-color);
        }
        .stat {
          border-radius: 0;
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
        .actions { display: flex; flex-wrap: wrap; gap: 8px; padding: 16px 20px 20px; }
        .water {
          align-items: center;
          background: var(--primary-color);
          border: 0;
          color: var(--text-primary-color, white);
          cursor: pointer;
          display: inline-flex;
          font: inherit;
          font-weight: 600;
          gap: 8px;
          min-height: 44px;
          max-width: 100%;
          padding: 0 18px;
        }
        .water:disabled { cursor: wait; opacity: 0.6; }
        .message { align-self: center; color: var(--secondary-text-color); font-size: 0.85rem; overflow-wrap: anywhere; }
        .header:focus-visible { outline: 2px solid var(--primary-color); outline-offset: -2px; }
        @container (max-width: 420px) {
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
        button.innerHTML = `<ha-icon icon="${icon}"></ha-icon><span><span class="stat-label">${label}</span><span class="stat-value">\u2014</span></span>`;
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
      this.shadowRoot.querySelector(".water").addEventListener(
        "click",
        () => this._markWatered()
      );
    }
    _update() {
      if (!this._hass || !this._config) return;
      const statusEntity = this._hass.states[this._config.entity];
      if (!statusEntity) {
        this.shadowRoot.querySelector("h2").textContent = "Plant unavailable";
        this.shadowRoot.querySelector(".status").textContent = this._config.entity;
        this.shadowRoot.querySelector(".reason").textContent = "Select an HA+ Plant Care status sensor.";
        this.shadowRoot.querySelector(".water").disabled = true;
        return;
      }
      this._statusEntity = statusEntity;
      this._related = statusEntity.attributes.related_entities || {};
      const linkedEntity = this._hass.states[statusEntity.attributes.linked_plant_entity];
      const name = this._config.name || statusEntity.attributes.plant_name || linkedEntity?.attributes.friendly_name || statusEntity.attributes.friendly_name || this._config.entity;
      this.shadowRoot.querySelector("h2").textContent = name;
      const status = this.shadowRoot.querySelector(".status");
      status.textContent = this._label(statusEntity.state);
      status.className = `status ${statusEntity.state}`;
      this.shadowRoot.querySelector(".reason").textContent = statusEntity.attributes.reason || "No care recommendation available.";
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
        const entity = entityId ? this._hass.states[entityId] : void 0;
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
          detail: { entityId }
        })
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
        await new Promise((resolve) => setTimeout(resolve, 3e3));
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
  };
  if (!customElements.get(CARD_TAG)) {
    customElements.define(CARD_TAG, PlantCarePlusCard);
  }
  window.customCards = window.customCards || [];
  if (!window.customCards.some((card) => card.type === CARD_TAG)) {
    window.customCards.push({
      type: CARD_TAG,
      name: "HA+ Plant Care",
      description: "Plant status, measurements, watering schedule, and care action."
    });
  }
  var PlantCarePlusDashboard = class extends PlantCarePlusCard {
    setConfig(config) {
      if (config.entities !== void 0 && (!Array.isArray(config.entities) || config.entities.some((id) => typeof id !== "string" || !id.startsWith("sensor.")))) {
        throw new Error("entities must be a list of care-status sensor IDs");
      }
      this._config = { ...config };
      this._update();
    }
    static getStubConfig() {
      return {};
    }
    _renderBase() {
      this._selected = /* @__PURE__ */ new Set();
      this._items = /* @__PURE__ */ new Map();
      this.shadowRoot.innerHTML = `<style>${themeStyles}${ACTION_STYLES}
      :host { display: block; }
      .toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
      .toolbar button[aria-pressed=true], .water { background: var(--primary-color); color: var(--text-primary-color, white); }
      .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap: 16px; }
      .table { overflow-x: auto; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 12px; }
      table { border-collapse: collapse; width: 100%; white-space: nowrap; }
      th, td { text-align: start; padding: 12px; border-bottom: 1px solid var(--divider-color); }
      input { width: 20px; height: 20px; accent-color: var(--primary-color); cursor: pointer; }
      .name { border: 0; padding: 4px; text-align: start; }
      .message { color: var(--secondary-text-color); }
      [hidden] { display: none !important; }
    </style><div class="toolbar" aria-label="Plant view"><button class="card-view" aria-pressed="true">Cards</button><button class="table-view" aria-pressed="false">Table</button><button class="water" hidden>Mark selected watered</button><span class="message" role="status" aria-live="polite"></span></div><div class="cards"></div><div class="table" hidden tabindex="0" role="region" aria-label="Plants table"><table><thead><tr><th><input type="checkbox" aria-label="Select all plants"></th><th scope="col">Plant</th><th scope="col">Status</th>${STAT_ROWS.map(([, label]) => `<th scope="col">${label}</th>`).join("")}</tr></thead><tbody></tbody></table></div><p class="empty" hidden>No plants available.</p>`;
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
          item.card.remove();
          item.row.remove();
          this._items.delete(id);
          this._selected.delete(id);
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
          row.innerHTML = `<td><input type="checkbox"></td><th scope="row"><button class="name"></button></th><td class="status"></td>${STAT_ROWS.map(([key]) => `<td data-key="${key}"></td>`).join("")}`;
          row.querySelector("input").onchange = (event) => {
            if (event.target.checked) this._selected.add(id);
            else this._selected.delete(id);
            this._updateSelection();
          };
          row.querySelector(".name").onclick = () => this._showEntity(id);
          this.shadowRoot.querySelector("tbody").append(row);
          item = { card, row };
          this._items.set(id, item);
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
        const failed = [];
        for (const id of ids) {
          try {
            await this._hass.callService(DOMAIN, "water", { entity_id: id });
            this._selected.delete(id);
          } catch {
            failed.push(id);
          }
        }
        if (failed.length) {
          message.textContent = `${ids.length - failed.length} of ${ids.length} plants recorded. Could not record ${failed.length}; they remain selected for retry.`;
        } else {
          button.classList.add("success");
          button.setAttribute("aria-label", "Watering recorded for selected plants");
          button.innerHTML = '<ha-icon icon="mdi:check"></ha-icon>';
          await new Promise((resolve) => setTimeout(resolve, 3e3));
        }
      } finally {
        this._watering = false;
        button.classList.remove("success");
        button.removeAttribute("aria-label");
        this._updateSelection();
      }
    }
  };
  if (!customElements.get("plant-care-plus-dashboard")) {
    customElements.define("plant-care-plus-dashboard", PlantCarePlusDashboard);
  }
  if (!window.customCards.some((card) => card.type === "plant-care-plus-dashboard")) {
    window.customCards.push({ type: "plant-care-plus-dashboard", name: "HA+ Plant Care Dashboard", description: "All plants with card and table views and bulk watering." });
  }
})();
