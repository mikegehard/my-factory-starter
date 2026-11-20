import test from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import { createGame, canPlace } from '../src/game.js';
import { startTerminal } from '../src/terminal.js';
import { EventEmitter } from 'node:events';

test('session clears a line, pauses, tops out, restarts, and quits using real key sequences', () => {
  const game = createGame('I');
  const stdin = new PassThrough();
  stdin.setRawMode = raw => { stdin.isRaw = raw; };
  const stdout = new PassThrough();
  let output = '';
  stdout.on('data', data => { output += data; });
  const runtime = Object.assign(new EventEmitter(), { stdin, stdout, stderr: new PassThrough() });
  let tick;
  let cleared = false;
  const stop = startTerminal(game, runtime, {
    setInterval(callback) { tick = callback; return 1; },
    clearInterval(id) { assert.equal(id, 1); cleared = true; },
  });
  try {
    game.board[19].fill('Z');
    game.board[19].fill(null, 3, 7);
    stdin.write(' ');
    assert.equal(game.score, 100);
    assert.ok(game.board.every(row => row.every(cell => cell === null)));
    assert.ok(canPlace(game.board, game.active));
    stdin.write('p');
    const paused = structuredClone(game);
    stdin.write('\x1b[D\x1b[A\x1b[B ');
    tick();
    assert.deepEqual(game, paused);
    stdin.write('p');
    tick();
    assert.equal(game.active.y, 1);
    tick();
    game.next = 'O';
    game.board[0][4] = 'Z';
    stdin.write(' ');
    assert.equal(game.gameOver, true);
    assert.equal(game.active, null);
    assert.match(output, /GAME OVER/);
    const ended = structuredClone(game);
    stdin.write('\x1b[D\x1b[A\x1b[B p');
    tick();
    assert.deepEqual(game, ended);
    stdin.write('r');
    assert.equal(game.gameOver, false);
    assert.equal(game.score, 0);
    assert.ok(game.board.every(row => row.every(cell => cell === null)));
    tick();
    assert.equal(game.active.y, 1);
    stdin.write('q');
    assert.equal(stdin.isRaw, false);
    assert.equal(cleared, true);
    assert.ok(output.endsWith('\x1b[?1049l\x1b[?25h'));
  } finally {
    stop();
    stdin.destroy();
    stdout.destroy();
    runtime.stderr.destroy();
  }
});
