/* Pete's 420 Adventure on the Jimothy Timothy shell.
   Adults only, 21+. Same three errands: water, light, and the kit.
   The Counter Pal uses the Jimothy raccoon, sunglasses and all. */
var RULES = window.RULES;
var LEVELS = [
  {
    id: '1', name: 'Dispensary District', area: 0, theme: 'street', song: 'play', par: 70, hearts: 3,
    plan: [
      'The Counter Pal is the wrong window. He is a raccoon in sunglasses.',
      'Jump the little gap.',
      'Stand by a pipe and press ACTION to turn it, until water reaches the plant.',
      'Then talk to the budtender. The pouch is a gift.'
    ],
    done: 'The budtender sent Pete next door with a Seed Pouch.',
    banner: 'Turn the pipes. Water should reach the plant.',
    w: 44, h: 12, ground: 10, player: 3, goal: 40,
    holes: [[24, 2]], plats: [[24, 8, 2]],
    pal: 8, pipes: 13, tender: 32
  },
  {
    id: '2', name: 'Grow House', area: 1, theme: 'grow', song: 'play', par: 70, hearts: 3,
    plan: [
      'The moth is just visiting. ACTION talks. It is not the grower.',
      'Turn the light tiles until the yellow reaches the plant.',
      'Jump the gap.',
      'The grower has a Lounge Token. It is not money.'
    ],
    done: 'The grower called Pete a friend and passed a Lounge Token.',
    banner: 'Aim the light. The moth is the wrong one.',
    w: 46, h: 12, ground: 10, player: 3, goal: 42,
    holes: [[28, 2]], plats: [[28, 8, 2]],
    moth: 8, pipes: 14, grower: 34
  },
  {
    id: '3', name: 'Chill Lounge', area: 2, theme: 'lounge', song: 'play', par: 70, hearts: 3,
    plan: [
      'The parrot is the wrong bird.',
      'ACTION swaps a kit piece with the next one.',
      'The joints glow in one order: tip, paper, flower, twist.',
      'Talk to the host. The couch is the last stop.'
    ],
    done: 'The host pressed a Chill Stamp. The couch knows Pete.',
    banner: 'Swap the kit until every joint glows.',
    w: 46, h: 12, ground: 10, player: 3, goal: 42,
    holes: [[30, 2]], plats: [[30, 8, 2]],
    parrot: 8, kit: 16, host: 36
  }
];

var STORY = {
  saveKey: 'pa-test-petes-420',
  introKey: 'p420-intro',
  levels: LEVELS,
  needsAge: true,
  newLabel: 'NEW NIGHT',
  againLabel: 'ANOTHER NIGHT',
  pathsLabel: 'ROOMS',
  pathWord: 'ROOM',
  clearTitle: 'ROOM CLEAR',
  failTitle: 'TAKE A BREATH',
  failBody: 'The room is still there. Hearts refill and this room starts over.',
  lockText: 'Finish the earlier room first.',
  pathsNote: 'One night, three rooms. Nothing on the way has a price.',
  tagline: 'Adults-only cartoon. Connect the pieces. Meet the right people.',
  parent: 'Adults only, 21+. This is a cartoon about cannabis. Nothing here is for sale, and nobody but Pete has a name.',
  logo: '<div class="logo"><div class="l1">PETE\'S</div><div class="l2">420</div><div class="l3">ADVENTURE</div></div>',
  intro: '',
  how: [
    '<b>21+ only.</b> This is a cartoon about cannabis.',
    '<b>Move:</b> swipe and hold anywhere. Let go to stop.',
    '<b>Jump:</b> swipe up, or tap the orange <b>JUMP</b> on the right.',
    '<b>ACTION:</b> the green button on the left. It turns the pipe you are standing by, swaps a kit piece, or talks to whoever is close.',
    'The raccoon at the counter is the wrong window. The parrot is the wrong bird. The moth is just visiting.',
    'Keyboard: arrows or WASD, Space jumps, X is ACTION, P pauses, M mutes.'
  ],
  themes: {
    street: { bg: 'bg1', ter: 'ter1', sky: ['#8fd0ff', '#d8f0ff'], plank: '#6a8a4a', ground: 'tex' },
    grow: { bg: 'bg3', ter: 'ter3', sky: ['#f0c0a0', '#ffe0c8'], plank: '#c48840', ground: 'tex' },
    lounge: { bg: 'bg4', ter: 'ter4', sky: ['#24143a', '#6a3a78'], plank: '#6a4a8a', ground: 'tex', night: 1 }
  },
  songs: {
    title: { bpm: 92, root: 58, lead: [0, 3, 7, 10, 7, 3, 0, null, 2, 5, 7, 3, 0, -2, 0, 3] },
    play: { bpm: 112, root: 60, lead: [0, 3, 7, 10, 12, 10, 7, 3, 2, 5, 7, 10, 7, 3, 0, null] },
    win: { bpm: 118, root: 65, lead: [0, 4, 7, 11, 7, 11, 14, 11, 7, 4, 7, 12, 11, 7, 4, 0] }
  }
};

function px(tx) { return (tx + 0.5) * TS; }
function gy(spec) { return spec.ground * TS; }
function areaOf(spec) { return RULES.AREAS[spec.area]; }

STORY.hitbox = function () { return { w: 28, h: 58 }; };
STORY.pitText = function () { return 'Easy. The room puts you back on the floor.'; };
STORY.fill = function (spec, ents) {
  var area = areaOf(spec);
  var pz = area.puzzle;
  if (spec.pal) ents.push({ k: 'npc', role: 'wrong', x: px(spec.pal), y: gy(spec), r: 64, li: 0, art: 'jt' });
  if (spec.moth) ents.push({ k: 'npc', role: 'wrong', x: px(spec.moth), y: gy(spec) - 28, r: 64, li: 0, art: 'moth', bob: 1 });
  if (spec.parrot) ents.push({ k: 'npc', role: 'wrong', x: px(spec.parrot), y: gy(spec), r: 64, li: 0, art: 'parrot' });
  if (spec.tender) ents.push({ k: 'npc', role: 'right', x: px(spec.tender), y: gy(spec), r: 64, li: 0, art: 'budtender' });
  if (spec.grower) ents.push({ k: 'npc', role: 'right', x: px(spec.grower), y: gy(spec), r: 64, li: 0, art: 'grower' });
  if (spec.host) ents.push({ k: 'npc', role: 'right', x: px(spec.host), y: gy(spec), r: 64, li: 0, art: 'host' });
  if (pz.kind === 'pipes') {
    var n = 0;
    pz.tiles.forEach(function (t, i) {
      if (!t) return;
      ents.push({ k: 'pipe', i: i, base: t.base, rot: t.rot, x: px(spec.pipes + n * 2.5), y: gy(spec) - 28, r: 46 });
      n++;
    });
  } else {
    for (var i = 0; i < 4; i++) ents.push({ k: 'piece', i: i, x: px(spec.kit + i * 2), y: gy(spec), r: 46 });
  }
};
STORY.begin = function (spec) {
  G.area = areaOf(spec);
  G.order = G.area.puzzle.kind === 'kit' ? G.area.puzzle.order.slice() : null;
  G.flow = {};
  refreshFlow();
};
function rotsNow() {
  var pz = G.area.puzzle;
  var rots = pz.tiles.map(function (t) { return t ? t.rot : 0; });
  G.L.ents.forEach(function (e) { if (e.k === 'pipe') rots[e.i] = e.rot; });
  return rots;
}
function refreshFlow() {
  var pz = G.area.puzzle;
  if (pz.kind === 'kit') { G.puzzle = RULES.kitSolved(G.order) ? 1 : 0; G.joints = RULES.kitJoints(G.order); return; }
  var reach = RULES.pipeReach(pz, rotsNow());
  G.flow = reach.reached;
  G.puzzle = reach.solved ? 1 : 0;
}
STORY.goalOk = function () { return !!(G.got && G.got[G.area.right.item]); };
STORY.blockText = function () {
  if (!G.puzzle) return G.area.goalPuzzle;
  if (!G.got[G.area.right.item]) return G.area.goalMeet;
  return 'Not yet.';
};
STORY.hudLine = function () {
  var bag = [];
  if (save.flags.seeds || G.got.seeds) bag.push('SEEDS');
  if (save.flags.token || G.got.token) bag.push('TOKEN');
  if (save.flags.stamp || G.got.stamp) bag.push('STAMP');
  var job = G.puzzle ? 'LINE SET' : 'LINE OPEN';
  return job + (bag.length ? '  ·  ' + bag.join(' ') : '');
};
STORY.arrow = function () {
  if (!G.puzzle) {
    for (var i = 0; i < G.L.ents.length; i++) if (G.L.ents[i].k === 'pipe' || G.L.ents[i].k === 'piece') return G.L.ents[i];
  }
  if (!G.got[G.area.right.item]) {
    for (var j = 0; j < G.L.ents.length; j++) if (G.L.ents[j].role === 'right') return G.L.ents[j];
  }
  return G.L.goal;
};
STORY.onClear = function () {
  var id = G.area.right.item;
  if (G.got[id]) save.flags[id] = 1;
};
STORY.clearRows = function () {
  return '<tr><td>Bag</td><td>' + (G.area.right.itemName) + '</td></tr>';
};
STORY.ending = function () {
  return '<img class="story" src="art/ending.webp?v=1" alt="Pete in the lounge with the couch"><h2>CHILL COMPLETE</h2><p class="big">Pete connected the water, the light, and the kit, and met the right people along the way. The couch has accepted him.</p><table class="st"><tr><td>Night score</td><td>' + SESSION.score.toLocaleString() + '</td></tr><tr><td>Bag</td><td>Seed Pouch, Lounge Token, Chill Stamp</td></tr></table>';
};

function say(e, text) { G.bubble = { x: e.x, y: e.y - (e.art === 'moth' ? 10 : 0), text: text, l: 3.4 }; }
function focusEnt() {
  var p = G.p, best = null, bd = 1e9;
  G.L.ents.forEach(function (e) {
    var d = Math.hypot(e.x - p.x, e.y - (p.y - 24));
    if (d < (e.r || 56) && d < bd) { bd = d; best = e; }
  });
  return best;
}
STORY.onAction = function () {
  var e = focusEnt();
  if (!e) return false;
  G.p.flick = 0.16;
  if (e.k === 'pipe') {
    e.rot = (e.rot + 1) % 4;
    refreshFlow();
    AU.fx(G.puzzle ? 'clear' : 'flick');
    if (G.puzzle) toast('It reaches the plant.');
    return true;
  }
  if (e.k === 'piece') {
    var i = e.i, j = i < G.order.length - 1 ? i + 1 : i - 1;
    var tmp = G.order[i]; G.order[i] = G.order[j]; G.order[j] = tmp;
    refreshFlow();
    AU.fx(G.puzzle ? 'clear' : 'flick');
    if (G.puzzle) toast('Every joint is glowing.');
    return true;
  }
  if (e.k === 'npc') {
    var area = G.area;
    var lines = e.role === 'right' ? (G.puzzle ? area.right.after : area.right.before) : area.wrong.lines;
    var idx = e.li % lines.length;
    say(e, lines[idx]);
    if (e.role === 'right' && G.puzzle && idx === 1 && !G.got[area.right.item]) {
      G.got[area.right.item] = 1;
      save.flags[area.right.item] = 1;
      persist();
      addScore(250);
      floatText(e.x, e.y - 70, area.right.itemName.toUpperCase(), '#b8ff9a');
      AU.fx('win');
    } else AU.fx('boop');
    e.li++;
    return true;
  }
  return false;
};
STORY.tick = function (dt) {
  if (G.bubble) { G.bubble.l -= dt; if (G.bubble.l <= 0) G.bubble = null; }
  G.focus = focusEnt();
  if (G.area && G.area.puzzle.kind === 'kit') G.joints = RULES.kitJoints(G.order);
};
function peteFrame(p) {
  if (!p.onG || p.hurt > 0) return 'pete_jump';
  if (Math.abs(p.vx) > 24) return 'pete_run';
  return 'pete_idle';
}
STORY.drawActor = function (p) {
  shadow(p.x, p.y, 16);
  if (p.inv > 0 && Math.floor(p.inv * 12) % 2 === 0) c.globalAlpha = 0.45;
  var bob = Math.abs(p.vx) > 24 && p.onG ? Math.sin(p.runDist / 8) * 2 : 0;
  spr(peteFrame(p), p.x, p.y + bob, 1, p.face < 0);
  c.globalAlpha = 1;
};
STORY.drawEnt = function (e) {
  if (e.k === 'npc') {
    var y = e.y + (e.bob ? Math.sin(G.t * 3) * 8 : 0);
    shadow(e.x, e.y, 14);
    if (e.art === 'jt') {
      var fr = ['jt_idle', 'jt_idle', 'jt_point', 'jt_idle'][Math.floor(G.t * 2) % 4];
      spr(fr, e.x, y, 0.92, true);
    } else if (e.art === 'parrot') spr('parrot', e.x, y - 8, 0.85, false);
    else if (e.art === 'moth') spr('moth', e.x, y, 0.9, Math.sin(G.t) > 0);
    else spr(e.art, e.x, y, 0.92, e.role === 'right' ? false : true);
    return true;
  }
  if (e.k === 'pipe') { drawPipe(e); return true; }
  if (e.k === 'piece') { drawPiece(e); return true; }
  return false;
};
STORY.drawGoal = function (g) {
  if (G.spec.area === 2) drawCouch(g.x, g.y);
  else drawDoor(g.x, g.y, G.puzzle && G.got[G.area.right.item]);
};
STORY.drawOver = function () {
  if (G.focus) {
    c.strokeStyle = '#ffe14a'; c.lineWidth = 3; c.beginPath(); c.arc(G.focus.x, G.focus.y - 30, 24, 0, TAU); c.stroke();
  }
  if (G.bubble) drawBubble(G.bubble);
};
function drawBubble(b) {
  c.save();
  c.font = "14px 'Baloo 2',system-ui";
  var words = b.text.split(' '), line = '', lines = [], max = 240;
  words.forEach(function (w) { var t = line ? line + ' ' + w : w; if (c.measureText(t).width > max && line) { lines.push(line); line = w; } else line = t; });
  if (line) lines.push(line);
  var h = lines.length * 16 + 12, w = max + 16, x = b.x, y = b.y - 78;
  c.globalAlpha = Math.min(1, b.l * 2);
  c.fillStyle = '#fff8ea'; roundRect(x - w / 2, y - h, w, h, 8); c.fill();
  c.fillStyle = '#2a1a10'; c.textAlign = 'center';
  lines.forEach(function (ln, i) { c.fillText(ln, x, y - h + 16 + i * 16); });
  c.restore();
}
function drawPipe(e) {
  var dirs = RULES.connections(e.base, e.rot);
  var lit = G.flow && G.flow[(Math.floor(e.i / G.area.puzzle.cols)) + ',' + (e.i % G.area.puzzle.cols)];
  c.fillStyle = lit ? (G.area.puzzle.skin === 'light' ? '#ffe08a' : '#9ad0ff') : '#d8d2c8';
  roundRect(e.x - 22, e.y - 22, 44, 44, 8); c.fill();
  c.strokeStyle = '#3a342c'; c.lineWidth = 3; c.stroke();
  c.strokeStyle = G.area.puzzle.skin === 'light' ? '#f0a020' : '#2a78c8';
  c.lineWidth = 6; c.lineCap = 'round';
  c.beginPath(); c.moveTo(e.x, e.y);
  dirs.forEach(function (d) {
    var dx = d === 'E' ? 18 : d === 'W' ? -18 : 0;
    var dy = d === 'S' ? 18 : d === 'N' ? -18 : 0;
    c.moveTo(e.x, e.y); c.lineTo(e.x + dx, e.y + dy);
  });
  c.stroke();
  if (G.area.puzzle.enter && e.i === G.area.puzzle.enter.r * G.area.puzzle.cols + G.area.puzzle.enter.c) {
    c.fillStyle = '#24180c'; c.font = "10px 'Lilita One',system-ui"; c.textAlign = 'center'; c.fillText('IN', e.x, e.y + 34);
  }
}
function drawPiece(e) {
  var name = G.order[e.i];
  var fitL = e.i > 0 && G.joints && G.joints.flags[e.i - 1];
  c.fillStyle = fitL || (G.joints && G.joints.flags[e.i]) ? '#d8ffd0' : '#fff4d8';
  roundRect(e.x - 20, e.y - 36, 40, 28, 8); c.fill();
  c.strokeStyle = '#6a4a20'; c.stroke();
  c.fillStyle = '#3a2a10'; c.font = "11px 'Lilita One',system-ui"; c.textAlign = 'center';
  c.fillText(name.toUpperCase(), e.x, e.y - 18);
}
function drawDoor(x, y, open) {
  c.fillStyle = '#6a3a28'; c.fillRect(x - 18, y - 52, 36, 52);
  c.fillStyle = open ? '#c8f8a0' : '#f0d8a0'; c.fillRect(x - 12, y - 44, 24, 40);
  c.fillStyle = '#222'; c.beginPath(); c.arc(x + 6, y - 24, 2, 0, TAU); c.fill();
}
function drawCouch(x, y) {
  c.fillStyle = '#7a3a58'; roundRect(x - 28, y - 28, 56, 22, 8); c.fill();
  c.fillStyle = '#c46a88'; roundRect(x - 24, y - 40, 16, 16, 6); c.fill(); roundRect(x + 8, y - 40, 16, 16, 6); c.fill();
  c.fillStyle = '#5a2840'; c.fillRect(x - 30, y - 8, 8, 8); c.fillRect(x + 22, y - 8, 8, 8);
}
