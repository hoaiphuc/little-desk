// A tiny generative lo-fi loop made with the Web Audio API, so the project
// needs no audio files. Swap this for real tracks later with this.sound.add().

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Am7 – Fmaj7 – Cmaj7 – G7
const CHORDS = [
  [57, 60, 64, 67],
  [53, 57, 60, 64],
  [48, 52, 55, 59],
  [55, 59, 62, 65],
];
const MELODY = [69, 72, 74, 76, 79, 81]; // A minor pentatonic
const BEAT = 60 / 72; // 72 bpm
const MAX_GAIN = 0.22; // loudness at 100% volume

export default class Lofi {
  constructor() {
    this.ctx = null;
    this.playing = false;
    this.volume = 1; // 0..1, set from the settings panel
    this.onBeat = null; // optional callback(beatIndex)
  }

  setVolume(v) {
    this.volume = v;
    if (!this.playing) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(MAX_GAIN * v, now + 0.1);
  }

  _init() {
    const ctx = (this.ctx = new (window.AudioContext || window.webkitAudioContext)());
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 1300;
    this.filter.connect(this.master);
    this.master.connect(ctx.destination);

    // Vinyl crackle: quiet hiss with occasional pops.
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = Math.random() < 0.0007 ? (Math.random() * 2 - 1) * 0.5 : (Math.random() * 2 - 1) * 0.012;
    }
    this.crackleBuf = buf;
  }

  start() {
    if (!this.ctx) this._init();
    this.ctx.resume();
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(MAX_GAIN * this.volume, now + 1.5);

    this.crackle = this.ctx.createBufferSource();
    this.crackle.buffer = this.crackleBuf;
    this.crackle.loop = true;
    this.crackle.connect(this.filter);
    this.crackle.start();

    this.step = 0;
    this.nextTime = now + 0.1;
    this.playing = true;
    this.timer = setInterval(() => this._schedule(), 100);
  }

  stop() {
    if (!this.playing) return;
    this.playing = false;
    clearInterval(this.timer);
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0, now + 0.6);
    this.crackle.stop(now + 0.7);
  }

  toggle() {
    this.playing ? this.stop() : this.start();
    return this.playing;
  }

  _schedule() {
    while (this.nextTime < this.ctx.currentTime + 0.3) {
      const beat = this.step % 4;
      const chord = CHORDS[Math.floor(this.step / 4) % CHORDS.length];
      const t = this.nextTime;

      if (beat === 0) chord.forEach((n, i) => this._note(mtof(n), t + i * 0.035, BEAT * 3.8, 0.08, 'triangle'));
      if (Math.random() < 0.5) {
        const n = MELODY[Math.floor(Math.random() * MELODY.length)];
        this._note(mtof(n), t + (Math.random() < 0.5 ? 0 : BEAT / 2), BEAT * 1.3, 0.06, 'sine');
      }
      if (beat === 0 || beat === 2) this._kick(t);

      if (this.onBeat) {
        const delay = Math.max(0, (t - this.ctx.currentTime) * 1000);
        setTimeout(() => this.playing && this.onBeat(beat), delay);
      }
      this.nextTime += BEAT;
      this.step++;
    }
  }

  _note(freq, t, dur, vol, type) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.filter);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  _kick(t) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.15);
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.3);
  }
}
