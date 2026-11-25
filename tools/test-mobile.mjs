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
  await wait(150);
  await b.shot(`mobile-${mode}-title`);

  // Start -> Intro -> Skip -> Choose Jakarta -> Skip opening welcome
  await tapSelector('[data-start="new"]');
  await b.until("window.BRAND_QUEST?.scene.isActive('IntroScene')", 5000);
  await tapSelector('.cine-skip');
  await b.until("!!document.querySelector('[data-dest=\"jakarta\"]')", 4000);
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

  await b.shot(`mobile-${mode}-world`);

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
    await wait(120);
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
  await tapSelector('[data-tut="guide"]');
  await b.until(`${bar}?.phase==='serving'`, 4000);
  await wait(160);
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
