/* Single / double / triple tap. A triple fires forgiveness once and does not also fire punches. */
export function createTapCombo(opts = {}) {
  const windowMs = opts.windowMs ?? 340;
  let times = [];
  let timerAt = null;
  let locked = false;
  const log = [];

  function resolve(now) {
    if (!times.length || timerAt == null || now < timerAt) return;
    const n = times.length;
    times = [];
    timerAt = null;
    if (n === 1) {
      log.push('punch');
      if (opts.onSingle) opts.onSingle();
    } else if (n === 2) {
      log.push('punch', 'punch');
      if (opts.onDouble) opts.onDouble();
    }
  }

  function press(now) {
    if (locked) {
      log.push('ignored');
      return {accepted: false, reason: 'locked'};
    }
    if (times.length && now - times[times.length - 1] > windowMs) resolve(timerAt);
    if (times.length && now - times[times.length - 1] > windowMs) {
      times = [];
      timerAt = null;
    }
    times.push(now);
    if (times.length >= 3) {
      times = [];
      timerAt = null;
      const ok = opts.onTriple ? opts.onTriple() !== false : true;
      if (ok) {
        locked = true;
        log.push('forgiveness');
        return {accepted: true, kind: 'triple'};
      }
      log.push('rejected-triple');
      return {accepted: false, reason: 'rejected'};
    }
    timerAt = now + windowMs;
    return {accepted: true, kind: 'pending', count: times.length};
  }

  function tick(now) { resolve(now); }

  function unlock() { locked = false; }

  function reset() {
    times = [];
    timerAt = null;
    locked = false;
  }

  return {
    press,
    tick,
    unlock,
    reset,
    log,
    counts: () => ({locked, pending: times.length, timerAt})
  };
}
