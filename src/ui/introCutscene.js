import {el} from './panel.js';
import {sound} from '../systems/audio.js';
import {syncTouchHud, isTouchEnabled} from '../systems/touchControls.js';
import {WAN_PHOTO_KEYS} from '../data/content.js';
import playerPortrait from '../../assets/pixel/ui/portrait-player.png';
import compassIcon from '../../assets/pixel/ui/compass.png';
import cameraIcon from '../../assets/pixel/ui/camera.png';

/**
 * Arrival camera glide + Stardew-style welcome card once the player lands
 * at whichever first stop they chose in IntroScene (Jakarta OR Karawang).
 */
export function playOpeningCutscene(scene, onComplete) {
  const viewport = document.getElementById('viewport');
  viewport.classList.add('cutscene');
  scene.overlay = 'intro';
  syncTouchHud(scene);

  const isKarawang = scene.worldId === 'karawang';
  const endPos = isKarawang ? {x: 291, y: 220} : {x: 355, y: 238};
  const startPos = isKarawang ? {x: 291, y: 290} : {x: 355, y: 312};

  const player = scene.player;
  player.setPosition(startPos.x, startPos.y).setFrame(9).setDepth(startPos.y);

  document.getElementById('cutscene-layer')?.remove();
  const layer = el('div', 'cutscene-layer');
  layer.id = 'cutscene-layer';
  const topBar = el('div', 'cine-bar top');
  const botBar = el('div', 'cine-bar bottom');
  const skipBtn = el('button', 'cine-skip', '跳过 [Esc]');
  skipBtn.type = 'button';

  const caption = el('div', 'cine-caption');
  caption.append(
    el('strong', '', isKarawang ? '西爪哇 · 卡拉旺三一产业园' : '印度尼西亚 · 雅加达街区'),
    el('small', '', isKarawang ? '上午 10:30 · 班车停靠在产业园主干道前' : '上午 10:15 · 热闹的雅加达老城街角')
  );
  const dialogMount = el('div', 'cine-dialog-mount');
  layer.append(topBar, botBar, caption, dialogMount, skipBtn);
  viewport.append(layer);

  const cam = scene.cameras.main;
  cam.stopFollow();
  cam.scrollX = isKarawang ? 0 : 0;
  cam.scrollY = isKarawang ? 60 : 24;

  let finished = false;
  let phase = 'arrival'; // 'arrival' -> 'tutorial'
  const scope = new AbortController();

  function finishCutscene() {
    if (finished) return;
    finished = true;
    scope.abort();
    scene.tweens.killTweensOf([cam, player]);
    layer.remove();
    viewport.classList.remove('cutscene');
    player.setPosition(endPos.x, endPos.y).setFrame(0).setDepth(endPos.y);
    cam.startFollow(player, true, .16, .16, 0, 16);
    scene.overlay = null;
    syncTouchHud(scene);
    scene.session.flag('intro_done');
    scene.session.save();
    if (onComplete) onComplete();
  }

  function showTutorialCard() {
    if (finished || phase === 'tutorial') return;
    phase = 'tutorial';
    scene.tweens.killTweensOf([cam, player]);
    player.setPosition(endPos.x, endPos.y).setFrame(0).setDepth(endPos.y);
    caption.hidden = true;
    topBar.hidden = true;
    botBar.hidden = true;
    sound.open();
    dialogMount.replaceChildren();
    const box = el('div', 'sdv-dialog cine-dialog');

    const textPane = el('div', 'sdv-text-pane');
    textPane.append(el('div', 'sdv-meta', isKarawang ? '第一站 · 卡拉旺三一产业园' : '第一站 · 雅加达街区'));
    const bodyWrap = el('div', 'sdv-lines');
    if (isKarawang) {
      bodyWrap.append(
        el('p', '', '来到卡拉旺 KIM 产业园。北侧是主厂房和室外履带展机，东侧是服务车间——可以先找展机旁背斜挎包的万老师接下现场拍摄任务，再进车间操控龙门吊完成重型备件卸货；逛完随时按 M 乘班车去雅加达蜜雪街区。')
      );
    } else {
      bodyWrap.append(
        el('p', '', '来到雅加达老城街角，对面红底白字的蜜雪门店正值午高峰。可以先和街坊、骑手聊聊天，再进店体验当一回蜜雪店员、按顾客订单调配套餐；逛完后按 M 乘班车去西爪哇卡拉旺三一产业园。')
      );
    }

    const keys = isTouchEnabled()
      ? (isKarawang
        ? [
            ['左下摇杆', '拖动自由行走，按住加速'],
            ['右下互动键', '对话、进车间、卸货或骑车'],
            ['拍照按键', '找万老师借到相机后对 ◆ 拍照'],
            ['快捷栏', '随时打开手账、成就与城际班车']
          ]
        : [
            ['左下摇杆', '拖动自由行走，按住加速'],
            ['右下互动键', '对话、进店、调饮或骑电动车'],
            ['鸣笛 / 下车', '骑上电动车后可鸣笛与停放'],
            ['快捷栏', '随时打开手账、成就与城际班车']
          ])
      : (isKarawang
        ? [
            ['WASD / 方向键', '自由行走，Shift 加速'],
            ['E 键互动', '对话、进车间、核对备件或骑车'],
            ['F 键拍照', '找万老师借到相机后对 ◆ 拍照'],
            ['Tab / U / M', '手账 · 旅途成就 · 城际班车']
          ]
        : [
            ['WASD / 方向键', '自由行走，Shift 加速'],
            ['E 键互动', '对话、进店、调饮或骑电动车'],
            ['R / 空格键', '停放电动车 · 骑行时鸣笛'],
            ['Tab / U / M', '手账 · 旅途成就 · 城际班车']
          ]);
    const grid = el('div', 'tut-grid');
    for (const [k, desc] of keys) {
      const item = el('div', 'tut-item');
      item.append(el('kbd', '', k), el('span', '', desc));
      grid.append(item);
    }
    bodyWrap.append(grid);
    textPane.append(bodyWrap);

    const row = el('div', 'sdv-actions');
    const goBtn = el('button', 'sdv-next', '开始逛逛 [Enter] ▸');
    goBtn.type = 'button';
    goBtn.addEventListener('click', () => {
      sound.chime();
      finishCutscene();
    });
    row.append(goBtn);
    textPane.append(row);

    const portraitPane = el('div', 'sdv-portrait-pane');
    const frame = el('div', 'sdv-portrait-frame');
    const avatar = el('img', 'portrait-img');
    avatar.src = playerPortrait;
    avatar.alt = '旅行者';
    frame.append(avatar);
    const pip = el('span', 'sdv-pip');
    const plate = el('div', 'sdv-nameplate');
    plate.append(el('span', '', '旅行者'));
    portraitPane.append(frame, pip, plate);

    box.append(textPane, portraitPane);
    dialogMount.append(box);
  }

  const targetScrollX = cam.clampX(endPos.x - cam.width / 2);
  const targetScrollY = cam.clampY(endPos.y - cam.height / 2);
  scene.tweens.add({
    targets: cam,
    scrollX: targetScrollX,
    scrollY: targetScrollY,
    duration: 900,
    ease: 'Sine.easeInOut',
    onComplete: () => {
      if (finished) return;
      let walkTick = 0;
      scene.tweens.add({
        targets: player,
        y: endPos.y,
        duration: 720,
        ease: 'Linear',
        onUpdate: () => {
          walkTick++;
          player.setFrame(9 + [0, 1, 0, 2][Math.floor(walkTick / 6) % 4]).setDepth(player.y);
        },
        onComplete: () => {
          if (finished) return;
          player.setFrame(0);
          showTutorialCard();
        }
      });
    }
  });

  skipBtn.addEventListener('click', () => {
    sound.close();
    finishCutscene();
  });

  window.addEventListener('keydown', e => {
    if (e.repeat || finished) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      sound.close();
      finishCutscene();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (phase === 'arrival') showTutorialCard();
      else {
        sound.chime();
        finishCutscene();
      }
    }
  }, {signal: scope.signal});

  scene.events.once('shutdown', () => {
    if (!finished) {
      finished = true;
      scope.abort();
      layer.remove();
      viewport.classList.remove('cutscene');
    }
  });
}

export function renderOnboardingBar(scene) {
  const bar = document.getElementById('tutorial-bar');
  if (!bar) return;
  const transit = document.getElementById('transit-banner');
  if (transit && !transit.hidden) {
    bar.hidden = true;
    return;
  }
  const s = scene.session;
  const wanCount = s.photos.filter(k => WAN_PHOTO_KEYS.includes(k)).length;
  if (!s.has('intro_done') || s.has('tutorial_dismissed') || (s.done && (!s.has('field_start') || s.has('field_pair')))) {
    bar.hidden = true;
    return;
  }

  let text = '';
  let iconUrl = compassIcon;
  const inJakarta = scene.worldId === 'jakarta' || scene.worldId === 'mixue_shop';

  if (inJakarta) {
    if (!s.has('mixue_order')) {
      text = scene.worldId === 'mixue_shop'
        ? '指引：站到左柜台前按 E，体验蜜雪店员按订单调配 3 份套餐'
        : '指引：走到蜜雪门店门口按 E 进店，体验当一回蜜雪套餐店员';
    } else if (!s.has('sany_service')) {
      text = '指引：雅加达主线已完成！按 M 或到东南候车牌乘班车，前往卡拉旺三一产业园';
    } else {
      bar.hidden = true;
      return;
    }
  } else {
    if (!s.has('field_start')) {
      text = '指引：先找展机旁背斜挎包的万老师按 E 聊聊，接下园区三张现场照拍摄任务';
      iconUrl = cameraIcon;
    } else if (!s.has('sany_service')) {
      text = scene.worldId === 'sany_workshop'
        ? '指引：先去西侧龙门吊控制台按 E 卸载三箱备件，再去东侧交接签收并按 F 拍交接板'
        : '指引：沿途按 F 拍下 ◆ 标记（主厂房与展机），再进东侧服务车间操作龙门吊卸货';
      iconUrl = cameraIcon;
    } else if (!s.has('field_pair')) {
      text = wanCount >= 3
        ? '指引：三张现场照都拍齐啦！回卡拉旺展机旁找万老师交片 [E]'
        : `指引：万老师的三张现场照还差 ${3 - wanCount} 张，走到 ◆ 标记旁按 F 拍齐`;
      iconUrl = cameraIcon;
    } else if (!s.has('mixue_order')) {
      text = '指引：卡拉旺这边告一段落！按 M 或到西南候车牌乘班车去雅加达蜜雪街区';
    } else {
      bar.hidden = true;
      return;
    }
  }

  bar.replaceChildren();
  const icon = el('img', 'tut-step-icon');
  icon.src = iconUrl;
  icon.alt = '';
  bar.append(icon, el('span', 'tut-step-text', text));
  const close = el('button', 'tut-step-close', '×');
  close.type = 'button';
  close.title = '隐藏指引条';
  close.addEventListener('click', () => {
    s.flag('tutorial_dismissed');
    s.save();
    bar.hidden = true;
  });
  bar.append(close);
  bar.hidden = false;
}
