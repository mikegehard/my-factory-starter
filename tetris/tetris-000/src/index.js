import { render } from './render.js';
import { createGame } from './game.js';

import { startTerminal } from './terminal.js';

const game = createGame();
// No trailing newline: the final display row must not scroll a 24-row terminal.
if (process.stdin.isTTY && process.stdout.isTTY) {
  startTerminal(game);
} else {
  process.stdout.write(render(game));
}
