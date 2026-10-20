// Soft click sounds for every object, synthesised with the Web Audio API
// (same idea as lofi.js, so there are still no audio files to load).
// Everything runs through a warm low-pass filter and a little room reverb,
// and the chimes use the same A minor pentatonic as the lo-fi radio so they
// always sound in tune with the music.

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const rand = (a, b) => a + Math.random() * (b - a);
const PENTA = [69, 72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96];
const MAX_GAIN = 0.55; // loudness at 100% volume

class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 1; // 0..1, set from the settings panel
  }

  // True once a click has unlocked audio. Background sounds (distant frogs)
  // check this so they never try to start audio on their own.
  get ready() {
    return this.ctx?.state === 'running' && !this.muted;
  }

  setVolume(v) {
    this.volume = v;
    if (this.ctx) this.out.gain.setTargetAtTime(MAX_GAIN * v, this.ctx.currentTime, 0.02);
  }

  // The AudioContext can only start after a click, so it's made on first use.
  _init() {
    const ctx = (this.ctx = new (window.AudioContext || window.webkitAudioContext)());

    this.out = ctx.createGain();
    this.out.gain.value = MAX_GAIN * this.volume;
    const warm = ctx.createBiquadFilter();
    warm.type = 'lowpass';
    warm.frequency.value = 4500;
    warm.connect(this.out);
    this.out.connect(ctx.destination);

    // Small-room reverb from a decaying noise burst.
    const len = Math.floor(ctx.sampleRate * 1.4);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    const verb = ctx.createConvolver();
    verb.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = 0.22;
    verb.connect(wet);
    wet.connect(warm);

    // Every sound connects to `bus`, which feeds both dry and reverb paths.
    this.bus = ctx.createGain();
    this.bus.connect(warm);
    this.bus.connect(verb);

    const nlen = ctx.sampleRate;
    this.noiseBuf = ctx.createBuffer(1, nlen, ctx.sampleRate);
    const nd = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < nlen; i++) nd[i] = Math.random() * 2 - 1;
  }

  // Returns the start time, or null when muted.
  _now(at = 0) {
    if (this.muted || this.volume === 0) return null;
    if (!this.ctx) this._init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx.currentTime + 0.01 + at;
  }

  _env(t, dur, vol, attack) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(this.bus);
    return g;
  }

  // A single oscillator note; `to` glides the pitch over the note's length.
  tone(freq, { at = 0, dur = 0.3, vol = 0.2, type = 'sine', attack = 0.005, to } = {}) {
    const t = this._now(at);
    if (t === null) return;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    osc.connect(this._env(t, dur, vol, attack));
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  // Filtered noise: clicks, rustles, swishes. `to` sweeps the filter.
  noise({ at = 0, dur = 0.1, vol = 0.2, type = 'bandpass', freq = 1000, q = 1, to, attack = 0.003 } = {}) {
    const t = this._now(at);
    if (t === null) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(freq, t);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
    src.connect(f);
    f.connect(this._env(t, dur, vol, attack));
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  // A soft kalimba-like pluck.
  chime(midi, at = 0, vol = 0.12) {
    const f = mtof(midi);
    this.tone(f, { at, dur: 1.3, vol });
    this.tone(f * 2, { at, dur: 0.35, vol: vol * 0.3 });
    this.tone(f * 3.01, { at, dur: 0.12, vol: vol * 0.12, type: 'triangle' });
  }

  // ---- room ----

  lamp(on) {
    this.noise({ dur: 0.025, vol: 0.3, freq: 3200, q: 2 });
    this.tone(on ? 1900 : 1400, { dur: 0.04, vol: 0.06, type: 'triangle' });
    this.noise({ at: 0.07, dur: 0.02, vol: 0.15, freq: 2600, q: 2 });
    if (on) this.tone(110, { at: 0.05, dur: 0.6, vol: 0.025, attack: 0.08 }); // warm hum
  }

  typing() {
    let at = 0;
    const taps = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < taps; i++) {
      this.noise({ at, dur: 0.03, vol: 0.16, freq: rand(2200, 3800), q: 3 });
      this.tone(rand(170, 230), { at, dur: 0.04, vol: 0.05 }); // soft "thock"
      at += rand(0.06, 0.12);
    }
  }

  sip() {
    this.noise({ dur: 0.35, vol: 0.1, freq: 500, to: 1300, q: 4, attack: 0.08 });
    this.tone(320, { at: 0.42, dur: 0.12, vol: 0.09, to: 170 }); // gulp
  }

  pour() {
    this.noise({ dur: 0.8, vol: 0.08, freq: 700, to: 1700, q: 1.5, attack: 0.05 });
    for (let i = 0; i < 7; i++) {
      const f = rand(500, 900) * (1 + i * 0.08);
      this.tone(f, { at: 0.05 + i * 0.1 + rand(0, 0.04), dur: 0.06, vol: 0.05, to: f * 1.6 });
    }
  }

  book() {
    // page flutter, then the top book lands back on the stack
    [0, 0.04, 0.09].forEach((at, i) => this.noise({ at, dur: 0.1, vol: 0.12 - i * 0.03, freq: 2800, q: 0.8 }));
    this.tone(140, { at: 0.32, dur: 0.14, vol: 0.22, to: 70 });
    this.noise({ at: 0.32, dur: 0.06, vol: 0.12, type: 'lowpass', freq: 500 });
  }

  radio(on) {
    this.noise({ dur: 0.02, vol: 0.25, freq: 2500, q: 3 }); // knob click
    if (on) {
      this.noise({ at: 0.03, dur: 0.4, vol: 0.06, freq: 500, to: 2600, q: 6 });
      this.tone(1300, { at: 0.05, dur: 0.35, vol: 0.02, to: 880 });
    } else {
      this.noise({ at: 0.03, dur: 0.25, vol: 0.05, freq: 1800, to: 400, q: 4 });
      this.tone(420, { at: 0.03, dur: 0.25, vol: 0.05, to: 110 });
    }
  }

  water(drops = 5) {
    for (let i = 0; i < drops; i++) {
      const f = rand(380, 520);
      this.tone(f, { at: 0.38 + i * 0.07, dur: 0.08, vol: 0.13, to: f * rand(2.6, 3.2) });
    }
  }

  grow() {
    this.chime(76, 0, 0.09);
    this.chime(81, 0.1, 0.08);
  }

  bloom() {
    [72, 76, 79, 84, 88].forEach((m, i) => this.chime(m, i * 0.08, 0.09));
  }

  purr() {
    const t = this._now();
    if (t === null) return;
    const dur = 1.4;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 280;
    const rumble = this.ctx.createGain();
    rumble.gain.value = 0.6;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 24;
    const depth = this.ctx.createGain();
    depth.gain.value = 0.5;
    lfo.connect(depth);
    depth.connect(rumble.gain);
    src.connect(lp);
    lp.connect(rumble);
    rumble.connect(this._env(t, dur, 0.5, 0.25));
    src.start(t);
    lfo.start(t);
    src.stop(t + dur + 0.05);
    lfo.stop(t + dur + 0.05);
  }

  mew() {
    const t = this._now(0.05);
    if (t === null) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480, t);
    osc.frequency.linearRampToValueAtTime(720, t + 0.1);
    osc.frequency.linearRampToValueAtTime(560, t + 0.32);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1400;
    osc.connect(lp);
    lp.connect(this._env(t, 0.36, 0.07, 0.04));
    osc.start(t);
    osc.stop(t + 0.4);
  }

  curtain() {
    this.noise({ dur: 0.5, vol: 0.1, freq: 800, to: 2000, q: 0.7, attack: 0.15 });
    this.noise({ at: 0.5, dur: 0.5, vol: 0.08, freq: 2000, to: 700, q: 0.7, attack: 0.15 });
  }

  lights(mode) {
    this.noise({ dur: 0.02, vol: 0.12, freq: 3000, q: 2 });
    if (mode === 'off') {
      this.chime(79, 0.02, 0.07);
      this.chime(72, 0.14, 0.07);
    } else {
      const notes = mode === 'rainbow' ? [84, 86, 88, 91, 93] : [84, 88, 91];
      notes.forEach((m, i) => this.chime(m, 0.02 + i * 0.06, 0.06));
    }
  }

  clock() {
    this.tone(1500, { dur: 0.04, vol: 0.12 });
    this.tone(1100, { at: 0.45, dur: 0.04, vol: 0.12 });
    this.chime(81, 0.9, 0.08);
  }

  chair() {
    // a gentle wooden creak, not a horror-movie one
    const t = this._now();
    if (t === null) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.linearRampToValueAtTime(200, t + 0.2);
    osc.frequency.linearRampToValueAtTime(140, t + 0.45);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 900;
    bp.Q.value = 6;
    osc.connect(bp);
    bp.connect(this._env(t, 0.45, 0.06, 0.06));
    osc.start(t);
    osc.stop(t + 0.5);
  }

  stretch() {
    this.noise({ dur: 0.45, vol: 0.07, type: 'lowpass', freq: 1200, attack: 0.15 }); // hoodie rustle
    this.chime(69, 0.1, 0.06);
    this.chime(76, 0.3, 0.06);
  }

  // ---- outside ----

  addStar() {
    const m = PENTA[6 + Math.floor(Math.random() * 6)];
    this.chime(m, 0, 0.07);
    this.chime(m + 12, 0.06, 0.03);
  }

  // Each star in a chain plays the next note up, so a constellation is a tune.
  connectStar(index) {
    this.chime(PENTA[Math.min(index, 5) + 3], 0, 0.09);
  }

  constellation() {
    [76, 79, 81, 84, 88, 91].forEach((m, i) => this.chime(m, 0.15 + i * 0.07, 0.07));
  }

  wish() {
    [96, 91, 88, 84, 79, 76].forEach((m, i) => this.chime(m, i * 0.06, 0.06));
  }

  moon() {
    // a slow, dreamy pad chord
    [57, 64, 71].forEach((m) => this.tone(mtof(m), { dur: 2.2, vol: 0.05, attack: 0.4 }));
    this.chime(83, 0.2, 0.05);
  }

  windowLight() {
    this.noise({ dur: 0.02, vol: 0.08, freq: 3500, q: 2 });
  }

  streetLamp() {
    for (let i = 0; i < 4; i++) this.tone(120, { at: i * 0.12, dur: 0.06, vol: 0.03, type: 'sawtooth' });
  }

  wave() {
    this.chime(76, 0, 0.08);
    this.chime(81, 0.12, 0.08);
  }

  // ---- countryside ----

  // "ộp ộp": two throaty pulses. `vol` < 1 for the distant ones in the background.
  croak(vol = 1) {
    [0, 0.16].forEach((at) => {
      this.tone(rand(170, 200), { at, dur: 0.09, vol: 0.09 * vol, type: 'triangle', to: rand(110, 130) });
      this.noise({ at, dur: 0.07, vol: 0.05 * vol, freq: 520, q: 4 });
    });
  }

  splash() {
    this.noise({ dur: 0.25, vol: 0.1, freq: 1400, to: 400, q: 1.2 });
    this.tone(500, { at: 0.02, dur: 0.07, vol: 0.06, to: 1300 });
  }

  catchFrog() {
    this.splash();
    this.croak(0.9);
    this.chime(84, 0.45, 0.05);
  }

  // A bicycle bell: "kính coong".
  bicycleBell() {
    [0, 0.2].forEach((at, i) => {
      const f = i ? 1850 : 2150;
      this.tone(f, { at, dur: 0.5, vol: 0.05 });
      this.tone(f * 2.42, { at, dur: 0.2, vol: 0.018 });
    });
  }

  motorbike() {
    const t = this._now();
    if (t === null) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(55, t);
    osc.frequency.linearRampToValueAtTime(85, t + 0.3);
    osc.frequency.linearRampToValueAtTime(60, t + 0.9);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 380;
    osc.connect(lp);
    lp.connect(this._env(t, 0.9, 0.08, 0.1));
    osc.start(t);
    osc.stop(t + 1);
    // a polite little horn
    [0.15, 0.32].forEach((at) => {
      this.tone(420, { at, dur: 0.1, vol: 0.025, type: 'square' });
      this.tone(530, { at, dur: 0.1, vol: 0.02, type: 'square' });
    });
  }

  hat() {
    this.noise({ dur: 0.18, vol: 0.07, freq: 1800, q: 0.8, attack: 0.03 });
    this.tone(260, { at: 0.02, dur: 0.12, vol: 0.05, to: 200 });
  }

  // ---- shop ----

  // The little bell over the shop door.
  shopBell() {
    this.noise({ dur: 0.02, vol: 0.06, freq: 4000, q: 2 });
    [93, 88, 93].forEach((m, i) => {
      this.tone(mtof(m), { at: i * 0.11, dur: 0.9, vol: 0.06 });
      this.tone(mtof(m) * 2.76, { at: i * 0.11, dur: 0.25, vol: 0.02 }); // bell overtone
    });
  }

  coin() {
    this.tone(mtof(93), { dur: 0.08, vol: 0.07, type: 'triangle' });
    this.tone(mtof(100), { at: 0.07, dur: 0.5, vol: 0.06, type: 'triangle' });
    this.tone(mtof(100) * 2, { at: 0.07, dur: 0.15, vol: 0.015 });
  }

  buy() {
    this.noise({ dur: 0.05, vol: 0.08, freq: 5000, q: 1.5 }); // till drawer
    [76, 81, 84, 88].forEach((m, i) => this.chime(m, 0.05 + i * 0.07, 0.08));
  }

  equip() {
    this.noise({ dur: 0.02, vol: 0.1, freq: 2500, q: 2 });
    this.chime(84, 0.03, 0.07);
  }

  denied() {
    this.chime(69, 0, 0.06);
    this.chime(64, 0.1, 0.06);
  }

  // ---- task board ----

  paper() {
    [0, 0.05].forEach((at) => this.noise({ at, dur: 0.12, vol: 0.08, freq: 3000, q: 0.9 }));
  }

  pin() {
    this.paper();
    this.tone(700, { at: 0.08, dur: 0.05, vol: 0.1, to: 400 });
    this.chime(84, 0.1, 0.05);
  }

  check(done) {
    if (done) {
      this.noise({ dur: 0.06, vol: 0.08, freq: 4500, q: 3 });
      this.noise({ at: 0.07, dur: 0.1, vol: 0.08, freq: 5000, q: 3 });
      this.chime(84, 0.12, 0.07);
      this.chime(88, 0.2, 0.06);
    } else {
      this.chime(79, 0, 0.05);
    }
  }

  crumple() {
    for (let i = 0; i < 9; i++) this.noise({ at: rand(0, 0.3), dur: 0.03, vol: 0.12, freq: rand(1500, 4500), q: 2 });
  }

  // ---- pomodoro ----

  // Winding the tomato timer up (start), or one soft click (pause).
  timer(start) {
    if (start) {
      for (let i = 0; i < 6; i++) this.noise({ at: i * 0.045, dur: 0.015, vol: 0.12, freq: rand(2800, 3400), q: 4 });
      this.chime(84, 0.3, 0.06);
    } else {
      this.noise({ dur: 0.02, vol: 0.15, freq: 2600, q: 3 });
      this.chime(76, 0.03, 0.05);
    }
  }

  // The timer ringing: up the scale when focus ends, back down when a break does.
  ring(focusDone) {
    const notes = focusDone ? [84, 88, 91, 96] : [91, 88, 84, 79];
    [0, 0.75].forEach((start) => notes.forEach((m, i) => this.chime(m, start + i * 0.11, 0.1)));
  }
}

export default new Sfx();
