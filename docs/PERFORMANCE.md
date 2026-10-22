# Viewer performance pass

The public GLBs are generated delivery assets. The full-quality originals remain in `img/3d-Model/`; the pipeline never edits those sources.

| Model | Download before | Download after | Mesh draws before / after | Triangles before / after |
| --- | ---: | ---: | ---: | ---: |
| McLaren MCL38 | 19.70 MiB | 3.01 MiB | 207 / 46 | 265,912 / 176,370 |
| Mercedes W14 | 15.58 MiB | 3.07 MiB | 210 / 47 | 302,443 / 197,683 |

Mesh draws above count the car's rendered primitives in one pass, not the entire scene or its shadow passes. Texture-memory estimates and exact byte counts are recorded in `model-optimization-report.json`; they are estimates for RGBA8 plus mipmaps, not measured GPU memory.

## Regenerate assets

Run `npm ci`, then `npm run optimize:models`. The script uses glTF Transform, Meshoptimizer and Sharp. It merges compatible static geometry, preserves the four named wheel groups and steering groups, simplifies with a 0.05% relative error cap, compresses geometry with Meshopt, and caps textures at 1024 pixels. Color textures use WebP quality 88; normal maps use lossless WebP. Geometry and texture compression are intentionally lossy except for normal-map encoding; review close-up appearance before increasing compression further.

The pipeline round-trips the compressed GLBs, checks movable-part names and model bounds, and refuses to replace a delivery asset if its size or draw count did not improve. Paint-role metadata is stored on materials so merging cannot accidentally recolor the wheels. Three decorative wall images are also resized and encoded to WebP in `public/optimized-images/`.

## Runtime changes

- Render on demand, with explicit invalidation during intro, cinematic, lighting, loading and orbit animations. The static garage can stop drawing once transitions settle.
- Keep the WebGL canvas alive when selecting another car. Reload the renderer only for recovery/retry.
- Share cloned materials by original material and paint role, handle material arrays, and dispose owned clones on replacement/unmount. Shared GLTF geometry and textures stay in the loader cache.
- Publish camera telemetry at most 10 times per second; components subscribe only to their own store fields. Car and garage components no longer rerender for every camera angle update.
- Use one shadow-casting light at a time. Apply lower pixel density and shadow resolution on constrained devices, and disable shadows on devices reporting low memory or CPU capacity.
- Prefetch only after the selected model is ready, three seconds without interaction or a cinematic, a visible tab, and a reported fast connection. Unknown or slower connections and constrained devices load cars on demand.
- Keep loading completion tied to the selected model. Background prefetch cannot restart the loading overlay.
- Offer the two distinct supplied cars. Red Bull and Ferrari entries remain inactive placeholders until distinct assets are supplied.

## Verify

Run `npm run build`. In the development server, add `?performance` to the viewer URL for an opt-in overlay showing rendered frames per second, draw calls and triangles. After stopping the cinematic/autorotation and allowing lighting/damping to settle, the overlay should report zero rendered frames per second. Rotating, changing paint, or selecting a car should render immediately again. This counter measures rendered frames, not achievable hardware FPS. The diagnostic UI is omitted from production builds.

The cartoon SVG pack is independent of these changes and remains available at `cartoon-pack/index.html`.
