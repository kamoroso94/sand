import * as Cells from './Cells.js';
import Game from './Game.js';
import Grid from './Grid.js';
import Pen from './Pen.js';
import draw from './draw.js';
import tick from './tick.js';
import { clamp, getTouch, lerp, range, resetGrid } from './util.js';

// TODO: make grid Uint8Array {7[dir] 6-0[id]}

// setup
window.addEventListener('DOMContentLoaded', (event) => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const pen = new Pen();
  const grid = new Grid(canvas.width / Cells.SIZE, canvas.height / Cells.SIZE);

  // init
  resetGrid(grid);
  const game = new Game({canvas, ctx, pen, grid});

  // event listeners
  attatchHandlers(game);

  // begin
  game.resume();
});

function attatchHandlers(game) {
  const {canvas, pen, grid} = game.state;

  // helper
  const cache = {
    bcr: null,
    style: window.getComputedStyle(canvas)
  };
  const clearCache = () => { cache.bcr = null; };
  const translateCoords = ({clientX, clientY}) => {
    // translate coords in viewport to translated, scaled, clipped coords of grid
    if(!cache.bcr) cache.bcr = canvas.getBoundingClientRect();

    const { bcr } = cache;
    const scaleX = grid.width / bcr.width;
    const scaleY = grid.height / bcr.height;
    const x = clamp((clientX - bcr.left) * scaleX, 0, grid.width);
    const y = clamp((clientY - bcr.top) * scaleY, 0, grid.height);

    return [x, y];
  };

  // clear cache
  window.addEventListener('resize', clearCache);
  window.addEventListener('scroll', clearCache);

  // pen events
  canvas.addEventListener('mousedown', (event) => {
    const RIGHT_BUTTON = 2;
    if(event.button == RIGHT_BUTTON) return;

    event.preventDefault();
    pen.down(...translateCoords(event));
  });

  document.addEventListener('mousemove', (event) => {
    pen.move(...translateCoords(event));
  });

  document.addEventListener('mouseup', (event) => {
    pen.up(...translateCoords(event));
  });

  canvas.addEventListener('touchstart', (event) => {
    event.preventDefault();
    if(pen.isDown) return;

    const [touch] = event.changedTouches;

    pen.touchId = touch.identifier;
    pen.down(...translateCoords(touch));
  });

  canvas.addEventListener('touchmove', (event) => {
    event.preventDefault();
    const touch = getTouch(pen.touchId, event.changedTouches);
    if(pen.isDown && touch != null) pen.move(...translateCoords(touch));
  });

  canvas.addEventListener('touchend', (event) => {
    event.preventDefault();
    const touch = getTouch(pen.touchId, event.changedTouches);
    if(pen.isDown && touch != null) pen.up(...translateCoords(touch));
  });

  // dom events
  const speedInput = document.getElementById('speed');
  speedInput.addEventListener('change', (event) => {
    game.setTPS(parseFloat(speedInput.value));
  });

  const radiusInput = document.getElementById('radius');
  const radiusSpan = document.getElementById('radius-value');
  radiusInput.addEventListener('input', (event) => {
    pen.radius = parseInt(radiusInput.value);
    radiusSpan.textContent = pen.radius;
  });

  const penInput = document.getElementById('pen');
  penInput.addEventListener('change', (event) => {
    pen.currentId = penInput.value;
  });

  const controlsForm = document.getElementById('controls');
  controlsForm.addEventListener('reset', (event) => {
    game.setTPS(30);
    pen.reset();
    radiusSpan.textContent = pen.radius;
    resetGrid(grid);
  });

  // game events
  game.addEventListener('draw', draw);
  game.addEventListener('tick', tick);
}
