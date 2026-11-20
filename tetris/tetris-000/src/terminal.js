import { render } from './render.js';
import { listenForInput } from './input.js';
import { startGravity } from './gravity.js';

// Own the terminal and all resources for one game session.
export function startTerminal(game, runtime = process, timers = globalThis) {
  const { stdin, stdout, stderr } = runtime;
  let stopped = false;
  let stopInput = () => {};
  let stopGravity = () => {};
  const handlers = [];
  const on = (target, event, handler) => {
    target.on(event, handler);
    handlers.push([target, event, handler]);
  };
  const stop = () => {
    if (stopped) return;
    stopped = true;
    stopGravity();
    try {
      stopInput();
    } finally {
      try {
        stdout.write('\x1b[?1049l\x1b[?25h');
      } finally {
        for (const [target, event, handler] of handlers) target.removeListener(event, handler);
      }
    }
  };
  const fail = error => {
    runtime.exitCode = 1;
    try {
      stop();
    } finally {
      stderr.write(`Tetris: ${error?.stack ?? error}\n`);
    }
  };
  const interrupt = code => {
    runtime.exitCode = code;
    stop();
  };
  on(runtime, 'SIGINT', () => interrupt(130));
  on(runtime, 'SIGTERM', () => interrupt(143));
  on(runtime, 'SIGHUP', () => interrupt(129));
  on(runtime, 'exit', stop);
  on(runtime, 'uncaughtException', fail);
  on(runtime, 'unhandledRejection', fail);
  on(stdin, 'error', fail);
  on(stdout, 'error', fail);

  try {
    // Alternate screen preserves the shell; no trailing newline avoids scrolling.
    stdout.write('\x1b[?1049h\x1b[?25l\x1b[2J\x1b[H');
    const redraw = () => stdout.write(`\x1b[H${render(game).split('\n').join('\x1b[K\n')}\x1b[K`);
    stopInput = listenForInput(stdin, game, redraw, stop);
    stopGravity = startGravity(game, redraw, timers);
    redraw();
  } catch (error) {
    fail(error);
  }
  return stop;
}
