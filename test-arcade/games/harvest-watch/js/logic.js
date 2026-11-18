/* Constable Duncan: The Harvest Watch
   Pure rules: layout, touch, physics, levels, score, local leaderboard.
   No DOM. The page and the node tests both call this. */
(function (factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.HW = api;
})(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const PHYS = {walk: 112, run: 248, grav: 1120, jump: -430, coyote: 0.14, buffer: 0.14, carry: 0.45};

  /* Same 8-way swipe as Constable Duncan: anchor follows the finger, dead zone 14, reach 44. */
  function swipeSample(t) {
    const dx = t.x - t.ax, dy = t.y - t.ay, d = Math.hypot(dx, dy), o = {};
    if (d < 14) return o;
    if (d > 44) { t.ax = t.x - dx / d * 44; t.ay = t.y - dy / d * 44; }
    const s = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
    if (s === 0 || s === 1 || s === -1) o.R = 1;
    if (s === 4 || s === -4 || s === 3 || s === -3) o.L = 1;
    if (s === 2 || s === 1 || s === 3) o.D = 1;
    if (s === -2 || s === -1 || s === -3) o.U = 1;
    return o;
  }
  function touchAxis(zones) {
    let x = 0, y = 0;
    for (const z of zones) {
      if (z.L) x -= 1;
      if (z.R) x += 1;
      if (z.U) y -= 1;
      if (z.D) y += 1;
    }
    return {x: clamp(x, -1, 1), y: clamp(y, -1, 1)};
  }
  function touchRun(touches) {
    for (const t of touches) if (Math.abs(t.x - t.ox) > 80) return true;
    return false;
  }
  /* After the finger lifts, keep the last direction long enough to tap JUMP. */
  function touchCarry(prev, touchX, dt, running) {
    if (touchX) return {dir: Math.sign(touchX), t: PHYS.carry, run: !!running};
    if (prev && prev.t > 0) return {dir: prev.dir, t: prev.t - dt, run: !!prev.run};
    return {dir: 0, t: 0, run: false};
  }
  function axisWithCarry(keysX, padX, touchX, carry) {
    const base = clamp((keysX || 0) + (padX || 0) + (touchX || 0), -1, 1);
    if (base !== 0) return base;
    if (carry && carry.t > 0) return carry.dir || 0;
    return 0;
  }

  /* Portrait: picture on top (62%), JUMP right and ACTION beside it in the panel.
     Landscape: picture stays full screen and both buttons stay on the picture. */
  function layoutMetrics(W, H) {
    const land = W > H;
    const gameH = land ? H : Math.round(H * 0.62);
    if (!land) {
      const ph = Math.max(0, H - gameH);
      const big = clamp(ph * 0.36, 92, 124);
      const sm = Math.round(big * 0.84);
      const bot = Math.round(clamp(ph * 0.14, 18, 46)) + 8;
      return {
        land, gameH, ph,
        jump: {w: sm, h: sm, right: 16, bottom: bot},
        act: {w: sm, h: sm, right: 16 + sm + 18, bottom: bot},
        hint: true
      };
    }
    const big = clamp(H * 0.21, 72, 96);
    const sm = Math.round(big * 0.82);
    return {
      land, gameH, ph: 0,
      jump: {w: sm, h: sm, right: 14, bottom: 12},
      act: {w: sm, h: sm, right: 14 + sm + 16, bottom: 12},
      hint: false
    };
  }
  function buttonRects(W, H) {
    const m = layoutMetrics(W, H);
    const padTop = m.land ? 0 : m.gameH;
    const padH = H - padTop;
    const rect = b => ({x: W - b.right - b.w, y: padTop + padH - b.bottom - b.h, w: b.w, h: b.h});
    return {land: m.land, gameH: m.gameH, jump: rect(m.jump), act: rect(m.act), hint: m.hint};
  }
  function buttonsOk(W, H) {
    if (W < 200 || H < 200) return false;
    const r = buttonRects(W, H);
    const inside = b => b.x >= 2 && b.y >= 2 && b.x + b.w <= W - 1 && b.y + b.h <= H - 1 && b.w >= 44 && b.h >= 44;
    const gap = r.jump.x - (r.act.x + r.act.w);
    const rightSide = r.act.x > W * 0.35;
    const panel = r.land ? (r.gameH === H && r.jump.y > H * 0.35) : (r.gameH <= H * 0.7 && r.gameH >= H * 0.55 && r.jump.y >= r.gameH - 1);
    return inside(r.jump) && inside(r.act) && gap >= 8 && rightSide && panel;
  }

  function buttonsFor(kind) {
    if (kind === 'loaves' || kind === 'corn') return ['JUMP', 'SHOO'];
    if (kind === 'lambs') return ['JUMP', 'WHISTLE'];
    if (kind === 'bell') return ['JUMP', 'RING'];
    if (kind === 'supper') return ['JUMP', 'SET'];
    return ['JUMP', 'ACTION'];
  }

  function rnd(s) {
    let a = s.rng | 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    s.rng = a;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  const LEVELS = [
    {id: 'loaves', kind: 'loaves', goal: 4, par: 95, len: 1560, start: 230, cartX: 96,
      loaves: [430, 760, 1080, 1400]},
    {id: 'corn', kind: 'corn', goal: 6, par: 75, len: 1620, start: 130,
      corn: [300, 580, 860, 1140, 1420]},
    {id: 'lambs', kind: 'lambs', goal: 4, par: 90, len: 1540, start: 180, penX: 1320, penW: 180,
      lambs: [380, 600, 840, 1060]},
    {id: 'bell', kind: 'bell', goal: 3, par: 85, len: 1560, start: 70, pits: true, bellX: 1330,
      /* 34px steps and 42px gaps. A walk-jump lands. Pigeons pace the middle
         and leave the lip clear, so you can wait them out or hop over. */
      plats: [
        {x: 0, y: 0, w: 280},
        {x: 322, y: -34, w: 250},
        {x: 614, y: -68, w: 250},
        {x: 906, y: -102, w: 250},
        {x: 1198, y: -136, w: 250}
      ]},
    {id: 'supper', kind: 'supper', goal: 5, par: 90, len: 1580, start: 160, table0: 980, table1: 1160,
      dishes: [280, 520, 760, 1260, 1480]}
  ];

  function levelById(id) { return LEVELS.find(l => l.id === id) || LEVELS[0]; }

  function create(id, seed) {
    const def = levelById(id);
    const s = {
      id: def.id, kind: def.kind, goal: def.goal, par: def.par, len: def.len, pits: !!def.pits,
      cartX: def.cartX || 0, penX: def.penX || 0, penW: def.penW || 0, bellX: def.bellX || 0,
      table0: def.table0 || 0, table1: def.table1 || 0,
      seed: seed || 1, rng: seed || 1, t: 0, score: 0, hearts: 3, maxHearts: 3, mistakes: 0,
      progress: 0, won: false, over: false, ready: false, hold: 0, fail: '',
      spawnIn: 0.45, nextId: 1, ringCd: 0, kidIn: 2.2,
      plats: (def.plats || [{x: -40, y: 0, w: def.len + 80}]).map(p => ({x: p.x, y: p.y, w: p.w})),
      loaves: (def.loaves || []).map((x, i) => ({id: i + 1, x, taken: false})),
      corn: (def.corn || []).map((x, i) => ({id: i + 1, x, ok: true})),
      crows: [],
      lambs: (def.lambs || []).map((x, i) => ({id: i + 1, x, home: x, follow: false, penned: false, face: -1})),
      dishes: (def.dishes || []).map((x, i) => ({id: i + 1, x, taken: false, placed: false})),
      pigeons: [], kids: [],
      player: {
        x: def.start, y: 0, vy: 0, face: 1, onGround: true, coyote: PHYS.coyote, jumpBuf: 0,
        inv: 1.3, carry: null, dx: 0, safeX: def.start, safeY: 0, pose: null, poseT: 0
      }
    };
    if (def.kind === 'bell') {
      s.plats.forEach((p, i) => {
        if (i !== 1 && i !== 2) return;
        s.pigeons.push({
          plat: i, y: p.y - 28,
          amp: p.w * 0.18,
          speed: 0.85,
          phase: i * 2.2,
          x: p.x + p.w * 0.5
        });
      });
    }
    return s;
  }

  function pose(s, name, time) { s.player.pose = name; s.player.poseT = time; }

  function fail(s, ev, why) {
    if (s.won || s.over) return;
    s.over = true;
    s.hold = 0;
    s.fail = why;
    ev.push({type: 'fail', why});
  }
  function hurt(s, ev, why) {
    if (s.player.inv > 0 || s.over || s.won) return false;
    s.hearts--;
    s.mistakes++;
    s.player.inv = 1.25;
    ev.push({type: 'hurt', why, x: s.player.x, y: s.player.y});
    if (s.hearts <= 0) fail(s, ev, why);
    return true;
  }
  function win(s, ev, bonus) {
    if (s.won || s.over) return;
    s.score += bonus;
    s.won = true;
    s.hold = 0;
    ev.push({type: 'win', bonus, score: s.score, x: s.player.x});
  }
  function starsFor(s) {
    if (!s.won) return 0;
    const full = s.hearts === s.maxHearts;
    const fast = s.t <= s.par;
    if (full && fast && s.mistakes === 0) return 3;
    if (full || s.hearts >= 2) return 2;
    return 1;
  }
  function boardInsert(board, entry, limit) {
    const next = (board || []).concat([entry]).sort((a, b) => b.score - a.score || a.t - b.t);
    return next.slice(0, limit || 5);
  }

  function movePlayer(s, input, dt, ev) {
    const p = s.player;
    if (p.poseT > 0) { p.poseT -= dt; if (p.poseT <= 0) p.pose = null; }
    if (p.inv > 0) p.inv -= dt;
    if (input.jump) p.jumpBuf = PHYS.buffer;
    const sp = (input.run || Math.abs(input.x) > 0.85) ? PHYS.run : PHYS.walk;
    const vx = (s.won || s.over) ? 0 : input.x * sp;
    const x0 = p.x;
    p.x = clamp(p.x + vx * dt, 16, s.len - 16);
    p.dx = p.x - x0;
    if (input.x) p.face = Math.sign(input.x);
    const prevY = p.y;
    p.vy += PHYS.grav * dt;
    p.y += p.vy * dt;
    let grounded = false, groundY = null;
    if (p.vy >= 0) {
      for (const plat of s.plats) {
        if (p.x < plat.x || p.x > plat.x + plat.w) continue;
        if (prevY <= plat.y + 0.5 && p.y >= plat.y) {
          p.y = plat.y;
          p.vy = 0;
          grounded = true;
          groundY = plat.y;
          break;
        }
      }
    }
    p.onGround = grounded;
    if (grounded) {
      p.coyote = PHYS.coyote;
      p.safeX = p.x;
      p.safeY = groundY;
    }
    if (p.jumpBuf > 0 && (grounded || p.coyote > 0) && !s.won && !s.over) {
      p.vy = PHYS.jump;
      p.y -= 0.01;
      p.jumpBuf = 0;
      p.coyote = 0;
      p.onGround = false;
      ev.push({type: 'jump'});
    } else if (!p.onGround) {
      p.coyote = Math.max(0, p.coyote - dt);
      p.jumpBuf = Math.max(0, p.jumpBuf - dt);
    }
    if (s.pits && p.y > 56 && !s.over) {
      const dropped = hurt(s, ev, 'Easy there. The tower has a long drop.');
      p.x = p.safeX;
      p.y = p.safeY;
      p.vy = 0;
      p.onGround = true;
      if (dropped) ev.push({type: 'fall', x: p.x});
    }
  }

  function tickLoaves(s, input, dt, ev) {
    const p = s.player;
    if (!p.carry) {
      for (const loaf of s.loaves) {
        if (loaf.taken) continue;
        if (Math.abs(loaf.x - p.x) < 32 && p.y > -30) {
          loaf.taken = true;
          p.carry = loaf.id;
          pose(s, 'carry', 0.2);
          ev.push({type: 'pickup', x: loaf.x, what: 'loaf'});
          break;
        }
      }
    } else if (Math.abs(p.x - s.cartX) < 62 && p.y > -30) {
      p.carry = null;
      s.progress++;
      s.score += 200;
      pose(s, 'wave', 0.45);
      ev.push({type: 'deliver', x: s.cartX, n: 200});
      if (s.progress >= s.goal) win(s, ev, Math.max(0, Math.round(480 - s.t * 4)));
    }
    s.spawnIn -= dt;
    if (s.spawnIn <= 0 && !s.won) {
      s.crows.push({id: s.nextId++, x: s.len + 30, y: -50, vx: -158 - rnd(s) * 30, alive: true});
      s.spawnIn = 4.6 + rnd(s) * 1.4;
    }
    for (const c of s.crows) {
      if (!c.alive) continue;
      c.x += c.vx * dt;
      c.flap = (c.flap || 0) + dt;
      if (c.x < -40) c.alive = false;
    }
    if (input.act && !s.won) {
      let best = null, bd = 92;
      for (const c of s.crows) {
        if (!c.alive) continue;
        const d = Math.abs(c.x - p.x);
        if (d < bd && Math.abs((p.y - 40) - c.y) < 70) { bd = d; best = c; }
      }
      if (best) {
        best.alive = false;
        s.score += 50;
        pose(s, 'point', 0.28);
        ev.push({type: 'shoo', x: best.x, y: best.y, n: 50});
      } else pose(s, 'point', 0.2);
    }
    for (const c of s.crows) {
      if (!c.alive) continue;
      if (Math.abs(c.x - p.x) < 26 && Math.abs(c.y - (p.y - 38)) < 24) {
        if (hurt(s, ev, p.carry ? 'A crow nicked the loaf right out of your hands.' : 'That crow flew too close. Shoo it or jump.')) {
          c.alive = false;
          if (p.carry) {
            const loaf = s.loaves.find(l => l.id === p.carry);
            if (loaf) loaf.taken = false;
            p.carry = null;
            ev.push({type: 'drop', x: p.x});
          }
        }
      }
    }
    s.crows = s.crows.filter(c => c.alive);
  }

  function closestOpenCorn(s) {
    const open = s.corn.filter(c => c.ok && !s.crows.some(cr => cr.alive && cr.corn === c.id));
    open.sort((a, b) => Math.abs(a.x - s.player.x) - Math.abs(b.x - s.player.x));
    if (!open.length) return null;
    const i = open.length > 1 && rnd(s) > 0.62 ? 1 : 0;
    return open[i];
  }
  function tickCorn(s, input, dt, ev) {
    const p = s.player;
    s.spawnIn -= dt;
    if (s.spawnIn <= 0 && s.crows.filter(c => c.alive).length < 2 && s.progress < s.goal && !s.won) {
      const corn = closestOpenCorn(s);
      if (corn) {
        s.crows.push({id: s.nextId++, corn: corn.id, x: corn.x, peck: 0, alive: true});
        s.spawnIn = 1.35;
      } else s.spawnIn = 0.4;
    }
    for (const c of s.crows) {
      if (!c.alive) continue;
      c.peck += dt;
      if (c.peck >= 3.45) {
        c.alive = false;
        const corn = s.corn.find(k => k.id === c.corn);
        if (corn) corn.ok = false;
        s.hearts--;
        s.mistakes++;
        ev.push({type: 'lostear', x: c.x});
        if (s.hearts <= 0) fail(s, ev, 'The crows took too many ears. The corn can still be saved.');
      }
    }
    if (input.act && !s.won && !s.over) {
      let best = null, bd = 78;
      for (const c of s.crows) {
        if (!c.alive) continue;
        const d = Math.abs(c.x - p.x);
        if (d < bd) { bd = d; best = c; }
      }
      if (best && p.y > -36) {
        best.alive = false;
        s.progress++;
        s.score += 150;
        pose(s, 'point', 0.28);
        ev.push({type: 'shoo', x: best.x, y: -20, n: 150});
        if (s.progress >= s.goal) win(s, ev, s.mistakes === 0 ? 360 : 160);
      } else pose(s, 'point', 0.16);
    }
    s.crows = s.crows.filter(c => c.alive);
  }

  function tickLambs(s, input, dt, ev) {
    const p = s.player;
    if (input.act && !s.won) {
      let best = null, bd = 200;
      for (const lamb of s.lambs) {
        if (lamb.penned || lamb.follow) continue;
        const d = Math.abs(lamb.x - p.x);
        if (d < bd) { bd = d; best = lamb; }
      }
      if (best) {
        best.follow = true;
        pose(s, 'wave', 0.4);
        ev.push({type: 'whistle', x: best.x});
      } else {
        pose(s, 'wave', 0.25);
        ev.push({type: 'whistle', x: p.x, miss: true});
      }
    }
    for (const lamb of s.lambs) {
      if (lamb.penned) continue;
      if (lamb.follow) {
        const want = p.x - 38 * (p.face || 1);
        const dx = want - lamb.x;
        lamb.x += clamp(dx, -156 * dt, 156 * dt);
        lamb.face = Math.sign(dx) || lamb.face;
        if (Math.abs(p.x - lamb.x) > 252) {
          lamb.follow = false;
          ev.push({type: 'behind', x: lamb.x});
        } else if (lamb.x >= s.penX) {
          lamb.follow = false;
          lamb.penned = true;
          lamb.x = s.penX + 36 + (lamb.id % 4) * 28;
          s.progress++;
          s.score += 250;
          ev.push({type: 'pen', x: lamb.x, n: 250});
          if (s.progress >= s.goal) win(s, ev, s.mistakes === 0 ? 320 : 140);
        }
      } else {
        lamb.x -= 26 * dt;
        lamb.face = -1;
        if (lamb.x < 72) {
          lamb.x = lamb.home;
          s.hearts--;
          s.mistakes++;
          ev.push({type: 'escape', x: 72});
          if (s.hearts <= 0) fail(s, ev, 'A lamb reached the lane. Call them in a little sooner.');
        }
      }
    }
  }

  function tickBell(s, input, dt, ev) {
    const p = s.player;
    /* Pigeons fuss around the steps. They never knock you off: the drop is the hazard,
       and a phone jump should not lose a heart to a bird you could not read. */
    for (const g of s.pigeons) {
      const plat = s.plats[g.plat];
      const cx = plat.x + plat.w * 0.62;
      g.x = cx + Math.sin(s.t * g.speed + g.phase) * g.amp;
      g.y = plat.y - 26 + Math.sin(s.t * 3 + g.phase) * 4;
    }
    if (s.ringCd > 0) s.ringCd -= dt;
    const onBell = p.onGround && Math.abs(p.y - (s.plats[s.plats.length - 1].y)) < 1 && Math.abs(p.x - s.bellX) < 78;
    if (input.act && onBell && s.ringCd <= 0 && !s.won) {
      s.ringCd = 0.62;
      s.progress++;
      s.score += 220;
      pose(s, 'cheer', 0.4);
      ev.push({type: 'bell', n: s.progress, x: p.x});
      if (s.progress >= s.goal) win(s, ev, s.mistakes === 0 ? 400 : 180);
    } else if (input.act && !s.won) pose(s, 'point', 0.16);
  }

  function tickSupper(s, input, dt, ev) {
    const p = s.player;
    if (!p.carry && p.y > -30) {
      for (const d of s.dishes) {
        if (d.taken || d.placed) continue;
        if (Math.abs(d.x - p.x) < 32) {
          d.taken = true;
          p.carry = d.id;
          ev.push({type: 'pickup', x: d.x, what: 'dish'});
          break;
        }
      }
    }
    if (input.act && p.carry && p.x >= s.table0 && p.x <= s.table1 && p.y > -30) {
      const d = s.dishes.find(n => n.id === p.carry);
      if (d) d.placed = true;
      p.carry = null;
      s.progress++;
      s.score += 180;
      pose(s, 'wave', 0.35);
      ev.push({type: 'place', x: p.x, n: 180});
      if (s.progress >= s.goal) win(s, ev, s.mistakes === 0 ? 380 : 160);
    } else if (input.act && !s.won) pose(s, 'point', 0.16);
    s.kidIn -= dt;
    if (s.kidIn <= 0 && s.kids.length < 1 && !s.won) {
      s.kids.push({id: s.nextId++, x: s.len + 20, face: -1});
      s.kidIn = 4.4;
    }
    for (const k of s.kids) k.x -= 168 * dt;
    for (const k of s.kids) {
      if (Math.abs(k.x - p.x) < 26 && p.y > -34) {
        if (hurt(s, ev, 'Easy, little one! The dish can be picked up again.')) {
          if (p.carry) {
            const d = s.dishes.find(n => n.id === p.carry);
            if (d) d.taken = false;
            p.carry = null;
            ev.push({type: 'drop', x: p.x});
          }
        }
      }
    }
    s.kids = s.kids.filter(k => k.x > -30);
  }

  function tick(s, input, dt) {
    const ev = [];
    input = input || {};
    dt = clamp(dt || 0, 0, 0.05);
    if (s.won || s.over) {
      s.hold += dt;
      if (s.hold > 0.62) s.ready = true;
      return ev;
    }
    s.t += dt;
    movePlayer(s, {
      x: input.x || 0, y: input.y || 0,
      jump: !!input.jump, act: !!input.act, run: !!input.run
    }, dt, ev);
    if (s.over) return ev;
    if (s.kind === 'loaves') tickLoaves(s, input, dt, ev);
    else if (s.kind === 'corn') tickCorn(s, input, dt, ev);
    else if (s.kind === 'lambs') tickLambs(s, input, dt, ev);
    else if (s.kind === 'bell') tickBell(s, input, dt, ev);
    else if (s.kind === 'supper') tickSupper(s, input, dt, ev);
    return ev;
  }

  function hud(s, runScore) {
    const hearts = '♥'.repeat(Math.max(0, s.hearts)) + '♡'.repeat(Math.max(0, s.maxHearts - s.hearts));
    let goal = '';
    if (s.kind === 'loaves') goal = 'Loaves ' + s.progress + '/' + s.goal;
    else if (s.kind === 'corn') goal = 'Shoo ' + s.progress + '/' + s.goal;
    else if (s.kind === 'lambs') goal = 'Penned ' + s.progress + '/' + s.goal;
    else if (s.kind === 'bell') goal = 'Rings ' + s.progress + '/' + s.goal;
    else if (s.kind === 'supper') goal = 'Places ' + s.progress + '/' + s.goal;
    return hearts + '  ' + goal + '  ·  ' + (runScore + s.score);
  }

  return {
    TAU, clamp, PHYS, LEVELS, levelById, create, tick, starsFor, boardInsert, hud, buttonsFor,
    swipeSample, touchAxis, touchRun, touchCarry, axisWithCarry, layoutMetrics, buttonRects, buttonsOk
  };
});
