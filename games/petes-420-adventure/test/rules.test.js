const test = require('node:test');
const assert = require('node:assert/strict');
const RULES = require('../rules.js');

test('the three rooms still solve the way they used to', function () {
  assert.doesNotThrow(function () { RULES.selfCheck(); });
  assert.equal(RULES.AREAS.length, 3);
  assert.equal(RULES.AREAS[0].wrong.role, 'Counter Pal');
  assert.equal(RULES.AREAS[0].right.itemName, 'Seed Pouch');
  assert.equal(RULES.AREAS[1].wrong.role, 'Moth');
  assert.equal(RULES.AREAS[1].right.itemName, 'Lounge Token');
  assert.equal(RULES.AREAS[2].wrong.role, 'Parrot');
  assert.equal(RULES.AREAS[2].right.itemName, 'Chill Stamp');
  assert.deepEqual(RULES.KIT_GOAL, ['tip', 'paper', 'flower', 'twist']);
});

test('no room lists a price', function () {
  var blob = JSON.stringify(RULES.AREAS);
  assert.equal(/\$\d|\bdollars\b|\bfor sale\b/i.test(blob), false);
  assert.equal(blob.includes('Nothing here has a price'), true);
  assert.equal(blob.includes('It is not money'), true);
});
