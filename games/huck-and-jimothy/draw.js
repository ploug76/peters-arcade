/* Cartoon renderer for Huck X & Jimothy. Side-view Brewstew shapes, drawn from logic poses. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HuckDraw = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const G = () => rootGame();
  function rootGame() {
    return (typeof HuckGame !== 'undefined') ? HuckGame : null;
  }

  const INK = '#1c140f';
  const SKIN = '#f4c7a4';
  const SKIN_D = '#e2a883';
  const HAIR = '#6b3e22';
  const HAIR_D = '#4a2916';
  const CAP = '#d62828';
  const CAP_D = '#a61f1f';
  const SHIRT = '#f0c230';
  const SHIRT_D = '#d4a41c';
  const SHORTS = '#3d6eae';
  const SHORTS_D = '#2c5488';
  const FRINGE = '#f6f3ec';
  const SHOE = '#f7f5f1';
  const SOLE = '#8e949b';
  const SOCK = '#fffcf7';
  const BAND = '#ecd7b0';
  const BAND_P = '#fff8ea';
  const PACK = '#8d5b34';
  const PACK_D = '#694224';
  const FUR = '#aeb6bf';
  const FUR_D = '#7e8791';
  const BELLY = '#e7eef3';
  const MASK = '#2b3036';
  const MUZZLE = '#f4f7f8';
  const NOSE = '#17191c';
  const EAR = '#e8a3b6';
  const RING = '#2a2f34';
  const GLASS = '#1b1e22';
  const LENS = '#3e4a5c';
  const WATCH = '#e6b325';
  const JEEP = '#e23636';
  const JEEP_D = '#b81f1f';

  let camX = 80;
  let camY = 40;
  let camInit = false;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function rr(ctx, x, y, w, h, r) {
    const rad = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function fillStroke(ctx, fill, lw) {
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = lw == null ? 2.4 : lw;
    ctx.stroke();
  }

  function capsule(ctx, x1, y1, x2, y2, r, fill) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = INK;
    ctx.lineWidth = r * 2 + 3.2;
    ctx.stroke();
    ctx.strokeStyle = fill;
    ctx.lineWidth = r * 2;
    ctx.stroke();
    ctx.restore();
  }

  function joint(ctx, x, y, r, fill) {
    ctx.beginPath();
    ctx.arc(x, y, r + 1.4, 0, Math.PI * 2);
    ctx.fillStyle = INK;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function shoe(ctx, foot, air) {
    ctx.save();
    ctx.translate(foot.x, foot.y);
    rr(ctx, -7, -8, 16, 8, 3);
    ctx.fillStyle = SHOE;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = SOLE;
    rr(ctx, -7, -2, 16, 3.2, 1.5);
    ctx.fill();
    ctx.stroke();
    if (!air) {
      ctx.fillStyle = SOCK;
      rr(ctx, -4, -12, 8, 5, 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  function hash(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function chooseScale(w, h) {
    if (h > w) return clamp(w / 360, 1, 1.85);
    return clamp(h / 360, 1, 2.2);
  }

  function modeFor(state, who) {
    const HG = rootGame();
    const b = who === 'huck' ? state.huck : state.jimothy;
    if (state.ride && who === 'huck') return 'sit';
    if (state.ride && who === 'jimothy') return 'ride';
    if (b.dig > 0) return 'dig';
    if (b.climbing) return 'climb';
    if (!b.onGround) return 'air';
    if (who === 'huck' && state.huckLoco === 'skate') return 'skate';
    if (who === 'huck' && state.huckLoco === 'bike' && state.upgrades.bike) return 'bike';
    return who === 'jimothy' && state.ride ? 'ride' : 'walk';
  }

  function makePose(state, who, mode) {
    const HG = rootGame();
    const b = who === 'huck' ? state.huck : state.jimothy;
    const spec = who === 'huck' ? HG.HUCK_SPEC : HG.JT_SPEC;
    return HG.poseFor({
      animDist: b.animDist,
      vx: b.vx,
      onGround: b.onGround || mode === 'skate' || mode === 'bike' || mode === 'sit',
      mode: mode,
      animT: b.animT,
      spec: spec
    });
  }

  function drawLeg(ctx, leg, skin, band) {
    capsule(ctx, leg.hip.x, leg.hip.y, leg.knee.x, leg.knee.y, 4.3, skin);
    capsule(ctx, leg.knee.x, leg.knee.y, leg.foot.x, leg.foot.y, 3.6, skin);
    joint(ctx, leg.knee.x, leg.knee.y, 3.8, skin);
    if (band) {
      ctx.save();
      ctx.translate(leg.knee.x, leg.knee.y);
      rr(ctx, -6, -4, 12, 8, 2);
      ctx.fillStyle = BAND;
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle = BAND_P;
      ctx.fillRect(-3, -2.5, 6, 5);
      ctx.restore();
    }
    shoe(ctx, leg.foot, leg.lift > 3);
  }

  function drawArm(ctx, arm, skin) {
    capsule(ctx, arm.shoulder.x + 2, arm.shoulder.y, arm.elbow.x, arm.elbow.y, 4.2, skin);
    capsule(ctx, arm.elbow.x, arm.elbow.y, arm.hand.x, arm.hand.y, 3.6, skin);
    joint(ctx, arm.elbow.x, arm.elbow.y, 3.8, skin);
    joint(ctx, arm.hand.x, arm.hand.y, 3.4, SKIN);
  }

  function mouth(ctx, x, y, expression) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = INK;
    ctx.fillStyle = '#6e2d32';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    if (expression === 'grin') {
      ctx.beginPath();
      ctx.ellipse(0, 2, 7, 5, 0, 0, Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.fillRect(-5, 1, 10, 3);
    } else if (expression === 'shock' || expression === 'scared') {
      ctx.beginPath();
      ctx.ellipse(0, 3, 4, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (expression === 'sneak') {
      ctx.beginPath();
      ctx.moveTo(-5, 2);
      ctx.quadraticCurveTo(2, -2, 7, 3);
      ctx.stroke();
    } else if (expression === 'strain') {
      ctx.beginPath();
      ctx.moveTo(-6, 3);
      ctx.lineTo(6, 3);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-5, 1);
      ctx.quadraticCurveTo(1, 7, 7, 1);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCap(ctx, head) {
    ctx.save();
    ctx.fillStyle = HAIR_D;
    ctx.beginPath();
    ctx.moveTo(head.x - 12, head.y - 2);
    ctx.lineTo(head.x - 18, head.y - 10);
    ctx.lineTo(head.x - 8, head.y - 8);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = HAIR;
    ctx.beginPath();
    ctx.ellipse(head.x - 8, head.y + 2, 8, 10, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(head.x + 2, head.y - 6, 15, 12, -0.15, 0, Math.PI * 2);
    ctx.fillStyle = CAP;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.fillStyle = CAP_D;
    ctx.beginPath();
    ctx.ellipse(head.x + 2, head.y - 2, 14, 5, -0.1, 0, Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(head.x + 16, head.y - 1, 11, 3.4, -0.15, 0, Math.PI * 2);
    ctx.fillStyle = CAP;
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(head.x + 6, head.y - 12);
    ctx.lineTo(head.x + 12, head.y - 6);
    ctx.moveTo(head.x + 12, head.y - 12);
    ctx.lineTo(head.x + 6, head.y - 6);
    ctx.stroke();
    ctx.restore();
  }

  function drawHuckFace(ctx, head, expression) {
    ctx.beginPath();
    ctx.ellipse(head.x - 10, head.y + 2, 4, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = SKIN;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(head.x + 1, head.y + 1, 13, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = SKIN;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = SKIN_D;
    ctx.beginPath();
    ctx.ellipse(head.x + 8, head.y + 4, 3, 2, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c4845a';
    [[4, 6], [7, 8], [5, 9]].forEach(function (p) {
      ctx.beginPath();
      ctx.arc(head.x + p[0], head.y + p[1], 0.9, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(head.x + 6, head.y - 1, 4.2, 4.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(head.x + 7.2, head.y - 0.6, 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(head.x + 6.6, head.y - 1.2, 0.6, 0, Math.PI * 2);
    ctx.fill();
    if (expression === 'sneak') {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(head.x + 2, head.y - 6);
      ctx.lineTo(head.x + 10, head.y - 7);
      ctx.stroke();
    }
    mouth(ctx, head.x + 7, head.y + 6, expression);
    drawCap(ctx, head);
  }

  function drawBoard(ctx, pose, spin) {
    ctx.save();
    const y = -7;
    ctx.translate(2, y);
    ctx.rotate(-0.04);
    rr(ctx, -16, -3, 34, 5, 2);
    ctx.fillStyle = '#efc14a';
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#d62828';
    ctx.fillRect(-4, -2, 8, 3);
    [-9, 10].forEach(function (wx) {
      ctx.save();
      ctx.translate(wx, 4);
      ctx.rotate(spin);
      ctx.beginPath();
      ctx.arc(0, 0, 3.3, 0, Math.PI * 2);
      ctx.fillStyle = '#f4f4f4';
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.lineTo(3, 0);
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
  }

  function drawBike(ctx, pose, spin) {
    ctx.save();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = INK;
    ctx.fillStyle = '#2f6f4e';
    function wheel(x, y) {
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#222';
      ctx.fill();
      ctx.stroke();
      ctx.rotate(spin);
      ctx.strokeStyle = '#ddd';
      ctx.beginPath();
      ctx.moveTo(-6, 0); ctx.lineTo(6, 0);
      ctx.moveTo(0, -6); ctx.lineTo(0, 6);
      ctx.stroke();
      ctx.restore();
    }
    wheel(-12, -8);
    wheel(14, -8);
    ctx.beginPath();
    ctx.moveTo(-12, -8);
    ctx.lineTo(0, -20);
    ctx.lineTo(14, -8);
    ctx.moveTo(0, -20);
    ctx.lineTo(2, -8);
    ctx.stroke();
    ctx.fillStyle = '#2f6f4e';
    rr(ctx, -6, -24, 12, 4, 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawBackpack(ctx, pose) {
    const y = pose.shoulder.y;
    ctx.save();
    rr(ctx, -28, y - 2, 18, 30, 5);
    ctx.fillStyle = PACK;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.fillStyle = PACK_D;
    rr(ctx, -24, y + 10, 10, 10, 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#5b3a22';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-12, y);
    ctx.lineTo(-4, y - 8);
    ctx.stroke();
    // Jimothy's head over the pack
    const hx = -18;
    const hy = y - 14;
    ctx.beginPath();
    ctx.ellipse(hx, hy, 10, 9, 0, 0, Math.PI * 2);
    ctx.fillStyle = FUR;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.fillStyle = FUR;
    ctx.beginPath();
    ctx.moveTo(hx - 8, hy - 4);
    ctx.lineTo(hx - 12, hy - 16);
    ctx.lineTo(hx - 2, hy - 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(hx - 1, hy - 6);
    ctx.lineTo(hx + 2, hy - 17);
    ctx.lineTo(hx + 7, hy - 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = MASK;
    ctx.beginPath();
    ctx.ellipse(hx + 2, hy, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(hx + 3, hy - 1, 2.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(hx + 4, hy - 1, 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = MUZZLE;
    ctx.beginPath();
    ctx.ellipse(hx + 8, hy + 3, 4, 3, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = NOSE;
    ctx.beginPath();
    ctx.arc(hx + 11, hy + 2, 1.4, 0, Math.PI * 2);
    ctx.fill();
    drawSunglasses(ctx, hx + 1, hy - 12);
    // striped tail curling out
    [[-30, y + 22, 5, FUR], [-36, y + 16, 4.5, RING], [-38, y + 8, 4, FUR], [-34, y + 2, 3.4, RING]].forEach(function (p) {
      ctx.beginPath();
      ctx.arc(p[0], p[1], p[2], 0, Math.PI * 2);
      ctx.fillStyle = p[3];
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawHuck(ctx, x, y, facing, pose, opts) {
    opts = opts || {};
    const expression = opts.expression || 'smile';
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing || 1, 1);
    if (opts.scale) ctx.scale(opts.scale, opts.scale);
    if (opts.pitch) ctx.rotate(opts.pitch);
    ctx.fillStyle = 'rgba(80, 40, 10, 0.18)';
    ctx.beginPath();
    ctx.ellipse(2, 2, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    if (opts.loco === 'skate') drawBoard(ctx, pose, opts.spin || 0);
    if (opts.loco === 'bike') drawBike(ctx, pose, opts.spin || 0);
    if (opts.backpack) drawBackpack(ctx, pose);
    drawArm(ctx, pose.arms[0], SKIN);
    drawLeg(ctx, pose.legs[0], SKIN, false);
    const sh = pose.shoulder.y;
    const hp = pose.hip.y;
    rr(ctx, -12, sh + 2, 26, (hp + 8) - (sh + 2), 7);
    ctx.fillStyle = SHIRT;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.fillStyle = SHIRT_D;
    ctx.fillRect(-4, sh + 8, 8, 6);
    rr(ctx, -13, hp - 2, 24, 16, 4);
    ctx.fillStyle = SHORTS;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.fillStyle = SHORTS_D;
    ctx.fillRect(-12, hp + 6, 22, 4);
    ctx.strokeStyle = FRINGE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = -12; i <= 10; i += 4) {
      ctx.moveTo(i, hp + 12);
      ctx.lineTo(i + 2, hp + 16);
      ctx.lineTo(i + 4, hp + 12);
    }
    ctx.stroke();
    if (opts.stereo) {
      rr(ctx, 8, sh + 6, 10, 8, 2);
      ctx.fillStyle = '#3a3a3a';
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.fillStyle = '#7dcea0';
      ctx.fillRect(10, sh + 8, 6, 2);
    }
    drawHuckFace(ctx, pose.head, expression);
    drawLeg(ctx, pose.legs[1], SKIN, true);
    drawArm(ctx, pose.arms[1], SKIN);
    ctx.restore();
  }

  function drawTail(ctx, wag) {
    const pts = [
      [-10, -12, 6.5, FUR],
      [-18, -10 + wag * 0.15, 6, RING],
      [-26, -16 + wag * 0.35, 5.5, FUR],
      [-30, -26 + wag * 0.7, 5, RING],
      [-24, -34 + wag, 4.4, FUR]
    ];
    pts.forEach(function (p) {
      ctx.beginPath();
      ctx.arc(p[0], p[1], p[2], 0, Math.PI * 2);
      ctx.fillStyle = p[3];
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.8;
      ctx.stroke();
    });
  }

  function drawJtLeg(ctx, leg) {
    capsule(ctx, leg.hip.x, leg.hip.y, leg.knee.x, leg.knee.y, 3.4, FUR);
    capsule(ctx, leg.knee.x, leg.knee.y, leg.foot.x, leg.foot.y, 2.8, FUR_D);
    joint(ctx, leg.knee.x, leg.knee.y, 3, FUR);
    ctx.save();
    ctx.translate(leg.foot.x, leg.foot.y);
    ctx.beginPath();
    ctx.ellipse(2, 0, 5, 2.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#2d3238';
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  }

  function drawJtArm(ctx, arm) {
    capsule(ctx, arm.shoulder.x, arm.shoulder.y, arm.elbow.x, arm.elbow.y, 2.8, FUR);
    capsule(ctx, arm.elbow.x, arm.elbow.y, arm.hand.x, arm.hand.y, 2.3, FUR);
    joint(ctx, arm.hand.x, arm.hand.y, 2.4, FUR_D);
  }

  function drawSunglasses(ctx, x, y) {
    ctx.strokeStyle = GLASS;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x - 8, y);
    ctx.lineTo(x + 8, y);
    ctx.stroke();
    ctx.fillStyle = GLASS;
    rr(ctx, x - 8, y - 3, 7, 5, 1.5);
    ctx.fill();
    rr(ctx, x + 1, y - 3, 7, 5, 1.5);
    ctx.fill();
    ctx.fillStyle = LENS;
    ctx.fillRect(x - 6, y - 1.5, 3, 2);
  }

  function drawJimothy(ctx, x, y, facing, pose, opts) {
    opts = opts || {};
    const expression = opts.expression || 'smile';
    ctx.save();
    ctx.translate(x, y);
    ctx.scale((facing || 1) * (opts.scale || 1), opts.scale || 1);
    if (opts.pitch) ctx.rotate(opts.pitch);
    ctx.fillStyle = 'rgba(60, 40, 20, 0.18)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 12, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    const wag = Math.sin((pose && pose.phase ? pose.phase : 0) * Math.PI * 2) * 4;
    drawTail(ctx, opts.wag != null ? opts.wag : wag);
    drawJtArm(ctx, pose.arms[0]);
    drawJtLeg(ctx, pose.legs[0]);
    const hip = pose.hip.y;
    const head = pose.head;
    ctx.beginPath();
    ctx.ellipse(0, hip + 6, 12, 11, 0, 0, Math.PI * 2);
    ctx.fillStyle = FUR;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.3;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(4, hip + 8, 7, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = BELLY;
    ctx.fill();
    ctx.stroke();
    // head
    ctx.beginPath();
    ctx.ellipse(head.x - 2, head.y, 11, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = FUR;
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(head.x - 10, head.y - 4);
    ctx.lineTo(head.x - 14, head.y - 16);
    ctx.lineTo(head.x - 4, head.y - 6);
    ctx.closePath();
    ctx.fillStyle = FUR;
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(head.x - 8, head.y - 14);
    ctx.lineTo(head.x - 11, head.y - 8);
    ctx.lineTo(head.x - 5, head.y - 8);
    ctx.fillStyle = EAR;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(head.x - 2, head.y - 6);
    ctx.lineTo(head.x + 2, head.y - 18);
    ctx.lineTo(head.x + 6, head.y - 4);
    ctx.closePath();
    ctx.fillStyle = FUR;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = MASK;
    ctx.beginPath();
    ctx.ellipse(head.x + 2, head.y - 1, 9, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(head.x + 8, head.y + 3, 6, 4.5, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = MUZZLE;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(head.x + 12, head.y + 2, 1.7, 0, Math.PI * 2);
    ctx.fillStyle = NOSE;
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(head.x + 5, head.y - 1, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(head.x + 6, head.y - 1, 1.3, 0, Math.PI * 2);
    ctx.fill();
    if (expression === 'strain' || expression === 'scared') {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(head.x + 2, head.y - 5);
      ctx.lineTo(head.x + 8, head.y - 4);
      ctx.stroke();
    }
    mouth(ctx, head.x + 9, head.y + 5, expression === 'smile' ? 'smile' : expression);
    drawSunglasses(ctx, head.x + 2, head.y - 12);
    drawJtLeg(ctx, pose.legs[1]);
    drawJtArm(ctx, pose.arms[1]);
    if (opts.watch !== false && expression !== 'strain') {
      const hand = pose.arms[1].hand;
      ctx.beginPath();
      ctx.arc(hand.x + 1, hand.y + 1, 3.4, 0, Math.PI * 2);
      ctx.fillStyle = WATCH;
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.fillStyle = '#fff6d0';
      ctx.beginPath();
      ctx.arc(hand.x + 1, hand.y + 1, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    if (expression === 'strain') {
      ctx.fillStyle = '#8fd0ea';
      ctx.beginPath();
      ctx.ellipse(head.x + 14, head.y + 8, 2, 3, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawRide(ctx, x, y, facing, state) {
    const jtPose = makePose(state, 'jimothy', 'ride');
    drawJimothy(ctx, x, y, facing, jtPose, {
      expression: 'strain',
      scale: 1.45,
      watch: false,
      wag: Math.sin(state.time * 10) * 5
    });
    const sit = makePose(state, 'huck', 'sit');
    drawHuck(ctx, x + facing * 2, y - 46, facing, sit, {
      expression: 'grin',
      scale: 0.78,
      backpack: false
    });
  }

  function drawJoshua(ctx, x, ground, s, variant) {
    ctx.save();
    ctx.translate(x, ground);
    ctx.scale(s, s);
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.fillStyle = '#6d4528';
    ctx.beginPath();
    ctx.moveTo(-7, 0);
    ctx.quadraticCurveTo(-6, -40, -2, -70);
    ctx.quadraticCurveTo(0, -40, 8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    function arm(x1, y1, x2, y2, puff) {
      ctx.strokeStyle = '#6d4528';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.strokeStyle = '#6d4528';
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.fillStyle = variant ? '#6e8b45' : '#5d7a3e';
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i - 2) * 0.45;
        ctx.beginPath();
        ctx.ellipse(x2 + Math.cos(a) * 4, y2 + Math.sin(a) * 8, 3.5, 12, a, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
    }
    arm(-2, -48, -28, -78);
    arm(0, -62, 26, -96);
    arm(-1, -78, -8, -112);
    arm(1, -78, 14, -108);
    ctx.restore();
  }

  function drawBoulder(ctx, x, ground, r) {
    ctx.save();
    ctx.translate(x, ground);
    ctx.beginPath();
    ctx.moveTo(-r, 0);
    ctx.quadraticCurveTo(-r * 0.9, -r * 1.3, -r * 0.2, -r * 1.55);
    ctx.quadraticCurveTo(r * 0.5, -r * 1.7, r * 0.95, -r * 0.8);
    ctx.quadraticCurveTo(r * 1.05, -r * 0.2, r * 0.8, 0);
    ctx.closePath();
    ctx.fillStyle = '#c17d49';
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(90,40,20,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.2, -r * 0.4);
    ctx.quadraticCurveTo(r * 0.1, -r * 0.9, r * 0.4, -r * 0.5);
    ctx.moveTo(-r * 0.4, -r * 0.8);
    ctx.quadraticCurveTo(-r * 0.1, -r * 1.1, r * 0.1, -r * 1.2);
    ctx.stroke();
    ctx.fillStyle = '#a8683a';
    ctx.beginPath();
    ctx.ellipse(r * 0.1, -r * 0.2, r * 0.5, r * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawCactus(ctx, x, ground, h) {
    ctx.save();
    ctx.translate(x, ground);
    ctx.fillStyle = '#6f8f45';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;
    rr(ctx, -7, -h, 14, h, 6);
    ctx.fill();
    ctx.stroke();
    rr(ctx, -22, -h * 0.72, 16, 8, 4);
    ctx.fill();
    ctx.stroke();
    rr(ctx, -22, -h * 0.72 - 18, 8, 22, 4);
    ctx.fill();
    ctx.stroke();
    rr(ctx, 6, -h * 0.5, 16, 8, 4);
    ctx.fill();
    ctx.stroke();
    rr(ctx, 14, -h * 0.5 - 16, 8, 20, 4);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawCan(ctx, x, y, taken) {
    if (taken) return;
    ctx.save();
    ctx.translate(x, y);
    rr(ctx, -5, -12, 10, 14, 2);
    ctx.fillStyle = '#d5dde3';
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(-5, -8, 10, 3);
    ctx.fillStyle = '#2980b9';
    ctx.fillRect(-5, -4, 10, 2);
    ctx.restore();
  }

  function drawTrash(ctx, x, ground, dug) {
    ctx.save();
    ctx.translate(x, ground);
    ctx.fillStyle = '#8d98a3';
    rr(ctx, -16, -32, 32, 32, 3);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.fillStyle = '#6c7680';
    ctx.fillRect(-16, -26, 32, 4);
    ctx.fillRect(-16, -16, 32, 3);
    if (!dug) {
      ctx.fillStyle = '#9aa4ae';
      ctx.beginPath();
      ctx.ellipse(0, -32, 14, 4, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = '#c9a06a';
      ctx.beginPath();
      ctx.ellipse(6, -30, 8, 3, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFence(ctx, x, ground, w, ceil, open) {
    ctx.save();
    ctx.translate(x, ground);
    const top = ceil - ground;
    ctx.fillStyle = open ? '#8d6a3a' : '#6d5536';
    if (!open) {
      ctx.fillStyle = '#d8c39a';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.rect(0, top, w, -top - 150);
      // hole
      ctx.rect(6, -8, w - 12, top + 8);
      ctx.fill('evenodd');
      ctx.stroke();
      ctx.strokeStyle = '#7d6740';
      ctx.lineWidth = 1.5;
      for (let i = 10; i < w - 4; i += 8) {
        ctx.beginPath();
        ctx.moveTo(i, top);
        ctx.lineTo(i, -150);
        ctx.stroke();
      }
      ctx.fillStyle = INK;
      ctx.font = '700 12px Trebuchet MS, sans-serif';
      ctx.fillText('J.T. HOLE', 14, top - 8);
    } else {
      ctx.fillStyle = '#8d6a3a';
      ctx.fillRect(-4, -70, 8, 70);
      ctx.fillRect(w - 4, -70, 8, 70);
      ctx.strokeStyle = INK;
      ctx.strokeRect(-4, -70, 8, 70);
      ctx.strokeRect(w - 4, -70, 8, 70);
    }
    ctx.restore();
  }

  function drawSign(ctx, x, ground, text) {
    ctx.save();
    ctx.translate(x, ground);
    ctx.fillStyle = '#8a5a32';
    ctx.fillRect(-3, -46, 6, 46);
    ctx.fillStyle = '#f3e2b8';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    const width = Math.max(54, text.length * 7);
    rr(ctx, -width / 2, -78, width, 28, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.font = '700 11px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, 0, -60);
    ctx.restore();
  }

  function drawShed(ctx, x, ground) {
    ctx.save();
    ctx.translate(x, ground);
    ctx.fillStyle = '#b co 6a3a'.replace(' ', '');
    ctx.fillStyle = '#b56a3a';
    rr(ctx, -40, -70, 80, 70, 3);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = '#8d3d2a';
    ctx.beginPath();
    ctx.moveTo(-48, -68);
    ctx.lineTo(0, -100);
    ctx.lineTo(48, -68);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#6e8eb5';
    rr(ctx, -8, -48, 22, 18, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#5a3a22';
    rr(ctx, 16, -40, 16, 40, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f3e2b8';
    rr(ctx, -28, -88, 36, 16, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.font = '700 11px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SHOP', -10, -76);
    ctx.restore();
  }

  function drawJeep(ctx, x, y, scale, spin, honk) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(60,30,10,0.2)';
    ctx.beginPath();
    ctx.ellipse(10, 8, 48, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // solar pole
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-18, -20);
    ctx.lineTo(-18, -48);
    ctx.stroke();
    rr(ctx, -34, -56, 32, 10, 2);
    ctx.fillStyle = '#2f6fd0';
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#8fd0ff';
    ctx.fillRect(-30, -54, 10, 6);
    // spare
    ctx.beginPath();
    ctx.arc(-40, -8, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#222';
    ctx.fill();
    ctx.stroke();
    // body
    rr(ctx, -36, -28, 78, 30, 6);
    ctx.fillStyle = JEEP;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.fillStyle = JEEP_D;
    ctx.fillRect(-36, -8, 78, 8);
    // cab
    ctx.beginPath();
    ctx.moveTo(-8, -28);
    ctx.lineTo(-2, -46);
    ctx.lineTo(28, -46);
    ctx.lineTo(34, -28);
    ctx.closePath();
    ctx.fillStyle = '#9fd0ea';
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = JEEP;
    ctx.fillRect(-10, -30, 8, 8);
    // hitch
    ctx.fillStyle = '#444';
    ctx.fillRect(40, -6, 10, 4);
    function wheel(wx) {
      ctx.save();
      ctx.translate(wx, 2);
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fillStyle = '#222';
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.rotate(spin);
      ctx.strokeStyle = '#ccc';
      ctx.beginPath();
      ctx.moveTo(-8, 0); ctx.lineTo(8, 0);
      ctx.moveTo(0, -8); ctx.lineTo(0, 8);
      ctx.stroke();
      ctx.restore();
    }
    wheel(-16);
    wheel(24);
    // driver is drawn by caller in the cab window area if needed
    if (honk) {
      ctx.fillStyle = '#fff';
      rr(ctx, 30, -70, 54, 22, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.font = '700 12px Trebuchet MS, sans-serif';
      ctx.fillText('HONK', 38, -55);
    }
    ctx.restore();
  }

  function drawSky(ctx, w, h, cam, scale) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#f6c85a');
    g.addColorStop(0.45, '#f0a24a');
    g.addColorStop(1, '#e07d3a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const sunX = w * 0.78 - cam * 0.02;
    const sunY = h * 0.16;
    ctx.beginPath();
    ctx.arc(sunX, sunY, Math.min(w, h) * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = '#ffe28a';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();
    // mesas
    ctx.fillStyle = '#e09a62';
    const base = h * 0.42;
    for (let i = 0; i < 6; i++) {
      const mx = ((i * 280 - cam * 0.15) % (w + 400)) - 80;
      ctx.beginPath();
      ctx.moveTo(mx, base);
      ctx.lineTo(mx + 40, base - 70 - (i % 3) * 18);
      ctx.lineTo(mx + 120, base - 90 - (i % 2) * 20);
      ctx.lineTo(mx + 180, base - 40);
      ctx.lineTo(mx + 220, base);
      ctx.fill();
    }
    ctx.fillStyle = '#c9845a';
    for (let i = 0; i < 5; i++) {
      const mx = ((i * 340 - cam * 0.28) % (w + 360)) - 40;
      ctx.beginPath();
      ctx.moveTo(mx, base + 20);
      ctx.lineTo(mx + 30, base - 36);
      ctx.lineTo(mx + 90, base - 50);
      ctx.lineTo(mx + 130, base + 20);
      ctx.fill();
    }
  }

  function drawGround(ctx, HG, cam, scale, w, h, state) {
    const ground = HG.GROUND;
    ctx.fillStyle = '#d4894a';
    ctx.fillRect(cam.x - 100, ground, HG.LEVEL.worldW + 200, 800);
    ctx.fillStyle = '#c4783f';
    ctx.fillRect(cam.x - 100, ground, HG.LEVEL.worldW + 200, 18);
    // pebbles
    const x0 = Math.floor(cam.x / 20) * 20;
    const x1 = cam.x + w / scale + 40;
    for (let x = x0; x < x1; x += 18) {
      const n = hash(x);
      ctx.fillStyle = n > 0.5 ? '#b86b38' : '#e0a06a';
      ctx.beginPath();
      ctx.ellipse(x, ground + 10 + n * 16, 2 + n * 3, 1.4 + n, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // sand patch
    const sand = HG.LEVEL.sand;
    ctx.fillStyle = '#e6c27a';
    ctx.beginPath();
    ctx.moveTo(sand.x, ground);
    for (let x = sand.x; x <= sand.x + sand.w; x += 16) {
      ctx.lineTo(x, ground - 6 - Math.sin(x * 0.08) * 4);
    }
    ctx.lineTo(sand.x + sand.w, ground + 30);
    ctx.lineTo(sand.x, ground + 30);
    ctx.fill();
    ctx.fillStyle = 'rgba(120,70,30,0.15)';
    ctx.font = '700 18px Trebuchet MS, sans-serif';
    ctx.fillText('soft sand', sand.x + sand.w * 0.35, ground - 16);
    // pit gap shading
    ctx.fillStyle = '#8a4b28';
    ctx.fillRect(1200, ground, 100, 220);
    ctx.fillStyle = '#5c3018';
    ctx.fillRect(1200, ground, 100, 16);
  }

  function drawDecor(ctx, HG, state) {
    const ground = HG.GROUND;
    drawBoulder(ctx, 780, ground, 78);
    [220, 1100, 1500, 2100, 2500, 3600, 4000, 5480, 5750].forEach(function (x, i) {
      drawJoshua(ctx, x, ground, 1 + (i % 3) * 0.08, i % 2 === 0);
    });
    [180, 420, 690, 980, 1400, 1760, 2340, 2700, 3400, 3800, 5200, 6100].forEach(function (x, i) {
      if (i % 2 === 0) drawCactus(ctx, x, ground, 34 + (i % 3) * 10);
      else {
        ctx.fillStyle = '#6d8a48';
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(x, ground - 8, 14, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    });
    drawSign(ctx, 240, ground, 'CACTUS FLATS');
    drawSign(ctx, 2760, ground, 'FENCE HOLE');
    drawSign(ctx, HG.LEVEL.sand.x - 80, ground, 'SOFT SAND');
    drawSign(ctx, 5600, ground, 'DUSTY JUNCTION');
    HG.LEVEL.trash.forEach(function (t) {
      drawTrash(ctx, t.x, ground, !!state.items[t.item]);
    });
    const sq = HG.LEVEL.squeeze;
    drawFence(ctx, sq.x, ground, sq.w, sq.ceil, !!state.items.lever);
    if (!state.items.crank) {
      ctx.fillStyle = '#c0c6cc';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.6;
      rr(ctx, HG.LEVEL.crank.x - 8, ground - 10, 16, 8, 2);
      ctx.fill();
      ctx.stroke();
    }
    if (!state.items.lever) {
      ctx.save();
      ctx.translate(HG.LEVEL.lever.x, ground);
      ctx.fillStyle = '#8a5a32';
      ctx.fillRect(-3, -28, 6, 28);
      ctx.strokeStyle = INK;
      ctx.strokeRect(-3, -28, 6, 28);
      ctx.fillStyle = '#d62828';
      ctx.fillRect(-12, -32, 18, 6);
      ctx.strokeRect(-12, -32, 18, 6);
      ctx.restore();
    }
    drawShed(ctx, HG.LEVEL.shop.x, ground);
    if (state.mode !== 'tow') {
      drawJeep(ctx, HG.LEVEL.jeep.x, ground - 8, 0.85, state.time * 2, false);
    }
    state.canList.forEach(function (c) { drawCan(ctx, c.x, c.y, c.taken); });
    // platforms as rocks
    HG.LEVEL.platforms.forEach(function (p) {
      ctx.fillStyle = '#b pen'.replace(' ', '');
      ctx.fillStyle = '#c4845a';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.4;
      rr(ctx, p.x, p.y, p.w, 18, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#a86b40';
      ctx.fillRect(p.x + 8, p.y + 6, p.w * 0.4, 4);
    });
  }

  function activeBody(state) {
    if (state.mode === 'tow') return state.huck;
    if (state.ride) return state.jimothy;
    if (state.who === 'jimothy') return state.jimothy;
    return state.huck;
  }

  function drawActors(ctx, state) {
    const facingH = state.huck.facing || 1;
    const facingJ = state.jimothy.facing || 1;
    if (state.ride) {
      drawRide(ctx, state.jimothy.x, state.jimothy.y, facingJ, state);
      return;
    }
    if (state.who === 'huck' && state.jimothyParked) {
      const pose = makePose(state, 'huck', modeFor(state, 'huck'));
      const expression = !state.huck.onGround ? 'grin' : (state.huckLoco === 'skate' ? 'grin' : 'smile');
      drawHuck(ctx, state.huck.x, state.huck.y, facingH, pose, {
        expression: expression,
        backpack: true,
        loco: state.huckLoco,
        spin: state.huck.animDist / 8,
        stereo: !!state.upgrades.stereo,
        scale: 1.2
      });
      if (Math.abs(state.huck.vx) > 20 && state.huck.onGround) dustPuff(ctx, state.huck.x, state.huck.y, state.huck.animDist);
      return;
    }
    // both out
    const hp = makePose(state, 'huck', modeFor(state, 'huck'));
    const jp = makePose(state, 'jimothy', modeFor(state, 'jimothy'));
    const digPitch = state.jimothy.dig > 0 ? -0.5 : 0;
    drawHuck(ctx, state.huck.x, state.huck.y, facingH, hp, {
      expression: 'smile',
      backpack: false,
      loco: state.who === 'huck' ? state.huckLoco : 'walk',
      spin: state.huck.animDist / 8,
      stereo: !!state.upgrades.stereo,
      scale: 1.2
    });
    drawJimothy(ctx, state.jimothy.x, state.jimothy.y, facingJ, jp, {
      expression: state.jimothy.dig > 0 ? 'sneak' : 'smile',
      pitch: digPitch,
      scale: 1.25
    });
  }

  function dustPuff(ctx, x, y, dist) {
    for (let i = 0; i < 3; i++) {
      const t = ((dist / 8 + i * 6) % 16);
      ctx.globalAlpha = 0.35 * (1 - t / 16);
      ctx.fillStyle = '#efd0a4';
      ctx.beginPath();
      ctx.ellipse(x - t * 1.6, y - 2 - i, 3 + t * 0.15, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawTitle(ctx, w, h, state) {
    drawSky(ctx, w, h, 40 + Math.sin(state.time) * 4, 1);
    const ground = h * 0.72;
    ctx.fillStyle = '#d4894a';
    ctx.fillRect(0, ground, w, h - ground);
    ctx.fillStyle = '#c4783f';
    ctx.fillRect(0, ground, w, 16);
    drawBoulder(ctx, w * 0.78, ground, Math.min(90, w * 0.12));
    drawJoshua(ctx, w * 0.18, ground, Math.min(1.4, w / 500), 0);
    drawCactus(ctx, w * 0.9, ground, 50);
    const HG = rootGame();
    const pose = HG.poseFor({
      animDist: state.time * 40,
      vx: 40,
      onGround: true,
      mode: 'walk',
      animT: state.time,
      spec: HG.HUCK_SPEC
    });
    const scale = clamp(Math.min(w, h) / 420, 0.8, 1.8);
    ctx.save();
    ctx.translate(w * 0.48, ground);
    ctx.scale(scale, scale);
    drawHuck(ctx, 0, 0, 1, pose, { expression: 'grin', backpack: true, loco: 'walk' });
    ctx.restore();
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.font = '800 ' + Math.round(clamp(w * 0.09, 40, 84)) + 'px Georgia, Times New Roman, serif';
    ctx.fillText('HUCK X', w / 2, h * 0.16);
    ctx.font = '700 ' + Math.round(clamp(w * 0.035, 16, 28)) + 'px Trebuchet MS, sans-serif';
    ctx.fillText('and Jimothy Timothy', w / 2, h * 0.16 + clamp(w * 0.05, 28, 44));
    ctx.font = '700 ' + Math.round(clamp(w * 0.028, 14, 22)) + 'px Trebuchet MS, sans-serif';
    ctx.fillStyle = '#6a3018';
    ctx.fillText('Chapter 1  ·  Side A', w / 2, h * 0.16 + clamp(w * 0.09, 48, 78));
    ctx.font = '600 ' + Math.round(clamp(w * 0.025, 12, 16)) + 'px Trebuchet MS, sans-serif';
    ctx.fillStyle = '#3a2418';
    const line = "J.T.: It's not stealing if it's in the trash.";
    ctx.fillText(line, w / 2, h * 0.16 + clamp(w * 0.12, 72, 108));
  }

  function laneY(lane, h, pad) {
    const top = h * 0.40;
    const bot = h * 0.78 - pad * 0.2;
    return top + ((lane + 1) / 2) * (bot - top);
  }

  function drawTowObstacle(ctx, kind, x, y, sc) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sc, sc);
    if (kind === 'cactus') drawCactus(ctx, 0, 0, 46);
    else if (kind === 'weed') {
      ctx.strokeStyle = '#8a5a32';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -8, 14, 0, Math.PI * 1.4);
      ctx.stroke();
      ctx.strokeStyle = '#6d8a48';
      ctx.beginPath();
      ctx.arc(-6, -10, 10, 0, Math.PI * 1.2);
      ctx.stroke();
    } else {
      drawBoulder(ctx, 0, 0, 26);
    }
    ctx.restore();
  }

  function drawTow(ctx, w, h, state, pad) {
    const HG = rootGame();
    const tow = state.tow;
    drawSky(ctx, w, h, tow.dist, 1);
    const roadTop = h * 0.42;
    const roadBot = Math.min(h * 0.86, h - pad - 8);
    const grd = ctx.createLinearGradient(0, roadTop, 0, roadBot);
    grd.addColorStop(0, '#c98455');
    grd.addColorStop(1, '#a85e32');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(w * 0.05, roadBot);
    ctx.lineTo(w * 0.28, roadTop);
    ctx.lineTo(w * 0.72, roadTop);
    ctx.lineTo(w * 0.98, roadBot);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,236,200,0.7)';
    ctx.lineWidth = 3;
    ctx.setLineDash([16, 14]);
    ctx.beginPath();
    const mid = (roadTop + roadBot) / 2;
    ctx.moveTo(w * 0.08, mid + 20);
    ctx.lineTo(w * 0.92, mid + 20);
    ctx.stroke();
    ctx.setLineDash([]);
    const scroll = clamp(w / 9, 50, 110);
    const jeepX = w * 0.40;
    const boardX = jeepX - clamp(w * 0.16, 90, 160);
    const spin = tow.dist / 16;
    const things = [];
    tow.obstacles.forEach(function (ob) {
      const sx = jeepX + (ob.d - tow.dist) * (scroll / 80);
      if (sx < -80 || sx > w + 80) return;
      things.push({ lane: ob.lane, draw: function () {
        drawTowObstacle(ctx, ob.kind, sx, laneY(ob.lane, h, pad), 0.7 + (ob.lane + 1) * 0.15);
      } });
    });
    tow.cans.forEach(function (c) {
      if (c.taken) return;
      const sx = jeepX + (c.d - tow.dist) * (scroll / 80);
      if (sx < -40 || sx > w + 40) return;
      things.push({ lane: c.lane, draw: function () {
        drawCan(ctx, sx, laneY(c.lane, h, pad) - 16, false);
      } });
    });
    const jy = laneY(tow.jeepLane, h, pad);
    const by = laneY(tow.boardLane, h, pad);
    const jsc = 1.25 + (tow.jeepLane + 1) * 0.1;
    const bsc = 1.15 + (tow.boardLane + 1) * 0.08;
    things.push({ lane: Math.min(tow.jeepLane, tow.boardLane) - 0.01, draw: function () {
      ctx.strokeStyle = '#5a3a22';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(jeepX + 36 * jsc, jy - 6);
      ctx.quadraticCurveTo((jeepX + boardX) / 2, Math.max(jy, by) + 24, boardX + 10, by - 28);
      ctx.stroke();
    } });
    things.push({ lane: tow.jeepLane, draw: function () {
      ctx.save();
      if (tow.spin > 0) {
        ctx.translate(jeepX, jy);
        ctx.rotate(Math.sin(tow.time * 30) * 0.15);
        ctx.translate(-jeepX, -jy);
      }
      drawJeep(ctx, jeepX, jy, jsc, spin, tow.honk > 0);
      const pose = HG.poseFor({ animDist: tow.dist, vx: 10, onGround: true, mode: 'sit', animT: state.time, spec: HG.JT_SPEC });
      drawJimothy(ctx, jeepX - 2 * jsc, jy - 22 * jsc, 1, pose, { expression: 'smile', scale: 0.72 * jsc, watch: false });
      ctx.restore();
    } });
    things.push({ lane: tow.boardLane + 0.001, draw: function () {
      const pose = HG.poseFor({ animDist: tow.dist, vx: 80, onGround: true, mode: 'skate', animT: state.time, spec: HG.HUCK_SPEC });
      ctx.save();
      if (tow.spin > 0) {
        ctx.translate(boardX, by);
        ctx.rotate(Math.sin(tow.time * 28) * 0.2);
        ctx.translate(-boardX, -by);
      }
      drawHuck(ctx, boardX, by, 1, pose, { expression: tow.spin > 0 ? 'scared' : 'grin', loco: 'skate', spin: spin, scale: bsc });
      ctx.restore();
    } });
    const bannerD = tow.length - tow.dist;
    if (bannerD < 500) {
      const sx = jeepX + bannerD * (scroll / 80);
      things.push({ lane: 0.2, draw: function () {
        ctx.fillStyle = '#f3e2b8';
        ctx.strokeStyle = INK;
        ctx.lineWidth = 3;
        rr(ctx, sx - 40, laneY(0, h, pad) - 70, 110, 36, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = INK;
        ctx.font = '700 16px Trebuchet MS, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('RADIO', sx + 15, laneY(0, h, pad) - 48);
      } });
    }
    things.sort(function (a, b) { return a.lane - b.lane; });
    things.forEach(function (t) { t.draw(); });
    // progress
    ctx.fillStyle = 'rgba(40,20,10,0.35)';
    rr(ctx, w * 0.2, 8, w * 0.6, 10, 5);
    ctx.fill();
    ctx.fillStyle = '#f0c230';
    rr(ctx, w * 0.2, 8, w * 0.6 * clamp(tow.dist / tow.length, 0, 1), 10, 5);
    ctx.fill();
  }

  function render(ctx, w, h, state, view) {
    const HG = rootGame();
    const pad = (view && view.padBottom) || 0;
    ctx.clearRect(0, 0, w, h);
    if (!HG) return;
    if (state.mode === 'title') {
      camInit = false;
      drawTitle(ctx, w, h, state);
      return;
    }
    if (state.mode === 'tow' && state.tow) {
      drawTow(ctx, w, h, state, pad);
      return;
    }
    const scale = chooseScale(w, h);
    const focus = activeBody(state);
    const usableBottom = h - pad - 12;
    let targetX = focus.x - (w / scale) * 0.36;
    let targetY = focus.y - (usableBottom - 28) / scale;
    targetX = clamp(targetX, -30, Math.max(-30, HG.LEVEL.worldW - w / scale + 30));
    targetY = clamp(targetY, -120, HG.GROUND - 80);
    if (!camInit) {
      camX = targetX;
      camY = targetY;
      camInit = true;
    } else {
      camX += (targetX - camX) * 0.12;
      camY += (targetY - camY) * 0.12;
    }
    drawSky(ctx, w, h, camX, scale);
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(-camX, -camY);
    drawGround(ctx, HG, { x: camX, y: camY }, scale, w, h, state);
    drawDecor(ctx, HG, state);
    drawActors(ctx, state);
    ctx.restore();
    // offscreen partner
    if (!state.ride && !(state.who === 'huck' && state.jimothyParked)) {
      const other = state.who === 'huck' ? state.jimothy : state.huck;
      const label = state.who === 'huck' ? 'J.T.' : 'Huck';
      const sx = (other.x - camX) * scale;
      if (sx < 30 || sx > w - 30) {
        const x = clamp(sx, 46, w - 46);
        const y = clamp((other.y - camY) * scale, 80, h - pad - 40);
        ctx.fillStyle = '#fff6e4';
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2;
        rr(ctx, x - 28, y - 14, 56, 24, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = INK;
        ctx.font = '700 12px Trebuchet MS, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, y + 4);
      }
    }
  }

  return { render: render, chooseScale: chooseScale };
});
