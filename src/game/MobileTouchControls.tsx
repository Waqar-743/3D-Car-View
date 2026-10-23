import { useEffect, useRef, useState } from 'react';
import { clearInput, drivingInput } from './input';
import { useMobileConfig } from './mobileBridge';
import type { DrivingInput } from './driving';

export function MobileDriverBadge() {
  const { character } = useMobileConfig();
  const pack = character === 'snowman' ? 'snow-pack' : 'jungle-pack';
  return <div className="mobile-driver-badge"><img src={`${import.meta.env.BASE_URL}${pack}/${character}.svg`} alt="" width="32" height="32" /><span>{character === 'snowman' ? 'SNOWMAN' : character.toUpperCase()}</span><button aria-label="Save checkpoint and return to app menu" onClick={() => window.WindwayMobile?.command('menu')}>MENU</button></div>;
}

function Pedal({ action, children, label, className = '' }: { action: Exclude<keyof DrivingInput, 'steering'>; children: React.ReactNode; label: string; className?: string }) {
  const [pressed, setPressed] = useState(false);
  const release = () => { drivingInput[action] = false; setPressed(false); };
  useEffect(() => () => { drivingInput[action] = false; }, [action]);
  return <button className={`touch-button ${className}`} aria-label={label} aria-pressed={pressed}
    onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); drivingInput[action] = true; setPressed(true); }}
    onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release} onContextMenu={(event) => event.preventDefault()}>{children}</button>;
}
function SteeringWheel() {
  const { sensitivity } = useMobileConfig();
  const wheel = useRef<SVGSVGElement>(null), lastAngle = useRef(0), total = useRef(0), active = useRef<number | null>(null);
  const angle = (event: React.PointerEvent<HTMLDivElement>) => { const rect = event.currentTarget.getBoundingClientRect(); return Math.atan2(event.clientY - rect.top - rect.height / 2, event.clientX - rect.left - rect.width / 2); };
  const release = () => { active.current = null; total.current = 0; delete drivingInput.steering; if (wheel.current) { wheel.current.style.transform = 'rotate(0deg)'; wheel.current.parentElement?.setAttribute('aria-valuenow', '0'); } };
  useEffect(() => release, []);
  return <div className="mobile-wheel" role="slider" tabIndex={0} aria-label="Steering wheel. Drag to turn; release to center." aria-valuemin={-1} aria-valuemax={1} aria-valuenow={0}
    onPointerDown={(event) => { event.preventDefault(); active.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId); lastAngle.current = angle(event); }}
    onPointerMove={(event) => {
      if (active.current !== event.pointerId) return;
      const next = angle(event); let delta = next - lastAngle.current;
      if (delta > Math.PI) delta -= 2 * Math.PI; if (delta < -Math.PI) delta += 2 * Math.PI;
      lastAngle.current = next; total.current = Math.max(-1.92, Math.min(1.92, total.current + delta));
      drivingInput.steering = Math.max(-1, Math.min(1, -total.current / 1.92 * sensitivity));
      event.currentTarget.setAttribute('aria-valuenow', drivingInput.steering.toFixed(2));
      if (wheel.current) wheel.current.style.transform = `rotate(${total.current}rad)`;
    }} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}
    onKeyDown={(event) => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); drivingInput.steering = event.key === 'ArrowLeft' ? 0.7 : -0.7; } }} onKeyUp={release} onBlur={release}>
    <svg ref={wheel} viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="var(--hud-panel)" stroke="var(--paper)" strokeWidth="9" /><path d="M16 40h68M50 50v35" stroke="var(--paper)" strokeWidth="9" /><circle cx="50" cy="48" r="13" fill="var(--hud-accent)" /><path d="M50 10v7" stroke="var(--hud-accent)" strokeWidth="7" /></svg>
  </div>;
}
export default function MobileTouchControls() {
  const { steeringMode } = useMobileConfig();
  useEffect(() => () => clearInput(), [steeringMode]);
  return <div className={`touch-controls mobile-controls mobile-controls-${steeringMode}`}>
    <div className="mobile-steering-cluster">
      <Pedal action="handbrake" label="Hold handbrake" className="touch-drift">DRIFT</Pedal>
      {steeringMode === 'wheel' ? <SteeringWheel /> : steeringMode === 'tilt' ? <div className="mobile-tilt-controls"><span>TILT TO STEER</span><button className="touch-button" onClick={() => window.WindwayMobile?.command('calibrate')}>CENTER PHONE</button></div> : <div className="mobile-arrow-controls"><Pedal action="left" label="Steer left">←</Pedal><Pedal action="right" label="Steer right">→</Pedal></div>}
    </div>
    <div className="touch-pedals"><Pedal action="brake" label="Brake or reverse" className="touch-brake">BRAKE</Pedal><Pedal action="throttle" label="Accelerate" className="touch-throttle">GO</Pedal></div>
  </div>;
}
