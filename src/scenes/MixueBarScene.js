import Phaser from 'phaser';
import {sound} from '../systems/audio.js';
import {setTouchSceneMode, isTouchEnabled} from '../systems/touchControls.js';
import {getViewMetrics, applyCenteredPanoramaCamera} from '../systems/viewportFit.js';
import {preloadPixels} from '../render/district.js';
import {el} from '../ui/panel.js';
import lemonUrl from '../../assets/pixel/ui/lemon.png';
import bobaUrl from '../../assets/pixel/ui/boba.png';
import strawberryUrl from '../../assets/pixel/ui/strawberry.png';
import iceUrl from '../../assets/pixel/ui/ice.png';
import uiConeUrl from '../../assets/pixel/ui/cone.png';
import bobaSundaeUrl from '../../assets/pixel/ui/boba-sundae.png';
import mangoSundaeUrl from '../../assets/pixel/ui/mango-sundae.png';

const DRINKS = {
  lemonade: {
    id: 'lemonade', name: '柠檬水', fullName: '冰鲜柠檬水',
    ingKey: 'lemon', ingUrl: lemonUrl, ingLabel: '柠檬片',
    tapLabel: '柠檬水龙头',
    liq: 0xefd968, foam: 0xfff5b3, tank: 0xf4dc69,
    liqHex: '#efd968', foamHex: '#fff5b3',
    floats: true, spoutX: 39,
    dropSfx: () => sound.lemonDrop()
  },
  boba_tea: {
    id: 'boba_tea', name: '奶茶', fullName: '黑糖珍珠奶茶',
    ingKey: 'boba', ingUrl: bobaUrl, ingLabel: '黑糖珍珠',
    tapLabel: '奶茶龙头',
    liq: 0xd9a46a, foam: 0xf7dfbc, tank: 0xc99259,
    liqHex: '#d9a46a', foamHex: '#f7dfbc',
    floats: false, spoutX: 95,
    dropSfx: () => sound.bobaDrop()
  },
  strawberry_tea: {
    id: 'strawberry_tea', name: '果茶', fullName: '草莓果茶',
    ingKey: 'strawberry', ingUrl: strawberryUrl, ingLabel: '鲜草莓',
    tapLabel: '果茶龙头',
    liq: 0xe86f7c, foam: 0xffd4da, tank: 0xeb7885,
    liqHex: '#e86f7c', foamHex: '#ffd4da',
    floats: true, spoutX: 151,
    dropSfx: () => sound.lemonDrop()
  }
};
const DRINK_LIST = [DRINKS.lemonade, DRINKS.boba_tea, DRINKS.strawberry_tea];

const DESSERTS = {
  cone: {id: 'cone', name: '原味甜筒', short: '甜筒', icon: 'ui-cone', url: uiConeUrl, baseColor: 0xdf9d4b, accent: 0xb87830},
  boba_sundae: {id: 'boba_sundae', name: '波霸圣代', short: '波霸圣代', icon: 'boba-sundae', url: bobaSundaeUrl, baseColor: 0xeef7f4, accent: 0x4a2a1d},
  mango_sundae: {id: 'mango_sundae', name: '芒果圣代', short: '芒果圣代', icon: 'mango-sundae', url: mangoSundaeUrl, baseColor: 0xeef7f4, accent: 0xf2a732}
};
const DESSERT_LIST = [DESSERTS.cone, DESSERTS.boba_sundae, DESSERTS.mango_sundae];

const ORDERS = [
  {
    customer: '莎拉', style: 'hijab', drink: 'lemonade', sugar: 'less', ice: true, dessert: 'cone',
    urge: [
      '“请问我的柠檬水快好了吗？”',
      '“外面好热呀，能不能稍微快一点？”',
      '“等太久啦，麻烦快点帮我出餐吧！”'
    ]
  },
  {
    customer: '巴古斯', style: 'office', drink: 'boba_tea', sugar: 'normal', ice: true, dessert: 'boba_sundae',
    urge: [
      '“麻烦快一点，待会儿还得回办公室。”',
      '“等了好一会儿了，还没做好吗？”',
      '“马上要开会迟到了！快点上餐呀！”'
    ]
  },
  {
    customer: '玛丽亚', style: 'auntie', drink: 'strawberry_tea', sugar: 'less', ice: true, dessert: 'mango_sundae',
    urge: [
      '“小伙子，我的草莓果茶在做了吧？”',
      '“哎呀，怎么等了这么久还没好？”',
      '“太慢啦！再不出餐我可要先走咯！”'
    ]
  }
];

// Interactive zones in 640x360 logical canvas coordinates
const HIT = {
  exit:     {x: 6,   y: 4,   w: 76,  h: 20},
  disp0:    {x: 14,  y: 118, w: 50,  h: 92},
  disp1:    {x: 70,  y: 118, w: 50,  h: 92},
  disp2:    {x: 126, y: 118, w: 50,  h: 92},
  trash:    {x: 10,  y: 266, w: 42,  h: 76},
  bin0:     {x: 60,  y: 238, w: 56,  h: 50},
  bin1:     {x: 122, y: 238, w: 56,  h: 50},
  bin2:     {x: 184, y: 238, w: 56,  h: 50},
  iceWell:  {x: 60,  y: 294, w: 86,  h: 50},
  syrup:    {x: 152, y: 294, w: 88,  h: 50},
  cupMat:   {x: 256, y: 224, w: 94,  h: 120},
  tray:     {x: 362, y: 244, w: 120, h: 98},
  bell:     {x: 382, y: 196, w: 80,  h: 40},
  customer: {x: 210, y: 76,  w: 110, h: 106},
  machine:  {x: 504, y: 102, w: 126, h: 134},
  base0:    {x: 494, y: 246, w: 42,  h: 64},
  base1:    {x: 540, y: 246, w: 42,  h: 64},
  base2:    {x: 586, y: 246, w: 42,  h: 64}
};

function inside(pt, box) {
  return pt.x >= box.x && pt.x <= box.x + box.w && pt.y >= box.y && pt.y <= box.y + box.h;
}

const pctX = x => {
  const {w, padX} = getViewMetrics();
  return (((x + padX) / w) * 100).toFixed(3) + '%';
};
const pctW = width => {
  const {w} = getViewMetrics();
  return ((width / w) * 100).toFixed(3) + '%';
};
const pctY = y => ((y / 360) * 100).toFixed(3) + '%';

export class MixueBarScene extends Phaser.Scene {
  constructor() {
    super('MixueBarScene');
  }

  init({returnSpawn = {x: 264, y: 196}} = {}) {
    this.returnSpawn = returnSpawn;
    this.barState = null;
  }

  preload() {
    if (!this.textures.exists('lemon') || !this.textures.exists('boba-sundae')) {
      preloadPixels(this);
    }
    if (!this.textures.exists('ui-cone')) {
      this.load.image('ui-cone', uiConeUrl);
    }
  }

  create() {
    const viewport = document.getElementById('viewport');
    viewport?.classList.add('cutscene');
    sound.setWorld('mixue_bar', {restart: true});
    setTouchSceneMode('mixue_bar', this);
    applyCenteredPanoramaCamera(this);
    this.events.on('bq-resize', () => {
      applyCenteredPanoramaCamera(this);
      this.layoutHud();
      this.syncOrderHud();
    });

    this.state = {
      orderIdx: 0,
      phase: 'entering', // 'tutorial' | 'entering' | 'serving' | 'review' | 'finished' | 'timeout'
      tutOpen: false,
      tutGuide: false,
      tutStep: 0,
      custX: 110,
      custMood: 'happy',
      patience: 1,
      urgeLevel: 0,
      urgeText: '',
      timeLeft: 80,
      scores: [],
      cupX: 303,
      cupY: 288,
      cupTopping: null,
      cupLiquidType: null,
      cupIce: false,
      cupSugar: 'normal',
      cupFill: 0,
      cupOnTray: false,
      trayDrink: null,
      pouringDrink: null,
      machineBase: null,
      swirlPct: 0,
      swirling: false,
      trayDessert: null,
      syrupPress: 0,
      bellPress: 0,
      trashOpen: 0,
      traySlideY: 0,
      reviewTimer: 0,
      reviewScore: 0,
      reviewText: '',
      reviewStars: '',
      drag: null,
      hover: null,
      flying: [],
      particles: [],
      popups: [],
      shiftAvg: 0
    };
    this.barState = this.state;

    // Pure pixel-art Phaser graphics layers (NO blurry sub-12px canvas text!)
    this.bgG = this.add.graphics().setDepth(0);
    this.windowFx = this.add.graphics().setDepth(2);
    this.custG = this.add.graphics().setDepth(10);
    this.counterG = this.add.graphics().setDepth(20);
    this.machineG = this.add.graphics().setDepth(25);
    this.cupG = this.add.graphics().setDepth(35);
    this.fxG = this.add.graphics().setDepth(50);

    this.drawStaticBackground();

    // Native 32x32 crisp pixel sprites placed directly on stations
    this.sprites = {
      bin0: this.add.image(88, 258, 'lemon').setDepth(27).setScale(0.92),
      bin1: this.add.image(150, 258, 'boba').setDepth(27).setScale(0.92),
      bin2: this.add.image(212, 258, 'strawberry').setDepth(27).setScale(0.92),
      iceBin: this.add.image(82, 319, 'ice').setDepth(27).setScale(0.92),
      base0: this.add.image(515, 270, 'ui-cone').setDepth(27).setScale(0.88),
      base1: this.add.image(561, 270, 'boba-sundae').setDepth(27).setScale(0.88),
      base2: this.add.image(607, 270, 'mango-sundae').setDepth(27).setScale(0.88),
      cupIng: this.add.image(294, 308, 'lemon').setDepth(37).setScale(0.78).setVisible(false),
      cupIce: this.add.image(313, 304, 'ice').setDepth(38).setScale(0.72).setVisible(false),
      trayDessert: this.add.image(448, 290, 'ui-cone').setDepth(38).setScale(1.05).setVisible(false),
      dragGhost: this.add.image(0, 0, 'lemon').setDepth(75).setScale(1.0).setVisible(false)
    };

    // High-DPI Crisp DOM HUD Overlay synced 1:1 with the 16:9 canvas (ZERO blurry text!)
    this.mountHudOverlay();
    this.bindInputs();

    const session = this.registry.get('session');
    if (!session?.has('mixue_bar_tut_done')) {
      this.state.phase = 'tutorial';
      this.openTutorial(true);
    } else {
      this.startOrder(0);
    }

    this.events.once('shutdown', () => this.cleanup());
    this.events.once('destroy', () => this.cleanup());
  }

  mountHudOverlay() {
    document.getElementById('mixue-bar-hud')?.remove();
    const viewport = document.getElementById('viewport');
    const root = el('div', 'mbar-hud');
    root.id = 'mixue-bar-hud';

    // 1. Top Crimson Header Bar
    const touch = isTouchEnabled();
    const topBar = el('div', 'mbar-topbar');
    const leftBtns = el('div', 'mbar-left-btns');
    const exitBtn = el('button', 'mbar-exit', touch ? '离开' : 'ESC 离开');
    exitBtn.type = 'button';
    exitBtn.addEventListener('click', () => { sound.close(); this.exitToShop(false); });
    const tutBtn = el('button', 'mbar-tut-btn', '? 教程');
    tutBtn.type = 'button';
    tutBtn.addEventListener('click', () => {
      if (this.state.phase === 'finished' || this.state.phase === 'timeout') return;
      sound.open();
      this.openTutorial(this.state.phase === 'tutorial');
    });
    leftBtns.append(exitBtn, tutBtn);

    const title = el('div', 'mbar-brand', 'MIXUE · 蜜雪冰城吧台');
    const stats = el('div', 'mbar-stats');
    const orderNum = el('span', 'mbar-stat-order', '第 1 / 3 单');
    const scoreTxt = el('span', 'mbar-stat-score', '★ 0%');
    const timerTxt = el('span', 'mbar-stat-timer', '80 秒');
    stats.append(orderNum, scoreTxt, timerTxt);
    topBar.append(leftBtns, title, stats);

    // 2. Restored HD Pure-Visual Iconic Customer Speech Bubble (Papa's / Overcooked style!)
    const bubble = el('div', 'mbar-bubble');
    const bubMain = el('div', 'mbar-bub-main');

    // Left: Crisp HD Visual Mixue Cup (liquid color + topping sprite + rim ice sprite + HD sugar pill)
    const drinkCol = el('div', 'mbar-vis-col drink');
    const cupWrap = el('div', 'mbar-vis-cup-wrap');
    const cupBox = el('div', 'mbar-vis-cup');
    const cupLiq = el('div', 'mbar-vis-liq');
    const cupIngImg = el('img', 'mbar-vis-ing'); cupIngImg.alt = '';
    cupBox.append(cupLiq, cupIngImg);
    const cupIceImg = el('img', 'mbar-vis-ice'); cupIceImg.alt = ''; cupIceImg.src = iceUrl;
    const drinkOkBadge = el('span', 'mbar-vis-ok', '☑');
    drinkOkBadge.hidden = true;
    cupWrap.append(cupBox, cupIceImg, drinkOkBadge);
    const drinkName = el('span', 'mbar-vis-name', '柠檬水');
    const sugarPill = el('span', 'mbar-vis-sugar', '少糖');
    drinkCol.append(cupWrap, drinkName, sugarPill);

    const plusSign = el('span', 'mbar-vis-plus', '+');

    // Right: Crisp HD Visual Dessert Frame (icon + short label)
    const desCol = el('div', 'mbar-vis-col dessert');
    const desBox = el('div', 'mbar-vis-des-box');
    const desIcon = el('img', 'mbar-vis-des-img'); desIcon.alt = '';
    const desOkBadge = el('span', 'mbar-vis-ok', '☑');
    desOkBadge.hidden = true;
    desBox.append(desIcon, desOkBadge);
    const desName = el('span', 'mbar-vis-name', '甜筒');
    const desTag = el('span', 'mbar-vis-des-tag', '冰淇淋机');
    desCol.append(desBox, desName, desTag);

    bubMain.append(drinkCol, plusSign, desCol);

    const reviewBanner = el('div', 'mbar-bub-review', '');
    reviewBanner.hidden = true;

    const patTrack = el('div', 'mbar-pat-track');
    const patFill = el('div', 'mbar-pat-fill');
    patTrack.append(patFill);

    const urgeLine = el('div', 'mbar-urge', '');
    urgeLine.hidden = true;

    bubble.append(bubMain, reviewBanner, patTrack, urgeLine);

    // 3. Pin-sharp Station Tags positioned directly over the 640x360 pixel stations (pointer-events: none)
    const pins = [];
    const pin = (cx, cy, text, cls = '') => {
      const node = el('span', 'mbar-pin ' + cls, text);
      node.style.left = pctX(cx);
      node.style.top = pctY(cy);
      root.append(node);
      pins.push({node, cx, cy});
      return node;
    };

    const custPlaque = pin(268, 184, '莎拉', 'plaque');
    const d0 = pin(39, 129, '柠檬水', 'tank');
    const d1 = pin(95, 129, '奶茶', 'tank');
    const d2 = pin(151, 129, '果茶', 'tank');
    const b0 = pin(88, 281, touch ? '柠檬' : '1 柠檬', 'bin');
    const b1 = pin(150, 281, touch ? '珍珠' : '2 珍珠', 'bin');
    const b2 = pin(212, 281, touch ? '草莓' : '3 草莓', 'bin');
    const iceTxt = pin(118, 320, touch ? '加冰' : '↑ 加冰', 'ice');
    const syrupTxt = pin(209, 320, touch ? '正常糖' : 'T 正常糖', 'syrup');
    const trashTxt = pin(31, 328, touch ? '重来' : 'R重来', 'trash');
    const cupStatus = pin(303, 338, '空杯', 'cup-tag');
    const bellTxt = pin(422, 232, touch ? '拍铃上餐' : '上餐 [Enter]', 'bell');
    const machTitle = pin(558, 114, '冰淇淋机', 'mach-title');
    const leverHint = pin(598, 198, touch ? '按住挤' : '按住F', 'lever');
    const base0 = pin(515, 299, touch ? '甜筒' : '4 甜筒', 'base');
    const base1 = pin(561, 299, touch ? '波霸' : '5 波霸', 'base');
    const base2 = pin(607, 299, touch ? '芒果' : '6 芒果', 'base');

    // 4. Live Interactive Beginner Spotlight Ring (highlights exact next station during Order 1 tutorial!)
    const tutRing = el('div', 'mbar-tut-ring');
    tutRing.hidden = true;
    const tutRingTag = el('span', 'mbar-tut-ring-tag', '▼ 第 1 步');
    tutRing.append(tutRingTag);

    const popLayer = el('div', 'mbar-pop-layer');

    const foot = el('div', 'mbar-foot');
    const footText = el('span', 'mbar-foot-text', touch
      ? '点/拖原料入杯 · 按住龙头注液至绿线 · 选甜品按住冰淇淋拉杆 · 拍响黄铜铃上餐'
      : '点/拖原料入杯 · 按住龙头或空格注液至绿线 · 选甜品按住冰淇淋拉杆或F · 按铃或Enter上餐');
    const skipGuideBtn = el('button', 'mbar-skip-guide', '跳过引导');
    skipGuideBtn.type = 'button';
    skipGuideBtn.hidden = true;
    skipGuideBtn.addEventListener('click', () => {
      sound.open();
      this.state.tutGuide = false;
      this.registry.get('session')?.flag('mixue_bar_tut_done');
      this.syncOrderHud();
    });
    foot.append(footText, skipGuideBtn);

    // 5. Visual 4-Step Beginner Tutorial Modal (#mixue-bar-tutorial)
    const tutWrap = el('div', 'mbar-tut-wrap');
    tutWrap.id = 'mixue-bar-tutorial';
    tutWrap.hidden = true;
    const tutCard = el('div', 'mbar-tut-card');

    const tutHead = el('div', 'mbar-tut-head');
    const tutIconL = el('img'); tutIconL.src = lemonUrl; tutIconL.alt = '';
    const tutTitle = el('h3', '', '蜜雪吧台 · 新手教程');
    const tutIconR = el('img'); tutIconR.src = uiConeUrl; tutIconR.alt = '';
    tutHead.append(tutIconL, tutTitle, tutIconR);

    const tutSub = el('p', 'mbar-tut-sub', '看顾客气泡里的图标调配「饮品 + 甜品」套餐，完成后拍响上餐铃即可出餐！');

    const stepCard = (num, titleText, descText, icons) => {
      const box = el('div', 'mbar-tut-step');
      const top = el('div', 'mbar-tut-step-top');
      top.append(el('span', 'mbar-tut-num', num), el('strong', '', titleText));
      const row = el('div', 'mbar-tut-step-body');
      if (icons.length) {
        const icWrap = el('div', 'mbar-tut-icons');
        icons.forEach(src => {
          const im = el('img'); im.src = src; im.alt = '';
          icWrap.append(im);
        });
        row.append(icWrap);
      }
      row.append(el('span', '', descText));
      box.append(top, row);
      return box;
    };

    const tutGrid = el('div', 'mbar-tut-grid');
    tutGrid.append(
      stepCard('1', '看图标放料、加冰、调糖', touch
        ? '点/拖柠檬、珍珠、草莓入杯；杯角有冰块就点加冰；杯下写少糖就点糖浆瓶切换。'
        : '点/拖 1柠檬 · 2珍珠 · 3草莓入杯；杯角有冰块就点 ↑加冰；杯下写少糖就按 T 切换。', [lemonUrl, iceUrl]),
      stepCard('2', '按住对应龙头注液', touch
        ? '看气泡杯颜色（黄柠檬水 / 棕奶茶 / 红果茶），按住左侧对应龙头，到绿色刻度线松手！'
        : '看气泡杯颜色（黄柠檬水 / 棕奶茶 / 红果茶），按住左侧龙头或空格，到绿色刻度线松手！', [bobaUrl, strawberryUrl]),
      stepCard('3', '冰淇淋机挤甜品', touch
        ? '按住右下甜筒、波霸或芒果卡片，或点选后按住冰淇淋机红拉杆，挤满自动放上托盘。'
        : '点选右下 4甜筒 / 5波霸 / 6芒果，按住红拉杆（或长按 F / 4-6）挤满即自动放上托盘。', [uiConeUrl, bobaSundaeUrl]),
      stepCard('4', '端上托盘、拍铃出餐', touch
        ? '点击红色托盘把杯子加盖放好，再拍响黄铜上餐铃交给顾客！'
        : '点击红色托盘把杯子加盖放好，再拍响黄铜上餐铃（或按 Enter）交给顾客！', [mangoSundaeUrl])
    );

    const tutActions = el('div', 'mbar-tut-actions');
    const btnGuide = el('button', 'mbar-tut-primary', '带教试做第 1 单 [Enter]');
    btnGuide.type = 'button';
    btnGuide.dataset.tut = 'guide';
    btnGuide.addEventListener('click', () => this.startGuidedTutorial());

    const btnSkip = el('button', 'mbar-tut-secondary', '跳过教程，直接接单');
    btnSkip.type = 'button';
    btnSkip.dataset.tut = 'skip';
    btnSkip.addEventListener('click', () => this.skipTutorial());

    const btnResume = el('button', 'mbar-tut-primary', '继续制作 [Enter]');
    btnResume.type = 'button';
    btnResume.dataset.tut = 'resume';
    btnResume.hidden = true;
    btnResume.addEventListener('click', () => this.closeTutorial());

    tutActions.append(btnGuide, btnSkip, btnResume);
    tutCard.append(tutHead, tutSub, tutGrid, tutActions);
    tutWrap.append(tutCard);

    // 6. End-of-Shift / Timeout Sharp Overlay Card
    const finishWrap = el('div', 'mbar-finish-wrap');
    finishWrap.hidden = true;
    const finishCard = el('div', 'mbar-finish-card');
    const finishTitle = el('h3', '', '');
    const finishSub = el('p', '', '');
    const finishBtn = el('button', 'mbar-finish-btn', '');
    finishBtn.type = 'button';
    finishBtn.addEventListener('click', () => {
      if (this.state.phase === 'finished') this.exitToShop(true);
      else if (this.state.phase === 'timeout') this.restartShift();
    });
    finishCard.append(finishTitle, finishSub, finishBtn);
    finishWrap.append(finishCard);

    root.append(topBar, bubble, tutRing, popLayer, foot, tutWrap, finishWrap);
    viewport.append(root);

    this.hud = {
      root, pins, orderNum, scoreTxt, timerTxt,
      bubble, cupLiq, cupIngImg, cupIceImg, drinkOkBadge, drinkName, sugarPill,
      desIcon, desOkBadge, desName, desTag, reviewBanner, patTrack, patFill, urgeLine,
      custPlaque, d0, d1, d2, b0, b1, b2, iceTxt, syrupTxt, trashTxt, cupStatus, bellTxt, machTitle, leverHint, base0, base1, base2,
      tutRing, tutRingTag, foot, footText, skipGuideBtn,
      tutWrap, btnGuide, btnSkip, btnResume,
      popLayer, finishWrap, finishTitle, finishSub, finishBtn
    };
    this.layoutHud();
  }

  layoutHud() {
    const h = this.hud;
    if (!h) return;
    h.bubble.style.left = pctX(311);
    h.bubble.style.width = pctW(182);
    for (const p of h.pins) {
      p.node.style.left = pctX(p.cx);
      p.node.style.top = pctY(p.cy);
    }
  }

  openTutorial(isInitial = false) {
    const s = this.state;
    this.stopPour();
    this.stopSwirl();
    s.tutOpen = true;
    if (this.hud) {
      this.hud.tutWrap.hidden = false;
      this.hud.btnGuide.hidden = !isInitial;
      this.hud.btnSkip.hidden = !isInitial;
      this.hud.btnResume.hidden = isInitial;
    }
    this.syncOrderHud();
  }

  startGuidedTutorial() {
    const s = this.state;
    sound.open();
    s.tutOpen = false;
    s.tutGuide = true;
    if (this.hud) this.hud.tutWrap.hidden = true;
    this.startOrder(0);
  }

  skipTutorial() {
    const s = this.state;
    sound.open();
    s.tutOpen = false;
    s.tutGuide = false;
    this.registry.get('session')?.flag('mixue_bar_tut_done');
    if (this.hud) this.hud.tutWrap.hidden = true;
    this.startOrder(0);
  }

  closeTutorial() {
    const s = this.state;
    sound.close();
    s.tutOpen = false;
    if (this.hud) this.hud.tutWrap.hidden = true;
    this.syncOrderHud();
  }

  getTutorialCue() {
    const s = this.state;
    if (!s.tutGuide || s.tutOpen || s.orderIdx !== 0 || s.phase !== 'serving') return null;
    const t = isTouchEnabled();
    if (!s.cupOnTray && s.cupLiquidType && s.cupLiquidType !== 'lemonade') {
      return {step: 4, box: HIT.trash, badge: '▼ 换空杯', pos: 'top', text: t ? '倒错茶底啦！点击左侧「重来」换个新空杯' : '倒错茶底啦！点击左侧「R重来」或按 R 换个新空杯'};
    }
    if (!s.cupOnTray && s.cupTopping !== 'lemonade') {
      return {step: 1, box: HIT.bin0, badge: '▼ 第 1 步', pos: 'top', text: t ? '教学 1/7：点击或拖动「柠檬」入杯（对应气泡杯里的柠檬）' : '教学 1/7：点击或拖动「1 柠檬」入杯（对应气泡杯里的柠檬）'};
    }
    if (!s.cupOnTray && !s.cupIce) {
      return {step: 2, box: HIT.iceWell, badge: '▼ 第 2 步', pos: 'top', text: t ? '教学 2/7：点击或拖动「加冰」入杯（对应气泡右上角冰块）' : '教学 2/7：点击或拖动「↑ 加冰」入杯（对应气泡右上角冰块）'};
    }
    if (!s.cupOnTray && s.cupSugar !== 'less') {
      return {step: 3, box: HIT.syrup, badge: '▼ 第 3 步', pos: 'top', text: t ? '教学 3/7：点击糖浆瓶切换为「少糖」（对应杯下少糖标签）' : '教学 3/7：点击糖浆瓶或按 T 切换为「少糖」（对应杯下少糖标签）'};
    }
    if (!s.cupOnTray && !(s.cupLiquidType === 'lemonade' && s.cupFill >= 60 && s.cupFill <= 80)) {
      return {step: 4, box: HIT.disp0, badge: '▼ 第 4 步', pos: 'top', text: t ? '教学 4/7：按住「柠檬水」龙头注液，到达杯身绿线松手' : '教学 4/7：按住「柠檬水」龙头或空格注液，到达杯身绿线松手'};
    }
    if (!s.cupOnTray) {
      return {step: 5, box: HIT.tray, badge: '▲ 第 5 步', pos: 'bottom', text: '教学 5/7：点击红色托盘（或把杯子拖上托盘）给饮品加盖'};
    }
    if (s.trayDessert !== 'cone') {
      if (s.machineBase === 'cone') {
        return {step: 6, box: HIT.machine, badge: '▼ 第 6 步', pos: 'top', text: t ? '教学 6/7：按住冰淇淋机红拉杆，把原味甜筒挤满' : '教学 6/7：按住冰淇淋机红拉杆或按 F 挤满原味甜筒'};
      }
      return {step: 6, box: HIT.base0, badge: '▼ 第 6 步', pos: 'top', text: t ? '教学 6/7：按住「甜筒」卡片（或点选后按红拉杆）挤出原味甜筒' : '教学 6/7：按住「4 甜筒」（或点选后再拉杆 F）挤出原味甜筒'};
    }
    return {step: 7, box: HIT.bell, badge: '▼ 最后一步', pos: 'top', text: t ? '教学 7/7：套餐齐啦！拍响黄铜上餐铃交给莎拉' : '教学 7/7：套餐齐啦！拍响黄铜上餐铃或按 Enter 交给莎拉'};
  }

  drawStaticBackground() {
    const g = this.bgG;
    // 1. Back shop cream tile wall (full-bleed ultra-wide -320..960)
    g.fillStyle(0xf2e4c2).fillRect(-320, 26, 1280, 152);
    g.fillStyle(0xe5d3aa);
    for (let y = 36; y < 176; y += 16) g.fillRect(-320, y, 1280, 1);
    for (let x = -320; x < 960; x += 24) g.fillRect(x, 26, 1, 152);

    // 2. Left & right storefront windows looking onto sunny Jakarta street
    const drawWindow = (x, y, w, h) => {
      g.fillStyle(0x4d3521).fillRect(x - 3, y - 3, w + 6, h + 6);
      g.fillStyle(0xa7dce8).fillRect(x, y, w, h);
      g.fillStyle(0xd2f1f5).fillRect(x, y, w, Math.floor(h * 0.48));
      g.fillStyle(0xd6a874).fillRect(x, y + h - 22, w, 22);
      g.fillStyle(0xb55947).fillRect(x + 8, y + h - 28, Math.floor(w * 0.42), 10);
      for (let ax = 0; ax < w; ax += 16) {
        g.fillStyle((ax / 16) % 2 === 0 ? 0xc4362e : 0xfff5dc).fillRect(x + ax, y, Math.min(16, w - ax), 12);
      }
      g.fillStyle(0x8c211b).fillRect(x, y + 12, w, 2);
      g.fillStyle(0xffffff, 0.25).fillRect(x + 8, y + 18, 6, h - 26).fillRect(x + 18, y + 18, 3, h - 32);
    };
    drawWindow(14, 36, 166, 78);
    drawWindow(512, 36, 114, 64);

    // Hanging wooden 4-panel Mixue menu board on back wall (Cone, Lemonade, Boba Tea, Strawberry Fruit Tea)
    g.fillStyle(0x5c3a1f).fillRect(190, 32, 116, 44);
    g.fillStyle(0xa82e29).fillRect(193, 35, 110, 38);
    for (let i = 0; i < 4; i++) {
      const mx = 196 + i * 27;
      g.fillStyle(0xfff1cc).fillRect(mx, 38, 24, 32);
      g.fillStyle(0xbf373a).fillRect(mx, 38, 24, 5);
      g.fillStyle(0x8a5838).fillRect(mx + 13, 66, 8, 2);
      const cx = mx + 12;
      if (i === 0) {
        g.fillStyle(0xdf9d4b).fillTriangle(cx - 5, 56, cx + 5, 56, cx, 65);
        g.fillStyle(0xffffff).fillRect(cx - 5, 49, 10, 7).fillRect(cx - 3, 46, 6, 4);
      } else {
        const liq = i === 1 ? 0xefd968 : i === 2 ? 0xd6a066 : 0xe86f7c;
        g.fillStyle(i === 2 ? 0x3a2618 : 0x3a7a4c).fillRect(cx + 2, 44, 2, 5);
        g.fillStyle(0x3a2c22).fillRect(cx - 6, 49, 12, 15);
        g.fillStyle(liq).fillRect(cx - 5, 51, 10, 12);
        g.fillStyle(0xbf373a).fillRect(cx - 7, 48, 14, 3);
        if (i === 1) g.fillStyle(0x88d4f2).fillRect(cx + 1, 52, 3, 3);
        if (i === 2) g.fillStyle(0x3c231a).fillRect(cx - 4, 59, 8, 3);
        if (i === 3) g.fillStyle(0x88d4f2).fillRect(cx + 1, 52, 3, 3).fillStyle(0xc72c38).fillRect(cx - 3, 56, 3, 3);
      }
    }

    // 3. Top Mixue Crimson Header Fascia backdrop (full-bleed ultra-wide)
    g.fillStyle(0xa82924).fillRect(-320, 0, 1280, 26);
    g.fillStyle(0xc93c35).fillRect(-320, 0, 1280, 4);
    g.fillStyle(0x6e1814).fillRect(-320, 24, 1280, 3);

    // 4. First-person Wooden Front Counter & Stainless Prep Workspace (full-bleed ultra-wide)
    g.fillStyle(0x4a2f18).fillRect(-320, 176, 1280, 4);
    g.fillStyle(0xd4a46a).fillRect(-320, 180, 1280, 12);
    g.fillStyle(0xe8be82).fillRect(-320, 180, 1280, 3);
    g.fillStyle(0x634123).fillRect(-320, 192, 1280, 3);
    g.fillStyle(0xc59a63).fillRect(-320, 195, 1280, 165);
    g.fillStyle(0xb58850);
    for (let y = 208; y < 346; y += 16) g.fillRect(-320, y, 1280, 2);
    g.fillStyle(0x3a2515).fillRect(-320, 344, 1280, 16);
    g.fillStyle(0x5c3c22).fillRect(-320, 344, 1280, 2);
  }

  currentOrder() {
    return ORDERS[this.state.orderIdx] || ORDERS[0];
  }

  restartShift() {
    const s = this.state;
    this.hud.finishWrap.hidden = true;
    s.timeLeft = 80;
    s.scores = [];
    this.hud.scoreTxt.textContent = '★ 0%';
    this.startOrder(0);
  }

  startOrder(idx) {
    const s = this.state;
    s.orderIdx = idx;
    s.phase = 'entering';
    s.custX = 110;
    s.custMood = 'happy';
    s.patience = 1;
    s.urgeLevel = 0;
    s.urgeText = '';
    s.traySlideY = 0;
    this.resetCupState(true);
    s.trayDrink = null;
    s.cupOnTray = false;
    s.machineBase = null;
    s.swirlPct = 0;
    s.swirling = false;
    s.trayDessert = null;
    this.sprites.trayDessert.setVisible(false);
    this.hud.orderNum.textContent = `第 ${idx + 1} / ${ORDERS.length} 单`;
    this.syncOrderHud();
  }

  syncOrderHud() {
    const s = this.state;
    const h = this.hud;
    if (!h) return;
    const ord = this.currentOrder();
    const drink = DRINKS[ord.drink];
    const des = DESSERTS[ord.dessert];

    const showBubble = (s.phase === 'serving' || s.phase === 'review') && !s.tutOpen;
    document.body.classList.toggle('mbar-modal-open', Boolean(s.tutOpen || s.phase === 'finished' || s.phase === 'timeout'));
    h.bubble.hidden = !showBubble;
    h.custPlaque.hidden = s.phase === 'finished' || s.phase === 'timeout' || s.phase === 'tutorial' || s.tutOpen;
    h.custPlaque.textContent = ord.customer;
    h.custPlaque.style.left = pctX(s.custX);

    const isGuided = s.tutGuide && s.orderIdx === 0;
    if (isGuided && s.phase === 'serving') {
      h.timerTxt.textContent = '教学模式';
      h.timerTxt.classList.remove('low');
      h.timerTxt.classList.add('tut');
    } else {
      h.timerTxt.classList.remove('tut');
      if (s.phase !== 'tutorial') {
        h.timerTxt.textContent = `${Math.ceil(s.timeLeft)} 秒`;
        h.timerTxt.classList.toggle('low', s.timeLeft <= 12);
      }
    }

    if (showBubble) {
      h.patFill.style.width = `${Math.round(s.patience * 100)}%`;
      h.patFill.style.background = isGuided
        ? '#4ca358'
        : s.patience > 0.65 ? '#4ca358' : s.patience > 0.42 ? '#8bb83d' : s.patience > 0.20 ? '#e59224' : '#d1362e';
      h.patTrack.classList.toggle('urgent', !isGuided && s.phase === 'serving' && s.patience <= 0.20);

      // Pure-visual HD drink glass
      h.cupLiq.style.background = drink.liqHex;
      h.cupLiq.style.borderTopColor = drink.foamHex;
      h.cupIngImg.src = drink.ingUrl;
      h.cupIceImg.hidden = !ord.ice;
      h.drinkName.textContent = drink.name;
      h.sugarPill.textContent = ord.sugar === 'less' ? '少糖 ½' : '正常糖';
      h.sugarPill.classList.toggle('less', ord.sugar === 'less');

      // Pure-visual HD dessert square
      h.desIcon.src = des.url;
      h.desName.textContent = des.short;

      const dRef = s.trayDrink || {topping: s.cupTopping, liquid: s.cupLiquidType, ice: s.cupIce, sugar: s.cupSugar, fill: s.cupFill};
      const drinkOk = dRef.topping === ord.drink && dRef.ice === ord.ice && dRef.sugar === ord.sugar && dRef.liquid === ord.drink && dRef.fill >= 60 && dRef.fill <= 80;
      const desOk = s.trayDessert === ord.dessert;

      h.drinkOkBadge.hidden = !drinkOk;
      h.desOkBadge.hidden = !desOk;
      h.desTag.textContent = desOk ? '已上托盘' : s.machineBase === ord.dessert ? (isTouchEnabled() ? '按住拉杆挤冰' : '按住拉杆[F]') : '冰淇淋机';
      h.desTag.classList.toggle('done', desOk);

      if (s.phase === 'review') {
        h.reviewBanner.hidden = false;
        h.reviewBanner.textContent = `${s.reviewScore}% ${s.reviewStars} · ${s.reviewText}`;
        h.reviewBanner.classList.toggle('good', s.reviewScore >= 85);
        h.urgeLine.hidden = true;
      } else {
        h.reviewBanner.hidden = true;
        if (s.urgeLevel > 0 && s.urgeText) {
          h.urgeLine.hidden = false;
          h.urgeLine.textContent = s.urgeText;
          h.urgeLine.className = 'mbar-urge lv' + s.urgeLevel;
        } else {
          h.urgeLine.hidden = true;
        }
      }
    }

    // Active cup contents summary badge
    if (s.cupOnTray || s.tutOpen) {
      h.cupStatus.hidden = true;
    } else {
      h.cupStatus.hidden = false;
      h.cupStatus.style.left = pctX(s.cupX);
      h.cupStatus.style.top = pctY(s.cupY + 48);
      const parts = [];
      if (s.cupTopping) parts.push(DRINKS[s.cupTopping].ingLabel);
      if (s.cupIce) parts.push('加冰');
      parts.push(s.cupSugar === 'less' ? '少糖' : '正常糖');
      h.cupStatus.textContent = (!s.cupTopping && !s.cupIce && s.cupFill === 0) ? '空杯' : parts.join('·');
    }

    // Highlight active dispenser cue when topping is ready & liquid not yet full
    const needPourId = (!s.cupOnTray && s.cupTopping && s.cupFill < 60 && s.phase === 'serving' && !s.tutOpen) ? s.cupTopping : null;
    h.d0.classList.toggle('pulse', needPourId === 'lemonade');
    h.d1.classList.toggle('pulse', needPourId === 'boba_tea');
    h.d2.classList.toggle('pulse', needPourId === 'strawberry_tea');

    const readyBell = Boolean((s.trayDrink || s.cupFill >= 45) && s.trayDessert && s.phase === 'serving' && !s.tutOpen);
    h.bellTxt.classList.toggle('ready', readyBell);
    h.leverHint.classList.toggle('pulse', Boolean(s.machineBase && !s.swirling && s.phase === 'serving' && !s.tutOpen));

    // Step-by-step live beginner spotlight ring + bottom bar cue
    const cue = this.getTutorialCue();
    s.tutStep = cue ? cue.step : 0;
    if (cue) {
      h.tutRing.hidden = false;
      h.tutRing.style.left = pctX(cue.box.x - 2);
      h.tutRing.style.top = pctY(cue.box.y - 2);
      h.tutRing.style.width = pctW(cue.box.w + 4);
      h.tutRing.style.height = pctY(cue.box.h + 4);
      h.tutRing.classList.toggle('tag-bottom', cue.pos === 'bottom');
      h.tutRingTag.textContent = cue.badge;
      h.foot.classList.add('tut-active');
      h.footText.textContent = cue.text;
      h.skipGuideBtn.hidden = false;
      const mNote = document.querySelector('.vpad-mixue-note');
      if (mNote) mNote.textContent = cue.text;
    } else {
      h.tutRing.hidden = true;
      h.foot.classList.remove('tut-active');
      h.footText.textContent = isTouchEnabled()
        ? '点/拖原料入杯 · 按住龙头注液至绿线 · 选甜品按住冰淇淋拉杆 · 拍响黄铜铃上餐'
        : '点/拖原料入杯 · 按住龙头或空格注液至绿线 · 选甜品按住冰淇淋拉杆或F · 按铃或Enter上餐';
      h.skipGuideBtn.hidden = true;
      const mNote = document.querySelector('.vpad-mixue-note');
      if (mNote) mNote.textContent = '可直接点按上方吧台，或用下方淡黄快捷按键调饮（横屏体验更佳）';
    }
  }

  resetCupState(quiet = false) {
    const s = this.state;
    this.stopPour();
    s.cupTopping = null;
    s.cupLiquidType = null;
    s.cupIce = false;
    s.cupSugar = 'normal';
    s.cupFill = 0;
    s.cupX = 303;
    s.cupY = 288;
    s.cupOnTray = false;
    this.sprites.cupIng.setVisible(false);
    this.sprites.cupIce.setVisible(false);
    if (this.hud) {
      this.hud.syrupTxt.textContent = isTouchEnabled() ? '正常糖' : 'T 正常糖';
      this.hud.syrupTxt.classList.remove('less');
    }
    if (!quiet) {
      s.trashOpen = 0.28;
      sound.close();
      this.spawnParticles(31, 272, 0xe8dec2, 6);
      this.addPopup(303, 250, '换新空杯', '#5c3c1e');
    }
    this.syncOrderHud();
  }

  addTopping(drinkId, fromPt = null) {
    const s = this.state;
    if (s.phase !== 'serving') return;
    if (s.cupOnTray) {
      s.cupOnTray = false;
      s.trayDrink = null;
      this.resetCupState(true);
    }
    const d = DRINKS[drinkId];
    if (!d) return;
    s.cupTopping = drinkId;
    d.dropSfx();
    const sx = fromPt ? fromPt.x : (drinkId === 'lemonade' ? 88 : drinkId === 'boba_tea' ? 150 : 212);
    const sy = fromPt ? fromPt.y : 258;
    this.launchFly(d.ingKey, sx, sy, s.cupX - 6, s.cupY + 6, () => {
      this.sprites.cupIng.setTexture(d.ingKey).setVisible(true);
      this.spawnParticles(s.cupX, s.cupY - 12, d.liq, 7);
    });
    this.syncOrderHud();
  }

  toggleIce(fromPt = null) {
    const s = this.state;
    if (s.phase !== 'serving' || s.cupOnTray) return;
    if (s.cupIce) {
      s.cupIce = false;
      this.sprites.cupIce.setVisible(false);
      sound.close();
      this.addPopup(s.cupX, 236, '去冰', '#4a6473');
    } else {
      s.cupIce = true;
      sound.iceDrop();
      const sx = fromPt ? fromPt.x : 96;
      const sy = fromPt ? fromPt.y : 318;
      this.launchFly('ice', sx, sy, s.cupX + 8, s.cupY - 2, () => {
        this.sprites.cupIce.setVisible(true);
        this.spawnParticles(s.cupX + 6, s.cupY - 14, 0xc9f2ff, 8);
      });
    }
    this.syncOrderHud();
  }

  toggleSugar() {
    const s = this.state;
    if (s.phase !== 'serving' || s.cupOnTray) return;
    s.cupSugar = s.cupSugar === 'normal' ? 'less' : 'normal';
    s.syrupPress = 0.22;
    sound.syrupPump();
    const isLess = s.cupSugar === 'less';
    this.hud.syrupTxt.textContent = isTouchEnabled()
      ? (isLess ? '少糖 ½' : '正常糖')
      : (isLess ? 'T 少糖 ½' : 'T 正常糖');
    this.hud.syrupTxt.classList.toggle('less', isLess);
    this.spawnParticles(196, 304, 0xffd66b, 6);
    this.addPopup(s.cupX, 234, isLess ? '少糖 ½' : '正常糖', isLess ? '#216e35' : '#8a551c');
    this.syncOrderHud();
  }

  startPour(drinkId) {
    const s = this.state;
    if (s.phase !== 'serving' || s.cupOnTray) return;
    const picked = drinkId || s.cupTopping || 'lemonade';
    if (!DRINKS[picked]) return;
    s.pouringDrink = picked;
    s.cupLiquidType = picked;
    sound.startPour(s.cupFill);
  }

  stopPour() {
    const s = this.state;
    if (s.pouringDrink) {
      s.pouringDrink = null;
      sound.stopPour();
      if (s.cupFill >= 60 && s.cupFill <= 80) {
        this.spawnParticles(s.cupX, s.cupY - 22, 0x74d16c, 9);
        this.addPopup(s.cupX, 224, '液面刚刚好!', '#227537');
      }
      this.syncOrderHud();
    }
  }

  placeCupOnTray() {
    const s = this.state;
    if (s.phase !== 'serving' || s.cupOnTray) return false;
    if (s.cupFill < 40) {
      sound.error();
      this.addPopup(s.cupX, 230, '还没注液呢!', '#b8322c');
      return false;
    }
    this.stopPour();
    s.cupOnTray = true;
    s.trayDrink = {
      topping: s.cupTopping,
      liquid: s.cupLiquidType,
      ice: s.cupIce,
      sugar: s.cupSugar,
      fill: s.cupFill
    };
    sound.pickup();
    this.spawnParticles(398, 286, 0xfff0b3, 8);
    this.addPopup(398, 250, '加盖上托盘!', '#246e38');
    this.syncOrderHud();
    return true;
  }

  pickDessertBase(id, autoSwirl = false) {
    const s = this.state;
    if (s.phase !== 'serving') return;
    s.machineBase = id;
    s.swirlPct = 0;
    s.swirling = autoSwirl;
    sound.open();
    if (autoSwirl) sound.swirl();
    this.addPopup(558, 198, DESSERTS[id].short, '#7c341d');
    this.syncOrderHud();
  }

  startSwirl() {
    const s = this.state;
    if (s.phase !== 'serving') return;
    if (!s.machineBase) {
      sound.error();
      this.addPopup(558, 198, '先选底部甜筒/杯!', '#b8322c');
      return;
    }
    if (!s.swirling) {
      s.swirling = true;
      sound.swirl();
    }
  }

  stopSwirl() {
    this.state.swirling = false;
  }

  finishDessertSwirl() {
    const s = this.state;
    const id = s.machineBase;
    if (!id) return;
    s.swirling = false;
    s.machineBase = null;
    s.swirlPct = 0;
    s.trayDessert = id;
    sound.pickup();
    this.launchFly(DESSERTS[id].icon, 558, 206, 448, 290, () => {
      this.sprites.trayDessert.setTexture(DESSERTS[id].icon).setVisible(true);
      this.spawnParticles(448, 284, 0xfff5d8, 9);
    });
    this.syncOrderHud();
  }

  ringBellAndServe() {
    const s = this.state;
    if (s.phase !== 'serving') return;
    this.stopPour();
    this.stopSwirl();
    if (!s.cupOnTray && s.cupFill >= 45) {
      this.placeCupOnTray();
    }
    if (!s.trayDrink) {
      sound.error();
      this.addPopup(303, 224, '饮品还没调好!', '#b8322c');
      return;
    }
    if (!s.trayDessert) {
      sound.error();
      this.addPopup(558, 224, '还缺甜筒/圣代!', '#b8322c');
      return;
    }

    const ord = this.currentOrder();
    const td = s.trayDrink;
    let pts = 0;
    const notes = [];
    if (td.topping === ord.drink && td.liquid === ord.drink) pts += 30;
    else if (td.topping === ord.drink || td.liquid === ord.drink) { pts += 15; notes.push('饮品略混'); }
    else notes.push('饮品不对');

    if (td.ice === ord.ice) pts += 15;
    else notes.push(ord.ice ? '忘加冰' : '应去冰');

    if (td.sugar === ord.sugar) pts += 15;
    else notes.push(ord.sugar === 'less' ? '应少糖' : '应正常糖');

    if (td.fill >= 60 && td.fill <= 80) pts += 20;
    else { pts += 8; notes.push('液面略偏'); }

    if (s.trayDessert === ord.dessert) pts += 20;
    else notes.push('配餐不对');

    s.bellPress = 0.25;
    s.scores.push(pts);
    const avgNow = Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length);
    this.hud.scoreTxt.textContent = `★ ${avgNow}%`;
    sound.orderBell();

    if (s.tutGuide && s.orderIdx === 0) {
      s.tutGuide = false;
      this.registry.get('session')?.flag('mixue_bar_tut_done');
      this.addPopup(320, 48, '教程完成！接下来自己接单吧！', '#1e6e35');
    }

    s.phase = 'review';
    s.reviewTimer = 1.25;
    s.reviewScore = pts;
    s.reviewStars = pts >= 95 ? '★★★' : pts >= 70 ? '★★☆' : '★☆☆';
    s.reviewText = notes.length ? notes.join(' · ') : '完美出餐！';
    s.custMood = pts >= 85 ? 'delighted' : pts >= 65 ? 'happy' : 'oops';
    s.traySlideY = -24;

    if (pts >= 85) {
      this.spawnParticles(268, 96, 0xff6b7a, 14);
      this.spawnParticles(268, 90, 0xffe478, 10);
    } else {
      this.spawnParticles(268, 100, 0x99d6f0, 8);
    }
    this.addPopup(268, 68, `${pts}% ${s.reviewStars}`, pts >= 85 ? '#217538' : '#b85c24');
    this.syncOrderHud();
  }

  finishShift(timedOut = false) {
    const s = this.state;
    this.stopPour();
    this.stopSwirl();
    s.phase = timedOut ? 'timeout' : 'finished';
    const avg = s.scores.length ? Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length) : 0;
    s.shiftAvg = avg;
    this.syncOrderHud();
    if (timedOut) {
      sound.error();
      this.hud.finishTitle.textContent = '午高峰计时到！';
      this.hud.finishTitle.className = 'warn';
      this.hud.finishSub.textContent = `已完成 ${s.scores.length} / ${ORDERS.length} 单，点击下方再来一轮。`;
      this.hud.finishBtn.textContent = isTouchEnabled() ? '再来一轮' : '再来一轮 [Enter]';
    } else {
      sound.chime();
      const stars = avg >= 95 ? '★★★' : avg >= 75 ? '★★☆' : '★☆☆';
      this.hud.finishTitle.textContent = `午高峰收工！好评 ${avg}% ${stars}`;
      this.hud.finishTitle.className = 'ok';
      this.hud.finishSub.textContent = '3 位顾客套餐全部出餐完成，回到门店听听莉娜怎么说吧。';
      this.hud.finishBtn.textContent = isTouchEnabled() ? '回到门店' : '回到门店 [Enter]';
    }
    this.hud.finishWrap.hidden = false;
  }

  exitToShop(completed = false) {
    this.stopPour();
    this.stopSwirl();
    const session = this.registry.get('session');
    let result = null;
    if (completed && session) {
      const firstDone = !session.has('mixue_order');
      const avg = this.state.shiftAvg || 100;
      session.flags.last_drink = `3 单套餐体验（好评 ${avg}%）`;
      session.flags.mixue_score = avg;
      result = {avg, firstDone};
    }
    this.cleanup();
    this.scene.start('WorldScene', {
      world: 'mixue_shop',
      spawn: this.returnSpawn,
      fromMinigame: true,
      mixueResult: result
    });
  }

  launchFly(iconKey, sx, sy, ex, ey, onArrive) {
    const spr = this.add.image(sx, sy, iconKey).setDepth(70).setScale(0.85);
    this.state.flying.push({spr, sx, sy, ex, ey, t: 0, dur: 0.22, onArrive});
  }

  spawnParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const spd = 28 + Math.random() * 68;
      this.state.particles.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 24,
        life: 0.35 + Math.random() * 0.25,
        size: 3 + Math.floor(Math.random() * 3),
        color
      });
    }
  }

  addPopup(x, y, text, color = '#246e38') {
    if (!this.hud) return;
    const node = el('span', 'mbar-popup', text);
    node.style.left = pctX(x);
    node.style.top = pctY(y);
    node.style.color = color;
    this.hud.popLayer.append(node);
    this.state.popups.push({node, y, life: 1.05});
  }

  bindInputs() {
    this.input.on('pointerdown', pointer => {
      const pt = {x: pointer.worldX, y: pointer.worldY};
      const s = this.state;
      sound.unlock();

      if (s.tutOpen) return;
      if (inside(pt, HIT.exit)) {
        sound.close();
        this.exitToShop(false);
        return;
      }
      if (s.phase !== 'serving') return;

      for (let i = 0; i < 3; i++) {
        if (inside(pt, HIT['disp' + i])) {
          this.startPour(DRINK_LIST[i].id);
          return;
        }
      }
      if (inside(pt, HIT.machine)) {
        this.startSwirl();
        return;
      }
      for (let i = 0; i < 3; i++) {
        if (inside(pt, HIT['base' + i])) {
          this.pickDessertBase(DESSERT_LIST[i].id, true);
          return;
        }
      }
      if (inside(pt, HIT.trash)) {
        this.resetCupState(false);
        return;
      }
      if (inside(pt, HIT.syrup)) {
        this.toggleSugar();
        return;
      }
      if (inside(pt, HIT.bell)) {
        this.ringBellAndServe();
        return;
      }
      for (let i = 0; i < 3; i++) {
        if (inside(pt, HIT['bin' + i])) {
          const d = DRINK_LIST[i];
          s.drag = {kind: 'topping', id: d.id, icon: d.ingKey, sx: pt.x, sy: pt.y, x: pt.x, y: pt.y, moved: false};
          return;
        }
      }
      if (inside(pt, HIT.iceWell)) {
        s.drag = {kind: 'ice', id: 'ice', icon: 'ice', sx: pt.x, sy: pt.y, x: pt.x, y: pt.y, moved: false};
        return;
      }
      if (inside(pt, HIT.cupMat) && !s.cupOnTray && (s.cupFill > 0 || s.cupTopping || s.cupIce)) {
        s.drag = {kind: 'cup', id: 'cup', icon: 'cup', sx: pt.x, sy: pt.y, x: pt.x, y: pt.y, moved: false};
        return;
      }
      if (inside(pt, HIT.tray)) {
        if (!s.cupOnTray && s.cupFill >= 45) {
          this.placeCupOnTray();
        } else if (s.trayDrink && s.trayDessert) {
          s.drag = {kind: 'tray', id: 'tray', icon: 'cup', sx: pt.x, sy: pt.y, x: pt.x, y: pt.y, moved: false};
        }
      }
    });

    this.input.on('pointermove', pointer => {
      const pt = {x: pointer.worldX, y: pointer.worldY};
      const s = this.state;
      s.hover = pt;
      if (s.drag) {
        s.drag.x = pt.x;
        s.drag.y = pt.y;
        if (Math.hypot(pt.x - s.drag.sx, pt.y - s.drag.sy) > 8) {
          s.drag.moved = true;
          this.sprites.dragGhost.setTexture(s.drag.icon).setPosition(pt.x, pt.y).setVisible(true);
        }
      }
    });

    const releasePointer = pointer => {
      const pt = {x: pointer.worldX, y: pointer.worldY};
      const s = this.state;
      this.stopPour();
      this.stopSwirl();
      if (!s.drag) return;
      const d = s.drag;
      s.drag = null;
      this.sprites.dragGhost.setVisible(false);

      if (d.kind === 'topping') {
        if (!d.moved || inside(pt, HIT.cupMat)) this.addTopping(d.id, d.moved ? pt : null);
      } else if (d.kind === 'ice') {
        if (!d.moved || inside(pt, HIT.cupMat)) this.toggleIce(d.moved ? pt : null);
      } else if (d.kind === 'cup') {
        if (inside(pt, HIT.trash)) this.resetCupState(false);
        else if (inside(pt, HIT.tray) || !d.moved) this.placeCupOnTray();
      } else if (d.kind === 'tray') {
        if (!d.moved || inside(pt, HIT.customer) || inside(pt, HIT.bell) || pt.y < 210) {
          this.ringBellAndServe();
        }
      }
    };
    this.input.on('pointerup', releasePointer);
    this.input.on('pointerupoutside', releasePointer);

    this.keyScope = new AbortController();
    window.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      const s = this.state;
      if (k === 'escape') {
        e.preventDefault();
        if (s.tutOpen && s.phase !== 'tutorial') {
          this.closeTutorial();
        } else {
          sound.close();
          this.exitToShop(false);
        }
        return;
      }
      if (s.tutOpen) {
        if (k === 'enter' || k === ' ') {
          e.preventDefault();
          if (s.phase === 'tutorial') this.startGuidedTutorial();
          else this.closeTutorial();
        }
        return;
      }
      if (s.phase === 'finished' && (k === 'enter' || k === ' ')) {
        e.preventDefault();
        this.exitToShop(true);
        return;
      }
      if (s.phase === 'timeout' && (k === 'enter' || k === ' ')) {
        e.preventDefault();
        this.restartShift();
        return;
      }
      if (s.phase !== 'serving') return;
      if (!['1', '2', '3', '4', '5', '6', 'arrowup', 'i', 't', 'r', 'f', ' ', 'enter', 'arrowright'].includes(k)) return;
      e.preventDefault();
      if (e.repeat) return;
      if (k === '1') this.addTopping('lemonade');
      else if (k === '2') this.addTopping('boba_tea');
      else if (k === '3') this.addTopping('strawberry_tea');
      else if (k === 'arrowup' || k === 'i') this.toggleIce();
      else if (k === 't') this.toggleSugar();
      else if (k === 'r') this.resetCupState(false);
      else if (k === ' ') this.startPour(s.cupTopping || 'lemonade');
      else if (k === '4') this.pickDessertBase('cone', true);
      else if (k === '5') this.pickDessertBase('boba_sundae', true);
      else if (k === '6') this.pickDessertBase('mango_sundae', true);
      else if (k === 'f') this.startSwirl();
      else if (k === 'enter' || k === 'arrowright') this.ringBellAndServe();
    }, {signal: this.keyScope.signal});

    window.addEventListener('keyup', e => {
      const k = e.key.toLowerCase();
      if (k === ' ') this.stopPour();
      if (['4', '5', '6', 'f'].includes(k)) this.stopSwirl();
    }, {signal: this.keyScope.signal});
  }

  update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    const s = this.state;

    if (s.tutOpen || s.phase === 'tutorial') {
      if (s.phase === 'tutorial') s.custX = 268;
      this.syncOrderHud();
      this.renderFrame(time);
      return;
    }

    if (s.phase === 'entering') {
      s.custX += (268 - s.custX) * Math.min(1, dt * 8);
      if (Math.abs(268 - s.custX) < 1.5) {
        s.custX = 268;
        s.phase = 'serving';
        sound.talk(this.currentOrder().style);
        this.syncOrderHud();
      }
    } else if (s.phase === 'serving') {
      const pauseClock = s.tutGuide && s.orderIdx === 0;
      if (!pauseClock) {
        s.timeLeft = Math.max(0, s.timeLeft - dt);
        s.patience = Math.max(0.05, s.patience - dt / 26);
        const ord = this.currentOrder();
        const nextLevel = s.patience <= 0.20 ? 3 : s.patience <= 0.42 ? 2 : s.patience <= 0.65 ? 1 : 0;
        const moodByLevel = ['happy', 'expect', 'impatient', 'angry'];
        s.custMood = moodByLevel[nextLevel];
        if (nextLevel > s.urgeLevel) {
          s.urgeLevel = nextLevel;
          s.urgeText = ord.urge[nextLevel - 1] || '';
          if (nextLevel === 3) {
            sound.error();
            this.spawnParticles(s.custX + 16, 98, 0xd93832, 8);
          } else {
            sound.talk(ord.style);
            if (nextLevel === 2) this.spawnParticles(s.custX + 16, 108, 0x88d4f2, 5);
          }
        } else if (nextLevel === 0) {
          s.urgeLevel = 0;
          s.urgeText = '';
        }
        if (s.timeLeft <= 0) this.finishShift(true);
      }
    } else if (s.phase === 'review') {
      s.reviewTimer -= dt;
      if (s.reviewTimer <= 0.45) s.custX += 240 * dt;
      if (s.reviewTimer <= 0) {
        if (s.orderIdx + 1 < ORDERS.length) this.startOrder(s.orderIdx + 1);
        else this.finishShift(false);
      }
    }

    const targetCupX = s.pouringDrink ? DRINKS[s.pouringDrink].spoutX : 303;
    const targetCupY = s.pouringDrink ? 248 : 288;
    s.cupX += (targetCupX - s.cupX) * Math.min(1, dt * 16);
    s.cupY += (targetCupY - s.cupY) * Math.min(1, dt * 16);

    if (s.pouringDrink && s.phase === 'serving') {
      s.cupFill = Math.min(100, s.cupFill + dt * 34);
      sound.updatePour(s.cupFill);
      if (Math.random() < 0.45) {
        this.spawnParticles(s.cupX + (Math.random() - 0.5) * 14, s.cupY + 26 - s.cupFill * 0.62, DRINKS[s.pouringDrink].foam, 1);
      }
      if (s.cupFill > 86) {
        sound.error();
        this.spawnParticles(s.cupX, s.cupY - 26, DRINKS[s.pouringDrink].liq, 14);
        this.addPopup(s.cupX, 206, '满溢啦！已换空杯', '#b8322c');
        this.resetCupState(true);
      }
    }

    if (s.swirling && s.machineBase && s.phase === 'serving') {
      s.swirlPct = Math.min(100, s.swirlPct + dt * 155);
      if (Math.random() < 0.35) {
        this.spawnParticles(558 + (Math.random() - 0.5) * 10, 198, 0xfffaf0, 1);
      }
      if (s.swirlPct >= 100) this.finishDessertSwirl();
    }

    if (s.syrupPress > 0) s.syrupPress = Math.max(0, s.syrupPress - dt);
    if (s.bellPress > 0) s.bellPress = Math.max(0, s.bellPress - dt);
    if (s.trashOpen > 0) s.trashOpen = Math.max(0, s.trashOpen - dt);

    for (let i = s.flying.length - 1; i >= 0; i--) {
      const f = s.flying[i];
      f.t += dt / f.dur;
      const p = Math.min(1, f.t);
      const x = Phaser.Math.Linear(f.sx, f.ex, p);
      const y = Phaser.Math.Linear(f.sy, f.ey, p) - Math.sin(p * Math.PI) * 34;
      f.spr.setPosition(x, y);
      if (p >= 1) {
        f.spr.destroy();
        f.onArrive?.();
        s.flying.splice(i, 1);
      }
    }

    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 150 * dt;
      p.life -= dt;
      if (p.life <= 0) s.particles.splice(i, 1);
    }

    for (let i = s.popups.length - 1; i >= 0; i--) {
      const pop = s.popups[i];
      pop.y -= 20 * dt;
      pop.life -= dt;
      pop.node.style.top = pctY(pop.y);
      pop.node.style.opacity = String(Math.min(1, pop.life * 1.6));
      if (pop.life <= 0) {
        pop.node.remove();
        s.popups.splice(i, 1);
      }
    }

    this.syncOrderHud();
    this.renderFrame(time);
  }

  drawCustomer(g, x, y, style, mood, time, scale = 1) {
    let bob = Math.sin(time / 320 + x * 0.05) * 1.5;
    let shakeX = 0;
    if (mood === 'delighted') bob = -Math.abs(Math.sin(time / 120)) * 7;
    else if (mood === 'expect') bob = Math.sin(time / 220 + x * 0.05) * 1.8;
    else if (mood === 'impatient') bob = Math.sin(time / 135 + x * 0.05) * 2.2;
    else if (mood === 'angry') {
      bob = -Math.abs(Math.sin(time / 95)) * 2.5;
      shakeX = Math.round(Math.sin(time / 48) * 1.6 * scale);
    }
    const cy = Math.round(y + bob);
    const cx = Math.round(x + shakeX);
    const S = v => Math.round(v * scale);

    const shirt = style === 'hijab' ? 0xd97d6c : style === 'office' ? 0x6ea0c4 : 0x8f394c;
    const trim = style === 'hijab' ? 0xf5e8d0 : style === 'office' ? 0x2a4563 : 0xe8bc5b;
    g.fillStyle(0x241914).fillRect(cx - S(26), cy - S(34), S(52), S(36));
    g.fillStyle(shirt).fillRect(cx - S(24), cy - S(32), S(48), S(34));
    if (style === 'office') {
      g.fillStyle(0xfff6e5).fillRect(cx - S(9), cy - S(32), S(18), S(8));
      g.fillStyle(trim).fillRect(cx - S(3), cy - S(26), S(6), S(24));
    } else if (style === 'auntie') {
      g.fillStyle(trim).fillRect(cx - S(20), cy - S(20), S(40), S(4)).fillRect(cx - S(16), cy - S(10), S(32), S(3));
    }

    g.fillStyle(0xd99e72).fillRect(cx - S(6), cy - S(40), S(12), S(9));
    if (style === 'hijab') {
      g.fillStyle(0x241914).fillRect(cx - S(22), cy - S(82), S(44), S(52));
      g.fillStyle(0xd9ede6).fillRect(cx - S(20), cy - S(80), S(40), S(48));
      g.fillStyle(0xb5d6cc).fillRect(cx - S(20), cy - S(44), S(40), S(12));
    } else if (style === 'auntie') {
      g.fillStyle(0x241914).fillRect(cx - S(12), cy - S(92), S(24), S(14));
      g.fillStyle(0x3a2a24).fillRect(cx - S(10), cy - S(90), S(20), S(12));
    }
    g.fillStyle(0x241914).fillRect(cx - S(18), cy - S(76), S(36), S(38));
    g.fillStyle(0xf0bd8e).fillRect(cx - S(16), cy - S(74), S(32), S(34));
    g.fillStyle(0xe0a474).fillRect(cx - S(16), cy - S(46), S(32), S(6));

    // Angry reddish flush across upper face
    if (mood === 'angry') {
      g.fillStyle(0xd9483b, 0.34).fillRect(cx - S(16), cy - S(74), S(32), S(18));
    }

    if (style === 'office') {
      g.fillStyle(0x241914).fillRect(cx - S(18), cy - S(82), S(36), S(16));
      g.fillStyle(0x382c26).fillRect(cx - S(16), cy - S(80), S(32), S(12));
    } else if (style === 'auntie') {
      g.fillStyle(0x241914).fillRect(cx - S(18), cy - S(80), S(36), S(14));
      g.fillStyle(0x47332c).fillRect(cx - S(16), cy - S(78), S(32), S(10));
      g.fillStyle(0xfff1c4).fillRect(cx - S(19), cy - S(54), S(3), S(3)).fillRect(cx + S(16), cy - S(54), S(3), S(3));
    }

    // Dynamic Eyes & Eyebrows by waiting mood
    const blink = (time % 3200) > 3070;
    g.fillStyle(0x241914);
    if (mood === 'delighted') {
      g.fillRect(cx - S(10), cy - S(61), S(6), S(2)).fillRect(cx + S(4), cy - S(61), S(6), S(2));
      g.fillRect(cx - S(11), cy - S(59), S(2), S(2)).fillRect(cx - S(5), cy - S(59), S(2), S(2));
      g.fillRect(cx + S(3), cy - S(59), S(2), S(2)).fillRect(cx + S(9), cy - S(59), S(2), S(2));
    } else if (mood === 'angry') {
      // Glaring narrowed fierce eyes
      g.fillRect(cx - S(10), cy - S(60), S(5), S(4)).fillRect(cx + S(5), cy - S(60), S(5), S(4));
      g.fillStyle(0xffffff).fillRect(cx - S(9), cy - S(59), S(2), S(2)).fillRect(cx + S(6), cy - S(59), S(2), S(2));
      // Steep V-shaped thick angry brows
      g.fillStyle(0x241914);
      g.fillRect(cx - S(12), cy - S(67), S(4), S(2)).fillRect(cx - S(9), cy - S(65), S(4), S(2)).fillRect(cx - S(6), cy - S(63), S(4), S(2));
      g.fillRect(cx + S(8), cy - S(67), S(4), S(2)).fillRect(cx + S(5), cy - S(65), S(4), S(2)).fillRect(cx + S(2), cy - S(63), S(4), S(2));
    } else if (mood === 'impatient') {
      // Wide staring eyes + furrowed brows
      g.fillRect(cx - S(10), cy - S(61), S(5), S(5)).fillRect(cx + S(5), cy - S(61), S(5), S(5));
      g.fillStyle(0xffffff).fillRect(cx - S(8), cy - S(60), S(2), S(2)).fillRect(cx + S(7), cy - S(60), S(2), S(2));
      g.fillStyle(0x3a2416);
      g.fillRect(cx - S(11), cy - S(66), S(4), S(2)).fillRect(cx - S(7), cy - S(64), S(4), S(2));
      g.fillRect(cx + S(7), cy - S(66), S(4), S(2)).fillRect(cx + S(3), cy - S(64), S(4), S(2));
    } else if (mood === 'expect') {
      // Glancing sideways/down toward counter + flat straight eyebrows
      g.fillRect(cx - S(8), cy - S(61), S(4), S(5)).fillRect(cx + S(6), cy - S(61), S(4), S(5));
      g.fillStyle(0xffffff).fillRect(cx - S(7), cy - S(60), S(2), S(2)).fillRect(cx + S(7), cy - S(60), S(2), S(2));
      g.fillStyle(0x473020).fillRect(cx - S(10), cy - S(65), S(6), S(2)).fillRect(cx + S(4), cy - S(65), S(6), S(2));
    } else if (blink) {
      g.fillRect(cx - S(10), cy - S(59), S(6), S(2)).fillRect(cx + S(4), cy - S(59), S(6), S(2));
    } else {
      g.fillRect(cx - S(9), cy - S(62), S(4), S(6)).fillRect(cx + S(5), cy - S(62), S(4), S(6));
      g.fillStyle(0xffffff).fillRect(cx - S(8), cy - S(61), S(2), S(2)).fillRect(cx + S(6), cy - S(61), S(2), S(2));
    }

    if (style === 'office') {
      g.lineStyle(1.5, 0x241914).strokeRect(cx - S(12), cy - S(64), S(10), S(8)).strokeRect(cx + S(2), cy - S(64), S(10), S(8));
      g.fillStyle(0x241914).fillRect(cx - S(2), cy - S(61), S(4), S(2));
    }

    // Cheeks (intensify on angry)
    g.fillStyle(mood === 'angry' ? 0xd94842 : 0xe8897d, mood === 'angry' ? 0.85 : 0.65)
      .fillRect(cx - S(13), cy - S(54), S(5), S(3)).fillRect(cx + S(8), cy - S(54), S(5), S(3));

    // Dynamic Mouth + Pixel Emote Icons (··· / Sweat Drop / Red Anger Mark)
    g.fillStyle(0x7a3a2c);
    if (mood === 'delighted') {
      g.fillRect(cx - S(6), cy - S(50), S(12), S(5));
      g.fillStyle(0xffb5ad).fillRect(cx - S(4), cy - S(48), S(8), S(2));
    } else if (mood === 'angry') {
      // Shouting / grimacing open mouth with white clenched teeth
      g.fillStyle(0x4a1914).fillRect(cx - S(7), cy - S(50), S(14), S(6));
      g.fillStyle(0xfff8eb).fillRect(cx - S(5), cy - S(49), S(10), S(2));
      g.fillStyle(0xd94b43).fillRect(cx - S(4), cy - S(46), S(8), S(2));
      // Pulsing pixel anger vein mark (upper right of forehead)
      if (scale >= 0.9) {
        const ax = cx + S(16), ay = cy - S(82) + (Math.floor(time / 160) % 2 === 0 ? 0 : -1);
        g.fillStyle(0xfff6dc).fillRect(ax - 1, ay - 1, 13, 13);
        g.fillStyle(0xd92626);
        // 4 classic comic L-brackets around center cross
        g.fillRect(ax + 1, ay + 1, 3, 2).fillRect(ax + 2, ay + 1, 2, 3);
        g.fillRect(ax + 7, ay + 1, 3, 2).fillRect(ax + 7, ay + 1, 2, 3);
        g.fillRect(ax + 1, ay + 8, 3, 2).fillRect(ax + 2, ay + 7, 2, 3);
        g.fillRect(ax + 7, ay + 8, 3, 2).fillRect(ax + 7, ay + 7, 2, 3);
      }
    } else if (mood === 'impatient') {
      // Downward tense frown
      g.fillRect(cx - S(5), cy - S(49), S(10), S(2));
      g.fillRect(cx - S(6), cy - S(47), S(2), S(2)).fillRect(cx + S(4), cy - S(47), S(2), S(2));
      // Animated falling blue temple sweat drop
      const dropY = Math.round(((time / 40) % 6) * scale);
      g.fillStyle(0x2a6c91).fillRect(cx + S(12), cy - S(73) + dropY, S(5), S(8));
      g.fillStyle(0x88d4f2).fillRect(cx + S(13), cy - S(72) + dropY, S(3), S(6));
      g.fillStyle(0xffffff).fillRect(cx + S(13), cy - S(71) + dropY, S(1), S(2));
    } else if (mood === 'expect') {
      // Flat waiting mouth + animated "···" pixel dots
      g.fillRect(cx - S(4), cy - S(48), S(8), S(2));
      if (scale >= 0.9) {
        const dotPhase = Math.floor(time / 340) % 4;
        g.fillStyle(0x5c3c1e);
        for (let di = 0; di < dotPhase; di++) {
          g.fillRect(cx + S(18) + di * 4, cy - S(76), 2, 2);
        }
      }
    } else if (mood === 'oops') {
      g.fillRect(cx - S(4), cy - S(48), S(8), S(2));
      g.fillStyle(0x88d4f2).fillRect(cx + S(13), cy - S(72), S(3), S(6));
    } else {
      // Cheerful happy smile
      g.fillRect(cx - S(5), cy - S(49), S(10), S(2)).fillRect(cx - S(6), cy - S(50), S(2), S(2)).fillRect(cx + S(4), cy - S(50), S(2), S(2));
    }
  }

  renderFrame(time) {
    const s = this.state;
    const ord = this.currentOrder();

    this.windowFx.clear();
    const sway = Math.round(Math.sin(time / 550) * 3);
    this.windowFx.fillStyle(0x4c8755);
    this.windowFx.fillRect(24 + sway, 66, 26, 6).fillRect(30 + sway, 60, 18, 6);
    this.windowFx.fillRect(584 - sway, 58, 28, 6).fillRect(590 - sway, 52, 18, 6);

    this.custG.clear();
    if (s.orderIdx + 1 < ORDERS.length) {
      const nextOrd = ORDERS[s.orderIdx + 1];
      this.drawCustomer(this.custG, 200, 178, nextOrd.style, 'happy', time, 0.72);
    }
    if (s.phase !== 'finished' && s.phase !== 'timeout') {
      this.drawCustomer(this.custG, s.custX, 178, ord.style, s.custMood, time, 1);
    }

    const cg = this.counterG;
    cg.clear();

    // Three Beverage Dispenser Tanks (Left)
    const needPourId = (!s.cupOnTray && s.cupTopping && s.cupFill < 60 && s.phase === 'serving') ? s.cupTopping : null;
    DRINK_LIST.forEach((d, i) => {
      const box = HIT['disp' + i];
      const active = s.pouringDrink === d.id;
      const hovered = s.hover && inside(s.hover, box);
      if (needPourId === d.id && !active) {
        cg.fillStyle(0xffe066, Math.sin(time / 160) * 0.28 + 0.48).fillRect(box.x - 2, box.y + 2, box.w + 4, 70);
      }
      cg.fillStyle(0x2a2018).fillRect(box.x, box.y + 4, box.w, 66);
      cg.fillStyle(hovered || active ? 0xfff0c2 : 0xd6d2c5).fillRect(box.x + 2, box.y + 6, box.w - 4, 62);
      cg.fillStyle(d.tank).fillRect(box.x + 5, box.y + 18, box.w - 10, 40);
      cg.fillStyle(d.foam).fillRect(box.x + 5, box.y + 18, box.w - 10, 4);
      cg.fillStyle(0x9e2924).fillRect(box.x + 2, box.y + 4, box.w - 4, 14);
      cg.fillStyle(0xfff0c2).fillRect(box.x + 4, box.y + 6, box.w - 8, 10);
      cg.fillStyle(0x3a4042).fillRect(d.spoutX - 5, box.y + 66, 10, 12);
      cg.fillStyle(0x9aa6a8).fillRect(d.spoutX - 3, box.y + 68, 6, 8);
      const leverY = active ? box.y + 70 : box.y + 60;
      cg.fillStyle(active ? 0xffd24c : 0xc93832).fillRect(d.spoutX + 4, leverY, 10, 5);
    });

    // Metal Trash Can (Far Left)
    const tb = HIT.trash;
    cg.fillStyle(0x2a2d2e).fillRect(tb.x + 2, tb.y + 14, 38, 56);
    cg.fillStyle(0x6c7578).fillRect(tb.x + 4, tb.y + 16, 34, 52);
    cg.fillStyle(0x8c9699).fillRect(tb.x + 8, tb.y + 20, 6, 44).fillRect(tb.x + 20, tb.y + 20, 6, 44);
    const lidLift = s.trashOpen > 0 ? -10 : 0;
    cg.fillStyle(0x2a2d2e).fillRect(tb.x, tb.y + 8 + lidLift, 42, 8);
    cg.fillStyle(0x9ba6a8).fillRect(tb.x + 2, tb.y + 10 + lidLift, 38, 4);

    // Stainless Topping Pans
    DRINK_LIST.forEach((d, i) => {
      const b = HIT['bin' + i];
      const sel = s.cupTopping === d.id && !s.cupOnTray;
      const hov = s.hover && inside(s.hover, b);
      cg.fillStyle(sel ? 0xb8322c : 0x453526).fillRect(b.x, b.y, b.w, b.h);
      cg.fillStyle(hov ? 0xfff8df : 0xe8dec2).fillRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
      cg.fillStyle(0xd4cbb4).fillRect(b.x + 5, b.y + 5, b.w - 10, 28);
    });

    // Stainless Ice Well
    const ib = HIT.iceWell;
    const iceActive = s.cupIce && !s.cupOnTray;
    cg.fillStyle(iceActive ? 0x2f7ea3 : 0x453526).fillRect(ib.x, ib.y, ib.w, ib.h);
    cg.fillStyle(iceActive ? 0xd9f5ff : 0xc5e4f0).fillRect(ib.x + 2, ib.y + 2, ib.w - 4, ib.h - 4);
    cg.fillStyle(0xeefcff).fillRect(ib.x + 5, ib.y + 5, 38, 40);

    // Physical Syrup Bottle & Pump Plunger
    const sb = HIT.syrup;
    const isLess = s.cupSugar === 'less';
    cg.fillStyle(isLess ? 0x2f7a44 : 0x453526).fillRect(sb.x, sb.y, sb.w, sb.h);
    cg.fillStyle(isLess ? 0xe0f5d8 : 0xf7e6be).fillRect(sb.x + 2, sb.y + 2, sb.w - 4, sb.h - 4);
    const px0 = sb.x + 10, py0 = sb.y + 14;
    const pumpDrop = s.syrupPress > 0 ? 4 : 0;
    cg.fillStyle(0x4a3118).fillRect(px0 + 4, py0 - 7 + pumpDrop, 14, 4).fillRect(px0 + 9, py0 - 4 + pumpDrop, 4, 8);
    cg.fillStyle(0x4a3118).fillRect(px0, py0 + 4, 22, 26);
    cg.fillStyle(isLess ? 0x7ac77e : 0xe8ab48).fillRect(px0 + 2, py0 + 6, 18, 22);
    cg.fillStyle(0xfff2c2).fillRect(px0 + 4, py0 + 8, 4, 16);

    // Prep Mat Coaster
    cg.fillStyle(0x6e4a2a).fillRect(262, 314, 82, 22);
    cg.fillStyle(0x8c6138).fillRect(265, 317, 76, 16);

    // Red Mixue Serving Tray (pulses subtly when cup is filled and waiting to be snapped onto tray)
    const ty = Math.round(HIT.tray.y + s.traySlideY);
    if (!s.cupOnTray && s.cupFill >= 60 && s.cupFill <= 80 && s.phase === 'serving') {
      cg.fillStyle(0xffe066, Math.sin(time / 160) * 0.28 + 0.45).fillRect(HIT.tray.x - 3, ty - 3, HIT.tray.w + 6, HIT.tray.h - 8);
    }
    cg.fillStyle(0x4a1613).fillRect(HIT.tray.x, ty, HIT.tray.w, HIT.tray.h - 14);
    cg.fillStyle(0xb82e29).fillRect(HIT.tray.x + 3, ty + 3, HIT.tray.w - 6, HIT.tray.h - 20);
    cg.fillStyle(0x9c231f).fillRect(HIT.tray.x + 7, ty + 8, HIT.tray.w - 14, HIT.tray.h - 30);
    cg.fillStyle(s.trayDrink ? 0xeef5e1 : 0xd6a69a, 0.35).fillCircle(398, ty + 46, 22);
    cg.fillStyle(s.trayDessert ? 0xeef5e1 : 0xd6a69a, 0.35).fillCircle(448, ty + 46, 22);
    cg.fillStyle(0xfff1cc).fillRect(HIT.tray.x + 4, ty + 32, 3, 20).fillRect(HIT.tray.x + HIT.tray.w - 7, ty + 32, 3, 20);

    // Brass Counter Service Bell
    const bl = HIT.bell;
    const readyToRing = Boolean((s.trayDrink || s.cupFill >= 45) && s.trayDessert && s.phase === 'serving');
    if (readyToRing) {
      cg.fillStyle(0xffe066, (Math.sin(time / 150) * 0.3 + 0.7) * 0.45).fillRoundedRect(bl.x + 2, bl.y - 2, bl.w - 4, bl.h + 4, 6);
    }
    const pushY = s.bellPress > 0 ? 3 : 0;
    cg.fillStyle(0x3a2614).fillRect(bl.x + 14, bl.y + 20, 52, 7);
    cg.fillStyle(0xdba53b).fillRect(bl.x + 18, bl.y + 8 + pushY, 44, 14);
    cg.fillStyle(0xffe785).fillRect(bl.x + 24, bl.y + 5 + pushY, 32, 7);
    cg.fillStyle(0x5c3c18).fillRect(bl.x + 36, bl.y + 1 + pushY, 8, 5);

    // Mixue Red Soft-Serve Ice Cream Machine (Right)
    const mg = this.machineG;
    mg.clear();
    const mb = HIT.machine;
    mg.fillStyle(0x361513).fillRect(mb.x + 4, mb.y, 108, 128);
    mg.fillStyle(0xf7efe0).fillRect(mb.x + 7, mb.y + 3, 102, 122);
    mg.fillStyle(0xb82e29).fillRect(mb.x + 7, mb.y + 3, 102, 24);
    mg.fillStyle(0xd94740).fillRect(mb.x + 9, mb.y + 5, 98, 5);
    mg.fillStyle(0x465254).fillRect(mb.x + 18, mb.y + 62, 72, 58);
    mg.fillStyle(0x2b3334).fillRect(mb.x + 20, mb.y + 114, 68, 6);
    mg.fillStyle(0x9ea8ab).fillRect(552, 166, 12, 12);
    mg.fillStyle(0xd6e0e3).fillRect(554, 166, 4, 10);

    const leverDown = s.swirling;
    const leverGlow = s.machineBase && !s.swirling && s.phase === 'serving';
    if (leverGlow) {
      mg.fillStyle(0xffe066, Math.sin(time / 140) * 0.3 + 0.6).fillRect(588, 134, 24, 54);
    }
    mg.fillStyle(0x361513).fillRect(593, 146, 12, 34);
    mg.fillStyle(0x9ca6a8).fillRect(596, 150, 6, 26);
    const knobY = leverDown ? 174 : 138;
    mg.fillStyle(leverDown ? 0xffd24c : 0xc9352f).fillCircle(599, knobY, 8);
    mg.fillStyle(0xff8e87).fillCircle(597, knobY - 2, 3);

    if (s.machineBase) {
      const des = DESSERTS[s.machineBase];
      const nx = 558, ny = 218;
      if (s.machineBase === 'cone') {
        mg.fillStyle(0x413f31).fillTriangle(nx - 12, ny - 22, nx + 12, ny - 22, nx, ny);
        mg.fillStyle(des.baseColor).fillTriangle(nx - 10, ny - 21, nx + 10, ny - 21, nx, ny - 2);
      } else {
        mg.fillStyle(0x413f31).fillRect(nx - 14, ny - 24, 28, 24);
        mg.fillStyle(0xeef7f4).fillRect(nx - 12, ny - 22, 24, 20);
        mg.fillStyle(des.accent).fillRect(nx - 10, ny - 10, 20, 8);
      }
      const pct = s.swirlPct / 100;
      if (s.swirling) {
        mg.fillStyle(0xfffaf0).fillRect(nx - 3, 178, 6, Math.max(4, (ny - 22 - pct * 22) - 178));
      }
      if (pct > 0.05) {
        const layers = Math.ceil(pct * 4);
        for (let l = 0; l < layers; l++) {
          const w = Math.max(8, 24 - l * 5);
          mg.fillStyle(0x413f31).fillRoundedRect(nx - w / 2 - 1, ny - 27 - l * 6, w + 2, 8, 3);
          mg.fillStyle(0xfffaf0).fillRoundedRect(nx - w / 2, ny - 26 - l * 6, w, 6, 3);
        }
      }
      mg.fillStyle(0x2a2f30).fillRect(530, 152, 56, 7);
      mg.fillStyle(0x63c96e).fillRect(531, 153, Math.round(54 * pct), 5);
    }

    DESSERT_LIST.forEach((d, i) => {
      const b = HIT['base' + i];
      const sel = s.machineBase === d.id || s.trayDessert === d.id;
      mg.fillStyle(sel ? 0xb8322c : 0x52371e).fillRect(b.x, b.y, b.w, b.h);
      mg.fillStyle(sel ? 0xfff2c7 : 0xf2e4c2).fillRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
    });

    // Active First-Person Mixing Cup + Tray Lidded Cup
    const kg = this.cupG;
    kg.clear();
    if (!s.cupOnTray) {
      const cx = Math.round(s.cupX), cy = Math.round(s.cupY);
      const cw = 54, ch = 74;
      const left = cx - cw / 2, top = cy - ch / 2;
      kg.fillStyle(0x3a2a1c).fillRect(left - 3, top - 3, cw + 6, ch + 6);
      kg.fillStyle(0x785b3c).fillRect(left - 4, top - 5, cw + 8, 5);
      kg.fillStyle(0xeef7f4).fillRect(left, top, cw, ch);
      if (s.pouringDrink) {
        const pd = DRINKS[s.pouringDrink];
        const streamTop = 194;
        const streamBot = top + ch - Math.round((ch * s.cupFill) / 100);
        if (streamBot > streamTop) {
          kg.fillStyle(pd.liq).fillRect(pd.spoutX - 3, streamTop, 6, streamBot - streamTop);
          const pulse = Math.floor(time / 55) % 10;
          kg.fillStyle(pd.foam);
          for (let sy = streamTop + pulse; sy < streamBot - 2; sy += 10) {
            kg.fillRect(pd.spoutX - 1, sy, 2, 4);
          }
        }
      }
      if (s.cupFill > 0 && s.cupLiquidType) {
        const d = DRINKS[s.cupLiquidType];
        const lh = Math.round((ch * s.cupFill) / 100);
        kg.fillStyle(d.liq).fillRect(left, top + ch - lh, cw, lh);
        kg.fillStyle(d.foam).fillRect(left, top + ch - lh, cw, 3);
      }
      const bandBot = top + Math.round(ch * 0.4);
      const bandTop = top + Math.round(ch * 0.2);
      kg.fillStyle(0x52b85e, 0.28).fillRect(left, bandTop, cw, bandBot - bandTop);
      kg.fillStyle(0x286e34);
      for (let gx = left; gx < left + cw; gx += 6) {
        kg.fillRect(gx, bandTop, 4, 2).fillRect(gx, bandBot, 4, 2);
      }
      kg.fillStyle(0xffffff, 0.45).fillRect(left + 4, top + 4, 4, ch - 8);

      if (s.cupTopping) {
        const d = DRINKS[s.cupTopping];
        const ly = d.floats
          ? Math.min(top + ch - 14, top + ch - Math.round((ch * s.cupFill) / 100) + 12)
          : top + ch - 13;
        this.sprites.cupIng.setPosition(cx - 10, ly).setVisible(true);
      } else {
        this.sprites.cupIng.setVisible(false);
      }
      if (s.cupIce) {
        const iy = Math.min(top + ch - 16, top + ch - Math.round((ch * s.cupFill) / 100) + 10);
        this.sprites.cupIce.setPosition(cx + 10, iy).setVisible(true);
      } else {
        this.sprites.cupIce.setVisible(false);
      }
    } else {
      this.sprites.cupIng.setVisible(false);
      this.sprites.cupIce.setVisible(false);
    }

    if (s.trayDrink) {
      const td = s.trayDrink;
      const d = DRINKS[td.liquid || td.topping || 'lemonade'];
      const lx = 398, ly = Math.round(ty + 46);
      kg.fillStyle(0x2f7545).fillRect(lx + 4, ly - 32, 4, 16);
      kg.fillStyle(0x3a2a1c).fillRect(lx - 15, ly - 18, 30, 36);
      kg.fillStyle(0xeef7f4).fillRect(lx - 13, ly - 16, 26, 32);
      const lh = Math.round((32 * Math.min(100, td.fill)) / 100);
      kg.fillStyle(d.liq).fillRect(lx - 13, ly + 16 - lh, 26, lh);
      kg.fillStyle(0x6e1814).fillRect(lx - 17, ly - 21, 34, 6);
      kg.fillStyle(0xc9352f).fillRect(lx - 15, ly - 20, 30, 4);
    }
    if (s.trayDessert) {
      this.sprites.trayDessert.setPosition(448, Math.round(ty + 46));
    }

    this.fxG.clear();
    for (const p of s.particles) {
      this.fxG.fillStyle(p.color, Math.max(0, p.life * 2)).fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
  }

  cleanup() {
    sound.stopPour();
    this.keyScope?.abort();
    this.keyScope = null;
    this.hud?.root?.remove();
    this.hud = null;
    document.body.classList.remove('mbar-modal-open');
    document.getElementById('viewport')?.classList.remove('cutscene');
    setTouchSceneMode('none');
    this.barState = null;
  }
}
