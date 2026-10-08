# 2048 — Browser Game

A small, dependency-free 2048 game built with HTML, CSS, and vanilla JavaScript.

## Run

Open `src/2048.html` in a modern browser. No server or build step is required.

## Controls

- Arrow keys
- Swipe on the board
- On-screen direction buttons

## Rules

The board is 4×4. Equal tiles merge, each tile can merge only once per move, and every successful move spawns a new tile: `2` (90%) or `4` (10%). Merges increase the score by the value of the resulting tile.

## Tests

The game logic and page/style contracts use Node.js built-in tests; no test dependencies are required:

```sh
node --check src/2048.js
node --test tests/*.test.js
```

`tests/2048-browser-smoke.html` is a browser smoke fixture for controls and the narrow-screen layout.
