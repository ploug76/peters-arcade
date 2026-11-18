/* Painted Duncan sprites — shared module.
   The original Constable Duncan game draws with this. The newer games
   (crossover, Harvest Watch, Hope's Angels) still use their own copy of
   the old vector Duncan; they can adopt this later by copying
   js/duncan-sprites.js and art/sprites/ (atlas.webp + atlas.json)
   without any other folder changes.

   DuncanSprites.preload(baseUrl?) -> Promise
   DuncanSprites.draw(ctx, gait, {t, vy, y, kb})
   DuncanSprites.drawPerson(ctx, gait, look)
   DuncanSprites.drawUmb(ctx, umb, scale)
   DuncanSprites.drawProp(ctx, name, t)
   DuncanSprites.drawCar / drawCat / drawTop / stamp / gradeWorld

   Coordinates match the old rig: feet on y=0, facing +x, y negative
   above the feet, standing height about 112 units. draw() and
   drawPerson() set gait._hand to [x, y] in that space and gait._clip
   to the animation that was shown, so hoses and water still attach.
   Looping clips (walk, run) are locked to the gait phase, so the
   pictures stay tied to how far he actually moved.
*/
(function (root) {
  'use strict';
  const TAU = Math.PI * 2;
  const DS = { ok: false, img: null, data: null, clips: {} };
  const stampCache = {};

  function loadImage(src) {
    return new Promise(function (res, rej) {
      const im = new Image();
      im.onload = function () { res(im); };
      im.onerror = function () { rej(new Error(src)); };
      im.src = src;
    });
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function nowT(vis) {
    if (vis && vis.t != null) return vis.t;
    return (typeof G !== 'undefined' && G.t) || 0;
  }

  DS.preload = function (base) {
    base = base || 'art/sprites/';
    return fetch(base + 'atlas.json').then(function (r) { return r.json(); }).then(function (data) {
      return loadImage(base + data.image).then(function (img) {
        DS.data = data;
        DS.img = img;
        DS.clips = {};
        data.frames.forEach(function (f) {
          (DS.clips[f.clip] || (DS.clips[f.clip] = [])).push(f);
        });
        DS.ok = true;
      });
    });
  };

  function blit(ctx, f, alpha, sc) {
    if (!f) return;
    sc = sc || 1;
    const s = f.s * sc;
    const prev = ctx.globalAlpha;
    ctx.globalAlpha = prev * (alpha == null ? 1 : alpha);
    ctx.drawImage(DS.img, f.x, f.y, f.w, f.h, -f.ax * s, -f.ay * s, f.w * s, f.h * s);
    ctx.globalAlpha = prev;
  }
  function handOf(f, sc) {
    sc = sc || 1;
    const s = f.s * sc;
    return [(f.hx - f.ax) * s, (f.hy - f.ay) * s];
  }
  /* phase 0..1. Looping clips blend a little of the next frame on top
     so an 8-frame cycle reads smoother than the frame count alone.
     The base frame stays opaque, so he never turns see-through. */
  function drawClip(ctx, name, phase, loop, sc) {
    const fr = DS.clips[name];
    if (!fr || !fr.length) return null;
    const n = fr.length;
    let i = 0, j = 0, a2 = 0;
    if (n === 1 || !loop) {
      i = n === 1 ? 0 : clamp(Math.round(clamp(phase || 0, 0, 1) * (n - 1)), 0, n - 1);
    } else {
      const p = ((phase || 0) % 1 + 1) % 1;
      const f = p * n;
      i = Math.floor(f) % n;
      j = (i + 1) % n;
      a2 = f - Math.floor(f);
    }
    blit(ctx, fr[i], 1, sc);
    /* Only walk-style loops blend. Mixing a crouch with an arms-up
       jump reads as two Duncans. */
    if (loop && a2 > 0.12 && j !== i) blit(ctx, fr[j], a2 * 0.35, sc);
    return fr[i];
  }

  function stateOf(o) {
    return o._sp || (o._sp = { prevAir: 0, land: -1, hurt: -1, bust: -1 });
  }
  function pickDuncan(o, vis) {
    vis = vis || {};
    const t = nowT(vis);
    const st = stateOf(o);
    const air = o.air || 0;
    const ov = o.ov;
    const vy = vis.vy || 0;
    const y = vis.y || 0;
    const kb = vis.kb || 0;
    if (Math.abs(kb) > 40) st.hurt = t + 0.42;
    if (st.prevAir > 0.45 && air < 0.18) st.land = t + 0.28;
    st.prevAir = air;
    if (ov && ov.t === 'cuff') st.bust = Math.max(st.bust, t + 0.4);
    const moving = (o.A || 0) > 0.28 && (o.v || 0) > 14;
    const fast = (o.v || 0) > 190;
    let clip = 'duncan/idle', phase = 0, loop = true;
    if (t < st.hurt) { clip = 'duncan/hurt'; phase = 1 - (st.hurt - t) / 0.42; loop = false; }
    else if (ov && (ov.t === 'cheer' || ov.t === 'wave' || ov.t === 'hands')) { clip = 'duncan/celebrate'; phase = (t * 8) % 1; }
    else if (t < st.bust) { clip = 'duncan/bust'; phase = 1 - (st.bust - t) / 0.4; loop = false; }
    else if (ov && ov.t === 'point' && !moving) { clip = 'duncan/point'; phase = 0; loop = false; }
    else if (ov && ov.t === 'hose' && !moving) { clip = 'duncan/hose'; phase = 0; loop = false; }
    else if (ov && ov.t === 'blanket' && !moving) { clip = 'duncan/blanket'; phase = 0; loop = false; }
    else if (air > 0.4 || (y < -8 && vy < 80)) {
      clip = 'duncan/jump';
      phase = vy < -220 ? 0 : vy < -30 ? 0.5 : 1;
      loop = false;
    } else if (t < st.land) { clip = 'duncan/land'; phase = 1 - (st.land - t) / 0.28; loop = false; }
    else if (moving && fast && DS.clips['duncan/run']) { clip = 'duncan/run'; phase = o.u || 0; }
    else if (moving) { clip = 'duncan/walk'; phase = o.u || 0; }
    else {
      clip = 'duncan/idle';
      const blink = (t % 3.4) > 3.18;
      phase = blink ? 0.99 : 0;
      loop = false;
    }
    if (!DS.clips[clip]) clip = DS.clips['duncan/walk'] ? 'duncan/walk' : 'duncan/idle';
    return { clip: clip, phase: phase, loop: loop, t: t };
  }

  DS.draw = function (ctx, o, vis) {
    if (!DS.ok) return false;
    const pk = pickDuncan(o, vis);
    ctx.save();
    if (pk.clip === 'duncan/celebrate') ctx.translate(0, -Math.abs(Math.sin(pk.t * 9)) * 6);
    if (pk.clip === 'duncan/run') ctx.rotate(0.05);
    if (pk.clip === 'duncan/idle') {
      const b = 1 + Math.sin(pk.t * 2.1) * 0.015;
      ctx.scale(2 - b, b);
    }
    if (pk.clip === 'duncan/land') {
      const k = 0.88 + 0.12 * clamp(pk.phase, 0, 1);
      ctx.scale(1 + (1 - k) * 0.45, k);
    }
    const f = drawClip(ctx, pk.clip, pk.phase, pk.loop, 1);
    if (pk.clip === 'duncan/land' && pk.phase < 0.55) {
      ctx.fillStyle = 'rgba(150,130,100,.4)';
      ctx.beginPath(); ctx.ellipse(-12, -1, 9, 2.2, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(10, -1, 7, 2, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
    if (f) o._hand = handOf(f, 1);
    o._clip = pk.clip;
    o._spr = true;
    return true;
  };

  function movingNpc(o) { return (o.A || 0) > 0.3 && (o.v || 0) > 16; }
  function npcName(L) {
    if (!L) return null;
    if (L.can || L.match) return 'npc/arson';
    if (L.mask) return 'npc/crook-walk';
    if (L.head === 'ushanka') return 'npc/commie';
    if (L.head === 'bun') return 'npc/granny';
    if (L.kid || L.head === 'kid') return 'npc/kid';
    if (L.head === 'pony') return 'npc/mom';
    if (L.head === 'helmet') return 'npc/fire';
    if (L.star) return 'duncan/idle';
    if (L.head === 'cap') return 'npc/farmer';
    return null;
  }
  DS.drawPerson = function (ctx, o, L) {
    if (!DS.ok) return false;
    let name = npcName(L);
    if (!name || !DS.clips[name]) return false;
    const t = nowT();
    const go = movingNpc(o);
    let phase = 0, loop = false;
    if (name === 'npc/crook-walk') {
      if ((o.v || 0) > 140 && DS.clips['npc/crook-run']) {
        /* keep the walk cycle at a run — it is phase-locked, so it
           speeds up with him. The single lean frame is the contact pose. */
      }
      phase = go ? (o.u || 0) : 0;
      loop = go;
    } else if (go) {
      phase = o.u || 0;
      loop = !!(DS.clips[name] && DS.clips[name].length > 1);
    }
    ctx.save();
    const ov = o.ov;
    if (ov && (ov.t === 'cheer' || ov.t === 'wave' || ov.t === 'hands')) ctx.translate(0, -Math.abs(Math.sin(t * 10)) * 5);
    else if (go && DS.clips[name].length < 2) {
      ctx.translate(0, Math.sin((o.u || 0) * TAU) * 1.6);
      ctx.rotate(Math.sin((o.u || 0) * TAU) * 0.05);
    }
    if (L && L.head === 'helmet' && ov && ov.t === 'aim') ctx.rotate(clamp(ov.a || 0, -0.6, 0.8) * 0.15);
    const f = drawClip(ctx, name, phase, loop, 1);
    ctx.restore();
    if (f) o._hand = handOf(f, 1);
    o._clip = name;
    o._spr = true;
    return true;
  };

  DS.drawUmb = function (ctx, u, sc) {
    if (!DS.ok || !DS.clips['npc/cloak']) return false;
    sc = sc || 1;
    const op = u.op || 0;
    const t = nowT();
    ctx.save();
    ctx.translate(Math.sin(t * (u.shake ? 46 : 2.4)) * (u.shake ? 2.4 : 0.7) * sc, 0);
    if (op < 0.42 || !DS.clips['npc/umbrella']) {
      ctx.scale(0.72, 1);
      drawClip(ctx, 'npc/cloak', (t * 0.6) % 1, false, sc);
    } else {
      const grow = 0.62 + 0.55 * Math.min(1, (op - 0.42) / 0.58);
      ctx.scale(grow, 0.95 + 0.12 * Math.min(1, op));
      drawClip(ctx, 'npc/umbrella', 0, false, sc);
    }
    ctx.restore();
    if (u.stun > 0) {
      const top = -120 * sc;
      for (let i = 0; i < 3; i++) {
        const a = t * 4 + i * TAU / 3;
        star(ctx, Math.cos(a) * 22 * sc, top + Math.sin(a) * 6 * sc, 4 * sc, '#ffd23f');
      }
    }
    if (u.cuffed) {
      ctx.strokeStyle = '#d8dce4';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(0, -28 * sc, 26 * sc, 5 * sc, 0, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, -44 * sc, 22 * sc, 4.5 * sc, 0, 0, TAU);
      ctx.stroke();
    }
    return true;
  };

  function star(ctx, x, y, r, col) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.fill();
  }

  DS.drawProp = function (ctx, name, t) {
    const fr = DS.clips['prop/' + name];
    if (!DS.ok || !fr) return false;
    const f = fr[0];
    ctx.save();
    if (f.rot) ctx.rotate(f.rot);
    blit(ctx, f, 1, 1);
    if (name === 'jeep' || name === 'firetruck' || name === 'ambulance') {
      const ph = Math.floor((t || 0) * 6) % 2;
      const H = f.h * f.s;
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = ph ? 'rgba(255,50,40,.65)' : 'rgba(50,120,255,.6)';
      ctx.beginPath();
      ctx.arc(ph ? -H * 0.08 : H * 0.08, -H * 0.30, Math.max(3.5, H * 0.055), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    return true;
  };

  DS.drawCat = function (ctx, col, pose, t) {
    const fr = DS.clips['npc/cat'];
    if (!DS.ok || !fr) return false;
    ctx.save();
    if (pose === 'fall') { ctx.rotate(0.5 + Math.sin((t || 0) * 8) * 0.15); ctx.translate(0, -2); }
    else ctx.translate(0, Math.sin((t || 0) * 5) * 0.4);
    blit(ctx, fr[0], 1, 1);
    if (col && col.toLowerCase() !== '#e8962a') {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.globalAlpha = 0.38;
      ctx.fillStyle = col;
      ctx.fillRect(-20, -28, 40, 40);
    }
    ctx.restore();
    return true;
  };

  /* Top-down Duncan for the intersection. Head toward -y, same as the
     old stick figure, so the level's rotation still points him. */
  DS.drawTop = function (ctx, t) {
    if (!DS.ok) return false;
    const wv = Math.sin((t || 0) * 8) * 0.35;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.beginPath(); ctx.ellipse(2, 3, 16, 11, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#1a120c';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#e7b48a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-8, -2); ctx.lineTo(-22, -12 + wv * 12);
    ctx.moveTo(8, -2); ctx.lineTo(22, 8 - wv * 12);
    ctx.stroke();
    ctx.fillStyle = '#f4efe6';
    ctx.beginPath(); ctx.arc(-22, -12 + wv * 12, 3.3, 0, TAU); ctx.arc(22, 8 - wv * 12, 3.3, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#1a120c'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = '#1d3b27';
    ctx.beginPath(); ctx.ellipse(0, 6, 13, 9, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#0c1a12'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.fillStyle = '#c6a56a';
    ctx.beginPath(); ctx.ellipse(0, -1, 12, 8, 0, 0, TAU); ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e6d3a2';
    ctx.beginPath(); ctx.ellipse(0, 2, 8, 6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#141414';
    ctx.beginPath(); ctx.arc(0, -2, 6.5, 0, TAU); ctx.fill();
    ctx.fillRect(-5, -12, 10, 6);
    ctx.fillStyle = '#f2f2f2';
    ctx.beginPath(); ctx.arc(1, -4, 1.7, 0, TAU); ctx.fill();
    ctx.restore();
    return true;
  };

  DS.drawCar = function (ctx, w, l, col, o) {
    if (!DS.ok) return false;
    o = o || {};
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.32)';
    round(ctx, -w / 2 + 3, -l / 2 + 5, w, l, 8); ctx.fill();
    ctx.fillStyle = '#141414';
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      round(ctx, sx * w / 2 - (sx > 0 ? 2 : 8), sy * l * 0.28 - 7, 9, 15, 3);
      ctx.fill();
      ctx.fillStyle = '#6a6a70';
      ctx.beginPath(); ctx.arc(sx * w / 2 - (sx > 0 ? -2 : 4), sy * l * 0.28, 2.2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#141414';
    }
    const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    g.addColorStop(0, shade(col, 0.72));
    g.addColorStop(0.45, col);
    g.addColorStop(1, shade(col, 0.8));
    ctx.fillStyle = g;
    ctx.strokeStyle = '#1a120c';
    ctx.lineWidth = 1.6;
    round(ctx, -w / 2, -l / 2, w, l, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    round(ctx, -w / 2 + 2, -l / 2 + 3, w * 0.22, l * 0.72, 4); ctx.fill();
    ctx.fillStyle = '#243244';
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 4, -l / 2 + l * 0.28);
    ctx.lineTo(w / 2 - 4, -l / 2 + l * 0.28);
    ctx.lineTo(w / 2 - 6, -l / 2 + l * 0.42);
    ctx.lineTo(-w / 2 + 6, -l / 2 + l * 0.42);
    ctx.fill();
    ctx.fillStyle = shade(col, 1.08);
    round(ctx, -w / 2 + 5, -l / 2 + l * 0.44, w - 10, l * 0.32, 3); ctx.fill();
    ctx.fillStyle = '#fff1b0';
    ctx.fillRect(-w / 2 + 2, -l / 2 - 1, 6, 3);
    ctx.fillRect(w / 2 - 8, -l / 2 - 1, 6, 3);
    ctx.fillStyle = '#e02020';
    ctx.fillRect(-w / 2 + 2, l / 2 - 3, 6, 3);
    ctx.fillRect(w / 2 - 8, l / 2 - 3, 6, 3);
    if (o.star) star(ctx, 0, 0, 7, '#ffd23f');
    ctx.restore();
    return true;
  };

  function shade(hex, f) {
    const n = parseInt(String(hex).replace('#', ''), 16);
    if (!isFinite(n)) return hex;
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = clamp(Math.round(r * f), 0, 255);
    g = clamp(Math.round(g * f), 0, 255);
    b = clamp(Math.round(b * f), 0, 255);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  function round(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
  }

  function bakeStamp(kind, seed, night) {
    const c = document.createElement('canvas');
    const g = c.getContext('2d');
    const n = Math.abs(seed | 0);
    if (kind === 'tree') {
      c.width = 64; c.height = 78;
      g.translate(32, 70);
      g.fillStyle = 'rgba(0,0,0,.28)';
      g.beginPath(); g.ellipse(3, 2, 16, 5, 0, 0, TAU); g.fill();
      g.fillStyle = night ? '#3a2a1c' : '#6a4428';
      g.fillRect(-4, -28, 8, 30);
      g.strokeStyle = '#2a1a10'; g.lineWidth = 1.4; g.strokeRect(-4, -28, 8, 30);
      const cols = night ? ['#1c3a22', '#24502c', '#18341e'] : (n % 5 === 0 ? ['#c86828', '#e09030', '#a85020'] : ['#2f7a32', '#3e9440', '#246428']);
      [[0, -34, 20], [-10, -28, 14], [11, -30, 15], [0, -46, 16]].forEach(function (p, i) {
        g.fillStyle = cols[i % cols.length];
        g.beginPath(); g.arc(p[0], p[1], p[2], 0, TAU); g.fill();
        g.strokeStyle = '#143018'; g.lineWidth = 1.5; g.stroke();
      });
      g.fillStyle = 'rgba(255,255,255,.16)';
      g.beginPath(); g.arc(-6, -48, 7, 0, TAU); g.fill();
    } else if (kind === 'house') {
      c.width = 78; c.height = 70;
      const cols = ['#a83a2a', '#6a7aa0', '#c4a06a', '#7a5a3a'];
      const wall = night ? '#4a3428' : cols[n % cols.length];
      g.translate(8, 6);
      g.fillStyle = 'rgba(0,0,0,.3)';
      g.fillRect(6, 10, 58, 52);
      g.fillStyle = wall;
      g.fillRect(0, 16, 60, 48);
      g.strokeStyle = '#1a120c'; g.lineWidth = 1.6; g.strokeRect(0, 16, 60, 48);
      g.fillStyle = shade(wall, 0.75);
      g.beginPath(); g.moveTo(-2, 18); g.lineTo(30, 0); g.lineTo(62, 18); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = night ? '#ffd27a' : '#9fd0ea';
      [[8, 26], [24, 26], [40, 26]].forEach(function (p) {
        g.fillRect(p[0], p[1], 10, 12);
        g.strokeRect(p[0], p[1], 10, 12);
      });
      g.fillStyle = '#5a3418';
      g.fillRect(24, 44, 12, 20);
      g.strokeRect(24, 44, 12, 20);
      if (night) {
        g.fillStyle = 'rgba(255,200,80,.35)';
        g.fillRect(8, 26, 10, 12);
      }
    } else {
      c.width = 16; c.height = 54;
      g.fillStyle = night ? '#c8b898' : '#f0e6d2';
      g.strokeStyle = '#5a4630'; g.lineWidth = 1.3;
      for (let i = 0; i < 3; i++) {
        g.fillRect(2, 4 + i * 16, 8, 14);
        g.strokeRect(2, 4 + i * 16, 8, 14);
      }
    }
    return c;
  }
  DS.stamp = function (ctx, kind, x, y, seed, night) {
    const key = kind + '|' + (Math.abs(seed | 0) % 4) + '|' + (night ? 1 : 0);
    let c = stampCache[key];
    if (!c) c = stampCache[key] = bakeStamp(kind, seed, night);
    if (kind === 'tree') ctx.drawImage(c, x - c.width / 2, y - 78);
    else if (kind === 'house') ctx.drawImage(c, x - c.width / 2, y - c.height + 4);
    else ctx.drawImage(c, x - c.width / 2, y - c.height + 6);
  };

  /* A light paint grade so the existing backdrops sit closer to the
     cover: a bit more contrast and color, and a warm wash on the
     sunset scenes. Pixels do not move, so fire-window and cat-perch
     coordinates stay valid. */
  DS.gradeWorld = function (imgs) {
    ['street_day', 'street_dusk', 'house', 'square', 'park'].forEach(function (k) {
      const im = imgs[k];
      if (!im || !im.width) return;
      const c = document.createElement('canvas');
      c.width = im.width; c.height = im.height;
      const g = c.getContext('2d');
      const warm = k === 'street_dusk' || k === 'square' || k === 'house';
      g.filter = warm ? 'contrast(1.06) saturate(1.1)' : 'contrast(1.08) saturate(1.14)';
      g.drawImage(im, 0, 0);
      g.filter = 'none';
      if (warm) {
        g.globalCompositeOperation = 'soft-light';
        g.fillStyle = 'rgba(255,148,64,0.16)';
        g.fillRect(0, 0, c.width, c.height);
      }
      imgs[k] = c;
    });
  };

  const GALLERY = ['duncan/idle', 'duncan/walk', 'duncan/run', 'duncan/jump', 'duncan/land', 'duncan/bust', 'duncan/point', 'duncan/hose', 'duncan/blanket', 'duncan/hurt', 'duncan/celebrate'];
  DS.drawGallery = function (ctx, W, H) {
    const t = nowT();
    ctx.fillStyle = '#1b1226';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#2a2040';
    ctx.fillRect(0, 0, W, 36);
    ctx.fillStyle = '#ffd23f';
    ctx.font = '16px Lilita, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Duncan clips', 10, 24);
    const cols = W > H ? 6 : 3;
    const cw = W / cols, ch = (H - 40) / Math.ceil(GALLERY.length / cols);
    GALLERY.forEach(function (name, i) {
      const col = i % cols, row = Math.floor(i / cols);
      const x = col * cw + cw / 2, y = 48 + row * ch + ch * 0.78;
      ctx.save();
      ctx.translate(x, y);
      const sc = Math.min(cw, ch) / 160;
      ctx.scale(sc, sc);
      const fr = DS.clips[name] || [];
      const loop = name === 'duncan/walk' || name === 'duncan/run' || name === 'duncan/idle' || name === 'duncan/celebrate';
      const phase = loop ? (t * (name === 'duncan/run' ? 1.4 : 0.9)) % 1 : (t % 1.2) / 1.2;
      if (name === 'duncan/celebrate') ctx.translate(0, -Math.abs(Math.sin(t * 9)) * 6);
      drawClip(ctx, name, phase, loop && fr.length > 1, 1);
      ctx.restore();
      ctx.fillStyle = '#ffe7a8';
      ctx.font = '13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(name.split('/')[1], col * cw + cw / 2, 48 + row * ch + 16);
    });
  };

  root.DuncanSprites = DS;
})(window);
