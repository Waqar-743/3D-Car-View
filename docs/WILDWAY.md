# Windway game guide

## Start locally

```sh
npm install
npm run dev
```

Open http://127.0.0.1:4175/WindWay/. Direct map links use `?map=jungle` to select Canopy Run and `?map=snow` to select Frostbite Ascent. The landing page presents all three maps together. Port 4174 was the separate original SVG gallery, not the game. The dev server binds only to this computer and does not open or replace unrelated services.

The public website and game are at https://waqar-743.github.io/WindWay/. The repository was renamed to `WindWay`; the earlier live HTML still requested `/3D-Car-View/assets/`, causing the reported 404. Vite now defaults to `/WindWay/`, and CI also passes the repository name as its deployment base. Old local preview paths redirect to the canonical path while preserving the selected-map query. Public bookmarks must use the current URL. A branded 404 page provides a way back for missing addresses within the site. Lowercase `wildway` preference keys and some internal filenames remain compatible with existing saves.

## What is playable

The website now opens with one illustrated, scrollable landing page: an introduction, all three map chapters, their local SVG cast, a garage introduction, driving notes, Waqar’s project story and the creator/repository footer. Selecting a road updates the chosen starting line; each chapter also has a direct Drive button. The 3D viewport, physics engine and car models are not mounted on the landing page and load only when entering the garage or game views.

Loading uses an original side-profile F1-style car moving left to right, from the initial HTML boot screen to scene loading and the compact race HUD. Only actual asset progress gets a percentage; unknown progress remains indeterminate. Calmer motion and system reduced-motion preferences stop the animation. The boot screen offers a retry and canonical-site link if the entry script cannot load.

- Two selectable circuits: the original one-lap alpine loop and the new two-lap **Canopy Run** in Jungle Reserve. Each map generates its road, bridge protection, ramp, checkpoint gates, safe respawns, and live minimap from one centerline.
- A third, expert map: **Frostbite Ascent** in Whiteout Ridge. This is a 6.44 km one-way route climbing about 362 m, not a closed circuit. Fifteen intermediate checkpoints lead to the sixteenth gate and checkered finish at the summit. Snow-covered terrain, instanced firs and peaks, camera-following snowfall, a base-camp hut, snowman and arctic fox give it a separate winter identity.
- Packed snow reduces grip, acceleration, braking and the speed ceiling. Eight clearly marked blue-ice sections reduce traction and braking further. Fifteen solid, alternating snow blocks require steering into the open passing lane. Physical coral/powder rails protect bends; selected straight edges remain open and use checkpoint recovery. There is no boost or jump ramp on the ascent.
- Canopy Run has dense instanced broadleaf trees, palms, vines, ferns, tiny clearings, jade water, a roadside ranger stop station, and a marigold/coral racing palette. Wildlife and original cartoon crew WAQAR, IMRAN, and TATHEER appear beside the course, outside the driving corridor.
- McLaren MCL38 and Mercedes-AMG W14, with different acceleration, top speed, steering, braking, and grip. Six paint choices apply to the selected car.
- A three-second start countdown, seven ordered intermediate gates, then the finish gate **on every lap**. Canopy Run resets the checkpoint sequence for lap two and awards the finish only after both complete loops. Reverse crossings and driving outside a gate do not earn a checkpoint.
- Gravity, stable road-plane following, a non-bouncy body collider, raised road surfaces and barrier collisions. The two circuits each have two river bridges and a boost ramp built into the road (orange in alpine, marigold in jungle).
- Acceleration, braking, reverse, reduced off-road grip, handbrake drifting, rotating/steering wheels, chase and hood cameras, dust, skid marks, landing/collision reactions, and speed effects.
- Start, garage, valley map, settings, controls, pause, and results screens, with the custom cartoon SVG collection and low-poly scenery.
- Synthesized engine, tires, ambience, musical loop, and event sounds. Audio starts only after a user gesture.
- Device-local map, car, paint, settings, and separate per-map/per-car best times. Existing alpine records are preserved. No account, network service, multiplayer, opponents, or monetization.

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Accelerate | W / Up | GO pedal |
| Brake, then reverse | S / Down | BRAKE pedal |
| Steer | A/D / Left/Right | Direction buttons |
| Handbrake drift | Space | DRIFT button |
| Last earned checkpoint | R | Back to road |
| Chase / hood camera | C | Camera button |
| Pause / resume | Escape / P | Pause / resume menu |

Leaving the circuit for more than 0.4 seconds, falling below an edge, or entering the river automatically starts a 1.2-second recovery. The car returns to the last earned checkpoint (or behind the start line before checkpoint one), with speed and held controls cleared. The camera snaps safely to the recovered car instead of flying across the map.

On Frostbite Ascent the start is eight metres along the road, not behind its open endpoint. Earned-gate recoveries are four metres after the gate, uphill, with no wrap back to base camp. The HUD shows all sixteen required crossings, surface warnings, altitude and route progress. Brake before ice, use small steering inputs and avoid the handbrake on slippery sections. The clock keeps running during recovery; map/car records stay separate from the two circuit records.

The orange ramp sits on the circuit, not beside the garage. Drive over it in the forward direction to trigger a brief speed surge and short flight, then hold your line to land back on the road. The race HUD displays BOOST and AIRTIME while each effect is active. Those indicators remain readable with effects off or calmer motion enabled.

All driving information now lives in a compact **right-edge dashboard**: timer, lap/ascent state, gates, surface warning, speed, minimap and camera/recovery controls. Countdown, GO, boost and recovery messages stay inside that same edge stack; there is no center-screen speed-lines overlay or recovery scrim. Touch steering and pedals occupy the two bottom corners. The dashboard reserves their space, honors safe-area insets and stays at least twelve pixels to the right of the viewport centerline. Short screens simplify optional map/character details while retaining critical driving information; unusually small viewports can scroll within the panel. Pause and results remain intentional separate screens.

Choose **Canopy Run** using the map selector on the start screen or under **The maps**. Its ramp uses marigold and jade instead of orange. The lap counter and race clock cover both laps, and a recovery preserves the current lap and earned checkpoint. Map changes are locked while a race is active. The roadside station is a physical scenery building with a lay-by; it does not promise repairs, fuel, or a shortcut through the course.

The editable SVG gallery is at `/WindWay/jungle-pack/index.html`, with animals (lion, giraffe, deer, python, horse, wolf, monkey, toucan, elephant), original named portraits, vegetation, river, station, and recoloured race-kit icons. No real person's likeness is inferred from a name.

The winter gallery is at `/WindWay/snow-pack/index.html`: eighteen native, accessible SVGs with full-size previews, downloads, a manifest and a contact sheet. Its ice-blue/rescue-coral palette is also used in the start, map, garage, controls, settings, race and results views.

The ramp is on the opening straight, 12 metres long and 8 metres wide, leaving a bypass lane on each side. Forward entry adds 9 m/s (about 32 km/h) with a minimum boosted speed of 30 m/s, permits a temporary higher speed limit for 1.5 seconds, then tapers back to the car's ordinary limit. Launch is limited to forward crossings of the ramp lip; reversing, bypassing, waiting on the ramp, pausing, and recovery cannot repeatedly farm launches. Landing returns to normal ground-following without a springy rebound.

Bridge rails are joined physical walls, not decorative beams. The same shared box data creates the visible walls and their colliders, extends protection onto both banks, and supports the deck right up to the rail. Overlapping curved planks cover the outer corners of each joint. Roadside barriers also make contact while the car is still on supported road. Open, unprotected edges retain the recovery rule above.

Recovery keeps the clock running and never grants a later checkpoint. Switching to settings or controls from the pause menu preserves the paused lap. Hiding the tab pauses an active race and releases held controls; hidden tabs also suspend recovery and start-countdown timers.

## Performance and accessibility

- Only the selected car is requested; there is no unconditional second-car or panorama preload.
- The public car files are approximately 3 MiB each. Original source models are preserved in `img/3d-Model/`.
- The UI loads separately from the 3D scene and physics engine. The Rapier/WASM chunk is necessarily larger than a normal interface chunk.
- Trees, mountain peaks, rocks, road markings, dust, and skid marks use instancing. Simulation is fixed at 60 Hz; UI telemetry is published at 10 Hz, not every frame.
- Automatic/light graphics reduce vegetation, pixel density, antialiasing, and shadows. The settings, map, controls, pause, and results views render on demand.
- The jungle forest uses six instanced batches rather than an individual draw call for every tree or plant. Low quality reduces the tree target from 1,470 to 820, canopy detail/shadows, and river marks. Only the selected map's SVG textures are requested by its scene; changing maps remounts and disposes the previous scene.
- Winter fir trunks, layered branches, snow caps and distant mountains are instanced. Light mode halves the candidate tree count, reduces the terrain mesh and uses 300 snow particles instead of 700. Snowfall and powder effects respect effects-off; calmer motion keeps the snow cloud static. The 1,200-segment ascent uses the same road geometry for rendering and collision, with visible rail and hurdle dimensions shared with physics tests.
- Camera shake, speed effects, and particles can be turned off; calmer motion is a separate preference. CSS animations honor the operating system's reduced-motion preference.
- Selection controls expose their state, settings have labels, keyboard focus is visible, page headings receive focus, and the pause dialog traps keyboard focus.
- Loading and graphics/model failures have visible feedback and a retry action. Storage failures do not prevent play.

## Verification

`npm run test:game` tests the actual controller, curve, road mesh, gate-crossing function, and state store. It also drives each car through a complete Rapier simulation with the same road, colliders, gravity, traction, steering, and ordered gates as the game. It does not teleport through gates and does not modify browser records.

Both cars complete all eight gates with one ramp boost and about 0.70 seconds of intentional airtime, then land back on the circuit. Ordinary grounded travel is checked within 3 cm of the intended ride height. The tests also cover real road-edge falls, barriers, velocity clearing and settled respawns at every gate, recovery timing/progression, stale held keys, reverse entry, both bypass lanes, and ramp geometry staying inside the road. These are automated simulated laps, not player benchmarks or measured browser frame rates.

`npm run test:game` also runs the dedicated bridge/barrier suite on **both maps**. Each map covers 226 actual impacts across both bridges, both sides and both cars, direct/diagonal/joint/end contacts, actual collision events at normal and boosted top speeds, and near-rail driving through bridge entrances and exits. Static checks require every curved rail joint to have supporting deck coverage. Run `npm run test:barriers` for the alpine suite, or `node --max-semi-space-size=4 scripts/test-barriers.mjs --map=jungle` for jungle. No browser records are changed.

The previous round-contact setup could launch a car 5–6.5 metres above a normal road and leave it airborne for around 1.5 seconds. It has been replaced by continuous segment-projected road height, zero restitution, and a shared arcade ground-following controller. Decorative body bobbing has also been removed. Tests call that same controller rather than duplicating its motion logic.

`npm run build` runs TypeScript checks and generates `dist/`. Browserslist-data age and large physics-chunk warnings do not indicate build failures.

`npm run test:site` adds twenty loader/landing checks. `npm run test:build` runs five post-build checks for the canonical repository base, every local entry asset, all three SVG galleries, both car files, model credits and the branded 404 page. The deployment workflow runs both, so an obsolete asset prefix cannot silently reach Pages again.

`npm run test:maps` checks live map switching, geometry rebuilding, legacy record migration/separation, persisted selection, lap progression and real two-lap jungle driving for both cars. It is also included in `npm run test:game`.

Both cars complete two jungle laps with all 16 ordered gates, exactly two boosts/launches and no recovery, then safely settle at all eight respawn points. `npm run test:ui` renders all seven screens for all three maps with an explicitly stubbed 3D viewport; it checks themes, labels, selection state, image files and race feedback, not GPU output or pixel layout.

`npm run test:snow` verifies open endpoints, a true summit finish, minimap bounds, all ordered gates, independent snow records, all eighteen winter SVGs, live-physics grip/braking differences, every checkpoint respawn, real hurdle impacts and passing lanes, full-speed rail containment and off-road recovery. It drives both cars up the entire mountain with the actual road, barriers, hurdles and player controller, without teleporting or enabling artificial jumps. These conservative automated runs are not speed records.

The suite includes 24 driving/state checks, 11 barrier checks on each circuit, 14 map/lap checks, 14 snow checks, 119 headless UI checks and 47 HUD CSS contract checks. `npm run test:hud` evaluates the shipped corner-position, touch-target, contrast and safe-area formulas across fourteen portrait/landscape viewport sizes for all three maps. This is a CSS contract test, not a browser rendering engine. The mountain ascent tests take roughly eight minutes of simulated game time per car; they are conservative driving examples, not a minimum or guaranteed human completion time.

Browser visual and touch-device checks remain separate from these automated tests. Do not treat passing controller tests as proof of a measured frame rate or a tested mobile layout.

## Source map

- `src/game/Wildway.tsx`: interface screens and flows.
- `src/game/LandingStory.tsx` and `landing-story.css`: all-map landing narrative, illustrations, map selection and creator links.
- `src/game/TrackLoader.tsx`: accessible, reduced-motion-aware F1 loading indicator.
- `src/game/race-hud.css`: isolated right-edge gameplay HUD, safe areas and compact touch/landscape layouts.
- `src/game/GameScene.tsx`: rendering, loading, camera presentation, and physics integration.
- `src/game/World.tsx`: road, valley, wildlife, bridges, barriers, and jump.
- `src/game/JungleWorld.tsx`: dense tropical vegetation, wildlife/crew SVGs, river, and roadside station.
- `src/game/SnowWorld.tsx`: snow terrain, instanced winter vegetation, peaks, physical hurdles, ice visuals and snowfall.
- `src/game/snowCourse.ts`: marked ice zones, surface handling multipliers, obstacle data and development/test slalom targets.
- `src/game/maps.ts`: map catalog, colour themes, route selection, and map-specific record keys.
- `src/game/Vehicle.tsx`: rigid-body driving, recovery, race progression, chase camera, and effects.
- `src/game/driving.ts`: deterministic traction/steering and gate-crossing functions.
- `src/game/vehiclePhysics.ts`: shared road adhesion, body configuration, safe respawns, and fall/road-boundary rules.
- `src/game/trackBarriers.ts`: shared solid rails, bridge decks, roadside walls, and supported-width rules.
- `src/game/trackFeatures.ts`: the on-road ramp's geometry, position, dimensions, boost, and launch configuration.
- `src/game/store.ts`: race lifecycle and validated local preferences.
- `src/game/CarVisual.tsx`: optimized model reuse, toon materials, paint, and wheel animation.
- `scripts/test-game.mjs`: repeatable logic and physics tests.
- `scripts/test-barriers.mjs`: bridge-wall collision, support-joint, and boosted-impact regression tests.
- `scripts/test-maps.mjs`: map/lap/record regressions and full two-lap jungle drives.
- `scripts/test-snow.mjs`: open-ascent, winter asset, ice, hurdle, recovery and full-climb physics checks.
- `scripts/test-ui.mjs`: isolated headless screen/state/art-reference checks.
- `scripts/test-hud-layout.mjs`: viewport/safe-area formulas, center clearance, contrast and minimum touch-target contracts.
- `scripts/test-site.mjs`: all-map landing content, internal/gallery links, creator links and F1 loading states.
- `scripts/test-build.mjs`: published base-path, entry assets, SVG galleries, car files and 404 recovery-page checks. CI runs it after building.

The previous showroom source remains available but is no longer mounted by `src/App.tsx`. Original model authors' licenses and attribution requirements still apply before distributing the game.
