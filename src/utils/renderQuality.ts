interface DeviceHints extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
}

export interface RenderQuality {
  dpr: [number, number];
  shadows: boolean;
  shadowMapSize: number;
  antialias: boolean;
  prefetch: boolean;
}

export function getRenderQuality(): RenderQuality {
  const device = navigator as DeviceHints;
  const touchDevice = window.matchMedia('(pointer: coarse)').matches;
  const lowMemory = device.deviceMemory !== undefined && device.deviceMemory <= 4;
  const lowCpu = device.hardwareConcurrency !== undefined && device.hardwareConcurrency <= 4;
  const constrained = touchDevice || lowMemory || lowCpu || !!device.connection?.saveData;
  const fastConnection = device.connection?.effectiveType === '4g';

  return {
    dpr: constrained ? [1, 1] : [1, 1.5],
    shadows: !lowMemory && !lowCpu,
    shadowMapSize: constrained ? 512 : 1024,
    antialias: !constrained,
    // Unknown connections load only the selected car. Even capable devices
    // should not compete with interaction or hidden tabs for bandwidth.
    prefetch: !constrained && fastConnection && document.visibilityState === 'visible',
  };
}
