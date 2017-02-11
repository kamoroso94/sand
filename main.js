"use strict";

/* TODO:
	add other particles
	add touch support
*/

let canvas, ctx, grid, drawId, tickId, lastDraw, lastTick;
const TPS = 30;
const pen = {
	x: -1,
	y: -1,
	prevX: -1,
	prevY: -1,
	radius: 5,
	currentId: "ground",
	isDown: false
};

window.addEventListener("load", e => {
	canvas = document.getElementById("game");
	ctx = canvas.getContext("2d");

	canvas.addEventListener("mousedown", e => {
		e.preventDefault();

		const bcr = canvas.getBoundingClientRect();
		pen.x = Math.floor((e.clientX - bcr.left) / Cell.size);
		pen.y = Math.floor((e.clientY - bcr.top) / Cell.size);
		pen.isDown = true;
	});

	document.addEventListener("mousemove", e => {
		const bcr = canvas.getBoundingClientRect();
		pen.x = clamp(Math.floor((e.clientX - bcr.left) / Cell.size), 0, canvas.width / Cell.size);
		pen.y = clamp(Math.floor((e.clientY - bcr.top) / Cell.size), 0, canvas.height / Cell.size);
	});

	document.addEventListener("mouseup", e => {
		const bcr = canvas.getBoundingClientRect();
		pen.x = clamp(Math.floor((e.clientX - bcr.left) / Cell.size), 0, canvas.width / Cell.size);
		pen.y = clamp(Math.floor((e.clientY - bcr.top) / Cell.size), 0, canvas.height / Cell.size);
		pen.isDown = false;
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
		if(pen.prevX >= 0 && pen.prevY >= 0) {
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

	pen.prevX = pen.x;
	pen.prevY = pen.y;

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

class Grid {
	constructor(width, height) {
		this.width = width;
		this.height = height;
		this.array = new Array(width * height);
	}

	get(x, y) {
		return this.hasPoint(x, y) ? this.array[x + y * this.width] : undefined;
	}

	set(x, y, value) {
		if(this.hasPoint(x, y)) {
			this.array[x + y * this.width] = value;
		}
	}

	fill(value) {
		for(let i = 0; i < this.array.length; i++) {
			this.array[i] = value;
		}
	}

	clear() {
		this.fill(undefined);
	}

	hasPoint(x, y) {
		return x >= 0 && x < this.width && y >= 0 && y < this.height;
	}
}

class Cell {
	static get size() {
		return 4;
	}

	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.dir = 1;
	}
}

class Air extends Cell {
	constructor(x, y) {
		super(x, y);
		this.color = "#000000";
		this.gravity = false;
		this.density = 0;
		this.spawn = null;
	}
}

class Ground extends Cell {
	constructor(x, y) {
		super(x, y);
		this.color = "#aa8820";
		this.gravity = false;
		this.density = 3;
		this.spawn = null;
	}
}

class Sand extends Cell {
	constructor(x, y) {
		super(x, y);
		this.color = "#eecc80";
		this.gravity = true;
		this.density = 2;
		this.spawn = null;
	}
}

class Water extends Cell {
	constructor(x, y) {
		super(x, y);
		this.color = "#2020fe";
		this.gravity = true;
		this.density = 1;
		this.spawn = null;
	}
}

class SandSpout extends Cell {
	constructor(x, y) {
		super(x, y);
		this.color = "#edb744";
		this.gravity = false;
		this.density = 3;
		this.spawn = "sand";
	}
}

class WaterSpout extends Cell {
	constructor(x, y) {
		super(x, y);
		this.color = "#70a0ff";
		this.gravity = false;
		this.density = 3;
		this.spawn = "water";
	}
}

class CellFactory {
	static create(x, y, id) {
		switch(id) {
			case "air":
			return new Air(x, y);
			break;

			case "ground":
			return new Ground(x, y);
			break;

			case "sand":
			return new Sand(x, y);
			break;

			case "water":
			return new Water(x, y);
			break;

			case "sand-spout":
			return new SandSpout(x, y);
			break;

			case "water-spout":
			return new WaterSpout(x, y);
			break;

			default:
			return null;
		}
	}
}
/*Cell.DATA = {
	"air": {color: "#000000", gravity: false, density: 0, spawn: null},
	"ground": {color: "#aa8820", gravity: false, density: 3, spawn: null},
	"sand": {color: "#eecc80", gravity: true, density: 2, spawn: null},
	"water": {color: "#2020fe", gravity: true, density: 1, spawn: null},
	"sand-spout": {color: "#edb744", gravity: false, density: 3, spawn: "sand"},
	"water-spout": {color: "#70a0ff", gravity: false, density: 3, spawn: "water"}
};*/
