import test from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import { createGame } from '../src/game.js';
import { listenForInput } from '../src/input.js';

test('terminal arrow sequences move and redraw; quit restores input', () => {
  const input = new PassThrough();
  input.setRawMode = value => { input.isRaw = value; };
  const game = createGame('O');
  const startX = game.active.x;
  let redraws = 0;
  let quits = 0;
  const stop = listenForInput(input, game, () => redraws++, () => { quits++; stop(); });
  assert.equal(input.isRaw, true);
  input.write('\x1b[D');
  assert.equal(game.active.x, startX - 1);
  input.write('\x1b[C');
  assert.equal(game.active.x, startX);
  assert.equal(redraws, 2);
  input.write('\x1b[A');
  assert.equal(redraws, 2);
  while (game.active.x > 0) input.write('\x1b[D');
  const before = redraws;
  input.write('\x1b[D');
  assert.equal(redraws, before);
  input.write('q');
  assert.equal(quits, 1);
  assert.equal(input.isRaw, false);
  assert.equal(input.listenerCount('keypress'), 0);
  input.destroy();
});

test('Down arrow soft drops and locks a piece at the floor', () => {
  const input = new PassThrough();
  input.setRawMode = () => {};
  const game = createGame('O');
  let redraws = 0;
  const stop = listenForInput(input, game, () => redraws++, () => {});
  input.write('\x1b[B');
  assert.equal(game.active.y, 1);
  assert.equal(redraws, 1);
  game.active.y = 18;
  input.write('\x1b[B');
  assert.equal(game.board.flat().filter(Boolean).length, 4);
  assert.equal(game.active.y, 0);
  assert.equal(redraws, 2);
  stop();
  input.destroy();
});

test('Ctrl-C quits raw input', () => {
  const input = new PassThrough();
  input.setRawMode = () => {};
  let quit = false;
  const stop = listenForInput(input, createGame(), () => {}, () => { quit = true; });
  input.write('\x03');
  assert.equal(quit, true);
  stop();
  input.destroy();
});
