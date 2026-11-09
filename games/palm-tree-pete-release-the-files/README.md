# Palm Tree Pete — Release the Files

Volume 3 of the fictional Palm Tree Pete island games. This folder is a separate review build. It does not replace Volume 2, and it is not linked from the arcade hub.

**Player-facing title:** Palm Tree Pete — Release the Files

## What you do

Sneak and punch across five shores. Free the kids. Search coolers, crates, desks, cabinets and lockers for videotapes, hard drives, stacks of paper files, laptops and thumb drives. Each shore has a camera with a cable you can walk. The cable runs back to a recorder. ACTION at that machine ejects a master reel. When the bag is full and every kid is safe, board the getaway boat and release the files.

Shores: Cable Beach, Jungle Wire, Villa Archive, Striped Plaza, Getaway Docks.

Progress is stored in this browser under `ptp3-release-the-files-v1`. That key is not the Volume 1 or Volume 2 save. Being spotted does not empty the bag, and picking up the same object twice does not count twice.

## Controls

On-screen pad: arrows, orange **JUMP**, green **ACTION**. Two fingers can hold a direction and JUMP together. The layout refits for portrait, landscape, and a turn mid-game.

Keyboard: arrows or WASD, Space jump, X / J / E action, C evidence bag, P pause. A game controller uses the stick, A to jump, and X or B for action.

## Credits

The hero, Palm Tree Pete, the goons, the kids, their clothing, the palette, and the painted island scenes use the original character rigs from *Rescue from Palm Tree Pete's Island* (Volume 1). Volume 2's art-matched rig (`art.js` on the art-match branch of the Volume 2 repo) is the island reference used here. Volume 3 draws those same rigs in new poses — punches, pointing, and finger-guns — and adds the evidence props and cable routes.

Source games, read-only references for this build:

- Volume 1: https://github.com/ploug76/escape-from-palm-tree-petes-island
- Volume 2: https://github.com/ploug76/escape-from-palm-tree-petes-island-vol-2
- Art-matched rig: branch `cursor/match-vol1-art-8a90` on the Volume 2 repo

Fonts shipped with the game: Lilita One and Anton, both SIL Open Font License.

This is a fictional cartoon adventure. It does not depict real people or real allegations.

## Tests

```
node tests/logic.test.cjs
NODE_PATH=/tmp/node_modules node tests/play.test.cjs
```

`play.test.cjs` drives desktop Chrome and a simulated phone viewport. It is not a physical-device test.
