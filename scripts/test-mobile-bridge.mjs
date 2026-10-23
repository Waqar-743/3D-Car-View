import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
const require = createRequire(new URL('../package.json', import.meta.url));
const storage = new Map(), events = new Map(), messages = [];
globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
globalThis.document = { visibilityState: 'visible', body: { classList: { add() {}, remove() {} }, dataset: {} }, addEventListener: (key, value) => events.set(key, value), removeEventListener: (key) => events.delete(key) };
globalThis.window = { location: { search: '' }, addEventListener() {}, removeEventListener() {} };
const bundle = await build({ stdin: { contents: "export * from './src/game/mobileBridge'; export * from './src/game/store'; export * from './src/game/input'; export * from './src/game/driving'; export * from './src/game/config'; export * from './src/game/vehiclePhysics'; export * from './src/game/mobilePerformance';", loader: 'ts', resolveDir: process.cwd() }, bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', define: { 'import.meta.env.BASE_URL': '"./"' } });
const module = { exports: {} };
new Function('require', 'module', 'exports', bundle.outputFiles[0].text)(require, module, module.exports);
const game = module.exports;
let checks = 0;
function check(name, run) { run(); checks++; console.log(`PASS ${name}`); }
check('The website does not expose a native API without the real native channel', () => {
  window.location.search = '?native=1';
  assert.equal(game.isNativeGame(), false);
  game.installMobileBridge()();
  assert.equal(window.WindwayMobile, undefined);
});
window.WindwayNative = { postMessage: (raw) => messages.push(JSON.parse(raw)) };
const cleanup = game.installMobileBridge();
const api = window.WindwayMobile;
check('Native host receives a protocol handshake', () => assert(messages.some((message) => message.type === 'ready' && message.protocol === 1)));
const valid = { version: 1, mapId: 'jungle', carId: 'mercedes-w14', checkpoint: 5, lap: 2, elapsed: 137.25, resets: 3 };
check('Checkpoint saves validate map, car, ordered gate, lap, elapsed time and reset count', () => {
  assert.deepEqual(game.validateSavedRun(valid), valid);
  for (const change of [{ version: 2 }, { mapId: 'missing' }, { carId: 'missing' }, { checkpoint: 8 }, { checkpoint: -1 }, { checkpoint: 1.5 }, { lap: 3 }, { lap: 0 }, { elapsed: NaN }, { elapsed: Infinity }, { elapsed: -1 }, { elapsed: 604801 }, { resets: -1 }, { resets: 0.5 }]) assert.equal(game.validateSavedRun({ ...valid, ...change }), null, JSON.stringify(change));
  assert.equal(game.validateSavedRun({ ...valid, mapId: 'snow', checkpoint: 16, lap: 1 }), null, 'A finished summit run must not resume beyond its finish');
});
check('Native configuration restores the selected car, map, paint and graphics preferences', () => {
  api.configure({ mapId: 'jungle', carId: 'mercedes-w14', paint: '#70b9c7', steeringMode: 'tilt', cameraMode: 'hood', character: 'imran', quality: 'low', effects: false, sound: .3, sensitivity: 1.2, reducedMotion: true, bestTimes: { 'jungle:mercedes-w14': 123.5, 'mclaren-mcl38': -20, unknown: 7 } });
  const state = game.useGame.getState();
  assert.equal(state.selectedMap, 'jungle'); assert.equal(state.selectedCar, 'mercedes-w14'); assert.equal(state.paint, '#70b9c7');
  assert.equal(state.settings.quality, 'low'); assert.equal(state.settings.reducedMotion, true); assert.equal(state.settings.effects, false); assert.equal(state.settings.sound, .3);
  assert.equal(state.bestTimes['jungle:mercedes-w14'], 123.5); assert.equal(state.bestTimes.unknown, undefined);
});
check('Continue restores earned progress and spawns safely at its checkpoint, not a falling position', () => {
  api.start({ resume: valid });
  const state = game.useGame.getState();
  assert.equal(state.status, 'loading'); assert.equal(state.page, 'race'); assert.equal(state.cameraMode, 'hood');
  for (const key of ['lap', 'checkpoint', 'elapsed', 'resets']) assert.equal(state.telemetry[key], valid[key]);
  const pose = game.getRespawnPose(state.telemetry.checkpoint);
  assert(Number.isFinite(pose.position.x) && pose.position.y > 0);
});
check('Tilt steering is analog, finite, bounded and only active during a running race', () => {
  api.steer(.4); assert.equal(game.drivingInput.steering, undefined);
  game.useGame.setState({ status: 'running' });
  api.steer(.4); assert.equal(game.drivingInput.steering, .4);
  api.steer(9); assert.equal(game.drivingInput.steering, 1);
  api.steer(NaN); assert.equal(game.drivingInput.steering, 0);
});
check('Analog values provide proportional steering while keyboard steering remains unchanged', () => {
  const car = game.GAME_CARS[0], dt = 1 / 60;
  const digital = game.driveVelocity(20, 0, { ...game.neutralInput(), left: true }, car, true, true, dt);
  const analog = game.driveVelocity(20, 0, { ...game.neutralInput(), steering: .35 }, car, true, true, dt);
  assert(Math.abs(analog.yawRate / digital.yawRate - .35) < 1e-8);
  const invalid = game.driveVelocity(20, 0, { ...game.neutralInput(), steering: NaN, right: true }, car, true, true, dt);
  assert(invalid.yawRate < 0);
});
check('Pausing clears all held controls, preserves a save, and resuming does not auto-accelerate', () => {
  game.drivingInput.throttle = true; api.steer(.8); api.command('pause');
  assert.equal(game.useGame.getState().status, 'paused'); assert.equal(game.drivingInput.throttle, false); assert.equal(game.drivingInput.steering, undefined);
  assert(messages.some((message) => message.type === 'save' && message.run.checkpoint === 5));
  api.command('resume'); assert.equal(game.useGame.getState().status, 'running'); assert.equal(game.drivingInput.throttle, false);
});
check('Native lifecycle can suspend the countdown and resume that countdown safely', () => {
  game.useGame.setState({ status: 'countdown', countdown: 2 }); api.command('pause');
  assert.equal(game.useGame.getState().status, 'paused'); api.command('resume');
  assert.equal(game.useGame.getState().status, 'countdown'); assert.equal(game.useGame.getState().countdown, 2);
});
check('Loading in the background pauses as soon as the loaded car becomes ready', () => {
  game.useGame.setState({ status: 'loading' }); api.command('pause'); game.useGame.getState().startCountdown();
  assert.equal(game.useGame.getState().status, 'paused'); api.command('resume'); assert.equal(game.useGame.getState().status, 'countdown');
});
check('Only tilt mode accepts native sensor input; wheel and arrow modes cannot retain it', () => {
  game.useGame.setState({ status: 'running' }); api.configure({ steeringMode: 'wheel' }); api.steer(.9); assert.equal(game.drivingInput.steering, undefined);
  api.configure({ steeringMode: 'arrows' }); api.steer(.9); assert.equal(game.drivingInput.steering, undefined);
});
check('A sensor fallback cannot change a resumed car or map, and preserves quality, sound and camera', () => {
  const before = game.useGame.getState();
  api.configure({ steeringMode: 'arrows', mapId: 'alpine', carId: 'mclaren-mcl38' });
  const after = game.useGame.getState();
  assert.equal(after.selectedMap, before.selectedMap); assert.equal(after.selectedCar, before.selectedCar);
  assert.equal(after.settings.quality, before.settings.quality); assert.equal(after.settings.sound, before.settings.sound); assert.equal(after.cameraMode, before.cameraMode);
});
check('Camera and checkpoint reset commands reach the actual game controller', () => {
  const state = game.useGame.getState(); const prior = state.cameraMode, resets = state.resetRequest;
  api.command('camera'); assert.notEqual(game.useGame.getState().cameraMode, prior);
  api.command('recover'); assert.equal(game.useGame.getState().resetRequest, resets + 1);
});
check('Finish messages include map, car and real completion time for native record persistence', () => {
  game.useGame.getState().finish(151.8, 3);
  const finished = messages.findLast((message) => message.type === 'finished');
  assert.equal(finished.result.carId, 'mercedes-w14'); assert.equal(finished.result.mapId, 'jungle'); assert.equal(finished.result.time, 151.8);
});
check('A fresh Start resets prior race progress instead of silently continuing', () => {
  api.start(); const state = game.useGame.getState();
  assert.equal(state.telemetry.checkpoint, 0); assert.equal(state.telemetry.lap, 1); assert.equal(state.telemetry.elapsed, 0);
});
check('Returning to the app menu saves and releases input, then sends an exit signal', () => {
  game.useGame.setState({ status: 'running' }); game.drivingInput.throttle = true; api.command('menu');
  assert.equal(game.useGame.getState().page, 'home'); assert.equal(game.drivingInput.throttle, false); assert.equal(messages.at(-1).type, 'exit');
});
check('Bridge cleanup removes native globals and background listeners', () => {
  cleanup(); assert.equal(window.WindwayMobile, undefined); assert(!events.has('visibilitychange'));
});
check('Automatic Android resolution reduces GPU load gradually and never falls below the readable floor', () => {
  let current = 1;
  for (let sample = 0; sample < 30; sample++) { const next = game.mobileResolution(current, 30, 0); assert(next.dpr <= current && next.dpr >= .65); current = next.dpr; }
  assert.equal(current, .65);
});
check('Resolution recovery uses hysteresis, stays capped at one, and ignores invalid timing data', () => {
  let sample = game.mobileResolution(.65, 60, 0); assert.equal(sample.dpr, .65);
  sample = game.mobileResolution(sample.dpr, 60, sample.healthyWindows); assert.equal(sample.dpr, .65);
  sample = game.mobileResolution(sample.dpr, 60, sample.healthyWindows); assert.equal(sample.dpr, .75);
  assert.equal(game.mobileResolution(1, 60, 2).dpr, 1);
  assert.equal(game.mobileResolution(.85, 49, 2).healthyWindows, 0);
  assert.equal(game.mobileResolution(.85, NaN, 2).dpr, .85);
});
console.log(`\n${checks} Android game bridge checks passed. Physical sensor and GPU tests remain separate.`);
