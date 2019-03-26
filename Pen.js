import { fillPolygon, fillCircle } from './graphics.js';
import { create as createCell } from './Cells.js';

const Log = (...args) => console.log.apply(console, args.map(x=>JSON.stringify(x)));

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
		this.startPos = null;
		this.isDown = false;
		this.touchId = -1;
		this.currentId = 'ground';
		this.radius = 5;
	}

	down(x, y) {
		const id = Math.floor(Math.random() * 0x10000).toString(16).padStart(4, 0);
		Log('down.start+'+id, this.paths, this.path, this.startPos);
		this.isDown = true;
		this.move(x, y);
		this.paths.push(this.path);
		Log('down.end+'+id, this.paths, this.path, this.startPos);
	}

	move(x, y) {
		if(!this.isDown) return;
		const id = Math.floor(Math.random() * 0x10000).toString(16).padStart(4, 0);
		Log('move.start+'+id, this.paths, this.path, this.startPos);
		this.path.push([x, y]);
		Log('move.end+'+id, this.paths, this.path, this.startPos);
	}

	up(x, y) {
		const id = Math.floor(Math.random() * 0x10000).toString(16).padStart(4, 0);
		Log('up.start+'+id, this.paths, this.path, this.startPos);
		this.path = [];
		this.isDown = false;
		if(this.paths.length == 0) this.startPos = null;
		Log('up.end+'+id, this.paths, this.path, this.startPos);
	}

	stroke(grid) {
		const id = Math.floor(Math.random() * 0x10000).toString(16).padStart(4, 0);
		Log('stroke.start+'+id, this.paths, this.path, this.startPos);
		// helper
		const setPixel = (x, y) => {
			if(!grid.validKey(x, y)) return;
			grid.set(x, y, createCell(this.currentId, grid.get(x, y)));
		};

		let prevPos = this.startPos;
		for(const path of this.paths) {
			for(const pos of path) {
				// draw stroke path
				if(prevPos != null) {
					fillPolygon(getPath(prevPos, pos, this.radius), setPixel);
				}

				// draw pen endpoint
				fillCircle(...pos, this.radius, setPixel);

				prevPos = pos;
			}
		}

		this.startPos = null;
		if(this.isDown) {
			this.startPos = this.path.pop();
		}
		this.path = [];
		this.paths = [];
		Log('stroke.end+'+id, this.paths, this.path, this.startPos);
	}
}
