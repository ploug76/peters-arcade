/* Huck X and Jimothy — Chapter 1 data.
   The play shell is the Jimothy Timothy engine. This file is the chapter. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.RULES = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  var SHOP = [
    { id: 'wax', name: 'Board wax', cost: 2, blurb: 'The skateboard shrugs off a bump.' },
    { id: 'bike', name: 'BMX', cost: 3, blurb: 'It rolls onto the porch with you. Extra score.' },
    { id: 'stereo', name: 'Pocket stereo', cost: 2, blurb: 'The mixtape sounds bigger. Extra score.' }
  ];

  var LEVELS = [
    {
      id: '1', name: 'Backpack Alley', who: 'huck', theme: 'alley', song: 'play', par: 50, hearts: 3,
      plan: [
        'J.T. rides in the backpack.',
        'Walk the alley and press ACTION at a trash can to dig.',
        'One can is hiding the solar battery.',
        'Take the battery to the fence.'
      ],
      done: 'J.T.: Battery is in the pack. The fence is next.',
      banner: 'Dig the solar battery. J.T. rides in the pack.',
      w: 42, h: 12, ground: 10, player: 3, goal: 38,
      plats: [[26, 8, 3]],
      items: [[9, 10, 'can'], [15, 10, 'battery'], [21, 10, 'can'], [27, 8, 'can']],
      need: 'battery'
    },
    {
      id: '2', name: 'The Fence Hole', who: 'jt', theme: 'block', song: 'play', par: 45, hearts: 3, crawl: true,
      plan: [
        'Huck cannot fit. You are J.T. now.',
        'Squeeze under the fence.',
        'ACTION picks up the crank.',
        'Carry it to the gate.'
      ],
      done: 'J.T.: Gate is open. Huck can come through.',
      banner: 'Squeeze through. Huck does not fit.',
      w: 42, h: 12, ground: 10, player: 3, goal: 38,
      walls: [[16, 6, 3, 3]],
      items: [[24, 10, 'crank']],
      npcs: [[10, 'huck', ['I cannot fit through that hole.', 'You are the raccoon. I will wait.']]],
      need: 'crank'
    },
    {
      id: '3', name: 'Soft Sand', who: 'ride', theme: 'sand', song: 'play', par: 50, hearts: 3,
      plan: [
        'Huck sinks if he walks the sand alone.',
        'He sits on J.T. for the crossing.',
        'Jump the sand pits.',
        'Reach the far side together.'
      ],
      done: 'J.T.: Dry ground. Huck still has both shoes.',
      banner: 'Huck rides. The sand would swallow him.',
      w: 44, h: 12, ground: 10, player: 3, goal: 40,
      holes: [[14, 2], [26, 2]],
      plats: [[14, 8, 2], [26, 8, 2]],
      need: null
    },
    {
      id: '4', name: 'Junk and the Shed', who: 'jt', theme: 'alley', song: 'play', par: 55, hearts: 3,
      plan: [
        'Dig the junk pile. The mixtape is in there.',
        'The shed sells board wax, a BMX, and a pocket stereo.',
        'They cost cans, not money.',
        'Then head for the radio road.'
      ],
      done: 'J.T.: Tape is in the pack. The jeep is warmed up.',
      banner: 'Dig the mixtape. The shed is optional.',
      w: 44, h: 12, ground: 10, player: 3, goal: 40,
      items: [[12, 10, 'can'], [18, 10, 'tape'], [23, 10, 'can']],
      shed: 30,
      need: 'tape'
    },
    {
      id: '5', name: 'Radio Road', who: 'jeep', theme: 'night', song: 'play', par: 55, hearts: 5, speed: 230,
      plan: [
        'J.T. drives the solar jeep.',
        'Huck rides the skateboard on the rope. It lags behind.',
        'Jump the cactus. ACTION yanks the rope so the board dodges.',
        'Reach the radio porch.'
      ],
      done: 'The porch light is on. Side A can play.',
      banner: 'Steer the jeep. ACTION yanks the board.',
      w: 50, h: 12, ground: 10, player: 3, goal: 46,
      hazards: [
        { tx: 12, k: 'cactus' },
        { tx: 18, k: 'tumble', left: 15, right: 22 },
        { tx: 28, k: 'cactus' },
        { tx: 34, k: 'tumble', left: 31, right: 38 }
      ],
      need: 'tape'
    }
  ];

  function ready(spec, got, flags) {
    if (!spec.need) return true;
    got = got || {};
    flags = flags || {};
    return !!(got[spec.need] || flags[spec.need]);
  }

  return { SHOP: SHOP, LEVELS: LEVELS, ready: ready };
});
