import test from 'node:test';
import assert from 'node:assert/strict';
import { BOARD_WIDTH, BOARD_HEIGHT, SHAPES, createBoard, createGame, pieceCells, movePiece, dropPiece } from '../src/game.js';
import { render } from '../src/render.js';

test('board has independent empty rows', () => {
  const board = createBoard();
  assert.equal(board.length, BOARD_HEIGHT);
  assert.ok(board.every(row => row.length === BOARD_WIDTH && row.every(cell => cell === null)));
  board[0][0] = 'T';
  assert.equal(board[1][0], null);
  assert.equal(createBoard()[0][0], null);
});

test('all seven tetrominoes spawn centered, visible, and separate from the board', () => {
  assert.deepEqual(Object.keys(SHAPES).sort(), ['I', 'J', 'L', 'O', 'S', 'T', 'Z']);
  for (const type of Object.keys(SHAPES)) {
    const game = createGame(type);
    const cells = pieceCells(game.active);
    assert.equal(cells.length, 4);
    assert.equal(new Set(cells.map(cell => cell.join(','))).size, 4);
    assert.ok(cells.every(([x, y]) => x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT));
    const xs = cells.map(([x]) => x);
    assert.ok(Math.abs(Math.min(...xs) - (BOARD_WIDTH - 1 - Math.max(...xs))) <= 1);
    const before = structuredClone(game);
    const output = render(game);
    assert.equal(output.split('\n').length, 24);
    assert.equal((output.match(/\[\]/g) ?? []).length, 8);
    assert.deepEqual(game, before);
    assert.ok(game.board.every(row => row.every(cell => cell === null)));
  }
});

test('horizontal movement stops at both walls for every shape', () => {
  for (const type of Object.keys(SHAPES)) {
    const game = createGame(type);
    const board = structuredClone(game.board);
    while (movePiece(game, -1)) {}
    assert.equal(Math.min(...pieceCells(game.active).map(([x]) => x)), 0);
    const left = structuredClone(game.active);
    assert.equal(movePiece(game, -1), false);
    assert.deepEqual(game.active, left);
    while (movePiece(game, 1)) {}
    assert.equal(Math.max(...pieceCells(game.active).map(([x]) => x)), BOARD_WIDTH - 1);
    assert.equal(movePiece(game, 1), false);
    assert.deepEqual(game.board, board);
  }
});

test('occupied cells block movement without changing state', () => {
  for (const dx of [-1, 1]) {
    const game = createGame('O');
    const x = game.active.x + (dx < 0 ? -1 : 2);
    game.board[1][x] = 'J';
    const before = structuredClone(game);
    assert.equal(movePiece(game, dx), false);
    assert.deepEqual(game, before);
    game.board[1][x] = null;
    assert.equal(movePiece(game, dx), true);
    assert.equal(game.active.x, before.active.x + dx);
  }
});

test('falling moves one row without changing the board or score', () => {
  const game = createGame();
  const before = structuredClone(game);
  assert.equal(dropPiece(game), true);
  assert.deepEqual(game.active, { ...before.active, y: 1 });
  assert.deepEqual(game.board, before.board);
  assert.equal(game.score, 0);
});

test('every shape locks at the floor and spawns the next piece', () => {
  for (const type of Object.keys(SHAPES)) {
    const game = createGame(type);
    const height = Math.max(...SHAPES[type].map(([, y]) => y)) + 1;
    for (let y = 0; y < BOARD_HEIGHT - height; y++) dropPiece(game);
    const cells = pieceCells(game.active);
    assert.equal(Math.max(...cells.map(([, y]) => y)), BOARD_HEIGHT - 1);
    assert.ok(game.board.every(row => row.every(cell => cell === null)));
    assert.equal(dropPiece(game, () => 'I'), true);
    for (const [x, y] of cells) assert.equal(game.board[y][x], type);
    assert.equal(game.board.flat().filter(Boolean).length, 4);
    assert.deepEqual(game.active, createGame('I').active);
  }
});

test('falling locks above occupied cells without overwriting them', () => {
  const game = createGame('O');
  game.board[3][game.active.x] = 'J';
  dropPiece(game);
  const cells = pieceCells(game.active);
  dropPiece(game, () => 'I');
  for (const [x, y] of cells) assert.equal(game.board[y][x], 'O');
  assert.equal(game.board[3][4], 'J');
  assert.equal(game.active.type, 'I');
});

test('a blocked next spawn does not overwrite settled cells', () => {
  const game = createGame('O');
  game.active.y = BOARD_HEIGHT - 2;
  game.board[0][3] = 'J';
  dropPiece(game, () => 'I');
  assert.equal(game.active, null);
  const before = structuredClone(game);
  assert.equal(dropPiece(game), false);
  assert.equal(movePiece(game, 1), false);
  assert.deepEqual(game, before);
});

test('renderer shows settled cells and score alongside the active piece', () => {
  const game = createGame();
  game.board[19][0] = 'J';
  game.score = 100;
  const rows = render(game).split('\n');
  assert.equal(rows[0], 'TETRIS  Score: 100');
  assert.equal(rows[21], '|[]                  |');
  assert.equal((rows.join('\n').match(/\[\]/g) ?? []).length, 9);
});
