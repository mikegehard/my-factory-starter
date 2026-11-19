import { render } from './render.js';

// No trailing newline: the final display row must not scroll a 24-row terminal.
process.stdout.write(render());
