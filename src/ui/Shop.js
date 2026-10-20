import sfx from '../audio/sfx.js';
import { COIN } from './coin.js';
import { CATALOG, drawPreview } from '../objects/items.js';
import { getShop, onShopChange, owns, isEquipped, buy, equip } from '../utils/shop.js';
import { TASK_REWARD } from '../utils/tasks.js';
import { t, onLangChange, translateDom } from '../utils/i18n.js';

// The corner shop's window, opened by clicking the shop across the street.
// Plain HTML on top of the canvas, like TaskBoard.

const PREVIEW_W = 150;
const PREVIEW_H = 120;

const CSS = `
.sh-backdrop {
  position: fixed; inset: 0; z-index: 10;
  display: flex; align-items: center; justify-content: center;
  background: rgba(10, 8, 24, 0.6);
  opacity: 0; transition: opacity 0.2s;
  font-family: "Trebuchet MS", "Segoe UI", Verdana, sans-serif;
}
.sh-backdrop[hidden] { display: none; }
.sh-backdrop.sh-open { opacity: 1; }
.sh-board {
  position: relative; overflow: hidden;
  width: min(720px, 94vw); max-height: 88vh;
  display: flex; flex-direction: column; box-sizing: border-box;
  border: 12px solid #7a5541; border-radius: 12px;
  background: #fff6e6; color: #3a2c4b;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.5);
  transform: scale(0.92); transition: transform 0.2s cubic-bezier(.3, 1.5, .6, 1);
}
.sh-open .sh-board { transform: scale(1); }
.sh-awning {
  position: relative; flex: none; height: 26px;
  background: repeating-linear-gradient(90deg, #d9795f 0 14px, #f3e6cf 14px 28px);
}
.sh-awning::after {
  content: ""; position: absolute; left: 0; right: 0; bottom: -8px; height: 8px;
  background:
    radial-gradient(circle at 7px 0, #d9795f 7px, transparent 7.5px) 0 0 / 28px 8px repeat-x,
    radial-gradient(circle at 21px 0, #f3e6cf 7px, transparent 7.5px) 0 0 / 28px 8px repeat-x;
}
.sh-head { display: flex; align-items: flex-start; gap: 12px; padding: 20px 18px 6px; }
.sh-head > div:first-child { flex: 1; min-width: 0; }
.sh-title { margin: 0; font-size: 24px; }
.sh-sub { margin: 4px 0 0; font-size: 13px; opacity: 0.7; }
.sh-wallet {
  display: flex; align-items: center; gap: 6px; flex: none;
  padding: 6px 12px; border-radius: 16px; background: #3a2c4b; color: #fff4d6;
  font-size: 16px; font-variant-numeric: tabular-nums;
}
.sh-close {
  width: 34px; height: 34px; flex: none; border: 0; border-radius: 50%;
  background: #eadccb; color: #3a2c4b; font-size: 20px; line-height: 1; cursor: pointer;
}
.sh-close:hover { background: #dccbb6; }
.sh-tabs { display: flex; gap: 6px; padding: 8px 18px 0; }
.sh-tab {
  padding: 8px 18px; border: 0; border-radius: 10px 10px 0 0;
  background: #eadccb; color: #3a2c4b; font: inherit; font-size: 15px; cursor: pointer;
}
.sh-tab[aria-selected="true"] { background: #43345a; color: #fff4d6; }
.sh-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 14px; padding: 16px 18px 18px; overflow-y: auto;
  border-top: 4px solid #43345a;
}
.sh-card {
  display: flex; flex-direction: column; align-items: stretch; gap: 6px;
  padding: 8px 8px 10px; border-radius: 12px; background: #f3e6cf;
  box-shadow: 0 2px 0 #e0cdb5;
}
.sh-card.sh-equipped { box-shadow: 0 0 0 3px #c96f5a; }
.sh-stage {
  display: flex; justify-content: center; border-radius: 8px; overflow: hidden;
  background-color: #43345a;
  background-image: radial-gradient(#4d3d66 2px, transparent 2.5px);
  background-size: 13px 13px;
}
.sh-stage canvas { width: ${PREVIEW_W}px; height: ${PREVIEW_H}px; max-width: 100%; }
.sh-name { font-size: 15px; font-weight: bold; padding: 0 2px; }
.sh-price { display: flex; align-items: center; gap: 5px; font-size: 14px; padding: 0 2px; opacity: 0.85; }
.sh-btn {
  margin-top: 2px; padding: 8px; border: 0; border-radius: 9px;
  font: inherit; font-size: 14px; cursor: pointer;
  background: #c96f5a; color: #fff6e6; transition: background 0.15s;
}
.sh-btn:hover { background: #b45d49; }
.sh-btn.sh-use { background: #43345a; }
.sh-btn.sh-use:hover { background: #5a4470; }
.sh-btn.sh-locked { background: #d8c9b8; color: #6b5a70; }
.sh-btn[disabled] { background: transparent; color: #c96f5a; cursor: default; box-shadow: inset 0 0 0 2px #c96f5a; }
.sh-shake { animation: sh-shake 0.3s; }
@keyframes sh-shake { 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
`;

export default class Shop {
  constructor({ onClose } = {}) {
    this.onClose = onClose;
    this.isOpen = false;
    this.kind = 'lamp';

    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    this.el = document.createElement('div');
    this.el.className = 'sh-backdrop';
    this.el.hidden = true;
    this.el.innerHTML = `
      <div class="sh-board" role="dialog" aria-modal="true" aria-labelledby="sh-title">
        <div class="sh-awning"></div>
        <div class="sh-head">
          <div>
            <h2 class="sh-title" id="sh-title" data-t="shop.title"></h2>
            <p class="sh-sub"></p>
          </div>
          <div class="sh-wallet">${COIN}<span class="sh-coins"></span></div>
          <button class="sh-close" data-t-aria="shop.close">×</button>
        </div>
        <div class="sh-tabs" role="tablist">
          ${Object.keys(CATALOG)
            .map((kind) => `<button class="sh-tab" role="tab" data-kind="${kind}" data-t="shop.${kind}"></button>`)
            .join('')}
        </div>
        <div class="sh-grid" role="tabpanel"></div>
      </div>`;
    document.body.appendChild(this.el);

    this.grid = this.el.querySelector('.sh-grid');
    this.coins = this.el.querySelector('.sh-coins');
    this.sub = this.el.querySelector('.sh-sub');
    this.tabs = this.el.querySelectorAll('.sh-tab');

    this.tabs.forEach((tab) =>
      tab.addEventListener('click', () => {
        if (this.kind === tab.dataset.kind) return;
        this.kind = tab.dataset.kind;
        sfx.paper();
        this.render();
      })
    );
    this.el.querySelector('.sh-close').addEventListener('click', () => this.close());
    this.el.addEventListener('pointerdown', (e) => {
      if (e.target === this.el) this.close();
    });
    document.addEventListener('keydown', (e) => {
      if (this.isOpen && e.key === 'Escape') this.close();
    });

    onShopChange(() => this.render());
    onLangChange(() => this.render());
    this.render();
  }

  render() {
    const { coins } = getShop();
    this.coins.textContent = coins;
    this.sub.textContent = t('shop.subtitle', { task: TASK_REWARD });
    this.tabs.forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.kind === this.kind)));
    translateDom(this.el);
    this.grid.replaceChildren(...CATALOG[this.kind].map((item) => this.card(item, coins)));
  }

  card(item, coins) {
    const card = document.createElement('div');
    card.className = 'sh-card';

    const stage = document.createElement('div');
    stage.className = 'sh-stage';
    const canvas = document.createElement('canvas');
    drawPreview(canvas, item, PREVIEW_W, PREVIEW_H);
    stage.appendChild(canvas);

    const name = document.createElement('div');
    name.className = 'sh-name';
    name.textContent = t(`item.${item.id}`);

    const price = document.createElement('div');
    price.className = 'sh-price';
    if (owns(item)) price.textContent = t('shop.owned');
    else price.innerHTML = `${COIN}<span>${item.price}</span>`;

    const btn = document.createElement('button');
    btn.className = 'sh-btn';
    if (isEquipped(item)) {
      card.classList.add('sh-equipped');
      btn.textContent = t('shop.inUse');
      btn.disabled = true;
    } else if (owns(item)) {
      btn.classList.add('sh-use');
      btn.textContent = t('shop.use');
      btn.addEventListener('click', () => {
        sfx.equip();
        equip(item);
      });
    } else if (coins >= item.price) {
      btn.textContent = t('shop.buy');
      btn.addEventListener('click', () => {
        if (buy(item)) {
          sfx.buy();
          this.bought = true;
        }
      });
    } else {
      // Still clickable, so you get a gentle "not yet" instead of nothing.
      btn.classList.add('sh-locked');
      btn.textContent = t('shop.need', { n: item.price - coins });
      btn.addEventListener('click', () => {
        sfx.denied();
        card.classList.remove('sh-shake');
        void card.offsetWidth;
        card.classList.add('sh-shake');
      });
    }

    card.append(stage, name, price, btn);
    return card;
  }

  // `title` is an i18n key, so each place can name its own shop.
  open({ title = 'shop.title' } = {}) {
    if (this.isOpen) return;
    this.isOpen = true;
    this.bought = false;
    this.el.querySelector('.sh-title').dataset.t = title;
    this.render();
    this.el.hidden = false;
    requestAnimationFrame(() => this.el.classList.add('sh-open'));
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.el.classList.remove('sh-open');
    setTimeout(() => {
      if (!this.isOpen) this.el.hidden = true;
    }, 200);
    this.onClose?.(this.bought);
  }
}
