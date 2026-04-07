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

    // === CHEER PHASE (0.3s - 1.5s) ===
    // Crowd cheer layer - mid-range
    const cheer1 = this.createNoise(1.2);
    const cheerFilter1 = this.ctx.createBiquadFilter();
    cheerFilter1.type = "bandpass";
    cheerFilter1.frequency.setValueAtTime(900, t + 0.3);
    cheerFilter1.frequency.linearRampToValueAtTime(1300, t + 0.6);
    cheerFilter1.frequency.linearRampToValueAtTime(800, t + 1.3);
    cheerFilter1.Q.value = 2;
    const cheerGain1 = this.ctx.createGain();
    cheerGain1.gain.setValueAtTime(0, t + 0.25);
    cheerGain1.gain.linearRampToValueAtTime(0.18, t + 0.5);
    cheerGain1.gain.setValueAtTime(0.18, t + 0.8);
    cheerGain1.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
    cheer1.connect(cheerFilter1).connect(cheerGain1).connect(this.masterGain!);
    cheer1.start(t + 0.3);
    cheer1.stop(t + 1.4);

    // Crowd cheer layer - higher excitement
    const cheer2 = this.createNoise(1.0);
    const cheerFilter2 = this.ctx.createBiquadFilter();
    cheerFilter2.type = "bandpass";
    cheerFilter2.frequency.setValueAtTime(1600, t + 0.35);
    cheerFilter2.frequency.linearRampToValueAtTime(2000, t + 0.6);
    cheerFilter2.frequency.linearRampToValueAtTime(1200, t + 1.2);
    cheerFilter2.Q.value = 1.5;
    const cheerGain2 = this.ctx.createGain();
    cheerGain2.gain.setValueAtTime(0, t + 0.3);
    cheerGain2.gain.linearRampToValueAtTime(0.12, t + 0.55);
    cheerGain2.gain.exponentialRampToValueAtTime(0.001, t + 1.3);
    cheer2.connect(cheerFilter2).connect(cheerGain2).connect(this.masterGain!);
    cheer2.start(t + 0.35);
    cheer2.stop(t + 1.3);

    // Low crowd rumble
    const cheerLow = this.createNoise(1.2);
    const cheerFilterLow = this.ctx.createBiquadFilter();
    cheerFilterLow.type = "bandpass";
    cheerFilterLow.frequency.setValueAtTime(350, t + 0.3);
    cheerFilterLow.frequency.linearRampToValueAtTime(500, t + 0.7);
    cheerFilterLow.frequency.linearRampToValueAtTime(300, t + 1.3);
    cheerFilterLow.Q.value = 3;
    const cheerGainLow = this.ctx.createGain();
    cheerGainLow.gain.setValueAtTime(0, t + 0.25);
    cheerGainLow.gain.linearRampToValueAtTime(0.15, t + 0.5);
    cheerGainLow.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
    cheerLow.connect(cheerFilterLow).connect(cheerGainLow).connect(this.masterGain!);
    cheerLow.start(t + 0.3);
    cheerLow.stop(t + 1.4);

    // === UPLIFTING TONES (0.35s - 1.2s) ===
    const upliftNotes = [
      { freq: 523.25, start: 0.35, dur: 0.4 },  // C5
      { freq: 659.25, start: 0.5, dur: 0.4 },   // E5
      { freq: 783.99, start: 0.65, dur: 0.5 },   // G5
    ];
    for (const note of upliftNotes) {
      const osc = this.ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = note.freq;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, t + note.start);
      g.gain.linearRampToValueAtTime(0.1, t + note.start + 0.05);
      g.gain.setValueAtTime(0.08, t + note.start + note.dur * 0.6);
      g.gain.exponentialRampToValueAtTime(0.001, t + note.start + note.dur);
      osc.connect(g).connect(this.masterGain!);
      osc.start(t + note.start);
      osc.stop(t + note.start + note.dur);
    }
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
    // Celebratory version: explosion then crowd cheering and roaring
    if (!this._enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const duration = 2.0 + shipSize * 0.3;

    // === INITIAL EXPLOSION (0 - 0.5s) ===
    const boom = this.ctx.createOscillator();
    boom.type = "sawtooth";
    boom.frequency.setValueAtTime(150, t);
    boom.frequency.exponentialRampToValueAtTime(30, t + 0.5);
    const boomGain = this.ctx.createGain();
    boomGain.gain.setValueAtTime(0.4, t);
    boomGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    boom.connect(boomGain).connect(this.masterGain!);
    boom.start(t);
    boom.stop(t + 0.5);

    const boomNoise = this.createNoise(0.4);
    const boomFilter = this.ctx.createBiquadFilter();
    boomFilter.type = "lowpass";
    boomFilter.frequency.setValueAtTime(2000, t);
    boomFilter.frequency.exponentialRampToValueAtTime(500, t + 0.4);
    const boomNoiseGain = this.ctx.createGain();
    boomNoiseGain.gain.setValueAtTime(0.3, t);
    boomNoiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    boomNoise.connect(boomFilter).connect(boomNoiseGain).connect(this.masterGain!);
    boomNoise.start(t);
    boomNoise.stop(t + 0.4);

    // === CROWD CHEERING (0.3s - end) ===
    // Layered filtered noise to simulate crowd roar
    // Layer 1: mid-range crowd murmur/cheer
    const crowd1 = this.createNoise(duration);
    const crowdFilter1 = this.ctx.createBiquadFilter();
    crowdFilter1.type = "bandpass";
    crowdFilter1.frequency.setValueAtTime(800, t + 0.3);
    crowdFilter1.frequency.linearRampToValueAtTime(1200, t + 0.8);
    crowdFilter1.frequency.linearRampToValueAtTime(900, t + duration * 0.7);
    crowdFilter1.frequency.linearRampToValueAtTime(600, t + duration);
    crowdFilter1.Q.value = 2;
    const crowdGain1 = this.ctx.createGain();
    crowdGain1.gain.setValueAtTime(0, t + 0.2);
    crowdGain1.gain.linearRampToValueAtTime(0.25, t + 0.6);
    crowdGain1.gain.setValueAtTime(0.25, t + duration * 0.5);
    crowdGain1.gain.exponentialRampToValueAtTime(0.001, t + duration);
    crowd1.connect(crowdFilter1).connect(crowdGain1).connect(this.masterGain!);
    crowd1.start(t + 0.3);
    crowd1.stop(t + duration);

    // Layer 2: higher pitch crowd excitement
    const crowd2 = this.createNoise(duration);
    const crowdFilter2 = this.ctx.createBiquadFilter();
    crowdFilter2.type = "bandpass";
    crowdFilter2.frequency.setValueAtTime(1500, t + 0.35);
    crowdFilter2.frequency.linearRampToValueAtTime(2200, t + 0.7);
    crowdFilter2.frequency.linearRampToValueAtTime(1800, t + duration * 0.6);
    crowdFilter2.frequency.linearRampToValueAtTime(1000, t + duration);
    crowdFilter2.Q.value = 1.5;
    const crowdGain2 = this.ctx.createGain();
    crowdGain2.gain.setValueAtTime(0, t + 0.3);
    crowdGain2.gain.linearRampToValueAtTime(0.18, t + 0.7);
    crowdGain2.gain.setValueAtTime(0.18, t + duration * 0.4);
    crowdGain2.gain.exponentialRampToValueAtTime(0.001, t + duration);
    crowd2.connect(crowdFilter2).connect(crowdGain2).connect(this.masterGain!);
    crowd2.start(t + 0.35);
    crowd2.stop(t + duration);

    // Layer 3: low roar/rumble of crowd
    const crowd3 = this.createNoise(duration);
    const crowdFilter3 = this.ctx.createBiquadFilter();
    crowdFilter3.type = "bandpass";
    crowdFilter3.frequency.setValueAtTime(300, t + 0.3);
    crowdFilter3.frequency.linearRampToValueAtTime(500, t + 0.8);
    crowdFilter3.frequency.linearRampToValueAtTime(350, t + duration);
    crowdFilter3.Q.value = 3;
    const crowdGain3 = this.ctx.createGain();
    crowdGain3.gain.setValueAtTime(0, t + 0.25);
    crowdGain3.gain.linearRampToValueAtTime(0.2, t + 0.6);
    crowdGain3.gain.setValueAtTime(0.2, t + duration * 0.5);
    crowdGain3.gain.exponentialRampToValueAtTime(0.001, t + duration);
    crowd3.connect(crowdFilter3).connect(crowdGain3).connect(this.masterGain!);
    crowd3.start(t + 0.3);
    crowd3.stop(t + duration);

    // === CROWD WAVE PULSES (simulate cheering surges) ===
    const pulseCount = shipSize + 2;
    for (let i = 0; i < pulseCount; i++) {
      const pDelay = 0.5 + i * 0.35;
      if (pDelay + 0.5 > duration) break;
      const pulse = this.createNoise(0.5);
      const pulseFilter = this.ctx.createBiquadFilter();
      pulseFilter.type = "bandpass";
      pulseFilter.frequency.value = 1000 + Math.random() * 800;
      pulseFilter.Q.value = 2;
      const pulseGain = this.ctx.createGain();
      pulseGain.gain.setValueAtTime(0, t + pDelay);
      pulseGain.gain.linearRampToValueAtTime(0.15, t + pDelay + 0.08);
      pulseGain.gain.exponentialRampToValueAtTime(0.001, t + pDelay + 0.45);
      pulse.connect(pulseFilter).connect(pulseGain).connect(this.masterGain!);
      pulse.start(t + pDelay);
      pulse.stop(t + pDelay + 0.5);
    }

    // === TRIUMPHANT HORN TONES ===
    const hornNotes = [523.25, 659.25, 783.99];
    for (let i = 0; i < hornNotes.length; i++) {
      const hDelay = 0.4 + i * 0.2;
      const horn = this.ctx.createOscillator();
      horn.type = "triangle";
      horn.frequency.value = hornNotes[i];
      const hornGain = this.ctx.createGain();
      hornGain.gain.setValueAtTime(0, t + hDelay);
      hornGain.gain.linearRampToValueAtTime(0.12, t + hDelay + 0.05);
      hornGain.gain.setValueAtTime(0.1, t + hDelay + 0.3);
      hornGain.gain.exponentialRampToValueAtTime(0.001, t + hDelay + 0.6);
      horn.connect(hornGain).connect(this.masterGain!);
      horn.start(t + hDelay);
      horn.stop(t + hDelay + 0.6);
    }
  }

  playSinkEnemy(shipSize: number) {
    // Somber version: when AI sinks player's ship (explosion + creak)
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
