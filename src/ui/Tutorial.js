import sfx from '../audio/sfx.js';
import { t, onLangChange } from '../utils/i18n.js';

// The short guided tour on a first visit: it dims the screen, shines a
// spotlight on one thing at a time and explains it in a little card.
// Steps come from RoomScene, since only it knows where things are:
//   { title: () => string, body: () => string, rect: () => { x, y, w, h } }
// with the rect in screen pixels. Text is read through functions so a
// language switch mid-tour shows up straight away.

const KEY = 'cozy-desk.tutorial';
const PAD = 8; // breathing room around the spotlit thing
const GAP = 16; // space between the spotlight and the card

const CSS = `
.tu-layer {
  position: fixed; inset: 0; z-index: 30; overflow: hidden;
  font-family: "Trebuchet MS", "Segoe UI", Verdana, sans-serif;
  opacity: 0; transition: opacity 0.25s;
}
.tu-layer[hidden] { display: none; }
.tu-layer.tu-open { opacity: 1; }
.tu-spot {
  position: absolute; border-radius: 14px;
  box-shadow: 0 0 0 200vmax rgba(10, 8, 24, 0.72);
  outline: 3px solid #ffd27a; outline-offset: 2px;
  transition: left 0.35s ease, top 0.35s ease, width 0.35s ease, height 0.35s ease;
  animation: tu-pulse 1.6s ease-in-out infinite;
}
@keyframes tu-pulse { 50% { outline-color: rgba(255, 210, 122, 0.35); } }
.tu-card {
  position: absolute; width: min(300px, calc(100vw - 32px)); box-sizing: border-box;
  padding: 16px 18px 14px; border-radius: 14px;
  background: #fff6e6; color: #3a2c4b;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
  transition: left 0.35s ease, top 0.35s ease;
}
.tu-step { font-size: 12px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; color: #c96f5a; }
.tu-title { margin: 4px 0 6px; font-size: 19px; }
.tu-body { margin: 0; font-size: 14px; line-height: 1.45; }
.tu-actions { display: flex; align-items: center; gap: 8px; margin-top: 14px; }
.tu-spacer { flex: 1; }
.tu-btn {
  padding: 8px 14px; border: 0; border-radius: 9px;
  font: inherit; font-size: 14px; cursor: pointer; transition: background 0.15s;
}
.tu-skip { padding-left: 4px; padding-right: 4px; background: transparent; color: #6b5a70; text-decoration: underline; }
.tu-back { background: #eadccb; color: #3a2c4b; }
.tu-back:hover { background: #dccbb6; }
.tu-back[hidden] { display: none; }
.tu-next { background: #c96f5a; color: #fff6e6; font-weight: bold; }
.tu-next:hover { background: #b45d49; }
`;

export default class Tutorial {
  constructor() {
    this.isOpen = false;

    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    this.el = document.createElement('div');
    this.el.className = 'tu-layer';
    this.el.hidden = true;
    this.el.innerHTML = `
      <div class="tu-spot"></div>
      <div class="tu-card" role="dialog" aria-modal="true" aria-labelledby="tu-title" aria-describedby="tu-body">
        <div class="tu-step"></div>
        <h2 class="tu-title" id="tu-title"></h2>
        <p class="tu-body" id="tu-body"></p>
        <div class="tu-actions">
          <button class="tu-btn tu-skip"></button>
          <span class="tu-spacer"></span>
          <button class="tu-btn tu-back"></button>
          <button class="tu-btn tu-next"></button>
        </div>
      </div>`;
    document.body.appendChild(this.el);

    const q = (sel) => this.el.querySelector(sel);
    this.spot = q('.tu-spot');
    this.card = q('.tu-card');
    this.stepText = q('.tu-step');
    this.title = q('.tu-title');
    this.body = q('.tu-body');
    this.skipBtn = q('.tu-skip');
    this.backBtn = q('.tu-back');
    this.nextBtn = q('.tu-next');

    this.skipBtn.addEventListener('click', () => this.finish());
    this.backBtn.addEventListener('click', () => this.go(this.index - 1));
    this.nextBtn.addEventListener('click', () => {
      if (this.index < this.steps.length - 1) this.go(this.index + 1);
      else this.finish();
    });
    document.addEventListener('keydown', (e) => {
      if (this.isOpen && e.key === 'Escape') this.finish();
    });
    // The game canvas rescales with the window, so the spotlight follows it.
    // Phaser resizes the canvas a frame after the window's resize event, so
    // watch the canvas itself too (see `follow` in start()).
    const replace = () => this.isOpen && this.place();
    window.addEventListener('resize', replace);
    this.observer = new ResizeObserver(replace);
    onLangChange(() => this.isOpen && this.render());
  }

  // Whether this browser has already seen (or skipped) the tour.
  static get seen() {
    try {
      return localStorage.getItem(KEY) === 'done';
    } catch {
      return false;
    }
  }

  // `follow` is an element whose size changes should move the spotlight (the game canvas).
  start(steps, { onDone, follow } = {}) {
    if (this.isOpen || !steps.length) return;
    this.steps = steps;
    this.onDone = onDone;
    this.isOpen = true;
    this.el.hidden = false;
    if (follow) this.observer.observe(follow);
    this.go(0);
    requestAnimationFrame(() => this.el.classList.add('tu-open'));
  }

  go(index) {
    this.index = index;
    sfx.paper();
    this.render();
    this.nextBtn.focus();
  }

  render() {
    const step = this.steps[this.index];
    const last = this.index === this.steps.length - 1;
    this.stepText.textContent = t('tutorial.step', { n: this.index + 1, total: this.steps.length });
    this.title.textContent = step.title();
    this.body.textContent = step.body();
    this.skipBtn.textContent = t('tutorial.skip');
    this.skipBtn.hidden = last;
    this.backBtn.textContent = t('tutorial.back');
    this.backBtn.hidden = this.index === 0;
    this.nextBtn.textContent = t(last ? 'tutorial.done' : 'tutorial.next');
    this.place();
  }

  // Spotlight on the target, card beside it: to the right if it fits, then
  // left, below, above; always kept inside the window.
  place() {
    const r = this.steps[this.index].rect();
    const s = { x: r.x - PAD, y: r.y - PAD, w: r.w + PAD * 2, h: r.h + PAD * 2 };
    Object.assign(this.spot.style, { left: `${s.x}px`, top: `${s.y}px`, width: `${s.w}px`, height: `${s.h}px` });

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cw = this.card.offsetWidth;
    const ch = this.card.offsetHeight;
    const midY = s.y + s.h / 2 - ch / 2;
    const midX = s.x + s.w / 2 - cw / 2;
    const spots = [
      [s.x + s.w + GAP, midY, s.x + s.w + GAP + cw <= vw],
      [s.x - GAP - cw, midY, s.x - GAP - cw >= 0],
      [midX, s.y + s.h + GAP, s.y + s.h + GAP + ch <= vh],
      [midX, s.y - GAP - ch, s.y - GAP - ch >= 0],
    ];
    const [x, y] = spots.find(([, , fits]) => fits) ?? [(vw - cw) / 2, vh - ch - 16];
    const clamp = (v, max) => Math.max(16, Math.min(v, max - 16));
    this.card.style.left = `${clamp(x, vw - cw)}px`;
    this.card.style.top = `${clamp(y, vh - ch)}px`;
  }

  finish() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.observer.disconnect();
    try {
      localStorage.setItem(KEY, 'done');
    } catch {
      // storage blocked: the tour will simply show again next time
    }
    this.el.classList.remove('tu-open');
    setTimeout(() => {
      if (!this.isOpen) this.el.hidden = true;
    }, 250);
    this.onDone?.();
  }
}
