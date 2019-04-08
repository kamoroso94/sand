export default class EventTarget {
  constructor() {
    this._listeners = new Map();
  }

  addEventListener(type, callback) {
    if(!this._listeners.has(type)) {
      this._listeners.set(type, new Set());
    }
    this._listeners.get(type).add(callback);
  }

  removeEventListener(type, callback) {
    if(!this._listeners.has(type)) return;

    this._listeners.get(type).delete(callback);
  }

  dispatchEvent(event) {
    if(!this._listeners.has(event.type)) return true;

    Object.defineProperty(event, 'target', {
      value: this,
      writable: false
    });

    const listeners = this._listeners.get(event.type);
    for(const listener of listeners) {
      listener.call(this, event);
    }

    return !event.defaultPrevented;
  }
}
