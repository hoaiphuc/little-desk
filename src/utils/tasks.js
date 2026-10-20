// The to-do list behind the notes board. Saved in localStorage so tasks
// survive a page reload. Anything that draws tasks calls `onTasksChange`
// and gets told whenever the list changes.

import { t } from './i18n.js';
import { addCoins } from './shop.js';

const KEY = 'cozy-desk.tasks';
export const TASK_REWARD = 15;

// Sticky-note paper colours (same ones the little board on the wall uses).
export const NOTE_COLORS = [0xfff09a, 0xa8e0c8, 0xffb8c8, 0xbfd4ff, 0xffd2a8];

let tasks = load();
const listeners = new Set();

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(saved)) return saved;
  } catch {
    // no storage (private window etc.), fall through to the defaults
  }
  // First visit: a few example tasks, in whatever language the game starts in.
  return t('tasks.defaults').map((text, i) => makeTask(text, i));
}

function makeTask(text, color) {
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    text,
    done: false,
    color: color % NOTE_COLORS.length,
    tilt: Math.round((Math.random() * 6 - 3) * 10) / 10, // degrees
  };
}

function changed() {
  try {
    localStorage.setItem(KEY, JSON.stringify(tasks));
  } catch {
    // storage full or blocked: the list still works for this session
  }
  listeners.forEach((fn) => fn(tasks));
}

export function getTasks() {
  return tasks;
}

export function onTasksChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Each new note takes the colour after the last one, so neighbours differ.
export function nextNoteColor() {
  const last = tasks[tasks.length - 1];
  return last ? (last.color + 1) % NOTE_COLORS.length : 0;
}

export function addTask(text) {
  const clean = text.trim();
  if (!clean) return null;
  const task = makeTask(clean, nextNoteColor());
  tasks = [...tasks, task];
  changed();
  return task;
}

// Finishing a task pays coins, but only the first time, so ticking a task
// on and off can't be used to farm them.
export function toggleTask(id) {
  tasks = tasks.map((task) => {
    if (task.id !== id) return task;
    const done = !task.done;
    if (done && !task.rewarded) {
      addCoins(TASK_REWARD);
      return { ...task, done, rewarded: true };
    }
    return { ...task, done };
  });
  changed();
}

export function removeTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  changed();
}

export function clearDone() {
  tasks = tasks.filter((task) => !task.done);
  changed();
}
