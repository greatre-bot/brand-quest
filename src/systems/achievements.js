import {el, openPanel} from '../ui/panel.js';
import {sound} from './audio.js';
import trophyIcon from '../../assets/pixel/ui/trophy.png';

export const ACHIEVEMENTS = [
  {
    id: 'first_ride',
    title: '街头小电驴',
    group: '街区探索',
    desc: '跨上路边电动车，吹着爪哇岛的风自由巡街。',
    hint: '走近街边或园区停放的电动车，按 E 骑上它。'
  },
  {
    id: 'street_horn',
    title: '嘀嘀借过',
    group: '街区探索',
    desc: '骑着电动车轻轻按响喇叭，引得路边行人纷纷回头。',
    hint: '骑上电动车后按空格键鸣笛。'
  },
  {
    id: 'lemon_master',
    title: '蜜雪王牌店员',
    group: '雅加达蜜雪',
    desc: '在午高峰的蜜雪吧台按顾客小票完成整轮 3 份饮品甜品套餐交付。',
    hint: '进入雅加达蜜雪门店，在左柜台按顾客订单完成一轮套餐调配。'
  },
  {
    id: 'dance_filmer',
    title: '甜蜜蜜导演',
    group: '雅加达支线',
    desc: '接过菲娜的手机，跟着《甜蜜蜜》旋律拍下她与雪王共舞的街头短视频。',
    hint: '走到雅加达蜜雪门口跳舞的雪王旁，和菲娜对话接过手机拍一段共舞视频。'
  },
  {
    id: 'lunch_scout',
    title: '午休情报员',
    group: '雅加达支线',
    desc: '替赶午休的上班族雷扎摸清蜜雪排队人数，省下纠结时间。',
    hint: '和蜜雪西侧的上班族雷扎对话，进店看一眼排队人数再告诉他。'
  },
  {
    id: 'parts_pro',
    title: '金牌龙门吊手',
    group: '卡拉旺三一',
    desc: '在三一服务车间操控龙门吊稳稳卸下 A1、B2、C1 三箱重型备件并完成交接。',
    hint: '进入卡拉旺东侧服务车间，操控龙门吊卸货并完成东侧签收。'
  },
  {
    id: 'wan_lens',
    title: '万老师的搭档',
    group: '卡拉旺委托',
    desc: '拍齐主厂房、履带展机与交接记录板三张照，交回万老师归档。',
    hint: '在卡拉旺展机旁找万老师接下拍摄委托，拍齐三张照后回来交片。'
  },
  {
    id: 'dual_city',
    title: '双城足迹',
    group: '双城旅人',
    desc: '乘城际班车走遍雅加达老城街角与卡拉旺三一产业园。',
    hint: '按 M 或到候车牌乘班车，亲身造访雅加达与卡拉旺两座城市。'
  }
];

const BY_ID = new Map(ACHIEVEMENTS.map(a => [a.id, a]));
let popupQueue = [];
let popupShowing = false;
let popupTimer = null;

export function unlockedAchievements(session) {
  const list = session?.flags?.achievements;
  if (!Array.isArray(list)) return [];
  return list.filter(id => BY_ID.has(id));
}

export function syncAchievementHud(session) {
  const node = document.getElementById('ach-count');
  if (node) node.textContent = `${unlockedAchievements(session).length} / ${ACHIEVEMENTS.length}`;
}

function pumpAchievementToast() {
  const host = document.getElementById('ach-toast');
  if (!host) { popupQueue = []; popupShowing = false; return; }
  if (popupShowing || !popupQueue.length) return;
  const ach = popupQueue.shift();
  popupShowing = true;

  host.replaceChildren();
  const icon = el('img', 'ach-toast-icon');
  icon.src = trophyIcon;
  icon.alt = '';
  const body = el('div', 'ach-toast-body');
  body.append(
    el('small', '', '成就解锁'),
    el('strong', '', ach.title),
    el('span', '', ach.desc)
  );
  host.append(icon, body);
  host.hidden = false;
  host.classList.remove('show');
  void host.offsetWidth;
  host.classList.add('show');

  clearTimeout(popupTimer);
  popupTimer = window.setTimeout(() => {
    host.classList.remove('show');
    host.hidden = true;
    popupShowing = false;
    pumpAchievementToast();
  }, 3000);
}

export function clearAchievementPopups() {
  clearTimeout(popupTimer);
  popupQueue = [];
  popupShowing = false;
  const host = document.getElementById('ach-toast');
  if (host) {
    host.hidden = true;
    host.classList.remove('show');
  }
}

export function unlockAchievement(scene, id, {quietAudio = false} = {}) {
  const ach = BY_ID.get(id);
  const session = scene?.session || scene?.registry?.get?.('session');
  if (!ach || !session) return false;
  const current = unlockedAchievements(session);
  if (current.includes(id)) return false;

  session.flag('achievements', [...current, id]);
  session.addLog('解锁成就 · ' + ach.title);
  session.save();
  syncAchievementHud(session);
  if (quietAudio) sound.chime();
  else sound.achievement();
  popupQueue.push(ach);
  pumpAchievementToast();
  return true;
}

export function showAchievements(scene) {
  if (scene.overlay === 'achievements') { scene.closeOverlay(); return; }
  const unlocked = new Set(unlockedAchievements(scene.session));
  const box = openPanel(scene, `旅途成就 · ${unlocked.size} / ${ACHIEVEMENTS.length}`, 'achievements', trophyIcon);

  const barWrap = el('div', 'ach-progress-wrap');
  const bar = el('div', 'ach-progress-bar');
  const fill = el('div', 'ach-progress-fill');
  fill.style.width = `${Math.round((unlocked.size / ACHIEVEMENTS.length) * 100)}%`;
  bar.append(fill);
  barWrap.append(
    el('span', '', unlocked.size === ACHIEVEMENTS.length ? '全部 8 项爪哇双城成就已达成！' : `已点亮 ${unlocked.size} / ${ACHIEVEMENTS.length} 枚旅途徽章`),
    bar
  );
  box.append(barWrap);

  const grid = el('div', 'ach-grid');
  for (const ach of ACHIEVEMENTS) {
    const done = unlocked.has(ach.id);
    const card = el('div', 'ach-card ' + (done ? 'unlocked' : 'locked'));
    const head = el('div', 'ach-card-head');
    const ic = el('img', 'ach-card-icon');
    ic.src = trophyIcon;
    ic.alt = '';
    const titles = el('div');
    titles.append(
      el('small', '', `${ach.group} · ${done ? '☑ 已达成' : '☐ 未解锁'}`),
      el('strong', '', ach.title)
    );
    head.append(ic, titles);
    card.append(head, el('p', '', done ? ach.desc : `线索：${ach.hint}`));
    grid.append(card);
  }
  box.append(grid);
}
