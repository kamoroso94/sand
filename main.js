"use strict";

/* TODO:
	add more cell types
*/

let canvas, ctx, grid, drawId, tickId, lastDraw, lastTick;
const TPS = 30;
const pen = new Pen();

window.addEventListener("load", event => {
	canvas = document.getElementById("game");
	ctx = canvas.getContext("2d");

	canvas.addEventListener("mousedown", event => {
		event.preventDefault();

		const bcr = canvas.getBoundingClientRect();
		const x = Math.floor((event.clientX - (bcr.left + window.scrollLeft)) / Cell.size);
		const y = Math.floor((event.clientY - (bcr.top + window.scrollTop)) / Cell.size);

		pen.down(x, y);
	});

	document.addEventListener("mousemove", event => {
		const bcr = canvas.getBoundingClientRect();
		const x = clamp(Math.floor((event.clientX - (bcr.left + window.scrollLeft)) / Cell.size), 0, canvas.width / Cell.size);
		const y = clamp(Math.floor((event.clientY - (bcr.top + window.scrollTop)) / Cell.size), 0, canvas.height / Cell.size);

		pen.move(x, y);
	});

	document.addEventListener("mouseup", event => {
		const bcr = canvas.getBoundingClientRect();
		const x = clamp(Math.floor((event.clientX - (bcr.left + window.scrollLeft)) / Cell.size), 0, canvas.width / Cell.size);
		const y = clamp(Math.floor((event.clientY - (bcr.top + window.scrollTop)) / Cell.size), 0, canvas.height / Cell.size);

		pen.up(x, y);
	});

	canvas.addEventListener("touchstart", event => {
		event.preventDefault();

		if(pen.isDown) {
			return;
		}

		const touch = event.changedTouches[0];
		const bcr = canvas.getBoundingClientRect();
		const x = Math.floor((touch.clientX - bcr.left) / Cell.size);
		const y = Math.floor((touch.clientY - bcr.top) / Cell.size);

		pen.touchId = touch.identifier;
		pen.down(x, y);
	});

	canvas.addEventListener("touchmove", event => {
		event.preventDefault();

		const touch = getTouch(pen.touchId, event.changedTouches);

		if(!pen.isDown || touch == null) {
			return;
		}

		const bcr = canvas.getBoundingClientRect();
		const x = clamp(Math.floor((touch.clientX - bcr.left) / Cell.size), 0, canvas.width / Cell.size);
		const y = clamp(Math.floor((touch.clientY - bcr.top) / Cell.size), 0, canvas.height / Cell.size);

		pen.move(x, y);
	});

	canvas.addEventListener("touchend", event => {
		event.preventDefault();

		const touch = getTouch(pen.touchId, event.changedTouches);

		if(!pen.isDown || touch == null) {
			return;
		}

		const bcr = canvas.getBoundingClientRect();
		const x = clamp(Math.floor((touch.clientX - bcr.left) / Cell.size), 0, canvas.width / Cell.size);
		const y = clamp(Math.floor((touch.clientY - bcr.top) / Cell.size), 0, canvas.height / Cell.size);

		pen.up(x, y);
	});

	const radiusTag = document.getElementById("radius");
	radiusTag.addEventListener("input", e => {
		pen.radius = parseInt(radiusTag.value);
		radiusTag.title = pen.radius;
		document.getElementById("radiusVal").textContent = pen.radius;
	});

	const penTag = document.getElementById("pen");
	penTag.addEventListener("change", e => {
		pen.currentId = penTag.value;
	});

	const formTag = document.getElementById("controls");
	formTag.addEventListener("reset", e => {
		e.preventDefault();
		resetGrid();
	});

	init();
});

function init() {
	grid = new Grid(canvas.width / Cell.size, canvas.height / Cell.size);
	resetGrid();

	lastDraw = Date.now();
	drawId = requestAnimationFrame(draw);

	lastTick = Date.now();
	tickId = setTimeout(tick, 1000 / TPS);
}

function draw(/* timestamp */) {
	const currentDraw = Date.now();
	// const dt = currentDraw - lastDraw;

	ctx.fillStyle = "#000000";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	for(let x = 0; x < grid.width; x++) {
		for(let y = 0; y < grid.height; y++) {
			const cell = grid.get(x, y);

			if(cell instanceof Air) {
				continue;
			}

			ctx.fillStyle = cell.color;
			ctx.fillRect(Cell.size * cell.x, Cell.size * cell.y, Cell.size, Cell.size);
		}
	}

	lastDraw = currentDraw;
	drawId = requestAnimationFrame(draw);
}

function tick() {
	const currentTick = Date.now();
	// const dt = currentTick - lastTick;

	// pen
	if(pen.isDown) {
		if(pen.hasPrevious()) {
			const dx = pen.x - pen.prevX;
			const dy = pen.y - pen.prevY;
			const dist = Math.hypot(dx, dy);
			const cos = dx / dist;
			const sin = dy / dist;

			for(let h = 0; h < dist; h += 0.5) {
				for(let k = -pen.radius; k < pen.radius; k += 0.5) {
					const x = Math.floor(pen.prevX + h * cos - k * sin);
					const y = Math.floor(pen.prevY + k * cos + h * sin);

					grid.set(x, y, CellFactory.create(x, y, pen.currentId));
				}
			}

		}

		for(let h = -pen.radius; h < pen.radius; h++) {
			for(let k = -pen.radius; k < pen.radius; k++) {
				const x = Math.floor(pen.x + h);
				const y = Math.floor(pen.y + k);

				if(h ** 2 + k ** 2 < pen.radius ** 2) {
					grid.set(x, y, CellFactory.create(x, y, pen.currentId));
				}
			}
		}
	}

	pen.setPrevious(pen.x, pen.y);

	const visited = new Set();

	// movement
	for(let y = 0; y < grid.height; y++) {
		for(let x = 0; x < grid.width; x++) {
			const cell = grid.get(x, y);

			if(visited.has(cell)) {
				continue;
			}

			// strafe
			let cellBelow = grid.hasPoint(cell.x, cell.y + 1) ? grid.get(cell.x, cell.y + 1) : new Air(cell.x, cell.y + 1);

			if(cell.gravity && cell.density <= cellBelow.density) {
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

			if(cell.gravity && !visited.has(cellBelow) && cell.density > cellBelow.density) {
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

	// spouts
	for(let y = 0; y < grid.height; y++) {
		for(let x = 0; x < grid.width; x++) {
			const cell = grid.get(x, y);

			if(cell.spawn != null) {
				for(let h = -1; h <= 1; h++) {
					for(let k = -1; k <= 1; k++) {
						if((h == 0 || k == 0) && h != k && grid.hasPoint(x + h, y + k) && grid.get(x + h, y + k) instanceof Air) {
							grid.set(x + h, y + k, CellFactory.create(x + h, y + k, cell.spawn));
						}
					}
				}
			}
		}
	}

	lastTick = currentTick;
	tickId = setTimeout(tick, 1000 / TPS);
}

function resetGrid() {
	for(let x = 0; x < grid.width; x++) {
		for(let y = 0; y < grid.height; y++)  {
			grid.set(x, y, x == 0 || x == grid.width - 1 || y == grid.height - 1 ? new Ground(x, y) : new Air(x, y));
		}
	}
}

function clamp(value, min, max) {
	return Math.max(min, Math.min(value, max));
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
