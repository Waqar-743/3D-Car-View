import * as THREE from 'three';
import { nearestTrackPoint, TRACK_CLOSED, TRACK_LENGTH, trackFrame } from './track';

/** One optional, forward-facing ramp on the opening straight, not beside it. */
export const BOOST_JUMP = {
  startProgress: 0.04, length: 12, width: 8, height: 1.25,
  speedGain: 9, minimumBoostSpeed: 30, boostDuration: 1.5, launchVelocity: 5.2,
} as const;

export function jumpDistance(progress: number) {
  return ((((progress - BOOST_JUMP.startProgress) % 1) + 1.5) % 1 - 0.5) * TRACK_LENGTH;
}

export function jumpSample(position: { x: number; z: number }, nearest = nearestTrackPoint(position.x, position.z)) {
  const distance = jumpDistance(nearest.progress);
  const lateral = (position.x - nearest.point.x) * nearest.right.x + (position.z - nearest.point.z) * nearest.right.z;
  const withinWidth = TRACK_CLOSED && Math.abs(lateral) <= BOOST_JUMP.width / 2;
  const onRamp = withinWidth && distance >= 0 && distance <= BOOST_JUMP.length;
  return { distance, lateral, withinWidth, onRamp, height: onRamp ? BOOST_JUMP.height * distance / BOOST_JUMP.length + 0.035 : 0 };
}

export function jumpRampGeometry() {
  const positions: number[] = [], indices: number[] = [];
  const segments = 16;
  for (let i = 0; i <= segments; i++) {
    const fraction = i / segments;
    const frame = trackFrame(BOOST_JUMP.startProgress + fraction * BOOST_JUMP.length / TRACK_LENGTH);
    for (const height of [0.02, 0.035 + fraction * BOOST_JUMP.height]) {
      for (const side of [-1, 1]) {
        const p = frame.point.clone().addScaledVector(frame.right, side * BOOST_JUMP.width / 2);
        positions.push(p.x, p.y + height, p.z);
      }
    }
    if (i < segments) {
      const v = i * 4;
      indices.push(v + 2, v + 6, v + 3, v + 3, v + 6, v + 7);
      indices.push(v, v + 4, v + 2, v + 2, v + 4, v + 6);
      indices.push(v + 1, v + 3, v + 5, v + 3, v + 7, v + 5);
    }
  }
  const end = segments * 4;
  indices.push(end, end + 1, end + 2, end + 1, end + 3, end + 2);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

function buildJumpStripes() { return [0.15, 0.38, 0.62, 0.85].map((fraction) => {
  const frame = trackFrame(BOOST_JUMP.startProgress + fraction * BOOST_JUMP.length / TRACK_LENGTH);
  return { position: [frame.point.x, frame.point.y + fraction * BOOST_JUMP.height + 0.07, frame.point.z] as [number, number, number], yaw: frame.yaw,
    slope: Math.atan2(BOOST_JUMP.height, BOOST_JUMP.length) + Math.asin(frame.tangent.y) };
}); }
export let JUMP_STRIPES = buildJumpStripes();
export function rebuildTrackFeatures() { JUMP_STRIPES = buildJumpStripes(); }
