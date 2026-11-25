import {el,dialog} from '../ui/panel.js';
import {sound} from './audio.js';
import {unlockAchievement} from './achievements.js';
import {openUnloadGame} from './unload.js';

const parts={A1:{name:'密封件箱',code:'A1'},B2:{name:'滤芯箱',code:'B2'},C1:{name:'液压阀箱',code:'C1'}};
const slots=['A1','B2'];
const loaded=(s,slot)=>s.has('service_parts')||s.has('picked_'+slot);
export function loadCount(s){return slots.filter(slot=>loaded(s,slot)).length;}
export function serviceHint(s){
  if(s.has('sany_service'))return s.has('field_start')&&!s.photos.includes('sany_service_record')?'K-07 已卸货签收，顺手按 F 拍下东侧交接板给万老师':'K-07 已卸货签收，可从南侧离开车间（也可再玩龙门吊卸货）';
  if(s.has('service_parts')||loadCount(s)===2)return '3 件重型备件已卸货入位，去东侧黄色交接区找服务协调员签收';
  return '去西侧龙门吊控制台按 E，操控行车卸载货车备件';
}
export function docket(box,s){
  const ticket=el('div','service-ticket');
  ticket.append(el('small','','KARAWANG   /   重型备件卸货单 K-07'));
  for(const slot of Object.keys(parts)){
    const part=parts[slot],row=el('div','ticket-line');
    const done=s.has('service_parts')||s.has('sany_service');
    row.append(el('strong','',part.code),el('span','',part.name),el('b','',done?'已卸货入位':'待吊装 ×1'));ticket.append(row);
  }
  box.append(ticket);
}
export function takeTicket(scene){
  openUnloadGame(scene);
}
export function pickFromRack(scene,slot){
  const s=scene.session;
  if(!parts[slot]){
    sound.open();
    dialog(scene,`货架 ${slot} · 耗材区`,['这里堆放着条码标签纸和打包带。西侧送货车刚到，去西侧龙门吊控制台按 E 即可操控行车把 A1、B2、C1 三箱重型备件卸货入位。'],'车间货位','tech','瓦尤');
    return;
  }
  const done=s.has('service_parts')||s.has('sany_service');
  sound.open();
  dialog(scene,`货位 ${slot} · ${parts[slot].name}`,[
    done
      ? `${slot} ${parts[slot].name}已由三一龙门吊平稳落位，外箱封条和编号都核对无误。`
      : `当前 ${slot} 货位空置待收货。请先到西侧龙门吊控制台按 E，把货车上的 ${slot} ${parts[slot].name} 稳稳吊放到对应货位。`
  ],'车间货位','tech','瓦尤');
}
export function handOver(scene){
  const s=scene.session;
  if(s.has('sany_service')){
    dialog(scene,'服务协调员',['K-07 三件备件已完成卸货签收并转入待配送区，记录贴在东侧交接板上。想再练手的话，西侧龙门吊随时可以再去操作。'],'备件交接 · K-07','engineer','服务协调员');
    return;
  }
  if(!s.has('service_parts')){
    dialog(scene,'服务协调员',['这边是东侧交接区。送货平板车刚进车间，先去西侧龙门吊控制台按 E 把 A1、B2、C1 三箱重型备件卸货入位，再过来签收。'],'备件交接 · K-07','engineer','服务协调员');
    return;
  }
  scene.finishTask('sany_service');
}
export function fieldAssignment(scene){
  const s=scene.session;
  if(s.has('field_pair')){
    dialog(scene,'万老师 · 现场影像记录者',['这三张放在一起对照挺有意思。剩下的判断，等你翻开旅行手账自己整理吧。'],'卡拉旺三一产业园','wan','万老师');
    return;
  }
  const targets=[['sany_sign','主厂房外立面'],['sany_machine','室外履带展机'],['sany_service_record','车间东侧交接板']];
  const missing=targets.filter(([id])=>!s.photos.includes(id));
  if(!s.has('field_start')){
    s.flag('field_start');
    sound.pickup();
    scene.refreshEvidenceBadges?.();
    scene.record('从万老师手里接过备用相机，接下现场拍摄任务');
    if(missing.length){
      dialog(scene,'万老师 · 现场影像记录者',[
        '你也是来逛园区的？正好，我一个人跑不过来，包里这台备用相机先借你用。',
        '帮我拍三张现场对照照：主厂房外立面、室外履带展机，还有服务车间东侧的交接记录板。走到标记旁按 F 拍齐回来，我给你看个有意思的对比。'
      ],'获得「备用相机」 · 底部已解锁「拍照 F」','wan','万老师');
      return;
    }
  }
  if(missing.length){
    dialog(scene,'万老师 · 现场影像记录者',[
      '还差这几张：'+missing.map(x=>x[1]).join('、')+'。走到菱形标记旁按 F 拍完回来找我就行。'
    ],'万老师的拍摄任务 · 卡拉旺','wan','万老师');
    return;
  }
  s.flag('field_pair');sound.chime();scene.record('将三张园区现场照交给万老师归档');
  unlockAchievement(scene,'wan_lens');
  dialog(scene,'万老师 · 现场影像记录者',['三张都拍齐了。你发现了吗？镜头里最显眼的是厂房和大机器，但客户真正关心的，可能是车间里那张不起眼的交接记录单。'],'拍摄任务完成','wan','万老师');
}
