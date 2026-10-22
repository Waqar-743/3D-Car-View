import { useEffect, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';

// Opt-in development diagnostics: ?performance. Updating this DOM output
// directly measures demand rendering without causing additional WebGL frames.
export default function PerformanceProbe() {
  const output = useRef<HTMLOutputElement>(null);
  const frames = useRef(0);
  const renderer = useThree((state) => state.gl);

  useFrame(() => { frames.current++; });

  useEffect(() => {
    let previousFrames = 0;
    let previousTime = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const rendered = frames.current - previousFrames;
      const rate = Math.round(rendered * 1000 / (now - previousTime));
      const node = output.current;
      if (node) {
        node.textContent = `${rate} frames/s · ${renderer.info.render.calls} draw calls · ${renderer.info.render.triangles.toLocaleString()} triangles`;
        node.dataset.totalFrames = String(frames.current);
        node.dataset.frameRate = String(rate);
      }
      previousFrames = frames.current;
      previousTime = now;
    }, 1000);
    return () => window.clearInterval(timer);
  }, [renderer]);

  return (
    <Html fullscreen style={{ pointerEvents: 'none' }}>
      <output
        ref={output}
        data-testid="viewer-performance"
        className="absolute left-3 top-28 rounded bg-charcoal/90 px-3 py-2 font-mono text-xs text-platinum"
      >
        Measuring rendering…
      </output>
    </Html>
  );
}
