import { emitKeypressEvents } from 'node:readline';
import { dropPiece, hardDrop, movePiece, restartGame, rotatePiece } from './game.js';

export function listenForInput(input, game, redraw, quit) {
  emitKeypressEvents(input);
  const wasRaw = Boolean(input.isRaw);
  input.setRawMode(true);
  input.resume();

  function onKeypress(text, key = {}) {
    if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
      quit();
      return;
    }
    if (key.name === 'r') {
      if (restartGame(game)) redraw();
      return;
    }
    if (key.name === 'space') {
      if (hardDrop(game)) redraw();
      return;
    }
    if (key.name === 'up') {
      if (rotatePiece(game)) redraw();
      return;
    }
    if (key.name === 'down') {
      if (dropPiece(game)) redraw();
      return;
    }
    const dx = key.name === 'left' ? -1 : key.name === 'right' ? 1 : 0;
    if (dx && movePiece(game, dx)) redraw();
  }

  input.on('keypress', onKeypress);
  return () => {
    input.removeListener('keypress', onKeypress);
    input.setRawMode(wasRaw);
    input.pause();
  };
}
