import {el, dialog} from '../ui/panel.js';
import {sound} from './audio.js';
import {unlockAchievement} from './achievements.js';
import {syncTouchHud, isTouchEnabled} from './touchControls.js';

const W = 320;
const H = 180;
const TOTAL_SEC = 10.8;

const DANCE_MOVES = [
  {
    id: 'point',
    lyric: '你爱我',
    title: '甜蜜指镜',
    cue: '菲娜指镜眨眼 · 雪王举权杖招手',
    start: 0.0,
    end: 2.7,
    winStart: 0.72,
    winEnd: 2.48
  },
  {
    id: 'heart',
    lyric: '我爱你',
    title: '头顶比心',
    cue: '菲娜头顶大比心 · 雪王抱爱心蹦跳',
    start: 2.7,
    end: 5.4,
    winStart: 3.42,
    winEnd: 5.18
  },
  {
    id: 'sway',
    lyric: '蜜雪冰城',
    title: '扭扭踏步',
    cue: '同步左右摇摆踏步 · 红披风甩起来',
    start: 5.4,
    end: 8.1,
    winStart: 6.12,
    winEnd: 7.88
  },
  {
    id: 'finale',
    lyric: '甜蜜蜜',
    title: '捧脸比耶定格',
    cue: '菲娜捧脸双比耶 · 雪王星光定格',
    start: 8.1,
    end: TOTAL_SEC,
    winStart: 8.82,
    winEnd: 10.58
  }
];

// Pixel-block helper (2x2 crisp logical pixel units on 320x180 canvas)
function px(ctx, ox, oy, gx, gy, gw, gh, color, s = 2) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(ox + gx * s), Math.round(oy + gy * s), Math.round(gw * s), Math.round(gh * s));
}

function drawPixelHeart(ctx, cx, cy, scale, color, outline = '#3a1420') {
  const rows = [
    '0110110',
    '1111111',
    '1111111',
    '0111110',
    '0011100',
    '0001000'
  ];
  const hw = Math.floor((rows[0].length * scale) / 2);
  const hh = Math.floor((rows.length * scale) / 2);
  if (outline) {
    ctx.fillStyle = outline;
    for (let y = 0; y < rows.length; y++) {
      for (let x = 0; x < rows[y].length; x++) {
        if (rows[y][x] === '1') {
          ctx.fillRect(cx - hw + x * scale - 1, cy - hh + y * scale - 1, scale + 2, scale + 2);
        }
      }
    }
  }
  ctx.fillStyle = color;
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      if (rows[y][x] === '1') {
        ctx.fillRect(cx - hw + x * scale, cy - hh + y * scale, scale, scale);
      }
    }
  }
}

function drawPixelNote(ctx, x, y, color) {
  const rx = Math.round(x);
  const ry = Math.round(y);
  ctx.fillStyle = '#2d1812';
  ctx.fillRect(rx - 1, ry + 3, 6, 5);
  ctx.fillRect(rx + 3, ry - 4, 3, 9);
  ctx.fillRect(rx + 4, ry - 4, 5, 3);
  ctx.fillStyle = color;
  ctx.fillRect(rx, ry + 4, 4, 3);
  ctx.fillRect(rx + 4, ry - 3, 1, 7);
  ctx.fillRect(rx + 4, ry - 3, 4, 1);
}

function drawPixelStar(ctx, cx, cy, r, color) {
  const x = Math.round(cx);
  const y = Math.round(cy);
  ctx.fillStyle = color;
  ctx.fillRect(x - r, y, r * 2 + 1, 1);
  ctx.fillRect(x, y - r, 1, r * 2 + 1);
  if (r >= 3) {
    ctx.fillStyle = '#fff9df';
    ctx.fillRect(x, y, 1, 1);
  }
}

function drawMixueLetters(ctx, startX, startY) {
  const glyphs = {
    M: ['10001', '11011', '10101', '10001', '10001', '10001'],
    I: ['111', '010', '010', '010', '010', '111'],
    X: ['1001', '1001', '0110', '0110', '1001', '1001'],
    U: ['1001', '1001', '1001', '1001', '1001', '0110'],
    E: ['1111', '1000', '1110', '1000', '1000', '1111']
  };
  let curX = startX;
  const s = 2;
  for (const ch of 'MIXUE') {
    const g = glyphs[ch];
    ctx.fillStyle = '#7c181d';
    for (let y = 0; y < g.length; y++) {
      for (let x = 0; x < g[y].length; x++) {
        if (g[y][x] === '1') ctx.fillRect(curX + x * s + 1, startY + y * s + 1, s, s);
      }
    }
    ctx.fillStyle = '#fffaf0';
    for (let y = 0; y < g.length; y++) {
      for (let x = 0; x < g[y].length; x++) {
        if (g[y][x] === '1') ctx.fillRect(curX + x * s, startY + y * s, s, s);
      }
    }
    curX += (g[0].length + 2) * s;
  }
}

function drawBackdrop(ctx, t) {
  // Sunny tropical Jakarta sky
  ctx.fillStyle = '#8ad0ea';
  ctx.fillRect(0, 0, W, 38);
  ctx.fillStyle = '#b4e4f2';
  ctx.fillRect(0, 38, W, 30);
  ctx.fillStyle = '#dff1d8';
  ctx.fillRect(0, 68, W, 24);

  // Drifting pixel clouds
  const cloudShift = Math.floor((t * 6) % (W + 80));
  for (const [bx, by, cw] of [[24, 14, 34], [244, 10, 42]]) {
    const cx = ((bx + cloudShift) % (W + 60)) - 30;
    ctx.fillStyle = '#fff9ec';
    ctx.fillRect(cx, by, cw, 7);
    ctx.fillRect(cx + 5, by - 4, cw - 12, 5);
    ctx.fillStyle = '#e7edf0';
    ctx.fillRect(cx + 2, by + 5, cw - 4, 2);
  }

  // Neighboring Kota Tua shop roofs on far left & right
  ctx.fillStyle = '#536e5d';
  ctx.fillRect(0, 48, 56, 76);
  ctx.fillStyle = '#3c5446';
  ctx.fillRect(0, 48, 56, 8);
  ctx.fillStyle = '#d4b582';
  ctx.fillRect(264, 52, 56, 72);
  ctx.fillStyle = '#a47748';
  ctx.fillRect(264, 52, 56, 8);

  // Mixue Kota Tua Cream Storefront Building (x=54..266, y=10..124)
  ctx.fillStyle = '#4a3525';
  ctx.fillRect(52, 10, 216, 114);
  ctx.fillStyle = '#efe4c8';
  ctx.fillRect(55, 13, 210, 111);
  // Cornice & cream architectural columns
  ctx.fillStyle = '#d7c6a1';
  ctx.fillRect(55, 13, 210, 5);
  ctx.fillRect(55, 58, 210, 4);
  for (const pxX of [60, 124, 192, 254]) {
    ctx.fillStyle = '#dfd0af';
    ctx.fillRect(pxX, 62, 6, 62);
  }

  // Iconic Mixue Red Banner Signboard (x=68..252, y=18..54)
  ctx.fillStyle = '#75171c';
  ctx.fillRect(67, 17, 186, 39);
  ctx.fillStyle = '#cf3239';
  ctx.fillRect(69, 19, 182, 35);
  ctx.fillStyle = '#e6545a';
  ctx.fillRect(69, 19, 182, 3);
  ctx.fillStyle = '#a62027';
  ctx.fillRect(69, 51, 182, 3);

  // Mini Snow King badge inside the red signboard
  ctx.fillStyle = '#fff9ee';
  ctx.fillRect(82, 27, 14, 15);
  ctx.fillRect(84, 24, 10, 4);
  ctx.fillStyle = '#f2bf49';
  ctx.fillRect(85, 22, 8, 3);
  ctx.fillStyle = '#d9353c';
  ctx.fillRect(81, 35, 16, 4);
  ctx.fillStyle = '#f0842e';
  ctx.fillRect(88, 30, 3, 2);

  // Crisp pixel MIXUE letters + tagline strip
  drawMixueLetters(ctx, 110, 25);
  ctx.fillStyle = '#ffe5c8';
  for (let i = 0; i < 24; i++) {
    ctx.fillRect(110 + i * 5, 44, 3, 2);
  }

  // Three Dark-Arched Storefront Glass Windows + Doorway
  for (let i = 0; i < 3; i++) {
    const ax = 72 + i * 62;
    const aw = 50;
    const ay = 66;
    const ah = 58;
    ctx.fillStyle = '#3b332d';
    ctx.fillRect(ax, ay + 6, aw, ah - 6);
    ctx.fillRect(ax + 4, ay + 2, aw - 8, 6);
    ctx.fillRect(ax + 10, ay, aw - 20, 4);
    // Warm sunlit teal glass or wooden center door
    ctx.fillStyle = i === 1 ? '#876347' : '#85aeb5';
    ctx.fillRect(ax + 4, ay + 8, aw - 8, ah - 8);
    ctx.fillRect(ax + 8, ay + 4, aw - 16, 5);
    if (i === 1) {
      ctx.fillStyle = '#a67f5d';
      ctx.fillRect(ax + 8, ay + 12, 15, 42);
      ctx.fillRect(ax + 27, ay + 12, 15, 42);
      ctx.fillStyle = '#ffe8a8';
      ctx.fillRect(ax + 11, ay + 16, 9, 18);
      ctx.fillRect(ax + 30, ay + 16, 9, 18);
    } else {
      // Diagonal pixel glass reflection
      ctx.fillStyle = '#b9d8dd';
      ctx.fillRect(ax + 8, ay + 12, 6, 36);
      ctx.fillRect(ax + 16, ay + 16, 4, 24);
      ctx.fillStyle = '#e7c07b';
      ctx.fillRect(ax + 6, ay + 46, aw - 12, 12);
    }
  }

  // Giant Soft-Serve Cone Prop on left sidewalk
  ctx.fillStyle = '#3d2515';
  ctx.fillRect(42, 114, 18, 12);
  ctx.fillStyle = '#d4954b';
  ctx.fillRect(45, 102, 12, 16);
  ctx.fillStyle = '#e9b269';
  ctx.fillRect(47, 104, 4, 12);
  ctx.fillStyle = '#fff9ee';
  ctx.fillRect(44, 92, 14, 11);
  ctx.fillRect(46, 86, 10, 7);
  ctx.fillRect(49, 82, 4, 5);

  // Swaying Tropical Palm Fronds at left & right edges
  const sway = Math.round(Math.sin(t * 2.2) * 2);
  for (const side of [0, 1]) {
    const px0 = side === 0 ? 12 : W - 12;
    const dir = side === 0 ? 1 : -1;
    ctx.fillStyle = '#73543a';
    ctx.fillRect(px0 - 4, 52, 8, 74);
    ctx.fillStyle = '#477c45';
    ctx.fillRect(px0 + dir * 2 + sway, 32, dir * 26, 8);
    ctx.fillRect(px0 + dir * 4 + sway, 42, dir * 30, 7);
    ctx.fillRect(px0 + dir * 2 + sway, 22, dir * 20, 7);
    ctx.fillStyle = '#6da659';
    ctx.fillRect(px0 + dir * 4 + sway, 33, dir * 20, 3);
    ctx.fillRect(px0 + dir * 6 + sway, 43, dir * 22, 3);
  }

  // Warm Jakarta Brick Sidewalk (y=114..180)
  ctx.fillStyle = '#d9c7a3';
  ctx.fillRect(0, 114, W, 66);
  ctx.fillStyle = '#c4b08a';
  ctx.fillRect(0, 114, W, 3);
  for (let row = 0; row < 6; row++) {
    const ry = 122 + row * 10;
    ctx.fillStyle = '#c9b58e';
    ctx.fillRect(0, ry, W, 1);
    const offset = (row % 2) * 14;
    for (let x = offset; x < W; x += 28) {
      ctx.fillRect(x, ry, 1, 10);
    }
  }
  // Sunny highlight strip across foreground sidewalk
  ctx.fillStyle = 'rgba(255, 245, 210, 0.28)';
  ctx.fillRect(58, 117, 204, 63);
}

function drawCloseSnowKing(ctx, cx, feetY, moveId, beatPhase, elapsed) {
  const s = 2;
  const bounce = Math.abs(Math.sin(beatPhase * Math.PI));
  const swayDir = Math.sin(beatPhase * Math.PI);
  let ox = cx;
  let oy = feetY - Math.round(bounce * 5);
  let happyEyes = false;
  let hugHeart = false;
  let scepterLift = 0;
  let leftFootLift = 0;
  let rightFootLift = 0;
  let capeShift = 0;
  let rightArmMode = 'wave';

  if (moveId === 'ready') {
    oy = feetY - Math.round(Math.abs(Math.sin(elapsed * 2.8)) * 2);
    rightArmMode = 'idle';
  } else if (moveId === 'point') {
    scepterLift = -4 - Math.round(bounce * 3);
    rightArmMode = 'wave_high';
    capeShift = Math.round(swayDir * 1.5);
  } else if (moveId === 'heart') {
    happyEyes = true;
    hugHeart = true;
    oy = feetY - Math.round(bounce * 7);
    scepterLift = -1;
    rightArmMode = 'hug';
  } else if (moveId === 'sway') {
    const lean = Math.round(swayDir * 6);
    ox = cx + lean;
    oy = feetY - Math.round(bounce * 4);
    capeShift = -Math.round(swayDir * 3);
    leftFootLift = swayDir > 0 ? 3 : 0;
    rightFootLift = swayDir < 0 ? 3 : 0;
    scepterLift = swayDir > 0 ? -3 : 1;
    rightArmMode = swayDir > 0 ? 'wave_low' : 'wave_high';
  } else if (moveId === 'finale') {
    happyEyes = true;
    oy = feetY - Math.round(bounce * 6);
    scepterLift = -6;
    rightArmMode = 'wave_high';
    capeShift = Math.round(Math.sin(elapsed * 8) * 1.5);
  }

  // Soft sidewalk shadow
  ctx.fillStyle = 'rgba(54, 36, 22, 0.28)';
  ctx.fillRect(cx - 22, feetY - 3, 44, 6);
  ctx.fillRect(cx - 18, feetY - 5, 36, 10);

  const O = '#2a1912';
  const WHT = '#fffcf5';
  const SHD = '#e2dac8';
  const RED = '#d4333a';
  const DRK = '#991d24';
  const GLD = '#f3be46';
  const GLD2 = '#d49022';

  // Anchor top-left of 24x34 pixel grid (48x68 canvas px)
  const gx0 = ox - 12 * s;
  const gy0 = oy - 34 * s;

  // Royal Red Cape behind body
  px(ctx, gx0, gy0, 2 + capeShift, 15, 20, 15, O, s);
  px(ctx, gx0, gy0, 3 + capeShift, 16, 18, 13, DRK, s);
  px(ctx, gx0, gy0, 4 + capeShift, 16, 16, 11, RED, s);

  // Chunky Brown Boots
  px(ctx, gx0, gy0, 5, 30 - leftFootLift, 5, 4, O, s);
  px(ctx, gx0, gy0, 6, 31 - leftFootLift, 3, 2, '#6c4228', s);
  px(ctx, gx0, gy0, 14, 30 - rightFootLift, 5, 4, O, s);
  px(ctx, gx0, gy0, 15, 31 - rightFootLift, 3, 2, '#6c4228', s);

  // Plump Lower Snowman Belly
  px(ctx, gx0, gy0, 4, 16, 16, 15, O, s);
  px(ctx, gx0, gy0, 3, 18, 18, 11, O, s);
  px(ctx, gx0, gy0, 5, 17, 14, 13, WHT, s);
  px(ctx, gx0, gy0, 4, 19, 16, 9, WHT, s);
  px(ctx, gx0, gy0, 5, 27, 14, 3, SHD, s);

  // Royal Red Collar & Golden Clasp
  px(ctx, gx0, gy0, 4, 15, 16, 4, O, s);
  px(ctx, gx0, gy0, 5, 16, 14, 2, RED, s);
  px(ctx, gx0, gy0, 10, 15, 4, 4, O, s);
  px(ctx, gx0, gy0, 11, 16, 2, 2, GLD, s);

  // Plump Head
  px(ctx, gx0, gy0, 5, 4, 14, 12, O, s);
  px(ctx, gx0, gy0, 4, 6, 16, 8, O, s);
  px(ctx, gx0, gy0, 6, 5, 12, 10, WHT, s);
  px(ctx, gx0, gy0, 5, 7, 14, 6, WHT, s);
  px(ctx, gx0, gy0, 6, 13, 12, 2, SHD, s);

  // Golden 3-Point Crown with Ruby Gem
  px(ctx, gx0, gy0, 7, 1, 10, 4, O, s);
  px(ctx, gx0, gy0, 8, 2, 8, 3, GLD, s);
  px(ctx, gx0, gy0, 7, 0, 2, 3, O, s);
  px(ctx, gx0, gy0, 11, 0, 2, 3, O, s);
  px(ctx, gx0, gy0, 15, 0, 2, 3, O, s);
  px(ctx, gx0, gy0, 8, 1, 1, 2, '#fff09c', s);
  px(ctx, gx0, gy0, 11, 1, 2, 2, '#fff09c', s);
  px(ctx, gx0, gy0, 15, 1, 1, 2, '#fff09c', s);
  px(ctx, gx0, gy0, 11, 3, 2, 1, RED, s);

  // Face: Eyes, Carrot Nose, Rosy Cheeks, Cheerful Smile
  if (happyEyes) {
    px(ctx, gx0, gy0, 7, 8, 3, 1, O, s);
    px(ctx, gx0, gy0, 8, 7, 1, 1, O, s);
    px(ctx, gx0, gy0, 14, 8, 3, 1, O, s);
    px(ctx, gx0, gy0, 15, 7, 1, 1, O, s);
  } else {
    px(ctx, gx0, gy0, 8, 7, 2, 3, O, s);
    px(ctx, gx0, gy0, 14, 7, 2, 3, O, s);
    px(ctx, gx0, gy0, 8, 7, 1, 1, '#ffffff', s);
    px(ctx, gx0, gy0, 14, 7, 1, 1, '#ffffff', s);
  }
  // Rosy Cheeks
  px(ctx, gx0, gy0, 6, 10, 2, 1, '#f57e92', s);
  px(ctx, gx0, gy0, 16, 10, 2, 1, '#f57e92', s);
  // Carrot Nose
  px(ctx, gx0, gy0, 11, 9, 3, 2, '#f0822b', s);
  px(ctx, gx0, gy0, 11, 9, 1, 1, '#ffb35c', s);
  // Smile
  px(ctx, gx0, gy0, 9, 12, 6, 1, '#9c3631', s);
  px(ctx, gx0, gy0, 10, 13, 4, 1, '#c94c46', s);

  // Ice-Cream Scepter (Left Hand Side)
  const sx = 1;
  const sy = 10 + scepterLift;
  // Golden staff rod
  px(ctx, gx0, gy0, sx + 1, sy + 7, 2, 14, O, s);
  px(ctx, gx0, gy0, sx + 1, sy + 7, 1, 13, GLD, s);
  // Waffle cone top
  px(ctx, gx0, gy0, sx - 1, sy + 3, 6, 5, O, s);
  px(ctx, gx0, gy0, sx, sy + 4, 4, 3, '#e29e4c', s);
  px(ctx, gx0, gy0, sx + 1, sy + 7, 2, 2, GLD2, s);
  // Creamy ice-cream scoop
  px(ctx, gx0, gy0, sx - 1, sy - 1, 6, 5, O, s);
  px(ctx, gx0, gy0, sx, sy, 4, 3, WHT, s);
  px(ctx, gx0, gy0, sx + 1, sy - 2, 2, 2, WHT, s);

  // Snow King Left & Right Mittens + Optional Hugged Heart
  if (hugHeart) {
    drawPixelHeart(ctx, gx0 + 12 * s, gy0 + 23 * s, 2, '#f24c78', '#521426');
    // Left mitten hugging left edge of heart
    px(ctx, gx0, gy0, 6, 20, 4, 4, O, s);
    px(ctx, gx0, gy0, 7, 21, 2, 2, WHT, s);
    // Right mitten hugging right edge of heart
    px(ctx, gx0, gy0, 14, 20, 4, 4, O, s);
    px(ctx, gx0, gy0, 15, 21, 2, 2, WHT, s);
  } else {
    // Left mitten holding scepter
    const ly = Math.max(14, Math.min(22, 18 + Math.round(scepterLift * 0.5)));
    px(ctx, gx0, gy0, 1, ly, 4, 4, O, s);
    px(ctx, gx0, gy0, 2, ly + 1, 2, 2, WHT, s);
    // Right mitten pose
    const ry = rightArmMode === 'wave_high' ? 13 : rightArmMode === 'wave_low' ? 20 : 18;
    const rx = rightArmMode === 'wave_high' ? 20 : 19;
    px(ctx, gx0, gy0, rx, ry, 4, 4, O, s);
    px(ctx, gx0, gy0, rx + 1, ry + 1, 2, 2, WHT, s);
  }

  // Celebratory sparkles around Snow King on finale
  if (moveId === 'finale') {
    const sp = Math.sin(elapsed * 10) > 0 ? 3 : 2;
    drawPixelStar(ctx, gx0 + 3 * s, gy0 + 2 * s, sp, '#ffe169');
    drawPixelStar(ctx, gx0 + 21 * s, gy0 + 4 * s, sp, '#ff98b5');
    drawPixelStar(ctx, gx0 + 12 * s, gy0 - 3 * s, 2, '#ffe169');
  }
}

function drawCloseFina(ctx, cx, feetY, moveId, beatPhase, elapsed, moveLocalT) {
  const s = 2;
  const bounce = Math.abs(Math.sin(beatPhase * Math.PI));
  const swayDir = Math.sin(beatPhase * Math.PI);

  let ox = cx;
  let oy = feetY - Math.round(bounce * 4);
  let leftFootLift = 0;
  let rightFootLift = 0;
  let headBob = 0;
  let wink = false;
  let bigLaugh = false;

  if (moveId === 'ready') {
    oy = feetY - Math.round(Math.abs(Math.sin(elapsed * 2.5)) * 1.5);
  } else if (moveId === 'point') {
    ox = cx - Math.round(bounce * 2);
    wink = beatPhase % 1 > 0.35;
    bigLaugh = true;
  } else if (moveId === 'heart') {
    oy = feetY - Math.round(bounce * 6);
    bigLaugh = true;
  } else if (moveId === 'sway') {
    ox = cx + Math.round(swayDir * 6);
    oy = feetY - Math.round(bounce * 4);
    leftFootLift = swayDir > 0 ? 3 : 0;
    rightFootLift = swayDir < 0 ? 3 : 0;
    headBob = Math.round(swayDir * 1);
  } else if (moveId === 'finale') {
    ox = cx - 4; // leans affectionately toward Snow King!
    oy = feetY - Math.round(bounce * 5);
    bigLaugh = true;
  }

  // Sidewalk shadow
  ctx.fillStyle = 'rgba(54, 36, 22, 0.26)';
  ctx.fillRect(cx - 18, feetY - 3, 36, 6);
  ctx.fillRect(cx - 14, feetY - 5, 28, 10);

  const O = '#2a1912';
  const HAIR = '#302325';
  const HAIR_HI = '#4d3a3e';
  const SKIN = '#f6c297';
  const SKIN_SH = '#df9f71';
  const PINK = '#ea708f';
  const PINK_SH = '#c74d6d';
  const TEE = '#fff7e5';
  const DENIM = '#4d719c';
  const DENIM_HI = '#6891be';
  const SHOE = '#f48ea6';

  const gx0 = ox - 11 * s;
  const gy0 = oy - 33 * s;

  // Legs & Pink-White Sneakers
  px(ctx, gx0, gy0, 7, 25 - leftFootLift, 3, 6, O, s);
  px(ctx, gx0, gy0, 8, 25 - leftFootLift, 1, 4, SKIN, s);
  px(ctx, gx0, gy0, 6, 30 - leftFootLift, 4, 3, O, s);
  px(ctx, gx0, gy0, 7, 31 - leftFootLift, 2, 1, SHOE, s);
  px(ctx, gx0, gy0, 7, 32 - leftFootLift, 2, 1, '#ffffff', s);

  px(ctx, gx0, gy0, 12, 25 - rightFootLift, 3, 6, O, s);
  px(ctx, gx0, gy0, 13, 25 - rightFootLift, 1, 4, SKIN, s);
  px(ctx, gx0, gy0, 12, 30 - rightFootLift, 4, 3, O, s);
  px(ctx, gx0, gy0, 13, 31 - rightFootLift, 2, 1, SHOE, s);
  px(ctx, gx0, gy0, 13, 32 - rightFootLift, 2, 1, '#ffffff', s);

  // Pleated Indigo Denim Skirt
  px(ctx, gx0, gy0, 5, 20, 12, 6, O, s);
  px(ctx, gx0, gy0, 6, 21, 10, 4, DENIM, s);
  px(ctx, gx0, gy0, 7, 21, 2, 4, DENIM_HI, s);
  px(ctx, gx0, gy0, 12, 21, 2, 4, DENIM_HI, s);

  // Torso: Cream Inner Tee + Cute Pink Cardigan
  px(ctx, gx0, gy0, 5, 12, 12, 9, O, s);
  px(ctx, gx0, gy0, 6, 13, 10, 7, PINK, s);
  px(ctx, gx0, gy0, 9, 13, 4, 7, TEE, s);
  px(ctx, gx0, gy0, 13, 14, 3, 6, PINK_SH, s);

  // Back Hair Layer
  px(ctx, gx0, gy0, 4 + headBob, 4, 14, 10, O, s);
  px(ctx, gx0, gy0, 5 + headBob, 5, 12, 8, HAIR, s);

  // Twin Hair Buns with Yellow Hair Ties!
  const bunBounce = Math.round(bounce * 1);
  // Left bun
  px(ctx, gx0, gy0, 2 + headBob, 1 - bunBounce, 5, 5, O, s);
  px(ctx, gx0, gy0, 3 + headBob, 2 - bunBounce, 3, 3, HAIR, s);
  px(ctx, gx0, gy0, 3 + headBob, 2 - bunBounce, 1, 1, HAIR_HI, s);
  px(ctx, gx0, gy0, 5 + headBob, 4 - bunBounce, 2, 1, '#f4c64b', s);
  // Right bun
  px(ctx, gx0, gy0, 15 + headBob, 1 - bunBounce, 5, 5, O, s);
  px(ctx, gx0, gy0, 16 + headBob, 2 - bunBounce, 3, 3, HAIR, s);
  px(ctx, gx0, gy0, 17 + headBob, 2 - bunBounce, 1, 1, HAIR_HI, s);
  px(ctx, gx0, gy0, 15 + headBob, 4 - bunBounce, 2, 1, '#f4c64b', s);

  // Head & Bangs
  px(ctx, gx0, gy0, 5 + headBob, 3, 12, 10, O, s);
  px(ctx, gx0, gy0, 6 + headBob, 4, 10, 8, SKIN, s);
  px(ctx, gx0, gy0, 6 + headBob, 11, 10, 1, SKIN_SH, s);
  // Dark bangs across top of forehead
  px(ctx, gx0, gy0, 5 + headBob, 3, 12, 3, HAIR, s);
  px(ctx, gx0, gy0, 7 + headBob, 3, 5, 1, HAIR_HI, s);
  px(ctx, gx0, gy0, 5 + headBob, 6, 1, 4, HAIR, s);
  px(ctx, gx0, gy0, 16 + headBob, 6, 1, 4, HAIR, s);

  // Expressive Eyes, Blush & Smile
  // Left eye
  px(ctx, gx0, gy0, 8 + headBob, 7, 2, 2, O, s);
  px(ctx, gx0, gy0, 8 + headBob, 7, 1, 1, '#ffffff', s);
  // Right eye (playful wink during Move 0!)
  if (wink) {
    px(ctx, gx0, gy0, 12 + headBob, 8, 2, 1, O, s);
  } else {
    px(ctx, gx0, gy0, 12 + headBob, 7, 2, 2, O, s);
    px(ctx, gx0, gy0, 12 + headBob, 7, 1, 1, '#ffffff', s);
  }
  // Rosy blush
  px(ctx, gx0, gy0, 7 + headBob, 9, 2, 1, '#f48096', s);
  px(ctx, gx0, gy0, 13 + headBob, 9, 2, 1, '#f48096', s);
  // Mouth
  if (bigLaugh) {
    px(ctx, gx0, gy0, 9 + headBob, 10, 4, 2, '#c84b59', s);
    px(ctx, gx0, gy0, 10 + headBob, 10, 2, 1, '#ffffff', s);
  } else {
    px(ctx, gx0, gy0, 9 + headBob, 10, 4, 1, '#b85058', s);
  }

  // Articulated Choreography Arms (4 Iconic 《甜蜜蜜》 Poses!)
  if (moveId === 'ready') {
    // Cheerful greeting wave toward camera
    px(ctx, gx0, gy0, 2, 13, 3, 6, O, s);
    px(ctx, gx0, gy0, 3, 14, 1, 4, PINK, s);
    const waveY = 9 + Math.round(Math.sin(elapsed * 7) * 1);
    px(ctx, gx0, gy0, 17, waveY, 3, 6, O, s);
    px(ctx, gx0, gy0, 18, waveY + 1, 1, 3, PINK, s);
    px(ctx, gx0, gy0, 18, waveY - 1, 2, 2, SKIN, s);
  } else if (moveId === 'point') {
    // Move 0: 「你爱我」— Left hand pointing playfully forward at lens, right hand on hip!
    // Left arm extended forward-left pointing at camera
    px(ctx, gx0, gy0, 0, 12, 6, 4, O, s);
    px(ctx, gx0, gy0, 2, 13, 4, 2, PINK, s);
    px(ctx, gx0, gy0, -1, 12, 3, 3, SKIN, s); // pointing fingertip toward lens!
    drawPixelStar(ctx, gx0 - 2 * s, gy0 + 12 * s, 2, '#ffe169');
    // Right hand propped on waist
    px(ctx, gx0, gy0, 17, 14, 3, 5, O, s);
    px(ctx, gx0, gy0, 18, 15, 1, 3, PINK, s);
    px(ctx, gx0, gy0, 16, 18, 2, 2, SKIN, s);
  } else if (moveId === 'heart') {
    // Move 1: 「我爱你」— Both arms arched overhead forming a big heart!
    // Left arm curving up & inward over head
    px(ctx, gx0, gy0, 2, 6, 4, 8, O, s);
    px(ctx, gx0, gy0, 3, 7, 2, 6, PINK, s);
    px(ctx, gx0, gy0, 4, 0, 6, 4, O, s);
    px(ctx, gx0, gy0, 5, 1, 4, 2, PINK, s);
    px(ctx, gx0, gy0, 9, 1, 2, 2, SKIN, s);
    // Right arm curving up & inward over head
    px(ctx, gx0, gy0, 16, 6, 4, 8, O, s);
    px(ctx, gx0, gy0, 17, 7, 2, 6, PINK, s);
    px(ctx, gx0, gy0, 12, 0, 6, 4, O, s);
    px(ctx, gx0, gy0, 13, 1, 4, 2, PINK, s);
    px(ctx, gx0, gy0, 11, 1, 2, 2, SKIN, s);
    // Floating pulsing pink heart right above Fina's overhead-heart arms!
    const hPulse = Math.round(Math.sin(elapsed * 10) * 2);
    drawPixelHeart(ctx, ox, gy0 - 8 + hPulse, 2, '#ff5c8a', '#59172b');
  } else if (moveId === 'sway') {
    // Move 2: 「蜜雪冰城」— Synchronized Joget hip sway & pumping forearms!
    const armShift = swayDir > 0 ? -2 : 2;
    // Left arm pumping
    px(ctx, gx0, gy0, 2 + armShift, 12 + (swayDir > 0 ? -1 : 2), 4, 6, O, s);
    px(ctx, gx0, gy0, 3 + armShift, 13 + (swayDir > 0 ? -1 : 2), 2, 3, PINK, s);
    px(ctx, gx0, gy0, 3 + armShift, 16 + (swayDir > 0 ? -1 : 2), 2, 2, SKIN, s);
    // Right arm pumping
    px(ctx, gx0, gy0, 16 + armShift, 12 + (swayDir < 0 ? -1 : 2), 4, 6, O, s);
    px(ctx, gx0, gy0, 17 + armShift, 13 + (swayDir < 0 ? -1 : 2), 2, 3, PINK, s);
    px(ctx, gx0, gy0, 17 + armShift, 16 + (swayDir < 0 ? -1 : 2), 2, 2, SKIN, s);
  } else if (moveId === 'finale') {
    // Move 3: 「甜蜜蜜」— First cup cheeks (0..0.7s), then pop Dual Peace Signs (V V)!
    if (moveLocalT < 0.72) {
      // Cupping cheeks beside smile
      px(ctx, gx0, gy0, 3, 10, 4, 6, O, s);
      px(ctx, gx0, gy0, 4, 12, 2, 3, PINK, s);
      px(ctx, gx0, gy0, 5, 9, 2, 3, SKIN, s);
      px(ctx, gx0, gy0, 15, 10, 4, 6, O, s);
      px(ctx, gx0, gy0, 16, 12, 2, 3, PINK, s);
      px(ctx, gx0, gy0, 15, 9, 2, 3, SKIN, s);
    } else {
      // Dual V Peace Signs raised brightly!
      // Left raised arm + V fingers
      px(ctx, gx0, gy0, 1, 9, 4, 7, O, s);
      px(ctx, gx0, gy0, 2, 11, 2, 4, PINK, s);
      px(ctx, gx0, gy0, 1, 7, 4, 3, SKIN, s);
      px(ctx, gx0, gy0, 1, 5, 1, 2, SKIN, s);
      px(ctx, gx0, gy0, 4, 5, 1, 2, SKIN, s);
      // Right raised arm + V fingers
      px(ctx, gx0, gy0, 17, 9, 4, 7, O, s);
      px(ctx, gx0, gy0, 18, 11, 2, 4, PINK, s);
      px(ctx, gx0, gy0, 17, 7, 4, 3, SKIN, s);
      px(ctx, gx0, gy0, 17, 5, 1, 2, SKIN, s);
      px(ctx, gx0, gy0, 20, 5, 1, 2, SKIN, s);
      drawPixelStar(ctx, gx0 + 1 * s, gy0 + 3 * s, 2, '#ffe169');
      drawPixelStar(ctx, gx0 + 21 * s, gy0 + 3 * s, 2, '#ff98b5');
    }
  }
}

function drawViewfinderHud(ctx, state, move, inWindow, elapsed, flashAlpha) {
  // Subtle rule-of-thirds viewfinder grid
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.fillRect(Math.round(W / 3), 24, 1, H - 48);
  ctx.fillRect(Math.round((W * 2) / 3), 24, 1, H - 48);
  ctx.fillRect(16, Math.round(H / 3), W - 32, 1);
  ctx.fillRect(16, Math.round((H * 2) / 3), W - 32, 1);

  // 4 outer viewfinder corner L-brackets
  const bracketColor = inWindow ? '#ffd859' : 'rgba(255, 252, 240, 0.85)';
  const m = 10;
  const arm = 14;
  ctx.fillStyle = bracketColor;
  // Top-left
  ctx.fillRect(m, m, arm, 2);
  ctx.fillRect(m, m, 2, arm);
  // Top-right
  ctx.fillRect(W - m - arm, m, arm, 2);
  ctx.fillRect(W - m - 2, m, 2, arm);
  // Bottom-left
  ctx.fillRect(m, H - m - 2, arm, 2);
  ctx.fillRect(m, H - m - arm, 2, arm);
  // Bottom-right
  ctx.fillRect(W - m - arm, H - m - 2, arm, 2);
  ctx.fillRect(W - m - 2, H - m - arm, 2, arm);

  // Golden auto-focus tracking box around both dancers when golden highlight window opens!
  if (state.phase === 'recording' && inWindow) {
    const pulse = Math.round(Math.sin(elapsed * 14) * 2);
    const fx = 68 - pulse;
    const fy = 56 - pulse;
    const fw = 184 + pulse * 2;
    const fh = 92 + pulse * 2;
    ctx.strokeStyle = '#ffd859';
    ctx.lineWidth = 2;
    ctx.strokeRect(fx, fy, fw, fh);
    // Tiny center focus crosshair
    ctx.fillStyle = '#ffd859';
    ctx.fillRect(156, 100, 8, 2);
    ctx.fillRect(159, 97, 2, 8);
  }

  // Top translucent camera status bar
  ctx.fillStyle = 'rgba(20, 18, 22, 0.56)';
  ctx.fillRect(12, 12, W - 24, 16);

  // REC dot / STANDBY indicator
  if (state.phase === 'recording') {
    const blink = Math.floor(elapsed * 2.5) % 2 === 0;
    ctx.fillStyle = blink ? '#ff424c' : '#8a2329';
    ctx.fillRect(18, 17, 6, 6);
  } else {
    ctx.fillStyle = '#6ce089';
    ctx.fillRect(18, 17, 6, 6);
  }

  // Tiny pixel audio visualizer bars dancing to 《甜蜜蜜》
  const bars = state.phase === 'recording' ? 5 : 3;
  for (let i = 0; i < bars; i++) {
    const bh = state.phase === 'recording'
      ? 3 + Math.round(Math.abs(Math.sin(elapsed * 9 + i * 1.3)) * 7)
      : 3;
    ctx.fillStyle = i % 2 === 0 ? '#ffd859' : '#ff8aa8';
    ctx.fillRect(256 + i * 4, 24 - bh, 2, bh);
  }
  // Tiny battery icon top-right
  ctx.fillStyle = '#e8f5e8';
  ctx.fillRect(284, 16, 16, 8);
  ctx.fillRect(300, 18, 2, 4);
  ctx.fillStyle = '#4ad178';
  ctx.fillRect(286, 18, 11, 4);

  // White camera shutter flash
  if (flashAlpha > 0.01) {
    ctx.fillStyle = `rgba(255, 252, 240, ${flashAlpha.toFixed(2)})`;
    ctx.fillRect(0, 0, W, H);
  }
}

function ratingForHits(hits) {
  if (hits >= 4) return {tag: '街头爆款', note: '四个高光舞姿一个没漏，节奏卡得比专业摄影师还准！'};
  if (hits === 3) return {tag: '元气满满', note: '雪王的权杖和菲娜的比心都稳稳抓拍到了，超有感染力！'};
  if (hits >= 1) return {tag: '可爱出片', note: '把雅加达蜜雪门口最热闹的共舞瞬间留在了镜头里！'};
  return {tag: '随手一拍', note: '完整录下了菲娜和雪王跟着《甜蜜蜜》共舞的全过程！'};
}

export function openDanceFilm(scene) {
  const prevWorld = scene.worldId;
  scene.closeOverlay();
  sound.open();

  const sheet = document.querySelector('#sheet');
  sheet.classList.remove('sdv-sheet');

  const touch = isTouchEnabled();
  const root = el('div', 'dialog phone-cam');
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', '菲娜的手机取景框 · 雪王共舞拍摄');

  const scope = new AbortController();
  scene.panelScope = scope;
  scene.overlay = 'dance';
  syncTouchHud(scene);

  // Smartphone Left Bezel (camera lens dot & earpiece speaker)
  const leftBezel = el('div', 'phone-bezel-left');
  leftBezel.append(el('span', 'phone-lens'), el('span', 'phone-speaker'));

  // Center Screen Frame
  const screenWrap = el('div', 'phone-screen');
  const canvas = el('canvas', 'phone-canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Crisp DOM overlays positioned inside phone screen (crisp FusionPixel font, zero blurry canvas text!)
  const topMeta = el('div', 'phone-top-meta');
  const recLabel = el('span', 'phone-rec-label', '准备就绪 · 00:00');
  const trackLabel = el('span', 'phone-track-label', '♫ 蜜雪冰城甜蜜蜜');
  topMeta.append(recLabel, trackLabel);

  const cueBanner = el('div', 'phone-cue-banner');
  const cueLyric = el('strong', 'phone-cue-lyric', '菲娜正在雪王旁摆好站位');
  const cueSub = el('span', 'phone-cue-sub', '点击右侧「开始录像」跟着旋律拍下 4 个舞姿');
  cueBanner.append(cueLyric, cueSub);

  const popBadge = el('div', 'phone-pop-badge');
  popBadge.hidden = true;

  const beatStrip = el('div', 'phone-beat-strip');
  const beatDots = DANCE_MOVES.map((m, idx) => {
    const dot = el('span', 'phone-beat-dot');
    dot.textContent = `${idx + 1} ${m.lyric}`;
    beatStrip.append(dot);
    return dot;
  });

  // Ready / Review inner screen overlay card
  const stageOverlay = el('div', 'phone-overlay');
  screenWrap.append(canvas, topMeta, popBadge, cueBanner, beatStrip, stageOverlay);

  // Smartphone Right Control Bezel (Close, Big Tactile Shutter/Rec Button, Counter)
  const rightBezel = el('div', 'phone-bezel-right');
  const exitBtn = el('button', 'phone-exit', '×');
  exitBtn.type = 'button';
  exitBtn.setAttribute('aria-label', '收起手机');

  const shutterBtn = el('button', 'phone-shutter ready');
  shutterBtn.type = 'button';
  const shutterInner = el('span', 'phone-shutter-inner', '录像');
  shutterBtn.append(shutterInner);

  const counterPill = el('div', 'phone-counter', '高光 0/4');
  const hintPill = el('small', 'phone-kbd-hint', touch ? '点快门抓拍' : '空格抓拍');
  rightBezel.append(exitBtn, shutterBtn, counterPill, hintPill);

  root.append(leftBezel, screenWrap, rightBezel);
  sheet.replaceChildren(root);
  sheet.hidden = false;

  const state = {
    phase: 'ready', // 'ready' | 'recording' | 'review'
    startedAt: 0,
    elapsed: 0,
    moveIdx: 0,
    inWindow: false,
    hits: 0,
    capturedMoves: new Set(),
    snapshots: [],
    bestSnap: null,
    flashAlpha: 0,
    particles: [],
    popTimer: 0,
    rafId: 0,
    closed: false
  };

  function syncDataset() {
    root.dataset.phase = state.phase;
    root.dataset.moveIdx = String(state.moveIdx);
    root.dataset.inWindow = state.inWindow ? '1' : '0';
    root.dataset.hits = String(state.hits);
    counterPill.textContent = `高光 ${state.hits}/4`;
  }

  function showPop(text, golden) {
    popBadge.textContent = text;
    popBadge.className = 'phone-pop-badge ' + (golden ? 'gold' : 'cute');
    popBadge.hidden = false;
    state.popTimer = 0.82;
  }

  function spawnBurst(golden) {
    const count = golden ? 12 : 6;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 26 + Math.random() * 38;
      state.particles.push({
        kind: i % 3 === 0 ? 'heart' : i % 3 === 1 ? 'note' : 'star',
        x: 160 + (Math.random() - 0.5) * 90,
        y: 112 + (Math.random() - 0.5) * 32,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 22,
        life: 0.9 + Math.random() * 0.35,
        maxLife: 1.25,
        color: golden ? (i % 2 === 0 ? '#ffd859' : '#ff5f8f') : '#9ce8ff'
      });
    }
  }

  function renderReadyOverlay() {
    stageOverlay.hidden = false;
    stageOverlay.className = 'phone-overlay ready';
    stageOverlay.replaceChildren();
    const card = el('div', 'phone-ov-card');
    card.append(
      el('strong', '', '已接过菲娜的手机 · 准备开拍'),
      el('p', '', '按下「开始录像」播放《蜜雪冰城甜蜜蜜》，金色对焦框亮起时按快门抓拍 4 个高光舞姿！')
    );
    const goBtn = el('button', 'phone-primary-btn', '● 开始录像');
    goBtn.type = 'button';
    goBtn.onclick = () => startRecording();
    card.append(goBtn);
    stageOverlay.append(card);
  }

  function renderReviewOverlay() {
    stageOverlay.hidden = false;
    stageOverlay.className = 'phone-overlay review';
    stageOverlay.replaceChildren();

    const rating = ratingForHits(state.hits);
    const card = el('div', 'phone-review-card');

    const preview = el('div', 'phone-review-thumb');
    if (state.bestSnap) {
      const img = el('img');
      img.src = state.bestSnap;
      img.alt = '雪王与菲娜共舞定格';
      preview.append(img);
    }
    const badge = el('span', 'phone-review-stamp', rating.tag);
    preview.append(badge);

    const info = el('div', 'phone-review-info');
    info.append(
      el('strong', '', `拍摄完成 · 高光抓拍 ${state.hits} / 4`),
      el('p', '', rating.note)
    );

    const btns = el('div', 'phone-review-actions');
    const handBackBtn = el('button', 'phone-primary-btn', '把手机还给菲娜 ▸');
    handBackBtn.type = 'button';
    handBackBtn.onclick = () => finishAndHandBack();
    const retryBtn = el('button', 'phone-secondary-btn', '重拍一条');
    retryBtn.type = 'button';
    retryBtn.onclick = () => startRecording();
    btns.append(handBackBtn, retryBtn);
    info.append(btns);

    card.append(preview, info);
    stageOverlay.append(card);
  }

  function drawSceneFrame(cleanForSnap = false, nowSec = 0) {
    const t = state.phase === 'recording' ? state.elapsed : nowSec;
    const move = state.phase === 'recording' ? DANCE_MOVES[state.moveIdx] : null;
    const moveId = move ? move.id : 'ready';
    const localT = move ? Math.max(0, state.elapsed - move.start) : t;
    // Cheerful ~118 BPM bounce cycle matching 《蜜雪冰城甜蜜蜜》
    const beatPhase = (t * 1.96) % 2;

    drawBackdrop(ctx, t);
    drawCloseSnowKing(ctx, 114, 142, moveId, beatPhase, t);
    drawCloseFina(ctx, 206, 142, moveId, beatPhase, t, localT);

    // Ambient floating notes during recording
    if (state.phase === 'recording') {
      for (let i = 0; i < 3; i++) {
        const nt = (t * 0.65 + i * 0.33) % 1;
        const nx = 90 + i * 70 + Math.sin(nt * Math.PI * 2 + i) * 10;
        const ny = 96 - nt * 42;
        drawPixelNote(ctx, nx, ny, i % 2 === 0 ? '#ffd859' : '#ff6b8b');
      }
    }

    // Burst particles from shutter snaps
    for (const pt of state.particles) {
      if (pt.kind === 'heart') drawPixelHeart(ctx, Math.round(pt.x), Math.round(pt.y), 1, pt.color, '#471524');
      else if (pt.kind === 'note') drawPixelNote(ctx, pt.x, pt.y, pt.color);
      else drawPixelStar(ctx, pt.x, pt.y, 2, pt.color);
    }

    if (!cleanForSnap) {
      drawViewfinderHud(ctx, state, move, state.inWindow, t, state.flashAlpha);
    }
  }

  function startRecording() {
    if (state.closed) return;
    sound.unlock();
    sound.playTrack('mixue', {restart: true});
    state.phase = 'recording';
    state.startedAt = performance.now();
    state.elapsed = 0;
    state.moveIdx = 0;
    state.inWindow = false;
    state.hits = 0;
    state.capturedMoves.clear();
    state.snapshots = [];
    state.bestSnap = null;
    state.particles = [];
    state.flashAlpha = 0;
    stageOverlay.hidden = true;
    shutterBtn.className = 'phone-shutter rec';
    shutterInner.textContent = '抓拍';
    for (const d of beatDots) d.className = 'phone-beat-dot';
    syncDataset();
  }

  function captureSnapshot(move) {
    drawSceneFrame(true, state.elapsed);
    let url = null;
    try {
      url = canvas.toDataURL('image/jpeg', 0.82);
    } catch { /* ignore */ }
    if (url) {
      state.snapshots.push({moveId: move.id, url});
      state.bestSnap = url;
    }
  }

  function triggerSnap() {
    if (state.closed) return;
    if (state.phase === 'ready') {
      startRecording();
      return;
    }
    if (state.phase !== 'recording') return;

    const move = DANCE_MOVES[state.moveIdx];
    const isFreshGolden = state.inWindow && !state.capturedMoves.has(move.id);
    sound.shutter();
    state.flashAlpha = 0.78;
    captureSnapshot(move);

    if (isFreshGolden) {
      state.capturedMoves.add(move.id);
      state.hits = state.capturedMoves.size;
      sound.chime();
      beatDots[state.moveIdx].className = 'phone-beat-dot hit';
      showPop(`★ ${move.title} · 绝佳定格！`, true);
      spawnBurst(true);
    } else if (state.capturedMoves.has(move.id)) {
      showPop('已抓拍这一段，准备下个动作！', false);
      spawnBurst(false);
    } else {
      showPop('可爱抓拍！等金色对焦框亮起更出片', false);
      spawnBurst(false);
    }
    syncDataset();
  }

  function enterReview() {
    if (state.phase === 'review') return;
    const lastMove = DANCE_MOVES[DANCE_MOVES.length - 1];
    if (!state.bestSnap) captureSnapshot(lastMove);
    state.phase = 'review';
    state.inWindow = false;
    shutterBtn.className = 'phone-shutter done';
    shutterInner.textContent = '完成';
    recLabel.textContent = `录制完成 · 00:${String(Math.floor(TOTAL_SEC)).padStart(2, '0')}`;
    cueLyric.textContent = '♪ 甜蜜蜜合拍已存进菲娜相册';
    cueSub.textContent = '把手机还给菲娜看看成品吧';
    syncDataset();
    sound.chime();
    renderReviewOverlay();
  }

  function cleanup() {
    if (state.closed) return;
    state.closed = true;
    cancelAnimationFrame(state.rafId);
    if (window.BRAND_QUEST_DANCE) delete window.BRAND_QUEST_DANCE;
    if (sound.currentTrackKey() === 'mixue') {
      sound.setWorld(prevWorld, {restart: false});
    }
  }

  function finishAndHandBack() {
    const prevBest = Number(scene.session.flags.dance_hits || 0);
    const bestHits = Math.max(prevBest, state.hits);
    const rating = ratingForHits(state.hits);

    scene.session.flag('dance_video_done');
    scene.session.flag('dance_hits', bestHits);
    if (state.bestSnap) scene.session.snapshots.dance_video = state.bestSnap;
    scene.record(`帮菲娜拍下《甜蜜蜜》雪王共舞视频（高光 ${state.hits}/4 · ${rating.tag}）`);

    cleanup();
    scene.closeOverlay();
    sound.chime();
    unlockAchievement(scene, 'dance_filmer');

    dialog(
      scene,
      '菲娜 · 爱拍视频的姑娘',
      ['谢谢你！！终于和我最爱的雪王合拍了，我发到Tik Tok上面肯定是爆款！'],
      '街区支线 · 雅加达蜜雪门口',
      'dancer',
      '菲娜'
    );
  }

  exitBtn.onclick = () => {
    sound.close();
    cleanup();
    scene.closeOverlay();
  };
  shutterBtn.onclick = () => {
    if (state.phase === 'review') finishAndHandBack();
    else triggerSnap();
  };
  canvas.addEventListener('pointerdown', ev => {
    ev.preventDefault();
    if (state.phase === 'recording') triggerSnap();
  }, {signal: scope.signal});

  window.addEventListener('keydown', ev => {
    if (state.closed || ev.repeat) return;
    if (ev.code === 'Space' || ev.key === ' ') {
      ev.preventDefault();
      ev.stopPropagation();
      if (state.phase === 'review') finishAndHandBack();
      else triggerSnap();
    } else if (ev.key === 'Enter') {
      ev.preventDefault();
      ev.stopPropagation();
      if (state.phase === 'ready') startRecording();
      else if (state.phase === 'review') finishAndHandBack();
    }
  }, {signal: scope.signal, capture: true});

  scope.signal.addEventListener('abort', cleanup);

  let lastFrameAt = performance.now();
  function loop(now) {
    if (state.closed) return;
    const dt = Math.min(0.05, Math.max(0.001, (now - lastFrameAt) / 1000));
    lastFrameAt = now;

    if (state.flashAlpha > 0) state.flashAlpha = Math.max(0, state.flashAlpha - dt * 2.8);
    if (state.popTimer > 0) {
      state.popTimer -= dt;
      if (state.popTimer <= 0) popBadge.hidden = true;
    }
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const pt = state.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 40 * dt;
      pt.life -= dt;
      if (pt.life <= 0) state.particles.splice(i, 1);
    }

    if (state.phase === 'recording') {
      state.elapsed = (now - state.startedAt) / 1000;
      if (state.elapsed >= TOTAL_SEC) {
        enterReview();
      } else {
        let idx = DANCE_MOVES.findIndex(m => state.elapsed >= m.start && state.elapsed < m.end);
        if (idx < 0) idx = DANCE_MOVES.length - 1;
        state.moveIdx = idx;
        const move = DANCE_MOVES[idx];
        const inWin = state.elapsed >= move.winStart && state.elapsed <= move.winEnd;
        const freshWin = inWin && !state.capturedMoves.has(move.id);
        state.inWindow = inWin;

        const sec = Math.floor(state.elapsed);
        const tenths = Math.floor((state.elapsed - sec) * 10);
        recLabel.textContent = `REC 00:${String(sec).padStart(2, '0')}.${tenths}`;
        cueLyric.textContent = `♪ ${move.lyric} · ${move.title}`;
        cueSub.textContent = freshWin
          ? (touch ? '★ 金色对焦框亮起 · 点快门抓拍！' : '★ 金色对焦框亮起 · 按空格或点快门抓拍！')
          : move.cue;

        shutterBtn.classList.toggle('hot', freshWin);
        cueBanner.classList.toggle('hot', freshWin);

        for (let i = 0; i < beatDots.length; i++) {
          if (state.capturedMoves.has(DANCE_MOVES[i].id)) continue;
          beatDots[i].className = i === idx ? (freshWin ? 'phone-beat-dot active hot' : 'phone-beat-dot active') : 'phone-beat-dot';
        }
        syncDataset();
      }
    }

    drawSceneFrame(false, now / 1000);
    state.rafId = requestAnimationFrame(loop);
  }

  window.BRAND_QUEST_DANCE = {
    get phase() { return state.phase; },
    get moveIdx() { return state.moveIdx; },
    get inWindow() { return state.inWindow; },
    get hits() { return state.hits; },
    get elapsed() { return state.elapsed; },
    start: () => startRecording(),
    snap: () => triggerSnap(),
    jumpToMove: idx => {
      if (state.phase !== 'recording') startRecording();
      const m = DANCE_MOVES[Math.max(0, Math.min(DANCE_MOVES.length - 1, idx))];
      state.startedAt = performance.now() - ((m.winStart + 0.35) * 1000);
      state.elapsed = m.winStart + 0.35;
      state.moveIdx = idx;
      state.inWindow = true;
      syncDataset();
    },
    finishNow: () => enterReview(),
    handBack: () => finishAndHandBack(),
    close: () => exitBtn.click()
  };

  renderReadyOverlay();
  syncDataset();
  state.rafId = requestAnimationFrame(loop);
}
