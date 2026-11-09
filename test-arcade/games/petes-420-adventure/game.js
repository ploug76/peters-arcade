/* Pete's 420 Adventure — drawing, input, and screens.
   Rooms, puzzles, and dialogue live in logic.js. This file is the player. */
(function () {
  'use strict';
  var L = window.P420;
  if (!L) return;
  L.selfCheck();

  var AREAS = L.AREAS;
  var $ = function (id) { return document.getElementById(id); };
  var canvas = $('c');
  var ctx = canvas.getContext('2d');
  var controls = $('controls');
  var toast = $('toast');
  var toastTimer = 0;
  var held = {};
  var state = blankState();

  function blankState() {
    return {
      screen: 'title',
      area: 0,
      x: 1,
      y: 1,
      px: 1,
      py: 1,
      facing: 1,
      stepN: 0,
      bag: [],
      saved: AREAS.map(freshArea),
      talk: null,
      kitSel: null,
      actx: null,
      muted: false,
      viewW: 0,
      viewH: 0
    };
  }

  function freshArea(area) {
    var pz = area.puzzle;
    return {
      puzzleDone: false,
      met: false,
      rots: pz.kind === 'pipes' ? pz.tiles.map(function (t) { return t ? t.rot : 0; }) : null,
      kit: pz.kind === 'kit' ? pz.order.slice() : null
    };
  }

  function area() { return AREAS[state.area]; }
  function prog() { return state.saved[state.area]; }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function ac() {
    if (state.muted) return null;
    var C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    if (!state.actx) state.actx = new C();
    if (state.actx.state === 'suspended') state.actx.resume();
    return state.actx;
  }

  function tone(freq, dur, type, delay) {
    var a = ac();
    if (!a) return;
    var o = a.createOscillator();
    var g = a.createGain();
    o.type = type || 'square';
    o.frequency.value = freq;
    g.gain.value = 0.045;
    o.connect(g);
    g.connect(a.destination);
    var t0 = a.currentTime + (delay || 0);
    o.start(t0);
    g.gain.setValueAtTime(0.045, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.stop(t0 + dur + 0.02);
  }

  function blip() { tone(660, 0.06, 'square'); }
  function goodTune() {
    tone(523, 0.08, 'square', 0);
    tone(659, 0.08, 'square', 0.09);
    tone(784, 0.12, 'square', 0.18);
  }

  function note(text) {
    toast.textContent = text;
    toast.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('on'); }, 1600);
  }

  function sync() {
    var a = area();
    var p = prog();
    document.body.dataset.screen = state.screen;
    document.body.dataset.x = String(state.x);
    document.body.dataset.y = String(state.y);
    document.body.dataset.area = String(state.area);
    document.body.dataset.areaId = a.id;
    document.body.dataset.puzzle = p.puzzleDone ? '1' : '0';
    document.body.dataset.bag = state.bag.map(function (it) { return it.name; }).join(', ');
    $('areaName').textContent = a.name;
    var goal = !p.puzzleDone ? a.goalPuzzle : a.goalMeet;
    $('goal').textContent = goal;
    $('bag').textContent = state.bag.length ? 'Bag: ' + state.bag.map(function (it) { return it.name; }).join(' · ') : 'Bag: empty';
    var label = actionLabel();
    var btn = $('btnA');
    btn.textContent = label;
    btn.setAttribute('aria-label', label === 'PUZZLE' ? 'Open puzzle' : label === 'TALK' ? 'Talk' : 'Look');
  }

  function setScreen(name) {
    state.screen = name;
    if (name !== 'play') releaseHolds();
    sync();
    fit();
  }

  function placePete(i) {
    var spot = L.findChar(AREAS[i].map, 'P');
    state.area = i;
    state.x = state.px = spot.x;
    state.y = state.py = spot.y;
    state.facing = 1;
  }

  function resetGame() {
    var muted = state.muted;
    var actx = state.actx;
    state = blankState();
    state.muted = muted;
    state.actx = actx;
  }

  function startGame() {
    resetGame();
    placePete(0);
    setScreen('play');
    goodTune();
  }

  function spots() {
    var map = area().map;
    var out = [];
    ['N', 'E', 'S', 'W'].forEach(function (d) {
      var nx = state.x + L.STEP[d].x;
      var ny = state.y + L.STEP[d].y;
      if (ny < 0 || ny >= map.length || nx < 0 || nx >= map[0].length) return;
      var ch = map[ny][nx];
      if (ch === 'b' || ch === 'w' || ch === 'c') out.push(ch);
    });
    return out;
  }

  function actionLabel() {
    var s = spots();
    if (s.indexOf('b') >= 0 && !prog().puzzleDone) return 'PUZZLE';
    if (s.indexOf('c') >= 0 || s.indexOf('w') >= 0) return 'TALK';
    return 'LOOK';
  }

  function move(dx, dy) {
    if (state.screen !== 'play') return;
    var nx = state.x + dx;
    var ny = state.y + dy;
    if (!L.walkable(area().map, nx, ny)) {
      tone(140, 0.04, 'square');
      return;
    }
    state.x = nx;
    state.y = ny;
    if (dx) state.facing = dx < 0 ? -1 : 1;
    state.stepN++;
    sync();
    tone(220 + (state.stepN % 2) * 40, 0.03, 'square');
  }

  function doAction() {
    if (state.screen !== 'play') return;
    var s = spots();
    if (s.indexOf('b') >= 0 && !prog().puzzleDone) { openPuzzle(); return; }
    if (s.indexOf('c') >= 0) { openTalk(area().right, 'right'); return; }
    if (s.indexOf('w') >= 0) { openTalk(area().wrong, 'wrong'); return; }
    if (s.indexOf('b') >= 0) { note('Already hooked up.'); return; }
    note('Nothing here but good lighting.');
  }

  function giveItem(item) {
    if (!item) return;
    if (state.bag.some(function (it) { return it.id === item.id; })) return;
    state.bag.push(item);
  }

  function openTalk(who, kind) {
    var lines;
    var onward = null;
    if (kind === 'wrong') lines = who.lines.slice();
    else if (!prog().puzzleDone) lines = who.before.slice();
    else {
      lines = who.after.slice();
      onward = who.next;
      giveItem(who.item);
    }
    state.talk = { role: who.role, lines: lines, i: 0, onward: onward };
    renderTalk();
    setScreen('talk');
    blip();
  }

  function renderTalk() {
    var t = state.talk;
    var last = t.i >= t.lines.length - 1;
    $('talkWho').textContent = t.role.toUpperCase();
    $('talkLine').textContent = t.lines[t.i];
    $('talkNext').hidden = last;
    $('talkOk').hidden = !(last && !t.onward);
    $('onward').hidden = !(last && t.onward);
    if (t.onward) $('onward').textContent = t.onward;
  }

  function talkNext() {
    if (!state.talk || state.talk.i >= state.talk.lines.length - 1) return;
    state.talk.i++;
    renderTalk();
    blip();
  }

  function talkClose() {
    state.talk = null;
    setScreen('play');
  }

  function goOn() {
    prog().met = true;
    goodTune();
    if (state.area >= AREAS.length - 1) {
      $('endBag').textContent = 'Bag: ' + state.bag.map(function (it) { return it.name; }).join(' · ');
      drawEnding();
      setScreen('end');
      return;
    }
    placePete(state.area + 1);
    setScreen('play');
  }

  function openPuzzle() {
    state.kitSel = null;
    renderPuzzle();
    setScreen('puzzle');
    blip();
  }

  function closePuzzle() {
    setScreen('play');
  }

  function renderPuzzle() {
    var pz = area().puzzle;
    $('puzzleTitle').textContent = pz.title;
    $('puzzleHelp').textContent = pz.help;
    if (pz.kind === 'pipes') renderPipes();
    else renderKit();
  }

  function pipeSvg(base) {
    var set = {};
    base.split('').forEach(function (d) { set[d] = 1; });
    var rects = '';
    if (set.N) rects += '<rect x="6" y="0" width="4" height="10"/>';
    if (set.S) rects += '<rect x="6" y="6" width="4" height="10"/>';
    if (set.E) rects += '<rect x="6" y="6" width="10" height="4"/>';
    if (set.W) rects += '<rect x="0" y="6" width="10" height="4"/>';
    rects += '<rect x="5" y="5" width="6" height="6"/>';
    return '<svg viewBox="0 0 16 16" aria-hidden="true"><g fill="currentColor">' + rects + '</g></svg>';
  }

  function potSvg() {
    return '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="6" y="3" width="4" height="4" fill="#39ff88"/><rect x="4" y="8" width="8" height="5" fill="#c47a3a"/><rect x="3" y="7" width="10" height="2" fill="#8a5a32"/></svg>';
  }

  function renderPipes() {
    var pz = area().puzzle;
    var rots = prog().rots;
    var reach = L.pipeReach(pz, rots);
    var board = $('puzzleBoard');
    board.className = 'pipe';
    board.style.setProperty('--cols', String(pz.cols));
    board.style.gridTemplateColumns = '52px repeat(' + pz.cols + ', var(--tile)) 52px';
    var html = '';
    for (var r = 0; r < pz.rows; r++) {
      for (var c = 0; c < pz.cols; c++) {
        var i = r * pz.cols + c;
        var col = c + 2;
        var row = r + 1;
        if (pz.enter.r === r && pz.enter.c === c) {
          html += '<div class="edge" style="grid-column:1;grid-row:' + row + '">' + pz.enterLabel + '</div>';
        }
        if (pz.exit.r === r && pz.exit.c === c) {
          html += '<div class="edge" style="grid-column:' + (pz.cols + 2) + ';grid-row:' + row + '">' + pz.exitLabel + '</div>';
        }
        var t = pz.tiles[i];
        if (!t) {
          html += '<div class="pot" style="grid-column:' + col + ';grid-row:' + row + '">' + potSvg() + '</div>';
        } else {
          var hot = reach.reached[r + ',' + c] ? ' hot' : '';
          var skin = pz.skin === 'light' ? ' light' : '';
          html += '<button type="button" class="tile' + skin + hot + '" data-i="' + i + '" style="grid-column:' + col + ';grid-row:' + row + '" aria-label="Turn pipe tile">' +
            '<span class="spin" style="transform:rotate(' + (rots[i] * 90) + 'deg)">' + pipeSvg(t.base) + '</span></button>';
        }
      }
    }
    board.innerHTML = html;
    board.querySelectorAll('button.tile').forEach(function (btn) {
      bindTap(btn, function () { turnTile(+btn.dataset.i); }, false);
    });
    if (reach.solved) {
      prog().puzzleDone = true;
      $('puzzleStatus').textContent = pz.skin === 'light' ? 'The light reaches the plant.' : 'The water reaches the plant.';
      $('puzzleBack').textContent = 'NICE';
      sync();
    } else {
      $('puzzleStatus').textContent = 'Not connected yet.';
      $('puzzleBack').textContent = 'BACK';
    }
  }

  function turnTile(i) {
    if (prog().puzzleDone) return;
    var t = area().puzzle.tiles[i];
    if (!t) return;
    prog().rots[i] = (prog().rots[i] + 1) % 4;
    var solved = L.pipeSolved(area().puzzle, prog().rots);
    renderPipes();
    if (solved) goodTune();
    else blip();
  }

  var KIT_NAME = { tip: 'TIP', paper: 'PAPER', flower: 'FLOWER', twist: 'TWIST' };

  function renderKit() {
    var order = prog().kit;
    var joints = L.kitJoints(order);
    var board = $('puzzleBoard');
    board.className = 'kit';
    board.style.removeProperty('--cols');
    board.innerHTML = order.map(function (id, i) {
      var ends = L.KIT_ENDS[id];
      var fitL = i > 0 && joints.flags[i - 1];
      var fitR = i < order.length - 1 && joints.flags[i];
      var cls = 'piece' + (state.kitSel === i ? ' sel' : '') + (fitL ? ' fitL' : '') + (fitR ? ' fitR' : '');
      var socket = ends.L ? '<i class="mark socket" data-shape="' + ends.L + '"></i>' : '';
      var plug = ends.R ? '<i class="mark plug" data-shape="' + ends.R + '"></i>' : '';
      return '<button type="button" class="' + cls + '" data-k="' + i + '" aria-pressed="' + (state.kitSel === i) + '" aria-label="' + KIT_NAME[id] + ' piece">' +
        socket + plug + '<canvas width="32" height="32" data-icon="' + id + '"></canvas><div>' + KIT_NAME[id] + '</div></button>';
    }).join('');
    board.querySelectorAll('button.piece').forEach(function (btn) {
      drawKitIcon(btn.querySelector('canvas'), btn.querySelector('canvas').dataset.icon);
      bindTap(btn, function () { onPiece(+btn.dataset.k); }, false);
    });
    if (L.kitSolved(order)) {
      prog().puzzleDone = true;
      $('puzzleStatus').textContent = 'The kit is lined up.';
      $('puzzleBack').textContent = 'NICE';
      sync();
    } else {
      $('puzzleStatus').textContent = state.kitSel === null
        ? 'Joints glowing: ' + joints.n + ' of 3.'
        : 'Now tap the piece to swap with.';
      $('puzzleBack').textContent = 'BACK';
    }
  }

  function onPiece(i) {
    if (prog().puzzleDone) return;
    if (state.kitSel === null) {
      state.kitSel = i;
      renderKit();
      blip();
      return;
    }
    if (state.kitSel === i) {
      state.kitSel = null;
      renderKit();
      return;
    }
    var kit = prog().kit;
    var tmp = kit[state.kitSel];
    kit[state.kitSel] = kit[i];
    kit[i] = tmp;
    state.kitSel = null;
    var solved = L.kitSolved(kit);
    renderKit();
    if (solved) goodTune();
    else blip();
  }

  function drawKitIcon(canvasEl, id) {
    var g = canvasEl.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, 32, 32);
    function r(x, y, w, h, col) { g.fillStyle = col; g.fillRect(x, y, w, h); }
    if (id === 'tip') {
      r(6, 8, 18, 16, '#f4efe4');
      r(22, 8, 4, 16, '#c9b48a');
      r(8, 12, 12, 2, '#e7d7b4');
      r(8, 18, 12, 2, '#e7d7b4');
    } else if (id === 'paper') {
      r(5, 6, 22, 20, '#f7f1df');
      r(5, 6, 22, 3, '#e4d8bc');
      r(8, 12, 16, 2, '#d7c7a4');
      r(8, 17, 16, 2, '#d7c7a4');
    } else if (id === 'flower') {
      r(14, 18, 4, 8, '#2f8a3a');
      r(8, 10, 8, 8, '#39ff88');
      r(16, 8, 8, 8, '#2fbf4a');
      r(12, 6, 8, 8, '#7dffb0');
      r(14, 12, 4, 4, '#fcd858');
    } else {
      r(6, 14, 6, 6, '#f7f1df');
      r(12, 10, 6, 6, '#f7f1df');
      r(18, 6, 6, 6, '#e4d8bc');
      r(10, 12, 4, 4, '#d7c7a4');
      r(16, 8, 4, 4, '#d7c7a4');
    }
  }

  function bindTap(el, fn, repeat) {
    var down = false;
    var fromPointer = false;
    var arm = 0;
    var timer = 0;
    var reset = 0;
    function stop() {
      down = false;
      clearTimeout(arm);
      clearInterval(timer);
      arm = 0;
      timer = 0;
      el.classList.remove('on');
      setTimeout(function () { fromPointer = false; }, 0);
    }
    function start(e) {
      if (e.button && e.button !== 0) return;
      e.preventDefault();
      if (down) return;
      down = true;
      fromPointer = true;
      fn();
      el.classList.add('on');
      clearTimeout(reset);
      reset = setTimeout(stop, 900);
      if (!repeat) return;
      clearTimeout(arm);
      arm = setTimeout(function () { timer = setInterval(fn, 150); }, 340);
    }
    el.addEventListener('pointerdown', start);
    el.addEventListener('touchstart', start, { passive: false });
    el.addEventListener('click', function (e) {
      e.preventDefault();
      if (fromPointer || down) return;
      fn();
    });
    ['pointerup', 'pointercancel', 'pointerleave', 'touchend', 'touchcancel'].forEach(function (ev) {
      el.addEventListener(ev, stop);
    });
  }

  function releaseHolds() {
    Object.keys(held).forEach(function (k) {
      clearTimeout(held[k]);
      clearInterval(held[k]);
      delete held[k];
    });
  }

  var DIRKEY = {
    ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
    W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0]
  };

  addEventListener('keydown', function (e) {
    if (e.repeat) return;
    var k = e.key;
    if (state.screen === 'title' && (k === 'Enter' || k === ' ')) {
      if (document.activeElement && document.activeElement.id === 'startBtn') return;
      e.preventDefault();
      startGame();
      return;
    }
    if (state.screen === 'end' && (k === 'Enter' || k === ' ')) {
      if (document.activeElement && document.activeElement.id === 'replayBtn') return;
      e.preventDefault();
      startGame();
      return;
    }
    if (state.screen !== 'play') {
      if (k === 'Escape') {
        if (state.screen === 'puzzle') closePuzzle();
        else if (state.screen === 'talk') talkClose();
      }
      return;
    }
    var dir = DIRKEY[k];
    if (dir) {
      e.preventDefault();
      move(dir[0], dir[1]);
      held[k] = setTimeout(function () {
        held[k] = setInterval(function () { move(dir[0], dir[1]); }, 150);
      }, 340);
      return;
    }
    if (k === 'e' || k === 'E' || ((k === ' ' || k === 'Enter') && (!document.activeElement || document.activeElement === document.body))) {
      e.preventDefault();
      doAction();
    }
  });
  addEventListener('keyup', function (e) {
    if (!held[e.key]) return;
    clearTimeout(held[e.key]);
    clearInterval(held[e.key]);
    delete held[e.key];
  });
  addEventListener('blur', releaseHolds);

  bindTap($('startBtn'), startGame, false);
  bindTap($('replayBtn'), startGame, false);
  bindTap($('btnL'), function () { move(-1, 0); }, true);
  bindTap($('btnR'), function () { move(1, 0); }, true);
  bindTap($('btnU'), function () { move(0, -1); }, true);
  bindTap($('btnD'), function () { move(0, 1); }, true);
  bindTap($('btnA'), doAction, false);
  bindTap($('puzzleBack'), closePuzzle, false);
  bindTap($('talkNext'), talkNext, false);
  bindTap($('talkOk'), talkClose, false);
  bindTap($('onward'), goOn, false);
  bindTap($('muteBtn'), function () {
    state.muted = !state.muted;
    $('muteBtn').textContent = state.muted ? '🔇' : '🔊';
    $('muteBtn').setAttribute('aria-label', state.muted ? 'Sound off' : 'Sound');
  }, false);

  addEventListener('contextmenu', function (e) { e.preventDefault(); });

  function fit() {
    var panel = state.screen === 'play' ? controls.offsetHeight : 0;
    document.documentElement.style.setProperty('--panel-h', panel + 'px');
    var view = $('view');
    var w = view.clientWidth;
    var h = view.clientHeight;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    state.viewW = w;
    state.viewH = h;
    document.body.dataset.orient = innerHeight >= innerWidth ? 'portrait' : 'landscape';
  }

  addEventListener('resize', fit);
  addEventListener('orientationchange', function () { setTimeout(fit, 60); });

  function layoutMap() {
    var map = area().map;
    var cols = map[0].length;
    var rows = map.length;
    var vw = state.viewW;
    var vh = state.viewH;
    var short = vh < 520;
    var topInset = short ? 78 : 56;
    var innerW = Math.max(40, vw - 12);
    var innerH = Math.max(40, vh - topInset - (short ? 2 : 8));
    var tile = Math.floor(Math.min(innerW / cols, innerH / rows, 64));
    if (tile < 8) tile = 8;
    var mapW = cols * tile;
    var mapH = rows * tile;
    var left = Math.floor((vw - mapW) / 2);
    var top = topInset + Math.floor((innerH - mapH) / 2);
    return { tile: tile, left: left, top: top, cols: cols, rows: rows, mapW: mapW, mapH: mapH };
  }

  var starCache = {};
  function starsFor(id) {
    if (starCache[id]) return starCache[id];
    var s = 17;
    for (var i = 0; i < id.length; i++) s = (s * 33 + id.charCodeAt(i)) % 997;
    var out = [];
    for (var n = 0; n < 36; n++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      out.push({ x: (s % 1000) / 1000, y: ((s >> 4) % 1000) / 1000, r: 1 + (s % 2) });
    }
    starCache[id] = out;
    return out;
  }

  var GLYPH = {
    L: ['10000', '10000', '10000', '10000', '11111'],
    E: ['11111', '10000', '11110', '10000', '11111'],
    A: ['01110', '10001', '11111', '10001', '10001'],
    F: ['11111', '10000', '11110', '10000', '10000'],
    G: ['01111', '10000', '10111', '10001', '01111'],
    R: ['11110', '10001', '11110', '10100', '10010'],
    O: ['01110', '10001', '10001', '10001', '01110'],
    W: ['10001', '10001', '10101', '10101', '01010'],
    C: ['01111', '10000', '10000', '10000', '01111'],
    H: ['10001', '10001', '11111', '10001', '10001'],
    I: ['11111', '00100', '00100', '00100', '11111']
  };

  function drawSign(word, cx, y, color) {
    var scale = 3;
    var gap = 2;
    var width = word.length * (5 * scale + gap) - gap;
    var x = Math.floor(cx - width / 2);
    ctx.fillStyle = color;
    for (var i = 0; i < word.length; i++) {
      var g = GLYPH[word[i]];
      if (!g) continue;
      for (var r = 0; r < 5; r++) {
        for (var c = 0; c < 5; c++) {
          if (g[r][c] === '1') ctx.fillRect(x + c * scale, y + r * scale, scale, scale);
        }
      }
      x += 5 * scale + gap;
    }
  }

  function blob(x, y, s, col, x0, y0, w, h) {
    ctx.fillStyle = col;
    ctx.fillRect(x + x0 * s, y + y0 * s, w * s, h * s);
  }

  function drawPete(x, y, s, face, frame) {
    ctx.save();
    if (face < 0) {
      ctx.translate(x + 16 * s, 0);
      ctx.scale(-1, 1);
      x = 0;
    }
    blob(x, y, s, '#ffe14a', 4, 0, 8, 2);
    blob(x, y, s, '#ffe14a', 3, 1, 10, 3);
    blob(x, y, s, '#f2c09a', 5, 4, 6, 4);
    blob(x, y, s, '#1a1a1a', 6, 5, 1, 2);
    blob(x, y, s, '#1a1a1a', 9, 5, 1, 2);
    blob(x, y, s, '#2fbf4a', 3, 8, 10, 5);
    blob(x, y, s, '#f83838', 6, 9, 4, 3);
    var lift = frame ? 1 : 0;
    blob(x, y, s, '#2c3a88', 4, 13 - lift, 3, 3);
    blob(x, y, s, '#111111', 4, 15 - lift, 3, 1);
    blob(x, y, s, '#2c3a88', 9, 13, 3, 3);
    blob(x, y, s, '#111111', 9, 15, 3, 1);
    ctx.restore();
  }

  function drawPerson(x, y, s, o) {
    blob(x, y, s, o.hair, 4, 0, 8, 2);
    blob(x, y, s, o.hair, 3, 1, 10, 3);
    blob(x, y, s, '#f2c09a', 5, 4, 6, 4);
    if (o.hat === 'shades') {
      blob(x, y, s, '#1a1a1a', 5, 5, 6, 2);
      blob(x, y, s, '#fcd858', 6, 5, 1, 1);
      blob(x, y, s, '#fcd858', 9, 5, 1, 1);
    } else {
      blob(x, y, s, '#1a1a1a', 6, 5, 1, 2);
      blob(x, y, s, '#1a1a1a', 9, 5, 1, 2);
    }
    if (o.hat === 'sun') {
      blob(x, y, s, '#ffe14a', 3, 0, 10, 2);
      blob(x, y, s, '#f0a020', 2, 2, 12, 1);
    }
    blob(x, y, s, o.shirt, 3, 8, 10, 5);
    if (o.apron) blob(x, y, s, '#f4efe4', 5, 9, 6, 4);
    blob(x, y, s, o.pants, 4, 13, 3, 3);
    blob(x, y, s, o.pants, 9, 13, 3, 3);
    blob(x, y, s, '#111111', 4, 15, 3, 1);
    blob(x, y, s, '#111111', 9, 15, 3, 1);
  }

  function drawRaccoon(x, y, s) {
    blob(x, y, s, '#8a8a8a', 3, 2, 3, 3);
    blob(x, y, s, '#8a8a8a', 10, 2, 3, 3);
    blob(x, y, s, '#bdbdbd', 4, 3, 8, 6);
    blob(x, y, s, '#3a3a3a', 4, 5, 8, 2);
    blob(x, y, s, '#fcd858', 5, 5, 1, 1);
    blob(x, y, s, '#fcd858', 10, 5, 1, 1);
    blob(x, y, s, '#f7f7f7', 6, 7, 4, 2);
    blob(x, y, s, '#9a9a9a', 3, 9, 10, 4);
    blob(x, y, s, '#d0d0d0', 5, 10, 6, 2);
    blob(x, y, s, '#6a6a6a', 4, 13, 2, 3);
    blob(x, y, s, '#6a6a6a', 10, 13, 2, 3);
    blob(x, y, s, '#cfcfcf', 12, 11, 3, 2);
    blob(x, y, s, '#3a3a3a', 13, 13, 3, 2);
  }

  function drawMoth(x, y, s) {
    blob(x, y, s, '#f0e2b0', 0, 4, 6, 8);
    blob(x, y, s, '#f0e2b0', 10, 4, 6, 8);
    blob(x, y, s, '#e7c56a', 1, 6, 4, 4);
    blob(x, y, s, '#e7c56a', 11, 6, 4, 4);
    blob(x, y, s, '#c47a3a', 6, 5, 4, 8);
    blob(x, y, s, '#1a1a1a', 7, 6, 1, 1);
    blob(x, y, s, '#1a1a1a', 9, 6, 1, 1);
    blob(x, y, s, '#6b4428', 7, 2, 1, 3);
    blob(x, y, s, '#6b4428', 9, 2, 1, 3);
  }

  function drawParrot(x, y, s) {
    blob(x, y, s, '#2fbf4a', 5, 4, 7, 7);
    blob(x, y, s, '#39ff88', 6, 6, 4, 4);
    blob(x, y, s, '#f83838', 8, 10, 3, 5);
    blob(x, y, s, '#ffe14a', 10, 5, 4, 2);
    blob(x, y, s, '#1a1a1a', 7, 5, 1, 1);
    blob(x, y, s, '#178a32', 3, 7, 3, 4);
    blob(x, y, s, '#fcd858', 6, 14, 2, 2);
    blob(x, y, s, '#fcd858', 9, 14, 2, 2);
  }

  var PEOPLE = {
    budtender: { hair: '#c47a3a', shirt: '#2fbf4a', pants: '#2c3a88', apron: true },
    grower: { hair: '#6b4428', shirt: '#6aaa3a', pants: '#6b4428', hat: 'sun' },
    host: { hair: '#c46bff', shirt: '#7a4ad0', pants: '#2a1844', hat: 'shades' }
  };

  function drawNpc(kind, x, y, s) {
    if (kind === 'raccoon') drawRaccoon(x, y, s);
    else if (kind === 'moth') drawMoth(x, y, s);
    else if (kind === 'parrot') drawParrot(x, y, s);
    else drawPerson(x, y, s, PEOPLE[kind]);
  }

  function drawFloor(x, y, tile, theme, cx, cy) {
    ctx.fillStyle = theme.floor[(cx + cy) % 2];
    ctx.fillRect(x, y, tile, tile);
  }

  function drawWall(x, y, tile, theme, cap) {
    ctx.fillStyle = theme.wall;
    ctx.fillRect(x, y, tile, tile);
    ctx.fillStyle = theme.brick;
    ctx.fillRect(x + 3, y + 3, tile - 6, tile - 6);
    if (cap) {
      var lip = Math.max(4, Math.floor(tile * 0.32));
      ctx.fillStyle = theme.wallTop;
      ctx.fillRect(x, y, tile, lip);
      ctx.fillStyle = theme.neon;
      ctx.fillRect(x, y + lip - 2, tile, 2);
    }
  }

  function drawPlant(x, y, s) {
    blob(x, y, s, '#6b4428', 5, 11, 6, 4);
    blob(x, y, s, '#8a5a32', 4, 10, 8, 2);
    blob(x, y, s, '#2fbf4a', 6, 4, 4, 7);
    blob(x, y, s, '#39ff88', 3, 6, 4, 3);
    blob(x, y, s, '#7dffb0', 9, 5, 4, 3);
  }

  function spriteScale(tile) {
    var s = Math.max(1, Math.floor(tile / 16));
    if (s < 2 && tile >= 30) s = 2;
    if (s * 16 > tile + 4) s = Math.max(1, Math.floor(tile / 16));
    return s;
  }

  function drawBench(x, y, tile, skin, done) {
    var s = spriteScale(tile);
    var ox = x + Math.floor((tile - 16 * s) / 2);
    var oy = y + Math.floor((tile - 16 * s) / 2);
    blob(ox, oy, s, '#6b4428', 2, 8, 12, 5);
    blob(ox, oy, s, '#c47a3a', 1, 7, 14, 2);
    blob(ox, oy, s, '#4a2c18', 3, 13, 2, 3);
    blob(ox, oy, s, '#4a2c18', 11, 13, 2, 3);
    if (skin === 'light') blob(ox, oy, s, '#ffe14a', 6, 2, 4, 5);
    else if (skin === 'kit') {
      blob(ox, oy, s, '#f7f1df', 4, 3, 8, 3);
      blob(ox, oy, s, '#39ff88', 7, 1, 3, 3);
    } else blob(ox, oy, s, '#3ec6f2', 3, 4, 10, 2);
    if (done) {
      blob(ox, oy, s, '#39ff88', 12, 1, 2, 2);
      blob(ox, oy, s, '#39ff88', 14, 3, 2, 2);
    }
  }

  function drawDecor(kind, x, y, tile) {
    var s = spriteScale(tile);
    var ox = x + Math.floor((tile - 16 * s) / 2);
    var oy = y + Math.floor((tile - 16 * s) / 2);
    if (kind === 'pot') drawPlant(ox, oy, s);
    else if (kind === 'lamp') {
      blob(ox, oy, s, '#6b4428', 7, 6, 2, 9);
      blob(ox, oy, s, '#ffe14a', 4, 2, 8, 5);
      blob(ox, oy, s, '#fff6c2', 6, 3, 4, 3);
    } else {
      blob(ox, oy, s, '#6a38a0', 1, 8, 14, 5);
      blob(ox, oy, s, '#c46bff', 1, 6, 4, 4);
      blob(ox, oy, s, '#c46bff', 11, 6, 4, 4);
      blob(ox, oy, s, '#ff7ad9', 5, 7, 6, 3);
    }
  }

  function drawBang(cx, top) {
    var bob = Math.sin(performance.now() / 180) * 3;
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#111';
    ctx.fillText('!', cx + 1, top + bob + 1);
    ctx.fillStyle = '#fcd858';
    ctx.fillText('!', cx, top + bob);
  }

  function drawLabel(text, cx, y) {
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    var w = ctx.measureText(text).width + 8;
    ctx.fillStyle = 'rgba(8,4,16,.8)';
    ctx.fillRect(cx - w / 2, y - 14, w, 14);
    ctx.fillStyle = '#fcd858';
    ctx.fillText(text, cx, y - 2);
  }

  function draw() {
    var w = state.viewW;
    var h = state.viewH;
    if (!w || !h || state.screen === 'title' || state.screen === 'end') return;
    var a = area();
    var theme = a.theme;
    ctx.fillStyle = theme.sky;
    ctx.fillRect(0, 0, w, h);
    var stars = starsFor(a.id);
    ctx.fillStyle = '#f7f1df';
    for (var i = 0; i < stars.length; i++) {
      ctx.fillRect(Math.floor(stars[i].x * w), Math.floor(stars[i].y * h), stars[i].r, stars[i].r);
    }
    var lay = layoutMap();
    var map = a.map;
    if (state.viewH >= 520 && lay.top >= 70) drawSign(a.sign, Math.floor(lay.left + lay.mapW / 2), lay.top - 22, theme.neon);
    var y, x;
    for (y = 0; y < lay.rows; y++) {
      for (x = 0; x < lay.cols; x++) {
        var px = lay.left + x * lay.tile;
        var py = lay.top + y * lay.tile;
        if (map[y][x] === '#') drawWall(px, py, lay.tile, theme, y === 0 || map[y - 1][x] !== '#');
        else drawFloor(px, py, lay.tile, theme, x, y);
      }
    }
    ctx.fillStyle = theme.neon;
    ctx.fillRect(lay.left - 3, lay.top - 3, lay.mapW + 6, 3);
    ctx.fillRect(lay.left - 3, lay.top + lay.mapH, lay.mapW + 6, 3);
    ctx.fillRect(lay.left - 3, lay.top - 3, 3, lay.mapH + 6);
    ctx.fillRect(lay.left + lay.mapW, lay.top - 3, 3, lay.mapH + 6);

    (a.decor || []).forEach(function (d) {
      drawDecor(d.kind, lay.left + d.x * lay.tile, lay.top + d.y * lay.tile, lay.tile);
    });

    var s = spriteScale(lay.tile);
    var pDone = prog().puzzleDone;
    for (y = 0; y < lay.rows; y++) {
      for (x = 0; x < lay.cols; x++) {
        var ch = map[y][x];
        var cx = lay.left + x * lay.tile;
        var cy = lay.top + y * lay.tile;
        if (ch === 'b') {
          drawBench(cx, cy, lay.tile, a.puzzle.skin || 'kit', pDone);
          if (!pDone) drawBang(cx + lay.tile / 2, cy - 2);
        } else if (ch === 'w' || ch === 'c') {
          var kind = ch === 'w' ? a.wrongSprite : a.rightSprite;
          var ox = cx + Math.floor((lay.tile - 16 * s) / 2);
          var oy = cy + Math.floor((lay.tile - 16 * s) / 2);
          drawNpc(kind, ox, oy, s);
          drawLabel(ch === 'w' ? a.wrong.short : a.right.short, cx + lay.tile / 2, cy + 2);
          if (ch === 'c' && pDone && !prog().met) drawBang(cx + lay.tile / 2, cy - 12);
        }
      }
    }

    var ps = s;
    var peteX = lay.left + state.px * lay.tile + Math.floor((lay.tile - 16 * ps) / 2);
    var peteY = lay.top + state.py * lay.tile + Math.floor((lay.tile - 16 * ps) / 2);
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.fillRect(peteX + 3 * ps, peteY + 15 * ps, 10 * ps, 2 * ps);
    drawPete(peteX, peteY, ps, state.facing, state.stepN % 2);
  }

  function paintScene(target, sky, ground, neon) {
    var g = target.getContext('2d');
    var w = target.width;
    var h = target.height;
    g.imageSmoothingEnabled = false;
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#f7f1df';
    [[12, 16], [40, 28], [70, 12], [110, 22], [150, 10], [190, 26], [220, 14]].forEach(function (p) {
      g.fillRect(p[0], p[1], 2, 2);
    });
    g.fillStyle = ground;
    g.fillRect(0, 96, w, 44);
    g.fillStyle = '#2a1840';
    g.fillRect(16, 52, 78, 54);
    g.fillStyle = '#4a2870';
    g.fillRect(16, 52, 78, 10);
    g.fillStyle = neon;
    g.fillRect(22, 64, 66, 22);
    g.fillStyle = '#102018';
    g.fillRect(48, 68, 8, 8);
    g.fillRect(44, 74, 16, 6);
    g.fillRect(40, 78, 8, 6);
    g.fillRect(56, 78, 8, 6);
    g.fillStyle = neon;
    g.fillRect(50, 86, 4, 8);
    g.fillStyle = '#f2c09a';
    g.fillRect(150, 78, 16, 12);
    g.fillStyle = '#ffe14a';
    g.fillRect(146, 68, 24, 12);
    g.fillStyle = '#2fbf4a';
    g.fillRect(144, 90, 28, 16);
    g.fillStyle = '#f83838';
    g.fillRect(152, 94, 12, 8);
    g.fillStyle = '#2c3a88';
    g.fillRect(148, 106, 8, 10);
    g.fillRect(160, 106, 8, 10);
    g.fillStyle = '#6b4428';
    g.fillRect(196, 100, 16, 12);
    g.fillStyle = '#39ff88';
    g.fillRect(198, 88, 12, 14);
    g.fillStyle = '#7a5430';
    g.fillRect(118, 86, 22, 8);
  }

  function drawTitle() {
    paintScene($('titleArt'), '#14081c', '#1b4332', '#39ff88');
  }

  function drawEnding() {
    paintScene($('endArt'), '#120818', '#2a1844', '#ff7ad9');
  }

  var last = 0;
  function frame(t) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t;
    if (state.px !== state.x) state.px += (state.x - state.px) * Math.min(1, dt * 14);
    if (state.py !== state.y) state.py += (state.y - state.py) * Math.min(1, dt * 14);
    if (Math.abs(state.px - state.x) < 0.01) state.px = state.x;
    if (Math.abs(state.py - state.y) < 0.01) state.py = state.y;
    if (state.screen === 'play' || state.screen === 'puzzle' || state.screen === 'talk') draw();
  }

  drawTitle();
  drawEnding();
  setScreen('title');
  requestAnimationFrame(frame);
})();
