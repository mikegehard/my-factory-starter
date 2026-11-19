import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { BOARD_WIDTH, BOARD_HEIGHT, render } from '../src/render.js';
import { createGame } from '../src/game.js';

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

test('entry point prints the display without an extra row', () => {
  const output = execFileSync(process.execPath, ['src/index.js'], { encoding: 'utf8' });
  assert.equal(output, render(createGame()));
  assert.equal(output.split('\n').length, 24);
  assert.equal((output.match(/\[\]/g) ?? []).length, 4);
});
