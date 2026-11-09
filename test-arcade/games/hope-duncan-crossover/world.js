import {
  DUNCAN, HOPE_HEAD, LAYOUT, TIMING,
  forgivenessWindow, hairHitsCircle, onSolid, ponytailPoints, swingPoint, worldToLocal
} from './mechanics.js';

export function createWorld() {
  return {
    t: 0,
    who: 'hope',
    p: {x: 78, y: 0, vy: 0, face: 1, runT: 0, runDir: 0, carry: 0, carryT: 0},
    evils: [
      {id: 'low', x: 132, y: -52, r: 22, home: 132, vx: 0, vy: 0, aside: false, knock: false, fade: 1},
      {id: 'high', x: 292, y: -158, r: 22, home: 292, vx: 0, vy: 0, aside: false, knock: false, fade: 1}
    ],
    criminal: {x: 278, y: 0, r: 18, captured: false, busted: false, how: '', st: 'loiter', tm: 0, vx: 0},
    umb: {x: 388, op: 0, st: 'creep', folded: false},
    rival: {x: 900, y: 0, r: 20, forgiven: false, stagger: 0, vx: 0, flash: 0},
    prayers: [],
    graces: [],
    fx: [],
    pony: {phase: 'idle', u: 0, t: 0, sway: 0},
    lasso: null,
    swing: null,
    crossed: false,
    pending: 0,
    punchT: 0,
    punchHitDone: false,
    forgiveSpent: false,
    cd: {pray: 0, grace: 0},
    falls: 0,
    msg: '',
    blast: null,
    stats: {
      punchesStarted: 0,
      punchHits: 0,
      forgivenessStarts: 0,
      forgivenessContacts: 0,
      prayers: 0,
      graces: 0,
      busts: 0,
      lassos: 0
    }
  };
}

function fx(w, x, y, txt, col, s) {
  w.fx.push({x, y, txt, c: col || '#ffd23f', s: s || 16, l: 1.25, l0: 1.25, vy: -28});
}

function knockEvil(e, face) {
  if (e.aside || e.knock) return;
  e.knock = true;
  e.vx = face * 340;
  e.vy = -70;
}

export function queuePunches(w, n) {
  if (w.who !== 'hope') return false;
  if (w.pony.phase === 'coil' || w.pony.phase === 'unroll') return false;
  if (w.swing) return false;
  w.pending += n;
  return true;
}

export function beginForgiveness(w) {
  if (w.who !== 'hope') return false;
  if (w.pony.phase === 'coil' || w.pony.phase === 'unroll') return false;
  if (w.swing) return false;
  w.pending = 0;
  w.punchT = 0;
  w.punchHitDone = false;
  w.forgiveSpent = false;
  w.p.carryT = 0;
  w.p.carry = 0;
  if (!w.rival.forgiven) {
    const dx = w.rival.x - w.p.x;
    const reach = w.p.x >= LAYOUT.cliff1 ? 420 : 240;
    if (Math.abs(dx) > 12 && Math.abs(dx) < reach) w.p.face = Math.sign(dx);
  }
  w.pony.phase = 'coil';
  w.pony.t = 0;
  w.pony.u = 0;
  w.stats.forgivenessStarts += 1;
  return true;
}

function cancelHopeAttack(w) {
  w.pending = 0;
  w.punchT = 0;
  w.pony.phase = 'idle';
  w.pony.u = 0;
  w.lasso = null;
}

export function switchWho(w, who) {
  if (who !== 'hope' && who !== 'duncan') who = w.who === 'hope' ? 'duncan' : 'hope';
  if (who === w.who) return w.who;
  w.who = who;
  cancelHopeAttack(w);
  fx(w, w.p.x, w.p.y - 120, who === 'hope' ? 'Hope' : 'Duncan', '#fff', 18);
  return w.who;
}

function tryPray(w) {
  if (w.who !== 'hope' || w.cd.pray > 0 || w.swing) return false;
  w.cd.pray = TIMING.prayCd;
  w.stats.prayers += 1;
  const face = w.p.face || 1;
  w.prayers.push({
    x: w.p.x + face * 18,
    y: w.p.y - 64,
    vx: face * TIMING.praySpeed,
    r: TIMING.prayR,
    life: TIMING.prayLife,
    kind: w.stats.prayers % 4 === 0 ? 'dove' : 'orb'
  });
  fx(w, w.p.x + face * 24, w.p.y - 96, 'Prayer Blast', '#fff6c8', 15);
  return true;
}

function tryGrace(w) {
  if (w.who !== 'hope' || w.cd.grace > 0 || w.swing) return false;
  w.cd.grace = TIMING.graceCd;
  w.stats.graces += 1;
  w.graces.push({x: w.p.x, y: w.p.y - 58, face: w.p.face || 1, r: 18, life: TIMING.graceDur, l0: TIMING.graceDur});
  fx(w, w.p.x, w.p.y - 140, 'Grace Abounding', '#ffe9a2', 18);
  return true;
}

function tryLasso(w) {
  if (w.who !== 'hope' || w.swing) return false;
  if (w.pony.phase === 'coil' || w.pony.phase === 'unroll' || w.pony.phase === 'punch') return false;
  const p = w.p;
  const c = w.criminal;
  const dx = (c.x - p.x) * p.face;
  const dist = Math.hypot(c.x - p.x, (c.y - 40) - (p.y - 70));
  const canCatch = !c.captured && !c.busted && dx > -48 && dist < LAYOUT.lassoCatch && p.y > -40;
  const canSwing = p.x >= LAYOUT.swingX0 && p.x <= LAYOUT.cliff0 && p.y > -40 && p.face > 0 && (onSolid(p.x) || p.y < 0);
  w.stats.lassos += 1;
  if (canCatch && !(canSwing && (p.x >= LAYOUT.lip || dist > 110))) {
    w.lasso = {kind: 'catch', u: 0, t: 0};
    w.pony.phase = 'lasso';
    return true;
  }
  if (canSwing) {
    w.lasso = {kind: 'swing', u: 0, t: 0};
    w.pony.phase = 'lasso';
    fx(w, p.x, -150, 'Ponytail lasso!', '#e7c49a', 16);
    return true;
  }
  w.lasso = {kind: 'miss', u: 0, t: 0};
  w.pony.phase = 'lasso';
  return false;
}

function bustCriminal(w, how) {
  const c = w.criminal;
  if (c.captured || c.busted) return false;
  c.busted = true;
  c.captured = true;
  c.how = how;
  c.st = 'busted';
  w.stats.busts += 1;
  w._actT = w.t;
  fx(w, c.x, -130, how === 'nab' ? 'GOTCHA!' : 'BUSTED!', '#ffd23f', 18);
  return true;
}

function tryAct(w) {
  if (w.who !== 'duncan' || w.swing) return false;
  const p = w.p;
  const c = w.criminal;
  let did = false;
  if (!c.captured && Math.abs(c.x - p.x) < DUNCAN.bustCrook && p.y > DUNCAN.nabFeet) {
    did = bustCriminal(w, 'action') || did;
  }
  if (!w.umb.folded && Math.abs(w.umb.x - p.x) < DUNCAN.bustUmbCreep) {
    w.umb.folded = true;
    w.umb.st = 'busted';
    w.stats.busts += 1;
    w._actT = w.t;
    did = true;
    fx(w, w.umb.x, -140, 'Umbrella folded!', '#fff', 15);
  }
  if (!did) fx(w, p.x, p.y - 120, 'Whistle!', '#d8e4ff', 14);
  return did;
}

function tryJump(w) {
  if (w.swing) return false;
  if (w.p.y < -0.5) return false;
  if (!onSolid(w.p.x)) return false;
  w.p.vy = DUNCAN.jumpVy;
  w.p.y = -1;
  return true;
}

function speedFor(w, input, dt) {
  let dir = input.dir || 0;
  if (dir) {
    w.p.carry = dir;
    w.p.carryT = TIMING.carry;
    if (dir !== w.p.runDir) { w.p.runDir = dir; w.p.runT = 0; }
    w.p.runT += dt;
  } else if (w.p.carryT > 0) {
    w.p.carryT -= dt;
    dir = w.p.carryT > 0 ? w.p.carry : 0;
  } else {
    w.p.runT = 0;
    w.p.runDir = 0;
  }
  if (!dir) return 0;
  const run = !!(input.run || w.p.runT > DUNCAN.runHold);
  return dir * (run ? DUNCAN.run : DUNCAN.walk);
}

function movePlayer(w, dt, input) {
  if (w.swing) {
    w.swing.t += dt;
    const u = Math.min(1, w.swing.t / TIMING.swing);
    const q = swingPoint(u);
    w.p.x = q.x;
    w.p.y = q.y;
    w.p.vy = 0;
    w.p.face = 1;
    if (u >= 1) {
      w.swing = null;
      w.lasso = null;
      w.pony.phase = 'idle';
      w.p.x = LAYOUT.swing.x2;
      w.p.y = 0;
      w.crossed = true;
      fx(w, w.p.x, -120, 'Across!', '#fff', 18);
    }
    return;
  }
  const sp = speedFor(w, input, dt);
  if (sp) w.p.face = Math.sign(sp);
  let x = w.p.x + sp * dt;
  const B = LAYOUT.barrier;
  const feetClear = w.p.y < -B.h;
  if (!feetClear && x > B.x0 && x < B.x1) x = w.p.x < B.x0 ? B.x0 - 0.4 : B.x1 + 0.4;
  const airborne = w.p.y < -0.5 || w.p.vy < 0;
  if (!airborne) {
    if (w.p.x <= LAYOUT.cliff0 && x > LAYOUT.cliff0 - 1) x = LAYOUT.cliff0 - 1;
    if (w.p.x >= LAYOUT.cliff1 && x < LAYOUT.cliff1 + 1) x = LAYOUT.cliff1 + 1;
  }
  w.p.x = Math.max(24, Math.min(LAYOUT.farEnd - 20, x));
  const solid = onSolid(w.p.x);
  if (solid) {
    if (w.p.y < 0 || w.p.vy < 0) {
      w.p.vy += DUNCAN.grav * dt;
      w.p.y += w.p.vy * dt;
      if (w.p.y >= 0) { w.p.y = 0; w.p.vy = 0; }
    }
  } else {
    w.p.vy += DUNCAN.grav * dt;
    w.p.y += w.p.vy * dt;
    if (w.p.y > 90) {
      w.falls += 1;
      w.p.x = 78;
      w.p.y = 0;
      w.p.vy = 0;
      w.lasso = null;
      if (w.pony.phase === 'lasso') w.pony.phase = 'idle';
      fx(w, 78, -110, 'The ravine is too wide', '#ffb0a0', 15);
    }
  }
}

function hairTarget(w) {
  if (w.swing || (w.lasso && w.lasso.kind === 'swing')) {
    return worldToLocal(w.p.x, w.p.y, w.p.face, LAYOUT.anchor.x, LAYOUT.anchor.y);
  }
  if (!w.lasso) return null;
  if (w.lasso.kind === 'catch') {
    return worldToLocal(w.p.x, w.p.y, w.p.face, w.criminal.x, w.criminal.y - 48);
  }
  return worldToLocal(w.p.x, w.p.y, w.p.face, w.p.x + w.p.face * 70, w.p.y - 40);
}

export function currentHair(w) {
  const phase = w.pony.phase;
  let u = w.pony.u;
  if (phase === 'punch') u = w.punchT > 0 ? 1 - w.punchT / TIMING.punch : 0;
  if (phase === 'lasso' && w.lasso) u = w.swing ? 1 : w.lasso.u;
  return ponytailPoints(phase, u, w.pony.sway + w.t * 3.2, HOPE_HEAD, hairTarget(w));
}

function advanceAttack(w, dt) {
  w.pony.sway += dt;
  if (w.swing) {
    w.pony.phase = 'lasso';
    w.pony.u = 1;
    return;
  }
  if (w.pony.phase === 'coil') {
    w.pony.t += dt;
    w.pony.u = Math.min(1, w.pony.t / TIMING.coil);
    if (w.pony.t >= TIMING.coil) {
      w.pony.phase = 'unroll';
      w.pony.t = 0;
      w.pony.u = 0;
      w.forgiveSpent = false;
    }
    return;
  }
  if (w.pony.phase === 'unroll') {
    w.pony.t += dt;
    w.pony.u = Math.min(1, w.pony.t / TIMING.unroll);
    if (!w.forgiveSpent && forgivenessWindow(w.pony.u)) {
      const pts = currentHair(w);
      const rivalBody = {x: w.rival.x, y: w.rival.y - 52, r: w.rival.r};
      const hit = hairHitsCircle(pts, w.p.x, w.p.y, w.p.face, rivalBody, 16);
      const rdx = (w.rival.x - w.p.x) * w.p.face;
      const reach = w.p.x >= LAYOUT.cliff1 ? 280 : 175;
      const close = rdx > -36 && Math.hypot(w.rival.x - w.p.x, rivalBody.y - (w.p.y - 60)) < reach;
      if ((hit.hit || close) && !w.rival.forgiven) {
        w.forgiveSpent = true;
        w.stats.forgivenessContacts += 1;
        w.rival.forgiven = true;
        w.rival.vx = w.p.face * 150;
        w.rival.flash = 0.7;
        const bx = hit.hit ? hit.x : w.rival.x;
        const by = hit.hit ? hit.y : rivalBody.y;
        w.blast = {x: bx, y: by, l: 0.7, l0: 0.7};
        fx(w, bx, by - 28, 'FORGIVENESS', '#fff4b0', 20);
      }
    }
    if (w.pony.t >= TIMING.unroll) {
      w.pony.phase = 'idle';
      w.pony.u = 0;
      if (w.onAttackEnd) w.onAttackEnd();
    }
    return;
  }
  if (w.pony.phase === 'punch') {
    const age = TIMING.punch - w.punchT;
    w.punchT -= dt;
    if (!w.punchHitDone && age >= TIMING.punchHit0 && age <= TIMING.punchHit1 + dt) {
      w.punchHitDone = true;
      const fist = {x: w.p.x + w.p.face * 36, y: w.p.y - 58, r: 16};
      if (!w.rival.forgiven && circleTouch(fist, {x: w.rival.x, y: w.rival.y - 52, r: w.rival.r})) {
        w.stats.punchHits += 1;
        w.rival.stagger += 1;
        w.rival.vx = w.p.face * 80;
        fx(w, fist.x, fist.y - 16, 'Punch', '#ffe0c8', 15);
      }
    }
    if (w.punchT <= 0) {
      w.punchT = 0;
      w.pony.phase = 'idle';
    }
    return;
  }
  if (w.lasso) {
    w.lasso.t += dt;
    w.lasso.u = Math.min(1, w.lasso.t / TIMING.lasso);
    w.pony.phase = 'lasso';
    w.pony.u = w.lasso.u;
    if (w.lasso.kind === 'catch' && !w.criminal.captured && w.lasso.u > 0.72) {
      const pts = currentHair(w);
      const hit = hairHitsCircle(pts, w.p.x, w.p.y, w.p.face, {x: w.criminal.x, y: w.criminal.y - 48, r: w.criminal.r}, 14);
      if (hit.hit) {
        w.criminal.captured = true;
        w.criminal.how = 'lasso';
        w.criminal.st = 'caught';
        fx(w, w.criminal.x, -120, 'Caught!', '#f0d0a0', 18);
      }
    }
    if (w.lasso.u >= 1) {
      const kind = w.lasso.kind;
      w.lasso = null;
      if (kind === 'swing') {
        w.swing = {t: 0};
        w.pony.phase = 'lasso';
        w.pony.u = 1;
      } else w.pony.phase = 'idle';
    }
    return;
  }
  if (w.pending > 0 && w.who === 'hope') {
    w.pending -= 1;
    w.punchT = TIMING.punch;
    w.punchHitDone = false;
    w.pony.phase = 'punch';
    w.stats.punchesStarted += 1;
    fx(w, w.p.x + w.p.face * 20, w.p.y - 118, w.pending > 0 ? 'Punch' : 'Punch', '#fff', 14);
  }
}

function circleTouch(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y, r = a.r + b.r;
  return dx * dx + dy * dy <= r * r;
}

function integrate(w, dt) {
  if (w.cd.pray > 0) w.cd.pray -= dt;
  if (w.cd.grace > 0) w.cd.grace -= dt;
  for (let i = w.prayers.length - 1; i >= 0; i--) {
    const p = w.prayers[i];
    p.life -= dt;
    p.x += p.vx * dt;
    let dead = p.life <= 0;
    for (const e of w.evils) {
      if (e.aside || e.knock) continue;
      if (circleTouch(p, e)) {
        knockEvil(e, Math.sign(p.vx) || 1);
        fx(w, e.x, e.y - 16, 'Knocked aside!', '#fff6c8', 15);
        dead = true;
      }
    }
    if (dead) w.prayers.splice(i, 1);
  }
  for (let i = w.graces.length - 1; i >= 0; i--) {
    const g = w.graces[i];
    g.life -= dt;
    const u = 1 - g.life / g.l0;
    g.r = 18 + (TIMING.graceMax - 18) * Math.min(1, u);
    for (const e of w.evils) {
      if (e.aside || e.knock) continue;
      const dx = (e.x - g.x) * g.face;
      if (dx < 0) continue;
      if (Math.hypot(e.x - g.x, e.y - g.y) < g.r + e.r) {
        knockEvil(e, g.face);
        fx(w, e.x, e.y - 16, 'Knocked aside!', '#ffe9a2', 15);
      }
    }
    if (g.life <= 0) w.graces.splice(i, 1);
  }
  for (const e of w.evils) {
    if (!e.knock) continue;
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    e.vx *= Math.pow(0.08, dt);
    e.vy *= Math.pow(0.2, dt);
    if (Math.abs(e.x - e.home) > 48) e.aside = true;
    if (e.aside) e.fade = Math.max(0, e.fade - dt * 0.7);
  }
  const c = w.criminal;
  if (!c.captured && w.who === 'duncan') {
    const adx = Math.abs(c.x - w.p.x);
    if (c.st === 'loiter' && adx < DUNCAN.fleeNear && w.p.y > -40) {
      c.st = 'flee';
      c.tm = DUNCAN.fleeTime;
    } else if (c.st === 'flee') {
      const mv = Math.sign(c.x - w.p.x) || 1;
      c.x += mv * DUNCAN.fleeSpeed * dt;
      c.x = Math.max(230, Math.min(LAYOUT.cliff0 - 16, c.x));
      c.tm -= dt;
      if (adx < DUNCAN.nabRun && w.p.y > DUNCAN.nabFeet) bustCriminal(w, 'nab');
      if (c.tm <= 0) { c.st = 'tired'; c.tm = DUNCAN.tiredTime; }
    } else if (c.st === 'tired') {
      c.tm -= dt;
      if (adx < DUNCAN.nabRun && w.p.y > DUNCAN.nabFeet) bustCriminal(w, 'nab');
      if (c.tm <= 0) c.st = 'loiter';
    }
  }
  if (c.captured) c.vx = 0;
  if (w.rival.flash > 0) w.rival.flash -= dt;
  w.rival.x += w.rival.vx * dt;
  w.rival.vx *= Math.pow(0.05, dt);
  if (w.blast) { w.blast.l -= dt; if (w.blast.l <= 0) w.blast = null; }
  for (let i = w.fx.length - 1; i >= 0; i--) {
    const f = w.fx[i];
    f.l -= dt;
    f.y += f.vy * dt;
    if (f.l <= 0) w.fx.splice(i, 1);
  }
}

export function stepWorld(w, dt, input = {}) {
  dt = Math.max(0, Math.min(0.05, dt));
  w.t += dt;
  if (input.switchTo || input.switchToggle) {
    const next = input.switchTo || (w.who === 'hope' ? 'duncan' : 'hope');
    if (next !== w.who) {
      switchWho(w, next);
      if (w.onSwitch) w.onSwitch();
    }
  }
  if (input.pray) tryPray(w);
  if (input.grace) tryGrace(w);
  if (input.lasso) tryLasso(w);
  if (input.act) tryAct(w);
  if (input.jump) tryJump(w);
  advanceAttack(w, dt);
  movePlayer(w, dt, input);
  integrate(w, dt);
  return w;
}

export function goals(w) {
  return {
    prayer: w.evils[0].aside,
    grace: w.evils[1].aside,
    criminal: !!(w.criminal.captured || w.criminal.busted),
    umbrella: !!w.umb.folded,
    ravine: !!w.crossed,
    forgiven: !!w.rival.forgiven
  };
}

export function goalsMet(w) {
  const g = goals(w);
  return g.prayer && g.grace && g.criminal && g.umbrella && g.ravine && g.forgiven;
}
