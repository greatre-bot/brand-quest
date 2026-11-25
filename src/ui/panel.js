import Phaser from 'phaser';
import journalIcon from '../../assets/pixel/ui/journal.png';
import portraitWan from '../../assets/pixel/ui/portrait-wan.png';
import portraitPlayer from '../../assets/pixel/ui/portrait-player.png';
import portraitStudent from '../../assets/pixel/ui/portrait-student.png';
import portraitVendor from '../../assets/pixel/ui/portrait-vendor.png';
import portraitRider from '../../assets/pixel/ui/portrait-rider.png';
import portraitClerk from '../../assets/pixel/ui/portrait-clerk.png';
import portraitEngineer from '../../assets/pixel/ui/portrait-engineer.png';
import portraitGuide from '../../assets/pixel/ui/portrait-guide.png';
import portraitHijab from '../../assets/pixel/ui/portrait-hijab.png';
import portraitAuntie from '../../assets/pixel/ui/portrait-auntie.png';
import portraitOffice from '../../assets/pixel/ui/portrait-office.png';
import portraitBoss from '../../assets/pixel/ui/portrait-boss.png';
import portraitTech from '../../assets/pixel/ui/portrait-tech.png';
import {sound} from '../systems/audio.js';
import {syncTouchHud} from '../systems/touchControls.js';

export const PORTRAITS = {
  wan: portraitWan,
  documentarian: portraitWan,
  player: portraitPlayer,
  student: portraitStudent,
  customer: portraitOffice,
  vendor: portraitVendor,
  rider: portraitRider,
  clerk: portraitClerk,
  engineer: portraitEngineer,
  service_tech: portraitEngineer,
  guide: portraitGuide,
  hijab: portraitHijab,
  auntie: portraitAuntie,
  office: portraitOffice,
  boss: portraitBoss,
  tech: portraitTech
};

export const label=(scene,x,y,value,size=12,color='#263d37',extra={})=>scene.add.text(x,y,value,{fontFamily:'"FusionPixel",monospace',fontSize:size+'px',color,...extra});
export function el(tag,cls='',text='') {
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(text)node.textContent=text;
  return node;
}

export function openPanel(scene,title,kind='dialog',icon=journalIcon,isPortrait=false) {
  const hadOverlay=Boolean(scene.overlay);
  scene.closeOverlay();
  if(!hadOverlay){
    if(['journal','tasks','map','achievements'].includes(kind))sound.pageFlip();
    else sound.open();
  }
  const sheet=document.querySelector('#sheet');
  sheet.classList.remove('sdv-sheet');
  const box=el('div','dialog '+kind), head=el('header'), img=el('img',isPortrait?'portrait-img':'');
  img.src=icon;img.alt='';
  const heading=el('h2','',title);heading.id='panel-title';
  const exit=el('button','exit','Esc ×');exit.onclick=()=>{sound.close();scene.closeOverlay();};
  head.append(img,heading,exit);box.append(head);sheet.replaceChildren(box);sheet.hidden=false;
  scene.overlay=kind;
  syncTouchHud(scene);
  const scope=new AbortController();scene.panelScope=scope;
  sheet.addEventListener('keydown',event=>{
    if(event.key==='Tab' && document.activeElement!==document.body){
      const nodes=[...sheet.querySelectorAll('button:not(:disabled),[tabindex="0"]')];
      if(nodes.length){const idx=nodes.indexOf(document.activeElement);nodes[Phaser.Math.Wrap(idx+(event.shiftKey?-1:1),0,nodes.length)].focus();event.preventDefault();event.stopPropagation();}
    }
  },{signal:scope.signal});
  return box;
}

export function actions(box,items){
  const row=el('div','actions');
  for(const [label,fn] of items){const b=el('button','',label);b.onclick=fn;row.append(b);}
  box.append(row);
}

function shortSpeakerName(title){
  if(!title)return '旅行者';
  if(title.includes('·'))return title.split('·')[0].trim();
  return title.trim();
}

export function dialog(scene,title,lines,foot='',portraitKey='player',speakerName=null){
  const hadOverlay=Boolean(scene.overlay);
  scene.closeOverlay();
  if(!hadOverlay)sound.talk(portraitKey);

  const sheet=document.querySelector('#sheet');
  sheet.classList.add('sdv-sheet');

  const portraitUrl=PORTRAITS[portraitKey]||(typeof portraitKey==='string'&&portraitKey.includes('data:')||portraitKey?.endsWith?.('.png')?portraitKey:portraitPlayer);
  const badgeName=speakerName||shortSpeakerName(title);

  const box=el('div','sdv-dialog');
  box.setAttribute('aria-labelledby','panel-title');

  // Left parchment dialogue panel
  const textPane=el('div','sdv-text-pane');
  const metaText=foot||(title!==badgeName?title:'');
  if(metaText)textPane.append(el('div','sdv-meta',metaText));
  const body=el('div','sdv-lines');
  for(const line of lines)body.append(el('p','',line));
  textPane.append(body);

  const footerRow=el('div','actions sdv-actions');
  const closeFn=()=>{sound.close();scene.closeOverlay();};
  const nextBtn=el('button','sdv-next','继续 ▸');
  nextBtn.type='button';
  nextBtn.onclick=e=>{e.stopPropagation();closeFn();};
  const closeSquare=el('button','sdv-close-sq','×');
  closeSquare.type='button';
  closeSquare.title='关闭 [Esc]';
  closeSquare.onclick=e=>{e.stopPropagation();closeFn();};
  footerRow.append(nextBtn,closeSquare);
  textPane.append(footerRow);

  // Clicking the parchment text area also advances/closes comfortably
  textPane.addEventListener('click',()=>closeFn());

  // Right carved-wood portrait + scroll nameplate panel
  const portraitPane=el('div','sdv-portrait-pane');
  const frame=el('div','sdv-portrait-frame');
  const img=el('img','portrait-img');
  img.src=portraitUrl;
  img.alt=badgeName;
  frame.append(img);
  const pip=el('span','sdv-pip');
  const plate=el('div','sdv-nameplate');
  const heading=el('span','',badgeName);
  heading.id='panel-title';
  plate.append(heading);
  portraitPane.append(frame,pip,plate);

  box.append(textPane,portraitPane);
  sheet.replaceChildren(box);
  sheet.hidden=false;
  scene.overlay='dialog';
  syncTouchHud(scene);

  const scope=new AbortController();
  scene.panelScope=scope;
  window.addEventListener('keydown',event=>{
    if(event.repeat)return;
    if(event.key==='Enter'||event.key===' '){
      event.preventDefault();
      closeFn();
    }
  },{signal:scope.signal});
  return box;
}
