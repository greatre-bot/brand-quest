// Non-stretched pixel-perfect widescreen viewport controller for mobile landscape phones,
// including ultra-short iOS Safari (with address + tab bar) and WeChat in-app browsers.
// Keeps logical height locked at 360px and expands logical width (640..1248px) with 1:1
// square pixels (ZERO stretching, ZERO side bars even at 3.4:1 browser-chrome aspect!).

export const BASE_W = 640;
export const BASE_H = 360;
export const MAX_WIDE_W = 1248;

export function isWeChat() {
  if (typeof navigator === 'undefined') return false;
  return /MicroMessenger/i.test(navigator.userAgent || '');
}

export function isIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);
}

export function isStandalonePwa() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator?.standalone === true);
}

export function canNativeFullscreen() {
  if (typeof document === 'undefined') return false;
  if (isWeChat() || isIOS()) return false;
  const root = document.documentElement;
  return Boolean(root?.requestFullscreen || root?.webkitRequestFullscreen);
}

export function getViewportBox() {
  if (typeof window === 'undefined') return {vw: BASE_W, vh: BASE_H};
  const vv = window.visualViewport;
  // Ignore transient browser pinch/double-tap zoom frames so --app-w/--app-h never shrink and flip layouts.
  if (vv && vv.scale && vv.scale > 1.03) {
    return {
      vw: Math.max(1, Math.round(window.innerWidth || vv.width * vv.scale || BASE_W)),
      vh: Math.max(1, Math.round(window.innerHeight || vv.height * vv.scale || BASE_H))
    };
  }
  const vw = Math.max(1, Math.round(vv?.width || window.innerWidth || BASE_W));
  const vh = Math.max(1, Math.round(vv?.height || window.innerHeight || BASE_H));
  return {vw, vh};
}

export function isWideLandscapeViewport() {
  if (typeof window === 'undefined') return false;
  const {vw, vh} = getViewportBox();
  if (vw <= vh || vh <= 0) return false;
  // Activate full-bleed widescreen on landscape phones / compact touch landscape screens
  const coarse = window.matchMedia?.('(pointer: coarse)')?.matches;
  const isMobileLandscape = vh <= 560 || (coarse && vh <= 640);
  return isMobileLandscape && (vw / vh) > (BASE_W / BASE_H + 0.02);
}

export function computeViewMetrics() {
  const {vw, vh} = getViewportBox();
  if (!isWideLandscapeViewport()) {
    return {w: BASE_W, h: BASE_H, padX: 0, wide: false, vw, vh};
  }
  const aspect = vw / vh;
  const rawW = Math.round((BASE_H * aspect) / 2) * 2;
  const w = Math.max(BASE_W, Math.min(MAX_WIDE_W, rawW));
  const padX = Math.round((w - BASE_W) / 2);
  return {w, h: BASE_H, padX, wide: w > BASE_W, vw, vh};
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
  const docEl = document.documentElement;
  if (docEl) {
    docEl.style.setProperty('--app-w', `${m.vw}px`);
    docEl.style.setProperty('--app-h', `${m.vh}px`);
  }
  document.body.classList.toggle('wide-landscape', m.wide);
  document.body.classList.toggle('short-landscape', m.vw > m.vh && m.vh <= 360);
  document.body.classList.toggle('is-wechat', isWeChat());
  document.body.classList.toggle('is-ios', isIOS());
  document.body.classList.toggle('is-standalone', isStandalonePwa());

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
