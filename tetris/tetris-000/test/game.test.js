import test from 'node:test';
import assert from 'node:assert/strict';
import { BOARD_WIDTH, BOARD_HEIGHT, SHAPES, createBoard, createGame, pieceCells } from '../src/game.js';
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
    assert.equal((output.match(/\[\]/g) ?? []).length, 4);
    assert.deepEqual(game, before);
    assert.ok(game.board.every(row => row.every(cell => cell === null)));
  }
});

test('renderer shows settled cells and score alongside the active piece', () => {
  const game = createGame();
  game.board[19][0] = 'J';
  game.score = 100;
  const rows = render(game).split('\n');
  assert.equal(rows[0], 'TETRIS  Score: 100');
  assert.equal(rows[21], '|[]                  |');
  assert.equal((rows.join('\n').match(/\[\]/g) ?? []).length, 5);
});
