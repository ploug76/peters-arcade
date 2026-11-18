/* Pure helpers for the crossover. The original game files are not imported. */
export const TRAIL = 72;
export const GAP = {x0: 900, x1: 1200};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export function ease(u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }

/** A run-jump uses Duncan's original numbers: vy -340, gravity 900, run 280. */
export function runJumpDistance() {
  const air = (2 * 340) / 900;
  return 280 * air;
}

export function swapWho(who) { return who === 'hope' ? 'duncan' : 'hope'; }

/**
 * Where the inactive character should stand: a few steps behind the leader,
 * and never in the ravine. If they were left on the near lip, they stay there.
 */
export function trailTarget(leadX, face, gap, trailX) {
  const dir = face || 1;
  const x = leadX - dir * TRAIL;
  if (!gap) return x;
  const nearLip = gap.x0 - 18;
  const farLip = gap.x1 + 18;
  const side = v => v < gap.x0 ? -1 : v > gap.x1 ? 1 : 0;
  const leadSide = side(leadX);
  const trailSide = trailX == null ? leadSide : side(trailX);
  if (leadSide !== 0 && trailSide !== 0 && leadSide !== trailSide) return trailSide < 0 ? nearLip : farLip;
  const inGap = v => v > gap.x0 && v < gap.x1;
  if (inGap(x)) return leadSide >= 0 ? farLip : nearLip;
  if (leadSide < 0 && x > gap.x0) return nearLip;
  if (leadSide > 0 && x < gap.x1) return farLip;
  return x;
}

/** Move only the follower. Returns how far they stepped. The lead is not touched. */
export function stepTrail(p, leadX, face, dt, gap) {
  const tx = trailTarget(leadX, face, gap, p.x);
  const dx = tx - p.x;
  const ad = Math.abs(dx);
  if (ad < 1.2) { p.x = tx; return 0; }
  let step = Math.sign(dx) * (ad > 170 ? 280 : ad > 48 ? 190 : 120) * dt;
  if (gap) {
    const next = p.x + step;
    if (p.x <= gap.x0 && next > gap.x0 && tx <= gap.x0) step = (gap.x0 - 18) - p.x;
    if (p.x >= gap.x1 && next < gap.x1 && tx >= gap.x1) step = (gap.x1 + 18) - p.x;
  }
  if (Math.abs(step) >= ad) { const moved = tx - p.x; p.x = tx; return moved; }
  p.x += step;
  return step;
}

/**
 * Original Constable Duncan phone pad, in viewport pixels.
 * Green ACTION is left of orange JUMP. Same size. Same bottom.
 * Portrait: both sit in the panel under the 62% play picture.
 */
export function padButtons(w, h, portrait, canvasH) {
  if (portrait) {
    const ch = canvasH == null ? Math.round(h * 0.62) : canvasH;
    const ph = h - ch;
    const big = Math.round(clamp(ph * 0.36, 92, 124));
    const s = Math.round(big * 0.84);
    const bottom = Math.round(clamp(ph * 0.14, 18, 46)) + 8;
    const jumpRight = 16;
    const actRight = 16 + s + 18;
    const jump = {s, right: jumpRight, bottom, x: w - jumpRight - s, y: h - bottom - s};
    const act = {s, right: actRight, bottom, x: w - actRight - s, y: h - bottom - s};
    return {jump, act, canvasH: ch, panelH: ph};
  }
  const big = Math.round(clamp(h * 0.21, 72, 96));
  const s = Math.round(big * 0.82);
  const bottom = 12;
  const jumpRight = 14;
  const actRight = 14 + s + 16;
  const jump = {s, right: jumpRight, bottom, x: w - jumpRight - s, y: h - bottom - s};
  const act = {s, right: actRight, bottom, x: w - actRight - s, y: h - bottom - s};
  return {jump, act, canvasH: h, panelH: 0};
}
