import { render } from './render.js';
import { createGame } from './game.js';

import { listenForInput } from './input.js';
import { startGravity } from './gravity.js';

const game = createGame();
// No trailing newline: the final display row must not scroll a 24-row terminal.
if (process.stdin.isTTY && process.stdout.isTTY) {
  const redraw = () => process.stdout.write(`\x1b[H${render(game)}`);
  process.stdout.write('\x1b[2J\x1b[H');
  redraw();
  const stopGravity = startGravity(game, redraw);
  const stopInput = listenForInput(process.stdin, game, redraw, () => {
    stopGravity();
    stopInput();
  });
} else {
  process.stdout.write(render(game));
}
