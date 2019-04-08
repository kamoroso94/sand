import * as Cells from './Cells.js';

// linearly interpolate `x from range [`x1`,`x2`] to [`y1`,`y2`]
export const lerp = (x, x1, x2, y1, y2) => y1 + (x - x1) / (x2 - x1) * (y2 - y1);

// clamp `value` into range of [`min`, `max`]
export const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

// log objects that get mutated often as stringified to preserve state
export const log = (...args) => console.log.apply(console, args.map(arg => JSON.stringify(arg)));

// generate range of [`start`, `end`] incremented by `step`
export function* range(start, end, step) {
  if(end === undefined) [start, end] = [0, start];
  if(step === undefined) step = Math.sign(end - start);
  if(step == 0) return;

  if(Math.sign(end - start) != Math.sign(step)) [start, end] = [end, start];

  for(let i = start; Math.sign(i - end) != Math.sign(step); i += step) {
    yield i;
  }
}

// fill `grid` with new air cells
export function resetGrid(grid) {
  grid.forEach((cell, [x, y]) => {
    grid.set(x, y, Cells.create('air'));
  });
}

// find touch object in `touchList` with identifier `id`
export function getTouch(id, touchList) {
  return Array.from(touchList).find(touch => touch.identifier == id);
}
