// The tomato timer on the desk: focus for a while, take a short break, and
// after a few rounds a long one. Saved in localStorage along with the moment
// it will ring, so it keeps counting through reloads and background tabs.
// Things that show the timer call `onPomodoroChange` (every state change,
// and once a second while it runs); `onPomodoroDone` hears it ring.

import { addCoins } from './shop.js';

const KEY = 'cozy-desk.pomodoro';
export const MODES = ['focus', 'short', 'long'];
export const ROUNDS = 4; // focus sessions before a long break
export const LIMITS = { focus: [5, 90, 5], short: [1, 30, 1], long: [5, 60, 5] }; // [min, max, step] in minutes

// Two coins for every five minutes of focus, so a classic 25 pays 10.
export const focusReward = (minutes) => Math.floor(minutes / 5) * 2;

const DEFAULTS = {
  minutes: { focus: 25, short: 5, long: 15 },
  mode: 'focus',
  round: 0, // focus sessions finished since the last long break
  endsAt: null, // timestamp while running
  left: null, // ms left while paused; null means a fresh, full timer
};

let state = load();
const listeners = new Set();
const doneListeners = new Set();

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && MODES.includes(saved.mode)) {
      return { ...DEFAULTS, ...saved, minutes: { ...DEFAULTS.minutes, ...saved.minutes } };
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
    // storage blocked: the timer still runs for this session
  }
  syncTimers();
  notify();
}

function notify() {
  const now = getPomodoro();
  listeners.forEach((fn) => fn(now));
}

// While running, a fast interval updates the display and a single timeout
// rings on time. Browsers slow repeating timers in background tabs (down to
// once a minute), but a one-off timeout still fires close to when it should.
let ticker = null;
let alarm = null;
let shownSecond = null;

function syncTimers() {
  clearTimeout(alarm);
  alarm = null;
  if (state.endsAt === null) {
    clearInterval(ticker);
    ticker = null;
    return;
  }
  ticker ??= setInterval(tick, 250);
  alarm = setTimeout(tick, Math.max(0, state.endsAt - Date.now()) + 20);
}

function tick() {
  if (state.endsAt === null) return;
  const left = state.endsAt - Date.now();
  if (left <= 0) return finish();
  const second = Math.ceil(left / 1000);
  if (second !== shownSecond) {
    shownSecond = second;
    notify();
  }
}

const fullLength = (mode = state.mode) => state.minutes[mode] * 60000;

// Moves on to whatever comes next. Only a focus session that ran to the end
// counts as a round; a long break starts the count over.
function advance(completed) {
  const finished = state.mode;
  let round = state.round;
  if (finished === 'focus' && completed) round++;
  if (finished === 'long') round = 0;
  const next = finished !== 'focus' ? 'focus' : round >= ROUNDS ? 'long' : 'short';
  state = { ...state, mode: next, round, endsAt: null, left: null };
}

function finish() {
  const finished = state.mode;
  const reward = finished === 'focus' ? focusReward(state.minutes.focus) : 0;
  advance(true);
  changed();
  if (reward) addCoins(reward);
  doneListeners.forEach((fn) => fn({ finished, reward, next: state.mode, round: state.round }));
}

export function getPomodoro() {
  const running = state.endsAt !== null;
  const left = running ? Math.max(0, state.endsAt - Date.now()) : state.left ?? fullLength();
  return {
    mode: state.mode,
    minutes: state.minutes,
    round: state.round,
    running,
    paused: !running && state.left !== null,
    left,
    total: fullLength(),
  };
}

export function onPomodoroChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function onPomodoroDone(fn) {
  doneListeners.add(fn);
  return () => doneListeners.delete(fn);
}

// "25:00", rounding up so it never shows 0:00 while there's time left.
export function formatTime(ms) {
  const s = Math.ceil(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function start() {
  if (state.endsAt !== null) return;
  state = { ...state, endsAt: Date.now() + (state.left ?? fullLength()), left: null };
  changed();
}

export function pause() {
  if (state.endsAt === null) return;
  state = { ...state, left: Math.max(0, state.endsAt - Date.now()), endsAt: null };
  changed();
}

export function reset() {
  state = { ...state, endsAt: null, left: null };
  changed();
}

export function skip() {
  advance(false);
  changed();
}

export function setMode(mode) {
  if (!MODES.includes(mode) || mode === state.mode) return;
  state = { ...state, mode, endsAt: null, left: null };
  changed();
}

// Changing the length of the current mode restarts it (it can't change while running).
export function setMinutes(mode, n) {
  const [min, max] = LIMITS[mode];
  const minutes = Math.min(max, Math.max(min, n));
  if (minutes === state.minutes[mode]) return;
  state = { ...state, minutes: { ...state.minutes, [mode]: minutes } };
  if (mode === state.mode && state.endsAt === null) state.left = null;
  changed();
}

// A timer that ran out while the page was closed rings as soon as it's back.
syncTimers();
