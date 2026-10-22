import { useGame } from './store';

class WindwayAudio {
  context: AudioContext | null = null;
  private engine: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private tireGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private step = 0;

  async unlock() {
    if (!this.context) {
      try {
        this.context = new AudioContext();
        const context = this.context;
        this.engine = context.createOscillator(); this.engine.type = 'sawtooth'; this.engine.frequency.value = 42;
        const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 330;
        this.engineGain = context.createGain(); this.engineGain.gain.value = 0;
        this.engine.connect(filter).connect(this.engineGain).connect(context.destination); this.engine.start();
        const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
        const data = buffer.getChannelData(0); let previous = 0;
        for (let i = 0; i < data.length; i++) { const white = Math.random() * 2 - 1; data[i] = previous = (previous + white * 0.05) / 1.05; }
        const noise = context.createBufferSource(); noise.buffer = buffer; noise.loop = true;
        const high = context.createBiquadFilter(); high.type = 'highpass'; high.frequency.value = 550;
        this.tireGain = context.createGain(); this.tireGain.gain.value = 0;
        this.ambienceGain = context.createGain(); this.ambienceGain.gain.value = 0;
        noise.connect(high).connect(this.tireGain).connect(context.destination);
        noise.connect(this.ambienceGain).connect(context.destination); noise.start();
        this.musicGain = context.createGain(); this.musicGain.gain.value = 0; this.musicGain.connect(context.destination);
        this.musicTimer = window.setInterval(() => this.playMusicNote(), 300);
      } catch { return; }
    }
    try { await this.context.resume(); } catch { /* Browsers may defer audio until the next gesture. */ }
  }

  private playMusicNote() {
    if (!this.context || !this.musicGain) return;
    const { settings, status } = useGame.getState();
    const playing = status !== 'paused' && document.visibilityState === 'visible';
    this.musicGain.gain.setTargetAtTime(playing ? settings.music * 0.07 : 0, this.context.currentTime, 0.15);
    if (!playing || settings.music <= 0) return;
    const melody = [0, 7, 12, 7, 3, 10, 15, 10, 5, 12, 17, 12, 3, 10, 7, 3];
    const oscillator = this.context.createOscillator(); oscillator.type = 'sine';
    oscillator.frequency.value = 146.83 * 2 ** (melody[this.step++ % melody.length] / 12);
    const gain = this.context.createGain(); const now = this.context.currentTime;
    gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.8, now + 0.01); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    oscillator.connect(gain).connect(this.musicGain); oscillator.start(); oscillator.stop(now + 0.55);
  }

  update(speed: number, throttle: boolean, drifting: boolean, running: boolean) {
    if (!this.context) return;
    const { settings } = useGame.getState(); const now = this.context.currentTime;
    this.engine?.frequency.setTargetAtTime(36 + Math.abs(speed) * 2.7 + (throttle ? 12 : 0), now, 0.1);
    this.engineGain?.gain.setTargetAtTime(running ? settings.sound * (0.025 + Math.min(1, Math.abs(speed) / 40) * 0.04) : 0, now, 0.08);
    this.tireGain?.gain.setTargetAtTime(running && drifting ? settings.sound * 0.7 : 0, now, 0.08);
    this.ambienceGain?.gain.setTargetAtTime(running ? settings.sound * 0.11 : 0, now, 0.3);
  }

  chime(kind: 'checkpoint' | 'finish' | 'countdown' | 'crash' | 'jump') {
    if (!this.context) return;
    const sound = useGame.getState().settings.sound;
    if (!sound) return;
    const notes = kind === 'finish' ? [392, 494, 587, 784] : kind === 'checkpoint' ? [523, 784] : kind === 'crash' ? [80, 45] : kind === 'jump' ? [294, 440] : [440];
    notes.forEach((frequency, index) => {
      const context = this.context!; const oscillator = context.createOscillator(); const gain = context.createGain();
      const now = context.currentTime + index * 0.1; oscillator.type = kind === 'crash' ? 'triangle' : 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(sound * 0.12, now + 0.015); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      oscillator.connect(gain).connect(context.destination); oscillator.start(now); oscillator.stop(now + 0.35);
    });
  }

  stop() { this.update(0, false, false, false); }
  close() { if (this.musicTimer) window.clearInterval(this.musicTimer); void this.context?.close(); this.context = null; }
}
export const gameAudio = new WindwayAudio();
