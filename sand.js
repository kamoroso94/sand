"use strict";

// class declarations

class Pen {
	constructor() {
		this.reset();
	}

	reset() {
		this.x = -1;
		this.y = -1;
		this.prevX = -1;
		this.prevY = -1;
		this.isDown = false;
		this.touchId = -1;
		this.currentId = "ground";
		this.radius = 5;
	}

	down(x, y) {
		this.move(x, y);
		this.setPrevious(-1 ,-1);
		this.isDown = true;
	}

	move(x, y) {
		this.x = x;
		this.y = y;
	}

	up(x, y) {
		this.move(x, y);
		this.setPrevious(-1 ,-1);
		this.isDown = false;
	}

	setPrevious(x, y) {
		this.prevX = x;
		this.prevY = y;
	}

	hasPrevious() {
		return this.prevX >= 0 && this.prevY >= 0;
	}
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
	static get SIZE() {
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
