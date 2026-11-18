/* Palm Tree Pete — Release the Files (Volume 3)
   Stage data, evidence rules, and finishability checks.
   No rendering. Safe to load in the browser or in Node.
   Save key is owned by game.js and is not the Volume 1 or Volume 2 key. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.RTFLogic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const CATS = [
    { id: 'tape', name: 'Videotapes', hint: 'Loose tapes in coolers and on shelves.' },
    { id: 'drive', name: 'Hard drives', hint: 'Metal drives stashed in crates.' },
    { id: 'files', name: 'Paper files', hint: 'Stacks of paper folders.' },
    { id: 'laptop', name: 'Laptops', hint: 'Open laptops holding the island files.' },
    { id: 'thumb', name: 'Thumb drives', hint: 'Tiny drives in drawers and lockers.' },
    { id: 'reel', name: 'Recorder reels', hint: 'Master reels from the machines the camera cables run back to.' }
  ];
  const CAT_IDS = CATS.map(function (c) { return c.id; });

  function blank(cols) {
    return Array.from({ length: 12 }, function (_, r) {
      return Array.from({ length: cols }, function () { return r >= 10 ? '#' : ' '; });
    });
  }
  function stage(o) {
    const g = blank(o.cols);
    (o.dig || []).forEach(function (c) { g[10][c] = '='; g[11][c] = ' '; });
    (o.ledges || []).forEach(function (L) {
      for (let c = L[0]; c <= L[1]; c++) if (c >= 0 && c < o.cols) g[L[2]][c] = '=';
    });
    (o.gaps || []).forEach(function (B) {
      for (let c = B[0]; c <= B[1]; c++) if (c >= 0 && c < o.cols) { g[10][c] = ' '; g[11][c] = ' '; }
    });
    (o.pillars || []).forEach(function (c) {
      for (let r = 2; r <= 4; r++) if (c >= 0 && c < o.cols) g[r][c] = '#';
    });
    (o.decor || []).forEach(function () {});
    return Object.assign({}, o, { grid: g.map(function (row) { return row.join(''); }) });
  }

  const STAGES = [
    stage({
      id: 0, name: 'Cable Beach', wi: 0, cols: 48,
      hero: 2.4, exit: 45.2, exitKind: 'boat',
      blurb: 'A camera watches the sand. Follow its cable over the boardwalk to the shack recorder.',
      dig: [32, 33],
      ledges: [[12, 28, 7]],
      gaps: [[14, 19]],
      ladders: [{ c: 12.2, r0: 7, r1: 10 }, { c: 28.2, r0: 7, r1: 10 }],
      bushes: [{ c: 9, row: 10 }, { c: 22, row: 7 }],
      decor: [{ kind: 'kid5', c: 4.4, row: 10, f: 1, pose: 'point', say: 'Follow the cable!' }],
      goons: [{ c: 20, row: 7, f: 1, pose: 'point' }],
      kids: [{ id: 'kid-beach', c: 36.2, row: 10, kind: 'kid0' }],
      items: [
        { id: 'tape-beach', cat: 'tape', c: 8.2, row: 10, prop: 'cooler', clue: 'The cooler rattles like a tape.', prompt: 'Search the cooler' }
      ],
      cams: [{
        id: 'cam-beach', c: 6.2, r: 7.1, f: 1,
        machine: { id: 'reel-beach', cat: 'reel', c: 40.2, row: 10, clue: 'The cable plugs into this beach recorder.', prompt: 'Eject the master reel' },
        cable: [
          { c: 6.2, r: 7.1, via: 0 }, { c: 6.2, r: 9.82, via: 1 }, { c: 12.2, r: 9.82, via: 1 },
          { c: 12.2, r: 8.3, via: 1 }, { c: 12.2, r: 6.82, via: 1 }, { c: 16, r: 6.82, via: 1 },
          { c: 20, r: 6.82, via: 1 }, { c: 24, r: 6.82, via: 1 }, { c: 28.2, r: 6.82, via: 1 },
          { c: 28.2, r: 8.3, via: 1 }, { c: 28.2, r: 9.82, via: 1 }, { c: 32.5, r: 9.82, via: 1 },
          { c: 36.2, r: 9.82, via: 1 }, { c: 40.2, r: 9.72, via: 1 }
        ]
      }]
    }),
    stage({
      id: 1, name: 'Jungle Wire', wi: 1, cols: 52,
      hero: 2.6, exit: 49, exitKind: 'gate',
      blurb: 'The jungle camera cable climbs a ladder and ends in a hut recorder.',
      ledges: [[18, 40, 6]],
      ladders: [{ c: 18.2, r0: 6, r1: 10 }, { c: 40.2, r0: 6, r1: 10 }],
      bushes: [{ c: 8, row: 10 }, { c: 26, row: 6 }],
      goons: [{ c: 24, row: 6, f: 1, pose: 'point' }],
      kids: [{ id: 'kid-jungle', c: 44.5, row: 10, kind: 'kid1' }],
      items: [
        { id: 'drive-jungle', cat: 'drive', c: 10, row: 10, prop: 'crate', clue: 'A hard drive hums inside this crate.', prompt: 'Search the crate' },
        { id: 'files-jungle', cat: 'files', c: 30, row: 6, prop: 'stump', clue: 'Paper files are stuffed in the stump.', prompt: 'Search the stump' }
      ],
      cams: [{
        id: 'cam-jungle', c: 14.2, r: 7.3, f: 1,
        machine: { id: 'reel-jungle', cat: 'reel', c: 36, row: 6, clue: 'The cable ends at the hut recorder.', prompt: 'Eject the master reel' },
        cable: [
          { c: 14.2, r: 7.3, via: 0 }, { c: 14.2, r: 9.82, via: 1 }, { c: 18.2, r: 9.82, via: 1 },
          { c: 18.2, r: 7.8, via: 1 }, { c: 18.2, r: 5.85, via: 1 }, { c: 24, r: 5.85, via: 1 },
          { c: 30, r: 5.85, via: 1 }, { c: 36, r: 5.85, via: 1 }
        ]
      }]
    }),
    stage({
      id: 2, name: 'Villa Archive', wi: 2, cols: 58,
      hero: 2.5, exit: 54.5, exitKind: 'gate',
      blurb: 'Search the villa rooms. The hall camera cable climbs over a blocked corridor.',
      pillars: [15, 38, 46],
      gaps: [[24, 29]],
      ledges: [[20, 32, 7]],
      ladders: [{ c: 20.2, r0: 7, r1: 10 }, { c: 32.2, r0: 7, r1: 10 }],
      bushes: [{ c: 17, row: 10 }],
      goons: [{ c: 28, row: 7, f: 1, pose: 'point' }],
      kids: [{ id: 'kid-villa', c: 49, row: 10, kind: 'kid2' }],
      items: [
        { id: 'laptop-villa', cat: 'laptop', c: 8, row: 10, prop: 'desk', clue: 'A laptop on the desk is still on.', prompt: 'Take the laptop' },
        { id: 'files-villa', cat: 'files', c: 18, row: 10, prop: 'cabinet', clue: 'The cabinet is fat with paper files.', prompt: 'Search the cabinet' },
        { id: 'thumb-villa', cat: 'thumb', c: 23, row: 7, prop: 'drawer', clue: 'A thumb drive is taped under the drawer.', prompt: 'Search the drawer' }
      ],
      cams: [{
        id: 'cam-villa', c: 12.2, r: 6.4, f: 1,
        machine: { id: 'reel-villa', cat: 'reel', c: 42, row: 10, clue: 'The closet recorder is where this cable ends.', prompt: 'Eject the master reel' },
        cable: [
          { c: 12.2, r: 6.4, via: 0 }, { c: 12.2, r: 9.82, via: 1 }, { c: 18, r: 9.82, via: 1 },
          { c: 20.2, r: 9.82, via: 1 }, { c: 20.2, r: 8.2, via: 1 }, { c: 20.2, r: 6.82, via: 1 },
          { c: 23, r: 6.82, via: 1 }, { c: 28, r: 6.82, via: 1 }, { c: 32.2, r: 6.82, via: 1 },
          { c: 32.2, r: 8.3, via: 1 }, { c: 32.2, r: 9.82, via: 1 }, { c: 37, r: 9.82, via: 1 },
          { c: 42, r: 9.82, via: 1 }
        ]
      }]
    }),
    stage({
      id: 3, name: 'Striped Plaza', wi: 3, cols: 50,
      hero: 2.4, exit: 34.2, exitKind: 'gate',
      blurb: 'Cross the plaza on the cable boardwalk. The patio searchlight is a trap past the gate.',
      gaps: [[17, 23]],
      ledges: [[14, 32, 7]],
      ladders: [{ c: 14.2, r0: 7, r1: 10 }, { c: 32.2, r0: 7, r1: 10 }],
      bushes: [{ c: 10, row: 10 }, { c: 40, row: 10 }, { c: 44, row: 10 }],
      goons: [{ c: 22, row: 7, f: 1, pose: 'point' }],
      decor: [
        { kind: 'thug', c: 42.2, row: 10, f: 1, pose: 'punch' },
        { kind: 'thug', c: 43.8, row: 10, f: -1, pose: 'punch' }
      ],
      lights: [{ x0: 38, x1: 47, row: 10, per: 5.5 }],
      kids: [{ id: 'kid-house', c: 30, row: 7, kind: 'kid3' }],
      items: [
        { id: 'tape-house', cat: 'tape', c: 8, row: 10, prop: 'bench', clue: 'A videotape sits on the bench.', prompt: 'Take the videotape' },
        { id: 'thumb-house', cat: 'thumb', c: 26, row: 7, prop: 'locker', clue: 'The striped locker hides a thumb drive.', prompt: 'Search the locker' }
      ],
      cams: [{
        id: 'cam-house', c: 5.2, r: 6.5, f: 1,
        machine: { id: 'reel-house', cat: 'reel', c: 29, row: 7, clue: 'The studio cart is the end of the cable.', prompt: 'Eject the master reel' },
        cable: [
          { c: 5.2, r: 6.5, via: 0 }, { c: 5.2, r: 9.82, via: 1 }, { c: 10, r: 9.82, via: 1 },
          { c: 14.2, r: 9.82, via: 1 }, { c: 14.2, r: 8.2, via: 1 }, { c: 14.2, r: 6.82, via: 1 },
          { c: 18, r: 6.82, via: 1 }, { c: 22, r: 6.82, via: 1 }, { c: 26, r: 6.82, via: 1 },
          { c: 29, r: 6.82, via: 1 }
        ]
      }]
    }),
    stage({
      id: 4, name: 'Getaway Docks', wi: 4, cols: 54,
      hero: 2.4, exit: 50.5, exitKind: 'boat',
      blurb: 'Follow the pier cable, punch Pete\'s finger-guns away from the laptop, and release the files.',
      dig: [20, 21, 22],
      ladders: [],
      bushes: [{ c: 8, row: 10 }, { c: 30, row: 10 }],
      goons: [{ c: 16, row: 10, f: 1, pose: 'point' }],
      decor: [
        { kind: 'thug', c: 39.2, row: 10, f: 1, pose: 'punch' },
        { kind: 'thug', c: 40.8, row: 10, f: -1, pose: 'guns' }
      ],
      pete: { c: 34, row: 10, f: -1 },
      kids: [{ id: 'kid-dock', c: 44, row: 10, kind: 'kid4' }],
      items: [
        { id: 'drive-dock', cat: 'drive', c: 11, row: 10, prop: 'crate', clue: 'Another hard drive is in the pier crate.', prompt: 'Search the crate' },
        { id: 'laptop-dock', cat: 'laptop', c: 36.5, row: 10, prop: 'locker', need: 'pete', clue: 'Pete is perched on a laptop.', prompt: 'Take the laptop' }
      ],
      cams: [{
        id: 'cam-dock', c: 6.2, r: 7.2, f: 1,
        machine: { id: 'reel-dock', cat: 'reel', c: 26, row: 10, clue: 'The pier recorder is where the cable ends.', prompt: 'Eject the master reel' },
        cable: [
          { c: 6.2, r: 7.2, via: 0 }, { c: 6.2, r: 9.82, via: 1 }, { c: 11, r: 9.82, via: 1 },
          { c: 16, r: 9.82, via: 1 }, { c: 21, r: 9.82, via: 1 }, { c: 26, r: 9.82, via: 1 }
        ]
      }]
    })
  ];

  const ITEMS = [];
  const KIDS = [];
  STAGES.forEach(function (s) {
    s.items.forEach(function (it) { ITEMS.push(Object.assign({ stage: s.id }, it)); });
    s.cams.forEach(function (cam) { ITEMS.push(Object.assign({ stage: s.id, machine: 1 }, cam.machine)); });
    s.kids.forEach(function (k) { KIDS.push(Object.assign({ stage: s.id }, k)); });
  });

  function fresh() {
    return { v: 1, got: {}, kids: {}, pete: false, unlocked: 1, cleared: {}, muted: false, seenIntro: false, released: false };
  }
  function normalize(raw) {
    const s = fresh();
    if (!raw || typeof raw !== 'object') return s;
    s.v = 1;
    s.got = raw.got && typeof raw.got === 'object' ? Object.assign({}, raw.got) : {};
    s.kids = raw.kids && typeof raw.kids === 'object' ? Object.assign({}, raw.kids) : {};
    s.pete = !!raw.pete;
    s.unlocked = Math.max(1, Math.min(STAGES.length, raw.unlocked || 1));
    s.cleared = raw.cleared && typeof raw.cleared === 'object' ? Object.assign({}, raw.cleared) : {};
    s.muted = !!raw.muted;
    s.seenIntro = !!raw.seenIntro;
    s.released = !!raw.released;
    return s;
  }
  function itemById(id) { return ITEMS.find(function (it) { return it.id === id; }) || null; }
  function collect(save, id) {
    const it = itemById(id);
    if (!it) return { ok: false, reason: 'unknown' };
    if (save.got[id]) return { ok: false, reason: 'duplicate', item: it };
    if (it.need === 'pete' && !save.pete) return { ok: false, reason: 'locked', item: it };
    save.got[id] = true;
    return { ok: true, item: it };
  }
  function freeKid(save, id) {
    const k = KIDS.find(function (q) { return q.id === id; });
    if (!k) return { ok: false, reason: 'unknown' };
    if (save.kids[id]) return { ok: false, reason: 'duplicate', kid: k };
    save.kids[id] = true;
    return { ok: true, kid: k };
  }
  function punchPete(save) {
    if (save.pete) return { ok: false, reason: 'duplicate' };
    save.pete = true;
    return { ok: true };
  }
  function counts(save) {
    const out = {};
    CATS.forEach(function (c) { out[c.id] = { got: 0, total: 0, name: c.name }; });
    ITEMS.forEach(function (it) {
      const b = out[it.cat];
      if (!b) return;
      b.total++;
      if (save.got[it.id]) b.got++;
    });
    return out;
  }
  function kidCount(save) {
    return { got: KIDS.filter(function (k) { return save.kids[k.id]; }).length, total: KIDS.length };
  }
  function missing(save) {
    const c = counts(save);
    const names = CATS.filter(function (cat) { return c[cat.id].got < c[cat.id].total; }).map(function (cat) { return cat.name; });
    const kids = kidCount(save);
    if (kids.got < kids.total) names.push('Kids');
    return names;
  }
  function isComplete(save) {
    if (!ITEMS.every(function (it) { return save.got[it.id]; })) return false;
    if (!KIDS.every(function (k) { return save.kids[k.id]; })) return false;
    return true;
  }
  function release(save) {
    if (save.released) return { ok: false, reason: 'duplicate' };
    if (!isComplete(save)) return { ok: false, reason: 'incomplete', missing: missing(save) };
    save.released = true;
    return { ok: true };
  }
  /* Death never touches evidence, kids, or Pete. A respawn copies progress forward. */
  function afterDeath(save) { return normalize(JSON.parse(JSON.stringify(save))); }

  function tileChar(stage, c, r) {
    if (c < 0 || c >= stage.cols) return '#';
    if (r < 0) return ' ';
    if (r >= 12) return '#';
    return stage.grid[r][c] || '#';
  }
  function solidCh(ch) { return ch === '#' || ch === 'C'; }
  function surfaces(stage) {
    const list = [];
    for (let r = 2; r < 12; r++) for (let c = 0; c < stage.cols; c++) {
      const ch = tileChar(stage, c, r);
      if (ch !== '#' && ch !== '=' && ch !== 'C') continue;
      if (solidCh(tileChar(stage, c, r - 1)) || solidCh(tileChar(stage, c, r - 2))) continue;
      list.push({ c: c, r: r });
    }
    return list;
  }
  function reachable(stage) {
    const sur = surfaces(stage);
    const key = function (c, r) { return c + ',' + r; };
    const idx = {};
    sur.forEach(function (s, i) { idx[key(s.c, s.r)] = i; });
    const adj = sur.map(function () { return []; });
    function link(a, b) { if (a === b || a == null || b == null) return; adj[a].push(b); adj[b].push(a); }
    for (let i = 0; i < sur.length; i++) {
      const s = sur[i];
      const right = idx[key(s.c + 1, s.r)];
      if (right != null) link(i, right);
    }
    (stage.ladders || []).forEach(function (L) {
      const col = Math.round(L.c);
      const top = idx[key(col, L.r0)];
      const bot = idx[key(col, L.r1)];
      link(top, bot);
    });
    const startCol = Math.round(stage.hero);
    let start = null;
    sur.forEach(function (s, i) { if (s.c === startCol && s.r === 10) start = i; });
    if (start == null) sur.forEach(function (s, i) { if (s.c === startCol) start = i; });
    const seen = {};
    const q = [];
    if (start != null) { q.push(start); seen[start] = 1; }
    while (q.length) {
      const i = q.pop();
      adj[i].forEach(function (j) { if (!seen[j]) { seen[j] = 1; q.push(j); } });
    }
    function near(c, r) {
      for (let i = 0; i < sur.length; i++) {
        if (!seen[i]) continue;
        if (Math.abs(sur[i].c - c) <= 0.8 && Math.abs(sur[i].r - r) <= 0.95) return true;
      }
      return false;
    }
    const missing = [];
    function onLadder(c, r) {
      return (stage.ladders || []).some(function (L) {
        return Math.abs(L.c - c) <= 0.45 && r >= Math.min(L.r0, L.r1) - 0.15 && r <= Math.max(L.r0, L.r1) + 0.15 && near(Math.round(L.c), L.r0) && near(Math.round(L.c), L.r1);
      });
    }
    function need(c, r, name) { if (!near(c, r) && !onLadder(c, r)) missing.push(name + '@' + c + ',' + r); }
    (stage.items || []).forEach(function (it) { need(it.c, it.row, it.id); });
    (stage.kids || []).forEach(function (k) { need(k.c, k.row, k.id); });
    (stage.cams || []).forEach(function (cam) {
      need(cam.machine.c, cam.machine.row, cam.machine.id);
      (cam.cable || []).forEach(function (p, n) { if (p.via) need(p.c, p.r, cam.id + '#' + n); });
    });
    need(stage.exit, 10, 'exit');
    if (stage.pete) need(stage.pete.c, stage.pete.row, 'pete');
    (stage.goons || []).forEach(function (g, n) { need(g.c, g.row, 'goon' + n); });
    return { ok: missing.length === 0 && start != null, missing: missing, start: start != null, surfaces: sur.length };
  }
  function cableOk(stage) {
    const problems = [];
    (stage.cams || []).forEach(function (cam) {
      const pts = cam.cable || [];
      if (pts.length < 4) problems.push(cam.id + ' short');
      const camD = Math.hypot(pts[0].c - cam.c, pts[0].r - cam.r);
      if (camD > 1.2) problems.push(cam.id + ' detached from camera');
      const last = pts[pts.length - 1];
      const m = cam.machine;
      if (Math.hypot(last.c - m.c, last.r - (m.row - 0.28)) > 1.6 && Math.hypot(last.c - m.c, last.r - m.row) > 1.6) problems.push(cam.id + ' detached from machine');
      for (let i = 1; i < pts.length; i++) {
        const d = Math.hypot(pts[i].c - pts[i - 1].c, pts[i].r - pts[i - 1].r);
        if (d < 0.05) problems.push(cam.id + ' duplicate point');
        if (d > 8) problems.push(cam.id + ' gap ' + d.toFixed(1));
      }
      if (!pts.some(function (p) { return p.via; })) problems.push(cam.id + ' has no walkable cable');
    });
    return { ok: problems.length === 0, problems: problems };
  }

  return {
    CATS: CATS, CAT_IDS: CAT_IDS, STAGES: STAGES, ITEMS: ITEMS, KIDS: KIDS,
    fresh: fresh, normalize: normalize, collect: collect, freeKid: freeKid, punchPete: punchPete,
    counts: counts, kidCount: kidCount, missing: missing, isComplete: isComplete, release: release,
    afterDeath: afterDeath, reachable: reachable, cableOk: cableOk, surfaces: surfaces, itemById: itemById
  };
});
