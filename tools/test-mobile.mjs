import assert from 'node:assert/strict';
import {connect} from './browser-driver.mjs';

const wait = ms => new Promise(r => setTimeout(r, ms));
const url = process.env.TEST_URL || 'file:///E:/sany/dist/brand-quest.html';
const port = Number(process.env.CHROME_PORT || 9367);
const mode = process.env.MOBILE_MODE || 'portrait'; // 'portrait' | 'landscape'
const W = mode === 'landscape' ? 844 : 390;
const H = mode === 'landscape' ? 390 : 844;

const b = await connect(port);
const scene = "window.BRAND_QUEST?.scene.getScene('WorldScene')";
const S = expr => b.read(scene + expr);

async function cdp(method, params = {}) {
  return b.call(method, params);
}

async function assertNoKeyboardHints(label) {
  const hits = await b.read(`(()=>{
    const rx=/(WASD|Shift|\\[Enter\\]|\\[Esc\\]|\\[ ?[EFRMJUVG1-6] ?\\]|Esc\\s*×|ESC\\s*离开|按\\s*[EFRMJUVGT]|按空格|空格键|按住F|[1-3]\\s*(?:柠檬|珍珠|草莓)|[4-6]\\s*(?:甜筒|波霸|芒果)|T\\s*(?:正常糖|少糖)|R重来)/i;
    const found=[];
    for(const el of document.querySelectorAll('body *')){
      if(el.children.length>0)continue;
      const st=getComputedStyle(el);
      if(st.display==='none'||st.visibility==='hidden'||el.closest('[hidden]'))continue;
      const r=el.getBoundingClientRect();
      if(r.width===0&&r.height===0)continue;
      const txt=(el.textContent||'').trim();
      if(txt&&rx.test(txt))found.push(txt);
    }
    return found;
  })()`);
  assert.deepEqual(hits, [], `mobile ${mode} (${label}) must have zero keyboard hints, found: ${JSON.stringify(hits)}`);
}

async function goto(u) {
  await b.call('Page.navigate', {url: u});
  await b.until("document.readyState==='complete'", 8000);
}

async function tapSelector(sel) {
  const pt = await b.read(`(()=>{const n=document.querySelector(${JSON.stringify(sel)});if(!n)return null;const r=n.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()`);
  assert.ok(pt, `element ${sel} missing`);
  await cdp('Input.dispatchMouseEvent', {type: 'mouseMoved', x: pt.x, y: pt.y});
  await cdp('Input.dispatchMouseEvent', {type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1});
  await wait(80);
  await cdp('Input.dispatchMouseEvent', {type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1});
  await wait(120);
}

async function holdDpad(dx, dy, ms = 420) {
  const pt = await b.read(`(()=>{const n=document.querySelector('.vpad-dpad');if(!n)return null;const r=n.getBoundingClientRect();return {x:r.left+r.width/2+(${dx})*r.width*0.34,y:r.top+r.height/2+(${dy})*r.height*0.34};})()`);
  assert.ok(pt, 'dpad missing');
  await cdp('Input.dispatchMouseEvent', {type: 'mouseMoved', x: pt.x, y: pt.y});
  await cdp('Input.dispatchMouseEvent', {type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1});
  await wait(ms);
  await cdp('Input.dispatchMouseEvent', {type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1});
  await wait(120);
}

try {
  await cdp('Emulation.setDeviceMetricsOverride', {
    width: W, height: H, deviceScaleFactor: 2, mobile: true,
    screenOrientation: {type: mode === 'landscape' ? 'landscapePrimary' : 'portraitPrimary', angle: mode === 'landscape' ? 90 : 0}
  });
  await cdp('Emulation.setTouchEmulationEnabled', {enabled: true, maxTouchPoints: 5});

  await goto(url);
  await b.read('localStorage.clear()');
  await goto(url);
  await b.until("window.BRAND_QUEST?.scene.isActive('MenuScene') && !!document.querySelector('[data-start=\"new\"]')", 8000);
  assert.equal(await b.read("document.body.classList.contains('touch-on')"), true, `touch-on active in ${mode}`);
  assert.equal(await b.read("document.querySelector('#mobile-pad')?.hidden"), true, 'pad hidden on title screen');
  const tipVisible = await b.read("(()=>{const n=document.querySelector('.title-landscape-tip');return Boolean(n && getComputedStyle(n).display!=='none' && n.textContent.includes('横屏游玩更佳'));})()");
  assert.equal(tipVisible, true, `mobile landscape tip visible in ${mode}`);
  if (mode === 'portrait') {
    const titleVp = await b.read("(()=>{const r=document.getElementById('viewport').getBoundingClientRect();return {top:r.top,bottom:r.bottom,ov:getComputedStyle(document.getElementById('viewport')).overflow};})()");
    assert.ok(titleVp.top > 180, `portrait title #viewport centered vertically (top=${titleVp.top})`);
    assert.equal(titleVp.ov, 'visible', 'portrait #viewport overflow visible to prevent iOS fixed-modal clipping');
  }
  await wait(150);
  await assertNoKeyboardHints('title');
  await b.shot(`mobile-${mode}-title`);

  // Start -> Intro -> Skip -> Choose Jakarta -> Skip opening welcome
  await tapSelector('[data-start="new"]');
  await b.until("window.BRAND_QUEST?.scene.isActive('IntroScene')", 5000);
  await tapSelector('.cine-skip');
  await b.until("!!document.querySelector('[data-dest=\"jakarta\"]')", 4000);
  await wait(150);
  if (mode === 'portrait') {
    const choiceMetrics = await b.read("(()=>{const a=document.querySelector('[data-dest=\"jakarta\"]').getBoundingClientRect();const c=document.querySelector('[data-dest=\"karawang\"]').getBoundingClientRect();return {aTop:a.top,aBot:a.bottom,aLeft:a.left,cTop:c.top,cBot:c.bottom,cLeft:c.left,vpBot:document.getElementById('viewport').getBoundingClientRect().bottom};})()");
    assert.ok(Math.abs(choiceMetrics.aLeft - choiceMetrics.cLeft) < 4 && choiceMetrics.cTop > choiceMetrics.aBot, `portrait choice cards stacked vertically (${JSON.stringify(choiceMetrics)})`);
    assert.ok(choiceMetrics.cBot <= H, `portrait second choice button fully visible inside screen (${choiceMetrics.cBot} <= ${H})`);
    await b.shot('mobile-portrait-choice');
  }
  await tapSelector('[data-dest="jakarta"]');
  await b.until("window.BRAND_QUEST?.scene.isActive('WorldScene')", 6000);
  await b.until("!!document.querySelector('#cutscene-layer .cine-skip')", 4000);
  await tapSelector('#cutscene-layer .cine-skip');
  await b.until(`${scene}?.overlay===null && !document.querySelector('#mobile-pad')?.hidden`, 4000);

  // Verify pale-yellow virtual controls are visible and actually move the player!
  const padBg = await b.read("getComputedStyle(document.querySelector('.vpad-dir.up')).backgroundColor");
  assert.ok(padBg.includes('255') && padBg.includes('24'), `expected pale yellow button bg, got ${padBg}`);
  const x0 = await S('.player.x');
  const y0 = await S('.player.y');
  await holdDpad(-1, 0, 450);
  const x1 = await S('.player.x');
  assert.ok(x1 < x0 - 20, `left pale-yellow dpad moved player west (${x0} -> ${x1})`);
  await holdDpad(0, 1, 250);
  const y1 = await S('.player.y');
  assert.ok(y1 > y0 + 8, `down pale-yellow dpad moved player south (${y0} -> ${y1})`);

  if (mode === 'portrait') {
    const worldLayout = await b.read("(()=>{const t=document.getElementById('mobile-top-deck').getBoundingClientRect();const v=document.getElementById('viewport').getBoundingClientRect();const p=document.getElementById('mobile-pad').getBoundingClientRect();return {tBot:t.bottom,vTop:v.top,vBot:v.bottom,pTop:p.top};})()");
    assert.ok(worldLayout.vTop >= 120 && worldLayout.tBot <= worldLayout.vTop + 2 && worldLayout.vBot <= worldLayout.pTop + 2, `portrait world #viewport centered between top deck & pad (${JSON.stringify(worldLayout)})`);
  }
  await assertNoKeyboardHints('world');
  await b.shot(`mobile-${mode}-world`);

  // Verify NPC Dialog & Achievement Modal compact sizing on mobile!
  await b.read(`(()=>{const s=${scene};s.showAchievements();return true;})()`);
  await b.until("!!document.querySelector('.dialog.achievements')", 2000);
  const achBox = await b.read("(()=>{const r=document.querySelector('.dialog.achievements').getBoundingClientRect();return {w:Math.round(r.width),h:Math.round(r.height),cols:getComputedStyle(document.querySelector('.ach-grid')).gridTemplateColumns.split(' ').length};})()");
  assert.ok(achBox.h <= H * 0.85, `achievements modal height (${achBox.h}) compact within ${H}`);
  assert.equal(achBox.cols, 2, 'achievements modal uses compact 2-column grid on mobile');
  await wait(80);
  await assertNoKeyboardHints('achievements');
  await b.shot(`mobile-${mode}-ach`);
  await tapSelector('.dialog .exit');
  await b.until(`${scene}?.overlay===null`, 2000);

  // Talk to nearby street NPC to verify compact Stardew dialog sizing on mobile
  await b.read(`(()=>{const s=${scene};s.player.setPosition(264,224);s.updateHint();return true;})()`);
  await wait(100);
  await tapSelector('.vpad-interact');
  await b.until("!!document.querySelector('.sdv-dialog')", 2000);
  const dlgBox = await b.read("(()=>{const r=document.querySelector('.sdv-dialog').getBoundingClientRect();return {w:Math.round(r.width),h:Math.round(r.height)};})()");
  assert.ok(dlgBox.h <= H * 0.45, `NPC dialog height (${dlgBox.h}) compact within ${H}`);
  await wait(80);
  await assertNoKeyboardHints('dialog');
  await b.shot(`mobile-${mode}-dialog`);
  await tapSelector('.sdv-next');
  await b.until(`${scene}?.overlay===null`, 2000);

  if (mode === 'landscape') {
    // Verify true non-stretched widescreen full-bleed viewport!
    const vpMetrics = await b.read(`(()=>{const c=document.querySelector('#game>canvas');const r=c.getBoundingClientRect();return {cw:c.width,ch:c.height,rw:Math.round(r.width),rh:Math.round(r.height),wide:document.body.classList.contains('wide-landscape')};})()`);
    assert.equal(vpMetrics.wide, true, 'wide-landscape full-bleed active on 844x390 phone');
    assert.ok(vpMetrics.cw >= 760 && vpMetrics.ch === 360, `logical canvas expanded to widescreen (${vpMetrics.cw}x${vpMetrics.ch})`);
    assert.ok(vpMetrics.rw >= 836 && vpMetrics.rh >= 386, `canvas fills full landscape screen (${vpMetrics.rw}x${vpMetrics.rh})`);
    const ratioDiff = Math.abs((vpMetrics.rw / vpMetrics.rh) - (vpMetrics.cw / vpMetrics.ch));
    assert.ok(ratioDiff < 0.02, `1:1 square pixels with ZERO stretching (aspect diff ${ratioDiff.toFixed(4)})`);

    // Move to curbside red scooter & test mounting + horn + dismount via pale-yellow mobile buttons!
    await b.read(`(()=>{const s=${scene};s.player.setPosition(233,232);s.updateHint();return true;})()`);
    await wait(120);
    await tapSelector('.vpad-interact');
    await b.until(`${scene}?.riding?.id==='veh_1'`, 2000);
    assert.equal(await b.read("document.querySelector('.vpad-horn')?.hidden"), false, 'pale-yellow horn button visible while riding');
    assert.equal(await b.read("document.querySelector('.vpad-dismount')?.hidden"), false, 'pale-yellow dismount button visible while riding');
    await holdDpad(1, 0, 380);
    await tapSelector('.vpad-horn');
    await b.until("document.querySelector('#ach-toast') && !document.querySelector('#ach-toast').hidden", 2500);
    const achToastBox = await b.read("(()=>{const r=document.querySelector('#ach-toast').getBoundingClientRect();return {w:Math.round(r.width),h:Math.round(r.height)};})()");
    assert.ok(achToastBox.w <= 190 && achToastBox.h <= 46, `achievement toast must stay ultra-compact on mobile, got ${JSON.stringify(achToastBox)}`);
    await wait(80);
    await assertNoKeyboardHints('riding');
    await b.shot('mobile-landscape-riding');
    await tapSelector('.vpad-dismount');
    await b.until(`${scene}?.riding===null`, 2000);
  }

  // Enter Mixue shop & launch MixueBarScene -> verify responsive layout & pale-yellow portrait barista deck
  await b.read(`(()=>{const s=${scene};s.travel({to:'mixue_shop',spawn:{x:264,y:196}});return true;})()`);
  await b.until(`${scene}?.worldId==='mixue_shop' && ${scene}?.overlay===null`, 4000);
  await b.read(`(()=>{const s=${scene};s.player.setPosition(264,196);s.updateHint();return true;})()`);
  await wait(120);
  await tapSelector('.vpad-interact');
  const bar = "window.BRAND_QUEST?.scene.getScene('MixueBarScene')?.barState";
  await b.until(`window.BRAND_QUEST?.scene.isActive('MixueBarScene') && ${bar}?.phase==='tutorial'`, 4000);
  await assertNoKeyboardHints('mixue-tutorial');
  await tapSelector('[data-tut="guide"]');
  await b.until(`${bar}?.phase==='serving'`, 4000);
  await wait(160);
  await assertNoKeyboardHints('mixue-serving');
  if (mode === 'portrait') {
    assert.equal(await b.read("getComputedStyle(document.querySelector('.vpad-mixue')).display !== 'none'"), true, 'Mixue portrait pale-yellow barista deck visible');
    // Tap pale-yellow portrait buttons to add Lemon, Ice, Less Sugar!
    await tapSelector('.vpad-mixue-row:nth-of-type(2) button:nth-of-type(1)');
    await tapSelector('.vpad-mixue-row:nth-of-type(2) button:nth-of-type(4)');
    await tapSelector('.vpad-mixue-row:nth-of-type(2) button:nth-of-type(5)');
    assert.equal(await b.read(`${bar}?.cupTopping`), 'lemonade', 'portrait pale-yellow lemon button worked');
    assert.equal(await b.read(`${bar}?.cupIce`), true, 'portrait pale-yellow ice button worked');
    assert.equal(await b.read(`${bar}?.cupSugar`), 'less', 'portrait pale-yellow sugar button worked');
  }
  await b.shot(`mobile-${mode}-mixue`);

  const http = b.requests.filter(r => /^https?:/.test(r));
  if (url.startsWith('file:')) assert.deepEqual(http, []);
  assert.deepEqual(b.errors, []);
  console.log(JSON.stringify({mobileMode: mode, viewport: `${W}x${H}`, padBg, httpRequests: http.length, errors: b.errors}, null, 2));
} finally {
  await b.close().catch(() => {});
}
