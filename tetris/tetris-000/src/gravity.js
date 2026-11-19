import { dropPiece } from './game.js';

export const FALL_INTERVAL_MS = 1000;

export function startGravity(game, redraw, timers = globalThis) {
  const timer = timers.setInterval(() => {
    if (dropPiece(game)) redraw();
  }, FALL_INTERVAL_MS);
  return () => timers.clearInterval(timer);
}
