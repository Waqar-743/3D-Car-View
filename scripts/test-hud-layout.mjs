import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import postcss from 'postcss';

// CSS contract checks, not a browser rendering engine. These exercise the
// shipped viewport/safe-area formulas and prevent centered overlays returning.
const css = postcss.parse(readFileSync(new URL('../src/game/race-hud.css', import.meta.url), 'utf8'));
let checks = 0;
function check(name, action) { action(); checks++; console.log(`PASS ${name}`); }
function mediaMatches(query, viewport) {
  return query.split(',').some((branch) => branch.split(/\s+and\s+/).every((condition) => {
    const [_, feature, value] = condition.trim().match(/^\(([-\w]+):\s*([-\w.]+)\)$/) ?? [];
    assert(feature, `Unsupported test media condition: ${condition}`);
    if (feature === 'pointer') return viewport.coarse === (value === 'coarse');
    if (feature === 'orientation') return (viewport.width > viewport.height ? 'landscape' : 'portrait') === value;
    const number = Number.parseFloat(value);
    if (feature === 'max-width') return viewport.width <= number;
    if (feature === 'min-width') return viewport.width >= number;
    if (feature === 'max-height') return viewport.height <= number;
    throw Error(`Unsupported media feature: ${feature}`);
  }));
}
function declarations(selector, viewport) {
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
function length(value, viewport, variables) {
  let source = value;
  for (let pass = 0; pass < 12 && source.includes('var('); pass++) source = source.replace(/var\((--[-\w]+)\)/g, (_, key) => {
    assert(variables[key], `Unresolved HUD variable: ${key}`); return `(${variables[key]})`;
  });
  source = source.replace(/env\(safe-area-inset-(top|right|bottom|left),\s*0px\)/g, (_, edge) => String(viewport.safe?.[edge] ?? 0))
    .replace(/([\d.]+)(dvh|vw|px)/g, (_, amount, unit) => String(Number(amount) * (unit === 'dvh' ? viewport.height / 100 : unit === 'vw' ? viewport.width / 100 : 1)))
    .replace(/calc\(/g, '(');
  assert(!source.replace(/\b(?:min|max|clamp)\b/g, '').match(/[^\d\s.,()+*/-]/), `Unsafe/unsupported CSS formula: ${source}`);
  return new Function('min', 'max', 'clamp', `return ${source}`)(Math.min, Math.max, (min, preferred, max) => Math.max(min, Math.min(preferred, max)));
}
const viewports = [
  { width: 320, height: 568, coarse: true }, { width: 360, height: 640, coarse: true },
  { width: 390, height: 844, coarse: true, safe: { top: 47, bottom: 34 } },
  { width: 430, height: 932, coarse: true, safe: { top: 59, bottom: 34 } },
  { width: 360, height: 320, coarse: true }, { width: 480, height: 320, coarse: true },
  { width: 568, height: 320, coarse: true }, { width: 667, height: 375, coarse: true },
  { width: 844, height: 390, coarse: true, safe: { left: 47, right: 47, bottom: 21 } },
  { width: 768, height: 1024, coarse: true }, { width: 1024, height: 768, coarse: true },
  { width: 1366, height: 768, coarse: false }, { width: 1920, height: 1080, coarse: false },
  { width: 2560, height: 1440, coarse: false },
];
check('playing fills the visible viewport even on short landscape screens', () => {
  const root = declarations('.wildway.page-race', viewports[0]);
  assert.equal(root.height, '100dvh'); assert.equal(root['min-height'], '0');
});
check('former center overlays are reset before applying the corner layout', () => {
  const reset = css.nodes.find((node) => node.type === 'rule' && node.selector.includes(':is(.race-header,'));
  assert(reset);
  const props = Object.fromEntries(reset.nodes.filter((node) => node.type === 'decl').map((decl) => [decl.prop, decl.value]));
  assert.equal(props.position, 'static'); assert.equal(props.inset, 'auto'); assert.equal(props.transform, 'none');
  for (const name of ['checkpoint-progress', 'winter-drive-info', 'ramp-status', 'race-tools', 'race-reaction', 'countdown', 'recovery-card', 'go-message']) assert(reset.selector.includes(`.${name}`), `${name} could still be center-positioned`);
});
for (const map of ['alpine', 'jungle', 'snow']) {
  for (const viewport of viewports) check(`${map} ${viewport.width}×${viewport.height}: roadmap left, speed right, center and controls clear`, () => {
    const variables = { ...declarations('.wildway .race-ui', viewport), ...declarations(`.wildway.map-${map} .race-ui`, viewport) };
    const dashboard = declarations('.wildway .race-ui .race-dashboard', viewport);
    const right = length(dashboard.right, viewport, variables), top = length(dashboard.top, viewport, variables);
    const width = length(dashboard.width, viewport, variables), height = length(dashboard['max-height'], viewport, variables);
    const bottom = length('var(--hud-bottom)', viewport, variables);
    assert.equal(dashboard.position, 'absolute');
    assert(viewport.width - right - width >= viewport.width / 2 + 11.99, 'Dashboard crosses the driving centerline');
    assert(right >= (viewport.safe?.right ?? 0) && top >= (viewport.safe?.top ?? 0));
    assert(width >= 125 && height >= 96, 'HUD became unusably small');
    assert(top + height <= viewport.height - bottom + 0.01, 'HUD extends below the viewport');
    assert.equal(dashboard.overflow, 'auto');
    const roadmap = declarations('.wildway .race-ui .race-minimap', viewport);
    const speed = declarations('.wildway .race-ui .speed-gauge', viewport);
    const mapLeft = length(roadmap.left, viewport, variables);
    const mapWidth = length(roadmap.width, viewport, variables), mapHeight = length(roadmap.height, viewport, variables);
    const speedRight = length(speed.right, viewport, variables);
    const speedWidth = length(speed.width, viewport, variables), speedHeight = length(speed.height, viewport, variables);
    const mapBottom = length(roadmap.bottom, viewport, variables), speedBottom = length(speed.bottom, viewport, variables);
    assert.equal(roadmap.position, 'absolute'); assert.equal(speed.position, 'absolute');
    assert.equal(roadmap.display, 'grid', 'Roadmap must remain visible even on short screens');
    assert.equal(speed.display, 'flex', 'Speed must remain visible at every size');
    assert(mapWidth >= 80 && mapHeight >= 80 && speedWidth >= 100 && speedHeight >= 60);
    assert.equal(mapLeft, length('var(--hud-left)', viewport, variables), 'Roadmap must hug the safe left edge');
    assert.equal(speedRight, right, 'Speed must hug the same safe right edge as the dashboard');
    assert(mapLeft + mapWidth <= viewport.width / 2 - 11.99, 'Roadmap crosses the driving centerline');
    assert(viewport.width - speedRight - speedWidth >= viewport.width / 2 + 11.99, 'Speed crosses the driving centerline');
    assert(mapBottom >= bottom && speedBottom >= bottom, 'Corner widgets extend into a device safe area');
    assert(viewport.height - mapBottom - mapHeight >= (viewport.safe?.top ?? 0), 'Roadmap extends above the viewport');
    assert(top + height + 7.99 <= viewport.height - speedBottom - speedHeight, 'Timer panel overlaps the speed widget');
    const touch = declarations('.wildway .race-ui .touch-controls', viewport);
    if (touch.display === 'flex') {
      const reserve = length('var(--hud-controls-space)', viewport, variables);
      assert(reserve >= 116, 'Dashboard does not reserve space for pedals');
      assert(top + height <= viewport.height - bottom - 116 + 0.01);
      assert(mapBottom >= bottom + 116 && speedBottom >= bottom + 116, 'Roadmap or speed covers the touch controls');
      const group = declarations('.wildway .race-ui :is(.touch-steering, .touch-pedals)', viewport);
      const groupWidth = length(group.width, viewport, variables), left = length('var(--hud-left)', viewport, variables);
      assert(left + groupWidth <= viewport.width / 2 - 15.99);
      assert(right + groupWidth <= viewport.width / 2 - 15.99);
      assert(length(declarations('.wildway .race-ui .touch-button', viewport)['min-height'], viewport, variables) >= 44);
      assert(length(declarations('.wildway .race-ui .touch-drift', viewport)['min-height'], viewport, variables) >= 44);
    }
    assert(length(declarations('.wildway .race-ui .pause-button', viewport).width, viewport, variables) >= 44);
    assert(length(declarations('.wildway .race-ui .race-tools .hud-button', viewport)['min-height'], viewport, variables) >= 44);
  });
}
function rgb(hex) {
  const source = hex.slice(1); return [0, 2, 4].map((offset) => Number.parseInt(source.slice(offset, offset + 2), 16));
}
function luminance(color) { return rgb(color).map((n) => n / 255).map((n) => n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4).reduce((total, n, index) => total + n * [0.2126, 0.7152, 0.0722][index], 0); }
function contrast(a, b) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
for (const map of ['alpine', 'jungle', 'snow']) check(`${map}: small HUD text and accent contrast stay readable over bright scenery`, () => {
  const vars = { ...declarations('.wildway .race-ui', viewports[0]), ...declarations(`.wildway.map-${map} .race-ui`, viewports[0]) };
  const panel = vars['--hud-panel'], alpha = Number.parseInt(panel.slice(7, 9), 16) / 255;
  const overSnow = '#' + rgb(panel).map((n) => Math.round(n * alpha + 255 * (1 - alpha)).toString(16).padStart(2, '0')).join('');
  for (const key of ['--hud-text', '--hud-muted', '--hud-accent']) assert(contrast(vars[key], overSnow) >= 4.5, `${key} fails 4.5:1 contrast`);
});
console.log(`\n${checks} HUD CSS contract checks passed. Actual browser layout/touch testing remains separate.`);
