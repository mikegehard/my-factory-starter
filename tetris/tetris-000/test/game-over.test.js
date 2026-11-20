import test from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import { createGame, dropPiece, hardDrop, movePiece, rotatePiece, restartGame, canPlace, SHAPES } from '../src/game.js';
import { listenForInput } from '../src/input.js';
import { render } from '../src/render.js';

function blockedGame() {
  const game = createGame('O');
  game.active.y = 18;
  game.next = 'I';
  game.board[0][3] = 'J';
  game.score = 300;
  dropPiece(game);
  return game;
}

test('blocked spawning ends the game, preserving board and score', () => {
  const game = blockedGame();
  assert.equal(game.gameOver, true);
  assert.equal(game.active, null);
  assert.equal(game.board[0][3], 'J');
  assert.equal(game.board.flat().filter(Boolean).length, 5);
  assert.equal(game.score, 300);
  const before = structuredClone(game);
  assert.equal(dropPiece(game), false);
  assert.equal(hardDrop(game), false);
  assert.equal(movePiece(game, 1), false);
  assert.equal(rotatePiece(game), false);
  assert.deepEqual(game, before);
  const display = render(game);
  assert.equal(display.split('\n').length, 24);
  assert.match(display, /GAME OVER/);
  assert.match(display, /R Restart/);
});

test('restart resets game state in place with a fresh playable bag', () => {
  const game = blockedGame();
  const reference = game;
  const oldBoard = game.board;
  const oldBag = game.bag;
  assert.equal(restartGame(game), true);
  assert.equal(game, reference);
  assert.notEqual(game.board, oldBoard);
  assert.notEqual(game.bag, oldBag);
  assert.equal(game.gameOver, false);
  assert.equal(game.score, 0);
  assert.ok(game.board.flat().every(cell => cell === null));
  assert.ok(canPlace(game.board, game.active));
  assert.deepEqual([game.active.type, game.next, ...game.bag].sort(), Object.keys(SHAPES).sort());
  assert.doesNotMatch(render(game), /GAME OVER|R Restart/);
  assert.equal(dropPiece(game), true);
  assert.equal(game.active.y, 1);
  const before = structuredClone(game);
  assert.equal(restartGame(game), false);
  assert.deepEqual(game, before);
});

test('R restarts through the existing input listener and redraws once', () => {
  const input = new PassThrough();
  input.setRawMode = () => {};
  const game = blockedGame();
  let redraws = 0;
  const stop = listenForInput(input, game, () => redraws++, () => {});
  try {
    input.write('\x1b[B');
    assert.equal(redraws, 0);
    input.write('r');
    assert.equal(game.gameOver, false);
    assert.equal(redraws, 1);
    input.write('r');
    assert.equal(redraws, 1);
    input.write('\x1b[B');
    assert.equal(game.active.y, 1);
    assert.equal(redraws, 2);
  } finally {
    stop();
    input.destroy();
  }
});
