import Phaser from 'phaser';
import {WORLDS} from '../data/worlds.js';
import {mountEndingBoard} from '../ui/endingBoard.js';
import {sound} from '../systems/audio.js';
import {setTouchSceneMode} from '../systems/touchControls.js';

export class EndingScene extends Phaser.Scene {
  constructor() { super('EndingScene'); }
  create() {
    this.cameras.main.setBackgroundColor('#162a27');
    this.epilogueActive = false;

    // Full-screen 640x360 pixel sunset return-flight panorama (revealed during epilogue finale)
    const sky = this.add.graphics();
    const bands = [
      [0, 46, 0x1b2640], [46, 44, 0x353754], [90, 44, 0x6b475c],
      [134, 42, 0xb56454], [176, 36, 0xe3995b], [212, 24, 0xf6cf7c],
      [236, 44, 0x264359], [280, 44, 0x1d3548], [324, 36, 0x152736]
    ];
    for (const [y, h, c] of bands) sky.fillStyle(c).fillRect(0, y, 640, h);
    // Stepped sunset pixel sun
    sky.fillStyle(0xf9c86d, 0.45).fillRect(268, 178, 104, 58).fillRect(284, 166, 72, 70);
    sky.fillStyle(0xfff0b2, 0.9).fillRect(298, 192, 44, 44).fillRect(306, 184, 28, 52);

    // Receding Java island silhouette on left horizon
    const island = this.add.graphics();
    island.fillStyle(0x2d4a41).fillRect(18, 224, 140, 12).fillRect(36, 214, 96, 12).fillRect(62, 206, 44, 10);

    // Drifting amber sunset clouds
    this.clouds = [];
    for (const [cx, cy, cw, spd] of [[70, 56, 78, 18], [260, 38, 96, 14], [470, 68, 72, 22], [170, 126, 90, 26], [520, 134, 82, 20]]) {
      const g = this.add.graphics();
      g.fillStyle(0xffdfb0, 0.72).fillRect(8, 0, cw - 16, 8).fillRect(0, 6, cw, 10);
      g.fillStyle(0xc87a62, 0.52).fillRect(4, 14, cw - 8, 4);
      g.setPosition(cx, cy);
      this.clouds.push({node: g, w: cw, spd});
    }

    // Animated sea glints & return-flight pixel plane cruising right -> left
    this.seaFx = this.add.graphics();
    this.contrail = this.add.graphics();
    this.plane = this.add.graphics();
    const p = this.plane;
    p.fillStyle(0x1f1916);
    p.fillRect(-26, -5, 52, 10);
    p.fillRect(20, -14, 10, 12);
    p.fillRect(-10, -20, 16, 40);
    p.fillRect(-30, -3, 8, 6);
    p.fillStyle(0xfaf4e1);
    p.fillRect(-24, -3, 48, 6);
    p.fillRect(-28, -2, 6, 4);
    p.fillStyle(0xd9c2a3);
    p.fillRect(-22, 1, 46, 2);
    p.fillStyle(0xcf4648);
    p.fillRect(22, -12, 6, 10);
    p.fillRect(-20, -1, 42, 2);
    p.fillStyle(0xf2e4cc);
    p.fillRect(-8, -18, 12, 14);
    p.fillRect(-8, 4, 12, 14);
    p.fillStyle(0x528ea6).fillRect(-22, -3, 8, 3);
    this.plane.setPosition(510, 104);

    sound.setWorld('ending', {restart: true});
    setTouchSceneMode('none');
    this.unmount = mountEndingBoard(this);
    this.events.once('shutdown', () => this.cleanup());
    this.events.once('destroy', () => this.cleanup());
  }

  update(time, delta) {
    const dt = Math.min(50, delta) / 1000;
    for (const c of this.clouds || []) {
      c.node.x += c.spd * dt;
      if (c.node.x > 660) c.node.x = -c.w - 16;
    }
    if (this.plane) {
      this.plane.x -= 42 * dt;
      if (this.plane.x < -60) this.plane.x = 700;
      this.plane.y = 96 + Math.sin(time / 280) * 4;
      this.contrail.clear();
      for (let i = 1; i <= 7; i++) {
        const tx = Math.round(this.plane.x + 28 + i * 16);
        const ty = Math.round(this.plane.y + Math.sin((time - i * 90) / 280) * 3);
        if (tx < 650) this.contrail.fillStyle(0xffe7b8, 0.65 - i * 0.08).fillRect(tx, ty - 1, 8, 3);
      }
    }
    if (this.seaFx) {
      this.seaFx.clear();
      const shift = Math.floor((time / 18) % 52);
      for (let y = 246; y < 346; y += 20) {
        for (let x = -shift; x < 640; x += 58) {
          this.seaFx.fillStyle(0xf6be74, 0.25).fillRect(x + ((y * 5) % 24), y, 16, 2);
        }
      }
    }
  }

  cleanup() {
    if (this.unmount) { this.unmount(); this.unmount = null; }
    document.getElementById('viewport')?.classList.remove('ending');
  }
  returnToWorld() {
    const s = this.registry.get('session');
    const target = s && WORLDS[s.world] ? s.world : 'jakarta';
    this.cleanup();
    this.scene.start('WorldScene', {world: target});
  }
  restartFresh() {
    this.cleanup();
    try { localStorage.removeItem('brandquest-v1-save'); } catch { /* ignore */ }
    this.scene.start('MenuScene', {fresh: true});
  }
}
