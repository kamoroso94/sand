import { fillPolygon, fillCircle } from './graphics.js';
import { create as createCell } from './Cells.js';

function getPathRect([prevX, prevY], [x, y], width) {
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
		this.isDown = false;
		this.touchId = -1;
		this.currentId = 'ground';
		this.radius = 5;
	}

	down(x, y) {
		this.isDown = true;
		this.move(x, y);
	}

	move(x, y) {
		if(!this.isDown) return;
		if(this.path.length == 0) this.paths.push(this.path);
		this.path.push([x, y]);
	}

	up(x, y) {
		this.move(x, y);
		this.path = [];
		this.isDown = false;
	}

	stroke(grid) {
		// helper
		const setPixel = (x, y) => {
			if(!grid.validKey(x, y)) return;
			grid.set(x, y, createCell(this.currentId, grid.get(x, y)));
		};

		for(const path of this.paths) {
			let prevPos = null;
			for(const pos of path) {
				// draw stroke path
				if(prevPos != null) {
					fillPolygon(getPathRect(prevPos, pos, this.radius), setPixel);
				}

				// draw pen endpoint
				fillCircle(...pos, this.radius, setPixel);

				prevPos = pos;
			}
		}

		this.paths = [];

		if(this.isDown) {
			this.path = this.path.slice(-1);
			this.paths.push(this.path);
		} else {
			this.path = [];
		}
	}
}
