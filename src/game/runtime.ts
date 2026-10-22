import * as THREE from 'three';
export const vehicleFrame = {
  position: new THREE.Vector3(), velocity: new THREE.Vector3(), yaw: 0,
  speed: 0, steer: 0, drifting: false, grounded: true, boosting: false, shake: 0,
  checkpointFlash: 0, resets: 0,
};
