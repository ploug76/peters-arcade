/* Pete's 420 Adventure — puzzle rules.
   Same water line, light line, and kit order as the review copy.
   Only Pete is a name. Everyone else is a role. Nothing has a price. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.RULES = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  var DIRS = ['N', 'E', 'S', 'W'];
  var OPP = { N: 'S', S: 'N', E: 'W', W: 'E' };
  var STEP = { N: { x: 0, y: -1 }, E: { x: 1, y: 0 }, S: { x: 0, y: 1 }, W: { x: -1, y: 0 } };
  var KIT_GOAL = ['tip', 'paper', 'flower', 'twist'];
  var KIT_ENDS = {
    tip: { L: '', R: 'a' },
    paper: { L: 'a', R: 'b' },
    flower: { L: 'b', R: 'c' },
    twist: { L: 'c', R: '' }
  };
  var AREAS = [
    {
      id: 'dispensary',
      name: 'Dispensary District',
      goalPuzzle: 'Spin the pipes so water reaches the plant.',
      goalMeet: 'Talk to the budtender.',
      wrong: {
        role: 'Counter Pal',
        lines: [
          'Welcome to the sticker side of the counter.',
          'I do not do plumbing. The budtender is the one by the plants.'
        ]
      },
      right: {
        role: 'Budtender',
        before: [
          'Those pipes have been sideways since we opened the lights.',
          'Spin the tiles until water runs from the seeds to the plant.'
        ],
        after: [
          'Listen to that. The plant already looks less dramatic.',
          'Take this Seed Pouch. It is a gift. Nothing here has a price.',
          'The grow house is next door. They care about light.'
        ],
        item: 'seeds',
        itemName: 'Seed Pouch'
      },
      puzzle: {
        kind: 'pipes',
        skin: 'water',
        cols: 3,
        rows: 3,
        enter: { r: 1, c: 0, dir: 'W' },
        exit: { r: 1, c: 2, dir: 'E' },
        tiles: [
          { base: 'SE', rot: 3 }, { base: 'EW', rot: 1 }, { base: 'WS', rot: 3 },
          { base: 'NW', rot: 2 }, null, { base: 'NE', rot: 3 },
          null, null, null
        ]
      }
    },
    {
      id: 'grow',
      name: 'Grow House',
      goalPuzzle: 'Spin the tiles so light reaches the plant.',
      goalMeet: 'Talk to the grower.',
      wrong: {
        role: 'Moth',
        lines: [
          'I flew into the lamp on purpose. Personal growth.',
          'The grower wears the sunny hat. I am just a fan of the bulb.'
        ]
      },
      right: {
        role: 'Grower',
        before: [
          'The lamp is shy today. It will not cross a broken tile.',
          'Turn the pieces until the yellow reaches the plant.'
        ],
        after: [
          'Beautiful. The plant says thanks, which is a new trick.',
          'Here is a Lounge Token. It is not money. It just means you are a friend.',
          'At the lounge, line the kit up: tip, then paper, then flower, then twist.'
        ],
        item: 'token',
        itemName: 'Lounge Token'
      },
      puzzle: {
        kind: 'pipes',
        skin: 'light',
        cols: 3,
        rows: 3,
        enter: { r: 0, c: 0, dir: 'W' },
        exit: { r: 2, c: 2, dir: 'E' },
        tiles: [
          { base: 'WS', rot: 3 }, null, null,
          { base: 'NS', rot: 1 }, null, null,
          { base: 'NE', rot: 2 }, { base: 'EW', rot: 1 }, { base: 'EW', rot: 1 }
        ]
      }
    },
    {
      id: 'lounge',
      name: 'Chill Lounge',
      goalPuzzle: 'Swap the kit until every joint glows.',
      goalMeet: 'Talk to the host.',
      wrong: {
        role: 'Parrot',
        lines: [
          'SQUAWK. I practiced a long speech and forgot every word.',
          'Nothing here has a price. The host saves the good seat for whoever finishes the kit.'
        ]
      },
      right: {
        role: 'Host',
        before: [
          'The kit on the table is in a twist. Literally.',
          'Swap the pieces until every joint glows.'
        ],
        after: [
          'There you go, Pete. The pieces fit, and you found the right people.',
          'Take a Chill Stamp. It is not a coupon. It just means the couch knows you.',
          'Kick back. You earned the quiet part.'
        ],
        item: 'stamp',
        itemName: 'Chill Stamp'
      },
      puzzle: {
        kind: 'kit',
        order: ['flower', 'tip', 'twist', 'paper']
      }
    }
  ];

  function connections(base, rot) {
    return base.split('').map(function (ch) {
      return DIRS[(DIRS.indexOf(ch) + (rot % 4) + 4) % 4];
    });
  }
  function connKey(base, rot) {
    return connections(base, rot).slice().sort().join('');
  }
  function opens(tiles, rots, cols, r, c, dir) {
    var t = tiles[r * cols + c];
    if (!t) return false;
    return connections(t.base, rots[r * cols + c]).indexOf(dir) >= 0;
  }
  function pipeReach(puzzle, rots) {
    var reached = {};
    var tiles = puzzle.tiles;
    var cols = puzzle.cols;
    var rows = puzzle.rows;
    var enter = puzzle.enter;
    var exit = puzzle.exit;
    if (!opens(tiles, rots, cols, enter.r, enter.c, enter.dir)) return { reached: reached, solved: false };
    var q = [[enter.r, enter.c]];
    reached[enter.r + ',' + enter.c] = true;
    var solved = false;
    while (q.length) {
      var cur = q.shift();
      var r = cur[0], c = cur[1];
      if (r === exit.r && c === exit.c && opens(tiles, rots, cols, r, c, exit.dir)) solved = true;
      var i = r * cols + c;
      var dirs = connections(tiles[i].base, rots[i]);
      for (var k = 0; k < dirs.length; k++) {
        var d = dirs[k];
        var rr = r + STEP[d].y;
        var cc = c + STEP[d].x;
        if (rr < 0 || cc < 0 || rr >= rows || cc >= cols) continue;
        if (!tiles[rr * cols + cc]) continue;
        if (!opens(tiles, rots, cols, rr, cc, OPP[d])) continue;
        var key = rr + ',' + cc;
        if (reached[key]) continue;
        reached[key] = true;
        q.push([rr, cc]);
      }
    }
    return { reached: reached, solved: solved };
  }
  function pipeSolved(puzzle, rots) { return pipeReach(puzzle, rots).solved; }
  function clicksFor(puzzle) {
    return puzzle.tiles.map(function (t) {
      if (!t) return 0;
      var want = connKey(t.base, 0);
      for (var k = 0; k < 4; k++) {
        if (connKey(t.base, (t.rot + k) % 4) === want) return k;
      }
      return 0;
    });
  }
  function kitJoints(order) {
    var n = 0, flags = [];
    for (var i = 0; i < order.length - 1; i++) {
      var fit = !!(KIT_ENDS[order[i]].R && KIT_ENDS[order[i]].R === KIT_ENDS[order[i + 1]].L);
      flags.push(fit);
      if (fit) n++;
    }
    return { n: n, flags: flags };
  }
  function kitSolved(order) {
    if (!order || order.length !== KIT_GOAL.length) return false;
    for (var i = 0; i < KIT_GOAL.length; i++) if (order[i] !== KIT_GOAL[i]) return false;
    return kitJoints(order).n === KIT_GOAL.length - 1;
  }
  function selfCheck() {
    AREAS.forEach(function (area) {
      var pz = area.puzzle;
      if (pz.kind === 'pipes') {
        var good = pz.tiles.map(function () { return 0; });
        if (!pipeSolved(pz, good)) throw new Error(area.id + ' solved rot is not solved');
        var init = pz.tiles.map(function (t) { return t ? t.rot : 0; });
        if (pipeSolved(pz, init)) throw new Error(area.id + ' starts solved');
        var rots = init.slice();
        clicksFor(pz).forEach(function (k, i) { if (pz.tiles[i]) rots[i] = (rots[i] + k) % 4; });
        if (!pipeSolved(pz, rots)) throw new Error(area.id + ' clicks do not solve');
      } else if (pz.kind === 'kit') {
        if (kitSolved(pz.order)) throw new Error(area.id + ' kit starts solved');
        if (!kitSolved(KIT_GOAL)) throw new Error('goal kit is not solved');
      } else throw new Error('unknown puzzle');
      var blob = JSON.stringify(area);
      if (/\$\d|\bdollars\b|\bfor sale\b/i.test(blob)) throw new Error(area.id + ' mentions a price');
    });
  }

  return {
    AREAS: AREAS, DIRS: DIRS, STEP: STEP, KIT_GOAL: KIT_GOAL, KIT_ENDS: KIT_ENDS,
    connections: connections, pipeReach: pipeReach, pipeSolved: pipeSolved, clicksFor: clicksFor,
    kitJoints: kitJoints, kitSolved: kitSolved, selfCheck: selfCheck
  };
});
