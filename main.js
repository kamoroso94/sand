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
	game = new Game(draw, tick, {canvas, ctx, pen, grid});

	// helper
	const translateCoords = ({clientX, clientY}) => {
		const bcr = canvas.getBoundingClientRect();
		const gridWidth = canvas.width / Cell.SIZE;
		const gridHeight = canvas.height / Cell.SIZE;
		const scaleX = gridWidth / bcr.width;
		const scaleY = gridHeight / bcr.height;
		const x = clamp(Math.floor((clientX - bcr.left) * scaleX), 0, gridWidth);
		const y = clamp(Math.floor((clientY - bcr.top) * scaleY), 0, gridHeight);

		return {x, y};
	};

	// event listeners
	// pen
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

	// ui
	const speedTag = document.getElementById("speed");
	speedTag.addEventListener("change", (event) => {
		game.changeTPS(parseFloat(speedTag.value));
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
		game.changeTPS(30);
		pen.reset();
		radiusTag.setAttribute("data-content", pen.radius);
		resetGrid(grid);
	});

	// begin
	game.resume();
});

function draw(dt) {
	const bgColor = "#000000";
	const {canvas, ctx, pen, grid} = game.state;

	// reset canvas
	ctx.fillStyle = bgColor;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// pen
	if(pen.isDown) {
		pen.stroke(grid);
	}
	pen.setPrevious(pen.x, pen.y);

	// draw cells
	for(let x = 0; x < grid.width; x++) {
		for(let y = 0; y < grid.height; y++) {
			const cell = grid.get(x, y);

			if(cell.color == bgColor) {
				continue;
			}

			ctx.fillStyle = cell.color;
			ctx.fillRect(Cell.SIZE * cell.x, Cell.SIZE * cell.y, Cell.SIZE, Cell.SIZE);
		}
	}
}

function tick(dt) {
	const {canvas, ctx, pen, grid} = game.state;

	// movement
	const visited = new Set();
	for(let y = 0; y < grid.height; y++) {
		for(let x = 0; x < grid.width; x++) {
			const cell = grid.get(x, y);

			if(visited.has(cell) || !cell.gravity) {
				continue;
			}

			// strafe
			let cellBelow = grid.hasPoint(cell.x, cell.y + 1) ? grid.get(cell.x, cell.y + 1) : new Air(cell.x, cell.y + 1);

			if(cell.density <= cellBelow.density) {
				for(let i = 0; i < 2; i++) {
					const cellAside = grid.hasPoint(cell.x + cell.dir, cell.y) ? grid.get(cell.x + cell.dir, cell.y) : new Air(cell.x + cell.dir, cell.y);

					if(!visited.has(cellAside) && cell.density > cellAside.density) {
						grid.set(cell.x, cell.y, cellAside);
						grid.set(cell.x + cell.dir, cell.y, cell);

						visited.add(cell);
						visited.add(cellAside);

						cellAside.x -= cell.dir;
						cell.x += cell.dir;
						break;
					} else {
						cell.dir *= -1;
					}
				}
			}

			// fall
			cellBelow = grid.hasPoint(cell.x, cell.y + 1) ? grid.get(cell.x, cell.y + 1) : new Air(cell.x, cell.y + 1);

			if(!visited.has(cellBelow) && cell.density > cellBelow.density) {
				grid.set(cell.x, cell.y, cellBelow);
				grid.set(cell.x, cell.y + 1, cell);

				visited.add(cell);
				visited.add(cellBelow);

				cellBelow.y--;
				cell.y++;
			}
		}
	}
	visited.clear();

	// spreading
	for(let y = 0; y < grid.height; y++) {
		for(let x = 0; x < grid.width; x++) {
			const cell = grid.get(x, y);

			if(cell instanceof Converter) {
				for(let h = -1; h <= 1; h++) {
					for(let k = -1; k <= 1; k++) {
						if((h == 0 || k == 0) && h != k && Math.random() < Converter.SPREAD_FACTOR) {
							grid.set(x + h, y + k, cell.convert(grid.get(x + h, y + k)));
						}
					}
				}
			}
		}
	}
}

// helper functions
function map(val, a1, a2, b1, b2) {
    return (val - a1) / (a2 - a1) * (b2 - b1) + b1;
}

function clamp(value, min, max) {
	return Math.max(min, Math.min(value, max));
}

function resetGrid(grid) {
	for(let x = 0; x < grid.width; x++) {
		for(let y = 0; y < grid.height; y++)  {
			grid.set(x, y, x == 0 || x == grid.width - 1 || y == grid.height - 1 ? new Ground(x, y) : new Air(x, y));
		}
	}
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
