const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const sandbox = {};
vm.runInNewContext(fs.readFileSync('src/2048.js', 'utf8'), sandbox);
const Game2048 = sandbox.Game2048;
const plain = value => JSON.parse(JSON.stringify(value));

function stateWith(board) {
  return { board, score: 0, status: 'playing', hasWon: false };
}

function randomForSpawn() {
  const values = [0, 0.5];
  return () => values.shift();
}

test('creates a 4x4 initial state with two 2 tiles and zero score', () => {
  const state = plain(Game2048.createInitialState(() => 0));
  assert.equal(state.board.length, 4);
  assert.ok(state.board.every(row => row.length === 4));
  assert.equal(state.board.flat().filter(value => value === 2).length, 2);
  assert.equal(state.score, 0);
  assert.equal(state.status, 'playing');
  assert.equal(state.hasWon, false);
});

test('moves and merges a row to the left', () => {
  const board = [
    [null, 2, null, 2],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ];
  const result = plain(Game2048.makeMove(stateWith(board), 'left', randomForSpawn()));
  assert.deepEqual(result.board[0], [4, 2, null, null]);
  assert.equal(result.score, 4);
});

test('moves and merges a row to the right', () => {
  const board = [
    [2, null, 2, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ];
  const result = plain(Game2048.makeMove(stateWith(board), 'right', randomForSpawn()));
  assert.deepEqual(result.board[0], [2, null, null, 4]);
  assert.equal(result.score, 4);
});

test('moves and merges a column upward', () => {
  const board = [
    [null, null, null, null],
    [2, null, null, null],
    [null, null, null, null],
    [2, null, null, null],
  ];
  const result = plain(Game2048.makeMove(stateWith(board), 'up', randomForSpawn()));
  assert.deepEqual(result.board[0], [4, 2, null, null]);
  assert.equal(result.score, 4);
});

test('moves and merges a column downward', () => {
  const board = [
    [2, null, null, null],
    [null, null, null, null],
    [2, null, null, null],
    [null, null, null, null],
  ];
  const result = plain(Game2048.makeMove(stateWith(board), 'down', randomForSpawn()));
  assert.deepEqual(result.board[0], [2, null, null, null]);
  assert.deepEqual(result.board[3], [4, null, null, null]);
  assert.equal(result.score, 4);
});

test('merges each tile at most once during a move', () => {
  const board = [
    [2, 2, 4, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ];
  const original = plain(board);
  const result = plain(Game2048.makeMove(stateWith(board), 'left', randomForSpawn()));
  assert.deepEqual(result.board[0], [4, 4, 2, null]);
  assert.equal(result.score, 4);
  assert.deepEqual(plain(board), original);
});

test('merges two pairs in a line without merging either result again', () => {
  const board = [
    [2, 2, 2, 2],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ];
  const result = plain(Game2048.makeMove(stateWith(board), 'left', randomForSpawn()));
  assert.deepEqual(result.board[0], [4, 4, 2, null]);
  assert.equal(result.score, 8);
});

test('merges equal tiles separated by empty cells after compaction', () => {
  const board = [
    [2, null, 2, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ];
  const result = plain(Game2048.makeMove(stateWith(board), 'left', randomForSpawn()));
  assert.deepEqual(result.board[0], [4, 2, null, null]);
  assert.equal(result.score, 4);
});

test('a no-op leaves the state unchanged and does not request randomness', () => {
  const board = [
    [2, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ];
  const state = stateWith(board);
  let randomCalls = 0;
  const result = plain(Game2048.makeMove(state, 'left', () => {
    randomCalls += 1;
    return 0;
  }));
  assert.deepEqual(result, plain(state));
  assert.equal(randomCalls, 0);
});

test('spawns a 4 when the uniform roll is below 10', () => {
  const board = [
    [2, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ];
  const values = [0, 0.09];
  const result = plain(Game2048.makeMove(stateWith(board), 'right', () => values.shift()));
  assert.deepEqual(result.board[0], [4, null, null, 2]);
});

test('spawns a 2 when the uniform roll is at least 10', () => {
  const board = [
    [2, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ];
  const values = [0, 0.1];
  const result = plain(Game2048.makeMove(stateWith(board), 'right', () => values.shift()));
  assert.deepEqual(result.board[0], [2, null, null, 2]);
});

test('a full board with an equal adjacent pair still has a legal move', () => {
  const board = [
    [2, 2, 4, 8],
    [4, 8, 16, 2],
    [8, 16, 2, 4],
    [16, 2, 4, 8],
  ];
  assert.equal(Game2048.hasMoves(board), true);
});

test('a full board without equal adjacent pairs has no legal move', () => {
  const board = [
    [2, 4, 8, 16],
    [4, 8, 16, 2],
    [8, 16, 2, 4],
    [16, 2, 4, 8],
  ];
  assert.equal(Game2048.hasMoves(board), false);
});

test('ends the game when a successful move fills the last empty cell', () => {
  const board = [
    [null, 2, 4, 8],
    [4, 16, 8, 32],
    [8, 32, 16, 64],
    [16, 64, 32, 128],
  ];
  const values = [0, 0.1];
  const result = plain(Game2048.makeMove(stateWith(board), 'up', () => values.shift()));
  assert.equal(result.status, 'game-over');
  assert.equal(result.board.flat().filter(value => value === null).length, 0);
});

test('shows victory on the first 2048 tile and lets the player continue', () => {
  const board = [
    [1024, 1024, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ];
  const result = plain(Game2048.makeMove(stateWith(board), 'left', randomForSpawn()));
  assert.equal(result.status, 'victory');
  assert.equal(result.hasWon, true);
  assert.equal(result.board.flat().includes(2048), true);

  const continued = plain(Game2048.continueAfterVictory(result));
  assert.equal(continued.status, 'playing');
  assert.equal(continued.hasWon, true);
});

test('does not show victory again after the player continues', () => {
  const state = {
    board: [
      [2048, 2, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ],
    score: 2048,
    status: 'playing',
    hasWon: true,
  };
  const result = plain(Game2048.makeMove(state, 'right', randomForSpawn()));
  assert.equal(result.status, 'playing');
  assert.equal(result.hasWon, true);
});

test('continuing a victory with no remaining moves ends the game', () => {
  const state = {
    board: [
      [2048, 4, 8, 16],
      [4, 8, 16, 2],
      [8, 16, 2, 4],
      [16, 2, 4, 8],
    ],
    score: 2048,
    status: 'victory',
    hasWon: true,
  };
  assert.equal(Game2048.continueAfterVictory(state).status, 'game-over');
});

test('projects the board and score into accessible cell labels', () => {
  const state = {
    board: [
      [2, null, 4, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ],
    score: 12,
    status: 'playing',
    hasWon: false,
  };
  const view = plain(Game2048.createViewModel(state));
  assert.equal(view.score, 12);
  assert.equal(view.scoreLabel, 'Очки');
  assert.equal(view.cells.length, 16);
  assert.deepEqual(view.cells.slice(0, 3), [
    { value: 2, label: 'Плитка 2' },
    { value: null, label: 'Пустая клетка' },
    { value: 4, label: 'Плитка 4' },
  ]);
  assert.equal(view.modal, null);
});

test('prioritizes game result modals over restart confirmation', () => {
  const state = {
    board: Array.from({ length: 4 }, () => Array(4).fill(null)),
    score: 0,
    status: 'victory',
    hasWon: true,
  };
  assert.equal(Game2048.createViewModel(state, { restartConfirmationOpen: true }).modal, 'victory');
  assert.equal(Game2048.createViewModel({ ...state, status: 'game-over' }, { restartConfirmationOpen: true }).modal, 'game-over');
  assert.equal(Game2048.createViewModel({ ...state, status: 'playing' }, { restartConfirmationOpen: true }).modal, 'restart-confirmation');
});

test('maps only arrow keys to move directions', () => {
  assert.equal(Game2048.getKeyboardDirection('ArrowUp'), 'up');
  assert.equal(Game2048.getKeyboardDirection('ArrowDown'), 'down');
  assert.equal(Game2048.getKeyboardDirection('ArrowLeft'), 'left');
  assert.equal(Game2048.getKeyboardDirection('ArrowRight'), 'right');
  assert.equal(Game2048.getKeyboardDirection('Enter'), null);
});

test('blocks moves when the game is over or a modal is open', () => {
  const state = stateWith(Array.from({ length: 4 }, () => Array(4).fill(null)));
  assert.equal(Game2048.canAcceptMove(state, false), true);
  assert.equal(Game2048.canAcceptMove(state, true), false);
  assert.equal(Game2048.canAcceptMove({ ...state, status: 'victory' }, false), false);
  assert.equal(Game2048.canAcceptMove({ ...state, status: 'game-over' }, false), false);
});

test('applies successive directions in order', () => {
  const board = [
    [2, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ];
  const afterRight = Game2048.makeMove(stateWith(board), 'right', randomForSpawn());
  const afterLeft = plain(Game2048.makeMove(afterRight, 'left', randomForSpawn()));
  assert.equal(afterLeft.board[0][0], 4);
  assert.equal(afterLeft.score, 4);
});

test('ignores swipes shorter than 30 pixels and accepts the threshold', () => {
  assert.equal(Game2048.getSwipeDirection(0, 0, 29, 0), null);
  assert.equal(Game2048.getSwipeDirection(0, 0, 30, 0), 'right');
});

test('chooses the dominant swipe axis and horizontal on an exact tie', () => {
  assert.equal(Game2048.getSwipeDirection(0, 0, 50, 30), 'right');
  assert.equal(Game2048.getSwipeDirection(0, 0, 30, 50), 'down');
  assert.equal(Game2048.getSwipeDirection(0, 0, 40, 40), 'right');
});

test('requests restart confirmation after a changed move and cancel preserves the game', () => {
  const board = [
    [2, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ];
  const controller = Game2048.createController(stateWith(board), () => 0);
  controller.move('right');
  const beforePrompt = plain(controller.getSnapshot().state);

  controller.requestNewGame();
  assert.equal(controller.getSnapshot().ui.restartConfirmationOpen, true);
  controller.move('left');
  assert.deepEqual(plain(controller.getSnapshot().state), beforePrompt);

  controller.cancelRestart();
  assert.equal(controller.getSnapshot().ui.restartConfirmationOpen, false);
  assert.deepEqual(plain(controller.getSnapshot().state), beforePrompt);
});

test('confirmed restart creates a fresh board and clears score', () => {
  const board = [
    [2, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ];
  const controller = Game2048.createController(stateWith(board), () => 0);
  controller.move('right');
  controller.requestNewGame();
  controller.confirmRestart();

  const snapshot = plain(controller.getSnapshot());
  assert.equal(snapshot.ui.restartConfirmationOpen, false);
  assert.equal(snapshot.state.score, 0);
  assert.equal(snapshot.state.status, 'playing');
  assert.equal(snapshot.state.board.flat().filter(value => value === 2).length, 2);
});

test('does not ask for restart confirmation before a successful move', () => {
  const board = [
    [2, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ];
  const controller = Game2048.createController(stateWith(board), () => 0);
  controller.move('left');
  controller.requestNewGame();
  assert.equal(controller.getSnapshot().ui.restartConfirmationOpen, false);
});

test('restarts immediately from victory and game-over states', () => {
  const board = Array.from({ length: 4 }, () => Array(4).fill(null));
  for (const status of ['victory', 'game-over']) {
    const controller = Game2048.createController({ ...stateWith(board), status, hasWon: status === 'victory' }, () => 0);
    controller.requestNewGame();
    const snapshot = plain(controller.getSnapshot());
    assert.equal(snapshot.ui.restartConfirmationOpen, false);
    assert.equal(snapshot.state.status, 'playing');
    assert.equal(snapshot.state.score, 0);
  }
});

test('continues from victory without clearing the board or score', () => {
  const board = [
    [2048, 2, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ];
  const state = { ...stateWith(board), score: 2048, status: 'victory', hasWon: true };
  const controller = Game2048.createController(state, () => 0);
  controller.continueGame();
  const snapshot = plain(controller.getSnapshot());
  assert.equal(snapshot.state.status, 'playing');
  assert.equal(snapshot.state.score, 2048);
  assert.deepEqual(snapshot.state.board[0], [2048, 2, null, null]);
});
