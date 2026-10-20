import Phaser from 'phaser';
import { makeHotspot } from '../utils/hotspot.js';
import { bubble, floatText, glow } from '../utils/fx.js';
import sfx from '../audio/sfx.js';
import { t, pick } from '../utils/i18n.js';

// Night sky seen through the window: twinkling stars, a moon with phases,
// shooting stars you can wish on, and stars you can join into constellations.
export default class Sky {
  constructor(scene, W) {
    this.scene = scene;
    this.W = W;
    this.lastStar = null;
    this.lines = 0;
    this.shootingActive = false;

    const g = scene.add.graphics().setDepth(0);
    g.fillGradientStyle(0x0b1033, 0x0b1033, 0x3d2b60, 0x3d2b60, 1);
    g.fillRect(W.x, W.y, W.w, W.h);

    this.lineGfx = scene.add.graphics().setDepth(1);

    // Clicking empty sky: wish on a shooting star, or add a new star.
    makeHotspot(scene, {
      x: W.x + W.w / 2,
      y: W.y + 95,
      w: W.w,
      h: 150,
      depth: 0.5,
      label: 'sky.label',
      onClick: (p) => {
        if (this.shootingActive) {
          this.shootingActive = false;
          sfx.wish();
          floatText(scene, p.x, p.y, t('sky.wish'), '#ffe9a8', 18);
          bubble(scene, 480, 280, t('sky.hope'), { key: 'student' });
        } else {
          sfx.addStar();
          this.addStar(p.x, p.y, true);
        }
      },
    });

    for (let i = 0; i < 60; i++) {
      this.addStar(
        Phaser.Math.Between(W.x + 8, W.x + W.w - 8),
        Phaser.Math.Between(W.y + 45, W.y + 150)
      );
    }

    this.createMoon(W.x + W.w - 80, W.y + 82);

    scene.time.addEvent({
      delay: 9000,
      loop: true,
      callback: () => Math.random() < 0.7 && this.shootingStar(),
    });
    scene.time.delayedCall(2500, () => this.shootingStar());
  }

  addStar(x, y, fromClick = false) {
    const { scene } = this;
    const r = Phaser.Math.FloatBetween(0.8, 2);
    const star = scene.add.circle(x, y, r, 0xfff6d8).setDepth(1);
    scene.tweens.add({
      targets: star,
      alpha: { from: 1, to: 0.25 },
      duration: Phaser.Math.Between(900, 2600),
      yoyo: true,
      repeat: -1,
      delay: Phaser.Math.Between(0, 2000),
    });

    if (fromClick) {
      star.setScale(0);
      scene.tweens.add({ targets: star, scale: 1, duration: 400, ease: 'Back.easeOut' });
      const s = glow(scene, x, y, 0xfff0c0, 0.4, 0.8, 1);
      scene.tweens.add({ targets: s, alpha: 0, scale: 0.8, duration: 700, onComplete: () => s.destroy() });
    }

    makeHotspot(scene, {
      x,
      y,
      w: 16,
      h: 16,
      depth: 1.5,
      label: 'star.label',
      onClick: () => this.connectStar(star),
    });
    return star;
  }

  connectStar(star) {
    const { scene } = this;
    scene.tweens.add({ targets: star, scale: 3, duration: 150, yoyo: true });
    scene.student?.lookAt(star.x);

    if (this.lastStar && this.lastStar !== star) {
      this.lineGfx.lineStyle(1.2, 0xbfd4ff, 0.75);
      this.lineGfx.lineBetween(this.lastStar.x, this.lastStar.y, star.x, star.y);
      this.lines++;
    }
    this.lastStar = star;
    sfx.connectStar(this.lines);

    if (this.lines >= 4) {
      sfx.constellation();
      const name = pick('star.names');
      floatText(scene, star.x, star.y - 10, name, '#cfe0ff', 18);
      bubble(scene, 480, 280, t('star.named', { name }), { key: 'student' });
      this.lines = 0;
      this.lastStar = null;
      scene.tweens.add({
        targets: this.lineGfx,
        alpha: 0,
        delay: 2200,
        duration: 1200,
        onComplete: () => {
          this.lineGfx.clear();
          this.lineGfx.setAlpha(1);
        },
      });
    }
  }

  createMoon(x, y) {
    const { scene } = this;
    const halo = glow(scene, x, y, 0xfff1c7, 1.6, 0.35, 2);
    const moon = scene.add.graphics().setPosition(x, y).setDepth(2);
    const R = 24;

    // Draws the lit part of the moon. k goes from -1 (full) to 1 (new);
    // side flips between waxing (lit on the right) and waning (lit on the left).
    const drawMoon = (k, side) => {
      moon.clear();
      moon.fillStyle(0x1c1f4a, 0.9); // the dark part, faintly visible
      moon.fillCircle(0, 0, R);
      const pts = [];
      for (let i = 0; i <= 24; i++) {
        const t = -Math.PI / 2 + (Math.PI * i) / 24;
        pts.push({ x: side * R * Math.cos(t), y: R * Math.sin(t) });
      }
      for (let i = 24; i >= 0; i--) {
        const t = -Math.PI / 2 + (Math.PI * i) / 24;
        pts.push({ x: side * k * R * Math.cos(t), y: R * Math.sin(t) });
      }
      moon.fillStyle(0xfdf1c7, 1);
      moon.fillPoints(pts, true);
    };
    // full, waning gibbous, last quarter, waning crescent, new, waxing crescent, first quarter, waxing gibbous
    const phases = [[-1, 1], [-0.5, -1], [0, -1], [0.6, -1], [1, 1], [0.6, 1], [0, 1], [-0.5, 1]];
    let phase = 0;
    drawMoon(...phases[0]);

    makeHotspot(scene, {
      x,
      y,
      w: 60,
      h: 60,
      depth: 2.5,
      label: 'moon.label',
      wobble: moon,
      onClick: () => {
        phase = (phase + 1) % phases.length;
        sfx.moon();
        const [k, side] = phases[phase];
        drawMoon(k, side);
        halo.setAlpha(0.35 * (1 - k) / 2 + 0.05);
        scene.student?.lookAt(x);
        bubble(scene, 480, 280, pick('moon.lines'), { key: 'student' });
      },
    });
  }

  shootingStar() {
    const { scene, W } = this;
    const sx = Phaser.Math.Between(W.x + 60, W.x + W.w - 160);
    const sy = Phaser.Math.Between(W.y + 40, W.y + 80);
    const streak = scene.add.graphics().setDepth(3);
    streak.fillStyle(0xffffff, 1);
    streak.fillCircle(0, 0, 2);
    for (let i = 1; i < 10; i++) {
      streak.fillStyle(0xfff3c8, 1 - i / 10);
      streak.fillCircle(-i * 4, -i * 2, 1.6 - i * 0.12);
    }
    streak.setPosition(sx, sy);
    this.shootingActive = true;
    scene.tweens.add({
      targets: streak,
      x: sx + 140,
      y: sy + 70,
      alpha: 0,
      duration: 1100,
      ease: 'Quad.easeIn',
      onComplete: () => streak.destroy(),
    });
    // you get a short window after it fades to click the sky and wish
    scene.time.delayedCall(2500, () => (this.shootingActive = false));
  }
}
