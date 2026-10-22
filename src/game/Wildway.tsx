import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGame, type Page } from './store';
import { GAME_CARS, PAINTS, art, carById, formatTime } from './config';
import { GAME_MAPS, gameRecordKey, mapById } from './maps';
import { CHECKPOINTS, MAP_PATH, TRACK_LENGTH } from './track';
import { clearInput, drivingInput, installDrivingInput } from './input';
import { gameAudio } from './audio';
import type { DrivingInput } from './driving';
import ViewerErrorBoundary from '../components/PanoramicViewer/ViewerErrorBoundary';
import './wildway.css';

const GameScene = lazy(() => import('./GameScene'));

const JUNGLE_ART = new Set(['lion', 'giraffe', 'deer', 'python', 'horse', 'wolf', 'monkey', 'toucan', 'elephant', 'waqar', 'imran', 'tatheer', 'broadleaf-tree', 'palm-tree', 'jungle-badge', 'lap-badge', 'stop-station', 'boost-ramp']);
const THEMED_ART = new Set(['finish-flag', 'track-minimap', 'winner-trophy', 'checkpoint']);
function Art({ name, className = '', alt = '' }: { name: string; className?: string; alt?: string }) {
  const jungle = useGame((state) => state.selectedMap === 'jungle');
  const resolvedName = name === 'jungle-tree' ? 'broadleaf-tree' : jungle && name === 'wild-haired-driver' ? 'waqar' : jungle && name === 'crying-driver' ? 'tatheer' : name;
  const source = JUNGLE_ART.has(resolvedName) || (jungle && THEMED_ART.has(resolvedName)) ? `${import.meta.env.BASE_URL}jungle-pack/${resolvedName}.svg` : art(resolvedName);
  return <img className={className} src={source} alt={alt} draggable={false} />;
}
function Brand({ light = false }: { light?: boolean }) {
  const jungle = useGame((state) => state.selectedMap === 'jungle');
  return <button className={`brand ${light ? 'brand-light' : ''}`} onClick={() => useGame.getState().navigate('home')} aria-label="Windway home"><Art name={jungle ? 'jungle-badge' : 'vehicle-badge'} /><span>WINDWAY<small>TAKE THE LONG WAY.</small></span></button>;
}
function StartButton({ children = 'Let’s drive', className = '' }: { children?: React.ReactNode; className?: string }) {
  return <button className={`ww-button ww-primary ${className}`} onClick={() => { void gameAudio.unlock(); useGame.getState().startRace(); }}>{children}<span aria-hidden="true">↗</span></button>;
}
function PageTitle({ children, eyebrow }: { children: React.ReactNode; eyebrow: string }) {
  return <div className="page-title-block"><p className="ww-eyebrow">{eyebrow}</p><h1 className="page-title" data-page-title tabIndex={-1}>{children}</h1></div>;
}
function BackButton({ to = 'home', label = 'Back to the start' }: { to?: Page; label?: string }) {
  return <button className="back-link" onClick={() => useGame.getState().navigate(to)}>← {label}</button>;
}

function Header() {
  const page = useGame((state) => state.page);
  return <header className="ww-header"><Brand /><nav aria-label="Main navigation">
    {([{ page: 'garage', text: 'The garage' }, { page: 'map', text: 'The maps' }, { page: 'howto', text: 'How to play' }, { page: 'settings', text: 'Settings' }] as const).map((link) => <button key={link.page} aria-current={page === link.page ? 'page' : undefined} onClick={() => useGame.getState().navigate(link.page)}>{link.text}</button>)}
  </nav><span className="header-edition">TWO WORLDS. <i /> ONE WINDWAY.</span></header>;
}

function MapSelector({ compact = false }: { compact?: boolean }) {
  const selected = useGame((state) => state.selectedMap);
  const selectMap = useGame((state) => state.selectMap);
  return <fieldset className={`map-selector ${compact ? 'map-selector-compact' : ''}`}><legend>Choose your road</legend><div>{GAME_MAPS.map((map, index) => <button key={map.id} type="button" aria-pressed={selected === map.id} onClick={() => selectMap(map.id)}><Art name={map.id === 'jungle' ? 'jungle-badge' : 'mountain-range'} /><span><strong>{map.name}</strong><small>{map.id === 'jungle' ? 'Dense jungle' : 'Mountain valley'} · {map.laps} {map.laps === 1 ? 'lap' : 'laps'}</small></span><i aria-hidden="true">{selected === map.id ? '✓' : `0${index + 1}`}</i></button>)}</div></fieldset>;
}

function Home() {
  const selectedCar = useGame((state) => state.selectedCar); const car = carById(selectedCar);
  const map = mapById(useGame((state) => state.selectedMap)); const jungle = map.id === 'jungle';
  const best = useGame((state) => state.bestTimes[gameRecordKey(state.selectedMap, state.selectedCar)]);
  return <main className="home-page">
    <div className="home-copy"><p className="ww-eyebrow"><span className="little-star" aria-hidden="true">✳</span> {jungle ? 'LESS OPEN LAND. MORE WILD COMPANY.' : 'GOOD ROADS. QUESTIONABLE DECISIONS.'}</p>
      <h1 data-page-title tabIndex={-1}>{jungle ? <>Deep jungle.<br /><em>Wild turns.</em><br />Full send.</> : <>Wrong turns.<br /><em>Right kind</em><br />of fun.</>}</h1>
      <p className="home-description">{jungle ? <>A road beneath the canopy. Two fast laps.<br />And a whole jungle watching your line.</> : <>A mountain valley. A very fast car.<br />And absolutely no sensible way home.</>}</p>
      <StartButton className="home-start">Let’s get lost</StartButton>
      <button className="home-garage" onClick={() => useGame.getState().navigate('garage')}>First, meet your ride <span>→</span></button>
      <div className="home-proof"><Art name={map.character} /><p>{jungle ? '“Keep the roar on the road.”' : '“Brakes are a suggestion.”'}<small>{jungle ? '— WAQAR, your canopy co-driver' : '— Your very unofficial co-driver'}</small></p></div>
    </div>
    <div className="scene-heading"><span><i /> EXPLORE IN 3D</span><span>{map.region.toUpperCase()} / {jungle ? '02' : '01'}</span></div>
    <div className="home-map-switcher"><MapSelector compact /></div>
    <div className="scene-postcard"><Art name={jungle ? 'lion' : 'eagle-soaring'} /><span>{jungle ? 'New neighbours.' : 'Fresh air.'}<br /><strong>{jungle ? 'Same bad ideas.' : 'Fast corners.'}</strong></span></div>
    <div className="scene-caption"><span className="location-dot" /><div><strong>{map.name}</strong><span>{map.laps === 1 ? 'One lap.' : 'Two laps.'} Eight gates. {jungle ? 'No shortage of jungle.' : 'Your best shot.'}</span></div><button onClick={() => useGame.getState().navigate('map')} aria-label={`Explore ${map.name} map`}>↗</button></div>
    <footer className="home-footer"><div><span>YOUR RIDE</span><strong>{car.name}</strong><button onClick={() => useGame.getState().navigate('garage')}>Change →</button></div><div><span>THE LONG WAY ROUND</span><strong>{(TRACK_LENGTH / 1000).toFixed(2)} km <small>/ {map.laps} {map.laps === 1 ? 'lap' : 'laps'}</small></strong></div><div><span>YOUR {jungle ? 'JUNGLE' : 'ALPINE'} BEST</span><strong>{best ? formatTime(best) : 'A blank slate. For now.'}</strong></div><p>LESS SERIOUS.<br /><b>{jungle ? 'MORE WILD.' : 'MORE SCENIC.'}</b></p></footer>
  </main>;
}

function Garage() {
  const { selectedCar, paint, selectCar, setPaint } = useGame(useShallow((state) => ({ selectedCar: state.selectedCar, paint: state.paint, selectCar: state.selectCar, setPaint: state.setPaint })));
  const car = carById(selectedCar);
  return <main className="garage-page">
    <div className="garage-heading"><BackButton /><PageTitle eyebrow="THE GARAGE / TWO VERY DIFFERENT ATTITUDES">Pick your kind<br />of <em>trouble.</em></PageTitle></div>
    <div className="garage-scene-label"><span>0{GAME_CARS.findIndex((item) => item.id === car.id) + 1} / {car.nickname}</span><span>Drag to look around · Scroll to zoom</span></div>
    <aside className="garage-panel" aria-label="Car selection and customization">
      <div className="car-options">{GAME_CARS.map((item) => <button key={item.id} aria-pressed={car.id === item.id} className={car.id === item.id ? 'selected' : ''} onClick={() => selectCar(item.id)}><span className="car-option-number">{item.number}</span><span><strong>{item.name}</strong><small>{item.nickname}</small></span><i>{car.id === item.id ? '✓' : '↗'}</i></button>)}</div>
      <div className="car-story"><span className="ww-eyebrow">YOUR PARTNER IN THE NONSENSE</span><h2>{car.nickname}.</h2><p>{car.description}</p></div>
      <dl className="car-stats"><div><dt>Top speed</dt><dd>{Math.round(car.topSpeed * 3.6)}<small> km/h</small></dd><span><i style={{ width: `${car.topSpeed / 55 * 100}%` }} /></span></div><div><dt>Acceleration</dt><dd>{car.acceleration}<small> m/s²</small></dd><span><i style={{ width: `${car.acceleration / 18 * 100}%` }} /></span></div><div><dt>Grip response</dt><dd>{car.grip}<small> / 12</small></dd><span><i style={{ width: `${car.grip / 12 * 100}%` }} /></span></div></dl>
      <fieldset className="paint-picker"><legend>A little color goes a long way <span>{PAINTS.find((item) => item.hex === paint)?.name}</span></legend><div>{PAINTS.map((item) => <button key={item.hex} aria-label={`Paint ${item.name}`} aria-pressed={paint === item.hex} style={{ backgroundColor: item.hex }} onClick={() => setPaint(item.hex)}>{paint === item.hex ? <span>✓</span> : null}</button>)}</div></fieldset>
      <StartButton>Take it for a spin</StartButton><p className="garage-footnote">Two worlds. A completely different feeling.</p>
    </aside>
  </main>;
}

function TrackMap({ live = false }: { live?: boolean }) {
  const map = mapById(useGame((state) => state.selectedMap));
  const x = useGame((state) => live ? state.telemetry.x : 0); const z = useGame((state) => live ? state.telemetry.z : 119);
  const checkpoint = useGame((state) => live ? state.telemetry.checkpoint : 0);
  const jungle = map.id === 'jungle';
  return <svg viewBox="0 0 200 200" className="track-map" role="img" aria-label={live ? `Live ${map.name} minimap showing your position` : `${map.name} circuit map with eight gates`}>
    {jungle && <g fill={map.theme.leaf} opacity=".25">{[[24,28],[49,18],[89,38],[147,28],[172,69],[23,145],[54,177],[112,156],[159,174]].map(([cx,cy],i) => <circle key={i} cx={cx} cy={cy} r={i % 2 ? 11 : 15} />)}</g>}
    <path d={jungle ? 'M19 89q37 25 74 4t88 8' : 'M10 96q50-17 90 5t90-5'} fill="none" stroke={jungle ? map.theme.water : '#9dcbd0'} opacity={jungle ? .7 : 1} strokeWidth={live ? 15 : 19} />
    <path d={MAP_PATH} fill="none" stroke={map.theme.road} strokeWidth={live ? 8 : 9} strokeLinejoin="round" />
    <path d={MAP_PATH} fill="none" stroke={map.theme.paper} strokeWidth="1" strokeDasharray="3 4" />
    {CHECKPOINTS.map(({ point }, index) => <circle key={index} cx={point.x * 0.57 + 100} cy={point.z * 0.57 + 100} r={live ? 2.8 : 4.5} fill={index === 0 ? map.theme.accent : index <= checkpoint ? map.theme.leaf : map.theme.paper} stroke={map.theme.ink} strokeWidth="1" />)}
    {live ? <circle cx={x * 0.57 + 100} cy={z * 0.57 + 100} r="4.5" fill={map.theme.accent} stroke={map.theme.paper} strokeWidth="2" /> : <><text x="112" y="181" fontSize="6" fontWeight="700" fill={map.theme.ink}>START / FINISH</text><text x="13" y="100" fontSize="5" fill={map.theme.ink} transform="rotate(-6 13 100)">{jungle ? 'CANOPY CREEK' : 'RIVER CROSSING'}</text></>}
  </svg>;
}

function Valley() {
  const map = mapById(useGame((state) => state.selectedMap)); const jungle = map.id === 'jungle';
  return <main className="sheet-page valley-page"><div className="map-page-top"><BackButton label="Back to the start" /><MapSelector /></div><div className="valley-layout"><div className="map-art-column"><div className="valley-art"><Art name={jungle ? 'jungle-tree' : 'mountain-range'} className="map-mountain" /><TrackMap /><Art name={jungle ? 'jungle-tree' : 'pine-tree'} className="map-pine" /><Art name={jungle ? 'giraffe' : 'mountain-goat'} className="map-goat" /><span className="map-tag">{jungle ? 'PLEASE DO NOT RACE THE WILDLIFE.' : 'YOU ARE HERE FOR A GOOD TIME.'}</span></div>{jungle && <div className="jungle-field-notes"><p className="ww-eyebrow">THE LOCALS / KEEP A RESPECTFUL DISTANCE</p><div className="wildlife-line">{['lion','giraffe','deer','python','horse','wolf'].map((animal) => <figure key={animal}><Art name={animal} alt={`Cartoon ${animal}`} /><figcaption>{animal}</figcaption></figure>)}</div><div className="jungle-crew"><span>YOUR<br /><b>ROAD CREW</b></span>{['waqar','imran','tatheer'].map((name) => <figure key={name}><Art name={name} alt={`${name.toUpperCase()} cartoon character`} /><figcaption>{name.toUpperCase()}</figcaption></figure>)}</div></div>}</div><div className="valley-copy"><PageTitle eyebrow={jungle ? 'MAP 02 / A ROAD THROUGH THE GREEN.' : 'MAP 01 / PLENTY OF WAYS TO MISBEHAVE.'}>{jungle ? <>Canopy<br /><em>Run.</em></> : <>The alpine<br /><em>loop.</em></>}</PageTitle><p>{map.description}</p><div className="track-facts"><div><strong>{(TRACK_LENGTH / 1000).toFixed(2)}<small>km</small></strong><span>PER LOOP</span></div><div><strong>08</strong><span>GATES EACH LAP</span></div><div><strong>{String(map.laps).padStart(2, '0')}</strong><span>{map.laps === 1 ? 'LAP' : 'LAPS'} TO MAKE IT COUNT</span></div></div><ul className="valley-features"><li><Art name={jungle ? 'stop-station' : 'wooden-bridge'} /><span><strong>{jungle ? 'A roadside breather' : 'Two river crossings'}</strong>{jungle ? 'Find the ranger stop station tucked beside the road. The racing line stays clear.' : 'Keep it on the timber. The river is not a shortcut.'}</span></li><li><Art name={jungle ? 'boost-ramp' : 'jump-ramp'} /><span><strong>A little extra airtime</strong>Drive forward over the {jungle ? 'marigold' : 'orange'} on-road boost ramp for a speed surge and a short flight back onto the circuit.</span></li><li><Art name={jungle ? 'waqar' : 'eagle-soaring'} /><span><strong>{jungle ? 'Trees. Then more trees.' : 'Good company'}</strong>{jungle ? 'A close, leafy canopy, tiny clearings, six animal characters, and WAQAR, IMRAN, and TATHEER along the route.' : 'Goats, eagles, and one very enthusiastic co-driver.'}</span></li></ul><div className="map-race-kit"><Art name="finish-flag" /><Art name="checkpoint" /><Art name={jungle ? 'lap-badge' : 'track-minimap'} /><Art name="winner-trophy" /><span>{map.laps} {map.laps === 1 ? 'lap' : 'laps'}. Ordered gates.<br />One finish worth earning.</span></div><StartButton>Meet me at the start</StartButton></div></div></main>;
}

function SettingsPage() {
  const settings = useGame((state) => state.settings); const update = useGame((state) => state.updateSettings); const returnPage = useGame((state) => state.returnPage);
  const back = () => { if (returnPage === 'race') useGame.setState({ page: 'race' }); else useGame.getState().navigate(returnPage); };
  return <main className="sheet-page settings-page"><button className="back-link" onClick={back}>← {returnPage === 'race' ? 'Back to your pit stop' : 'Back to the good stuff'}</button><div className="settings-heading"><div><PageTitle eyebrow="TUNE THE EXPERIENCE, NOT THE FUN.">Your way.<br /><em>Your Windway.</em></PageTitle></div><Art name="steering-wheel" /></div>
    <div className="settings-grid"><section><h2>Soundtrack to a detour</h2><p>Original synthesized engine, tire, and valley sounds.</p><RangeSetting label="Engine & effects" value={settings.sound} min={0} max={1} step={0.05} display={`${Math.round(settings.sound * 100)}%`} onChange={(sound) => update({ sound })} /><RangeSetting label="Road-trip music" value={settings.music} min={0} max={1} step={0.05} display={`${Math.round(settings.music * 100)}%`} onChange={(music) => { void gameAudio.unlock(); update({ music }); }} />
      <h2 className="settings-subhead">Make yourself comfortable</h2><RangeSetting label="Camera responsiveness" value={settings.sensitivity} min={0.5} max={1.5} step={0.1} display={`${settings.sensitivity.toFixed(1)}×`} onChange={(sensitivity) => update({ sensitivity })} /><p className="setting-help">Lower feels floaty. Higher follows the car more closely.</p></section>
      <section><h2>A view that runs your way</h2><p>Change this anytime. Your lap stays paused here.</p><fieldset className="quality-picker"><legend>Graphics quality</legend><div>{([{ value: 'auto', label: 'Automatic', text: 'Let your device decide' }, { value: 'low', label: 'Light & quick', text: 'Fewer trees, no shadows' }, { value: 'high', label: 'The full view', text: 'Detailed forest & shadows' }] as const).map((item) => <button key={item.value} aria-pressed={settings.quality === item.value} onClick={() => update({ quality: item.value })}><strong>{item.label}</strong><small>{item.text}</small><span>{settings.quality === item.value ? '✓' : ''}</span></button>)}</div></fieldset>
        <ToggleSetting label="The extra good stuff" text="Dust, tire marks, speed effects, and camera shake." value={settings.effects} onChange={(effects) => update({ effects })} /><ToggleSetting label="A calmer ride" text="Reduce motion and keep the camera effects gentle." value={settings.reducedMotion} onChange={(reducedMotion) => update({ reducedMotion })} />
      </section></div><div className="settings-bottom"><span><i /> Saved automatically on this device</span><button className="ww-button ww-outline" onClick={() => update({ sound: 0.55, music: 0.2, quality: 'auto', sensitivity: 1, effects: true, reducedMotion: false })}>Restore defaults</button><button className="ww-button ww-primary" onClick={back}>All set <span>✓</span></button></div>
  </main>;
}
function RangeSetting({ label, value, min, max, step, display, onChange }: { label: string; value: number; min: number; max: number; step: number; display: string; onChange: (value: number) => void }) { return <label className="range-setting"><span>{label}<output>{display}</output></span><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>; }
function ToggleSetting({ label, text, value, onChange }: { label: string; text: string; value: boolean; onChange: (value: boolean) => void }) { return <label className="toggle-setting"><span><strong>{label}</strong><small>{text}</small></span><input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} /><i aria-hidden="true" /></label>; }

function HowTo() {
  const returnPage = useGame((state) => state.returnPage);
  const map = mapById(useGame((state) => state.selectedMap)); const jungle = map.id === 'jungle';
  return <main className="sheet-page howto-page">
    <BackButton to={returnPage} label={returnPage === 'race' ? 'Back to your pit stop' : 'Back to the start'} />
    <div className="help-heading"><PageTitle eyebrow={`A QUICK BRIEFING / ${map.name.toUpperCase()}`}>Less reading.<br /><em>More driving.</em></PageTitle><Art name={map.character} /></div>
    <div className="help-grid"><section><h2>Get a feel for it.</h2>
      <div className="control-row"><span><kbd>W</kbd><small>or</small><kbd>↑</kbd></span><p><strong>Put your foot down</strong>Accelerate into the adventure.</p></div>
      <div className="control-row"><span><kbd>S</kbd><small>or</small><kbd>↓</kbd></span><p><strong>Brake, then reverse</strong>Hold once you’ve stopped to back up.</p></div>
      <div className="control-row"><span><kbd>A</kbd><kbd>D</kbd></span><p><strong>Find your line</strong>Steer left and right. Arrow keys work too.</p></div>
      <div className="control-row"><span><kbd>SPACE</kbd></span><p><strong>Get a little sideways</strong>Hold the handbrake while turning to drift.</p></div>
      <div className="shortcut-strip"><span><kbd>R</kbd> Back to road</span><span><kbd>C</kbd> Camera</span><span><kbd>ESC</kbd> Pause</span></div>
    </section><section className="race-briefing"><span className="ww-eyebrow">YOUR MISSION, SHOULD YOU CHOOSE TO SEND IT</span><h2>{map.laps === 1 ? 'One clean loop.' : 'Two jungle laps.'}<br />One time to beat.</h2>
      <ol><li>Wait for the countdown, then head through the start line.</li><li>Cross all seven checkpoint gates in order. {jungle ? 'Marigold' : 'Orange'} is your next one.</li><li>{jungle ? 'Cross the finish to start lap two, then repeat every gate. Your total race time is saved after the second lap.' : 'Return through the finish gate to save your time and personal best.'}</li></ol>
      <p>Drive forward over the {jungle ? 'marigold' : 'orange'} boost ramp on the road for a brief speed surge and a short flight. Hold your line to land back on the circuit.</p>
      {jungle && <p>Look for the ranger stop station beside the road. Wildlife stays off the racing line; the canopy keeps the clearings small.</p>}
      <p>Missed a turn? Press <kbd>R</kbd> to return just after your last earned checkpoint. Your lap progress is safe and the clock keeps running.</p>
      <div className="touch-note"><Art name="pedal-controls" /><span><strong>On a phone or tablet?</strong>Use the on-screen arrows and pedals. You can steer and accelerate together.</span></div>
    </section></div><StartButton className="help-start">Enough talk. Let’s go.</StartButton>
  </main>;
}

function PauseMenu() {
  const dialog = useRef<HTMLElement>(null);
  return <div className="modal-scrim"><section ref={dialog} className="pause-card" role="dialog" aria-modal="true" aria-labelledby="pause-title" onKeyDown={(event) => {
    if (event.key !== 'Tab') return;
    const buttons = dialog.current?.querySelectorAll<HTMLButtonElement>('button');
    if (!buttons?.length) return;
    const first = buttons[0], last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }}><Art name="wild-haired-driver" className="pause-character" /><p className="ww-eyebrow">A VERY WELL-DESERVED PIT STOP</p><h1 id="pause-title">Take a<br /><em>breather.</em></h1><p>Your car and your clock are right where you left them.</p><button className="ww-button ww-primary" autoFocus onClick={() => { void gameAudio.unlock(); useGame.getState().resume(); }}>Back to the madness <span>→</span></button><div className="pause-options"><button onClick={() => { void gameAudio.unlock(); useGame.getState().startRace(); }}>Restart lap</button><button onClick={() => useGame.getState().navigate('settings')}>Settings</button><button onClick={() => useGame.getState().navigate('howto')}>How to play</button><button onClick={() => useGame.getState().navigate('garage')}>Return to garage</button></div></section></div>;
}

function Results() {
  const result = useGame((state) => state.result); const car = carById(useGame((state) => state.selectedCar)); const reducedMotion = useGame((state) => state.settings.reducedMotion);
  if (!result) return null;
  const map = mapById(result.mapId); const jungle = map.id === 'jungle';
  return <main className="results-page"><section className="results-card">
    {!reducedMotion && <div className="confetti" aria-hidden="true">{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ '--i': i, '--color': [map.theme.accent, map.theme.leaf, map.theme.paper, map.theme.water][i % 4] } as CSSProperties} />)}</div>}
    <Art name="winner-trophy" className="results-trophy" /><span className="result-badge">{result.newBest ? 'A FRESH PERSONAL BEST' : jungle ? 'CANOPY CONQUERED' : 'VALLEY CONQUERED'}</span><h1 data-page-title tabIndex={-1}>Well, that<br />was <em>wild.</em></h1><p>{car.name} · {map.name} · {result.laps} {result.laps === 1 ? 'lap' : 'laps'}</p><strong className="result-time">{formatTime(result.time)}</strong>
    <div className="result-details"><div><span>PREVIOUS {jungle ? 'JUNGLE' : 'ALPINE'} BEST</span><strong>{result.previousBest ? formatTime(result.previousBest) : 'Your very first finish'}</strong></div><div><span>ROAD RECOVERIES</span><strong>{String(result.resets).padStart(2, '0')}</strong></div></div>
    <StartButton>One more for the road</StartButton><button className="back-link" onClick={() => useGame.getState().navigate('garage')}>Try a different attitude →</button>
  </section></main>;
}

function TouchButton({ action, label, children, className = '' }: { action: keyof DrivingInput; label: string; children: React.ReactNode; className?: string }) {
  const [held, setHeld] = useState(false);
  const release = () => { drivingInput[action] = false; setHeld(false); };
  return <button className={`touch-button ${className}`} aria-label={label} aria-pressed={held} onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); drivingInput[action] = true; setHeld(true); }} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release} onContextMenu={(event) => event.preventDefault()}>{children}</button>;
}

function RaceHUD() {
  const recovery = useGame((state) => state.recovery);
  const { telemetry: data, status, countdown, settings, reaction, cameraMode } = useGame(useShallow((state) => ({ telemetry: state.telemetry, status: state.status, countdown: state.countdown, settings: state.settings, reaction: state.reaction, cameraMode: state.cameraMode })));
  const map = mapById(useGame((state) => state.selectedMap)); const jungle = map.id === 'jungle';
  const best = useGame((state) => state.bestTimes[gameRecordKey(state.selectedMap, state.selectedCar)]);
  return <div className="race-ui">
    <header className="race-header"><div className="race-wordmark">WINDWAY<span>{map.name.toUpperCase()}</span><div className="lap-counter" aria-label={`Lap ${data.lap} of ${map.laps}`}>{jungle && <Art name="lap-badge" />}<b>LAP {data.lap}<i> / {map.laps}</i></b></div></div><div className="lap-clock"><span>{map.laps > 1 ? 'TOTAL RACE TIME' : 'LAP TIME'}</span><strong>{formatTime(data.elapsed)}</strong><small>{best ? `BEST ${formatTime(best)}` : 'YOUR FIRST TIME AROUND'}</small></div><button className="hud-button pause-button" aria-label="Pause race" disabled={status !== 'running'} onClick={() => useGame.getState().pause()}><Art name="pause-button" /><span>PAUSE <kbd>ESC</kbd></span></button></header>
    <div className="checkpoint-progress" aria-label={`Lap ${data.lap}, ${data.checkpoint} of eight gates completed`}><span>GATES</span><div>{Array.from({ length: 8 }, (_, i) => <i key={i} className={i < data.checkpoint ? 'complete' : i === data.checkpoint ? 'next' : ''} />)}</div><strong>{data.checkpoint}<small> / 8</small></strong></div>
    <div className="ramp-status" role="status" aria-live="polite" aria-atomic="true">{status === 'running' && (data.boosting || data.airborne) && <div className={`ramp-status-label ${data.airborne ? 'is-airborne' : ''}`}><Art name={jungle ? 'boost-ramp' : data.airborne ? 'eagle-soaring' : 'jump-ramp'} /><span><strong>{data.boosting ? 'BOOST' : 'AIRTIME'}{data.boosting && data.airborne ? ' + AIRTIME' : ''}</strong><small>{data.airborne ? 'HOLD YOUR LINE FOR LANDING' : 'ON-ROAD RAMP POWER'}</small></span></div>}</div>
    <div className="race-minimap"><span>{map.region.toUpperCase()}</span><TrackMap live /><small>FOLLOW THE {jungle ? 'MARIGOLD' : 'ORANGE'} GATE</small></div>
    <div className="speed-gauge"><svg viewBox="0 0 160 100" aria-hidden="true"><path d="M20 86a60 60 0 1 1 120 0" fill="none" stroke="#f7edcf55" strokeWidth="7" strokeLinecap="round" /><path d="M20 86a60 60 0 1 1 120 0" fill="none" stroke="#f7d674" strokeWidth="7" strokeLinecap="round" pathLength="100" strokeDasharray={`${Math.min(100, data.speed / 2.1)} 100`} /></svg><strong>{Math.round(data.speed).toString().padStart(2, '0')}</strong><span>KM/H</span><small>{data.boosting ? 'A LITTLE EXTRA GO' : data.airborne ? 'AIR MAIL' : data.drifting ? 'A LITTLE SIDEWAYS' : 'ENJOY THE LONG WAY'}</small></div>
    <div className="race-tools"><button className="hud-button" onClick={() => useGame.getState().resetCar()} aria-label="Recover car to the last checkpoint"><Art name="restart-button" /><span>BACK TO ROAD <kbd>R</kbd></span></button><button className="hud-button" onClick={() => useGame.getState().toggleCamera()} aria-label={`Switch to ${cameraMode === 'chase' ? 'hood' : 'chase'} camera`}><Art name="camera-button" /><span>{cameraMode === 'chase' ? 'CHASE CAM' : 'HOOD CAM'} <kbd>C</kbd></span></button></div>
    {reaction && reaction.until > performance.now() && status === 'running' && <div className="race-reaction" role="status"><Art name={reaction.character} /><p>{reaction.text}</p></div>}
    {status === 'countdown' && <div className="countdown" role="status"><span>THE {jungle ? 'JUNGLE' : 'VALLEY'} IS YOURS IN</span><strong key={countdown}>{countdown}</strong><small>{map.laps} {map.laps === 1 ? 'lap' : 'laps'} · Hold W or ↑ when it’s time to go.</small></div>}
    {status === 'loading' && <div className="countdown preparing"><Art name="racing-wheel" /><span>Warming up your ride…</span></div>}
    {status === 'recovering' && recovery && <div className="recovery-overlay" role="status" aria-live="assertive"><section className="recovery-card"><Art name="crying-driver" /><p className="ww-eyebrow">{recovery.reason === 'manual' ? 'A QUICK RESET' : recovery.reason === 'water' ? 'THE RIVER WINS THIS ONE' : 'A LITTLE TOO FAR OFF TRACK'}</p><h2>Back on the<br /><em>good road.</em></h2><strong>{recovery.checkpoint === 0 ? 'RETURNING TO THE START' : `RETURNING TO CHECKPOINT ${String(recovery.checkpoint).padStart(2, '0')}`}</strong><p>Your progress is safe. The lap clock keeps running.</p><progress max={1.2} value={1.2 - recovery.remaining} aria-label="Returning the car to the road" /></section></div>}
    {status === 'running' && data.elapsed < 1.5 && <div className="go-message">GO GET LOST.</div>}
    {settings.effects && !settings.reducedMotion && data.speed > 115 && <div className="speed-lines" aria-hidden="true" style={{ opacity: Math.min(0.45, (data.speed - 115) / 150) }} />}
    {status === 'running' && <div className="touch-controls"><div className="touch-steering"><TouchButton action="left" label="Steer left">←</TouchButton><TouchButton action="right" label="Steer right">→</TouchButton><TouchButton action="handbrake" label="Hold handbrake" className="touch-drift">DRIFT</TouchButton></div><div className="touch-pedals"><TouchButton action="brake" label="Brake or reverse" className="touch-brake">BRAKE</TouchButton><TouchButton action="throttle" label="Accelerate" className="touch-throttle">GO</TouchButton></div></div>}
    {status === 'paused' && <PauseMenu />}
  </div>;
}

export default function Windway() {
  const page = useGame((state) => state.page); const status = useGame((state) => state.status); const countdown = useGame((state) => state.countdown);
  const error = useGame((state) => state.error); const reducedMotion = useGame((state) => state.settings.reducedMotion);
  const map = mapById(useGame((state) => state.selectedMap));
  const [attempt, setAttempt] = useState(0);
  const racing = page === 'race' || page === 'results';
  useEffect(() => () => gameAudio.close(), []);
  useEffect(() => installDrivingInput(() => { const state = useGame.getState(); if (state.page === 'race') { if (state.status === 'paused') state.resume(); else state.pause(); } }, () => useGame.getState().resetCar(), () => useGame.getState().toggleCamera(), () => { const state = useGame.getState(); return state.page === 'race' && ['running', 'countdown'].includes(state.status); }), []);
  useEffect(() => { if (status !== 'running') { clearInput(); gameAudio.stop(); } else if (document.visibilityState === 'hidden') useGame.getState().pause(); }, [status]);
  useEffect(() => {
    if (status !== 'countdown') return;
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') useGame.getState().tickCountdown(); }, 1000);
    return () => window.clearInterval(timer);
  }, [status]);
  useEffect(() => {
    if (status !== 'recovering') return;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now(), dt = Math.min(0.2, (now - previous) / 1000); previous = now;
      if (document.visibilityState === 'visible') useGame.getState().tickRecovery(dt);
    }, 100);
    return () => window.clearInterval(timer);
  }, [status]);
  useEffect(() => { if (status === 'countdown') gameAudio.chime('countdown'); }, [countdown, status]);
  useEffect(() => {
    const visibility = () => { if (document.visibilityState === 'hidden') useGame.getState().pause(); };
    document.addEventListener('visibilitychange', visibility); return () => document.removeEventListener('visibilitychange', visibility);
  }, []);
  useEffect(() => { document.querySelector<HTMLElement>('[data-page-title]')?.focus({ preventScroll: true }); }, [page]);
  return <div className={`wildway map-${map.id} page-${page} ${reducedMotion ? 'calm-motion' : ''}`}>
    <div className={`scene-shell ${['settings', 'howto', 'map'].includes(page) ? 'scene-muted' : ''}`} aria-label={`Interactive 3D ${map.region}`}><ViewerErrorBoundary resetKey={String(attempt)} onError={(issue) => useGame.getState().setError(issue.message || 'This world could not load. Please try again.')}><Suspense fallback={<div className="scene-loading" role="status"><Art name="racing-wheel" /><span>Opening {map.name}…</span></div>}><GameScene attempt={attempt} /></Suspense></ViewerErrorBoundary></div>
    {!racing && <Header />}
    {page === 'home' && <Home />}{page === 'garage' && <Garage />}{page === 'map' && <Valley />}{page === 'settings' && <SettingsPage />}{page === 'howto' && <HowTo />}{page === 'race' && <RaceHUD />}{page === 'results' && <Results />}
    {error && <div className="modal-scrim"><section className="error-card" role="alert"><Art name="crying-driver" /><p className="ww-eyebrow">A SMALL BUMP IN THE ROAD</p><h1>This world needs<br />another try.</h1><p>{error}</p><button className="ww-button ww-primary" onClick={() => { useGame.getState().setError(null); useGame.getState().setReady(false); useGame.getState().navigate('home'); setAttempt((value) => value + 1); }}>Try again <span>↗</span></button></section></div>}
  </div>;
}
