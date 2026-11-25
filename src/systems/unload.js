import {openPanel, el, actions} from '../ui/panel.js';
import {sound} from './audio.js';
import crateUrl from '../../assets/pixel/props/crate.png';

const W = 580;
const H = 248;
const RAIL_Y = 30;
const FLOOR_Y = 216;
const TRUCK_DECK_Y = 186;
const CRATE_W = 42;
const CRATE_H = 30;
const IDLE_LEN = 38;

const CRATE_SPECS = [
  {id: 'C1', label: '液压阀', color: '#b83c36', trim: '#e66c65', startX: 82, bayX: 504},
  {id: 'B2', label: '滤芯箱', color: '#c7852b', trim: '#f0b656', startX: 132, bayX: 406},
  {id: 'A1', label: '密封件', color: '#2f7a68', trim: '#63b39c', startX: 182, bayX: 308}
];

const BAYS = [
  {id: 'A1', title: 'A1 密封件区', x: 308, color: '#2f7a68'},
  {id: 'B2', title: 'B2 滤芯区', x: 406, color: '#c7852b'},
  {id: 'C1', title: 'C1 液压阀区', x: 504, color: '#b83c36'}
];

export function openUnloadGame(scene) {
  const s = scene.session;
  if (!s.has('service_ticket')) {
    s.flag('service_ticket');
    scene.record('领取 K-07 卸货派工单，进入龙门吊控制台');
  }

  const box = openPanel(scene, '三一车间 · 龙门吊卸货台', 'unload', crateUrl);
  const scope = scene.panelScope, signal = scope.signal;

  const hud = el('div', 'crane-hud');
  const progressPill = el('strong', 'crane-prog', '已卸货：0 / 3');
  const smoothPill = el('span', 'crane-smooth', '平稳度：100%');
  const carryPill = el('span', 'crane-carry', '吊钩状态：空钩待命');
  hud.append(progressPill, carryPill, smoothPill);

  const stageWrap = el('div', 'crane-stage-wrap');
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  canvas.className = 'crane-canvas';
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const winOverlay = el('div', 'crane-overlay');
  winOverlay.hidden = true;
  stageWrap.append(canvas, winOverlay);

  const controls = el('div', 'crane-controls');
  const leftBtn = el('button', 'crane-btn', '◀ 左移 [A / ←]');
  const hookBtn = el('button', 'crane-btn primary', '▼ 下钩抓取 [空格]');
  const rightBtn = el('button', 'crane-btn', '右移 [D / →] ▶');
  controls.append(leftBtn, hookBtn, rightBtn);

  const status = el('div', 'order-status crane-status', '把三一黄黑龙门吊移到左侧货车上方，按「空格」抓箱，再平稳吊放到右侧对应编号货位。');
  const keys = el('p', 'keys', '操作：← / → 或 A / D 平移龙门吊（注意吊索惯性摆动） · 空格 / ↓ 下钩抓取与落钩放箱');
  box.append(hud, stageWrap, controls, status, keys);

  // --- Simulation State ---
  const crates = CRATE_SPECS.map(c => ({
    ...c,
    x: c.startX,
    y: TRUCK_DECK_Y - CRATE_H / 2,
    state: 'truck' // 'truck' | 'carried' | 'placed'
  }));

  const state = {
    trolleyX: 248,
    trolleyVx: 0,
    cableLen: IDLE_LEN,
    phase: 'idle', // 'idle' | 'lowering' | 'raising'
    swing: 0,
    swingVel: 0,
    carrying: null,
    smoothness: 100,
    placedCount: 0,
    done: false,
    dust: [],
    popups: []
  };
  scene.craneState = state;

  const input = {left: false, right: false};

  function syncHud() {
    progressPill.textContent = `已卸货：${state.placedCount} / ${crates.length}`;
    smoothPill.textContent = `平稳度：${state.smoothness}%`;
    carryPill.textContent = state.carrying
      ? `吊运中：${state.carrying.id} ${state.carrying.label}箱`
      : '吊钩状态：空钩待命';
    hookBtn.textContent = state.carrying ? '▼ 落钩放箱 [空格]' : '▼ 下钩抓取 [空格]';
    box.dataset.unloaded = String(state.placedCount);
    box.dataset.carrying = state.carrying ? state.carrying.id : '';
    box.dataset.phase = state.phase;
    box.dataset.trolleyX = String(Math.round(state.trolleyX));
  }

  function spawnDust(x, y, color = '#d6c69f') {
    for (let i = 0; i < 10; i++) {
      state.dust.push({
        x: x + (Math.random() - 0.5) * 34,
        y: y - 2,
        vx: (Math.random() - 0.5) * 65,
        vy: -16 - Math.random() * 34,
        life: 0.45 + Math.random() * 0.2,
        size: 3 + Math.floor(Math.random() * 3),
        color
      });
    }
  }

  function addPopup(x, y, text, color = '#2f7a44') {
    state.popups.push({x, y, text, color, life: 1.25});
  }

  function triggerHook() {
    if (state.done || state.phase !== 'idle') return;
    state.phase = 'lowering';
    sound.craneWinch(true);
    syncHud();
  }

  function completeUnload() {
    state.done = true;
    input.left = input.right = false;
    leftBtn.disabled = hookBtn.disabled = rightBtn.disabled = true;
    const stars = state.smoothness >= 90 ? '★★★' : state.smoothness >= 70 ? '★★☆' : '★☆☆';
    const firstTime = !s.has('service_parts');
    s.flag('picked_A1');
    s.flag('picked_B2');
    s.flag('service_parts');
    s.flags.crane_smoothness = state.smoothness;
    sound.chime();
    scene.record(`完成三一龙门吊卸货（3/3 件，平稳度 ${state.smoothness}%）`);

    winOverlay.innerHTML = '';
    winOverlay.append(
      el('strong', '', `卸货完成！平稳度 ${state.smoothness}%  ${stars}`),
      el('span', '', s.has('sany_service')
        ? '三件重型备件再次稳稳落位，操作非常熟练！'
        : 'A1 密封件、B2 滤芯与 C1 液压阀已全部安全入位！去东侧黄色交接区找服务协调员签收吧。')
    );
    winOverlay.hidden = false;
    status.textContent = s.has('sany_service')
      ? '三件备件全部精准落位！'
      : '全部 3 件重型备件已卸货入位，请到东侧找服务协调员签收（顺手可拍交接板）。';

    const btns = [];
    if (!s.has('sany_service')) {
      btns.push(['去东侧找协调员签收', () => scene.closeOverlay()]);
    } else {
      btns.push(['返回车间', () => scene.closeOverlay()]);
    }
    btns.push(['再卸一车', () => openUnloadGame(scene)]);
    if (firstTime) scene.toast('三件备件已安全卸货入位（3/3）');
    actions(box, btns);
    syncHud();
  }

  // Controls binding (Pointer + Keyboard)
  const holdBtn = (btn, dir) => {
    const down = e => { if (state.done) return; e.preventDefault(); btn.setPointerCapture(e.pointerId); input[dir] = true; };
    const up = () => { input[dir] = false; };
    btn.addEventListener('pointerdown', down, {signal});
    btn.addEventListener('pointerup', up, {signal});
    btn.addEventListener('pointercancel', up, {signal});
    btn.addEventListener('lostpointercapture', up, {signal});
  };
  holdBtn(leftBtn, 'left');
  holdBtn(rightBtn, 'right');
  hookBtn.addEventListener('pointerdown', e => {
    if (state.done) return;
    e.preventDefault();
    sound.unlock();
    triggerHook();
  }, {signal});
  hookBtn.addEventListener('click', e => {
    // Fallback for keyboard-triggered button clicks (Enter/Space on focused button)
    if (e.detail === 0) triggerHook();
  }, {signal});
  window.addEventListener('blur', () => { input.left = input.right = false; }, {signal});

  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (!['arrowleft', 'arrowright', 'arrowdown', 'a', 'd', 's', ' '].includes(k)) return;
    e.preventDefault();
    if (state.done) return;
    if (k === 'arrowleft' || k === 'a') input.left = true;
    else if (k === 'arrowright' || k === 'd') input.right = true;
    else if (!e.repeat && (k === ' ' || k === 'arrowdown' || k === 's')) triggerHook();
  }, {signal, capture: true});

  window.addEventListener('keyup', e => {
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') input.left = false;
    else if (k === 'arrowright' || k === 'd') input.right = false;
  }, {signal});

  function hookPos() {
    const hx = state.trolleyX + Math.sin(state.swing) * state.cableLen;
    const hy = RAIL_Y + 12 + Math.cos(state.swing) * state.cableLen;
    return {hx, hy};
  }

  function update(dt) {
    // 1. Horizontal trolley movement (allowed when idle, damped gently when lowering/raising)
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const maxSpeed = state.phase === 'idle' ? 210 : 55;
    const targetVx = dir * maxSpeed;
    const prevVx = state.trolleyVx;
    const accelRate = dir !== 0 ? 11 : 14;
    state.trolleyVx += (targetVx - state.trolleyVx) * Math.min(1, dt * accelRate);
    const actualAccel = (state.trolleyVx - prevVx) / Math.max(0.001, dt);
    state.trolleyX = Math.max(64, Math.min(524, state.trolleyX + state.trolleyVx * dt));
    if (state.trolleyX <= 64 || state.trolleyX >= 524) state.trolleyVx = 0;

    // 2. Realistic crane pendulum swing
    const swingFactor = state.carrying ? 0.00055 : 0.00038;
    state.swingVel += (-actualAccel * swingFactor - state.swing * 22 - state.swingVel * 4.2) * dt;
    state.swing = Math.max(-0.34, Math.min(0.34, state.swing + state.swingVel * dt));

    // 3. Cable winch state machine
    if (state.phase === 'lowering') {
      state.cableLen += 235 * dt;
      sound.craneWinch(true);
      const {hx, hy} = hookPos();
      if (!state.carrying) {
        // Check collision with any crate on the delivery truck
        const hit = crates.find(c =>
          c.state === 'truck' &&
          Math.abs(hx - c.x) <= 26 &&
          hy + 8 >= c.y - CRATE_H / 2
        );
        if (hit) {
          hit.state = 'carried';
          state.carrying = hit;
          state.phase = 'raising';
          sound.craneLatch();
          status.textContent = `已抓起 ${hit.id} ${hit.label}箱！平稳移至右侧「${hit.id}」编号货位后按空格落钩。`;
          addPopup(hit.x, hit.y - 22, `抓起 ${hit.id}`, '#1e5c48');
          syncHud();
        } else if (hy >= TRUCK_DECK_Y - 4 && hx <= 228) {
          state.phase = 'raising';
          sound.error();
          status.textContent = '没抓到货箱，把吊钩对准货车上的 A1 / B2 / C1 木箱再按空格！';
        } else if (hy >= FLOOR_Y - 6) {
          state.phase = 'raising';
          sound.error();
          status.textContent = '请先移到左侧货车上方抓取备件箱！';
        }
      } else {
        // Carrying crate -> check touchdown on workshop receiving bays
        const crateBottom = hy + 10 + CRATE_H;
        if (crateBottom >= FLOOR_Y) {
          const crate = state.carrying;
          const bay = BAYS.find(b => Math.abs(hx - b.x) <= 38);
          if (bay && bay.id === crate.id) {
            const gentle = Math.abs(state.swing) < 0.22;
            if (!gentle) {
              state.smoothness = Math.max(55, state.smoothness - 12);
            }
            crate.state = 'placed';
            crate.x = bay.x;
            crate.y = FLOOR_Y - CRATE_H / 2;
            state.carrying = null;
            state.placedCount += 1;
            state.phase = 'raising';
            sound.crateDrop(gentle);
            spawnDust(bay.x, FLOOR_Y, '#e5d4a6');
            addPopup(bay.x, FLOOR_Y - 38, gentle ? `${crate.id} 精准轻放 ☑` : `${crate.id} 入位（略晃）`, gentle ? '#246e38' : '#b8761d');
            status.textContent = gentle
              ? `${crate.id} ${crate.label}箱精准轻放就位！（${state.placedCount}/${crates.length}）`
              : `${crate.id} ${crate.label}箱已就位，下次等吊索稳一点再落钩更佳。`;
            syncHud();
            if (state.placedCount === crates.length) {
              state.cableLen = IDLE_LEN;
              state.phase = 'idle';
              completeUnload();
              return;
            }
          } else if (bay) {
            state.smoothness = Math.max(50, state.smoothness - 8);
            state.phase = 'raising';
            sound.error();
            addPopup(bay.x, FLOOR_Y - 38, `货位不符！应放 ${crate.id}`, '#b83c36');
            status.textContent = `货位不符！这是 ${crate.id} ${crate.label}箱，请吊到右侧「${crate.id}」货位！`;
            syncHud();
          } else {
            state.phase = 'raising';
            sound.error();
            status.textContent = `请对准右侧「${crate.id} ${crate.label}区」再按空格落钩！`;
            syncHud();
          }
        }
      }
    } else if (state.phase === 'raising') {
      state.cableLen -= 265 * dt;
      sound.craneWinch(false);
      if (state.cableLen <= IDLE_LEN) {
        state.cableLen = IDLE_LEN;
        state.phase = 'idle';
        syncHud();
      }
    }

    // Update carried crate coordinates
    if (state.carrying) {
      const {hx, hy} = hookPos();
      state.carrying.x = hx;
      state.carrying.y = hy + 10 + CRATE_H / 2;
    }

    // Update particles & popups
    for (let i = state.dust.length - 1; i >= 0; i--) {
      const p = state.dust[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 120 * dt;
      p.life -= dt;
      if (p.life <= 0) state.dust.splice(i, 1);
    }
    for (let i = state.popups.length - 1; i >= 0; i--) {
      const pop = state.popups[i];
      pop.y -= 18 * dt;
      pop.life -= dt;
      if (pop.life <= 0) state.popups.splice(i, 1);
    }

    box.dataset.trolleyX = String(Math.round(state.trolleyX));
  }

  function drawCrate(c, tilt = 0) {
    ctx.save();
    ctx.translate(Math.round(c.x), Math.round(c.y));
    if (tilt) ctx.rotate(tilt);
    const hw = CRATE_W / 2, hh = CRATE_H / 2;
    // Shadow if on ground or truck
    if (c.state !== 'carried') {
      ctx.fillStyle = 'rgba(26, 30, 32, 0.25)';
      ctx.fillRect(-hw + 2, hh - 2, CRATE_W - 2, 4);
    }
    // Outer body
    ctx.fillStyle = '#2a2621';
    ctx.fillRect(-hw - 2, -hh - 2, CRATE_W + 4, CRATE_H + 4);
    ctx.fillStyle = c.color;
    ctx.fillRect(-hw, -hh, CRATE_W, CRATE_H);
    // Top bevel & inner ribs
    ctx.fillStyle = c.trim;
    ctx.fillRect(-hw, -hh, CRATE_W, 5);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(-hw, hh - 5, CRATE_W, 5);
    ctx.fillRect(-hw + 4, -hh + 5, 3, CRATE_H - 10);
    ctx.fillRect(hw - 7, -hh + 5, 3, CRATE_H - 10);
    // Lifting ring on top
    ctx.fillStyle = '#2a2621';
    ctx.fillRect(-5, -hh - 5, 10, 4);
    ctx.fillStyle = '#e8c456';
    ctx.fillRect(-3, -hh - 4, 6, 2);
    // Crisp stencil label
    ctx.fillStyle = '#fff8e2';
    ctx.font = 'bold 12px "FusionPixel", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(c.id, 0, -2);
    ctx.font = '9px "FusionPixel", monospace';
    ctx.fillStyle = '#f5ebd0';
    ctx.fillText(c.label, 0, 9);
    ctx.restore();
  }

  function render() {
    // 1. Industrial workshop interior backdrop
    ctx.fillStyle = '#dde3dc';
    ctx.fillRect(0, 0, W, H);
    // Subtle workshop wall panels & clerestory windows
    ctx.fillStyle = '#cdd6ce';
    for (let x = 0; x < W; x += 58) ctx.fillRect(x, 0, 2, FLOOR_Y);
    for (let x = 36; x < W - 40; x += 116) {
      ctx.fillStyle = '#97b8bd';
      ctx.fillRect(x, 54, 72, 30);
      ctx.fillStyle = '#c5dfe0';
      ctx.fillRect(x + 3, 57, 66, 12);
      ctx.strokeStyle = '#5c6e6b';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, 54, 72, 30);
    }
    // Lower workshop concrete dado wall
    ctx.fillStyle = '#b9c2ba';
    ctx.fillRect(0, 146, W, FLOOR_Y - 146);
    ctx.fillStyle = '#8b968e';
    ctx.fillRect(0, 146, W, 3);

    // Concrete workshop floor
    ctx.fillStyle = '#7b827f';
    ctx.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
    ctx.fillStyle = '#565d5a';
    ctx.fillRect(0, FLOOR_Y, W, 3);

    // 2. Three numbered unloading bays on the right
    for (const bay of BAYS) {
      const bx = bay.x - 42;
      const done = crates.some(c => c.id === bay.id && c.state === 'placed');
      const active = state.carrying?.id === bay.id;
      // Floor zone highlight
      ctx.fillStyle = done ? 'rgba(68, 152, 88, 0.22)' : active ? 'rgba(242, 200, 74, 0.28)' : 'rgba(54, 66, 62, 0.12)';
      ctx.fillRect(bx, FLOOR_Y - 46, 84, 46);
      // Yellow/black safety hazard floor stripe
      for (let sx = 0; sx < 84; sx += 12) {
        ctx.fillStyle = (sx / 12) % 2 === 0 ? '#e6b83e' : '#2d302f';
        ctx.fillRect(bx + sx, FLOOR_Y - 2, 12, 6);
      }
      // Wall placard above bay
      ctx.fillStyle = '#2a3330';
      ctx.fillRect(bx + 4, 152, 76, 18);
      ctx.fillStyle = done ? '#3c854e' : bay.color;
      ctx.fillRect(bx + 6, 154, 72, 14);
      ctx.fillStyle = '#fff8e2';
      ctx.font = '10px "FusionPixel", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(done ? `${bay.id} 已入位 ☑` : bay.title, bay.x, 161);
    }

    // 3. Flatbed Delivery Truck on the left
    // Truck cab
    ctx.fillStyle = '#252624';
    ctx.fillRect(8, 134, 46, 66);
    ctx.fillStyle = '#b93b32';
    ctx.fillRect(10, 136, 42, 54);
    ctx.fillStyle = '#a8d5e0';
    ctx.fillRect(14, 142, 24, 18);
    ctx.fillStyle = '#ffe585';
    ctx.fillRect(10, 174, 6, 8);
    // Flatbed steel deck
    ctx.fillStyle = '#3c4347';
    ctx.fillRect(50, TRUCK_DECK_Y, 166, 12);
    ctx.fillStyle = '#5f696e';
    ctx.fillRect(50, TRUCK_DECK_Y, 166, 3);
    // Label on truck skirt
    ctx.fillStyle = '#d9b54a';
    ctx.fillRect(54, TRUCK_DECK_Y + 6, 158, 3);
    // Rubber wheels
    for (const wx of [28, 78, 178]) {
      ctx.fillStyle = '#222424';
      ctx.beginPath();
      ctx.arc(wx, FLOOR_Y - 10, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#9aa3a0';
      ctx.beginPath();
      ctx.arc(wx, FLOOR_Y - 10, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#333b38';
    ctx.font = '10px "FusionPixel", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('送货平板车（待卸货）', 134, 232);

    // 4. Overhead SANY Steel Gantry Rail
    ctx.fillStyle = '#343b3e';
    ctx.fillRect(0, RAIL_Y - 12, W, 14);
    ctx.fillStyle = '#d9a42e';
    ctx.fillRect(0, RAIL_Y - 9, W, 8);
    ctx.fillStyle = '#9e731b';
    ctx.fillRect(0, RAIL_Y - 3, W, 2);
    // SANY red rail emblem on left
    ctx.fillStyle = '#b82e29';
    ctx.fillRect(14, RAIL_Y - 10, 44, 10);
    ctx.fillStyle = '#fff5dc';
    ctx.font = 'bold 9px "FusionPixel", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SANY', 36, RAIL_Y - 4);

    // 5. Alignment sightline below hook (helpful precision guide)
    const {hx, hy} = hookPos();
    if (!state.done) {
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = state.carrying ? 'rgba(220, 168, 42, 0.55)' : 'rgba(54, 72, 68, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.round(hx), Math.round(hy + 10));
      ctx.lineTo(Math.round(hx), FLOOR_Y - 2);
      ctx.stroke();
      ctx.restore();
    }

    // 6. Cable & Yellow SANY Crane Trolley
    ctx.strokeStyle = '#2d3234';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(Math.round(state.trolleyX), RAIL_Y + 6);
    ctx.lineTo(Math.round(hx), Math.round(hy));
    ctx.stroke();

    // Trolley carriage
    const tx = Math.round(state.trolleyX);
    ctx.fillStyle = '#242728';
    ctx.fillRect(tx - 24, RAIL_Y - 14, 48, 24);
    ctx.fillStyle = '#e8b63a';
    ctx.fillRect(tx - 22, RAIL_Y - 12, 44, 20);
    ctx.fillStyle = '#b82e29';
    ctx.fillRect(tx - 14, RAIL_Y - 6, 28, 8);
    ctx.fillStyle = '#fff7e0';
    ctx.font = 'bold 8px "FusionPixel", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SANY', tx, RAIL_Y - 1);

    // Hook & Mechanical Claw
    ctx.save();
    ctx.translate(Math.round(hx), Math.round(hy));
    ctx.rotate(state.swing);
    ctx.fillStyle = '#242728';
    ctx.fillRect(-10, -4, 20, 12);
    ctx.fillStyle = '#e8b63a';
    ctx.fillRect(-8, -2, 16, 8);
    // Steel claw jaws
    ctx.strokeStyle = '#333b3e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (state.carrying) {
      ctx.moveTo(-8, 6); ctx.lineTo(-14, 14); ctx.lineTo(-10, 18);
      ctx.moveTo(8, 6); ctx.lineTo(14, 14); ctx.lineTo(10, 18);
    } else {
      ctx.moveTo(-7, 6); ctx.lineTo(-14, 15); ctx.lineTo(-7, 19);
      ctx.moveTo(7, 6); ctx.lineTo(14, 15); ctx.lineTo(7, 19);
    }
    ctx.stroke();
    ctx.restore();

    // 7. Draw all 3 crates (truck & placed first, carried on top with pendulum tilt)
    for (const c of crates) {
      if (c.state !== 'carried') drawCrate(c, 0);
    }
    if (state.carrying) drawCrate(state.carrying, state.swing * 0.85);

    // 8. Dust puffs & feedback popups
    for (const p of state.dust) {
      ctx.globalAlpha = Math.max(0, p.life * 2);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1;
    for (const pop of state.popups) {
      ctx.globalAlpha = Math.min(1, pop.life * 1.4);
      ctx.font = 'bold 11px "FusionPixel", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff9e8';
      ctx.fillText(pop.text, Math.round(pop.x) + 1, Math.round(pop.y) + 1);
      ctx.fillStyle = pop.color;
      ctx.fillText(pop.text, Math.round(pop.x), Math.round(pop.y));
    }
    ctx.globalAlpha = 1;
  }

  syncHud();
  let previous = performance.now();
  let raf;
  function loop(now) {
    if (signal.aborted) return;
    const dt = Math.min(0.05, (now - previous) / 1000);
    previous = now;
    if (!state.done) update(dt);
    render();
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);
  signal.addEventListener('abort', () => {
    cancelAnimationFrame(raf);
    if (scene.craneState === state) scene.craneState = null;
  }, {once: true});
}
