/* Gait and Constable Duncan drawing, copied from js/game.js so the crossover can
   show him without loading or changing the original game. clock.t replaces G.t. */
export const clock = {t: 0};
const TAU = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function mkRig(o) {
  const R = Object.assign({S: 44, s0: 0.62, vw: 70, vr: 190, cw: 0.85, cr: 1.4, L1: 27, L2: 26, hipH: 54, ank: 4, lift: 9, kick: 8, bob: 1.6, sp: 3, Am: 0.5, Em: 0.55}, o);
  let c = 0;
  while (c < 30 && Math.hypot(R.S / 2 + R.sp, R.hipH - R.ank - c) > 0.97 * (R.L1 + R.L2)) c += 0.25;
  R.cr0 = c;
  return R;
}
function cadence(R, v) {
  const r = clamp((v - R.vw) / (R.vr - R.vw), 0, 1);
  return R.cw + (R.cr - R.cw) * r;
}
export function mkGait() { return {u: 0, v: 0, A: 0, D: 60, mt: -9, air: 0}; }
export function stepGait(o, dx, dt, R, on) {
  const ad = on ? Math.abs(dx) : 0;
  if (dt > 0) o.v += ((ad / dt) - o.v) * Math.min(1, dt * 8);
  if (ad > 0.01) o.mt = clock.t;
  const mv = on && clock.t - o.mt < 0.09, v = o.v;
  o.D = Math.max(R.S / R.s0, v / cadence(R, Math.max(v, 1)));
  o.u = (o.u + ad / o.D) % 1;
  const tg = mv ? 1 : 0;
  o.A += Math.sign(tg - o.A) * Math.min(Math.abs(tg - o.A), dt / 0.15);
  o.air += ((on ? 0 : 1) - o.air) * Math.min(1, dt * 14);
}
function ik(h, a, L1, L2) {
  let d = Math.hypot(a[0] - h[0], a[1] - h[1]);
  d = clamp(d, Math.abs(L1 - L2) + 0.01, L1 + L2 - 0.01);
  const b = Math.atan2(a[1] - h[1], a[0] - h[0]), off = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const k1 = [h[0] + L1 * Math.cos(b + off), h[1] + L1 * Math.sin(b + off)], k2 = [h[0] + L1 * Math.cos(b - off), h[1] + L1 * Math.sin(b - off)];
  const k = k1[0] > k2[0] ? k1 : k2;
  const ang = Math.atan2(a[1] - k[1], a[0] - k[0]);
  return {k, a: [k[0] + Math.cos(ang) * L2, k[1] + Math.sin(ang) * L2]};
}
export function pose(o, R) {
  const A0 = o.A, A = A0 * A0 * (3 - 2 * A0), S = R.S, s = Math.min(R.s0, S / (o.D || S / R.s0)), u = o.u;
  const run = Math.max(clamp((R.s0 - s) / (R.s0 * 0.7), 0, 1) * (R.vfix ? 0 : 1), R.vfix ? clamp(((o.v || 0) - R.vw) / (R.vr - R.vw), 0, 1) : 0), air = o.air || 0;
  const by = A * (R.cr0 + R.bob * (0.5 + 0.5 * Math.cos(TAU * u * 2)) * (1 - run * 0.5) - run * R.bob * 0.6 * Math.max(0, Math.sin(TAU * u * 2)));
  const hy = -R.hipH + by, legs = [], arms = [];
  for (let i = 0; i < 2; i++) {
    const q = ((u + i * 0.5) % 1 + 1) % 1;
    let X, Y = 0, sw = 0;
    if (q < s) X = S / 2 - S * q / s;
    else {
      const v = (q - s) / (1 - s), e = v * v * (3 - 2 * v);
      sw = Math.sin(Math.PI * v);
      X = -S / 2 + S * e - run * R.kick * Math.sin(Math.PI * Math.min(1, v * 1.6));
      Y = -R.lift * (1 + run * 0.6) * sw;
    }
    let ax = X * A + (1 - A) * (i ? -R.sp : R.sp), ay = -R.ank + Y * A;
    if (air > 0.01) { ax = lerp(ax, i ? -7 : 9, air); ay = lerp(ay, i ? -12 : -20, air); }
    const h = [i ? -1.5 : 1.5, hy - (air * 4)], K = ik(h, [ax, ay], R.L1, R.L2);
    legs.push({h, k: K.k, a: K.a, fr: -0.35 * sw * A, fwd: clamp(X / (S / 2), -1, 1) * A, stance: q < s});
  }
  for (let i = 0; i < 2; i++) {
    const f = -legs[i].fwd;
    const Am = R.Am * (1 + run * 0.6);
    let sa = Am * f, ea = R.Em * (0.25 + 0.75 * Math.max(0, f)) * A + 0.15 + run * 0.9 * A;
    if (air > 0.01) { sa = lerp(sa, i ? -0.6 : 1.2, air); ea = lerp(ea, 0.9, air); }
    arms.push({sa, ea});
  }
  return {hy, legs, arms, run, A, lean: 0.04 * A + 0.1 * run * A};
}
function seg(c, a, b, r, col) {
  c.strokeStyle = col; c.lineWidth = r * 2; c.lineCap = 'round';
  c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
}
function segO(c, a, b, r, col, ol) { seg(c, a, b, r + 0.9, ol || '#2a1a10'); seg(c, a, b, r, col); }
function armPts(sh, sa, ea, L1, L2) {
  const e = [sh[0] + Math.sin(sa) * L1, sh[1] + Math.cos(sa) * L1], fa = sa + ea;
  const w = [e[0] + Math.sin(fa) * L2, e[1] + Math.cos(fa) * L2];
  return {e, w, fa};
}
export function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  r = Math.round(r * f); g = Math.round(g * f); b = Math.round(b * f);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function star5(c, x, y, r, col, ol) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
    c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath(); c.fillStyle = col; c.fill();
  if (ol) { c.lineWidth = 0.6; c.strokeStyle = ol; c.stroke(); }
}
export const RD = mkRig({vfix: 1, S: 52, vw: 100, vr: 280, cw: 0.95, cr: 1.42});
const DC = {skin: '#eab48c', skinD: '#c98f68', shirt: '#b89d64', shirtD: '#8f7748', ol: '#2e2012', boot: '#18181a', hair: '#dccb9f', hairD: '#a8946a', beard: '#aaa59c'};
let tartan = null, tartanPat = null;
function tpat(c) {
  if (!tartanPat && typeof document !== 'undefined') {
    tartan = document.createElement('canvas'); tartan.width = tartan.height = 32;
    const x = tartan.getContext('2d');
    x.fillStyle = '#1d3b27'; x.fillRect(0, 0, 32, 32);
    x.fillStyle = 'rgba(22,30,62,.85)'; x.fillRect(0, 4, 32, 10); x.fillRect(4, 0, 10, 32);
    x.fillStyle = 'rgba(10,12,20,.75)'; x.fillRect(0, 20, 32, 3); x.fillRect(20, 0, 3, 32); x.fillRect(0, 26, 32, 2); x.fillRect(26, 0, 2, 32);
    x.fillStyle = 'rgba(40,70,110,.6)'; x.fillRect(0, 8, 32, 1); x.fillRect(8, 0, 1, 32);
    tartanPat = c.createPattern(tartan, 'repeat');
    try { tartanPat.setTransform(new DOMMatrix().scale(0.3)); } catch (e) {}
  }
  return tartanPat;
}
function duncanLegs(c, L, far) {
  const sk = far ? DC.skinD : DC.skin, bt = far ? '#0d0d0e' : DC.boot;
  segO(c, L.h, L.k, 5, sk, DC.ol);
  const bt0 = [lerp(L.k[0], L.a[0], 0.55), lerp(L.k[1], L.a[1], 0.55)];
  segO(c, L.k, L.a, 4, sk, DC.ol); segO(c, bt0, L.a, 4.6, bt, '#000');
  c.save(); c.translate(L.a[0], L.a[1]); c.rotate(L.fr); c.fillStyle = bt; c.strokeStyle = '#000'; c.lineWidth = 0.8;
  c.beginPath(); c.moveTo(-4.5, -3.5); c.lineTo(4, -4); c.quadraticCurveTo(10, -2.5, 10.5, 1); c.lineTo(10.5, 3.6); c.lineTo(-5, 3.6); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#3a3a3a'; c.fillRect(-5, 2.4, 15.5, 1.4); c.restore();
}
function duncanArm(c, P, i, hy, far, o) {
  const sh = [0, hy - 27];
  let {sa, ea} = P.arms[i];
  if (o.ov) {
    const v = o.ov;
    if (v.t === 'cuff' && !far) { sa = 1.45; ea = 0.15; }
    else if (v.t === 'cuff' && far) { sa = 1.0; ea = 0.6; }
    else if (v.t === 'point' && !far) { sa = 1.55; ea = 0.05; }
    else if (v.t === 'wave' && !far) { sa = 2.7; ea = 0.6 + 0.4 * Math.sin(clock.t * 12); }
  }
  const p = armPts(sh, sa, ea, 15, 14), sk = far ? DC.skinD : DC.skin;
  segO(c, sh, p.e, 5.2, sk, DC.ol); segO(c, p.e, p.w, 4.3, sk, DC.ol);
  const wb = [lerp(p.e[0], p.w[0], 0.7), lerp(p.e[1], p.w[1], 0.7)], wb2 = [lerp(p.e[0], p.w[0], 0.9), lerp(p.e[1], p.w[1], 0.9)];
  seg(c, wb, wb2, 4.8, '#111');
  const sl = [lerp(sh[0], p.e[0], 0.5), lerp(sh[1], p.e[1], 0.5)];
  segO(c, sh, sl, 5.8, far ? DC.shirtD : DC.shirt, DC.ol);
  c.fillStyle = sk; c.strokeStyle = DC.ol; c.lineWidth = 0.9;
  c.beginPath(); c.arc(p.w[0] + Math.sin(p.fa) * 2.5, p.w[1] + Math.cos(p.fa) * 2.5, 4.2, 0, TAU); c.fill(); c.stroke();
  return p;
}
export function drawDuncan(c, o) {
  const P = pose(o, RD), hy = P.hy;
  o._P = P;
  c.save(); duncanArm(c, P, 1, hy, true, o); c.restore();
  duncanLegs(c, P.legs[1], true); duncanLegs(c, P.legs[0], false);
  const kf = Math.max(P.legs[0].k[0], P.legs[1].k[0]), kb = Math.min(P.legs[0].k[0], P.legs[1].k[0]), hemY = hy + 20;
  const hf = clamp(kf * 0.55 + 11, 9, 20), hb = clamp(kb * 0.55 - 11, -20, -9);
  c.beginPath(); c.moveTo(-10, hy - 2); c.lineTo(10.5, hy - 2); c.quadraticCurveTo(hf + 1, hy + 8, hf, hemY); c.lineTo(hb, hemY + 1); c.quadraticCurveTo(hb - 1, hy + 8, -10, hy - 2); c.closePath();
  c.fillStyle = '#1d3b27'; c.fill();
  const pat = tpat(c); if (pat) { c.fillStyle = pat; c.fill(); }
  c.strokeStyle = '#0a1410'; c.lineWidth = 1; c.stroke();
  c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 0.8;
  for (let i = 1; i < 6; i++) { const t = i / 6; c.beginPath(); c.moveTo(lerp(-10, 0, t), hy); c.lineTo(lerp(hb, hb + (hf - hb) * 0.5, t), hemY); } c.stroke();
  c.save(); c.translate(0, hy); c.rotate(P.lean); c.translate(0, -hy);
  c.beginPath(); c.moveTo(-10, hy); c.quadraticCurveTo(-13, hy - 16, -10, hy - 30); c.quadraticCurveTo(-2, hy - 34, 6, hy - 31); c.quadraticCurveTo(15, hy - 25, 12.5, hy - 15); c.quadraticCurveTo(10, hy - 6, 10, hy); c.closePath();
  const gr = c.createLinearGradient(-10, 0, 13, 0); gr.addColorStop(0, DC.shirtD); gr.addColorStop(0.6, DC.shirt); gr.addColorStop(1, '#cdb27a');
  c.fillStyle = gr; c.fill(); c.strokeStyle = DC.ol; c.lineWidth = 1; c.stroke();
  star5(c, 4.5, hy - 24.5, 3.4, '#f2c437', '#7a5a10');
  c.fillStyle = '#141414'; c.fillRect(-10.5, hy - 2.5, 22, 4);
  c.fillStyle = DC.skin; c.fillRect(0.5, hy - 36, 7.5, 7);
  const hx = 4.5, hy2 = hy - 42.5;
  const hg = c.createLinearGradient(-14, hy2 - 10, -4, hy2 + 20);
  hg.addColorStop(0, '#e6d6aa'); hg.addColorStop(0.6, DC.hair); hg.addColorStop(1, '#b8a47c');
  c.fillStyle = hg; c.strokeStyle = '#7a6a48'; c.lineWidth = 0.7;
  c.beginPath(); c.moveTo(1, hy2 - 10); c.quadraticCurveTo(-12, hy2 - 9, -14.5, hy2 + 4); c.quadraticCurveTo(-16, hy2 + 16, -12, hy2 + 22); c.quadraticCurveTo(-8, hy2 + 24, -5, hy2 + 19); c.quadraticCurveTo(-1, hy2 + 14, 1.5, hy2 + 6); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = DC.skin; c.strokeStyle = DC.ol; c.lineWidth = 0.9;
  c.beginPath(); c.ellipse(hx, hy2, 9.6, 10.6, 0, 0, TAU); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(13.3, hy2 - 1.5); c.quadraticCurveTo(16.8, hy2 + 1.6, 13.4, hy2 + 3.4); c.fill(); c.stroke();
  c.fillStyle = DC.beard; c.beginPath(); c.moveTo(1.5, hy2 + 3.5); c.quadraticCurveTo(3.5, hy2 + 11, 9.5, hy2 + 12.2); c.quadraticCurveTo(14, hy2 + 11.4, 13.8, hy2 + 7.2); c.quadraticCurveTo(10.5, hy2 + 5.4, 6, hy2 + 6.2); c.closePath(); c.fill();
  c.fillStyle = 'rgba(160,195,225,.35)'; c.fillRect(6.4, hy2 - 3.6, 7.4, 4.8);
  c.strokeStyle = '#0b0b0b'; c.lineWidth = 1.6; c.strokeRect(6.4, hy2 - 3.6, 7.4, 4.8);
  c.fillStyle = '#2a1a10'; c.beginPath(); c.arc(10.8, hy2 - 1.2, 1, 0, TAU); c.fill();
  c.fillStyle = '#161616';
  c.beginPath(); c.moveTo(-5.5, hy2 - 4.5); c.quadraticCurveTo(-4.5, hy2 - 14.5, 4.5, hy2 - 14.6); c.quadraticCurveTo(13.5, hy2 - 14, 14, hy2 - 5.5); c.lineTo(-5.5, hy2 - 4.5); c.fill();
  c.beginPath(); c.moveTo(11, hy2 - 6.5); c.quadraticCurveTo(18.5, hy2 - 7, 22.5, hy2 - 4.4); c.lineTo(22, hy2 - 3.1); c.quadraticCurveTo(16, hy2 - 4.6, 10.5, hy2 - 4.4); c.fill();
  c.restore();
  c.save(); c.translate(0, hy); c.rotate(P.lean); c.translate(0, -hy); duncanArm(c, P, 0, hy, false, o); c.restore();
  return P;
}
export const RH = mkRig({vfix: 1, S: 46, vw: 100, vr: 280, cw: 0.95, cr: 1.42, hipH: 52, L1: 26, L2: 25, Am: 0.45, Em: 0.5});
