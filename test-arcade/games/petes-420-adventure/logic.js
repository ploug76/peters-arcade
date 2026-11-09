/* Pete's 420 Adventure — data and rules.
   Edit AREAS to change rooms, puzzles, and who Pete meets.
   Map letters: # wall, . floor, P start, b puzzle bench, w wrong person, c right person.
   Pipe tiles: base is the SOLVED connections (letters N E S W). rot is how many
   clockwise turns the tile starts away from solved. null is a pot, not a pipe.
   Kit puzzle: order is the starting lineup. The fit is always tip, paper, flower, twist.
   Only "Pete" / "Peter" are used as names. Everyone else is a role. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.P420 = api;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

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
      sign: 'LEAF',
      goalPuzzle: 'Spin the pipes so water reaches the plant.',
      goalMeet: 'Talk to the budtender.',
      theme: {
        sky: '#14081c',
        floor: ['#1b4332', '#16382a'],
        wall: '#241433',
        wallTop: '#4a2870',
        neon: '#39ff88',
        brick: '#3a2458'
      },
      wrongSprite: 'raccoon',
      rightSprite: 'budtender',
      map: [
        '##########',
        '#P.......#',
        '#........#',
        '#.w......#',
        '#........#',
        '#...b....#',
        '#........#',
        '#......c.#',
        '##########'
      ],
      decor: [{ x: 8, y: 2, kind: 'pot' }, { x: 2, y: 6, kind: 'pot' }],
      puzzle: {
        kind: 'pipes',
        skin: 'water',
        title: 'Water Line',
        help: 'Tap a tile to turn it. Link the seeds to the plant.',
        enterLabel: 'SEEDS',
        exitLabel: 'PLANT',
        cols: 3,
        rows: 3,
        enter: { r: 1, c: 0, dir: 'W' },
        exit: { r: 1, c: 2, dir: 'E' },
        tiles: [
          { base: 'SE', rot: 3 }, { base: 'EW', rot: 1 }, { base: 'WS', rot: 3 },
          { base: 'NW', rot: 2 }, null, { base: 'NE', rot: 3 },
          null, null, null
        ]
      },
      wrong: {
        role: 'Counter Pal',
        short: 'PAL',
        lines: [
          'Welcome to the sticker side of the counter.',
          'I do not do plumbing. The budtender is the one by the plants.'
        ]
      },
      right: {
        role: 'Budtender',
        short: 'TENDER',
        before: [
          'Those pipes have been sideways since we opened the lights.',
          'Spin the tiles until water runs from the seeds to the plant. Then I will stop hovering.'
        ],
        after: [
          'Listen to that. The plant already looks less dramatic.',
          'Take this Seed Pouch. It is a gift. Nothing here has a price.',
          'The grow house is next door. They care about light. Follow the yellow.'
        ],
        item: { id: 'seeds', name: 'Seed Pouch' },
        next: 'Head to the grow house'
      }
    },
    {
      id: 'grow',
      name: 'Grow House',
      sign: 'GROW',
      goalPuzzle: 'Spin the tiles so light reaches the plant.',
      goalMeet: 'Talk to the grower.',
      theme: {
        sky: '#1a1208',
        floor: ['#3a3424', '#2e291c'],
        wall: '#4a3018',
        wallTop: '#7a5430',
        neon: '#ffd15a',
        brick: '#5a3a22'
      },
      wrongSprite: 'moth',
      rightSprite: 'grower',
      map: [
        '##########',
        '#P.......#',
        '#........#',
        '#....w...#',
        '#........#',
        '#......b.#',
        '#........#',
        '#.c......#',
        '##########'
      ],
      decor: [{ x: 2, y: 2, kind: 'lamp' }, { x: 8, y: 6, kind: 'pot' }],
      puzzle: {
        kind: 'pipes',
        skin: 'light',
        title: 'Light Line',
        help: 'Tap a tile to turn it. Link the lamp to the plant.',
        enterLabel: 'LAMP',
        exitLabel: 'PLANT',
        cols: 3,
        rows: 3,
        enter: { r: 0, c: 0, dir: 'W' },
        exit: { r: 2, c: 2, dir: 'E' },
        tiles: [
          { base: 'WS', rot: 3 }, null, null,
          { base: 'NS', rot: 1 }, null, null,
          { base: 'NE', rot: 2 }, { base: 'EW', rot: 1 }, { base: 'EW', rot: 1 }
        ]
      },
      wrong: {
        role: 'Moth',
        short: 'MOTH',
        lines: [
          'I flew into the lamp on purpose. Personal growth.',
          'The grower wears the sunny hat. I am just a fan of the bulb.'
        ]
      },
      right: {
        role: 'Grower',
        short: 'GROWER',
        before: [
          'The lamp is shy today. It will not cross a broken tile.',
          'Turn the pieces until the yellow reaches the plant.'
        ],
        after: [
          'Beautiful. The plant says thanks, which is a new trick.',
          'Here is a Lounge Token. It is not money. It just means you are a friend.',
          'At the lounge, line the kit up so the joints glow: tip, then paper, then flower, then twist.'
        ],
        item: { id: 'token', name: 'Lounge Token' },
        next: 'Head to the chill lounge'
      }
    },
    {
      id: 'lounge',
      name: 'Chill Lounge',
      sign: 'CHILL',
      goalPuzzle: 'Swap the kit until every joint glows.',
      goalMeet: 'Talk to the host.',
      theme: {
        sky: '#120818',
        floor: ['#2a1844', '#201238'],
        wall: '#3a2060',
        wallTop: '#6a38a0',
        neon: '#ff7ad9',
        brick: '#4a2880'
      },
      wrongSprite: 'parrot',
      rightSprite: 'host',
      map: [
        '##########',
        '#P.......#',
        '#........#',
        '#w.......#',
        '#........#',
        '#.....b..#',
        '#........#',
        '#.......c#',
        '##########'
      ],
      decor: [{ x: 4, y: 2, kind: 'couch' }, { x: 3, y: 6, kind: 'pot' }],
      puzzle: {
        kind: 'kit',
        title: 'Lounge Kit',
        help: 'Tap two pieces to swap them. A green edge means that joint fits.',
        order: ['flower', 'tip', 'twist', 'paper']
      },
      wrong: {
        role: 'Parrot',
        short: 'PARROT',
        lines: [
          'SQUAWK. I practiced a long speech and forgot every word.',
          'Just as well. Nothing here has a price. The host saves the good seat for whoever finishes the kit.'
        ]
      },
      right: {
        role: 'Host',
        short: 'HOST',
        before: [
          'The kit on the table is in a twist. Literally.',
          'Swap the pieces until every joint glows. The shapes only agree in one order.'
        ],
        after: [
          'There you go, Pete. The pieces fit, and you found the right people.',
          'Take a Chill Stamp. It is not a coupon. It just means the couch knows you.',
          'Kick back. You earned the quiet part.'
        ],
        item: { id: 'stamp', name: 'Chill Stamp' },
        next: 'Kick back'
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

  function pipeSolved(puzzle, rots) {
    return pipeReach(puzzle, rots).solved;
  }

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
    var n = 0;
    var flags = [];
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

  function kitSwaps(order) {
    var goal = KIT_GOAL.join(',');
    var keyOf = function (a) { return a.join(','); };
    var q = [[order.slice(), []]];
    var seen = {};
    seen[keyOf(order)] = true;
    while (q.length) {
      var item = q.shift();
      var cur = item[0];
      var path = item[1];
      if (keyOf(cur) === goal) return path;
      for (var i = 0; i < cur.length; i++) {
        for (var j = i + 1; j < cur.length; j++) {
          var next = cur.slice();
          var tmp = next[i];
          next[i] = next[j];
          next[j] = tmp;
          var k = keyOf(next);
          if (seen[k]) continue;
          seen[k] = true;
          q.push([next, path.concat([[i, j]])]);
        }
      }
    }
    throw new Error('kit has no solution');
  }

  function findChar(map, ch) {
    for (var y = 0; y < map.length; y++) {
      var x = map[y].indexOf(ch);
      if (x >= 0) return { x: x, y: y };
    }
    return null;
  }

  function inMap(map, x, y) {
    return y >= 0 && y < map.length && x >= 0 && x < map[0].length;
  }

  function walkable(map, x, y) {
    if (!inMap(map, x, y)) return false;
    var ch = map[y][x];
    return ch === '.' || ch === 'P';
  }

  function pathBetween(map, from, targetChar) {
    var t = findChar(map, targetChar);
    if (!t) throw new Error('missing ' + targetChar);
    var goals = {};
    var dirs = ['N', 'E', 'S', 'W'];
    for (var i = 0; i < dirs.length; i++) {
      var d = dirs[i];
      var x = t.x + STEP[d].x;
      var y = t.y + STEP[d].y;
      if (walkable(map, x, y) || (x === from.x && y === from.y)) goals[x + ',' + y] = true;
    }
    if (goals[from.x + ',' + from.y]) return [];
    var q = [[from.x, from.y, []]];
    var seen = {};
    seen[from.x + ',' + from.y] = true;
    while (q.length) {
      var cur = q.shift();
      for (var k = 0; k < dirs.length; k++) {
        var step = STEP[dirs[k]];
        var nx = cur[0] + step.x;
        var ny = cur[1] + step.y;
        var key = nx + ',' + ny;
        if (seen[key] || !walkable(map, nx, ny)) continue;
        seen[key] = true;
        var np = cur[2].concat(dirs[k]);
        if (goals[key]) return np;
        q.push([nx, ny, np]);
      }
    }
    throw new Error('no path to ' + targetChar);
  }

  function selfCheck() {
    AREAS.forEach(function (area) {
      var w = area.map[0].length;
      area.map.forEach(function (row, i) {
        if (row.length !== w) throw new Error(area.id + ' row ' + i + ' width');
      });
      ['P', 'b', 'w', 'c'].forEach(function (ch) {
        if (!findChar(area.map, ch)) throw new Error(area.id + ' missing ' + ch);
      });
      var start = findChar(area.map, 'P');
      var toB = pathBetween(area.map, start, 'b');
      var x = start.x, y = start.y;
      toB.forEach(function (d) { x += STEP[d].x; y += STEP[d].y; });
      pathBetween(area.map, { x: x, y: y }, 'c');
      var pz = area.puzzle;
      if (pz.kind === 'pipes') {
        var good = pz.tiles.map(function () { return 0; });
        if (!pipeSolved(pz, good)) throw new Error(area.id + ' solved rot is not solved');
        var init = pz.tiles.map(function (t) { return t ? t.rot : 0; });
        if (pipeSolved(pz, init)) throw new Error(area.id + ' starts solved');
        var rots = init.slice();
        clicksFor(pz).forEach(function (k, i) {
          if (pz.tiles[i]) rots[i] = (rots[i] + k) % 4;
        });
        if (!pipeSolved(pz, rots)) throw new Error(area.id + ' clicks do not solve');
      } else if (pz.kind === 'kit') {
        if (kitSolved(pz.order)) throw new Error(area.id + ' kit starts solved');
        var swaps = kitSwaps(pz.order);
        if (swaps.length < 2) throw new Error(area.id + ' kit is too short');
        var order = pz.order.slice();
        swaps.forEach(function (pair) {
          var tmp = order[pair[0]];
          order[pair[0]] = order[pair[1]];
          order[pair[1]] = tmp;
        });
        if (!kitSolved(order)) throw new Error(area.id + ' kit swaps fail');
      } else {
        throw new Error('unknown puzzle ' + pz.kind);
      }
    });
  }

  return {
    AREAS: AREAS,
    DIRS: DIRS,
    STEP: STEP,
    KIT_GOAL: KIT_GOAL,
    KIT_ENDS: KIT_ENDS,
    connections: connections,
    pipeReach: pipeReach,
    pipeSolved: pipeSolved,
    clicksFor: clicksFor,
    kitJoints: kitJoints,
    kitSolved: kitSolved,
    kitSwaps: kitSwaps,
    findChar: findChar,
    walkable: walkable,
    pathBetween: pathBetween,
    selfCheck: selfCheck
  };
});
