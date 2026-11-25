import './style.css';
import './viewport.css';
import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene.js';
import { IntroScene } from './scenes/IntroScene.js';
import { TransitScene } from './scenes/TransitScene.js';
import { WorldScene } from './scenes/WorldScene.js';
import { MixueBarScene } from './scenes/MixueBarScene.js';
import { EndingScene } from './scenes/EndingScene.js';
import { applyTouchBodyClass } from './systems/touchControls.js';
import { computeViewMetrics, syncGameViewport } from './systems/viewportFit.js';

async function boot() {
  applyTouchBodyClass();
  const initView = computeViewMetrics();
  window.BRAND_QUEST_VIEW = initView;
  document.body.classList.toggle('wide-landscape', initView.wide);
  const vp = document.getElementById('viewport');
  if (vp && initView.wide) vp.style.setProperty('--vp-aspect', `${initView.w} / ${initView.h}`);

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
    width: initView.w, height: initView.h,
    pixelArt: true, roundPixels: true,
    antialias: false, antialiasGL: false,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.NO_CENTER },
    render: { pixelArt: true },
    scene: [MenuScene, IntroScene, TransitScene, WorldScene, MixueBarScene, EndingScene]
  });
  window.BRAND_QUEST = game;
  syncGameViewport(game);

  let resizeTimer = null;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => syncGameViewport(game), 60);
  };
  window.addEventListener('resize', onResize, {passive: true});
  window.addEventListener('orientationchange', () => setTimeout(() => syncGameViewport(game), 120), {passive: true});
}
boot();
