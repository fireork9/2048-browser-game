const fs = require('node:fs');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const html = fs.readFileSync('src/2048.html', 'utf8');

test('declares a Russian page and loads local CSS and JavaScript', () => {
  assert.match(html, /<html lang="ru">/);
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
  assert.match(html, /<title>2048<\/title>/);
  assert.match(html, /href="2048\.css"/);
  assert.match(html, /src="2048\.js" defer/);
});

test('brands the game as a neon night-shift terminal', () => {
  assert.match(html, /class="game-kicker"[^>]*>NIGHT SHIFT \/\/ NEON GRID<\/p>/);
});

test('contains the labeled score, board, all direction controls, and game dialogs', () => {
  assert.match(html, /id="score"/);
  assert.match(html, /aria-label="Очки"/);
  assert.match(html, /id="game-board"/);
  assert.match(html, /data-direction="up"/);
  assert.match(html, /data-direction="down"/);
  assert.match(html, /data-direction="left"/);
  assert.match(html, /data-direction="right"/);
  assert.match(html, /id="victory-modal"/);
  assert.match(html, /id="game-over-modal"/);
  assert.match(html, /id="restart-modal"/);
});
