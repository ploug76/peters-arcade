/* Desktop Chrome plus a simulated phone viewport. Not a physical device.
   NODE_PATH=/tmp/node_modules node tests/play.test.cjs
*/
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

const ROOT = path.resolve(__dirname, '..');
const ART = '/opt/cursor/artifacts';
const PORT = 8811;
const CHROME = process.env.CHROME || '/usr/local/bin/google-chrome';
const fails = [];
function fail(m) { fails.push(m); console.error('FAIL ' + m); }

function serve() {
  return spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
}
function waitServer() {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('server did not start')), 8000);
    const ping = () => http.get('http://127.0.0.1:' + PORT + '/', res => { res.resume(); clearTimeout(t); resolve(); }).on('error', () => setTimeout(ping, 80));
    ping();
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function open(browser, w, h, query) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message || e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: h > w || w < 500, hasTouch: true });
  await page.goto('http://127.0.0.1:' + PORT + '/' + query, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForFunction(() => window.__RTF && window.K && window.PTP, { timeout: 8000 });
  await sleep(200);
  return { page, errors };
}
function realErrors(errors) {
  return errors.filter(e => !/favicon/i.test(e) && !/Failed to load resource/i.test(e));
}
async function shot(page, name) {
  fs.mkdirSync(ART, { recursive: true });
  const file = path.join(ART, name);
  await page.screenshot({ path: file });
  return file;
}
async function runStory(page, label) {
  await page.evaluate(() => { __RTF.bot = true; __RTF.fast = true; if (__RTF.scene !== 'play') __RTF.startStage(0); });
  let cable = null, invShot = false, endShot = false;
  for (let i = 0; i < 90; i++) {
    await sleep(600);
    const s = await page.evaluate(() => __RTF.status());
    if (s.scene === 'play' && s.stage === 0 && !cable) {
      const near = await page.evaluate(() => {
        const cam = __RTF.G.lv.cams[0];
        const pts = cam.cable.filter(p => p.via);
        return { near: __RTF.trailNear(pts, 56), reel: !!__RTF.save.got['reel-beach'], kid: !!__RTF.save.kids['kid-beach'] };
      });
      if (near.reel && near.kid) {
        cable = near;
        if (label === 'desktop') await shot(page, 'cable_recorder_desktop.png');
      }
    }
    if (!invShot && s.scene === 'play' && s.got >= 8) {
      await page.evaluate(() => { __RTF.bot = false; __RTF.G.sheet = true; });
      await sleep(150);
      if (label === 'desktop') await shot(page, 'evidence_inventory.png');
      await page.evaluate(() => { __RTF.G.sheet = false; __RTF.bot = true; __RTF.fast = true; });
      invShot = true;
    }
    if (s.scene === 'map' || s.scene === 'card' || s.scene === 'title') {
      const next = await page.evaluate(() => ({ u: __RTF.save.unlocked, done: !!__RTF.save.released, got: Object.keys(__RTF.save.got).length }));
      if (next.done) break;
      await page.evaluate(n => { __RTF.bot = true; __RTF.fast = true; __RTF.startStage(n); }, Math.min(4, next.u - 1));
    }
    if (s.scene === 'ending' || s.released) {
      if (!endShot && label === 'desktop') { await sleep(400); await shot(page, 'ending_release.png'); endShot = true; }
      break;
    }
    if ((s.idle || 0) > 6 && s.scene === 'play') {
      fail(label + ' bot stuck ' + JSON.stringify(s));
      return null;
    }
  }
  const end = await page.evaluate(() => ({
    scene: __RTF.scene, released: !!__RTF.save.released,
    got: Object.keys(__RTF.save.got), kids: Object.keys(__RTF.save.kids),
    counts: __RTF.counts(), line: __RTF.endingLine || ''
  }));
  return { cable, end, invShot };
}

(async () => {
  const server = serve();
  let browser;
  try {
    await waitServer();
    browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });

    const cover = await open(browser, 1280, 720, '?qa=1&reset=1&shot=cover');
    await shot(cover.page, 'title_cover_desktop.png');
    await cover.page.screenshot({ path: path.join(ROOT, 'cover.png') });
    const coverTitle = await cover.page.evaluate(() => document.title);
    if (coverTitle !== 'Palm Tree Pete — Release the Files') fail('title text ' + coverTitle);
    await cover.page.close();

    const desk = await open(browser, 1100, 700, '?qa=1&reset=1');
    const buttons = await desk.page.evaluate(() => K.btns.map(b => b.label));
    if (!buttons.some(b => /PLAY|CONTINUE/.test(b))) fail('desktop title missing play');
    await shot(desk.page, 'title_with_buttons_desktop.png');

    await desk.page.evaluate(() => __RTF.startStage(0));
    await sleep(250);
    const x0 = await desk.page.evaluate(() => __RTF.G.hero.x);
    await desk.page.keyboard.down('ArrowRight');
    await sleep(350);
    await desk.page.keyboard.up('ArrowRight');
    const moved = await desk.page.evaluate(() => __RTF.G.hero.x);
    if (!(moved > x0 + 8)) fail('keyboard did not move hero ' + x0 + ' -> ' + moved);
    await desk.page.keyboard.press('Space');
    let jumped = false;
    for (let i = 0; i < 8; i++) {
      jumped = await desk.page.evaluate(() => __RTF.G.hero.vy < 0 || __RTF.G.hero.y < 318);
      if (jumped) break;
      await sleep(40);
    }
    if (!jumped) fail('keyboard jump did not leave the ground');

    const touch = await desk.page.evaluate(() => {
      const L = __RTF.padLayout();
      const mid = b => ({ x: b.x + b.w / 2, y: b.y + b.h / 2, label: b.label });
      return { left: mid(L.left), jump: mid(L.jump), act: mid(L.act), right: mid(L.right) };
    });
    if (touch.jump.label !== 'JUMP' || touch.act.label !== 'ACTION') fail('button labels ' + JSON.stringify(touch));
    const before = await desk.page.evaluate(() => ({ x: __RTF.G.hero.x, y: __RTF.G.hero.y }));
    await desk.page.evaluate(({ right, jump }) => {
      const cv = document.getElementById('cv');
      const ev = (type, id, x, y) => cv.dispatchEvent(new PointerEvent(type, { pointerId: id, clientX: x, clientY: y, bubbles: true, pointerType: 'touch', buttons: type === 'pointerup' ? 0 : 1 }));
      ev('pointerdown', 1, right.x, right.y);
      ev('pointerdown', 2, jump.x, jump.y);
    }, touch);
    let multi = false;
    for (let i = 0; i < 12; i++) {
      await sleep(40);
      multi = await desk.page.evaluate(x0 => {
        const h = __RTF.G && __RTF.G.hero;
        return !!(h && h.x > x0 + 2 && (h.vy < 0 || h.y < 318));
      }, before.x);
      if (multi) break;
    }
    await desk.page.evaluate(({ right, jump }) => {
      const cv = document.getElementById('cv');
      const ev = (id, x, y) => cv.dispatchEvent(new PointerEvent('pointerup', { pointerId: id, clientX: x, clientY: y, bubbles: true, pointerType: 'touch' }));
      ev(1, right.x, right.y); ev(2, jump.x, jump.y);
    }, touch);
    if (!multi) fail('multitouch left+jump did not move and jump');
    await shot(desk.page, 'desktop_play.png');

    await desk.page.setViewport({ width: 390, height: 844, isMobile: false, hasTouch: true });
    await sleep(300);
    const portFit = await desk.page.evaluate(() => {
      const L = __RTF.padLayout();
      const boxes = ['up', 'down', 'left', 'right', 'jump', 'act'].map(id => L[id]);
      const inside = boxes.every(b => b.x >= -2 && b.y >= -2 && b.x + b.w <= innerWidth + 2 && b.y + b.h <= innerHeight + 2);
      const gap = L.act.x - (L.right.x + L.right.w);
      return { inside, gap, land: K.land, w: innerWidth, h: innerHeight, labels: [L.jump.label, L.act.label] };
    });
    if (!portFit.inside || portFit.gap < 4 || portFit.land) fail('portrait pad ' + JSON.stringify(portFit));
    await shot(desk.page, 'phone_portrait_play.png');

    await desk.page.setViewport({ width: 844, height: 390, isMobile: false, hasTouch: true });
    await sleep(300);
    const landFit = await desk.page.evaluate(() => {
      const L = __RTF.padLayout();
      const boxes = ['up', 'down', 'left', 'right', 'jump', 'act'].map(id => L[id]);
      const inside = boxes.every(b => b.x >= -2 && b.y >= -2 && b.x + b.w <= innerWidth + 2 && b.y + b.h <= innerHeight + 2);
      const gap = L.act.x - (L.right.x + L.right.w);
      return { inside, gap, land: K.land, hero: !!__RTF.G.hero };
    });
    if (!landFit.inside || landFit.gap < 4 || !landFit.land || !landFit.hero) fail('landscape pad ' + JSON.stringify(landFit));
    await shot(desk.page, 'phone_landscape_play.png');
    await desk.page.setViewport({ width: 1100, height: 700, isMobile: false, hasTouch: true });
    await sleep(200);

    const story = await runStory(desk.page, 'desktop');
    if (!story) { /* stuck already recorded */ }
    else {
      if (!story.cable || !story.cable.near) fail('desktop cable was not walked ' + JSON.stringify(story.cable));
      if (!story.end.released) fail('desktop did not release ' + JSON.stringify(story.end));
      const counts = story.end.counts;
      ['tape', 'drive', 'files', 'laptop', 'thumb', 'reel'].forEach(c => {
        if (!counts[c] || counts[c].got !== counts[c].total) fail('category ' + c + ' ' + JSON.stringify(counts[c]));
      });
      if (story.end.kids.length !== 5) fail('kids ' + story.end.kids.join(','));
      if (story.end.got.length !== 15) fail('got ' + story.end.got.length);
    }
    const deskErr = realErrors(desk.errors);
    if (deskErr.length) fail('desktop console ' + deskErr.join(' | '));

    await desk.page.goto('http://127.0.0.1:' + PORT + '/?qa=1', { waitUntil: 'domcontentloaded' });
    await desk.page.waitForFunction(() => window.__RTF);
    const kept = await desk.page.evaluate(() => ({ n: Object.keys(__RTF.save.got).length, rel: __RTF.save.released, key: __RTF.SAVEK }));
    if (kept.n !== 15 || !kept.rel) fail('reload lost progress ' + JSON.stringify(kept));
    if (kept.key !== 'ptp3-release-the-files-v1') fail('save key ' + kept.key);
    const dup = await desk.page.evaluate(() => {
      __RTF.startStage(0);
      const before = __RTF.counts().tape.got;
      __RTF.G.hero.x = 8.2 * 32; __RTF.G.hero.y = 320; __RTF.G.hero.onG = true;
      __RTF.doAction();
      return { before, after: __RTF.counts().tape.got };
    });
    if (dup.after !== dup.before) fail('duplicate tape count ' + JSON.stringify(dup));

    await sleep(200);
    await desk.page.evaluate(() => { const b = K.btns.find(q => q.id === 'pause'); if (b) b.cb(); });
    await sleep(80);
    await desk.page.evaluate(() => { const b = K.btns.find(q => q.id === 'map'); if (b) b.cb(); });
    await sleep(80);
    await desk.page.evaluate(() => { const b = K.btns.find(q => q.id === 'back'); if (b) b.cb(); });
    await sleep(80);
    await desk.page.evaluate(() => { const b = K.btns.find(q => q.id === 'reset'); if (b) b.cb(); });
    await sleep(50);
    const erased = await desk.page.evaluate(() => { const b = K.btns.find(q => q.id === 'yes'); if (b) b.cb(); return { got: Object.keys(__RTF.save.got).length, rel: !!__RTF.save.released, yes: !!b, scene: __RTF.scene }; });
    if (!erased.yes || erased.got !== 0 || erased.rel) fail('restart did not clear ' + JSON.stringify(erased));
    await desk.page.close();

    const phone = await open(browser, 390, 844, '?qa=1&reset=1');
    await shot(phone.page, 'phone_portrait_title.png');
    const phoneStory = await runStory(phone.page, 'phone');
    if (!phoneStory || !phoneStory.end.released) fail('phone story did not finish ' + JSON.stringify(phoneStory && phoneStory.end));
    else if (phoneStory.end.got.length !== 15 || phoneStory.end.kids.length !== 5) fail('phone bag ' + phoneStory.end.got.length + ' kids ' + phoneStory.end.kids.length);
    await phone.page.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
    await sleep(250);
    const phoneLand = await phone.page.evaluate(() => ({ scene: __RTF.scene, land: K.land, err: window.__ERR || [] }));
    if (!phoneLand.land) fail('phone did not rotate to landscape');
    await shot(phone.page, 'phone_landscape_ending.png');
    const phoneErr = realErrors(phone.errors);
    if (phoneErr.length) fail('phone console ' + phoneErr.join(' | '));
    await phone.page.close();

    if (fails.length) {
      console.error('PLAY FAIL\n' + fails.map(f => '- ' + f).join('\n'));
      process.exitCode = 1;
    } else console.log('PLAY OK desktop+simulated-phone');
  } catch (e) {
    console.error('PLAY FAIL', e);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    server.kill();
  }
})();
