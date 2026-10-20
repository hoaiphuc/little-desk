import { t } from './i18n.js';

// Everything clickable in the game goes through these two helpers, so hover
// and click feel the same everywhere.

// Adds hover tooltip + click handling to any interactive game object.
// `label` is a text key from utils/i18n.js, translated on every hover so it
// follows the language setting.
// `wobble` is the object that squishes on hover/click (optional).
export function bindHover(scene, obj, { label, onClick, wobble }) {
  obj.on('pointerover', () => {
    scene.tooltip.show(t(label));
    if (wobble) scene.tweens.add({ targets: wobble, scale: 1.05, duration: 120 });
  });
  obj.on('pointerout', () => {
    scene.tooltip.hide();
    if (wobble) scene.tweens.add({ targets: wobble, scale: 1, duration: 120 });
  });
  obj.on('pointerdown', (pointer) => {
    if (wobble) {
      scene.tweens.add({
        targets: wobble,
        scaleX: 1.12,
        scaleY: 0.92,
        duration: 90,
        yoyo: true,
      });
    }
    onClick?.(pointer);
  });
  return obj;
}

// Creates an invisible clickable rectangle centred on (x, y).
// Its depth decides which hotspot wins when two overlap (higher = on top).
export function makeHotspot(scene, { x, y, w, h, depth = 0, label, onClick, wobble }) {
  const zone = scene.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
  zone.setDepth(depth);
  return bindHover(scene, zone, { label, onClick, wobble });
}
