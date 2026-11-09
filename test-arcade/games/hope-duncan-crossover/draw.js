import { HOPE_HEAD, LAYOUT } from './mechanics.js';
import { currentHair } from './world.js';
import { RH, clock, drawDuncan, pose } from './verified-rig.js';

const TAU = Math.PI * 2;

export function viewOf(W, H, land) {
  const k = land ? H * 0.30 / 106 : Math.min(H * 0.36, W * 0.62) / 106;
  const gY = land ? H * 0.80 : H * 0.82;
  return {k, gY, vw: W / k};
}

function rr(c, x, y, w, h, r) {
  c.beginPath();
  if (c.roundRect) c.roundRect(x, y, w, h, r);
  else c.rect(x, y, w, h);
}

function label(c, x, y, text, fill) {
  c.save();
  c.font = '13px Lilita, system-ui, sans-serif';
  c.textAlign = 'center';
  c.lineWidth = 3;
  c.strokeStyle = '#1a0c18';
  c.strokeText(text, x, y);
  c.fillStyle = fill || '#fff';
  c.fillText(text, x, y);
  c.restore();
}

function drawHairChain(c, pts) {
  if (!pts || pts.length < 2) return;
  const left = [], right = [], core = [];
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[Math.max(0, i - 1)], next = pts[Math.min(pts.length - 1, i + 1)];
    let dx = next.x - prev.x, dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    const t = i / (pts.length - 1);
    const w = 7.4 * (1 - t) + 1.6 * t;
    left.push({x: pts[i].x - dy * w, y: pts[i].y + dx * w});
    right.push({x: pts[i].x + dy * w, y: pts[i].y - dx * w});
    core.push({x: pts[i].x - dy * w * 0.25, y: pts[i].y + dx * w * 0.25});
  }
  c.beginPath();
  c.moveTo(left[0].x, left[0].y);
  for (let i = 1; i < left.length; i++) c.quadraticCurveTo(pts[i - 1].x - (pts[i].y - pts[i - 1].y) * 0, pts[i - 1].y, left[i].x, left[i].y);
  for (let i = 1; i < left.length; i++) c.lineTo(left[i].x, left[i].y);
  for (let i = right.length - 1; i >= 0; i--) c.lineTo(right[i].x, right[i].y);
  c.closePath();
  const g = c.createLinearGradient(pts[0].x, pts[0].y, pts[pts.length - 1].x, pts[pts.length - 1].y);
  g.addColorStop(0, '#8d552f');
  g.addColorStop(0.45, '#6a3b22');
  g.addColorStop(1, '#3e2416');
  c.fillStyle = g;
  c.fill();
  c.strokeStyle = '#2a170f';
  c.lineWidth = 1.2;
  c.stroke();
  c.beginPath();
  c.moveTo(core[0].x, core[0].y);
  for (let i = 1; i < core.length; i++) c.lineTo(core[i].x, core[i].y);
  c.strokeStyle = 'rgba(232,196,150,.55)';
  c.lineWidth = 1.4;
  c.stroke();
}

function drawHope(c, o, phase, punchU) {
  const P = pose(o, RH);
  const hy = P.hy;
  const bob = Math.sin((o.u || 0) * TAU * 2) * 1.2 * (P.A || 0);
  c.save();
  c.translate(0, bob);
  const skin = '#ffd3b0', shirt = '#141414', shirtD = '#2a2a2a', jean = '#3a6cb8', jeanD = '#274e86';
  c.fillStyle = 'rgba(0,0,0,.25)';
  c.beginPath();
  c.ellipse(2, 2, 18, 4.5, 0, 0, TAU);
  c.fill();
  const arm = (far) => {
    const sh = [far ? -2 : 3, hy - 24];
    let ex = far ? -12 : 14, ey = hy - 4;
    if (!far && phase === 'punch') { ex = 28 + punchU * 10; ey = hy - 18; }
    else if (phase === 'coil') { ex = far ? -8 : 8; ey = hy - 36; }
    else if (phase === 'unroll' && !far) { ex = 24 + punchU * 16; ey = hy - 16; }
    else if (P.A > 0.2) { ex += (far ? -1 : 1) * P.legs[far ? 1 : 0].fwd * -8; }
    c.lineCap = 'round';
    c.strokeStyle = '#050505';
    c.lineWidth = far ? 7.2 : 7.6;
    c.beginPath();
    c.moveTo(sh[0], sh[1]);
    c.quadraticCurveTo((sh[0] + ex) / 2 + (far ? -4 : 6), (sh[1] + ey) / 2, ex, ey);
    c.stroke();
    c.strokeStyle = far ? shirtD : shirt;
    c.lineWidth = far ? 5.4 : 5.8;
    c.beginPath();
    c.moveTo(sh[0], sh[1]);
    c.quadraticCurveTo((sh[0] + ex) / 2 + (far ? -4 : 6), (sh[1] + ey) / 2, ex, ey);
    c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.18)';
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(sh[0] + (far ? 1 : -1), sh[1]);
    c.quadraticCurveTo((sh[0] + ex) / 2 + (far ? -2 : 4), (sh[1] + ey) / 2, ex, ey);
    c.stroke();
    c.fillStyle = skin;
    c.beginPath();
    c.arc(ex, ey, 3.3, 0, TAU);
    c.fill();
  };
  arm(true);
  for (const L of [P.legs[1], P.legs[0]]) {
    const far = L === P.legs[1];
    c.lineCap = 'round';
    c.strokeStyle = '#111';
    c.lineWidth = far ? 8.2 : 8.8;
    c.beginPath();
    c.moveTo(L.h[0], Math.min(L.h[1], hy + 4));
    c.lineTo(L.k[0], L.k[1]);
    c.lineTo(L.a[0], L.a[1]);
    c.stroke();
    c.strokeStyle = far ? jeanD : jean;
    c.lineWidth = far ? 6.4 : 7;
    c.beginPath();
    c.moveTo(L.h[0], Math.min(L.h[1], hy + 4));
    c.lineTo(L.k[0], L.k[1]);
    c.lineTo(L.a[0], L.a[1]);
    c.stroke();
    c.strokeStyle = 'rgba(190,220,255,.28)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(L.h[0] + 1, Math.min(L.h[1], hy + 6));
    c.lineTo(L.a[0] + 1, L.a[1] - 4);
    c.stroke();
    c.save();
    c.translate(L.a[0], L.a[1]);
    c.rotate(L.fr || 0);
    c.fillStyle = '#111';
    c.beginPath();
    c.moveTo(-4.5, -2);
    c.lineTo(8, -2.5);
    c.quadraticCurveTo(12, 0, 11, 3.4);
    c.lineTo(-4.5, 3.4);
    c.closePath();
    c.fill();
    c.restore();
  }
  c.beginPath();
  c.moveTo(-10, hy + 4);
  c.quadraticCurveTo(-12, hy - 16, -8, hy - 31);
  c.quadraticCurveTo(1, hy - 36, 9, hy - 31);
  c.quadraticCurveTo(13, hy - 14, 11, hy + 4);
  c.closePath();
  const sg = c.createLinearGradient(-10, hy - 30, 12, hy);
  sg.addColorStop(0, shirtD);
  sg.addColorStop(0.45, shirt);
  sg.addColorStop(1, '#0c0c0c');
  c.fillStyle = sg;
  c.fill();
  c.strokeStyle = '#000';
  c.lineWidth = 1;
  c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.16)';
  c.lineWidth = 1.3;
  c.beginPath();
  c.moveTo(-4, hy - 28);
  c.quadraticCurveTo(-2, hy - 8, -1, hy + 2);
  c.stroke();
  arm(false);
  const hx = HOPE_HEAD.x, hy2 = HOPE_HEAD.y;
  c.fillStyle = skin;
  c.beginPath();
  c.moveTo(hx - 3.5, hy2 + 8);
  c.lineTo(hx + 5, hy2 + 8);
  c.lineTo(hx + 3, hy - 30);
  c.lineTo(hx - 2, hy - 30);
  c.closePath();
  c.fill();
  c.fillStyle = '#5c331c';
  c.beginPath();
  c.ellipse(hx - 2, hy2 + 1, 12, 13, 0, 0, TAU);
  c.fill();
  c.fillStyle = skin;
  c.beginPath();
  c.ellipse(hx, hy2, 10.2, 11.2, 0, 0, TAU);
  c.fill();
  c.strokeStyle = '#c48b6a';
  c.lineWidth = 0.8;
  c.stroke();
  c.fillStyle = 'rgba(230,140,130,.35)';
  c.beginPath();
  c.ellipse(hx + 6, hy2 + 3, 2.2, 1.4, 0, 0, TAU);
  c.fill();
  c.strokeStyle = '#a65058';
  c.lineWidth = 1;
  c.beginPath();
  c.arc(hx + 5.5, hy2 + 5.5, 2.4, 0.2, 1.4);
  c.stroke();
  c.strokeStyle = '#d5dde6';
  c.lineWidth = 1.3;
  c.beginPath();
  c.moveTo(hx - 2, hy2 - 1);
  c.lineTo(hx + 14, hy2 - 2);
  c.stroke();
  c.fillStyle = '#14181d';
  c.beginPath();
  c.ellipse(hx + 6.5, hy2 - 1.2, 6.4, 4.3, -0.15, 0, TAU);
  c.fill();
  const lens = c.createLinearGradient(hx, hy2 - 5, hx + 10, hy2 + 3);
  lens.addColorStop(0, '#3a4250');
  lens.addColorStop(0.4, '#0c0e12');
  lens.addColorStop(1, '#222833');
  c.fillStyle = lens;
  c.beginPath();
  c.ellipse(hx + 6.2, hy2 - 1.1, 5.2, 3.4, -0.1, 0, TAU);
  c.fill();
  c.strokeStyle = '#e6edf4';
  c.lineWidth = 1.15;
  c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.45)';
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(hx + 3, hy2 - 2.6);
  c.lineTo(hx + 7, hy2 - 2.2);
  c.stroke();
  c.fillStyle = '#121212';
  c.beginPath();
  c.moveTo(hx - 8, hy2 - 4);
  c.quadraticCurveTo(hx - 6, hy2 - 16, hx + 2, hy2 - 16.5);
  c.quadraticCurveTo(hx + 12, hy2 - 16, hx + 13, hy2 - 5);
  c.lineTo(hx - 8, hy2 - 4);
  c.fill();
  c.fillStyle = '#2a2a2a';
  c.fillRect(hx - 7, hy2 - 6.2, 20, 2.2);
  c.fillStyle = '#101010';
  c.beginPath();
  c.moveTo(hx + 10, hy2 - 6);
  c.quadraticCurveTo(hx + 22, hy2 - 7.5, hx + 26, hy2 - 3.2);
  c.lineTo(hx + 25, hy2 - 1.4);
  c.quadraticCurveTo(hx + 18, hy2 - 3.4, hx + 10, hy2 - 3.5);
  c.fill();
  c.fillStyle = '#3a3a3a';
  c.beginPath();
  c.arc(hx + 1, hy2 - 12, 1.3, 0, TAU);
  c.fill();
  c.restore();
}

function drawCrook(c, cr, t) {
  const bob = Math.sin(t * 8) * (cr.st === 'flee' ? 2 : 0.6);
  c.save();
  c.translate(0, bob);
  c.fillStyle = 'rgba(0,0,0,.25)';
  c.beginPath();
  c.ellipse(0, 2, 16, 4, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#20242c';
  c.fillRect(-7, -46, 14, 28);
  c.fillStyle = '#3a404a';
  c.fillRect(-8, -48, 16, 8);
  c.fillStyle = '#d7b08a';
  c.beginPath();
  c.ellipse(4, -62, 7, 8, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#1b1b1b';
  c.fillRect(-6, -72, 16, 8);
  c.fillStyle = '#111';
  c.beginPath();
  c.ellipse(6, -64, 3, 2, 0, 0, TAU);
  c.fill();
  c.strokeStyle = '#15181e';
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(-6, -40);
  c.lineTo(-8, -8);
  c.moveTo(6, -40);
  c.lineTo(9, -8);
  c.stroke();
  c.fillStyle = '#111';
  c.fillRect(-12, -10, 10, 5);
  c.fillRect(4, -10, 10, 5);
  if (cr.captured) {
    c.strokeStyle = '#d8dce4';
    c.lineWidth = 2.2;
    c.beginPath();
    c.arc(-2, -30, 5, 0, TAU);
    c.arc(4, -30, 5, 0, TAU);
    c.stroke();
    c.strokeStyle = '#6e3d22';
    c.lineWidth = 3;
    c.beginPath();
    c.ellipse(2, -36, 16, 10, 0.2, 0, TAU);
    c.stroke();
  }
  c.restore();
}

function drawEvil(c, e, t) {
  c.save();
  c.globalAlpha = Math.max(0.15, e.fade);
  c.translate(e.knock ? Math.sin(t * 30) * 2 : 0, Math.sin(t * 3 + e.home) * 4);
  c.fillStyle = 'rgba(40,10,60,.35)';
  c.beginPath();
  c.ellipse(0, 10, 20, 6, 0, 0, TAU);
  c.fill();
  for (let i = 0; i < 5; i++) {
    const a = t * 1.4 + i;
    c.fillStyle = i % 2 ? '#2a1438' : '#4a2460';
    c.beginPath();
    c.ellipse(Math.cos(a) * 10, Math.sin(a) * 6 - 6, 12, 10, 0, 0, TAU);
    c.fill();
  }
  c.fillStyle = '#fff';
  c.beginPath();
  c.arc(-6, -8, 2.2, 0, TAU);
  c.arc(6, -8, 2.2, 0, TAU);
  c.fill();
  c.fillStyle = '#c33';
  c.beginPath();
  c.arc(-5.4, -8, 1, 0, TAU);
  c.arc(6.6, -8, 1, 0, TAU);
  c.fill();
  c.restore();
  if (!e.aside) label(c, e.x, e.y - 36, 'EVIL', '#e7c0ff');
}

function drawUmb(c, u, t) {
  c.save();
  c.translate(u.x, 0);
  if (u.folded) c.globalAlpha = 0.85;
  c.fillStyle = 'rgba(0,0,0,.25)';
  c.beginPath();
  c.ellipse(0, 0, 16, 4, 0, 0, TAU);
  c.fill();
  const g = c.createLinearGradient(-18, 0, 18, 0);
  g.addColorStop(0, '#24160f');
  g.addColorStop(0.5, '#5a4030');
  g.addColorStop(1, '#1a100c');
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(0, -132);
  c.quadraticCurveTo(22, -70, 16, -8);
  c.quadraticCurveTo(0, 4, -16, -8);
  c.quadraticCurveTo(-22, -70, 0, -132);
  c.fill();
  c.fillStyle = '#120c09';
  c.beginPath();
  c.ellipse(0, -70, 14, 22, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#ffef9a';
  c.beginPath();
  c.ellipse(-5, -68, 2.4, u.folded ? 0.6 : 3, 0, 0, TAU);
  c.ellipse(5, -68, 2.4, u.folded ? 0.6 : 3, 0, 0, TAU);
  c.fill();
  if (u.folded) {
    c.strokeStyle = '#d8dce4';
    c.lineWidth = 2.4;
    c.beginPath();
    c.ellipse(0, -40, 14, 4, 0, 0, TAU);
    c.ellipse(0, -24, 12, 4, 0, 0, TAU);
    c.stroke();
  } else {
    c.fillStyle = '#c8b070';
    c.beginPath();
    c.arc(0, -134, 2.4, 0, TAU);
    c.fill();
  }
  c.restore();
  label(c, u.x, -150, u.folded ? 'FOLDED' : 'UMBRELLA', '#ffd23f');
  void t;
}

function drawRival(c, r, t) {
  c.save();
  c.translate(r.x, r.forgiven ? 8 : 0);
  c.fillStyle = 'rgba(0,0,0,.25)';
  c.beginPath();
  c.ellipse(0, 2, 18, 4, 0, 0, TAU);
  c.fill();
  const col = r.forgiven ? '#f4efe4' : '#24182e';
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(-16, -4);
  c.lineTo(0, -78);
  c.lineTo(16, -4);
  c.closePath();
  c.fill();
  if (!r.forgiven) {
    c.fillStyle = '#ffb3b3';
    c.beginPath();
    c.ellipse(0, -58, 8, 9, 0, 0, TAU);
    c.fill();
    c.fillStyle = '#301018';
    c.fillRect(-7, -64, 14, 5);
    c.fillStyle = '#ffd0d0';
    c.beginPath();
    c.arc(-3, -58, 1.3, 0, TAU);
    c.arc(3, -58, 1.3, 0, TAU);
    c.fill();
  } else {
    c.fillStyle = '#ffd7b5';
    c.beginPath();
    c.ellipse(0, -50, 8, 9, 0, 0, TAU);
    c.fill();
    c.strokeStyle = '#a65058';
    c.beginPath();
    c.arc(0, -46, 3, 0.2, 1.2);
    c.stroke();
    c.fillStyle = 'rgba(255,230,140,' + (0.35 + 0.25 * Math.sin(t * 6)) + ')';
    c.beginPath();
    c.arc(0, -40, 28, 0, TAU);
    c.fill();
  }
  c.restore();
  label(c, r.x, -108, r.forgiven ? 'FORGIVEN' : 'RIVAL', r.forgiven ? '#fff4b0' : '#ffd0e0');
}

export function syncGait(w, dt, stepGait, mkGait, RD) {
  if (!w.vis) w.vis = {hope: mkGait(), duncan: mkGait(), x: w.p.x};
  const dx = w.p.x - w.vis.x;
  w.vis.x = w.p.x;
  const moving = Math.abs(dx) > 0.01 && w.p.y >= -0.5 && !w.swing;
  stepGait(w.vis.hope, w.who === 'hope' ? dx : 0, dt, RH, w.who === 'hope' && moving);
  stepGait(w.vis.duncan, w.who === 'duncan' ? dx : 0, dt, RD, w.who === 'duncan' && moving);
  if (w.p.y < -0.5 || w.swing) {
    w.vis.hope.air += (1 - w.vis.hope.air) * Math.min(1, dt * 14);
    w.vis.duncan.air += (1 - w.vis.duncan.air) * Math.min(1, dt * 14);
  }
}

export function drawFrame(c, w, W, H, land) {
  if (!w.vis) w.vis = {hope: {u: 0, v: 0, A: 0, D: 60, mt: -9, air: 0}, duncan: {u: 0, v: 0, A: 0, D: 60, mt: -9, air: 0}, x: w.p.x};
  clock.t = w.t;
  const V = viewOf(W, H, land);
  const k = V.k;
  let cam = w.p.x - V.vw * (land ? 0.36 : 0.34);
  cam = Math.max(0, Math.min(Math.max(0, LAYOUT.farEnd - V.vw), cam));
  const sky = c.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#1a1030');
  sky.addColorStop(0.45, '#6a3a58');
  sky.addColorStop(0.72, '#e09762');
  sky.addColorStop(1, '#f0c48a');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, H);
  c.save();
  c.translate(-cam * k, V.gY);
  c.scale(k, k);
  c.fillStyle = 'rgba(255,220,170,.18)';
  c.beginPath();
  c.ellipse(520, -210, 180, 28, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#2a2040';
  c.beginPath();
  c.moveTo(-40, -40);
  c.lineTo(80, -150);
  c.lineTo(180, -40);
  c.lineTo(260, -120);
  c.lineTo(420, -30);
  c.lineTo(640, -150);
  c.lineTo(860, -60);
  c.lineTo(1100, -170);
  c.lineTo(1300, -40);
  c.lineTo(1300, 40);
  c.lineTo(-40, 40);
  c.fill();
  c.fillStyle = '#143024';
  c.fillRect(-40, 0, LAYOUT.cliff0 + 50, 220);
  c.fillRect(LAYOUT.cliff1, 0, LAYOUT.farEnd, 220);
  c.fillStyle = '#6d5438';
  c.fillRect(0, -5, LAYOUT.cliff0, 10);
  c.fillRect(LAYOUT.cliff1, -5, LAYOUT.farEnd - LAYOUT.cliff1, 10);
  c.fillStyle = '#d8c4a4';
  for (let x = 20; x < LAYOUT.cliff0; x += 36) c.fillRect(x, -4, 18, 3);
  for (let x = LAYOUT.cliff1 + 16; x < LAYOUT.farEnd; x += 36) c.fillRect(x, -4, 18, 3);
  const B = LAYOUT.barrier;
  c.fillStyle = '#6b6258';
  c.fillRect(B.x0, -B.h, B.x1 - B.x0, B.h);
  c.fillStyle = '#8d8478';
  c.fillRect(B.x0, -B.h, B.x1 - B.x0, 6);
  label(c, (B.x0 + B.x1) / 2, -B.h - 14, 'JUMP', '#ffe08a');
  const ravL = LAYOUT.cliff0, ravR = LAYOUT.cliff1;
  const rg = c.createLinearGradient(0, -20, 0, 220);
  rg.addColorStop(0, '#1a0a16');
  rg.addColorStop(1, '#070308');
  c.fillStyle = rg;
  c.fillRect(ravL, -20, ravR - ravL, 260);
  c.strokeStyle = 'rgba(255,190,80,.35)';
  c.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const x = ravL + 30 + i * 36;
    c.beginPath();
    c.moveTo(x, 30 + Math.sin(w.t * 2 + i) * 6);
    c.quadraticCurveTo(x + 10, 80, x - 6, 160);
    c.stroke();
  }
  label(c, (ravL + ravR) / 2, 36, 'RAVINE — too wide to jump', '#ffd7a8');
  c.fillStyle = '#6b4a2a';
  c.fillRect(LAYOUT.anchor.x - 4, LAYOUT.anchor.y, 8, -LAYOUT.anchor.y);
  c.strokeStyle = '#e0b033';
  c.lineWidth = 3;
  c.beginPath();
  c.arc(LAYOUT.anchor.x, LAYOUT.anchor.y, 10, 0, TAU);
  c.stroke();
  label(c, LAYOUT.anchor.x, LAYOUT.anchor.y - 18, 'LASSO', '#f0d7a4');
  for (const e of w.evils) {
    c.save();
    c.translate(e.x, e.y);
    drawEvil(c, e, w.t);
    c.restore();
  }
  drawUmb(c, w.umb, w.t);
  const crookX = w.criminal.captured && Math.abs(w.criminal.x - w.p.x) < 36 ? w.p.x - 42 : w.criminal.x;
  c.save();
  c.translate(crookX, w.criminal.y);
  c.scale(w.criminal.x < w.p.x ? 1 : -1, 1);
  drawCrook(c, w.criminal, w.t);
  c.restore();
  label(c, crookX, -108, w.criminal.captured ? (w.criminal.how === 'lasso' ? 'CAUGHT' : 'BUSTED') : 'CROOK', w.criminal.captured ? '#f0d0a0' : '#fff');
  drawRival(c, w.rival, w.t);
  for (const g of w.graces) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const a = Math.max(0, g.life / g.l0);
    c.strokeStyle = 'rgba(255,236,170,' + (0.35 + a * 0.5) + ')';
    c.lineWidth = 8;
    c.beginPath();
    c.arc(g.x, g.y, g.r, g.face > 0 ? -1.2 : Math.PI - 1.2, g.face > 0 ? 1.2 : Math.PI + 1.2);
    c.stroke();
    c.fillStyle = 'rgba(255,244,200,' + (0.08 * a) + ')';
    c.beginPath();
    c.arc(g.x, g.y, g.r, 0, TAU);
    c.fill();
    c.restore();
  }
  for (const p of w.prayers) {
    c.save();
    c.translate(p.x, p.y);
    c.fillStyle = 'rgba(255,246,190,.45)';
    c.beginPath();
    c.arc(0, 0, 14, 0, TAU);
    c.fill();
    if (p.kind === 'dove') {
      c.fillStyle = '#fff';
      c.beginPath();
      c.moveTo(-2, 0);
      c.lineTo(-12, -6 + Math.sin(w.t * 18) * 3);
      c.lineTo(2, 0);
      c.lineTo(12, -6 - Math.sin(w.t * 18) * 3);
      c.closePath();
      c.fill();
    } else {
      c.fillStyle = '#fff8d0';
      c.beginPath();
      c.arc(0, 0, 6, 0, TAU);
      c.fill();
    }
    c.restore();
  }
  const hair = currentHair(w).map(pt => ({x: w.p.x + pt.x * w.p.face, y: w.p.y + pt.y}));
  const hairInFront = w.who === 'hope' && (w.pony.phase === 'coil' || w.pony.phase === 'unroll' || w.pony.phase === 'lasso' || w.swing);
  if (w.who === 'hope' && !hairInFront) drawHairChain(c, hair);
  c.save();
  c.translate(w.p.x, w.p.y);
  c.scale(w.p.face || 1, 1);
  if (w.who === 'duncan') {
    w.vis.duncan.ov = w.stats && (w.umb.folded || w.criminal.busted) && w.t - (w._actT || 0) < 0.4 ? {t: 'cuff'} : null;
    drawDuncan(c, w.vis.duncan);
  } else {
    const punchU = w.pony.phase === 'punch' ? 1 - w.punchT / 0.22 : w.pony.phase === 'unroll' ? w.pony.u : 0;
    drawHope(c, w.vis.hope, w.pony.phase, punchU);
  }
  c.restore();
  if (hairInFront) drawHairChain(c, hair);
  if (w.blast) {
    const a = w.blast.l / w.blast.l0;
    const rad = (1 - a) * 70 + 12;
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = 'rgba(255,244,190,' + a + ')';
    c.lineWidth = 4;
    c.beginPath();
    c.arc(w.blast.x, w.blast.y, rad, 0, TAU);
    c.stroke();
    c.beginPath();
    c.arc(w.blast.x, w.blast.y, rad * 0.62, 0, TAU);
    c.stroke();
    c.restore();
  }
  for (const f of w.fx) {
    c.globalAlpha = Math.max(0, Math.min(1, f.l / f.l0));
    label(c, f.x, f.y, f.txt, f.c);
    c.globalAlpha = 1;
  }
  c.restore();
}
