import Phaser from 'phaser';

export const FONT = '"Trebuchet MS", "Segoe UI", Verdana, sans-serif';
// Phaser measures line height from this string. Vietnamese stacks accents
// high (Ể, Ỗ), so include some to keep them from being clipped.
export const TEST_STRING = '|MÉqgyỂỖỹ';

// A soft white radial gradient we reuse (tinted) for every light in the scene.
export function makeGlowTexture(scene, key = 'glow', size = 128) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, size, size);
  const ctx = tex.getContext();
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.3, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  tex.refresh();
}

export function glow(scene, x, y, tint, scale, alpha, depth = 31) {
  return scene.add
    .image(x, y, 'glow')
    .setTint(tint)
    .setScale(scale)
    .setAlpha(alpha)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth(depth);
}

// Little text that drifts up and fades ("*sip*", "♥", "tap tap").
export function floatText(scene, x, y, text, color = '#fff4d6', size = 16) {
  const t = scene.add
    .text(x, y, text, {
      fontFamily: FONT,
      testString: TEST_STRING,
      fontSize: `${size}px`,
      color,
      stroke: '#2a2140',
      strokeThickness: 4,
    })
    .setOrigin(0.5)
    .setDepth(45);
  scene.tweens.add({
    targets: t,
    y: y - 42,
    x: x + Phaser.Math.Between(-8, 8),
    alpha: 0,
    duration: 1500,
    ease: 'Sine.easeOut',
    onComplete: () => t.destroy(),
  });
  return t;
}

// Speech/thought bubble. (x, y) is where the tail points.
// Passing a `key` replaces any older bubble with the same key.
const bubbles = new Map();
export function bubble(scene, x, y, text, { duration = 2600, key = 'default' } = {}) {
  if (bubbles.get(key)?.active) bubbles.get(key).destroy(); // may be gone already after a map change

  const pad = 10;
  const t = scene.add.text(0, 0, text, {
    fontFamily: FONT,
    testString: TEST_STRING,
    fontSize: '15px',
    color: '#3a2c4b',
    align: 'center',
    wordWrap: { width: 230 },
  }).setOrigin(0.5, 1);

  const w = t.width + pad * 2;
  const h = t.height + pad * 2;
  const bx = Phaser.Math.Clamp(x, w / 2 + 8, scene.scale.width - w / 2 - 8);
  const offset = x - bx; // keep the tail pointing at the speaker even when clamped

  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.18);
  g.fillRoundedRect(-w / 2 + 2, -h - 10 + 3, w, h, 10);
  g.fillStyle(0xfff6e6, 1);
  g.fillRoundedRect(-w / 2, -h - 10, w, h, 10);
  g.fillTriangle(offset - 7, -11, offset + 7, -11, offset, 0);
  t.setPosition(0, -10 - pad);

  const c = scene.add.container(bx, y, [g, t]).setDepth(46).setScale(0.6).setAlpha(0);
  bubbles.set(key, c);
  scene.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 180, ease: 'Back.easeOut' });
  scene.time.delayedCall(duration, () => {
    if (!c.active) return;
    scene.tweens.add({
      targets: c,
      alpha: 0,
      y: y - 6,
      duration: 250,
      onComplete: () => {
        if (bubbles.get(key) === c) bubbles.delete(key);
        c.destroy();
      },
    });
  });
  return c;
}

// The hint bar at the bottom of the screen.
export function createTooltip(scene) {
  const g = scene.add.graphics();
  const t = scene.add.text(0, 0, '', {
    fontFamily: FONT,
    testString: TEST_STRING,
    fontSize: '15px',
    color: '#fff4d6',
  }).setOrigin(0.5);
  const c = scene.add.container(scene.scale.width / 2, scene.scale.height - 24, [g, t])
    .setDepth(50)
    .setAlpha(0);

  return {
    show(text) {
      t.setText(text);
      const w = t.width + 28;
      g.clear();
      g.fillStyle(0x1b1530, 0.82);
      g.fillRoundedRect(-w / 2, -15, w, 30, 15);
      scene.tweens.killTweensOf(c);
      scene.tweens.add({ targets: c, alpha: 1, duration: 120 });
    },
    hide() {
      scene.tweens.killTweensOf(c);
      scene.tweens.add({ targets: c, alpha: 0, duration: 200 });
    },
  };
}
