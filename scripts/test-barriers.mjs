import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import * as THREE from 'three';

// Every collision shape and motion step comes from the shipped game modules.
const require = createRequire(new URL('../package.json', import.meta.url));
const bundle = await build({
  stdin: {
    contents: "export * from './src/game/track'; export * from './src/game/trackBarriers'; export * from './src/game/config'; export * from './src/game/driving'; export * from './src/game/vehiclePhysics'; export * from './src/game/maps';",
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external',
  define: { 'import.meta.env.BASE_URL': '"/3D-Car-Design/"', 'import.meta.env.DEV': 'false' },
});
const compiled = { exports: {} };
new Function('require', 'module', 'exports', bundle.outputFiles[0].text)(require, compiled, compiled.exports);
const requestedMap = process.argv.find((arg) => arg.startsWith('--map='))?.slice(6) ?? 'alpine';
assert(compiled.exports.GAME_MAPS.some((map) => map.id === requestedMap), `Unknown map ${requestedMap}`);
compiled.exports.activateMap(requestedMap);
console.log(`Testing ${compiled.exports.currentMap.name} bridge protection`);
const {
  GAME_CARS, TRACK_LENGTH, TRACK_SEGMENTS, trackFrame, ribbonGeometry, nearestTrackPoint,
  TRACK_BARRIERS, BRIDGE_DECK_SEGMENTS, BRIDGE_RAIL_OFFSET, BRIDGE_RAIL_THICKNESS,
  getDriveableHalfWidth, isBridgeProgress, neutralInput,
  BODY_HALF_EXTENTS, BODY_OFFSET_Y, RIDE_HEIGHT, PHYSICS_STEP,
  createMotionTools, clearMotionState, readHeading, recoveryReason, stepVehicleMotion,
} = compiled.exports;
const rapierRequire = createRequire(require.resolve('@react-three/rapier'));
const RAPIER = rapierRequire('@dimforge/rapier3d-compat');
await RAPIER.init();
const dt = PHYSICS_STEP, idle = neutralInput(), gas = { ...idle, throttle: true };
const yAxis = new THREE.Vector3(0, 1, 0);
const runs = [];
for (const deck of BRIDGE_DECK_SEGMENTS) {
  const run = runs.at(-1);
  if (!run || deck.index !== run.at(-1).index + 1) runs.push([deck]);
  else run.push(deck);
}
let checks = 0, impacts = 0;
const failures = [];
function check(name, action) {
  try { action(); checks++; console.log(`PASS ${name}`); }
  catch (error) { failures.push({ name, error }); console.error(`FAIL ${name}: ${error.message}`); }
}
function localPoint(box, point) {
  const dx = point.x - box.position[0], dz = point.z - box.position[2];
  return { x: dx * Math.cos(box.yaw) - dz * Math.sin(box.yaw), z: dx * Math.sin(box.yaw) + dz * Math.cos(box.yaw) };
}
function railFor(deck, side) {
  const result = TRACK_BARRIERS.find(({ id }) => id === `bridge-rail-${deck.index}-${side}`);
  assert(result, `Missing rail for ${deck.id}, side ${side}`);
  return result;
}

check('both bridges have solid paired rails, supported shoulders and sealed joints', () => {
  assert.equal(runs.length, 2, 'Both river crossings need protected decks');
  assert.equal(TRACK_BARRIERS.filter(({ kind }) => kind === 'bridge').length, BRIDGE_DECK_SEGMENTS.length * 2);
  assert.equal(new Set(TRACK_BARRIERS.map(({ id }) => id)).size, TRACK_BARRIERS.length);
  for (const box of [...TRACK_BARRIERS, ...BRIDGE_DECK_SEGMENTS]) {
    assert([...box.position, ...box.halfExtents, box.yaw].every(Number.isFinite), `${box.id} has a non-finite transform`);
    assert(box.halfExtents.every((value) => value > 0), `${box.id} is not a solid box`);
  }
  for (const run of runs) {
    const entry = trackFrame(run[0].index / TRACK_SEGMENTS), exit = trackFrame((run.at(-1).index + 1) / TRACK_SEGMENTS);
    assert(entry.point.z * exit.point.z < 0, 'Bridge does not span the river');
    assert(Math.abs(entry.point.z) > 30 && Math.abs(exit.point.z) > 30, 'Rails must continue onto both banks');
    for (const deck of run) {
      assert(isBridgeProgress(deck.progress));
      assert.equal(getDriveableHalfWidth(deck.progress), BRIDGE_RAIL_OFFSET - BRIDGE_RAIL_THICKNESS / 2);
      for (const side of [-1, 1]) {
        const rail = railFor(deck, side);
        assert.equal(rail.halfExtents[0] * 2, BRIDGE_RAIL_THICKNESS);
        for (const progress of [deck.index / TRACK_SEGMENTS, (deck.index + 1) / TRACK_SEGMENTS]) {
          const frame = trackFrame(progress), endpoint = frame.point.clone().addScaledVector(frame.right, side * BRIDGE_RAIL_OFFSET);
          const wallLocal = localPoint(rail, endpoint), deckLocal = localPoint(deck, endpoint);
          assert(Math.abs(wallLocal.x) < 0.001 && Math.abs(wallLocal.z) <= rail.halfExtents[2] - 0.10, `${rail.id} leaves an unsealed end joint`);
          assert(Math.abs(deckLocal.x) < deck.halfExtents[0] - BRIDGE_RAIL_THICKNESS / 2, `${rail.id} extends beyond its supporting deck`);
          assert(BRIDGE_DECK_SEGMENTS.some((candidate) => {
            const local = localPoint(candidate, endpoint);
            return Math.abs(local.x) <= candidate.halfExtents[0] && Math.abs(local.z) <= candidate.halfExtents[2];
          }), `${rail.id} has an unsupported deck endpoint: localZ ${deckLocal.z.toFixed(4)}, halfDepth ${deck.halfExtents[2].toFixed(4)}, progress ${progress.toFixed(6)}`);
        }
      }
    }
  }
});

function createWorld() {
  const world = new RAPIER.World({ x: 0, y: -18, z: 0 }); world.timestep = dt;
  const road = ribbonGeometry(14);
  world.createCollider(RAPIER.ColliderDesc.trimesh(new Float32Array(road.attributes.position.array), new Uint32Array(road.index.array)).setFriction(0.8));
  for (const side of [-1, 1]) world.createCollider(RAPIER.ColliderDesc.cuboid(480, 1, 212).setTranslation(0, -1, side * 236).setFriction(0.9));
  world.createCollider(RAPIER.ColliderDesc.cuboid(480, 1, 480).setTranslation(0, -6, 0));
  for (const deck of BRIDGE_DECK_SEGMENTS) {
    world.createCollider(RAPIER.ColliderDesc.cuboid(...deck.halfExtents).setTranslation(...deck.position).setRotation(new THREE.Quaternion().setFromAxisAngle(yAxis, deck.yaw)).setFriction(0.8).setRestitution(0));
  }
  const wallHandles = new Set();
  for (const wall of TRACK_BARRIERS) {
    const collider = world.createCollider(RAPIER.ColliderDesc.cuboid(...wall.halfExtents).setTranslation(...wall.position).setRotation(new THREE.Quaternion().setFromAxisAngle(yAxis, wall.yaw)).setFriction(0.2).setRestitution(0));
    wallHandles.add(collider.handle);
  }
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 2, 119).enabledRotations(false, true, false).setLinearDamping(0.02).setAngularDamping(2).setCanSleep(false).setCcdEnabled(true));
  const bodyCollider = world.createCollider(RAPIER.ColliderDesc.cuboid(...BODY_HALF_EXTENTS).setTranslation(0, BODY_OFFSET_Y, 0).setMass(1).setFriction(0).setFrictionCombineRule(RAPIER.CoefficientCombineRule.Min).setRestitution(0).setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS), body);
  return { world, road, body, bodyCollider, wallHandles, tools: createMotionTools(RAPIER), events: new RAPIER.EventQueue(true) };
}

function place(test, p, direction, speed) {
  clearMotionState(test.tools);
  const nearest = nearestTrackPoint(p.x, p.z), yaw = Math.atan2(direction.x, direction.z);
  test.body.setTranslation({ x: p.x, y: nearest.point.y + RIDE_HEIGHT, z: p.z }, true);
  test.body.setRotation(new THREE.Quaternion().setFromAxisAngle(yAxis, yaw), true);
  test.body.setLinvel({ x: direction.x * speed, y: 0, z: direction.z * speed }, true);
  test.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  test.events.drainCollisionEvents(() => {});
}

function impact(test, car, wall, tangentWeight, label, jointOffset = 0, speedMultiplier = 1) {
  const outward = new THREE.Vector3(Math.cos(wall.yaw) * wall.side, 0, -Math.sin(wall.yaw) * wall.side);
  const tangent = new THREE.Vector3(Math.sin(wall.yaw), 0, Math.cos(wall.yaw));
  const direction = outward.clone().multiplyScalar(Math.sqrt(1 - tangentWeight ** 2)).addScaledVector(tangent, tangentWeight);
  const target = new THREE.Vector3(...wall.position).addScaledVector(outward, -wall.halfExtents[0]).addScaledVector(tangent, jointOffset);
  const start = target.clone().addScaledVector(direction, -6.5);
  place(test, start, direction, car.topSpeed * speedMultiplier);
  if (speedMultiplier > 1) test.tools.jump.boostRemaining = 1;
  let contactStep = null, offRoadTime = 0, maxClearance = 0;
  for (let step = 0; step < 100; step++) {
    const motion = stepVehicleMotion(test.body, test.world, test.tools, car, gas, dt);
    offRoadTime = motion.onRoad ? 0 : offRoadTime + dt;
    assert(motion.grounded, `${label}: supported approach became airborne before/at the visible wall`);
    assert.equal(recoveryReason(motion.position, motion.nearest, offRoadTime), null, `${label}: fell or recovered before/at the visible wall (step ${step}, position ${JSON.stringify(motion.position)})`);
    test.world.step(test.events);
    test.events.drainCollisionEvents((a, b, started) => {
      if (started && ((a === test.bodyCollider.handle && test.wallHandles.has(b)) || (b === test.bodyCollider.handle && test.wallHandles.has(a)))) contactStep ??= step;
    });
    const at = test.body.translation(), nearest = nearestTrackPoint(at.x, at.z);
    const throughWall = (at.x - wall.position[0]) * outward.x + (at.z - wall.position[2]) * outward.z;
    assert(throughWall < 0.03, `${label}: crossed solid rail plane by ${throughWall.toFixed(3)} m`);
    maxClearance = Math.max(maxClearance, Math.abs(at.y - nearest.point.y - RIDE_HEIGHT));
    assert(at.y > nearest.point.y - 0.1, `${label}: fell below bridge deck`);
    assert(maxClearance < 0.15, `${label}: wall launched the car ${maxClearance.toFixed(3)} m`);
    if (contactStep !== null && step - contactStep >= (tangentWeight === 0 && jointOffset === 0 ? 20 : 3)) break;
  }
  assert(contactStep !== null, `${label}: never contacted a physical barrier`);
  impacts++;
}

function followDeck(test, car, run, side, label) {
  const startProgress = run[0].index / TRACK_SEGMENTS - 5 / TRACK_LENGTH;
  const finishProgress = (run.at(-1).index + 1) / TRACK_SEGMENTS + 5 / TRACK_LENGTH;
  const start = trackFrame(startProgress), offset = side * 6.7;
  place(test, start.point.clone().addScaledVector(start.right, offset), start.tangent, 20);
  let reachedExit = false, offRoadTime = 0;
  for (let step = 0; step < 650; step++) {
    const at = test.body.translation(), v = test.body.linvel(), yaw = readHeading(test.body, test.tools);
    const nearest = nearestTrackPoint(at.x, at.z);
    const target = trackFrame(nearest.progress + 0.012), aim = target.point.clone().addScaledVector(target.right, offset);
    const desired = Math.atan2(aim.x - at.x, aim.z - at.z), error = Math.atan2(Math.sin(desired - yaw), Math.cos(desired - yaw));
    const speed = v.x * Math.sin(yaw) + v.z * Math.cos(yaw);
    const input = { ...idle, throttle: speed < 22, brake: speed > 24, left: error > 0.02, right: error < -0.02 };
    const motion = stepVehicleMotion(test.body, test.world, test.tools, car, input, dt);
    offRoadTime = motion.nearest.distance > getDriveableHalfWidth(motion.nearest.progress) ? offRoadTime + dt : 0;
    assert.equal(recoveryReason(motion.position, motion.nearest, offRoadTime), null, `${label}: entry/exit or shoulder caused recovery at ${JSON.stringify(motion.position)}`);
    assert(motion.grounded, `${label}: supported shoulder became airborne`);
    test.world.step(test.events); test.events.drainCollisionEvents(() => {});
    const next = test.body.translation(), road = nearestTrackPoint(next.x, next.z);
    assert(road.distance < BRIDGE_RAIL_OFFSET + BRIDGE_RAIL_THICKNESS / 2, `${label}: crossed a bridge rail`);
    assert(Math.abs(next.y - road.point.y - RIDE_HEIGHT) < 0.15, `${label}: bridge deck caused bouncing`);
    if (road.progress >= finishProgress) { reachedExit = true; break; }
  }
  assert(reachedExit, `${label}: failed to traverse protected bridge approaches`);
}

for (const car of GAME_CARS) {
  const test = createWorld();
  try {
    for (const run of runs) {
      const bank = trackFrame(run[0].progress).point.x > 0 ? 'east' : 'west';
      check(`${car.name}: ${bank} bridge blocks full-speed direct, diagonal, joint and end impacts`, () => {
        const sampleIndexes = [...new Set([0, 1, Math.floor(run.length / 2), run.length - 2, run.length - 1])];
        for (const side of [-1, 1]) {
          for (const index of sampleIndexes) {
            const wall = railFor(run[index], side);
            for (const tangentWeight of [0, 0.6, -0.6]) impact(test, car, wall, tangentWeight, `${car.id}/${wall.id}/diagonal${tangentWeight}`);
          }
          for (const index of [0, Math.floor(run.length / 2), run.length - 2]) {
            const wall = railFor(run[index], side);
            const jointOffset = wall.halfExtents[2] - 0.12;
            for (const tangentWeight of [0, 0.6]) impact(test, car, wall, tangentWeight, `${car.id}/${wall.id}/joint${tangentWeight}`, jointOffset);
          }
          for (const index of [0, Math.floor(run.length / 2), run.length - 1]) {
            const wall = railFor(run[index], side);
            for (const tangentWeight of [0, 0.6]) impact(test, car, wall, tangentWeight, `${car.id}/${wall.id}/boost${tangentWeight}`, 0, 1.28);
          }
        }
      });
      check(`${car.name}: ${bank} bridge supports travel beside both rails through entry and exit`, () => {
        for (const side of [-1, 1]) followDeck(test, car, run, side, `${car.id}/${bank}/shoulder${side}`);
      });
    }
    check(`${car.name}: representative roadside walls block before unsupported road edge`, () => {
      const walls = TRACK_BARRIERS.filter(({ kind }) => kind === 'roadside');
      for (const index of [0, 1, Math.floor(walls.length / 2), walls.length - 2, walls.length - 1]) {
        const wall = walls[index];
        assert(wall, 'Missing roadside collision boxes');
        impact(test, car, wall, 0, `${car.id}/${wall.id}`);
      }
    });
  } finally {
    test.events.free(); test.road.dispose(); test.world.free();
  }
}
assert.equal(failures.length, 0, `${failures.length} barrier checks failed:\n${failures.map(({ name, error }) => `${name}: ${error.message}`).join('\n')}`);
console.log(`\n${checks} barrier checks passed, covering ${impacts} actual full-speed impacts. No browser records were changed.`);
