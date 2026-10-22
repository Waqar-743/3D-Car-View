import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useCarStore } from '../../store/carStore';

interface LightingProps {
  shadows: boolean;
  shadowMapSize: number;
}

export const Lighting: React.FC<LightingProps> = ({ shadows, shadowMapSize }) => {
  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const fillLightRef = useRef<THREE.DirectionalLight>(null);
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const sunSpotRef = useRef<THREE.SpotLight>(null);
  const sunSpot2Ref = useRef<THREE.SpotLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const backLightRef = useRef<THREE.DirectionalLight>(null);
  
  const demoTransitionPhase = useCarStore((state) => state.demoTransitionPhase);
  const spotlightMode = useCarStore((state) => state.spotlightMode);
  const invalidate = useThree((state) => state.invalidate);
  const intensity = demoTransitionPhase === 'dark' ? 0.2 : demoTransitionPhase === 'revealing' ? 1.5 : 1;
  const transitionLights = [keyLightRef, fillLightRef, spotLightRef, ambientRef, hemiRef, backLightRef, sunSpotRef, sunSpot2Ref];
  const targets = spotlightMode
    ? [0.02, 0.01, 0.02, 0.03, 0.02, 0.01, 15, 10]
    : [intensity * 2, intensity, intensity * 1.2, intensity * 0.7, 0.5, 0.8, 0, 0];
  
  // Create a target for the spotlight
  const spotTarget = useMemo(() => {
    const target = new THREE.Object3D();
    target.position.set(0, 0.5, 0);
    return target;
  }, []);
  
  // Animate light intensity during demo transition and spotlight mode
  useFrame((_, delta) => {
    const blend = 1 - Math.exp(-Math.min(delta, 0.1) * (spotlightMode ? 3 : 1.5));
    let changing = false;
    transitionLights.forEach((reference, index) => {
      const light = reference.current;
      if (!light) return;
      const difference = targets[index] - light.intensity;
      if (Math.abs(difference) < 0.005) {
        light.intensity = targets[index];
      } else {
        light.intensity += difference * blend;
        changing = true;
      }
    });
    // Demand rendering settles completely once the light transition ends.
    if (changing) invalidate();
  });
  
  return (
    <>
      {/* Key Light - Main illumination (reduced shadow map size) */}
      <directionalLight
        ref={keyLightRef}
        position={[5, 10, 7]}
        intensity={2}
        castShadow={shadows && !spotlightMode}
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-camera-far={30}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      
      {/* Fill Light - Reduce harsh shadows */}
      <directionalLight
        ref={fillLightRef}
        position={[-5, 5, 0]}
        intensity={1}
        color="#ffffff"
      />
      
      {/* Back Light - Rim lighting for edges */}
      <directionalLight
        ref={backLightRef}
        position={[0, 2, -10]}
        intensity={0.8}
        color="#ffffff"
      />
      
      {/* Ambient Light - Overall scene illumination */}
      <ambientLight ref={ambientRef} intensity={0.7} />
      
      {/* Hemisphere light for natural sky/ground lighting */}
      <hemisphereLight
        ref={hemiRef}
        args={['#ffffff', '#444444', 0.5]}
        position={[0, 10, 0]}
      />
      
      {/* Single spot light for dramatic effect */}
      <spotLight
        ref={spotLightRef}
        position={[0, 12, 10]}
        angle={0.4}
        penumbra={1}
        intensity={1.2}
        castShadow={false}
      />
      
      {/* Spotlight target */}
      <primitive object={spotTarget} />
      
      {/* Main Yellow Spotlight - fixed on front wall, wide angle to cover whole car */}
      <spotLight
        ref={sunSpotRef}
        position={[0, 8, 15]}
        target={spotTarget}
        angle={1.2}
        penumbra={0.8}
        intensity={0}
        color="#FFD700"
        castShadow={shadows && spotlightMode}
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-camera-far={30}
        distance={40}
        decay={0.8}
      />
      
      {/* Secondary Yellow Spotlight - even wider for full coverage */}
      <spotLight
        ref={sunSpot2Ref}
        position={[0, 10, 15]}
        target={spotTarget}
        angle={1.4}
        penumbra={1}
        intensity={0}
        color="#FFA500"
        distance={45}
        decay={0.5}
      />
      
      {/* Point light close to car for direct illumination */}
      <pointLight
        position={[0, 2, 0]}
        intensity={spotlightMode ? 5 : 0}
        color="#FFD700"
        distance={15}
        decay={1.5}
      />
      
      {/* Additional point lights to cover entire car */}
      <pointLight
        position={[3, 1, 0]}
        intensity={spotlightMode ? 3 : 0}
        color="#FFD700"
        distance={10}
        decay={2}
      />
      <pointLight
        position={[-3, 1, 0]}
        intensity={spotlightMode ? 3 : 0}
        color="#FFD700"
        distance={10}
        decay={2}
      />
    </>
  );
};

export default Lighting;
