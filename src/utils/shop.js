// Coins, what you've bought from the corner shop, and what's in use.
// Saved in localStorage like the task list. The catalogue itself lives in
// objects/items.js.

const KEY = 'cozy-desk.shop';

const DEFAULTS = {
  coins: 30, // enough for one cheap item, so the shop is fun on day one
  owned: ['lamp-classic', 'clock-classic', 'map-city'],
  equipped: { lamp: 'lamp-classic', clock: 'clock-classic', map: 'map-city' },
};

let state = load();
const listeners = new Set();

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && typeof saved.coins === 'number') {
      // Merge with the defaults so saves from older versions get any new free items.
      return {
        ...DEFAULTS,
        ...saved,
        owned: [...new Set([...DEFAULTS.owned, ...(saved.owned ?? [])])],
        equipped: { ...DEFAULTS.equipped, ...saved.equipped },
      };
    }
  } catch {
    // no storage: start fresh
  }
  return structuredClone(DEFAULTS);
}

function changed() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage blocked: purchases still last for this session
  }
  listeners.forEach((fn) => fn(state));
}

export function getShop() {
  return state;
}

export function onShopChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function addCoins(n) {
  state = { ...state, coins: state.coins + n };
  changed();
}

export function owns(item) {
  return state.owned.includes(item.id);
}

export function isEquipped(item) {
  return state.equipped[item.kind] === item.id;
}

// Buying also puts the item to use straight away. Returns false if you can't afford it.
export function buy(item) {
  if (owns(item) || state.coins < item.price) return false;
  state = {
    coins: state.coins - item.price,
    owned: [...state.owned, item.id],
    equipped: { ...state.equipped, [item.kind]: item.id },
  };
  changed();
  return true;
}

export function equip(item) {
  if (!owns(item) || isEquipped(item)) return;
  state = { ...state, equipped: { ...state.equipped, [item.kind]: item.id } };
  changed();
}
