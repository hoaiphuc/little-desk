import Phaser from 'phaser';
import RoomScene from './scenes/RoomScene.js';

// The game "canvas" is 960x540 and scales to fit any screen.
// Saved on window so you can poke at it from the browser console while debugging.
window.game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#15112a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [RoomScene],
});
