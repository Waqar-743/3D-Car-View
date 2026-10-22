import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCarStore } from '../../store/carStore';

export const SkipDemoButton: React.FC = () => {
  const demoMode = useCarStore((state) => state.demoMode);
  const setDemoMode = useCarStore((state) => state.setDemoMode);
  
  const handleSkip = () => {
    setDemoMode(false);
  };
  
  // Only show when demo is playing
  const showButton = demoMode;
  
  return (
    <AnimatePresence>
      {showButton && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
          onClick={handleSkip}
          className="fixed top-2 right-2 sm:top-4 sm:right-4 z-40 flex items-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg
            font-medium text-xs sm:text-sm transition-colors duration-200 group"
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(0, 206, 209, 0.4)',
            color: '#00CED1',
            backdropFilter: 'blur(10px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 206, 209, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(0, 206, 209, 0.8)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
            e.currentTarget.style.borderColor = 'rgba(0, 206, 209, 0.4)';
          }}
        >
          {/* Skip icon */}
          <svg 
            className="w-3 h-3 sm:w-4 sm:h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 5l7 7-7 7M5 5l7 7-7 7" 
            />
          </svg>
          
          <span>Skip</span>
          
          {/* Keyboard hint - hidden on mobile */}
          <span 
            className="hidden sm:inline ml-1 px-1.5 py-0.5 rounded text-xs"
            style={{
              background: 'rgba(0, 206, 209, 0.2)',
              color: 'rgba(0, 206, 209, 0.8)',
            }}
          >
            ESC
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default SkipDemoButton;
