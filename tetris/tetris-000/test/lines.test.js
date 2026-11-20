import test from 'node:test';
import assert from 'node:assert/strict';
import { BOARD_HEIGHT, BOARD_WIDTH, clearLines, createBoard, createGame, dropPiece } from '../src/game.js';
import { render } from '../src/render.js';

test('no completed rows leaves the board and score unchanged', () => {
  const game = createGame('O');
  game.active.y = 18;
  dropPiece(game, () => 'T');
  assert.equal(game.score, 0);
  const before = structuredClone(game.board);
  assert.equal(clearLines(game.board), 0);
  assert.deepEqual(game.board, before);
});

for (const [lines, points] of [[1, 100], [2, 300], [3, 500], [4, 800]]) {
  test(`locking clears ${lines} line(s) and adds ${points} points`, () => {
    const game = createGame('I');
    game.score = 100;
    // A vertical I fills the final column of each prepared row.
    game.active = { type: 'I', x: 6, y: 16, rotation: 1 };
    for (let y = BOARD_HEIGHT - lines; y < BOARD_HEIGHT; y++) {
      game.board[y].fill('J');
      game.board[y][9] = null;
    }
    game.board[10][0] = 'T';
    dropPiece(game, () => 'O');
    assert.equal(game.score, 100 + points);
    assert.equal(game.board.length, BOARD_HEIGHT);
    assert.ok(game.board.every(row => row.length === BOARD_WIDTH));
    assert.equal(game.board[10 + lines][0], 'T');
    assert.equal(game.board.flat().filter(Boolean).length, 5 - lines);
    assert.ok(game.board.slice(0, lines).every(row => row.every(cell => cell === null)));
    assert.equal(game.active.type, 'O');
    assert.equal(game.active.y, 0);
    assert.match(render(game), new RegExp(`Score: ${100 + points}`));
  });
}

test('separated full rows collapse together and new empty rows are independent', () => {
  const board = createBoard();
  board[17].fill('J');
  board[19].fill('L');
  board[16][0] = 'S';
  board[18][1] = 'Z';
  assert.equal(clearLines(board), 2);
  assert.equal(board[18][0], 'S');
  assert.equal(board[19][1], 'Z');
  assert.ok(board.slice(0, 18).every(row => row.every(cell => cell === null)));
  board[0][0] = 'T';
  assert.equal(board[1][0], null);
});

test('lines clear before checking whether the next piece can spawn', () => {
  const game = createGame('I');
  game.board[0].fill('J');
  for (let x = 3; x < 7; x++) game.board[0][x] = null;
  game.board[1][3] = 'O';
  dropPiece(game, () => 'I');
  assert.equal(game.score, 100);
  assert.equal(game.active.type, 'I');
  assert.ok(game.board[0].every(cell => cell === null));
});
