import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { BOARD_WIDTH, BOARD_HEIGHT, render } from '../src/render.js';
import { SHAPES, createGame } from '../src/game.js';

test('static display fits in 24 rows with a 10×20 board', () => {
  const rows = render().split('\n');
  assert.equal(BOARD_WIDTH, 10);
  assert.equal(BOARD_HEIGHT, 20);
  assert.equal(rows.length, 24);
  assert.match(rows[0], /Score: 0/);
  assert.equal(rows[1], '+--------------------+');
  assert.deepEqual(rows.slice(2, 22), Array(20).fill('|                    |'));
  assert.equal(rows[22], rows[1]);
  assert.match(rows[23], /Move.*Rotate.*Drop.*Pause.*Quit/);
  assert.ok(rows.every(row => [...row].length <= 80));
});

test('all previews and status messages fit a 60×24 terminal without mutating state', () => {
  for (const next of Object.keys(SHAPES)) {
    for (const status of ['playing', 'paused', 'gameOver']) {
      const game = createGame('I');
      game.next = next;
      game.score = 123456789;
      game.paused = status === 'paused';
      game.gameOver = status === 'gameOver';
      if (game.gameOver) game.active = null;
      game.board[19].fill('Z');
      const before = structuredClone(game);
      const frame = render(game);
      const rows = frame.split('\n');
      assert.equal(rows.length, 24);
      assert.ok(rows.every(row => [...row].length <= 60));
      assert.match(frame, /Score: 123456789/);
      assert.ok(frame.includes(`Next: ${next}`));
      if (game.paused) assert.match(frame, /PAUSED.*\n.*P Resume/);
      if (game.gameOver) assert.match(frame, /GAME OVER.*\n.*R Restart/);
      assert.deepEqual(game, before);
    }
  }
});

test('entry point prints the display without an extra row', () => {
  const output = execFileSync(process.execPath, ['src/index.js'], { encoding: 'utf8' });
  const rows = output.split('\n');
  assert.equal(rows.length, 24);
  assert.match(rows[0], /Score: 0/);
  assert.ok(Object.keys(SHAPES).some(type => rows[2].includes(`Next: ${type}`)));
  assert.equal((output.match(/\[\]/g) ?? []).length, 8);
});
