"use strict";

/* TODO:
	fix strafing during freefall
	fix water replacing itself (swap not replace)
	make sure not holding cells that fell out
	make sure cells coords are accurate to grid
	add gui, other particles
	
	tl;dr improve physics, add interaction
*/

let canvas, ctx, grid, drawId, tickId, lastDraw, lastTick;
const CELL_DATA = [
	{name: "air", color: "#000000", gravity: false, solid: false},
	{name: "ground", color: "#aa8820", gravity: false, solid: true},
	{name: "sand", color: "#eecc80", gravity: true, solid: true},
	{name: "water", color: "#2020fe", gravity: true, solid: false}
];
const [AIR_ID, GROUND_ID, SAND_ID, WATER_ID] = CELL_DATA.map((v, i) => i);
let currentId = GROUND_ID;
const TPS = 20;
const pen = {
	x: -1,
	y: -1,
	prevX: -1,
	prevY: -1,
	get radius() {return 5;},
	isDown: false
};

window.addEventListener("load", e => {
	canvas = document.getElementById("game");
	ctx = canvas.getContext("2d");

	canvas.addEventListener("mousedown", e => {
		const bcr = canvas.getBoundingClientRect();
		pen.x = Math.floor((e.clientX - bcr.left) / Cell.size);
		pen.y = Math.floor((e.clientY - bcr.top) / Cell.size);
		pen.isDown = true;
	});

	canvas.addEventListener("mousemove", e => {
		const bcr = canvas.getBoundingClientRect();
		pen.x = Math.floor((e.clientX - bcr.left) / Cell.size);
		pen.y = Math.floor((e.clientY - bcr.top) / Cell.size);
	});

	canvas.addEventListener("mouseup", e => {
		const bcr = canvas.getBoundingClientRect();
		pen.x = Math.floor((e.clientX - bcr.left) / Cell.size);
		pen.y = Math.floor((e.clientY - bcr.top) / Cell.size);
		pen.isDown = false;
	});

	canvas.addEventListener("mouseleave", e => {
		pen.prevX = -1;
		pen.prevY = -1;
		pen.isDown = false;
	});

	init();
});

function init() {
	grid = new Grid(canvas.width / Cell.size, canvas.height / Cell.size);

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

			if(cell == null) {
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

					grid.set(x, y, new Cell(x, y, currentId));
				}
			}

		}

		for(let h = -pen.radius; h < pen.radius; h++) {
			for(let k = -pen.radius; k < pen.radius; k++) {
				const x = pen.x + h;
				const y = pen.y + k;

				if(h ** 2 + k ** 2 < pen.radius ** 2) {
					grid.set(x, y, new Cell(x, y, currentId));
				}
			}
		}
	}

	pen.prevX = pen.x;
	pen.prevY = pen.y;

	for(let y = 0; y < grid.height; y++) {
		for(let x = 0; x < grid.width; x++) {
			const cell = grid.get(x, y);

			if(cell == null) {
				continue;
			}

			// strafe
			let cellBelow = grid.get(cell.x, cell.y + 1);

			if(cell.gravity && cellBelow != null && cellBelow.solid) {
				for(let i = 0; i < 2; i++) {
					const cellAside = grid.get(cell.x + cell.dir, cell.y);

					if(cellAside == null || !cellAside.solid) {
						grid.set(cell.x, cell.y, cellAside);
						grid.set(cell.x + cell.dir, cell.y, cell);
						cell.x += cell.dir;
						break;
					} else {
						cell.dir *= -1;
					}
				}
			}

			// fall
			cellBelow = grid.get(cell.x, cell.y + 1);

			if(cell.gravity && (cellBelow == null || !cellBelow.solid)) {
				grid.set(cell.x, cell.y, cellBelow);
				grid.set(cell.x, cell.y + 1, cell);
				cell.y++;
			}

			if(cell.x > x) {
				x++;
			}
		}
	}

	lastTick = currentTick;
	tickId = setTimeout(tick, 1000 / TPS);
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

	hasPoint(x, y) {
		return x >= 0 && x < this.width && y >= 0 && y < this.height;
	}
}

class Cell {
	static get size() {
		return 4;
	}

	constructor(x, y, id = 0) {
		this.x = x;
		this.y = y;
		this.dir = 1;
		this.id = id;
	}

	get name() {
		return CELL_DATA[this.id].name;
	}

	get color() {
		return CELL_DATA[this.id].color;
	}

	get gravity() {
		return CELL_DATA[this.id].gravity;
	}

	get solid() {
		return CELL_DATA[this.id].solid;
	}
}
