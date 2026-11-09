/* Pure crossover mechanics. No DOM. Original Constable Duncan files are not imported. */
export const TAU = Math.PI * 2;

export const TIMING = {
  tapWindowMs: 450,
  carry: 0.5,
  coil: 0.48,
  unroll: 0.62,
  punch: 0.22,
  punchHit0: 0.08,
  punchHit1: 0.16,
  forgiveU0: 0.32,
  forgiveU1: 0.90,
  lasso: 0.42,
  swing: 1.20,
  praySpeed: 280,
  prayR: 12,
  prayLife: 0.85,
  graceDur: 0.74,
  graceMax: 176,
  prayCd: 0.42,
  graceCd: 1.15
};

/* Ranges copied from Constable Duncan SideGame (js/game.js):
   crook ACTION dx<90, closed umbrella creep/shake dx<84, open umbrella dx<120,
   run-into a fleeing or tired crook dx<38 and feet above y=-30,
   jump vy -340, gravity 900, walk 100, run 280, run starts after 0.2s. */
export const DUNCAN = {
  bustCrook: 90,
  bustUmbCreep: 84,
  bustUmbOpen: 120,
  nabRun: 38,
  nabFeet: -30,
  fleeNear: 210,
  fleeSpeed: 150,
  fleeTime: 2.7,
  tiredTime: 1.7,
  jumpVy: -340,
  grav: 900,
  walk: 100,
  run: 280,
  runHold: 0.2
};

export const LAYOUT = {
  barrier: {x0: 186, x1: 216, h: 36},
  cliff0: 400,
  cliff1: 680,
  anchor: {x: 760, y: -172},
  swing: {x0: 392, y0: 0, x1: 546, y1: -248, x2: 712, y2: 0},
  farEnd: 1160,
  lassoCatch: 160,
  swingX0: 300,
  swingX1: 400,
  lip: 340
};

export const HOPE_HEAD = {x: 4, y: -92};

export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
export function lerp(a, b, t) { return a + (b - a) * t; }
function ease(u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }

export function hairRoot(head = HOPE_HEAD) {
  return {x: head.x - 7, y: head.y + 3};
}

/** Local-space ponytail. +x is forward before facing flip. */
export function ponytailPoints(phase, u, sway, head = HOPE_HEAD, target = null) {
  const N = 14;
  const root = hairRoot(head);
  const hangTip = {x: root.x - 8, y: root.y + 78};
  const coilC = {x: root.x + 4, y: root.y + 14};
  const pts = [];
  const hang = (t, amp) => ({
    x: lerp(root.x, hangTip.x, t) + Math.sin((sway || 0) + t * 3) * amp * t,
    y: lerp(root.y, hangTip.y, t) + Math.cos((sway || 0) * 0.8 + t) * 1.5
  });
  if (phase === 'coil') {
    const k = ease(u);
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const h = hang(t, 5);
      const ang = -Math.PI * 0.5 + t * 2.45 * TAU;
      const rad = 8 + t * 16;
      const open = {x: coilC.x + Math.cos(ang) * (rad + 18 * (1 - t)), y: coilC.y + Math.sin(ang) * (rad + 12) * 0.9};
      const tight = {x: coilC.x + Math.cos(ang) * rad * 0.72, y: coilC.y + Math.sin(ang) * rad * 0.62};
      const gathered = lerp(0, 1, Math.min(1, k * 1.05));
      pts.push({
        x: lerp(lerp(h.x, open.x, 0.35), tight.x, gathered),
        y: lerp(lerp(h.y, open.y, 0.35), tight.y, gathered)
      });
    }
    return pts;
  }
  if (phase === 'unroll') {
    const k = ease(u);
    const tip = {x: root.x + lerp(16, 118, k), y: root.y + lerp(14, 30, k)};
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const ang = -Math.PI * 0.5 + t * 2.45 * TAU;
      const rad = 8 + t * 16;
      const coiled = {x: coilC.x + Math.cos(ang) * rad, y: coilC.y + Math.sin(ang) * rad * 0.82};
      const belly = Math.sin(t * Math.PI) * (1 - k) * 20;
      const wave = Math.sin(t * TAU * 1.5 - k * TAU * 2) * (1 - k) * 9;
      const straight = {x: lerp(root.x, tip.x, t), y: lerp(root.y, tip.y, t) - belly + wave * (1 - t)};
      pts.push({x: lerp(coiled.x, straight.x, k), y: lerp(coiled.y, straight.y, k)});
    }
    return pts;
  }
  if (phase === 'lasso') {
    const tgt = target || {x: root.x + 90, y: root.y + 20};
    const k = clamp(u, 0, 1);
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const sag = Math.sin(t * Math.PI) * 16 * (1 - k * 0.45);
      const reach = t * (0.08 + 0.92 * k);
      pts.push({x: lerp(root.x, tgt.x, reach), y: lerp(root.y, tgt.y, reach) + sag});
    }
    return pts;
  }
  if (phase === 'punch') {
    const k = clamp(u, 0, 1);
    const flick = Math.sin(k * Math.PI);
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const h = hang(t, 4);
      pts.push({x: h.x + flick * 10 * t, y: h.y - flick * 6 * t});
    }
    return pts;
  }
  for (let i = 0; i < N; i++) pts.push(hang(i / (N - 1), 7));
  return pts;
}

export function pointsSpread(pts) {
  let cx = 0, cy = 0;
  for (const p of pts) { cx += p.x; cy += p.y; }
  cx /= pts.length; cy /= pts.length;
  let max = 0;
  for (const p of pts) max = Math.max(max, Math.hypot(p.x - cx, p.y - cy));
  return max;
}

export function ponytailTip(pts) { return pts[pts.length - 1]; }

export function forgivenessWindow(u) {
  return u >= TIMING.forgiveU0 && u <= TIMING.forgiveU1;
}

export function localToWorld(originX, originY, face, pt) {
  return {x: originX + pt.x * face, y: originY + pt.y};
}

export function circleHit(ax, ay, ar, bx, by, br) {
  const dx = ax - bx, dy = ay - by;
  const r = ar + br;
  return dx * dx + dy * dy <= r * r;
}

export function hairHitsCircle(pts, originX, originY, face, circle, pad) {
  for (let i = 0; i < pts.length; i++) {
    const w = localToWorld(originX, originY, face, pts[i]);
    const padI = pad * (0.45 + 0.55 * (i / (pts.length - 1)));
    if (circleHit(w.x, w.y, padI, circle.x, circle.y, circle.r)) return {hit: true, x: w.x, y: w.y, i};
  }
  return {hit: false};
}

export function swingPoint(u) {
  const e = clamp(u, 0, 1);
  const a = (1 - e) * (1 - e), b = 2 * (1 - e) * e, c = e * e;
  const s = LAYOUT.swing;
  return {x: a * s.x0 + b * s.x1 + c * s.x2, y: a * s.y0 + b * s.y1 + c * s.y2};
}

export function jumpApex() {
  const v = -DUNCAN.jumpVy;
  return (v * v) / (2 * DUNCAN.grav);
}

export function runJumpDistance() {
  const air = (2 * -DUNCAN.jumpVy) / DUNCAN.grav;
  return DUNCAN.run * air;
}

/** Phone and desktop controls. Portrait splits the screen so buttons sit below play.
    Landscape, including a Galaxy S25 Ultra turned sideways, keeps the full picture and overlays the buttons. */
export function controlLayout(w, h) {
  const portrait = h > w;
  return {portrait, pad: true, split: portrait, canvasFrac: portrait ? 0.62 : 1};
}

export function onSolid(x) {
  return (x >= 16 && x <= LAYOUT.cliff0) || (x >= LAYOUT.cliff1 && x <= LAYOUT.farEnd);
}

export function worldToLocal(px, py, face, wx, wy) {
  return {x: (wx - px) * face, y: wy - py};
}
