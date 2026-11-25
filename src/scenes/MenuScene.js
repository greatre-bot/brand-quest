import Phaser from 'phaser';
import {GameSession} from '../systems/GameSession.js';
import {preloadPixels} from '../render/district.js';
import {WORLDS} from '../data/worlds.js';
import {mountTitleScreen} from '../ui/titleScreen.js';
import {sound} from '../systems/audio.js';
import {setTouchSceneMode} from '../systems/touchControls.js';
import {applyCenteredPanoramaCamera} from '../systems/viewportFit.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  init(data = {}) {
    this.opts = data || {};
    this.unmount = null;
  }
  preload() { preloadPixels(this); }
  create() {
    const saved = !this.opts.fresh ? GameSession.load() : null;
    if (this.opts.fresh && this.opts.autoStart) {
      const session = new GameSession(this.opts.mode || 'demo');
      this.registry.set('session', session);
      this.scene.start('WorldScene', {world: 'jakarta', intro: !this.opts.skipIntro});
      return;
    }

    // Animated widescreen pixel twin-city panorama behind the title card
    this.cameras.main.setBackgroundColor('#1a3330');
    applyCenteredPanoramaCamera(this);
    this.events.on('bq-resize', () => applyCenteredPanoramaCamera(this));
    const g = this.add.graphics();
    const sky = [0x1b3738, 0x264c4a, 0x38665d, 0x5c856d, 0x99a97c, 0xd8bd8b];
    sky.forEach((c, i) => g.fillStyle(c).fillRect(-120, i * 40, 880, 42));
    // Stepped pixel sunlit horizon glow (zero anti-aliased circles)
    const sunBand=(cx,cy,r,col,a)=>{
      g.fillStyle(col,a);
      g.fillRect(cx-r,cy-Math.round(r*.55),r*2,Math.round(r*1.1));
      g.fillRect(cx-Math.round(r*.75),cy-Math.round(r*.8),Math.round(r*1.5),Math.round(r*1.6));
      g.fillRect(cx-Math.round(r*.45),cy-r,Math.round(r*.9),r*2);
    };
    sunBand(320,210,84,0xf5d697,0.38);
    sunBand(320,210,44,0xffebba,0.55);
    // Ground silhouettes: left Jakarta shophouses + palms, right Karawang industrial hall + crane/excavator
    g.fillStyle(0x223832).fillRect(-120, 232, 880, 128);
    g.fillStyle(0x2d483f).fillRect(-120, 232, 880, 6);
    // Extended side skyline wings for widescreen phones
    g.fillStyle(0x253a35).fillRect(-110, 194, 72, 38).fillRect(-32, 186, 50, 46);
    g.fillStyle(0x2b4042).fillRect(620, 184, 76, 48).fillRect(702, 196, 56, 36);
    // Left skyline: shophouses & Mixue red accent
    g.fillStyle(0x2a3f39).fillRect(24, 178, 68, 54).fillRect(102, 166, 92, 66).fillRect(204, 184, 62, 48);
    g.fillStyle(0xb84344).fillRect(114, 182, 68, 18);
    g.fillStyle(0xffe7b3, 0.7).fillRect(126, 206, 14, 18).fillRect(148, 206, 14, 18).fillRect(170, 206, 12, 18);
    // Right skyline: Karawang SANY hall + yellow excavator silhouette
    g.fillStyle(0x304547).fillRect(388, 168, 136, 64).fillRect(536, 188, 76, 44);
    g.fillStyle(0xc83f44).fillRect(472, 178, 32, 8);
    g.fillStyle(0x6d9098, 0.7).fillRect(398, 184, 58, 26);
    g.fillStyle(0xdca234).fillRect(548, 208, 28, 16).fillRect(572, 194, 8, 20);
    // Subtle dotted shuttle route arc connecting Jakarta and Karawang
    g.fillStyle(0xf3d491, 0.75);
    for (let i = 0; i < 14; i++) {
      const t = i / 13;
      const rx = 180 + t * 280;
      const ry = 258 - Math.sin(t * Math.PI) * 24;
      g.fillRect(Math.round(rx), Math.round(ry), 8, 3);
    }

    // Drifting pixel clouds
    this.clouds = [];
    for (const [cx, cy, w, spd] of [[60, 42, 64, 0.012], [240, 28, 82, 0.009], [460, 56, 70, 0.014], [580, 34, 52, 0.01]]) {
      const c = this.add.graphics();
      c.fillStyle(0xf5e5be, 0.25).fillRect(0, 6, w, 10).fillRect(10, 0, w - 20, 8);
      c.setPosition(cx, cy);
      this.clouds.push({node: c, w, spd});
    }

    sound.setWorld('menu', {restart: Boolean(this.opts.fresh)});
    setTouchSceneMode('none');
    this.savedSession = saved;
    this.unmount = mountTitleScreen(this, saved);
    this.events.once('shutdown', () => this.cleanup());
    this.events.once('destroy', () => this.cleanup());
  }
  update(_time, delta) {
    if (!this.clouds) return;
    for (const c of this.clouds) {
      c.node.x += Math.min(delta, 50) * c.spd;
      if (c.node.x > 660) c.node.x = -c.w - 10;
    }
  }
  launch(kind) {
    this.cleanup();
    if (kind === 'resume' && this.savedSession) {
      const s = this.savedSession;
      this.registry.set('session', s);
      this.scene.start('WorldScene', {
        world: WORLDS[s.world] ? s.world : 'jakarta',
        intro: !s.has('intro_done')
      });
      return;
    }
    const session = new GameSession();
    session.save();
    this.registry.set('session', session);
    this.scene.start('IntroScene');
  }
  cleanup() {
    if (this.unmount) { this.unmount(); this.unmount = null; }
  }
}
