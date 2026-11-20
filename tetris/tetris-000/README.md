# Terminal Tetris

Requires Node.js 18 or newer. No packages need to be installed.

```sh
npm start
```

Play in an interactive terminal at least 60 columns wide and 24 rows tall. The entire display—including the 10×20 board, score, next-piece preview, controls, and status messages—fits in 24 rows. With redirected input or output, the command prints one static frame instead.

## Controls

| Key | Action |
| --- | --- |
| ← / → | Move left / right |
| ↑ | Rotate clockwise (with simple horizontal wall kicks) |
| ↓ | Soft drop one row |
| Space | Hard drop and lock immediately |
| P | Pause / resume |
| R | Restart after game over |
| Q / Ctrl-C | Quit |

Pieces also fall automatically. Completed lines score 100, 300, 500, or 800 points for clearing one, two, three, or four lines at once. Pieces come from shuffled seven-piece bags. The game ends when the next piece cannot spawn. Quitting restores the cursor and original terminal screen.

Run the regression tests with `npm test`.
