import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useCarStore } from '../../store/carStore';

interface CameraControlsProps {
  enablePan?: boolean;
  enableZoom?: boolean;
  minDistance?: number;
  maxDistance?: number;
  minPolarAngle?: number;
  maxPolarAngle?: number;
}

// EXTREME CLOSE-UP Cinematic camera keyframes for demo mode
// Much closer to the car with aggressive, dynamic movements
const DEMO_KEYFRAMES = [
  // Opening shot - dramatic low angle front
  { position: new THREE.Vector3(3, 0.3, 4), target: new THREE.Vector3(0, 0.5, 2), duration: 2500, name: 'front-low' },
  
  // Front wing endplate extreme close-up
  { position: new THREE.Vector3(1.5, 0.4, 3.5), target: new THREE.Vector3(1.2, 0.2, 3), duration: 2000, name: 'front-wing-detail' },
  
  // Sweep across front wing
  { position: new THREE.Vector3(-1.5, 0.4, 3.5), target: new THREE.Vector3(-1.2, 0.2, 3), duration: 2500, name: 'front-wing-sweep' },
  
  // Cockpit/Halo extreme close-up
  { position: new THREE.Vector3(0, 1.8, 1.5), target: new THREE.Vector3(0, 1.0, 0), duration: 2000, name: 'halo-top' },
  
  // Side cockpit view
  { position: new THREE.Vector3(2, 1.2, 0.5), target: new THREE.Vector3(0, 0.9, 0), duration: 2500, name: 'cockpit-side' },
  
  // Sidepod detail shot
  { position: new THREE.Vector3(2.5, 0.8, -0.5), target: new THREE.Vector3(1.5, 0.5, -0.5), duration: 2000, name: 'sidepod-detail' },
  
  // Wheel/tire close-up (rear)
  { position: new THREE.Vector3(2.2, 0.5, -1.5), target: new THREE.Vector3(1.8, 0.4, -2), duration: 2500, name: 'rear-wheel' },
  
  // Rear diffuser/exhaust extreme close-up
  { position: new THREE.Vector3(0, 0.4, -3.5), target: new THREE.Vector3(0, 0.5, -2.5), duration: 2000, name: 'rear-diffuser' },
  
  // Rear wing detail - low angle
  { position: new THREE.Vector3(0, 0.8, -4), target: new THREE.Vector3(0, 1.2, -2.5), duration: 2500, name: 'rear-wing-low' },
  
  // Dramatic rear 3/4 rising shot
  { position: new THREE.Vector3(-3, 1.5, -3), target: new THREE.Vector3(0, 0.6, 0), duration: 2000, name: 'rear-quarter-rise' },
  
  // Engine cover/air intake detail
  { position: new THREE.Vector3(-1.5, 1.5, -1), target: new THREE.Vector3(0, 1.0, -1), duration: 2000, name: 'engine-cover' },
  
  // Other side wheel
  { position: new THREE.Vector3(-2.2, 0.5, 1), target: new THREE.Vector3(-1.8, 0.4, 1.5), duration: 2500, name: 'front-wheel-left' },
  
  // Dramatic pull-back reveal
  { position: new THREE.Vector3(5, 2.5, 5), target: new THREE.Vector3(0, 0.5, 0), duration: 3000, name: 'reveal-pullback' },
  
  // Final hero shot
  { position: new THREE.Vector3(4, 1.5, 3), target: new THREE.Vector3(0, 0.5, 0), duration: 2500, name: 'hero-shot' },
];

export const CameraControls: React.FC<CameraControlsProps> = ({
  enablePan = false,
  enableZoom = true,
  minDistance = 4,
  maxDistance = 20,
  minPolarAngle = Math.PI / 6,    // 30 degrees from top
  maxPolarAngle = Math.PI / 2.2,  // ~82 degrees (near horizontal)
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const lastTelemetryAt = useRef(0);
  
  // Demo mode state
  const demoKeyframeIndex = useRef(0);
  const demoStartTime = useRef(0);
  const demoStartPos = useRef(new THREE.Vector3());
  const demoStartTarget = useRef(new THREE.Vector3(0, 0.5, 0));
  const demoInitialized = useRef(false);
  
  const autoRotate = useCarStore((state) => state.autoRotate);
  const isInteracting = useCarStore((state) => state.isInteracting);
  const setInteracting = useCarStore((state) => state.setInteracting);
  const demoMode = useCarStore((state) => state.demoMode);
  const introComplete = useCarStore((state) => state.introComplete);
  const setIntroComplete = useCarStore((state) => state.setIntroComplete);

  // OrbitControls exposes a matched start/end lifecycle. Global release
  // fallbacks cover pointer cancellation, tab changes, and releases that
  // happen outside the canvas so autorotation can never remain paused.
  useEffect(() => {
    const releaseInteraction = () => setInteracting(false);
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') releaseInteraction();
    };

    window.addEventListener('pointerup', releaseInteraction);
    window.addEventListener('pointercancel', releaseInteraction);
    window.addEventListener('blur', releaseInteraction);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pointerup', releaseInteraction);
      window.removeEventListener('pointercancel', releaseInteraction);
      window.removeEventListener('blur', releaseInteraction);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseInteraction();
    };
  }, [setInteracting]);
  
  // Intro camera animation - sweep from low angle to standard view
  useEffect(() => {
    if (introComplete) return;
    
    // Start position (low angle, far, to the side)
    const startPos = new THREE.Vector3(12, 0.5, 12);
    // End position (standard view)
    const endPos = new THREE.Vector3(0, 2, 10);
    
    camera.position.copy(startPos);
    camera.lookAt(0, 0.5, 0);
    invalidate();
    
    let animationId: number;
    const duration = 2500; // 2.5 seconds
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      
      camera.position.lerpVectors(startPos, endPos, eased);
      camera.lookAt(0, 0.5, 0);
      invalidate();
      
      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        setIntroComplete(true);
      }
    };
    
    // Small delay before starting
    const timeoutId = setTimeout(() => {
      animate();
    }, 500);
    
    return () => {
      clearTimeout(timeoutId);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [camera, introComplete, setIntroComplete, invalidate]);
  
  // Reset demo when toggled on
  useEffect(() => {
    if (demoMode) {
      demoKeyframeIndex.current = 0;
      demoStartTime.current = Date.now();
      demoStartPos.current.copy(camera.position);
      if (controlsRef.current) {
        demoStartTarget.current.copy(controlsRef.current.target);
      }
      demoInitialized.current = true;
    } else {
      demoInitialized.current = false;
    }
  }, [demoMode, camera]);
  
  // Track rotation changes and handle cinematic demo mode
  useFrame(() => {
    if (controlsRef.current) {
      // Cinematic demo mode animation
      if (demoMode && introComplete && demoInitialized.current) {
        const keyframe = DEMO_KEYFRAMES[demoKeyframeIndex.current];
        const elapsed = Date.now() - demoStartTime.current;
        const progress = Math.min(elapsed / keyframe.duration, 1);
        
        // Smooth ease in-out cubic
        const eased = progress < 0.5 
          ? 4 * progress * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        // Lerp camera position
        camera.position.lerpVectors(demoStartPos.current, keyframe.position, eased);
        
        // Lerp target
        controlsRef.current.target.lerpVectors(
          demoStartTarget.current,
          keyframe.target,
          eased
        );
        controlsRef.current.update();
        invalidate();
        
        // Move to next keyframe
        if (progress >= 1) {
          demoStartPos.current.copy(keyframe.position);
          demoStartTarget.current.copy(keyframe.target);
          demoKeyframeIndex.current = (demoKeyframeIndex.current + 1) % DEMO_KEYFRAMES.length;
          demoStartTime.current = Date.now();
        }
        return;
      }
      
    }
  });
  
  return (
    <OrbitControls
      ref={controlsRef}
      enabled={!demoMode} // Disable manual controls in demo mode
      enablePan={enablePan}
      enableZoom={enableZoom && !demoMode}
      minDistance={minDistance}
      maxDistance={maxDistance}
      minPolarAngle={minPolarAngle}
      maxPolarAngle={maxPolarAngle}
      onStart={() => setInteracting(true)}
      onEnd={() => setInteracting(false)}
      autoRotate={autoRotate && !demoMode && !isInteracting}
      autoRotateSpeed={1.5}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.7}
      zoomSpeed={0.8}
      target={[0, 0.5, 0]}
      onChange={() => {
        const now = performance.now();
        if (demoMode || !controlsRef.current || now - lastTelemetryAt.current < 100) return;
        lastTelemetryAt.current = now;
        useCarStore.getState().setCameraTelemetry(
          controlsRef.current.getPolarAngle(),
          controlsRef.current.getAzimuthalAngle(),
          8 / camera.position.distanceTo(controlsRef.current.target),
        );
      }}
    />
  );
};

export default CameraControls;
