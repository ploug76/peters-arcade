const { test, expect } = require('@playwright/test');
const L = require('../logic');

const KEY = { N: 'ArrowUp', E: 'ArrowRight', S: 'ArrowDown', W: 'ArrowLeft' };
const BTN = { N: '#btnU', E: '#btnR', S: '#btnD', W: '#btnL' };

async function press(page, locator, testInfo) {
  if (testInfo.project.use.hasTouch) await locator.tap();
  else await locator.click();
}

async function walkTo(page, target, testInfo) {
  const body = page.locator('body');
  for (let n = 0; n < 40; n++) {
    const pos = await body.evaluate(function (el) {
      return { x: +el.dataset.x, y: +el.dataset.y, area: +el.dataset.area };
    });
    const path = L.pathBetween(L.AREAS[pos.area].map, pos, target);
    if (!path.length) return;
    const d = path[0];
    const step = L.STEP[d];
    if (testInfo.project.use.hasTouch) await press(page, page.locator(BTN[d]), testInfo);
    else await page.keyboard.press(KEY[d]);
    await expect(body).toHaveAttribute('data-x', String(pos.x + step.x));
    await expect(body).toHaveAttribute('data-y', String(pos.y + step.y));
  }
  throw new Error('could not reach ' + target);
}

async function solvePipes(page, testInfo) {
  const area = +(await page.locator('body').getAttribute('data-area'));
  const pz = L.AREAS[area].puzzle;
  const clicks = L.clicksFor(pz);
  const buttons = page.locator('#puzzleBoard button.tile');
  let b = 0;
  for (let i = 0; i < clicks.length; i++) {
    if (!pz.tiles[i]) continue;
    for (let k = 0; k < clicks[i]; k++) await press(page, buttons.nth(b), testInfo);
    b++;
  }
  expect(b).toBe(await buttons.count());
  await expect(page.locator('#puzzleStatus')).toContainText(/reaches the plant/i);
  await press(page, page.locator('#puzzleBack'), testInfo);
  await expect(page.locator('body')).toHaveAttribute('data-screen', 'play');
  await expect(page.locator('body')).toHaveAttribute('data-puzzle', '1');
}

async function solveKit(page, testInfo) {
  const area = +(await page.locator('body').getAttribute('data-area'));
  const swaps = L.kitSwaps(L.AREAS[area].puzzle.order);
  for (const pair of swaps) {
    const pieces = page.locator('#puzzleBoard button.piece');
    await press(page, pieces.nth(pair[0]), testInfo);
    await press(page, pieces.nth(pair[1]), testInfo);
  }
  await expect(page.locator('#puzzleStatus')).toContainText(/lined up/i);
  await press(page, page.locator('#puzzleBack'), testInfo);
  await expect(page.locator('body')).toHaveAttribute('data-puzzle', '1');
}

async function finishTalk(page, testInfo) {
  await expect(page.locator('#talkWho')).toBeVisible();
  await expect(page.locator('#talkLine')).not.toHaveText('');
  for (let n = 0; n < 8; n++) {
    if (await page.locator('#onward').isVisible()) break;
    await press(page, page.locator('#talkNext'), testInfo);
  }
  await expect(page.locator('#onward')).toBeVisible();
  await press(page, page.locator('#onward'), testInfo);
}

function overlaps(a, b) {
  return a.x < b.x + b.width - 1 && a.x + a.width - 1 > b.x && a.y < b.y + b.height - 1 && a.y + a.height - 1 > b.y;
}

test('title screen shows the 21+ notice', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page).toHaveTitle(/Pete's 420 Adventure/);
  await expect(page.getByRole('heading', { name: "Pete's 420 Adventure" })).toBeVisible();
  await expect(page.locator('#ageNotice')).toHaveText('21+ ONLY');
  await expect(page.locator('#ageNotice')).toBeVisible();
  await expect(page.getByRole('button', { name: 'START' })).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-screen', 'title');
});

test('page does not sell anything or name a repo account', async ({ page }) => {
  await page.goto('/index.html');
  const extra = await page.evaluate(async function () {
    const a = await fetch('game.js').then(function (r) { return r.text(); });
    const b = await fetch('logic.js').then(function (r) { return r.text(); });
    return a + '\n' + b;
  });
  const all = (await page.content()) + '\n' + extra;
  expect(all).not.toMatch(/ploug76|github\.com/i);
  expect(all).not.toMatch(/\$\d/);
  expect(all.toLowerCase()).not.toMatch(/\b(buy now|add to cart|checkout|order online)\b/);
});

test('big controls stay on screen and a touch or click steps Pete', async ({ page }, testInfo) => {
  await page.goto('/index.html');
  const vp = page.viewportSize();
  const start = await page.locator('#startBtn').boundingBox();
  expect(start.height).toBeGreaterThanOrEqual(64);
  expect(start.width).toBeGreaterThanOrEqual(64);
  expect(start.x).toBeGreaterThanOrEqual(0);
  expect(start.y).toBeGreaterThanOrEqual(0);
  expect(start.x + start.width).toBeLessThanOrEqual(vp.width + 1);
  expect(start.y + start.height).toBeLessThanOrEqual(vp.height + 1);

  await press(page, page.locator('#startBtn'), testInfo);
  await expect(page.locator('body')).toHaveAttribute('data-screen', 'play');
  await expect(page.locator('#areaName')).toHaveText('Dispensary District');

  const ids = ['#btnL', '#btnU', '#btnD', '#btnR', '#btnA'];
  const boxes = [];
  for (const id of ids) {
    const b = await page.locator(id).boundingBox();
    expect(b, id).toBeTruthy();
    expect(b.width, id).toBeGreaterThanOrEqual(64);
    expect(b.height, id).toBeGreaterThanOrEqual(64);
    expect(b.x, id).toBeGreaterThanOrEqual(-1);
    expect(b.y, id).toBeGreaterThanOrEqual(-1);
    expect(b.x + b.width, id).toBeLessThanOrEqual(vp.width + 1);
    expect(b.y + b.height, id).toBeLessThanOrEqual(vp.height + 1);
    boxes.push(b);
  }
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      expect(overlaps(boxes[i], boxes[j]), ids[i] + ' overlaps ' + ids[j]).toBeFalsy();
    }
  }
  const view = await page.locator('#view').boundingBox();
  const cx = view.x + view.width / 2;
  const cy = view.y + view.height / 2;
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i];
    const inside = cx >= b.x && cx <= b.x + b.width && cy >= b.y && cy <= b.y + b.height;
    expect(inside, ids[i] + ' covers the playfield center').toBeFalsy();
  }

  const x0 = +(await page.locator('body').getAttribute('data-x'));
  await press(page, page.locator('#btnR'), testInfo);
  await expect(page.locator('body')).toHaveAttribute('data-x', String(x0 + 1));
});

test('solves the water puzzle, meets the budtender, and enters the grow house', async ({ page }, testInfo) => {
  await page.goto('/index.html');
  await press(page, page.locator('#startBtn'), testInfo);
  await walkTo(page, 'b', testInfo);
  await expect(page.locator('#btnA')).toHaveText('PUZZLE');
  await press(page, page.locator('#btnA'), testInfo);
  await expect(page.locator('#puzzleTitle')).toHaveText('Water Line');
  const tile = page.locator('#puzzleBoard button.tile').first();
  const box = await tile.boundingBox();
  const vp = page.viewportSize();
  expect(box.width).toBeGreaterThanOrEqual(64);
  expect(box.height).toBeGreaterThanOrEqual(64);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(vp.height + 1);

  await solvePipes(page, testInfo);
  await walkTo(page, 'c', testInfo);
  await expect(page.locator('#btnA')).toHaveText('TALK');
  await press(page, page.locator('#btnA'), testInfo);
  await expect(page.locator('#talkWho')).toHaveText('BUDTENDER');
  await expect(page.locator('#talkLine')).toContainText(/plant/i);
  await finishTalk(page, testInfo);
  await expect(page.locator('body')).toHaveAttribute('data-screen', 'play');
  await expect(page.locator('body')).toHaveAttribute('data-area', '1');
  await expect(page.locator('#areaName')).toHaveText('Grow House');
  await expect(page.locator('#bag')).toContainText('Seed Pouch');
});

test('finishes the grow house, the lounge kit, and the ending', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'full clear is covered on desktop; phones cover the first area');
  await page.goto('/index.html');
  await press(page, page.locator('#startBtn'), testInfo);

  await walkTo(page, 'b', testInfo);
  await press(page, page.locator('#btnA'), testInfo);
  await solvePipes(page, testInfo);
  await walkTo(page, 'c', testInfo);
  await press(page, page.locator('#btnA'), testInfo);
  await finishTalk(page, testInfo);

  await walkTo(page, 'b', testInfo);
  await press(page, page.locator('#btnA'), testInfo);
  await expect(page.locator('#puzzleTitle')).toHaveText('Light Line');
  await solvePipes(page, testInfo);
  await walkTo(page, 'c', testInfo);
  await press(page, page.locator('#btnA'), testInfo);
  await expect(page.locator('#talkWho')).toHaveText('GROWER');
  await finishTalk(page, testInfo);
  await expect(page.locator('#areaName')).toHaveText('Chill Lounge');
  await expect(page.locator('#bag')).toContainText('Lounge Token');

  await walkTo(page, 'b', testInfo);
  await press(page, page.locator('#btnA'), testInfo);
  await expect(page.locator('#puzzleTitle')).toHaveText('Lounge Kit');
  await solveKit(page, testInfo);
  await walkTo(page, 'c', testInfo);
  await press(page, page.locator('#btnA'), testInfo);
  await expect(page.locator('#talkWho')).toHaveText('HOST');
  await finishTalk(page, testInfo);

  await expect(page.locator('body')).toHaveAttribute('data-screen', 'end');
  await expect(page.getByRole('heading', { name: 'Chill Complete' })).toBeVisible();
  await expect(page.locator('#endBag')).toContainText('Chill Stamp');
  await expect(page.locator('#endAge')).toHaveText('21+ ONLY');
});

test('saves desktop, phone portrait, and phone landscape screenshots', async ({ page }, testInfo) => {
  const name = testInfo.project.name;
  await page.goto('/index.html');
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'shots/' + name + '-title.png' });
  await press(page, page.locator('#startBtn'), testInfo);
  await page.waitForTimeout(280);
  await page.screenshot({ path: 'shots/' + name + '-play.png' });
  if (name !== 'desktop') return;
  await walkTo(page, 'b', testInfo);
  await press(page, page.locator('#btnA'), testInfo);
  await page.waitForTimeout(120);
  await page.screenshot({ path: 'shots/desktop-puzzle.png' });
  await solvePipes(page, testInfo);
  await walkTo(page, 'c', testInfo);
  await press(page, page.locator('#btnA'), testInfo);
  await page.waitForTimeout(120);
  await page.screenshot({ path: 'shots/desktop-meet.png' });
});
