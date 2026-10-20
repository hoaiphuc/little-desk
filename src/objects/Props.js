import Phaser from 'phaser';
import { makeHotspot } from '../utils/hotspot.js';
import { bubble, floatText, glow } from '../utils/fx.js';
import sfx from '../audio/sfx.js';
import { t, pick } from '../utils/i18n.js';
import { addCoins, onShopChange } from '../utils/shop.js';
import { equippedItem, showItemArt } from './items.js';
import { getPomodoro, onPomodoroChange, onPomodoroDone, formatTime, ROUNDS } from '../utils/pomodoro.js';

// Each prop is a small function: draw it, then make it interactive.
// To add your own object, copy one of these and call it from RoomScene.

const DESK_Y = 402; // where things sit on the desk
const SILL_Y = 332; // where things sit on the windowsill
const LAPTOP_REWARD = 5; // coins for every 8 lines typed

export function createProps(scene) {
  createLamp(scene, 165, DESK_Y);
  createPomodoro(scene, 255, DESK_Y);
  createLaptop(scene, 352, DESK_Y);
  createMug(scene, 612, DESK_Y);
  createBooks(scene, 712, DESK_Y);
  createRadio(scene, 815, DESK_Y);
  createPlant(scene, 292, SILL_Y);
  createCat(scene, 668, SILL_Y);
}

// Which lamp sits here depends on what you've bought (objects/items.js).
function createLamp(scene, x, y) {
  const art = scene.add.image(0, 0);
  const bulb = scene.add.circle(0, 0, 7, 0xfff2c4);
  const c = scene.add.container(x, y, [art, bulb]).setDepth(21);

  const halo = glow(scene, x, y - 80, 0xffc27a, 6, 0.5);
  const pool = glow(scene, x + 30, y - 4, 0xffb866, 1, 0.4).setScale(5, 1.3);

  let on = true;
  let item = null;
  const zone = makeHotspot(scene, {
    x,
    y,
    w: 1,
    h: 1,
    depth: 21.5,
    label: 'lamp.label',
    wobble: c,
    onClick: () => {
      on = !on;
      sfx.lamp(on);
      paintBulb();
      scene.tweens.add({ targets: halo, alpha: on ? 0.5 : 0, duration: 250 });
      scene.tweens.add({ targets: pool, alpha: on ? 0.4 : 0, duration: 250 });
      scene.tweens.add({ targets: scene.darkness, alpha: on ? 0.12 : 0.5, duration: 400 });
      floatText(scene, x, y + item.box[1] - 8, t('lamp.click'), '#fff4d6', 14);
      if (!on) scene.time.delayedCall(500, () => scene.student.say(t('lamp.off')));
    },
  });

  const paintBulb = () => bulb.setFillStyle(...(on ? item.bulb.on : item.bulb.off));
  const wear = (next) => {
    item = next;
    const [left, top, w, h] = item.box;
    showItemArt(scene, art, item);
    bulb.setPosition(item.bulb.x, item.bulb.y).setRadius(item.bulb.r);
    halo.setPosition(x + item.bulb.x, y + item.bulb.y + 6).setTint(item.glow);
    pool.setTint(item.glow);
    zone.setPosition(x + left + w / 2, y + top + h / 2).setSize(w, h);
    paintBulb();
  };
  wear(equippedItem('lamp'));

  const unsubscribe = onShopChange(() => {
    const next = equippedItem('lamp');
    if (next !== item) wear(next);
  });
  scene.events.once('shutdown', unsubscribe);
}

// A tomato-shaped pomodoro timer. Its little screen shows the countdown and
// takes the colour of the current mode; clicking it opens ui/Pomodoro.js.
const POMODORO_SCREENS = {
  focus: { bg: 0xfff6e6, ink: '#a8423d' },
  short: { bg: 0xd8f0e0, ink: '#3e6e48' },
  long: { bg: 0xdbe6f5, ink: '#40597a' },
};

function createPomodoro(scene, x, y) {
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(0, -1, 50, 8);
  g.fillStyle(0xd9534f, 1);
  g.fillEllipse(0, -20, 56, 42);
  g.fillStyle(0xe8746c, 1);
  g.fillEllipse(-15, -31, 13, 7); // shine
  g.fillStyle(0x5c9a68, 1);
  g.fillTriangle(0, -41, -14, -40, -4, -36);
  g.fillTriangle(0, -41, 14, -40, 4, -36);
  g.fillTriangle(0, -41, -7, -47, 6, -45);
  g.fillStyle(0x4f8a5b, 1);
  g.fillRoundedRect(-1.5, -48, 3, 8, 1.5); // stem

  const screen = scene.add.graphics();
  const bar = scene.add.graphics(); // how much of this session is left
  const digits = scene.add.text(0, -21, '', {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '13px',
    fontStyle: 'bold',
    resolution: 2,
  }).setOrigin(0.5);
  const c = scene.add.container(x, y, [g, screen, bar, digits]).setDepth(21);

  const render = ({ mode, running, paused, left, total }) => {
    const look = POMODORO_SCREENS[mode];
    screen.clear();
    screen.fillStyle(look.bg, 1);
    screen.fillRoundedRect(-19, -29, 38, 16, 4);
    digits.setText(formatTime(left)).setColor(look.ink);
    bar.clear();
    if (running || paused) {
      bar.fillStyle(0xa8423d, 1);
      bar.fillRoundedRect(-15, -9, 30, 3, 1.5);
      bar.fillStyle(look.bg, 1);
      bar.fillRoundedRect(-15, -9, Math.max(3, 30 * (left / total)), 3, 1.5);
    }
  };
  render(getPomodoro());

  // Paused: the digits blink, like a real kitchen timer.
  scene.time.addEvent({
    delay: 500,
    loop: true,
    callback: () => digits.setAlpha(getPomodoro().paused && digits.alpha === 1 ? 0.3 : 1),
  });

  const unsubscribe = onPomodoroChange(render);
  const unsubscribeDone = onPomodoroDone(({ finished, reward, next, round }) => {
    sfx.ring(finished === 'focus');
    scene.tweens.add({ targets: c, angle: { from: -8, to: 8 }, duration: 70, yoyo: true, repeat: 5, onComplete: () => c.setAngle(0) });
    if (reward) floatText(scene, x, y - 56, t('coins.plus', { n: reward }), '#ffd27a', 15);
    scene.student.lookAt(x);
    scene.student.say(t(
      finished !== 'focus' ? 'pomodoro.breakDone' :
      next === 'long' ? 'pomodoro.focusDoneLong' :
      'pomodoro.focusDone',
      { n: Math.min(round, ROUNDS) }
    ));
  });
  scene.events.once('shutdown', () => {
    unsubscribe();
    unsubscribeDone();
  });

  makeHotspot(scene, {
    x,
    y: y - 24,
    w: 60,
    h: 50,
    depth: 21.5,
    label: 'pomodoro.label',
    wobble: c,
    onClick: () => {
      scene.tooltip.hide();
      sfx.equip();
      scene.pomodoro.open();
    },
  });
}

function createLaptop(scene, x, y) {
  const g = scene.add.graphics();
  g.fillStyle(0x9aa0ae, 1);
  g.fillPoints([{ x: -48, y: 0 }, { x: 48, y: 0 }, { x: 42, y: -7 }, { x: -42, y: -7 }], true);
  g.fillStyle(0x2b2b38, 1);
  g.fillRoundedRect(-42, -66, 84, 60, 5);
  g.fillStyle(0xdde9ff, 1);
  g.fillRect(-36, -60, 72, 48);
  const text = scene.add.graphics();
  const c = scene.add.container(x, y, [g, text]).setDepth(21);
  glow(scene, x + 10, y - 40, 0x9ecbff, 2.4, 0.22);

  // The "document" on screen grows a line every time you type.
  const lines = [44, 60, 52, 30];
  let cursorOn = true;
  const draw = () => {
    text.clear();
    text.fillStyle(0x7a8aa8, 1);
    lines.slice(-6).forEach((w, i) => text.fillRect(-31, -55 + i * 7, w, 3));
    const last = lines.slice(-6);
    if (cursorOn) {
      text.fillStyle(0x3a2c4b, 1);
      text.fillRect(-31 + last[last.length - 1] + 2, -56 + (last.length - 1) * 7, 2, 5);
    }
  };
  draw();
  scene.time.addEvent({ delay: 530, loop: true, callback: () => { cursorOn = !cursorOn; draw(); } });

  let typed = 0;
  makeHotspot(scene, {
    x,
    y: y - 34,
    w: 96,
    h: 72,
    depth: 21.5,
    label: 'laptop.label',
    wobble: c,
    onClick: () => {
      lines.push(Phaser.Math.Between(20, 62));
      draw();
      sfx.typing();
      scene.student.type();
      floatText(scene, x, y - 76, pick('laptop.sounds'), '#dde9ff', 14);
      typed++;
      if (typed % 8 === 0) {
        // a little pay for a little work
        scene.student.say(t('laptop.progress', { n: typed }));
        addCoins(LAPTOP_REWARD);
        floatText(scene, x + 30, y - 96, t('coins.plus', { n: LAPTOP_REWARD }), '#ffd27a', 15);
      }
    },
  });
}

function createMug(scene, x, y) {
  const g = scene.add.graphics();
  g.lineStyle(4, 0xe58f7b, 1);
  g.strokeCircle(16, -15, 7);
  g.fillStyle(0xe58f7b, 1);
  g.fillRoundedRect(-14, -30, 28, 30, 5);
  g.fillStyle(0xf3d5b5, 1);
  g.fillRect(-14, -19, 28, 5);
  const cocoa = scene.add.ellipse(0, -29, 24, 6, 0x6b3f2a);
  const c = scene.add.container(x, y, [g, cocoa]).setDepth(21);

  let level = 4;
  scene.time.addEvent({
    delay: 650,
    loop: true,
    callback: () => {
      if (level <= 0) return;
      const puff = scene.add.circle(x + Phaser.Math.Between(-6, 6), y - 34, Phaser.Math.Between(3, 5), 0xffffff, 0.22).setDepth(22);
      scene.tweens.add({
        targets: puff,
        y: y - 80,
        x: puff.x + Phaser.Math.Between(-10, 10),
        alpha: 0,
        scale: 2.2,
        duration: 2200,
        onComplete: () => puff.destroy(),
      });
    },
  });

  makeHotspot(scene, {
    x,
    y: y - 18,
    w: 46,
    h: 44,
    depth: 21.5,
    label: 'mug.label',
    wobble: c,
    onClick: () => {
      if (level > 0) {
        level--;
        scene.student.sip();
        sfx.sip();
        floatText(scene, x, y - 46, t('mug.sip'), '#f3d5b5');
        if (level === 0) {
          cocoa.setVisible(false);
          scene.student.say(t('mug.empty'));
        } else {
          scene.student.say(pick('mug.lines'));
        }
      } else {
        level = 4;
        cocoa.setVisible(true);
        sfx.pour();
        floatText(scene, x, y - 46, t('mug.refill'), '#f3d5b5');
      }
    },
  });
}

function createBooks(scene, x, y) {
  const g = scene.add.graphics();
  const stack = [
    [-36, -10, 72, 0x6c8fb3],
    [-31, -20, 64, 0xd6a35c],
  ];
  stack.forEach(([bx, by, bw, color]) => {
    g.fillStyle(color, 1);
    g.fillRoundedRect(bx, by, bw, 10, 2);
    g.fillStyle(0xf3e6cf, 1);
    g.fillRect(bx + bw - 6, by + 2, 4, 6);
  });
  const top = scene.add.graphics();
  top.fillStyle(0x8a5f8f, 1);
  top.fillRoundedRect(-33, -5, 66, 10, 2);
  top.fillStyle(0xf3e6cf, 1);
  top.fillRect(27, -3, 4, 6);
  top.setPosition(1, -25);
  const c = scene.add.container(x, y, [g, top]).setDepth(21);

  makeHotspot(scene, {
    x,
    y: y - 16,
    w: 80,
    h: 40,
    depth: 21.5,
    label: 'books.label',
    wobble: c,
    onClick: () => {
      scene.tweens.add({ targets: top, y: -38, angle: -8, duration: 160, yoyo: true, ease: 'Sine.easeOut' });
      sfx.book();
      bubble(scene, x, y - 40, t('books.reading', { title: pick('books.titles') }), { key: 'books' });
    },
  });
}

function createRadio(scene, x, y) {
  const g = scene.add.graphics();
  g.lineStyle(2, 0x3e3a4a, 1);
  g.lineBetween(18, -34, 32, -72);
  g.fillStyle(0x3e3a4a, 1);
  g.fillCircle(32, -72, 3);
  g.fillStyle(0xc96f5a, 1);
  g.fillRoundedRect(-30, -36, 60, 36, 8);
  g.fillStyle(0x8d4a3c, 1);
  g.fillCircle(-12, -18, 11);
  g.fillStyle(0xc96f5a, 1);
  for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) if (i * i + j * j <= 5) g.fillCircle(-12 + i * 4, -18 + j * 4, 1);
  g.fillStyle(0xf3e6cf, 1);
  g.fillRoundedRect(4, -28, 20, 9, 2);
  g.fillStyle(0xd9534f, 1);
  g.fillRect(12, -27, 2, 7);
  g.fillStyle(0x3e3a4a, 1);
  g.fillCircle(14, -10, 4);
  const inner = scene.add.container(0, 0, [g]);
  const c = scene.add.container(x, y, [inner]).setDepth(21);

  scene.lofi.onBeat = (beat) => {
    scene.tweens.add({ targets: inner, scaleY: 1.06, scaleX: 0.97, duration: 90, yoyo: true });
    if (beat === 0) floatText(scene, x + Phaser.Math.Between(-20, 20), y - 44, Phaser.Utils.Array.GetRandom(['♪', '♫']), '#ffd9c9', 18);
  };

  makeHotspot(scene, {
    x,
    y: y - 22,
    w: 70,
    h: 50,
    depth: 21.5,
    label: 'radio.label',
    wobble: c,
    onClick: () => {
      const playing = scene.lofi.toggle();
      sfx.radio(playing);
      floatText(scene, x, y - 50, t(playing ? 'radio.on' : 'radio.off'), '#ffd9c9', 14);
    },
  });
}

function createPlant(scene, x, y) {
  const pot = scene.add.graphics();
  pot.fillStyle(0xc77b58, 1);
  pot.fillPoints([{ x: -14, y: -24 }, { x: 14, y: -24 }, { x: 10, y: 0 }, { x: -10, y: 0 }], true);
  pot.fillStyle(0xd98d68, 1);
  pot.fillRoundedRect(-16, -28, 32, 6, 2);

  const leafData = [
    [-16, -4, 7, 18, -1.1, 0x5c9a68],
    [16, -4, 7, 18, 1.1, 0x5c9a68],
    [-9, -11, 8, 22, -0.55, 0x6fae7a],
    [9, -11, 8, 22, 0.55, 0x6fae7a],
    [0, -16, 8, 26, 0, 0x7cbf86],
  ];
  const leaves = scene.add.container(0, -26);
  leafData.forEach(([lx, ly, w, h, r, color]) => leaves.add(scene.add.ellipse(lx, ly, w, h, color).setRotation(r)));
  const flower = scene.add.circle(0, -34, 5, 0xffb8c8).setVisible(false);
  leaves.add(flower);

  const c = scene.add.container(x, y, [leaves, pot]).setDepth(12);
  scene.tweens.add({ targets: leaves, angle: { from: -3, to: 3 }, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

  let growth = 1;
  makeHotspot(scene, {
    x,
    y: y - 30,
    w: 50,
    h: 62,
    depth: 12.5,
    label: 'plant.label',
    wobble: c,
    onClick: () => {
      sfx.water(5);
      for (let i = 0; i < 5; i++) {
        const drop = scene.add.circle(x + Phaser.Math.Between(-10, 10), y - 80, 2.5, 0x8fd0ff).setDepth(13);
        scene.tweens.add({
          targets: drop,
          y: y - 30,
          alpha: 0.3,
          delay: i * 70,
          duration: 380,
          ease: 'Quad.easeIn',
          onComplete: () => drop.destroy(),
        });
      }
      scene.time.delayedCall(450, () => {
        if (growth < 1.45) {
          growth += 0.09;
          scene.tweens.add({ targets: leaves, scale: growth, duration: 400, ease: 'Back.easeOut' });
          sfx.grow();
          floatText(scene, x, y - 70, t('plant.happy'), '#a8e0b8', 14);
        } else {
          if (!flower.visible) sfx.bloom();
          flower.setVisible(true);
          floatText(scene, x, y - 80, t('plant.bloom'), '#ffb8c8', 14);
        }
      });
    },
  });
}

function createCat(scene, x, y) {
  const tail = scene.add.graphics();
  tail.lineStyle(6, 0xe39a55, 1);
  tail.beginPath();
  tail.moveTo(0, 0);
  tail.lineTo(10, -4);
  tail.lineTo(17, -12);
  tail.lineTo(18, -22);
  tail.lineTo(14, -30);
  tail.strokePath();
  const tailC = scene.add.container(14, -6, [tail]);

  const g = scene.add.graphics();
  g.fillStyle(0xe39a55, 1);
  g.fillEllipse(0, -17, 40, 36);
  g.fillCircle(0, -40, 14);
  g.fillTriangle(-13, -44, -4, -52, -12, -62);
  g.fillTriangle(13, -44, 4, -52, 12, -62);
  g.fillStyle(0xf3b6a0, 1);
  g.fillTriangle(-11, -47, -6, -51, -11, -57);
  g.fillTriangle(11, -47, 6, -51, 11, -57);
  g.lineStyle(3, 0xc77d3e, 1);
  g.lineBetween(-8, -30, -6, -22);
  g.lineBetween(0, -32, 0, -22);
  g.lineBetween(8, -30, 6, -22);

  const c = scene.add.container(x, y, [tailC, g]).setDepth(12);
  const swish = scene.tweens.add({ targets: tailC, angle: { from: -12, to: 14 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

  let lastPet = 0;
  scene.time.addEvent({
    delay: 5000,
    loop: true,
    callback: () => {
      if (scene.time.now - lastPet > 8000) floatText(scene, x + 14, y - 62, 'z', '#cfe0ff', 13);
    },
  });

  makeHotspot(scene, {
    x,
    y: y - 30,
    w: 50,
    h: 66,
    depth: 12.5,
    label: 'cat.label',
    wobble: c,
    onClick: () => {
      lastPet = scene.time.now;
      for (let i = 0; i < 3; i++) {
        scene.time.delayedCall(i * 150, () => floatText(scene, x + Phaser.Math.Between(-14, 14), y - 60, '♥', '#ff9fb4', 16));
      }
      swish.timeScale = 3;
      scene.time.delayedCall(1500, () => (swish.timeScale = 1));
      const mew = Math.random() < 0.5;
      if (mew) sfx.mew();
      else sfx.purr();
      bubble(scene, x, y - 66, pick(mew ? 'cat.mew' : 'cat.purr'), { key: 'cat', duration: 1600 });
      scene.student.lookAt(x);
    },
  });
}
