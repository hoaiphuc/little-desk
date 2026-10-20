import sfx from '../audio/sfx.js';
import { COIN } from './coin.js';
import { getShop, onShopChange } from '../utils/shop.js';
import { t, onLangChange } from '../utils/i18n.js';

// The coin counter next to the settings gear. It chimes and shows "+n"
// when you earn coins, and opens the shop when clicked.

const CSS = `
.ch-pill {
  position: fixed; top: 20px; left: 70px; z-index: 20;
  height: 36px; padding: 0 14px 0 10px; border: 0; border-radius: 18px;
  display: flex; align-items: center; gap: 7px;
  background: rgba(27, 21, 48, 0.82); color: #fff4d6;
  font: 16px "Trebuchet MS", "Segoe UI", Verdana, sans-serif;
  font-variant-numeric: tabular-nums;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
  cursor: pointer; transition: background 0.15s;
}
.ch-pill:hover { background: rgba(58, 44, 75, 0.95); }
.ch-pill .coin { font-size: 18px; }
.ch-bump { animation: ch-bump 0.35s ease-out; }
@keyframes ch-bump { 40% { transform: scale(1.15); } }
.ch-plus {
  position: fixed; top: 58px; z-index: 20; pointer-events: none;
  color: #ffd27a; font: bold 15px "Trebuchet MS", "Segoe UI", sans-serif;
  text-shadow: 0 1px 0 #2a2140, 0 0 4px #2a2140;
  animation: ch-rise 1.2s ease-out forwards;
}
@keyframes ch-rise {
  from { opacity: 0; transform: translateY(8px); }
  20% { opacity: 1; transform: none; }
  to { opacity: 0; transform: translateY(-18px); }
}
`;

export default class CoinHud {
  constructor({ onClick }) {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    this.el = document.createElement('button');
    this.el.className = 'ch-pill';
    this.el.innerHTML = `${COIN}<span class="ch-count"></span>`;
    this.count = this.el.querySelector('.ch-count');
    this.el.addEventListener('click', onClick);
    document.body.appendChild(this.el);

    let shown = getShop().coins;
    onShopChange(({ coins }) => {
      const gained = coins - shown;
      shown = coins;
      this.render();
      if (gained > 0) this.celebrate(gained);
    });
    onLangChange(() => this.render());
    this.render();
  }

  render() {
    const { coins } = getShop();
    this.count.textContent = coins;
    this.el.setAttribute('aria-label', t('coins.hud', { n: coins }));
  }

  celebrate(n) {
    sfx.coin();
    this.el.classList.remove('ch-bump');
    void this.el.offsetWidth; // restart the animation
    this.el.classList.add('ch-bump');

    const plus = document.createElement('div');
    plus.className = 'ch-plus';
    plus.textContent = `+${n}`;
    plus.style.left = `${this.el.offsetLeft + this.el.offsetWidth / 2 - 10}px`;
    plus.addEventListener('animationend', () => plus.remove());
    document.body.appendChild(plus);
  }
}
