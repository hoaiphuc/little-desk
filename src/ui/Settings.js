import sfx from '../audio/sfx.js';
import { LANGS, t, getLang, setLang, onLangChange, translateDom } from '../utils/i18n.js';

// The gear button in the top-left corner and its little settings panel
// (music, sound effects, language, replaying the tutorial).
// Like TaskBoard, it's plain HTML on top of the game canvas.

const KEY = 'cozy-desk.settings';

const CSS = `
.st-gear {
  position: fixed; top: 16px; left: 16px; z-index: 20;
  width: 44px; height: 44px; padding: 0; border: 0; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: rgba(27, 21, 48, 0.82); color: #fff4d6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
  cursor: pointer; transition: transform 0.3s, background 0.15s;
}
.st-gear:hover { background: rgba(58, 44, 75, 0.95); }
.st-gear.st-open { transform: rotate(60deg); }
.st-gear svg { width: 24px; height: 24px; }
.st-panel {
  position: fixed; top: 70px; left: 16px; z-index: 20;
  width: min(280px, calc(100vw - 32px)); box-sizing: border-box;
  padding: 16px 18px 18px; border-radius: 14px;
  background: #fff6e6; color: #3a2c4b;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
  font-family: "Trebuchet MS", "Segoe UI", Verdana, sans-serif;
  transform-origin: top left;
  opacity: 0; transform: scale(0.9) translateY(-6px);
  transition: opacity 0.15s, transform 0.15s;
}
.st-panel[hidden] { display: none; }
.st-panel.st-open { opacity: 1; transform: none; }
.st-title { margin: 0 0 12px; font-size: 18px; }
.st-row { margin-top: 14px; }
.st-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.st-label { font-size: 15px; }
.st-sub { font-size: 12px; opacity: 0.65; }
.st-slider { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
.st-slider input { flex: 1; accent-color: #c96f5a; cursor: pointer; }
.st-slider input:disabled { opacity: 0.4; cursor: default; }
.st-value { width: 38px; text-align: right; font-size: 13px; font-variant-numeric: tabular-nums; }
.st-switch {
  position: relative; width: 44px; height: 24px; flex: none;
  border: 0; border-radius: 12px; padding: 0;
  background: #cdbfb4; cursor: pointer; transition: background 0.15s;
}
.st-switch::after {
  content: ""; position: absolute; top: 3px; left: 3px;
  width: 18px; height: 18px; border-radius: 50%;
  background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  transition: transform 0.15s;
}
.st-switch[aria-checked="true"] { background: #c96f5a; }
.st-langs {
  display: flex; margin-top: 8px; padding: 3px; gap: 3px;
  border-radius: 12px; background: #eadccb;
}
.st-lang {
  flex: 1; padding: 7px 6px; border: 0; border-radius: 9px;
  background: transparent; color: #3a2c4b; font: inherit; font-size: 14px;
  cursor: pointer; transition: background 0.15s, color 0.15s;
}
.st-lang:hover { background: rgba(255, 255, 255, 0.55); }
.st-lang[aria-checked="true"] { background: #c96f5a; color: #fff6e6; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2); }
.st-switch[aria-checked="true"]::after { transform: translateX(20px); }
.st-replay {
  flex: none; padding: 7px 12px; border: 0; border-radius: 9px;
  background: #eadccb; color: #3a2c4b; font: inherit; font-size: 13px;
  cursor: pointer; transition: background 0.15s;
}
.st-replay:hover { background: #dccbb6; }
`;

const GEAR = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <circle cx="12" cy="12" r="3"/>
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
</svg>`;

function load() {
  const defaults = { musicVolume: 70, sfxVolume: 80, sfxOn: true };
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY)) };
  } catch {
    return defaults;
  }
}

export default class Settings {
  constructor({ lofi, onTutorial }) {
    this.lofi = lofi;
    this.state = load();

    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    this.gear = document.createElement('button');
    this.gear.className = 'st-gear';
    this.gear.setAttribute('aria-expanded', 'false');
    this.gear.innerHTML = GEAR;

    this.panel = document.createElement('div');
    this.panel.className = 'st-panel';
    this.panel.hidden = true;
    this.panel.setAttribute('role', 'dialog');
    this.panel.innerHTML = `
      <h2 class="st-title" data-t="settings.title"></h2>
      <div class="st-row">
        <div class="st-head">
          <div>
            <div class="st-label" data-t="settings.music"></div>
            <div class="st-sub" data-t="settings.musicSub"></div>
          </div>
          <button class="st-switch" data-k="music" role="switch" data-t-aria="settings.musicToggle"></button>
        </div>
        <div class="st-slider">
          <input type="range" min="0" max="100" step="1" data-k="music" data-t-aria="settings.musicVolume">
          <span class="st-value" data-k="music"></span>
        </div>
      </div>
      <div class="st-row">
        <div class="st-head">
          <div>
            <div class="st-label" data-t="settings.sfx"></div>
            <div class="st-sub" data-t="settings.sfxSub"></div>
          </div>
          <button class="st-switch" data-k="sfx" role="switch" data-t-aria="settings.sfxToggle"></button>
        </div>
        <div class="st-slider">
          <input type="range" min="0" max="100" step="1" data-k="sfx" data-t-aria="settings.sfxVolume">
          <span class="st-value" data-k="sfx"></span>
        </div>
      </div>
      <div class="st-row">
        <div class="st-label" id="st-lang-label" data-t="settings.language"></div>
        <div class="st-langs" role="radiogroup" aria-labelledby="st-lang-label">
          ${Object.entries(LANGS)
            .map(([code, name]) => `<button class="st-lang" role="radio" data-lang="${code}" lang="${code}">${name}</button>`)
            .join('')}
        </div>
      </div>
      <div class="st-row">
        <div class="st-head">
          <div>
            <div class="st-label" data-t="settings.tutorial"></div>
            <div class="st-sub" data-t="settings.tutorialSub"></div>
          </div>
          <button class="st-replay" data-t="settings.tutorialReplay"></button>
        </div>
      </div>`;
    document.body.append(this.gear, this.panel);

    const q = (sel) => this.panel.querySelector(sel);
    this.musicSwitch = q('.st-switch[data-k="music"]');
    this.musicSlider = q('input[data-k="music"]');
    this.musicValue = q('.st-value[data-k="music"]');
    this.sfxSwitch = q('.st-switch[data-k="sfx"]');
    this.sfxSlider = q('input[data-k="sfx"]');
    this.sfxValue = q('.st-value[data-k="sfx"]');

    this.musicSwitch.addEventListener('click', () => {
      this.lofi.toggle();
      this.render();
    });
    this.musicSlider.addEventListener('input', () => {
      this.state.musicVolume = Number(this.musicSlider.value);
      this.apply();
    });
    this.sfxSwitch.addEventListener('click', () => {
      this.state.sfxOn = !this.state.sfxOn;
      this.apply();
      if (this.state.sfxOn) sfx.chime(84, 0, 0.1);
    });
    this.sfxSlider.addEventListener('input', () => {
      this.state.sfxVolume = Number(this.sfxSlider.value);
      this.apply();
    });
    // Play a sample once you let go of the slider, so you hear the new level.
    this.sfxSlider.addEventListener('change', () => sfx.chime(84, 0, 0.1));

    this.langButtons = this.panel.querySelectorAll('.st-lang');
    this.langButtons.forEach((btn) =>
      btn.addEventListener('click', () => {
        if (btn.dataset.lang === getLang()) return;
        sfx.paper();
        setLang(btn.dataset.lang);
      })
    );
    onLangChange(() => this.render());

    q('.st-replay').addEventListener('click', () => {
      this.close();
      onTutorial?.();
    });

    this.gear.addEventListener('click', () => (this.isOpen ? this.close() : this.open()));
    document.addEventListener('pointerdown', (e) => {
      if (this.isOpen && !this.panel.contains(e.target) && !this.gear.contains(e.target)) this.close();
    });
    document.addEventListener('keydown', (e) => {
      if (this.isOpen && e.key === 'Escape') this.close();
    });

    this.apply();
  }

  // Push the current settings into the audio, save them, and redraw.
  apply() {
    const { musicVolume, sfxVolume, sfxOn } = this.state;
    this.lofi.setVolume(musicVolume / 100);
    sfx.setVolume(sfxVolume / 100);
    sfx.muted = !sfxOn;
    try {
      localStorage.setItem(KEY, JSON.stringify(this.state));
    } catch {
      // storage blocked: settings still work until the page reloads
    }
    this.render();
  }

  render() {
    const { musicVolume, sfxVolume, sfxOn } = this.state;
    this.musicSwitch.setAttribute('aria-checked', String(this.lofi.playing));
    this.musicSlider.value = musicVolume;
    this.musicValue.textContent = `${musicVolume}%`;
    this.sfxSwitch.setAttribute('aria-checked', String(sfxOn));
    this.sfxSlider.value = sfxVolume;
    this.sfxSlider.disabled = !sfxOn;
    this.sfxValue.textContent = `${sfxVolume}%`;
    this.langButtons.forEach((btn) => btn.setAttribute('aria-checked', String(btn.dataset.lang === getLang())));
    this.gear.setAttribute('aria-label', t('settings.open'));
    this.panel.setAttribute('aria-label', t('settings.title'));
    translateDom(this.panel);
  }

  open() {
    this.isOpen = true;
    this.render(); // the radio may have been switched since last time
    this.panel.hidden = false;
    this.gear.classList.add('st-open');
    this.gear.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => this.panel.classList.add('st-open'));
  }

  close() {
    this.isOpen = false;
    this.panel.classList.remove('st-open');
    this.gear.classList.remove('st-open');
    this.gear.setAttribute('aria-expanded', 'false');
    setTimeout(() => {
      if (!this.isOpen) this.panel.hidden = true;
    }, 150);
  }
}
