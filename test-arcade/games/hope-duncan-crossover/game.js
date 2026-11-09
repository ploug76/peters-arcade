import { TIMING, controlLayout } from './mechanics.js';
import { createTapCombo } from './tap.js';
import { beginForgiveness, createWorld, goals, goalsMet, queuePunches, stepWorld } from './world.js';
import { drawFrame, syncGait } from './draw.js';
import { RD, mkGait, stepGait } from './verified-rig.js';

const $ = id => document.getElementById(id);
const cv = $('cv');
const ctx = cv.getContext('2d');
const keys = {};
const TOUCH = new Map();
let world = createWorld();
let mode = 'title';
let last = performance.now();
let dpr = 1;
let land = true;

const tap = createTapCombo({
  windowMs: TIMING.tapWindowMs,
  onSingle() { queuePunches(world, 1); },
  onDouble() { queuePunches(world, 2); },
  onTriple() { return beginForgiveness(world); }
});

function fresh() {
  world = createWorld();
  world.onAttackEnd = () => tap.unlock();
  world.onSwitch = () => tap.reset();
  tap.reset();
}
fresh();

function resize() {
  const vv = window.visualViewport;
  let w = innerWidth, h = innerHeight;
  if (vv) { w = Math.min(w, vv.width); h = Math.min(h, vv.height); }
  w = Math.max(1, Math.round(w));
  h = Math.max(1, Math.round(h));
  const lay = controlLayout(w, h);
  land = !lay.portrait;
  dpr = Math.min(2, devicePixelRatio || 1);
  const ch = lay.split && mode === 'play' ? Math.round(h * lay.canvasFrac) : h;
  document.body.classList.toggle('portrait', lay.portrait);
  syncChrome();
  cv.style.height = ch + 'px';
  cv.width = Math.round(w * dpr);
  cv.height = Math.round(ch * dpr);
}
addEventListener('resize', resize);
if (window.visualViewport) visualViewport.addEventListener('resize', resize);
resize();

function swipeDir(t) {
  const dx = t.x - t.ax, dy = t.y - t.ay, d = Math.hypot(dx, dy), o = {};
  if (d < 14) return o;
  if (d > 44) { t.ax = t.x - dx / d * 44; t.ay = t.y - dy / d * 44; }
  const s = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
  if (s === 0 || s === 1 || s === -1) o.R = 1;
  if (s === 4 || s === -4 || s === 3 || s === -3) o.L = 1;
  if (s === 2 || s === 1 || s === 3) o.D = 1;
  if (s === -2 || s === -1 || s === -3) o.U = 1;
  return o;
}
function isButton(el) { return el && el.closest && el.closest('button'); }
addEventListener('pointerdown', e => {
  if (mode !== 'play' || isButton(e.target)) return;
  TOUCH.set(e.pointerId, {x: e.clientX, y: e.clientY, ax: e.clientX, ay: e.clientY, ox: e.clientX, oy: e.clientY, z: {}});
  e.preventDefault();
}, {passive: false});
addEventListener('pointermove', e => {
  const t = TOUCH.get(e.pointerId);
  if (!t) return;
  t.x = e.clientX;
  t.y = e.clientY;
  const wasU = t.z.U;
  t.z = swipeDir(t);
  if (t.z.U && !wasU) edge.jump = true;
}, {passive: false});
function dropPointer(e) { TOUCH.delete(e.pointerId); }
addEventListener('pointerup', dropPointer);
addEventListener('pointercancel', dropPointer);

function touchX() {
  let v = 0;
  for (const t of TOUCH.values()) { if (t.z.L) v -= 1; if (t.z.R) v += 1; }
  return Math.max(-1, Math.min(1, v));
}
function touchRun() {
  for (const t of TOUCH.values()) if (Math.abs(t.x - t.ox) > 80) return true;
  return false;
}

const edge = {jump: false, pray: false, grace: false, lasso: false, act: false, switch: false, punch: false};
function punchOrAct() {
  if (world.who === 'hope') tap.press(performance.now());
  else edge.act = true;
}
function bind(id, fn) {
  $(id).addEventListener('pointerdown', e => {
    e.preventDefault();
    e.stopPropagation();
    if (mode !== 'play') return;
    fn();
  }, {passive: false});
}
bind('bJump', () => { edge.jump = true; });
bind('bPunch', punchOrAct);
bind('bPray', () => { edge.pray = true; });
bind('bGrace', () => { edge.grace = true; });
bind('bLasso', () => { edge.lasso = true; });
bind('bSwitch', () => { edge.switch = true; });

addEventListener('keydown', e => {
  if (e.repeat || keys[e.code]) return;
  keys[e.code] = true;
  if (mode !== 'play') return;
  if (e.code === 'Space' || e.code === 'KeyJ' || e.code === 'Enter') { punchOrAct(); e.preventDefault(); }
  if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'KeyK') { edge.jump = true; e.preventDefault(); }
  if (e.code === 'KeyQ') edge.pray = true;
  if (e.code === 'KeyE') edge.grace = true;
  if (e.code === 'KeyF') edge.lasso = true;
  if (e.code === 'KeyC') edge.switch = true;
  if (e.code.startsWith('Arrow')) e.preventDefault();
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k of Object.keys(keys)) keys[k] = false; TOUCH.clear(); });

function inputDir() {
  const k = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
  return Math.max(-1, Math.min(1, k + touchX()));
}

function goalLine() {
  const g = goals(world);
  return [
    (g.prayer ? '[x] ' : '[ ] ') + 'Prayer',
    (g.grace ? '[x] ' : '[ ] ') + 'Grace',
    (g.criminal ? '[x] ' : '[ ] ') + 'Caught',
    (g.umbrella ? '[x] ' : '[ ] ') + 'Umbrella',
    (g.ravine ? '[x] ' : '[ ] ') + 'Ravine',
    (g.forgiven ? '[x] ' : '[ ] ') + 'Forgiveness'
  ].join('   ');
}

function refreshHud() {
  const hope = world.who === 'hope';
  $('who').textContent = (hope ? 'Hope' : 'Constable Duncan') + '   ·   tap window ' + (TIMING.tapWindowMs / 1000).toFixed(2) + 's';
  $('goals').textContent = goalLine();
  let phase = '';
  if (world.pony.phase === 'coil') phase = 'COILING';
  else if (world.pony.phase === 'unroll') phase = world.blast ? 'FORGIVENESS' : 'UNROLLING';
  else if (world.blast) phase = 'FORGIVENESS';
  else if (world.swing) phase = 'SWING';
  else if (world.pony.phase === 'lasso') phase = 'LASSO';
  else if (world.pony.phase === 'punch') phase = 'PUNCH';
  else if (tap.counts().pending) phase = 'PUNCH TAP ' + tap.counts().pending;
  $('phase').textContent = phase;
  $('phase').classList.toggle('on', !!phase);
  $('keys').textContent = hope
    ? 'Keys: ← → move, Shift run, ↑ jump, Space punch (1 / 2 / 3 taps), Q prayer, E grace, F lasso, C switch.   Touch: swipe to move, swipe up jumps, PUNCH / PRAY / GRACE / LASSO / SWITCH.'
    : 'Keys: ← → move, Shift run, ↑ jump, Space ACTION busts, C switch.   Duncan keeps walk, run, jump, and the original bust ranges. Prayer, grace, and the lasso stay Hope’s.';
  $('bPunch').textContent = hope ? 'PUNCH' : 'ACTION';
  for (const id of ['bPray', 'bGrace', 'bLasso']) $(id).classList.toggle('dim', !hope);
  $('hint').innerHTML = hope
    ? 'SWIPE &amp; HOLD TO MOVE · LONG SWIPE RUNS · SWIPE UP JUMPS<br>PUNCH ×3 coils then unrolls · contact forgives'
    : 'SWIPE &amp; HOLD TO MOVE · LONG SWIPE RUNS · SWIPE UP JUMPS<br>ACTION busts a crook or folds the umbrella';
}

function syncChrome() {
  $('title').hidden = mode !== 'title';
  $('hud').hidden = mode !== 'play';
  $('pad').hidden = mode !== 'play';
  document.body.classList.toggle('playing', mode === 'play');
}
function startPlay() {
  fresh();
  mode = 'play';
  $('win').hidden = true;
  resize();
  syncChrome();
  refreshHud();
}
$('bStart').onclick = startPlay;
$('bAgain').onclick = startPlay;

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (mode === 'play') {
    tap.tick(now);
    const input = {
      dir: inputDir(),
      run: !!(keys.ShiftLeft || keys.ShiftRight || touchRun()),
      jump: edge.jump,
      pray: edge.pray,
      grace: edge.grace,
      lasso: edge.lasso,
      act: edge.act,
      switchToggle: edge.switch
    };
    edge.jump = edge.pray = edge.grace = edge.lasso = edge.act = edge.switch = false;
    stepWorld(world, dt, input);
    syncGait(world, dt, stepGait, mkGait, RD);
    if (goalsMet(world)) {
      if (!world._wonAt) world._wonAt = world.t;
      if (!world._won && world.t - world._wonAt > 1.25) {
        world._won = true;
        $('winText').textContent = 'Hope and Duncan cleared the evil, caught the criminal, folded the umbrella, crossed the ravine, and forgiveness landed.';
        $('win').hidden = false;
      }
    }
    refreshHud();
  }
  const w = cv.width / dpr, h = cv.height / dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawFrame(ctx, world, w, h, land && mode === 'play' ? true : w > h);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.__xo = {
  get world() { return world; },
  get mode() { return mode; },
  goals: () => goals(world),
  start: startPlay,
  tap,
  edge
};
