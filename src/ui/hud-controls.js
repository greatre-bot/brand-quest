import {openPanel,el,actions} from './panel.js';
import {sound} from '../systems/audio.js';
import {getTouchPref,cycleTouchPref} from '../systems/touchControls.js';
import soundOnIcon from '../../assets/pixel/ui/sound-on.png';
import soundOffIcon from '../../assets/pixel/ui/sound-off.png';
import gearIcon from '../../assets/pixel/ui/gear.png';

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

export function settings(scene,refresh){
  const box=openPanel(scene,'设置','settings',gearIcon);
  const guideOn=scene.session.guide!==false;
  const padPref=getTouchPref();
  const padLabel={auto:'淡黄虚拟按键：自动（手机开启）',on:'淡黄虚拟按键：始终开启',off:'淡黄虚拟按键：已关闭'}[padPref];
  box.append(el('p','','可以按自己的节奏自由逛雅加达与卡拉旺两座城市，需要时也可以随时开关行程指引或手机虚拟按键。'));
  actions(box,[
    [guideOn?'隐藏下一步指引':'开启下一步指引',()=>{
      scene.session.guide=!guideOn;scene.session.save();refresh();settings(scene,refresh);
    }],
    [padLabel,()=>{
      cycleTouchPref();settings(scene,refresh);
    }],
    [sound.isMuted()?'开启音乐与音效':'静音（当前开启）',()=>{
      sound.toggleMute();syncAudioButton();settings(scene,refresh);
    }],
    ['返回主菜单',()=>{
      scene.closeOverlay();scene.scene.start('MenuScene');
    }]
  ]);
  box.append(el('p','kbd-guide','电脑：WASD/方向键 移动 · Shift 加速 · E 互动/骑车 · R 下车 · 空格 鸣笛 · F 拍照 · Tab 手账 · U 成就 · M 班车 · J 结局　｜　手机：使用屏幕淡黄色虚拟方向键与功能键畅玩'));
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
  try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
  catch{scene.toast('浏览器未进入全屏，可使用 F11 切换。');}
}
