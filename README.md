# turkey-run-escape

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/xuldqi/turkey-run-escape/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/xuldqi/turkey-run-escape/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

Gobble Run — The Great Turkey Escape. A Thanksgiving escape runner for the browser, written from scratch with zero dependencies: no engine, no assets, every sprite drawn in canvas paths and every sound synthesized live with WebAudio. Gobbles McFeather the turkey bolts from the farm the week before Thanksgiving: 1,500 metres of farmyard, cornfield and kitchen yard between her and the Wild Woods. Jump the hay bales, fences, pumpkins and preheated ovens; duck the knife racks and time the swinging carving knife; grab corn for points, graze obstacles for near-miss bonuses, and hide in bushes to shake the farmer off your tail. He surges every time you stumble — three lost feathers, or one grab, and it's dinner.

## Run it

```sh
node serve.ts                       # play it: http://localhost:8080
MAKEFUN_OUTPUT_DIR=out node main.ts # hand-in build: game/ + screenshots/ + dossier.json into ./out
```

Requires Node.js 22.18 or later. `main.ts` is the hand-in entrypoint: it copies `game/` and `screenshots/` into the output directory (`/output` in the grader, `$MAKEFUN_OUTPUT_DIR` elsewhere) and writes `dossier.json` with the vendored make.fun library — deterministically, in well under a second. The staged views used for the screenshots live at `/?shot=start`, `/?shot=play`, `/?shot=end` and `/?shot=caught` (see `shots.json`).

## How to play

- **Space / ↑ / W / Click** — jump; press again mid-air to flap (double jump)
- **↓ / S** — duck under knife racks and the swinging knife; in the air it drops you fast
- **P** — pause · **M** — mute · touch buttons appear on touch screens
- Reach the Wild Woods gate at 1,500 m to escape. Score is distance + corn (25, golden 100) + near-miss bonuses (10) + an escape bonus of 500 plus 100 per feather left.

## Layout

- `main.ts` — hand-in entrypoint (Node 22, standard library only)
- `serve.ts` — tiny static server for playing `game/` locally
- `game/world.js` — seeded course generator: the three stages, obstacle mix, corn arcs, hiding bushes
- `game/sprites.js` — all canvas art: Gobbles, the farmer, obstacles, stage backdrops, the Wild Woods gate
- `game/audio.js` — WebAudio synth: gobbles, flaps, corn pops, thuds, alarms, jingles
- `game/game.js` — the game: run physics, farmer chase AI, collisions, scoring, HUD, shot staging
- `game/index.html`, `game/style.css` — page shell and HUD
- `screenshots/` — the game's screenshots (first by name is the cover)
- `vendor/makefun-game.ts` — the make.fun kit's dossier library, unchanged

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards</sub>
