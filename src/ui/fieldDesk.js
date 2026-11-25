import {serviceHint,docket} from '../systems/service.js';
import {settings,fullscreen,signCredits,syncAudioButton} from './hud-controls.js';
import {el,openPanel,actions} from './panel.js';
import {EVIDENCE_LABELS,WAN_PHOTO_KEYS} from '../data/content.js';
import {BRAND_FACTS} from '../data/facts.js';
import {WORLDS} from '../data/worlds.js';
import {sound} from '../systems/audio.js';
import {adaptTouchText} from '../systems/touchControls.js';
import {syncAchievementHud,unlockedAchievements,ACHIEVEMENTS} from '../systems/achievements.js';
import atlasIcon from '../../assets/pixel/ui/atlas.png';

const byId=id=>document.getElementById(id);
const places={jakarta:['雅加达街区','Jakarta','雅加达','街区漫步'],mixue_shop:['蜜雪冰城门店','Mixue','雅加达','门店体验'],karawang:['三一产业园','Karawang','卡拉旺','园区漫步'],sany_workshop:['服务车间','Workshop','卡拉旺','车间现场']};

export function miniMap(scene){
  const canvas=byId('minimap');if(!canvas)return;
  const ctx=canvas.getContext('2d'),w=scene.world;
  const sx=canvas.width/w.mapW,sy=canvas.height/w.mapH;
  const rect=(x,y,a,b,color)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x*sx),Math.round(y*sy),Math.max(1,Math.round(a*sx)),Math.max(1,Math.round(b*sy)));};
  ctx.fillStyle='#d9d8ad';ctx.fillRect(0,0,260,89);
  if(w.map){
    const colors=['#e0d4af','#b2b4a0','#a7bd8d','#e5dabb','#e0d4af','#b2b4a0'];
    w.map.layers[0].data.forEach((n,i)=>rect(i%w.map.width*32,Math.floor(i/w.map.width)*32,33,33,colors[n-1]));
    for(const p of w.map.layers[1].objects){
      const tree=['shade-tree','palm','planter'].includes(p.name);
      rect(p.x,p.y+p.height*.35,p.width,p.height*.65,tree?'#789a72':'#b9a686');
    }
  }else{
    if(w.mode==='factory')rect(0,605,w.mapW,235,'#b2b4a0');
    for(const b of w.buildings)rect(b.x,b.y,b.w,b.h,'#97a08f');
  }
  const canPhoto=scene.session.has('field_start');
  for(const p of w.interactables){
    if(p.kind==='evidence'&&!canPhoto)continue;
    const x=p.x*sx,y=p.y*sy;ctx.fillStyle='#5c775a';ctx.beginPath();ctx.moveTo(x,y-3);ctx.lineTo(x+3,y);ctx.lineTo(x,y+3);ctx.lineTo(x-3,y);ctx.fill();
  }
  const x=Math.round(scene.player.x*sx),y=Math.round(scene.player.y*sy);
  ctx.fillStyle='#fff7d7';ctx.fillRect(x-3,y-3,7,7);ctx.fillStyle='#b95e40';ctx.fillRect(x-2,y-2,5,5);
}

function mission(type,title,description,steps){
  const node=el('div','mission');node.append(el('small','',type),el('h3','',title),el('p','',description));
  if(steps){const ul=el('ul','steps');for(const [line,done] of steps){const li=el('li',done?'done':'');li.append(el('i'),line);ul.append(li);}node.append(ul);}
  return node;
}
export function refreshDesk(scene){
  const s=scene.session;
  const wanCount=s.photos.filter(k=>WAN_PHOTO_KEYS.includes(k)).length;
  const hasPhotoQuest=s.has('field_start');
  byId('place').textContent=places[scene.worldId][0];
  byId('photo-count').textContent=wanCount+' / 3';
  const photoBtn=byId('photo-btn'),photoPill=byId('photo-pill');
  if(photoBtn)photoBtn.hidden=!hasPhotoQuest;
  if(photoPill)photoPill.hidden=!hasPhotoQuest;
  syncAchievementHud(s);
  const goals={
    jakarta:s.has('mixue_order')?(s.has('sany_service')?'两站都逛完啦，按 J 进入终章结局':'去东南候车处搭车前往卡拉旺（或按 M）'):'走进蜜雪门店，体验当一回午高峰店员',
    mixue_shop:s.has('mixue_order')?'从南侧门垫回到雅加达街区（也可继续在吧台再练一轮套餐）':'在左柜台前按 E 体验蜜雪套餐调配',
    karawang:!s.has('field_start')?'去展机旁找万老师聊聊 [E]，接下现场拍摄任务':!s.has('sany_service')?'沿路按 F 拍下厂房与展机，再进东侧服务车间':!s.has('field_pair')?(wanCount>=3?'三张现场照已拍齐，找展机旁的万老师交片 [E]':'按 F 补齐万老师要的三张园区现场照'):(s.has('mixue_order')?'两站都逛完啦，按 J 进入终章结局':'去西南候车牌搭车前往雅加达（或按 M）'),
    sany_workshop:s.has('sany_service')&&(!s.has('field_start')||s.photos.includes('sany_service_record'))?(s.done?'可从南侧回园区找万老师，或按 J 进入终章结局':'从南侧离开车间，搭车前往雅加达'):serviceHint(s)
  };
  byId('objective').textContent=adaptTouchText(s.done&&(!s.has('field_start')||s.has('field_pair'))?'按 J 进入旅程结局与策略选择':s.guide!==false?goals[scene.worldId]:'自由逛逛 · 按 Tab 翻开旅行手账');
}
export function missionContent(scene){
  const s=scene.session,city=['jakarta','mixue_shop'].includes(scene.worldId);
  if(city){
    const first=mission('雅加达主线','蜜雪午高峰店员体验',s.has('mixue_order')?`${s.flags.last_drink||'蜜雪套餐'}已经完成。逛完街区后按 M 可乘班车前往卡拉旺三一产业园。`:'走进红招牌的蜜雪门店，在左柜台体验店员视角，根据顾客小票调配饮品加冰调糖并搭配甜筒圣代。',[
      ['进店完成一轮 3 单套餐调配',s.has('mixue_order')]
    ]);
    const extra=mission('街区支线','雪王共舞短视频',s.has('dance_video_done')?`已帮菲娜拍下《甜蜜蜜》共舞视频（最佳高光 ${s.flags.dance_hits||0}/4），随时还能找她重拍。`:'蜜雪门口有雪王人偶在跳舞，旁边的姑娘菲娜想请你接过手机，帮她拍一段《甜蜜蜜》共舞短视频。');
    const queueSide=mission('街区支线','雷扎的午休排队',s.has('queue_check_done')?'已告诉雷扎柜台前排着三个人。':s.has('queue_check_start')&&s.has('queue_counted')?'已经看到店内排着三个人，回去告诉蜜雪西侧的雷扎吧。':s.has('queue_check_start')?'进蜜雪门店看一眼柜台前的排队人数，再回来告诉雷扎。':'蜜雪西侧的上班族雷扎在犹豫午休时间够不够排队。');
    return [first,extra,queueSide];
  }
  const wanQuest=mission('万老师的委托','园区三张现场照',s.has('field_pair')?'三张现场照已交给万老师归档。':s.has('field_start')?'帮万老师拍齐主厂房、室外履带展机和车间东侧交接板三张照片，拍完回来找他。':'主厂房东侧背斜挎包的万老师正在找人帮忙拍照，过去按 E 聊聊吧。',[
    ['拍下园区主厂房 [F]',s.photos.includes('sany_sign')],
    ['拍下室外履带展机 [F]',s.photos.includes('sany_machine')],
    ['拍下车间交接记录板 [F]',s.photos.includes('sany_service_record')]
  ]);
  const partsQuest=mission('卡拉旺主线','车间龙门吊卸货','前往东侧服务车间，在西侧控制台操控三一龙门吊将货车上的 A1、B2、C1 三箱重型备件稳稳卸入对应货位，再到东侧找协调员签收。',[
    ['操控龙门吊卸下三箱备件',s.has('service_parts')||s.has('sany_service')],
    ['前往东侧黄色交接区签收',s.has('sany_service')]
  ]);
  return [wanQuest,partsQuest];
}
export function bindDesk(scene){
  const ctrl=new AbortController();scene.events.once('shutdown',()=>{ctrl.abort();byId('interaction').hidden=true;scene.closeOverlay();});
  for(const b of document.querySelectorAll('[data-action]')){
    b.addEventListener('click',()=>{
      const a=b.dataset.action;
      if(a==='tasks'){const box=openPanel(scene,'旅程委托','tasks');box.append(...missionContent(scene));}
      if(a==='settings')settings(scene,()=>refreshDesk(scene));
      if(a==='map')scene.showMap();
      if(a==='journal')scene.showJournal();
      if(a==='achievements')scene.showAchievements();
      if(a==='interact')scene.tryInteract();
      if(a==='photo')scene.tryPhoto();
      b.blur();
    },{signal:ctrl.signal});
  }
  byId('fullscreen').addEventListener('click',()=>fullscreen(scene),{signal:ctrl.signal});
  const audioBtn=byId('audio-toggle');
  if(audioBtn){
    audioBtn.addEventListener('click',()=>{sound.toggleMute();syncAudioButton();audioBtn.blur();},{signal:ctrl.signal});
    syncAudioButton();
  }
  const fsLabel=()=>byId('fullscreen').setAttribute('aria-label',document.fullscreenElement?'退出全屏':'进入全屏');
  document.addEventListener('fullscreenchange',fsLabel,{signal:ctrl.signal});fsLabel();
  scene.input.keyboard.on('keydown-G',ev=>{if(!ev.repeat)fullscreen(scene);});
  scene.input.keyboard.on('keydown-H',ev=>{if(!ev.repeat&&!scene.overlay)byId('viewport').classList.toggle('hud-off');});
  scene.input.keyboard.on('keydown-V',ev=>{if(!ev.repeat&&!scene.overlay){sound.toggleMute();syncAudioButton();scene.toast(sound.isMuted()?'已静音 [V]':'已开启音乐与音效 [V]');}});
  byId('viewport').classList.remove('ending','hud-off');
  refreshDesk(scene);
}
export function showJournal(scene){
  if(scene.overlay==='journal'){scene.closeOverlay();return;}
  const box=openPanel(scene,'旅行手账','journal');
  const wanPhotos=scene.session.photos.filter(k=>WAN_PHOTO_KEYS.includes(k));
  box.append(el('p','',`万老师拍摄任务　${wanPhotos.length} / 3`));
  if(!scene.session.has('field_start')){
    box.append(el('p','','前往卡拉旺三一产业园找万老师聊聊，即可接下园区三张现场照的拍摄委托。'));
  }else if(!wanPhotos.length){
    box.append(el('p','','已接下万老师的拍摄任务：在卡拉旺园区与服务车间走到菱形标记 ◆ 旁按 F 拍照。'));
  }
  for(const id of wanPhotos){
    const spot=Object.values(WORLDS).flatMap(w=>w.interactables).find(o=>o.key===id);
    if(!spot)continue;
    const row=el('div','evidence'),image=scene.session.snapshots[id];
    if(image?.startsWith('data:image/jpeg;')){const img=el('img');img.src=image;img.alt=EVIDENCE_LABELS[id];row.append(img);}
    const fact=BRAND_FACTS[spot.fact],cap=el('div');cap.append(el('b','',EVIDENCE_LABELS[id]),el('small','','背景参考 · '+fact.sources.join(' / ')),el('small','',fact.text));row.append(cap);box.append(row);
  }
  if(scene.session.snapshots?.dance_video?.startsWith('data:image/jpeg;')){
    const row=el('div','evidence');
    const img=el('img');img.src=scene.session.snapshots.dance_video;img.alt='菲娜与雪王共舞视频定格';
    const cap=el('div');cap.append(el('b','','菲娜与雪王 · 《甜蜜蜜》共舞'),el('small','',`雅加达蜜雪门口 · 最佳高光抓拍 ${scene.session.flags.dance_hits||0} / 4`));
    row.append(img,cap);box.append(row);
  }
  box.append(el('p','',`行程记录　${scene.session.flags.last_drink||'蜜雪饮品'} ${scene.session.has('mixue_order')?'☑':'☐'}　K-07 备件 ${scene.session.has('sany_service')?'☑':'☐'}　雪王合拍 ${scene.session.has('dance_video_done')?'☑':'☐'}　排队问询 ${scene.session.has('queue_check_done')?'☑':'☐'}`));
  box.append(el('p','',`旅途成就　${unlockedAchievements(scene.session).length} / ${ACHIEVEMENTS.length}（按 U 查看全部徽章）`));
  if(scene.session.has('service_ticket'))docket(box,scene.session);
  if(scene.session.has('field_pair'))box.append(el('p','','万老师批注　☑ 三张园区现场照已归档，前场展示与后场记录已成对照。'));
  signCredits(box);
  const btns=[['旅途成就 [U]',()=>scene.showAchievements()]];
  if(scene.session.done)btns.unshift(['进入旅程结局 [J]',()=>scene.endCase()]);
  else if(scene.session.has('mixue_order')||scene.session.has('sany_service')||wanPhotos.length>0){
    btns.unshift(['先看旅程小结（部分行程未完）',()=>scene.endCase()]);
  }
  actions(box,btns);
}
export function showMap(scene){
  if(scene.overlay==='map'){scene.closeOverlay();return;}
  const box=openPanel(scene,'城际班车','map',atlasIcon);
  const chart=el('canvas','map-preview');chart.width=260;chart.height=89;chart.id='minimap';box.append(chart);miniMap(scene);
  box.append(el('p','','雅加达街区　⇄　卡拉旺三一产业园'),el('p','','两城分处市区与工业园，可乘城际班车随时往返。请选择到达站点，下车后可自由步行。'));
  actions(box,[['乘车到雅加达',()=>scene.travel({to:'jakarta'})],['乘车到卡拉旺',()=>scene.travel({to:'karawang'})]]);
}
