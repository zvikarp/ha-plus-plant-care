const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { JSDOM } = require('jsdom');
const source = readFileSync(`${__dirname}/../../custom_components/plant_care_plus/frontend/plant-care-plus-card.js`, 'utf8');
function setup(tag = 'plant-care-plus-card') {
  const dom = new JSDOM('', { runScripts: 'outside-only' });
  const { window } = dom;
  window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  const timers = [];
  window.setTimeout = (fn, ms) => { timers.push({ fn, ms }); };
  window.eval(source);
  const card = window.document.createElement(tag);
  window.document.body.append(card);
  const states = {};
  for (const name of ['fern', 'palm']) {
    states[`sensor.${name}`] = { state: 'ok', attributes: { plant_name: name, related_entities: { last_watered: `sensor.${name}_last`, next_watering: `sensor.${name}_next` } } };
    states[`sensor.${name}_last`] = { state: '2026-10-31T12:00:00Z', attributes: {} };
    states[`sensor.${name}_next`] = { state: '2026-11-04T12:00:00Z', attributes: {} };
  }
  window.Date.now = () => Date.parse('2026-11-01T12:00:00Z');
  const calls = [];
  const hass = { states, config: { time_zone: 'Asia/Jerusalem' }, callService: async (...args) => { calls.push(args); } };
  card.setConfig(tag.endsWith('dashboard') ? {} : { entity: 'sensor.fern' });
  card.hass = hass;
  return { card, hass, calls, timers, window };
}
function closeDialog(card, value) {
  const dialog = card.shadowRoot.querySelector('dialog');
  dialog.returnValue = value;
  dialog.dispatchEvent(new card.ownerDocument.defaultView.Event('close'));
}
const tick = () => new Promise(setImmediate);

test('relative dates respect HA calendar timezone and unknown values', () => {
  const { card, hass } = setup();
  assert.equal(card._formatState(hass.states['sensor.fern_last'], 'last_watered'), '1 day ago');
  assert.equal(card._formatState(hass.states['sensor.fern_next'], 'next_watering'), 'In 3 days');
  assert.equal(card._formatState({ state: '2026-11-01T22:30:00Z', attributes: {} }, 'next_watering'), 'In 1 day');
  assert.equal(card._formatState({ state: 'unknown', attributes: {} }, 'last_watered'), 'unknown');
});
test('cancel never calls service; success lasts three seconds and state updates cannot unlock button', async () => {
  const { card, hass, calls, timers } = setup();
  let pending = card._markWatered();
  closeDialog(card, 'cancel'); await pending;
  assert.equal(calls.length, 0);
  pending = card._markWatered();
  closeDialog(card, 'confirm'); await tick();
  assert.equal(calls.length, 1);
  assert.equal(card.shadowRoot.querySelector('.message').textContent, '');
  const button = card.shadowRoot.querySelector('.water');
  assert.ok(button.classList.contains('success'));
  card.hass = hass;
  assert.ok(button.disabled);
  assert.equal(timers[0].ms, 3000);
  timers[0].fn(); await pending;
  assert.equal(button.textContent, 'Mark watered');
  assert.equal(button.disabled, false);
});
test('service failure remains visible and allows retry', async () => {
  const { card, hass } = setup();
  hass.callService = async () => { throw new Error('offline'); };
  card.ownerDocument.defaultView.console.error = () => {};
  const pending = card._markWatered(); closeDialog(card, 'confirm'); await pending;
  assert.match(card.shadowRoot.querySelector('.message').textContent, /Could not record/);
  assert.equal(card.shadowRoot.querySelector('.water').disabled, false);
});
test('dashboard switches views, selects all and retains only failed targets', async () => {
  const { card, hass, calls } = setup('plant-care-plus-dashboard');
  const root = card.shadowRoot;
  assert.equal(root.querySelectorAll('tbody tr').length, 2);
  root.querySelector('[role=tab][data-value=table]').click();
  assert.equal(root.querySelector('.table').hidden, false);
  assert.equal(root.querySelector('.cards').hidden, true);
  root.querySelector('thead input').click();
  assert.equal(card._selected.size, 2);
  hass.callService = async (...args) => { calls.push(args); if (args[2].entity_id === 'sensor.palm') throw new Error('offline'); };
  const pending = card._markSelected();
  assert.equal(root.querySelectorAll('dialog').length, 1);
  closeDialog(card, 'confirm'); await pending;
  assert.equal(calls.length, 2);
  assert.deepEqual([...card._selected], ['sensor.palm']);
  assert.ok(root.querySelector('thead input').indeterminate);
  assert.match(root.querySelector('.message').textContent, /1 of 2/);
  delete hass.states['sensor.palm']; card.hass = hass;
  assert.equal(card._selected.size, 0);
  assert.equal(root.querySelectorAll('tbody tr').length, 1);
});
test('bulk success shows a check for three seconds and restores an empty selection', async () => {
  const { card, calls, timers } = setup('plant-care-plus-dashboard');
  card.shadowRoot.querySelector('thead input').click();
  const pending = card._markSelected();
  await card._markSelected();
  closeDialog(card, 'confirm'); await tick();
  assert.equal(calls.length, 2);
  const button = card.shadowRoot.querySelector('.water');
  assert.ok(button.classList.contains('success'));
  assert.equal(timers[0].ms, 3000);
  timers[0].fn(); await pending;
  assert.equal(button.textContent, 'Mark selected watered (0)');
  assert.ok(button.disabled);
});

test('card and dashboard use only the shared app stylesheet and semantic status tones', async () => {
  const { appStyles, tabStyles } = await import('@ha-plus/ui');
  for (const tag of ['plant-care-plus-card', 'plant-care-plus-dashboard']) {
    const { card, hass } = setup(tag);
    const views = [card, ...card.shadowRoot.querySelectorAll('plant-care-plus-card')];
    for (const view of views) {
      assert.equal(view.shadowRoot.querySelectorAll('style').length, 1);
      assert.equal(view.shadowRoot.querySelector('style').textContent, view.localName.endsWith('dashboard') ? appStyles + tabStyles : appStyles);
      assert.equal(view.shadowRoot.querySelector('[style]'), null);
    }
    if (tag === 'plant-care-plus-card') {
      for (const [state, tone] of [['ok', 'success'], ['approaching', 'warning'], ['check', 'warning'], ['needs_attention', 'error'], ['overdue', 'error'], ['unknown', '']]) {
        hass.states['sensor.fern'].state = state;
        card.hass = hass;
        assert.equal(card.shadowRoot.querySelector('.status').dataset.tone, tone);
      }
    }
  }
});

test('built-in panel reuses the dashboard and exposes one shared app header', () => {
  const { window, hass } = setup();
  hass.user = { is_admin: true };
  const panel = window.document.createElement('plant-care-plus-panel');
  window.document.body.append(panel);
  panel.hass = hass;
  const dashboard = panel.shadowRoot.querySelector('plant-care-plus-dashboard');
  assert.ok(dashboard);
  assert.equal(panel.shadowRoot.querySelector('h1').textContent, 'HA+ Plant Care');
  assert.equal(panel.shadowRoot.querySelector('img').getAttribute('src'), '/plant_care_plus/icon.png');
  assert.equal(dashboard.shadowRoot.querySelector('[data-settings]'), null);
  const header = panel.shadowRoot.querySelector('header');
  panel.hass = { ...hass };
  assert.equal(panel.shadowRoot.querySelector('header'), header);
});

test('plant views are linked tab panels and follow keyboard selection', () => {
  const { card, window } = setup('plant-care-plus-dashboard');
  const root = card.shadowRoot;
  const [cards, table] = root.querySelectorAll('[role=tab]');
  assert.equal(cards.getAttribute('aria-selected'), 'true');
  assert.equal(root.querySelector('.table').hidden, true);
  cards.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert.equal(table.getAttribute('aria-selected'), 'true');
  assert.equal(table.tabIndex, 0);
  assert.equal(root.querySelector('.cards').hidden, true);
  assert.equal(root.querySelector('.table').getAttribute('aria-labelledby'), table.id);
});
