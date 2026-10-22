import * as THREE from 'three';

export const ROAD_WIDTH = 14;
export const TRACK_SEGMENTS = 360;
export const ALPINE_POINTS = [
  new THREE.Vector3(0, 1.1, 119),
  new THREE.Vector3(82, 2.4, 119),
  new THREE.Vector3(143, 5.8, 55),
  new THREE.Vector3(126, 8.5, -31),
  new THREE.Vector3(73, 6.7, -102),
  new THREE.Vector3(-9, 4.2, -123),
  new THREE.Vector3(-89, 2.3, -88),
  new THREE.Vector3(-140, 1.4, -20),
  new THREE.Vector3(-111, 1.2, 63),
  new THREE.Vector3(-61, 1.1, 105),
];
export let trackCurve = new THREE.CatmullRomCurve3(ALPINE_POINTS, true, 'catmullrom', 0.35);

export function trackFrame(progress: number) {
  const t = ((progress % 1) + 1) % 1;
  const point = trackCurve.getPointAt(t);
  const tangent = trackCurve.getTangentAt(t).normalize();
  const right = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();
  return { point, tangent, right, yaw: Math.atan2(tangent.x, tangent.z) };
}

export let TRACK_POINTS = Array.from({ length: TRACK_SEGMENTS }, (_, index) => trackFrame(index / TRACK_SEGMENTS));
export let CHECKPOINTS = Array.from({ length: 8 }, (_, index) => trackFrame(index / 8));
export let TRACK_LENGTH = trackCurve.getLength();

export function nearestTrackPoint(x: number, z: number) {
  let index = 0;
  let distanceSquared = Infinity;
  for (let i = 0; i < TRACK_POINTS.length; i++) {
    const p = TRACK_POINTS[i].point;
    const distance = (p.x - x) ** 2 + (p.z - z) ** 2;
    if (distance < distanceSquared) { distanceSquared = distance; index = i; }
  }
  // Project onto the two neighbouring segments. Returning the closest vertex
  // made the height jump in 2–3 metre steps while a car crossed a slope.
  let segment = index, blend = 0;
  for (const candidate of [(index + TRACK_SEGMENTS - 1) % TRACK_SEGMENTS, index]) {
    const a = TRACK_POINTS[candidate].point, b = TRACK_POINTS[(candidate + 1) % TRACK_SEGMENTS].point;
    const dx = b.x - a.x, dz = b.z - a.z;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz)));
    const distance = (x - a.x - dx * t) ** 2 + (z - a.z - dz * t) ** 2;
    if (distance <= distanceSquared) { distanceSquared = distance; segment = candidate; blend = t; }
  }
  const a = TRACK_POINTS[segment], b = TRACK_POINTS[(segment + 1) % TRACK_SEGMENTS];
  const point = a.point.clone().lerp(b.point, blend);
  const tangent = a.tangent.clone().lerp(b.tangent, blend).normalize();
  const right = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();
  return { point, tangent, right, yaw: Math.atan2(tangent.x, tangent.z), index: segment, progress: ((segment + blend) / TRACK_SEGMENTS) % 1, distance: Math.sqrt(distanceSquared) };
}

export function ribbonGeometry(width: number, offset = 0, lift = 0) {
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= TRACK_SEGMENTS; i++) {
    const { point, right } = trackFrame(i / TRACK_SEGMENTS);
    for (const side of [-1, 1]) {
      const edge = point.clone().addScaledVector(right, offset + side * width / 2);
      positions.push(edge.x, edge.y + lift, edge.z);
    }
    if (i < TRACK_SEGMENTS) {
      const v = i * 2;
      indices.push(v, v + 2, v + 1, v + 1, v + 2, v + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export let MAP_PATH = TRACK_POINTS.filter((_, index) => index % 3 === 0)
  .map(({ point }, index) => `${index ? 'L' : 'M'}${(point.x * 0.57 + 100).toFixed(1)},${(point.z * 0.57 + 100).toFixed(1)}`).join(' ') + 'Z';

export function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; };
}

export let START = trackFrame(0);

/** Switch all derived geometry together, before the selected scene remounts. */
export function setTrackLayout(points: THREE.Vector3[]) {
  trackCurve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.35);
  TRACK_POINTS = Array.from({ length: TRACK_SEGMENTS }, (_, index) => trackFrame(index / TRACK_SEGMENTS));
  CHECKPOINTS = Array.from({ length: 8 }, (_, index) => trackFrame(index / 8));
  TRACK_LENGTH = trackCurve.getLength();
  START = trackFrame(0);
  MAP_PATH = TRACK_POINTS.filter((_, index) => index % 3 === 0)
    .map(({ point }, index) => `${index ? 'L' : 'M'}${(point.x * 0.57 + 100).toFixed(1)},${(point.z * 0.57 + 100).toFixed(1)}`).join(' ') + 'Z';
}
