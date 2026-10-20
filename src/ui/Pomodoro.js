import sfx from '../audio/sfx.js';
import { t, onLangChange, translateDom } from '../utils/i18n.js';
import {
  MODES, ROUNDS, LIMITS, focusReward, formatTime,
  getPomodoro, onPomodoroChange, start, pause, reset, skip, setMode, setMinutes,
} from '../utils/pomodoro.js';

// The window that opens when you click the tomato timer on the desk.
// Plain HTML on top of the canvas, like TaskBoard. Closing it doesn't stop
// the timer; the tomato on the desk keeps showing the countdown.

const RING = 2 * Math.PI * 52; // circumference of the progress ring

const CSS = `
.pm-backdrop {
  position: fixed; inset: 0; z-index: 10;
  display: flex; align-items: center; justify-content: center;
  background: rgba(10, 8, 24, 0.6);
  opacity: 0; transition: opacity 0.2s;
  font-family: "Trebuchet MS", "Segoe UI", Verdana, sans-serif;
}
.pm-backdrop[hidden] { display: none; }
.pm-backdrop.pm-open { opacity: 1; }
.pm-card {
  --accent: #c96f5a;
  width: min(340px, 92vw); max-height: 92vh; overflow-y: auto;
  box-sizing: border-box; padding: 16px 18px 18px;
  border: 12px solid #7a5541; border-radius: 12px;
  background: #fff6e6; color: #3a2c4b;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.5);
  transform: scale(0.92); transition: transform 0.2s cubic-bezier(.3, 1.5, .6, 1);
}
.pm-open .pm-card { transform: scale(1); }
.pm-card[data-mode="short"] { --accent: #4f8a5b; }
.pm-card[data-mode="long"] { --accent: #6c8fb3; }
.pm-head { display: flex; align-items: center; gap: 10px; }
.pm-title { margin: 0; flex: 1; font-size: 22px; }
.pm-close {
  width: 34px; height: 34px; flex: none; border: 0; border-radius: 50%;
  background: #eadccb; color: #3a2c4b; font-size: 20px; line-height: 1; cursor: pointer;
}
.pm-close:hover { background: #dccbb6; }
.pm-modes {
  display: flex; gap: 3px; margin-top: 12px; padding: 3px;
  border-radius: 12px; background: #eadccb;
}
.pm-mode {
  flex: 1; padding: 7px 4px; border: 0; border-radius: 9px;
  background: transparent; color: #3a2c4b; font: inherit; font-size: 13px;
  cursor: pointer; transition: background 0.15s, color 0.15s;
}
.pm-mode:hover { background: rgba(255, 255, 255, 0.55); }
.pm-mode[aria-selected="true"] { background: var(--accent); color: #fff6e6; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2); }
.pm-dial { position: relative; width: 190px; height: 190px; margin: 16px auto 4px; }
.pm-dial svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.pm-track { fill: none; stroke: #eadccb; stroke-width: 8; }
.pm-progress {
  fill: none; stroke: var(--accent); stroke-width: 8; stroke-linecap: round;
  stroke-dasharray: ${RING}; transition: stroke-dashoffset 0.3s linear, stroke 0.2s;
}
.pm-face {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.pm-time { font-size: 44px; font-weight: bold; font-variant-numeric: tabular-nums; letter-spacing: 1px; }
.pm-state { margin-top: 2px; font-size: 13px; opacity: 0.7; }
.pm-paused .pm-time { animation: pm-blink 1s steps(2, start) infinite; }
@keyframes pm-blink { to { opacity: 0.35; } }
.pm-length { display: flex; align-items: center; justify-content: center; gap: 12px; }
.pm-step {
  width: 30px; height: 30px; border: 0; border-radius: 50%;
  background: #eadccb; color: #3a2c4b; font: inherit; font-size: 18px; line-height: 1; cursor: pointer;
}
.pm-step:hover:not(:disabled) { background: #dccbb6; }
.pm-step:disabled { opacity: 0.35; cursor: default; }
.pm-minutes { min-width: 64px; text-align: center; font-size: 14px; font-variant-numeric: tabular-nums; }
.pm-actions { display: flex; gap: 8px; margin-top: 16px; }
.pm-btn {
  flex: 1; padding: 10px 6px; border: 0; border-radius: 10px;
  background: #eadccb; color: #3a2c4b; font: inherit; font-size: 14px; cursor: pointer;
  transition: background 0.15s, filter 0.15s;
}
.pm-btn:hover { background: #dccbb6; }
.pm-main { flex: 1.6; background: var(--accent); color: #fff6e6; font-size: 16px; font-weight: bold; }
.pm-main:hover { background: var(--accent); filter: brightness(0.9); }
.pm-rounds { display: flex; align-items: center; justify-content: center; gap: 7px; margin-top: 16px; }
.pm-dot { width: 11px; height: 11px; border-radius: 50%; background: #eadccb; }
.pm-dot.pm-done { background: #c96f5a; }
.pm-hint { margin: 8px 0 0; text-align: center; font-size: 12px; opacity: 0.65; }
`;

export default class Pomodoro {
  constructor() {
    this.isOpen = false;

    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    this.el = document.createElement('div');
    this.el.className = 'pm-backdrop';
    this.el.hidden = true;
    this.el.innerHTML = `
      <div class="pm-card" role="dialog" aria-modal="true" aria-labelledby="pm-title">
        <div class="pm-head">
          <h2 class="pm-title" id="pm-title" data-t="pomodoro.title"></h2>
          <button class="pm-close" data-t-aria="pomodoro.close">×</button>
        </div>
        <div class="pm-modes" role="tablist">
          ${MODES.map((mode) => `<button class="pm-mode" role="tab" data-mode="${mode}" data-t="pomodoro.${mode}"></button>`).join('')}
        </div>
        <div class="pm-dial">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle class="pm-track" cx="60" cy="60" r="52"/>
            <circle class="pm-progress" cx="60" cy="60" r="52"/>
          </svg>
          <div class="pm-face">
            <div class="pm-time" role="timer"></div>
            <div class="pm-state"></div>
          </div>
        </div>
        <div class="pm-length">
          <button class="pm-step" data-step="-1" data-t-aria="pomodoro.shorter">−</button>
          <span class="pm-minutes"></span>
          <button class="pm-step" data-step="1" data-t-aria="pomodoro.longer">+</button>
        </div>
        <div class="pm-actions">
          <button class="pm-btn pm-reset" data-t="pomodoro.reset"></button>
          <button class="pm-btn pm-main"></button>
          <button class="pm-btn pm-skip" data-t="pomodoro.skip"></button>
        </div>
        <div class="pm-rounds">${'<span class="pm-dot"></span>'.repeat(ROUNDS)}</div>
        <p class="pm-hint"></p>
      </div>`;
    document.body.appendChild(this.el);

    const q = (sel) => this.el.querySelector(sel);
    this.card = q('.pm-card');
    this.modes = this.el.querySelectorAll('.pm-mode');
    this.progress = q('.pm-progress');
    this.time = q('.pm-time');
    this.stateText = q('.pm-state');
    this.steps = this.el.querySelectorAll('.pm-step');
    this.minutes = q('.pm-minutes');
    this.mainBtn = q('.pm-main');
    this.rounds = q('.pm-rounds');
    this.dots = this.el.querySelectorAll('.pm-dot');
    this.hint = q('.pm-hint');

    this.modes.forEach((btn) =>
      btn.addEventListener('click', () => {
        if (btn.dataset.mode === getPomodoro().mode) return;
        sfx.paper();
        setMode(btn.dataset.mode);
      })
    );
    this.steps.forEach((btn) =>
      btn.addEventListener('click', () => {
        const { mode, minutes } = getPomodoro();
        sfx.equip();
        setMinutes(mode, minutes[mode] + Number(btn.dataset.step) * LIMITS[mode][2]);
      })
    );
    this.mainBtn.addEventListener('click', () => {
      const { running } = getPomodoro();
      sfx.timer(!running);
      if (running) pause();
      else start();
    });
    q('.pm-reset').addEventListener('click', () => {
      sfx.paper();
      reset();
    });
    q('.pm-skip').addEventListener('click', () => {
      sfx.paper();
      skip();
    });
    q('.pm-close').addEventListener('click', () => this.close());
    this.el.addEventListener('pointerdown', (e) => {
      if (e.target === this.el) this.close();
    });
    document.addEventListener('keydown', (e) => {
      if (this.isOpen && e.key === 'Escape') this.close();
    });

    onPomodoroChange(() => this.isOpen && this.render());
    onLangChange(() => this.render());
    this.render();
  }

  render() {
    const { mode, minutes, round, running, paused, left, total } = getPomodoro();
    this.card.dataset.mode = mode;
    this.modes.forEach((btn) => btn.setAttribute('aria-selected', String(btn.dataset.mode === mode)));

    this.time.textContent = formatTime(left);
    this.progress.style.strokeDashoffset = String(RING * (1 - left / total));
    this.card.classList.toggle('pm-paused', paused);
    this.stateText.textContent = t(
      paused ? 'pomodoro.paused' :
      !running ? 'pomodoro.ready' :
      mode === 'focus' ? 'pomodoro.focusing' :
      'pomodoro.resting'
    );

    const [min, max] = LIMITS[mode];
    this.minutes.textContent = t('pomodoro.minutes', { n: minutes[mode] });
    this.steps[0].disabled = running || minutes[mode] <= min;
    this.steps[1].disabled = running || minutes[mode] >= max;

    this.mainBtn.textContent = t(running ? 'pomodoro.pause' : paused ? 'pomodoro.resume' : 'pomodoro.start');
    this.dots.forEach((dot, i) => dot.classList.toggle('pm-done', i < round));
    this.rounds.setAttribute('aria-label', t('pomodoro.rounds', { n: Math.min(round, ROUNDS), total: ROUNDS }));
    this.hint.textContent = t('pomodoro.hint', { n: focusReward(minutes.focus) });
    translateDom(this.el);
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.render();
    this.el.hidden = false;
    requestAnimationFrame(() => this.el.classList.add('pm-open'));
    this.mainBtn.focus();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    sfx.paper();
    this.el.classList.remove('pm-open');
    setTimeout(() => {
      if (!this.isOpen) this.el.hidden = true;
    }, 200);
  }
}
