import signUrl from '../../assets/pixel/buildings/mixue-sign.png';
import Phaser from 'phaser';
import {WORLDS} from '../data/worlds.js';
import {BRAND_FACTS} from '../data/facts.js';
import {EVIDENCE_LABELS,TASKS} from '../data/content.js';
import {drawDistrict,face} from '../render/district.js';
import {takeTicket,pickFromRack,handOver,fieldAssignment,loadCount} from '../systems/service.js';
import {resolveNpcLines} from '../systems/npcState.js';
import {bindDesk,refreshDesk,showMap,showJournal} from '../ui/fieldDesk.js';
import {playOpeningCutscene,renderOnboardingBar} from '../ui/introCutscene.js';
import {label,dialog} from '../ui/panel.js';
import {openOrder,MIXUE_MENU_SECTIONS} from '../systems/order.js';
import {sound} from '../systems/audio.js';
import {initVehicles,vehicleBlocked,mountVehicle,dismountVehicle,honkScooter,updateRiding,updateVehicleParticles} from '../systems/vehicle.js';
import {unlockAchievement,showAchievements,clearAchievementPopups} from '../systems/achievements.js';
import {touchInput,setTouchSceneMode,syncTouchHud,resetTouchInput,isTouchEnabled,adaptTouchText} from '../systems/touchControls.js';
import {getViewMetrics} from '../systems/viewportFit.js';

const actorTexture={guide:'vendor',documentarian:'wan',service_tech:'engineer',customer:'office'};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const regionOf=id=>['jakarta','mixue_shop'].includes(id)?'jakarta':'karawang';

export class WorldScene extends Phaser.Scene{
  constructor(){super('WorldScene');}
  init({world='jakarta',spawn,transit=null,intro=false,fromMinigame=false,mixueResult=null}={}){
    this.worldId=world;this.spawn=spawn;this.transit=transit;this.shouldIntro=Boolean(intro);
    this.fromMinigame=Boolean(fromMinigame);this.mixueResult=mixueResult;
    this.overlay=null;this.panelScope=null;this.near=null;this.hintKey='';
    this.photoPoseUntil=0;this.evidenceBadges=new Map();this.vehicles=[];this.riding=null;
  }
  create(){
    this.session=this.registry.get('session');this.world=WORLDS[this.worldId];
    this.session.move(this.worldId);
    if(this.worldId==='mixue_shop')this.session.flag('queue_counted');
    drawDistrict(this);
    initVehicles(this);
    this.items=this.world.interactables;
    const solids=this.world.solids||this.world.buildings||[];
    const badgeDepthOf=item=>{
      if(item.id.endsWith('_exit'))return -50;
      let hit=null,best=40;
      for(const b of solids){
        if(item.x>=b.x-10&&item.x<=b.x+b.w+10){
          const bot=b.y+b.h,gap=item.y-bot;
          if(gap>=-6&&gap<best){best=gap;hit=bot;}
        }
      }
      return hit!==null?hit+0.5:item.y-4;
    };
    for(const item of this.items){
      if(item.kind==='inspect')continue;
      const photographed=item.kind==='evidence'&&this.session.photos.includes(item.key);
      const symbol=photographed?'☑':{door:'↧',transport:'↔',evidence:'◆',minigame:'!',rack:'▤'}[item.kind];
      const bg=item.kind==='evidence'?(photographed?'#5c7c57':'#916940'):'#47644e';
      const by=item.id.endsWith('_exit')?item.y+4:item.y-18;
      const badge=label(this,item.x,by,symbol,12,'#fff3c9',{backgroundColor:bg,padding:{x:3,y:1}}).setOrigin(.5,1).setDepth(badgeDepthOf(item));
      if(item.kind==='evidence'){
        badge.setVisible(this.session.has('field_start'));
        this.evidenceBadges.set(item.key,badge);
      }
    }
    this.npcs=this.world.npcs.map((n,i)=>{
      const initFacing=n.facing??0;
      const tex=n.sprite||actorTexture[n.id]||n.id;
      const sprite=this.add.sprite(n.x,n.y,tex,initFacing*3).setOrigin(.5,.94).setDepth(n.y);
      sprite.facing=initFacing;
      const bubble=label(this,n.x,n.y-38,'...',12,'#462714',{backgroundColor:'#fff0c9',padding:{x:3,y:0}}).setOrigin(.5,1).setDepth(n.y+1);
      if(n.queue)bubble.setVisible(false);
      return {...n,kind:'npc',spriteKey:tex,sprite,bubble,elapsed:i*1.2};
    });
    const spawn=this.spawn||this.world.start;
    this.player=this.add.sprite(spawn.x,spawn.y,'player',0).setOrigin(.5,.94).setDepth(spawn.y);
    this.trolley=this.worldId==='sany_workshop'?this.add.image(spawn.x,spawn.y,'handcart').setOrigin(.5,1).setVisible(false):null;
    const camera=this.cameras.main;
    const fitCameraBounds=()=>{
      const vw=getViewMetrics(this).w;
      if(this.world.mapW>=vw){
        camera.setBounds(0,0,this.world.mapW,this.world.mapH);
      }else{
        const pad=Math.ceil((vw-this.world.mapW)/2);
        camera.setBackgroundColor(this.worldId==='mixue_shop'?'#2b1e16':'#1c2529');
        camera.setBounds(-pad,0,this.world.mapW+pad*2,this.world.mapH);
      }
    };
    fitCameraBounds();
    camera.centerOn(spawn.x,spawn.y);
    camera.startFollow(this.player,true,.16,.16,0,16);camera.roundPixels=true;
    this.events.on('bq-resize',fitCameraBounds);
    if(this.transit?.intercity){
      camera.fadeIn(180,22,39,31);
      this.showTransitBanner(this.transit.from,this.worldId);
    }else if(this.transit?.door){
      camera.fadeIn(100,22,39,31);
    }
    this.key=this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SHIFT');
    const handlers={E:()=>this.tryInteract(),F:()=>this.tryPhoto(),TAB:()=>this.showJournal(),M:()=>this.showMap(),U:()=>this.showAchievements(),ESC:()=>this.closeOverlay(),J:()=>{if(this.session.done&&!this.overlay)this.endCase();}};
    for(const [key,action] of Object.entries(handlers))this.input.keyboard.on('keydown-'+key,e=>{sound.unlock();if(this.overlay==='intro')return;if(!e.repeat){e.preventDefault();action();}});
    this.input.keyboard.on('keydown-R',e=>{
      if(this.overlay||e.repeat)return;
      e.preventDefault();sound.unlock();
      if(this.riding)dismountVehicle(this);
      else{
        const v=this.vehicles.find(item=>item.parked&&distance(this.player,item)<52);
        if(v)mountVehicle(this,v);
      }
    });
    this.input.keyboard.on('keydown-SPACE',e=>{
      if(this.overlay||!this.riding||e.repeat)return;
      e.preventDefault();sound.unlock();
      honkScooter(this);
    });
    this.input.keyboard.on('keydown',()=>sound.unlock());
    this.input.on('pointerdown',()=>sound.unlock());
    this.input.keyboard.addCapture('TAB');
    sound.setWorld(this.worldId,{restart:!this.fromMinigame});
    setTouchSceneMode('world',this);
    this.events.once('shutdown',()=>{
      resetTouchInput();
      const tb=document.getElementById('transit-banner');
      if(tb)tb.hidden=true;
      const tut=document.getElementById('tutorial-bar');
      if(tut)tut.hidden=true;
    });
    bindDesk(this);this.session.save();this.updateHint();syncTouchHud(this);
    if(this.session.visited.includes('jakarta')&&this.session.visited.includes('karawang')){
      unlockAchievement(this,'dual_city',{quietAudio:true});
    }
    if((this.shouldIntro||!this.session.has('intro_done'))&&(this.worldId==='jakarta'||this.worldId==='karawang')){
      playOpeningCutscene(this,()=>{refreshDesk(this);renderOnboardingBar(this);this.updateHint();});
    }else{
      renderOnboardingBar(this);
    }
    if(this.mixueResult){
      const {avg,firstDone}=this.mixueResult;
      const labelText=`3 单套餐体验（好评 ${avg}%）`;
      if(firstDone){
        this.finishTask('mixue_order',labelText);
      }else{
        sound.chime();
        this.record(`又完成一轮蜜雪套餐班次（好评 ${avg}%）`);
        dialog(this,`午高峰收工 · 好评 ${avg}%`,[
          '谢谢你帮忙做好，味道挺地道的。',
          `这一轮 3 份顾客套餐平均好评 ${avg}%，想挑战满分随时欢迎再来吧台帮忙！`
        ],'莉娜 · 取餐台店员','clerk','莉娜');
      }
    }
  }
  refreshEvidenceBadges(){
    const show=this.session.has('field_start');
    for(const [key,badge] of this.evidenceBadges.entries()){
      badge.setVisible(show);
      if(this.session.photos.includes(key))badge.setText('☑').setBackgroundColor('#5c7c57');
    }
    this.near=null;
    this.updateHint();
  }
  showTransitBanner(_fromId,toId){
    const banner=document.getElementById('transit-banner');
    if(!banner)return;
    const tut=document.getElementById('tutorial-bar');
    if(tut)tut.hidden=true;
    const toKarawang=regionOf(toId)==='karawang';
    const route=toKarawang?'雅加达街区  →  卡拉旺 KIM 产业园':'卡拉旺 KIM 产业园  →  雅加达街区';
    banner.innerHTML='';
    const title=document.createElement('strong');title.textContent='城际班车 · '+route;
    const sub=document.createElement('small');sub.textContent=toKarawang?'已抵达西爪哇卡拉旺 KIM 产业园':'已回到雅加达老城街区';
    banner.append(title,sub);
    banner.hidden=false;
    this.transitTimer?.remove();
    this.transitTimer=this.time.delayedCall(2200,()=>{banner.hidden=true;renderOnboardingBar(this);});
  }
  update(time,delta){
    if(!this.player)return;
    if(this.overlay){
      const bucket=['order','service'].includes(this.overlay)?'minigame':'panel';
      this.session.tick(this.worldId,delta,bucket);
      return;
    }
    const k=this.key;
    const kbDx=Number(k.D.isDown||k.RIGHT.isDown)-Number(k.A.isDown||k.LEFT.isDown);
    const kbDy=Number(k.S.isDown||k.DOWN.isDown)-Number(k.W.isDown||k.UP.isDown);
    const dx=Phaser.Math.Clamp(kbDx+touchInput.dx,-1,1);
    const dy=Phaser.Math.Clamp(kbDy+touchInput.dy,-1,1);
    const sprinting=k.SHIFT.isDown||touchInput.shift;
    const moving=dx!==0||dy!==0;
    this.session.tick(this.worldId,delta,moving?'move':'idle');
    const p=this.player;
    if(this.riding){
      if(moving)this.photoPoseUntil=0;
      updateRiding(this,time,delta,dx,dy,sprinting);
    }else{
      if(moving){
        this.photoPoseUntil=0;
        sound.step(this.world.mode==='interior',sprinting);
      }
      const step=Math.min(55,delta)/1000*(sprinting?215:138)/(Math.hypot(dx,dy)||1);
      const l=this.world.limits||{left:12,right:this.world.mapW-12,top:18,bottom:this.world.mapH-6};
      const x=Phaser.Math.Clamp(p.x+dx*step,l.left,l.right),y=Phaser.Math.Clamp(p.y+dy*step,l.top,l.bottom);
      if(!this.blocked(x,p.y))p.x=x;
      if(!this.blocked(p.x,y))p.y=y;
      if(time>=this.photoPoseUntil)face(p,dx,dy,time);
      p.setDepth(p.y);
    }
    updateVehicleParticles(this,delta);
    for(const n of this.npcs){
      if(n.patrol?.length){
        n.elapsed+=Math.min(delta,80)/1000;
        const [a,b]=n.patrol,phase=n.elapsed%10,t=Phaser.Math.Clamp(phase<5?(phase-1)/3:(9-phase)/3,0,1);
        const px=Math.round(Phaser.Math.Linear(a.x,b.x,t)),py=Math.round(Phaser.Math.Linear(a.y,b.y,t));
        const walking=phase>1&&phase<4||phase>6&&phase<9,dir=phase<5?1:-1;
        face(n.sprite,walking?(b.x-a.x)*dir:0,walking?(b.y-a.y)*dir:0,time);
        n.sprite.setPosition(px,py).setDepth(py);n.bubble.setPosition(px,py-38).setDepth(py+1);
        n.bubble.setVisible(!walking||distance(n.sprite,p)<55);
      }else{
        const near=distance(n.sprite,p)<58;
        n.bubble.setVisible(n.queue?this.near===n:true);
        if(!near && n.facing!=null)n.sprite.setFrame(n.facing*3);
      }
    }
    if(this.trolley)this.trolley.setVisible(loadCount(this.session)>0&&!this.session.has('sany_service')).setPosition(p.x+18,p.y+4).setDepth(p.y+4);
    this.updateHint();
  }
  blocked(x,y){
    const solids=this.world.solids||this.world.buildings;
    return solids.some(b=>x+5>b.x&&x-5<b.x+b.w&&y+2>b.y&&y-2<b.y+b.h)||vehicleBlocked(this,x,y);
  }
  nearest(cameraOnly=false){
    let chosen=null,best=this.world.map?(cameraOnly?68:49):85;
    const canPhoto=this.session.has('field_start');
    const parkedVehs=(!cameraOnly&&!this.riding)?(this.vehicles||[]).filter(v=>v.parked):[];
    const targets=cameraOnly
      ? (canPhoto?this.items.filter(n=>n.kind==='evidence'):[])
      : [...this.items.filter(n=>n.kind!=='evidence'||canPhoto),...this.npcs,...parkedVehs];
    for(const target of targets){
      const d=distance(this.player,target.sprite||target);
      if(d<best){best=d;chosen=target;}
    }
    return chosen;
  }
  updateHint(){
    const n=this.nearest(),out=document.getElementById('interaction');
    const touch=isTouchEnabled();
    let text='';
    if(this.riding){
      text=touch
        ? (n?'靠近：'+(n.label||n.name)+'　·　右侧可「鸣笛」「下车」':'骑行中　·　右侧可「鸣笛」「下车」')
        : (n
          ? (n.kind==='evidence'?'[ F ]　':'[ E ]　')+(n.label||n.name)+'　·　[ R ] 下车　·　[ 空格 ] 鸣笛'
          : '[ R / E ] 停放电动车　·　[ 空格 ] 鸣笛　·　Shift 加速');
    }else if(n){
      text=touch
        ? ((n.kind==='evidence'?'可拍摄：':'靠近：')+(n.label||n.name))
        : ((n.kind==='evidence'?'[ F ]　':'[ E ]　')+(n.label||n.name));
    }
    const key=(this.riding?'1:':'0:')+(touch?'T:':'K:')+text;
    if(this.near===n&&this.hintKey===key)return;
    this.near=n;this.hintKey=key;out.hidden=!text;
    if(text)out.textContent=text;
    syncTouchHud(this);
  }
  tryInteract(){
    if(this.overlay)return;
    const n=this.nearest();
    if(!n){
      if(this.riding){dismountVehicle(this);return;}
      this.toast('走近门口、人物、电动车或摊位再互动');return;
    }
    if(n.kind==='vehicle'){mountVehicle(this,n);return;}
    if(n.kind==='door'||n.kind==='transport'){
      if(this.riding)dismountVehicle(this,{forDoor:true});
      this.travel(n);return;
    }
    if(n.id==='rider'){
      const {state,lines}=resolveNpcLines(n,this.session);
      if(state==='ready'){
        this.session.flag('clip_done');this.record('已把取餐夹交还里安');sound.chime();
        unlockAchievement(this,'rider_helper');
      }else if(state==='idle'){
        this.session.flag('clip_start');this.record('帮骑手里安寻找取餐夹');
      }
      dialog(this,n.name,lines,'街区支线','rider','里安');return;
    }
    if(n.id==='street_office'){
      const vx=this.player.x-n.sprite.x,vy=this.player.y-n.sprite.y;
      const turnDir=Math.abs(vx)>Math.abs(vy)?(vx<0?1:2):(vy<0?3:0);
      n.sprite.facing=turnDir;n.sprite.setFrame(turnDir*3);
      const {state,lines}=resolveNpcLines(n,this.session);
      if(state==='idle'){
        this.session.flag('queue_check_start');this.record('帮雷扎留意蜜雪排队人数');
      }else if(state==='ready'){
        this.session.flag('queue_check_done');this.record('告知雷扎蜜雪柜台前排着三人');sound.chime();
        unlockAchievement(this,'lunch_scout');
      }
      dialog(this,n.name,lines,'街区支线','office','雷扎');return;
    }
    if(n.id==='clip'&&this.session.has('clip_start')&&!this.session.has('clip_found')){
      this.session.flag('clip_found');this.record('在咖啡摊找到蓝色取餐夹');sound.pickup();
      dialog(this,n.label,['你从粉笔槽里拿起蓝色取餐夹，过马路还给南侧等单的骑手里安吧。'],'街区支线','player','旅行者');return;
    }
    if(n.id==='documentarian'){fieldAssignment(this);return;}
    if(n.kind==='rack'){pickFromRack(this,n.slot);return;}
    if(n.id==='service_tech'){handOver(this);return;}
    if(n.kind==='npc'){
      const vx=this.player.x-n.sprite.x,vy=this.player.y-n.sprite.y;
      const turnDir=Math.abs(vx)>Math.abs(vy)?(vx<0?1:2):(vy<0?3:0);
      n.sprite.facing=turnDir;n.sprite.setFrame(turnDir*3);
      const {state,lines}=resolveNpcLines(n,this.session);
      if(n.id==='clerk'&&state==='idle'){this.session.flag('clerk_met');this.session.save();}
      dialog(this,n.name,lines,'',n.portrait||n.spriteKey||n.id);return;
    }
    if(n.kind==='evidence'){
      const fact=BRAND_FACTS[n.fact];
      dialog(this,n.label,[fact.text,'按 F 为万老师的拍摄任务拍下当前画面。'],'现场拍摄点 · '+fact.sources.join(' / '),'player','旅行者');
      return;
    }
    if(n.kind==='inspect'){
      dialog(this,n.label,[n.text],'现场观察','player','旅行者');
      if(n.id==='mixue_sign'){const img=document.createElement('img');img.className='sign-inspect';img.alt='Kota Tua 门头 · 雪王及 MIXUE 字标';img.src=signUrl;document.querySelector('#sheet .actions')?.before(img);}
      if(n.id==='mixue_menu'){
        const board=document.createElement('div');board.className='mixue-menu-board';
        for(const sec of MIXUE_MENU_SECTIONS){
          const col=document.createElement('div');col.className='mixue-menu-col';
          const h=document.createElement('h4');h.textContent=sec.title;col.append(h);
          for(const [name,price] of sec.items){
            const row=document.createElement('div');row.className='mixue-menu-row';
            const s1=document.createElement('span');s1.textContent=name;
            const s2=document.createElement('b');s2.textContent=price;
            row.append(s1,s2);col.append(row);
          }
          board.append(col);
        }
        document.querySelector('#sheet .actions')?.before(board);
      }
      return;
    }
    if(n.kind==='minigame'){
      if(n.task==='mixue_order'){
        this.closeOverlay();
        this.scene.start('MixueBarScene',{returnSpawn:{x:Math.round(this.player.x),y:Math.round(this.player.y)}});
        return;
      }
      takeTicket(this);
    }
  }
  playPhotoAction(target,frame){
    const p=this.player;
    const vx=target.x-p.x,vy=target.y-p.y;
    p.facing=Math.abs(vx)>Math.abs(vy)?(vx<0?1:2):(vy<0?3:0);
    p.setFrame(p.facing*3);
    this.photoPoseUntil=this.time.now+320;
    const camIcon=this.add.image(p.x,p.y-42,'camera').setOrigin(.5,1).setScale(.72).setDepth(p.y+25);
    this.tweens.add({targets:camIcon,y:p.y-52,alpha:0,duration:480,ease:'Quad.easeOut',onComplete:()=>camIcon.destroy()});
    const [fx,fy,fw,fh]=frame;
    const vf=this.add.graphics().setDepth(999);
    const arm=14;
    vf.lineStyle(2,0xfff0b8,0.95);
    vf.strokeRect(fx+2,fy+2,fw-4,fh-4);
    vf.lineStyle(3,0xe3a84a,1);
    const corners=[[fx,fy,1,1],[fx+fw,fy,-1,1],[fx,fy+fh,1,-1],[fx+fw,fy+fh,-1,-1]];
    for(const [cx,cy,sx,sy] of corners){
      vf.beginPath().moveTo(cx,cy+sy*arm).lineTo(cx,cy).lineTo(cx+sx*arm,cy).strokePath();
    }
    this.tweens.add({targets:vf,alpha:0,duration:440,ease:'Sine.easeOut',onComplete:()=>vf.destroy()});
  }
  tryPhoto(){
    if(this.overlay)return;
    if(!this.session.has('field_start'))return;
    const n=this.nearest(true);if(!n){this.toast('走到卡拉旺园区或车间里的菱形标记 ◆ 旁再按 F 拍照');return;}
    if(this.session.photos.includes(n.key)){this.toast('这张照片已拍好并收入手账');return;}
    const camera=this.cameras.main,canvas=this.game.canvas,photo=document.createElement('canvas');
    photo.width=200;photo.height=114;
    const frame=n.photoFrame||[n.x-100,n.y-100,200,114];
    const [left,top,w,h]=frame;
    const x=Phaser.Math.Clamp(left-camera.scrollX,0,this.scale.width-w),y=Phaser.Math.Clamp(top-camera.scrollY,0,this.scale.height-h);
    photo.getContext('2d').drawImage(canvas,Math.round(x),Math.round(y),w,h,0,0,200,114);
    this.session.photo(n.key,photo.toDataURL('image/jpeg',.75));this.record('为万老师拍下 · '+EVIDENCE_LABELS[n.key]);
    const badge=this.evidenceBadges.get(n.key);
    if(badge){badge.setText('☑').setBackgroundColor('#5c7c57');}
    this.playPhotoAction(n,frame);
    sound.unlock();
    sound.shutter();
    camera.flash(150,255,244,210);
    const leftCount=3-this.session.photos.filter(k=>['sany_sign','sany_machine','sany_service_record'].includes(k)).length;
    this.toast(leftCount>0?`已拍下「${EVIDENCE_LABELS[n.key]}」· 还差 ${leftCount} 张交给万老师`:'三张现场照都拍齐啦！回卡拉旺展机旁找万老师看看吧');
  }
  finishTask(key,drinkName='冰鲜柠檬水'){
    this.session.flag(key);
    this.record(key==='mixue_order'?`完成${drinkName}交付`:TASKS[key].log);
    sound.chime();
    unlockAchievement(this,key==='mixue_order'?'lemon_master':'parts_pro');
    dialog(this,key==='mixue_order'?`交付完成 · ${drinkName}`:'核对签收 · K-07 备件',[TASKS[key].conclusion,this.session.done?'雅加达与卡拉旺两站主线都完成啦！合上对话按 J 即可进入终章结局与策略选择。':'这一站记录已写入旅行手账，按 M 可以乘班车前往另一站。'],'旅行手账',key==='mixue_order'?'clerk':'engineer',key==='mixue_order'?'莉娜':'服务协调员');
  }
  record(message){this.session.addLog(message);this.session.save();refreshDesk(this);renderOnboardingBar(this);syncTouchHud(this);}
  travel(target){
    if(this.riding)dismountVehicle(this,{forDoor:true});
    const intercity=regionOf(this.worldId)!==regionOf(target.to);
    this.closeOverlay();
    if(intercity){
      this.scene.start('TransitScene',{from:this.worldId,to:target.to,spawn:target.spawn});
      return;
    }
    if(target.to==='mixue_shop')sound.doorShop(true);
    else if(this.worldId==='mixue_shop')sound.doorShop(false);
    else if(target.to==='sany_workshop')sound.doorWorkshop(true);
    else if(this.worldId==='sany_workshop')sound.doorWorkshop(false);
    else sound.open();
    this.scene.restart({world:target.to,spawn:target.spawn,transit:{door:true}});
  }
  endCase(){if(this.riding)dismountVehicle(this,{forDoor:true});clearAchievementPopups();this.closeOverlay();document.getElementById('viewport').classList.add('ending');this.scene.start('EndingScene');}
  showJournal(){showJournal(this);}
  showMap(){showMap(this);}
  showAchievements(){showAchievements(this);}
  toast(message){
    const out=document.getElementById('toast');out.textContent=adaptTouchText(message);out.hidden=false;
    this.toastTimer?.remove();this.toastTimer=this.time.delayedCall(1800,()=>out.hidden=true);
  }
  closeOverlay(){
    if(this.overlay==='intro')return;
    this.panelScope?.abort();this.panelScope=null;
    const sheet=document.getElementById('sheet');sheet.hidden=true;sheet.classList.remove('sdv-sheet');sheet.replaceChildren();this.overlay=null;
    document.getElementById('toast').hidden=true;
    syncTouchHud(this);
  }
}
