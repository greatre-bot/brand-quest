import assert from 'node:assert/strict';
import {connect} from './browser-driver.mjs';

const wait = ms => new Promise(r => setTimeout(r, ms));
const url = process.env.TEST_URL || 'file:///E:/sany/dist/brand-quest.html';
const port = Number(process.env.CHROME_PORT || 9367);
const mode = process.env.MOBILE_MODE || 'portrait'; // 'portrait' | 'landscape' | 'safari_short'
const isLandscape = mode === 'landscape' || mode === 'safari_short';
const W = isLandscape ? 844 : 390;
const H = mode === 'safari_short' ? 268 : mode === 'landscape' ? 390 : 844;

const b = await connect(port);
const scene = "window.BRAND_QUEST?.scene.getScene('WorldScene')";
const S = expr => b.read(scene + expr);

async function cdp(method, params = {}) {
  return b.call(method, params);
}

async function assertNoKeyboardHints(label) {
  const hits = await b.read(`(()=>{
    const rx=/(WASD|Shift|\\[Enter\\]|\\[Esc\\]|\\[ ?[EFRMJUVG1-6] ?\\]|Esc\\s*×|ESC\\s*离开|按\\s*[EFRMJUVGT]|按空格|空格键|按住F|F11|[1-3]\\s*(?:柠檬|珍珠|草莓)|[4-6]\\s*(?:甜筒|波霸|芒果)|T\\s*(?:正常糖|少糖)|R重来)/i;
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
  if (mode === 'safari_short') {
    await cdp('Emulation.setUserAgentOverride', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
      platform: 'iPhone'
    });
  }
  await cdp('Emulation.setDeviceMetricsOverride', {
    width: W, height: H, deviceScaleFactor: 2, mobile: true,
    screenOrientation: {type: isLandscape ? 'landscapePrimary' : 'portraitPrimary', angle: isLandscape ? 90 : 0}
  });
  await cdp('Emulation.setTouchEmulationEnabled', {enabled: true, maxTouchPoints: 5});

  await goto(url);
  await b.read('localStorage.clear()');
  await goto(url);
  await b.until("window.BRAND_QUEST?.scene.isActive('MenuScene') && !!document.querySelector('[data-start=\"new\"]')", 8000);
  assert.equal(await b.read("document.body.classList.contains('touch-on')"), true, `touch-on active in ${mode}`);
  assert.equal(await b.read("document.querySelector('#mobile-pad')?.hidden"), true, 'pad hidden on title screen');
  const tipVisible = await b.read("(()=>{const n=document.querySelector('.title-landscape-tip');return Boolean(n && getComputedStyle(n).display!=='none' && n.textContent.includes('横屏游玩更佳'));})()");
  assert.equal(tipVisible, mode === 'portrait', `landscape tip visibility in ${mode} should be ${mode === 'portrait'}`);
  if (mode === 'portrait') {
    const titleVp = await b.read("(()=>{const r=document.getElementById('viewport').getBoundingClientRect();return {top:r.top,bottom:r.bottom,ov:getComputedStyle(document.getElementById('viewport')).overflow};})()");
    assert.ok(titleVp.top > 180, `portrait title #viewport centered vertically (top=${titleVp.top})`);
    assert.equal(titleVp.ov, 'visible', 'portrait #viewport overflow visible to prevent iOS fixed-modal clipping');
  }
  const startRect = await b.read("(()=>{const r=document.querySelector('[data-start=\"new\"]').getBoundingClientRect();return {top:Math.round(r.top),bot:Math.round(r.bottom),h:Math.round(r.height)};})()");
  assert.ok(startRect.bot <= H + 1 && startRect.top >= 0, `${mode} title start button must be 100% visible without scrolling (${JSON.stringify(startRect)} in H=${H})`);
  await wait(150);
  await assertNoKeyboardHints('title');
  await b.shot(`mobile-${mode}-title`);

  // Start -> Intro -> Skip -> Choose Jakarta
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
  } else if (mode === 'safari_short') {
    const choiceCheck = await b.read(`(()=>{
      const a=document.querySelector('[data-dest="jakarta"]').getBoundingClientRect();
      const c=document.querySelector('[data-dest="karawang"]').getBoundingClientRect();
      const t=document.querySelector('.choice-thumb').getBoundingClientRect();
      const img=document.querySelector('.choice-thumb img').getBoundingClientRect();
      return {aBot:Math.round(a.bottom),cBot:Math.round(c.bottom),thumbH:Math.round(t.height),imgH:Math.round(img.height)};
    })()`);
    assert.ok(choiceCheck.aBot <= H + 1 && choiceCheck.cBot <= H + 1, `safari_short choice buttons fully inside ${H}px (${JSON.stringify(choiceCheck)})`);
    assert.ok(choiceCheck.imgH <= choiceCheck.thumbH, `safari_short choice thumb image not clipped (${JSON.stringify(choiceCheck)})`);
    await assertNoKeyboardHints('choice');
    await b.shot('mobile-safari_short-choice');
  }

  await tapSelector('[data-dest="jakarta"]');
  await b.until("window.BRAND_QUEST?.scene.isActive('WorldScene')", 6000);
  if (mode === 'safari_short') {
    // Wait for the actual arrival welcome card (.cine-dialog) to verify 开始逛逛 button is NOT clipped at 268px!
    await b.until("!!document.querySelector('.cine-dialog .sdv-next')", 6000);
    await wait(120);
    const welcomeBtn = await b.read("(()=>{const r=document.querySelector('.cine-dialog .sdv-next').getBoundingClientRect();const d=document.querySelector('.cine-dialog').getBoundingClientRect();return {btnTop:Math.round(r.top),btnBot:Math.round(r.bottom),dlgTop:Math.round(d.top),dlgBot:Math.round(d.bottom)};})()");
    assert.ok(welcomeBtn.btnBot <= H + 1 && welcomeBtn.btnTop >= 0, `safari_short welcome card CTA must be 100% visible (${JSON.stringify(welcomeBtn)} in H=${H})`);
    await assertNoKeyboardHints('welcome');
    await b.shot('mobile-safari_short-welcome');
    await tapSelector('.cine-dialog .sdv-next');
  } else {
    await b.until("!!document.querySelector('#cutscene-layer .cine-skip')", 4000);
    await tapSelector('#cutscene-layer .cine-skip');
  }
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
  assert.ok(achBox.h <= H, `achievements modal height (${achBox.h}) fits within ${H}`);
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
  const dlgBox = await b.read("(()=>{const r=document.querySelector('.sdv-dialog').getBoundingClientRect();const n=document.querySelector('.sdv-next').getBoundingClientRect();return {w:Math.round(r.width),h:Math.round(r.height),nextBot:Math.round(n.bottom)};})()");
  assert.ok(dlgBox.nextBot <= H + 1, `NPC dialog next button visible inside ${H} (${JSON.stringify(dlgBox)})`);
  await wait(80);
  await assertNoKeyboardHints('dialog');
  await b.shot(`mobile-${mode}-dialog`);
  await tapSelector('.sdv-next');
  await b.until(`${scene}?.overlay===null`, 2000);

  if (isLandscape) {
    // Verify true non-stretched widescreen full-bleed viewport (ZERO side pillars even at 844x268!)
    const vpMetrics = await b.read(`(()=>{const c=document.querySelector('#game>canvas');const r=c.getBoundingClientRect();const s=${scene};return {cw:c.width,ch:c.height,rw:Math.round(r.width),rh:Math.round(r.height),zoom:Number((s.cameras.main.zoom||1).toFixed(3)),wide:document.body.classList.contains('wide-landscape'),dpadW:Math.round(document.querySelector('.vpad-dpad').getBoundingClientRect().width)};})()`);
    assert.equal(vpMetrics.wide, true, `wide-landscape full-bleed active on ${W}x${H}`);
    assert.ok(vpMetrics.cw >= 760 && vpMetrics.ch === 360, `logical canvas expanded to widescreen (${vpMetrics.cw}x${vpMetrics.ch})`);
    assert.ok(vpMetrics.rw >= W - 6 && vpMetrics.rh >= H - 4, `canvas fills 100% of ${W}x${H} screen edge-to-edge with ZERO sidebars (${vpMetrics.rw}x${vpMetrics.rh})`);
    const ratioDiff = Math.abs((vpMetrics.rw / vpMetrics.rh) - (vpMetrics.cw / vpMetrics.ch));
    assert.ok(ratioDiff < 0.025, `1:1 square pixels with ZERO stretching (aspect diff ${ratioDiff.toFixed(4)})`);
    if (mode === 'safari_short') {
      assert.ok(vpMetrics.zoom > 1.25 && vpMetrics.zoom <= 1.6, `safari_short applies uniform 1:1 cover zoom on Jakarta map (${vpMetrics.zoom})`);
      assert.ok(vpMetrics.dpadW <= 100, `safari_short shrinks pale-yellow dpad cleanly (${vpMetrics.dpadW}px)`);
      // Tap top-right fullscreen button -> verify mobile fullscreen help opens cleanly without F11 text!
      await tapSelector('#fullscreen');
      await b.until("!!document.querySelector('.dialog.fullscreen-help')", 2500);
      await assertNoKeyboardHints('fullscreen-help');
      const fsBox = await b.read("(()=>{const r=document.querySelector('.dialog.fullscreen-help').getBoundingClientRect();return {top:Math.round(r.top),bot:Math.round(r.bottom)};})()");
      assert.ok(fsBox.bot <= H + 1, `safari_short fullscreen help fits inside ${H}px (${JSON.stringify(fsBox)})`);
      await b.shot('mobile-safari_short-fshelp');
      await tapSelector('.dialog.fullscreen-help .exit');
      await b.until(`${scene}?.overlay===null`, 2000);
    }

    if (mode === 'landscape') {
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
  }

  // Enter Mixue shop & launch MixueBarScene -> verify responsive layout
  await b.read(`(()=>{const s=${scene};s.travel({to:'mixue_shop',spawn:{x:264,y:196}});return true;})()`);
  await b.until(`${scene}?.worldId==='mixue_shop' && ${scene}?.overlay===null`, 4000);
  await b.read(`(()=>{const s=${scene};s.player.setPosition(264,196);s.updateHint();return true;})()`);
  await wait(120);
  await tapSelector('.vpad-interact');
  const bar = "window.BRAND_QUEST?.scene.getScene('MixueBarScene')?.barState";
  await b.until(`window.BRAND_QUEST?.scene.isActive('MixueBarScene') && ${bar}?.phase==='tutorial'`, 4000);
  await assertNoKeyboardHints('mixue-tutorial');
  if (mode === 'safari_short') {
    const tutBtn = await b.read("(()=>{const r=document.querySelector('[data-tut=\"guide\"]').getBoundingClientRect();return {top:Math.round(r.top),bot:Math.round(r.bottom)};})()");
    assert.ok(tutBtn.bot <= H + 1 && tutBtn.top >= 0, `safari_short mixue tutorial button visible without scroll (${JSON.stringify(tutBtn)} in H=${H})`);
    await b.shot('mobile-safari_short-mixue-tut');
  }
  await tapSelector('[data-tut="guide"]');
  await b.until(`${bar}?.phase==='serving'`, 4000);
  await wait(160);
  await assertNoKeyboardHints('mixue-serving');
  if (mode === 'portrait') {
    assert.equal(await b.read("getComputedStyle(document.querySelector('.vpad-mixue')).display !== 'none'"), true, 'Mixue portrait pale-yellow barista deck visible');
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
