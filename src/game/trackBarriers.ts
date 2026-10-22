import { ROAD_WIDTH, TRACK_POINTS, TRACK_SEGMENTS, trackFrame } from './track';

type Position = [number, number, number];

/** One box shared by the visible mesh, live collider and headless physics tests. */
export type TrackBarrier = {
  id: string;
  kind: 'bridge' | 'roadside';
  side: -1 | 1;
  progress: number;
  position: Position;
  yaw: number;
  halfExtents: Position;
};

export type BridgeDeckSegment = {
  id: string;
  index: number;
  progress: number;
  position: Position;
  yaw: number;
  halfExtents: Position;
};

export const BRIDGE_RAIL_OFFSET = 8.2;
export const BRIDGE_RAIL_THICKNESS = 0.6;
export const BRIDGE_DRIVEABLE_HALF_WIDTH = BRIDGE_RAIL_OFFSET - BRIDGE_RAIL_THICKNESS / 2;
export const DEFAULT_DRIVEABLE_HALF_WIDTH = ROAD_WIDTH / 2 + 0.05;

// Continue the protected deck onto both banks, not just over the water. The
// small overlaps seal joints on a curved bridge without invisible end walls.
function buildBridgeSegments() { return TRACK_POINTS.map((frame, index) => {
  const next = TRACK_POINTS[(index + 1) % TRACK_SEGMENTS];
  return Math.abs((frame.point.z + next.point.z) / 2) <= 34;
}); }
let bridgeSegments = buildBridgeSegments();

export function isBridgeProgress(progress: number) {
  const normalized = ((progress % 1) + 1) % 1;
  return bridgeSegments[Math.floor(normalized * TRACK_SEGMENTS) % TRACK_SEGMENTS];
}

/** The bridge shoulder is a real supported deck all the way to its solid rail. */
export function getDriveableHalfWidth(progress: number) {
  return isBridgeProgress(progress) ? BRIDGE_DRIVEABLE_HALF_WIDTH : DEFAULT_DRIVEABLE_HALF_WIDTH;
}

function buildBridgeDecks(): BridgeDeckSegment[] { return TRACK_POINTS.flatMap((frame, index) => {
  if (!bridgeSegments[index]) return [];
  const next = TRACK_POINTS[(index + 1) % TRACK_SEGMENTS];
  const dx = next.point.x - frame.point.x, dz = next.point.z - frame.point.z;
  const length = Math.hypot(dx, dz), forwardX = dx / length, forwardZ = dz / length;
  // The side endpoints of a curved plank project beyond its centreline
  // chord. Cover those corners too, or an outer-curve joint can open a
  // centimetre-wide unsupported wedge even when the centreline overlaps.
  const cornerExtension = 8.85 * Math.max(
    Math.abs(frame.right.x * forwardX + frame.right.z * forwardZ),
    Math.abs(next.right.x * forwardX + next.right.z * forwardZ),
  );
  return [{
    id: `bridge-deck-${index}`, index, progress: (index + 0.5) / TRACK_SEGMENTS,
    position: [(frame.point.x + next.point.x) / 2, (frame.point.y + next.point.y) / 2 - 0.23, (frame.point.z + next.point.z) / 2] as Position,
    yaw: Math.atan2(dx, dz), halfExtents: [8.85, 0.14, length / 2 + cornerExtension + 0.12] as Position,
  }];
}); }
export let BRIDGE_DECK_SEGMENTS = buildBridgeDecks();

function buildBarriers(): TrackBarrier[] { return TRACK_POINTS.flatMap<TrackBarrier>((frame, index) => {
  if (bridgeSegments[index]) {
    const next = TRACK_POINTS[(index + 1) % TRACK_SEGMENTS];
    return ([-1, 1] as const).map((side) => {
      const a = frame.point.clone().addScaledVector(frame.right, side * BRIDGE_RAIL_OFFSET);
      const b = next.point.clone().addScaledVector(next.right, side * BRIDGE_RAIL_OFFSET);
      const dx = b.x - a.x, dz = b.z - a.z;
      return {
        id: `bridge-rail-${index}-${side}`, kind: 'bridge' as const, side, progress: (index + 0.5) / TRACK_SEGMENTS,
        position: [(a.x + b.x) / 2, (a.y + b.y) / 2 + 0.64, (a.z + b.z) / 2] as Position,
        yaw: Math.atan2(dx, dz), halfExtents: [BRIDGE_RAIL_THICKNESS / 2, 0.73, Math.hypot(dx, dz) / 2 + 0.12] as Position,
      };
    });
  }
  if (index % 12 !== 0 || index <= 12 || Math.abs(frame.point.z) <= 40) return [];
  return ([-1, 1] as const).map((side) => {
    // Set the barrier just outside the painted road: the car makes contact
    // while its centre is still on supported asphalt, rather than falling
    // off before it can reach a decorative block farther down the shoulder.
    const p = frame.point.clone().addScaledVector(frame.right, side * (ROAD_WIDTH / 2 + 0.55));
    return {
      id: `roadside-${index}-${side}`, kind: 'roadside' as const, side, progress: index / TRACK_SEGMENTS,
      position: [p.x, p.y + 0.65, p.z] as Position, yaw: frame.yaw,
      halfExtents: [0.35, 0.65, 2.7] as Position,
    };
  });
}); }
export let TRACK_BARRIERS = buildBarriers();

// Only decorative uprights extend below the deck. Their blocking parapets
// above the road are the exact solid boxes in TRACK_BARRIERS.
function buildSupports() { return BRIDGE_DECK_SEGMENTS.filter(({ index }) => index % 4 === 0).flatMap(({ progress }) => {
  const frame = trackFrame(progress);
  return ([-1, 1] as const).map((side) => {
    const p = frame.point.clone().addScaledVector(frame.right, side * BRIDGE_RAIL_OFFSET);
    const top = p.y + 1.45, bottom = -3.2;
    return { position: [p.x, (top + bottom) / 2, p.z] as Position, scale: [0.72, top - bottom, 0.72] as Position, rotation: frame.yaw };
  });
}); }
export let BRIDGE_SUPPORTS = buildSupports();

export function rebuildTrackBarriers() {
  bridgeSegments = buildBridgeSegments();
  BRIDGE_DECK_SEGMENTS = buildBridgeDecks();
  TRACK_BARRIERS = buildBarriers();
  BRIDGE_SUPPORTS = buildSupports();
}
