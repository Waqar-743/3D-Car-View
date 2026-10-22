import './track-loader.css';

export interface TrackLoaderProps {
  label: string;
  /** Actual loading progress from 0 to 100. Omit when progress is unknown. */
  progress?: number;
  compact?: boolean;
  reducedMotion?: boolean;
  className?: string;
}

/** A lightweight loading state: the car always drives toward the right. */
export default function TrackLoader({ label, progress, compact = false, reducedMotion = false, className = '' }: TrackLoaderProps) {
  const value = typeof progress === 'number' && Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : undefined;

  return <div
    className={`track-loader${compact ? ' track-loader--compact' : ''}${className ? ` ${className}` : ''}`}
    role="status"
    aria-live="polite"
    data-reduced-motion={reducedMotion ? 'true' : undefined}
  >
    <div className="track-loader-road" aria-hidden="true">
      <span className="track-loader-car">
        <img src={`${import.meta.env.BASE_URL}branding/f1-loading-car.svg`} alt="" width="96" height="40" draggable="false" />
      </span>
      <span className="track-loader-finish" />
    </div>
    <div className="track-loader-caption">
      <span className="track-loader-label">{label}</span>
      {value !== undefined && <span className="track-loader-percent" aria-hidden="true">{Math.round(value)}%</span>}
    </div>
    {value !== undefined && <progress className="track-loader-progress" value={value} max={100} aria-label={label} />}
  </div>;
}
