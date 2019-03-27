import * as Cells from './Cells.js';
import Game from './Game.js';
import Grid from './Grid.js';
import Pen from './Pen.js';
import TileBuffer from './TileBuffer.js';

// TODO: fix cell movements, try to eliminate mutable/cloned objects in grid
//	string/int storage is best

const lerp = (x, x1, x2, y1, y2) => y1 + (x - x1) / (x2 - x1) * (y2 - y1);
const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

// TODO:
//	try to break up this file
//	check for other places that Cells should be used

// setup
window.addEventListener('DOMContentLoaded', (event) => {
	const canvas = document.getElementById('game');
	const ctx = canvas.getContext('2d');
	const pen = new Pen();
	const [w, h] = [canvas.width / Cells.SIZE, canvas.height / Cells.SIZE];
	const grid = new Grid(w, h);
	const tileBuffer = new TileBuffer(w, h);

	// init
	resetGrid(grid);
	const game = new Game({canvas, ctx, pen, grid, tileBuffer});
	ctx.fillStyle = "#000";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

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
		sideWidth: null,
		style: window.getComputedStyle(canvas)
	};
	const clearCache = () => {
		cache.bcr = null;
		cache.sideWidth = null;
	};
	const translateCoords = ({clientX, clientY}) => {
		// translate coords in viewport to translated, scaled, clipped coords of grid
		if(!cache.bcr) cache.bcr = canvas.getBoundingClientRect();
		if(!cache.sideWidth) {
			cache.sideWidth = ['top', 'right', 'bottom', 'left'].reduce((sum, side) => {
				const borderWidth = parseFloat(cache.style[`border-${side}-width`]);
				const padding = parseFloat(cache.style[`padding-${side}`]);
				sum[side] = borderWidth + padding;
				return sum;
			}, {});
		}

		const {bcr, sideWidth} = cache;
		const scaleX = grid.width / (bcr.width - (sideWidth.left + sideWidth.right));
		const scaleY = grid.height / (bcr.height - (sideWidth.top + sideWidth.bottom));
		const x = clamp((clientX - (bcr.left + sideWidth.left)) * scaleX, 0, grid.width);
		const y = clamp((clientY - (bcr.top + sideWidth.top)) * scaleY, 0, grid.height);

		return [x, y];
	};

	// clear cache
	window.addEventListener('resize', clearCache);
	window.addEventListener('scroll', clearCache);

	// pen events
	canvas.addEventListener('mousedown', (event) => {
		event.preventDefault();
		pen.down(...translateCoords(event));
	});

	document.addEventListener('mousemove', (event) => {
		if(!pen.isDown) return;
		pen.move(...translateCoords(event));
	});

	document.addEventListener('mouseup', (event) => {
		pen.up(...translateCoords(event), event.target != canvas);
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
		if(!pen.isDown) return;
		const touch = getTouch(pen.touchId, event.changedTouches);
		if(touch != null) pen.move(...translateCoords(touch));
	});

	canvas.addEventListener('touchend', (event) => {
		event.preventDefault();
		const touch = getTouch(pen.touchId, event.changedTouches);
		if(pen.isDown && touch != null) pen.up(...translateCoords(touch));
	});

	// ui events
	const speedTag = document.getElementById('speed');
	speedTag.addEventListener('change', (event) => {
		game.setTPS(parseFloat(speedTag.value));
	});

	const radiusTag = document.getElementById('radius');
	radiusTag.addEventListener('input', (event) => {
		pen.radius = parseInt(radiusTag.value);
		document.getElementById('radius-value').textContent = pen.radius;
	});

	const penTag = document.getElementById('pen');
	penTag.addEventListener('change', (event) => {
		pen.currentId = penTag.value;
	});

	const formTag = document.getElementById('controls');
	formTag.addEventListener('reset', (event) => {
		game.setTPS(30);
		pen.reset();
		resetGrid(grid);
	});

	// game events
	game.addEventListener('draw', draw);
	game.addEventListener('tick', tick);
}

function draw(event) {
	const {dt} = event.detail;
	const {canvas, ctx, pen, grid, tileBuffer} = this.state;

	// reset canvas
	// ctx.clearRect(0, 0, canvas.width, canvas.height);

	// reset edges
	for(let y = 0; y < grid.height; y++) {
		grid.get(0, y).id = 'ground';
		grid.get(grid.width - 1, y).id = 'ground';
	}

	// pen
	pen.stroke(grid);

	for(let y = 0; y < grid.height; y++) {
		for(let x = 0; x < grid.width; x++) {
			const cell = grid.array[x + y * grid.width];
			if (!cell) continue;

			tileBuffer.assign([x, y], Cells.data[cell.id].color);
		}
	}

	// draw cells
	tileBuffer.forEachChange(([x, y], color) => {
		ctx.fillStyle = color;
		ctx.fillRect(Cells.SIZE * x, Cells.SIZE * y, Cells.SIZE, Cells.SIZE);
	});
	tileBuffer.swap();
}

function tick(event) {
	const {dt} = event.detail;
	const {canvas, ctx, pen, grid, tileBuffer} = this.state;
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
	for(let y1 = 0; y1 < grid.height; y1++) {
		for(let x1 = 0; x1 < grid.width; x1++) {
			const cell1 = grid.array[x1 + y1 * grid.width];
			if (!cell1) continue;

			if(visited.has(cell1)) continue;
			if(!Cells.data[cell1.id].hasOwnProperty('conversions')) continue;

			for(const [cell2, [x2, y2]] of grid.neighborEntries(x1, y1)) {
				// not diagonal neighbors
				if(Math.abs(x1 - x2) + Math.abs(y1 - y2) != 1) continue;
				if(Math.random() >= Cells.SPREAD_RATE) continue;

				Cells.convert(cell1, cell2);
				visited.add(cell2);
			}
		}
	}
}

// helper functions
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

function resetGrid(grid) {
	grid.forEach((cell, [x, y]) => {
		grid.set(x, y, Cells.create('air'));
	});
}

function getTouch(id, touchList) {
	return Array.from(touchList).find(touch => touch.identifier == id);
}

function* range(start, end, step) {
	if(end === undefined) [start, end] = [0, start];
	if(step === undefined) step = Math.sign(end - start);
	if(step == 0) return;

	if(Math.sign(end - start) != Math.sign(step)) [start, end] = [end, start];

	for(let i = start; Math.sign(i - end) != Math.sign(step); i += step) {
		yield i;
	}
}
