/**
 * Procedural Web Audio Synthesizer for high-octane car drifting audio
 * Zero external audio files (100% procedural, no 404s)
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  // Engine oscillators & gain
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;

  // Tire squeal nodes
  private tireNoiseNode: AudioBufferSourceNode | null = null;
  private tireFilter: BiquadFilterNode | null = null;
  private tireGain: GainNode | null = null;

  // Turbo nodes
  private turboGain: GainNode | null = null;
  private turboFilter: BiquadFilterNode | null = null;

  // State
  private isInitialized = false;
  private lastThrottle = 0;
  private lastBovTime = 0;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.45;
      this.masterGain.connect(this.ctx.destination);

      this.setupEngine();
      this.setupTireSqueal();
      this.setupTurbo();

      this.isInitialized = true;
    } catch {
      // Audio might fail in non-interactive contexts
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private setupEngine() {
    if (!this.ctx || !this.masterGain) return;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0.12;

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 600;
    this.engineFilter.Q.value = 3.5;

    // Harmonic Saw 1
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.value = 55;

    // Harmonic Saw 2 (slightly detuned for rumble)
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'sawtooth';
    this.engineOsc2.frequency.value = 55.4;

    // Sub rumble (triangle)
    this.engineSubOsc = this.ctx.createOscillator();
    this.engineSubOsc.type = 'triangle';
    this.engineSubOsc.frequency.value = 27.5;

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineSubOsc.connect(this.engineFilter);

    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
    this.engineSubOsc.start();
  }

  private setupTireSqueal() {
    if (!this.ctx || !this.masterGain) return;

    // Create 2 seconds of white noise buffer
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.tireNoiseNode = this.ctx.createBufferSource();
    this.tireNoiseNode.buffer = noiseBuffer;
    this.tireNoiseNode.loop = true;

    // Resonant bandpass filter for screech frequencies
    this.tireFilter = this.ctx.createBiquadFilter();
    this.tireFilter.type = 'bandpass';
    this.tireFilter.frequency.value = 1100;
    this.tireFilter.Q.value = 4.0;

    this.tireGain = this.ctx.createGain();
    this.tireGain.gain.value = 0.0; // silence until drift

    this.tireNoiseNode.connect(this.tireFilter);
    this.tireFilter.connect(this.tireGain);
    this.tireGain.connect(this.masterGain);

    this.tireNoiseNode.start();
  }

  private setupTurbo() {
    if (!this.ctx || !this.masterGain) return;

    // Turbo spool noise
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const turboNoise = this.ctx.createBufferSource();
    turboNoise.buffer = noiseBuffer;
    turboNoise.loop = true;

    this.turboFilter = this.ctx.createBiquadFilter();
    this.turboFilter.type = 'bandpass';
    this.turboFilter.frequency.value = 3200;
    this.turboFilter.Q.value = 6.0;

    this.turboGain = this.ctx.createGain();
    this.turboGain.gain.value = 0.0;

    turboNoise.connect(this.turboFilter);
    this.turboFilter.connect(this.turboGain);
    this.turboGain.connect(this.masterGain);

    turboNoise.start();
  }

  public update(rpm: number, throttle: number, slipSpeed: number, isHandbrake: boolean, isNitrous: boolean) {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;

    // 1. Engine RPM modulation (800 idle to 8500 redline)
    // Map RPM to fundamental frequency (35Hz to 280Hz)
    const baseFreq = 30 + (rpm / 8500) * 220;
    if (this.engineOsc1 && this.engineOsc2 && this.engineSubOsc && this.engineFilter && this.engineGain) {
      this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.04);
      this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.01, now, 0.04);
      this.engineSubOsc.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.04);

      // Filter opens up as throttle opens
      const filterFreq = 350 + (throttle * 1400) + (rpm / 8500) * 1800;
      this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.05);

      const targetGain = 0.08 + throttle * 0.15 + (isNitrous ? 0.08 : 0);
      this.engineGain.gain.setTargetAtTime(targetGain, now, 0.05);
    }

    // 2. Tire Squeal
    if (this.tireGain && this.tireFilter) {
      // Slip speed > 2.5 m/s initiates squeal
      const slipFactor = Math.min(1.0, Math.max(0, (slipSpeed - 2.5) / 10));
      const targetTireGain = slipFactor * (isHandbrake ? 0.45 : 0.35);
      this.tireGain.gain.setTargetAtTime(targetTireGain, now, 0.05);

      // Pitch shifts slightly with slip speed
      const targetPitch = 900 + slipFactor * 600;
      this.tireFilter.frequency.setTargetAtTime(targetPitch, now, 0.08);
    }

    // 3. Turbo Spool
    if (this.turboGain && this.turboFilter) {
      const targetTurboGain = throttle > 0.4 && rpm > 3500 ? (rpm / 8500) * 0.15 : 0;
      this.turboGain.gain.setTargetAtTime(targetTurboGain, now, 0.1);
      const turboFreq = 2200 + (rpm / 8500) * 2400;
      this.turboFilter.frequency.setTargetAtTime(turboFreq, now, 0.1);
    }

    // 4. Blow-off Valve (BOV) flutter trigger on sudden throttle release
    if (this.lastThrottle > 0.7 && throttle < 0.2 && rpm > 4200 && now - this.lastBovTime > 1.2) {
      this.playBlowOffValve();
      this.lastBovTime = now;
    }

    this.lastThrottle = throttle;
  }

  public playBlowOffValve() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.4);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 0.35);
    filter.Q.value = 5.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    // Stututu flutter modulation
    for (let t = 0; t < 4; t++) {
      const pulseTime = now + t * 0.08;
      gain.gain.setValueAtTime(0.25 / (t + 1), pulseTime);
      gain.gain.exponentialRampToValueAtTime(0.01, pulseTime + 0.06);
    }

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + 0.4);
  }

  public playBackfire() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playClipBonus() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880, now + 0.08); // A5

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playCashEarned() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.06); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.12); // G5
    osc.frequency.setValueAtTime(1046.5, now + 0.18); // C6

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playHitSound() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.2);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.45, this.ctx.currentTime, 0.02);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }
}

export const soundEngine = new SoundEngine();
