import React from 'react';
import { motion } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import { useCarStore } from '../../store/carStore';

export const Controls: React.FC = () => {
  const { 
    autoRotate, 
    setAutoRotate, 
    isInteracting,
    resetView,
    isFullscreen,
    setFullscreen,
    zoom,
    setZoom,
  } = useCarStore(useShallow((state) => ({
    autoRotate: state.autoRotate,
    setAutoRotate: state.setAutoRotate,
    isInteracting: state.isInteracting,
    resetView: state.resetView,
    isFullscreen: state.isFullscreen,
    setFullscreen: state.setFullscreen,
    zoom: state.zoom,
    setZoom: state.setZoom,
  })));
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };
  
  const zoomIn = () => setZoom(Math.min(3, zoom + 0.2));
  const zoomOut = () => setZoom(Math.max(0.3, zoom - 0.2));
  
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {/* Zoom Out - Hidden on mobile */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={zoomOut}
        className="hidden md:flex w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl items-center justify-center
          bg-charcoal-200/80 text-platinum-400 border border-charcoal-50
          hover:bg-charcoal-100 hover:text-gold transition-colors duration-200"
        title="Zoom Out"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
        </svg>
      </motion.button>
      
      {/* Zoom Indicator - Hidden on mobile */}
      <div className="hidden md:block px-2 py-1 rounded-lg bg-charcoal-200/80 border border-charcoal-50 min-w-[50px] sm:min-w-[60px] text-center">
        <span className="text-gold text-xs sm:text-sm font-bold">{Math.round(zoom * 100)}%</span>
      </div>
      
      {/* Zoom In - Hidden on mobile */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={zoomIn}
        className="hidden md:flex w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl items-center justify-center
          bg-charcoal-200/80 text-platinum-400 border border-charcoal-50
          hover:bg-charcoal-100 hover:text-gold transition-colors duration-200"
        title="Zoom In"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
        </svg>
      </motion.button>
      
      {/* Divider - Hidden on mobile */}
      <div className="hidden md:block w-px h-6 sm:h-8 bg-charcoal-50 mx-0.5 sm:mx-1"></div>
      
      {/* Auto Rotate */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setAutoRotate(!autoRotate)}
        aria-pressed={autoRotate}
        aria-label={autoRotate
          ? isInteracting ? 'Auto rotate paused during interaction' : 'Stop auto rotate'
          : 'Start auto rotate'}
        className={`
          w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center
          transition-colors duration-200
          ${autoRotate 
            ? 'bg-gold text-charcoal' 
            : 'bg-charcoal-200/80 text-platinum-400 border border-charcoal-50 hover:bg-charcoal-100 hover:text-gold'
          }
        `}
        title={autoRotate ? 'Stop auto rotate' : 'Start auto rotate'}
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </motion.button>
      
      {/* Reset View */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={resetView}
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center
          bg-charcoal-200/80 text-platinum-400 border border-charcoal-50
          hover:bg-charcoal-100 hover:text-gold transition-colors duration-200"
        title="Reset View"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </motion.button>
      
      {/* Fullscreen */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleFullscreen}
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center
          bg-charcoal-200/80 text-platinum-400 border border-charcoal-50
          hover:bg-charcoal-100 hover:text-gold transition-colors duration-200"
        title="Fullscreen"
      >
        {isFullscreen ? (
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
          </svg>
        ) : (
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        )}
      </motion.button>
    </div>
  );
};

export default Controls;
