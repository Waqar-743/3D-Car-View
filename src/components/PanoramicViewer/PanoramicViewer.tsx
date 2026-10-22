import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import { useGLTF } from '@react-three/drei';
import PanoramicCanvas from './PanoramicCanvas';
import CarSelector from './CarSelector';
import Controls from './Controls';
import LoadingOverlay from './LoadingOverlay';
import { HotspotModal, HotspotData } from './Hotspots';
import { ColorPicker } from './ColorPicker';
import DemoButton from './DemoButton';
import SkipDemoButton from './SkipDemoButton';
import { useCarStore } from '../../store/carStore';
import { getAllCars, getCarById } from '../../config/carModels';
import ViewerErrorBoundary from './ViewerErrorBoundary';

interface PanoramicViewerProps {
  initialCar?: string;
  onCarSelect?: (carId: string) => void;
}

export const PanoramicViewer: React.FC<PanoramicViewerProps> = ({
  initialCar = 'mclaren-mcl38',
  onCarSelect,
}) => {
  // Check if mobile for simpler animations
  const [isMobile, setIsMobile] = useState(false);
  const [viewerRetryKey, setViewerRetryKey] = useState(0);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const { 
    selectedCarId, 
    setSelectedCar,
    isLoading,
    setLoading,
    setLoadError,
    activeHotspot,
    setActiveHotspot,
    selectedBodyColor,
    setBodyColor,
    colorPickerOpen,
    toggleColorPicker,
    demoMode,
    setDemoMode,
    demoAutoStarted,
    setDemoAutoStarted,
    demoTransitionPhase,
    setDemoTransitionPhase,
    spotlightMode,
  } = useCarStore(useShallow((state) => ({
    selectedCarId: state.selectedCarId,
    setSelectedCar: state.setSelectedCar,
    isLoading: state.isLoading,
    setLoading: state.setLoading,
    setLoadError: state.setLoadError,
    activeHotspot: state.activeHotspot,
    setActiveHotspot: state.setActiveHotspot,
    selectedBodyColor: state.selectedBodyColor,
    setBodyColor: state.setBodyColor,
    colorPickerOpen: state.colorPickerOpen,
    toggleColorPicker: state.toggleColorPicker,
    demoMode: state.demoMode,
    setDemoMode: state.setDemoMode,
    demoAutoStarted: state.demoAutoStarted,
    setDemoAutoStarted: state.setDemoAutoStarted,
    demoTransitionPhase: state.demoTransitionPhase,
    setDemoTransitionPhase: state.setDemoTransitionPhase,
    spotlightMode: state.spotlightMode,
  })));
  
  const carConfig = getCarById(selectedCarId);

  const handleViewerError = useCallback((error: Error) => {
    console.error('3D viewer failed:', error);
    setLoadError(error.message || 'The 3D viewer could not be loaded.');
  }, [setLoadError]);

  const handleRetry = useCallback(() => {
    if (carConfig?.modelPath) useGLTF.clear(carConfig.modelPath);
    setLoadError(null);
    setLoading(true, 0);
    setViewerRetryKey((key) => key + 1);
  }, [carConfig?.modelPath, setLoadError, setLoading]);

  const handleLoadDefault = useCallback(() => {
    setLoadError(null);
    setSelectedCar('mclaren-mcl38');
    setViewerRetryKey((key) => key + 1);
  }, [setLoadError, setSelectedCar]);
  
  // Handle demo toggle with dark-to-light transition
  const handleDemoToggle = () => {
    if (demoMode) {
      // If already in demo mode, just stop it
      setDemoMode(false);
      setDemoTransitionPhase('idle');
    } else {
      // Start demo with transition
      setDemoTransitionPhase('dark');
      
      // After dark phase, start revealing
      setTimeout(() => {
        setDemoTransitionPhase('revealing');
        setDemoMode(true);
      }, 1200); // 1.2s dark phase
      
      // Complete transition
      setTimeout(() => {
        setDemoTransitionPhase('complete');
      }, 4500); // Longer reveal
      
      // Reset to idle
      setTimeout(() => {
        setDemoTransitionPhase('idle');
      }, 5500);
    }
  };
  
  // Handle hotspot click
  const handleHotspotClick = (hotspot: HotspotData) => {
    setActiveHotspot(hotspot);
  };
  
  // Close hotspot modal
  const handleCloseHotspot = () => {
    setActiveHotspot(null);
  };
  
  // Set initial car
  useEffect(() => {
    const requestedCar = getCarById(initialCar);
    const initialSelection = requestedCar?.active ? requestedCar.id : getAllCars()[0]?.id;
    if (initialSelection) setSelectedCar(initialSelection);
    setLoading(true, 0);
  }, [initialCar, setSelectedCar, setLoading]);
  
  // Handle car selection
  useEffect(() => {
    if (onCarSelect) {
      onCarSelect(selectedCarId);
    }
  }, [selectedCarId, onCarSelect]);
  
  // Auto-start demo mode after loading completes with dark-to-light transition
  useEffect(() => {
    if (!isLoading && !demoAutoStarted) {
      // Start with dark phase
      setDemoTransitionPhase('dark');
      
      // After 1.2s dark phase, start revealing
      const darkTimer = setTimeout(() => {
        setDemoTransitionPhase('revealing');
        setDemoMode(true);
        setDemoAutoStarted(true);
      }, 1200);
      
      // Complete transition after enhanced reveal animation
      const completeTimer = setTimeout(() => {
        setDemoTransitionPhase('complete');
      }, 4500);
      
      // Reset to idle after full transition
      const idleTimer = setTimeout(() => {
        setDemoTransitionPhase('idle');
      }, 5500);
      
      return () => {
        clearTimeout(darkTimer);
        clearTimeout(completeTimer);
        clearTimeout(idleTimer);
      };
    }
  }, [isLoading, demoAutoStarted, setDemoMode, setDemoAutoStarted, setDemoTransitionPhase]);
  
  // Stop demo after 30 seconds
  useEffect(() => {
    if (demoMode) {
      const demoTimer = setTimeout(() => {
        setDemoMode(false);
      }, 30000); // 30 seconds
      return () => clearTimeout(demoTimer);
    }
  }, [demoMode, setDemoMode]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Skip demo mode on ESC
        if (demoMode) {
          setDemoMode(false);
          return;
        }
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
      }
      
      // R for reset
      if (e.key === 'r' || e.key === 'R') {
        useCarStore.getState().resetView();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [demoMode, setDemoMode]);
  
  return (
    <div className="relative h-dvh w-full bg-charcoal overflow-clip">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal via-charcoal-200 to-charcoal z-0" />
      
      {/* 3D Canvas - Full screen */}
      <div className="absolute inset-0 z-10">
        <ViewerErrorBoundary
          key={viewerRetryKey}
          resetKey={`${selectedCarId}-${viewerRetryKey}`}
          onError={handleViewerError}
        >
          <PanoramicCanvas
            onHotspotClick={handleHotspotClick}
            onError={handleViewerError}
          />
        </ViewerErrorBoundary>
      </div>
      
      {/* Demo Transition Overlay - Dark to Light (simplified on mobile) */}
      {(demoTransitionPhase === 'dark' || demoTransitionPhase === 'revealing') && (
        <motion.div
          initial={{ opacity: demoTransitionPhase === 'dark' ? 0 : 1 }}
          animate={{ 
            opacity: demoTransitionPhase === 'dark' ? 1 : 0 
          }}
          transition={{ 
            duration: isMobile 
              ? (demoTransitionPhase === 'dark' ? 0.3 : 1.0) 
              : (demoTransitionPhase === 'dark' ? 0.6 : 3.0),
            ease: demoTransitionPhase === 'dark' ? 'easeIn' : 'easeOut'
          }}
          className="absolute inset-0 z-40 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.98) 100%)',
          }}
        >
          {/* Golden spotlight effect during reveal - only on desktop */}
          {demoTransitionPhase === 'revealing' && !isMobile && (
            <>
              {/* Main spotlight */}
              <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: [0, 0.5, 0.3, 0], scale: [0.3, 1.2, 1.8, 2.5] }}
                transition={{ duration: 3.0, ease: 'easeOut' }}
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(circle at 50% 55%, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0.1) 30%, transparent 60%)',
                }}
              />
              {/* Secondary warm glow */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.3, 0] }}
                transition={{ duration: 2.5, delay: 0.3, ease: 'easeInOut' }}
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(ellipse at 50% 70%, rgba(255,200,100,0.15) 0%, transparent 50%)',
                }}
              />
            </>
          )}
        </motion.div>
      )}
      
      {/* Hotspot Info Modal */}
      <HotspotModal hotspot={activeHotspot} onClose={handleCloseHotspot} />
      
      {/* Spotlight Mode Overlay - Sun rays from gate (simplified on mobile) */}
      {spotlightMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: isMobile ? 0.5 : 1.5, ease: 'easeOut' }}
          className="absolute inset-0 z-35 pointer-events-none"
        >
          {/* Dark vignette around edges */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 50% 100%, transparent 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.95) 100%)',
            }}
          />
          
          {/* Sun rays from bottom - only on desktop */}
          {!isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0"
              style={{
                background: 'conic-gradient(from 270deg at 50% 120%, transparent 0deg, rgba(255,215,0,0.15) 5deg, transparent 10deg, rgba(255,215,0,0.1) 15deg, transparent 20deg, rgba(255,215,0,0.12) 25deg, transparent 30deg, rgba(255,215,0,0.08) 35deg, transparent 40deg, rgba(255,215,0,0.15) 45deg, transparent 50deg, rgba(255,215,0,0.1) 55deg, transparent 60deg, rgba(255,215,0,0.12) 65deg, transparent 70deg, rgba(255,215,0,0.08) 75deg, transparent 80deg, rgba(255,215,0,0.1) 85deg, transparent 90deg)',
              }}
            />
          )}
          
          {/* Warm golden glow from gate */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 100% 50% at 50% 120%, rgba(255,200,50,0.3) 0%, rgba(255,165,0,0.15) 30%, transparent 60%)',
            }}
          />
          
          {/* Dust particles in light - only on desktop for performance */}
          {!isMobile && (
            <motion.div
              animate={{ 
                backgroundPosition: ['0% 0%', '100% 100%'],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,215,0,0.8) 1px, transparent 1px)',
                backgroundSize: '50px 50px',
              }}
            />
          )}
        </motion.div>
      )}
      
      {/* Skip Demo Button */}
      <SkipDemoButton />
      
      {/* Loading Overlay */}
      <LoadingOverlay
        onRetry={handleRetry}
        onLoadDefault={selectedCarId === 'mclaren-mcl38' ? undefined : handleLoadDefault}
      />
      
      {/* Header - Floating - Compact on mobile */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="absolute top-0 left-0 right-0 z-30 p-2 sm:p-3 md:p-4"
      >
        <div className="flex items-center justify-between gap-2">
          {/* Logo & Title */}
          <div className="glass-panel px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-3">
            <h1 className="text-sm sm:text-base md:text-xl font-bold text-light-gray">
              <span className="text-gold">F1</span> <span className="hidden sm:inline">Experience</span>
            </h1>
            <p className="text-platinum-500 text-[10px] sm:text-xs hidden sm:block">
              3D Car Configurator
            </p>
          </div>
          
          {/* Controls */}
          <div className="glass-panel p-1 sm:p-1.5 md:p-2 flex items-center gap-1 sm:gap-2">
            {/* Color Picker */}
            <ColorPicker
              selectedColor={selectedBodyColor}
              onColorChange={setBodyColor}
              isOpen={colorPickerOpen}
              onToggle={toggleColorPicker}
            />
            
            {/* Demo Button */}
            <DemoButton isActive={demoMode} onToggle={handleDemoToggle} />
            
            {/* Other Controls */}
            <Controls />
          </div>
        </div>
      </motion.header>
      
      {/* Car Selector - Bottom - Compact on mobile */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="absolute bottom-0 left-0 right-0 z-30 p-2 sm:p-3 md:p-4"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
          {/* Car Info - Hidden on very small screens */}
          <div className="glass-panel px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-3 hidden xs:block">
            {carConfig && (
              <div>
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-light-gray">
                  {carConfig.name}
                </h2>
                <p className="text-platinum-500 text-[10px] sm:text-xs md:text-sm">
                  {carConfig.model} • {carConfig.year}
                </p>
                <p className="text-platinum-600 text-[9px] sm:text-[10px] md:text-xs mt-0.5 hidden md:block">
                  1.6L V6 Turbo Hybrid | 1000+ HP
                </p>
              </div>
            )}
          </div>
          
          {/* Car Selector */}
          <div className="glass-panel p-1 sm:p-1.5 md:p-2">
            <CarSelector />
          </div>
        </div>
      </motion.div>
      
    </div>
  );
};

export default PanoramicViewer;
