const fs = require('node:fs');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const css = fs.readFileSync('src/2048.css', 'utf8');

test('defines the cyberpunk palette, board geometry, and paired typography', () => {
  const palette = ['#070b12', '#111a27', '#00f5d4', '#ff3cac', '#ffd166', '#eafbff'];
  for (const color of palette) assert.ok(css.includes(color), `missing design token ${color}`);
  assert.match(css, /font-family:\s*system-ui, sans-serif/);
  assert.match(css, /font-family:\s*ui-monospace/);
  assert.match(css, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(css, /aspect-ratio:\s*1/);
  assert.match(css, /gap:\s*12px/);
  assert.match(css, /padding:\s*12px/);
  assert.match(css, /width:\s*min\(100%, 460px\)/);
});

test('styles tile values with neon states and readable text', () => {
  assert.match(css, /\.game-cell\[data-value="2"\]\s*\{/);
  assert.match(css, /\.game-cell\[data-value="2048"\]/);
  assert.match(css, /color:\s*var\(--text-main\)/);
  assert.match(css, /font-size:\s*48px/);
  assert.match(css, /font-size:\s*36px/);
  assert.match(css, /font-size:\s*28px/);
});

test('adds distinct spawn and merge motion while respecting reduced motion', () => {
  assert.match(css, /data-effect="spawned"[^}]*animation:/);
  assert.match(css, /data-effect="merged"[^}]*animation:/);
  assert.match(css, /animation:\s*tile-spawn 180ms/);
  assert.match(css, /animation:\s*tile-merge 220ms/);
  assert.match(css, /@keyframes\s+tile-spawn/);
  assert.match(css, /@keyframes\s+tile-merge/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});

test('keeps controls touch-sized and defines mobile and keyboard focus styles', () => {
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /width:\s*56px/);
  assert.match(css, /@media\s*\(max-width:\s*492px\)/);
  assert.match(css, /width:\s*calc\(100vw - 32px\)/);
  assert.match(css, /outline:\s*3px solid var\(--amber\)/);
  assert.match(css, /\.game-board:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--amber\)/);
  assert.match(css, /touch-action:\s*none/);
});

test('stacks the header controls on narrow screens to prevent overflow', () => {
  assert.match(css, /@media\s*\(max-width:\s*492px\)[\s\S]*\.game-header\s*\{[^}]*display:\s*grid/);
  assert.match(css, /#new-game\s*\{[^}]*width:\s*100%/);
});
