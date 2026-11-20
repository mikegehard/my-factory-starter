import { BOARD_WIDTH, BOARD_HEIGHT, SHAPES, createBoard, pieceCells } from './game.js';

export { BOARD_WIDTH, BOARD_HEIGHT } from './game.js';

export function render({ board = createBoard(), active = null, score = 0, next = null, gameOver = false } = {}) {
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
    ...cells.map((row, y) => {
      let preview = '';
      if (next && y === 0) preview = `  Next: ${next}`;
      if (next && (y === 1 || y === 2)) {
        preview = '  ' + Array.from({ length: 4 }, (_, x) =>
          SHAPES[next].some(([px, py]) => px === x && py === y - 1) ? '[]' : '  ').join('');
      }
      if (gameOver && y === 4) preview = '  GAME OVER';
      if (gameOver && y === 5) preview = '  R Restart';
      return `|${row.map(cell => cell ? '[]' : '  ').join('')}|${preview}`;
    }),
    border,
    '←/→ Move  ↑ Rotate  ↓ Drop  Space Hard drop  P Pause  Q Quit',
  ].join('\n');
}
