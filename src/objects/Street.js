import Phaser from 'phaser';
import { bindHover, makeHotspot } from '../utils/hotspot.js';
import { FONT, TEST_STRING, bubble, floatText, glow } from '../utils/fx.js';
import sfx from '../audio/sfx.js';
import { t, pick, onLangChange } from '../utils/i18n.js';

const COATS = [0xd9795f, 0x6aa0c8, 0xe3c16f, 0x8fbf8f, 0xb98bd0, 0xe89aae, 0x5f7fa8];
const SKIN = [0xf1c7a5, 0xd9a27e, 0xa86f4c, 0x7a4b32];

// The view down to the street: buildings with lit windows, street lamps,
// and people who walk by and wave when you click them.
export default class Street {
  constructor(scene, W) {
    this.scene = scene;
    this.W = W;
    this.ground = W.y + W.h - 8; // where pedestrians' feet touch

    this.createBuildings();
    this.createShop(W.x + 126, W.y + W.h - 26); // left of the student's head, beside a street lamp
    this.createStreet();

    this.spawnPerson();
    scene.time.addEvent({
      delay: 3200,
      loop: true,
      callback: () => Math.random() < 0.75 && this.spawnPerson(),
    });
  }

  createBuildings() {
    const { scene, W } = this;
    let x = W.x - 10;
    while (x < W.x + W.w) {
      const bw = Phaser.Math.Between(48, 96);
      const bh = Phaser.Math.Between(60, 135);
      const top = W.y + W.h - 26 - bh;
      const g = scene.add.graphics().setDepth(4);
      g.fillStyle(Phaser.Utils.Array.GetRandom([0x1d1838, 0x231d42, 0x191533]), 1);
      g.fillRect(x, top, bw, bh + 26);

      const windows = [];
      for (let wy = top + 10; wy < W.y + W.h - 40; wy += 18) {
        for (let wx = x + 8; wx < x + bw - 12; wx += 16) {
          const lit = Math.random() < 0.35;
          const win = scene.add.rectangle(wx + 4, wy + 5, 8, 10, 0xffd27a).setDepth(4).setAlpha(lit ? 0.9 : 0.08);
          windows.push(win);
        }
      }

      makeHotspot(scene, {
        x: x + bw / 2,
        y: top + bh / 2,
        w: bw,
        h: bh,
        depth: 4.5,
        label: 'street.apartments',
        onClick: () => {
          const win = Phaser.Utils.Array.GetRandom(windows);
          if (!win) return;
          const on = win.alpha < 0.5;
          sfx.windowLight();
          scene.tweens.add({ targets: win, alpha: on ? 0.9 : 0.08, duration: 200 });
          floatText(scene, win.x, win.y, t(on ? 'street.lightOn' : 'street.lightOff'), '#ffe3a3', 13);
        },
      });

      // Every so often a neighbour flips a light.
      scene.time.addEvent({
        delay: Phaser.Math.Between(4000, 9000),
        loop: true,
        callback: () => {
          const win = Phaser.Utils.Array.GetRandom(windows);
          if (win) scene.tweens.add({ targets: win, alpha: win.alpha < 0.5 ? 0.9 : 0.08, duration: 300 });
        },
      });
      x += bw + Phaser.Math.Between(0, 6);
    }
  }

  // A little corner shop at street level, still open this late.
  // (x, y) is its bottom-left corner on the pavement. Clicking it opens ui/Shop.js.
  createShop(x, y) {
    const { scene } = this;
    const W = 84;
    const H = 64;
    const top = y - H;
    const g = scene.add.graphics().setDepth(4.6);

    g.fillStyle(0x3b2f55, 1);
    g.fillRect(x, top, W, H);
    g.fillStyle(0x2a2140, 1);
    g.fillRect(x - 2, top - 3, W + 4, 4); // roof trim

    // striped awning with a scalloped edge
    const awningY = top + 18;
    for (let i = 0; i < 7; i++) {
      g.fillStyle(i % 2 ? 0xf3e6cf : 0xd9795f, 1);
      g.fillRect(x + i * 12, awningY, 12, 9);
      g.fillCircle(x + i * 12 + 6, awningY + 9, 6);
    }

    // warm display window with a tiny lamp and clock in it
    const winX = x + 6;
    const winY = top + 34;
    g.fillStyle(0xffd27a, 0.9);
    g.fillRect(winX, winY, 44, 26);
    g.fillStyle(0xc98a3a, 1);
    g.fillTriangle(winX + 8, winY + 10, winX + 18, winY + 10, winX + 13, winY + 4);
    g.fillRect(winX + 12, winY + 10, 2, 12);
    g.fillRect(winX + 8, winY + 21, 10, 2);
    g.fillCircle(winX + 32, winY + 13, 7);
    g.fillStyle(0xffe9b8, 1);
    g.fillCircle(winX + 32, winY + 13, 5);
    g.lineStyle(2, 0x2a2140, 1);
    g.strokeRect(winX, winY, 44, 26);

    // door with a lit glass pane
    g.fillStyle(0x6b4a3a, 1);
    g.fillRect(x + 56, top + 32, 22, H - 32);
    g.fillStyle(0xffe3a3, 0.85);
    g.fillRect(x + 60, top + 36, 14, 12);
    g.fillStyle(0xe8c07a, 1);
    g.fillCircle(x + 74, top + 50, 1.5);

    // sign above the awning, in the current language
    g.fillStyle(0x2a2140, 1);
    g.fillRoundedRect(x + 10, top + 2, W - 20, 13, 3);
    const sign = scene.add
      .text(x + W / 2, top + 8.5, t('shop.sign'), {
        fontFamily: FONT,
        testString: TEST_STRING,
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#ffd27a',
      })
      .setOrigin(0.5)
      .setDepth(4.6);
    const unsubscribe = onLangChange(() => sign.setText(t('shop.sign')));
    scene.events.once('shutdown', unsubscribe);

    // light spilling out onto the pavement, gently flickering like a neon sign
    const spill = glow(scene, x + W / 2, y - 4, 0xffc77a, 1, 0.45, 4.7).setScale(1.3, 0.6);
    scene.tweens.add({ targets: sign, alpha: 0.75, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    scene.spots.shop = makeHotspot(scene, {
      x: x + W / 2,
      y: top + H / 2,
      w: W,
      h: H,
      depth: 4.8,
      label: 'shop.label',
      onClick: () => {
        sfx.shopBell();
        scene.tweens.add({ targets: spill, alpha: 0.8, duration: 120, yoyo: true });
        scene.tooltip.hide();
        scene.openShop();
      },
    });
  }

  createStreet() {
    const { scene, W } = this;
    const g = scene.add.graphics().setDepth(5);
    g.fillStyle(0x2a2440, 1);
    g.fillRect(W.x, W.y + W.h - 26, W.w, 26);
    g.fillStyle(0x3a3256, 1);
    g.fillRect(W.x, W.y + W.h - 26, W.w, 3);

    [W.x + 110, W.x + W.w - 130].forEach((lx) => {
      const top = W.y + W.h - 95;
      g.fillStyle(0x15112a, 1);
      g.fillRect(lx - 2, top, 4, 72);
      g.fillRoundedRect(lx - 8, top - 6, 16, 8, 3);
      const bulb = scene.add.circle(lx, top + 3, 3, 0xffe2a8).setDepth(5);
      const halo = glow(scene, lx, top + 10, 0xffc77a, 1.3, 0.55, 5);
      makeHotspot(scene, {
        x: lx,
        y: top + 30,
        w: 24,
        h: 80,
        depth: 5.5,
        label: 'street.lamp',
        onClick: () => {
          // it flickers, as old street lamps do
          sfx.streetLamp();
          scene.tweens.add({ targets: [halo, bulb], alpha: 0.1, duration: 60, yoyo: true, repeat: 3 });
        },
      });
    });
  }

  spawnPerson() {
    const { scene, W } = this;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const startX = dir > 0 ? W.x - 20 : W.x + W.w + 20;
    const endX = dir > 0 ? W.x + W.w + 20 : W.x - 20;
    const y = this.ground - 16;

    const coat = Phaser.Utils.Array.GetRandom(COATS);
    const skin = Phaser.Utils.Array.GetRandom(SKIN);
    const g = scene.add.graphics();
    g.fillStyle(0x15112a, 1);
    g.fillRect(-5, 6, 4, 10);
    g.fillRect(1, 6, 4, 10);
    g.fillStyle(coat, 1);
    g.fillRoundedRect(-7, -9, 14, 17, 5);
    g.fillStyle(skin, 1);
    g.fillCircle(0, -14, 6);
    const hat = Math.random();
    if (hat < 0.3) {
      g.fillStyle(Phaser.Utils.Array.GetRandom(COATS), 1);
      g.fillRoundedRect(-6, -22, 12, 6, 3); // beanie
    } else if (hat < 0.55) {
      g.fillStyle(0x2b1d1a, 1);
      g.fillRect(-6, -21, 12, 4); // hair
    }

    const parts = [g];
    if (Math.random() < 0.2) {
      // umbrella
      const u = scene.add.graphics();
      u.lineStyle(1.5, 0x15112a, 1);
      u.lineBetween(4, -4, 4, -30);
      u.fillStyle(Phaser.Utils.Array.GetRandom(COATS), 1);
      u.slice(4, -28, 14, Math.PI, 0, false);
      u.fillPath();
      parts.push(u);
    }
    if (Math.random() < 0.2) {
      // a little dog on a walk
      const d = scene.add.graphics();
      d.fillStyle(0xc9a27a, 1);
      d.fillEllipse(18 * dir, 12, 14, 8);
      d.fillCircle(25 * dir, 8, 4);
      d.lineStyle(1, 0x15112a, 0.8);
      d.lineBetween(6 * dir, 0, 16 * dir, 9);
      parts.push(d);
    }

    const arm = scene.add.graphics();
    arm.lineStyle(3, coat, 1);
    arm.lineBetween(5, -6, 11, -20);
    arm.fillStyle(skin, 1);
    arm.fillCircle(11, -21, 2.5);
    arm.setVisible(false);
    parts.push(arm);

    const person = scene.add.container(startX, y, parts).setDepth(6);
    person.setSize(22, 40).setInteractive({ useHandCursor: true });

    const speed = Phaser.Math.Between(22, 40);
    const walk = scene.tweens.add({
      targets: person,
      x: endX,
      duration: (Math.abs(endX - startX) / speed) * 1000,
      onComplete: () => person.destroy(),
    });
    const bob = scene.tweens.add({ targets: g, y: -1.5, duration: 230, yoyo: true, repeat: -1 });

    let waving = false;
    bindHover(scene, person, {
      label: 'person.label',
      onClick: () => {
        if (waving) return;
        waving = true;
        sfx.wave();
        walk.pause();
        bob.pause();
        arm.setVisible(true);
        scene.tweens.add({ targets: arm, angle: 18, duration: 160, yoyo: true, repeat: 3 });
        scene.student?.lookAt(person.x);
        scene.student?.wave();
        bubble(scene, person.x, person.y - 26, pick('person.greetings'), { key: 'person', duration: 1600 });
        scene.time.delayedCall(1500, () => {
          if (!person.active) return;
          arm.setVisible(false);
          walk.resume();
          bob.resume();
          waving = false;
        });
      },
    });
  }
}
