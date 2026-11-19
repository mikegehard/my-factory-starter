import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game.js';
import { FALL_INTERVAL_MS, startGravity } from '../src/gravity.js';

test('gravity schedules falling, redraws after ticks, and cancels on stop', () => {
  const game = createGame('O');
  let tick;
  let redraws = 0;
  let cancelled = false;
  const timers = {
    setInterval(callback, delay) {
      tick = callback;
      assert.equal(delay, FALL_INTERVAL_MS);
      return 42;
    },
    clearInterval(id) {
      assert.equal(id, 42);
      cancelled = true;
    },
  };
  const stop = startGravity(game, () => redraws++, timers);
  assert.equal(game.active.y, 0);
  tick();
  assert.equal(game.active.y, 1);
  assert.equal(redraws, 1);
  game.active.y = 18;
  tick();
  assert.equal(game.board.flat().filter(Boolean).length, 4);
  assert.equal(game.active.y, 0);
  assert.equal(redraws, 2);
  game.active = null;
  tick();
  assert.equal(redraws, 2);
  stop();
  assert.equal(cancelled, true);
});
