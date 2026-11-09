/* Rules that do not need a browser: categories, no duplicates, death keeps the bag, cables, finishable shores. */
const assert = require('assert');
const L = require('../logic.js');

assert.deepStrictEqual(L.CAT_IDS, ['tape', 'drive', 'files', 'laptop', 'thumb', 'reel']);
assert.strictEqual(L.STAGES.length, 5);
assert.ok(L.ITEMS.length >= 6);
assert.strictEqual(L.KIDS.length, 5);
const ids = {};
L.ITEMS.forEach(function (it) {
  assert.ok(!ids[it.id], 'duplicate id ' + it.id);
  ids[it.id] = 1;
  assert.ok(L.CAT_IDS.indexOf(it.cat) >= 0, it.id);
});
L.CAT_IDS.forEach(function (c) {
  assert.ok(L.ITEMS.some(function (it) { return it.cat === c; }), 'missing ' + c);
});

const save = L.fresh();
assert.strictEqual(L.collect(save, 'tape-beach').ok, true);
assert.strictEqual(L.collect(save, 'tape-beach').reason, 'duplicate');
assert.strictEqual(L.counts(save).tape.got, 1);
assert.strictEqual(L.collect(save, 'laptop-dock').reason, 'locked');
assert.strictEqual(L.punchPete(save).ok, true);
assert.strictEqual(L.punchPete(save).reason, 'duplicate');
assert.strictEqual(L.collect(save, 'laptop-dock').ok, true);
L.ITEMS.forEach(function (it) { L.collect(save, it.id); });
L.KIDS.forEach(function (k) { L.freeKid(save, k.id); });
assert.strictEqual(L.freeKid(save, 'kid-beach').reason, 'duplicate');
assert.strictEqual(L.kidCount(save).got, 5);
assert.strictEqual(L.isComplete(save), true);
assert.strictEqual(L.release(save).ok, true);
assert.strictEqual(L.release(save).reason, 'duplicate');
const kept = L.afterDeath(save);
assert.strictEqual(kept.released, true);
assert.strictEqual(Object.keys(kept.got).length, L.ITEMS.length);
assert.strictEqual(Object.keys(kept.kids).length, L.KIDS.length);
const wiped = L.fresh();
assert.strictEqual(Object.keys(wiped.got).length, 0);
assert.strictEqual(L.isComplete(wiped), false);

L.STAGES.forEach(function (st) {
  const reach = L.reachable(st);
  const cable = L.cableOk(st);
  assert.ok(reach.ok, st.name + ' unreachable ' + reach.missing.join(','));
  assert.ok(cable.ok, st.name + ' cable ' + cable.problems.join(','));
  assert.ok(st.cams[0].cable.some(function (p) { return p.via; }));
});

const round = L.normalize(JSON.parse(JSON.stringify(save)));
assert.strictEqual(round.got['reel-dock'], true);
assert.notStrictEqual(L.fresh().v, undefined);
console.log('LOGIC OK', L.ITEMS.length, 'items', L.KIDS.length, 'kids', L.STAGES.length, 'shores');
