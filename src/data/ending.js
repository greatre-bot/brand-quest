import {BRAND_FACTS} from './facts.js';
import {EVIDENCE_LABELS,WAN_PHOTO_KEYS} from './content.js';
import {loadCount} from '../systems/service.js';

export const STATION_EVIDENCE = {
  jakarta: {
    title: '旅行手账 · 雅加达蜜雪冰城篇',
    role: '街头消费品牌见闻',
    photos: [],
    notes: [
      ['醒目门头与定位', '红底白字招牌和门口雪王大甜筒隔街就能认出，不少人顺手约在门口碰头。'],
      ['价格与排队博弈', '甜筒 8,000 盾、冰鲜柠檬水 10,000 盾，波霸圣代、草莓果茶与黑糖珍珠奶茶也都在两万盾以内；午高峰一排长队，顾客也会权衡甜度与等待时间。']
    ],
    summary: '见闻小结：B2C 卖亲切感，靠显眼符号、雪王标识与低试错成本迅速拉客；但排队时长、甜度本地化与稳定出杯，才决定顾客下次还会不会再来。'
  },
  karawang: {
    title: '旅行手账 · 卡拉旺三一重工篇',
    role: '工业园区与万老师拍摄委托',
    photos: [
      {key: 'sany_sign', fact: 'sany_indonesia_park', hint: '接万老师任务后在主厂房前按 F 拍'},
      {key: 'sany_machine', fact: 'sany_indonesia_park', hint: '接万老师任务后在履带展机前按 F 拍'},
      {key: 'sany_service_record', fact: 'brand_logic_sany', hint: '接万老师任务后在车间交接板前按 F 拍'}
    ],
    summary: '见闻小结：B2B 卖确定性，把承诺开到现场。厂房与真机让工程客户驻足，但备件响应、本地技师培训与可核查的交接记录，才是赢得长期托付的硬证据。'
  }
};

export const STRATEGY_OPTIONS = [
  {
    id: 'visibility',
    key: '1',
    code: '方案 A',
    title: '照搬消费品 IP 与流量曝光',
    tag: '符号型路径 · 易犯跨行业形式误植',
    pitch: '预算优先投入卡通形象、短视频挑战赛与户外大牌拉高曝光，想靠播放量和热度打开工业市场。',
    gain: '短期声量与品牌记忆度起得较快，初次接触时能降低陌生感。',
    risk: '属于跨行业形式误植：重型设备决策链长、停机代价高，若缺少可核查的服务与备件证据，高曝光很难转化为大额采购与长期信任。'
  },
  {
    id: 'proof',
    key: '2',
    code: '方案 B',
    title: '把承诺开到现场：做实服务与证言档',
    tag: '证据型路径 · 钱花在证言资产上',
    pitch: '预算优先投入本地备件库、技师培训与可核查的交付/维保证言档案，让客户看清故障找谁、配件在哪、如何兑现。',
    gain: '直击工地最怕停机的核心风险，沉淀出经得起采购、工程师与设备管理者核验的长期信任资产。',
    risk: '前期网点与证言采编投入较重，短期声量不如广告直观；对外沟通也必须守住证据边界，避免过度承诺。'
  },
  {
    id: 'dual_track',
    key: '3',
    code: '方案 C',
    title: '只借机制不抄形式：实景 + 可查履约',
    tag: '标准化能力 + 本地化表达',
    pitch: '借鉴消费品“统一标识 + 标准化落地”机制而不抄娱乐化形式：前场开放园区与实机，后场沉淀透明备件与客户证言档案。',
    gain: '既用统一标识与本土实景降低识别成本，又用可核查的服务记录回应停机焦虑，让前场认知与后场兑现互相印证。',
    risk: '跨部门协同与证言分级管理要求高；一旦前端宣传跑在后端兑现前面，就容易产生“传播—兑现落差”，反而损耗信任。'
  }
];

export function assessEvidence(session) {
  const photos = (session?.photos || []).filter(k => WAN_PHOTO_KEYS.includes(k));
  const hasPhoto = k => photos.includes(k);
  const karawangPhotos = STATION_EVIDENCE.karawang.photos.filter(p => hasPhoto(p.key));
  const missingPhotos = STATION_EVIDENCE.karawang.photos.filter(p => !hasPhoto(p.key)).map(p => EVIDENCE_LABELS[p.key]);
  const mixueDone = Boolean(session?.has('mixue_order'));
  const sanyDone = Boolean(session?.has('sany_service'));
  const bothTasks = mixueDone && sanyDone;
  const sideDone = [session?.has('dance_video_done'), session?.has('field_pair'), session?.has('queue_check_done')].filter(Boolean).length;

  let level = 'basic';
  let badge = '双城主线完成';
  let headline = '雅加达与卡拉旺两站体验都已完成；如还没帮万老师拍齐三张园区照，随时可按 Esc 回去补拍。';

  if (!bothTasks) {
    level = 'insufficient';
    badge = '行程未全 · 阶段小结';
    const gaps = [];
    if (!mixueDone) gaps.push('雅加达蜜雪制饮体验');
    if (!sanyDone) gaps.push('卡拉旺 K-07 备件核对');
    if (karawangPhotos.length === 0) gaps.push('万老师的园区现场照');
    headline = `目前还缺少${gaps.join('、')}，可以先看看阶段对照，也可以随时按 Esc 返回地图继续逛。`;
  } else if (karawangPhotos.length === WAN_PHOTO_KEYS.length) {
    level = 'complete';
    badge = (session?.has('field_pair') && sideDone >= 2) ? '双城见闻完备' : '两城记录齐备';
    headline = sideDone > 0
      ? '雅加达街角体验、卡拉旺 K-07 备件核对与万老师三张现场照都已收齐，可以把两条品牌信任路径放在同一页慢慢对照。'
      : '两站核心体验与万老师的三张园区现场照均已收齐，可据此对比街头消费与重工设备建立信任的不同前提。';
  }

  return {
    level, badge, headline,
    photoCount: karawangPhotos.length,
    totalPhotos: WAN_PHOTO_KEYS.length,
    karawangPhotos, missingPhotos,
    mixueDone, sanyDone, bothTasks,
    danceDone: Boolean(session?.has('dance_video_done')),
    queueCheckDone: Boolean(session?.has('queue_check_done')),
    fieldPair: Boolean(session?.has('field_pair')),
    partsLoaded: session ? loadCount(session) : 0
  };
}

export function evaluateStrategy(choiceId, session, assessment) {
  const opt = STRATEGY_OPTIONS.find(o => o.id === choiceId);
  if (!opt) return null;
  const has = k => Boolean(session?.photos?.includes(k));
  const lines = [];

  if (choiceId === 'visibility') {
    if (assessment.mixueDone && has('sany_sign')) {
      lines.push('你逛过雅加达街角的红招牌门店，也帮万老师拍下了三一主厂房：高辨识度能帮街头饮品迅速拉客，但在重工领域往往只是叩门砖。');
    } else if (assessment.mixueDone) {
      lines.push('从雅加达街角的体验能看出招牌很能吸睛；若再到卡拉旺拍下三一主厂房，前后场反差会更直观。');
    } else {
      lines.push('建议先去雅加达蜜雪街角走一圈，亲自对比街头高曝光和工业采购决策的差异。');
    }
    if (assessment.sanyDone) {
      lines.push('结合你亲手核对过的 K-07 备件流程，也能直观感受到招牌之后还有漫长的履约链条。');
    }
  } else if (choiceId === 'proof') {
    if (assessment.sanyDone && has('sany_service_record')) {
      lines.push('你既走完了 K-07 备件核对，又帮万老师拍下了车间交接记录板，支撑这条路径的现场依据非常扎实。');
    } else if (assessment.sanyDone) {
      lines.push('你已经完成 K-07 备件核对，若帮万老师补拍车间东侧交接板，记录会更完整。');
    } else {
      lines.push('还没进卡拉旺车间体验 K-07 备件核对，建议先走一遍流程再掂量后端投入的重量。');
    }
    if (assessment.fieldPair) {
      lines.push('万老师归档的三张对照照，也正好点出了“大机器”与“小记录单”之间的关系。');
    }
  } else {
    const hasFront = has('sany_sign') || has('sany_machine');
    const hasBack = has('sany_service_record') || assessment.sanyDone;
    if (hasFront && hasBack && assessment.mixueDone) {
      lines.push('园区厂房、履带展机、车间交接记录与雅加达街角体验都已齐备，足以支撑双轨策略的利弊权衡。');
    } else if (!hasFront) {
      lines.push('双轨策略讲究前后场互相印证，目前还缺卡拉旺室外厂房或展机的现场照（找万老师可接任务）。');
    } else if (!hasBack) {
      lines.push('室外厂房或展机已记录，但车间 K-07 备件与交接记录尚未补齐，后端兑现依据还不够满。');
    } else {
      lines.push('卡拉旺前后场记录已较齐，逛完雅加达蜜雪街区后两城对照会更完整。');
    }
  }

  if (assessment.level === 'insufficient') {
    lines.push('提示：当前行程尚未全部走完，以上点评可先作参考，随时可按 Esc 返回补逛。');
  }

  return {
    ...opt,
    evidenceNote: lines.join(' '),
    factsCited: ['M003', 'M004', 'S002', 'S005', 'S006', 'R001', 'R002']
      .filter(src => Object.values(BRAND_FACTS).some(f => f.sources.includes(src)))
  };
}

export function resolveEnding(choiceId, session, assessment) {
  const chosen = choiceId || 'dual_track';
  const rode = Boolean(session?.has('ridden_scooter'));
  const rideNote = rode
    ? '回想起骑着路边小电驴穿过雅加达老城与卡拉旺林荫道的风声，两个品牌的日常比任何宣传册都更鲜活。'
    : '穿过雅加达老城的人潮与卡拉旺园区的宽阔厂道，两个品牌的海外日常比任何宣传册都更鲜活。';

  if (assessment.level === 'insufficient') {
    return {
      code: '阶段分支',
      tier: 'partial',
      title: '《未完待续：中途返航》',
      stamp: '中途返航',
      paragraphs: [
        '返程的航班在爪哇海的晚霞里起飞。手账里已经记下了这一趟亲眼所见的片段，不过雅加达与卡拉旺之间还有几处现场故事没来得及走完。',
        `${rideNote} 你随时可以返回爪哇岛，补逛另一座城市、帮街坊搭把手，或者去卡拉旺找万老师拍齐三张现场照，解锁完整结局。`
      ]
    };
  }

  const trueReady = assessment.bothTasks && assessment.fieldPair && assessment.danceDone && assessment.queueCheckDone && (chosen === 'dual_track' || chosen === 'proof');
  if (trueReady) {
    return {
      code: '真结局 · 01',
      tier: 'true',
      title: '《双城全通：实干与烟火》',
      stamp: '双城真结局',
      paragraphs: [
        '夕阳沉入爪哇海，你合上写满批注的旅行手账。一页留着雅加达老城午高峰的红招牌、酸甜冰鲜柠檬水与雪王门口合拍的烟火气，另一页贴着万老师归档的卡拉旺主厂房、履带展机与工整的 K-07 备件交接板。',
        `${rideNote} 你已经亲手验证了两条截然不同的出海路：B2C 卖亲切感，靠显眼符号、低试错成本与稳定体验留客；B2B 卖确定性，靠实机底气与可核查的现场履约赢得托付。`
      ]
    };
  }

  if (chosen === 'visibility') {
    return {
      code: '结局 · 02',
      tier: 'normal',
      title: '《先声夺人：红招牌的回响》',
      stamp: '曝光先导',
      paragraphs: [
        '热闹的视觉形象、短视频传播和主干道户外大牌很快打响了名头，路过的工程车队迅速记住了品牌名字，初次登门拜访也顺畅了许多。',
        '但真坐下来谈设备采购时，承包商们依然把问题绕回了同一个原点：机器在工地上停了，配件库离多远、技师多久能到？光搬来消费品的曝光形式，还换不来 B2B 的确定性——你把这句追问划了横线，留作下一阶段补强证据链的起点。'
      ]
    };
  }

  if (chosen === 'proof') {
    return {
      code: '结局 · 03',
      tier: 'normal',
      title: '《稳扎稳打：车间里的信任》',
      stamp: '服务筑基',
      paragraphs: [
        '预算没有铺向热闹的街头灯箱与流量投放，而是把承诺开到现场，沉进了本地备件货架、实训技师与可核查的交接证言档案里。起初声量并不张扬，但第一批在工地上经历过急件响应与维护的老板，开始把这家服务车间介绍给同行。',
        `${rideNote} 在重型设备的世界里，一张核对无误的交接单，往往比十块户外大牌更能留住长久合作。`
      ]
    };
  }

  return {
    code: '结局 · 04',
    tier: 'normal',
    title: '《双轨并行：眼见为实》',
    stamp: '双轨平衡',
    paragraphs: [
      '你们没有照搬消费品的娱乐化形式，而是借用“统一标识 + 标准化本地落地”的底层机制：卡拉旺园区敞开大门迎接访客近距离看厂房、看真机，东侧服务车间也把备件核对与本地实训记录摆上了台面。前场辨识度与后场履约能力同步推进，让客户既看得见实力，也查得到保障。',
      `${rideNote} 这趟往返双城的印尼见闻告一段落，而关于出海品牌信任的思考还在继续。`
    ]
  };
}
