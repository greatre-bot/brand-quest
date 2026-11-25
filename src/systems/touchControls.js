import {sound} from './audio.js';
import {dismountVehicle, honkScooter} from './vehicle.js';

function el(tag, cls = '', text = '') {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text) node.textContent = text;
  return node;
}

const PREF_KEY = 'brandquest-v1-vpad';

export const touchInput = {
  dx: 0,
  dy: 0,
  shift: false
};

let pref = readPref(); // 'auto' | 'on' | 'off'
let mode = 'none'; // 'none' | 'world' | 'mixue_bar'
let activeWorldScene = null;
let activeMixueScene = null;
let padDom = null;
let padBound = false;

function readPref() {
  try {
    const q = new URLSearchParams(window.location.search).get('touch');
    if (q === '1' || q === 'on') return 'on';
    if (q === '0' || q === 'off') return 'off';
    const saved = localStorage.getItem(PREF_KEY);
    if (saved === 'on' || saved === 'off' || saved === 'auto') return saved;
  } catch { /* ignore */ }
  return 'auto';
}

export function getTouchPref() {
  return pref;
}

export function isTouchDevice() {
  if (typeof window === 'undefined') return false;
  const coarse = window.matchMedia?.('(pointer: coarse)')?.matches;
  const hasTouch = (navigator.maxTouchPoints || 0) > 0 || 'ontouchstart' in window;
  const smallScreen = window.innerWidth <= 920 || window.innerHeight <= 500;
  return Boolean(coarse || (hasTouch && window.innerWidth <= 1280) || smallScreen);
}

export function isTouchEnabled() {
  if (pref === 'on') return true;
  if (pref === 'off') return false;
  return isTouchDevice();
}

export function adaptTouchText(str) {
  if (typeof str !== 'string' || !str || !isTouchEnabled()) return str;
  let s = str;
  s = s.replace(/Esc\s*×/g, '×');
  s = s.replace(/（按\s*1\s*\/\s*2\s*\/\s*3\s*对比并生成结局）/g, '（点击下方方案对比并生成结局）');
  s = s.replace(/按空格键鸣笛/g, '点「鸣笛」键鸣笛');
  s = s.replace(/按「空格」/g, '点「下钩」');
  s = s.replace(/按空格/g, '点「下钩」');
  s = s.replace(/按\s*E\s*/g, '点「互动」');
  s = s.replace(/按\s*F\s*/g, '点「拍照」');
  s = s.replace(/按\s*M\s*/g, '点「班车」');
  s = s.replace(/按\s*J\s*/g, '点「结局」');
  s = s.replace(/按\s*U\s*/g, '点「成就」');
  s = s.replace(/按\s*Tab\s*/g, '点「手账」');
  s = s.replace(/按\s*Esc\s*/g, '点关闭');
  s = s.replace(/按\s*R\s*/g, '点「重来」');
  s = s.replace(/按\s*T\s*/g, '点糖浆瓶');
  s = s.replace(/按\s*V\s*/g, '点静音键');
  s = s.replace(/「拍照\s*F」/g, '「拍照」');
  s = s.replace(/底部已解锁「拍照」/g, '右下已解锁「拍照」');
  s = s.replace(/\s*·\s*\[[0-9A-Za-z/←→↑↓ ]+\]/g, '');
  s = s.replace(/\s*\[(?:Enter|Esc|Tab|Shift|Space|E|F|R|M|J|U|V|G|T|1|2|3|4|5|6|A\s*\/\s*←|D\s*\/\s*→|空格)\]/gi, '');
  s = s.replace(/WASD\s*\/\s*方向键/g, '左下方向键');
  s = s.replace(/Shift\s*加速/g, '按住「加速」');
  return s;
}

export function cycleTouchPref() {
  pref = pref === 'auto' ? 'on' : pref === 'on' ? 'off' : 'auto';
  try { localStorage.setItem(PREF_KEY, pref); } catch { /* ignore */ }
  applyTouchBodyClass();
  return pref;
}

export function setTouchPref(next) {
  if (!['auto', 'on', 'off'].includes(next)) return pref;
  pref = next;
  try { localStorage.setItem(PREF_KEY, pref); } catch { /* ignore */ }
  applyTouchBodyClass();
  return pref;
}

export function resetTouchInput() {
  touchInput.dx = 0;
  touchInput.dy = 0;
  touchInput.shift = false;
  if (!padDom) return;
  for (const btn of padDom.root.querySelectorAll('.vpad-btn.pressed, .vpad-dir.pressed')) {
    btn.classList.remove('pressed');
  }
}

export function applyTouchBodyClass() {
  if (typeof document === 'undefined') return;
  const enabled = isTouchEnabled();
  document.body.classList.toggle('touch-on', enabled);
  document.body.dataset.touchMode = mode;
  if (!enabled) resetTouchInput();
  if (padDom) {
    const show = enabled && mode !== 'none';
    padDom.root.hidden = !show;
    padDom.worldWrap.hidden = mode !== 'world';
    padDom.mixueWrap.hidden = mode !== 'mixue_bar';
    if (padDom.topDeck) {
      padDom.topDeck.hidden = !(enabled && mode === 'world');
    }
  }
  if (activeWorldScene && mode === 'world') {
    syncTouchHud(activeWorldScene);
  }
}

function makeBtn(cls, label, sub = '') {
  const b = el('button', 'vpad-btn ' + cls);
  b.type = 'button';
  b.append(el('span', 'vpad-main', label));
  if (sub) b.append(el('small', 'vpad-sub', sub));
  return b;
}

export function mountTouchPad() {
  if (padDom && document.getElementById('mobile-pad')) return padDom;
  document.getElementById('mobile-pad')?.remove();
  document.getElementById('mobile-top-deck')?.remove();

  // Portrait-only top handheld status & quick nav bar (placed ABOVE #viewport so game screen sits in center!)
  const topDeck = el('aside', 'vpad-top-deck');
  topDeck.id = 'mobile-top-deck';
  topDeck.setAttribute('aria-label', '竖屏任务与快捷导航');
  topDeck.hidden = true;

  const deckTop = el('div', 'vpad-deck-top');
  const deckHint = el('div', 'vpad-deck-hint', '左下方向键漫游 · 右下淡黄按键互动');
  const deckNav = el('div', 'vpad-deck-nav');
  const navTasks = makeBtn('vpad-nav-btn', '委托');
  const navJournal = makeBtn('vpad-nav-btn', '手账');
  const navMap = makeBtn('vpad-nav-btn', '班车');
  const navAch = makeBtn('vpad-nav-btn', '成就');
  const navEnd = makeBtn('vpad-nav-btn vpad-end-pill', '结局');
  navEnd.hidden = true;
  deckNav.append(navTasks, navJournal, navMap, navAch, navEnd);
  deckTop.append(deckHint, deckNav);
  topDeck.append(deckTop);

  const viewportEl = document.getElementById('viewport');
  if (viewportEl?.parentNode) viewportEl.parentNode.insertBefore(topDeck, viewportEl);
  else document.body.prepend(topDeck);

  const root = el('aside', 'vpad');
  root.id = 'mobile-pad';
  root.setAttribute('aria-label', '手机端淡黄色虚拟按键');
  root.hidden = true;

  // === 1. WORLD EXPLORATION PAD (D-Pad + Action Buttons) ===
  const worldWrap = el('div', 'vpad-world');

  // Main Left / Right thumb controls
  const thumbRow = el('div', 'vpad-thumbs');

  // Left: Slideable 8-way Pale-Yellow Pixel Cross D-Pad
  const dpad = el('div', 'vpad-dpad');
  dpad.setAttribute('role', 'group');
  dpad.setAttribute('aria-label', '方向键');
  const dirUp = el('div', 'vpad-dir up', '▲');
  const dirDown = el('div', 'vpad-dir down', '▼');
  const dirLeft = el('div', 'vpad-dir left', '◀');
  const dirRight = el('div', 'vpad-dir right', '▶');
  const dirCenter = el('div', 'vpad-dir center', '·');
  dpad.append(dirUp, dirLeft, dirCenter, dirRight, dirDown);

  // Right: Ergonomic Pale-Yellow Pixel Action Cluster
  const actionsWrap = el('div', 'vpad-actions');
  const rowTop = el('div', 'vpad-act-row top');
  const rowBot = el('div', 'vpad-act-row bot');

  const btnPhoto = makeBtn('vpad-photo', '拍照');
  btnPhoto.hidden = true;
  const btnHorn = makeBtn('vpad-horn', '鸣笛', '嘀嘀');
  btnHorn.hidden = true;
  const btnDismount = makeBtn('vpad-dismount', '下车', '停车');
  btnDismount.hidden = true;
  const btnEnd = makeBtn('vpad-ending', '结局');
  btnEnd.hidden = true;

  const btnSprint = makeBtn('vpad-sprint', '加速', '按住');
  const btnInteract = makeBtn('vpad-interact primary', '互动');

  rowTop.append(btnPhoto, btnHorn, btnDismount, btnEnd);
  rowBot.append(btnSprint, btnInteract);
  actionsWrap.append(rowTop, rowBot);

  thumbRow.append(dpad, actionsWrap);
  worldWrap.append(thumbRow);

  // === 2. MIXUE BAR PORTRAIT HANDHELD DECK (shown ONLY in portrait phone while inside MixueBarScene) ===
  const mixueWrap = el('div', 'vpad-mixue');
  mixueWrap.hidden = true;
  const mNote = el('div', 'vpad-mixue-note', '可直接点按上方吧台，或用下方淡黄快捷按键调饮（横屏体验更佳）');
  const mRow1 = el('div', 'vpad-mixue-row');
  const mLemon = makeBtn('vpad-mx', '柠檬', '加料');
  const mBoba = makeBtn('vpad-mx', '珍珠', '加料');
  const mStraw = makeBtn('vpad-mx', '草莓', '加料');
  const mIce = makeBtn('vpad-mx', '加冰', '冰块');
  const mSugar = makeBtn('vpad-mx', '糖度', '切换');
  mRow1.append(mLemon, mBoba, mStraw, mIce, mSugar);

  const mRow2 = el('div', 'vpad-mixue-row');
  const mPour = makeBtn('vpad-mx wide primary', '按住注液', '绿线松手');
  const mTray = makeBtn('vpad-mx', '放托盘', '加盖');
  const mTrash = makeBtn('vpad-mx', '重来', '换杯');
  mRow2.append(mPour, mTray, mTrash);

  const mRow3 = el('div', 'vpad-mixue-row');
  const mCone = makeBtn('vpad-mx', '甜筒', '按住挤');
  const mBobaSun = makeBtn('vpad-mx', '波霸', '按住挤');
  const mMangoSun = makeBtn('vpad-mx', '芒果', '按住挤');
  const mBell = makeBtn('vpad-mx wide primary', '拍铃上餐', '出餐');
  mRow3.append(mCone, mBobaSun, mMangoSun, mBell);

  mixueWrap.append(mNote, mRow1, mRow2, mRow3);

  root.append(worldWrap, mixueWrap);
  document.body.append(root);

  // --- Wire smooth multi-touch slideable D-pad ---
  let dpadPointerId = null;
  const updateDpadFromPoint = (clientX, clientY) => {
    const rect = dpad.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rx = clientX - cx;
    const ry = clientY - cy;
    const dead = Math.max(10, rect.width * 0.11);
    const dist = Math.hypot(rx, ry);
    let dx = 0;
    let dy = 0;
    if (dist >= dead) {
      const ax = Math.abs(rx);
      const ay = Math.abs(ry);
      if (ax > ay * 0.42) dx = rx > 0 ? 1 : -1;
      if (ay > ax * 0.42) dy = ry > 0 ? 1 : -1;
    }
    touchInput.dx = dx;
    touchInput.dy = dy;
    dirLeft.classList.toggle('pressed', dx < 0);
    dirRight.classList.toggle('pressed', dx > 0);
    dirUp.classList.toggle('pressed', dy < 0);
    dirDown.classList.toggle('pressed', dy > 0);
  };

  const clearDpad = () => {
    dpadPointerId = null;
    touchInput.dx = 0;
    touchInput.dy = 0;
    dirUp.classList.remove('pressed');
    dirDown.classList.remove('pressed');
    dirLeft.classList.remove('pressed');
    dirRight.classList.remove('pressed');
  };

  dpad.addEventListener('pointerdown', e => {
    if (dpadPointerId !== null) return;
    e.preventDefault();
    sound.unlock();
    dpadPointerId = e.pointerId;
    try { dpad.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    updateDpadFromPoint(e.clientX, e.clientY);
  });
  dpad.addEventListener('pointermove', e => {
    if (e.pointerId !== dpadPointerId) return;
    e.preventDefault();
    updateDpadFromPoint(e.clientX, e.clientY);
  });
  const endDpad = e => {
    if (e.pointerId !== dpadPointerId) return;
    clearDpad();
  };
  dpad.addEventListener('pointerup', endDpad);
  dpad.addEventListener('pointercancel', endDpad);
  dpad.addEventListener('lostpointercapture', () => clearDpad());

  // --- Wire hold helper (multi-touch safe) ---
  const bindHold = (btn, onDown, onUp) => {
    let pid = null;
    const stop = () => {
      if (pid === null) return;
      pid = null;
      btn.classList.remove('pressed');
      onUp();
    };
    btn.addEventListener('pointerdown', e => {
      if (pid !== null) return;
      e.preventDefault();
      sound.unlock();
      pid = e.pointerId;
      btn.classList.add('pressed');
      try { btn.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      onDown();
    });
    btn.addEventListener('pointerup', e => { if (e.pointerId === pid) stop(); });
    btn.addEventListener('pointercancel', e => { if (e.pointerId === pid) stop(); });
    btn.addEventListener('lostpointercapture', stop);
  };

  const bindTap = (btn, fn) => {
    btn.addEventListener('pointerdown', e => {
      e.preventDefault();
      sound.unlock();
      btn.classList.add('pressed');
      fn();
    });
    const up = () => btn.classList.remove('pressed');
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('pointerleave', up);
  };

  // World action buttons
  bindHold(btnSprint, () => { touchInput.shift = true; }, () => { touchInput.shift = false; });
  bindTap(btnInteract, () => {
    if (!activeWorldScene || activeWorldScene.overlay) return;
    activeWorldScene.tryInteract();
  });
  bindTap(btnPhoto, () => {
    if (!activeWorldScene || activeWorldScene.overlay) return;
    activeWorldScene.tryPhoto();
  });
  bindTap(btnHorn, () => {
    if (!activeWorldScene || activeWorldScene.overlay || !activeWorldScene.riding) return;
    honkScooter(activeWorldScene);
  });
  bindTap(btnDismount, () => {
    if (!activeWorldScene || activeWorldScene.overlay || !activeWorldScene.riding) return;
    dismountVehicle(activeWorldScene);
    syncTouchHud(activeWorldScene);
  });
  bindTap(btnEnd, () => {
    if (!activeWorldScene || activeWorldScene.overlay) return;
    if (activeWorldScene.session?.done) activeWorldScene.endCase();
  });

  // Portrait quick nav buttons
  navTasks.addEventListener('click', () => document.querySelector('[data-action="tasks"]')?.click());
  navJournal.addEventListener('click', () => activeWorldScene?.showJournal());
  navMap.addEventListener('click', () => activeWorldScene?.showMap());
  navAch.addEventListener('click', () => activeWorldScene?.showAchievements());
  navEnd.addEventListener('click', () => { if (activeWorldScene?.session?.done) activeWorldScene.endCase(); });

  // Mixue portrait barista shortcut buttons
  bindTap(mLemon, () => activeMixueScene?.addTopping('lemonade'));
  bindTap(mBoba, () => activeMixueScene?.addTopping('boba_tea'));
  bindTap(mStraw, () => activeMixueScene?.addTopping('strawberry_tea'));
  bindTap(mIce, () => activeMixueScene?.toggleIce());
  bindTap(mSugar, () => activeMixueScene?.toggleSugar());
  bindTap(mTray, () => activeMixueScene?.placeCupOnTray());
  bindTap(mTrash, () => activeMixueScene?.resetCupState(false));
  bindTap(mBell, () => activeMixueScene?.ringBellAndServe());
  bindHold(
    mPour,
    () => activeMixueScene?.startPour(activeMixueScene?.barState?.cupTopping || 'lemonade'),
    () => activeMixueScene?.stopPour()
  );
  bindHold(mCone, () => activeMixueScene?.pickDessertBase('cone', true), () => activeMixueScene?.stopSwirl());
  bindHold(mBobaSun, () => activeMixueScene?.pickDessertBase('boba_sundae', true), () => activeMixueScene?.stopSwirl());
  bindHold(mMangoSun, () => activeMixueScene?.pickDessertBase('mango_sundae', true), () => activeMixueScene?.stopSwirl());

  if (!padBound) {
    padBound = true;
    window.addEventListener('resize', () => applyTouchBodyClass(), {passive: true});
    window.addEventListener('orientationchange', () => setTimeout(() => applyTouchBodyClass(), 80), {passive: true});
    window.addEventListener('blur', () => resetTouchInput());
    window.BRAND_QUEST_TOUCH = {
      input: touchInput,
      isEnabled: isTouchEnabled,
      getPref: getTouchPref,
      setPref: setTouchPref,
      cyclePref: cycleTouchPref
    };
  }

  padDom = {
    root, topDeck, worldWrap, mixueWrap,
    deckHint, navEnd,
    btnInteract, btnSprint, btnPhoto, btnHorn, btnDismount, btnEnd
  };
  applyTouchBodyClass();
  return padDom;
}

export function setTouchSceneMode(nextMode, sceneRef = null) {
  mountTouchPad();
  resetTouchInput();
  mode = nextMode;
  if (nextMode === 'world') {
    activeWorldScene = sceneRef;
    activeMixueScene = null;
  } else if (nextMode === 'mixue_bar') {
    activeMixueScene = sceneRef;
    activeWorldScene = null;
  } else {
    activeWorldScene = null;
    activeMixueScene = null;
  }
  applyTouchBodyClass();
}

function actionWord(near, riding) {
  if (!near) return riding ? '下车' : '互动';
  if (near.kind === 'door') return '进出';
  if (near.kind === 'transport') return '乘车';
  if (near.kind === 'vehicle') return '骑车';
  if (near.kind === 'npc') return '交谈';
  if (near.kind === 'minigame') return '开始';
  if (near.kind === 'evidence') return '查看';
  return '互动';
}

export function syncTouchHud(scene) {
  if (!padDom || mode !== 'world' || !scene) return;
  const near = scene.near;
  const riding = Boolean(scene.riding);
  const canPhoto = Boolean(scene.session?.has('field_start'));
  const canEnd = Boolean(scene.session?.done);
  const modalOpen = Boolean(scene.overlay);

  padDom.root.classList.toggle('modal-open', modalOpen);
  padDom.topDeck?.classList.toggle('modal-open', modalOpen);

  // Update contextual Interact button text & golden ready highlight
  const mainLabel = padDom.btnInteract.querySelector('.vpad-main');
  const word = actionWord(near, riding);
  if (mainLabel) mainLabel.textContent = word;
  padDom.btnInteract.classList.toggle('ready', Boolean(near));

  // Contextual Photo / Riding / Ending buttons
  padDom.btnPhoto.hidden = !canPhoto;
  padDom.btnPhoto.classList.toggle('ready', Boolean(canPhoto && near?.kind === 'evidence' && !scene.session.photos.includes(near.key)));

  padDom.btnHorn.hidden = !riding;
  padDom.btnDismount.hidden = !riding;

  padDom.btnEnd.hidden = !canEnd || riding;
  padDom.navEnd.hidden = !canEnd;

  // Portrait deck info hint line
  const objText = document.getElementById('objective')?.textContent || '';
  if (riding) {
    padDom.deckHint.textContent = near
      ? `骑行中 · 附近：${near.label || near.name}（点「${word}」或「鸣笛」「下车」）`
      : '骑行中 · 左手滑方向盘，右手可「加速」「鸣笛」「下车」';
  } else if (near) {
    padDom.deckHint.textContent = near.kind === 'evidence'
      ? `可拍摄：${near.label || near.name}（点「拍照」或「查看」）`
      : `附近：${near.label || near.name}（点右侧淡黄「${word}」键）`;
  } else {
    padDom.deckHint.textContent = objText || '左下方向键漫游 · 右下淡黄按键互动';
  }
}
