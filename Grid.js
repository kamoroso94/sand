export default class Grid {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.clear();
  }

  [Symbol.iterator]() {
    return this.array.values();
  }

  clear() {
    this.array = new Array(this.width * this.height);
  }

  forEach(callback, thisArg) {
    for(let y = 0; y < this.height; y++) {
      for(let x = 0; x < this.width; x++) {
        callback.call(thisArg, this.get(x, y), [x, y], this);
      }
    }
  }

  get(x, y) {
    return this.validKey(x, y) ? this.array[x + y * this.width] : undefined;
  }

  *neighborEntries(x, y) {
    for(let h = -1; h <= 1; h++) {
      for(let k = -1; k <= 1; k++) {
        if(h == 0 && k == 0 || !this.validKey(x + h, y + k)) continue;
        const key = [x + h, y + k];
        yield [this.get.apply(this, key), key];
      }
    }
  }

  set(x, y, value) {
    if(!this.validKey(x, y)) return false;
    if(!value) console.warn(this, x, y, value);  // TODO: remove post-debug
    this.array[x + y * this.width] = value;
    return true;
  }

  validKey(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }
}
