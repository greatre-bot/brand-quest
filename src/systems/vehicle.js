import Phaser from 'phaser';
import propTypes from '../data/pixel-props.json';
import {label} from '../ui/panel.js';
import {sound} from './audio.js';
import {unlockAchievement} from './achievements.js';

/**
 * Rideable & parkable electric scooter system for outdoor maps (Jakarta & Karawang).
 * - Parked scooters behave as solid physical props with live positions persisted per map.
 * - Mounting swaps the player to a dedicated 4-dir 48x48 pixel riding sprite (teal or red).
 * - Smooth electric cruise & Shift boost physics, breeze dust puffs, horn ("嘀嘀!"), and safe dismount.
 */

export function initVehicles(scene) {
  scene.vehicles = [];
  scene.riding = null;
  scene.rideVel = {x: 0, y: 0};
  scene.ridePuffs = [];
  scene.ridePuffTimer = 0;
  scene.rideFx = scene.add.graphics().setDepth(915);

  const defs = scene.world.vehicles || [];
  if (!defs.length) return;

  const savedMap = scene.session.flags.parked_vehicles?.[scene.worldId] || {};
  for (const def of defs) {
    const saved = savedMap[def.id];
    const x = typeof saved?.x === 'number' ? saved.x : def.x;
    const y = typeof saved?.y === 'number' ? saved.y : def.y;
    const flipX = Boolean(saved?.flipX);
    const sprite = scene.add.image(x, y, def.key).setOrigin(0.5, 1).setFlipX(flipX).setDepth(y - 3);
    scene.vehicles.push({
      id: def.id,
      kind: 'vehicle',
      key: def.key,
      label: def.label,
      x,
      y,
      flipX,
      parked: true,
      sprite
    });
  }
}

function vehicleFootprint(v) {
  const [dx, dy, w, h] = propTypes[v.key]?.footprint || [-18, -13, 36, 10];
  return {x: v.x + dx, y: v.y + dy, w, h};
}

export function vehicleBlocked(scene, x, y) {
  if (!scene.vehicles?.length) return false;
  for (const v of scene.vehicles) {
    if (!v.parked) continue;
    const b = vehicleFootprint(v);
    if (x + 5 > b.x && x - 5 < b.x + b.w && y + 2 > b.y && y - 2 < b.y + b.h) return true;
  }
  return false;
}

function saveParkedState(scene, veh) {
  const all = scene.session.flags.parked_vehicles || {};
  const mapObj = {...(all[scene.worldId] || {})};
  mapObj[veh.id] = {x: Math.round(veh.x), y: Math.round(veh.y), flipX: Boolean(veh.flipX)};
  scene.session.flag('parked_vehicles', {...all, [scene.worldId]: mapObj});
  scene.session.save();
}

export function mountVehicle(scene, veh) {
  if (!veh || !veh.parked || scene.riding) return;
  veh.parked = false;
  veh.sprite.setVisible(false);
  scene.riding = veh;
  scene.rideVel = {x: 0, y: 0};

  const p = scene.player;
  const facing = veh.flipX ? 1 : 2;
  p.setTexture('ride-' + veh.key, facing * 3);
  p.setOrigin(0.5, 0.9);
  p.facing = facing;
  p.setPosition(veh.x, veh.y).setDepth(veh.y);

  sound.scooterMount();
  scene.time.delayedCall(220, () => unlockAchievement(scene, 'first_ride'));
  const touchOn = document.body.classList.contains('touch-on');
  if (!scene.session.has('ridden_scooter')) {
    scene.session.flag('ridden_scooter');
    scene.session.save();
    scene.toast(touchOn
      ? '已骑上电动车！左下方向键骑行 · 加速 · 鸣笛 · 下车'
      : '已骑上电动车！WASD 骑行 · Shift 加速 · 空格 鸣笛 · R / E 下车');
  } else {
    scene.toast(touchOn
      ? '跨上电动车出发！右侧可按「鸣笛」「下车」'
      : '跨上电动车出发！[空格] 鸣笛 · [R] 停车下车');
  }
  scene.near = null;
  scene.updateHint();
}

export function dismountVehicle(scene, {forDoor = false} = {}) {
  const veh = scene.riding;
  if (!veh) return;
  const p = scene.player;
  const l = scene.world.limits || {left: 16, right: scene.world.mapW - 16, top: 24, bottom: scene.world.mapH - 12};

  let px = Phaser.Math.Clamp(Math.round(p.x), l.left + 12, l.right - 12);
  let py = Phaser.Math.Clamp(Math.round(p.y), l.top + 12, l.bottom - 8);

  // If dismounting right at a shop/workshop door, neatly park to the side so we don't block the exit!
  if (forDoor) {
    const nearDoor = scene.items.find(it => (it.kind === 'door' || it.kind === 'transport') && Math.hypot(it.x - px, it.y - py) < 34);
    if (nearDoor) {
      for (const [ox, oy] of [[-28, 8], [28, 8], [-24, 18], [24, 18]]) {
        const cx = Phaser.Math.Clamp(Math.round(nearDoor.x + ox), l.left + 12, l.right - 12);
        const cy = Phaser.Math.Clamp(Math.round(nearDoor.y + oy), l.top + 12, l.bottom - 8);
        if (!scene.blocked(cx, cy)) {
          px = cx;
          py = cy;
          break;
        }
      }
    }
  }

  const facing = p.facing ?? 2;
  const flipX = facing === 1;
  veh.x = px;
  veh.y = py;
  veh.flipX = flipX;
  veh.parked = true;
  veh.sprite.setPosition(px, py).setFlipX(flipX).setDepth(py - 3).setVisible(true);
  scene.riding = null;
  scene.rideVel = {x: 0, y: 0};

  // Restore standing player sprite at the nearest safe unblocked spot beside the parked scooter
  p.setTexture('player', facing * 3);
  p.setOrigin(0.5, 0.94);
  if (!forDoor) {
    const offsets = [[0, 14], [0, -18], [24, 0], [-24, 0], [20, 12], [-20, 12], [20, -14], [-20, -14]];
    let placed = false;
    for (const [ox, oy] of offsets) {
      const sx = Phaser.Math.Clamp(px + ox, l.left, l.right);
      const sy = Phaser.Math.Clamp(py + oy, l.top, l.bottom);
      if (!scene.blocked(sx, sy)) {
        p.setPosition(sx, sy).setDepth(sy);
        placed = true;
        break;
      }
    }
    if (!placed) p.setPosition(px, py).setDepth(py);
    sound.scooterDismount();
    scene.toast('电动车已停好');
  } else {
    p.setDepth(p.y);
  }

  saveParkedState(scene, veh);
  scene.near = null;
  scene.updateHint();
}

export function honkScooter(scene) {
  if (!scene.riding || scene.overlay) return;
  sound.horn();
  scene.time.delayedCall(340, () => unlockAchievement(scene, 'street_horn'));
  const p = scene.player;
  const pop = label(scene, p.x, p.y - 46, '嘀嘀!', 12, '#fff5d2', {
    backgroundColor: '#233b31',
    padding: {x: 4, y: 1}
  }).setOrigin(0.5, 1).setDepth(p.y + 30);
  scene.tweens.add({
    targets: pop,
    y: p.y - 60,
    alpha: 0,
    duration: 540,
    ease: 'Quad.easeOut',
    onComplete: () => pop.destroy()
  });

  // Nearby pedestrians turn to glance at the cheerful scooter horn!
  for (const n of scene.npcs || []) {
    if (!n.sprite) continue;
    const dist = Math.hypot(n.sprite.x - p.x, n.sprite.y - p.y);
    if (dist < 105) {
      const vx = p.x - n.sprite.x, vy = p.y - n.sprite.y;
      const dir = Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? 1 : 2) : (vy < 0 ? 3 : 0);
      n.sprite.facing = dir;
      n.sprite.setFrame(dir * 3);
    }
  }
}

export function updateRiding(scene, time, delta, dx, dy, boost) {
  const dt = Math.min(55, delta) / 1000;
  const maxSpeed = boost ? 310 : 235;
  const mag = Math.hypot(dx, dy);
  const tx = mag ? (dx / mag) * maxSpeed : 0;
  const ty = mag ? (dy / mag) * maxSpeed : 0;
  // Snappy electric torque when accelerating, smooth rolling glide when releasing
  const rate = mag ? 12 : 9.5;
  const blend = Math.min(1, dt * rate);
  scene.rideVel.x += (tx - scene.rideVel.x) * blend;
  scene.rideVel.y += (ty - scene.rideVel.y) * blend;
  if (!mag && Math.hypot(scene.rideVel.x, scene.rideVel.y) < 8) {
    scene.rideVel.x = 0;
    scene.rideVel.y = 0;
  }

  const p = scene.player;
  const l = scene.world.limits || {left: 14, right: scene.world.mapW - 14, top: 20, bottom: scene.world.mapH - 8};
  const nx = Phaser.Math.Clamp(p.x + scene.rideVel.x * dt, l.left, l.right);
  const ny = Phaser.Math.Clamp(p.y + scene.rideVel.y * dt, l.top, l.bottom);

  if (!scene.blocked(nx, p.y)) p.x = nx;
  else scene.rideVel.x = 0;
  if (!scene.blocked(p.x, ny)) p.y = ny;
  else scene.rideVel.y = 0;

  const spd = Math.hypot(scene.rideVel.x, scene.rideVel.y);
  if (spd > 14) {
    if (mag) {
      p.facing = Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 1 : 2) : (dy < 0 ? 3 : 0);
    }
    const frameIdx = Math.floor(time / (boost ? 72 : 96)) % 3;
    p.setFrame(p.facing * 3 + frameIdx);
    sound.scooterHum(boost);

    // Emit crisp pixel tire breeze puffs behind the rear wheel
    scene.ridePuffTimer += delta;
    if (scene.ridePuffTimer > (boost ? 95 : 155)) {
      scene.ridePuffTimer = 0;
      const rearOff = [
        [0, -14],  // facing down -> rear is behind (north)
        [18, -4],  // facing left -> rear is right
        [-18, -4], // facing right -> rear is left
        [0, 4]     // facing up -> rear is south
      ][p.facing] || [0, -4];
      scene.ridePuffs.push({
        x: p.x + rearOff[0] + (Math.random() * 4 - 2),
        y: p.y + rearOff[1],
        life: 1,
        boost
      });
      if (scene.ridePuffs.length > 10) scene.ridePuffs.shift();
    }
  } else {
    p.setFrame((p.facing ?? 2) * 3);
  }
  p.setDepth(p.y);
}

export function updateVehicleParticles(scene, delta) {
  if (!scene.rideFx) return;
  scene.rideFx.clear();
  if (!scene.ridePuffs?.length) return;
  const dt = Math.min(60, delta);
  for (let i = scene.ridePuffs.length - 1; i >= 0; i--) {
    const pf = scene.ridePuffs[i];
    pf.y -= dt * 0.012;
    pf.life -= dt / 420;
    if (pf.life <= 0) {
      scene.ridePuffs.splice(i, 1);
      continue;
    }
    const color = pf.boost ? 0xfff0b8 : 0xe9e2cc;
    const sz = pf.life > 0.5 ? 3 : 2;
    scene.rideFx.fillStyle(color, pf.life * 0.55).fillRect(Math.round(pf.x), Math.round(pf.y), sz, sz);
  }
}
