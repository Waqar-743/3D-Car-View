import * as THREE from 'three';
import { ALPINE_POINTS, setTrackLayout } from './track';
import { rebuildTrackBarriers } from './trackBarriers';
import { rebuildTrackFeatures } from './trackFeatures';

export interface GameMap {
  id: 'alpine' | 'jungle'; name: string; region: string; description: string;
  laps: number; pack: 'cartoon-pack' | 'jungle-pack'; character: string;
  theme: { ink: string; paper: string; accent: string; leaf: string; sky: string; road: string; water: string };
  points: THREE.Vector3[];
}

export const GAME_MAPS: GameMap[] = [
  { id: 'alpine', name: 'The alpine loop', region: 'Windway Valley',
    description: 'Open mountain roads, wooden river crossings and a golden boost jump. The original Windway escape.',
    laps: 1, pack: 'cartoon-pack', character: 'wild-haired-driver',
    theme: { ink: '#30483d', paper: '#f7f3e7', accent: '#e98254', leaf: '#9aba97', sky: '#d5e5cb', road: '#67776e', water: '#71b8c5' },
    points: ALPINE_POINTS },
  { id: 'jungle', name: 'Canopy Run', region: 'Jungle Reserve',
    description: 'Two laps beneath a dense tropical canopy. Find the wildlife, cross jade rivers and launch from the marigold jump.',
    laps: 2, pack: 'jungle-pack', character: 'waqar',
    theme: { ink: '#153c35', paper: '#e9efda', accent: '#eac35a', leaf: '#287451', sky: '#b7d1b7', road: '#465e50', water: '#3b9a8e' },
    points: [[0, 1.2, 119], [90, 2.4, 120], [154, 3.5, 62], [123, 5, -10],
      [155, 4.2, -90], [75, 2.3, -146], [-14, 1.5, -113], [-105, 2.8, -147],
      [-156, 4.2, -60], [-114, 3.3, 21], [-147, 2, 93], [-55, 1.3, 137]]
      .map(([x, y, z]) => new THREE.Vector3(x, y, z)) },
];

export const mapById = (id: string): GameMap => GAME_MAPS.find((map) => map.id === id) ?? GAME_MAPS[0];
// Keep pre-existing alpine records readable, with a separate namespace for new maps.
export const gameRecordKey = (mapId: string, carId: string) => mapId === 'alpine' ? carId : `${mapId}:${carId}`;
export let currentMap: GameMap = GAME_MAPS[0];
export function activateMap(id: string) {
  currentMap = mapById(id);
  setTrackLayout(currentMap.points);
  rebuildTrackFeatures();
  rebuildTrackBarriers();
  return currentMap;
}
