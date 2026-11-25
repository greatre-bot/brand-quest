import {el} from './panel.js';
import {BRAND_FACTS} from '../data/facts.js';
import {EVIDENCE_LABELS} from '../data/content.js';
import {STATION_EVIDENCE,STRATEGY_OPTIONS,assessEvidence,evaluateStrategy,resolveEnding} from '../data/ending.js';
import {ACHIEVEMENTS,unlockedAchievements} from '../systems/achievements.js';
import {sound} from '../systems/audio.js';
import journalIcon from '../../assets/pixel/ui/journal.png';
import trophyIcon from '../../assets/pixel/ui/trophy.png';
import mixueSignUrl from '../../assets/pixel/buildings/mixue-sign.png';

function photoCard(session, item) {
  const card = el('div', 'end-photo');
  const snap = session.snapshots?.[item.key];
  const taken = session.photos.includes(item.key);
  const fact = BRAND_FACTS[item.fact];
  if (taken && snap?.startsWith('data:image/jpeg;')) {
    const img = el('img');
    img.src = snap;
    img.alt = EVIDENCE_LABELS[item.key];
    card.append(img);
  } else if (taken) {
    card.append(el('div', 'end-photo-missing taken', '已收录影像'));
  } else {
    card.classList.add('missing');
    card.append(el('div', 'end-photo-missing', '未拍摄 · 待万老师任务'));
  }
  const meta = el('div', 'end-photo-meta');
  meta.append(
    el('strong', '', EVIDENCE_LABELS[item.key]),
    el('small', '', taken ? `参考 · ${fact.sources.join('/')}` : item.hint)
  );
  card.append(meta);
  return card;
}

function stationColumn(session, stationId, assessment) {
  const cfg = STATION_EVIDENCE[stationId];
  const col = el('article', 'end-station ' + stationId);
  const head = el('div', 'end-station-head');
  head.append(el('h3', '', cfg.title), el('span', 'end-role', cfg.role));

  let visual;
  if (stationId === 'jakarta') {
    visual = el('div', 'end-postcard');
    const pic = el('div', 'end-postcard-art');
    const img = el('img');
    img.src = mixueSignUrl;
    img.alt = '雅加达蜜雪冰城门头';
    pic.append(img);
    const notes = el('div', 'end-postcard-notes');
    for (const [k, v] of cfg.notes) {
      const row = el('div', 'end-note-item');
      row.append(el('strong', '', k), el('small', '', v));
      notes.append(row);
    }
    visual.append(pic, notes);
  } else {
    visual = el('div', 'end-photo-grid cols-' + cfg.photos.length);
    for (const item of cfg.photos) visual.append(photoCard(session, item));
  }

  const records = el('div', 'end-records');
  if (stationId === 'jakarta') {
    const orderOk = assessment.mixueDone;
    const drinkName = session.flags.last_drink || '蜜雪饮品';
    records.append(
      el('span', 'end-pill ' + (orderOk ? 'ok' : 'warn'), `${drinkName}：${orderOk ? '已交付' : '未完成'}`),
      el('span', 'end-pill ' + (assessment.clipDone ? 'ok' : 'muted'), `骑手取餐夹：${assessment.clipDone ? '已归还' : '未完成'}`)
    );
    if (assessment.queueCheckDone) records.append(el('span', 'end-pill ok', '午休排队问询：已告知'));
  } else {
    const svcOk = assessment.sanyDone;
    const smooth = session.flags.crane_smoothness;
    const svcLabel = svcOk ? (smooth ? `龙门吊卸货已签收（平稳 ${smooth}%）` : '龙门吊卸货已签收') : assessment.partsLoaded > 0 ? '已卸货待签收' : '待卸货';
    records.append(
      el('span', 'end-pill ' + (svcOk ? 'ok' : 'warn'), `重型备件：${svcLabel}`),
      el('span', 'end-pill ' + (assessment.fieldPair ? 'ok' : 'muted'), `万老师三照：${assessment.fieldPair ? '已归档' : `${assessment.photoCount}/3`}`)
    );
  }
  col.append(head, visual, records, el('p', 'end-takeaway', cfg.summary));
  return col;
}

export function mountEndingBoard(scene) {
  const viewport = document.getElementById('viewport');
  document.getElementById('ending-board')?.remove();
  document.getElementById('ending-epilogue')?.remove();

  const session = scene.registry.get('session');
  session.ensureMetrics();
  session.markMilestone('ending');
  session.save();

  const assessment = assessEvidence(session);
  const unlockedIds = unlockedAchievements(session);
  const root = el('section', 'ending-board');
  root.id = 'ending-board';
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', '出海日志旅程小结与终章结局');

  const panel = el('div', 'ending-shell');

  // Header
  const header = el('header', 'ending-head');
  const titleWrap = el('div', 'ending-title-wrap');
  const icon = el('img'); icon.src = journalIcon; icon.alt = '';
  const titles = el('div');
  titles.append(
    el('small', '', '出海日志 · BRAND QUEST · 雅加达 × 卡拉旺终章'),
    el('h2', '', '旅程小结与结局选择')
  );
  titleWrap.append(icon, titles);

  const badges = el('div', 'ending-badges');
  badges.append(
    el('span', 'end-status ' + assessment.level, assessment.badge),
    el('span', 'end-stat', `万老师摄影 ${assessment.photoCount} / ${assessment.totalPhotos}`),
    el('span', 'end-stat ach', `旅途成就 ${unlockedIds.length} / ${ACHIEVEMENTS.length}`)
  );
  header.append(titleWrap, badges);

  const lead = el('p', 'ending-lead ' + assessment.level, assessment.headline);

  // Row 1: Two-city travelogue cards side by side
  const wall = el('div', 'ending-wall');
  wall.append(
    stationColumn(session, 'jakarta', assessment),
    stationColumn(session, 'karawang', assessment)
  );

  // Row 2: Overseas Strategy Choice -> determines final ending!
  const stratSection = el('section', 'ending-m4');
  const stratHead = el('div', 'm4-head');
  stratHead.append(
    el('strong', '', '出海策略选择（决定你的终章结局）'),
    el('span', '', '预算有限时，要把重工设备在印尼新片区的客户信任做起来，你会优先投入哪条路径？（按 1 / 2 / 3 对比并生成结局）')
  );

  const optionRow = el('div', 'm4-options');
  const feedback = el('div', 'm4-feedback');
  const optionButtons = new Map();
  let epilogueRoot = null;
  let currentChoice = session.flags.strategy_choice || null;

  const epilogueBtn = el('button', 'end-primary end-finale-btn', '查看本趟旅程结局 ▸');
  epilogueBtn.type = 'button';
  epilogueBtn.id = 'ending-epilogue-btn';

  function renderChoice(choiceId, playAudio = false) {
    currentChoice = choiceId;
    if (choiceId) {
      session.flag('strategy_choice', choiceId);
      session.save();
      if (playAudio) sound.chime();
    }
    for (const [id, btn] of optionButtons.entries()) {
      const active = id === choiceId;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    }
    epilogueBtn.disabled = !choiceId && assessment.level !== 'insufficient';
    feedback.replaceChildren();
    const res = evaluateStrategy(choiceId, session, assessment);
    if (!res) {
      feedback.append(el('p', 'm4-placeholder', '点击上方任一方案（可随时切换比较），选定后即可点击右下角「查看本趟旅程结局」观看日落返程终章。'));
      return;
    }
    const cols = el('div', 'm4-result-grid');
    const mk = (label, text, cls) => {
      const box = el('div', 'm4-box ' + cls);
      box.append(el('b', '', label), el('p', '', text));
      return box;
    };
    cols.append(
      mk('预期收益', res.gain, 'gain'),
      mk('代价与风险', res.risk, 'risk'),
      mk('本趟行程印证', res.evidenceNote, 'm4-proof')
    );
    feedback.append(cols);
  }

  for (const opt of STRATEGY_OPTIONS) {
    const btn = el('button', 'm4-btn');
    btn.type = 'button';
    btn.dataset.choice = opt.id;
    btn.append(
      el('div', 'm4-btn-top', `${opt.code} [${opt.key}] · ${opt.tag}`),
      el('strong', '', opt.title),
      el('small', '', opt.pitch)
    );
    btn.addEventListener('click', () => {
      renderChoice(opt.id, true);
      btn.blur();
    });
    optionButtons.set(opt.id, btn);
    optionRow.append(btn);
  }

  stratSection.append(stratHead, optionRow, feedback);
  renderChoice(currentChoice, false);

  function showEpilogue() {
    const ending = resolveEnding(currentChoice, session, assessment);
    sound.chime();
    root.hidden = true;
    epilogueRoot?.remove();

    const stage = el('section', 'epilogue-stage');
    stage.id = 'ending-epilogue';
    stage.setAttribute('role', 'region');
    stage.setAttribute('aria-label', ending.title);

    const card = el('div', 'epilogue-card tier-' + ending.tier);
    const head = el('div', 'epilogue-head');
    const badgeWrap = el('div', 'epilogue-title-group');
    badgeWrap.append(
      el('small', '', `出海日志 · BRAND QUEST · ${ending.code}`),
      el('h2', '', ending.title)
    );
    const stamp = el('span', 'epilogue-stamp', ending.stamp);
    head.append(badgeWrap, stamp);

    const story = el('div', 'epilogue-story');
    for (const para of ending.paragraphs) story.append(el('p', '', para));

    // Achievement showcase strip on the finale postcard
    const achBox = el('div', 'epilogue-achs');
    const achHead = el('div', 'epilogue-ach-head');
    const tic = el('img'); tic.src = trophyIcon; tic.alt = '';
    achHead.append(tic, el('strong', '', `本趟解锁成就：${unlockedIds.length} / ${ACHIEVEMENTS.length}`));
    const tags = el('div', 'epilogue-ach-tags');
    if (unlockedIds.length) {
      for (const id of unlockedIds) {
        const meta = ACHIEVEMENTS.find(a => a.id === id);
        if (meta) tags.append(el('span', 'epilogue-ach-tag', '☑ ' + meta.title));
      }
    } else {
      tags.append(el('span', 'epilogue-ach-empty', '尚未解锁徽章——回爪哇岛骑电动车、帮街坊或拍完园区照即可点亮！'));
    }
    achBox.append(achHead, tags);

    const row = el('div', 'epilogue-actions');
    const backBoard = el('button', 'end-secondary', '返回策略对照');
    backBoard.type = 'button';
    backBoard.addEventListener('click', () => {
      sound.open();
      stage.remove();
      epilogueRoot = null;
      root.hidden = false;
    });
    const backMap = el('button', 'end-secondary', '回爪哇岛继续逛 [Esc]');
    backMap.type = 'button';
    backMap.addEventListener('click', () => { sound.close(); scene.returnToWorld(); });
    const newTrip = el('button', 'end-primary', '开启新旅程 [Enter]');
    newTrip.type = 'button';
    newTrip.addEventListener('click', () => { sound.open(); scene.restartFresh(); });
    row.append(backBoard, backMap, newTrip);

    card.append(head, story, achBox, row);
    stage.append(card);
    viewport.append(stage);
    epilogueRoot = stage;
  }

  epilogueBtn.addEventListener('click', showEpilogue);

  // Footer actions
  const footer = el('footer', 'ending-foot');
  const note = el('small', 'ending-disclaimer', '汇集你在雅加达老城街角与卡拉旺三一产业园两地的亲身体验与现场照片 · 含 4 种具名终章结局。');
  const btns = el('div', 'ending-actions');

  const backWorld = () => {
    sound.close();
    scene.returnToWorld();
  };
  const backBtn = el('button', 'end-secondary', assessment.level === 'insufficient' ? '返回补逛行程 [Esc]' : '返回继续逛逛 [Esc]');
  backBtn.type = 'button';
  backBtn.id = 'ending-return';
  backBtn.addEventListener('click', backWorld);

  const restartBtn = el('button', 'end-secondary', '重新开始 [Enter]');
  restartBtn.type = 'button';
  restartBtn.id = 'ending-restart';
  restartBtn.addEventListener('click', () => {
    sound.open();
    scene.restartFresh();
  });

  btns.append(backBtn, restartBtn, epilogueBtn);
  footer.append(note, btns);

  panel.append(header, lead, wall, stratSection, footer);
  root.append(panel);
  viewport.append(root);

  const scope = new AbortController();
  window.addEventListener('keydown', e => {
    if (e.repeat) return;
    if (epilogueRoot) {
      if (e.key === 'Escape') { e.preventDefault(); backWorld(); }
      else if (e.key === 'Enter') { e.preventDefault(); scene.restartFresh(); }
      return;
    }
    if (e.key === '1') { e.preventDefault(); renderChoice('visibility', true); }
    else if (e.key === '2') { e.preventDefault(); renderChoice('proof', true); }
    else if (e.key === '3') { e.preventDefault(); renderChoice('dual_track', true); }
    else if (e.key === 'Escape') { e.preventDefault(); backWorld(); }
    else if (e.key === 'Enter') {
      const tag = document.activeElement?.tagName;
      if (tag === 'BUTTON' && document.activeElement !== restartBtn) return;
      e.preventDefault();
      scene.restartFresh();
    }
  }, {signal: scope.signal});

  return () => {
    scope.abort();
    root.remove();
    epilogueRoot?.remove();
  };
}
