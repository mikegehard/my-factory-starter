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
  let cells = SHAPES[piece.type];
  // Rotate in a fixed square so four turns restore the original position.
  const pivot = piece.type === 'I' ? 1.5 : 1;
  if (piece.type !== 'O') {
    for (let turn = 0; turn < (piece.rotation ?? 0); turn++) {
      cells = cells.map(([x, y]) => [2 * pivot - y, x]);
    }
  }
  return cells.map(([x, y]) => [piece.x + x, piece.y + y]);
}

export function canPlace(board, piece) {
  return pieceCells(piece).every(([x, y]) =>
    x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT && board[y][x] === null);
}

export function movePiece(game, dx) {
  if (!game.active) return false;
  const candidate = { ...game.active, x: game.active.x + dx };
  if (!canPlace(game.board, candidate)) return false;
  game.active = candidate;
  return true;
}

export function rotatePiece(game) {
  if (!game.active || game.active.type === 'O') return false;
  const rotated = { ...game.active, rotation: ((game.active.rotation ?? 0) + 1) % 4 };
  // Simple horizontal kicks, preferring the smallest displacement.
  for (const dx of [0, -1, 1, -2, 2, -3, 3]) {
    const candidate = { ...rotated, x: rotated.x + dx };
    if (canPlace(game.board, candidate)) {
      game.active = candidate;
      return true;
    }
  }
  return false;
}

// Remove full rows together, preserving the order of all surviving rows.
export function clearLines(board) {
  const remaining = board.filter(row => row.some(cell => cell === null));
  const cleared = board.length - remaining.length;
  const empty = Array.from({ length: cleared }, () => Array(BOARD_WIDTH).fill(null));
  board.splice(0, board.length, ...empty, ...remaining);
  return cleared;
}

// A blocked spawn leaves no active piece; game-over UI is added separately.
export function dropPiece(game, chooseType = randomType) {
  if (!game.active) return false;
  const candidate = { ...game.active, y: game.active.y + 1 };
  if (canPlace(game.board, candidate)) {
    game.active = candidate;
  } else {
    for (const [x, y] of pieceCells(game.active)) {
      game.board[y][x] = game.active.type;
    }
    const cleared = clearLines(game.board);
    game.score += [0, 100, 300, 500, 800][cleared];
    const next = spawnPiece(chooseType());
    game.active = canPlace(game.board, next) ? next : null;
  }
  return true;
}

function randomType() {
  const types = Object.keys(SHAPES);
  return types[Math.floor(Math.random() * types.length)];
}

export function createGame(type = 'T') {
  return { board: createBoard(), active: spawnPiece(type), score: 0 };
}
