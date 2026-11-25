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
  document.documentElement.style.setProperty('--app-w', `${initView.vw}px`);
  document.documentElement.style.setProperty('--app-h', `${initView.vh}px`);
  document.body.classList.toggle('wide-landscape', initView.wide);
  document.body.classList.toggle('short-landscape', initView.vw > initView.vh && initView.vh <= 360);
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
    resizeTimer = setTimeout(() => {
      syncGameViewport(game);
      applyTouchBodyClass();
    }, 50);
  };
  const onOrientation = () => {
    setTimeout(() => { syncGameViewport(game); applyTouchBodyClass(); }, 100);
    setTimeout(() => { syncGameViewport(game); applyTouchBodyClass(); }, 320);
  };
  window.addEventListener('resize', onResize, {passive: true});
  window.addEventListener('orientationchange', onOrientation, {passive: true});
  window.visualViewport?.addEventListener('resize', onResize, {passive: true});
  window.visualViewport?.addEventListener('scroll', onResize, {passive: true});
  // Block iOS Safari / WeChat accidental pinch & double-tap smart zoom on UI overlays
  const blockZoom = e => e.preventDefault();
  document.addEventListener('gesturestart', blockZoom, {passive: false});
  document.addEventListener('gesturechange', blockZoom, {passive: false});
  document.addEventListener('dblclick', blockZoom, {passive: false});
}
boot();
