import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, sep } from 'node:path';
import { build } from 'esbuild';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

// Headless checks of the shipped screen components. The 3D scene is deliberately
// stubbed: these verify UI state and asset references, not GPU output or layout.
const require = createRequire(new URL('../package.json', import.meta.url));
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
};

const bundle = await build({
  stdin: {
    contents: "export { default as Windway } from './src/game/Wildway'; export * from './src/game/store'; export * from './src/game/maps'; export * from './src/game/config';",
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external',
  loader: { '.css': 'empty' },
  define: { 'import.meta.env.BASE_URL': '"/3D-Car-Design/"', 'import.meta.env.DEV': 'false' },
  plugins: [{
    name: 'headless-scene',
    setup(plugin) {
      plugin.onResolve({ filter: /^\.\/GameScene$/ }, () => ({ path: 'GameScene', namespace: 'ui-test' }));
      plugin.onLoad({ filter: /.*/, namespace: 'ui-test' }, () => ({
        contents: 'import { createElement } from "react"; export default function GameScene() { return createElement("div", { "data-headless-scene": "true" }); }',
        loader: 'js', resolveDir: process.cwd(),
      }));
    },
  }],
});
const compiled = { exports: {} };
new Function('require', 'module', 'exports', bundle.outputFiles[0].text)(require, compiled, compiled.exports);
const { Windway, useGame, GAME_MAPS, GAME_CARS, gameRecordKey, formatTime } = compiled.exports;

let checks = 0;
function check(name, action) {
  action();
  checks++;
  console.log(`PASS ${name}`);
}
const initial = useGame.getInitialState();
function prepare(map, page, extra = {}) {
  useGame.setState({ status: 'idle', page: 'home' });
  useGame.getState().selectMap(map.id);
  const carId = GAME_CARS[0].id;
  useGame.setState({
    selectedCar: carId,
    page, status: page === 'race' ? 'running' : page === 'results' ? 'finished' : 'idle',
    returnPage: 'home', error: null, reaction: null, recovery: null,
    telemetry: { ...useGame.getState().telemetry, elapsed: 12.34, lap: map.laps, checkpoint: 3, speed: 87, boosting: false, airborne: false, drifting: false },
    bestTimes: { [gameRecordKey('alpine', carId)]: 51.27, [gameRecordKey('jungle', carId)]: 104.36 },
    result: { time: 96.52, previousBest: 104.36, newBest: true, resets: 2, mapId: map.id, laps: map.laps },
    ...extra,
  });
  // Zustand's SSR path reads its initial snapshot. Synchronize that object only
  // within this isolated test instance; the real store/actions remain shipped.
  Object.assign(initial, useGame.getState());
}
function render() { return renderToString(createElement(Windway)); }
function withoutReactComments(html) { return html.replace(/<!--[\s\S]*?-->/g, ''); }
function imageSources(html) { return [...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map((match) => match[1]); }
function assertImageFiles(html) {
  const sources = imageSources(html);
  assert(sources.length > 0, 'Screen contains no SVG art');
  const publicRoot = resolve('public');
  for (const source of sources) {
    assert(source.startsWith('/3D-Car-Design/'), `Unexpected image source: ${source}`);
    const asset = resolve(publicRoot, decodeURIComponent(source.slice('/3D-Car-Design/'.length)));
    assert(asset.startsWith(`${publicRoot}${sep}`), `Asset escaped public directory: ${source}`);
    assert(existsSync(asset), `Missing image asset: ${source}`);
  }
}

// Let the lazy import resolve once before checking the stubbed scene output.
prepare(GAME_MAPS[0], 'home'); render();
await new Promise((done) => setImmediate(done));

for (const map of GAME_MAPS) {
  for (const page of ['home', 'map', 'garage', 'settings', 'howto', 'race', 'results']) {
    prepare(map, page);
    const html = render();
    check(`${map.id} ${page}: screen and scene render`, () => {
      assert(html.includes(`map-${map.id} page-${page}`));
      assert(html.includes('data-headless-scene="true"'));
      assert(!html.includes('data-msg='), 'SSR unexpectedly fell back due to an error');
      assert(!html.includes('src=""'));
    });
    check(`${map.id} ${page}: every image points to a shipped asset`, () => assertImageFiles(html));
    check(`${map.id} ${page}: expected screen content is present`, () => {
      const expected = {
        home: map.name,
        map: map.description,
        garage: 'Pick your kind',
        settings: 'Your Windway.',
        howto: map.laps === 2 ? 'Two jungle laps.' : 'One clean loop.',
        race: `LAP ${map.laps}<i> / ${map.laps}`,
        results: `${map.name} · ${map.laps} ${map.laps === 1 ? 'lap' : 'laps'}`,
      }[page];
      assert(withoutReactComments(html).includes(expected), `Missing expected copy: ${expected}`);
    });
    if (page === 'home' || page === 'map') {
      check(`${map.id} ${page}: exactly one map selection is pressed`, () => {
        const selector = html.match(/<fieldset class="map-selector[\s\S]*?<\/fieldset>/)?.[0];
        assert(selector, 'No map selector');
        assert.equal((selector.match(/aria-pressed="true"/g) ?? []).length, 1);
        assert.equal((selector.match(/aria-pressed="false"/g) ?? []).length, 1);
        const pressedButton = [...selector.matchAll(/<button\b[\s\S]*?<\/button>/g)].map((match) => match[0]).find((button) => button.includes('aria-pressed="true"'));
        assert(pressedButton?.includes(`<strong>${map.name}</strong>`));
      });
    }
    if (page === 'home' || page === 'race') {
      check(`${map.id} ${page}: record uses the correct map namespace`, () => {
        assert(html.includes(formatTime(map.id === 'jungle' ? 104.36 : 51.27)));
      });
    }
    if (map.id === 'jungle' && page === 'map') {
      check('jungle map: wildlife, named crew and recolored racing kit appear', () => {
        const sources = imageSources(html);
        for (const name of ['lion','giraffe','deer','python','horse','wolf','waqar','imran','tatheer','stop-station','boost-ramp','finish-flag','checkpoint','lap-badge','winner-trophy']) {
          assert(sources.includes(`/3D-Car-Design/jungle-pack/${name}.svg`), `Missing jungle art: ${name}`);
        }
      });
    }
  }
}

const jungle = GAME_MAPS.find((map) => map.id === 'jungle');
for (const character of ['waqar', 'imran', 'tatheer', 'toucan']) {
  prepare(jungle, 'race', { reaction: { text: 'A jungle reaction.', character, until: performance.now() + 3200 } });
  const html = render();
  check(`jungle race: ${character} reaction resolves to the new pack`, () => {
    assert(imageSources(html).includes(`/3D-Car-Design/jungle-pack/${character}.svg`));
    assertImageFiles(html);
  });
}
for (const status of ['loading','countdown','paused','recovering']) {
  prepare(jungle, 'race', {
    status,
    recovery: status === 'recovering' ? { reason: 'water', checkpoint: 3, remaining: 0.6 } : null,
  });
  const html = render();
  check(`jungle race: ${status} feedback renders with valid art`, () => {
    const expected = { loading: 'Warming up your ride', countdown: 'THE JUNGLE IS YOURS IN', paused: 'pause-title', recovering: 'RETURNING TO CHECKPOINT 03' }[status];
    assert(withoutReactComments(html).includes(expected));
    assertImageFiles(html);
  });
}

check('preferences use isolated in-memory browser storage', () => {
  assert(storage.has('wildway-preferences-v1'));
  const saved = JSON.parse(storage.get('wildway-preferences-v1'));
  assert(['alpine','jungle'].includes(saved.selectedMap));
  assert.equal(saved.telemetry, undefined);
});
console.log(`\n${checks} headless UI checks passed. These do not replace browser layout or driving tests.`);
