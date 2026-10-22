import { create } from 'zustand';

// CarColor type for color picker
export interface CarColor {
  id: string;
  name: string;
  hex: string;
  metalness?: number;
  roughness?: number;
}

// Default color
const DEFAULT_COLOR: CarColor = {
  id: 'papaya',
  name: 'Papaya Orange',
  hex: '#FF8000',
  metalness: 0.6,
  roughness: 0.3,
};

interface CarStore {
  // Selected car
  selectedCarId: string;
  setSelectedCar: (carId: string) => void;
  
  // Rotation state
  rotationX: number;
  rotationY: number;
  setRotation: (x: number, y: number) => void;
  
  // Zoom state
  zoom: number;
  setZoom: (zoom: number) => void;
  setCameraTelemetry: (polar: number, azimuth: number, zoom: number) => void;
  
  // Price visibility
  showPrice: boolean;
  setShowPrice: (show: boolean) => void;
  togglePrice: () => void;
  
  // View mode (3D or Image)
  viewMode: '3d' | 'image';
  setViewMode: (mode: '3d' | 'image') => void;
  toggleViewMode: () => void;
  
  // Fullscreen state
  isFullscreen: boolean;
  setFullscreen: (fullscreen: boolean) => void;
  
  // Loading state
  isLoading: boolean;
  loadingProgress: number;
  setLoading: (loading: boolean, progress?: number) => void;
  loadError: string | null;
  setLoadError: (error: string | null) => void;
  
  // Auto-rotate
  autoRotate: boolean;
  setAutoRotate: (rotate: boolean) => void;
  isInteracting: boolean;
  setInteracting: (interacting: boolean) => void;
  
  // Selected variant
  selectedVariant: number;
  setSelectedVariant: (index: number) => void;
  
  // NEW: Hotspot state (using any to avoid circular dependency)
  activeHotspot: any | null;
  setActiveHotspot: (hotspot: any | null) => void;
  
  // NEW: Color state
  selectedBodyColor: CarColor;
  setBodyColor: (color: CarColor) => void;
  colorPickerOpen: boolean;
  setColorPickerOpen: (open: boolean) => void;
  toggleColorPicker: () => void;
  
  // NEW: Demo mode
  demoMode: boolean;
  setDemoMode: (demo: boolean) => void;
  toggleDemoMode: () => void;
  demoAutoStarted: boolean;
  setDemoAutoStarted: (started: boolean) => void;
  demoTransitionPhase: 'idle' | 'dark' | 'revealing' | 'complete';
  setDemoTransitionPhase: (phase: 'idle' | 'dark' | 'revealing' | 'complete') => void;
  
  // NEW: Intro animation
  introComplete: boolean;
  setIntroComplete: (complete: boolean) => void;
  
  // NEW: Spotlight mode (triple click)
  spotlightMode: boolean;
  setSpotlightMode: (spotlight: boolean) => void;
  carClickCount: number;
  incrementCarClick: () => void;
  resetCarClick: () => void;
  
  // Reset view
  resetView: () => void;
}

export const useCarStore = create<CarStore>((set) => ({
  // Selected car
  selectedCarId: 'mclaren-mcl38',
  setSelectedCar: (carId) => set((state) => state.selectedCarId === carId
    ? { showPrice: false }
    : {
        selectedCarId: carId,
        showPrice: false,
        isLoading: true,
        loadingProgress: 0,
        loadError: null,
      }),
  
  // Rotation
  rotationX: 0,
  rotationY: 0,
  setRotation: (x, y) => set((state) => state.rotationX === x && state.rotationY === y
    ? state : { rotationX: x, rotationY: y }),
  
  // Zoom
  zoom: 1,
  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(3, zoom)) }),
  setCameraTelemetry: (polar, azimuth, zoom) => set((state) => {
    const rotationX = Math.round(polar * 1000) / 1000;
    const rotationY = Math.round(azimuth * 1000) / 1000;
    const nextZoom = Math.round(Math.max(0.5, Math.min(3, zoom)) * 100) / 100;
    if (state.rotationX === rotationX && state.rotationY === rotationY && state.zoom === nextZoom) return state;
    return { rotationX, rotationY, zoom: nextZoom };
  }),
  
  // Price
  showPrice: false,
  setShowPrice: (show) => set({ showPrice: show }),
  togglePrice: () => set((state) => ({ showPrice: !state.showPrice })),
  
  // View mode
  viewMode: '3d',
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleViewMode: () => set((state) => ({ 
    viewMode: state.viewMode === '3d' ? 'image' : '3d' 
  })),
  
  // Fullscreen
  isFullscreen: false,
  setFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),
  
  // Loading
  isLoading: true,
  loadingProgress: 0,
  setLoading: (loading, progress = 0) => set({
    isLoading: loading,
    loadingProgress: progress,
    ...(loading ? { loadError: null } : {}),
  }),
  loadError: null,
  setLoadError: (error) => set({ loadError: error, isLoading: false }),
  
  // Auto-rotate
  autoRotate: false,
  setAutoRotate: (rotate) => set({ autoRotate: rotate }),
  isInteracting: false,
  setInteracting: (interacting) => set({ isInteracting: interacting }),
  
  // Variant
  selectedVariant: 0,
  setSelectedVariant: (index) => set({ selectedVariant: index }),
  
  // NEW: Hotspot
  activeHotspot: null,
  setActiveHotspot: (hotspot) => set({ activeHotspot: hotspot }),
  
  // NEW: Color
  selectedBodyColor: DEFAULT_COLOR,
  setBodyColor: (color) => set({ selectedBodyColor: color }),
  colorPickerOpen: false,
  setColorPickerOpen: (open) => set({ colorPickerOpen: open }),
  toggleColorPicker: () => set((state) => ({ colorPickerOpen: !state.colorPickerOpen })),
  
  // NEW: Demo mode
  demoMode: false,
  setDemoMode: (demo) => set({ demoMode: demo }),
  toggleDemoMode: () => set((state) => ({ demoMode: !state.demoMode })),
  demoAutoStarted: false,
  setDemoAutoStarted: (started) => set({ demoAutoStarted: started }),
  demoTransitionPhase: 'idle',
  setDemoTransitionPhase: (phase) => set({ demoTransitionPhase: phase }),
  
  // NEW: Intro
  introComplete: false,
  setIntroComplete: (complete) => set({ introComplete: complete }),
  
  // NEW: Spotlight mode (triple click)
  spotlightMode: false,
  setSpotlightMode: (spotlight) => set({ spotlightMode: spotlight }),
  carClickCount: 0,
  incrementCarClick: () => set((state) => ({ carClickCount: state.carClickCount + 1 })),
  resetCarClick: () => set({ carClickCount: 0 }),
  
  // Reset
  resetView: () => set({
    rotationX: 0,
    rotationY: 0,
    zoom: 1,
    showPrice: false,
    demoMode: false,
    autoRotate: false,
    isInteracting: false,
  }),
}));
