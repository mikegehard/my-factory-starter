import test from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import { createGame, dropPiece, hardDrop, movePiece, rotatePiece, togglePause } from '../src/game.js';
import { listenForInput } from '../src/input.js';
import { startGravity } from '../src/gravity.js';
import { render } from '../src/render.js';

test('pause freezes all movement and gravity, then resumes the same piece', () => {
  const game = createGame('T');
  const input = new PassThrough();
  input.setRawMode = () => {};
  let tick;
  let redraws = 0;
  const redraw = () => redraws++;
  const stopInput = listenForInput(input, game, redraw, () => {});
  const stopGravity = startGravity(game, redraw, {
    setInterval(callback) { tick = callback; },
    clearInterval() {},
  });
  input.write('p');
  assert.equal(game.paused, true);
  assert.match(render(game), /PAUSED/);
  const before = structuredClone(game);
  for (const key of ['\x1b[D', '\x1b[C', '\x1b[A', '\x1b[B', ' ', 'r']) input.write(key);
  tick();
  assert.equal(movePiece(game, 1), false);
  assert.equal(rotatePiece(game), false);
  assert.equal(dropPiece(game), false);
  assert.equal(hardDrop(game), false);
  assert.deepEqual(game, before);
  assert.equal(redraws, 1);
  input.write('p');
  assert.equal(game.paused, false);
  assert.doesNotMatch(render(game), /PAUSED/);
  tick();
  assert.equal(game.active.y, 1);
  stopGravity();
  stopInput();
  input.destroy();
});

test('game over cannot be paused', () => {
  const game = createGame();
  game.gameOver = true;
  assert.equal(togglePause(game), false);
  assert.equal(game.paused, false);
});
