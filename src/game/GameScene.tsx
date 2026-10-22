import { Suspense, useCallback, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useProgress } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';
import CarVisual from './CarVisual';
import World from './World';
import JungleWorld from './JungleWorld';
import SnowWorld from './SnowWorld';
import { currentMap, mapById } from './maps';
import Vehicle, { ChaseCamera, DrivingEffects } from './Vehicle';
import { useGame } from './store';
import { START } from './track';
import { vehicleFrame } from './runtime';
import { getRenderQuality } from '../utils/renderQuality';
import ViewerErrorBoundary from '../components/PanoramicViewer/ViewerErrorBoundary';

function Sunlight({ shadows }: { shadows: boolean }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const state = useGame.getState();
    const p = state.page === 'race' || state.page === 'results' ? vehicleFrame.position : START.point;
    target.position.copy(p); target.updateMatrixWorld();
    light.current?.position.set(p.x + 35, p.y + 65, p.z + 24);
  });
  return <>
    <hemisphereLight args={[currentMap.id === 'snow' ? '#f3f8fb' : '#fff9e5', currentMap.id === 'snow' ? '#829db0' : currentMap.id === 'jungle' ? '#4e825e' : '#84a57a', 1.8]} />
    <directionalLight ref={light} target={target} intensity={2.4} castShadow={shadows}
      shadow-mapSize={[1024, 1024]} shadow-camera-left={-28} shadow-camera-right={28}
      shadow-camera-top={28} shadow-camera-bottom={-28} shadow-camera-near={1} shadow-camera-far={150}
      shadow-bias={-0.0002} shadow-normalBias={0.04} />
    <primitive object={target} />
  </>;
}

function Showcase() {
  const page = useGame((state) => state.page);
  const selectedCar = useGame((state) => state.selectedCar); const paint = useGame((state) => state.paint);
  const { camera, invalidate } = useThree(); const transitioning = useRef(true);
  const desired = useRef(new THREE.Vector3()); const target = useRef(START.point.clone().add(new THREE.Vector3(0, 0.6, 0)));
  const ready = useCallback(() => useGame.getState().setReady(true), []);
  useEffect(() => {
    desired.current.copy(START.point).add(new THREE.Vector3(page === 'garage' ? 8.5 : 12, page === 'garage' ? 4 : 7, page === 'garage' ? 6.8 : 17));
    transitioning.current = true;
    if (camera instanceof THREE.PerspectiveCamera) { camera.fov = 42; camera.updateProjectionMatrix(); }
    invalidate();
  }, [page, camera, invalidate]);
  useFrame((_, delta) => {
    if (transitioning.current) {
      camera.position.lerp(desired.current, 1 - Math.exp(-Math.min(delta, 0.05) * 5)); camera.lookAt(target.current);
      if (camera.position.distanceTo(desired.current) < 0.04) transitioning.current = false;
    }
  });
  return <>
    <group position={[START.point.x, START.point.y + 0.04, START.point.z]} rotation={[0, START.yaw, 0]}><CarVisual carId={selectedCar} paint={paint} onReady={ready} /></group>
    <OrbitControls target={target.current} enabled={page === 'garage'} enablePan={false} enableDamping dampingFactor={0.08} minDistance={6.5} maxDistance={22} minPolarAngle={0.3} maxPolarAngle={Math.PI / 2.08} />
  </>;
}

function ContextMonitor() {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); useGame.getState().pause(); useGame.getState().setError('The graphics engine needs a fresh start. Your saved cars and records are safe.'); };
    gl.domElement.addEventListener('webglcontextlost', lost);
    return () => gl.domElement.removeEventListener('webglcontextlost', lost);
  }, [gl]);
  return null;
}

function SceneLoading() {
  const ready = useGame((state) => state.ready); const error = useGame((state) => state.error);
  const selectedMap = useGame((state) => state.selectedMap); const map = mapById(selectedMap);
  const progress = useProgress((state) => state.progress);
  if (ready || error) return null;
  return <div className="scene-loading" role="status"><img src={`${import.meta.env.BASE_URL}${map.pack}/${map.id === 'snow' ? 'route-badge' : map.id === 'jungle' ? 'jungle-badge' : 'racing-wheel'}.svg`} alt="" /><span>Getting {map.region} ready</span><progress value={progress} max={100} aria-label={`Loading ${map.name}`} /></div>;
}

export default function GameScene({ attempt }: { attempt: number }) {
  const page = useGame((state) => state.page); const status = useGame((state) => state.status);
  const returnPage = useGame((state) => state.returnPage); const runId = useGame((state) => state.runId);
  const quality = useGame((state) => state.settings.quality);
  const selectedMap = useGame((state) => state.selectedMap); const map = mapById(selectedMap);
  const device = useMemo(getRenderQuality, []);
  const low = quality === 'low' || (quality === 'auto' && device.dpr[1] === 1);
  const racing = page === 'race' || page === 'results' || (['settings', 'howto'].includes(page) && returnPage === 'race' && status === 'paused');
  const error = useCallback((issue: Error) => useGame.getState().setError(issue.message || 'The valley could not load. Please try again.'), []);
  return <><ViewerErrorBoundary key={`${attempt}-${selectedMap}`} resetKey={`${attempt}-${selectedMap}`} onError={error}>
    <Canvas
      shadows={!low} dpr={low ? 1 : [1, 1.5]}
      frameloop={['paused', 'recovering'].includes(status) || ['map', 'settings', 'howto', 'results'].includes(page) ? 'demand' : 'always'}
      camera={{ fov: 42, near: 0.1, far: map.id === 'snow' ? 4500 : 900, position: [START.point.x + 12, START.point.y + 7, START.point.z + 17] }}
      gl={{ antialias: !low, powerPreference: 'high-performance', stencil: false }}
    >
      <color attach="background" args={[map.theme.sky]} /><fog attach="fog" args={[map.theme.sky, map.id === 'snow' ? 300 : map.id === 'jungle' ? 110 : 230, map.id === 'snow' ? 1700 : map.id === 'jungle' ? 410 : 650]} />
      <ContextMonitor /><Sunlight shadows={!low} />
      <Suspense fallback={null}>
        <Physics gravity={[0, -18, 0]} timeStep={1 / 60} paused={status !== 'running'} interpolate>
          {map.id === 'snow' ? <SnowWorld low={low} /> : map.id === 'jungle' ? <JungleWorld low={low} /> : <World low={low} />}
          {racing ? <Vehicle key={runId} /> : <Showcase />}
        </Physics>
        {racing && <><ChaseCamera key={`camera-${runId}`} /><DrivingEffects key={`effects-${runId}`} /></>}
      </Suspense>
    </Canvas>
  </ViewerErrorBoundary><SceneLoading /></>;
}
