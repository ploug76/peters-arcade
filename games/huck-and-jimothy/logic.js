/* Huck X & Jimothy Timothy — Chapter 1 simulation.
   Pure logic: no DOM, no canvas. Shared by the browser game and node tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HuckGame = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const GROUND = 480;

  const H = {
    huck: 78,
    jt: 42,
    huckW: 26,
    jtW: 22
  };

  const HUCK_SPEC = {
    hip: 39,
    shoulder: 55,
    head: 67,
    thigh: 20,
    shin: 20,
    upper: 14,
    fore: 13,
    stride: 14,
    armSwing: 13
  };

  const JT_SPEC = {
    hip: 18,
    shoulder: 27,
    head: 34,
    thigh: 10,
    shin: 10,
    upper: 8,
    fore: 7,
    stride: 12,
    armSwing: 7
  };

  const LEVEL = {
    ground: GROUND,
    worldW: 6600,
    startX: 150,
    pit: { x: 1200, w: 100 },
    grounds: [
      { x: 0, w: 1200 },
      { x: 1300, w: 5400 }
    ],
    platforms: [
      { x: 1880, y: GROUND - 108, w: 200, h: 16 },
      { x: 2140, y: GROUND - 196, w: 170, h: 16 }
    ],
    climbs: [
      { x: 2088, y: GROUND - 196, w: 48, h: 210, platX: 2160, platY: GROUND - 196 }
    ],
    squeeze: { x: 3000, w: 120, ceil: GROUND - 46 },
    crank: { x: 3060 },
    lever: { x: 3220 },
    sand: { x: 4300, w: 820 },
    trash: [
      { id: 'battery', x: 1680, item: 'battery' },
      { id: 'tape', x: 5380, item: 'mixtape' }
    ],
    shop: { x: 5860 },
    jeep: { x: 6240 },
    cans: [
      { x: 460, y: GROUND - 26 },
      { x: 820, y: GROUND - 26 },
      { x: 1080, y: GROUND - 26 },
      { x: 1500, y: GROUND - 26 },
      { x: 1980, y: GROUND - 108 - 26 },
      { x: 2220, y: GROUND - 196 - 26 },
      { x: 2600, y: GROUND - 26 },
      { x: 3480, y: GROUND - 26 },
      { x: 3920, y: GROUND - 26 },
      { x: 4700, y: GROUND - 26 },
      { x: 5200, y: GROUND - 26 },
      { x: 5660, y: GROUND - 26 }
    ]
  };

  const SHOP = [
    { id: 'wax', name: 'Board wax', cost: 3, blurb: 'A steadier rope when you skitch' },
    { id: 'bike', name: 'BMX bike', cost: 5, blurb: 'Pedal faster across the flats' },
    { id: 'stereo', name: 'Pocket stereo', cost: 4, blurb: 'The music makes you jump' }
  ];

  const INTRO_LINES = [
    { who: 'Huck', text: 'A dust devil yoinked my mixtape. Side A. The good side.' },
    { who: 'J.T.', text: "If it landed in the trash, it's not stealing. It's a rescue." },
    { who: 'Huck', text: "Solar battery's junked too. Friday jam is in town. Let's move." }
  ];

  const TOW_LINES = [
    { who: 'J.T.', text: 'Rope is tied. I drive the Jeep. You ride the board.' },
    { who: 'Huck', text: 'Swap if you want the board. Far lane up, near lane down.' },
    { who: 'J.T.', text: "Hold the rope, not my tail. Radio porch is straight ahead." }
  ];

  const END_LINES = [
    { who: 'Huck', text: 'Radio porch. Tape in. Antenna up.' },
    { who: 'J.T.', text: "Side A still slaps. Told you trash was a library." },
    { who: 'Huck', text: "Chapter 1 is in the bag. Side B is still out in the wash." }
  ];

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }

  function body(state, who) {
    return who === 'huck' ? state.huck : state.jimothy;
  }

  function createBody(x) {
    return {
      x: x,
      y: GROUND,
      vx: 0,
      vy: 0,
      facing: 1,
      onGround: true,
      animDist: 0,
      animT: 0,
      coyote: 0.12,
      jumpBuf: 0,
      climbing: false,
      dig: 0,
      digItem: null
    };
  }

  function createState() {
    const cans = LEVEL.cans.map(function (c) {
      return { x: c.x, y: c.y, taken: false };
    });
    return {
      mode: 'title',
      _resume: 'play',
      who: 'huck',
      ride: false,
      cans: 0,
      canList: cans,
      upgrades: { wax: false, bike: false, stereo: false },
      items: { battery: false, crank: false, lever: false, mixtape: false },
      flags: {
        swappedOnce: false,
        crossedSand: false,
        towCelebrated: false,
        hintFence: false,
        hintSand: false,
        hintShed: false,
        chapterClear: false
      },
      objective: 'Find the mixtape. Side A.',
      dialog: null,
      huck: createBody(LEVEL.startX),
      jimothy: createBody(LEVEL.startX),
      jimothyParked: true,
      huckLoco: 'walk',
      checkpoint: LEVEL.startX,
      message: '',
      messageT: 0,
      tow: null,
      time: 0,
      sfx: [],
      cam: { x: 0, y: 0 }
    };
  }

  function toast(state, text) {
    state.message = text;
    state.messageT = 2.6;
  }

  function sfx(state, name) {
    state.sfx.push(name);
    if (state.sfx.length > 8) state.sfx.shift();
  }

  function openDialog(state, lines, next) {
    state.mode = 'dialog';
    state.dialog = { lines: lines, i: 0, next: next };
  }

  function start(state) {
    if (state.mode !== 'title') return state;
    openDialog(state, INTRO_LINES, 'play');
    return state;
  }

  function advanceDialog(state) {
    const d = state.dialog;
    if (!d) {
      state.mode = 'play';
      return;
    }
    d.i += 1;
    if (d.i >= d.lines.length) {
      const next = d.next;
      state.dialog = null;
      if (next === 'tow') {
        state.tow = createTow();
        state.mode = 'tow';
        sfx(state, 'engine');
      } else if (next === 'ending') {
        state.mode = 'ending';
        state.flags.chapterClear = true;
        state.objective = 'Side A is on the radio.';
        sfx(state, 'win');
      } else {
        state.mode = next || 'play';
      }
    }
  }

  function solidsFor(state) {
    const list = [];
    const grounds = LEVEL.grounds;
    for (let i = 0; i < grounds.length; i++) {
      list.push({ x: grounds[i].x, y: GROUND, w: grounds[i].w, h: 900, ground: true });
    }
    const plats = LEVEL.platforms;
    for (let i = 0; i < plats.length; i++) {
      list.push({
        x: plats[i].x,
        y: plats[i].y,
        w: plats[i].w,
        h: plats[i].h,
        oneWay: true
      });
    }
    if (!state.items.lever) {
      const s = LEVEL.squeeze;
      list.push({ x: s.x, y: -600, w: s.w, h: s.ceil - (-600), squeeze: true });
    }
    list.push({ x: -80, y: -800, w: 80, h: 2200, wall: true });
    list.push({ x: LEVEL.worldW, y: -800, w: 80, h: 2200, wall: true });
    return list;
  }

  function overlapX(x, w, s) {
    const left = x - w / 2;
    const right = x + w / 2;
    return right > s.x && left < s.x + s.w;
  }

  function boxOverlap(x, footY, w, h, s) {
    const left = x - w / 2;
    const right = x + w / 2;
    const top = footY - h;
    const bot = footY;
    return right > s.x && left < s.x + s.w && bot > s.y && top < s.y + s.h;
  }

  function hasGround(x) {
    const g = LEVEL.grounds;
    for (let i = 0; i < g.length; i++) {
      if (x >= g[i].x && x <= g[i].x + g[i].w) return true;
    }
    return false;
  }

  function tightAt(x, height, state) {
    const solids = solidsFor(state);
    for (let i = 0; i < solids.length; i++) {
      const s = solids[i];
      if (s.oneWay || s.ground) continue;
      if (boxOverlap(x, GROUND, 20, height, s)) return true;
    }
    return false;
  }

  function pathClear(x0, x1, height, state) {
    const a = Math.min(x0, x1);
    const b = Math.max(x0, x1);
    if (b - a > 5000) return false;
    for (let x = a; x <= b; x += 12) {
      if (!hasGround(x)) return false;
      if (tightAt(x, height, state)) return false;
    }
    return true;
  }

  function nextObjective(state) {
    if (!state.items.battery) return 'Swap to J.T. and dig a solar battery out of the trash.';
    if (!state.items.crank) return 'Squeeze J.T. through the fence hole and grab the crank.';
    if (!state.items.lever) return 'Use the crank on the lever so Huck can pass.';
    if (!state.flags.crossedSand) return 'Cross the soft sand. J.T. carries Huck.';
    if (!state.items.mixtape) return 'Dig the mixtape out of the junk pile.';
    return 'Skitch the skateboard to the radio porch.';
  }

  function statsFor(state, who) {
    if (state.ride) {
      return { speed: 108, jump: 0, accel: 1100, fric: 1600, w: H.jtW, h: H.jt, climb: 0 };
    }
    if (who === 'jimothy') {
      return { speed: 132, jump: -470, accel: 1700, fric: 2200, w: H.jtW, h: H.jt, climb: 130 };
    }
    let speed = 188;
    let jump = -630;
    let fric = 2500;
    if (state.upgrades.stereo) jump -= 80;
    if (state.huckLoco === 'skate') {
      speed += 78;
      fric = 780;
    } else if (state.huckLoco === 'bike' && state.upgrades.bike) {
      speed += 64;
      fric = 1100;
    }
    return { speed: speed, jump: jump, accel: 2200, fric: fric, w: H.huckW, h: H.huck, climb: 115 };
  }

  function resolveX(b, w, h, vx, solids) {
    for (let i = 0; i < solids.length; i++) {
      const s = solids[i];
      if (s.oneWay) continue;
      if (!boxOverlap(b.x, b.y, w, h, s)) continue;
      if (vx > 0) b.x = s.x - w / 2 - 0.05;
      else if (vx < 0) b.x = s.x + s.w + w / 2 + 0.05;
      else {
        const mid = s.x + s.w / 2;
        if (b.x < mid) b.x = s.x - w / 2 - 0.05;
        else b.x = s.x + s.w + w / 2 + 0.05;
      }
      b.vx = 0;
    }
  }

  function resolveY(b, prevY, w, h, solids) {
    b.onGround = false;
    for (let i = 0; i < solids.length; i++) {
      const s = solids[i];
      if (!overlapX(b.x, w, s)) continue;
      if (s.oneWay) {
        if (b.vy < 0) continue;
        if (prevY > s.y + 1) continue;
        if (b.y >= s.y && prevY <= s.y + 0.5) {
          b.y = s.y;
          b.vy = 0;
          b.onGround = true;
        }
        continue;
      }
      if (!boxOverlap(b.x, b.y, w, h, s)) continue;
      const prevTop = prevY - h;
      if (b.vy >= 0 && prevY <= s.y + 1) {
        b.y = s.y;
        b.vy = 0;
        b.onGround = true;
      } else if (b.vy <= 0 && prevTop >= s.y + s.h - 1) {
        b.y = s.y + s.h + h;
        b.vy = 0;
      } else if (b.vy >= 0) {
        b.y = s.y;
        b.vy = 0;
        b.onGround = true;
      } else {
        b.y = s.y + s.h + h;
        b.vy = 0;
      }
    }
  }

  function onClimb(b, state) {
    const climbs = LEVEL.climbs;
    for (let i = 0; i < climbs.length; i++) {
      const c = climbs[i];
      if (b.x > c.x && b.x < c.x + c.w && b.y > c.y - 4 && b.y < c.y + c.h + 8) return c;
    }
    return null;
  }

  function simulateOne(state, who, held, pressed, dt, controlled) {
    const b = body(state, who);
    const st = statsFor(state, who);
    if (b.dig > 0) {
      b.dig -= dt;
      b.vx = 0;
      b.vy = 0;
      b.animT += dt;
      if (b.dig <= 0) {
        b.dig = 0;
        if (b.digItem && !state.items[b.digItem]) {
          state.items[b.digItem] = true;
          sfx(state, 'dig');
          if (b.digItem === 'battery') toast(state, 'Slightly used. Perfectly legal.');
          if (b.digItem === 'mixtape') toast(state, 'Side A, rescued from a can.');
        }
        b.digItem = null;
      }
      return;
    }

    const input = controlled ? held : {};
    let move = 0;
    if (input.left) move -= 1;
    if (input.right) move += 1;
    if (move !== 0) b.facing = move;

    const climb = controlled && !state.ride && input.up ? onClimb(b, state) : null;
    if (climb && (b.onGround || b.climbing || b.y > climb.y + 8)) {
      b.climbing = true;
      b.vy = -st.climb;
      b.vx = 0;
      b.y += b.vy * dt;
      b.animT += dt;
      b.animDist += 40 * dt;
      if (b.y <= climb.platY + 2) {
        b.y = climb.platY;
        b.x = climb.platX;
        b.vy = 0;
        b.vx = 0;
        b.onGround = true;
        b.climbing = false;
      }
      return;
    }
    b.climbing = false;

    if (move !== 0) {
      b.vx += move * st.accel * dt;
      b.vx = clamp(b.vx, -st.speed, st.speed);
    } else {
      const f = st.fric * dt;
      if (Math.abs(b.vx) <= f) b.vx = 0;
      else b.vx -= Math.sign(b.vx) * f;
    }

    if (controlled && pressed && pressed.jump) b.jumpBuf = 0.14;
    if (b.onGround) b.coyote = 0.12;
    else b.coyote -= dt;
    if (b.jumpBuf > 0) b.jumpBuf -= dt;
    if (controlled && b.jumpBuf > 0 && b.coyote > 0 && st.jump !== 0) {
      b.vy = st.jump;
      b.onGround = false;
      b.coyote = 0;
      b.jumpBuf = 0;
      sfx(state, 'jump');
    }

    b.vy += 1500 * dt;
    if (b.vy > 900) b.vy = 900;

    const solids = solidsFor(state);
    b.x += b.vx * dt;
    resolveX(b, st.w, st.h, b.vx, solids);
    const prevY = b.y;
    b.y += b.vy * dt;
    resolveY(b, prevY, st.w, st.h, solids);

    if (b.y > GROUND + 180) {
      b.x = state.checkpoint;
      b.y = GROUND;
      b.vx = 0;
      b.vy = 0;
      b.onGround = true;
      toast(state, 'Whoops. Dust yourself off.');
      sfx(state, 'fall');
    }

    if (b.onGround) b.animDist += Math.abs(b.vx) * dt;
    b.animT += dt;

    if (controlled && b.onGround && hasGround(b.x) && !tightAt(b.x, st.h, state)) {
      if (b.x > state.checkpoint - 400) state.checkpoint = b.x;
    }
  }

  function near(ax, ay, bx, by, r) {
    return Math.abs(ax - bx) <= r && Math.abs(ay - by) <= r;
  }

  function activeWho(state) {
    return state.ride ? 'jimothy' : state.who;
  }

  function contextLabel(state) {
    if (state.mode === 'tow') return 'HONK';
    if (state.mode !== 'play') return 'ACT';
    const who = activeWho(state);
    const b = body(state, who);
    if (state.ride) return 'RIDE';
    if (who === 'jimothy') {
      for (let i = 0; i < LEVEL.trash.length; i++) {
        const t = LEVEL.trash[i];
        if (!state.items[t.item] && near(b.x, b.y, t.x, GROUND, 48)) return 'DIG';
      }
      if (!state.items.lever && state.items.crank && near(b.x, b.y, LEVEL.lever.x, GROUND, 46)) return 'LEVER';
    }
    const sandX = LEVEL.sand.x;
    if (!state.flags.crossedSand && !state.ride && b.x > sandX - 140 && b.x < sandX + 90) return 'RIDE';
    if (state.items.battery && state.items.mixtape && state.flags.crossedSand && near(b.x, b.y, LEVEL.jeep.x, GROUND, 70)) return 'JEEP';
    if (near(b.x, b.y, LEVEL.shop.x, GROUND, 56)) return 'SHOP';
    if (who === 'huck') {
      if (state.huckLoco === 'walk') return 'SKATE';
      if (state.huckLoco === 'skate') return state.upgrades.bike ? 'BIKE' : 'WALK';
      return 'WALK';
    }
    return 'ACT';
  }

  function doSwap(state) {
    if (state.mode === 'tow' && state.tow) {
      state.tow.controlling = state.tow.controlling === 'jeep' ? 'board' : 'jeep';
      toast(state, state.tow.controlling === 'jeep' ? 'Steering the Jeep' : 'Leaning the board');
      sfx(state, 'swap');
      return { ok: true };
    }
    if (state.mode !== 'play') return { ok: false };
    if (state.ride) {
      toast(state, 'Hop off once the sand lets go.');
      return { ok: false, msg: 'riding' };
    }
    if (state.jimothy.dig > 0) return { ok: false, msg: 'digging' };

    if (state.who === 'huck') {
      state.huckLoco = 'walk';
      if (!state.jimothyParked) {
        state.who = 'jimothy';
        sfx(state, 'swap');
        toast(state, "Back to J.T.");
        return { ok: true };
      }
      state.who = 'jimothy';
      state.jimothyParked = false;
      let nx = state.huck.x + 34 * (state.huck.facing || 1);
      if (tightAt(nx, H.jt, state) || !hasGround(nx)) nx = state.huck.x;
      state.jimothy.x = nx;
      state.jimothy.y = state.huck.y;
      state.jimothy.vx = 0;
      state.jimothy.vy = 0;
      state.jimothy.facing = state.huck.facing;
      sfx(state, 'swap');
      if (!state.flags.swappedOnce) {
        state.flags.swappedOnce = true;
        toast(state, "It's not stealing if it's in the trash.");
      } else {
        toast(state, "J.T.'s out.");
      }
      return { ok: true };
    }

    const far = Math.abs(state.huck.x - state.jimothy.x) > 96 || Math.abs(state.huck.y - state.jimothy.y) > 48;
    if (!far && tightAt(state.jimothy.x, H.huck, state)) {
      toast(state, 'Too tight for Huck. Come back out.');
      return { ok: false, msg: 'tight' };
    }
    if (!far && pathClear(state.huck.x, state.jimothy.x, H.huck, state) && !tightAt(state.jimothy.x, H.huck, state)) {
      state.huck.x = state.jimothy.x;
      state.huck.y = state.jimothy.y;
      state.jimothyParked = true;
      state.who = 'huck';
      toast(state, "Back to Huck.");
      sfx(state, 'swap');
      return { ok: true };
    }
    state.who = 'huck';
    state.jimothyParked = false;
    toast(state, far ? "Huck's waiting back there." : 'Back to Huck.');
    sfx(state, 'swap');
    return { ok: true };
  }

  function tryRide(state) {
    if (state.ride || state.flags.crossedSand) return false;
    const hx = state.huck.x;
    const jx = state.jimothy.x;
    if (Math.abs(hx - jx) > 220) {
      toast(state, 'Get the two of you together first.');
      return false;
    }
    if (Math.abs(state.huck.y - state.jimothy.y) > 70) {
      toast(state, 'Same ground, then hop on.');
      return false;
    }
    const edge = LEVEL.sand.x;
    const nearEdge = (hx > edge - 160 && hx < edge + 100) || (jx > edge - 160 && jx < edge + 100);
    if (!nearEdge) {
      toast(state, 'The soft sand starts just ahead.');
      return false;
    }
    state.ride = true;
    state.who = 'jimothy';
    state.jimothyParked = false;
    state.huckLoco = 'walk';
    state.jimothy.x = Math.min(Math.max(jx, edge - 20), edge + 10);
    state.huck.x = state.jimothy.x;
    state.huck.y = state.jimothy.y;
    state.huck.vx = 0;
    toast(state, 'If anyone asks, this was your idea.');
    sfx(state, 'ride');
    return true;
  }

  function doAction(state, pressed) {
    if (!pressed || !pressed.action) return;
    if (state.mode === 'tow') {
      sfx(state, 'honk');
      if (state.tow) state.tow.honk = 0.35;
      return;
    }
    if (state.mode !== 'play') return;
    const who = activeWho(state);
    const b = body(state, who);
    if (b.dig > 0) return;

    if (who === 'jimothy' && !state.ride) {
      for (let i = 0; i < LEVEL.trash.length; i++) {
        const t = LEVEL.trash[i];
        if (!state.items[t.item] && near(b.x, b.y, t.x, GROUND, 48)) {
          b.dig = 0.55;
          b.digItem = t.item;
          b.vx = 0;
          toast(state, 'Digging. Elbows in.');
          return;
        }
      }
      if (!state.items.lever && state.items.crank && near(b.x, b.y, LEVEL.lever.x, GROUND, 46)) {
        state.items.lever = true;
        toast(state, "Gate's open. Huck owes you a soda.");
        sfx(state, 'lever');
        return;
      }
    }

    if (!state.ride && !state.flags.crossedSand) {
      const sandX = LEVEL.sand.x;
      if (b.x > sandX - 140 && b.x < sandX + 90) {
        if (state.who !== 'jimothy' || state.jimothyParked) {
          toast(state, 'Swap to J.T., then press Ride.');
          return;
        }
        tryRide(state);
        return;
      }
    }

    if (state.items.battery && state.items.mixtape && state.flags.crossedSand && near(b.x, b.y, LEVEL.jeep.x, GROUND, 70)) {
      openDialog(state, TOW_LINES, 'tow');
      return;
    }

    if (near(b.x, b.y, LEVEL.shop.x, GROUND, 56)) {
      state._resume = 'play';
      state.mode = 'shop';
      return;
    }

    if (who === 'huck' && !state.ride) {
      if (state.huckLoco === 'walk') {
        state.huckLoco = 'skate';
        toast(state, 'Board down.');
      } else if (state.huckLoco === 'skate') {
        if (state.upgrades.bike) {
          state.huckLoco = 'bike';
          toast(state, 'BMX. Pedal pedal.');
        } else {
          state.huckLoco = 'walk';
          toast(state, 'Shoes.');
        }
      } else {
        state.huckLoco = 'walk';
        toast(state, 'Shoes.');
      }
      sfx(state, 'swap');
    }
  }

  function collect(state) {
    const points = [];
    if (state.ride || (state.who === 'huck' && state.jimothyParked)) {
      points.push(state.ride ? state.jimothy : state.huck);
    } else {
      points.push(state.huck);
      points.push(state.jimothy);
    }
    for (let i = 0; i < state.canList.length; i++) {
      const c = state.canList[i];
      if (c.taken) continue;
      for (let p = 0; p < points.length; p++) {
        if (near(points[p].x, points[p].y, c.x, c.y + 20, 36)) {
          c.taken = true;
          state.cans += 1;
          sfx(state, 'can');
          break;
        }
      }
    }
    if (!state.items.crank && !state.ride) {
      const j = state.jimothy;
      if (!state.jimothyParked && near(j.x, j.y, LEVEL.crank.x, GROUND, 28)) {
        state.items.crank = true;
        toast(state, 'Got the crank.');
        sfx(state, 'can');
      }
    }
  }

  function hints(state) {
    const x = body(state, activeWho(state)).x;
    if (!state.flags.hintFence && x > 2700 && !state.items.lever) {
      state.flags.hintFence = true;
      toast(state, 'That hole is J.T. sized.');
    }
    if (!state.flags.hintSand && x > LEVEL.sand.x - 280 && !state.flags.crossedSand) {
      state.flags.hintSand = true;
      toast(state, 'Soft sand eats shoes. Swap to J.T., then Ride.');
    }
    if (!state.flags.hintShed && x > LEVEL.shop.x - 200) {
      state.flags.hintShed = true;
      toast(state, 'Shed shop. Cans are cash. Jeep is just past it.');
    }
  }

  function sandCheck(state) {
    const sand = LEVEL.sand;
    const end = sand.x + sand.w;
    if (state.ride) {
      if (state.jimothy.x > end + 16) {
        state.ride = false;
        state.who = 'huck';
        state.jimothyParked = true;
        state.flags.crossedSand = true;
        state.huck.x = state.jimothy.x;
        state.huck.y = state.jimothy.y;
        state.huck.vx = state.jimothy.vx;
        toast(state, "We're not speaking of this.");
        sfx(state, 'ride');
      }
      return;
    }
    if (state.huck.x > sand.x + 28 && state.huck.x < end) {
      state.huck.x = sand.x + 28;
      state.huck.vx = 0;
      if (state.jimothyParked) {
        state.jimothy.x = state.huck.x;
        state.jimothy.vx = 0;
      }
      if (state.who === 'huck' && state.messageT < 1.2) {
        toast(state, 'Huck sinks. Somebody lighter has to carry him.');
      }
    }
  }

  function followJimothy(state, dt) {
    if (state.ride || state.who !== 'huck' || state.jimothyParked || state.jimothy.dig > 0) return;
    if (Math.abs(state.huck.y - state.jimothy.y) > 80) return;
    if (!pathClear(state.huck.x, state.jimothy.x, H.jt, state)) return;
    const dx = state.huck.x - state.jimothy.x;
    if (Math.abs(dx) < 34 && Math.abs(state.huck.y - state.jimothy.y) < 36) {
      state.jimothyParked = true;
      state.jimothy.x = state.huck.x;
      state.jimothy.y = state.huck.y;
      state.jimothy.vx = 0;
      return;
    }
    const held = { left: dx < 0, right: dx > 0 };
    simulateOne(state, 'jimothy', held, {}, dt, true);
  }

  function step(state, held, pressed, dt) {
    held = held || {};
    pressed = pressed || {};
    dt = Math.max(0, Math.min(0.05, +dt || 0));
    state.time += dt;
    if (state.messageT > 0) state.messageT = Math.max(0, state.messageT - dt);

    if (pressed.pause && state.mode !== 'title' && state.mode !== 'dialog') {
      if (state.mode === 'pause') state.mode = state._resume || 'play';
      else if (state.mode === 'play' || state.mode === 'tow' || state.mode === 'shop') {
        state._resume = state.mode === 'shop' ? 'play' : state.mode;
        state.mode = 'pause';
      }
      return state;
    }

    if (state.mode === 'title') {
      if (pressed.start || pressed.action || pressed.jump) start(state);
      return state;
    }
    if (state.mode === 'pause' || state.mode === 'shop' || state.mode === 'ending') return state;

    if (state.mode === 'dialog') {
      if (pressed.action || pressed.jump || pressed.start) advanceDialog(state);
      state.huck.animT += dt;
      state.jimothy.animT += dt;
      return state;
    }

    if (state.mode === 'tow') {
      if (!state.tow) state.tow = createTow();
      if (pressed.swap) doSwap(state);
      if (pressed.action) doAction(state, pressed);
      stepTow(state.tow, held, dt, state.upgrades);
      if (state.tow.done && !state.flags.towCelebrated) {
        state.flags.towCelebrated = true;
        state.cans += state.tow.collected;
        openDialog(state, END_LINES, 'ending');
      }
      state.objective = 'Skitch the skateboard to the radio porch.';
      return state;
    }

    if (pressed.swap) doSwap(state);
    doAction(state, pressed);

    if (state.ride) {
      simulateOne(state, 'jimothy', held, pressed, dt, true);
      state.huck.x = state.jimothy.x;
      state.huck.y = state.jimothy.y;
      state.huck.vx = state.jimothy.vx;
      state.huck.vy = state.jimothy.vy;
      state.huck.onGround = state.jimothy.onGround;
      state.huck.facing = state.jimothy.facing;
      state.huck.animDist = state.jimothy.animDist;
      state.huck.animT = state.jimothy.animT;
    } else if (state.who === 'huck' && state.jimothyParked) {
      simulateOne(state, 'huck', held, pressed, dt, true);
      state.jimothy.x = state.huck.x;
      state.jimothy.y = state.huck.y;
      state.jimothy.vx = state.huck.vx;
      state.jimothy.facing = state.huck.facing;
      state.jimothy.animT += dt;
    } else if (state.who === 'huck') {
      simulateOne(state, 'huck', held, pressed, dt, true);
      followJimothy(state, dt);
    } else {
      simulateOne(state, 'jimothy', held, pressed, dt, true);
      simulateOne(state, 'huck', {}, {}, dt, false);
    }

    sandCheck(state);
    collect(state);
    hints(state);
    state.objective = nextObjective(state);
    return state;
  }

  function buy(state, id) {
    const item = SHOP.find(function (s) { return s.id === id; });
    if (!item) return { ok: false, msg: 'Nope.' };
    if (state.upgrades[id]) return { ok: false, msg: 'Already on the bike rack.' };
    if (state.cans < item.cost) return { ok: false, msg: 'Need more cans.' };
    state.cans -= item.cost;
    state.upgrades[id] = true;
    sfx(state, 'can');
    toast(state, item.name + '. Yours.');
    return { ok: true, msg: 'Yours.' };
  }

  function closeShop(state) {
    if (state.mode === 'shop') state.mode = 'play';
  }

  function defaultObstacles() {
    return [
      { d: 380, lane: 0.1, w: 0.28, kind: 'rock' },
      { d: 680, lane: -0.62, w: 0.26, kind: 'cactus' },
      { d: 980, lane: 0.72, w: 0.24, kind: 'weed' },
      { d: 1240, lane: -0.05, w: 0.3, kind: 'rock' },
      { d: 1560, lane: 0.58, w: 0.26, kind: 'cactus' },
      { d: 1840, lane: -0.7, w: 0.28, kind: 'rock' },
      { d: 2100, lane: 0.08, w: 0.32, kind: 'weed' },
      { d: 2360, lane: -0.48, w: 0.24, kind: 'cactus' }
    ];
  }

  function defaultTowCans() {
    return [
      { d: 520, lane: -0.15 },
      { d: 860, lane: 0.2 },
      { d: 1400, lane: -0.35 },
      { d: 1700, lane: 0.15 },
      { d: 2280, lane: 0.25 }
    ];
  }

  function createTow(opts) {
    opts = opts || {};
    const obstacles = (opts.obstacles || defaultObstacles()).map(function (o) {
      return { d: o.d, lane: o.lane, w: o.w, kind: o.kind || 'rock', jeepHit: false, boardHit: false };
    });
    const cans = (opts.cans || defaultTowCans()).map(function (c) {
      return { d: c.d, lane: c.lane, taken: false };
    });
    return {
      dist: 0,
      length: opts.length != null ? opts.length : 2700,
      speed: opts.speed != null ? opts.speed : 215,
      follow: opts.follow != null ? opts.follow : 120,
      jeepLane: 0,
      boardLane: 0,
      controlling: 'jeep',
      spin: 0,
      invuln: 0.4,
      wipeouts: 0,
      collected: 0,
      done: false,
      time: 0,
      honk: 0,
      obstacles: obstacles,
      cans: cans
    };
  }

  function wipe(tow) {
    tow.wipeouts += 1;
    tow.spin = 0.45;
    tow.invuln = 1.05;
  }

  function stepTow(tow, held, dt, upgrades) {
    if (!tow || tow.done) return tow;
    held = held || {};
    dt = Math.max(0, Math.min(0.05, +dt || 0));
    upgrades = upgrades || {};
    const wax = !!upgrades.wax;
    tow.time += dt;
    if (tow.honk > 0) tow.honk -= dt;

    let steer = 0;
    if (held.up || held.left) steer -= 1;
    if (held.down || held.right) steer += 1;
    if (steer > 1) steer = 1;
    if (steer < -1) steer = -1;

    if (tow.spin > 0) {
      tow.spin -= dt;
    } else if (tow.controlling === 'jeep') {
      const rate = 1.85;
      tow.jeepLane = clamp(tow.jeepLane + steer * rate * dt, -1, 1);
      const spring = wax ? 3.6 : 0.55;
      tow.boardLane += (tow.jeepLane - tow.boardLane) * Math.min(1, spring * dt);
    } else {
      const rate = wax ? 3.1 : 2.25;
      tow.boardLane = clamp(tow.boardLane + steer * rate * dt, -1, 1);
      const maxRope = wax ? 0.82 : 0.55;
      const delta = tow.boardLane - tow.jeepLane;
      if (Math.abs(delta) > maxRope) tow.boardLane = tow.jeepLane + Math.sign(delta) * maxRope;
    }
    tow.jeepLane = clamp(tow.jeepLane, -1, 1);
    tow.boardLane = clamp(tow.boardLane, -1, 1);

    const speed = tow.spin > 0 ? tow.speed * 0.4 : tow.speed;
    tow.dist += speed * dt;

    if (tow.invuln > 0) tow.invuln -= dt;
    else {
      for (let i = 0; i < tow.obstacles.length; i++) {
        const ob = tow.obstacles[i];
        if (!ob.jeepHit && Math.abs(ob.d - tow.dist) < 18 && Math.abs(ob.lane - tow.jeepLane) < ob.w + 0.16) {
          ob.jeepHit = true;
          wipe(tow);
        }
        const boardD = tow.dist - tow.follow;
        if (!ob.boardHit && Math.abs(ob.d - boardD) < 16 && Math.abs(ob.lane - tow.boardLane) < ob.w + 0.12) {
          ob.boardHit = true;
          wipe(tow);
        }
      }
    }

    for (let i = 0; i < tow.cans.length; i++) {
      const c = tow.cans[i];
      if (c.taken) continue;
      const boardD = tow.dist - tow.follow;
      if (Math.abs(c.d - tow.dist) < 16 && Math.abs(c.lane - tow.jeepLane) < 0.22) c.taken = 'jeep';
      else if (Math.abs(c.d - boardD) < 16 && Math.abs(c.lane - tow.boardLane) < 0.22) c.taken = 'board';
      if (c.taken) tow.collected += 1;
    }

    if (tow.dist >= tow.length) tow.done = true;
    return tow;
  }

  function ik(hipX, hipY, footX, footY, l1, l2, poleSign) {
    let dx = footX - hipX;
    let dy = footY - hipY;
    const raw = Math.hypot(dx, dy) || 0.0001;
    const max = l1 + l2 - 0.35;
    const min = Math.abs(l1 - l2) + 0.8;
    const dist = Math.max(min, Math.min(max, raw));
    const ux = dx / raw;
    const uy = dy / raw;
    const tx = hipX + ux * dist;
    const ty = hipY + uy * dist;
    const cos = clamp((l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist), -1, 1);
    const bend = Math.acos(cos);
    const base = Math.atan2(ty - hipY, tx - hipX);
    const candidates = [bend, -bend].map(function (ang) {
      return {
        x: hipX + Math.cos(base + ang) * l1,
        y: hipY + Math.sin(base + ang) * l1
      };
    });
    const knee = (candidates[0].x - hipX) * poleSign >= (candidates[1].x - hipX) * poleSign ? candidates[0] : candidates[1];
    return { knee: knee, foot: { x: tx, y: ty }, reached: raw <= max + 0.05 };
  }

  function poseFor(opts) {
    opts = opts || {};
    const spec = opts.spec || HUCK_SPEC;
    const animDist = opts.animDist || 0;
    const vx = opts.vx || 0;
    const onGround = opts.onGround !== false;
    const mode = opts.mode || 'walk';
    const animT = opts.animT || 0;
    const D = spec.stride;
    const cycle = D * 2;
    const moving = onGround && Math.abs(vx) > 14 && (mode === 'walk' || mode === 'ride');
    const phase = moving ? ((animDist % cycle) + cycle) % cycle / cycle : 0;
    const bob = moving ? Math.sin(phase * Math.PI * 2) * 1.4 : Math.sin(animT * 2.2) * 0.6;
    const hipY = -spec.hip + bob;
    const shoulderY = -spec.shoulder + bob;
    const headY = -spec.head + bob;

    function legAt(phaseShift) {
      const p = (phase + phaseShift) % 1;
      let offset = phaseShift === 0 ? -6 : 6;
      let lift = 0;
      let stance = false;
      if (mode === 'air') {
        offset = phaseShift === 0 ? -4 : 10;
        lift = phaseShift === 0 ? 8 : 14;
      } else if (mode === 'skate') {
        offset = phaseShift === 0 ? -8 : 9;
        lift = 6;
      } else if (mode === 'sit') {
        offset = phaseShift === 0 ? 8 : 16;
        lift = 6;
      } else if (mode === 'climb') {
        const s = (animT * 2 + phaseShift) % 1;
        offset = 4 + Math.sin(s * Math.PI * 2) * 3;
        lift = 4 + (s < 0.5 ? Math.sin(s * Math.PI) * 10 : 0);
      } else if (mode === 'dig') {
        offset = phaseShift === 0 ? -8 : 6;
        lift = phaseShift === 0 ? 2 : 0;
      } else if (mode === 'bike') {
        const ang = animDist / 9 + (phaseShift === 0 ? 0 : Math.PI);
        offset = 2 + Math.cos(ang) * 6;
        lift = 8 + Math.sin(ang) * 6;
      } else if (!moving) {
        offset = phaseShift === 0 ? -7 : 7;
        lift = 0;
        stance = true;
      } else if (p < 0.5) {
        offset = D / 2 - 2 * p * D;
        lift = 0;
        stance = true;
      } else {
        const t = (p - 0.5) / 0.5;
        offset = -D / 2 + t * D;
        lift = Math.sin(t * Math.PI) * 13;
        stance = false;
      }
      const hip = { x: 0, y: hipY };
      const foot = { x: offset, y: -lift };
      const solved = ik(hip.x, hip.y, foot.x, foot.y, spec.thigh, spec.shin, 1);
      return {
        phase: p,
        offset: offset,
        lift: lift,
        stance: stance,
        hip: hip,
        knee: solved.knee,
        foot: solved.foot,
        intended: foot,
        reached: solved.reached
      };
    }

    function armAt(phaseShift, oppositeLegOffset) {
      const p = (phase + phaseShift) % 1;
      let handX = 0;
      let handY = shoulderY + 22;
      if (mode === 'air') {
        handX = phaseShift === 0 ? -8 : 6;
        handY = shoulderY - 8;
      } else if (mode === 'climb') {
        const s = (animT * 2 + phaseShift) % 1;
        handX = 6;
        handY = shoulderY - 8 - (s < 0.5 ? 10 : 0);
      } else if (mode === 'dig') {
        handX = 10;
        handY = shoulderY + 16;
      } else if (mode === 'sit') {
        handX = phaseShift === 0 ? -4 : 8;
        handY = shoulderY + 8;
      } else if (mode === 'skate' || mode === 'bike') {
        const wave = Math.sin(animT * 8) * 3;
        handX = (phaseShift === 0 ? -10 : 12) + wave;
        handY = shoulderY + 14;
      } else if (!moving) {
        const sway = Math.sin(animT * 2 + phaseShift) * 1.4;
        handX = (phaseShift === 0 ? -3 : 4) + sway;
        handY = shoulderY + 22;
      } else {
        handX = -Math.cos(p * Math.PI * 2) * spec.armSwing;
        handY = shoulderY + 18 - Math.max(0, Math.sin(p * Math.PI * 2)) * 5;
      }
      const shoulder = { x: 0, y: shoulderY };
      const solved = ik(shoulder.x, shoulder.y, handX, handY, spec.upper, spec.fore, mode === 'walk' || mode === 'ride' ? -1 : 1);
      return {
        phase: p,
        offset: handX,
        oppositeHint: oppositeLegOffset,
        shoulder: shoulder,
        elbow: solved.knee,
        hand: solved.foot
      };
    }

    const backLeg = legAt(0);
    const frontLeg = legAt(0.5);
    const backArm = armAt(0, backLeg.offset);
    const frontArm = armAt(0.5, frontLeg.offset);

    return {
      mode: mode,
      phase: phase,
      moving: moving,
      bob: bob,
      hip: { x: 0, y: hipY },
      shoulder: { x: 0, y: shoulderY },
      head: { x: 6, y: headY },
      legs: [backLeg, frontLeg],
      arms: [backArm, frontArm],
      spec: spec
    };
  }

  function jointAngle(a, b, c) {
    const v1x = a.x - b.x;
    const v1y = a.y - b.y;
    const v2x = c.x - b.x;
    const v2y = c.y - b.y;
    const d = Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y) || 1;
    const cos = clamp((v1x * v2x + v1y * v2y) / d, -1, 1);
    return Math.acos(cos) * 180 / Math.PI;
  }

  function reset(state) {
    const fresh = createState();
    Object.keys(state).forEach(function (k) { delete state[k]; });
    Object.assign(state, fresh);
    return state;
  }

  return {
    GROUND: GROUND,
    H: H,
    LEVEL: LEVEL,
    SHOP: SHOP,
    HUCK_SPEC: HUCK_SPEC,
    JT_SPEC: JT_SPEC,
    INTRO_LINES: INTRO_LINES,
    TOW_LINES: TOW_LINES,
    END_LINES: END_LINES,
    createState: createState,
    step: step,
    start: start,
    solidsFor: solidsFor,
    hasGround: hasGround,
    tightAt: tightAt,
    pathClear: pathClear,
    nextObjective: nextObjective,
    statsFor: statsFor,
    contextLabel: contextLabel,
    doSwap: doSwap,
    buy: buy,
    closeShop: closeShop,
    createTow: createTow,
    stepTow: stepTow,
    poseFor: poseFor,
    jointAngle: jointAngle,
    reset: reset,
    clamp: clamp
  };
});
