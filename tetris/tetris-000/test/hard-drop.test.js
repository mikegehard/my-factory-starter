import test from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import { createBag, createGame, createBoard, hardDrop, SHAPES } from '../src/game.js';
import { render } from '../src/render.js';
import { listenForInput } from '../src/input.js';

const types = Object.keys(SHAPES).sort();

test('Fisher-Yates bag contains every type and supports deterministic shuffling', () => {
  assert.deepEqual(createBag(() => 0).sort(), types);
  assert.deepEqual(createBag(() => 0.999), Object.keys(SHAPES));
  assert.notDeepEqual(createBag(() => 0), createBag(() => 0.999));
});

test('successive seven-piece bags supply the active piece and accurate preview', () => {
  const game = createGame();
  for (let bag = 0; bag < 4; bag++) {
    const seen = [];
    for (let i = 0; i < 7; i++) {
      seen.push(game.active.type);
      const next = game.next;
      hardDrop(game);
      assert.equal(game.active.type, next);
      game.board = createBoard();
    }
    assert.deepEqual(seen.sort(), types);
  }
});

test('hard drop lands above obstacles, locks once, and spawns the preview', () => {
  const game = createGame('O');
  const x = game.active.x;
  const next = game.next;
  game.board[10][x] = 'J';
  assert.equal(hardDrop(game), true);
  for (const y of [8, 9]) {
    assert.equal(game.board[y][x], 'O');
    assert.equal(game.board[y][x + 1], 'O');
  }
  assert.equal(game.board[10][x], 'J');
  assert.equal(game.board.flat().filter(Boolean).length, 5);
  assert.equal(game.active.type, next);
  assert.equal(game.active.y, 0);
});

test('hard drop clears lines and is harmless without an active piece', () => {
  const game = createGame('I');
  game.board[19].fill('J');
  for (let x = 3; x < 7; x++) game.board[19][x] = null;
  hardDrop(game);
  assert.equal(game.score, 100);
  assert.ok(game.board.flat().every(cell => cell === null));
  game.active = null;
  const before = structuredClone(game);
  assert.equal(hardDrop(game), false);
  assert.deepEqual(game, before);
});

test('each preview displays four cells within the 24-row display', () => {
  for (const next of types) {
    const rows = render({ next }).split('\n');
    assert.equal(rows.length, 24);
    assert.match(rows[2], new RegExp(`Next: ${next}`));
    assert.equal((rows.join('\n').match(/\[\]/g) ?? []).length, 4);
    assert.ok(rows.every(row => [...row].length <= 80));
  }
});

test('Space hard drops and redraws immediately', () => {
  const input = new PassThrough();
  input.setRawMode = () => {};
  const game = createGame('O');
  let redraws = 0;
  const stop = listenForInput(input, game, () => redraws++, () => {});
  input.write(' ');
  assert.equal(game.board[19][4], 'O');
  assert.equal(game.active.y, 0);
  assert.equal(redraws, 1);
  stop();
  input.destroy();
});
