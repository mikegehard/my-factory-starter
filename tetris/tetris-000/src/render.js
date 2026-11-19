export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export function render() {
  const border = `+${'-'.repeat(BOARD_WIDTH * 2)}+`;
  const emptyRow = `|${' '.repeat(BOARD_WIDTH * 2)}|`;

  return [
    'TETRIS  Score: 0',
    border,
    ...Array(BOARD_HEIGHT).fill(emptyRow),
    border,
    '←/→ Move  ↑ Rotate  ↓ Drop  Space Hard drop  P Pause  Q Quit',
  ].join('\n');
}
