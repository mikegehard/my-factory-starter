import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { createGame } from '../src/game.js';
import { startTerminal } from '../src/terminal.js';

function session(raw = false) {
  const runtime = new EventEmitter();
  runtime.stdin = new PassThrough();
  runtime.stdin.isRaw = raw;
  runtime.stdin.setRawMode = value => { runtime.stdin.isRaw = value; };
  let output = '';
  let errors = '';
  runtime.stdout = new EventEmitter();
  runtime.stdout.write = text => { output += text; };
  runtime.stderr = { write: text => { errors += text; } };
  let cancelled = 0;
  const timers = { setInterval: () => 42, clearInterval: id => {
    assert.equal(id, 42);
    cancelled++;
  } };
  const stop = startTerminal(createGame(), runtime, timers);
  return { runtime, stop, output: () => output, errors: () => errors, cancelled: () => cancelled };
}

for (const action of ['q', 'ctrl-c', 'SIGINT', 'SIGTERM', 'SIGHUP', 'exit', 'uncaughtException', 'unhandledRejection', 'input-error', 'output-error']) {
  test(`${action} restores terminal and releases session resources`, () => {
    const s = session();
    const { runtime } = s;
    assert.equal(runtime.stdin.isRaw, true);
    assert.match(s.output(), /\x1b\[\?25l/);
    if (action === 'q' || action === 'ctrl-c') runtime.stdin.write(action === 'q' ? 'q' : '\x03');
    else if (action === 'input-error') runtime.stdin.emit('error', new Error('test failure'));
    else if (action === 'output-error') runtime.stdout.emit('error', new Error('test failure'));
    else runtime.emit(action, new Error('test failure'));
    assert.equal(runtime.stdin.isRaw, false);
    assert.equal(runtime.stdin.isPaused(), true);
    assert.equal(runtime.stdin.listenerCount('keypress'), 0);
    assert.equal(runtime.eventNames().length, 0);
    assert.equal(s.cancelled(), 1);
    assert.ok(s.output().endsWith('\x1b[?1049l\x1b[?25h'));
    const output = s.output();
    s.stop();
    assert.equal(s.output(), output);
    if (['uncaughtException', 'unhandledRejection', 'input-error', 'output-error'].includes(action)) {
      assert.equal(runtime.exitCode, 1);
      assert.match(s.errors(), /test failure/);
    }
    if (action === 'SIGINT') assert.equal(runtime.exitCode, 130);
    runtime.stdin.destroy();
  });
}

test('cleanup preserves an originally raw input stream', () => {
  const s = session(true);
  s.stop();
  assert.equal(s.runtime.stdin.isRaw, true);
  s.runtime.stdin.destroy();
});

test('startup errors also restore the terminal', () => {
  const runtime = new EventEmitter();
  runtime.stdin = new PassThrough();
  runtime.stdin.setRawMode = value => { runtime.stdin.isRaw = value; };
  let output = '';
  runtime.stdout = new EventEmitter();
  runtime.stdout.write = text => { output += text; };
  runtime.stderr = { write() {} };
  startTerminal(createGame(), runtime, { setInterval() { throw new Error('timer failure'); } });
  assert.equal(runtime.exitCode, 1);
  assert.equal(runtime.stdin.isRaw, false);
  assert.ok(output.endsWith('\x1b[?1049l\x1b[?25h'));
  assert.equal(runtime.eventNames().length, 0);
  runtime.stdin.destroy();
});
