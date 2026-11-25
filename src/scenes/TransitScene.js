import Phaser from 'phaser';
import {el} from '../ui/panel.js';
import {sound} from '../systems/audio.js';
import {setTouchSceneMode} from '../systems/touchControls.js';
import {applyCenteredPanoramaCamera} from '../systems/viewportFit.js';

/**
 * Full-screen 640x360 pixel intercity shuttle bus cutscene between
 * Jakarta Kota Tua street <-> Karawang KIM SANY Industrial Park.
 * Plays continuous bus engine acceleration, gear-shift, highway tire rush & air-brake audio
 * while fading out outgoing BGM so destination BGM starts fresh from 0:00 upon arrival.
 */
export class TransitScene extends Phaser.Scene {
  constructor() { super('TransitScene'); }

  init({from = 'jakarta', to = 'karawang', spawn = null} = {}) {
    this.from = from;
    this.to = to;
    this.spawn = spawn;
    this.toKarawang = to === 'karawang' || to === 'sany_workshop';
    this.dir = this.toKarawang ? 1 : -1;
    this.elapsed = 0;
    this.duration = 2.4;
    this.done = false;
    this.overlayRoot = null;
    this.scope = null;
    this.puffs = [];
    this.puffTimer = 0;
  }

  create() {
    const viewport = document.getElementById('viewport');
    viewport.classList.add('cutscene');
    setTouchSceneMode('none');
    applyCenteredPanoramaCamera(this);
    this.events.on('bq-resize', () => applyCenteredPanoramaCamera(this));
    // Fade out previous scene's music cleanly & play realistic bus driving audio during the highway ride
    sound.fadeOutBgm(420);
    sound.startBusRide(this.duration);

    // 1. Stepped tropical West Java afternoon sky + horizon pixel sun
    const sky = this.add.graphics();
    const bands = [
      [0, 42, 0x1e4a59], [42, 42, 0x316b78], [84, 42, 0x56908c],
      [126, 40, 0x91b492], [166, 36, 0xdec78e], [202, 26, 0xf2d99d]
    ];
    for (const [y, h, c] of bands) sky.fillStyle(c).fillRect(-120, y, 880, h);
    // Stepped pixel sun
    const sunX = this.toKarawang ? 496 : 144;
    sky.fillStyle(0xf8de9c, 0.36).fillRect(sunX - 34, 152, 68, 44).fillRect(sunX - 22, 142, 44, 54);
    sky.fillStyle(0xfff4cc, 0.85).fillRect(sunX - 14, 160, 28, 28);

    // 2. Parallax pixel clouds
    this.clouds = [];
    for (const [cx, cy, cw, spd] of [[70, 50, 76, 34], [240, 36, 94, 26], [460, 58, 70, 38], [600, 92, 86, 44]]) {
      const g = this.add.graphics();
      g.fillStyle(0xfff1cc, 0.82).fillRect(8, 0, cw - 16, 8).fillRect(0, 6, cw, 10);
      g.fillStyle(0xd9c79f, 0.52).fillRect(4, 14, cw - 8, 4);
      g.setPosition(cx, cy);
      this.clouds.push({node: g, w: cw, spd});
    }

    // 3. Distant West Java volcanic ridge & lush hills (parallax layer)
    this.hills = this.add.graphics();

    // 4. Highway & grassy verge (full-bleed widescreen!)
    const road = this.add.graphics();
    road.fillStyle(0x7ca068).fillRect(-120, 224, 880, 22);
    road.fillStyle(0x5d8252).fillRect(-120, 224, 880, 4);
    // Steel guardrail posts & rail
    road.fillStyle(0x3a4745).fillRect(-120, 244, 880, 6);
    road.fillStyle(0xc6d0cb).fillRect(-120, 245, 880, 2);
    // Asphalt toll highway
    road.fillStyle(0x4c585c).fillRect(-120, 250, 880, 66);
    road.fillStyle(0x3d484b).fillRect(-120, 250, 880, 4).fillRect(-120, 312, 880, 4);
    // Southern shoulder & grass
    road.fillStyle(0x637d53).fillRect(-120, 316, 880, 44);

    // 5. Scrolling roadside palms, highway signs & dashed road markings
    this.roadFx = this.add.graphics();
    this.palms = [];
    for (let i = 0; i < 6; i++) {
      const px = 40 + i * 124;
      const palm = this.add.image(px, 244, 'palm').setOrigin(0.5, 1).setScale(0.76);
      this.palms.push(palm);
    }

    // 6. Crisp pixel dust/breeze puffs behind the bus
    this.puffFx = this.add.graphics();

    // 7. Detailed pixel intercity shuttle bus with straw-hat player riding inside!
    this.bus = this.add.container(this.toKarawang ? 160 : 480, 286);
    this.busBody = this.add.graphics();
    this.busWheels = this.add.graphics();
    this.drawBusBody(this.busBody);
    this.bus.add([this.busBody, this.busWheels]);
    this.bus.setScale(this.dir, 1);

    this.mountOverlay();
    this.events.once('shutdown', () => this.cleanup());
    this.events.once('destroy', () => this.cleanup());
  }

  drawBusBody(g) {
    // Soft ground shadow beneath bus
    g.fillStyle(0x1f2829, 0.55).fillRect(-48, 8, 96, 6);
    // Warm stepped headlight beam shining forward (+x in local space)
    g.fillStyle(0xfff0b2, 0.16).fillRect(46, -12, 44, 18);
    g.fillStyle(0xfff4c4, 0.24).fillRect(46, -9, 24, 12);

    // Roof AC pod
    g.fillStyle(0x1f1916).fillRect(-20, -34, 38, 6);
    g.fillStyle(0xd9d3c0).fillRect(-18, -32, 34, 4);

    // Main bus silhouette outline
    g.fillStyle(0x1f1916).fillRect(-48, -28, 96, 34);
    // Upper cream body
    g.fillStyle(0xf5e5bc).fillRect(-46, -26, 92, 16);
    g.fillStyle(0xfff5d8).fillRect(-46, -26, 92, 3);
    // Indonesian forest-green lower body + terracotta stripe
    g.fillStyle(0x2f6350).fillRect(-46, -10, 92, 14);
    g.fillStyle(0x417c66).fillRect(-46, -10, 92, 2);
    g.fillStyle(0xc65b44).fillRect(-46, -12, 92, 2);

    // Passenger windows (4 panes) + driver windshield
    const wins = [-42, -24, -6, 12];
    for (const wx of wins) {
      g.fillStyle(0x253b42).fillRect(wx, -23, 15, 10);
      g.fillStyle(0x74b5c4).fillRect(wx + 1, -22, 13, 8);
      g.fillStyle(0xbde4eb).fillRect(wx + 2, -21, 5, 2);
    }
    // Front driver windshield
    g.fillStyle(0x253b42).fillRect(30, -23, 14, 11);
    g.fillStyle(0x74b5c4).fillRect(31, -22, 12, 9);
    g.fillStyle(0xbde4eb).fillRect(33, -21, 5, 3);

    // Straw-hat protagonist riding cheerfully inside the 3rd window!
    g.fillStyle(0x3f2a1d).fillRect(-2, -21, 8, 2);
    g.fillStyle(0xf2ce85).fillRect(-4, -19, 12, 2); // iconic wide straw hat brim!
    g.fillStyle(0x91593d).fillRect(-2, -20, 8, 1);  // hat band
    g.fillStyle(0xe8ad80).fillRect(-1, -17, 6, 3);  // face
    g.fillStyle(0x1f1916).fillRect(3, -16, 1, 1);   // eye looking forward
    g.fillStyle(0x477b84).fillRect(-1, -14, 6, 1);  // teal shirt

    // Bright front headlight & rear red taillight
    g.fillStyle(0xffe98f).fillRect(42, -8, 4, 5);
    g.fillStyle(0xd94842).fillRect(-46, -8, 3, 5);
    // Metallic bumper
    g.fillStyle(0x9ca6a3).fillRect(-48, 2, 6, 3).fillRect(42, 2, 6, 3);
  }

  drawWheels(phase) {
    const g = this.busWheels;
    g.clear();
    const spoke = [[-2, 0], [0, -2], [2, 0], [0, 2]][phase % 4];
    for (const wx of [-28, 26]) {
      g.fillStyle(0x1c1d1c).fillRect(wx - 7, 0, 14, 12);
      g.fillStyle(0x323636).fillRect(wx - 5, 1, 10, 10);
      g.fillStyle(0xb7b9ab).fillRect(wx - 3, 3, 6, 6);
      g.fillStyle(0x4a4f4d).fillRect(wx - 1, 5, 2, 2);
      g.fillStyle(0xfff4d4).fillRect(wx + spoke[0] - 1, 5 + spoke[1], 2, 2);
    }
  }

  mountOverlay() {
    document.getElementById('transit-layer')?.remove();
    const viewport = document.getElementById('viewport');
    const root = el('div', 'intro-layer transit-layer');
    root.id = 'transit-layer';

    const topBar = el('div', 'cine-bar top');
    const botBar = el('div', 'cine-bar bottom');
    const skipBtn = el('button', 'cine-skip', '跳过 [Esc]');
    skipBtn.type = 'button';
    skipBtn.addEventListener('click', () => this.finish());

    const routeText = this.toKarawang
      ? '雅加达老城街区  →  卡拉旺三一产业园'
      : '卡拉旺三一产业园  →  雅加达老城街区';
    const caption = el('div', 'cine-caption transit-caption');
    caption.append(
      el('strong', '', '城际班车 · ' + routeText),
      el('small', '', this.toKarawang ? '穿出市区驶向西爪哇工业园，窗外街景渐变为厂区绿荫' : '离开工业园驶回雅加达市区，窗外街景逐渐热闹起来')
    );

    const progWrap = el('div', 'transit-prog-wrap');
    const progTrack = el('div', 'transit-prog-track');
    this.progFill = el('div', 'transit-prog-fill');
    progTrack.append(this.progFill);
    progWrap.append(
      el('span', '', this.toKarawang ? '雅加达' : '卡拉旺'),
      progTrack,
      el('span', '', this.toKarawang ? '卡拉旺' : '雅加达')
    );
    caption.append(progWrap);

    root.append(topBar, botBar, caption, skipBtn);
    viewport.append(root);
    this.overlayRoot = root;

    const scope = new AbortController();
    this.scope = scope;
    window.addEventListener('keydown', e => {
      if (e.repeat || this.done) return;
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.finish();
      }
    }, {signal: scope.signal});
  }

  finish() {
    if (this.done) return;
    this.done = true;
    this.cleanup();
    this.scene.start('WorldScene', {
      world: this.to,
      spawn: this.spawn,
      transit: {intercity: true, from: this.from}
    });
  }

  update(time, delta) {
    if (this.done) return;
    const dt = Math.min(50, delta) / 1000;
    this.elapsed += dt;
    const p = Math.min(1, this.elapsed / this.duration);

    if (this.progFill) this.progFill.style.width = `${Math.round(p * 100)}%`;

    // Scroll clouds opposite to travel direction
    for (const c of this.clouds) {
      c.node.x -= this.dir * c.spd * dt;
      if (this.dir > 0 && c.node.x < -c.w - 20) c.node.x = 660;
      if (this.dir < 0 && c.node.x > 660 + c.w) c.node.x = -c.w - 10;
    }

    // Parallax West Java hills
    this.hills.clear();
    const hillShift = Math.floor((this.elapsed * 48) % 320) * this.dir;
    for (let k = -1; k <= 3; k++) {
      const bx = k * 320 - hillShift;
      this.hills.fillStyle(0x4c7863).fillRect(bx + 20, 198, 160, 28).fillRect(bx + 54, 184, 92, 16).fillRect(bx + 78, 174, 42, 12);
      this.hills.fillStyle(0x3f6956).fillRect(bx + 170, 204, 150, 22).fillRect(bx + 205, 192, 82, 14);
    }

    // Scroll palms & highway stripes fast
    for (const palm of this.palms) {
      palm.x -= this.dir * 220 * dt;
      if (this.dir > 0 && palm.x < -60) palm.x += 744;
      if (this.dir < 0 && palm.x > 700) palm.x -= 744;
    }

    this.roadFx.clear();
    const dashShift = Math.floor((this.elapsed * 320) % 52) * this.dir;
    this.roadFx.fillStyle(0xf0de9e);
    for (let x = -52; x < 700; x += 52) {
      this.roadFx.fillRect(x - dashShift, 282, 26, 4);
    }
    // Roadside mileposts & posts
    const postShift = Math.floor((this.elapsed * 220) % 96) * this.dir;
    this.roadFx.fillStyle(0x344240);
    for (let x = -96; x < 740; x += 96) {
      this.roadFx.fillRect(x - postShift, 244, 4, 8);
    }

    // Bus drives smoothly across screen with subtle suspension bob + spinning wheels
    const startX = this.toKarawang ? 130 : 510;
    const endX = this.toKarawang ? 500 : 140;
    this.bus.x = Phaser.Math.Linear(startX, endX, p);
    this.bus.y = 285 + (Math.floor(time / 110) % 2);
    this.drawWheels(Math.floor(time / 55));

    // Pixel dust/exhaust puffs trailing behind rear of bus
    this.puffTimer += delta;
    if (this.puffTimer > 95) {
      this.puffTimer = 0;
      this.puffs.push({
        x: this.bus.x - this.dir * 52,
        y: this.bus.y + 4 + (Math.random() * 4 - 2),
        life: 1
      });
      if (this.puffs.length > 10) this.puffs.shift();
    }
    this.puffFx.clear();
    for (let i = this.puffs.length - 1; i >= 0; i--) {
      const pf = this.puffs[i];
      pf.x -= this.dir * 110 * dt;
      pf.y -= 14 * dt;
      pf.life -= dt / 0.45;
      if (pf.life <= 0) { this.puffs.splice(i, 1); continue; }
      const sz = pf.life > 0.5 ? 5 : 3;
      this.puffFx.fillStyle(0xeee5cf, pf.life * 0.55).fillRect(Math.round(pf.x), Math.round(pf.y), sz, sz);
    }

    if (this.elapsed >= this.duration) this.finish();
  }

  cleanup() {
    sound.stopBusRide();
    this.scope?.abort();
    this.scope = null;
    this.overlayRoot?.remove();
    this.overlayRoot = null;
    document.getElementById('viewport')?.classList.remove('cutscene');
  }
}
