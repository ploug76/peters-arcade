/* Chapter 1 laid over the Jimothy Timothy shell.
   Jimothy uses the Hair Mob raccoon sprites. Huck is drawn in that same style. */
var RULES = window.RULES;
var STORY = {
  saveKey: 'pa-test-huck-jimothy-ch1',
  introKey: 'huck-ch1-intro',
  levels: RULES.LEVELS,
  needsAge: false,
  newLabel: 'NEW SIDE',
  againLabel: 'SIDE A AGAIN',
  pathsLabel: 'PATHS',
  pathWord: 'PATH',
  clearTitle: 'PATH CLEAR',
  failTitle: 'DUST YOURSELF OFF',
  failBody: 'The mixtape is still waiting. Hearts refill and this path starts over.',
  lockText: 'Walk the earlier path first.',
  pathsNote: 'Play from the title keeps one score across Chapter 1.',
  tagline: 'It\'s not stealing if it\'s in the trash.',
  parent: 'Only raccoons dig in bins. Kids, ask a grown-up, and leave real trash alone.',
  logo: '<div class="logo"><div class="l1">HUCK X</div><div class="l2">AND JIMOTHY</div><div class="l3">Chapter 1 · Side A</div></div>',
  intro: '<img class="story" src="art/title_wide.webp?v=1" alt="Huck X beside Jimothy Timothy in the solar jeep"><p class="big">Huck X and Jimothy Timothy have one mixtape and a long way to the radio porch.</p><p>J.T. starts in the backpack. If you ask, he will tell you: it is not stealing if it is in the trash.</p><button class="btn go" data-a="storygo">LET\'S GO</button>',
  how: [
    '<b>Move:</b> swipe and hold anywhere. Let go to stop.',
    '<b>Jump:</b> swipe up, or tap the orange <b>JUMP</b> on the right. Let go early for a small hop.',
    '<b>ACTION:</b> the green button on the left. Dig a can, grab the crank, talk, open the shed, or yank the tow rope.',
    'On the radio road the skateboard lags behind the jeep. ACTION pulls it in before a cactus tags it.',
    'Keyboard: arrows or WASD, Space jumps, X is ACTION, C yanks the rope too, P pauses, M mutes.',
    'A controller works: stick moves, A jumps, X or B is ACTION, Y yanks, Start pauses.'
  ],
  themes: {
    alley: { bg: 'bg2', ter: 'ter2', sky: ['#ff9a70', '#ffd8a8'], plank: '#7a4a2a', ground: 'tex' },
    block: { bg: 'bg1', ter: 'ter1', sky: ['#8fd0ff', '#d8f0ff'], plank: '#a0522d', ground: 'tex' },
    sand: { bg: 'bg5', ter: 'ter5', sky: ['#e7c79a', '#f3e0c0'], plank: '#c4a060', ground: 'sand', pit: '#c6a15a' },
    night: { bg: 'bg4', ter: 'ter4', sky: ['#2a1848', '#6a4a88'], plank: '#6a4a8a', ground: 'tex', night: 1 }
  },
  songs: {
    title: { bpm: 108, root: 60, lead: [0, 3, 7, 3, 10, 7, 3, 0, 2, 5, 7, 10, 7, 3, 0, null] },
    play: { bpm: 126, root: 62, lead: [0, 3, 7, 10, 7, 3, 7, 12, 10, 7, 3, 2, 3, 7, 3, 0] },
    win: { bpm: 120, root: 67, lead: [0, 4, 7, 12, 7, 12, 16, 12, 7, 4, 7, 10, 12, 7, 4, 0] }
  }
};

function px(tx) { return (tx + 0.5) * TS; }
function gy(spec) { return spec.ground * TS; }

STORY.hitbox = function (spec) {
  if (spec.crawl) return { w: 24, h: 34 };
  if (spec.who === 'jeep') return { w: 72, h: 46 };
  if (spec.who === 'ride') return { w: 32, h: 54 };
  if (spec.who === 'huck') return { w: 28, h: 56 };
  return { w: 28, h: 50 };
};
STORY.pitText = function () {
  return G.spec.who === 'ride' ? 'Soft sand. Huck would sink, so J.T. carries him back.' : 'Back to safe ground.';
};
STORY.fill = function (spec, ents) {
  (spec.items || []).forEach(function (it) {
    ents.push({ k: 'item', kind: it[2], x: px(it[0]), y: gy(spec) - (it[1] < spec.ground ? (spec.ground - it[1]) * TS : 0), r: 56, got: 0 });
  });
  (spec.npcs || []).forEach(function (n) {
    ents.push({ k: 'npc', who: n[1], x: px(n[0]), y: gy(spec), lines: n[2], li: 0, r: 60 });
  });
  if (spec.shed) ents.push({ k: 'shed', x: px(spec.shed), y: gy(spec), r: 70 });
  (spec.hazards || []).forEach(function (h) {
    ents.push({ k: h.k, x: px(h.tx), y: gy(spec), left: h.left ? px(h.left) : 0, right: h.right ? px(h.right) : 0, dir: 1, r: 36 });
  });
};
STORY.begin = function (spec, practice) {
  if (practice && spec.need === 'tape') G.got.tape = 1;
  if (spec.who === 'jeep') G.board = { x: G.p.x - 90, yank: 0 };
};
STORY.goalOk = function () { return RULES.ready(G.spec, G.got, save.flags); };
STORY.blockText = function () {
  if (G.spec.need === 'battery') return 'The solar battery is still in a can.';
  if (G.spec.need === 'crank') return 'The gate still wants its crank.';
  if (G.spec.need === 'tape') return 'The mixtape is still in the junk.';
  return 'Not yet.';
};
STORY.hudLine = function () {
  var who = { huck: 'YOU: HUCK', jt: 'YOU: J.T.', ride: 'HUCK RIDES J.T.', jeep: 'JEEP + BOARD' }[G.spec.who] || '';
  var cans = 'CANS ' + (save.flags.cans | 0);
  if (G.spec.need && !RULES.ready(G.spec, G.got, save.flags)) return who + '  ·  NEED ' + G.spec.need.toUpperCase();
  return who + '  ·  ' + cans;
};
STORY.arrow = function () {
  if (G.spec.need && !RULES.ready(G.spec, G.got, save.flags)) {
    for (var i = 0; i < G.L.ents.length; i++) {
      var e = G.L.ents[i];
      if (e.k === 'item' && e.kind === G.spec.need && !e.got) return e;
    }
  }
  return G.L.goal;
};
STORY.onClear = function () {
  if (G.spec.need) save.flags[G.spec.need] = 1;
  if (G.spec.who === 'jeep') {
    if (save.flags.bike) addScore(300);
    if (save.flags.stereo) addScore(200);
  }
};
STORY.clearRows = function () {
  var cans = '<tr><td>Cans</td><td>' + (save.flags.cans | 0) + '</td></tr>';
  var gear = (save.flags.wax ? 'wax ' : '') + (save.flags.bike ? 'bmx ' : '') + (save.flags.stereo ? 'stereo' : '');
  return cans + (gear ? '<tr><td>Shed</td><td>' + gear + '</td></tr>' : '');
};
STORY.ending = function () {
  return '<img class="story" src="art/ending.webp?v=1" alt="The radio porch at the end of the road"><h2>SIDE A IS ON</h2><p class="big">The mixtape made it to the radio porch. J.T. kept the wheel. Huck kept the board on the rope.</p><table class="st"><tr><td>Chapter score</td><td>' + SESSION.score.toLocaleString() + '</td></tr><tr><td>Best</td><td>' + save.best.toLocaleString() + '</td></tr></table>';
};
STORY.pitText = STORY.pitText;

function say(e, text) {
  G.bubble = { x: e.x, y: e.y, text: text, l: 3.2 };
}
function focusEnt() {
  if (G.spec.who === 'jeep') return null;
  var p = G.p, best = null, bd = 1e9;
  G.L.ents.forEach(function (e) {
    if (e.got) return;
    var d = Math.hypot(e.x - p.x, e.y - (p.y - 20));
    if (d < (e.r || 56) && d < bd) { bd = d; best = e; }
  });
  return best;
}
function openShop() {
  var cans = save.flags.cans | 0;
  var html = '<h2>SHED</h2><p class="sub">Cans, not money. You are holding ' + cans + '.</p><div class="trade"><div class="ct">TODAY\'S TRASH</div>';
  RULES.SHOP.forEach(function (it) {
    var own = save.flags[it.id] ? ' · in the pack' : ' · ' + it.cost + ' cans';
    html += '<p><b>' + it.name + '</b>' + own + '<br><small>' + it.blurb + '</small></p><button class="btn go" data-a="buy" data-v="' + it.id + '">' + (save.flags[it.id] ? 'PACKED' : 'TAKE ' + it.name.toUpperCase()) + '</button>';
  });
  html += '</div><button class="btn alt" data-a="resume">BACK TO THE ALLEY</button>';
  openMenu(html);
}
STORY.menu = function (a, v) {
  if (a !== 'buy') return false;
  var it = null;
  RULES.SHOP.forEach(function (s) { if (s.id === v) it = s; });
  if (!it) return true;
  if (save.flags[it.id]) { toast('Already in the pack.'); return true; }
  if ((save.flags.cans | 0) < it.cost) { AU.fx('nope'); toast('Need ' + it.cost + ' cans.'); return true; }
  save.flags.cans -= it.cost;
  save.flags[it.id] = 1;
  persist();
  AU.fx('clear');
  toast(it.name + ' packed.');
  openShop();
  return true;
};
STORY.onAction = function () {
  var p = G.p;
  if (G.spec.who === 'jeep') {
    G.board.yank = 0.45;
    G.board.x += (p.x - p.face * 36 - G.board.x) * 0.85;
    AU.fx('flick');
    floatText(G.board.x, p.y - 70, 'YANK', '#fff6d0');
    return true;
  }
  var e = focusEnt();
  if (!e) return false;
  p.flick = 0.18;
  if (e.k === 'item') {
    e.got = 1;
    AU.fx('dig');
    burst(e.x, e.y - 20, 8, ['#e6c27a', '#fff']);
    if (e.kind === 'can') {
      save.flags.cans = (save.flags.cans | 0) + 1;
      addScore(50);
      floatText(e.x, e.y - 36, '+ CAN', '#ffe080');
    } else {
      G.got[e.kind] = 1;
      save.flags[e.kind] = 1;
      addScore(200);
      floatText(e.x, e.y - 36, e.kind === 'battery' ? 'BATTERY' : e.kind === 'tape' ? 'MIXTAPE' : 'CRANK', '#fff6c0');
      if (e.kind === 'battery') say(e, 'It is not stealing if it is in the trash.');
    }
    persist();
    return true;
  }
  if (e.k === 'npc') {
    say(e, e.lines[e.li % e.lines.length]);
    e.li++;
    AU.fx('boop');
    return true;
  }
  if (e.k === 'shed') { openShop(); AU.fx('menu'); return true; }
  return false;
};
STORY.tick = function (dt) {
  if (G.bubble) { G.bubble.l -= dt; if (G.bubble.l <= 0) G.bubble = null; }
  var p = G.p, gy0 = G.L.ground * TS;
  G.L.ents.forEach(function (e) {
    if (e.k === 'tumble') {
      var nx = e.x + e.dir * 70 * dt;
      if (nx < e.left || nx > e.right) e.dir *= -1;
      e.x += e.dir * 70 * dt;
      e.rot = (e.rot || 0) + e.dir * dt * 4;
    }
  });
  if (G.spec.who === 'jeep' && G.board) {
    var b = G.board;
    b.yank = Math.max(0, b.yank - dt);
    var target = p.x - p.face * 96;
    var k = b.yank > 0 ? 16 : 3.4;
    b.x += (target - b.x) * Math.min(1, dt * k);
    G.L.ents.forEach(function (e) {
      if (e.k !== 'cactus' && e.k !== 'tumble') return;
      var pr = Math.hypot(p.x - e.x, (p.y - 20) - (e.y - 20));
      if (pr < 36) hurt(p, e.x);
      var br = Math.hypot(b.x - e.x, (p.y - 10) - (e.y - 16));
      if (br < 30 && b.yank <= 0) {
        if (save.flags.wax) { b.yank = 0.3; floatText(b.x, p.y - 60, 'WAX', '#fff'); }
        else hurt(p, e.x);
      }
    });
  }
  G.focus = focusEnt();
};
function jtFrame(p) {
  if (p.hurt > 0) return 'jt_dizzy';
  if (!p.onG) return 'jt_jump';
  if (p.flick > 0) return 'jt_point';
  if (Math.abs(p.vx) > 24) return ['jt_run1', 'jt_run2', 'jt_run3', 'jt_run4'][Math.floor(p.runDist / 12) % 4];
  return 'jt_idle';
}
function huckFrame(p) {
  if (!p.onG || p.hurt > 0) return 'huck_jump';
  if (Math.abs(p.vx) > 24) return 'huck_run';
  return 'huck_idle';
}
STORY.drawActor = function (p) {
  var who = G.spec.who;
  if (who === 'jeep') {
    shadow(p.x, p.y, 36);
    spr('jeep_side', p.x, p.y + 8, 0.92, p.face < 0);
    if (G.board) {
      var bx = G.board.x;
      c.strokeStyle = '#f0e2c0'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(p.x - p.face * 30, p.y - 16); c.lineTo(bx, p.y - 10); c.stroke();
      drawBoard(bx, p.y);
      spr('huck_idle', bx, p.y - 8, 0.55, p.face < 0);
    }
    return;
  }
  if (who === 'ride') {
    shadow(p.x, p.y, 22);
    spr(jtFrame(p), p.x, p.y + 2, 1, p.face < 0);
    var bob = Math.sin(G.t * 8) * 1.5;
    spr(huckFrame(p), p.x, p.y - 34 + bob, 0.62, p.face < 0);
    return;
  }
  if (who === 'huck') {
    shadow(p.x, p.y, 16);
    var bobH = Math.abs(p.vx) > 24 && p.onG ? Math.sin(p.runDist / 8) * 2 : 0;
    spr(huckFrame(p), p.x, p.y + bobH, 1, p.face < 0);
    spr('jt_idle', p.x - p.face * 8, p.y - 30, 0.48, p.face < 0);
    return;
  }
  shadow(p.x, p.y, 16);
  if (p.inv > 0 && Math.floor(p.inv * 12) % 2 === 0) c.globalAlpha = 0.45;
  spr(jtFrame(p), p.x, p.y + 2, G.spec.crawl ? 0.72 : 1, p.face < 0);
  c.globalAlpha = 1;
};
function drawBoard(x, y) {
  c.save(); c.translate(x, y - 6);
  c.fillStyle = '#c4542a'; c.fillRect(-16, -4, 32, 6);
  c.fillStyle = '#6a6a72'; c.beginPath(); c.arc(-10, 4, 4, 0, TAU); c.arc(10, 4, 4, 0, TAU); c.fill();
  c.restore();
}
STORY.drawEnt = function (e) {
  if (e.got) return true;
  if (e.k === 'item') {
    if (e.kind === 'can' || e.kind === 'battery' || e.kind === 'tape') {
      spr(e.kind === 'tape' ? 'binopen' : 'bin', e.x, e.y + 4, 0.7, false);
      if (e.kind === 'battery') { c.fillStyle = '#ffe14a'; c.fillRect(e.x - 7, e.y - 28, 14, 8); }
      if (e.kind === 'tape') drawTape(e.x, e.y - 34);
    } else drawCrank(e.x, e.y - 16);
    return true;
  }
  if (e.k === 'npc' && e.who === 'huck') { shadow(e.x, e.y, 14); spr('huck_idle', e.x, e.y, 1, true); return true; }
  if (e.k === 'shed') { drawShed(e.x, e.y); return true; }
  if (e.k === 'cactus') { drawCactus(e.x, e.y); return true; }
  if (e.k === 'tumble') { drawTumble(e.x, e.y - 10, e.rot || 0); return true; }
  return false;
};
STORY.drawGoal = function (g) {
  if (G.spec.who === 'jeep') drawPorch(g.x, g.y);
  else if (G.spec.crawl) drawGate(g.x, g.y);
  else drawFlag(g.x, g.y);
};
STORY.drawUnder = function () {
  if (!G.spec.crawl) return;
  (G.spec.walls || []).forEach(function (w) {
    for (var j = 0; j < w[3]; j++) for (var i = 0; i < w[2]; i++) {
      var x = (w[0] + i) * TS, y = (w[1] + j) * TS;
      c.strokeStyle = '#9aa4b0'; c.lineWidth = 2;
      for (var k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x, y + k * 10); c.lineTo(x + TS, y + k * 10); c.stroke(); c.beginPath(); c.moveTo(x + k * 10, y); c.lineTo(x + k * 10, y + TS); c.stroke(); }
    }
  });
};
STORY.drawOver = function () {
  if (G.focus && !G.focus.got) {
    c.strokeStyle = '#ffe14a'; c.lineWidth = 3; c.beginPath(); c.arc(G.focus.x, G.focus.y - 28, 22, 0, TAU); c.stroke();
  }
  if (!G.bubble) return;
  var b = G.bubble;
  c.save();
  c.font = "14px 'Baloo 2',system-ui";
  var words = b.text.split(' '), line = '', lines = [], max = 230;
  words.forEach(function (w) { var t = line ? line + ' ' + w : w; if (c.measureText(t).width > max && line) { lines.push(line); line = w; } else line = t; });
  if (line) lines.push(line);
  var h = lines.length * 16 + 12, w = max + 16, x = b.x, y = b.y - 70;
  c.globalAlpha = Math.min(1, b.l * 2);
  c.fillStyle = '#fff8ea'; roundRect(x - w / 2, y - h, w, h, 8); c.fill();
  c.fillStyle = '#2a1a10'; c.textAlign = 'center';
  lines.forEach(function (ln, i) { c.fillText(ln, x, y - h + 16 + i * 16); });
  c.restore();
};
function drawFlag(x, y) {
  c.fillStyle = '#6a3a1a'; c.fillRect(x - 2, y - 46, 4, 46);
  c.fillStyle = '#f83838'; c.beginPath(); c.moveTo(x + 2, y - 46); c.lineTo(x + 22, y - 36); c.lineTo(x + 2, y - 26); c.fill();
}
function drawGate(x, y) {
  c.fillStyle = '#8a8f98'; c.fillRect(x - 16, y - 48, 6, 48); c.fillRect(x + 10, y - 48, 6, 48);
  c.fillRect(x - 16, y - 48, 32, 6);
  c.fillStyle = '#ffe14a'; c.fillRect(x - 4, y - 28, 8, 8);
}
function drawPorch(x, y) {
  c.fillStyle = '#6a3a28'; c.fillRect(x - 28, y - 54, 56, 54);
  c.fillStyle = '#f0d8a8'; c.fillRect(x - 22, y - 48, 44, 28);
  c.fillStyle = '#f83838'; c.beginPath(); c.moveTo(x - 34, y - 54); c.lineTo(x, y - 74); c.lineTo(x + 34, y - 54); c.fill();
  c.fillStyle = '#1a1a1a'; c.fillRect(x - 6, y - 40, 12, 8);
  c.fillStyle = '#fff'; c.font = "10px 'Lilita One',system-ui"; c.textAlign = 'center'; c.fillText('ON AIR', x, y - 58);
}
function drawShed(x, y) {
  c.fillStyle = '#8a4a28'; c.fillRect(x - 26, y - 44, 52, 44);
  c.fillStyle = '#c4542a'; c.beginPath(); c.moveTo(x - 32, y - 44); c.lineTo(x, y - 64); c.lineTo(x + 32, y - 44); c.fill();
  c.fillStyle = '#f0d8a0'; c.fillRect(x - 8, y - 22, 16, 22);
}
function drawCactus(x, y) {
  c.fillStyle = '#2f9a48'; c.fillRect(x - 6, y - 36, 12, 36);
  c.fillRect(x - 18, y - 28, 12, 6); c.fillRect(x - 18, y - 28, 6, 14);
  c.fillRect(x + 6, y - 24, 12, 6); c.fillRect(x + 12, y - 24, 6, 12);
}
function drawTumble(x, y, rot) {
  c.save(); c.translate(x, y); c.rotate(rot || 0);
  c.strokeStyle = '#c6a15a'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 12, 0, TAU); c.stroke();
  c.beginPath(); c.moveTo(-10, -4); c.lineTo(10, 6); c.moveTo(-8, 6); c.lineTo(8, -6); c.stroke();
  c.restore();
}
function drawTape(x, y) {
  c.fillStyle = '#f4f4f4'; c.fillRect(x - 12, y - 8, 24, 16);
  c.fillStyle = '#222'; c.fillRect(x - 6, y - 4, 4, 8); c.fillRect(x + 2, y - 4, 4, 8);
  c.fillStyle = '#f83838'; c.fillRect(x - 10, y - 7, 20, 3);
}
function drawCrank(x, y) {
  c.strokeStyle = '#d0d4dc'; c.lineWidth = 4; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x - 10, y); c.lineTo(x + 8, y); c.lineTo(x + 8, y - 12); c.stroke();
  c.fillStyle = '#ffe14a'; c.beginPath(); c.arc(x + 8, y - 12, 4, 0, TAU); c.fill();
}
