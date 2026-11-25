import Phaser from 'phaser';
import {el} from '../ui/panel.js';
import {sound} from '../systems/audio.js';
import {setTouchSceneMode} from '../systems/touchControls.js';
import mixueSignUrl from '../../assets/pixel/buildings/mixue-sign.png';
import excavatorUrl from '../../assets/pixel/props/excavator.png';

/**
 * Full-screen 640x360 pixel opening animation -> interactive first-station choice:
 * Act 1 (0-3.0s): Pixel airplane flying over tropical ocean & scrolling clouds across the Equator
 * Act 2 (3.0-5.8s): Pixel twin-city Java diorama (Jakarta Mixue street <-> Karawang SANY park + moving shuttle bus)
 * Act 3 (5.8s+ or Enter): Player freely picks first stop — Jakarta Mixue OR Karawang SANY!
 */
export class IntroScene extends Phaser.Scene {
  constructor() { super('IntroScene'); }
  init() {
    this.act = 1;
    this.elapsed = 0;
    this.chosen = false;
    this.overlayRoot = null;
    this.scope = null;
  }

  create() {
    const viewport = document.getElementById('viewport');
    viewport.classList.add('cutscene');
    setTouchSceneMode('none');
    sound.setWorld('intro');

    // --- ACT 1 LAYER: Full-screen pixel flight across ocean & clouds ---
    this.act1 = this.add.container(0, 0);
    const sky = this.add.graphics();
    // Stepped tropical sky & sea horizon bands
    const bands = [
      [0, 56, 0x163340], [56, 48, 0x1e4756], [104, 46, 0x2c616d],
      [150, 38, 0x4b8584], [188, 28, 0x89aa8a], [216, 18, 0xd8c38c],
      [234, 42, 0x1f566b], [276, 44, 0x18475a], [320, 40, 0x123747]
    ];
    for (const [y, h, c] of bands) sky.fillStyle(c).fillRect(0, y, 640, h);
    // Pixel sun on horizon (stepped rectangle halo, zero smooth circles)
    sky.fillStyle(0xf8de9c, 0.4).fillRect(284, 186, 72, 48).fillRect(298, 174, 44, 60);
    sky.fillStyle(0xfff3c8, 0.85).fillRect(306, 198, 28, 36).fillRect(312, 192, 16, 42);
    this.act1.add(sky);

    // Animated ocean glints & equator marker + Java island emerging on right
    this.seaFx = this.add.graphics();
    this.act1.add(this.seaFx);

    // Distant Java silhouette emerging on right horizon
    this.island = this.add.graphics();
    this.island.fillStyle(0x3a644e).fillRect(0, 224, 156, 12).fillRect(16, 216, 112, 10).fillRect(46, 208, 48, 10);
    this.island.fillStyle(0x52805e).fillRect(22, 220, 96, 6);
    this.island.setPosition(650, 0);
    this.act1.add(this.island);

    // Parallax pixel clouds
    this.clouds = [];
    const cloudDefs = [
      [80, 62, 76, 46], [280, 44, 92, 34], [490, 74, 68, 52],
      [160, 134, 104, 72], [440, 146, 88, 66], [610, 104, 72, 58]
    ];
    for (const [cx, cy, cw, spd] of cloudDefs) {
      const g = this.add.graphics();
      g.fillStyle(0xfff1cc, 0.78).fillRect(8, 0, cw - 16, 8).fillRect(0, 6, cw, 10);
      g.fillStyle(0xd9c79f, 0.55).fillRect(4, 14, cw - 8, 4);
      g.setPosition(cx, cy);
      this.act1.add(g);
      this.clouds.push({node: g, w: cw, spd});
    }

    // Crisp pixel airplane flying left -> right-center with engine contrail
    this.contrail = this.add.graphics();
    this.act1.add(this.contrail);
    this.plane = this.add.graphics();
    const p = this.plane;
    // Pixel outline
    p.fillStyle(0x1f1916);
    p.fillRect(-26, -5, 52, 10);
    p.fillRect(-30, -14, 10, 12);
    p.fillRect(-6, -20, 16, 40);
    p.fillRect(22, -3, 8, 6);
    // White fuselage & sunlit top highlight
    p.fillStyle(0xfaf4e1);
    p.fillRect(-24, -3, 48, 6);
    p.fillRect(22, -2, 6, 4);
    p.fillStyle(0xd9d2c0);
    p.fillRect(-24, 1, 46, 2);
    // Red tail fin & stripe
    p.fillStyle(0xcf4648);
    p.fillRect(-28, -12, 6, 10);
    p.fillRect(-22, -1, 42, 2);
    // Swept wings
    p.fillStyle(0xebe3cc);
    p.fillRect(-4, -18, 12, 14);
    p.fillRect(-4, 4, 12, 14);
    p.fillStyle(0xbec2c4);
    p.fillRect(-4, -6, 12, 2);
    p.fillRect(-4, 16, 12, 2);
    // Cockpit glass
    p.fillStyle(0x528ea6).fillRect(14, -3, 8, 3);
    this.plane.setPosition(110, 126);
    this.act1.add(this.plane);

    // --- ACT 2 & 3 LAYER: Full-screen living Twin-City Java Pixel Diorama ---
    this.act2 = this.add.container(0, 0).setAlpha(0);
    const bg2 = this.add.graphics();
    const sky2 = [
      [0, 44, 0x265466], [44, 44, 0x3b7680], [88, 46, 0x62998e],
      [134, 44, 0xa8be94], [178, 38, 0xe8cf97]
    ];
    for (const [y, h, c] of sky2) bg2.fillStyle(c).fillRect(0, y, 640, h);
    // Ground & intercity highway
    bg2.fillStyle(0xccb994).fillRect(0, 216, 320, 68);
    bg2.fillStyle(0xa8b5ab).fillRect(320, 216, 320, 68);
    bg2.fillStyle(0x536061).fillRect(0, 284, 640, 46);
    bg2.fillStyle(0x3a4745).fillRect(0, 282, 640, 4).fillRect(0, 328, 640, 32);
    for (let x = 14; x < 640; x += 42) bg2.fillStyle(0xe8d9a8).fillRect(x, 305, 22, 3);
    // Vertical scenic divider milepost (~70km highway marker)
    bg2.fillStyle(0x33473e).fillRect(318, 216, 4, 66);
    this.act2.add(bg2);

    // Place actual high-craft game pixel buildings/props into the twin-city diorama!
    this.act2.add(this.add.image(66, 224, 'palm').setOrigin(0.5, 1).setScale(0.85));
    this.act2.add(this.add.image(164, 226, 'mixue').setOrigin(0.5, 1).setScale(0.82));
    this.act2.add(this.add.image(164, 148, 'mixue-sign').setDisplaySize(112, 43));
    this.act2.add(this.add.image(258, 226, 'cone').setOrigin(0.5, 1));
    this.act2.add(this.add.image(294, 224, 'palm').setOrigin(0.5, 1).setScale(0.8));

    this.act2.add(this.add.image(432, 226, 'sany-hall').setOrigin(0.5, 1).setScale(0.76));
    this.act2.add(this.add.image(568, 228, 'excavator').setOrigin(0.5, 1).setScale(0.82));
    this.act2.add(this.add.image(344, 224, 'palm').setOrigin(0.5, 1).setScale(0.75));

    // Animated pixel shuttle bus cruising along the Jakarta <-> Karawang highway
    this.bus = this.add.graphics();
    this.bus.fillStyle(0x1f1916).fillRect(-20, -14, 40, 14);
    this.bus.fillStyle(0xf2d99b).fillRect(-18, -12, 36, 10);
    this.bus.fillStyle(0x386650).fillRect(-18, -6, 36, 4);
    this.bus.fillStyle(0x73b3c4).fillRect(-14, -11, 8, 4).fillRect(-4, -11, 8, 4).fillRect(6, -11, 9, 4);
    this.bus.fillStyle(0x1f1916).fillRect(-14, -2, 6, 5).fillRect(8, -2, 6, 5);
    this.bus.fillStyle(0x9ca4a6).fillRect(-12, 0, 2, 2).fillRect(10, 0, 2, 2);
    this.bus.setPosition(60, 302);
    this.act2.add(this.bus);

    // Mount DOM cinematic bars, skip button, live subtitle & Act 3 choice container
    this.mountOverlay();
    this.events.once('shutdown', () => this.cleanup());
    this.events.once('destroy', () => this.cleanup());
  }

  mountOverlay() {
    document.getElementById('intro-layer')?.remove();
    const viewport = document.getElementById('viewport');
    const root = el('div', 'intro-layer');
    root.id = 'intro-layer';

    this.topBar = el('div', 'cine-bar top');
    this.botBar = el('div', 'cine-bar bottom');

    this.skipBtn = el('button', 'cine-skip', '跳过动画 [Esc]');
    this.skipBtn.type = 'button';
    this.skipBtn.addEventListener('click', () => {
      sound.open();
      if (this.act < 3) this.enterChoice();
      else this.pickDestination('jakarta');
    });

    this.caption = el('div', 'cine-caption intro-caption');
    this.captionTitle = el('strong', '', '飞往印度尼西亚');
    this.captionSub = el('small', '', '跨过赤道，降落爪哇岛的午后阳光里。');
    this.caption.append(this.captionTitle, this.captionSub);

    this.choiceMount = el('div', 'intro-choice-wrap');
    this.choiceMount.hidden = true;

    root.append(this.topBar, this.botBar, this.caption, this.choiceMount, this.skipBtn);
    viewport.append(root);
    this.overlayRoot = root;

    const scope = new AbortController();
    this.scope = scope;
    window.addEventListener('keydown', e => {
      if (e.repeat || this.chosen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        sound.open();
        if (this.act < 3) this.enterChoice();
        else this.pickDestination('jakarta');
      } else if (this.act < 3 && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        sound.open();
        this.enterChoice();
      } else if (this.act === 3) {
        if (e.key === '1') { e.preventDefault(); this.pickDestination('jakarta'); }
        else if (e.key === '2') { e.preventDefault(); this.pickDestination('karawang'); }
        else if (e.key === 'Enter' || e.key === ' ') {
          if (document.activeElement?.tagName === 'BUTTON') return;
          e.preventDefault();
          this.pickDestination('jakarta');
        }
      }
    }, {signal: scope.signal});
  }

  enterChoice() {
    if (this.act === 3) return;
    this.act = 3;
    this.act1.setAlpha(0);
    this.act2.setAlpha(1);
    this.caption.hidden = true;
    this.topBar.hidden = true;
    this.botBar.hidden = true;
    this.skipBtn.hidden = true;

    const panel = el('div', 'choice-panel');
    panel.id = 'intro-choice';
    const head = el('div', 'choice-head');
    head.append(
      el('small', '', '落地爪哇岛 · 自由行程'),
      el('h2', '', '第一站，你想先去哪里逛逛？'),
      el('p', '', '两城之间随时可乘班车往返，先去哪一站都行。')
    );

    const grid = el('div', 'choice-grid');
    const makeCard = (dest, num, tag, title, desc, imgSrc, btnText) => {
      const card = el('div', 'choice-card');
      const thumb = el('div', 'choice-thumb ' + dest);
      const img = el('img'); img.src = imgSrc; img.alt = title;
      thumb.append(img);
      const body = el('div', 'choice-body');
      body.append(
        el('small', 'choice-tag', `${tag} · [${num}]`),
        el('h3', '', title),
        el('p', '', desc)
      );
      const btn = el('button', 'end-primary choice-go', btnText);
      btn.type = 'button';
      btn.dataset.dest = dest;
      btn.addEventListener('click', () => this.pickDestination(dest));
      card.append(thumb, body, btn);
      return card;
    };

    grid.append(
      makeCard(
        'jakarta', '1', '雅加达老城街角', '先去蜜雪冰城',
        '逛热闹的印尼街角，进店当一回蜜雪店员按顾客小票调配套餐，和街坊骑手聊聊日常。',
        mixueSignUrl, '前往雅加达街区 [1]'
      ),
      makeCard(
        'karawang', '2', '卡拉旺 KIM 产业园', '先去三一产业园',
        '近距离看海外灯塔工厂与履带展机，找万老师借相机打卡，并进服务车间操控三一龙门吊卸货。',
        excavatorUrl, '前往三一产业园 [2]'
      )
    );

    panel.append(head, grid);
    this.choiceMount.replaceChildren(panel);
    this.choiceMount.hidden = false;
    sound.open();
  }

  pickDestination(worldId) {
    if (this.chosen) return;
    this.chosen = true;
    const session = this.registry.get('session');
    if (session) {
      session.flag('first_stop', worldId);
      session.move(worldId);
      session.save();
    }
    this.cleanup();
    this.scene.start('WorldScene', {world: worldId, intro: true});
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    this.elapsed += dt;

    if (this.act === 1) {
      // Scroll clouds & ocean glints
      for (const c of this.clouds) {
        c.node.x -= c.spd * dt;
        if (c.node.x < -c.w - 20) c.node.x = 660;
      }
      const p = Math.min(1, this.elapsed / 2.9);
      this.plane.x = 96 + p * 310;
      this.plane.y = 124 + Math.sin(time / 240) * 4 + p * 12;
      this.island.x = 650 - p * 230;

      // Pixel contrail dots & ocean sparkles + equator line
      this.contrail.clear();
      for (let i = 1; i <= 8; i++) {
        const tx = Math.round(this.plane.x - 30 - i * 16);
        const ty = Math.round(this.plane.y + Math.sin((time - i * 90) / 240) * 3);
        if (tx > -10) this.contrail.fillStyle(0xfff7e0, 0.7 - i * 0.07).fillRect(tx, ty - 1, 8, 3);
      }
      this.seaFx.clear();
      const shift = Math.floor((time / 12) % 48);
      for (let y = 244; y < 344; y += 22) {
        for (let x = -shift; x < 640; x += 56) {
          this.seaFx.fillStyle(0x88c8d4, 0.28).fillRect(x + ((y * 7) % 24), y, 14, 2);
        }
      }
      // Dashed golden equator line scrolling across ocean
      const eqX = Math.round(460 - p * 320);
      this.seaFx.fillStyle(0xf5cf74, 0.55);
      for (let y = 236; y < 350; y += 10) this.seaFx.fillRect(eqX, y, 2, 5);

      if (this.elapsed >= 2.9) {
        this.act = 2;
        this.captionTitle.textContent = '印度尼西亚 · 爪哇岛双城';
        this.captionSub.textContent = '一边是雅加达街角的蜜雪冰城，一边是西爪哇卡拉旺的三一产业园。';
      }
    } else if (this.act === 2) {
      const t = Math.min(1, (this.elapsed - 2.9) / 0.5);
      this.act1.setAlpha(1 - t);
      this.act2.setAlpha(t);
      this.bus.x += 92 * dt;
      if (this.bus.x > 665) this.bus.x = -25;
      if (this.elapsed >= 5.6) this.enterChoice();
    } else {
      // Act 3: gentle living shuttle bus in background while choosing first stop
      this.bus.x += 58 * dt;
      if (this.bus.x > 665) this.bus.x = -25;
    }
  }

  cleanup() {
    this.scope?.abort();
    this.scope = null;
    this.overlayRoot?.remove();
    this.overlayRoot = null;
    document.getElementById('viewport')?.classList.remove('cutscene');
  }
}
