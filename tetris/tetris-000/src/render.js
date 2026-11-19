import { BOARD_WIDTH, BOARD_HEIGHT, createBoard, pieceCells } from './game.js';

export { BOARD_WIDTH, BOARD_HEIGHT } from './game.js';

export function render({ board = createBoard(), active = null, score = 0 } = {}) {
  const border = `+${'-'.repeat(BOARD_WIDTH * 2)}+`;
  const cells = board.map(row => [...row]);
  if (active) {
    for (const [x, y] of pieceCells(active)) {
      if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
        cells[y][x] = active.type;
      }
    }
  }

  return [
    `TETRIS  Score: ${score}`,
    border,
    ...cells.map(row => `|${row.map(cell => cell ? '[]' : '  ').join('')}|`),
    border,
    '←/→ Move  ↑ Rotate  ↓ Drop  Space Hard drop  P Pause  Q Quit',
  ].join('\n');
}
