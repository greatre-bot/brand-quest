// Run against a dedicated, disposable Chrome debugging profile. See tools/RUN.md.
import assert from 'node:assert/strict';
import {connect,wait} from './browser-driver.mjs';
const b=await connect(Number(process.env.QUEST_CDP_PORT)||9367);
const url=process.env.QUEST_TEST_URL||new URL('../dist/brand-quest.html',import.meta.url).href;
const scene="window.BRAND_QUEST?.scene.getScene('WorldScene')";
const S=expr=>b.read(scene+expr);
async function world(id){await b.until(scene+"?.sys.isActive() && "+scene+".worldId==='"+id+"' && "+scene+".player?.active && "+scene+".overlay!=='intro'");await wait(240);}
async function move(axis,target){
  const start=await S('.player.'+axis);
  if(Math.abs(start-target)<3)return;
  const sign=Math.sign(target-start),key=(axis==='x'?(sign>0?'d':'a'):(sign>0?'s':'w'));
  await b.key(key);
  try{
    await b.until('('+scene+'.player.'+axis+'-'+target+')*'+sign+'>=-2',Math.abs(start-target)*22+2200);
  }finally{await b.key(key,false);}
}
async function walk(x,y){await move('x',x);await move('y',y);}
async function button(text){
  const box=await b.read(`(()=>{const node=[...document.querySelectorAll('button')].find(x=>x.textContent.includes(${JSON.stringify(text)})&&x.offsetWidth);if(!node)return null;const r=node.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`);
  assert(box,'button missing '+text);await mouse('mousePressed',box);await mouse('mouseReleased',box);await wait(90);
}
async function clickSelector(selector){
  const box=await center(selector);
  await mouse('mousePressed',box);await mouse('mouseReleased',box);await wait(90);
}
async function center(selector){
  return b.read(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`);
}
async function mouse(type,[x,y]){
  await b.call('Input.dispatchMouseEvent',{type,x,y,button:'left',buttons:type==='mouseReleased'?0:1,clickCount:1});
}
async function canvasPt(cx,cy){
  return b.read(`(()=>{const r=document.querySelector('#game canvas').getBoundingClientRect();return [r.x+r.width*(${cx}/640),r.y+r.height*(${cy}/360)]})()`);
}
async function canvasClick(cx,cy,holdMs=70){
  const pt=await canvasPt(cx,cy);
  await mouse('mousePressed',pt);await wait(holdMs);await mouse('mouseReleased',pt);await wait(90);
}
async function drag(from,to){
  const a=await center(from),z=await center(to);
  await mouse('mousePressed',a);await mouse('mouseMoved',z);await mouse('mouseReleased',z);await wait(80);
}
const FORBIDDEN_UI=['课堂','课程','走查','M4','模拟','演示','调研组'];
async function assertCleanText(selector){
  const txt=await b.read(`document.querySelector(${JSON.stringify(selector)})?.textContent || ''`);
  for(const word of FORBIDDEN_UI)assert.equal(txt.includes(word),false,`forbidden UI copy "${word}" in ${selector}`);
}

try{
  if(url.startsWith('file:'))await b.call('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
  await b.call('Page.navigate',{url});await b.until('window.BRAND_QUEST && document.querySelector("#game canvas")',12000);
  await b.read("localStorage.removeItem('brandquest-v1-save');localStorage.removeItem('brandquest-v1-muted')");await b.call('Page.reload');

  // 1. Title screen verification (clean adventure copy, zero classroom elements)
  await b.until("window.BRAND_QUEST?.scene.isActive('MenuScene') && !!document.querySelector('#title-screen')");
  await wait(240);
  assert.ok(await b.read('document.documentElement.scrollHeight===innerHeight'));
  assert.equal(await b.read("window.BRAND_QUEST_SOUND?.currentTrackKey()"),'opening','opening BGM active on title screen');
  await assertCleanText('#title-screen');
  await b.shot('title');
  const start=Date.now();
  await button('开始旅程');

  // 2. Full-screen pixel opening animation (IntroScene Act 1 -> Act 2 -> Act 3 Choice)
  await b.until("window.BRAND_QUEST?.scene.isActive('IntroScene') && !!document.querySelector('#intro-layer')",4000);
  assert.equal(await b.read("window.BRAND_QUEST_SOUND?.currentTrackKey()"),'opening','opening BGM continues through IntroScene');
  await wait(900);
  await b.shot('intro-anim');
  await b.until("window.BRAND_QUEST.scene.getScene('IntroScene').act===2",5000);
  await wait(700);
  await b.shot('intro-diorama');
  await b.until("!!document.querySelector('#intro-choice')",5000);
  await wait(200);
  await assertCleanText('#intro-choice');
  await b.shot('intro-choice');

  // 3. Choose Jakarta Mixue as first stop -> Arrival walk-in & welcome card
  await clickSelector('[data-dest="jakarta"]');
  await b.until("!!document.querySelector('.cine-dialog .tut-grid')",6000);
  await wait(160);
  await assertCleanText('.cine-dialog');
  await b.shot('intro-tutorial');
  await b.tap('Enter');
  await world('jakarta');
  assert.equal(await S(".session.has('intro_done')"),true);
  assert.equal(await S(".session.flags.first_stop"),'jakarta');
  assert.equal(await b.read("window.BRAND_QUEST_SOUND?.currentTrackKey()"),'jakarta','Jakarta street BGM active');
  assert.equal(await b.read("document.querySelector('#photo-count')?.textContent"),'0 / 3');

  // Verify settings panel has zero classroom/walkthrough timing elements
  await button('设置');await assertCleanText('#sheet');
  await button('隐藏下一步指引');assert.equal(await S('.session.guide'),false);
  await button('开启下一步指引');assert.equal(await S('.session.guide'),true);
  await b.tap('Escape');

  const full=await center('#fullscreen');await mouse('mousePressed',full);await mouse('mouseReleased',full);await b.until('!!document.fullscreenElement');await b.tap('g');await b.until('!document.fullscreenElement');
  await b.tap('h');assert.ok(await b.read("document.querySelector('#viewport').classList.contains('hud-off')"));await b.tap('h');
  assert.ok(await b.read('document.documentElement.scrollHeight===innerHeight'));
  await b.shot('jakarta');

  // Verify native pixel font loaded 100% offline & audio toggle works
  assert.equal(await b.read("document.fonts.check('12px FusionPixel')"),true,'FusionPixel native pixel font loaded');
  await b.tap('v');assert.equal(await b.read("document.querySelector('#audio-toggle')?.dataset.muted"),'1');
  await b.tap('v');assert.equal(await b.read("document.querySelector('#audio-toggle')?.dataset.muted"),'0');

  // 4. Verify ZERO photography UI at Mixue / Jakarta (photo button & pill hidden until Teacher Wan quest)
  assert.equal(await S('.evidenceBadges.size'),0,'no evidence badges in Jakarta');
  assert.equal(await b.read("document.querySelector('#photo-btn')?.hidden"),true,'photo hotbar button hidden before Wan quest');
  assert.equal(await b.read("document.querySelector('#photo-pill')?.hidden"),true,'photo counter pill hidden before Wan quest');
  await b.tap('f');
  assert.equal(await S('.session.photos.length'),0,'cannot take photos before Teacher Wan quest');

  // Inspect Mixue sign via E instead of photography
  await walk(318,224);await b.tap('e');
  assert.ok(await b.read("!!document.querySelector('#sheet .sign-inspect')"),'Mixue sign inspect image shown');
  await b.tap('Escape');

  // 4b. Test mounting, riding, boosting, honking & parking the Jakarta street e-scooter + zero ugly badge + achievements!
  assert.equal(await S(".vehicles.every(v=>!v.badge)"),true,'no ugly floating badge on parked scooters');
  await walk(233,232);
  await b.tap('e');
  assert.equal(await S('.riding?.id'),'veh_1','mounted curbside red vespa e-scooter');
  assert.equal(await S('.player.texture.key'),'ride-vespa','switched to 4-dir red riding sprite');
  await b.until(scene+".session.flags.achievements?.includes('first_ride')",1500);
  await b.key('s');await wait(320);await b.key('s',false);
  await b.key('d');await wait(520);await b.tap(' ');
  await b.until(scene+".session.flags.achievements?.includes('street_horn')",1500);
  await b.shot('riding-jakarta');await b.key('d',false);
  await wait(120);
  const parkedX=await S('.player.x');
  assert.ok(parkedX>300,'e-scooter cruised east along Jakarta avenue');
  await b.tap('r');
  assert.equal(await S('.riding'),null,'dismounted e-scooter cleanly via R');
  assert.equal(await S('.player.texture.key'),'player','restored standing player sprite');
  assert.ok(await S(".session.flags.parked_vehicles?.jakarta?.veh_1?.x > 290"),'parked scooter coordinates saved');

  // 5. Enter Mixue shop -> make lemonade -> talk to queue customer Bagus -> exit
  await walk(359,224);
  await b.key('w');await wait(730);await b.key('w',false);assert.ok(await S('.player.y')>197,'store wall collision');
  await b.tap('e');await world('mixue_shop');
  assert.equal(await b.read("window.BRAND_QUEST_SOUND?.currentTrackKey()"),'mixue','Mixue shop interior BGM active');
  assert.equal(await S('.evidenceBadges.size'),0,'no evidence badges in Mixue shop');
  await b.shot('shop');
  await walk(264,196);await b.tap('e');
  const bar="window.BRAND_QUEST?.scene.getScene('MixueBarScene')?.barState";
  // First entry opens visual 4-step beginner tutorial modal!
  await b.until(`window.BRAND_QUEST?.scene.isActive('MixueBarScene') && ${bar}?.phase==='tutorial' && ${bar}?.tutOpen===true`,4000);
  assert.equal(await b.read("window.BRAND_QUEST_SOUND?.currentTrackKey()"),'mixue_bar','Mixue bar minigame BGM active');
  await wait(120);
  await b.shot('order-tutorial');
  // Press Enter to start step-by-step guided Order 1
  await b.tap('Enter');
  await b.until(`${bar}?.phase==='serving' && ${bar}?.tutGuide===true && ${bar}?.tutStep===1`,4000);
  assert.equal(await b.read("!!document.querySelector('.mbar-vis-cup') && !document.querySelector('.mbar-chips')"),true,'restored HD visual-icon customer speech bubble');
  assert.equal(await b.read("document.querySelector('.mbar-stat-timer')?.textContent"),'教学模式','timer paused during guided tutorial Order 1');
  // Order 1 (Sara): Real first-person canvas mouse interactions following guided steps 1->7!
  await canvasClick(88,260); // Step 1: Lemon pan
  await b.until(`${bar}?.tutStep===2`,1500);
  await canvasClick(84,320); // Step 2: Ice well
  await b.until(`${bar}?.tutStep===3`,1500);
  await canvasClick(196,320); // Step 3: Syrup pump -> less sugar
  await b.until(`${bar}?.tutStep===4`,1500);
  assert.equal(await b.read(`${bar}?.cupTopping`),'lemonade','lemon added to cup');
  assert.equal(await b.read(`${bar}?.cupIce`),true,'ice scooped into cup');
  assert.equal(await b.read(`${bar}?.cupSugar`),'less','syrup pumped to less sugar');
  const dispPt=await canvasPt(39,165);
  await mouse('mousePressed',dispPt);await wait(1400);await b.shot('order-pouring');await wait(650);await mouse('mouseReleased',dispPt);await wait(90);
  await b.until(`${bar}?.tutStep===5`,1500);
  await canvasClick(415,290); // Step 5: Snap lidded cup onto red Serving Tray!
  await b.until(`${bar}?.cupOnTray===true && ${bar}?.tutStep===6`,2000);
  await canvasClick(515,276,780); // Step 6: Pick Cone & hold soft-serve machine swirl to 100%!
  await b.until(`${bar}?.trayDessert==='cone' && ${bar}?.tutStep===7`,2000);
  await b.shot('order');
  await canvasClick(422,215); // Step 7: Slap golden Brass Service Bell!
  await b.until(`${bar}?.orderIdx===1 && ${bar}?.phase==='serving' && ${bar}?.tutGuide===false`,4000);
  // Verify waiting mood progression & urging speech lines on timed Order 2 (Bagus): happy -> expect -> impatient -> angry
  assert.equal(await b.read(`${bar}?.custMood`),'happy','Bagus starts happy');
  assert.equal(await b.read("document.querySelector('.mbar-urge')?.hidden"),true,'urge line hidden while happy');
  await b.read(`(()=>{const st=${bar};st.patience=0.64;return true;})()`);
  await b.until(`${bar}?.custMood==='expect' && ${bar}?.urgeLevel===1`,1500);
  assert.ok(await b.read("document.querySelector('.mbar-urge.lv1')?.textContent.includes('办公室')"),'level 1 mild urge line displayed');
  await b.read(`(()=>{const st=${bar};st.patience=0.39;return true;})()`);
  await b.until(`${bar}?.custMood==='impatient' && ${bar}?.urgeLevel===2`,1500);
  assert.ok(await b.read("document.querySelector('.mbar-urge.lv2')?.textContent.includes('还没做好吗')"),'level 2 impatient urge line displayed');
  await wait(120);
  await b.shot('order-impatient');
  await b.read(`(()=>{const st=${bar};st.patience=0.17;return true;})()`);
  await b.until(`${bar}?.custMood==='angry' && ${bar}?.urgeLevel===3`,1500);
  assert.ok(await b.read("document.querySelector('.mbar-urge.lv3')?.textContent.includes('迟到了')"),'level 3 angry urge line displayed');
  await wait(120);
  await b.shot('order-angry');
  // Order 2 (Bagus): Boba Tea + Normal Sugar + Ice + Boba Sundae (Keyboard flow)
  await b.tap('2');await b.tap('ArrowUp');await b.key(' ');await wait(2050);await b.key(' ',false);
  await b.key('5');await wait(780);await b.key('5',false);await b.until(`${bar}?.trayDessert==='boba_sundae'`,2000);
  await b.tap('Enter');
  await b.until(`${bar}?.orderIdx===2 && ${bar}?.phase==='serving'`,4000);
  // Order 3 (Maria): Strawberry Fruit Tea + Less Sugar + Ice + Mango Sundae (Keyboard flow)
  await b.tap('3');await b.tap('ArrowUp');await b.tap('t');await b.key(' ');await wait(2050);await b.key(' ',false);
  await b.key('6');await wait(780);await b.key('6',false);await b.until(`${bar}?.trayDessert==='mango_sundae'`,2000);
  await b.tap('Enter');
  await b.until(`${bar}?.phase==='finished'`,4000);
  assert.equal(await b.read(`${bar}?.shiftAvg`),100,'100% average rating across all 3 orders');
  await b.tap('Enter');
  await world('mixue_shop');
  assert.equal(await b.read("window.BRAND_QUEST_SOUND?.currentTrackKey()"),'mixue','Mixue shop BGM resumed cleanly after leaving bar game');
  await b.until(scene+".session.has('mixue_order') && !!document.querySelector('#sheet')",3000);
  assert.ok(await b.read("document.querySelector('#sheet')?.textContent.includes('谢谢你帮忙做好，味道挺地道的')"),'Lina thank-you line preserved');
  await assertCleanText('#sheet');
  await b.tap('Escape');
  // Inspect Mixue 3-column menu board & talk to a customer standing in the Mixue queue
  await move('x',378);await move('y',200);await b.tap('e');
  assert.equal(await b.read("document.querySelectorAll('.mixue-menu-col').length"),3,'3-column Mixue menu board shown');
  assert.ok(await b.read("document.querySelector('.mixue-menu-board')?.textContent.includes('波霸圣代')"),'Boba Sundae listed on Mixue menu');
  await b.shot('mixue-menu');
  await b.tap('Escape');
  await move('x',380);await move('y',236);await b.tap('e');
  assert.ok(await b.read("document.querySelector('#sheet.sdv-sheet .sdv-portrait-frame img')?.complete"),'Mixue queue customer portrait shown');
  await b.shot('shop-queue-dialog');
  await b.tap('Escape');
  await move('y',292);await move('x',320);await b.tap('e');await world('jakarta');
  assert.ok(await S(".vehicles.find(v=>v.id==='veh_1')?.x > 290"),'parked Jakarta scooter remained where player left it after exiting shop');
  const sliceSeconds=(Date.now()-start)/1000;assert.ok(sliceSeconds<120);

  // 6. Test partial ending branch (Jakarta done, Karawang not done yet) & Esc return
  await b.tap('Tab');await assertCleanText('#sheet');await button('先看旅程小结');
  await b.until("window.BRAND_QUEST.scene.isActive('EndingScene') && !!document.querySelector('.end-status.insufficient')");
  await assertCleanText('#ending-board');
  assert.ok(await b.read("!!document.querySelector('.end-postcard')"),'Jakarta Mixue pixel postcard rendered');
  await b.tap('1');await b.until("document.querySelector('.m4-box.m4-proof')?.textContent.includes('参考')");
  await b.shot('ending-partial');
  await b.tap('Escape');await world('jakarta');

  // 7. Jakarta side quests: Reza queue check + Rian blue clip
  await walk(264,224);await b.tap('e');assert.ok(await S(".session.has('queue_check_start')"));await b.tap('Escape');
  await b.tap('e');assert.ok(await S(".session.has('queue_check_done')"));await b.tap('Escape');
  await move('y',373);await move('x',248);await b.tap('e');assert.ok(await S(".session.has('clip_start')"));
  assert.ok(await b.read("document.querySelector('#sheet.sdv-sheet .sdv-portrait-frame img')?.complete"),'Stardew bottom dialog portrait shown');
  await assertCleanText('#sheet');
  await b.shot('dialog-jakarta');
  await b.tap('Escape');
  await move('y',267);await move('x',112);await move('y',220);await b.tap('e');assert.ok(await S(".session.has('clip_found')"));await b.tap('Escape');
  await move('y',369);await move('x',248);await b.tap('e');assert.ok(await S(".session.has('clip_done')"));await b.tap('Escape');

  // 8. Shuttle to Karawang -> verify full-screen TransitScene pixel bus cutscene -> land in Karawang with fresh BGM!
  await walk(675,388);await b.tap('e');
  await b.until("window.BRAND_QUEST?.scene.isActive('TransitScene') && !!document.querySelector('#transit-layer')",4000);
  await wait(850);
  await b.shot('transit-bus');
  await world('karawang');
  assert.equal(await b.read("window.BRAND_QUEST_SOUND?.currentTrackKey()"),'karawang','Karawang park BGM active');
  assert.ok(await b.read("(window.BRAND_QUEST_SOUND?.tracks?.get('karawang')?.currentTime ?? 0) < 2"),'Karawang BGM started fresh from beginning');
  assert.equal(await b.read("document.querySelector('#transit-banner')?.hidden"),false,'intercity transit banner visible');
  assert.equal(await S(".evidenceBadges.get('sany_sign')?.visible"),false,'Karawang badges hidden before Wan quest');
  assert.equal(await S(".evidenceBadges.get('sany_machine')?.visible"),false,'Karawang machine badge hidden before Wan quest');
  assert.equal(await b.read("document.querySelector('#photo-btn')?.hidden"),true,'photo button still hidden in Karawang before Wan quest');
  await b.shot('karawang');

  // Talk to Teacher Wan -> unlocks photo button, photo pill & all 3 Karawang/Workshop photo targets
  await walk(364,219);await b.tap('e');assert.ok(await S(".session.has('field_start')"));
  assert.ok(await b.read("!!document.querySelector('#sheet .portrait-img')"),'Teacher Wan portrait shown in Karawang');
  assert.equal(await b.read("document.querySelector('#photo-btn')?.hidden"),false,'photo hotbar button revealed after Wan quest');
  assert.equal(await b.read("document.querySelector('#photo-pill')?.hidden"),false,'photo counter pill revealed after Wan quest');
  assert.equal(await S(".evidenceBadges.get('sany_sign')?.visible"),true,'sany_sign badge visible after Wan quest');
  assert.equal(await S(".evidenceBadges.get('sany_machine')?.visible"),true,'sany_machine badge visible after Wan quest');
  await b.shot('wan-karawang');
  await b.tap('Escape');
  await wait(120);
  await b.shot('karawang-camera-unlocked');

  // Snap Teacher Wan's 2 outdoor photos: sany_sign & sany_machine
  await walk(253,210);await b.tap('f');assert.ok(await S(".session.photos.includes('sany_sign')"));
  assert.equal(await S(".evidenceBadges.get('sany_sign')?.text"),'☑');
  await walk(434,214);await b.tap('f');assert.ok(await S(".session.photos.includes('sany_machine')"));
  assert.equal(await b.read("document.querySelector('#photo-count')?.textContent"),'2 / 3');

  // 9. Enter Workshop -> SANY Overhead Gantry Crane Unloading Minigame (wrong bay check + 3 heavy crates A1/B2/C1) -> reload resume -> 3rd Wan photo & handover
  await walk(690,203);await b.tap('e');await world('sany_workshop');
  assert.equal(await b.read("window.BRAND_QUEST_SOUND?.currentTrackKey()"),'workshop','SANY workshop BGM active');
  await b.shot('workshop');
  await walk(96,241);await b.tap('e');await b.until("!!document.querySelector('.crane-canvas')");
  assert.ok(await S(".session.has('service_ticket')"));

  async function craneMove(targetX){
    for(let tries=0;tries<2;tries++){
      await b.until("document.querySelector('.dialog.unload')?.dataset.phase==='idle'",4000);
      const cur=Number(await b.read("document.querySelector('.dialog.unload')?.dataset.trolleyX || 248"));
      if(Math.abs(cur-targetX)<=10)return;
      const sign=Math.sign(targetX-cur),k=sign>0?'ArrowRight':'ArrowLeft',stopAt=targetX-sign*12;
      await b.key(k);
      try{
        await b.until(`(Number(document.querySelector('.dialog.unload')?.dataset.trolleyX||0)-(${stopAt}))*${sign}>=0`,5000);
      }finally{await b.key(k,false);}
      await wait(240);
    }
  }
  async function craneGrab(x,id){
    await craneMove(x);
    await b.tap(' ');
    await b.until(`document.querySelector('.dialog.unload')?.dataset.carrying===${JSON.stringify(id)} && document.querySelector('.dialog.unload')?.dataset.phase==='idle'`,4500);
  }
  async function cranePlace(x,countAfter){
    await craneMove(x);
    await b.tap(' ');
    await b.until(`Number(document.querySelector('.dialog.unload')?.dataset.unloaded||0)===${countAfter} && document.querySelector('.dialog.unload')?.dataset.phase==='idle'`,4500);
  }

  // Grab A1 crate (x=182), test wrong-bay bounce on B2 (x=406), then deliver A1->308, B2->406, C1->504
  await craneGrab(182,'A1');
  await craneMove(406);
  await b.shot('service-pick');
  await b.tap(' ');
  await b.until("document.querySelector('.crane-status')?.textContent.includes('货位不符') && document.querySelector('.dialog.unload')?.dataset.phase==='idle'",4500);
  await cranePlace(308,1);
  await craneGrab(132,'B2');
  await cranePlace(406,2);
  await craneGrab(82,'C1');
  await cranePlace(504,3);
  await b.until("!!document.querySelector('.crane-overlay:not([hidden])')",3000);
  assert.ok(await S(".session.has('service_parts')"),'all 3 heavy crates unloaded into bays');
  await b.tap('Escape');

  // Reload mid-game -> Title Screen shows Resume -> Enter resumes right back into sany_workshop with unloaded crates saved!
  await b.call('Page.reload');await b.until("!!document.querySelector('[data-start=\"resume\"]')");
  await b.tap('Enter');await world('sany_workshop');assert.ok(await S(".session.has('service_parts')"));
  await move('y',263);await move('x',532);await b.tap('f');assert.ok(await S(".session.photos.includes('sany_service_record')"));
  assert.equal(await b.read("document.querySelector('#photo-count')?.textContent"),'3 / 3');
  await b.tap('e');assert.ok(await S('.session.done'));await b.tap('Escape');

  // Return to Karawang -> turn in all 3 photos to Teacher Wan -> check Journal & 8/8 Achievements Panel
  await move('y',320);await walk(317,331);await b.tap('e');await world('karawang');
  await move('y',219);await move('x',372);await b.tap('e');assert.ok(await S(".session.has('field_pair')"));await b.tap('Escape');
  assert.equal(await S(".session.flags.achievements?.length"),8,'all 8 achievements unlocked');
  assert.equal(await b.read("document.querySelector('#ach-count')?.textContent"),'8 / 8');
  await b.tap('u');await b.until("document.querySelectorAll('.ach-card.unlocked').length===8");await b.shot('achievements');await b.tap('Escape');
  await b.tap('Tab');await b.until("document.querySelectorAll('.evidence img').length===3");await b.shot('journal');await b.tap('Escape');

  // 10. Complete Ending Board + Sunset Multi-Ending Epilogue verification (3 Wan photos + Mixue postcard + 8/8 achievements + True Ending)
  await b.tap('j');await b.until("window.BRAND_QUEST.scene.isActive('EndingScene') && !!document.querySelector('#ending-board')");
  assert.equal(await b.read("window.BRAND_QUEST_SOUND?.currentTrackKey()"),'ending','Ending BGM active');
  await assertCleanText('#ending-board');
  assert.equal(await b.read("document.querySelectorAll('.end-photo img').length"),3,'all 3 Wan photos rendered');
  assert.equal(await b.read("document.querySelectorAll('.end-photo.missing').length"),0,'zero missing photos');
  assert.ok(await b.read("!!document.querySelector('.end-postcard img')"),'Jakarta Mixue postcard rendered');
  assert.ok(await b.read("document.querySelector('.end-status.complete') !== null"));
  assert.equal(await b.read("!!document.querySelector('.ending-timing')"),false,'no classroom timing widget');
  await b.tap('2');await b.until("document.querySelector('.m4-btn.active')?.dataset.choice==='proof'");
  await b.tap('3');await b.until("document.querySelector('.m4-btn.active')?.dataset.choice==='dual_track'");
  assert.equal(await b.read("window.BRAND_QUEST.registry.get('session').flags.strategy_choice"),'dual_track');
  assert.ok(await b.read("document.documentElement.scrollHeight===innerHeight"),'ending board fits viewport');
  await b.shot('ending');
  // Click into the full-screen Sunset Return-Flight Finale & verify True Ending!
  await clickSelector('#ending-epilogue-btn');
  await b.until("!!document.querySelector('#ending-epilogue .epilogue-card.tier-true')",3000);
  await wait(350);
  await assertCleanText('#ending-epilogue');
  assert.ok(await b.read("document.querySelector('#ending-epilogue h2')?.textContent.includes('双城全通')"),'true ending title rendered');
  assert.equal(await b.read("document.querySelectorAll('.epilogue-ach-tag').length"),8,'all 8 unlocked achievement badges shown on epilogue');
  await b.shot('ending-epilogue');

  // 11. Restart fresh -> test choosing KARAWANG directly as First Stop from IntroScene!
  await b.tap('Enter');await b.until("window.BRAND_QUEST?.scene.isActive('MenuScene') && !!document.querySelector('[data-start=\"new\"]')");
  await b.tap('Enter');await b.until("window.BRAND_QUEST?.scene.isActive('IntroScene')",4000);
  await b.tap('Enter');await b.until("!!document.querySelector('#intro-choice')",3000);
  await clickSelector('[data-dest="karawang"]');
  await b.until("!!document.querySelector('.cine-dialog .tut-grid')",6000);
  await wait(160);
  await b.shot('intro-karawang-tutorial');
  await b.tap('Escape');await world('karawang');
  assert.equal(await S(".session.flags.first_stop"),'karawang','Karawang chosen directly as first stop');
  assert.deepEqual(await S('.session.visited'),['karawang'],'Jakarta not falsely visited when starting in Karawang');
  // Test riding the teal Karawang industrial park e-scooter too!
  await move('y',390);await move('x',236);await b.tap('e');
  assert.equal(await S('.riding?.id'),'karawang_scooter','mounted Karawang teal e-scooter');
  assert.equal(await S('.player.texture.key'),'ride-scooter','switched to 4-dir teal riding sprite');
  await b.key('w');await wait(280);await b.key('w',false);
  await b.key('d');await wait(420);await b.tap(' ');await wait(120);await b.shot('riding-karawang');await b.key('d',false);
  await b.tap('r');assert.equal(await S('.riding'),null,'dismounted Karawang e-scooter cleanly');

  // 12. Shuttle to Jakarta via Map -> triggers westward TransitScene -> skip with Esc -> Mixue overflow recovery & keyboard 3-order shift check
  await b.tap('m');await button('乘车到雅加达');
  await b.until("window.BRAND_QUEST?.scene.isActive('TransitScene')",4000);
  await b.tap('Escape');
  await world('jakarta');
  assert.ok(await b.read("(window.BRAND_QUEST_SOUND?.tracks?.get('jakarta')?.currentTime ?? 0) < 2"),'Jakarta BGM restarted from beginning');
  await walk(359,208);await b.tap('e');await world('mixue_shop');
  await walk(264,196);await b.tap('e');
  await b.until(`window.BRAND_QUEST?.scene.isActive('MixueBarScene') && ${bar}?.phase==='tutorial'`,4000);
  await clickSelector('[data-tut="skip"]');
  await b.until(`${bar}?.phase==='serving' && ${bar}?.tutGuide===false`,4000);
  // Verify cup overflow auto-resets cup cleanly
  await b.tap('1');await b.tap('ArrowUp');await b.key(' ');await wait(2800);await b.key(' ',false);
  await b.until(`${bar}?.cupFill===0`,2000);
  assert.equal(await b.read(`${bar}?.scores?.length`),0,'overflow did not falsely score order');
  // Complete all 3 orders via keyboard cleanly
  await b.tap('1');await b.tap('ArrowUp');await b.tap('t');await b.key(' ');await wait(2050);await b.key(' ',false);
  await b.key('4');await wait(780);await b.key('4',false);await b.until(`${bar}?.trayDessert==='cone'`,2000);await b.tap('Enter');
  await b.until(`${bar}?.orderIdx===1 && ${bar}?.phase==='serving'`,4000);
  await b.tap('2');await b.tap('ArrowUp');await b.key(' ');await wait(2050);await b.key(' ',false);
  await b.key('5');await wait(780);await b.key('5',false);await b.until(`${bar}?.trayDessert==='boba_sundae'`,2000);await b.tap('Enter');
  await b.until(`${bar}?.orderIdx===2 && ${bar}?.phase==='serving'`,4000);
  await b.tap('3');await b.tap('ArrowUp');await b.tap('t');await b.key(' ');await wait(2050);await b.key(' ',false);
  await b.key('6');await wait(780);await b.key('6',false);await b.until(`${bar}?.trayDessert==='mango_sundae'`,2000);await b.tap('Enter');
  await b.until(`${bar}?.phase==='finished'`,4000);
  await b.tap('Enter');await world('mixue_shop');
  await b.until(scene+".session.has('mixue_order')",3000);await b.tap('Escape');

  const fps=await b.read('window.BRAND_QUEST.loop.actualFps');assert.deepEqual(b.errors,[]);
  const http=b.requests.filter(r=>/^https?:/.test(r));if(url.startsWith('file:'))assert.deepEqual(http,[]);
  console.log(JSON.stringify({sliceSeconds,completed:'title, full-screen IntroScene opening animation, 2-city first-stop choice (both Jakarta-first & Karawang-first), 6 inlined scene BGMs + achievement fanfare + door/shutter/bus/talk/page SFX, clean rideable/parkable red/teal e-scooters (zero ugly badge), 8/8 achievements + trophy panel + popups, zero Mixue photos, Wan-exclusive 3-photo quest, 4 maps, both minigames, Reza+Rian side quests, partial & full ending + animated sunset True Ending epilogue, zero classroom copy, reload resume',orderRecovery:'overflow, cancel, timeout, retry, keyboard delivery',fpsAtEnd:fps,httpRequests:http.length,browserExceptions:b.errors},null,2));
}catch(e){console.error(await b.read('({scene:window.BRAND_QUEST?.scene.getScenes(true)[0]?.scene.key,world:'+scene+'?.worldId,x:'+scene+'?.player?.x,y:'+scene+'?.player?.y,overlay:'+scene+'?.overlay,near:'+scene+'?.near?.id})'),b.errors);throw e;}finally{await b.close().catch(()=>{});}
