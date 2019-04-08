import EventTarget from './EventTarget.js';

export default class Game extends EventTarget {
  constructor(state={}, tps=30) {
    super();
    this.state = state;
    this.TPS = tps;

    this._draw = (timestamp) => {
      const currentDraw = timestamp;
      const dt = currentDraw - this.lastDraw;

      this.dispatchEvent(new CustomEvent('draw', {detail: {dt}}));
      this.lastDraw = currentDraw;
      this.drawId = requestAnimationFrame(this._draw);
    };

    this._tick = () => {
      const currentTick = performance.now();
      const dt = currentTick - this.lastTick;

      this.dispatchEvent(new CustomEvent('tick', {detail: {dt}}));
      this.lastTick = currentTick;
    };
  }

  resumeDraw() {
    this.pauseDraw();
    this.lastDraw = performance.now();
    // draw loop
    this.drawId = requestAnimationFrame(this._draw);
  }

  resumeTick() {
    this.pauseTick();
    this.lastTick = performance.now();
    // tick loop
    this.tickId = setInterval(this._tick, 1000 / this.TPS);
  }

  resume() {
    if(this.dispatchEvent(new CustomEvent('resume'))) {
      this.resumeDraw();
      this.resumeTick();
    }
  }

  pauseDraw() {
    cancelAnimationFrame(this.drawId);
  }

  pauseTick() {
    clearInterval(this.tickId);
  }

  pause() {
    if(this.dispatchEvent(new CustomEvent('pause'))) {
      this.pauseDraw();
      this.pauseTick();
    }
  }

  setTPS(tps) {
    this.pauseTick();
    this.TPS = tps;

    if(this.TPS > 0) {
      this.resumeTick();
    }
  }
}
