import React from 'react';
import { motion } from 'framer-motion';
import { useCarStore } from '../../store/carStore';

// F1 Car SVG Icon Component - Brighter colors
const F1CarIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg 
    viewBox="0 0 100 40" 
    className={className}
    style={style}
    fill="currentColor"
  >
    {/* F1 Car silhouette */}
    <path d="M95 25 L90 22 L85 22 L82 18 L75 16 L70 16 L68 14 L55 12 L45 12 L35 14 L25 16 L15 18 L10 20 L5 22 L3 25 L5 28 L15 28 L18 25 L22 25 L25 28 L35 28 L38 25 L62 25 L65 28 L75 28 L78 25 L82 25 L85 28 L92 28 L95 25 Z" />
    {/* Front wheel */}
    <circle cx="20" cy="26" r="6" fill="#2a2a2a" />
    <circle cx="20" cy="26" r="4" fill="#444" />
    <circle cx="20" cy="26" r="2" fill="#666" />
    {/* Rear wheel */}
    <circle cx="80" cy="26" r="6" fill="#2a2a2a" />
    <circle cx="80" cy="26" r="4" fill="#444" />
    <circle cx="80" cy="26" r="2" fill="#666" />
    {/* Halo */}
    <path d="M45 12 Q50 8 55 12" fill="none" stroke="currentColor" strokeWidth="2" />
    {/* Front wing detail */}
    <rect x="2" y="20" width="8" height="2" rx="1" />
    {/* Rear wing */}
    <rect x="88" y="15" width="2" height="8" />
    <rect x="85" y="13" width="10" height="2" rx="1" />
  </svg>
);

interface LoadingOverlayProps {
  onRetry: () => void;
  onLoadDefault?: () => void;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ onRetry, onLoadDefault }) => {
  const isLoading = useCarStore((state) => state.isLoading);
  const loadingProgress = useCarStore((state) => state.loadingProgress);
  const loadError = useCarStore((state) => state.loadError);
  const [statusText, setStatusText] = React.useState('INITIALIZING SYSTEMS');
  
  React.useEffect(() => {
    const statuses = [
      'CALIBRATING SENSORS',
      'OPTIMIZING AERODYNAMICS',
      'WARMING TIRES',
      'FUELING ENGINE',
      'CHECKING TELEMETRY',
      'READY FOR TRACK'
    ];
    
    if (loadingProgress < 20) setStatusText(statuses[0]);
    else if (loadingProgress < 40) setStatusText(statuses[1]);
    else if (loadingProgress < 60) setStatusText(statuses[2]);
    else if (loadingProgress < 80) setStatusText(statuses[3]);
    else if (loadingProgress < 95) setStatusText(statuses[4]);
    else setStatusText(statuses[5]);
  }, [loadingProgress]);

  if (!isLoading && !loadError) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      role={loadError ? 'alert' : 'status'}
      aria-live="polite"
      aria-label={loadError ? '3D viewer failed to load' : 'Loading 3D viewer'}
      style={{
        background: 'radial-gradient(circle at center, #1e1d1a 0%, #0d0d0c 100%)',
      }}
    >
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(212,175,55,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.08) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(circle at center, black, transparent 72%)',
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center px-4 max-w-4xl w-full">
        {/* Logo/Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8"
        >
          <F1CarIcon className="w-24 h-12 md:w-32 md:h-16" style={{ color: '#D4AF37' }} />
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-12"
        >
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-4 text-balance"
            style={{ 
              color: '#FFFFFF',
              fontFamily: "'Playfair Display', serif",
              letterSpacing: '-0.02em'
            }}
          >
            {loadError ? 'VIEWER ' : 'PRECISION '}
            <span className="text-[#D4AF37]">{loadError ? 'OFFLINE' : 'ENGINEERING'}</span>
          </h1>
          {loadError ? (
            <p className="mx-auto max-w-xl text-sm md:text-base leading-relaxed text-white/65 text-pretty">
              We couldn&apos;t prepare this 3D model. Check your connection or try loading it again.
            </p>
          ) : (
            <p className="text-[#D4AF37] font-mono tracking-[0.3em] text-xs md:text-sm uppercase opacity-80">
              Automotive Visualization Studio
            </p>
          )}
        </motion.div>
        
        {/* Progress / recovery section */}
        {loadError ? (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={onRetry}
              className="min-w-36 rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-charcoal transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal"
            >
              Try again
            </button>
            {onLoadDefault && (
              <button
                type="button"
                onClick={onLoadDefault}
                className="min-w-36 rounded-lg border border-white/20 bg-white/5 px-5 py-3 text-sm font-medium text-white/80 transition-colors duration-200 hover:border-gold/60 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal"
              >
                Load McLaren MCL38
              </button>
            )}
          </div>
        ) : (
        <div
          className="w-full max-w-md"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(loadingProgress)}
          aria-valuetext={`${Math.round(loadingProgress)} percent loaded`}
        >
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] md:text-xs font-mono text-white/40 tracking-widest uppercase">
              {statusText}
            </span>
            <span className="text-xl md:text-2xl font-mono text-[#D4AF37] tabular-nums font-light">
              {Math.round(loadingProgress)}%
            </span>
          </div>
          
          <div className="h-[2px] w-full bg-white/10 relative overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full bg-[#D4AF37]"
              initial={{ width: 0 }}
              animate={{ width: `${loadingProgress}%` }}
              transition={{ duration: 0.3 }}
              style={{
                boxShadow: '0 0 10px #D4AF37'
              }}
            />
          </div>
          
          <div className="mt-8 flex justify-center">
             <div className="flex gap-1">
                {[...Array(10)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      opacity: loadingProgress > (i * 10) ? 1 : 0.2,
                      scaleY: loadingProgress > (i * 10) ? [1, 1.5, 1] : 1
                    }}
                    className="w-1 h-4 bg-[#D4AF37]"
                  />
                ))}
             </div>
          </div>
        </div>
        )}
      </div>
      
      {/* Bottom Corner Intel */}
      {!loadError && <div className="absolute bottom-8 left-8 hidden md:block border-l border-white/20 pl-4 py-1">
        <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Environment</p>
        <p className="text-xs font-mono text-white/60 uppercase">Raytraced Garage v2.4</p>
      </div>}
      
      {!loadError && <div className="absolute bottom-8 right-8 hidden md:block border-r border-white/20 pr-4 py-1 text-right">
        <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Hardware</p>
        <p className="text-xs font-mono text-white/60 uppercase">WebGL 2.0 Enabled</p>
      </div>}
    </motion.div>
  );
};

export default LoadingOverlay;
