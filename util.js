"use strict";

function map(val, a1, b1, a2, b2) {
    return (val - a1) / (b1 - a1) * (b2 - a2) + a2;
}

function clamp(value, min, max) {
	return Math.max(min, Math.min(value, max));
}

function* range(start, stop, step) {
    if(stop == undefined) {
        stop = start;
        start = 0;
    }

    if(step == undefined) {
        step = start <= stop ? 1 : -1;
    }

    for(let i = start; step < 0 ? i >= stop : i <= stop; i += step) {
        yield i;
    }
}
