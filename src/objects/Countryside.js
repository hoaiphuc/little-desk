import Phaser from 'phaser';
import { bindHover, makeHotspot } from '../utils/hotspot.js';
import { FONT, TEST_STRING, bubble, floatText, glow } from '../utils/fx.js';
import sfx from '../audio/sfx.js';
import { t, pick } from '../utils/i18n.js';
import { createFairyLights, createNotesBoard, createClock } from './Room.js';

// The countryside place from the shop: studying out on the porch of a
// village house at night, looking over the rice paddies. Frog hunters with
// headlamps walk the paddy dikes, and neighbours, bicycles and motorbikes
// pass on the village road.
//
// `W` is the open view between the two porch walls. Depths follow the guide
// in RoomScene: 0-6 outside, 10-12 the porch itself.

const { Between, FloatBetween, Clamp } = Phaser.Math;
const HORIZON = 232; // bottom of the tree line
const ROAD_Y = 257; // where feet and wheels touch the village road
const FIELD_TOP = 260;
const SILL_Y = 332; // top of the low porch wall (the plant and cat sit here)
const DIKES = [279, 305]; // paddy dikes the frog hunters walk along

const SHIRTS = [0x6b7f9a, 0x8a6d8f, 0x5f7a5a, 0x9a6a5a, 0x7a8a9a];
const SKIN = [0xe0b48e, 0xc99a74, 0xa87a58];
const HAT = 0xd9c08a; // nón lá

export default class Countryside {
  constructor(scene, W) {
    this.scene = scene;
    this.W = W;

    this.createHorizon();
    this.createRoad();
    this.createGroceryShop(W.x + 155, ROAD_Y - 9);
    this.createFields();
    this.createFireflies();
    this.createPorch();
    DIKES.forEach((y, i) => this.createFrogHunter(y, i));

    this.spawnTraveller();
    scene.time.addEvent({
      delay: 4200,
      loop: true,
      callback: () => Math.random() < 0.7 && this.spawnTraveller(),
    });
    // frogs croaking somewhere out in the dark
    scene.time.addEvent({
      delay: 3500,
      loop: true,
      callback: () => sfx.ready && Math.random() < 0.55 && sfx.croak(FloatBetween(0.25, 0.5)),
    });
  }

  // Bamboo, coconut palms and a few village houses against the sky.
  createHorizon() {
    const { scene, W } = this;
    const g = scene.add.graphics().setDepth(3);

    // far paddies, catching a little sky light
    g.fillStyle(0x1b2638, 1);
    g.fillRect(W.x, HORIZON, W.w, ROAD_Y - 9 - HORIZON);

    // bamboo groves: one long bumpy silhouette
    const pts = [{ x: W.x, y: HORIZON }];
    for (let x = W.x; x <= W.x + W.w; x += Between(6, 11)) {
      const h = 16 + Math.sin(x / 37) * 7 + Math.sin(x / 13) * 3 + Between(0, 5);
      pts.push({ x, y: HORIZON - h });
    }
    pts.push({ x: W.x + W.w, y: HORIZON });
    g.fillStyle(0x16122b, 1);
    g.fillPoints(pts, true);

    // coconut palms poking above the bamboo
    [W.x + 46, W.x + 330, W.x + 596].forEach((px, i) => {
      const lean = i % 2 ? 6 : -5;
      const top = { x: px + lean, y: HORIZON - 58 - i * 4 };
      g.lineStyle(3, 0x16122b, 1);
      g.strokePoints(new Phaser.Curves.QuadraticBezier(
        new Phaser.Math.Vector2(px, HORIZON),
        new Phaser.Math.Vector2(px - lean, HORIZON - 30),
        new Phaser.Math.Vector2(top.x, top.y)
      ).getPoints(10));
      g.lineStyle(2, 0x16122b, 1);
      [[-22, 8], [-14, -6], [0, -10], [14, -6], [22, 8], [-8, 12], [9, 12]].forEach(([dx, dy]) => {
        g.strokePoints(new Phaser.Curves.QuadraticBezier(
          new Phaser.Math.Vector2(top.x, top.y),
          new Phaser.Math.Vector2(top.x + dx * 0.6, top.y + dy - 8),
          new Phaser.Math.Vector2(top.x + dx, top.y + dy + 6)
        ).getPoints(6));
      });
    });

    // the village: little houses, and the communal house (đình) with its curved roof
    const dinhX = W.x + 420;
    g.fillStyle(0x1d1838, 1);
    g.fillRect(dinhX - 24, HORIZON - 12, 48, 12);
    g.fillPoints([
      { x: dinhX - 36, y: HORIZON - 18 }, { x: dinhX - 30, y: HORIZON - 14 },
      { x: dinhX + 30, y: HORIZON - 14 }, { x: dinhX + 36, y: HORIZON - 18 },
      { x: dinhX + 22, y: HORIZON - 24 }, { x: dinhX - 22, y: HORIZON - 24 },
    ], true);

    // (the gap at W.x + 150..235 is where the grocery shop stands)
    [W.x + 110, W.x + 475, W.x + 540].forEach((hx) => {
      const hw = Between(26, 36);
      const roof = scene.add.graphics().setDepth(3.1);
      roof.fillStyle(0x1d1838, 1);
      roof.fillRect(hx, HORIZON - 14, hw, 14);
      roof.fillTriangle(hx - 4, HORIZON - 13, hx + hw + 4, HORIZON - 13, hx + hw / 2, HORIZON - 25);
      const windows = [0, 1].map((k) =>
        scene.add
          .rectangle(hx + 6 + k * (hw - 17), HORIZON - 9, 5, 5, 0xffd27a)
          .setDepth(3.2)
          .setAlpha(Math.random() < 0.6 ? 0.9 : 0.08)
      );
      makeHotspot(scene, {
        x: hx + hw / 2,
        y: HORIZON - 12,
        w: hw + 8,
        h: 26,
        depth: 3.5,
        label: 'country.village',
        onClick: () => {
          const win = Phaser.Utils.Array.GetRandom(windows);
          const on = win.alpha < 0.5;
          sfx.windowLight();
          scene.tweens.add({ targets: win, alpha: on ? 0.9 : 0.08, duration: 200 });
          floatText(scene, win.x, win.y - 4, t(on ? 'street.lightOn' : 'street.lightOff'), '#ffe3a3', 13);
        },
      });
    });
  }

  createRoad() {
    const { scene, W } = this;
    const g = scene.add.graphics().setDepth(4);
    g.fillStyle(0x3d3350, 1);
    g.fillRect(W.x, ROAD_Y - 9, W.w, 12);
    g.fillStyle(0x4a3f60, 1);
    g.fillRect(W.x, ROAD_Y - 9, W.w, 1);
    g.fillStyle(0x2c2640, 1);
    for (let x = W.x + 4; x < W.x + W.w; x += Between(14, 30)) g.fillEllipse(x, ROAD_Y - 3 + Between(-2, 2), 6, 1.5);
  }

  // An old village grocery (tiệm tạp hóa) across the road: rusty tin roof,
  // a faded sign, a flickering tube light, snacks hanging in the doorway and
  // the owner behind the counter. Clicking it opens the shop.
  // (x, y) is its bottom-left corner, on the far edge of the road.
  createGroceryShop(x, y) {
    const { scene } = this;
    const W = 80;
    const g = scene.add.graphics().setDepth(3.4);

    // faded plaster walls with damp stains
    g.fillStyle(0x5e5068, 1);
    g.fillRect(x, y - 38, W, 38);
    g.fillStyle(0x54475e, 1);
    g.fillEllipse(x + 8, y - 6, 14, 10);
    g.fillEllipse(x + 72, y - 30, 12, 8);

    // the open front: a lit room with shelves of goods
    const open = { x: x + 6, y: y - 25, w: 50, h: 25 };
    g.fillStyle(0xd8dcc0, 1);
    g.fillRect(open.x, open.y, open.w, open.h);
    g.fillStyle(0x8a6d4c, 1);
    [open.y + 8, open.y + 15].forEach((sy) => g.fillRect(open.x, sy, open.w, 1.5));
    const goods = [0xd9534f, 0xe8c07a, 0x6aa0c8, 0x8fbf8f, 0xe89aae, 0xf3e6cf];
    [open.y + 4, open.y + 11].forEach((sy) => {
      for (let gx = open.x + 2; gx < open.x + open.w - 3; gx += Between(4, 6)) {
        g.fillStyle(Phaser.Utils.Array.GetRandom(goods), 1);
        g.fillRect(gx, sy, 3, Between(3, 4));
      }
    });
    // strips of snack packets hanging in the doorway
    [open.x + 4, open.x + 10, open.x + 44].forEach((sx) => {
      for (let k = 0; k < 4; k++) {
        g.fillStyle(goods[(sx + k) % goods.length], 1);
        g.fillRect(sx, open.y + 1 + k * 4, 3, 3);
      }
    });
    // the owner behind the counter, grey hair in a bun
    g.fillStyle(0xc99a74, 1);
    g.fillCircle(x + 38, y - 13, 3.5);
    g.fillStyle(0x8a8496, 1);
    g.fillCircle(x + 38, y - 16, 3);
    g.fillCircle(x + 40, y - 18, 1.6);
    g.fillStyle(0x7a8a9a, 1);
    g.fillRoundedRect(x + 34, y - 10, 8, 4, 2);
    // glass-topped counter
    g.fillStyle(0x6b4a3a, 1);
    g.fillRect(open.x, y - 7, open.w, 7);
    g.fillStyle(0xcfe0ff, 0.5);
    g.fillRect(open.x, y - 8, open.w, 1.5);

    // the old folding iron gate, pushed to one side
    g.fillStyle(0x4a4452, 1);
    g.fillRect(x + 58, y - 25, 18, 25);
    g.lineStyle(1, 0x6a6472, 1);
    for (let gx = x + 60; gx < x + 76; gx += 3) g.lineBetween(gx, y - 25, gx, y);
    g.lineBetween(x + 58, y - 13, x + 76, y - 13);

    // rusty corrugated tin roof
    g.fillStyle(0x6a5a5a, 1);
    g.fillPoints([
      { x: x - 6, y: y - 36 }, { x: x + W + 6, y: y - 36 },
      { x: x + W + 2, y: y - 46 }, { x: x - 2, y: y - 46 },
    ], true);
    g.lineStyle(1, 0x5a4a4a, 1);
    for (let rx = x - 2; rx < x + W + 4; rx += 4) g.lineBetween(rx, y - 46, rx - 1, y - 36);
    g.fillStyle(0x8a5a40, 0.8);
    g.fillEllipse(x + 14, y - 40, 10, 4);
    g.fillEllipse(x + 60, y - 42, 8, 3);

    // the faded sign board
    g.fillStyle(0xb8c4c8, 1);
    g.fillRect(x + 10, y - 36, 60, 11);
    const sign = scene.add
      .text(x + 40, y - 30.5, 'TẠP HÓA', {
        fontFamily: FONT,
        testString: TEST_STRING,
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#b03a2e',
      })
      .setOrigin(0.5)
      .setDepth(3.45)
      .setAlpha(0.85);

    // out front: a red plastic stool and a crate of soft drinks
    g.fillStyle(0xd9534f, 1);
    g.fillRect(x - 12, y - 6, 9, 2);
    g.fillRect(x - 11, y - 4, 1.5, 4);
    g.fillRect(x - 5.5, y - 4, 1.5, 4);
    g.fillStyle(0xe8c07a, 1);
    g.fillRect(x + W + 1, y - 7, 11, 7);
    g.fillStyle(0x3e3a4a, 1);
    for (let bx = x + W + 2.5; bx < x + W + 11; bx += 3) g.fillCircle(bx, y - 8, 1);

    // a tired fluorescent tube that flickers now and then
    const tube = scene.add.rectangle(open.x + 14, open.y + 1, 20, 2, 0xffffff).setDepth(3.45);
    const tubeGlow = glow(scene, open.x + 24, open.y + 8, 0xe8fff0, 0.6, 0.45, 3.46);
    const spill = glow(scene, x + 32, y + 5, 0xe8f0d0, 1, 0.3, 4.1).setScale(1.3, 0.35);
    scene.time.addEvent({
      delay: 2600,
      loop: true,
      callback: () => {
        if (Math.random() > 0.35) return;
        scene.tweens.add({ targets: [tube, tubeGlow, spill], alpha: 0.15, duration: 50, yoyo: true, repeat: Between(1, 3) });
      },
    });

    const all = [g, sign];
    scene.spots.shop = makeHotspot(scene, {
      x: x + W / 2,
      y: y - 23,
      w: W + 24,
      h: 48,
      depth: 3.6,
      label: 'country.shop',
      onClick: () => {
        sfx.shopBell();
        scene.tooltip.hide();
        scene.tweens.add({ targets: all, y: '-=1', duration: 90, yoyo: true });
        bubble(scene, x + 38, y - 22, pick('country.shopkeeper'), { key: 'shopkeeper', duration: 1500 });
        scene.time.delayedCall(450, () => scene.openShop());
      },
    });
  }

  // Rice paddies full of water and frogs, split by raised dikes.
  createFields() {
    const { scene, W } = this;
    const g = scene.add.graphics().setDepth(4);
    g.fillGradientStyle(0x1b3530, 0x1b3530, 0x24453b, 0x24453b, 1);
    g.fillRect(W.x, FIELD_TOP, W.w, SILL_Y - FIELD_TOP);

    // still water between the rows reflects the sky
    g.fillStyle(0x2a3a5c, 0.5);
    for (let i = 0; i < 9; i++) {
      g.fillEllipse(Between(W.x, W.x + W.w), Between(FIELD_TOP + 6, SILL_Y - 4), Between(40, 120), Between(3, 6));
    }

    // rice tufts: bigger and further apart as they come closer
    for (let y = FIELD_TOP + 4; y < SILL_Y + 4; ) {
      const k = (y - FIELD_TOP) / (SILL_Y - FIELD_TOP);
      const gap = 6 + k * 8;
      const h = 2.5 + k * 4;
      g.lineStyle(1 + k * 0.6, k > 0.5 ? 0x4f7d55 : 0x3f6b4a, 1);
      for (let x = W.x + Between(0, gap); x < W.x + W.w; x += gap + Between(-1, 1)) {
        g.lineBetween(x, y, x - h * 0.4, y - h);
        g.lineBetween(x, y, x, y - h * 1.1);
        g.lineBetween(x, y, x + h * 0.4, y - h);
      }
      y += 4 + k * 6;
    }

    DIKES.forEach((dy) => {
      g.fillStyle(0x4a3f55, 1);
      g.fillRect(W.x, dy, W.w, 3);
      g.fillStyle(0x5a4e66, 1);
      g.fillRect(W.x, dy, W.w, 1);
    });

    // the moon, shimmering in the paddy water
    const reflection = glow(scene, W.x + W.w - 80, 298, 0xfdf1c7, 0.5, 0.22, 4.5).setScale(0.3, 1.1);
    scene.tweens.add({ targets: reflection, scaleX: 0.42, alpha: 0.14, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    makeHotspot(scene, {
      x: W.x + W.w / 2,
      y: (FIELD_TOP + SILL_Y) / 2,
      w: W.w,
      h: SILL_Y - FIELD_TOP,
      depth: 4.6,
      label: 'country.field',
      onClick: (p) => {
        sfx.splash();
        this.ripple(p.x, p.y);
        this.hopFrog(p.x, p.y);
        scene.time.delayedCall(200, () => sfx.croak());
        floatText(scene, p.x, p.y - 8, t('country.croak'), '#c8f0a8', 14);
      },
    });
  }

  ripple(x, y) {
    const { scene } = this;
    const r = scene.add.ellipse(x, y, 8, 3).setStrokeStyle(1, 0xcfe0ff, 0.8).setDepth(4.7);
    scene.tweens.add({ targets: r, scale: 5, alpha: 0, duration: 900, ease: 'Sine.easeOut', onComplete: () => r.destroy() });
  }

  // A little frog leaps out of the water and plops back in further along.
  hopFrog(x, y) {
    const { scene } = this;
    const frog = scene.add.ellipse(x, y, 6, 4, 0x6fae7a).setDepth(4.8);
    const dx = Between(-30, 30);
    scene.tweens.add({ targets: frog, x: x + dx, duration: 500 });
    scene.tweens.add({
      targets: frog,
      y: y - 18,
      duration: 250,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.ripple(frog.x, frog.y);
        frog.destroy();
      },
    });
  }

  createFireflies() {
    const { scene, W } = this;
    for (let i = 0; i < 14; i++) {
      const x = Between(W.x + 10, W.x + W.w - 10);
      const y = Between(FIELD_TOP - 30, SILL_Y - 8);
      const fly = scene.add.circle(x, y, 1.4, 0xe6ff9a).setDepth(6.5);
      const halo = glow(scene, x, y, 0xd8ff8a, 0.18, 0.8, 6.4);
      const wander = () => {
        if (!fly.active) return;
        scene.tweens.add({
          targets: [fly, halo],
          x: Clamp(fly.x + Between(-40, 40), W.x + 5, W.x + W.w - 5),
          y: Clamp(fly.y + Between(-20, 20), FIELD_TOP - 40, SILL_Y - 6),
          duration: Between(2500, 5000),
          ease: 'Sine.easeInOut',
          onComplete: wander,
        });
      };
      wander();
      scene.tweens.add({
        targets: [fly, halo],
        alpha: 0.1,
        duration: Between(600, 1400),
        hold: Between(200, 900),
        yoyo: true,
        repeat: -1,
        delay: Between(0, 2000),
      });
    }
  }

  // The porch: tiled eave, lime-washed walls, wooden pillars, a low wall
  // and a red tile floor. The task board, clock and fairy lights live here.
  createPorch() {
    const { scene, W } = this;
    const { width, height } = scene.scale;

    const floor = scene.add.graphics().setDepth(10);
    floor.fillStyle(0x6e3a2c, 1);
    floor.fillRect(0, SILL_Y + 18, width, height - SILL_Y - 18);
    floor.lineStyle(1, 0x5c3024, 1);
    [SILL_Y + 18, SILL_Y + 30].forEach((ly, row) => {
      floor.lineBetween(0, ly, width, ly);
      for (let x = row * 17; x < width; x += 34) floor.lineBetween(x, ly, x, ly + 12);
    });

    // the low wall at the edge of the porch
    const low = scene.add.graphics().setDepth(11);
    low.fillStyle(0x8a6d4c, 1);
    low.fillRect(W.x, SILL_Y + 4, W.w, 14);
    low.lineStyle(1, 0x76593d, 1);
    low.lineBetween(W.x, SILL_Y + 11, W.x + W.w, SILL_Y + 11);
    for (let x = W.x + 9; x < W.x + W.w; x += 18) {
      low.lineBetween(x, SILL_Y + 4, x, SILL_Y + 11);
      low.lineBetween(x + 9, SILL_Y + 11, x + 9, SILL_Y + 18);
    }
    low.fillStyle(0xb59a74, 1);
    low.fillRect(W.x - 6, SILL_Y, W.w + 12, 6);

    // side walls in old yellow lime-wash
    const walls = scene.add.graphics().setDepth(10);
    [[0, W.x], [W.x + W.w, width]].forEach(([x0, x1]) => {
      walls.fillStyle(0x7d6844, 1);
      walls.fillRect(x0, 0, x1 - x0, SILL_Y + 18);
      walls.fillStyle(0x86704a, 1);
      for (let i = 0; i < 7; i++) {
        walls.fillEllipse(Between(x0 + 10, x1 - 10), Between(60, SILL_Y), Between(20, 50), Between(10, 30));
      }
      walls.fillStyle(0x5e4d36, 1);
      walls.fillRect(x0, SILL_Y - 4, x1 - x0, 22); // the darker skirting at the bottom
    });

    // wooden porch pillars (cột hiên)
    [W.x - 8, W.x + W.w - 6].forEach((px) => {
      walls.fillStyle(0x4a3326, 1);
      walls.fillRect(px, 0, 14, SILL_Y + 18);
      walls.fillStyle(0x5a4030, 1);
      walls.fillRect(px + 3, 0, 2, SILL_Y + 18);
      walls.fillStyle(0x3a281e, 1);
      walls.fillRect(px - 3, SILL_Y + 10, 20, 8); // stone base
    });

    // terracotta tiled eave (mái ngói) and the beam under it
    const roof = scene.add.graphics().setDepth(11);
    roof.fillStyle(0x5a2f25, 1);
    roof.fillRect(0, 0, width, 24);
    roof.lineStyle(1, 0x4a261e, 1);
    [8, 16].forEach((ly) => roof.lineBetween(0, ly, width, ly));
    roof.fillStyle(0x7d4535, 1);
    for (let x = 0; x < width; x += 16) roof.fillEllipse(x + 8, 24, 16, 10);
    roof.fillStyle(0x4a3326, 1);
    roof.fillRect(0, 27, width, 7);

    createFairyLights(scene, W);
    createNotesBoard(scene, 100, 175);
    createClock(scene, 862, 150);
    this.createHat(78, 300);
  }

  // A nón lá hanging on a nail by the door.
  createHat(x, y) {
    const { scene } = this;
    const g = scene.add.graphics();
    g.lineStyle(1, 0xa88a5a, 1);
    g.lineBetween(0, -30, -10, -6);
    g.lineBetween(0, -30, 10, -6);
    g.fillStyle(HAT, 1);
    g.fillTriangle(-32, 8, 32, 8, 0, -22);
    g.fillStyle(0xc4aa74, 1);
    g.fillEllipse(0, 8, 64, 6);
    g.lineStyle(1, 0xb39a68, 1);
    [-12, -2, 8].forEach((ly) => {
      const half = ((ly + 22) / 30) * 32;
      g.lineBetween(-half, ly, half, ly);
    });
    g.fillStyle(0x3a281e, 1);
    g.fillCircle(0, -31, 2); // the nail
    const hat = scene.add.container(x, y, [g]).setDepth(10.5);

    makeHotspot(scene, {
      x,
      y: y - 6,
      w: 66,
      h: 40,
      depth: 10.6,
      label: 'country.hat',
      wobble: hat,
      onClick: () => {
        sfx.hat();
        scene.tweens.add({ targets: hat, angle: { from: -8, to: 8 }, duration: 260, yoyo: true, repeat: 1, ease: 'Sine.easeInOut', onComplete: () => hat.setAngle(0) });
      },
    });
  }

  // Someone in the paddies at night with a headlamp, looking for frogs.
  // They wander along a dike, stop to sweep the light over the water,
  // and now and then catch one. Clicking them makes them try right away.
  createFrogHunter(dikeY, index) {
    const { scene, W } = this;
    const s = dikeY > 290 ? 1.15 : 0.9; // the nearer dike is bigger
    const shirt = SHIRTS[index % SHIRTS.length];

    const g = scene.add.graphics();
    g.fillStyle(0x2b2238, 1);
    g.fillRect(-4, -9, 3, 9); // legs, trousers rolled up
    g.fillRect(1, -9, 3, 9);
    g.fillStyle(SKIN[index % SKIN.length], 1);
    g.fillRect(-4, -3, 3, 3);
    g.fillRect(1, -3, 3, 3);
    g.fillStyle(shirt, 1);
    g.fillRoundedRect(-6, -23, 12, 15, 4);
    g.fillStyle(SKIN[index % SKIN.length], 1);
    g.fillCircle(0, -28, 5);
    g.fillStyle(0x2b2238, 1);
    g.fillRect(-5, -32, 10, 2.5); // headlamp strap
    // a bucket for the frogs in the back hand, a long clamp in the front one
    g.fillStyle(0x8fa3b8, 1);
    g.fillPoints([{ x: -13, y: -13 }, { x: -6, y: -13 }, { x: -7, y: -5 }, { x: -12, y: -5 }], true);
    g.lineStyle(1, 0x6a7f94, 1);
    g.lineBetween(-13, -13, -9, -18);
    g.lineBetween(-9, -18, -6, -13);
    g.lineStyle(1.5, 0xa88a5a, 1);
    g.lineBetween(5, -15, 21, -2);

    // the headlamp and its beam (drawn pointing down and ahead)
    const beam = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    beam.fillStyle(0xfff2c4, 0.2);
    beam.fillTriangle(0, 0, 38, 30, 22, 36);
    beam.fillStyle(0xfff2c4, 0.12);
    beam.fillTriangle(0, 0, 44, 26, 18, 40);
    const spot = glow(scene, 0, 0, 0xfff2c4, 0.32, 0.65).setPosition(30, 33);
    const beamC = scene.add.container(3, -30, [beam, spot]);
    const lamp = scene.add.circle(3, -30, 1.3, 0xffffff);
    const lampGlow = glow(scene, 0, 0, 0xfff6c8, 0.07, 0.8).setPosition(3, -30);

    // `inner` puts the feet at y = 16, so the hit box (centred on the container) covers the body
    const inner = scene.add.container(0, 16, [g, beamC, lampGlow, lamp]);
    const startX = index ? W.x + 420 : W.x + 70; // one each side of the student's head
    const c = scene.add.container(startX, dikeY - 16 * s, [inner]).setDepth(6 + index * 0.1);
    let dir = index % 2 ? -1 : 1;
    c.setScale(dir * s, s);
    c.setSize(30, 40).setInteractive({ useHandCursor: true });

    const minX = W.x + 30;
    const maxX = W.x + W.w - 30;
    let tween = null;
    let timer = null;
    let busy = false;
    const bob = scene.tweens.add({ targets: inner, y: 15, duration: 300, yoyo: true, repeat: -1, paused: true });

    const later = (ms, fn) => (timer = scene.time.delayedCall(ms, fn));

    const walk = () => {
      let target = c.x + Between(30, 110) * dir;
      if (target < minX || target > maxX) {
        dir = -dir;
        c.scaleX = dir * s;
        target = Clamp(c.x + Between(30, 110) * dir, minX, maxX);
      }
      bob.resume();
      tween = scene.tweens.add({
        targets: c,
        x: target,
        duration: (Math.abs(target - c.x) / 12) * 1000,
        onComplete: () => {
          bob.pause();
          look();
        },
      });
    };

    // stop and sweep the light across the water: down-ahead, then back, then centre
    const sweep = (angle, next) => {
      tween = scene.tweens.add({ targets: beamC, angle, duration: 700, yoyo: true, ease: 'Sine.easeInOut', onComplete: next });
    };
    const look = () =>
      sweep(16, () =>
        sweep(-14, () => {
          if (Math.random() < 0.3) catchFrog(false);
          else later(Between(300, 1200), walk);
        })
      );

    const catchFrog = (clicked) => {
      busy = true;
      const fx = c.x + dir * 30 * s;
      const fy = dikeY + 8;
      scene.tweens.add({ targets: inner, x: 3, duration: 120, yoyo: true });
      scene.time.delayedCall(140, () => {
        this.ripple(fx, fy);
        if (clicked) {
          sfx.catchFrog();
          floatText(scene, fx, fy - 30, t('country.caught'), '#c8f0a8', 14);
          bubble(scene, c.x, c.y - 26 * s, pick('country.hunterLines'), { key: `hunter${index}`, duration: 1800 });
        }
      });
      later(1500, () => {
        busy = false;
        walk();
      });
    };

    bindHover(scene, c, {
      label: 'country.hunter',
      onClick: () => {
        if (busy) return;
        tween?.stop();
        timer?.remove();
        bob.pause();
        beamC.setAngle(0);
        scene.student?.lookAt(c.x);
        catchFrog(true);
      },
    });

    later(Between(200, 1500), walk);
  }

  // Someone passing on the village road: on foot, by bicycle or by motorbike.
  spawnTraveller() {
    const r = Math.random();
    if (r < 0.4) this.spawnWalker();
    else if (r < 0.75) this.spawnBicycle();
    else this.spawnMotorbike();
  }

  // Shared plumbing: a container that crosses the road, faces the way it
  // goes, and is clickable. `parts` are drawn with the ground at y = 12.
  traveller(parts, { speed, label, onClick }) {
    const { scene, W } = this;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const s = 0.75; // the road is further away than the paddies
    const startX = dir > 0 ? W.x - 40 : W.x + W.w + 40;
    const endX = dir > 0 ? W.x + W.w + 40 : W.x - 40;
    const c = scene.add.container(startX, ROAD_Y - 12 * s, parts).setDepth(5).setScale(dir * s, s);
    c.setSize(40, 36).setInteractive({ useHandCursor: true });
    const move = scene.tweens.add({
      targets: c,
      x: endX,
      duration: (Math.abs(endX - startX) / speed) * 1000,
      onComplete: () => c.destroy(),
    });
    bindHover(scene, c, { label, onClick: () => onClick(c, move) });
    return { c, move };
  }

  person(g, { shirt, skin, hat }) {
    g.fillStyle(0x2b2238, 1);
    g.fillRect(-5, 2, 4, 10);
    g.fillRect(1, 2, 4, 10);
    g.fillStyle(shirt, 1);
    g.fillRoundedRect(-7, -13, 14, 16, 5);
    g.fillStyle(skin, 1);
    g.fillCircle(0, -18, 6);
    if (hat) {
      g.fillStyle(HAT, 1);
      g.fillTriangle(-12, -19, 12, -19, 0, -31);
    }
  }

  spawnWalker() {
    const { scene } = this;
    const g = scene.add.graphics();
    const shirt = Phaser.Utils.Array.GetRandom(SHIRTS);
    const skin = Phaser.Utils.Array.GetRandom(SKIN);
    this.person(g, { shirt, skin, hat: Math.random() < 0.6 });

    // sometimes carrying a shoulder pole with two baskets (đòn gánh)
    if (Math.random() < 0.35) {
      g.lineStyle(2, 0xa88a5a, 1);
      g.lineBetween(-24, -11, 24, -11);
      g.lineStyle(1, 0x8a6d4c, 1);
      [-20, 20].forEach((bx) => {
        g.lineBetween(bx, -11, bx - 5, 2);
        g.lineBetween(bx, -11, bx + 5, 2);
      });
      g.fillStyle(0x8a6d4c, 1);
      g.fillEllipse(-20, 4, 14, 7);
      g.fillEllipse(20, 4, 14, 7);
    }

    const arm = scene.add.graphics();
    arm.lineStyle(3, shirt, 1);
    arm.lineBetween(5, -10, 11, -24);
    arm.fillStyle(skin, 1);
    arm.fillCircle(11, -25, 2.5);
    arm.setVisible(false);

    const bobber = scene.add.container(0, 0, [g, arm]);
    const bob = scene.tweens.add({ targets: bobber, y: -1.5, duration: 260, yoyo: true, repeat: -1 });
    let waving = false;
    this.traveller([bobber], {
      speed: Between(14, 22),
      label: 'country.walker',
      onClick: (c, move) => {
        if (waving) return;
        waving = true;
        sfx.wave();
        move.pause();
        bob.pause();
        arm.setVisible(true);
        scene.tweens.add({ targets: arm, angle: 18, duration: 160, yoyo: true, repeat: 3 });
        scene.student?.lookAt(c.x);
        scene.student?.wave();
        bubble(scene, c.x, c.y - 26, pick('country.walkerLines'), { key: 'walker', duration: 1800 });
        scene.time.delayedCall(1600, () => {
          if (!c.active) return;
          arm.setVisible(false);
          move.resume();
          bob.resume();
          waving = false;
        });
      },
    });
  }

  spawnBicycle() {
    const { scene } = this;
    const bike = scene.add.graphics();
    bike.lineStyle(1.5, 0x15112a, 1);
    bike.strokeCircle(-11, 6, 6);
    bike.strokeCircle(11, 6, 6);
    bike.lineStyle(1.5, 0x5a6a7a, 1);
    bike.lineBetween(-11, 6, -2, -4);
    bike.lineBetween(-2, -4, 9, -4);
    bike.lineBetween(9, -4, 11, 6);
    bike.lineBetween(-2, -4, 2, 6);
    bike.lineBetween(9, -4, 8, -9); // handlebar
    bike.fillStyle(0xfff2c4, 0.8);
    bike.fillCircle(12, -6, 1.5); // little front lamp

    const rider = scene.add.graphics();
    const shirt = Phaser.Utils.Array.GetRandom(SHIRTS);
    rider.fillStyle(shirt, 1);
    rider.fillRoundedRect(-6, -20, 11, 15, 4);
    rider.lineStyle(3, shirt, 1);
    rider.lineBetween(2, -16, 8, -9); // arm on the handlebar
    rider.fillStyle(Phaser.Utils.Array.GetRandom(SKIN), 1);
    rider.fillCircle(0, -25, 5);
    rider.fillStyle(HAT, 1);
    rider.fillTriangle(-10, -26, 10, -26, 0, -36);
    rider.fillStyle(0x2b2238, 1);
    rider.fillRect(-3, -6, 4, 8); // leg
    const riderC = scene.add.container(0, 0, [rider]);
    scene.tweens.add({ targets: riderC, y: -1, duration: 200, yoyo: true, repeat: -1 });

    this.traveller([bike, riderC], {
      speed: Between(28, 38),
      label: 'country.bike',
      onClick: (c) => {
        sfx.bicycleBell();
        scene.student?.lookAt(c.x);
        bubble(scene, c.x, c.y - 28, pick('country.bikeLines'), { key: 'bike', duration: 1600 });
      },
    });
  }

  spawnMotorbike() {
    const { scene } = this;
    const beam = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    beam.fillStyle(0xfff2c4, 0.16);
    beam.fillTriangle(16, -4, 70, -14, 70, 10);
    const moto = scene.add.graphics();
    moto.fillStyle(0x15112a, 1);
    moto.fillCircle(-11, 6, 6);
    moto.fillCircle(12, 6, 6);
    moto.fillStyle(0x5a6a7a, 1);
    moto.fillCircle(-11, 6, 2.5);
    moto.fillCircle(12, 6, 2.5);
    moto.fillStyle(Phaser.Utils.Array.GetRandom([0xc96f5a, 0x6c8fb3, 0x3e3a4a, 0x8d4a3c]), 1);
    moto.fillRoundedRect(-14, -6, 28, 9, 4);
    moto.fillRoundedRect(8, -10, 8, 8, 2);
    moto.fillStyle(0xffffff, 1);
    moto.fillCircle(16, -5, 2); // headlight
    moto.fillStyle(0xff5a4a, 1);
    moto.fillCircle(-15, -3, 1.5); // tail light

    const rider = scene.add.graphics();
    const shirt = Phaser.Utils.Array.GetRandom(SHIRTS);
    rider.fillStyle(0x2b2238, 1);
    rider.fillRect(-4, -8, 5, 8);
    rider.fillStyle(shirt, 1);
    rider.fillRoundedRect(-7, -22, 12, 15, 4);
    rider.lineStyle(3, shirt, 1);
    rider.lineBetween(2, -18, 10, -10);
    rider.fillStyle(Phaser.Utils.Array.GetRandom([0xd9534f, 0xe8c07a, 0x6aa0c8, 0xf3e6cf]), 1);
    rider.fillCircle(0, -27, 6); // helmet
    const headlightGlow = glow(scene, 0, 0, 0xfff6c8, 0.22, 0.9).setPosition(16, -5);

    this.traveller([beam, moto, rider, headlightGlow], {
      speed: Between(70, 95),
      label: 'country.moto',
      onClick: (c, move) => {
        sfx.motorbike();
        scene.student?.lookAt(c.x);
        bubble(scene, c.x, c.y - 28, pick('country.motoLines'), { key: 'moto', duration: 1400 });
        move.timeScale = 0.3; // slow down to say hello
        scene.time.delayedCall(1300, () => (move.timeScale = 1));
      },
    });
  }
}
