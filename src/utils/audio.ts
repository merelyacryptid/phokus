// Web Audio API based sound synthesizer for notifications and ambient sounds
// No external MP3 files required - works completely offline without network latency

class SoundEngine {
  private ctx: AudioContext | null = null;
  private ambientSource: AudioBufferSourceNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientInterval: number | null = null;
  private currentAmbientType: 'rain' | 'stream' | 'pink-noise' | 'wind' | 'none' = 'none';
  private suspendTimer: ReturnType<typeof setTimeout> | null = null;
  private cachedWhiteBuffer: AudioBuffer | null = null;
  private cachedPinkBuffer: AudioBuffer | null = null;
  private cachedSampleRate: number = 0;

  private cancelAutoSuspend() {
    if (this.suspendTimer) {
      clearTimeout(this.suspendTimer);
      this.suspendTimer = null;
    }
  }

  private scheduleAutoSuspend(delayMs = 4000) {
    this.cancelAutoSuspend();
    if (this.currentAmbientType !== 'none') return;
    this.suspendTimer = setTimeout(() => {
      if (this.ctx && this.ctx.state === 'running' && this.currentAmbientType === 'none') {
        this.ctx.suspend().catch(() => { });
      }
    }, delayMs);
  }

  private initContext(): AudioContext {
    this.cancelAutoSuspend();
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => { });
    }
    return this.ctx;
  }

  public unlockAudio() {
    try {
      const ctx = this.initContext();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => { });
      }
    } catch {
      // ignore
    }
  }

  // Play session complete chime
  public playAlert(type: 'crystal' | 'bell' | 'marimba' | 'softBeep', volume: number = 0.7) {
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(Math.max(0, Math.min(volume, 1)), now);
      masterGain.connect(ctx.destination);

      if (type === 'crystal') {
        // High ethereal chords: C6, E6, G6, C7
        const freqs = [1046.5, 1318.5, 1567.98, 2093.0];
        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + idx * 0.12);

          gain.gain.setValueAtTime(0, now + idx * 0.12);
          gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.12 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 1.6);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 1.7);
        });
      } else if (type === 'bell') {
        // Tibetan / Zen bowl bell tone
        const fundamental = 528; // Solfeggio 528Hz DNA/transformation frequency
        const harmonics = [1, 2.76, 5.4, 8.93];
        const harmonicGains = [0.35, 0.18, 0.08, 0.03];

        harmonics.forEach((h, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(fundamental * h, now);

          gain.gain.setValueAtTime(harmonicGains[i], now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now);
          osc.stop(now + 3.3);
        });
      } else if (type === 'marimba') {
        // Warm wooden upbeat tone
        const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
        notes.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + idx * 0.1);

          gain.gain.setValueAtTime(0.3, now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.6);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.65);
        });
      } else {
        // Soft beep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1174.66, now + 0.15);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 0.45);
      }
      this.scheduleAutoSuspend(3800);
    } catch (e) {
      console.warn('Audio playback not permitted yet or failed:', e);
    }
  }

  // Play subtle warning bell (5m left in focus, 2m left in break)
  public playSmallBell(volume: number = 0.7) {
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      const effectiveVol = Math.max(0, Math.min(volume, 1));
      masterGain.gain.setValueAtTime(effectiveVol, now);
      masterGain.connect(ctx.destination);

      // Acoustic synthesis of a delicate silver bell / mindfulness ting
      const fundamental = 1567.98; // G6
      const harmonics = [
        { ratio: 1.0, gain: 0.35, decay: 1.3 },   // Warm bell fundamental
        { ratio: 1.5, gain: 0.12, decay: 0.8 },   // Perfect fifth overtone
        { ratio: 2.76, gain: 0.08, decay: 0.4 },  // Metallic ring mode
        { ratio: 4.18, gain: 0.03, decay: 0.2 },  // Crisp strike ping
      ];

      harmonics.forEach(({ ratio, gain, decay }) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const freq = fundamental * ratio;

        osc.type = 'sine';
        // Subtle micro-pitch drop on initial contact mimics physical bell strike
        osc.frequency.setValueAtTime(freq * 1.012, now);
        osc.frequency.exponentialRampToValueAtTime(freq, now + 0.025);

        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(gain, now + 0.003);
        g.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        osc.connect(g);
        g.connect(masterGain);

        osc.start(now);
        osc.stop(now + decay + 0.05);
      });

      this.scheduleAutoSuspend(2000);
    } catch (e) {
      console.warn('Small bell playback error:', e);
    }
  }

  // Play satisfying higher-pitched bubble pop sound for task completion
  public playTaskComplete(volume: number = 0.7) {
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      const effectiveVol = Math.max(0, Math.min(volume, 1));
      masterGain.gain.setValueAtTime(effectiveVol, now);
      masterGain.connect(ctx.destination);

      // 1. Crisp micro air-snap transient (0ms - 8ms)
      const noiseBuffer = this.getNoiseBuffer('white-base', ctx);
      const clickSource = ctx.createBufferSource();
      clickSource.buffer = noiseBuffer;
      const clickFilter = ctx.createBiquadFilter();
      clickFilter.type = 'bandpass';
      clickFilter.frequency.setValueAtTime(2800, now);
      clickFilter.Q.setValueAtTime(2.2, now);
      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(0.06, now);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.008);

      clickSource.connect(clickFilter);
      clickFilter.connect(clickGain);
      clickGain.connect(masterGain);
      clickSource.start(now, 0, 0.01);
      clickSource.stop(now + 0.012);

      // 2. Bright tiny pre-pop pickup (0ms - 20ms)
      const preOsc = ctx.createOscillator();
      const preGain = ctx.createGain();
      preOsc.type = 'sine';
      preOsc.frequency.setValueAtTime(520, now);
      preOsc.frequency.exponentialRampToValueAtTime(880, now + 0.016);

      preGain.gain.setValueAtTime(0, now);
      preGain.gain.linearRampToValueAtTime(0.18, now + 0.002);
      preGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);

      preOsc.connect(preGain);
      preGain.connect(masterGain);
      preOsc.start(now);
      preOsc.stop(now + 0.025);

      // 3. High, crisp upward bubble pop (+16ms - 82ms)
      const t1 = now + 0.016;
      const popOsc = ctx.createOscillator();
      const popGain = ctx.createGain();
      popOsc.type = 'sine';
      popOsc.frequency.setValueAtTime(860, t1);
      popOsc.frequency.exponentialRampToValueAtTime(2150, t1 + 0.038);

      popGain.gain.setValueAtTime(0, t1);
      popGain.gain.linearRampToValueAtTime(0.5, t1 + 0.003);
      popGain.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.065);

      popOsc.connect(popGain);
      popGain.connect(masterGain);
      popOsc.start(t1);
      popOsc.stop(t1 + 0.075);

      // 4. Airy bubble octave shimmer (+16ms - 58ms)
      const harmonicOsc = ctx.createOscillator();
      const harmonicGain = ctx.createGain();
      harmonicOsc.type = 'sine';
      harmonicOsc.frequency.setValueAtTime(1720, t1);
      harmonicOsc.frequency.exponentialRampToValueAtTime(4300, t1 + 0.035);

      harmonicGain.gain.setValueAtTime(0, t1);
      harmonicGain.gain.linearRampToValueAtTime(0.09, t1 + 0.002);
      harmonicGain.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.042);

      harmonicOsc.connect(harmonicGain);
      harmonicGain.connect(masterGain);
      harmonicOsc.start(t1);
      harmonicOsc.stop(t1 + 0.048);

      this.scheduleAutoSuspend(1500);
    } catch (e) {
      console.warn('Task complete sound playback error:', e);
    }
  }

  // Play subtle tick sound
  public playTick(volume: number = 0.2) {
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.02);

      gain.gain.setValueAtTime(Math.min(volume * 0.15, 0.05), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
      this.scheduleAutoSuspend(1500);
    } catch {
      // Ignore user interaction policy errors for tick
    }
  }

  // Helper to get or generate noise buffer once and reuse it across sessions
  private getNoiseBuffer(type: 'pink-noise' | 'white-base', ctx: AudioContext): AudioBuffer {
    if (this.cachedSampleRate !== ctx.sampleRate) {
      this.cachedWhiteBuffer = null;
      this.cachedPinkBuffer = null;
      this.cachedSampleRate = ctx.sampleRate;
    }

    if (type === 'pink-noise' && this.cachedPinkBuffer) {
      return this.cachedPinkBuffer;
    }
    if (type === 'white-base' && this.cachedWhiteBuffer) {
      return this.cachedWhiteBuffer;
    }

    const bufferSize = ctx.sampleRate * 2; // 2 seconds looped buffer
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'pink-noise') {
        lastOut = (lastOut * 0.95) + (white * 0.05);
        data[i] = lastOut * 3;
      } else {
        data[i] = white;
      }
    }

    if (type === 'pink-noise') {
      this.cachedPinkBuffer = buffer;
    } else {
      this.cachedWhiteBuffer = buffer;
    }

    return buffer;
  }

  // Ambient sound generation
  public startAmbient(type: 'rain' | 'stream' | 'pink-noise' | 'wind', volume: number = 0.5) {
    this.stopAmbient();
    this.currentAmbientType = type;

    try {
      const ctx = this.initContext();
      const buffer = this.getNoiseBuffer(type === 'pink-noise' ? 'pink-noise' : 'white-base', ctx);

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      if (type === 'rain') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);
      } else if (type === 'stream') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, ctx.currentTime);
        filter.Q.setValueAtTime(1.2, ctx.currentTime);
      } else if (type === 'wind') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, ctx.currentTime);
      } else {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);
      }

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume * 0.2, ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();

      this.ambientSource = noise;
      this.ambientFilter = filter;
      this.ambientGain = gain;
    } catch (e) {
      console.warn('Ambient sound startup error:', e);
    }
  }

  public setAmbientVolume(volume: number) {
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(volume * 0.2, this.ctx.currentTime);
    }
  }

  public stopAmbient() {
    if (this.ambientSource) {
      try {
        this.ambientSource.stop();
        this.ambientSource.disconnect();
      } catch {
        // ignore
      }
      this.ambientSource = null;
    }
    if (this.ambientFilter) {
      try {
        this.ambientFilter.disconnect();
      } catch {
        // ignore
      }
      this.ambientFilter = null;
    }
    if (this.ambientGain) {
      try {
        this.ambientGain.disconnect();
      } catch {
        // ignore
      }
      this.ambientGain = null;
    }
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
    this.currentAmbientType = 'none';
    this.scheduleAutoSuspend(1000);
  }

  public getActiveAmbient() {
    return this.currentAmbientType;
  }
}

export const soundEngine = new SoundEngine();

