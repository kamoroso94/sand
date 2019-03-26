import { fillPolygon, fillCircle } from './graphics.js';
import { create as createCell } from './Cells.js';

const Log = (...args) => console.log(...args.map(x=>JSON.stringify(x)));

function getPath([prevX, prevY], [x, y], width) {
	const dx = x - prevX;
	const dy = y - prevY;
	const dist = Math.hypot(dx, dy);
	const cos = dx / dist;
	const sin = dy / dist;

	/* A----D
	 * |    |
	 * B----C
	 */
	// get corners
	const cornerA = [
		prevX + width * sin,
		prevY - width * cos
	];
	const cornerB = [
		prevX - width * sin,
		prevY + width * cos
	];
	const cornerC = [
		prevX + dist * cos - width * sin,
		prevY + width * cos + dist * sin
	];
	const cornerD = [
		prevX + dist * cos + width * sin,
		prevY - width * cos + dist * sin
	];

	return [cornerA, cornerB, cornerC, cornerD];
}

export default class Pen {
	constructor() {
		this.reset();
	}

	reset() {
		this.paths = [];
		this.path = [];
		this.lastPos = null;
		this.isDown = false;
		this.touchId = -1;
		this.currentId = 'ground';
		this.radius = 5;
	}

	down(x, y) {
		this.isDown = true;
		this.move(x, y);
		this.move(x, y);
	}

	move(x, y) {
		this.path.push([x, y]);
	}

	up(x, y, offCanvas = false) {
		this.isDown = false;
		if (!offCanvas) {
			this.path.push([x, y]);
		}
		if (this.path.length > 1) {
			this.paths.push(this.path);
		}
		this.path = [];
	}

	stroke(grid) {
		// helper
		const setPixel = (x, y) => {
			if(!grid.validKey(x, y)) return;
			grid.set(x, y, createCell(this.currentId, grid.get(x, y)));
		};

		if (this.path.length > 1) {
			this.paths.push(this.path);
			if (this.isDown) {
				this.path = [this.path[this.path.length - 1].slice()];
			} else {
				this.path = [];
			}
		}

		// let prevPos = this.startPos;
		for(const path of this.paths) {
			fillCircle(...path[0], this.radius, setPixel);
			for(let i = 0; i + 1 < path.length; ++i) {
				let startPos = path[i];
				let endPos = path[i + 1];
				fillPolygon(getPath(startPos, endPos, this.radius), setPixel);
			}
			fillCircle(...path[path.length - 1], this.radius, setPixel);
		}
		this.paths = [];
	}
}
