import React, { useRef, useEffect, Suspense } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { useCarStore } from '../../store/carStore';
import { getCarById } from '../../config/carModels';
import { EXCLUDED_MESH_PATTERNS } from './ColorPicker';
import { F1_HOTSPOTS, HotspotData } from './Hotspots';

interface CarModel3DProps {
  carId: string;
  onHotspotClick?: (hotspot: HotspotData) => void;
}

// Check if a mesh should be excluded from color changes
const shouldExcludeMesh = (meshName: string): boolean => {
  const lowerName = meshName.toLowerCase();
  return EXCLUDED_MESH_PATTERNS.some(pattern => lowerName.includes(pattern));
};

function CarModelInner({ carId, onHotspotClick }: CarModel3DProps) {
  const carConfig = getCarById(carId);
  const setLoading = useCarStore((state) => state.setLoading);
  const selectedBodyColor = useCarStore((state) => state.selectedBodyColor);
  const activeHotspotId = useCarStore((state) => state.activeHotspot?.id);
  const invalidate = useThree((state) => state.invalidate);
  
  // Load 3D model
  if (!carConfig) {
    throw new Error(`The selected vehicle (${carId}) is not available.`);
  }

  const modelPath = carConfig.modelPath;
  const { scene } = useGLTF(modelPath, false, true);
  
  // A cached model may not produce a new progress event, so the model itself
  // is the authoritative signal that the loading overlay can be dismissed.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setLoading(false, 100));
    return () => cancelAnimationFrame(frame);
  }, [scene, setLoading]);
  
  // Clone and process the scene
  const prepared = React.useMemo(() => {
    const clone = scene.clone();
    const materials = new Map<string, THREE.MeshStandardMaterial>();
    const paintMaterials = new Set<THREE.MeshPhysicalMaterial>();
    
    // Calculate bounding box to auto-scale and position
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    
    // Normalize scale so model fits nicely
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 6; // Target size
    const autoScale = targetSize / maxDim;
    clone.scale.multiplyScalar(autoScale);
    
    // Recalculate bounding box after scaling
    box.setFromObject(clone);
    const newCenter = box.getCenter(new THREE.Vector3());
    const newMin = box.min;
    
    // Center horizontally and position on ground (y = 0)
    clone.position.x = -newCenter.x;
    clone.position.z = -newCenter.z;
    clone.position.y = -newMin.y; // Lift slightly above ground
    
    // One clone per shared material and paint role, rather than per mesh.
    // Textures and geometry remain shared with the GLTF cache.
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        const prepareMaterial = (source: THREE.Material) => {
          if (!(source instanceof THREE.MeshStandardMaterial)) return source;
          const { r, g, b } = source.color;
          const fallbackPaintable = !shouldExcludeMesh(child.name) && !(r < 0.15 && g < 0.15 && b < 0.15);
          const paintable = source.userData.paintable ?? fallbackPaintable;
          const key = `${source.uuid}:${paintable}`;
          if (!materials.has(key)) {
            let material: THREE.MeshStandardMaterial;
            if (paintable) {
              const paint = source instanceof THREE.MeshPhysicalMaterial
                ? source.clone()
                : new THREE.MeshPhysicalMaterial();
              if (!(source instanceof THREE.MeshPhysicalMaterial)) {
                THREE.MeshStandardMaterial.prototype.copy.call(paint, source);
              }
              paint.clearcoat = 1;
              paint.clearcoatRoughness = 0.1;
              paint.reflectivity = 1;
              paintMaterials.add(paint);
              material = paint;
            } else {
              material = source.clone();
            }
            material.envMapIntensity = 2;
            material.metalness = Math.max(material.metalness, 0.5);
            material.roughness = Math.min(material.roughness, 0.5);
            materials.set(key, material);
          }
          return materials.get(key)!;
        };
        child.material = Array.isArray(child.material)
          ? child.material.map(prepareMaterial)
          : prepareMaterial(child.material);
      }
    });

    return { scene: clone, materials, paintMaterials };
  }, [scene]);

  useEffect(() => () => {
    prepared.materials.forEach((material) => material.dispose());
  }, [prepared]);
  
  // Apply color changes when selectedBodyColor changes
  useEffect(() => {
    prepared.paintMaterials.forEach((material) => {
      material.color.set(selectedBodyColor.hex);
      material.metalness = selectedBodyColor.metalness ?? 0.7;
      material.roughness = selectedBodyColor.roughness ?? 0.15;
      material.envMapIntensity = 2.5;
    });
    invalidate();
  }, [prepared, selectedBodyColor, invalidate]);
  
  return (
    <group position={[0, 0, 0]}>
      <primitive object={prepared.scene} dispose={null} />
      
      {/* Hotspots that move with the car */}
      {F1_HOTSPOTS.map((hotspot) => (
        <HotspotMarkerInternal
          key={hotspot.id}
          hotspot={hotspot}
          onClick={onHotspotClick}
          isActive={activeHotspotId === hotspot.id}
        />
      ))}
    </group>
  );
}

// Internal hotspot marker that moves with the car
interface HotspotMarkerInternalProps {
  hotspot: HotspotData;
  onClick?: (hotspot: HotspotData) => void;
  isActive: boolean;
}

const HotspotMarkerInternal: React.FC<HotspotMarkerInternalProps> = ({ hotspot, onClick, isActive }) => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <group position={hotspot.position}>
      <Html center distanceFactor={8}>
        <motion.button
          type="button"
          aria-label={`Details about ${hotspot.title}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.3 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onClick?.(hotspot)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            background: 'transparent',
            border: `2px solid ${isActive ? '#00CED1' : 'rgba(0, 206, 209, 0.8)'}`,
            boxShadow: hovered || isActive
              ? '0 0 15px rgba(0, 206, 209, 0.8), 0 0 30px rgba(0, 206, 209, 0.4), inset 0 0 10px rgba(0, 206, 209, 0.2)'
              : '0 0 8px rgba(0, 206, 209, 0.5)',
            position: 'relative',
          }}
        >
          <div 
            style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: hovered || isActive ? '#00CED1' : 'rgba(0, 206, 209, 0.6)',
            }}
          />
          
          <motion.div
            animate={{
              scale: [1, 2, 1],
              opacity: [0.6, 0, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              border: '1px solid #00CED1',
            }}
          />
        </motion.button>
        
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              position: 'absolute',
              bottom: '-28px',
              left: '50%',
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
            }}
          >
            <span 
              style={{
                fontSize: '11px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: 'rgba(0, 0, 0, 0.85)',
                color: '#00CED1',
                border: '1px solid rgba(0, 206, 209, 0.3)',
              }}
            >
              {hotspot.title}
            </span>
          </motion.div>
        )}
      </Html>
    </group>
  );
};

// Loading fallback component
function LoadingFallback() {
  const meshRef = useRef<THREE.Mesh>(null);
  const invalidate = useThree((state) => state.invalidate);
  
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 2;
      invalidate();
    }
  });
  
  return (
    <mesh ref={meshRef} position={[0, 0.5, 0]}>
      <boxGeometry args={[3, 0.8, 6]} />
      <meshStandardMaterial color="#d4af37" wireframe />
    </mesh>
  );
}

export const CarModel3D: React.FC<CarModel3DProps> = (props) => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CarModelInner {...props} />
    </Suspense>
  );
};

export default CarModel3D;
