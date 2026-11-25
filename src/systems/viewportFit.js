// Non-stretched pixel-perfect widescreen viewport controller for mobile landscape phones.
// Keeps logical height locked at 360px and expands logical width (640..832px) to match
// 19.5:9 / 20:9 / 21:9 phone screens with 1:1 square pixels (ZERO stretching, ZERO side bars).

export const BASE_W = 640;
export const BASE_H = 360;
export const MAX_WIDE_W = 832;

export function isWideLandscapeViewport() {
  if (typeof window === 'undefined') return false;
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w <= h || h <= 0) return false;
  // Activate full-bleed widescreen on landscape phones / compact touch landscape screens
  const coarse = window.matchMedia?.('(pointer: coarse)')?.matches;
  const isMobileLandscape = h <= 560 || (coarse && h <= 640);
  return isMobileLandscape && (w / h) > (BASE_W / BASE_H + 0.02);
}

export function computeViewMetrics() {
  if (!isWideLandscapeViewport()) {
    return {w: BASE_W, h: BASE_H, padX: 0, wide: false};
  }
  const aspect = window.innerWidth / window.innerHeight;
  const rawW = Math.round((BASE_H * aspect) / 2) * 2;
  const w = Math.max(BASE_W, Math.min(MAX_WIDE_W, rawW));
  const padX = Math.round((w - BASE_W) / 2);
  return {w, h: BASE_H, padX, wide: w > BASE_W};
}

export function getViewMetrics(scene) {
  const w = scene?.scale?.width || window.BRAND_QUEST_VIEW?.w || BASE_W;
  const h = scene?.scale?.height || BASE_H;
  const padX = Math.round((w - BASE_W) / 2);
  return {w, h, padX, wide: w > BASE_W};
}

export function syncGameViewport(game) {
  const m = computeViewMetrics();
  window.BRAND_QUEST_VIEW = m;
  document.body.classList.toggle('wide-landscape', m.wide);
  const vp = document.getElementById('viewport');
  if (vp) {
    if (m.wide) {
      vp.style.setProperty('--vp-aspect', `${m.w} / ${m.h}`);
    } else {
      vp.style.removeProperty('--vp-aspect');
    }
  }
  if (game?.scale && (game.scale.width !== m.w || game.scale.height !== m.h)) {
    game.scale.resize(m.w, m.h);
    for (const s of game.scene.getScenes(true)) {
      s.events.emit('bq-resize', m);
    }
  }
  return m;
}

export function applyCenteredPanoramaCamera(scene) {
  const {padX} = getViewMetrics(scene);
  scene.cameras?.main?.setScroll(-padX, 0);
}
