/* Palm Tree Pete — Release the Files. Volume 3.
   Fictional island adventure. Same character rigs as Volume 1 (PTP.drawMan), new poses and evidence routes.
   Progress key ptp3-release-the-files-v1 is separate from Volume 1 and Volume 2. */
(function () {
  'use strict';
  const R = window.RTFLogic;
  const { X } = K;
  const TAU = Math.PI * 2;
  const T = 32, GY = 10 * T;
  const SAVEK = 'pa-test-ptp3-release-the-files-v1';
  const TF = '"PTP Anton",Impact,"Arial Black",system-ui,sans-serif';
  const QA = /[?&]qa=1/.test(location.search);
  const COVER = /[?&]shot=cover/.test(location.search);
  if (/[?&]reset=1/.test(location.search)) { try { localStorage.removeItem(SAVEK); } catch (e) {} }
  let save = R.normalize(K.load(SAVEK, R.fresh()));
  if (QA) save.seenIntro = true;
  const persist = () => K.store(SAVEK, save);
  K.FONT = '"Lilita One","Arial Rounded MT Bold",system-ui,sans-serif';
  let RT = 0, G = null, sceneName = 'title';
  const pend = { jump: 0, act: 0 };
  /* One finger per pointer. Swipe fingers move; JUMP and ACTION are the round buttons. */
  const fingers = new Map();
  const IN = { dir: 0, run: 0, up: 0, down: 0, jump: 0, act: 0 };
  let SONG = null, SONG2 = null;
  try {
    SONG = K.compose(11, { key: 57, bpm: 102, drum: 'half', wave: { lead: 'triangle', bass: 'sine' }, scale: [0, 3, 5, 7, 10, 12], dens: .34 });
    SONG2 = K.compose(21, { key: 60, bpm: 112, drum: 'four', wave: { lead: 'square', bass: 'triangle' }, scale: [0, 2, 4, 7, 9, 12], dens: .4 });
    SONG.lv = .045; SONG2.lv = .05;
  } catch (e) {}
  const wx = c => c * T, wy = r => r * T;
  function tile(c, r) {
    const g = G.lv.grid;
    if (c < 0 || c >= G.st.cols) return '#';
    if (r < 0) return ' ';
    if (r >= 12) return '#';
    return g[r][c];
  }
  const solid = ch => ch === '#' || ch === 'C';
  function solidAt(x, y) { return solid(tile(Math.floor(x / T), Math.floor(y / T))); }
  /* Same phone scheme as Rescue from Palm Tree Pete's Island and Kelly's Giraffe Adventure
     (Peter, 31 Oct): swipe anywhere to move, round ACTION (green) left of round JUMP (orange). No D-pad. */
  function ctlLayout() {
    const s = K.safe, W = K.W, H = K.H, land = !!K.land;
    const gap = land ? 14 : 16;
    let r = land ? Math.round(Math.min(46, Math.max(32, H * 0.11))) : Math.round(Math.min(56, Math.max(36, Math.min(W * 0.105, H * 0.075))));
    const margin = land ? 12 : 16;
    let ax = W - s.r - margin - r;
    let bx = ax - r - gap - r;
    const minX = s.l + (land ? 120 : 150);
    if (bx - r < minX) {
      const room = Math.max(28, (W - s.r - margin - minX - gap) / 4);
      r = Math.max(28, Math.min(r, room));
      ax = W - s.r - margin - r;
      bx = ax - r - gap - r;
    }
    const cy = H - s.b - (land ? 10 : 14) - r;
    const bandTop = cy - r - (land ? 10 : 16);
    return {
      land: land, r: r, bandTop: bandTop,
      hint: land ? 'SWIPE TO MOVE' : 'SWIPE ANYWHERE',
      hint2: land ? '' : 'TO MOVE',
      act: { cx: bx, cy: cy, r: r, label: 'ACTION' },
      jump: { cx: ax, cy: cy, r: r, label: 'JUMP' }
    };
  }
  function circleAt(x, y) {
    const C = ctlLayout();
    let best = null, bd = 1e9;
    for (const k of ['act', 'jump']) {
      const q = C[k], d = Math.hypot(x - q.cx, y - q.cy), lim = Math.max(q.r + 12, q.r * 1.55);
      if (d <= lim && d / q.r < bd) { bd = d / q.r; best = k; }
    }
    return best;
  }
  /* Vol1 swipe: 16px dead zone, anchor follows past 56px, mostly one axis. Hold keeps the direction. */
  function swipeDirs(q, x, y) {
    let dx = x - q.ox, dy = y - q.oy, d = Math.hypot(dx, dy);
    if (d > 56) { q.ox = x - dx * 56 / d; q.oy = y - dy * 56 / d; dx = x - q.ox; dy = y - q.oy; d = 56; }
    if (d < 16) return q.dirs || {};
    const ax = Math.abs(dx), ay = Math.abs(dy), o = {}, Tn = 2.414;
    if (ax > ay / Tn) o[dx > 0 ? 'r' : 'l'] = 1;
    if (ay > ax / Tn) o[dy > 0 ? 'd' : 'u'] = 1;
    return o;
  }
  function viewGeom() {
    const C = ctlLayout();
    const top = K.safe.t + (K.land ? 54 : 64);
    const bottom = Math.max(top + 90, C.bandTop - 4);
    const sc = Math.max(.55, Math.min((K.W - K.safe.l - K.safe.r) / ((K.land ? 22 : 13) * T), (bottom - top) / (7.6 * T)));
    const oy = bottom - GY * sc - 4;
    return { sc: sc, oy: oy, top: top, bottom: bottom };
  }
  function build(st) {
    const grid = st.grid.map(row => row.split(''));
    const water = [];
    for (let c = 0; c < st.cols; c++) if (grid[10][c] === ' ') water.push(c);
    return {
      grid: grid, water: water,
      ladders: (st.ladders || []).map(L => ({ x: wx(L.c), y0: wy(L.r0), y1: wy(L.r1) })),
      bushes: (st.bushes || []).map((b, i) => ({ x: wx(b.c), fy: wy(b.row), w: T * 1.85, sd: i + 3 })),
      goons: (st.goons || []).map(g => ({ x: wx(g.c), fy: wy(g.row), f: g.f, pose: g.pose || 'point', down: 0, meter: 0 })),
      kids: (st.kids || []).map(k => Object.assign({}, k, { x: wx(k.c), fy: wy(k.row) })),
      items: (st.items || []).map(it => Object.assign({}, it, { x: wx(it.c), fy: wy(it.row) })),
      cams: (st.cams || []).map(cam => ({
        id: cam.id, f: cam.f || 1, x: wx(cam.c), y: wy(cam.r),
        cable: cam.cable.map(p => ({ x: wx(p.c), y: wy(p.r), via: p.via })),
        machine: Object.assign({}, cam.machine, { x: wx(cam.machine.c), fy: wy(cam.machine.row) })
      })),
      decor: (st.decor || []).map(d => Object.assign({}, d, { x: wx(d.c), fy: wy(d.row) })),
      lights: (st.lights || []).map(l => ({ x0: wx(l.x0), x1: wx(l.x1), fy: wy(l.row), per: l.per, ph: .6, m: 0 })),
      pete: st.pete ? { x: wx(st.pete.c), fy: wy(st.pete.row), f: st.pete.f, down: !!save.pete } : null,
      exitX: wx(st.exit)
    };
  }
  function newHero(x, y) {
    return { x: x, y: y, vx: 0, vy: 0, f: 1, onG: true, climb: null, inv: 0, punchT: 0, hidden: false, coyote: 0, gait: new K.Gait({ leg: 27, walk: 70, run: 120 }) };
  }
  function wirePoints() {
    const cam = G.lv.cams[0];
    return cam.cable.filter(p => p.via).map(p => ({ x: p.x, y: p.y, k: 'wire' }));
  }
  function leftover() {
    const out = [];
    G.lv.items.forEach(it => { if (!save.got[it.id] && !(it.need === 'pete' && !save.pete)) out.push({ x: it.x, y: it.fy, k: 'item', id: it.id }); });
    if (G.lv.pete && !save.pete) out.push({ x: G.lv.pete.x, y: G.lv.pete.fy, k: 'pete' });
    G.lv.items.forEach(it => { if (!save.got[it.id] && it.need === 'pete' && save.pete) out.push({ x: it.x, y: it.fy, k: 'item', id: it.id }); });
    G.lv.kids.forEach(k => { if (!save.kids[k.id]) out.push({ x: k.x, y: k.fy, k: 'kid', id: k.id }); });
    G.lv.cams.forEach(cam => { if (!save.got[cam.machine.id]) out.push({ x: cam.machine.x, y: cam.machine.fy, k: 'machine' }); });
    out.push({ x: G.lv.exitX, y: GY, k: 'exit' });
    return out;
  }
  function currentGoal() {
    if (G.wi < G.wire.length) return G.wire[G.wi];
    return leftover()[0];
  }
  function startStage(i) {
    const st = R.STAGES[i];
    G = { st: st, lv: build(st), t: 0, hearts: 4, maxH: 4, state: 'play', cam: 0, wi: 0, trail: [], party: [], sheet: false, ct: 0 };
    G.wire = wirePoints();
    G.hero = newHero(wx(st.hero), GY);
    G.hero.inv = .4;
    fingers.clear();
    sceneName = 'play';
    K.go(Play);
    if (SONG) K.music.play(SONG);
  }
  function ladderAt(x, y) {
    for (const l of G.lv.ladders) if (Math.abs(x - l.x) < T * .72 && y > l.y0 - 6 && y <= l.y1 + 4) return l;
    return null;
  }
  function inBush(H) {
    for (const b of G.lv.bushes) if (Math.abs(H.x - b.x) < b.w * .42 && Math.abs(H.y - b.fy) < 18) return b;
    return null;
  }
  function heroUpdate(dt) {
    const H = G.hero;
    if (H.inv > 0) H.inv -= dt;
    if (H.punchT > 0) H.punchT -= dt;
    const run = IN.run || (window.__RTF && __RTF.fast);
    const spd = (window.__RTF && __RTF.fast) ? 200 : (run && IN.dir ? 96 : 72);
    const lad = ladderAt(H.x, H.y);
    if (!H.climb && lad && ((IN.up && H.y > lad.y0 + 2) || (IN.down && H.onG && H.y < lad.y1 - 2 && H.y <= lad.y0 + T))) {
      H.climb = lad; H.vx = 0; H.vy = 0;
    }
    if (H.climb) {
      const l = H.climb;
      H.x += (l.x - H.x) * Math.min(1, dt * 14);
      const v = IN.up ? -((window.__RTF && __RTF.fast) ? 190 : 110) : IN.down ? ((window.__RTF && __RTF.fast) ? 190 : 110) : 0;
      H.y = K.clamp(H.y + v * dt, l.y0, l.y1);
      H.onG = false; H.vy = 0;
      if (H.y <= l.y0 + .5 && (IN.up || v < 0)) { H.y = l.y0; H.climb = null; H.onG = true; }
      else if (H.y >= l.y1 - .5 && IN.down) { H.y = l.y1; H.climb = null; H.onG = true; }
      else if (IN.jump) { H.climb = null; H.vy = -520; H.onG = false; IN.jump = 0; }
      H.gait.update(0, dt);
      return;
    }
    H.hidden = !!(IN.down && H.onG && inBush(H));
    let tv = IN.dir * (H.hidden ? 30 : spd);
    if (H.punchT > 0) tv *= .35;
    const acc = H.onG ? 1400 : 700;
    H.vx = H.vx < tv ? Math.min(tv, H.vx + acc * dt) : Math.max(tv, H.vx - acc * dt);
    if (IN.dir) H.f = IN.dir;
    if (IN.jump && (H.onG || H.coyote > 0)) { H.vy = -640; H.onG = false; H.coyote = 0; K.sfx('jump'); IN.jump = 0; }
    if (!H.onG) { H.vy = Math.min(980, H.vy + 1500 * dt); H.coyote -= dt; }
    const ox = H.x;
    H.x += H.vx * dt;
    const hw = 10, hh = H.hidden ? 36 : 56;
    for (const yy of [H.y - 6, H.y - hh * .55, H.y - hh + 4]) {
      if (solidAt(H.x + hw, yy)) { H.x = Math.floor((H.x + hw) / T) * T - hw - .01; H.vx = 0; }
      if (solidAt(H.x - hw, yy)) { H.x = (Math.floor((H.x - hw) / T) + 1) * T + hw + .01; H.vx = 0; }
    }
    H.x = K.clamp(H.x, 14, G.st.cols * T - 14);
    const oy = H.y;
    H.y += H.vy * dt;
    const was = H.onG;
    H.onG = false;
    if (H.vy >= 0) {
      for (const xx of [H.x - hw + 2, H.x + hw - 2]) {
        const c = Math.floor(xx / T), ri = Math.floor((H.y + 1) / T), ch = tile(c, ri), top = ri * T;
        if (solid(ch) && oy <= top + 8) { H.y = top; H.vy = 0; H.onG = true; }
        else if (ch === '=' && oy <= top + 1) { H.y = top; H.vy = 0; H.onG = true; }
      }
    } else {
      for (const xx of [H.x - hw + 2, H.x + hw - 2]) {
        if (solidAt(xx, H.y - hh)) { H.y = (Math.floor((H.y - hh) / T) + 1) * T + hh; H.vy = 40; }
      }
    }
    if (!H.onG && was && H.vy >= 0) H.coyote = .12;
    H.gait.update(H.onG ? H.x - ox : 0, dt);
    if (H.y > 13 * T) { K.sfx('splash'); hurt('splash'); }
  }
  function coneHit(ex, ey, ang, len, half, H) {
    if (H.hidden || H.inv > 0) return false;
    const pts = [[H.x, H.y - 48], [H.x, H.y - 24]];
    for (const p of pts) {
      const dx = p[0] - ex, dy = p[1] - ey, d = Math.hypot(dx, dy);
      if (d > len) continue;
      let a = Math.atan2(dy, dx) - ang;
      a = Math.atan2(Math.sin(a), Math.cos(a));
      if (Math.abs(a) < half) return true;
    }
    return false;
  }
  function guards(dt) {
    const H = G.hero;
    let hot = false;
    for (const t of G.lv.goons) {
      if (t.down) { t.meter = 0; continue; }
      const eye = { x: t.x + t.f * 16, y: t.fy - 46, a: t.f > 0 ? .15 : Math.PI - .15 };
      const see = G.state === 'play' && coneHit(eye.x, eye.y, eye.a, 168, .42, H);
      t.meter = see ? Math.min(1, t.meter + dt * 1.7) : Math.max(0, t.meter - dt);
      if (t.meter >= 1) hot = true;
    }
    for (const l of G.lv.lights) {
      l.cx = K.lerp(l.x0, l.x1, .5 + .5 * Math.sin(G.t * TAU / l.per + l.ph));
      const inL = G.state === 'play' && !H.hidden && Math.abs(H.x - l.cx) < 46 && Math.abs(H.y - l.fy) < 20;
      l.m = inL ? Math.min(1, (l.m || 0) + dt * 1.8) : Math.max(0, (l.m || 0) - dt);
      if (l.m >= 1) hot = true;
    }
    if (hot) hurt('spot');
  }
  function hurt() {
    if (!G || G.state !== 'play' || G.hero.inv > 0) return;
    G.hearts--;
    G.state = 'caught';
    G.ct = .65;
    K.sfx('hurt');
    K.float('SPOTTED!', G.hero.x, G.hero.y - 70, '#ff5a5a', 22);
  }
  function respawn() {
    if (G.hearts <= 0) { G.hearts = G.maxH; K.toast('Your files are still in the bag'); }
    const st = G.st;
    G.lv.goons.forEach(t => { t.down = 0; t.meter = 0; });
    G.hero = newHero(wx(st.hero), GY);
    G.hero.inv = 1.3;
    G.wi = 0;
    G.party = [];
    G.state = 'play';
  }
  function closeEnough(x, y, rx) {
    const H = G.hero;
    return Math.abs(H.x - x) < (rx || 46) && Math.abs(H.y - y) < 32;
  }
  function nearestAct() {
    const lv = G.lv;
    if (lv.pete && !lv.pete.down && closeEnough(lv.pete.x, lv.pete.fy, 54)) return { k: 'pete', prompt: 'Punch' };
    for (const t of lv.goons) if (!t.down && closeEnough(t.x, t.fy, 48) && Math.sign(G.hero.x - t.x) !== t.f) return { k: 'bonk', t: t, prompt: 'Punch' };
    for (const it of lv.items) if (!save.got[it.id] && closeEnough(it.x, it.fy, 46)) return { k: 'item', it: it, prompt: it.prompt };
    for (const cam of lv.cams) if (!save.got[cam.machine.id] && closeEnough(cam.machine.x, cam.machine.fy, 52)) return { k: 'item', it: cam.machine, machine: 1, prompt: cam.machine.prompt };
    for (const k of lv.kids) if (!save.kids[k.id] && closeEnough(k.x, k.fy, 48)) return { k: 'kid', kid: k, prompt: 'Free the kid' };
    if (closeEnough(lv.exitX, GY, 52)) {
      const last = G.st.id === R.STAGES.length - 1;
      const ready = last && R.isComplete(save);
      return { k: 'exit', prompt: ready ? 'Release the Files' : (last ? 'Check the boat' : 'Leave this shore') };
    }
    return null;
  }
  function doAction() {
    const a = nearestAct();
    if (!a) return false;
    const H = G.hero;
    if (a.k === 'pete') {
      G.lv.pete.down = 1;
      R.punchPete(save); persist();
      H.punchT = .42; H.f = Math.sign(G.lv.pete.x - H.x) || 1;
      K.sfx('punch'); K.float('POW!', G.lv.pete.x, G.lv.pete.fy - 78, '#ffd23f', 26);
      K.toast('Pete dropped the laptop');
      return true;
    }
    if (a.k === 'bonk') {
      a.t.down = 1; a.t.meter = 0;
      H.punchT = .38; H.f = Math.sign(a.t.x - H.x) || H.f;
      K.sfx('bonk'); K.float('BONK!', a.t.x, a.t.fy - 74, '#ffd23f', 24);
      return true;
    }
    if (a.k === 'item') {
      const res = R.collect(save, a.it.id);
      if (!res.ok && res.reason === 'locked') { K.toast('Punch Pete first — he is sitting on it'); return true; }
      if (!res.ok && res.reason === 'duplicate') { K.toast('Already bagged'); return true; }
      if (!res.ok) return false;
      persist();
      H.punchT = .2;
      K.sfx('free');
      K.float(pretty(a.it), a.it.x, a.it.fy - 64, '#b8ff8a', 18);
      return true;
    }
    if (a.k === 'kid') {
      const res = R.freeKid(save, a.kid.id);
      if (!res.ok) { K.toast('Already safe'); return true; }
      persist();
      G.party.push({ kind: a.kid.kind, x: a.kid.x, y: a.kid.fy, f: 1, gait: new K.Gait({ leg: 18, walk: 60, run: 100 }) });
      K.sfx('free'); K.float('KID SAFE!', a.kid.x, a.kid.fy - 70, '#9be07a', 22);
      return true;
    }
    if (a.k === 'exit') {
      const id = G.st.id;
      const local = R.ITEMS.filter(it => it.stage === id).every(it => save.got[it.id]) && R.KIDS.filter(k => k.stage === id).every(k => save.kids[k.id]);
      if (local) save.cleared[id] = true;
      save.unlocked = Math.max(save.unlocked, Math.min(R.STAGES.length, id + 2));
      if (id === R.STAGES.length - 1 && R.isComplete(save)) {
        R.release(save); persist();
        sceneName = 'ending';
        K.go(Ending);
        return true;
      }
      persist();
      if (id === R.STAGES.length - 1) K.toast('Still out there: ' + R.missing(save).join(', '));
      else if (!local) K.toast('Shore saved. You can come back for the rest.');
      sceneName = 'map';
      K.go(Shores);
      return true;
    }
    return false;
  }
  function pretty(it) {
    const place = { beach: 'Beach', jungle: 'Jungle', villa: 'Villa', house: 'Plaza', dock: 'Dock' }[(it.id || '').split('-')[1]] || '';
    const noun = { tape: 'videotape', drive: 'hard drive', files: 'paper files', laptop: 'laptop', thumb: 'thumb drive', reel: 'recorder reel' }[it.cat] || 'evidence';
    return (place ? place + ' ' : '') + noun;
  }
  function gapBetween(x0, x1) {
    const a = Math.floor(Math.min(x0, x1) / T), b = Math.floor(Math.max(x0, x1) / T);
    for (let c = a; c <= b; c++) if (tile(c, 10) === ' ') return true;
    return false;
  }
  function pickLadder(H, goal) {
    let best = null, score = 1e9;
    for (const L of G.lv.ladders) {
      const top = Math.min(L.y0, L.y1), bot = Math.max(L.y0, L.y1);
      const hi = Math.min(H.y, goal.y), lo = Math.max(H.y, goal.y);
      if (top > hi + 10 || bot < lo - 10) continue;
      const between = (L.x - H.x) * (L.x - goal.x) <= (T * 2) * (T * 2);
      const d = Math.abs(L.x - H.x) + (between ? 0 : 500);
      if (d < score) { score = d; best = L; }
    }
    return best;
  }
  function goonBlock(goal) {
    const H = G.hero;
    for (const t of G.lv.goons) {
      if (t.down || Math.abs(t.fy - H.y) > 30) continue;
      const min = Math.min(H.x, goal.x) - 10, max = Math.max(H.x, goal.x) + 10;
      if (t.x < min || t.x > max) continue;
      if (Math.abs(t.x - H.x) > 150 && Math.abs(t.x - goal.x) > 20) continue;
      return t;
    }
    return null;
  }
  function bot() {
    const H = G.hero;
    IN.dir = 0; IN.run = 0; IN.up = 0; IN.down = 0; IN.jump = 0;
    const goal = currentGoal();
    if (!goal) return;
    if (H.climb) {
      const farX = Math.abs(goal.x - H.x) > 28;
      if (farX || (G.idle || 0) > 0.8) {
        if (goal.y + 6 >= H.y) IN.down = 1; else IN.up = 1;
      } else {
        IN.up = goal.y < H.y - 4 ? 1 : 0;
        IN.down = goal.y > H.y + 4 ? 1 : 0;
        if (Math.hypot(H.x - goal.x, H.y - goal.y) < 18 && G.wi < G.wire.length) G.wi++;
      }
      return;
    }
    const act = nearestAct();
    if (act && act.k !== 'exit') { doAction(); }
    else if (act && act.k === 'exit' && goal.k === 'exit' && Math.abs(H.x - goal.x) < 56) { doAction(); return; }
    const g = goonBlock(goal);
    if (g) {
      const behind = Math.sign(H.x - g.x) !== g.f;
      const ad = Math.abs(H.x - g.x);
      if (behind && ad < 46 && Math.abs(H.y - g.fy) < 30) { doAction(); return; }
      IN.dir = behind ? Math.sign(g.x - H.x) : -g.f;
      IN.run = ad > 70 ? 1 : 0;
      return;
    }
    const same = Math.abs(goal.y - H.y) <= 26;
    if (!same) {
      const L = pickLadder(H, goal);
      if (L) {
        if (Math.abs(H.x - L.x) > 12) { IN.dir = Math.sign(L.x - H.x); IN.run = 1; return; }
        IN.up = goal.y < H.y ? 1 : 0;
        IN.down = goal.y > H.y ? 1 : 0;
        return;
      }
    } else if (Math.abs(H.y - GY) < 28 && gapBetween(H.x, goal.x)) {
      const side = Math.sign(goal.x - H.x) || 1;
      let L = null;
      for (const q of G.lv.ladders) {
        if (side > 0 && q.x >= H.x - 16 && (!L || q.x < L.x)) L = q;
        if (side < 0 && q.x <= H.x + 16 && (!L || q.x > L.x)) L = q;
      }
      if (L && Math.abs(H.x - L.x) > 12) { IN.dir = Math.sign(L.x - H.x); IN.run = 1; return; }
      if (L) { IN.up = 1; return; }
    }
    if (Math.hypot(H.x - goal.x, H.y - goal.y) < 22) {
      if (G.wi < G.wire.length) G.wi++;
      return;
    }
    IN.dir = Math.sign(goal.x - H.x);
    IN.run = 1;
  }
  function readInput() {
    IN.dir = 0; IN.run = 0; IN.up = 0; IN.down = 0;
    const k = K.keys;
    if (k.ArrowLeft || k.KeyA) IN.dir = -1;
    if (k.ArrowRight || k.KeyD) IN.dir = 1;
    if (k.ArrowUp || k.KeyW) IN.up = 1;
    if (k.ArrowDown || k.KeyS) IN.down = 1;
    if (k.ShiftLeft || k.ShiftRight) IN.run = 1;
    let swL = !!(k.ArrowLeft || k.KeyA), swR = !!(k.ArrowRight || k.KeyD), swU = !!IN.up, swD = !!IN.down;
    for (const f of fingers.values()) {
      if (f.kind !== 'swipe' || !f.dirs) continue;
      if (f.dirs.l) swL = true;
      if (f.dirs.r) swR = true;
      if (f.dirs.u) swU = true;
      if (f.dirs.d) swD = true;
    }
    IN.dir = swR && !swL ? 1 : swL && !swR ? -1 : 0;
    IN.up = swU ? 1 : 0;
    IN.down = swD ? 1 : 0;
    const P = K.pad;
    if (P.on) {
      if (P.held.left || P.ax.x < -.35) IN.dir = -1;
      if (P.held.right || P.ax.x > .35) IN.dir = 1;
      if (P.held.up || P.ax.y < -.55) IN.up = 1;
      if (P.held.down || P.ax.y > .55) IN.down = 1;
      if (P.pr.a) pend.jump = 1;
      if (P.pr.x || P.pr.b) pend.act = 1;
    }
    if (pend.jump) { IN.jump = 1; pend.jump = 0; }
    if (pend.act) { IN.act = 1; pend.act = 0; }
    if (K.kp.Space || K.kp.KeyZ || K.kp.KeyK) IN.jump = 1;
    if ((K.kp.ArrowUp || K.kp.KeyW) && !ladderAt(G.hero.x, G.hero.y)) IN.jump = 1;
    if (K.kp.KeyX || K.kp.KeyJ || K.kp.KeyE) IN.act = 1;
  }
  function partyUpdate(dt) {
    const H = G.hero;
    const last = G.trail[G.trail.length - 1];
    if (!last || Math.hypot(H.x - last.x, H.y - last.y) > 5) G.trail.push({ x: H.x, y: H.y });
    if (G.trail.length > 800) G.trail.shift();
    G.party.forEach((k, i) => {
      const p = G.trail[Math.max(0, G.trail.length - 1 - (i + 1) * 8)] || H;
      const ox = k.x;
      k.x = K.lerp(k.x, p.x, Math.min(1, dt * 9));
      k.y = K.lerp(k.y, p.y, Math.min(1, dt * 9));
      if (Math.abs(k.x - ox) > .4) k.f = k.x > ox ? 1 : -1;
      k.gait.update(k.x - ox, dt);
    });
  }
  function nearCable(H) {
    let best = 1e9, face = H.f;
    for (const cam of G.lv.cams) {
      const pts = cam.cable;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        const vx = b.x - a.x, vy = b.y - a.y;
        const l2 = vx * vx + vy * vy || 1;
        let u = ((H.x - a.x) * vx + (H.y - a.y) * vy) / l2;
        u = Math.max(0, Math.min(1, u));
        const x = a.x + vx * u, y = a.y + vy * u;
        const d = Math.hypot(H.x - x, H.y - y);
        if (d < best) { best = d; face = b.x >= a.x ? 1 : -1; }
      }
    }
    return best < 38 ? face : 0;
  }
  function cast(kind, x, y, f, pose, ph, o) {
    o = o || {};
    PTP.use(X);
    PTP.drawMan(kind, x, y, PTP.S * (o.sc || 1), f || 1, pose, ph == null ? RT : ph, o);
  }
  function drawHero(H) {
    let pose = H.climb ? 'climb' : H.punchT > 0 ? 'punch' : !H.onG ? 'jump' : H.hidden ? 'crouch' : H.gait.amp > .12 ? 'walk' : 'idle';
    let f = H.f;
    if (pose === 'idle') { const cf = nearCable(H); if (cf) { pose = 'point'; f = cf; } }
    const ph = pose === 'walk' || pose === 'climb' ? H.gait.ph : RT;
    X.save();
    if (H.inv > 0 && Math.sin(RT * 28) > 0) X.globalAlpha *= .45;
    cast('hero', H.x, H.y, f, pose, ph, { amp: pose === 'walk' ? Math.min(1.1, H.gait.amp / .5) : 1 });
    X.restore();
  }
  function drawCable(cam) {
    const pts = cam.cable;
    X.save();
    X.lineCap = 'round'; X.lineJoin = 'round';
    X.strokeStyle = '#121212'; X.lineWidth = 11;
    X.beginPath(); X.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) X.lineTo(pts[i].x, pts[i].y);
    X.stroke();
    X.strokeStyle = '#ffe14a'; X.lineWidth = 3;
    X.setLineDash([12, 16]); X.lineDashOffset = -RT * 36;
    X.stroke();
    X.setLineDash([]);
    const len = pts.reduce((a, p, i) => i ? a + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) : 0, 0);
    let d = ((RT * 70) % Math.max(1, len));
    let x = pts[0].x, y = pts[0].y;
    for (let i = 1; i < pts.length; i++) {
      const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      if (d <= seg) {
        const u = seg ? d / seg : 0;
        x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) * u;
        y = pts[i - 1].y + (pts[i].y - pts[i - 1].y) * u;
        break;
      }
      d -= seg;
    }
    X.fillStyle = '#fff'; X.beginPath(); X.arc(x, y, 5, 0, TAU); X.fill();
    X.restore();
  }
  function drawContainer(it) {
    const x = it.x, y = it.fy, got = !!save.got[it.id];
    X.save();
    if (it.prop === 'cooler') { X.fillStyle = got ? '#6d7c86' : '#2f8f8a'; X.fillRect(x - 16, y - 22, 32, 22); X.fillStyle = '#d8fff8'; X.fillRect(x - 12, y - 18, 24, 6); }
    else if (it.prop === 'crate') { X.fillStyle = '#a47848'; X.fillRect(x - 16, y - 26, 32, 26); X.strokeStyle = '#5a3a1c'; X.lineWidth = 2; X.strokeRect(x - 16, y - 26, 32, 26); }
    else if (it.prop === 'stump') { X.fillStyle = '#6b4a2c'; X.fillRect(x - 14, y - 16, 28, 16); X.fillStyle = '#c4a06a'; X.beginPath(); X.ellipse(x, y - 16, 14, 5, 0, 0, TAU); X.fill(); }
    else if (it.prop === 'desk' || it.prop === 'bench') { X.fillStyle = '#8a5a32'; X.fillRect(x - 22, y - 16, 44, 6); X.fillRect(x - 18, y - 10, 4, 10); X.fillRect(x + 14, y - 10, 4, 10); }
    else if (it.prop === 'cabinet' || it.prop === 'locker') { X.fillStyle = it.prop === 'locker' ? '#2452b0' : '#c4b49a'; X.fillRect(x - 14, y - 32, 28, 32); X.fillStyle = '#f4efe6'; X.fillRect(x - 10, y - 28, 20, 12); }
    else { X.fillStyle = '#6b5344'; X.fillRect(x - 16, y - 14, 32, 14); }
    X.restore();
    if (!got) {
      const bob = Math.sin(RT * 3 + x) * 2;
      PTP.prop(X, it.cat, x, y - 36 + bob, 1.15);
    }
  }
  function drawCage(k) {
    const open = !!save.kids[k.id], x = k.x, y = k.fy, w = 46, h = 52;
    if (!open) cast(k.kind, x, y, 1, 'point', RT, { sc: .9 });
    X.strokeStyle = open ? 'rgba(180,180,190,.6)' : '#c9ced6';
    X.lineWidth = 3;
    for (let i = 0; i <= 5; i++) {
      const bx = x - w / 2 + i * w / 5;
      if (open && i > 0 && i < 5) continue;
      X.beginPath(); X.moveTo(bx, y); X.lineTo(bx, y - h); X.stroke();
    }
    X.strokeStyle = '#8d939c'; X.lineWidth = 4;
    X.beginPath(); X.moveTo(x - w / 2, y - h); X.lineTo(x + w / 2, y - h); X.moveTo(x - w / 2, y); X.lineTo(x + w / 2, y); X.stroke();
    if (open) K.text('SAFE', x, y - h - 12, 12, '#9be07a', { stroke: '#000', lw: 3 });
  }
  function drawMachine(m) {
    const open = !!save.got[m.id];
    PTP.machineBody(X, m.x, m.fy, open);
    if (!open) PTP.prop(X, 'reel', m.x, m.fy - 8, 1.05);
  }
  function drawCam(cam) {
    const foot = cam.cable.find(p => p.via) || cam.cable[1];
    X.strokeStyle = '#3a3228'; X.lineWidth = 7; X.lineCap = 'round';
    X.beginPath(); X.moveTo(cam.x, cam.y); X.lineTo(foot.x, foot.y); X.stroke();
    PTP.cameraBody(X, cam.x, cam.y, cam.f || 1);
  }
  function drawExit() {
    const x = G.lv.exitX, boat = G.st.exitKind === 'boat';
    if (boat) {
      const by = GY + 6 + Math.sin(RT * 1.5) * 2;
      X.fillStyle = '#2c3138';
      X.beginPath(); X.moveTo(x - 46, by - 8); X.quadraticCurveTo(x, by + 16, x + 46, by - 8); X.lineTo(x + 36, by - 18); X.quadraticCurveTo(x, by - 2, x - 36, by - 18); X.closePath(); X.fill();
      X.fillStyle = '#d8d2c4'; X.fillRect(x - 14, by - 30, 28, 8);
      X.fillStyle = '#111'; X.fillRect(x - 2, by - 48, 4, 18);
    } else {
      X.fillStyle = '#6b4423'; X.fillRect(x - 26, GY - 70, 8, 70); X.fillRect(x + 18, GY - 70, 8, 70);
      X.fillStyle = '#3d2612'; X.fillRect(x - 30, GY - 78, 60, 10);
    }
    const ready = G.st.id === R.STAGES.length - 1 && R.isComplete(save);
    K.text(ready ? 'RELEASE' : 'EXIT', x, GY - 92, 14, ready ? '#9be07a' : '#ffe14a', { stroke: '#000', lw: 3 });
  }
  function drawWorld() {
    const v = viewGeom(), sc = v.sc, vw = K.W / sc;
    const max = Math.max(0, G.st.cols * T - vw);
    G.cam = K.clamp(G.hero.x - vw * .38, 0, max);
    PTP.scene(X, G.st.wi, { W: K.W, H: K.H, floor: v.oy + GY * sc, t: RT, pan: G.cam * .15 });
    X.save();
    X.translate(-G.cam * sc, v.oy); X.scale(sc, sc);
    const c0 = Math.max(0, Math.floor(G.cam / T) - 1), c1 = Math.min(G.st.cols - 1, Math.ceil((G.cam + vw) / T) + 1);
    PTP.tiles(X, G.st.wi, c0, c1, tile, T, G.lv.water, RT);
    G.lv.cams.forEach(cam => { drawCam(cam); drawCable(cam); drawMachine(cam.machine); });
    G.lv.items.forEach(drawContainer);
    G.lv.kids.forEach(drawCage);
    G.lv.bushes.forEach(b => PTP.bush(X, b, RT));
    for (const l of G.lv.ladders) PTP.ladder(X, l, G.st.wi === 2);
    drawExit();
    G.lv.decor.forEach(d => {
      cast(d.kind, d.x, d.fy, d.f, d.pose || 'punch', RT * (d.pose === 'punch' ? 6 : 2), { sc: d.kind.indexOf('kid') === 0 ? .95 : 1 });
      if (d.say) K.text(d.say, d.x + 54, d.fy - 96, 13, '#fff', { stroke: '#000', lw: 3 });
    });
    G.lv.goons.forEach(t => {
      const pose = t.down ? 'ko' : (t.pose || 'point');
      cast('thug', t.x, t.fy, t.f, pose, t.down ? RT : RT * 2, { dizzy: !!t.down, noLight: true });
      if (!t.down && t.meter > .15) K.text(t.meter > .7 ? '!' : '?', t.x, t.fy - 78, 18, '#ffd23f', { stroke: '#000', lw: 3 });
    });
    if (G.lv.pete) {
      const p = G.lv.pete;
      cast('pete', p.x, p.fy, p.down ? -1 : p.f, p.down ? 'ko' : 'guns', RT, { sc: 1.05, dizzy: !!p.down });
    }
    G.lv.lights.forEach(l => {
      const cx = l.cx == null ? (l.x0 + l.x1) / 2 : l.cx;
      X.save(); X.globalAlpha = .28; X.fillStyle = l.m > .5 ? '#ff5a4a' : '#fff2b0';
      X.beginPath(); X.moveTo(cx, l.fy - 180); X.lineTo(cx - 40, l.fy); X.lineTo(cx + 40, l.fy); X.closePath(); X.fill(); X.restore();
    });
    G.party.forEach(k => {
      const mv = k.gait.amp > .1;
      cast(k.kind, k.x, k.y, k.f, mv ? 'walk' : 'cheer', mv ? k.gait.ph : RT * 2, { sc: .95, amp: mv ? 1 : 0 });
    });
    drawHero(G.hero);
    K.drawFx();
    X.restore();
    return v;
  }
  function objective() {
    if (!save.got[G.lv.cams[0].machine.id]) return 'Follow the yellow cable back to the recorder.';
    if (G.lv.kids.some(k => !save.kids[k.id])) return 'Free the kid, then head for the exit.';
    if (G.lv.items.some(it => !save.got[it.id])) return 'Search the marked furniture for files.';
    if (G.st.id === R.STAGES.length - 1 && R.isComplete(save)) return 'Release the Files from the boat.';
    if (G.st.id === R.STAGES.length - 1) return 'The boat still needs: ' + R.missing(save).join(', ') + '.';
    return 'This shore is clear enough to move on, or keep searching.';
  }
  function drawHUD() {
    const s = K.safe, y = s.t + 8;
    const files = R.ITEMS.filter(it => save.got[it.id]).length;
    const kids = R.kidCount(save);
    X.fillStyle = 'rgba(8,10,22,.72)';
    K.rr(s.l + 8, y, Math.min(K.W - s.l - s.r - 16, 560), K.land ? 44 : 52, 12); X.fill();
    let x = s.l + 18;
    for (let i = 0; i < G.maxH; i++) {
      X.fillStyle = i < G.hearts ? '#ff3a5a' : 'rgba(255,255,255,.25)';
      X.beginPath(); X.arc(x + i * 16, y + (K.land ? 22 : 16), 6, 0, TAU); X.fill();
    }
    const line = 'FILES ' + files + '/' + R.ITEMS.length + '   KIDS ' + kids.got + '/' + kids.total;
    K.text(line, s.l + 108, y + (K.land ? 16 : 14), 13, '#fff', { align: 'left', stroke: '#000', lw: 3 });
    K.text(G.st.name, s.l + 108, y + (K.land ? 32 : 34), 15, '#ffe14a', { align: 'left', stroke: '#000', lw: 3, max: 220 });
    K.button('files', K.W - s.r - 118, y, 52, 40, 'FILES', { color: '#2452b0', px: 11, nofocus: 1, cb: () => { G.sheet = true; Play.menu = true; } });
    K.button('pause', K.W - s.r - 60, y, 44, 40, 'II', { color: '#3a3f58', px: 16, nofocus: 1, cb: () => Play.pause() });
    const tip = objective();
    K.text(tip, K.W / 2, y + (K.land ? 58 : 66), 13, '#e8f4ff', { stroke: '#000', lw: 3, max: K.W - 24 });
  }
  function drawPrompt() {
    const a = G.state === 'play' && !G.sheet ? nearestAct() : null;
    if (!a) return;
    const v = viewGeom();
    const x = (G.hero.x - G.cam) * v.sc, y = v.oy + (G.hero.y - 78) * v.sc;
    const txt = 'ACTION: ' + a.prompt;
    X.font = K.font(15, 800);
    const tw = Math.min(K.W - 24, X.measureText(txt).width + 22);
    const bx = K.clamp(x - tw / 2, 8, K.W - tw - 8), by = K.clamp(y, K.safe.t + 78, ctlLayout().bandTop - 36);
    X.fillStyle = 'rgba(10,12,24,.9)'; K.rr(bx, by, tw, 28, 8); X.fill();
    X.strokeStyle = '#ffe14a'; X.lineWidth = 2; X.stroke();
    K.text(txt, bx + tw / 2, by + 14, 14, '#ffe14a', { max: tw - 10 });
  }
  function fingerDown(kind) { for (const f of fingers.values()) if (f.kind === kind) return true; return false; }
  function drawRound(q, on, hi, mid, lo) {
    const dy = on ? 2 : 0;
    X.beginPath(); X.arc(q.cx, q.cy + 3, q.r, 0, TAU); X.fillStyle = '#000'; X.fill();
    const g = X.createRadialGradient(q.cx - q.r * .3, q.cy + dy - q.r * .4, q.r * .1, q.cx, q.cy + dy, q.r);
    g.addColorStop(0, hi); g.addColorStop(.55, mid); g.addColorStop(1, lo);
    X.beginPath(); X.arc(q.cx, q.cy + dy, q.r, 0, TAU); X.fillStyle = g; X.fill();
    if (on) { X.fillStyle = 'rgba(255,255,255,.22)'; X.fill(); }
    X.lineWidth = 3; X.strokeStyle = '#fff'; X.stroke();
    X.beginPath(); X.arc(q.cx - q.r * .28, q.cy + dy - q.r * .32, q.r * .26, 0, TAU); X.fillStyle = 'rgba(255,255,255,.28)'; X.fill();
    const px = Math.max(11, Math.round(q.r * (q.label === 'JUMP' ? .5 : .38)));
    K.text(q.label, q.cx, q.cy + dy + 1, px, '#fff', { stroke: '#000', lw: Math.max(3, px * .22), max: q.r * 1.75, fam: '"Arial Black",Impact,system-ui,sans-serif', w: 900 });
  }
  function drawControls() {
    const C = ctlLayout(), s = K.safe;
    if (!C.land) {
      const x = s.l + 6, y = C.bandTop, w = K.W - s.l - s.r - 12, h = K.H - s.b - 6 - C.bandTop;
      K.rr(x, y, w, h, 18); X.fillStyle = '#b9b6bf'; X.fill(); X.strokeStyle = '#efeef2'; X.lineWidth = 3; X.stroke();
      K.rr(x + 8, y + 8, w - 16, h - 16, 12); X.fillStyle = '#2b2833'; X.fill();
      const right = C.act.cx - C.act.r - 8, left = x + 16;
      const hx = (left + right) / 2;
      K.text(C.hint, hx, C.act.cy - 12, 15, '#8f8c99', { fam: '"Courier New",ui-monospace,monospace', max: Math.max(40, right - left) });
      K.text(C.hint2, hx, C.act.cy + 14, 15, '#8f8c99', { fam: '"Courier New",ui-monospace,monospace', max: Math.max(40, right - left) });
    } else {
      K.text(C.hint, s.l + 14, K.H - s.b - 16, 13, 'rgba(232,228,220,.72)', { align: 'left', fam: '"Courier New",ui-monospace,monospace' });
    }
    drawRound(C.act, fingerDown('act'), '#d8ffd0', '#38b040', '#0a5a12');
    drawRound(C.jump, fingerDown('jump'), '#ffe0b0', '#ff8a1a', '#a03a00');
  }
  function drawSheet() {
    const W = K.W, H = K.H, s = K.safe;
    X.fillStyle = 'rgba(6,8,18,.96)'; X.fillRect(0, 0, W, H);
    K.text('EVIDENCE BAG', W / 2, s.t + 36, 28, '#ffe14a', { stroke: '#000', lw: 5, fam: TF });
    const counts = R.counts(save);
    const kids = R.kidCount(save);
    const top = s.t + 64;
    const rowH = Math.min(52, (H - top - s.b - 90) / 7);
    R.CATS.forEach((c, i) => {
      const y = top + i * rowH;
      X.fillStyle = 'rgba(28,34,58,.96)'; K.rr(s.l + 16, y, W - s.l - s.r - 32, rowH - 6, 10); X.fill();
      PTP.prop(X, c.id, s.l + 42, y + rowH - 14, 1.2);
      const b = counts[c.id];
      K.text(c.name, s.l + 70, y + rowH * .42, 16, '#fff', { align: 'left', stroke: '#000', lw: 3 });
      K.text(b.got + ' / ' + b.total, W - s.r - 28, y + rowH * .42, 16, b.got === b.total ? '#9be07a' : '#ffe14a', { align: 'right', stroke: '#000', lw: 3 });
    });
    K.text('Kids rescued  ' + kids.got + ' / ' + kids.total, W / 2, top + 6 * rowH + 8, 16, '#fff', { stroke: '#000', lw: 3 });
    K.button('sheetx', W / 2 - 90, H - s.b - 64, 180, 48, 'CLOSE', { color: '#c4473a', px: 18, cb: () => { G.sheet = false; Play.menu = false; } });
  }
  function drawPause() {
    X.fillStyle = 'rgba(5,6,16,.72)'; X.fillRect(0, 0, K.W, K.H);
    K.text('PAUSED', K.W / 2, K.H * .22, 36, '#fff', { stroke: '#000', lw: 5, fam: TF });
    const bw = Math.min(280, K.W - 48), x = (K.W - bw) / 2;
    let y = K.H * .32;
    K.button('resume', x, y, bw, 52, 'RESUME', { color: '#2fae4a', px: 20, cb: () => Play.resume() }); y += 62;
    K.button('restart', x, y, bw, 48, 'RESTART AREA', { color: '#2452b0', px: 18, cb: () => startStage(G.st.id) }); y += 58;
    K.button('map', x, y, bw, 48, 'ALL SHORES', { color: '#3a3f58', px: 18, cb: () => { sceneName = 'map'; K.go(Shores); } }); y += 58;
    K.button('snd', x, y, bw, 48, K.au.muted ? 'SOUND OFF' : 'SOUND ON', { color: '#6a4fd0', px: 18, cb: () => { K.au.muted = !K.au.muted; K.au.apply(); save.muted = K.au.muted; persist(); } });
  }
  const Play = {
    menu: false, primary: 'resume',
    enter() { this.menu = false; sceneName = 'play'; fingers.clear(); },
    down(p) {
      if (!G || G.state !== 'play' || G.sheet) return;
      const id = circleAt(p.x, p.y);
      if (id === 'jump') { fingers.set(p.id, { kind: 'jump' }); pend.jump = 1; return; }
      if (id === 'act') { fingers.set(p.id, { kind: 'act' }); pend.act = 1; return; }
      fingers.set(p.id, { kind: 'swipe', ox: p.x, oy: p.y, dirs: {} });
    },
    move(p) {
      const f = fingers.get(p.id);
      if (!f) return;
      if (f.kind === 'swipe') { f.dirs = swipeDirs(f, p.x, p.y); return; }
      const id = circleAt(p.x, p.y);
      if (id !== f.kind) fingers.delete(p.id);
    },
    up(p) { fingers.delete(p.id); },
    pause() { if (!G || G.sheet) return; G.state = 'pause'; this.menu = true; K.focus = 'resume'; fingers.clear(); },
    resume() { G.state = 'play'; this.menu = false; },
    back() { if (G && G.sheet) { G.sheet = false; this.menu = false; return; } if (G && G.state === 'pause') this.resume(); else this.pause(); },
    update(dt) {
      if (!G) return;
      RT += dt; G.t += dt;
      if (K.kp.KeyC && G.state === 'play') { G.sheet = !G.sheet; this.menu = G.sheet; }
      if (G.sheet) return;
      if (G.state === 'pause') return;
      if (K.kp.Escape || K.kp.KeyP || K.pad.pr.start) { this.pause(); return; }
      K.updFx(dt);
      if (G.state === 'caught') { G.ct -= dt; if (G.ct <= 0) respawn(); return; }
      readInput();
      if (window.__RTF && __RTF.bot) bot();
      if (K.scene !== Play || !G || !G.hero) return;
      const before = G.hero.x;
      heroUpdate(dt);
      if (IN.act) { doAction(); IN.act = 0; }
      IN.jump = 0;
      if (G && G.state === 'play') { guards(dt); partyUpdate(dt); }
      if (G && Math.abs(G.hero.x - before) < .2 && window.__RTF && __RTF.bot) G.idle = (G.idle || 0) + dt; else if (G) G.idle = 0;
    },
    draw() {
      if (!G) return;
      drawWorld();
      drawPrompt();
      drawHUD();
      if (G.state === 'caught') { X.fillStyle = 'rgba(120,0,0,.25)'; X.fillRect(0, 0, K.W, K.H); K.text('SPOTTED', K.W / 2, K.H * .4, 40, '#fff', { stroke: '#600', lw: 6 }); }
      if (!G.sheet && G.state !== 'pause') drawControls();
      if (G.sheet) drawSheet();
      if (G.state === 'pause') drawPause();
    }
  };
  function bg(wi) { PTP.scene(X, wi, { W: K.W, H: K.H, floor: K.H * (K.land ? .78 : .7), t: RT, pan: RT * 12 }); }
  function titleArt(btnTop) {
    const W = K.W, H = K.H, s = K.safe, land = K.land;
    bg(0);
    PTP.use(X);
    const floor = Math.min(land ? H * .74 : H * .58, btnTop - 28);
    const sc = land ? Math.min(2.5, W / 520) : Math.min(2.15, W / 280);
    const y = floor;
    const camX = land ? W * .18 : W * .16, macX = land ? W * .82 : W * .84;
    X.strokeStyle = '#141414'; X.lineWidth = 8; X.lineCap = 'round';
    X.beginPath(); X.moveTo(camX, y - 70); X.lineTo(camX, y - 8); X.lineTo(macX, y - 8); X.stroke();
    X.strokeStyle = '#ffe14a'; X.lineWidth = 2; X.setLineDash([8, 10]); X.lineDashOffset = -RT * 30; X.stroke(); X.setLineDash([]);
    PTP.cameraBody(X, camX, y - 78, 1);
    PTP.machineBody(X, macX, y, false);
    const heroX = land ? W * .30 : W * .28;
    const peteX = land ? W * .70 : W * .72;
    cast('thug', heroX - 54 * sc / 2.2, y, 1, 'punch', RT * 5, { sc: sc * .92 });
    cast('hero', heroX, y, 1, 'guns', RT, { sc: sc });
    cast('pete', peteX, y, -1, 'punch', RT * 5, { sc: sc * 1.02 });
    cast('thug', peteX + 52 * sc / 2.2, y, -1, 'point', RT, { sc: sc * .9, noLight: true });
    cast('kid2', (heroX + peteX) / 2, y, 1, 'point', RT, { sc: sc * .85 });
    const props = ['tape', 'drive', 'files', 'laptop', 'thumb', 'reel'];
    props.forEach((c, i) => PTP.prop(X, c, W * (land ? .36 + i * .048 : .14 + i * .14), y - (land ? 132 : 108), land ? 1.55 : 1.2));
    K.charRects.push({ x: heroX - 80, y: y - 150, w: 160, h: 160, name: 'hero' }, { x: peteX - 80, y: y - 150, w: 170, h: 160, name: 'pete' });
    const cx = W / 2;
    const tp = land ? Math.min(46, W * .045) : Math.min(34, W * .078);
    const tY = s.t + (land ? 18 + tp : 28 + tp);
    X.font = '700 ' + Math.round(tp * .42) + 'px ' + TF;
    K.text('VOLUME 3', cx, tY - tp * .85, tp * .4, '#fff', { stroke: '#2a0818', lw: 5, fam: TF });
    K.text('PALM TREE PETE', cx, tY, tp * .92, '#ffe14a', { stroke: '#2a0818', lw: 7, fam: TF, max: W - 16 });
    K.text('RELEASE THE FILES', cx, tY + tp * .95, tp * .72, '#fff', { stroke: '#8a1d1d', lw: 6, fam: TF, max: W - 12 });
  }
  const Title = {
    menu: true, primary: 'play', sure: false,
    enter() { sceneName = 'title'; G = null; K.au.muted = !!save.muted; K.au.apply(); if (SONG) K.music.play(SONG); this.sure = false; },
    update(dt) { RT += dt; },
    back() {},
    draw() {
      const W = K.W, H = K.H, s = K.safe, land = K.land;
      const bh = land ? 48 : 54, gap = 8;
      const rows = 3;
      const btnTop = H - s.b - (bh * rows + gap * (rows - 1)) - 12;
      titleArt(btnTop);
      if (COVER) return;
      const files = R.ITEMS.filter(it => save.got[it.id]).length;
      const kids = R.kidCount(save);
      K.text(save.released ? 'FILES RELEASED' : ('Files ' + files + '/' + R.ITEMS.length + '   Kids ' + kids.got + '/' + kids.total), W / 2, btnTop - 16, 14, '#fff', { stroke: '#000', lw: 3 });
      const bw = Math.min(460, W - s.l - s.r - 28), x = (W - bw) / 2;
      let y = btnTop;
      const go = () => {
        if (!save.seenIntro) { save.seenIntro = true; persist(); K.go(new K.Story(STORY, () => K.go(Shores), { px: 18, bg: () => bg(0) })); }
        else K.go(Shores);
      };
      K.button('play', x, y, bw, bh, save.released ? 'PLAY AGAIN' : (save.unlocked > 1 ? 'CONTINUE' : 'PLAY'), { color: '#d1302f', px: 22, cb: go });
      y += bh + gap;
      const hw = (bw - gap) / 2;
      K.button('areas', x, y, hw, bh - 4, 'SHORES', { color: '#2452b0', px: 16, cb: () => K.go(Shores) });
      K.button('how', x + hw + gap, y, hw, bh - 4, 'HOW TO PLAY', { color: '#2f7a3a', px: 14, cb: () => K.go(How) });
      y += bh + gap - 4;
      K.button('credits', x, y, hw, bh - 4, 'CREDITS', { color: '#6a4fd0', px: 16, cb: () => K.go(Credits) });
      K.button('snd', x + hw + gap, y, hw, bh - 4, K.au.muted ? 'SOUND OFF' : 'SOUND ON', { color: '#3a3f58', px: 14, cb: () => { K.au.muted = !K.au.muted; K.au.apply(); save.muted = K.au.muted; persist(); } });
      if (!COVER) {
        const rx = s.l + 8, ry = H - s.b - 28;
        if (!this.sure) K.button('reset', rx, ry - 8, 118, 32, 'RESTART', { color: '#5a3038', px: 12, cb: () => { this.sure = true; } });
        else {
          K.button('yes', rx, ry - 8, 70, 32, 'ERASE', { color: '#c4473a', px: 12, cb: () => { save = R.fresh(); persist(); this.sure = false; K.toast('Volume 3 progress cleared'); } });
          K.button('no', rx + 78, ry - 8, 70, 32, 'KEEP', { color: '#3a3f58', px: 12, cb: () => { this.sure = false; } });
        }
      }
      K.logo && K.logo('tl');
    }
  };
  function panel(wi, fn) {
    return function (x, y, w, h, t) {
      X.save(); X.beginPath(); X.rect(x, y, w, h); X.clip(); X.translate(x, y);
      PTP.scene(X, wi, { W: w, H: h, floor: h * .84, t: t, pan: t * 10 });
      fn(w, h, t);
      X.restore();
    };
  }
  const STORY = [
    { draw: panel(0, (w, h) => { cast('hero', w * .28, h * .84, 1, 'point', RT, { sc: w / 160 }); cast('thug', w * .62, h * .84, -1, 'guns', RT, { sc: w / 170, noLight: true }); PTP.cameraBody(X, w * .48, h * .5, 1); }), t: 'Palm Tree Pete hid cameras all over the island. Every cable runs back to a recorder. Follow the cable, do not just look at it.' },
    { draw: panel(2, (w, h) => { ['tape', 'drive', 'files', 'laptop', 'thumb', 'reel'].forEach((c, i) => PTP.prop(X, c, w * (.18 + i * .12), h * .7, w / 280)); cast('kid0', w * .3, h * .84, 1, 'point', RT, { sc: w / 180 }); cast('kid3', w * .55, h * .84, -1, 'cheer', RT * 2, { sc: w / 180 }); }), t: 'Search coolers, crates, desks and lockers. Bag the videotapes, hard drives, paper files, laptops, thumb drives, and the master reel from each recorder. The kids are waiting too.' },
    { draw: panel(4, (w, h) => { cast('hero', w * .32, h * .84, 1, 'punch', RT * 4, { sc: w / 160 }); cast('pete', w * .62, h * .84, -1, 'guns', RT, { sc: w / 150 }); }), t: 'It is a fictional cartoon adventure. Punch the goons, free every kid, and when the bag is full, release the files from the getaway boat.' }
  ];
  const Shores = {
    menu: true, primary: 'sh0',
    enter() { sceneName = 'map'; G = null; if (SONG) K.music.play(SONG); K.focus = 'sh' + Math.min(save.unlocked, R.STAGES.length) ; },
    update(dt) { RT += dt; },
    back() { K.go(Title); },
    draw() {
      const W = K.W, H = K.H, s = K.safe;
      const wi = Math.min(R.STAGES.length - 1, Math.max(0, save.unlocked - 1));
      bg(R.STAGES[wi].wi);
      X.fillStyle = 'rgba(6,8,18,.35)'; X.fillRect(0, 0, W, H);
      K.button('back', s.l + 8, s.t + 8, 100, 42, 'BACK', { color: '#3a3f58', px: 16, cb: () => K.go(Title) });
      K.text('VOLUME 3', W / 2, s.t + 20, 14, '#ffe14a', { fam: TF, stroke: '#000', lw: 3 });
      K.text('CHOOSE A SHORE', W / 2, s.t + 44, 26, '#fff', { fam: TF, stroke: '#000', lw: 5, max: W - 140 });
      const n = R.STAGES.length;
      const cols = K.land ? n : 1;
      const bw = Math.min(K.land ? 150 : W - 40, (W - 40 - (cols - 1) * 10) / cols);
      const bh = K.land ? 120 : 72;
      const totalW = cols * bw + (cols - 1) * 10;
      let x0 = (W - totalW) / 2, y0 = s.t + 78;
      R.STAGES.forEach((st, i) => {
        const col = K.land ? i : 0, row = K.land ? 0 : i;
        const x = x0 + col * (bw + 10), y = y0 + row * (bh + 10);
        const open = i < save.unlocked;
        const got = R.ITEMS.filter(it => it.stage === i && save.got[it.id]).length;
        const all = R.ITEMS.filter(it => it.stage === i).length;
        K.button('sh' + i, x, y, bw, bh, '', { color: open ? (save.cleared[i] ? '#1f7a42' : '#2452b0') : '#3a3f58', dis: !open, cb: () => K.go(Card, i), draw: (x, y, w, h) => {
          K.text(open ? st.name : 'LOCKED', x + w / 2, y + h * .38, K.land ? 16 : 18, '#fff', { stroke: 'rgba(0,0,0,.4)', lw: 3, max: w - 12 });
          K.text(open ? (got + '/' + all + ' files') : 'Finish the previous shore', x + w / 2, y + h * .72, 13, '#ffe14a', { max: w - 12 });
        } });
      });
      const files = R.ITEMS.filter(it => save.got[it.id]).length;
      K.text('Bag ' + files + '/' + R.ITEMS.length + '    Kids ' + R.kidCount(save).got + '/' + R.KIDS.length + (save.released ? '    RELEASED' : ''), W / 2, H - s.b - 24, 16, '#fff', { stroke: '#000', lw: 3, max: W - 16 });
    }
  };
  const Card = {
    menu: true, primary: 'go',
    enter(i) { this.i = i; sceneName = 'card'; },
    update(dt) { RT += dt; },
    back() { K.go(Shores); },
    draw() {
      const W = K.W, H = K.H, s = K.safe, st = R.STAGES[this.i];
      bg(st.wi);
      const cw = Math.min(520, W - 28), ch = Math.min(420, H - s.t - s.b - 24);
      const x = (W - cw) / 2, y = (H - ch) / 2;
      X.fillStyle = 'rgba(12,14,28,.92)'; K.rr(x, y, cw, ch, 16); X.fill();
      X.strokeStyle = '#ffe14a'; X.lineWidth = 3; X.stroke();
      K.text(st.name, W / 2, y + 36, 26, '#ffe14a', { fam: TF, stroke: '#000', lw: 4, max: cw - 24 });
      K.para(st.blurb, W / 2, y + 78, cw - 36, 16, '#fff', { lh: 1.3 });
      const need = R.ITEMS.filter(it => it.stage === st.id).map(pretty).join(', ');
      K.para('Find: ' + need, W / 2, y + 150, cw - 36, 14, '#d7ecff', { lh: 1.25 });
      K.button('back', x + 16, y + ch - 68, (cw - 44) / 2, 50, 'BACK', { color: '#3a3f58', px: 16, cb: () => K.go(Shores) });
      K.button('go', x + 28 + (cw - 44) / 2, y + ch - 68, (cw - 44) / 2, 50, 'GO', { color: '#d1302f', px: 20, cb: () => startStage(this.i) });
    }
  };
  const How = {
    menu: true, primary: 'ok',
    enter() { sceneName = 'how'; },
    update(dt) { RT += dt; },
    back() { K.go(Title); },
    draw() {
      bg(1); X.fillStyle = 'rgba(6,8,18,.55)'; X.fillRect(0, 0, K.W, K.H);
      K.text('HOW TO PLAY', K.W / 2, K.safe.t + 36, 28, '#ffe14a', { fam: TF, stroke: '#000', lw: 5 });
      const t = 'Swipe anywhere and hold to walk. Slide your finger to turn. Lift it to stop. Swipe up or down on a ladder to climb.\n\nJUMP is the orange button. ACTION is the green button: search, punch, free a kid, eject a reel, or board the boat. Hold a swipe and JUMP together.\n\nA yellow cable runs from each camera to a recorder. Walk the cable. At the machine, ACTION ejects the master reel.\n\nEvidence stays in the bag if you are spotted. Collecting the same object twice does not add another.\n\nKeyboard: arrows or WASD, Space jump, X or J or E action, C bag, P pause.';
      K.para(t, K.W / 2, K.safe.t + 70, Math.min(K.W - 28, 640), K.land ? 14 : 15, '#fff', { lh: 1.28 });
      K.button('ok', K.W / 2 - 90, K.H - K.safe.b - 64, 180, 48, 'GOT IT', { color: '#2fae4a', px: 18, cb: () => K.go(Title) });
    }
  };
  const Credits = {
    menu: true, primary: 'ok',
    enter() { sceneName = 'credits'; },
    update(dt) { RT += dt; },
    back() { K.go(Title); },
    draw() {
      bg(3); X.fillStyle = 'rgba(6,8,18,.6)'; X.fillRect(0, 0, K.W, K.H);
      K.text('CREDITS', K.W / 2, K.safe.t + 36, 28, '#ffe14a', { fam: TF, stroke: '#000', lw: 5 });
      const t = 'Palm Tree Pete — Release the Files is Volume 3, a fictional cartoon island adventure.\n\nThe hero, Palm Tree Pete, the goons and the kids use the original character rigs, clothing, colors and painted island scenes from Rescue from Palm Tree Pete\'s Island. Volume 2\'s art-matched scenes are the island reference. Volume 3 puts those same rigs in new poses: punches, pointing, and finger-guns.\n\nFonts: Lilita One and Anton, SIL Open Font License.\n\nNo real people are accused of anything here. The files, cameras and rescues are make-believe.';
      K.para(t, K.W / 2, K.safe.t + 68, Math.min(K.W - 28, 640), K.land ? 14 : 15, '#fff', { lh: 1.28 });
      K.button('ok', K.W / 2 - 90, K.H - K.safe.b - 64, 180, 48, 'BACK', { color: '#3a3f58', px: 18, cb: () => K.go(Title) });
    }
  };
  const Ending = {
    menu: true, primary: 'done',
    enter() { sceneName = 'ending'; this.t = 0; this.page = 0; if (SONG2) K.music.play(SONG2); },
    update(dt) { RT += dt; this.t += dt; if (this.t > 3.2 && this.page < 2) { this.page++; this.t = 0; } K.updFx(dt); },
    back() { K.go(Title); },
    draw() {
      const W = K.W, H = K.H, s = K.safe;
      bg(4);
      const y = K.land ? H * .72 : H * .58;
      const pages = [
        'Every cable led to a recorder. The master reels, tapes, drives, paper files, laptops and thumb drives are in the bag.',
        'The kids are on the boat. Pete\'s finger-guns droop. Nobody was hurt. It was a cartoon punch-up.',
        'THE FILES ARE RELEASED.'
      ];
      cast('hero', W * .28, y, 1, 'guns', RT, { sc: 2 });
      cast('pete', W * .55, y, -1, 'ko', RT, { sc: 2, dizzy: true });
      ['kid0', 'kid1', 'kid2', 'kid3', 'kid4', 'kid5'].forEach((k, i) => cast(k, W * (.18 + i * .1), y - Math.abs(Math.sin(RT * 4 + i)) * 8, i % 2 ? -1 : 1, 'cheer', RT * 2 + i, { sc: 1.3 }));
      if (this.page === 2 || this.t > .2) {
        ['tape', 'drive', 'files', 'laptop', 'thumb', 'reel'].forEach((c, i) => {
          PTP.prop(X, c, W * (.2 + i * .1), y - 80 - ((RT * 40 + i * 30) % 160), 1.1);
        });
      }
      X.fillStyle = 'rgba(8,10,20,.78)'; K.rr(20, s.t + 16, W - 40, 88, 12); X.fill();
      K.para(pages[this.page], W / 2, s.t + 36, W - 70, 16, '#fff', { lh: 1.25 });
      K.text('VOLUME 3', W / 2, y + 36, 18, '#ffe14a', { fam: TF, stroke: '#000', lw: 4 });
      K.button('done', W / 2 - 110, H - s.b - 64, 220, 50, this.page < 2 ? 'NEXT' : 'THE END', { color: '#2fae4a', px: 18, cb: () => { if (this.page < 2) { this.page++; this.t = 0; } else K.go(Title); } });
      K.button('skip', s.l + 10, H - s.b - 64, 100, 50, 'SKIP', { color: '#c4473a', px: 16, cb: () => K.go(Title) });
      this.line = pages[this.page];
    }
  };
  window.__RTF = {
    SAVEK: SAVEK,
    get save() { return save; },
    get G() { return G; },
    get scene() { return sceneName; },
    get endingLine() { return Ending.line || ''; },
    STAGES: R.STAGES, CATS: R.CATS, ITEMS: R.ITEMS, KIDS: R.KIDS,
    startStage: startStage, doAction: doAction, nearestAct: nearestAct, ctlLayout: ctlLayout,
    bot: false, fast: false,
    counts: () => R.counts(save),
    kids: () => R.kidCount(save),
    complete: () => R.isComplete(save),
    trailNear(points, maxD) {
      if (!G) return false;
      return points.every(p => G.trail.some(t => Math.hypot(t.x - p.x, t.y - p.y) < maxD) || Math.hypot(G.hero.x - p.x, G.hero.y - p.y) < maxD);
    },
    status() {
      if (!G) return { scene: sceneName };
      const goal = currentGoal();
      return { scene: sceneName, stage: G.st.id, name: G.st.name, x: Math.round(G.hero.x), y: Math.round(G.hero.y), wi: G.wi, wire: G.wire.length, state: G.state, hearts: G.hearts, idle: G.idle || 0, goal: goal && goal.k, onG: G.hero.onG, vy: G.hero.vy, got: Object.keys(save.got).length, kids: Object.keys(save.kids).length, released: !!save.released };
    }
  };
  K.SFX.jump = function () { K.au.tone(420, .1, 'square', .06, 680); };
  K.SFX.bonk = function () { K.au.tone(180, .1, 'square', .12, 70); K.au.noise(.1, .14, 900); };
  K.SFX.punch = K.SFX.bonk;
  K.SFX.free = function () { [523, 659, 784].forEach((f, i) => K.au.tone(f, .12, 'triangle', .07, null, i * .06)); };
  K.SFX.splash = function () { K.au.noise(.25, .16, 700); };
  K.SFX.hurt = function () { K.au.tone(240, .18, 'sawtooth', .08, 80); };
  K.loadImages({ logo: 'logo589.webp' }, function () {});
  K.start(Title);
})();
