// Scene BGM player (user-provided MP3s inlined for 100% offline play) + procedural Web Audio SFX.
import bgmOpeningUrl from '../../assets/audio/bgm-opening.mp3';
import bgmJakartaUrl from '../../assets/audio/bgm-jakarta.mp3';
import bgmMixueUrl from '../../assets/audio/bgm-mixue.mp3';
import bgmMixueBarUrl from '../../assets/audio/bgm-mixue-bar.mp3';
import bgmKarawangUrl from '../../assets/audio/bgm-karawang.mp3';
import bgmWorkshopUrl from '../../assets/audio/bgm-workshop.mp3';
import bgmEndingUrl from '../../assets/audio/bgm-ending.mp3';
import sfxAchievementUrl from '../../assets/audio/sfx-achievement.mp3';

const MUTE_KEY = 'brandquest-v1-muted';
const BGM_VOLUME = 0.38;
const DUCK_VOLUME = 0.11;

const TRACK_URLS = {
  opening: bgmOpeningUrl,
  jakarta: bgmJakartaUrl,
  mixue: bgmMixueUrl,
  mixue_bar: bgmMixueBarUrl,
  karawang: bgmKarawangUrl,
  workshop: bgmWorkshopUrl,
  ending: bgmEndingUrl
};

const WORLD_TO_TRACK = {
  menu: 'opening',
  intro: 'opening',
  ending: 'ending',
  jakarta: 'jakarta',
  mixue_shop: 'mixue',
  mixue_bar: 'mixue_bar',
  karawang: 'karawang',
  sany_workshop: 'workshop'
};

function readMuted() {
  try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; }
}

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.currentWorld = null;
    this.activeTrack = null;
    this.tracks = new Map();
    this.fades = new Map();
    this.duckTimer = null;
    this.ducked = false;
    this.achAudio = null;
    this.muted = readMuted();
    this.lastStepAt = 0;
    this.lastPourAt = 0;
    this.lastHumAt = 0;
    this.lastWinchAt = 0;
    this.pouring = false;
    this.pourNode = null;
    this.pourBuffer = null;
    this.busRideNode = null;

    // Auto-unlock audio cleanly on the very first user gesture anywhere in the page
    if (typeof window !== 'undefined') {
      const boot = () => this.unlock();
      window.addEventListener('pointerdown', boot, {passive: true});
      window.addEventListener('keydown', boot, {passive: true});
    }
  }

  ensure() {
    if (this.muted) return null;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      if (!this.ctx) {
        this.ctx = new Ctx();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.2;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return this.ctx.state === 'running' ? this.ctx : null;
    } catch {
      return null;
    }
  }

  getTrackAudio(trackKey) {
    const url = TRACK_URLS[trackKey];
    if (!url || typeof Audio === 'undefined') return null;
    let audio = this.tracks.get(trackKey);
    if (!audio) {
      audio = new Audio(url);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0;
      this.tracks.set(trackKey, audio);
    }
    return audio;
  }

  fadeAudio(key, audio, targetVol, ms = 450, pauseWhenZero = false) {
    if (!audio) return;
    const prev = this.fades.get(key);
    if (prev) cancelAnimationFrame(prev);
    const startVol = audio.volume;
    const startAt = performance.now();
    if (ms <= 0 || Math.abs(targetVol - startVol) < 0.005) {
      audio.volume = Math.max(0, Math.min(1, targetVol));
      if (pauseWhenZero && targetVol <= 0.001) {
        try { audio.pause(); } catch { /* ignore */ }
      }
      this.fades.delete(key);
      return;
    }
    const tick = now => {
      const t = Math.min(1, (now - startAt) / ms);
      audio.volume = Math.max(0, Math.min(1, startVol + (targetVol - startVol) * t));
      if (t < 1) {
        this.fades.set(key, requestAnimationFrame(tick));
      } else {
        this.fades.delete(key);
        if (pauseWhenZero && targetVol <= 0.001) {
          try { audio.pause(); } catch { /* ignore */ }
        }
      }
    };
    this.fades.set(key, requestAnimationFrame(tick));
  }

  playTrack(trackKey, {restart = false} = {}) {
    if (!trackKey || !(trackKey in TRACK_URLS)) return;
    const prevKey = this.activeTrack;
    const changed = prevKey !== trackKey;
    this.activeTrack = trackKey;
    if (this.muted) return;

    if (prevKey && changed) {
      const prevAudio = this.tracks.get(prevKey);
      if (prevAudio) this.fadeAudio(prevKey, prevAudio, 0, 320, true);
    }

    const nextAudio = this.getTrackAudio(trackKey);
    if (!nextAudio) return;
    // Restart track from 0:00 whenever switching to another scene's BGM or explicitly requested
    if (changed || restart) {
      try { nextAudio.currentTime = 0; } catch { /* ignore */ }
    }
    const target = this.ducked ? DUCK_VOLUME : BGM_VOLUME;
    if (nextAudio.paused) {
      const p = nextAudio.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }
    this.fadeAudio(trackKey, nextAudio, target, changed ? 360 : 200, false);
  }

  fadeOutBgm(ms = 360) {
    this.stopAchievement();
    if (!this.activeTrack) return;
    const prevKey = this.activeTrack;
    const prevAudio = this.tracks.get(prevKey);
    this.activeTrack = null;
    if (prevAudio) this.fadeAudio(prevKey, prevAudio, 0, ms, true);
  }

  stopAchievement() {
    clearTimeout(this.duckTimer);
    this.ducked = false;
    if (this.achAudio) {
      try { this.achAudio.pause(); this.achAudio.currentTime = 0; } catch { /* ignore */ }
    }
  }

  currentTrackKey() {
    return this.activeTrack;
  }

  unlock() {
    if (this.muted) return;
    this.ensure();
    if (this.activeTrack) {
      const audio = this.getTrackAudio(this.activeTrack);
      if (audio && audio.paused) {
        const p = audio.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
        this.fadeAudio(this.activeTrack, audio, this.ducked ? DUCK_VOLUME : BGM_VOLUME, 360, false);
      }
    }
  }

  isMuted() { return this.muted; }

  setMuted(flag) {
    this.muted = Boolean(flag);
    try { localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0'); } catch { /* ignore */ }
    if (this.muted) {
      this.stopPour();
      this.stopBusRide();
      this.stopAmbient();
      if (this.achAudio) {
        try { this.achAudio.pause(); this.achAudio.currentTime = 0; } catch { /* ignore */ }
      }
      clearTimeout(this.duckTimer);
      this.ducked = false;
    } else {
      this.ensure();
      if (this.activeTrack) this.playTrack(this.activeTrack);
    }
    return this.muted;
  }

  toggleMute() { return this.setMuted(!this.muted); }

  setWorld(worldId, opts = {}) {
    this.stopAchievement();
    this.currentWorld = worldId;
    const trackKey = WORLD_TO_TRACK[worldId] || 'opening';
    this.playTrack(trackKey, opts);
  }

  stopAmbient() {
    this.stopPour();
    this.stopBusRide();
    for (const [k, raf] of this.fades.entries()) {
      cancelAnimationFrame(raf);
      this.fades.delete(k);
    }
    for (const audio of this.tracks.values()) {
      try { audio.pause(); audio.volume = 0; } catch { /* ignore */ }
    }
  }

  // --- Core procedural Web Audio primitives ---
  tone(freq, dur = 0.09, type = 'triangle', gainVal = 0.22, delay = 0, endFreq = null) {
    const ctx = this.ensure();
    if (!ctx) return;
    try {
      const t = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(gainVal, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g);
      g.connect(this.master);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    } catch { /* ignore */ }
  }

  noise(dur = 0.06, filterFreq = 1800, gainVal = 0.18, delay = 0, q = 1.2, endFilterFreq = null) {
    const ctx = this.ensure();
    if (!ctx) return;
    try {
      const t = ctx.currentTime + delay;
      const len = Math.max(64, Math.floor(ctx.sampleRate * dur));
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(filterFreq, t);
      if (endFilterFreq) filter.frequency.exponentialRampToValueAtTime(Math.max(80, endFilterFreq), t + dur);
      filter.Q.value = q;
      const g = ctx.createGain();
      g.gain.setValueAtTime(gainVal, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(filter);
      filter.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + dur + 0.02);
    } catch { /* ignore */ }
  }

  // --- Rich Interactive World & UI SFX ---
  step(indoor = false, sprint = false) {
    const now = performance.now(), gap = sprint ? 190 : 275;
    if (now - this.lastStepAt < gap) return;
    this.lastStepAt = now;
    const base = indoor ? 205 : 145;
    this.tone(base + Math.random() * 22, 0.045, 'triangle', 0.075, 0, base * 0.65);
  }

  // Mixue shop glass/wood door + cheerful "叮咚~" convenience bell when entering
  doorShop(entering = true) {
    // Crisp door handle latch click + soft glass swing swoosh
    this.noise(0.035, 2200, 0.22, 0, 2.0);
    this.tone(180, 0.05, 'triangle', 0.14, 0.01, 110);
    this.noise(0.11, 780, 0.12, 0.03, 0.9, 420);
    if (entering) {
      // Classic bright 2-tone shop welcome chime ("叮咚~")
      this.tone(1318.5, 0.24, 'sine', 0.22, 0.09);
      this.tone(2637.0, 0.14, 'sine', 0.07, 0.09);
      this.tone(1046.5, 0.34, 'sine', 0.24, 0.23);
      this.tone(2093.0, 0.18, 'sine', 0.06, 0.23);
    } else {
      // Soft wooden/glass close thud on exit
      this.tone(135, 0.08, 'triangle', 0.16, 0.13, 72);
      this.noise(0.045, 950, 0.14, 0.14, 1.4);
    }
  }

  // Karawang SANY workshop heavy metal roller-shutter door
  doorWorkshop(entering = true) {
    // Metallic latch clank
    this.tone(420, 0.045, 'square', 0.12, 0, 190);
    this.noise(0.04, 2800, 0.18, 0, 2.2);
    // Rolling steel shutter rumble + rhythmic slat rattles
    this.noise(0.32, entering ? 420 : 720, 0.2, 0.04, 1.1, entering ? 860 : 340);
    for (let i = 0; i < 4; i++) {
      const f = entering ? (150 + i * 24) : (230 - i * 24);
      this.tone(f, 0.055, 'sawtooth', 0.07, 0.06 + i * 0.065, f * 0.85);
    }
    // Deep metallic stop thump
    this.tone(95, 0.11, 'triangle', 0.22, 0.32, 54);
  }

  // Intercity shuttle bus full driving audio: air-brake release, engine acceleration, gear shift, highway tire rush & arrival brake
  startBusRide(duration = 2.4) {
    this.stopBusRide();
    if (this.muted) return;
    this.ensure();
    const ctx = this.ctx;
    if (!ctx) return;
    const token = {active: true, nodes: [], out: null};
    this.busRideNode = token;

    const fire = () => {
      if (!token.active || this.muted || this.busRideNode !== token) return;
      try {
        const t = ctx.currentTime;
        const dur = Math.max(1.2, duration);
        const out = ctx.createGain();
        out.gain.setValueAtTime(0.001, t);
        out.gain.linearRampToValueAtTime(0.56, t + 0.08);
        out.gain.setValueAtTime(0.56, t + Math.max(0.2, dur - 0.28));
        out.gain.exponentialRampToValueAtTime(0.001, t + dur);
        out.connect(ctx.destination);
        token.out = out;

        // 1. Warm diesel bus engine (fundamental saw + sub-octave triangle + cylinder throb LFO)
        const engFilter = ctx.createBiquadFilter();
        engFilter.type = 'lowpass';
        engFilter.frequency.setValueAtTime(220, t);
        engFilter.frequency.linearRampToValueAtTime(480, t + 0.78);
        engFilter.frequency.linearRampToValueAtTime(340, t + 0.92);
        engFilter.frequency.linearRampToValueAtTime(520, t + dur - 0.55);
        engFilter.frequency.linearRampToValueAtTime(240, t + dur);
        engFilter.Q.value = 1.6;

        const engGain = ctx.createGain();
        engGain.gain.setValueAtTime(0.001, t);
        engGain.gain.linearRampToValueAtTime(0.42, t + 0.14);
        engGain.gain.setValueAtTime(0.42, t + Math.max(0.3, dur - 0.35));
        engGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        // Subtle engine cylinder chug (~18 Hz amplitude modulation)
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(14, t);
        lfo.frequency.linearRampToValueAtTime(24, t + 0.78);
        lfo.frequency.linearRampToValueAtTime(19, t + 0.92);
        lfo.frequency.linearRampToValueAtTime(26, t + dur - 0.5);
        lfo.frequency.linearRampToValueAtTime(15, t + dur);
        lfoGain.gain.value = 0.08;
        lfo.connect(lfoGain);
        lfoGain.connect(engGain.gain);
        lfo.start(t);
        lfo.stop(t + dur + 0.05);
        token.nodes.push(lfo);

        engFilter.connect(engGain);
        engGain.connect(out);

        for (const [type, mult, level] of [['sawtooth', 1.0, 0.55], ['triangle', 0.5, 0.75], ['sawtooth', 1.5, 0.2]]) {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = type;
          g.gain.value = level;
          // Rev 1st gear -> crisp gear shift -> highway cruise -> smooth arrival decel
          osc.frequency.setValueAtTime(54 * mult, t);
          osc.frequency.exponentialRampToValueAtTime(104 * mult, t + 0.78);
          osc.frequency.exponentialRampToValueAtTime(74 * mult, t + 0.92);
          osc.frequency.exponentialRampToValueAtTime(98 * mult, t + Math.max(1.1, dur - 0.52));
          osc.frequency.exponentialRampToValueAtTime(58 * mult, t + dur);
          osc.connect(g);
          g.connect(engFilter);
          osc.start(t);
          osc.stop(t + dur + 0.05);
          token.nodes.push(osc);
        }

        // 2. Highway asphalt tire & wind rush (warm filtered noise swelling during cruise)
        const roadLen = Math.floor(ctx.sampleRate * (dur + 0.1));
        const roadBuf = ctx.createBuffer(1, roadLen, ctx.sampleRate);
        const rData = roadBuf.getChannelData(0);
        let b0 = 0;
        for (let i = 0; i < roadLen; i++) {
          b0 = 0.82 * b0 + 0.18 * (Math.random() * 2 - 1);
          rData[i] = b0 * 1.4;
        }
        const roadSrc = ctx.createBufferSource();
        roadSrc.buffer = roadBuf;
        const roadFlt = ctx.createBiquadFilter();
        roadFlt.type = 'bandpass';
        roadFlt.frequency.setValueAtTime(220, t);
        roadFlt.frequency.linearRampToValueAtTime(540, t + 0.85);
        roadFlt.frequency.setValueAtTime(520, t + Math.max(1.0, dur - 0.55));
        roadFlt.frequency.linearRampToValueAtTime(240, t + dur);
        roadFlt.Q.value = 0.85;
        const roadGain = ctx.createGain();
        roadGain.gain.setValueAtTime(0.001, t);
        roadGain.gain.linearRampToValueAtTime(0.46, t + 0.45);
        roadGain.gain.setValueAtTime(0.46, t + Math.max(0.6, dur - 0.5));
        roadGain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        roadSrc.connect(roadFlt);
        roadFlt.connect(roadGain);
        roadGain.connect(out);
        roadSrc.start(t);
        roadSrc.stop(t + dur + 0.05);
        token.nodes.push(roadSrc);

        // 3. Departure & arrival pneumatic air-brake hiss ("嗤——")
        const hiss = (offset, hDur, fStart, fEnd, vol) => {
          const s = t + offset;
          if (s >= t + dur) return;
          const hLen = Math.max(64, Math.floor(ctx.sampleRate * hDur));
          const hBuf = ctx.createBuffer(1, hLen, ctx.sampleRate);
          const hData = hBuf.getChannelData(0);
          for (let i = 0; i < hLen; i++) {
            const p = i / hLen;
            hData[i] = (Math.random() * 2 - 1) * Math.sin(p * Math.PI) * (1 - 0.3 * p);
          }
          const hSrc = ctx.createBufferSource();
          hSrc.buffer = hBuf;
          const hFlt = ctx.createBiquadFilter();
          hFlt.type = 'bandpass';
          hFlt.frequency.setValueAtTime(fStart, s);
          hFlt.frequency.exponentialRampToValueAtTime(fEnd, s + hDur);
          hFlt.Q.value = 1.5;
          const hG = ctx.createGain();
          hG.gain.setValueAtTime(vol, s);
          hG.gain.exponentialRampToValueAtTime(0.001, s + hDur);
          hSrc.connect(hFlt);
          hFlt.connect(hG);
          hG.connect(out);
          hSrc.start(s);
          hSrc.stop(s + hDur + 0.02);
          token.nodes.push(hSrc);
        };
        hiss(0.02, 0.22, 3100, 1250, 0.36);
        hiss(Math.max(0.9, dur - 0.38), 0.26, 2600, 1050, 0.3);
      } catch { /* ignore */ }
    };

    if (ctx.state === 'suspended') ctx.resume().then(fire).catch(() => {});
    else fire();
  }

  stopBusRide() {
    const token = this.busRideNode;
    this.busRideNode = null;
    if (!token) return;
    token.active = false;
    try {
      const ctx = this.ctx;
      if (ctx && token.out) {
        const t = ctx.currentTime;
        token.out.gain.cancelScheduledValues(t);
        token.out.gain.setValueAtTime(Math.max(0.001, token.out.gain.value), t);
        token.out.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
        for (const n of token.nodes) {
          try { n.stop(t + 0.1); } catch { /* ignore */ }
        }
      } else {
        for (const n of token.nodes) {
          try { n.stop(); } catch { /* ignore */ }
        }
      }
    } catch { /* ignore */ }
  }

  // Short intercity bus departure cue (fallback helper)
  busDepart() {
    this.startBusRide(1.2);
  }

  // Paper / notebook page turn swoosh for Journal, Map, Tasks & Achievements
  pageFlip() {
    this.noise(0.09, 2400, 0.14, 0, 1.1, 1100);
    this.tone(540, 0.045, 'triangle', 0.09, 0.02, 680);
  }

  // Cozy Stardew-style warm speech blip pitched subtly by NPC
  talk(speaker = 'player') {
    const pitches = {
      student: 540, clerk: 520, hijab: 500, auntie: 430,
      vendor: 390, office: 380, rider: 410, guide: 460,
      wan: 340, documentarian: 340, engineer: 310, service_tech: 310,
      boss: 265, tech: 350, player: 420
    };
    const base = pitches[speaker] || 410;
    this.tone(base, 0.045, 'triangle', 0.11, 0, base * 1.14);
    this.tone(base * 1.22, 0.05, 'triangle', 0.08, 0.04, base * 1.05);
  }

  // Bright item pickup / crate stow chime
  pickup() {
    this.tone(587.33, 0.075, 'triangle', 0.16, 0);
    this.tone(880, 0.12, 'sine', 0.17, 0.065);
  }

  open() { this.tone(420, 0.07, 'triangle', 0.15, 0, 540); this.tone(590, 0.08, 'triangle', 0.11, 0.045); }
  close() { this.tone(440, 0.06, 'triangle', 0.11, 0, 310); }

  // Crisp, unmistakable DSLR/SLR mechanical shutter snap + mirror slap + advance click
  shutter() {
    if (this.muted) return;
    this.ensure();
    const ctx = this.ctx;
    if (!ctx) return;
    const fire = () => {
      try {
        const t = ctx.currentTime;
        const bus = ctx.createGain();
        bus.gain.value = 0.85; // Dedicated loud-and-clear shutter gain above BGM
        bus.connect(ctx.destination);

        const burst = (delay, dur, freq, q, vol) => {
          const len = Math.max(64, Math.floor(ctx.sampleRate * dur));
          const buf = ctx.createBuffer(1, len, ctx.sampleRate);
          const data = buf.getChannelData(0);
          for (let i = 0; i < len; i++) {
            const env = Math.pow(1 - i / len, 2.2);
            data[i] = (Math.random() * 2 - 1) * env;
          }
          const src = ctx.createBufferSource();
          src.buffer = buf;
          const flt = ctx.createBiquadFilter();
          flt.type = 'bandpass';
          flt.frequency.value = freq;
          flt.Q.value = q;
          const g = ctx.createGain();
          g.gain.setValueAtTime(vol, t + delay);
          g.gain.exponentialRampToValueAtTime(0.001, t + delay + dur);
          src.connect(flt);
          flt.connect(g);
          g.connect(bus);
          src.start(t + delay);
          src.stop(t + delay + dur + 0.01);
        };

        const clickTone = (delay, f0, f1, dur, vol, type = 'triangle') => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(f0, t + delay);
          osc.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + delay + dur);
          g.gain.setValueAtTime(vol, t + delay);
          g.gain.exponentialRampToValueAtTime(0.001, t + delay + dur);
          osc.connect(g);
          g.connect(bus);
          osc.start(t + delay);
          osc.stop(t + delay + dur + 0.01);
        };

        // Stage 1: Crisp metallic button + mirror slap ("ka-")
        burst(0, 0.032, 3600, 1.3, 0.95);
        clickTone(0, 1450, 420, 0.028, 0.42, 'square');
        // Stage 2: Focal-plane curtain snap ("-cha!")
        burst(0.042, 0.055, 1950, 1.0, 0.9);
        burst(0.046, 0.04, 4800, 1.8, 0.65);
        clickTone(0.044, 620, 160, 0.048, 0.36, 'triangle');
        // Stage 3: Soft mechanical mirror return click
        burst(0.115, 0.025, 2400, 1.6, 0.38);
      } catch { /* ignore */ }
    };
    if (ctx.state === 'suspended') ctx.resume().then(fire).catch(() => {});
    else fire();
  }

  chime() {
    this.tone(523.25, 0.12, 'triangle', 0.18, 0);
    this.tone(659.25, 0.12, 'triangle', 0.18, 0.08);
    this.tone(783.99, 0.2, 'triangle', 0.2, 0.16);
  }

  error() {
    this.tone(210, 0.11, 'sawtooth', 0.12, 0, 155);
    this.tone(150, 0.14, 'triangle', 0.14, 0.09, 115);
  }

  // Fresh lemon slice dropping into the mixing cup (wet plop + light splash)
  lemonDrop() {
    if (this.muted) return;
    this.ensure();
    const ctx = this.ctx;
    if (!ctx) return;
    const fire = () => {
      try {
        const t = ctx.currentTime;
        const out = ctx.createGain();
        out.gain.value = 0.5;
        out.connect(ctx.destination);

        // Wet upward plop
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(230, t);
        osc.frequency.exponentialRampToValueAtTime(520, t + 0.055);
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.55, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.085);
        osc.connect(g);
        g.connect(out);
        osc.start(t);
        osc.stop(t + 0.095);

        // Soft bottom settle thump
        const thump = ctx.createOscillator();
        const tg = ctx.createGain();
        thump.type = 'triangle';
        thump.frequency.setValueAtTime(185, t + 0.015);
        thump.frequency.exponentialRampToValueAtTime(115, t + 0.065);
        tg.gain.setValueAtTime(0.32, t + 0.015);
        tg.gain.exponentialRampToValueAtTime(0.001, t + 0.075);
        thump.connect(tg);
        tg.connect(out);
        thump.start(t + 0.015);
        thump.stop(t + 0.085);
      } catch { /* ignore */ }
    };
    if (ctx.state === 'suspended') ctx.resume().then(fire).catch(() => {});
    else fire();
  }

  // Chewy brown-sugar boba pearls plopping rapidly into cup bottom ("噗嘟噗嘟！")
  bobaDrop() {
    if (this.muted) return;
    this.ensure();
    const ctx = this.ctx;
    if (!ctx) return;
    const fire = () => {
      try {
        const t = ctx.currentTime;
        const out = ctx.createGain();
        out.gain.value = 0.56;
        out.connect(ctx.destination);
        const plops = [
          [0.00, 175, 360, 0.055, 0.42],
          [0.045, 205, 415, 0.052, 0.46],
          [0.092, 188, 385, 0.050, 0.40],
          [0.142, 225, 455, 0.058, 0.36]
        ];
        for (const [delay, f0, f1, dur, vol] of plops) {
          const s = t + delay;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f0, s);
          osc.frequency.exponentialRampToValueAtTime(f1, s + dur);
          g.gain.setValueAtTime(0.001, s);
          g.gain.linearRampToValueAtTime(vol, s + 0.007);
          g.gain.exponentialRampToValueAtTime(0.001, s + dur);
          osc.connect(g);
          g.connect(out);
          osc.start(s);
          osc.stop(s + dur + 0.01);
        }
      } catch { /* ignore */ }
    };
    if (ctx.state === 'suspended') ctx.resume().then(fire).catch(() => {});
    else fire();
  }

  // Crisp cascading ice cubes clinking into a cold cup ("咔啦—叮当叮当！")
  iceDrop() {
    if (this.muted) return;
    this.ensure();
    const ctx = this.ctx;
    if (!ctx) return;
    const fire = () => {
      try {
        const t = ctx.currentTime;
        const out = ctx.createGain();
        out.gain.value = 0.62;
        out.connect(ctx.destination);

        // Scoop tumble noise (cubes sliding & rattling into the cup)
        const tumbleDur = 0.13;
        const tLen = Math.max(64, Math.floor(ctx.sampleRate * tumbleDur));
        const tBuf = ctx.createBuffer(1, tLen, ctx.sampleRate);
        const tData = tBuf.getChannelData(0);
        for (let i = 0; i < tLen; i++) {
          const p = i / tLen;
          tData[i] = (Math.random() * 2 - 1) * Math.sin(p * Math.PI) * (1 - 0.35 * p);
        }
        const tSrc = ctx.createBufferSource();
        tSrc.buffer = tBuf;
        const tFlt = ctx.createBiquadFilter();
        tFlt.type = 'bandpass';
        tFlt.frequency.setValueAtTime(2200, t);
        tFlt.frequency.exponentialRampToValueAtTime(3800, t + tumbleDur);
        tFlt.Q.value = 1.5;
        const tGain = ctx.createGain();
        tGain.gain.setValueAtTime(0.26, t);
        tGain.gain.exponentialRampToValueAtTime(0.001, t + tumbleDur);
        tSrc.connect(tFlt);
        tFlt.connect(tGain);
        tGain.connect(out);
        tSrc.start(t);
        tSrc.stop(t + tumbleDur + 0.01);

        // 4 staggered crystalline cube-on-cup / cube-on-cube clinks
        const clinks = [
          [0.00, 2320, 3340, 0.055, 0.42],
          [0.058, 2890, 4180, 0.062, 0.46],
          [0.115, 2540, 3760, 0.052, 0.36],
          [0.175, 3210, 4640, 0.068, 0.32]
        ];
        for (const [delay, f1, f2, dur, vol] of clinks) {
          const s = t + delay;
          for (const [freq, ratio, type] of [[f1, 1.0, 'sine'], [f2, 0.62, 'triangle']]) {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, s);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.96, s + dur);
            g.gain.setValueAtTime(0.001, s);
            g.gain.linearRampToValueAtTime(vol * ratio, s + 0.0025);
            g.gain.exponentialRampToValueAtTime(0.0008, s + dur);
            osc.connect(g);
            g.connect(out);
            osc.start(s);
            osc.stop(s + dur + 0.01);
          }
          // Crisp glassy impact click
          const cLen = Math.max(48, Math.floor(ctx.sampleRate * 0.014));
          const cBuf = ctx.createBuffer(1, cLen, ctx.sampleRate);
          const cData = cBuf.getChannelData(0);
          for (let i = 0; i < cLen; i++) cData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / cLen, 2.5);
          const cSrc = ctx.createBufferSource();
          cSrc.buffer = cBuf;
          const cFlt = ctx.createBiquadFilter();
          cFlt.type = 'highpass';
          cFlt.frequency.value = 3800;
          const cG = ctx.createGain();
          cG.gain.setValueAtTime(vol * 0.72, s);
          cG.gain.exponentialRampToValueAtTime(0.001, s + 0.014);
          cSrc.connect(cFlt);
          cFlt.connect(cG);
          cG.connect(out);
          cSrc.start(s);
          cSrc.stop(s + 0.02);
        }

        // Subtle cup-bottom weight thud on first two cubes landing
        for (const [delay, f0, vol] of [[0.004, 275, 0.24], [0.065, 235, 0.16]]) {
          const s = t + delay;
          const bOsc = ctx.createOscillator();
          const bG = ctx.createGain();
          bOsc.type = 'triangle';
          bOsc.frequency.setValueAtTime(f0, s);
          bOsc.frequency.exponentialRampToValueAtTime(130, s + 0.042);
          bG.gain.setValueAtTime(vol, s);
          bG.gain.exponentialRampToValueAtTime(0.001, s + 0.045);
          bOsc.connect(bG);
          bG.connect(out);
          bOsc.start(s);
          bOsc.stop(s + 0.055);
        }
      } catch { /* ignore */ }
    };
    if (ctx.state === 'suspended') ctx.resume().then(fire).catch(() => {});
    else fire();
  }

  // Continuous pouring water stream into an iced cup (pitch rises with fill level!)
  startPour(level = 0) {
    if (this.muted) return;
    this.pouring = true;
    if (this.pourNode) {
      this.updatePour(level);
      return;
    }
    this.ensure();
    const ctx = this.ctx;
    if (!ctx) return;
    const boot = () => {
      if (!this.pouring || this.muted || this.pourNode) return;
      try {
        const t = ctx.currentTime;
        if (!this.pourBuffer || this.pourBuffer.sampleRate !== ctx.sampleRate) {
          const len = Math.floor(ctx.sampleRate * 1.4);
          const buf = ctx.createBuffer(1, len, ctx.sampleRate);
          const data = buf.getChannelData(0);
          let b0 = 0, b1 = 0;
          for (let i = 0; i < len; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.72 * b0 + 0.28 * white;
            b1 = 0.45 * b1 + 0.55 * (white - b0 * 0.4);
            data[i] = Math.max(-1, Math.min(1, (b0 * 0.65 + b1 * 0.6) * 1.15));
          }
          // Crossfade edges for a completely seamless noise loop
          const xfade = Math.min(1024, Math.floor(len * 0.05));
          for (let i = 0; i < xfade; i++) {
            const w = i / xfade;
            data[len - xfade + i] = data[len - xfade + i] * (1 - w) + data[i] * w;
          }
          this.pourBuffer = buf;
        }
        const src = ctx.createBufferSource();
        src.buffer = this.pourBuffer;
        src.loop = true;

        // Primary cup-cavity stream resonance (rises as cup fills!)
        const cavity = ctx.createBiquadFilter();
        cavity.type = 'bandpass';
        cavity.frequency.setValueAtTime(660 + level * 12, t);
        cavity.Q.value = 1.9;
        const cavityGain = ctx.createGain();
        cavityGain.gain.value = 0.85;

        // Secondary splash / fizz over ice cubes
        const splash = ctx.createBiquadFilter();
        splash.type = 'bandpass';
        splash.frequency.setValueAtTime(2750 + level * 11, t);
        splash.Q.value = 1.3;
        const splashGain = ctx.createGain();
        splashGain.gain.value = 0.36;

        const out = ctx.createGain();
        out.gain.setValueAtTime(0.0008, t);
        out.gain.linearRampToValueAtTime(0.56, t + 0.045);

        src.connect(cavity);
        cavity.connect(cavityGain);
        cavityGain.connect(out);
        src.connect(splash);
        splash.connect(splashGain);
        splashGain.connect(out);
        out.connect(ctx.destination);
        src.start(t);

        this.pourNode = {src, cavity, splash, out};
      } catch { /* ignore */ }
    };
    if (ctx.state === 'suspended') ctx.resume().then(boot).catch(() => {});
    else boot();
  }

  updatePour(level = 0) {
    if (this.muted) return;
    if (!this.pourNode && this.pouring) this.startPour(level);
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    if (this.pourNode) {
      try {
        this.pourNode.cavity.frequency.setTargetAtTime(660 + level * 12.5, t, 0.04);
        this.pourNode.splash.frequency.setTargetAtTime(2750 + level * 11, t, 0.05);
      } catch { /* ignore */ }
    }
    // Crisp bubbling glugs + occasional rising-ice clink
    const now = performance.now();
    if (now - this.lastPourAt < 72) return;
    this.lastPourAt = now;
    try {
      const f0 = 360 + level * 5.2 + Math.random() * 140;
      const dur = 0.042 + Math.random() * 0.018;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.exponentialRampToValueAtTime(f0 * 1.62, t + dur);
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.24, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.01);

      // Gentle floating-ice clink as liquid lifts the cubes
      if (Math.random() < 0.28) {
        const ic = ctx.createOscillator();
        const ig = ctx.createGain();
        const cf = 3050 + Math.random() * 1150;
        ic.type = 'sine';
        ic.frequency.setValueAtTime(cf, t + 0.01);
        ig.gain.setValueAtTime(0.001, t + 0.01);
        ig.gain.linearRampToValueAtTime(0.095, t + 0.013);
        ig.gain.exponentialRampToValueAtTime(0.0008, t + 0.046);
        ic.connect(ig);
        ig.connect(ctx.destination);
        ic.start(t + 0.01);
        ic.stop(t + 0.055);
      }
    } catch { /* ignore */ }
  }

  stopPour() {
    this.pouring = false;
    const node = this.pourNode;
    this.pourNode = null;
    if (!node) return;
    try {
      const ctx = this.ctx;
      if (ctx) {
        const t = ctx.currentTime;
        node.out.gain.cancelScheduledValues(t);
        node.out.gain.setValueAtTime(Math.max(0.001, node.out.gain.value), t);
        node.out.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
        node.src.stop(t + 0.06);
      } else {
        node.src.stop();
      }
    } catch { /* ignore */ }
  }

  pour(level = 45) {
    this.updatePour(level);
  }

  // Syrup dispenser pump click for Mixue sugar selection
  syrupPump() {
    if (this.muted) return;
    this.ensure();
    const ctx = this.ctx;
    if (!ctx) return;
    const fire = () => {
      try {
        const t = ctx.currentTime;
        const out = ctx.createGain();
        out.gain.value = 0.44;
        out.connect(ctx.destination);
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, t);
        osc.frequency.exponentialRampToValueAtTime(860, t + 0.055);
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.42, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.068);
        osc.connect(g);
        g.connect(out);
        osc.start(t);
        osc.stop(t + 0.08);
      } catch { /* ignore */ }
    };
    if (ctx.state === 'suspended') ctx.resume().then(fire).catch(() => {});
    else fire();
  }

  // Soft-serve ice cream swirl machine whoosh for cones & sundaes
  swirl() {
    if (this.muted) return;
    this.ensure();
    const ctx = this.ctx;
    if (!ctx) return;
    const fire = () => {
      try {
        const t = ctx.currentTime;
        const out = ctx.createGain();
        out.gain.value = 0.48;
        out.connect(ctx.destination);
        const dur = 0.19;
        const len = Math.max(64, Math.floor(ctx.sampleRate * dur));
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) {
          const p = i / len;
          data[i] = (Math.random() * 2 - 1) * Math.sin(p * Math.PI);
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const flt = ctx.createBiquadFilter();
        flt.type = 'bandpass';
        flt.frequency.setValueAtTime(1150, t);
        flt.frequency.exponentialRampToValueAtTime(2150, t + dur);
        flt.Q.value = 1.6;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.32, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        src.connect(flt);
        flt.connect(g);
        g.connect(out);
        src.start(t);
        src.stop(t + dur + 0.01);

        const osc = ctx.createOscillator();
        const og = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, t);
        osc.frequency.exponentialRampToValueAtTime(640, t + 0.15);
        og.gain.setValueAtTime(0.001, t);
        og.gain.linearRampToValueAtTime(0.28, t + 0.02);
        og.gain.exponentialRampToValueAtTime(0.001, t + 0.17);
        osc.connect(og);
        og.connect(out);
        osc.start(t);
        osc.stop(t + 0.18);
      } catch { /* ignore */ }
    };
    if (ctx.state === 'suspended') ctx.resume().then(fire).catch(() => {});
    else fire();
  }

  // Classic counter service bell ("叮！") when serving a Mixue combo
  orderBell() {
    if (this.muted) return;
    this.ensure();
    const ctx = this.ctx;
    if (!ctx) return;
    const fire = () => {
      try {
        const t = ctx.currentTime;
        const out = ctx.createGain();
        out.gain.value = 0.45;
        out.connect(ctx.destination);
        for (const [freq, dur, vol] of [[1567.98, 0.42, 0.55], [3135.96, 0.26, 0.24], [4703.94, 0.14, 0.1]]) {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          g.gain.setValueAtTime(0.001, t);
          g.gain.linearRampToValueAtTime(vol, t + 0.004);
          g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
          osc.connect(g);
          g.connect(out);
          osc.start(t);
          osc.stop(t + dur + 0.02);
        }
      } catch { /* ignore */ }
    };
    if (ctx.state === 'suspended') ctx.resume().then(fire).catch(() => {});
    else fire();
  }

  // SANY Gantry Crane mechanical winch whir/ratchet while raising or lowering hook
  craneWinch(lowering = true) {
    const now = performance.now();
    if (now - this.lastWinchAt < 95) return;
    this.lastWinchAt = now;
    if (this.muted) return;
    this.ensure();
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    try {
      const t = ctx.currentTime;
      const out = ctx.createGain();
      out.gain.value = 0.28;
      out.connect(ctx.destination);
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      const f0 = lowering ? 210 : 265;
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.exponentialRampToValueAtTime(lowering ? 175 : 310, t + 0.065);
      const flt = ctx.createBiquadFilter();
      flt.type = 'bandpass';
      flt.frequency.value = 680;
      flt.Q.value = 1.8;
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.45, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.072);
      osc.connect(flt);
      flt.connect(g);
      g.connect(out);
      osc.start(t);
      osc.stop(t + 0.08);
    } catch { /* ignore */ }
  }

  // Heavy steel crane claw latching onto a SANY cargo crate
  craneLatch() {
    if (this.muted) return;
    this.ensure();
    const ctx = this.ctx;
    if (!ctx) return;
    const fire = () => {
      try {
        const t = ctx.currentTime;
        const out = ctx.createGain();
        out.gain.value = 0.58;
        out.connect(ctx.destination);
        // Deep steel impact
        const thud = ctx.createOscillator();
        const tg = ctx.createGain();
        thud.type = 'triangle';
        thud.frequency.setValueAtTime(165, t);
        thud.frequency.exponentialRampToValueAtTime(68, t + 0.09);
        tg.gain.setValueAtTime(0.55, t);
        tg.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        thud.connect(tg);
        tg.connect(out);
        thud.start(t);
        thud.stop(t + 0.11);
        // Metallic claw lock clang
        for (const [delay, f0, f1, dur, vol] of [[0.012, 1380, 920, 0.06, 0.34], [0.055, 2240, 1780, 0.045, 0.28]]) {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(f0, t + delay);
          osc.frequency.exponentialRampToValueAtTime(f1, t + delay + dur);
          g.gain.setValueAtTime(vol, t + delay);
          g.gain.exponentialRampToValueAtTime(0.001, t + delay + dur);
          osc.connect(g);
          g.connect(out);
          osc.start(t + delay);
          osc.stop(t + delay + dur + 0.01);
        }
      } catch { /* ignore */ }
    };
    if (ctx.state === 'suspended') ctx.resume().then(fire).catch(() => {});
    else fire();
  }

  // Heavy SANY crate landing cleanly on workshop receiving bay floor
  crateDrop(gentle = true) {
    if (this.muted) return;
    this.ensure();
    const ctx = this.ctx;
    if (!ctx) return;
    const fire = () => {
      try {
        const t = ctx.currentTime;
        const out = ctx.createGain();
        out.gain.value = gentle ? 0.56 : 0.68;
        out.connect(ctx.destination);
        const thud = ctx.createOscillator();
        const tg = ctx.createGain();
        thud.type = 'triangle';
        thud.frequency.setValueAtTime(gentle ? 128 : 98, t);
        thud.frequency.exponentialRampToValueAtTime(44, t + 0.13);
        tg.gain.setValueAtTime(gentle ? 0.62 : 0.85, t);
        tg.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        thud.connect(tg);
        tg.connect(out);
        thud.start(t);
        thud.stop(t + 0.16);

        // Confirmation ping (gentle) or bump rattle (rough)
        const ping = ctx.createOscillator();
        const pg = ctx.createGain();
        ping.type = gentle ? 'sine' : 'sawtooth';
        ping.frequency.setValueAtTime(gentle ? 660 : 190, t + 0.08);
        ping.frequency.exponentialRampToValueAtTime(gentle ? 880 : 130, t + 0.2);
        pg.gain.setValueAtTime(gentle ? 0.34 : 0.26, t + 0.08);
        pg.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        ping.connect(pg);
        pg.connect(out);
        ping.start(t + 0.08);
        ping.stop(t + 0.24);
      } catch { /* ignore */ }
    };
    if (ctx.state === 'suspended') ctx.resume().then(fire).catch(() => {});
    else fire();
  }

  transit() {
    this.busDepart();
  }

  scooterMount() {
    this.tone(330, 0.06, 'triangle', 0.15, 0, 460);
    this.tone(523.25, 0.09, 'sine', 0.14, 0.055, 620);
  }

  scooterDismount() {
    this.tone(460, 0.06, 'triangle', 0.12, 0, 310);
    this.tone(260, 0.08, 'sine', 0.09, 0.05, 200);
  }

  scooterHum(boost = false) {
    const now = performance.now(), gap = boost ? 105 : 145;
    if (now - this.lastHumAt < gap) return;
    this.lastHumAt = now;
    const base = boost ? 185 : 142;
    this.tone(base + Math.random() * 12, 0.08, 'sine', 0.04, 0, base + 18);
  }

  // Authentic Jakarta e-scooter double horn ("嘀！嘀！" — same-pitch nasal piezo/diaphragm honk)
  horn() {
    if (this.muted) return;
    this.ensure();
    const ctx = this.ctx;
    if (!ctx) return;
    const fire = () => {
      try {
        const t = ctx.currentTime;
        const out = ctx.createGain();
        out.gain.value = 0.44;
        out.connect(ctx.destination);

        const beep = (startOffset, dur) => {
          const s = t + startOffset;
          const flt = ctx.createBiquadFilter();
          flt.type = 'bandpass';
          flt.frequency.value = 1480;
          flt.Q.value = 2.2;

          const body = ctx.createBiquadFilter();
          body.type = 'peaking';
          body.frequency.value = 465;
          body.gain.value = 6;

          const env = ctx.createGain();
          env.gain.setValueAtTime(0.001, s);
          env.gain.linearRampToValueAtTime(0.95, s + 0.01);
          env.gain.setValueAtTime(0.88, s + Math.max(0.015, dur - 0.015));
          env.gain.exponentialRampToValueAtTime(0.001, s + dur);

          flt.connect(body);
          body.connect(env);
          env.connect(out);

          // Twin slightly detuned horn diaphragm oscillators at identical fundamental (~465 Hz)
          for (const [type, f0, f1, level] of [
            ['sawtooth', 442, 466, 0.55],
            ['square', 446, 470, 0.35],
            ['sawtooth', 910, 934, 0.18]
          ]) {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(f0, s);
            osc.frequency.exponentialRampToValueAtTime(f1, s + 0.018);
            g.gain.value = level;
            osc.connect(g);
            g.connect(flt);
            osc.start(s);
            osc.stop(s + dur + 0.015);
          }
        };

        // Crisp double honk at identical pitch: "嘀! 嘀!"
        beep(0, 0.09);
        beep(0.145, 0.125);
      } catch { /* ignore */ }
    };
    if (ctx.state === 'suspended') ctx.resume().then(fire).catch(() => {});
    else fire();
  }

  // Real user-provided achievement fanfare (完成成就.mp3) with smooth BGM ducking!
  achievement() {
    if (this.muted) return;
    if (typeof Audio !== 'undefined' && sfxAchievementUrl) {
      try {
        if (!this.achAudio) this.achAudio = new Audio(sfxAchievementUrl);
        this.achAudio.pause();
        this.achAudio.currentTime = 0;
        this.achAudio.volume = 0.56;
        const p = this.achAudio.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});

        // Gently duck active BGM during the 5.2s achievement fanfare, then swell back up
        this.ducked = true;
        if (this.activeTrack) {
          const cur = this.tracks.get(this.activeTrack);
          if (cur && !cur.paused) this.fadeAudio(this.activeTrack, cur, DUCK_VOLUME, 220, false);
        }
        clearTimeout(this.duckTimer);
        this.duckTimer = window.setTimeout(() => {
          this.ducked = false;
          if (!this.muted && this.activeTrack) {
            const cur = this.tracks.get(this.activeTrack);
            if (cur && !cur.paused) this.fadeAudio(this.activeTrack, cur, BGM_VOLUME, 550, false);
          }
        }, 5100);
        return;
      } catch { /* fallback below */ }
    }
    this.tone(523.25, 0.09, 'triangle', 0.16, 0);
    this.tone(659.25, 0.09, 'triangle', 0.16, 0.075);
    this.tone(783.99, 0.1, 'triangle', 0.17, 0.15);
    this.tone(1046.5, 0.22, 'triangle', 0.19, 0.23);
  }
}

export const sound = new SoundEngine();
if (typeof window !== 'undefined') window.BRAND_QUEST_SOUND = sound;
