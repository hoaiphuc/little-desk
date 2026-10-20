// The little gold coin used by the coin counter and the shop.

const style = document.createElement('style');
style.textContent = `
.coin {
  display: inline-block; flex: none;
  width: 1em; height: 1em; border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #fff1bf, #f0c35a 55%, #c9922e);
  box-shadow: inset 0 0 0 0.09em #b57f22;
  vertical-align: -0.14em;
}`;
document.head.appendChild(style);

export const COIN = '<span class="coin" aria-hidden="true"></span>';
