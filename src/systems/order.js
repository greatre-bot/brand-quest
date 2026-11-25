import {openPanel,dialog,el,actions,PORTRAITS} from '../ui/panel.js';
import {sound} from './audio.js';
import lemonUrl from '../../assets/pixel/ui/lemon.png';
import iceUrl from '../../assets/pixel/ui/ice.png';
import bobaUrl from '../../assets/pixel/ui/boba.png';
import strawberryUrl from '../../assets/pixel/ui/strawberry.png';
import coneUrl from '../../assets/pixel/ui/cone.png';
import bobaSundaeUrl from '../../assets/pixel/ui/boba-sundae.png';
import mangoSundaeUrl from '../../assets/pixel/ui/mango-sundae.png';
import cupUrl from '../../assets/pixel/ui/cup.png';

export const MIXUE_MENU_SECTIONS = [
  {
    title: '冰淇淋与圣代',
    items: [
      ['原味甜筒', '8,000 盾'],
      ['波霸圣代', '16,000 盾'],
      ['芒果圣代', '16,000 盾']
    ]
  },
  {
    title: '鲜果茶饮',
    items: [
      ['冰鲜柠檬水', '10,000 盾'],
      ['草莓果茶', '16,000 盾'],
      ['蜜桃四季春', '16,000 盾']
    ]
  },
  {
    title: '经典奶茶',
    items: [
      ['黑糖珍珠奶茶', '19,000 盾'],
      ['椰果奶茶', '19,000 盾']
    ]
  }
];

export const MIXUE_RECIPES = [
  {
    id: 'lemonade',
    name: '冰鲜柠檬水',
    price: '10,000 盾',
    ingLabel: '鲜柠檬片',
    ingImg: lemonUrl,
    pourLabel: '按住注水',
    liquidColor: '#efd968',
    foamColor: '#fff5b3',
    floats: true,
    dropSound: () => sound.lemonDrop()
  },
  {
    id: 'boba_tea',
    name: '黑糖珍珠奶茶',
    price: '19,000 盾',
    ingLabel: '黑糖珍珠',
    ingImg: bobaUrl,
    pourLabel: '按住注奶茶',
    liquidColor: '#d9a46a',
    foamColor: '#f7dfbc',
    floats: false,
    dropSound: () => sound.bobaDrop()
  },
  {
    id: 'strawberry_tea',
    name: '草莓果茶',
    price: '16,000 盾',
    ingLabel: '鲜草莓',
    ingImg: strawberryUrl,
    pourLabel: '按住注果茶',
    liquidColor: '#e86f7c',
    foamColor: '#ffd4da',
    floats: true,
    dropSound: () => sound.lemonDrop()
  }
];

export const MIXUE_DESSERTS = [
  {id: 'cone', name: '原味甜筒', price: '8,000 盾', img: coneUrl},
  {id: 'boba_sundae', name: '波霸圣代', price: '16,000 盾', img: bobaSundaeUrl},
  {id: 'mango_sundae', name: '芒果圣代', price: '16,000 盾', img: mangoSundaeUrl}
];

const COMBO_ORDERS = [
  {
    customer: '莎拉',
    portrait: PORTRAITS.hijab,
    say: '大热天走过来，来杯少糖加冰的冰鲜柠檬水，配个原味甜筒！',
    drink: 'lemonade',
    sugar: 'less',
    ice: true,
    dessert: 'cone'
  },
  {
    customer: '巴古斯',
    portrait: PORTRAITS.office,
    say: '午休提提神，我要正常糖加冰的黑糖珍珠奶茶，再来一份波霸圣代！',
    drink: 'boba_tea',
    sugar: 'normal',
    ice: true,
    dessert: 'boba_sundae'
  },
  {
    customer: '玛丽亚',
    portrait: PORTRAITS.auntie,
    say: '给孩子带份少糖加冰的草莓果茶，配一杯芒果圣代！',
    drink: 'strawberry_tea',
    sugar: 'less',
    ice: true,
    dessert: 'mango_sundae'
  }
];

const RECIPE_BY_ID = Object.fromEntries(MIXUE_RECIPES.map(r => [r.id, r]));
const DESSERT_BY_ID = Object.fromEntries(MIXUE_DESSERTS.map(d => [d.id, d]));

export function openOrder(scene) {
  const box = openPanel(scene, '蜜雪店员体验 · 套餐调配台', 'order', cupUrl);
  const scope = scene.panelScope, signal = scope.signal;

  // --- Top Papa's-style Customer Ticket Strip ---
  const ticketBar = el('div', 'papa-ticket-bar');
  const custBox = el('div', 'papa-customer');
  const custAvatar = el('img', 'papa-avatar');
  const custMeta = el('div', 'papa-cust-meta');
  const custName = el('b', '');
  const custSay = el('small', '');
  custMeta.append(custName, custSay);
  custBox.append(custAvatar, custMeta);

  const ticket = el('div', 'papa-ticket');
  const ticketHead = el('div', 'papa-ticket-head');
  const orderBadge = el('strong', '');
  const timer = el('b', 'papa-timer', '75 秒');
  ticketHead.append(orderBadge, timer);
  const ticketBody = el('div', 'papa-ticket-items');
  const reqDrink = el('span', 'papa-req');
  const reqMods = el('span', 'papa-req');
  const reqDessert = el('span', 'papa-req');
  ticketBody.append(reqDrink, reqMods, reqDessert);
  ticket.append(ticketHead, ticketBody);

  ticketBar.append(custBox, ticket);

  // --- Main 3-Zone Counter Stage ---
  const stage = el('div', 'order-stage papa-counter');

  // Zone 1: Drink Prep Station
  const drinkZone = el('div', 'papa-zone drink-zone');
  drinkZone.append(el('div', 'papa-zone-title', '① 饮品调配区'));
  const drinkBody = el('div', 'papa-drink-grid');

  const ingCol = el('div', 'papa-ing-col');
  const ingRow = el('div', 'papa-ing-row');
  const ingBtns = MIXUE_RECIPES.map((r, idx) => {
    const btn = el('button', 'papa-btn station-main');
    btn.dataset.ing = r.id;
    const img = el('img'); img.src = r.ingImg; img.alt = r.ingLabel;
    btn.append(img, el('span', '', `${idx + 1} ${r.ingLabel}`));
    ingRow.append(btn);
    return btn;
  });

  const modRow = el('div', 'papa-mod-row');
  const iceBtn = el('button', 'papa-mod-btn station-ice');
  const iceIcon = el('img'); iceIcon.src = iceUrl; iceIcon.alt = '冰块';
  iceBtn.append(iceIcon, el('span', '', '↑ 加冰块'));
  const sugarBtn = el('button', 'papa-mod-btn station-sugar', 'T 糖度：正常糖');
  const resetCupBtn = el('button', 'papa-mod-btn reset-cup', 'R 重调本杯');
  modRow.append(iceBtn, sugarBtn, resetCupBtn);

  const pour = el('button', 'station pour', '长按空格 / 按住注液');
  pour.disabled = true;
  ingCol.append(ingRow, modRow, pour);

  const cupWrap = el('div', 'papa-cup-wrap');
  const cup = el('div', 'glass');
  const stream = el('div', 'pour-stream');
  const liquid = el('div', 'liquid');
  const target = el('div', 'target');
  const slice = el('img', 'float-lemon'); slice.hidden = true;
  const iceCubes = el('img', 'float-ice'); iceCubes.src = iceUrl; iceCubes.hidden = true;
  const cupTag = el('span', 'cup-sugar-tag', '正常');
  cup.append(stream, liquid, target, slice, iceCubes, cupTag);
  const cupLabel = el('b', 'papa-cup-cap', '空杯');
  cupWrap.append(cup, cupLabel);

  drinkBody.append(ingCol, cupWrap);
  drinkZone.append(drinkBody);

  // Zone 2: Soft-Serve & Sundae Station
  const dessertZone = el('div', 'papa-zone dessert-zone');
  dessertZone.append(el('div', 'papa-zone-title', '② 甜筒 / 圣代区'));
  const dessertList = el('div', 'papa-dessert-list');
  const dessertBtns = MIXUE_DESSERTS.map((d, idx) => {
    const btn = el('button', 'papa-dessert-btn');
    btn.dataset.dessert = d.id;
    const img = el('img'); img.src = d.img; img.alt = d.name;
    btn.append(img, el('span', '', `${idx + 4} ${d.name}`));
    dessertList.append(btn);
    return btn;
  });
  dessertZone.append(dessertList);

  // Zone 3: Combo Serving Tray
  const trayZone = el('div', 'papa-zone tray-zone');
  trayZone.append(el('div', 'papa-zone-title', '③ 套餐托盘'));
  const tray = el('div', 'tray papa-tray');
  const trayDrinkSlot = el('div', 'tray-slot empty');
  const trayDrinkImg = el('img'); trayDrinkImg.hidden = true;
  const trayDrinkTxt = el('span', '', '饮品待放');
  trayDrinkSlot.append(trayDrinkImg, trayDrinkTxt);

  const trayDessertSlot = el('div', 'tray-slot empty');
  const trayDessertImg = el('img'); trayDessertImg.hidden = true;
  const trayDessertTxt = el('span', '', '甜品待选');
  trayDessertSlot.append(trayDessertImg, trayDessertTxt);
  tray.append(trayDrinkSlot, trayDessertSlot);

  const serveBtn = el('button', 'papa-serve-btn', '出餐交付 [→]');
  trayZone.append(tray, serveBtn);

  stage.append(drinkZone, dessertZone, trayZone);

  // Customer Rating Flash Banner (shown briefly between orders)
  const reviewBanner = el('div', 'papa-review');
  reviewBanner.hidden = true;
  stage.append(reviewBanner);

  const status = el('div', 'order-status', '');
  const keys = el('p', 'keys', '点击/拖拽原料入杯或用键盘：1/2/3 主料 · ↑ 加冰 · T 糖度 · 长按空格注液 · 4/5/6 配餐 · → 出餐');
  box.append(ticketBar, stage, status, keys);

  // --- Minigame State ---
  let orderIdx = 0;
  let scores = [];
  let chosenDrink = null;
  let hasIce = false;
  let sugar = 'normal'; // 'normal' | 'less'
  let level = 0;
  let filling = false;
  let cupOnTray = false;
  let chosenDessert = null;
  let locked = false;
  let ended = false;
  let remaining = 75;
  let previous = performance.now();
  let raf;
  let nextTimer = null;

  function currentOrder() { return COMBO_ORDERS[orderIdx]; }

  function stopFilling() {
    if (filling) { filling = false; cup.classList.remove('pouring'); }
    sound.stopPour();
  }

  function refreshTicketChecks() {
    const ord = currentOrder();
    const rec = RECIPE_BY_ID[ord.drink];
    const des = DESSERT_BY_ID[ord.dessert];
    const drinkOk = chosenDrink === ord.drink && level >= 60 && level <= 80;
    const modOk = hasIce === ord.ice && sugar === ord.sugar;
    const desOk = chosenDessert === ord.dessert;

    reqDrink.textContent = `${drinkOk ? '☑' : '☐'} ${rec.name}`;
    reqDrink.classList.toggle('done', drinkOk);
    const modLabel = `${ord.sugar === 'less' ? '少糖' : '正常糖'} · ${ord.ice ? '加冰' : '去冰'}`;
    reqMods.textContent = `${modOk ? '☑' : '☐'} ${modLabel}`;
    reqMods.classList.toggle('done', modOk);
    reqDessert.textContent = `${desOk ? '☑' : '☐'} ${des.name}`;
    reqDessert.classList.toggle('done', desOk);
  }

  function refreshTray() {
    if (chosenDrink && level >= 45) {
      const r = RECIPE_BY_ID[chosenDrink];
      trayDrinkSlot.classList.remove('empty');
      trayDrinkSlot.classList.toggle('ready', cupOnTray || (level >= 60 && level <= 80));
      trayDrinkImg.src = cupUrl;
      trayDrinkImg.hidden = false;
      trayDrinkTxt.textContent = `${r.name}${cupOnTray ? ' ☑' : ''}`;
    } else {
      trayDrinkSlot.classList.add('empty');
      trayDrinkSlot.classList.remove('ready');
      trayDrinkImg.hidden = true;
      trayDrinkTxt.textContent = '饮品待调';
    }
    if (chosenDessert) {
      const d = DESSERT_BY_ID[chosenDessert];
      trayDessertSlot.classList.remove('empty');
      trayDessertSlot.classList.add('ready');
      trayDessertImg.src = d.img;
      trayDessertImg.hidden = false;
      trayDessertTxt.textContent = d.name;
    } else {
      trayDessertSlot.classList.add('empty');
      trayDessertSlot.classList.remove('ready');
      trayDessertImg.hidden = true;
      trayDessertTxt.textContent = '甜品待选';
    }
    dessertBtns.forEach(b => b.classList.toggle('active', b.dataset.dessert === chosenDessert));
    refreshTicketChecks();
  }

  function resetCup(quiet = false) {
    stopFilling();
    chosenDrink = null;
    hasIce = false;
    sugar = 'normal';
    level = 0;
    cupOnTray = false;
    slice.hidden = true;
    slice.classList.remove('drop-in');
    slice.style.bottom = '2px';
    iceCubes.hidden = true;
    iceCubes.classList.remove('drop-in');
    iceCubes.style.bottom = '4px';
    liquid.style.height = '0%';
    cup.style.setProperty('--liq', '#efd968');
    cup.style.setProperty('--liq-top', '#fff5b3');
    cupTag.textContent = '正常';
    cupTag.classList.remove('less');
    cupLabel.textContent = '空杯';
    pour.disabled = true;
    pour.textContent = '长按空格 / 按住注液';
    iceBtn.classList.remove('active');
    sugarBtn.textContent = 'T 糖度：正常糖';
    sugarBtn.classList.remove('less');
    ingBtns.forEach(b => b.classList.remove('active'));
    if (!quiet) status.textContent = '已换一只空杯，按小票重新放料、加冰、调糖度吧。';
    refreshTray();
  }

  function loadOrder(idx) {
    orderIdx = idx;
    locked = false;
    reviewBanner.hidden = true;
    chosenDessert = null;
    resetCup(true);
    const ord = currentOrder();
    const rec = RECIPE_BY_ID[ord.drink];
    const des = DESSERT_BY_ID[ord.dessert];
    custAvatar.src = ord.portrait;
    custAvatar.alt = ord.customer;
    custName.textContent = `${ord.customer} · 顾客`;
    custSay.textContent = `“${ord.say}”`;
    orderBadge.textContent = `套餐小票 ${idx + 1} / ${COMBO_ORDERS.length}`;
    status.textContent = `第 ${idx + 1} 单：先放「${rec.ingLabel}」、加冰调「${ord.sugar === 'less' ? '少糖' : '正常糖'}」注至绿线，再配「${des.name}」。`;
    refreshTray();
  }

  function pickIngredient(drinkId) {
    if (ended || locked) return;
    const rec = RECIPE_BY_ID[drinkId];
    if (!rec) return;
    if (level > 0 && chosenDrink !== drinkId) resetCup(true);
    chosenDrink = drinkId;
    slice.src = rec.ingImg;
    slice.hidden = false;
    slice.classList.remove('drop-in');
    void slice.offsetWidth;
    slice.classList.add('drop-in');
    slice.style.bottom = rec.floats ? Math.max(2, level - 22) + '%' : '2px';
    cup.style.setProperty('--liq', rec.liquidColor);
    cup.style.setProperty('--liq-top', rec.foamColor);
    cupLabel.textContent = rec.name;
    pour.disabled = false;
    pour.textContent = rec.pourLabel;
    ingBtns.forEach(b => b.classList.toggle('active', b.dataset.ing === drinkId));
    rec.dropSound();
    status.textContent = hasIce
      ? `已放${rec.ingLabel}与冰块，核对糖度后按住「${rec.pourLabel}」到绿线。`
      : `已放${rec.ingLabel}，别忘了加冰块和核对糖度，再按住「${rec.pourLabel}」。`;
    refreshTray();
  }

  function toggleIce() {
    if (ended || locked) return;
    if (hasIce) {
      hasIce = false;
      iceCubes.hidden = true;
      iceBtn.classList.remove('active');
      sound.close();
      status.textContent = '已取消冰块（去冰）。';
    } else {
      hasIce = true;
      iceCubes.hidden = false;
      iceCubes.classList.remove('drop-in');
      void iceCubes.offsetWidth;
      iceCubes.classList.add('drop-in');
      iceCubes.style.bottom = Math.max(4, level - 16) + '%';
      iceBtn.classList.add('active');
      sound.iceDrop();
      status.textContent = chosenDrink
        ? '冰块哗啦入杯！核对糖度后按住注液至绿线。'
        : '冰块已入杯，接着放入小票要求的饮品主料吧。';
    }
    refreshTray();
  }

  function toggleSugar() {
    if (ended || locked) return;
    sugar = sugar === 'normal' ? 'less' : 'normal';
    const isLess = sugar === 'less';
    sugarBtn.textContent = isLess ? 'T 糖度：少糖' : 'T 糖度：正常糖';
    sugarBtn.classList.toggle('less', isLess);
    cupTag.textContent = isLess ? '少糖' : '正常';
    cupTag.classList.toggle('less', isLess);
    sound.syrupPump();
    status.textContent = `已切换为「${isLess ? '少糖' : '正常糖'}」。`;
    refreshTicketChecks();
  }

  function pickDessert(dessertId) {
    if (ended || locked) return;
    const des = DESSERT_BY_ID[dessertId];
    if (!des) return;
    chosenDessert = dessertId;
    sound.swirl();
    status.textContent = `已盛好「${des.name}」放到托盘！`;
    refreshTray();
  }

  function startFilling() {
    if (ended || locked || !chosenDrink || filling) return;
    filling = true;
    cup.classList.add('pouring');
    sound.startPour(level);
  }

  function stopShift(message) {
    ended = true;
    stopFilling();
    clearTimeout(nextTimer);
    timer.textContent = '时间到';
    status.textContent = message;
    pour.disabled = serveBtn.disabled = true;
    ingBtns.forEach(b => { b.disabled = true; });
    dessertBtns.forEach(b => { b.disabled = true; });
    iceBtn.disabled = sugarBtn.disabled = resetCupBtn.disabled = true;
    sound.error();
    actions(box, [['再来一轮午高峰', () => openOrder(scene)]]);
  }

  function serveCombo() {
    if (ended || locked) return;
    stopFilling();
    if (!chosenDrink || level < 45) {
      sound.error();
      status.textContent = '饮品还没调好呢，先放主料并按住注液到绿线！';
      return;
    }
    if (!chosenDessert) {
      sound.error();
      status.textContent = '套餐还缺甜品！在中间「甜筒 / 圣代区」选好配餐再出餐。';
      return;
    }
    const ord = currentOrder();
    const rec = RECIPE_BY_ID[ord.drink];
    const des = DESSERT_BY_ID[ord.dessert];
    let pts = 0;
    const misses = [];
    if (chosenDrink === ord.drink) pts += 30;
    else misses.push(`应做${rec.name}`);
    if (hasIce === ord.ice) pts += 15;
    else misses.push(ord.ice ? '忘了加冰' : '应去冰');
    if (sugar === ord.sugar) pts += 15;
    else misses.push(`应选${ord.sugar === 'less' ? '少糖' : '正常糖'}`);
    if (level >= 60 && level <= 80) pts += 20;
    else { pts += 8; misses.push('液面略偏'); }
    if (chosenDessert === ord.dessert) pts += 20;
    else misses.push(`配餐应为${des.name}`);

    scores.push(pts);
    locked = true;
    cupOnTray = true;
    refreshTray();
    sound.orderBell();

    const stars = pts >= 95 ? '★★★' : pts >= 70 ? '★★☆' : '★☆☆';
    const mood = pts >= 95 ? `${ord.customer}满意极了！` : pts >= 70 ? `${ord.customer}觉得挺不错！` : `${ord.customer}挠了挠头：`;
    const note = misses.length ? `（${misses.join('、')}）` : '口味、冰糖与配餐全都对单！';
    reviewBanner.innerHTML = '';
    reviewBanner.append(
      el('strong', '', `${mood} ${pts} 分 ${stars}`),
      el('span', '', note)
    );
    reviewBanner.className = 'papa-review ' + (pts >= 95 ? 'perfect' : pts >= 70 ? 'good' : 'ok');
    reviewBanner.hidden = false;

    nextTimer = window.setTimeout(() => {
      if (signal.aborted || ended) return;
      if (orderIdx + 1 < COMBO_ORDERS.length) {
        loadOrder(orderIdx + 1);
      } else {
        ended = true;
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const labelText = `3 单套餐体验（好评 ${avg}%）`;
        scene.session.flags.last_drink = labelText;
        scene.session.flags.mixue_score = avg;
        if (!scene.session.has('mixue_order')) {
          scene.finishTask('mixue_order', labelText);
        } else {
          sound.chime();
          scene.record(`又完成一轮蜜雪套餐班次（好评 ${avg}%）`);
          dialog(scene, `午高峰收工 · 好评 ${avg}%`, [
            '谢谢你帮忙做好，味道挺地道的。',
            `这一轮 3 份顾客套餐平均好评 ${avg}%，想挑战满分随时欢迎再来台前帮忙！`
          ], '莉娜 · 取餐台店员', 'clerk', '莉娜');
        }
      }
    }, 950);
  }

  // Click + Drag-to-Cup / Drag-to-Tray support (so both fast clicking and Papa's dragging feel natural!)
  const bindDragOrClick = (node, imgSrc, dropTarget, onApply) => {
    node.addEventListener('pointerdown', event => {
      if (ended || locked || event.button !== 0) return;
      event.preventDefault();
      node.setPointerCapture(event.pointerId);
      const sx = event.clientX, sy = event.clientY;
      let moved = false, ghost = null;
      const move = e => {
        if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) > 8) {
          moved = true;
          node.classList.add('dragging');
          ghost = el('img'); ghost.src = imgSrc;
          Object.assign(ghost.style, {position: 'fixed', width: '34px', pointerEvents: 'none', zIndex: 9, transform: 'translate(-50%,-50%)', left: e.clientX + 'px', top: e.clientY + 'px'});
          box.append(ghost);
        }
        if (ghost) { ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px'; }
      };
      const end = e => {
        node.classList.remove('dragging');
        ghost?.remove();
        node.removeEventListener('pointermove', move);
        node.removeEventListener('pointerup', end);
        node.removeEventListener('pointercancel', end);
        if (e.type === 'pointercancel') return;
        const dest = document.elementFromPoint(e.clientX, e.clientY);
        if (!moved || dropTarget.contains(dest)) onApply();
        else status.textContent = dropTarget === cupWrap ? '请点选或拖放到调配杯中。' : '请点选或拖放到右侧套餐托盘中。';
      };
      node.addEventListener('pointermove', move, {signal});
      node.addEventListener('pointerup', end, {signal});
      node.addEventListener('pointercancel', end, {signal});
    }, {signal});
  };

  ingBtns.forEach((btn, idx) => {
    const r = MIXUE_RECIPES[idx];
    bindDragOrClick(btn, r.ingImg, cupWrap, () => pickIngredient(r.id));
  });
  bindDragOrClick(iceBtn, iceUrl, cupWrap, toggleIce);
  sugarBtn.addEventListener('click', toggleSugar, {signal});
  resetCupBtn.addEventListener('click', () => { if (!ended && !locked) { sound.close(); resetCup(); } }, {signal});
  dessertBtns.forEach((btn, idx) => {
    const d = MIXUE_DESSERTS[idx];
    bindDragOrClick(btn, d.img, tray, () => pickDessert(d.id));
  });
  // Drag finished cup directly to tray to deliver or place!
  bindDragOrClick(cup, cupUrl, tray, () => {
    if (!chosenDrink || level < 45) {
      status.textContent = '先选主料并按住注液到绿线，再端上托盘。';
      return;
    }
    cupOnTray = true;
    sound.pickup();
    refreshTray();
    if (chosenDessert) serveCombo();
    else status.textContent = '饮品已端上托盘，再选好配餐甜品即可出餐！';
  });

  serveBtn.addEventListener('click', serveCombo, {signal});
  pour.onpointerdown = e => {
    if (!chosenDrink || ended || locked) return;
    e.preventDefault();
    pour.setPointerCapture(e.pointerId);
    startFilling();
  };
  pour.onpointerup = stopFilling;
  pour.onlostpointercapture = stopFilling;
  window.addEventListener('blur', stopFilling, {signal});

  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (!['1', '2', '3', '4', '5', '6', 'arrowup', 'arrowright', 't', 'r', ' '].includes(k)) return;
    e.preventDefault();
    if (e.repeat || ended || locked) return;
    if (k === '1') pickIngredient('lemonade');
    else if (k === '2') pickIngredient('boba_tea');
    else if (k === '3') pickIngredient('strawberry_shake');
    else if (k === '4') pickDessert('cone');
    else if (k === '5') pickDessert('boba_sundae');
    else if (k === '6') pickDessert('mango_sundae');
    else if (k === 'arrowup') toggleIce();
    else if (k === 't') toggleSugar();
    else if (k === 'r') { sound.close(); resetCup(); }
    else if (k === ' ' && chosenDrink) startFilling();
    else if (k === 'arrowright') serveCombo();
  }, {signal, capture: true});
  window.addEventListener('keyup', e => { if (e.key === ' ') stopFilling(); }, {signal});

  loadOrder(0);

  function tick(now) {
    if (ended || signal.aborted) return;
    const dt = (now - previous) / 1000;
    previous = now;
    if (!locked) {
      remaining -= dt;
      timer.textContent = Math.max(0, Math.ceil(remaining)) + ' 秒';
      if (remaining <= 0) {
        stopShift(`午高峰时间已过（已完成 ${orderIdx} / ${COMBO_ORDERS.length} 单），重开一轮试试吧！`);
        return;
      }
    }
    if (filling && chosenDrink) {
      const rec = RECIPE_BY_ID[chosenDrink];
      level = Math.min(100, level + dt * 32);
      liquid.style.height = level + '%';
      sound.updatePour(level);
      slice.style.bottom = rec.floats ? Math.max(2, level - 22) + '%' : '2px';
      iceCubes.style.bottom = Math.max(4, level - 16) + '%';
      if (level >= 60 && level <= 80) {
        status.textContent = chosenDessert
          ? '液面刚好进入绿线！点「出餐交付」或把杯子拖到托盘即可上餐。'
          : '液面刚好进入绿线！在中间选好甜品配餐即可出餐。';
        refreshTray();
      }
      if (level > 84) {
        sound.error();
        resetCup(true);
        status.textContent = '液面超过绿色上限溢出了！已换好新空杯，松手稳一点再注吧。';
      }
    }
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);
  signal.addEventListener('abort', () => {
    cancelAnimationFrame(raf);
    clearTimeout(nextTimer);
    stopFilling();
  }, {once: true});
}
