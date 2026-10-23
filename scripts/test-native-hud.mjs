import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import postcss from 'postcss';

// Shipped CSS contracts, not a substitute for WebView rendering or touch QA.
// Resolve the shared geometry first, then the more specific Android overrides.
const shared = postcss.parse(readFileSync(new URL('../src/game/race-hud.css', import.meta.url), 'utf8'));
const native = postcss.parse(readFileSync(new URL('../src/game/mobile-game.css', import.meta.url), 'utf8'));
let checks = 0;
function check(name, run) { run(); checks++; console.log(`PASS ${name}`); }
function mediaMatches(query, viewport) {
  return query.split(',').some((branch) => branch.split(/\s+and\s+/).every((condition) => {
    const [, feature, value] = condition.trim().match(/^\(([-\w]+):\s*([-\w.]+)\)$/) ?? [];
    assert(feature, `Unsupported HUD media condition: ${condition}`);
    if (feature === 'pointer') return value === 'coarse';
    if (feature === 'orientation') return value === (viewport.width > viewport.height ? 'landscape' : 'portrait');
    if (feature === 'max-width') return viewport.width <= Number.parseFloat(value);
    if (feature === 'min-width') return viewport.width >= Number.parseFloat(value);
    if (feature === 'max-height') return viewport.height <= Number.parseFloat(value);
    throw Error(`Unsupported HUD media feature: ${feature}`);
  }));
}
function declarations(css, selector, viewport) {
  const result = {};
  css.walkRules((rule) => {
    if (!rule.selectors.includes(selector)) return;
    for (let parent = rule.parent; parent; parent = parent.parent) {
      if (parent.type === 'atrule' && parent.name === 'media' && !mediaMatches(parent.params, viewport)) return;
    }
    rule.walkDecls((decl) => { result[decl.prop] = decl.value; });
  });
  return result;
}
function cockpit(selector, viewport) {
  return {
    ...declarations(shared, `.wildway .race-ui ${selector}`, viewport),
    ...declarations(native, `.windway-native .wildway .race-ui ${selector}`, viewport),
  };
}
function length(value, viewport, variables) {
  assert(value, 'A required native HUD dimension is missing');
  let source = value;
  for (let pass = 0; pass < 12 && source.includes('var('); pass++) source = source.replace(/var\((--[-\w]+)\)/g, (_, key) => {
    assert(variables[key], `Unresolved native HUD variable: ${key}`);
    return `(${variables[key]})`;
  });
  source = source.replace(/env\(safe-area-inset-(top|right|bottom|left),\s*0px\)/g, (_, edge) => String(viewport.safe?.[edge] ?? 0))
    .replace(/([\d.]+)(dvh|vw|px)/g, (_, number, unit) => String(Number(number) * (unit === 'dvh' ? viewport.height / 100 : unit === 'vw' ? viewport.width / 100 : 1)))
    .replace(/calc\(/g, '(');
  assert(!source.replace(/\b(?:min|max|clamp)\b/g, '').match(/[^\d\s.,()+*/-]/), `Unsupported HUD dimension: ${source}`);
  return new Function('min', 'max', 'clamp', `return ${source}`)(Math.min, Math.max, (a, x, b) => Math.max(a, Math.min(x, b)));
}
function rgb(hex) { return [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset + 1, offset + 3), 16)); }
function luminance(hex) {
  return rgb(hex).map((channel) => channel / 255).map((channel) => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4)
    .reduce((total, channel, index) => total + channel * [.2126, .7152, .0722][index], 0);
}
function contrast(a, b) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
function composite(hex, backdrop = '#ffffff') {
  assert.match(hex, /^#[\da-f]{8}$/i, 'Native HUD uses an explicit translucent panel color');
  const alpha = Number.parseInt(hex.slice(7, 9), 16) / 255;
  assert(alpha > 0 && alpha < 1, 'Native HUD should preserve a view of the world beneath it');
  return '#' + rgb(hex).map((channel, index) => Math.round(channel * alpha + rgb(backdrop)[index] * (1 - alpha)).toString(16).padStart(2, '0')).join('');
}
const viewports = [
  { width: 568, height: 320 }, { width: 640, height: 360 },
  { width: 844, height: 390 }, { width: 960, height: 432 },
  { width: 844, height: 390, safe: { left: 47, right: 47, bottom: 21 } },
];
for (const map of ['alpine', 'jungle', 'snow']) {
  for (const viewport of viewports) check(`${map} ${viewport.width}×${viewport.height}: native controls and corner instruments leave the road clear`, () => {
    const vars = { ...declarations(shared, '.wildway .race-ui', viewport), ...declarations(shared, `.wildway.map-${map} .race-ui`, viewport), ...declarations(native, '.windway-native .wildway .race-ui', viewport) };
    const size = (value) => length(value, viewport, vars);
    const left = size(vars['--hud-left']), right = size(vars['--hud-right']), top = size(vars['--hud-top']), bottom = size(vars['--hud-bottom']);
    const dashboard = cockpit('.race-dashboard', viewport), minimap = cockpit('.race-minimap', viewport), speed = cockpit('.speed-gauge', viewport);
    const panelWidth = size(dashboard.width), panelHeight = size(dashboard['max-height']);
    assert.equal(dashboard.display, 'grid'); assert.equal(dashboard.overflow, 'auto');
    assert.equal(dashboard['grid-template-columns'], 'minmax(0, 1fr) 44px');
    assert(panelHeight >= 96, 'Pause and timer should remain usable on the shortest supported screen');
    assert(viewport.width - right - panelWidth >= viewport.width / 2 + 12, 'Dashboard crosses the driving centerline');
    const mapWidth = size(minimap.width), mapHeight = size(minimap.height), mapBottom = size(minimap.bottom);
    const speedWidth = size(speed.width), speedHeight = size(speed.height), speedBottom = size(speed.bottom);
    assert(left + mapWidth <= viewport.width / 2 - 12, 'Minimap crosses the driving centerline');
    assert(viewport.width - right - speedWidth >= viewport.width / 2 + 12, 'Speedometer crosses the driving centerline');
    assert(top + panelHeight + 8 <= viewport.height - speedBottom - speedHeight, 'Timer panel overlaps the speedometer');
    const reserve = size(vars['--hud-controls-space']);
    const wheel = declarations(native, '.mobile-wheel', viewport), cluster = declarations(native, '.mobile-steering-cluster', viewport);
    const wheelStack = size(cockpit('.touch-drift', viewport)['min-height']) + size(cluster.gap) + size(wheel.height);
    assert(reserve >= wheelStack, 'Minimap must clear the largest steering control, including its drift button');
    assert(mapBottom >= bottom + wheelStack && speedBottom >= bottom + size(cockpit('.touch-throttle', viewport)['min-height']), 'An instrument covers a touch control');
    const dock = declarations(native, '.mobile-driver-badge', viewport), button = declarations(native, '.mobile-driver-badge > button', viewport);
    const stop = { ...button, ...declarations(native, '.mobile-driver-badge > button.mobile-stop', viewport) }, image = declarations(native, '.mobile-driver-badge > img', viewport);
    const hasCompanion = image.display !== 'none';
    const dockWidth = size(stop.width) + size(button.width) * 2 + size(dock.gap) * (hasCompanion ? 3 : 2) + (hasCompanion ? size(image.width) + size(image['margin-left']) : 0);
    assert(left + dockWidth <= viewport.width / 2 - 12, 'Stop/camera/recover dock crosses the driving centerline');
    assert(top + size(button.height) + 8 <= viewport.height - mapBottom - mapHeight, 'Top actions overlap the minimap');
    assert(size(button.width) >= 44 && size(button.height) >= 44 && size(stop.width) >= 44, 'Top actions lost their minimum touch target');
    assert(size(cockpit('.pause-button', viewport)['min-height']) >= 44);
    assert(left + size(cluster.width) <= viewport.width / 2 - 12, 'Steering controls cross the driving centerline');
    assert(right + size(cockpit('.touch-pedals', viewport).width) <= viewport.width / 2 - 12, 'Pedals cross the driving centerline');
    assert.equal(cockpit('.race-tools', viewport).display, 'none', 'Website action tools should not duplicate the native dock');
  });
  check(`${map}: translucent native HUD stays readable over bright snow`, () => {
    const viewport = viewports[2];
    const vars = { ...declarations(shared, '.wildway .race-ui', viewport), ...declarations(shared, `.wildway.map-${map} .race-ui`, viewport), ...declarations(native, '.windway-native .wildway .race-ui', viewport) };
    const background = composite(vars['--hud-panel']);
    for (const key of ['--hud-text', '--hud-muted', '--hud-accent']) assert(contrast(vars[key], background) >= 4.5, `${key} fails 4.5:1 contrast against bright scenery`);
    const pedal = cockpit('.touch-button', viewport);
    for (const action of ['.touch-button', '.touch-brake', '.touch-drift', '.touch-throttle']) {
      const control = { ...pedal, ...cockpit(action, viewport) };
      const text = control.color.replace(/var\((--[-\w]+)\)/g, (_, key) => vars[key]);
      assert(contrast(text, composite(control.background)) >= 4.5, `${action} label becomes unreadable against bright scenery`);
    }
    const pressed = { ...pedal, ...cockpit('.touch-button[aria-pressed=true]', viewport) };
    assert(contrast(pressed.color, composite(pressed.background, '#000000')) >= 4.5, 'Pressed controls lose their dark label against a dark road');
    assert.equal(declarations(native, '.windway-native .wildway.page-race', viewport).background, 'transparent');
    assert.equal(declarations(native, '.windway-native .wildway .race-ui-paused :is(.mobile-driver-badge, .race-dashboard, .race-minimap, .speed-gauge)', viewport).visibility, 'hidden', 'Paused controls should not compete with Resume/Restart/Stop');
  });
}
console.log(`\n${checks} native HUD CSS contract checks passed. WebView rendering and physical touch testing remain separate.`);
