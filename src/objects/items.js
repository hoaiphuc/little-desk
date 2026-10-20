import { getShop } from '../utils/shop.js';

// Everything the corner shop sells. Each item draws itself once with the
// plain Canvas 2D API; the same drawing becomes a Phaser texture in the room
// and a preview picture in the shop, so the two always match.
//
// Coordinates are local: lamps have (0, 0) at the middle of their base on
// the desk, clocks have (0, 0) at their centre on the wall.
//   box:   [left, top, width, height] around the drawing
//   bulb:  the part that lights up (lamps), drawn on top by Phaser
//   glow:  tint of the light the lamp throws
//   hands: where the clock hands go and how long they are [hour, min, sec]

// ---- tiny drawing helpers ----
function circle(ctx, color, x, y, r) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
function ellipse(ctx, color, x, y, rx, ry) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}
function rect(ctx, color, x, y, w, h, r = 0) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}
function poly(ctx, color, pts) {
  ctx.fillStyle = color;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
}
function line(ctx, color, width, x1, y1, x2, y2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
// The 12 hour marks around a clock face.
function dialDots(ctx, color, cx, cy, r, small, big) {
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    circle(ctx, color, cx + Math.cos(a) * r, cy + Math.sin(a) * r, i % 3 === 0 ? big : small);
  }
}

// ---- lamps ----
const LAMPS = [
  {
    id: 'lamp-classic',
    price: 0,
    box: [-36, -125, 72, 129],
    bulb: { x: 0, y: -86, r: 7, on: [0xfff2c4, 1], off: [0x8a8270, 1] },
    glow: 0xffc27a,
    draw(ctx) {
      ellipse(ctx, '#3e3a4a', 0, -4, 28, 7);
      line(ctx, '#3e3a4a', 5, 0, -6, 0, -92);
      poly(ctx, '#e9b872', [[-14, -122], [14, -122], [34, -90], [-34, -90]]);
      rect(ctx, '#d19d55', -34, -92, 68, 4);
    },
  },
  {
    id: 'lamp-mushroom',
    price: 30,
    box: [-38, -72, 76, 76],
    bulb: { x: 0, y: -36, r: 6, on: [0xffe6ea, 1], off: [0x8a7a7e, 1] },
    glow: 0xff9fb0,
    draw(ctx) {
      ellipse(ctx, '#e0cdb5', 0, -3, 20, 5);
      rect(ctx, '#f3e6cf', -9, -40, 18, 38, 4);
      ctx.fillStyle = '#e58f9a';
      ctx.beginPath();
      ctx.ellipse(0, -40, 36, 30, 0, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ellipse(ctx, '#c9727f', 0, -40, 36, 5);
      [[-18, -56, 5], [4, -63, 6], [20, -50, 4], [-4, -48, 3.5]].forEach(([x, y, r]) => circle(ctx, '#fff6e6', x, y, r));
    },
  },
  {
    id: 'lamp-lantern',
    price: 45,
    box: [-26, -116, 74, 120],
    bulb: { x: 24, y: -80, r: 8, on: [0xffd9a8, 0.95], off: [0x7a3a38, 1] },
    glow: 0xff9a6a,
    draw(ctx) {
      ellipse(ctx, '#5a3d2e', 0, -4, 24, 6);
      line(ctx, '#5a3d2e', 4, 0, -6, 0, -112);
      line(ctx, '#5a3d2e', 3, 0, -112, 24, -112);
      line(ctx, '#e8c07a', 1.5, 24, -112, 24, -100);
      ellipse(ctx, '#d9534f', 24, -80, 22, 20);
      ctx.strokeStyle = '#b8433f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(24, -80, 11, 20, 0, 0, Math.PI * 2);
      ctx.stroke();
      line(ctx, '#b8433f', 1.5, 24, -100, 24, -60);
      rect(ctx, '#e8c07a', 16, -102, 16, 5, 1);
      rect(ctx, '#e8c07a', 16, -61, 16, 5, 1);
      line(ctx, '#e8c07a', 2, 24, -56, 24, -43);
      circle(ctx, '#e8c07a', 24, -41, 2.5);
    },
  },
  {
    id: 'lamp-moon',
    price: 60,
    box: [-30, -70, 60, 74],
    // the whole moon brightens when it's on, and dims when it's off
    bulb: { x: 0, y: -40, r: 28, on: [0xfff2c4, 0.3], off: [0x1a1830, 0.5] },
    glow: 0xcfe0ff,
    draw(ctx) {
      rect(ctx, '#7a5541', -22, -12, 44, 12, 4);
      rect(ctx, '#5e3f30', -22, -3, 44, 3);
      circle(ctx, '#f6edd2', 0, -40, 28);
      [[-10, -48, 6], [9, -34, 8], [8, -55, 4], [-12, -28, 3.5]].forEach(([x, y, r]) => circle(ctx, '#e6dab8', x, y, r));
    },
  },
];

// ---- clocks ----
const CLOCKS = [
  {
    id: 'clock-classic',
    price: 0,
    box: [-37, -37, 74, 74],
    hands: { x: 0, y: 0, len: [14, 21, 23], color: 0x3a2c4b, second: 0xd9534f },
    draw(ctx) {
      circle(ctx, '#7a5541', 0, 0, 36);
      circle(ctx, '#f3e6cf', 0, 0, 30);
      dialDots(ctx, '#7a5541', 0, 0, 24, 1.2, 2.2);
    },
  },
  {
    id: 'clock-pastel',
    price: 30,
    box: [-33, -33, 66, 66],
    hands: { x: 0, y: 0, len: [11, 16, 19], color: 0x3a2c4b, second: 0xe58f9a },
    draw(ctx) {
      rect(ctx, '#a8e0c8', -32, -32, 64, 64, 14);
      rect(ctx, '#fff6e6', -26, -26, 52, 52, 10);
      rect(ctx, '#e58f9a', -2, -23, 4, 7, 2);
      rect(ctx, '#e58f9a', -2, 16, 4, 7, 2);
      rect(ctx, '#e58f9a', -23, -2, 7, 4, 2);
      rect(ctx, '#e58f9a', 16, -2, 7, 4, 2);
    },
  },
  {
    id: 'clock-cat',
    price: 40,
    box: [-44, -52, 94, 110],
    hands: { x: 0, y: 4, len: [10, 15, 17], color: 0x2b2238, second: 0xd9534f },
    draw(ctx) {
      ctx.strokeStyle = '#2b2238';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(20, 24);
      ctx.quadraticCurveTo(48, 30, 38, 54);
      ctx.stroke();
      [-1, 1].forEach((s) => {
        poly(ctx, '#2b2238', [[-30 * s, -14], [-10 * s, -30], [-28 * s, -50]]);
        poly(ctx, '#f3b6a0', [[-25 * s, -20], [-14 * s, -29], [-25 * s, -41]]);
      });
      circle(ctx, '#2b2238', 0, 0, 34);
      circle(ctx, '#ffd27a', -10, -25, 3);
      circle(ctx, '#ffd27a', 10, -25, 3);
      circle(ctx, '#f3e6cf', 0, 4, 24);
      dialDots(ctx, '#2b2238', 0, 4, 18, 1, 1.8);
      [-1, 1].forEach((s) => {
        line(ctx, '#f3e6cf', 1.5, 26 * s, 6, 42 * s, 2);
        line(ctx, '#f3e6cf', 1.5, 26 * s, 11, 42 * s, 13);
      });
    },
  },
  {
    id: 'clock-cuckoo',
    price: 55,
    box: [-42, -66, 84, 136],
    hands: { x: 0, y: 6, len: [9, 13, 15], color: 0x3a2c4b, second: 0xd9534f },
    draw(ctx) {
      line(ctx, '#3a2c4b', 1.5, -8, 34, -8, 58);
      line(ctx, '#3a2c4b', 1.5, 8, 34, 8, 50);
      ellipse(ctx, '#8d4a3c', -8, 62, 4, 7);
      ellipse(ctx, '#8d4a3c', 8, 54, 4, 7);
      rect(ctx, '#b07a52', -30, -26, 60, 60, 3);
      poly(ctx, '#8d4a3c', [[-40, -24], [40, -24], [0, -58]]);
      rect(ctx, '#3a2c4b', -5, -46, 10, 11, 2);
      [[-6, -58, 4], [6, -58, 4], [0, -62, 4.5]].forEach(([x, y, r]) => circle(ctx, '#6fae7a', x, y, r));
      circle(ctx, '#7a5541', 0, 6, 22);
      circle(ctx, '#f3e6cf', 0, 6, 19);
      dialDots(ctx, '#7a5541', 0, 6, 15, 1, 1.8);
    },
  },
];

// ---- places ----
// Whole new scenes. Their `draw` is only a thumbnail for the shop; the real
// scene is built in scenes/RoomScene.js (city) or objects/Countryside.js.
function nightSky(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#0b1033');
  g.addColorStop(1, '#3d2b60');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  [[12, 14], [40, 8], [58, 26], [88, 12], [112, 30], [130, 10], [30, 36], [75, 40]].forEach(([x, y]) =>
    circle(ctx, '#fff6d8', x, y, 0.9)
  );
}

const MAPS = [
  {
    id: 'map-city',
    price: 0,
    box: [0, 0, 150, 120],
    previewScale: 1,
    draw(ctx) {
      rect(ctx, '#43345a', 0, 0, 150, 120);
      ctx.save();
      ctx.beginPath();
      ctx.rect(30, 12, 90, 66);
      ctx.clip();
      nightSky(ctx, 150, 80);
      circle(ctx, '#fdf1c7', 104, 28, 8);
      [[30, 48, 22], [52, 38, 18], [70, 52, 20], [90, 42, 16], [106, 50, 18]].forEach(([x, y, w]) => {
        rect(ctx, '#1d1838', x, y, w, 40);
        for (let wy = y + 4; wy < 74; wy += 7) {
          for (let wx = x + 3; wx < x + w - 4; wx += 6) if ((wx * wy) % 3 === 0) rect(ctx, '#ffd27a', wx, wy, 3, 4);
        }
      });
      ctx.restore();
      ctx.strokeStyle = '#7a5541';
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 12, 90, 66);
      line(ctx, '#7a5541', 3, 75, 12, 75, 78);
      rect(ctx, '#c9787a', 18, 8, 14, 74);
      rect(ctx, '#c9787a', 118, 8, 14, 74);
      rect(ctx, '#9a6a45', 0, 92, 150, 28);
      rect(ctx, '#7a5236', 0, 92, 150, 4);
      poly(ctx, '#e9b872', [[20, 74], [30, 74], [36, 84], [14, 84]]);
      line(ctx, '#3e3a4a', 2, 25, 84, 25, 92);
    },
  },
  {
    id: 'map-countryside',
    price: 100,
    box: [0, 0, 150, 120],
    previewScale: 1,
    draw(ctx) {
      nightSky(ctx, 150, 80);
      circle(ctx, '#fdf1c7', 116, 22, 8);
      // bamboo, palms and a village house on the horizon
      ctx.fillStyle = '#16122b';
      ctx.beginPath();
      ctx.moveTo(0, 66);
      [[10, 56], [22, 60], [34, 52], [48, 62], [70, 64], [92, 58], [104, 62], [128, 55], [150, 60]].forEach(([x, y]) =>
        ctx.lineTo(x, y)
      );
      ctx.lineTo(150, 70);
      ctx.lineTo(0, 70);
      ctx.fill();
      line(ctx, '#16122b', 1.5, 60, 66, 63, 44);
      [[-10, -3], [-7, 4], [8, -2], [6, 5], [0, -7]].forEach(([dx, dy]) => line(ctx, '#16122b', 1.2, 63, 44, 63 + dx, 44 + dy));
      rect(ctx, '#1d1838', 80, 56, 16, 12);
      poly(ctx, '#1d1838', [[77, 57], [99, 57], [88, 49]]);
      rect(ctx, '#ffd27a', 85, 60, 4, 4);
      // road and paddies
      rect(ctx, '#3d3350', 0, 70, 150, 5);
      rect(ctx, '#1f3a33', 0, 75, 150, 45);
      for (let y = 79; y < 120; y += 6) {
        for (let x = (y % 12) / 2; x < 150; x += 7) line(ctx, '#3f6b4a', 1, x, y, x + 1, y - 3);
      }
      rect(ctx, '#4a3f55', 0, 90, 150, 2);
      rect(ctx, '#4a3f55', 0, 105, 150, 2);
      ellipse(ctx, 'rgba(253, 241, 199, 0.25)', 116, 98, 5, 16);
      // two frog hunters with headlamps
      [[40, 89, 1], [96, 104, -1]].forEach(([x, y, d]) => {
        poly(ctx, 'rgba(255, 246, 200, 0.28)', [[x, y - 9], [x + 22 * d, y + 6], [x + 8 * d, y + 8]]);
        rect(ctx, '#2b2238', x - 2, y - 8, 4, 8);
        circle(ctx, '#2b2238', x, y - 10, 2.2);
        circle(ctx, '#fff6c8', x + d, y - 11, 1.3);
      });
      [[20, 82], [70, 96], [130, 86], [110, 112], [52, 110]].forEach(([x, y]) => circle(ctx, '#e6ff9a', x, y, 1));
      // the porch eave
      rect(ctx, '#6b3a2e', 0, 0, 150, 8);
      line(ctx, '#5a3d2e', 3, 0, 9, 150, 9);
    },
  },
];

LAMPS.forEach((item) => (item.kind = 'lamp'));
CLOCKS.forEach((item) => (item.kind = 'clock'));
MAPS.forEach((item) => (item.kind = 'map'));
export const CATALOG = { lamp: LAMPS, clock: CLOCKS, map: MAPS };

export function equippedItem(kind) {
  const id = getShop().equipped[kind];
  return CATALOG[kind].find((item) => item.id === id) ?? CATALOG[kind][0];
}

// ---- Phaser side ----

const RES = 2; // textures are drawn at 2x so they stay crisp when they wobble

// Points a Phaser Image at the item's art, with (0, 0) as its anchor.
export function showItemArt(scene, image, item) {
  const key = `item-${item.id}`;
  const [left, top, w, h] = item.box;
  if (!scene.textures.exists(key)) {
    const tex = scene.textures.createCanvas(key, w * RES, h * RES);
    const ctx = tex.getContext();
    ctx.scale(RES, RES);
    ctx.translate(-left, -top);
    item.draw(ctx);
    tex.refresh();
  }
  return image.setTexture(key).setScale(1 / RES).setOrigin(-left / w, -top / h);
}

// Draws clock hands for the current time into a Phaser Graphics.
export function drawClockHands(g, hands, now = new Date()) {
  const h = (now.getHours() % 12) + now.getMinutes() / 60;
  const m = now.getMinutes() + now.getSeconds() / 60;
  const s = now.getSeconds();
  const hand = (len, frac, width, color) => {
    const a = frac * Math.PI * 2 - Math.PI / 2;
    g.lineStyle(width, color, 1);
    g.lineBetween(hands.x, hands.y, hands.x + Math.cos(a) * len, hands.y + Math.sin(a) * len);
  };
  g.clear();
  hand(hands.len[0], h / 12, 3.5, hands.color);
  hand(hands.len[1], m / 60, 2.5, hands.color);
  hand(hands.len[2], s / 60, 1, hands.second);
  g.fillStyle(hands.color, 1);
  g.fillCircle(hands.x, hands.y, 3);
}

// ---- shop preview ----

const css = (n, a = 1) => `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;

// Draws an item, lit up (lamps) or showing 10:10 (clocks), centred in a canvas.
export function drawPreview(canvas, item, width, height) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext('2d');
  const [left, top, w, h] = item.box;
  const s = Math.min(width / w, height / h) * (item.previewScale ?? 0.78);
  ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * (width / 2 - (left + w / 2) * s), dpr * (height / 2 - (top + h / 2) * s));

  const { bulb, hands } = item;
  if (bulb) {
    const r = Math.max(w, h) * 0.75;
    const g = ctx.createRadialGradient(bulb.x, bulb.y, 0, bulb.x, bulb.y, r);
    g.addColorStop(0, css(item.glow, 0.55));
    g.addColorStop(1, css(item.glow, 0));
    ctx.fillStyle = g;
    ctx.fillRect(bulb.x - r, bulb.y - r, r * 2, r * 2);
  }
  item.draw(ctx);
  if (bulb) circle(ctx, css(bulb.on[0], bulb.on[1]), bulb.x, bulb.y, bulb.r);
  if (hands) {
    const hand = (len, frac, lw, color) => {
      const a = frac * Math.PI * 2 - Math.PI / 2;
      line(ctx, css(color), lw, hands.x, hands.y, hands.x + Math.cos(a) * len, hands.y + Math.sin(a) * len);
    };
    hand(hands.len[0], 10.17 / 12, 3.5, hands.color);
    hand(hands.len[1], 10 / 60, 2.5, hands.color);
    hand(hands.len[2], 30 / 60, 1, hands.second);
    circle(ctx, css(hands.color), hands.x, hands.y, 3);
  }
}
