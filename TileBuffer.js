if (!Math.clamp) {
	Math.clamp = function(v, min, max) {
		return v < min ? min : (v > max ? max : v);
	};
}

import * as colorUtils from './colorUtils.js';
class CacheMap extends Map {
	constructor(iterable, keyToValue) {
		super(iterable);
		this.keyToValue = keyToValue;
	}
	getValue(key) {
		if (!this.has(key)) {
			this.set(key, this.keyToValue(key));
		}
		return this.get(key);
	}
}

export default class TileBuffer {
	constructor(w, h) {
		this.w = w;
		this.h = h;
		this.front = new Uint32Array(this.w * this.h);
		this.back = new Uint32Array(this.w * this.h);
		this.hexMap = new CacheMap([], colorUtils.hexToU32);
		this.bytesMap = new CacheMap([], colorUtils.u32ToHex);
	}
	forEachChange(callback) {
		for (let y = 0; y < this.h; ++y) {
			for (let x = 0; x < this.w; ++x) {
				const i = x + y * this.w;
				if (this.back[i] != this.front[i]) {
					callback([x, y], this.bytesMap.getValue(this.back[i]));
				}
			}
		}
	}
	assign([x, y], color, isU32 = false) {
		if (!isU32) color = this.hexMap.getValue(color);
		this.back[x + y * this.w] = color;
	}
	swap() {
		[this.front, this.back] = [this.back, this.front];
	}
}
