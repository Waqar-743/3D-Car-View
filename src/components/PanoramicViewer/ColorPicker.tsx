import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CarColor {
  id: string;
  name: string;
  hex: string;
  metalness?: number;
  roughness?: number;
}

export const CAR_COLORS: CarColor[] = [
  { id: 'papaya', name: 'Papaya Orange', hex: '#FF8000', metalness: 0.6, roughness: 0.3 },
  { id: 'racing-red', name: 'Racing Red', hex: '#DC0000', metalness: 0.5, roughness: 0.35 },
  { id: 'british-green', name: 'British Green', hex: '#004225', metalness: 0.6, roughness: 0.3 },
  { id: 'gulf-blue', name: 'Gulf Blue', hex: '#6CACE4', metalness: 0.5, roughness: 0.4 },
  { id: 'midnight-black', name: 'Midnight Black', hex: '#0a0a0a', metalness: 0.8, roughness: 0.2 },
  { id: 'silver-arrow', name: 'Silver Arrow', hex: '#C0C0C0', metalness: 0.9, roughness: 0.15 },
  { id: 'oracle-blue', name: 'Oracle Blue', hex: '#1E3D59', metalness: 0.6, roughness: 0.3 },
  { id: 'alpine-white', name: 'Alpine White', hex: '#F5F5F5', metalness: 0.4, roughness: 0.5 },
];

// Mesh names to EXCLUDE from color changes (tires, wheels, floor, etc.)
export const EXCLUDED_MESH_PATTERNS = [
  'tire', 'tyre', 'wheel', 'rim', 'rubber',
  'floor', 'ground', 'plane',
  'glass', 'window', 'visor',
  'carbon', 'brake', 'disc',
  'chrome', 'metal', 'steel',
  'black', 'dark',
];

interface ColorPickerProps {
  selectedColor: CarColor;
  onColorChange: (color: CarColor) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onColorChange,
  isOpen,
  onToggle,
}) => {
  return (
    <div className="relative">
      {/* Toggle Button */}
      <motion.button
        type="button"
        aria-label="Choose paint color"
        aria-expanded={isOpen}
        onClick={onToggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-charcoal-200/80 
          border border-charcoal-50 hover:border-gold/50 transition-colors duration-200"
      >
        <div 
          className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-white/30"
          style={{ backgroundColor: selectedColor.hex }}
        />
        <span className="text-platinum-300 text-xs sm:text-sm font-medium hidden md:inline">Color</span>
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      </motion.button>
      
      {/* Color Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 p-3 sm:p-4 rounded-xl sm:rounded-2xl 
              bg-charcoal-200/95 backdrop-blur-xl border border-white/10 
              shadow-2xl min-w-[200px] sm:min-w-[280px] z-50"
          >
            <p className="text-platinum-400 text-[10px] sm:text-xs uppercase tracking-wider mb-2 sm:mb-3">
              Select Body Color
            </p>
            
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {CAR_COLORS.map((color) => (
                <motion.button
                  key={color.id}
                  onClick={() => {
                    onColorChange(color);
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`
                    relative w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl transition-all duration-200
                    ${selectedColor.id === color.id 
                      ? 'ring-2 ring-gold ring-offset-1 sm:ring-offset-2 ring-offset-charcoal' 
                      : 'hover:ring-1 hover:ring-white/30'
                    }
                  `}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                >
                  {selectedColor.id === color.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <span className="text-white drop-shadow-lg text-sm sm:text-lg">✓</span>
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
            
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/10">
              <p className="text-white text-sm sm:text-base font-medium">{selectedColor.name}</p>
              <p className="text-platinum-500 text-[10px] sm:text-xs mt-0.5 sm:mt-1">
                Metallic finish
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ColorPicker;
