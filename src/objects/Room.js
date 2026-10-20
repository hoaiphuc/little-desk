import Phaser from 'phaser';
import { makeHotspot } from '../utils/hotspot.js';
import { FONT, bubble, floatText, glow } from '../utils/fx.js';
import { NOTE_COLORS, getTasks, onTasksChange } from '../utils/tasks.js';
import sfx from '../audio/sfx.js';
import { t, getLang } from '../utils/i18n.js';
import { onShopChange } from '../utils/shop.js';
import { equippedItem, showItemArt, drawClockHands } from './items.js';

const WOOD = 0x7a5541;
const WOOD_LIGHT = 0x9a6e55;

// Wall, window frame, curtains, fairy lights, notes board and clock.
export function createRoom(scene, W) {
  const { width, height } = scene.scale;

  // --- wall with a dotted wallpaper, leaving a hole for the window ---
  const wall = scene.add.graphics().setDepth(10);
  wall.fillStyle(0x43345a, 1);
  wall.fillRect(0, 0, width, W.y);
  wall.fillRect(0, W.y + W.h, width, height - W.y - W.h);
  wall.fillRect(0, W.y, W.x, W.h);
  wall.fillRect(W.x + W.w, W.y, width - W.x - W.w, W.h);
  wall.fillStyle(0x4d3d66, 1);
  for (let y = 12; y < height; y += 26) {
    for (let x = (y / 26) % 2 ? 13 : 0; x < width; x += 26) {
      const inWindow = x > W.x - 16 && x < W.x + W.w + 16 && y > W.y - 16 && y < W.y + W.h + 20;
      if (!inWindow) wall.fillCircle(x, y, 2);
    }
  }

  // --- window frame and sill ---
  const frame = scene.add.graphics().setDepth(11);
  frame.fillStyle(0xffffff, 0.035); // faint glass reflection
  frame.fillPoints([
    { x: W.x + 40, y: W.y }, { x: W.x + 120, y: W.y },
    { x: W.x + 30, y: W.y + W.h }, { x: W.x - 50 + 40, y: W.y + W.h },
  ], true);
  frame.fillStyle(WOOD, 1);
  frame.fillRect(W.x - 14, W.y - 14, W.w + 28, 14);
  frame.fillRect(W.x - 14, W.y, 14, W.h);
  frame.fillRect(W.x + W.w, W.y, 14, W.h);
  frame.fillRect(W.x + W.w / 2 - 4, W.y, 8, W.h - 26);
  frame.fillRect(W.x, W.y + 110 - 4, W.w, 8);
  frame.fillStyle(WOOD_LIGHT, 1);
  frame.fillRect(W.x - 34, W.y + W.h, W.w + 68, 10);
  frame.fillStyle(WOOD, 1);
  frame.fillRect(W.x - 28, W.y + W.h + 10, W.w + 56, 8);

  createCurtains(scene, W);
  createFairyLights(scene, W);
  createNotesBoard(scene, 100, 175);
  createClock(scene, 862, 150);
}

function createCurtains(scene, W) {
  const rod = scene.add.graphics().setDepth(12);
  rod.lineStyle(5, 0x5a3d2e, 1);
  rod.lineBetween(W.x - 70, 20, W.x + W.w + 70, 20);
  rod.fillStyle(0x5a3d2e, 1);
  rod.fillCircle(W.x - 72, 20, 6);
  rod.fillCircle(W.x + W.w + 72, 20, 6);

  [-1, 1].forEach((side) => {
    const x = side < 0 ? W.x - 24 : W.x + W.w + 24;
    const g = scene.add.graphics();
    const s = -side; // mirror the shape for the right curtain
    const pts = [
      { x: -32 * s, y: 0 }, { x: 30 * s, y: 0 },
      { x: 6 * s, y: 190 }, { x: 28 * s, y: 330 }, { x: -32 * s, y: 330 },
    ];
    g.fillStyle(0xc9787a, 1);
    g.fillPoints(pts, true);
    g.lineStyle(2, 0xab5f66, 0.8);
    [-20, -6, 8].forEach((fx) => g.lineBetween(fx * s, 6, fx * s * 0.7, 325));
    g.fillStyle(0xe8c07a, 1);
    g.fillRoundedRect(Math.min(-32 * s, 8 * s), 186, 40, 8, 4);

    const curtain = scene.add.container(x, 18, [g]).setDepth(12);
    makeHotspot(scene, {
      x,
      y: 180,
      w: 50,
      h: 300,
      depth: 12.5,
      label: 'curtain.label',
      onClick: () => {
        sfx.curtain();
        scene.tweens.add({ targets: curtain, angle: side * 2.5, duration: 260, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
      },
    });
  });
}

export function createFairyLights(scene, W) {
  const COLORS = {
    warm: [0xffd27a, 0xffb36b, 0xffe6a8],
    rainbow: [0xff8a8a, 0xffd27a, 0x9be08f, 0x8fc8ff, 0xd29bff],
  };
  const modes = ['warm', 'rainbow', 'off'];
  let mode = 0;

  const x0 = W.x + 8;
  const x1 = W.x + W.w - 8;
  const y0 = W.y + 6;
  const sag = 26;
  const yAt = (t) => y0 + Math.sin(Math.PI * t) * sag;

  const wire = scene.add.graphics().setDepth(11.4);
  wire.lineStyle(1.5, 0x2b2238, 1);
  wire.beginPath();
  wire.moveTo(x0, y0);
  for (let i = 1; i <= 40; i++) wire.lineTo(x0 + (x1 - x0) * (i / 40), yAt(i / 40));
  wire.strokePath();

  const bulbs = [];
  const n = 16;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const x = x0 + (x1 - x0) * t;
    const y = yAt(t) + 5;
    const c = COLORS.warm[i % COLORS.warm.length];
    const bulb = scene.add.circle(x, y, 4, c).setDepth(11.5);
    const halo = glow(scene, x, y, c, 0.35, 0.7, 11.6);
    const tw = scene.tweens.add({
      targets: [bulb, halo],
      alpha: 0.45,
      duration: Phaser.Math.Between(700, 1600),
      yoyo: true,
      repeat: -1,
      delay: i * 120,
    });
    bulbs.push({ bulb, halo, tw, i });
  }

  makeHotspot(scene, {
    x: W.x + W.w / 2,
    y: y0 + 18,
    w: W.w - 20,
    h: 40,
    depth: 11.8,
    label: 'lights.label',
    onClick: (p) => {
      mode = (mode + 1) % modes.length;
      const m = modes[mode];
      sfx.lights(m);
      bulbs.forEach(({ bulb, halo, tw, i }) => {
        if (m === 'off') {
          tw.pause();
          bulb.setAlpha(1).setFillStyle(0x5a4f63);
          halo.setVisible(false);
        } else {
          const palette = COLORS[m];
          const c = palette[i % palette.length];
          bulb.setFillStyle(c);
          halo.setTint(c).setVisible(true);
          tw.resume();
        }
      });
      floatText(scene, p.x, p.y + 10, t(`lights.${m}`), '#ffe9a8', 14);
    },
  });
}

// The cork board shows one tiny sticky note per task (see utils/tasks.js).
// Clicking it opens the full task board (ui/TaskBoard.js).
const NOTE_SLOTS = [
  [-18, -36], [18, -36],
  [-18, 0], [18, 0],
  [-18, 36], [18, 36],
];

export function createNotesBoard(scene, x, y) {
  const g = scene.add.graphics();
  g.fillStyle(WOOD, 1);
  g.fillRoundedRect(-56, -64, 112, 128, 6);
  g.fillStyle(0xb98a5a, 1);
  g.fillRoundedRect(-48, -56, 96, 112, 4);
  const notes = scene.add.container(0, 0);
  const container = scene.add.container(x, y, [g, notes]).setDepth(11);

  const drawNote = ([nx, ny], color, tilt, draw) => {
    const note = scene.add.container(nx, ny).setAngle(tilt * 1.5);
    const paper = scene.add.rectangle(0, 0, 28, 28, color);
    const ink = scene.add.graphics();
    draw(ink);
    const pin = scene.add.circle(0, -11, 2.5, 0xd9534f);
    note.add([paper, ink, pin]);
    notes.add(note);
  };

  const render = (tasks) => {
    notes.removeAll(true);
    const extra = tasks.length > NOTE_SLOTS.length ? tasks.length - NOTE_SLOTS.length + 1 : 0;
    const shown = extra ? tasks.slice(0, NOTE_SLOTS.length - 1) : tasks;

    shown.forEach((task, i) => {
      drawNote(NOTE_SLOTS[i], NOTE_COLORS[task.color], task.tilt, (ink) => {
        if (task.done) {
          ink.lineStyle(2.5, 0x4f8a5b, 1);
          ink.lineBetween(-7, 1, -2, 6);
          ink.lineBetween(-2, 6, 8, -5);
        } else {
          // Scribbles stand in for the writing: longer tasks, more lines.
          const rows = Phaser.Math.Clamp(Math.ceil(task.text.length / 12), 1, 3);
          ink.lineStyle(1, 0x6b5a70, 0.6);
          for (let r = 0; r < rows; r++) {
            const w = r === rows - 1 && rows > 1 ? 9 : 16;
            ink.lineBetween(-8, -5 + r * 6, -8 + w, -5 + r * 6);
          }
        }
      });
    });

    if (extra) {
      drawNote(NOTE_SLOTS[NOTE_SLOTS.length - 1], 0xf3e6cf, 2, () => {});
      const more = scene.add.text(...NOTE_SLOTS[NOTE_SLOTS.length - 1], `+${extra}`, {
        fontFamily: FONT,
        fontSize: '11px',
        color: '#6b5a70',
      }).setOrigin(0.5, 0.35);
      notes.add(more);
    }
  };
  render(getTasks());
  const unsubscribe = onTasksChange(render);
  scene.events.once('shutdown', unsubscribe);

  makeHotspot(scene, {
    x,
    y,
    w: 112,
    h: 128,
    depth: 11.5,
    label: 'board.label',
    wobble: container,
    onClick: () => {
      scene.tooltip.hide();
      sfx.paper();
      scene.taskBoard.open();
    },
  });
}

// Which clock hangs here depends on what you've bought (objects/items.js).
export function createClock(scene, x, y) {
  const art = scene.add.image(0, 0);
  const hands = scene.add.graphics();
  const container = scene.add.container(x, y, [art, hands]).setDepth(11);

  let item = null;
  const draw = () => drawClockHands(hands, item.hands);
  scene.time.addEvent({ delay: 1000, loop: true, callback: draw });

  const zone = makeHotspot(scene, {
    x,
    y,
    w: 1,
    h: 1,
    depth: 11.5,
    label: 'clock.label',
    wobble: container,
    onClick: () => {
      sfx.clock();
      const now = new Date();
      const time = now.toLocaleTimeString(getLang() === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' });
      const hr = now.getHours();
      const msg = t(
        hr < 5 ? 'clock.night' :
        hr < 12 ? 'clock.morning' :
        hr < 18 ? 'clock.afternoon' :
        'clock.evening'
      );
      bubble(scene, x, y + item.box[1] - 4, `${time}\n${msg}`, { key: 'clock' });
    },
  });

  const wear = (next) => {
    item = next;
    const [left, top, w, h] = item.box;
    showItemArt(scene, art, item);
    zone.setPosition(x + left + w / 2, y + top + h / 2).setSize(w, h);
    draw();
  };
  wear(equippedItem('clock'));

  const unsubscribe = onShopChange(() => {
    const next = equippedItem('clock');
    if (next !== item) wear(next);
  });
  scene.events.once('shutdown', unsubscribe);
}

// Desk surface + front panel, and the chair the student sits on.
export function createDesk(scene) {
  const g = scene.add.graphics().setDepth(20);
  g.fillStyle(0x9a6a45, 1);
  g.fillPoints([{ x: 90, y: 382 }, { x: 870, y: 382 }, { x: 905, y: 425 }, { x: 55, y: 425 }], true);
  g.lineStyle(2, 0xb58058, 1);
  g.lineBetween(90, 383, 870, 383);
  g.fillStyle(0x7a5236, 1);
  g.fillRect(55, 425, 850, 11);
  g.fillStyle(0x65432c, 1);
  g.fillRect(55, 436, 850, 104);
  g.lineStyle(2, 0x553823, 1);
  g.strokeRoundedRect(100, 452, 180, 62, 6);
  g.strokeRoundedRect(680, 452, 180, 62, 6);
  g.fillStyle(0xc9a27a, 1);
  g.fillRoundedRect(175, 480, 30, 7, 3);
  g.fillRoundedRect(755, 480, 30, 7, 3);

  const chair = scene.add.graphics();
  chair.fillStyle(0x5a3d2e, 1);
  chair.fillRoundedRect(-50, 0, 100, 130, 18);
  chair.fillStyle(0x9a5f4c, 1);
  chair.fillRoundedRect(-38, 12, 76, 100, 12);
  chair.lineStyle(1.5, 0x7f4c3d, 1);
  chair.lineBetween(0, 18, 0, 106);
  const c = scene.add.container(480, 424, [chair]).setDepth(26);

  makeHotspot(scene, {
    x: 480,
    y: 482,
    w: 100,
    h: 116,
    depth: 26.5,
    label: 'chair.label',
    onClick: () => {
      sfx.chair();
      scene.tweens.add({ targets: [c, scene.student.container], angle: 3, duration: 120, yoyo: true, repeat: 1 });
      floatText(scene, 480, 440, t('chair.creak'), '#f3d5b5', 14);
    },
  });
}
