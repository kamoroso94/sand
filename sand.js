"use strict";

class Game {
	constructor(draw, tick, state, tps = 30) {
		this.draw = (dt) => {
			if(draw) {
				draw(dt);
			}
		};
		this.tick = (dt) => {
			if(tick) {
				tick(dt);
			}
		};
		this.state = state;
		this.TPS = tps;
		this.listeners = {};
	}

	// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget#_Simple_implementation_of_EventTarget
	addEventListener(type, callback) {
		if(!(type in this.listeners)) {
			this.listeners[type] = new Set();
		}

		this.listeners[type].add(callback);
	}

	removeEventListener(type, callback) {
		if(!(type in this.listeners)) {
			return;
		}

		this.listeners[type].delete(callback);

		if(this.listeners[type].size == 0) {
			delete this.listeners[type];
		}
	}

	dispatchEvent(event) {
		if (!(event.type in this.listeners)) {
			return;
		}

		event.target = this;

		for(const listener of this.listeners[event.type]) {
			listener.call(this, event);
		}
	}

	resumeDraw() {
		this.pauseDraw();
		this.lastDraw = Date.now();

		// draw loop
		const draw = () => {
			const currentDraw = Date.now();
			const dt = currentDraw - this.lastDraw;

			this.draw(dt);
			this.lastDraw = currentDraw;
			this.drawId = requestAnimationFrame(draw);
		};

		this.drawId = requestAnimationFrame(draw);
	}

	resumeTick() {
		this.pauseTick();
		this.lastTick = Date.now();

		// tick loop
		this.tickId = setInterval(() => {
			const currentTick = Date.now();
			const dt = currentTick - this.lastTick;

			this.tick(dt);
			this.lastTick = currentTick;
		}, 1000 / this.TPS);
	}

	resume() {
		this.resumeDraw();
		this.resumeTick();
	}

	pauseDraw() {
		cancelAnimationFrame(this.drawId);
	}

	pauseTick() {
		clearInterval(this.tickId);
	}

	pause() {
		this.pauseDraw();
		this.pauseTick();
	}

	changeTPS(tps) {
		this.pauseTick();
		this.TPS = tps;

		if(this.TPS > 0) {
			this.resumeTick();
		}
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
		this.array.fill(value);
	}

	clear() {
		this.fill(undefined);
	}

	hasPoint(x, y) {
		return x >= 0 && x < this.width && y >= 0 && y < this.height;
	}
}

class Pen extends Point {
	constructor() {
		super(-1, -1);
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

	stroke(grid) {
		// helper
		const setPixel = (x, y) => {
			grid.set(x, y, CellFactory.create(x, y, this.currentId));
		};

		// draw stroke path
		if(this.hasPrevious()) {
			const dx = this.x - this.prevX;
			const dy = this.y - this.prevY;
			const dist = Math.hypot(dx, dy);
			const cos = dx / dist;
			const sin = dy / dist;

			/* A  C
			 * B  D
			 */
			// get corners
			const cornerA = new Point(this.prevX + this.radius * sin, this.prevY - this.radius * cos);
			const cornerB = new Point(this.prevX - this.radius * sin, this.prevY + this.radius * cos);
			const cornerC = new Point(this.prevX + dist * cos + this.radius * sin, this.prevY - this.radius * cos + dist * sin);
			const cornerD = new Point(this.prevX + dist * cos - this.radius * sin, this.prevY + this.radius * cos + dist * sin);

			// fill in the path
			fillPolygon([cornerA, cornerB, cornerD, cornerC], setPixel);
		}

		// draw pen endpoint
		fillCircle(this.x, this.y, this.radius, setPixel);
	}
}

class Cell extends Point {
	constructor(x, y) {
		super(x, y);
		this.id = null;
		this.color = "#000000";
		this.density = 0;
		this.dir = 1;
		this.gravity = false;
	}

	static get SIZE() {
		return 4;
	}
}

class Converter extends Cell {
	constructor(x, y, victimId, childId) {
		super(x, y);
		this.victimId = victimId;
		this.childId = childId;
	}

	convert(cell) {
		return cell != null && cell.id == this.victimId ? CellFactory.create(cell.x, cell.y, this.childId) : cell;
	}

	static get SPREAD_FACTOR() {
		return 0.05;
	}
}

class Air extends Cell {
	constructor(x, y) {
		super(x, y);
		this.id = "air";
	}
}

class Ground extends Cell {
	constructor(x, y) {
		super(x, y);
		this.id = "ground";
		this.color = "#aa8820";
		this.density = 3;
	}
}

class Sand extends Converter {
	constructor(x, y) {
		super(x, y, "water-spout", "sand");
		this.id = "sand";
		this.color = "#eecc80";
		this.gravity = true;
		this.density = 2;
	}
}

class Water extends Converter {
	constructor(x, y) {
		super(x, y, "sand-spout", "water");
		this.id = "water";
		this.color = "#2020fe";
		this.gravity = true;
		this.density = 1;
	}
}

class Plant extends Converter {
	constructor(x, y) {
		super(x, y, "water", "plant");
		this.id = "plant";
		this.color = "#20cc20";
		this.density = 3;
	}
}

class SandSpout extends Converter {
	constructor(x, y) {
		super(x, y, "air", "sand");
		this.id = "sand-spout";
		this.color = "#edb744";
		this.density = 3;
	}
}

class WaterSpout extends Converter {
	constructor(x, y) {
		super(x, y, "air", "water");
		this.id = "water-spout";
		this.color = "#70a0ff";
		this.density = 3;
	}
}

class CellFactory {
	static create(x, y, id) {
		switch(id) {
			case "air": return new Air(x, y);
			case "ground": return new Ground(x, y);
			case "sand": return new Sand(x, y);
			case "water": return new Water(x, y);
			case "plant": return new Plant(x, y);
			case "sand-spout": return new SandSpout(x, y);
			case "water-spout": return new WaterSpout(x, y);
			default: return null;
		}
	}
}
