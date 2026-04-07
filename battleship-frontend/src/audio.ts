// Audio manager using Web Audio API - all sounds generated programmatically

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private bgmOsc1: OscillatorNode | null = null;
  private bgmOsc2: OscillatorNode | null = null;
  private bgmNoise: AudioBufferSourceNode | null = null;
  private _enabled = false;

  private ensureCtx() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0;
      this.masterGain.connect(this.ctx.destination);
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0;
      this.bgmGain.connect(this.masterGain);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  get enabled() {
    return this._enabled;
  }

  toggle(): boolean {
    this.ensureCtx();
    this._enabled = !this._enabled;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        this._enabled ? 1 : 0,
        this.ctx!.currentTime,
        0.1
      );
    }
    if (this._enabled) {
      this.startBGM();
    } else {
      this.stopBGM();
    }
    return this._enabled;
  }

  private createNoise(duration: number): AudioBufferSourceNode {
    const sr = this.ctx!.sampleRate;
    const buf = this.ctx!.createBuffer(1, sr * duration, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const src = this.ctx!.createBufferSource();
    src.buffer = buf;
    return src;
  }

  playHit() {
    if (!this._enabled || !this.ctx) return;
    const t = this.ctx.currentTime;

    // === EXPLOSION PHASE (0 - 0.5s) ===
    // Deep boom impact
    const boom = this.ctx.createOscillator();
    boom.type = "sine";
    boom.frequency.setValueAtTime(180, t);
    boom.frequency.exponentialRampToValueAtTime(30, t + 0.4);
    const boomGain = this.ctx.createGain();
    boomGain.gain.setValueAtTime(0.5, t);
    boomGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    boom.connect(boomGain).connect(this.masterGain!);
    boom.start(t);
    boom.stop(t + 0.5);

    // Explosion crackle noise
    const noise = this.createNoise(0.4);
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(2500, t);
    noiseFilter.frequency.exponentialRampToValueAtTime(800, t + 0.4);
    noiseFilter.Q.value = 1.5;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    noise.connect(noiseFilter).connect(noiseGain).connect(this.masterGain!);
    noise.start(t);
    noise.stop(t + 0.4);

    // Secondary explosion punch
    const punch = this.ctx.createOscillator();
    punch.type = "sawtooth";
    punch.frequency.setValueAtTime(120, t + 0.05);
    punch.frequency.exponentialRampToValueAtTime(40, t + 0.3);
    const punchGain = this.ctx.createGain();
    punchGain.gain.setValueAtTime(0.3, t + 0.05);
    punchGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    punch.connect(punchGain).connect(this.masterGain!);
    punch.start(t + 0.05);
    punch.stop(t + 0.35);

    // === ROAR PHASE (0.3s - 1.2s) ===
    // Low growling roar base
    const roarBase = this.ctx.createOscillator();
    roarBase.type = "sawtooth";
    roarBase.frequency.setValueAtTime(80, t + 0.3);
    roarBase.frequency.linearRampToValueAtTime(120, t + 0.6);
    roarBase.frequency.linearRampToValueAtTime(70, t + 1.1);
    const roarBaseGain = this.ctx.createGain();
    roarBaseGain.gain.setValueAtTime(0, t + 0.25);
    roarBaseGain.gain.linearRampToValueAtTime(0.25, t + 0.45);
    roarBaseGain.gain.setValueAtTime(0.25, t + 0.7);
    roarBaseGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    const roarDistortion = this.ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = (Math.PI + 3) * x / (Math.PI + 3 * Math.abs(x));
    }
    roarDistortion.curve = curve;
    roarBase.connect(roarDistortion).connect(roarBaseGain).connect(this.masterGain!);
    roarBase.start(t + 0.3);
    roarBase.stop(t + 1.2);

    // Roar mid-frequency growl
    const roarMid = this.ctx.createOscillator();
    roarMid.type = "square";
    roarMid.frequency.setValueAtTime(160, t + 0.35);
    roarMid.frequency.linearRampToValueAtTime(200, t + 0.55);
    roarMid.frequency.linearRampToValueAtTime(140, t + 1.0);
    const roarMidGain = this.ctx.createGain();
    roarMidGain.gain.setValueAtTime(0, t + 0.3);
    roarMidGain.gain.linearRampToValueAtTime(0.1, t + 0.5);
    roarMidGain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
    roarMid.connect(roarMidGain).connect(this.masterGain!);
    roarMid.start(t + 0.35);
    roarMid.stop(t + 1.1);

    // Roar texture noise (breath/wind effect)
    const roarNoise = this.createNoise(0.9);
    const roarNoiseFilter = this.ctx.createBiquadFilter();
    roarNoiseFilter.type = "bandpass";
    roarNoiseFilter.frequency.setValueAtTime(400, t + 0.3);
    roarNoiseFilter.frequency.linearRampToValueAtTime(600, t + 0.6);
    roarNoiseFilter.frequency.linearRampToValueAtTime(300, t + 1.1);
    roarNoiseFilter.Q.value = 3;
    const roarNoiseGain = this.ctx.createGain();
    roarNoiseGain.gain.setValueAtTime(0, t + 0.25);
    roarNoiseGain.gain.linearRampToValueAtTime(0.18, t + 0.45);
    roarNoiseGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    roarNoise.connect(roarNoiseFilter).connect(roarNoiseGain).connect(this.masterGain!);
    roarNoise.start(t + 0.3);
    roarNoise.stop(t + 1.2);
  }

  playMiss() {
    if (!this._enabled || !this.ctx) return;
    const t = this.ctx.currentTime;

    // Water splash
    const noise = this.createNoise(0.5);
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(3000, t);
    filter.frequency.exponentialRampToValueAtTime(800, t + 0.5);
    filter.Q.value = 1;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    noise.connect(filter).connect(gain).connect(this.masterGain!);
    noise.start(t);
    noise.stop(t + 0.5);
  }

  playSink(shipSize: number) {
    if (!this._enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const duration = 1.5 + shipSize * 0.4;

    // Deep explosion rumble
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + duration);
    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.35, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(oscGain).connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + duration);

    // Creaking/cracking sound
    const creak = this.ctx.createOscillator();
    creak.type = "square";
    creak.frequency.setValueAtTime(200, t + 0.3);
    creak.frequency.linearRampToValueAtTime(80, t + 0.8);
    const creakGain = this.ctx.createGain();
    creakGain.gain.setValueAtTime(0, t);
    creakGain.gain.linearRampToValueAtTime(0.12, t + 0.3);
    creakGain.gain.exponentialRampToValueAtTime(0.001, t + 1);
    creak.connect(creakGain).connect(this.masterGain!);
    creak.start(t);
    creak.stop(t + 1);

    // Explosion noise
    const noise = this.createNoise(duration);
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + duration);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    noise.connect(filter).connect(noiseGain).connect(this.masterGain!);
    noise.start(t);
    noise.stop(t + duration);

    // Secondary explosions scaled with ship size
    for (let i = 0; i < shipSize; i++) {
      const delay = 0.3 + i * 0.25;
      const bang = this.createNoise(0.4);
      const bangFilter = this.ctx.createBiquadFilter();
      bangFilter.type = "lowpass";
      bangFilter.frequency.value = 2000;
      const bangGain = this.ctx.createGain();
      bangGain.gain.setValueAtTime(0, t + delay);
      bangGain.gain.linearRampToValueAtTime(0.2, t + delay + 0.02);
      bangGain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.4);
      bang.connect(bangFilter).connect(bangGain).connect(this.masterGain!);
      bang.start(t + delay);
      bang.stop(t + delay + 0.4);
    }
  }

  playVictory() {
    if (!this._enabled || !this.ctx) return;
    const t = this.ctx.currentTime;

    const notes = [
      { freq: 523.25, start: 0, dur: 0.3 },
      { freq: 659.25, start: 0.15, dur: 0.3 },
      { freq: 783.99, start: 0.3, dur: 0.3 },
      { freq: 1046.5, start: 0.5, dur: 0.8 },
      { freq: 783.99, start: 0.5, dur: 0.8 },
      { freq: 1046.5, start: 1.5, dur: 1.2 },
    ];
    for (const note of notes) {
      const osc = this.ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = note.freq;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, t + note.start);
      gain.gain.linearRampToValueAtTime(0.2, t + note.start + 0.03);
      gain.gain.setValueAtTime(0.15, t + note.start + note.dur * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.start + note.dur);
      osc.connect(gain).connect(this.masterGain!);
      osc.start(t + note.start);
      osc.stop(t + note.start + note.dur);
    }
  }

  playDefeat() {
    if (!this._enabled || !this.ctx) return;
    const t = this.ctx.currentTime;

    const notes = [
      { freq: 392, start: 0, dur: 0.6 },
      { freq: 349.23, start: 0.4, dur: 0.6 },
      { freq: 293.66, start: 0.8, dur: 0.6 },
      { freq: 261.63, start: 1.2, dur: 1.5 },
    ];
    for (const note of notes) {
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = note.freq;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, t + note.start);
      gain.gain.linearRampToValueAtTime(0.2, t + note.start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.start + note.dur);
      osc.connect(gain).connect(this.masterGain!);
      osc.start(t + note.start);
      osc.stop(t + note.start + note.dur);
    }

    // Low rumble
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 50;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 3);
    osc.connect(g).connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + 3);
  }

  private startBGM() {
    if (this.bgmOsc1) return;
    if (!this.ctx) return;

    // Low ambient ocean drone
    this.bgmOsc1 = this.ctx.createOscillator();
    this.bgmOsc1.type = "sine";
    this.bgmOsc1.frequency.value = 55;
    const g1 = this.ctx.createGain();
    g1.gain.value = 0.08;
    this.bgmOsc1.connect(g1).connect(this.bgmGain!);
    this.bgmOsc1.start();

    this.bgmOsc2 = this.ctx.createOscillator();
    this.bgmOsc2.type = "sine";
    this.bgmOsc2.frequency.value = 82.5;
    const g2 = this.ctx.createGain();
    g2.gain.value = 0.04;
    this.bgmOsc2.connect(g2).connect(this.bgmGain!);
    this.bgmOsc2.start();

    // Ambient wave noise
    const waveDuration = 30;
    this.bgmNoise = this.createNoise(waveDuration);
    this.bgmNoise.loop = true;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 150;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.value = 0.06;
    this.bgmNoise.connect(noiseFilter).connect(noiseGain).connect(this.bgmGain!);
    this.bgmNoise.start();

    this.bgmGain!.gain.setTargetAtTime(1, this.ctx.currentTime, 0.5);
  }

  private stopBGM() {
    try {
      if (this.bgmOsc1) {
        this.bgmOsc1.stop();
        this.bgmOsc1 = null;
      }
    } catch {
      this.bgmOsc1 = null;
    }
    try {
      if (this.bgmOsc2) {
        this.bgmOsc2.stop();
        this.bgmOsc2 = null;
      }
    } catch {
      this.bgmOsc2 = null;
    }
    try {
      if (this.bgmNoise) {
        this.bgmNoise.stop();
        this.bgmNoise = null;
      }
    } catch {
      this.bgmNoise = null;
    }
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    }
  }
}

export const audioManager = new AudioManager();
