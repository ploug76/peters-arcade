/* Browser shell: input, audio, HUD, and the animation loop. */
(function () {
  'use strict';

  const HG = window.HuckGame;
  const HD = window.HuckDraw;
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const SAVE_KEY = 'pa-test-huck-jimothy-ch1';
  const MUTE_KEY = 'pa-test-huck-jimothy-mute';

  const state = HG.createState();
  const held = { left: false, right: false, up: false, down: false };
  const keys = { left: false, right: false, up: false, down: false };
  const swipe = { left: false, right: false, up: false, down: false };
  const pressed = { jump: false, action: false, swap: false, pause: false, start: false };
  const pointers = new Map();

  let muted = false;
  try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { muted = false; }
  let ac = null;
  let last = 0;
  let acc = 0;

  const ui = {
    hud: document.getElementById('hud'),
    who: document.getElementById('who-chip'),
    obj: document.getElementById('obj'),
    cans: document.getElementById('cans'),
    toast: document.getElementById('toast'),
    dialog: document.getElementById('dialog'),
    dlgWho: document.getElementById('dlg-who'),
    dlgText: document.getElementById('dlg-text'),
    start: document.getElementById('start-screen'),
    continueBtn: document.getElementById('btn-continue'),
    shop: document.getElementById('shop'),
    shopCans: document.getElementById('shop-cans'),
    shopMsg: document.getElementById('shop-msg'),
    pause: document.getElementById('pause-screen'),
    ending: document.getElementById('ending'),
    endText: document.getElementById('end-text'),
    touch: document.getElementById('touch'),
    act: document.getElementById('btn-act'),
    left: document.getElementById('btn-left'),
    right: document.getElementById('btn-right'),
    up: document.getElementById('btn-up'),
    jump: document.getElementById('btn-jump'),
    mute: document.getElementById('btn-mute')
  };

  function hasSave() {
    try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
  }

  function snapshot() {
    return {
      v: 1,
      who: state.who,
      ride: state.ride,
      cans: state.cans,
      canList: state.canList.map(function (c) { return c.taken; }),
      upgrades: state.upgrades,
      items: state.items,
      flags: state.flags,
      jimothyParked: state.jimothyParked,
      huckLoco: state.huckLoco,
      checkpoint: state.checkpoint,
      huck: { x: state.huck.x, y: state.huck.y, facing: state.huck.facing },
      jimothy: { x: state.jimothy.x, y: state.jimothy.y, facing: state.jimothy.facing },
      mode: 'play'
    };
  }

  function save() {
    if (state.mode === 'title' || state.mode === 'ending') return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot())); } catch (e) {}
  }

  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || data.v !== 1) return false;
      state.who = data.who;
      state.ride = !!data.ride;
      state.cans = data.cans || 0;
      state.upgrades = data.upgrades || state.upgrades;
      state.items = data.items || state.items;
      state.flags = Object.assign(state.flags, data.flags || {});
      state.jimothyParked = data.jimothyParked !== false;
      state.huckLoco = data.huckLoco || 'walk';
      state.checkpoint = data.checkpoint || HG.LEVEL.startX;
      state.huck.x = data.huck.x;
      state.huck.y = data.huck.y;
      state.huck.facing = data.huck.facing || 1;
      state.jimothy.x = data.jimothy.x;
      state.jimothy.y = data.jimothy.y;
      state.jimothy.facing = data.jimothy.facing || 1;
      if (data.canList && data.canList.length === state.canList.length) {
        data.canList.forEach(function (t, i) { state.canList[i].taken = !!t; });
      }
      state.mode = 'play';
      state.objective = HG.nextObjective(state);
      return true;
    } catch (e) {
      return false;
    }
  }

  function beep(freq, dur, type, gain) {
    if (muted) return;
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = type || 'square';
      o.frequency.value = freq;
      g.gain.value = gain || 0.04;
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
      o.connect(g);
      g.connect(ac.destination);
      o.start();
      o.stop(ac.currentTime + dur);
    } catch (e) {}
  }

  function playSfx(name) {
    if (name === 'jump') beep(520, 0.08, 'square', 0.035);
    else if (name === 'swap') beep(340, 0.07, 'triangle', 0.04);
    else if (name === 'can') beep(880, 0.06, 'square', 0.03);
    else if (name === 'dig') { beep(180, 0.1, 'sawtooth', 0.03); beep(240, 0.08, 'square', 0.02); }
    else if (name === 'lever') beep(220, 0.12, 'square', 0.04);
    else if (name === 'ride') beep(160, 0.14, 'triangle', 0.04);
    else if (name === 'fall') beep(90, 0.2, 'sawtooth', 0.03);
    else if (name === 'honk') beep(140, 0.12, 'square', 0.05);
    else if (name === 'engine') beep(90, 0.2, 'sawtooth', 0.03);
    else if (name === 'win') { beep(523, 0.12, 'triangle', 0.04); setTimeout(function () { beep(659, 0.12, 'triangle', 0.04); }, 120); setTimeout(function () { beep(784, 0.18, 'triangle', 0.04); }, 240); }
  }

  function drainSfx() {
    while (state.sfx.length) playSfx(state.sfx.shift());
  }

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.view = { w: w, h: h, dpr: dpr, padBottom: touchHeight() };
  }

  function touchHeight() {
    if (!ui.touch || ui.touch.hidden) return 0;
    if (window.innerHeight > window.innerWidth) return 118;
    return 0;
  }

  function syncHeld() {
    held.left = keys.left || swipe.left;
    held.right = keys.right || swipe.right;
    held.up = keys.up || swipe.up;
    held.down = keys.down || swipe.down;
  }
  function refreshHeld() { syncHeld(); }

  function bindHold(btn, key) {
    if (!btn) return;
    function down(e) {
      e.preventDefault();
      window.__HUCK.lastPointer = e.pointerType || 'mouse';
      try { btn.setPointerCapture(e.pointerId); } catch (err) {}
      pointers.set(e.pointerId, key);
      refreshHeld();
      if (key === 'jump') {
        if (state.mode === 'tow') pressed.action = true;
        else pressed.jump = true;
      }
      if (key === 'action') pressed.action = true;
      if (key === 'swap') pressed.swap = true;
    }
    function up(e) {
      pointers.delete(e.pointerId);
      refreshHeld();
    }
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
  }

  bindHold(document.getElementById('btn-jump'), 'jump');
  bindHold(document.getElementById('btn-act'), 'action');
  bindHold(document.getElementById('btn-swap'), 'swap');

  document.addEventListener('keydown', function (e) {
    if (e.repeat) return;
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { keys.left = true; e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') { keys.right = true; e.preventDefault(); }
    else if (k === 'ArrowUp' || k === 'w' || k === 'W') { keys.up = true; e.preventDefault(); }
    else if (k === 'ArrowDown' || k === 's' || k === 'S') { keys.down = true; e.preventDefault(); }
    else if (k === ' ' || k === 'z' || k === 'Z') { pressed.jump = true; e.preventDefault(); }
    else if (k === 'x' || k === 'X' || k === 'Enter') { pressed.action = true; e.preventDefault(); }
    else if (k === 'c' || k === 'C' || k === 'q' || k === 'Q') { pressed.swap = true; e.preventDefault(); }
    else if (k === 'p' || k === 'P' || k === 'Escape') { pressed.pause = true; e.preventDefault(); }
    syncHeld();
  });
  document.addEventListener('keyup', function (e) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.left = false;
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.right = false;
    else if (k === 'ArrowUp' || k === 'w' || k === 'W') keys.up = false;
    else if (k === 'ArrowDown' || k === 's' || k === 'S') keys.down = false;
    syncHeld();
  });
  window.addEventListener('blur', function () {
    keys.left = keys.right = keys.up = keys.down = false;
    fingers.clear();
    recomputeSwipe();
    pointers.clear();
  });

  const fingers = new Map();
  function dirsOf(ox, oy, x, y) {
    const dx = x - ox, dy = y - oy, out = { left: false, right: false, up: false, down: false };
    if (Math.hypot(dx, dy) < 16) return out;
    const s = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
    if (s === 0 || s === 1 || s === -1) out.right = true;
    if (s === 4 || s === -4 || s === 3 || s === -3) out.left = true;
    if (s === 2 || s === 1 || s === 3) out.down = true;
    if (s === -2 || s === -1 || s === -3) out.up = true;
    return out;
  }
  function recomputeSwipe() {
    swipe.left = swipe.right = swipe.up = swipe.down = false;
    fingers.forEach(function (f) {
      const d = dirsOf(f.ox, f.oy, f.x, f.y);
      if (d.left) swipe.left = true;
      if (d.right) swipe.right = true;
      if (d.up) swipe.up = true;
      if (d.down) swipe.down = true;
    });
    syncHeld();
  }
  function playingNow() { return state.mode === 'play' || state.mode === 'tow'; }
  canvas.addEventListener('pointerdown', function (e) {
    if (!playingNow()) return;
    if (e.target.closest && e.target.closest('button, a')) return;
    fingers.set(e.pointerId, { ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY });
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    recomputeSwipe();
  });
  canvas.addEventListener('pointermove', function (e) {
    const f = fingers.get(e.pointerId);
    if (!f) return;
    f.x = e.clientX;
    f.y = e.clientY;
    recomputeSwipe();
  });
  function endFinger(e) {
    if (!fingers.has(e.pointerId)) return;
    fingers.delete(e.pointerId);
    recomputeSwipe();
  }
  canvas.addEventListener('pointerup', endFinger);
  canvas.addEventListener('pointercancel', endFinger);

  function arm(el, flag) {
    function go(e) {
      if (e.pointerType && e.button) return;
      pressed[flag] = true;
    }
    el.addEventListener('pointerup', go);
    el.addEventListener('click', go);
  }
  arm(document.getElementById('btn-start'), 'start');
  ui.continueBtn.addEventListener('click', function () {
    loadSave();
  });
  arm(document.getElementById('btn-next'), 'action');
  ui.dialog.addEventListener('pointerdown', function () {
    pressed.action = true;
  });
  document.getElementById('btn-pause').addEventListener('click', function () {
    pressed.pause = true;
  });
  document.getElementById('btn-resume').addEventListener('click', function () {
    pressed.pause = true;
  });
  ui.mute.addEventListener('click', function () {
    muted = !muted;
    try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) {}
    sync();
  });
  document.getElementById('btn-shop-close').addEventListener('click', function () {
    HG.closeShop(state);
    sync();
  });
  document.getElementById('btn-replay').addEventListener('click', function () {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
    HG.reset(state);
    sync();
  });
  document.querySelectorAll('[data-buy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const res = HG.buy(state, btn.getAttribute('data-buy'));
      ui.shopMsg.textContent = res.msg;
      save();
      sync();
    });
  });

  function whoLabel() {
    if (state.mode === 'tow' && state.tow) {
      return state.tow.controlling === 'jeep' ? 'YOU: JEEP' : 'YOU: BOARD';
    }
    if (state.ride) return 'YOU: J.T.  ·  Huck is riding';
    if (state.who === 'jimothy') return 'YOU: J.T.';
    return 'YOU: HUCK';
  }

  function sync() {
    const title = state.mode === 'title';
    const playing = state.mode === 'play' || state.mode === 'tow';
    ui.start.hidden = !title;
    ui.continueBtn.hidden = !hasSave();
    ui.hud.hidden = title;
    ui.touch.hidden = !playing;
    ui.dialog.hidden = state.mode !== 'dialog';
    ui.shop.hidden = state.mode !== 'shop';
    ui.pause.hidden = state.mode !== 'pause';
    ui.ending.hidden = state.mode !== 'ending';
    ui.who.textContent = whoLabel();
    ui.obj.textContent = state.objective || '';
    ui.cans.textContent = 'Cans ' + state.cans;
    ui.toast.textContent = state.messageT > 0 ? state.message : '';
    ui.toast.classList.toggle('show', state.messageT > 0);
    ui.mute.textContent = muted ? 'Sound off' : 'Sound on';
    ui.mute.setAttribute('aria-pressed', muted ? 'true' : 'false');
    if (state.mode === 'dialog' && state.dialog) {
      const line = state.dialog.lines[state.dialog.i];
      ui.dlgWho.textContent = line ? line.who : '';
      ui.dlgText.textContent = line ? line.text : '';
    }
    if (state.mode === 'tow') {
      ui.jump.textContent = 'HONK';
      ui.act.textContent = 'HONK';
    } else {
      ui.jump.textContent = 'JUMP';
      ui.act.textContent = HG.contextLabel(state);
    }
    if (state.mode === 'shop') {
      ui.shopCans.textContent = 'Cans to spend: ' + state.cans;
      document.querySelectorAll('[data-buy]').forEach(function (btn) {
        const id = btn.getAttribute('data-buy');
        const item = HG.SHOP.find(function (s) { return s.id === id; });
        btn.disabled = !!(state.upgrades[id] || state.cans < item.cost);
        btn.textContent = state.upgrades[id] ? item.name + ' — owned' : item.name + ' — ' + item.cost + ' cans';
      });
    }
    if (state.mode === 'ending') {
      const bits = ['Cans left: ' + state.cans];
      if (state.upgrades.wax) bits.push('Board wax packed');
      if (state.upgrades.bike) bits.push('BMX unlocked');
      if (state.upgrades.stereo) bits.push('Stereo packed');
      if (state.tow) bits.push('Wipeouts on the tow: ' + state.tow.wipeouts);
      ui.endText.textContent = bits.join('  ·  ');
    }
    document.body.dataset.mode = state.mode;
  }

  function frame(ts) {
    if (!last) last = ts;
    let dt = (ts - last) / 1000;
    last = ts;
    if (dt > 0.1) dt = 0.1;
    const scale = window.__HUCK.timeScale || 1;
    acc += dt * scale;
    const step = 1 / 60;
    let n = 0;
    const cap = scale > 1 ? 8 : 4;
    while (acc >= step && n < cap) {
      const edge = {
        jump: pressed.jump,
        action: pressed.action,
        swap: pressed.swap,
        pause: pressed.pause,
        start: pressed.start
      };
      pressed.jump = pressed.action = pressed.swap = pressed.pause = pressed.start = false;
      HG.step(state, held, edge, step);
      drainSfx();
      acc -= step;
      n += 1;
    }
    state.view = state.view || { w: window.innerWidth, h: window.innerHeight, padBottom: 0 };
    state.view.padBottom = touchHeight();
    HD.render(ctx, state.view.w, state.view.h, state, state.view);
    sync();
    if (n && state.mode === 'play' && Math.floor(state.time * 2) !== Math.floor((state.time - n * step) * 2)) save();
    requestAnimationFrame(frame);
  }

  window.__HUCK = {
    state: state,
    held: held,
    pressed: pressed,
    timeScale: 1,
    lastPointer: 'none',
    save: save,
    loadSave: loadSave,
    reset: function () { HG.reset(state); }
  };

  window.addEventListener('resize', resize);
  resize();
  sync();
  requestAnimationFrame(frame);
})();
