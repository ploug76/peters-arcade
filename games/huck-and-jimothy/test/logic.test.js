'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../logic.js');

const step = G.step;
const GROUND = G.GROUND;

function boot() {
  const s = G.createState();
  step(s, {}, { action: true }, 1 / 60);
  let guard = 0;
  while (s.mode === 'dialog' && guard++ < 8) step(s, {}, { action: true }, 1 / 60);
  assert.equal(s.mode, 'play');
  return s;
}

function settle(s, n) {
  for (let i = 0; i < (n || 20); i++) step(s, {}, {}, 1 / 60);
}

function drive(s, target) {
  let guard = 0;
  let stuck = 0;
  let last = -9999;
  while (guard++ < 6000) {
    const b = s.ride || s.who === 'jimothy' ? s.jimothy : s.huck;
    if (b.x >= target) return { ok: true, x: b.x };
    const pressed = {};
    if (b.onGround && !G.hasGround(b.x + 42)) pressed.jump = true;
    step(s, { right: true }, pressed, 1 / 60);
    if (Math.abs(b.x - last) < 0.2) stuck++;
    else stuck = 0;
    last = b.x;
    if (stuck > 50) return { ok: false, x: b.x, who: s.who, ride: s.ride };
  }
  const b = s.who === 'jimothy' ? s.jimothy : s.huck;
  return { ok: false, x: b.x, timeout: true };
}

test('swap sends Jimothy out of the backpack and back again', () => {
  const s = boot();
  assert.equal(s.who, 'huck');
  assert.equal(s.jimothyParked, true);
  const swapped = G.doSwap(s);
  assert.equal(swapped.ok, true);
  assert.equal(s.who, 'jimothy');
  assert.equal(s.jimothyParked, false);
  assert.equal(s.message, "It's not stealing if it's in the trash.");
  assert.ok(Math.abs(s.jimothy.x - s.huck.x) < 80);
  const back = G.doSwap(s);
  assert.equal(back.ok, true);
  assert.equal(s.who, 'huck');
  assert.equal(s.jimothyParked, true);
});

test('Huck cannot enter the fence hole and Jimothy can', () => {
  const s = boot();
  s.huck.x = G.LEVEL.squeeze.x - 30;
  s.huck.y = GROUND;
  s.jimothy.x = s.huck.x;
  s.jimothy.y = GROUND;
  s.jimothyParked = true;
  for (let i = 0; i < 180; i++) step(s, { right: true }, {}, 1 / 60);
  assert.ok(s.huck.x < G.LEVEL.squeeze.x + 10, 'huck x ' + s.huck.x);

  G.doSwap(s);
  assert.equal(s.who, 'jimothy');
  for (let i = 0; i < 180; i++) step(s, { right: true }, {}, 1 / 60);
  assert.ok(s.jimothy.x > G.LEVEL.squeeze.x + G.LEVEL.squeeze.w - 10, 'jt x ' + s.jimothy.x);
  assert.equal(s.items.crank, true);
});

test('swap refuses to pull Huck into the fence hole', () => {
  const s = boot();
  s.who = 'jimothy';
  s.jimothyParked = false;
  s.jimothy.x = G.LEVEL.squeeze.x + 40;
  s.jimothy.y = GROUND;
  s.huck.x = G.LEVEL.squeeze.x + 46;
  s.huck.y = GROUND;
  const res = G.doSwap(s);
  assert.equal(res.ok, false);
  assert.equal(s.who, 'jimothy');
  assert.match(s.message, /Too tight/);
});

test('Jimothy digs a battery out of the trash', () => {
  const s = boot();
  s.who = 'jimothy';
  s.jimothyParked = false;
  s.jimothy.x = G.LEVEL.trash[0].x;
  s.jimothy.y = GROUND;
  s.huck.x = s.jimothy.x - 80;
  assert.equal(G.contextLabel(s), 'DIG');
  const dugAt = s.jimothy.x;
  step(s, {}, { action: true }, 1 / 60);
  assert.ok(s.jimothy.dig > 0);
  for (let i = 0; i < 20; i++) step(s, { right: true }, {}, 1 / 60);
  assert.ok(Math.abs(s.jimothy.x - dugAt) < 2, 'dig should plant his feet');
  for (let i = 0; i < 30; i++) step(s, {}, {}, 1 / 60);
  assert.equal(s.items.battery, true);
});

test('Huck sinks in soft sand until he rides Jimothy across', () => {
  const s = boot();
  s.huck.x = G.LEVEL.sand.x - 10;
  s.jimothy.x = s.huck.x;
  s.jimothyParked = true;
  for (let i = 0; i < 90; i++) step(s, { right: true }, {}, 1 / 60);
  assert.ok(s.huck.x <= G.LEVEL.sand.x + 30, 'sank x ' + s.huck.x);
  assert.equal(s.flags.crossedSand, false);
  G.doSwap(s);
  step(s, {}, { action: true }, 1 / 60);
  assert.equal(s.ride, true);
  assert.equal(s.who, 'jimothy');
  let guard = 0;
  while (!s.flags.crossedSand && guard++ < 2000) step(s, { right: true }, {}, 1 / 60);
  assert.equal(s.flags.crossedSand, true);
  assert.equal(s.ride, false);
  assert.equal(s.who, 'huck');
  assert.ok(s.huck.x > G.LEVEL.sand.x + G.LEVEL.sand.w);
});

test('Huck jump, skate, and climb stats differ from Jimothy', () => {
  const s = boot();
  settle(s, 30);
  const before = s.huck.y;
  step(s, {}, { jump: true }, 1 / 60);
  for (let i = 0; i < 20; i++) step(s, {}, {}, 1 / 60);
  assert.ok(s.huck.y < before - 40, 'jump height ' + (before - s.huck.y));

  const fast = G.createState();
  fast.mode = 'play';
  fast.upgrades.stereo = true;
  settle(fast, 30);
  step(fast, {}, { jump: true }, 1 / 60);
  for (let i = 0; i < 20; i++) step(fast, {}, {}, 1 / 60);
  assert.ok(fast.huck.y < s.huck.y, 'stereo jump should go higher');

  const huck = G.statsFor(s, 'huck');
  const jt = G.statsFor(Object.assign(G.createState(), { mode: 'play' }), 'jimothy');
  assert.ok(huck.jump < jt.jump);
  assert.ok(huck.speed > jt.speed);
  s.huckLoco = 'skate';
  assert.ok(G.statsFor(s, 'huck').speed > huck.speed);
});

test('shop spends cans on bike, wax, and stereo', () => {
  const s = boot();
  s.cans = 5;
  assert.equal(G.buy(s, 'bike').ok, true);
  assert.equal(s.upgrades.bike, true);
  assert.equal(s.cans, 0);
  assert.equal(G.buy(s, 'wax').ok, false);
  s.cans = 3;
  assert.equal(G.buy(s, 'wax').ok, true);
  s.cans = 4;
  assert.equal(G.buy(s, 'stereo').ok, true);
});

test('stance foot does not slide and the swing knee bends', () => {
  const D = G.HUCK_SPEC.stride;
  let planted = null;
  for (let i = 0; i <= 8; i++) {
    const p = (i / 8) * 0.45;
    const animDist = p * D * 2;
    const pose = G.poseFor({ animDist: animDist, vx: 140, onGround: true, mode: 'walk' });
    const hip = 200 + animDist;
    const world = hip + pose.legs[0].foot.x;
    if (planted == null) planted = world;
    assert.ok(pose.legs[0].reached, 'leg did not reach at p=' + p);
    assert.ok(Math.abs(world - planted) < 1.25, 'slide ' + world + ' vs ' + planted);
    assert.ok(pose.legs[0].stance);
  }
  const swing = G.poseFor({ animDist: 0.75 * D * 2, vx: 140, onGround: true, mode: 'walk' });
  const knee = G.jointAngle(swing.legs[0].hip, swing.legs[0].knee, swing.legs[0].foot);
  assert.ok(knee < 140, 'swing knee ' + knee);
  const elbow = G.jointAngle(swing.arms[0].shoulder, swing.arms[0].elbow, swing.arms[0].hand);
  assert.ok(elbow < 176, 'elbow ' + elbow);
  const idle = G.poseFor({ animDist: 0, vx: 0, onGround: true, mode: 'walk', animT: 0.2 });
  const idleKnee = G.jointAngle(idle.legs[0].hip, idle.legs[0].knee, idle.legs[0].foot);
  assert.ok(idleKnee < 175, 'idle knee locked ' + idleKnee);
});

test('arms swing opposite the legs', () => {
  const D = G.HUCK_SPEC.stride;
  const pose = G.poseFor({ animDist: 0.08 * D * 2, vx: 150, onGround: true, mode: 'walk' });
  assert.ok(pose.legs[0].foot.x > 1, 'back leg should be forward ' + pose.legs[0].foot.x);
  assert.ok(pose.arms[0].hand.x < -1, 'back arm should be back ' + pose.arms[0].hand.x);
  assert.ok(pose.legs[1].foot.x < -1, 'front leg should be back ' + pose.legs[1].foot.x);
  assert.ok(pose.arms[1].hand.x > 1, 'front arm should be forward ' + pose.arms[1].hand.x);
});

test('skate feet stay on the board', () => {
  const a = G.poseFor({ animDist: 0, vx: 200, onGround: true, mode: 'skate' });
  const b = G.poseFor({ animDist: 80, vx: 200, onGround: true, mode: 'skate' });
  assert.ok(Math.abs(a.legs[0].foot.x - b.legs[0].foot.x) < 0.01);
  assert.ok(a.legs[0].foot.y < -2);
  assert.ok(a.legs[1].foot.y < -2);
});

test('tow swap switches Jeep and board', () => {
  const tow = G.createTow();
  assert.equal(tow.controlling, 'jeep');
  const s = boot();
  s.mode = 'tow';
  s.tow = tow;
  step(s, {}, { swap: true }, 1 / 60);
  assert.equal(s.tow.controlling, 'board');
  assert.match(s.message, /board/i);
  step(s, {}, { swap: true }, 1 / 60);
  assert.equal(s.tow.controlling, 'jeep');
});

test('board rope slack stays limited', () => {
  const tow = G.createTow({ obstacles: [], cans: [], length: 2000, speed: 100 });
  tow.controlling = 'board';
  tow.jeepLane = 0;
  for (let i = 0; i < 180; i++) G.stepTow(tow, { down: true }, 1 / 60, {});
  assert.ok(Math.abs(tow.boardLane - tow.jeepLane) <= 0.551, 'slack ' + tow.boardLane);
  const waxed = G.createTow({ obstacles: [], cans: [], length: 2000, speed: 100 });
  waxed.controlling = 'board';
  for (let i = 0; i < 180; i++) G.stepTow(waxed, { down: true }, 1 / 60, { wax: true });
  assert.ok(waxed.boardLane > tow.boardLane);
});

test('Jeep steer dodges a rock the center line would hit', () => {
  const rock = [{ d: 420, lane: 0, w: 0.3, kind: 'rock' }];
  const hit = G.createTow({ obstacles: rock, cans: [], length: 900, speed: 200, follow: 400 });
  for (let i = 0; i < 160; i++) G.stepTow(hit, {}, 1 / 60, {});
  assert.equal(hit.obstacles[0].jeepHit, true);

  const dodge = G.createTow({ obstacles: rock.map(function (o) { return Object.assign({}, o); }), cans: [], length: 900, speed: 200, follow: 400 });
  for (let i = 0; i < 160; i++) G.stepTow(dodge, { up: true }, 1 / 60, {});
  assert.equal(dodge.obstacles[0].jeepHit, false);
  assert.ok(dodge.dist > 420);
});

test('a late Jeep dodge leaves the board in the rock', () => {
  const tow = G.createTow({
    obstacles: [{ d: 500, lane: 0, w: 0.3, kind: 'rock' }],
    cans: [],
    length: 1200,
    speed: 200,
    follow: 120
  });
  for (let i = 0; i < 280; i++) {
    const held = tow.dist > 410 ? { up: true } : {};
    G.stepTow(tow, held, 1 / 60, {});
  }
  assert.equal(tow.obstacles[0].jeepHit, false);
  assert.equal(tow.obstacles[0].boardHit, true);
  assert.ok(tow.wipeouts >= 1);
});

test('steering the board clears a rock inside the rope', () => {
  const tow = G.createTow({
    obstacles: [{ d: 360, lane: 0, w: 0.22, kind: 'rock' }],
    cans: [],
    length: 800,
    speed: 180,
    follow: 80
  });
  tow.controlling = 'board';
  for (let i = 0; i < 200; i++) G.stepTow(tow, { up: true }, 1 / 60, {});
  assert.equal(tow.obstacles[0].boardHit, false);
});

function threatDist(tow, who) {
  const ahead = who === 'board' ? tow.dist - tow.follow : tow.dist;
  const lane = who === 'board' ? tow.boardLane : tow.jeepLane;
  let best = 1e9;
  for (let i = 0; i < tow.obstacles.length; i++) {
    const ob = tow.obstacles[i];
    const dd = ob.d - ahead;
    if (dd > 8 && dd < 260 && Math.abs(lane - ob.lane) < ob.w + 0.26) best = Math.min(best, dd);
  }
  return best;
}

function towHeldFor(tow, who) {
  const ahead = who === 'board' ? tow.dist - tow.follow : tow.dist;
  const lane = who === 'board' ? tow.boardLane : tow.jeepLane;
  let best = null;
  let bestD = 1e9;
  for (let i = 0; i < tow.obstacles.length; i++) {
    const ob = tow.obstacles[i];
    const dd = ob.d - ahead;
    if (dd > 12 && dd < 250 && dd < bestD && Math.abs(lane - ob.lane) < ob.w + 0.28) {
      best = ob;
      bestD = dd;
    }
  }
  if (!best) return {};
  if (best.lane >= lane) return { up: true, left: true };
  return { down: true, right: true };
}

test('chapter 1 can be finished: backpack, swap, ride, and the tow', () => {
  const s = boot();
  assert.equal(s.jimothyParked, true);
  let run = drive(s, 1600);
  assert.ok(run.ok, 'run to trash approach failed at ' + run.x);

  G.doSwap(s);
  run = drive(s, G.LEVEL.trash[0].x - 10);
  assert.ok(run.ok, 'jt to trash ' + JSON.stringify(run));
  step(s, {}, { action: true }, 1 / 60);
  for (let i = 0; i < 45; i++) step(s, {}, {}, 1 / 60);
  assert.equal(s.items.battery, true);

  run = drive(s, G.LEVEL.lever.x - 8);
  assert.ok(run.ok, 'jt to lever ' + JSON.stringify(run));
  assert.equal(s.items.crank, true);
  step(s, {}, { action: true }, 1 / 60);
  assert.equal(s.items.lever, true);

  G.doSwap(s);
  assert.equal(s.who, 'huck');
  let guard = 0;
  while (!s.jimothyParked && guard++ < 1600) step(s, {}, {}, 1 / 60);
  assert.equal(s.jimothyParked, true, 'jt should hop back in the pack at ' + s.jimothy.x + ' huck ' + s.huck.x);

  run = drive(s, G.LEVEL.sand.x - 60);
  assert.ok(run.ok, 'huck to sand ' + JSON.stringify(run));
  G.doSwap(s);
  assert.equal(s.who, 'jimothy');
  step(s, {}, { action: true }, 1 / 60);
  assert.equal(s.ride, true, s.message);
  guard = 0;
  while (!s.flags.crossedSand && guard++ < 2500) step(s, { right: true }, {}, 1 / 60);
  assert.equal(s.flags.crossedSand, true);
  assert.equal(s.ride, false);

  G.doSwap(s);
  run = drive(s, G.LEVEL.trash[1].x - 6);
  assert.ok(run.ok, 'to tape ' + JSON.stringify(run));
  step(s, {}, { action: true }, 1 / 60);
  for (let i = 0; i < 45; i++) step(s, {}, {}, 1 / 60);
  assert.equal(s.items.mixtape, true);

  run = drive(s, G.LEVEL.jeep.x - 10);
  assert.ok(run.ok, 'to jeep ' + JSON.stringify(run));
  step(s, {}, { action: true }, 1 / 60);
  assert.equal(s.mode, 'dialog');
  guard = 0;
  while (s.mode === 'dialog' && guard++ < 8) step(s, {}, { action: true }, 1 / 60);
  assert.equal(s.mode, 'tow');
  assert.ok(s.tow);

  step(s, {}, { swap: true }, 1 / 60);
  assert.equal(s.tow.controlling, 'board');
  step(s, {}, { swap: true }, 1 / 60);
  assert.equal(s.tow.controlling, 'jeep');

  guard = 0;
  while (s.mode === 'tow' && guard++ < 4000) {
    const want = threatDist(s.tow, 'board') + 20 < threatDist(s.tow, 'jeep') ? 'board' : 'jeep';
    const pressed = want !== s.tow.controlling ? { swap: true } : {};
    step(s, towHeldFor(s.tow, want), pressed, 1 / 60);
  }
  assert.equal(s.tow.done, true);
  assert.equal(s.mode, 'dialog');
  guard = 0;
  while (s.mode === 'dialog' && guard++ < 8) step(s, {}, { action: true }, 1 / 60);
  assert.equal(s.mode, 'ending');
  assert.equal(s.flags.chapterClear, true);
  assert.ok(s.tow.wipeouts < 4, 'wipeouts ' + s.tow.wipeouts);
});
