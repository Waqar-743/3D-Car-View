import React, { useMemo, Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useGLTF, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import CarModel3D from './CarModel3D';
import Lighting from './Lighting';
import CameraControls from './CameraControls';
import { HotspotData } from './Hotspots';
import { WallDecoration, BackWallDecoration, CornerWallDecoration } from './WallDecoration';
import { useCarStore } from '../../store/carStore';
import { getAllCars, getCarById } from '../../config/carModels';
import { getRenderQuality } from '../../utils/renderQuality';
import PerformanceProbe from './PerformanceProbe';

// Progress reporter component to communicate with store
const ProgressReporter: React.FC = () => {
  const progress = useProgress((state) => state.progress);
  const setLoading = useCarStore((state) => state.setLoading);
  const isLoading = useCarStore((state) => state.isLoading);
  const loadError = useCarStore((state) => state.loadError);

  useEffect(() => {
    // Only the selected model may complete loading. Background prefetches
    // must not bring the overlay back or report a cached model as unready.
    if (isLoading && !loadError) setLoading(true, Math.min(95, progress));
  }, [progress, isLoading, loadError, setLoading]);

  return null;
};

const WebGLContextReporter: React.FC<{ onError?: (error: Error) => void }> = ({ onError }) => {
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      onError?.(new Error('The 3D renderer stopped responding.'));
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    return () => canvas.removeEventListener('webglcontextlost', handleContextLost);
  }, [gl, onError]);

  return null;
};

// Garage environment component
const GarageEnvironment: React.FC = React.memo(() => {
  // Floor material - polished concrete
  const floorMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#3a3a3a'),
    metalness: 0.2,
    roughness: 0.7,
    side: THREE.FrontSide,
  }), []);

  // Wall material - industrial grey
  const wallMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#4a4a4a'),
    metalness: 0.1,
    roughness: 0.9,
    side: THREE.DoubleSide,
  }), []);

  // Accent stripe material - racing stripe
  const accentMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#d4af37'),
    metalness: 0.3,
    roughness: 0.5,
  }), []);

  // Dark accent material
  const darkAccentMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#2a2a2a'),
    metalness: 0.1,
    roughness: 0.8,
  }), []);

  // White line material
  const whiteLineMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ffffff'),
    metalness: 0.0,
    roughness: 0.5,
  }), []);

  const garageWidth = 25;
  const garageDepth = 30;
  const wallHeight = 12;

  return (
    <group>
      {/* Main floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[garageWidth, garageDepth]} />
        <primitive object={floorMaterial} attach="material" />
      </mesh>

      {/* Floor grid lines - reduced count */}
      {Array.from({ length: 3 }).map((_, i) => (
        <mesh key={`hline-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -10 + i * 10]}>
          <planeGeometry args={[garageWidth, 0.05]} />
          <primitive object={darkAccentMaterial} attach="material" />
        </mesh>
      ))}
      {Array.from({ length: 3 }).map((_, i) => (
        <mesh key={`vline-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[-10 + i * 10, 0, 0]}>
          <planeGeometry args={[0.05, garageDepth]} />
          <primitive object={darkAccentMaterial} attach="material" />
        </mesh>
      ))}

      {/* Parking spot lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4, 0.001, 0]}>
        <planeGeometry args={[0.1, 8]} />
        <primitive object={whiteLineMaterial} attach="material" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, 0.001, 0]}>
        <planeGeometry args={[0.1, 8]} />
        <primitive object={whiteLineMaterial} attach="material" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 4]}>
        <planeGeometry args={[8, 0.1]} />
        <primitive object={whiteLineMaterial} attach="material" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, -4]}>
        <planeGeometry args={[8, 0.1]} />
        <primitive object={whiteLineMaterial} attach="material" />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, wallHeight / 2, -garageDepth / 2]} receiveShadow>
        <planeGeometry args={[garageWidth, wallHeight]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>

      {/* Back wall accent stripe */}
      <mesh position={[0, 2, -garageDepth / 2 + 0.01]}>
        <planeGeometry args={[garageWidth, 0.3]} />
        <primitive object={accentMaterial} attach="material" />
      </mesh>

      {/* Left wall */}
      <mesh position={[-garageWidth / 2, wallHeight / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[garageDepth, wallHeight]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>

      {/* Left wall accent stripe */}
      <mesh position={[-garageWidth / 2 + 0.01, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[garageDepth, 0.3]} />
        <primitive object={accentMaterial} attach="material" />
      </mesh>

      {/* Right wall */}
      <mesh position={[garageWidth / 2, wallHeight / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[garageDepth, wallHeight]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>

      {/* Right wall accent stripe */}
      <mesh position={[garageWidth / 2 - 0.01, 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[garageDepth, 0.3]} />
        <primitive object={accentMaterial} attach="material" />
      </mesh>

      {/* Ceiling (optional - darker) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, wallHeight, 0]}>
        <planeGeometry args={[garageWidth, garageDepth]} />
        <meshStandardMaterial color="#1a1a1a" side={THREE.FrontSide} />
      </mesh>

      {/* Front wall sections (partial - like garage door frame) */}
      <mesh position={[-garageWidth / 2 + 2, wallHeight / 2, garageDepth / 2]} receiveShadow>
        <planeGeometry args={[4, wallHeight]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      <mesh position={[garageWidth / 2 - 2, wallHeight / 2, garageDepth / 2]} receiveShadow>
        <planeGeometry args={[4, wallHeight]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      {/* Top section above "door" */}
      <mesh position={[0, wallHeight - 1.5, garageDepth / 2]} receiveShadow>
        <planeGeometry args={[garageWidth - 8, 3]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>

      {/* Wall base trim */}
      <mesh position={[0, 0.15, -garageDepth / 2 + 0.02]}>
        <boxGeometry args={[garageWidth, 0.3, 0.1]} />
        <primitive object={darkAccentMaterial} attach="material" />
      </mesh>
      <mesh position={[-garageWidth / 2 + 0.05, 0.15, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[garageDepth, 0.3, 0.1]} />
        <primitive object={darkAccentMaterial} attach="material" />
      </mesh>
      <mesh position={[garageWidth / 2 - 0.05, 0.15, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[garageDepth, 0.3, 0.1]} />
        <primitive object={darkAccentMaterial} attach="material" />
      </mesh>
    </group>
  );
});

GarageEnvironment.displayName = 'GarageEnvironment';

interface PanoramicCanvasProps {
  onHotspotClick?: (hotspot: HotspotData) => void;
  onError?: (error: Error) => void;
}

export const PanoramicCanvas: React.FC<PanoramicCanvasProps> = ({ onHotspotClick, onError }) => {
  const selectedCarId = useCarStore((state) => state.selectedCarId);
  const isLoading = useCarStore((state) => state.isLoading);
  const isInteracting = useCarStore((state) => state.isInteracting);
  const demoMode = useCarStore((state) => state.demoMode);
  const quality = useMemo(getRenderQuality, []);

  // Fetch one alternate model only when the active model is ready and the
  // browser reports enough network, memory, and CPU capacity. The active
  // model always loads on demand through CarModel3D.
  useEffect(() => {
    if (isLoading || isInteracting || demoMode || !getRenderQuality().prefetch) return;

    const selectedPath = getCarById(selectedCarId)?.modelPath;
    const alternatePath = Array.from(new Set(getAllCars().map((car) => car.modelPath)))
      .find((path) => path !== selectedPath);
    if (!alternatePath) return;

    let idleHandle: number | undefined;
    const timer = window.setTimeout(() => {
      const prefetch = () => {
        if (getRenderQuality().prefetch) useGLTF.preload(alternatePath, false, true);
      };
      if (window.requestIdleCallback) {
        idleHandle = window.requestIdleCallback(prefetch, { timeout: 4000 });
      } else {
        prefetch();
      }
    }, 3000);
    return () => {
      window.clearTimeout(timer);
      if (idleHandle !== undefined) window.cancelIdleCallback(idleHandle);
    };
  }, [isLoading, selectedCarId, isInteracting, demoMode]);
  
  return (
    <Canvas
      frameloop="demand"
      shadows={quality.shadows ? 'soft' : false}
      dpr={quality.dpr}
      camera={{
        fov: 45,
        near: 0.1,
        far: 100,
        position: [0, 2, 10],
      }}
      gl={{
        antialias: quality.antialias,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      }}
      performance={{ min: 0.5 }}
      style={{
        background: 'linear-gradient(180deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
      }}
    >
      <ProgressReporter />
      <WebGLContextReporter onError={onError} />
      {/* Lighting */}
      <Lighting shadows={quality.shadows} shadowMapSize={quality.shadowMapSize} />
      
      {/* Garage environment */}
      <GarageEnvironment />
      
      {/* Wall Decorations with Images */}
      <Suspense fallback={null}>
        <WallDecoration />
        <BackWallDecoration />
        <CornerWallDecoration />
      </Suspense>
      
      {/* 3D Car Model with integrated hotspots */}
      <CarModel3D carId={selectedCarId} onHotspotClick={onHotspotClick} />
      
      {/* Camera Controls */}
      <CameraControls />
      {import.meta.env.DEV && new URLSearchParams(window.location.search).has('performance') && <PerformanceProbe />}
      
    </Canvas>
  );
};

export default PanoramicCanvas;
