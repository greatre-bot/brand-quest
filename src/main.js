import './style.css';
import './viewport.css';
import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene.js';
import { IntroScene } from './scenes/IntroScene.js';
import { TransitScene } from './scenes/TransitScene.js';
import { WorldScene } from './scenes/WorldScene.js';
import { MixueBarScene } from './scenes/MixueBarScene.js';
import { EndingScene } from './scenes/EndingScene.js';

async function boot() {
  if (document.fonts?.load) {
    await Promise.race([
      document.fonts.load('12px FusionPixel').catch(() => {}),
      new Promise(r => setTimeout(r, 800))
    ]);
  }
  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    parent: 'game',
    backgroundColor: '#0a222a',
    width: 640, height: 360,
    pixelArt: true, roundPixels: true,
    antialias: false, antialiasGL: false,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.NO_CENTER },
    render: { pixelArt: true },
    scene: [MenuScene, IntroScene, TransitScene, WorldScene, MixueBarScene, EndingScene]
  });
  window.BRAND_QUEST = game;
}
boot();
