import * as Cells from './Cells.js';
import { range } from './util.js';

export default function tick(event) {
  const {dt} = event.detail;
  const {canvas, ctx, pen, grid} = this.state;
  const visited = new Set();

  // movement
  // TODO: verify identical movement algorithm from before
  let dx = 1;
  for(let y = 0; y < grid.height; y++) {
    for(const x of range(0, grid.width - 1, dx)) {
      const cell = grid.get(x, y);

      if(visited.has(cell)) continue;
      if(!Cells.data[cell.id].hasGravity) continue;
      if(Cells.data[cell.id].density == 0) continue;
      // strafe/fall
      const [sideX, sideY] = moveSide(x, y, grid, visited);
      moveDown(sideX, sideY, grid, visited);
    }
    dx *= -1;
  }

  visited.clear();

  // spreading
  grid.forEach((cell1, [x1, y1]) => {
    if(visited.has(cell1)) return;
    if(!Cells.data[cell1.id].hasOwnProperty('conversions')) return;

    for(const [cell2, [x2, y2]] of grid.neighborEntries(x1, y1)) {
      // not diagonal neighbors
      if(Math.abs(x1 - x2) + Math.abs(y1 - y2) != 1) continue;
      if(Math.random() >= Cells.SPREAD_RATE) continue;

      Cells.convert(cell1, cell2);
      visited.add(cell2);
    }
  });
}

function getOrMakeCell(x, y, grid) {
  return grid.validKey(x, y) ? grid.get(x, y) : Cells.create('air');
}

function moveSide(x, y, grid, visited) {
  const cell = grid.get(x, y);
  const cellBelow = getOrMakeCell(x, y + 1, grid);

  // TODO: consider refactoring
  for(let i = 0; i < 2; i++) {
    const cellAside = getOrMakeCell(x + cell.dir, y, grid);
    const cellOtherSide = getOrMakeCell(x - cell.dir, y, grid);
    const cellCanPhase = Cells.canPhase.bind(null, cell);

    if(visited.has(cellAside) ||
      !cellCanPhase(cellAside) ||
      cellCanPhase(cellOtherSide) &&
      cellCanPhase(cellBelow)
    ) {
      cell.dir *= -1;
      continue;
    }

    // swap cells
    grid.set(x, y, cellAside);
    grid.set(x + cell.dir, y, cell);
    // mark visited
    visited.add(cellAside);
    visited.add(cell);

    return [x + cell.dir, y];
  }

  return [x, y];
}

function moveDown(x, y, grid, visited) {
  const cell = grid.get(x, y);
  const cellBelow = getOrMakeCell(x, y + 1, grid);

  if(visited.has(cellBelow)) return [x, y];
  if(!Cells.canPhase(cell, cellBelow)) return [x, y];

  // swap cells
  grid.set(x, y, cellBelow);
  grid.set(x, y + 1, cell);
  // mark visited
  visited.add(cellBelow);
  visited.add(cell);

  return [x, y + 1];
}
