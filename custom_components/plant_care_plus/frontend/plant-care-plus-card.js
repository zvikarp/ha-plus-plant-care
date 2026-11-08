(() => {
  // src/translations/en.json
  var en_default = {
    last_watered: "Last watered",
    next_check: "Next check",
    days_since: "Days since",
    moisture: "Moisture",
    temperature: "Temperature",
    humidity: "Humidity",
    illuminance: "Illuminance",
    conductivity: "Conductivity",
    record_watering: "Record watering?",
    plant_unavailable: "Plant unavailable",
    select_an_ha_plant_care_status_sensor: "Select an HA+ Plant Care status sensor.",
    no_care_recommendation_available: "No care recommendation available.",
    not_available: "Not available",
    watering_recorded: "Watering recorded",
    could_not_record_watering_please_try_again: "Could not record watering. Please try again.",
    plant_status_measurements_watering_schedule_and_care_action: "Plant status, measurements, watering schedule, and care action.",
    select: "Select {value1}",
    mark_selected_watered: "Mark selected watered ({value1})",
    of_plants_recorded_could_not_record_they_remain_selected_for_retry: "{value1} of {value2} plants recorded. Could not record {value3}; they remain selected for retry.",
    watering_recorded_for_selected_plants: "Watering recorded for selected plants",
    all_plants_with_card_and_table_views_and_bulk_watering: "All plants with card and table views and bulk watering.",
    mark_watered: "Mark watered",
    cards: "Cards",
    table: "Table",
    mark_selected_watered_2: "Mark selected watered",
    plant: "Plant",
    status: "Status",
    no_plants_available: "No plants available.",
    confirm_water_one: "Mark {name} as watered now?",
    confirm_water_many: "Mark {count} plants as watered now?",
    plant_view: "Plant view",
    plants_table: "Plants table",
    select_all_plants: "Select all plants",
    state_ok: "Ok",
    state_approaching: "Approaching",
    state_check: "Check",
    state_needs_attention: "Needs attention",
    state_overdue: "Overdue",
    state_unknown: "Unknown",
    state_unavailable: "Unavailable",
    integration_settings: "Integration settings"
  };

  // node_modules/@ha-plus/ui/src/dom.js
  function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== void 0) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function icon(name) {
    const node = el("ha-icon");
    node.setAttribute("icon", name);
    return node;
  }
  function button(text, handler, disabled = false, className) {
    const registry = document.defaultView?.customElements;
    const native = registry?.get("ha-button") ? "ha-button" : registry?.get("mwc-button") ? "mwc-button" : "button";
    const node = el(native, text, className);
    node.type = "button";
    node.disabled = disabled;
    if (native === "ha-button") node.appearance = className?.split(" ").includes("primary") ? "accent" : "plain";
    if (native === "mwc-button") node.raised = Boolean(className?.split(" ").includes("primary"));
    node.addEventListener("click", () => {
      if (!node.disabled) handler();
    });
    return node;
  }

  // node_modules/@ha-plus/ui/src/native.js
  function actionButton(label, handler, disabled = false, appearance = "plain") {
    const modern = Boolean(customElements.get("ha-button"));
    const node = el(modern ? "ha-button" : "mwc-button", label);
    node.type = "button";
    node.disabled = disabled;
    if (modern) {
      node.appearance = appearance === "danger" ? "plain" : appearance;
      node.variant = appearance === "danger" ? "danger" : "brand";
    } else {
      node.raised = appearance === "accent";
      if (appearance === "danger") node.classList.add("destructive");
    }
    node.addEventListener("click", () => {
      if (!node.disabled) handler();
    });
    return node;
  }
  function iconButton(label, name, handler, disabled = false) {
    const node = el("ha-icon-button");
    node.label = label;
    node.disabled = disabled;
    node.append(icon(name));
    node.addEventListener("click", () => {
      if (!node.disabled) handler();
    });
    return node;
  }
  async function focusControl(control) {
    if (!control) return;
    await control.updateComplete;
    if (!control.isConnected) return;
    const inner = control.shadowRoot?.querySelector(
      "ha-selector, ha-selector-select, ha-select, ha-picker-field, ha-combo-box, ha-input, ha-textfield, input, textarea, button, [tabindex='0']"
    );
    if (inner) return focusControl(inner);
    control.focus?.();
  }

  // node_modules/@ha-plus/ui/src/styles.js
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
  .ha-plus-header { display:flex; align-items:center; gap:12px; padding:4px 16px; min-height:var(--header-height,56px); background:var(--app-header-background-color,var(--primary-background-color,#fafafa)); color:var(--app-header-text-color,var(--primary-text-color,#212121)); }
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
  var nativeStyles = `
  .ha-plus-header-heading { flex: 1; min-width: 0; }
  .ha-plus-header-heading h1 { overflow-wrap: anywhere; }
  .ha-plus-header-heading p { margin: 4px 0 0; font-size: 12px; }
  .ha-plus-dialog-message { white-space: pre-line; overflow-wrap: anywhere; padding: 8px 24px; }
  .ha-plus-dialog-actions { display: flex; flex-wrap: wrap; justify-content: end; gap: 8px; }
  ha-alert.notice { padding: 0; background: transparent; }
  ha-form.field { min-width: 0; }
  .ha-plus-header { min-height: var(--header-height, 56px); border-bottom: 1px solid var(--divider-color, #e0e0e0); }
  ha-dialog { --mdc-dialog-min-width: min(420px, calc(100vw - 32px)); --mdc-dialog-max-width: 560px; }
`;
  var appStyles = `${themeStyles}${nativeStyles}
  :host {
    container-type: inline-size;
  }

  h2 {
    font-size: 20px;
    font-weight: 500;
    margin: 0 0 16px;
  }

  h3 {
    font-size: 16px;
    margin: 0;
  }

  p {
    line-height: 1.5;
  }

  section {
    margin-bottom: 24px;
  }

  details {
    margin-top: 16px;
  }

  summary {
    cursor: pointer;
    padding: 8px 0;
  }

  .ha-plus-muted,
  .ha-plus-message {
    color: var(--secondary-text-color, #727272);
    font-size: 14px;
    overflow-wrap: anywhere;
  }

  .ha-plus-message {
    align-self: center;
  }

  .ha-plus-padded-card {
    padding: 20px;
    margin-bottom: 20px;
  }

  .ha-plus-row,
  .ha-plus-chips,
  .ha-plus-card-actions,
  .ha-plus-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .ha-plus-row h3 {
    flex: 1;
  }

  .ha-plus-chips {
    margin-top: 12px;
  }

  .ha-plus-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 100%;
    padding: 7px 12px;
    border-radius: 999px;
    background: var(--secondary-background-color, #f5f5f5);
    border: 1px solid var(--divider-color, #e0e0e0);
    font-size: 13px;
    overflow-wrap: anywhere;
  }

  .ha-plus-chip.active {
    color: var(--primary-color, #03a9f4);
    background: var(--primary-color-light, var(--secondary-background-color, #f5f5f5));
    border-color: var(--primary-color, #03a9f4);
  }

  .ha-plus-chip ha-icon {
    --mdc-icon-size: 18px;
  }

  .ha-plus-form-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
    align-items: end;
    gap: 12px;
  }

  .ha-plus-group {
    border-inline-start: 4px solid var(--divider-color, #e0e0e0);
  }

  .ha-plus-group.active {
    border-inline-start-color: var(--primary-color, #03a9f4);
  }

  .ha-plus-value {
    margin: 12px 0 4px;
    font-size: 20px;
    font-weight: 500;
  }

  .ha-plus-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
    gap: 16px;
  }

  .ha-plus-card-grid > ha-card {
    margin: 0;
  }

  .ha-plus-detail-row {
    padding: 12px 0;
    border-bottom: 1px solid var(--divider-color, #e0e0e0);
    overflow-wrap: anywhere;
  }

  .ha-plus-detail-row:last-child {
    border: 0;
  }

  .ha-plus-create {
    margin: 16px 0;
  }

  .ha-plus-create form {
    display: flex;
    align-items: end;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 12px;
  }

  .ha-plus-compact-content {
    padding: 16px;
  }

  .ha-plus-compact .ha-plus-form-grid {
    grid-template-columns: 1fr;
  }

  .ha-plus-compact .ha-plus-card-grid {
    display: block;
  }

  .ha-plus-compact .ha-plus-group {
    margin-bottom: 12px;
    padding: 12px;
  }

  .ha-plus-detail-card {
    overflow: hidden;
  }

  .ha-plus-card-header {
    display: grid;
    align-items: center;
    cursor: pointer;
    gap: 16px;
    grid-template-columns: 64px minmax(0, 1fr);
    padding: 20px 20px 12px;
  }

  .ha-plus-card-header h2 {
    line-height: 1.3;
    margin-bottom: 4px;
    overflow-wrap: anywhere;
  }

  .ha-plus-card-header:focus-visible {
    outline-offset: -2px;
  }

  .ha-plus-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--secondary-background-color, #f5f5f5);
    border-radius: 50%;
    height: 64px;
    width: 64px;
    overflow: hidden;
  }

  .ha-plus-avatar img {
    height: 100%;
    width: 100%;
    object-fit: cover;
  }

  .ha-plus-avatar ha-icon {
    color: var(--primary-color, #03a9f4);
    --mdc-icon-size: 34px;
  }

  .ha-plus-status {
    font-weight: 500;
    text-transform: capitalize;
    overflow-wrap: anywhere;
  }

  [data-tone=success] {
    color: var(--success-color, #43a047);
  }

  [data-tone=warning] {
    color: var(--warning-color, #ff9800);
  }

  [data-tone=error] {
    color: var(--error-color, #db4437);
  }

  .ha-plus-description {
    color: var(--secondary-text-color, #727272);
    margin: 0;
    padding: 0 20px 16px;
    overflow-wrap: anywhere;
  }

  .ha-plus-stats {
    display: grid;
    gap: 1px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    background: var(--divider-color, #e0e0e0);
    border-block: 1px solid var(--divider-color, #e0e0e0);
  }

  .ha-plus-stat {
    display: grid;
    align-items: center;
    grid-template-columns: 24px minmax(0, 1fr);
    gap: 10px;
    min-height: 64px;
    padding: 10px 14px;
    border: 0;
    border-radius: 0;
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color, #212121);
    text-align: start;
  }

  .ha-plus-stat:hover {
    background: var(--secondary-background-color, #f5f5f5);
  }

  .ha-plus-stat ha-icon {
    color: var(--state-icon-color, #44739e);
  }

  .ha-plus-stat-label {
    color: var(--secondary-text-color, #727272);
    display: block;
    font-size: 0.78rem;
  }

  .ha-plus-stat-value {
    display: block;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ha-plus-card-actions {
    padding: 16px 20px 20px;
  }

  .ha-plus-feedback {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    max-width: 100%;
    position: relative;
    overflow: hidden;
  }

  button.ha-plus-feedback.success {
    background: var(--success-color, #43a047);
    opacity: 1;
    cursor: default;
  }

  .ha-plus-feedback.success::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: #fff6;
    animation: ha-plus-splash 600ms ease-out forwards;
  }

  .ha-plus-feedback.success ha-icon {
    animation: ha-plus-check-in 350ms ease-out;
  }

  .ha-plus-toolbar {
    gap: 12px;
    margin-bottom: 16px;
  }

  .ha-plus-toolbar button[aria-pressed=true] {
    background: var(--primary-color, #03a9f4);
    color: var(--text-primary-color, #fff);
  }

  .ha-plus-table {
    overflow-x: auto;
    background: var(--card-background-color, #fff);
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: var(--ha-card-border-radius, 12px);
  }

  .ha-plus-table table {
    border-collapse: collapse;
    width: 100%;
    white-space: nowrap;
  }

  .ha-plus-table th,
  .ha-plus-table td {
    text-align: start;
    padding: 12px;
    border-bottom: 1px solid var(--divider-color, #e0e0e0);
  }

  .ha-plus-table input[type=checkbox] {
    width: 20px;
    height: 20px;
    accent-color: var(--primary-color, #03a9f4);
    cursor: pointer;
  }

  .ha-plus-text-button {
    background: transparent;
    border: 0;
    padding: 4px;
    text-align: start;
  }

  @keyframes ha-plus-splash {
    from { transform: scale(0); opacity: 1; }
    to { transform: scale(2); opacity: 0; }
  }

  @keyframes ha-plus-check-in {
    from { transform: scale(0.4); }
    to { transform: scale(1); }
  }

  @media (max-width: 700px) {
    .ha-plus-form-grid {
      grid-template-columns: 1fr 1fr;
    }

    .ha-plus-form-grid .field:first-child,
    .ha-plus-form-grid .primary {
      grid-column: 1 / -1;
    }
  }

  @container (max-width: 420px) {
    .ha-plus-stats {
      grid-template-columns: 1fr;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ha-plus-feedback.success::after,
    .ha-plus-feedback.success ha-icon {
      animation: none;
    }

    .ha-plus-feedback.success::after {
      display: none;
    }
  }
`;

  // node_modules/@ha-plus/ui/src/preferences.js
  function haContext() {
    if (typeof window === "undefined") return void 0;
    try {
      return window.parent?.document.querySelector("home-assistant")?.hass || window.document.querySelector("home-assistant")?.hass;
    } catch {
      return void 0;
    }
  }
  function preferences(hass = haContext()) {
    const locale = hass?.locale || {};
    const language = locale.language || hass?.language || "en";
    const numberLocales = { comma_decimal: "en-US", decimal_comma: "de-DE", space_comma: "sv-SE" };
    const numberLanguage = numberLocales[locale.number_format] || (locale.number_format === "system" && typeof navigator !== "undefined" ? navigator.language : language);
    const direction = hass?.translationMetadata?.translations?.[language]?.isRTL || /^(ar|fa|he|ur)(-|$)/i.test(language) ? "rtl" : "ltr";
    const dateLocales = { DMY: "en-GB", MDY: "en-US", YMD: "sv-SE" };
    const dateLanguage = dateLocales[locale.date_format] || (locale.date_format === "system" && typeof navigator !== "undefined" ? navigator.language : language);
    const timeLanguage = locale.time_format === "system" && typeof navigator !== "undefined" ? navigator.language : language;
    const languageHour12 = new Intl.DateTimeFormat(timeLanguage, { hour: "numeric" }).resolvedOptions().hour12;
    return {
      dateLanguage,
      language,
      direction,
      numberLanguage,
      useGrouping: locale.number_format !== "none",
      timeZone: locale.time_zone === "local" ? Intl.DateTimeFormat().resolvedOptions().timeZone : hass?.config?.time_zone,
      hour12: ["12", "am_pm"].includes(locale.time_format) ? true : ["24", "twenty_four"].includes(locale.time_format) ? false : languageHour12,
      unitSystem: { ...hass?.config?.unit_system }
    };
  }
  function applyPreferences(host, hass) {
    const value = preferences(hass);
    if (host.getAttribute("dir") !== value.direction) host.setAttribute("dir", value.direction);
    if (host.getAttribute("lang") !== value.language) host.setAttribute("lang", value.language);
    return value;
  }
  function formatNumber(hass, value, options = {}) {
    const settings = preferences(hass);
    return new Intl.NumberFormat(settings.numberLanguage, { useGrouping: settings.useGrouping, ...options }).format(value);
  }
  function formatEntityState(hass, entity) {
    if (!entity) return hass?.localize?.("state.default.unavailable") || "Unavailable";
    if (typeof hass?.formatEntityState === "function") return hass.formatEntityState(entity);
    if (["unknown", "unavailable"].includes(entity.state)) {
      return hass?.localize?.(`state.default.${entity.state}`) || entity.state;
    }
    const number = entity.state === "" ? NaN : Number(entity.state);
    const precision = entity.attributes?.suggested_display_precision;
    const value = Number.isFinite(number) ? formatNumber(
      hass,
      number,
      Number.isInteger(precision) && precision >= 0 && precision <= 20 ? { minimumFractionDigits: precision, maximumFractionDigits: precision } : {}
    ) : entity.state;
    const unit = entity.attributes?.unit_of_measurement;
    return unit ? `${value}\xA0${unit}` : String(value);
  }
  function relativeCalendarDate(hass, value, now = Date.now()) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return void 0;
    const settings = preferences(hass);
    const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: settings.timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
    const day = (value2) => {
      const parts = Object.fromEntries(formatter.formatToParts(value2).map(({ type, value: value3 }) => [type, value3]));
      return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)) / 864e5;
    };
    const days = day(date) - day(new Date(now));
    if (days === 0) return new Intl.RelativeTimeFormat(settings.language, { numeric: "auto" }).format(0, "day");
    return new Intl.RelativeTimeFormat(settings.language, { numeric: "always" }).format(days, "day");
  }

  // node_modules/@ha-plus/ui/src/translations/en.json
  var en_default2 = {
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    refresh: "Refresh",
    loading: "Loading\u2026",
    retry: "Retry",
    settings: "Settings",
    yes: "Yes",
    no: "No",
    apply: "Apply",
    confirm: "Confirm",
    more_actions: "More actions",
    dashboard_load_failed: "Home Assistant's dashboard controls could not load. Reload and try again.",
    controls_load_failed: "Home Assistant's to-do controls could not load. Reload and try again.",
    component_load_failed: "Home Assistant could not load {component}. Reload and try again."
  };

  // node_modules/@ha-plus/ui/src/localize.js
  var nativeKeys = {
    save: "ui.common.save",
    cancel: "ui.common.cancel",
    close: "ui.common.close",
    delete: "ui.common.delete",
    edit: "ui.common.edit",
    add: "ui.common.add",
    refresh: "ui.common.refresh",
    loading: "ui.common.loading",
    retry: "ui.common.retry",
    yes: "ui.common.yes",
    no: "ui.common.no",
    apply: "ui.common.apply"
  };
  function localize(hass, messages, key, values = {}) {
    const shortKey = key.replace(/^common\./, "");
    const nativeKey = nativeKeys[shortKey];
    const native = nativeKey && hass?.localize?.(nativeKey);
    const message = native && native !== nativeKey ? native : messages[key] || en_default2[shortKey] || key;
    return String(message).replace(/\{([\w]+)\}/g, (match, name) => {
      if (!Object.hasOwn(values, name)) return match;
      return typeof values[name] === "number" ? formatNumber(hass, values[name]) : String(values[name]);
    });
  }

  // node_modules/@ha-plus/ui/src/loader.js
  var nativeComponents;
  async function loadNativeComponents(host) {
    const required = ["ha-form", "ha-checkbox", "ha-dialog", "ha-icon-button"];
    if (required.every((name) => customElements.get(name))) return;
    if (!nativeComponents) {
      nativeComponents = (async () => {
        if (!window.loadCardHelpers) {
          let resolver = host;
          while (resolver && resolver.localName !== "partial-panel-resolver") {
            resolver = resolver.parentElement || resolver.getRootNode().host;
          }
          const dashboard = Object.values(resolver?.routerOptions?.routes || {}).find((route) => route.tag === "ha-panel-lovelace");
          if (!dashboard?.load) {
            throw new Error(localize(host._hass, en_default2, "dashboard_load_failed"));
          }
          await dashboard.load();
        }
        const helpers = await window.loadCardHelpers();
        const entities = helpers.createCardElement({ type: "entities", entities: [] });
        await entities.constructor.getConfigElement();
        helpers.createCardElement({ type: "todo-list", entity: "todo.ha_plus_ui" });
        let loadingTimeout;
        try {
          await Promise.race([
            customElements.whenDefined("hui-todo-list-card"),
            new Promise((_, reject) => {
              loadingTimeout = setTimeout(() => reject(new Error(localize(host._hass, en_default2, "controls_load_failed"))), 15e3);
            })
          ]);
        } finally {
          clearTimeout(loadingTimeout);
        }
        for (const name of required) {
          if (!customElements.get(name)) {
            throw new Error(localize(host._hass, en_default2, "component_load_failed", { component: name }));
          }
        }
      })().catch((error) => {
        nativeComponents = void 0;
        throw error;
      });
    }
    await nativeComponents;
  }

  // node_modules/@ha-plus/ui/src/ha-actions.js
  function showMoreInfo(host, entityId) {
    if (!/^[a-z_]+\.[a-z0-9_]+$/.test(entityId || "")) return false;
    const root = host || (() => {
      try {
        return window.parent.document.querySelector("home-assistant");
      } catch {
        return void 0;
      }
    })();
    if (!root) return false;
    const Event = root.ownerDocument.defaultView.CustomEvent;
    root.dispatchEvent(new Event("hass-more-info", { bubbles: true, composed: true, detail: { entityId } }));
    return true;
  }
  function integrationUrl(domain, add = false) {
    if (!/^[a-z0-9_]+$/.test(domain)) throw new TypeError("Invalid integration domain");
    return add ? `/config/integrations/dashboard/add?domain=${domain}` : `/config/integrations/integration/${domain}`;
  }
  function showToast(host, message) {
    if (!host) {
      try {
        host = window.parent.document.querySelector("home-assistant");
      } catch {
        return false;
      }
    }
    if (!host) return false;
    const Event = host.ownerDocument.defaultView.CustomEvent;
    host.dispatchEvent(new Event("hass-notification", { bubbles: true, composed: true, detail: { message } }));
    return true;
  }
  function setActionState(control, { busy = false, success = false } = {}) {
    control.disabled = busy || success;
    control.loading = busy;
    control.classList.toggle("success", success);
    if (control.localName === "ha-button") control.variant = success ? "success" : "brand";
    control.setAttribute("aria-busy", String(busy));
  }
  function navigate(host, path) {
    if (!path.startsWith("/") || path.startsWith("//")) throw new TypeError("Navigation must stay within Home Assistant");
    const view = host?.ownerDocument.defaultView || window.parent;
    view.history.pushState(null, "", path);
    view.dispatchEvent(new view.CustomEvent("location-changed", { detail: { replace: false } }));
  }

  // node_modules/@ha-plus/ui/src/index.js
  /*! @ha-plus/ui v0.4.0-rc.4 | MIT | Copyright (c) 2026 HA+ contributors | https://github.com/zvikarp/ha-plus-packages/blob/main/LICENSE */
  var nextId = 0;
  function confirmDialog(host, { title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", returnFocus = host.shadowRoot.activeElement }) {
    if (document.defaultView?.customElements.get("ha-dialog")) {
      return nativeConfirmation(host, { title, message, confirmLabel, cancelLabel, returnFocus });
    }
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
        Promise.resolve().then(() => focusControl(returnFocus));
      }, { once: true });
      try {
        dialog.showModal();
      } catch (error) {
        dialog.remove();
        reject(error);
      }
    });
  }
  function nativeConfirmation(host, { title, message, confirmLabel, cancelLabel, returnFocus }) {
    const dialog = el("ha-dialog");
    const modern = "headerTitle" in dialog;
    dialog.heading = title;
    dialog.headerTitle = title;
    dialog.setAttribute("header-title", title);
    const content = el("p", message, "ha-plus-dialog-message");
    dialog.append(content);
    return new Promise((resolve) => {
      let settled = false;
      let response = false;
      let closing = false;
      const finish = (confirmed) => {
        if (settled) return;
        settled = true;
        observer.disconnect();
        dialog.remove();
        resolve(confirmed);
        host.ownerDocument.defaultView.requestAnimationFrame(() => focusControl(returnFocus));
      };
      const close = (confirmed) => {
        if (closing || settled) return;
        closing = true;
        response = confirmed;
        cancel.disabled = true;
        confirm.disabled = true;
        dialog.open = false;
      };
      const observer = new host.ownerDocument.defaultView.MutationObserver(() => {
        if (!host.shadowRoot.contains(dialog) || connected && !host.isConnected) finish(false);
      });
      const connected = host.isConnected;
      observer.observe(host.shadowRoot, { childList: true });
      if (connected) observer.observe(host.ownerDocument, { childList: true, subtree: true });
      const cancel = button(cancelLabel, () => close(false));
      cancel.setAttribute("autofocus", "");
      const confirm = button(confirmLabel, () => close(true), false, "primary");
      if (modern) {
        const footer = el("div", void 0, "ha-plus-dialog-actions");
        footer.slot = "footer";
        footer.append(cancel, confirm);
        dialog.append(footer);
      } else {
        cancel.slot = "secondaryAction";
        confirm.slot = "primaryAction";
        dialog.append(cancel, confirm);
      }
      dialog.addEventListener("closed", () => finish(response));
      host.shadowRoot.append(dialog);
      dialog.open = true;
      Promise.resolve(dialog.updateComplete).then(() => {
        if (!settled) focusControl(cancel);
      });
    });
  }

  // src/plant-care-plus-card.js
  var t = (key, values) => localize(haContext(), en_default, key, values);
  var CARD_TAG = "plant-care-plus-card";
  var DOMAIN = "plant_care_plus";
  var STAT_ROWS = [
    ["last_watered", t("last_watered"), "mdi:water-check"],
    ["next_watering", t("next_check"), "mdi:calendar-clock"],
    ["days_since_watered", t("days_since"), "mdi:calendar-range"],
    ["moisture", t("moisture"), "mdi:water-percent"],
    ["temperature", t("temperature"), "mdi:thermometer"],
    ["humidity", t("humidity"), "mdi:water-percent"],
    ["illuminance", t("illuminance"), "mdi:brightness-5"],
    ["conductivity", t("conductivity"), "mdi:flash"]
  ];
  function confirmWater(host, names) {
    return confirmDialog(host, {
      title: host._t("record_watering"),
      returnFocus: host.shadowRoot.querySelector(".water"),
      message: host._t(names.length === 1 ? "confirm_water_one" : "confirm_water_many", { name: names[0], count: names.length }) + (names.length > 1 ? `

${names.join("\n")}` : ""),
      confirmLabel: host._t("mark_watered"),
      cancelLabel: host._t("common.cancel")
    });
  }
  function relativeDate(entity, key, hass) {
    if (!entity || !["last_watered", "next_watering"].includes(key)) return null;
    const result = relativeCalendarDate(hass, entity.state);
    return result ? result[0].toUpperCase() + result.slice(1) : null;
  }
  var PlantCarePlusCard = class extends HTMLElement {
    _t(key, values) {
      return localize(this._hass, en_default, key, values);
    }
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
        }).catch((error) => {
          const message = this.shadowRoot.querySelector(".message");
          if (message) message.textContent = error.message;
        }).finally(() => {
          this._nativeLoading = false;
        });
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
      for (const [key, label, icon2] of STAT_ROWS) {
        const button2 = document.createElement("button");
        button2.className = "stat ha-plus-stat";
        button2.type = "button";
        button2.dataset.key = key;
        button2.innerHTML = `<ha-icon icon="${icon2}"></ha-icon><span><span class="ha-plus-stat-label">${label}</span><span class="stat-value ha-plus-stat-value">\u2014</span></span>`;
        button2.addEventListener("click", () => this._showMoreInfo(key));
        stats.append(button2);
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
        this.shadowRoot.querySelector("h2").textContent = this._t("plant_unavailable");
        this.shadowRoot.querySelector(".status").textContent = this._config.entity;
        this.shadowRoot.querySelector(".reason").textContent = this._t("select_an_ha_plant_care_status_sensor");
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
      const tones = { ok: "success", approaching: "warning", check: "warning", needs_attention: "error", overdue: "error" };
      status.dataset.tone = tones[statusEntity.state] || "";
      this.shadowRoot.querySelector(".reason").textContent = statusEntity.attributes.reason || this._t("no_care_recommendation_available");
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
        const icon2 = document.createElement("ha-icon");
        icon2.icon = "mdi:sprout";
        pictureContainer.replaceChildren(icon2);
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
      const button2 = this.shadowRoot.querySelector(".water");
      const message = this.shadowRoot.querySelector(".message");
      button2.disabled = true;
      try {
        const name = this.shadowRoot.querySelector("h2").textContent;
        if (!await confirmWater(this, [name])) return;
        message.textContent = "";
        await this._hass.callService(DOMAIN, "water", { entity_id: this._config.entity });
        setActionState(button2, { success: true });
        showToast(this, this._t("watering_recorded"));
        button2.setAttribute("aria-label", this._t("watering_recorded"));
        button2.innerHTML = '<ha-icon icon="mdi:check"></ha-icon>';
        await new Promise((resolve) => setTimeout(resolve, 3e3));
      } catch (error) {
        message.textContent = this._t("could_not_record_watering_please_try_again");
        console.error("HA+ Plant Care could not record watering", error);
      } finally {
        this._watering = false;
        setActionState(button2);
        button2.removeAttribute("aria-label");
        button2.innerHTML = '<ha-icon icon="mdi:watering-can"></ha-icon>';
        button2.append(document.createTextNode(this._t("mark_watered")));
        this._update();
        if (this._nativeReady) this._upgradeActions();
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
      description: t("plant_status_measurements_watering_schedule_and_care_action")
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
          row.innerHTML = `<td><input type="checkbox"></td><th scope="row"><button class="name ha-plus-text-button"></button></th><td class="status ha-plus-status"></td>${STAT_ROWS.map(([key]) => `<td data-key="${key}"></td>`).join("")}`;
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
      const button2 = this.shadowRoot.querySelector(".water");
      button2.disabled = Boolean(this._watering) || !this._selected.size;
      if (!button2.classList.contains("success")) button2.textContent = this._t("mark_selected_watered", { value1: this._selected.size });
    }
    async _markSelected() {
      if (this._watering || !this._selected.size) return;
      this._watering = true;
      this._updateSelection();
      const ids = [...this._selected];
      const button2 = this.shadowRoot.querySelector(".water");
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
          message.textContent = this._t("of_plants_recorded_could_not_record_they_remain_selected_for_retry", { value1: ids.length - failed.length, value2: ids.length, value3: failed.length });
        } else {
          setActionState(button2, { success: true });
          showToast(this, this._t("watering_recorded"));
          button2.setAttribute("aria-label", this._t("watering_recorded_for_selected_plants"));
          button2.innerHTML = '<ha-icon icon="mdi:check"></ha-icon>';
          await new Promise((resolve) => setTimeout(resolve, 3e3));
        }
      } finally {
        this._watering = false;
        setActionState(button2);
        button2.removeAttribute("aria-label");
        this._updateSelection();
        if (this._nativeReady) this._upgradeActions();
      }
    }
  };
  if (!customElements.get("plant-care-plus-dashboard")) {
    customElements.define("plant-care-plus-dashboard", PlantCarePlusDashboard);
  }
  if (!window.customCards.some((card) => card.type === "plant-care-plus-dashboard")) {
    window.customCards.push({ type: "plant-care-plus-dashboard", name: "HA+ Plant Care Dashboard", description: t("all_plants_with_card_and_table_views_and_bulk_watering") });
  }
})();
