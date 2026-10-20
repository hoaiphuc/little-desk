import { NOTE_COLORS, nextNoteColor, getTasks, onTasksChange, addTask, toggleTask, removeTask, clearDone } from '../utils/tasks.js';
import sfx from '../audio/sfx.js';
import { t, onLangChange, translateDom } from '../utils/i18n.js';

// The big cork board that opens when you click the notes board on the wall.
// It's plain HTML on top of the game canvas (not Phaser) so typing works
// properly, including accents and IME input.

const hex = (n) => `#${n.toString(16).padStart(6, '0')}`;

const CSS = `
.tb-backdrop {
  position: fixed; inset: 0; z-index: 10;
  display: flex; align-items: center; justify-content: center;
  background: rgba(10, 8, 24, 0.6);
  opacity: 0; transition: opacity 0.2s;
  font-family: "Trebuchet MS", "Segoe UI", Verdana, sans-serif;
}
.tb-backdrop[hidden] { display: none; }
.tb-backdrop.tb-open { opacity: 1; }
.tb-board {
  position: relative;
  width: min(760px, 94vw); max-height: 88vh;
  display: flex; flex-direction: column;
  box-sizing: border-box;
  border: 14px solid #7a5541; border-radius: 10px;
  background-color: #b98a5a;
  background-image: radial-gradient(rgba(90, 60, 30, 0.25) 1px, transparent 1.5px);
  background-size: 9px 9px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.5), inset 0 0 30px rgba(60, 35, 15, 0.35);
  transform: scale(0.92); transition: transform 0.2s cubic-bezier(.3, 1.5, .6, 1);
}
.tb-open .tb-board { transform: scale(1); }
.tb-head {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 18px 4px;
  color: #fff6e6; text-shadow: 0 2px 0 rgba(58, 44, 75, 0.45);
}
.tb-title { margin: 0; font-size: 24px; flex: 1; }
.tb-count { font-size: 14px; opacity: 0.9; }
.tb-close {
  width: 34px; height: 34px; border: 0; border-radius: 50%;
  background: #3a2c4b; color: #fff6e6; font-size: 20px; line-height: 1;
  cursor: pointer;
}
.tb-close:hover { background: #5a4470; }
.tb-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 22px; padding: 18px; overflow-y: auto;
}
.tb-note {
  position: relative; min-height: 130px; box-sizing: border-box;
  padding: 22px 14px 14px;
  color: #3a2c4b;
  font-family: "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive;
  font-size: 15px; line-height: 1.35;
  overflow-wrap: anywhere; white-space: pre-wrap;
  box-shadow: 2px 5px 8px rgba(40, 25, 10, 0.35);
  transform: rotate(var(--tilt, 0deg));
  transition: transform 0.15s, opacity 0.2s;
  cursor: pointer;
}
.tb-note:hover { transform: rotate(0deg) scale(1.04); z-index: 1; }
.tb-note::before {
  content: ""; position: absolute; top: 7px; left: 50%;
  width: 10px; height: 10px; margin-left: -5px; border-radius: 50%;
  background: #d9534f; box-shadow: 0 2px 2px rgba(0, 0, 0, 0.35);
}
.tb-note.tb-done { opacity: 0.6; }
.tb-note.tb-done .tb-text { text-decoration: line-through; text-decoration-thickness: 2px; }
.tb-note.tb-done::after {
  content: "✔"; position: absolute; right: 10px; bottom: 6px;
  font-size: 26px; color: #4f8a5b;
}
.tb-del {
  position: absolute; top: 4px; right: 4px;
  width: 22px; height: 22px; border: 0; border-radius: 50%;
  background: transparent; color: #6b5a70; font-size: 16px; line-height: 1;
  cursor: pointer; opacity: 0.45;
}
.tb-note:hover .tb-del { opacity: 1; }
.tb-del:hover { background: rgba(58, 44, 75, 0.15); }
.tb-new { cursor: text; outline: 2px dashed rgba(58, 44, 75, 0.35); outline-offset: -8px; }
.tb-new:hover { transform: rotate(var(--tilt, 0deg)); }
.tb-new textarea {
  width: 100%; height: 72px; box-sizing: border-box; resize: none;
  border: 0; background: transparent; outline: none;
  font: inherit; color: inherit;
}
.tb-new textarea::placeholder { color: rgba(58, 44, 75, 0.5); }
.tb-hint { font-size: 11px; opacity: 0.6; font-family: "Trebuchet MS", sans-serif; }
.tb-foot {
  display: flex; justify-content: flex-end; padding: 0 18px 14px;
}
.tb-clear {
  border: 0; border-radius: 14px; padding: 6px 14px;
  background: rgba(58, 44, 75, 0.75); color: #fff6e6; font: inherit; font-size: 13px;
  cursor: pointer;
}
.tb-clear:hover { background: #3a2c4b; }
.tb-clear[hidden] { display: none; }
`;

export default class TaskBoard {
  constructor({ onClose } = {}) {
    this.onClose = onClose;
    this.isOpen = false;

    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    this.el = document.createElement('div');
    this.el.className = 'tb-backdrop';
    this.el.hidden = true;
    this.el.innerHTML = `
      <div class="tb-board" role="dialog" aria-modal="true" aria-labelledby="tb-title">
        <div class="tb-head">
          <h2 class="tb-title" id="tb-title" data-t="tasks.title"></h2>
          <span class="tb-count"></span>
          <button class="tb-close" data-t-aria="tasks.close">×</button>
        </div>
        <div class="tb-grid"></div>
        <div class="tb-foot"><button class="tb-clear" data-t="tasks.clear"></button></div>
      </div>`;
    document.body.appendChild(this.el);

    this.grid = this.el.querySelector('.tb-grid');
    this.count = this.el.querySelector('.tb-count');
    this.clearBtn = this.el.querySelector('.tb-clear');

    this.el.querySelector('.tb-close').addEventListener('click', () => this.close());
    this.clearBtn.addEventListener('click', () => {
      sfx.crumple();
      clearDone();
    });
    this.el.addEventListener('pointerdown', (e) => {
      if (e.target === this.el) this.close(); // click outside the board
    });
    document.addEventListener('keydown', (e) => {
      if (this.isOpen && e.key === 'Escape') this.close();
    });

    // A blank sticky note at the end of the grid is where new tasks are written.
    this.newNote = document.createElement('label');
    this.newNote.className = 'tb-note tb-new';
    this.newNote.innerHTML = `
      <textarea maxlength="140" data-t-placeholder="tasks.placeholder"></textarea>
      <span class="tb-hint" data-t="tasks.hint"></span>`;
    this.input = this.newNote.querySelector('textarea');
    this.input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
      e.preventDefault();
      if (addTask(this.input.value)) {
        this.input.value = '';
        sfx.pin();
      }
    });

    onTasksChange(() => this.render());
    onLangChange(() => this.render());
    this.render();
  }

  render() {
    const tasks = getTasks();
    this.grid.replaceChildren(
      ...tasks.map((task) => {
        const note = document.createElement('div');
        note.className = `tb-note${task.done ? ' tb-done' : ''}`;
        note.style.background = hex(NOTE_COLORS[task.color]);
        note.style.setProperty('--tilt', `${task.tilt}deg`);
        note.title = t(task.done ? 'tasks.markUndone' : 'tasks.markDone');

        const text = document.createElement('span');
        text.className = 'tb-text';
        text.textContent = task.text;

        const del = document.createElement('button');
        del.className = 'tb-del';
        del.textContent = '×';
        del.setAttribute('aria-label', t('tasks.remove'));
        del.addEventListener('click', (e) => {
          e.stopPropagation();
          sfx.crumple();
          removeTask(task.id);
        });

        note.append(text, del);
        note.addEventListener('click', () => {
          sfx.check(!task.done);
          toggleTask(task.id);
        });
        return note;
      }),
      this.newNote,
    );
    // The blank note takes the colour the next task will get.
    this.newNote.style.background = hex(NOTE_COLORS[nextNoteColor()]);
    this.newNote.style.setProperty('--tilt', '1.5deg');

    const done = tasks.filter((task) => task.done).length;
    this.count.textContent = tasks.length ? t('tasks.count', { done, total: tasks.length }) : t('tasks.none');
    translateDom(this.el);
    this.clearBtn.hidden = done === 0;
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.el.hidden = false;
    requestAnimationFrame(() => this.el.classList.add('tb-open'));
    this.input.focus();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    sfx.paper();
    this.el.classList.remove('tb-open');
    setTimeout(() => {
      if (!this.isOpen) this.el.hidden = true;
    }, 200);
    this.onClose?.(getTasks());
  }
}
