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
  if (game.gameOver || game.paused || !game.active) return false;
  const candidate = { ...game.active, x: game.active.x + dx };
  if (!canPlace(game.board, candidate)) return false;
  game.active = candidate;
  return true;
}

export function rotatePiece(game) {
  if (game.gameOver || game.paused || !game.active || game.active.type === 'O') return false;
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

export function dropPiece(game, chooseType) {
  if (game.gameOver || game.paused || !game.active) return false;
  const candidate = { ...game.active, y: game.active.y + 1 };
  if (canPlace(game.board, candidate)) {
    game.active = candidate;
  } else {
    for (const [x, y] of pieceCells(game.active)) {
      game.board[y][x] = game.active.type;
    }
    const cleared = clearLines(game.board);
    game.score += [0, 100, 300, 500, 800][cleared];
    const next = spawnPiece(chooseType ? chooseType() : game.next);
    if (game.bag.length === 0) game.bag = createBag();
    game.next = game.bag.shift();
    game.gameOver = !canPlace(game.board, next);
    game.active = game.gameOver ? null : next;
  }
  return true;
}

export function hardDrop(game) {
  if (game.gameOver || game.paused || !game.active) return false;
  while (canPlace(game.board, { ...game.active, y: game.active.y + 1 })) {
    game.active.y++;
  }
  // Use the same locking, line clearing, and spawning path as gravity.
  return dropPiece(game);
}

export function createBag(random = Math.random) {
  const bag = Object.keys(SHAPES);
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

export function createGame(type, random = Math.random) {
  const bag = createBag(random);
  if (type !== undefined) {
    // Explicit starting types are useful for deterministic scenarios.
    spawnPiece(type);
    bag.splice(bag.indexOf(type), 1);
  } else {
    type = bag.shift();
  }
  return { board: createBoard(), active: spawnPiece(type), score: 0, next: bag.shift(), bag, gameOver: false, paused: false };
}

export function togglePause(game) {
  if (game.gameOver) return false;
  game.paused = !game.paused;
  return true;
}

export function restartGame(game) {
  if (!game.gameOver) return false;
  // Keep the object shared by input, gravity, and rendering.
  Object.assign(game, createGame());
  return true;
}
