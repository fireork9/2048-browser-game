const fs = require('node:fs');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const css = fs.readFileSync('src/2048.css', 'utf8');

test('defines the game palette, board geometry, and system font', () => {
  assert.match(css, /background:\s*#faf8ef/);
  assert.match(css, /font-family:\s*system-ui, sans-serif/);
  assert.match(css, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(css, /aspect-ratio:\s*1/);
  assert.match(css, /gap:\s*12px/);
  assert.match(css, /padding:\s*12px/);
  assert.match(css, /width:\s*min\(100%, 460px\)/);
});

test('defines the specified tile colors and readable tile text', () => {
  const tileColors = [
    '#eee4da', '#ede0c8', '#f2b179', '#f59563', '#f67c5f', '#f65e3b',
    '#edcf72', '#edcc61', '#edc850', '#edc53f', '#edc22e', '#3c3a32',
  ];
  for (const color of tileColors) assert.ok(css.includes(color), `missing tile color ${color}`);
  assert.match(css, /color:\s*#3c3a32/);
  assert.match(css, /color:\s*#ffffff/);
  assert.match(css, /font-size:\s*48px/);
  assert.match(css, /font-size:\s*36px/);
  assert.match(css, /font-size:\s*28px/);
});

test('keeps controls touch-sized and defines mobile and keyboard focus styles', () => {
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /width:\s*56px/);
  assert.match(css, /@media\s*\(max-width:\s*492px\)/);
  assert.match(css, /width:\s*calc\(100vw - 32px\)/);
  assert.match(css, /outline:\s*3px solid #1f6feb/);
  assert.match(css, /\.game-board:focus-visible\s*\{[^}]*outline:\s*3px solid #1f6feb/);
  assert.match(css, /touch-action:\s*none/);
});

test('stacks the header controls on narrow screens to prevent overflow', () => {
  assert.match(css, /@media\s*\(max-width:\s*492px\)[\s\S]*\.game-header\s*\{[^}]*display:\s*grid/);
  assert.match(css, /#new-game\s*\{[^}]*width:\s*100%/);
});
