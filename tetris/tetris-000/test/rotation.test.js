import test from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import { SHAPES, createGame, pieceCells, canPlace, movePiece, rotatePiece } from '../src/game.js';
import { listenForInput } from '../src/input.js';

const sortedCells = piece => pieceCells(piece).map(cell => cell.join(',')).sort();

test('four clockwise rotations restore every non-square piece without changing board or score', () => {
  for (const type of Object.keys(SHAPES).filter(type => type !== 'O')) {
    const game = createGame(type);
    const before = structuredClone(game);
    assert.equal(rotatePiece(game), true);
    const pivot = type === 'I' ? 1.5 : 1;
    assert.deepEqual(pieceCells(game.active), SHAPES[type].map(([x, y]) =>
      [before.active.x + 2 * pivot - y, before.active.y + x]));
    for (let i = 0; i < 3; i++) assert.equal(rotatePiece(game), true);
    assert.deepEqual(sortedCells(game.active), sortedCells(before.active));
    assert.deepEqual(game.board, before.board);
    assert.equal(game.score, before.score);
  }
});

test('rotated shapes stop at walls and can kick back into the board', () => {
  for (const type of ['I', 'J', 'L', 'S', 'T', 'Z']) {
    for (const direction of [-1, 1]) {
      const game = createGame(type);
      rotatePiece(game);
      while (movePiece(game, direction)) {}
      const before = structuredClone(game.active);
      assert.equal(movePiece(game, direction), false);
      assert.deepEqual(game.active, before);
      assert.equal(rotatePiece(game), true);
      assert.equal(canPlace(game.board, game.active), true);
      assert.ok(Math.abs(game.active.x - before.x) <= 3);
      if (direction === -1) assert.notEqual(game.active.x, before.x);
    }
  }
});

test('floor and occupied cells reject rotation without mutating state', () => {
  const floor = createGame('I');
  floor.active.y = 19;
  const blocked = createGame('T');
  blocked.board[2].fill('J');
  for (const game of [floor, blocked]) {
    const before = structuredClone(game);
    assert.equal(rotatePiece(game), false);
    assert.deepEqual(game, before);
  }
});

test('square and missing active piece do not rotate', () => {
  for (const active of [createGame('O').active, null]) {
    const game = { ...createGame(), active };
    const before = structuredClone(game);
    assert.equal(rotatePiece(game), false);
    assert.deepEqual(game, before);
  }
});

test('up arrow rotates and redraws only successful rotations', () => {
  const input = new PassThrough();
  input.setRawMode = () => {};
  const game = createGame('T');
  let redraws = 0;
  const stop = listenForInput(input, game, () => redraws++, () => {});
  input.write('\x1b[A');
  assert.equal(game.active.rotation, 1);
  assert.equal(redraws, 1);
  game.active = createGame('I').active;
  game.active.y = 19;
  input.write('\x1b[A');
  assert.equal(game.active.rotation, undefined);
  assert.equal(redraws, 1);
  stop();
  input.destroy();
});
