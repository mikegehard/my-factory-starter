export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

// Each pair is a cell offset from the piece's top-left corner.
export const SHAPES = {
  I: [[0, 0], [1, 0], [2, 0], [3, 0]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
  O: [[0, 0], [1, 0], [0, 1], [1, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
};

export function createBoard() {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
}

export function spawnPiece(type = 'T') {
  const shape = SHAPES[type];
  if (!shape) throw new Error(`Unknown tetromino: ${type}`);
  const width = Math.max(...shape.map(([x]) => x)) + 1;
  return { type, x: Math.floor((BOARD_WIDTH - width) / 2), y: 0 };
}

export function pieceCells(piece) {
  return SHAPES[piece.type].map(([x, y]) => [piece.x + x, piece.y + y]);
}

export function createGame(type = 'T') {
  return { board: createBoard(), active: spawnPiece(type), score: 0 };
}
