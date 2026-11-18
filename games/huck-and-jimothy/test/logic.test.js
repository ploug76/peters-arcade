const test = require('node:test');
const assert = require('node:assert/strict');
const RULES = require('../rules.js');

test('chapter 1 has the five story beats', function () {
  assert.equal(RULES.LEVELS.length, 5);
  assert.equal(RULES.LEVELS[0].who, 'huck');
  assert.equal(RULES.LEVELS[0].need, 'battery');
  assert.equal(RULES.LEVELS[1].who, 'jt');
  assert.equal(RULES.LEVELS[1].crawl, true);
  assert.equal(RULES.LEVELS[1].need, 'crank');
  assert.ok(RULES.LEVELS[1].walls.length);
  assert.equal(RULES.LEVELS[2].who, 'ride');
  assert.ok(RULES.LEVELS[2].holes.length >= 2);
  assert.equal(RULES.LEVELS[3].need, 'tape');
  assert.ok(RULES.LEVELS[3].shed);
  assert.equal(RULES.LEVELS[4].who, 'jeep');
  assert.ok(RULES.LEVELS[4].hazards.length >= 3);
});

test('the porch waits for the mixtape', function () {
  var road = RULES.LEVELS[4];
  assert.equal(RULES.ready(road, {}, {}), false);
  assert.equal(RULES.ready(road, { tape: 1 }, {}), true);
  assert.equal(RULES.ready(road, {}, { tape: 1 }), true);
  assert.equal(RULES.ready(RULES.LEVELS[2], {}, {}), true);
});

test('the shed sells gear for cans, not money', function () {
  assert.deepEqual(RULES.SHOP.map(function (s) { return s.id; }), ['wax', 'bike', 'stereo']);
  RULES.SHOP.forEach(function (s) {
    assert.ok(s.cost >= 2 && s.cost <= 3);
    assert.equal(JSON.stringify(s).includes('$'), false);
  });
});
