"use strict";

/* TODO:
	add more cell types
*/

let game;

// setup
window.addEventListener("load", (event) => {
	const canvas = document.getElementById("game");
	const ctx = canvas.getContext("2d");
	const pen = new Pen();
	const grid = new Grid(canvas.width / Cell.SIZE, canvas.height / Cell.SIZE);

	// init
	resetGrid(grid);
	game = new Game({canvas, ctx, pen, grid});

	// event listeners
	attatchHandlers();

	// begin
	game.resume();
});

function attatchHandlers() {
	const {canvas, pen, grid} = game.state;

	// helper
	const translateCoords = ({clientX, clientY}) => {
		// translate coords in viewport to translated, scaled, clipped coords of grid
		const bcr = canvas.getBoundingClientRect();
		const sideWidth = ["top", "right", "bottom", "left"].reduce((sum, side) => {
			sum[side] = Object.values($(canvas).css([
				`border-${side}-width`,
				`padding-${side}`
			])).reduce((a, b) => a + parseFloat(b), 0);
			return sum;
		}, {});
		const scaleX = grid.width / (bcr.width - (sideWidth.left + sideWidth.right));
		const scaleY = grid.height / (bcr.height - (sideWidth.top + sideWidth.bottom));
		const x = clamp((clientX - (bcr.left + sideWidth.left)) * scaleX, 0, grid.width);
		const y = clamp((clientY - (bcr.top + sideWidth.top)) * scaleY, 0, grid.height);

		return {x, y};
	};

	// pen events
	canvas.addEventListener("mousedown", (event) => {
		event.preventDefault();
		const {x, y} = translateCoords(event);
		pen.down(x, y);
	});

	document.addEventListener("mousemove", (event) => {
		const {x, y} = translateCoords(event);
		pen.move(x, y);
	});

	document.addEventListener("mouseup", (event) => {
		const {x, y} = translateCoords(event);
		pen.up(x, y);
	});

	canvas.addEventListener("touchstart", (event) => {
		event.preventDefault();

		if(pen.isDown) {
			return;
		}

		const [touch] = event.changedTouches;
		const {x, y} = translateCoords(touch);

		pen.touchId = touch.identifier;
		pen.down(x, y);
	});

	canvas.addEventListener("touchmove", (event) => {
		event.preventDefault();

		const touch = getTouch(pen.touchId, event.changedTouches);

		if(!pen.isDown || touch == null) {
			return;
		}

		const {x, y} = translateCoords(touch);
		pen.move(x, y);
	});

	canvas.addEventListener("touchend", (event) => {
		event.preventDefault();

		const touch = getTouch(pen.touchId, event.changedTouches);

		if(!pen.isDown || touch == null) {
			return;
		}

		const {x, y} = translateCoords(touch);
		pen.up(x, y);
	});

	// ui events
	const speedTag = document.getElementById("speed");
	speedTag.addEventListener("change", (event) => {
		game.setTPS(parseFloat(speedTag.value));
	});

	const radiusTag = document.getElementById("radius");
	$(radiusTag).popover({
		content: pen.radius,
		placement: "auto bottom",
		trigger: "hover"
	});
	radiusTag.addEventListener("input", (event) => {
		pen.radius = parseInt(radiusTag.value);
		radiusTag.setAttribute("data-content", pen.radius);
		$(radiusTag).popover("show");
	});

	const penTag = document.getElementById("pen");
	penTag.addEventListener("change", (event) => {
		pen.currentId = penTag.value;
	});

	const formTag = document.getElementById("controls");
	formTag.addEventListener("reset", (event) => {
		game.setTPS(30);
		pen.reset();
		radiusTag.setAttribute("data-content", pen.radius);
		resetGrid(grid);
	});

	// game events
	game.addEventListener("draw", draw);
	game.addEventListener("tick", tick);
}

function draw(event) {
	const {dt} = event.detail;
	const {canvas, ctx, pen, grid} = this.state;
	const bgColor = "#000000";

	// reset canvas
	ctx.fillStyle = bgColor;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// reset edges
	for(let y = 0; y < grid.height; y++) {
		grid.set(0, y, new Ground(0, y));
		grid.set(grid.width - 1, y, new Ground(grid.width - 1, y));
	}

	// pen
	if(pen.isDown) {
		pen.stroke(grid);
	}
	pen.setPrevious(pen.x, pen.y);

	// draw cells
	for(const cell of grid) {
		if(cell.color == bgColor) {
			continue;
		}

		ctx.fillStyle = cell.color;
		ctx.fillRect(Cell.SIZE * cell.x, Cell.SIZE * cell.y, Cell.SIZE, Cell.SIZE);
	}
}

function tick(event) {
	const {dt} = event.detail;
	const {canvas, ctx, pen, grid} = this.state;
	const visited = new Set();

	// movement
	let x = 0;
	let dx = 1;
	for(let y = 0; y < grid.height; y++) {
		while(x >=0 && x < grid.width) {
			const cell = grid.get(x, y);

			if(!visited.has(cell) && cell.hasGravity) {
				// strafe
				moveSide(cell, grid, visited);
				// fall
				moveDown(cell, grid, visited);
			}

			x += dx;
		}

		x -= dx;
		dx *= -1;
	}

	visited.clear();

	// spreading
	grid.forEach((cell, [x, y]) => {
		if(!visited.has(cell) && cell instanceof Converter) {
			for(let h = -1; h <= 1; h++) {
				for(let k = -1; k <= 1; k++) {
					if(grid.hasPoint(x + h, y + k) && (h == 0 || k == 0) && h != k && Math.random() < Converter.SPREAD_FACTOR) {
						const resultCell = cell.convert(grid.get(x + h, y + k));
						grid.set(x + h, y + k, resultCell);
						visited.add(resultCell);
					}
				}
			}
		}
	});
}

// helper functions
function getOrMakeCell(x, y, grid) {
	return grid.hasPoint(x, y) ? grid.get(x, y) : new Air(x, y);
}

function moveSide(cell, grid, visited) {
	const cellBelow = getOrMakeCell(cell.x, cell.y + 1, grid);

	for(let i = 0; i < 2; i++) {
		const cellAside = getOrMakeCell(cell.x + cell.dir, cell.y, grid);
		const cellOtherSide = getOrMakeCell(cell.x - cell.dir, cell.y, grid);

		if(!visited.has(cellAside) && cell.canPhaseThrough(cellAside) && (!cell.canPhaseThrough(cellOtherSide) || !cell.canPhaseThrough(cellBelow))) {
			grid.set(cell.x, cell.y, cellAside);
			grid.set(cellAside.x, cellAside.y, cell);
			cellAside.x -= cell.dir;
			cell.x += cell.dir;
			visited.add(cellAside);
			visited.add(cell);

			return true;
		} else {
			cell.dir *= -1;
		}
	}

	return false;
}

function moveDown(cell, grid, visited) {
	const cellBelow = getOrMakeCell(cell.x, cell.y + 1, grid);

	if(!visited.has(cellBelow) && cell.canPhaseThrough(cellBelow)) {
		grid.set(cell.x, cell.y, cellBelow);
		grid.set(cellBelow.x, cellBelow.y, cell);
		cellBelow.y--;
		cell.y++;
		visited.add(cellBelow);
		visited.add(cell);

		return true;
	}

	return false;
}

function map(val, a1, a2, b1, b2) {
    return (val - a1) / (a2 - a1) * (b2 - b1) + b1;
}

function clamp(value, min, max) {
	return Math.max(min, Math.min(value, max));
}

function resetGrid(grid) {
	grid.forEach((v, [x, y]) => {
		grid.set(x, y, new Air(x, y));
	});
}

function getTouch(id, touchList) {
	for(let i = 0; i < touchList.length; i++) {
		const touch = touchList.item(i);

		if(touch.identifier == id) {
			return touch;
		}
	}

	return null;
}
