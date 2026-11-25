import {openPanel,el,actions} from './panel.js';
import {sound} from '../systems/audio.js';
import {getTouchPref,cycleTouchPref,isTouchEnabled} from '../systems/touchControls.js';
import {isWeChat,isIOS,isStandalonePwa,canNativeFullscreen} from '../systems/viewportFit.js';
import soundOnIcon from '../../assets/pixel/ui/sound-on.png';
import soundOffIcon from '../../assets/pixel/ui/sound-off.png';
import gearIcon from '../../assets/pixel/ui/gear.png';
import fullscreenIcon from '../../assets/pixel/ui/fullscreen.png';

export function syncAudioButton(){
  const btn=document.getElementById('audio-toggle');
  if(!btn)return;
  const muted=sound.isMuted();
  btn.dataset.muted=muted?'1':'0';
  let img=btn.querySelector('img');
  if(!img){img=document.createElement('img');img.className='hud-icon';img.alt='';btn.replaceChildren(img);}
  img.src=muted?soundOffIcon:soundOnIcon;
  btn.setAttribute('aria-label',muted?'开启声音':'静音');
  btn.title=muted?'声音已静音 [V]':'背景音乐与音效 [V]';
}

export function showMobileFullscreenHelp(scene){
  const box=openPanel(scene,'手机全屏与视野指引','fullscreen-help',fullscreenIcon);
  if(isWeChat()){
    box.append(
      el('p','','微信内置浏览器会固定占用顶部标题栏与底部导航栏，并禁用网页全屏接口。'),
      el('p','kbd-guide','推荐步骤：点击微信右上角「···」→ 选择「在默认浏览器中打开」（Safari 或 Chrome），视野立刻更大！')
    );
  }
  box.append(
    el('p','','iPhone Safari 两种全屏方式（系统限制了网页一键全屏）：'),
    el('p','kbd-guide','① 隐藏地址栏：点击 Safari 地址栏左侧图标 → 选择「隐藏工具栏」，马上放大画面。'),
    el('p','kbd-guide','② 真·无边框全屏（推荐）：点「分享」→「添加到主屏幕」，从桌面图标进入即 100% 无地址栏全屏！')
  );
  actions(box,[['知道了',()=>{sound.close();scene.closeOverlay();}]]);
}

export function settings(scene,refresh){
  const box=openPanel(scene,'设置','settings',gearIcon);
  const guideOn=scene.session.guide!==false;
  const padPref=getTouchPref();
  const padLabel={auto:'淡黄虚拟按键：自动（手机开启）',on:'淡黄虚拟按键：始终开启',off:'淡黄虚拟按键：已关闭'}[padPref];
  box.append(el('p','','可以按自己的节奏自由逛雅加达与卡拉旺两座城市，需要时也可以随时开关行程指引或手机虚拟按键。'));
  const btns=[
    [guideOn?'隐藏下一步指引':'开启下一步指引',()=>{
      scene.session.guide=!guideOn;scene.session.save();refresh();settings(scene,refresh);
    }],
    [padLabel,()=>{
      cycleTouchPref();settings(scene,refresh);
    }],
    [sound.isMuted()?'开启音乐与音效':'静音（当前开启）',()=>{
      sound.toggleMute();syncAudioButton();settings(scene,refresh);
    }]
  ];
  if(isTouchEnabled()&&(isWeChat()||isIOS())&&!isStandalonePwa()){
    btns.push(['手机全屏指引',()=>showMobileFullscreenHelp(scene)]);
  }
  btns.push(['返回主菜单',()=>{
    scene.closeOverlay();scene.scene.start('MenuScene');
  }]);
  actions(box,btns);
  box.append(el('p','kbd-guide',isTouchEnabled()
    ? '触屏操作：左下淡黄方向键移动，右下淡黄按键互动、加速、骑车鸣笛或拍照，快捷栏可随时查看手账、成就与城际班车。'
    : '电脑：WASD/方向键 移动 · Shift 加速 · E 互动/骑车 · R 下车 · 空格 鸣笛 · F 拍照 · Tab 手账 · U 成就 · M 班车 · J 结局　｜　手机：使用屏幕淡黄色虚拟方向键与功能键畅玩'));
  box.append(el('small','','进度、音量与虚拟按键偏好自动保存在本机，刷新网页即可接着逛。'));
}
export function signCredits(box){
  const details=el('details','details-credit'),text=el('div','','门头依据 Fikri RA 拍摄的 Kota Tua 门店照片（2023-01-25）纠正透视、减色并修整像素。照片及门牌改编图遵循 CC BY-SA 4.0，MIXUE、雪王和相关标识权利归品牌方。');
  const origin=el('a','','摄影原件'),license=el('a','','CC BY-SA 4.0');
  origin.href='https://commons.wikimedia.org/wiki/File:Mixue_Ice_Cream_%26_Tea_Kota_Tua.jpg';
  license.href='https://creativecommons.org/licenses/by-sa/4.0/';
  for(const a of [origin,license]){a.target='_blank';a.rel='noopener noreferrer';}
  details.append(el('summary','','门头图像来源与署名'),text,origin,' · ',license);box.append(details);
}
export async function fullscreen(scene){
  const fsEl=document.fullscreenElement||document.webkitFullscreenElement;
  if(fsEl){
    try{
      if(document.exitFullscreen)await document.exitFullscreen();
      else if(document.webkitExitFullscreen)await document.webkitExitFullscreen();
    }catch{ /* ignore */ }
    return;
  }
  if(isStandalonePwa()){
    scene.toast('当前已处于无边框全屏模式');
    return;
  }
  if(!canNativeFullscreen()&&(isWeChat()||isIOS()||isTouchEnabled())){
    showMobileFullscreenHelp(scene);
    return;
  }
  try{
    const root=document.documentElement;
    if(root.requestFullscreen)await root.requestFullscreen();
    else if(root.webkitRequestFullscreen)await root.webkitRequestFullscreen();
    if(isTouchEnabled())screen.orientation?.lock?.('landscape').catch(()=>{});
  }catch{
    if(isTouchEnabled())showMobileFullscreenHelp(scene);
    else scene.toast('浏览器未进入全屏，可使用 F11 切换。');
  }
}
