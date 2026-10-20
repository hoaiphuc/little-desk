import Phaser from 'phaser';
import { makeHotspot } from '../utils/hotspot.js';
import { bubble } from '../utils/fx.js';
import sfx from '../audio/sfx.js';
import { pick } from '../utils/i18n.js';

const HOODIE = 0x7d9ec0;
const HOODIE_DARK = 0x6c8db0;
const SKIN = 0xeebf9c;
const HAIR = 0x3a2622;
const SLEEVE = 17;

// Draws a hoodie sleeve through `pts` (shoulder, elbow, wrist, ...) with
// rounded joints and a darker outline so it reads against the body, then
// (unless `hand` is false) a cuff and a hand at the end.
function drawArm(g, pts, { hand = true } = {}) {
  const pass = (color, width) => {
    g.lineStyle(width, color, 1);
    g.fillStyle(color, 1);
    pts.forEach((p, i) => {
      if (i) g.lineBetween(pts[i - 1][0], pts[i - 1][1], p[0], p[1]);
      g.fillCircle(p[0], p[1], width / 2);
    });
  };
  pass(HOODIE_DARK, SLEEVE + 3);
  pass(HOODIE, SLEEVE);
  if (!hand) return;
  const [wx, wy] = pts[pts.length - 1];
  const [px, py] = pts[pts.length - 2];
  const len = Math.hypot(wx - px, wy - py) || 1;
  const ux = (wx - px) / len;
  const uy = (wy - py) / len;
  g.fillStyle(HOODIE_DARK, 1);
  g.fillCircle(wx, wy, SLEEVE / 2 - 1.5); // cuff
  g.fillStyle(SKIN, 1);
  g.fillCircle(wx + ux * 6, wy + uy * 6, 6.5); // hand, just past the cuff
}

// Resting on the desk: upper arms down to the elbows, forearms reaching
// forward past the body (seen from behind: slightly up the screen and
// tucked behind the torso, so only the hands peek out).
// The desk top runs from y = -88 (far edge) to -45 here, so elbows and hands land on it.
const SHOULDER = [38, -112];
const ELBOW = [56, -72];
const WRIST = [51, -86];
const mirror = (pts) => pts.map(([x, y]) => [-x, y]);

// The person at the desk, seen from behind, looking out of the window.
// (x, y) is the bottom-centre of their body; animations pivot from there.
export default class Student {
  constructor(scene, x, y) {
    this.scene = scene;
    this.container = scene.add.container(x, y).setDepth(25);
    this.inner = scene.add.container(0, 0); // breathing happens here
    this.container.add(this.inner);

    const body = scene.add.graphics();
    body.fillStyle(SKIN, 1);
    body.fillRect(-9, -140, 18, 14); // neck
    body.fillStyle(HOODIE, 1);
    body.fillRoundedRect(-44, -128, 88, 140, 34);
    body.fillStyle(HOODIE_DARK, 1);
    body.fillRoundedRect(-30, -132, 60, 28, 14); // hood
    body.lineStyle(2, HOODIE_DARK, 1);
    body.lineBetween(0, -100, 0, 10);

    // Each resting arm is two layers: the forearm and hand go behind the
    // body, the upper arm in front. Both live in one object per side so they
    // hide together; the forearm alone dips when typing.
    const restArm = (flip) => {
      const pts = (p) => (flip ? mirror(p) : p);
      const fore = scene.add.graphics();
      drawArm(fore, pts([ELBOW, WRIST]));
      const upper = scene.add.graphics();
      drawArm(upper, pts([SHOULDER, ELBOW]), { hand: false });
      return {
        fore,
        upper,
        setVisible(v) {
          fore.setVisible(v);
          upper.setVisible(v);
        },
      };
    };
    this.leftArm = restArm(true);
    this.rightArm = restArm(false);

    // stretching: both arms straight up
    this.armsUp = scene.add.graphics();
    drawArm(this.armsUp, [[-38, -112], [-50, -150], [-45, -186]]);
    drawArm(this.armsUp, [[38, -112], [50, -150], [45, -186]]);
    this.armsUp.setVisible(false);

    // waving: drawn from the shoulder so it can swing around it
    this.waveArm = scene.add.graphics();
    drawArm(this.waveArm, [[0, 0], [18, -32], [14, -64]]);
    this.waveArm.setPosition(38, -112).setVisible(false);

    // sipping: the right hand brings the mug up to the mouth
    this.sipArm = scene.add.graphics();
    drawArm(this.sipArm, [[38, -112], [60, -96], [34, -132]]);
    this.sipArm.fillStyle(0xe58f9a, 1);
    this.sipArm.fillRoundedRect(22, -150, 16, 16, 3);
    this.sipArm.setVisible(false);

    // head (back view: mostly hair, with a bun)
    const hg = scene.add.graphics();
    hg.fillStyle(SKIN, 1);
    hg.fillCircle(-26, 4, 5);
    hg.fillCircle(26, 4, 5);
    hg.fillStyle(HAIR, 1);
    hg.fillCircle(0, 0, 27);
    hg.fillCircle(0, -31, 14);
    hg.fillStyle(0xe8a0a0, 1);
    hg.fillRoundedRect(-11, -21, 22, 6, 3);
    hg.lineStyle(1.5, 0x5a3d35, 1);
    hg.lineBetween(-10, -16, -16, 20);
    hg.lineBetween(4, -18, 8, 22);
    this.head = scene.add.container(0, -152, [hg]);

    // the sipping arm sits behind the head, so the mug peeks out beside it
    this.inner.add([
      this.leftArm.fore, this.rightArm.fore,
      body,
      this.leftArm.upper, this.rightArm.upper,
      this.armsUp, this.sipArm, this.head, this.waveArm,
    ]);

    scene.tweens.add({
      targets: this.inner,
      scaleY: 1.012,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // idle: now and then they glance around
    scene.time.addEvent({
      delay: 7000,
      loop: true,
      callback: () => {
        if (!this.busy && Math.random() < 0.6) this.lookAt(Phaser.Math.Between(250, 710));
      },
    });

    makeHotspot(scene, {
      x,
      y: y - 120,
      w: 100,
      h: 150,
      depth: 25.5,
      label: 'student.label',
      onClick: () => this.stretch(),
    });
  }

  say(text) {
    bubble(this.scene, this.container.x, this.container.y - 190, text, { key: 'student' });
  }

  lookAt(worldX) {
    const dx = Phaser.Math.Clamp((worldX - this.container.x) / 300, -1, 1);
    this.scene.tweens.killTweensOf(this.head);
    this.scene.tweens.add({
      targets: this.head,
      x: dx * 6,
      rotation: dx * 0.14,
      duration: 350,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.scene.tweens.add({ targets: this.head, x: 0, rotation: 0, delay: 1600, duration: 500 });
      },
    });
  }

  stretch() {
    if (this.busy) return;
    this.busy = true;
    sfx.stretch();
    this.leftArm.setVisible(false);
    this.rightArm.setVisible(false);
    this.armsUp.setVisible(true);
    this.scene.tweens.add({ targets: this.head, y: -156, duration: 400, yoyo: true, hold: 500 });
    this.say(pick(this.scene.mapId === 'map-countryside' ? 'student.thoughtsCountry' : 'student.thoughts'));
    this.scene.time.delayedCall(1400, () => {
      this.armsUp.setVisible(false);
      this.leftArm.setVisible(true);
      this.rightArm.setVisible(true);
      this.busy = false;
    });
  }

  wave() {
    if (this.busy) return;
    this.busy = true;
    this.rightArm.setVisible(false);
    this.waveArm.setVisible(true).setAngle(-10);
    this.scene.tweens.add({ targets: this.waveArm, angle: 15, duration: 160, yoyo: true, repeat: 3 });
    this.scene.time.delayedCall(1300, () => {
      this.waveArm.setVisible(false);
      this.rightArm.setVisible(true);
      this.busy = false;
    });
  }

  // Little taps: each arm dips toward the keyboard in turn.
  type() {
    const t = this.scene.tweens;
    t.add({ targets: this.leftArm.fore, y: 3, duration: 80, yoyo: true, repeat: 3 });
    t.add({ targets: this.rightArm.fore, y: 3, duration: 80, yoyo: true, repeat: 3, delay: 40 });
    t.add({ targets: this.head, y: -149, duration: 160, yoyo: true });
  }

  sip() {
    if (this.busy) return;
    this.busy = true;
    this.rightArm.setVisible(false);
    this.sipArm.setVisible(true);
    this.scene.tweens.add({ targets: this.head, y: -156, rotation: 0.08, duration: 300, yoyo: true, hold: 300 });
    this.scene.time.delayedCall(900, () => {
      this.sipArm.setVisible(false);
      this.rightArm.setVisible(true);
      this.busy = false;
    });
  }
}
