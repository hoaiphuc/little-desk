import Phaser from 'phaser';
import Sky from '../objects/Sky.js';
import Street from '../objects/Street.js';
import Student from '../objects/Student.js';
import { createRoom, createDesk } from '../objects/Room.js';
import { createProps } from '../objects/Props.js';
import Lofi from '../audio/lofi.js';
import TaskBoard from '../ui/TaskBoard.js';
import Settings from '../ui/Settings.js';
import Shop from '../ui/Shop.js';
import CoinHud from '../ui/CoinHud.js';
import { createTooltip, makeGlowTexture } from '../utils/fx.js';
import { t } from '../utils/i18n.js';
import Countryside from '../objects/Countryside.js';
import { equippedItem } from '../objects/items.js';

// The whole game is one cozy spot to study: a city room, or (bought in the
// shop) a porch in the countryside. Depth (z-order) guide:
//   0-6   outside: sky, stars, moon, buildings/fields, street/road, people
//   10-12 wall/porch, window frame, curtains, fairy lights, windowsill props
//   20-26 desk, desk props, student, chair
//   30-31 room darkness + lamp light
//   45-50 floating text, speech bubbles, tooltip
export default class RoomScene extends Phaser.Scene {
  constructor() {
    super('Room');
  }

  // `data.arrived` is set when we restart the scene after moving to a new place.
  create(data = {}) {
    makeGlowTexture(this);
    this.tooltip = createTooltip(this);
    // The HTML overlays and the music outlive scene restarts, so make them once.
    this.lofi ??= new Lofi();
    this.settings ??= new Settings({ lofi: this.lofi });
    this.taskBoard ??= new TaskBoard({ onClose: (tasks) => this.onTaskBoardClosed(tasks) });
    this.shop ??= new Shop({ onClose: (bought) => this.onShopClosed(bought) });
    this.coinHud ??= new CoinHud({ onClick: () => this.openShop() });
    this.events.once('shutdown', () => (this.lofi.onBeat = null)); // the radio is rebuilt next time

    // Where we are is something you buy in the shop.
    this.mapId = equippedItem('map').id;
    this.moving = false;
    if (this.mapId === 'map-countryside') {
      // the open view between the porch walls
      const W = { x: 165, y: 30, w: 645, h: 302 };
      this.sky = new Sky(this, W);
      this.countryside = new Countryside(this, W);
    } else {
      // the window opening that everything outside is drawn inside
      const W = { x: 220, y: 40, w: 520, h: 290 };
      this.sky = new Sky(this, W);
      this.street = new Street(this, W);
      createRoom(this, W);
    }

    createDesk(this);
    this.student = new Student(this, 480, 470);
    this.darkness = this.createDarkness();
    createProps(this);

    if (data.arrived) {
      this.cameras.main.fadeIn(600, 10, 8, 24);
      this.time.delayedCall(900, () => this.student.say(t(`map.arrive.${this.mapId}`)));
    } else {
      this.tooltip.show(t('intro'));
      this.time.delayedCall(5000, () => this.tooltip.hide());
    }
  }

  // Each place has its own shop: the corner shop in the city, Grandma Tư's
  // grocery in the countryside. Same stock, different sign.
  openShop() {
    this.shop.open({ title: this.mapId === 'map-countryside' ? 'shop.titleCountry' : 'shop.title' });
  }

  // Moving happens once you leave the shop, so you see the new place appear.
  onShopClosed(bought) {
    if (equippedItem('map').id !== this.mapId) this.moveToNewPlace();
    else if (bought) this.time.delayedCall(250, () => this.student.say(t('shop.thanks')));
  }

  moveToNewPlace() {
    if (this.moving) return;
    this.moving = true;
    this.cameras.main.fadeOut(500, 10, 8, 24);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.restart({ arrived: true }));
  }

  // The student reacts to how the to-do list looks after you close it.
  onTaskBoardClosed(tasks) {
    const left = tasks.filter((task) => !task.done).length;
    const msg =
      tasks.length === 0 ? t('tasks.closedEmpty') :
      left === 0 ? t('tasks.closedAllDone') :
      left === 1 ? t('tasks.closedOneLeft') :
      t('tasks.closedLeft', { n: left });
    this.time.delayedCall(250, () => this.student.say(msg));
  }

  // A shadow over the whole room. The desk lamp fades it in and out.
  createDarkness() {
    const { width, height } = this.scale;
    return this.add.rectangle(0, 0, width, height, 0x0a0818).setOrigin(0).setDepth(30).setAlpha(0.12);
  }
}
