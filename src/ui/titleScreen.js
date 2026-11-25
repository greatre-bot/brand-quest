import {el} from './panel.js';
import {sound} from '../systems/audio.js';
import compassIcon from '../../assets/pixel/ui/compass.png';
import atlasIcon from '../../assets/pixel/ui/atlas.png';

const placeNames = {
  jakarta: '雅加达街区',
  mixue_shop: '蜜雪冰城门店',
  karawang: '卡拉旺三一产业园',
  sany_workshop: '三一服务车间'
};

export function mountTitleScreen(scene, savedSession) {
  const viewport = document.getElementById('viewport');
  document.getElementById('title-screen')?.remove();
  viewport.classList.add('title-mode');

  const root = el('section', 'title-screen');
  root.id = 'title-screen';
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', '出海日志主菜单');

  const card = el('div', 'title-card');

  const badge = el('div', 'title-badge');
  const icon = el('img'); icon.src = compassIcon; icon.alt = '';
  badge.append(icon, el('span', '', '印度尼西亚 · 双城像素漫游'));

  const h1 = el('h1', '', '出海日志：BRAND QUEST');
  const sub = el('p', 'title-sub', '飞往印度尼西亚爪哇岛，自由选择先去雅加达街角的蜜雪冰城，还是先逛西爪哇卡拉旺的三一产业园。在街头点单、车间配货与沿途交谈里，亲眼看看两个中国品牌在海外的真实日常。');

  const preview = el('div', 'title-preview');
  const mapImg = el('img', 'title-avatar'); mapImg.src = atlasIcon; mapImg.alt = '双城行程';
  const note = el('div');
  note.append(
    el('strong', '', '自由双城行程：雅加达蜜雪街区  ⇄  卡拉旺三一产业园'),
    el('small', '', '开场动画后任选第一站 · 随时乘城际班车往返 · 进度自动保存')
  );
  preview.append(mapImg, note);

  const actions = el('div', 'title-actions');
  const hasResume = Boolean(savedSession && (savedSession.has('intro_done') || savedSession.photos.length > 0 || savedSession.has('first_stop')));

  const startBtn = (label, cls, attr, handler) => {
    const b = el('button', cls, label);
    b.type = 'button';
    b.dataset.start = attr;
    b.addEventListener('click', () => {
      sound.unlock();
      sound.open();
      handler();
    });
    return b;
  };

  let primaryAction = null;
  if (hasResume) {
    const where = placeNames[savedSession.world] || '雅加达街区';
    const resume = startBtn(
      `继续上次旅程 · ${where} [Enter]`,
      'title-btn primary',
      'resume',
      () => scene.launch('resume')
    );
    primaryAction = () => scene.launch('resume');
    actions.append(
      resume,
      startBtn('重新开始新旅程', 'title-btn secondary', 'new', () => scene.launch('new'))
    );
  } else {
    const go = startBtn('开始旅程 [Enter]', 'title-btn primary', 'new', () => scene.launch('new'));
    primaryAction = () => scene.launch('new');
    actions.append(go);
  }

  const controls = el('div', 'title-keys', 'WASD / 方向键移动　Shift 加速　E 互动/骑电动车　R 下车　空格 鸣笛　Tab 手账　U 成就　M 班车　J 结局');
  card.append(badge, h1, sub, preview, actions, controls);
  root.append(card);
  viewport.append(root);

  const scope = new AbortController();
  window.addEventListener('keydown', e => {
    if (e.repeat) return;
    if (e.key === 'Enter' || e.key === ' ') {
      if (document.activeElement?.tagName === 'BUTTON') return;
      e.preventDefault();
      sound.unlock();
      sound.open();
      primaryAction();
    }
  }, {signal: scope.signal});

  return () => {
    scope.abort();
    root.remove();
    viewport.classList.remove('title-mode');
  };
}
