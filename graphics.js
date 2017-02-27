"use strict";

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

function drawHorizontal(x1, x2, y, setPixel) {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    y = Math.floor(y);

    for(let x = Math.floor(minX); x < maxX; x++) {
        setPixel(x, y);
    }
}

// https://youtu.be/q8bEoSn4KZk
// http://web.cs.ucdavis.edu/~ma/ECS175_S00/Notes/0411_b.pdf
// https://www.techfak.uni-bielefeld.de/ags/wbski/lehre/digiSA/WS0607/3DVRCG/Vorlesung/13.RT3DCGVR-vertex-2-fragment.pdf
function fillPolygon(points, setPixel) {
    let minY, maxY;
    minY = maxY = points[0].y;

    // find min and max y of polygon
    points.forEach((p) => {
        minY = Math.min(minY, p.y);
        maxY = Math.max(p.y, maxY);
    });

    // scan polygon
    for(let y = Math.ceil(minY); y < maxY; y++) {
        const row = [];
        let p1 = points[points.length - 1];

        // find scanline intersections with edges
        points.forEach((p2) => {
            // consider only non-horizontal edges the scanline intersects
            // where scanline doesn't intersect at its max y
            if(p1.y != p2.y && (p1.y <= y && y < p2.y || p2.y <= y && y < p1.y)) {
                row.push(map(y, p1.y, p2.y, p1.x, p2.x));
            }
            p1 = p2;
        });

        // sort x intersections to discern spans
        row.sort((a, b) => a - b);

        if(row.length % 2 != 0) console.log(row);

        // draw spans of scanline
        for(let i = 1; i < row.length; i += 2) {
            const x1 = row[i - 1];
            const x2 = row[i];
            drawHorizontal(Math.ceil(x1), x2, y, setPixel);
        }
    }
}

// http://www.cs.mun.ca/av/old/teaching/cg/notes/raster_circ_inclass.pdf
function fillCircle(x, y, r, setPixel) {
    [x, y, r] = [x, y, r].map((v) => Math.floor(v));
    let h = 0;
    let k = r;
    let d = 1 - r;
    let deltaE = 3;
    let deltaSE = -2 * r + 5;
    const scanCircle = (h, k) => {
        drawHorizontal(x - h, x + h, y + k, setPixel);
        drawHorizontal(x - k, x + k, y + h, setPixel);
        drawHorizontal(x - k, x + k, y - h, setPixel);
        drawHorizontal(x - h, x + h, y - k, setPixel);
    };

    while(k >= h) {
        scanCircle(h, k);

        if(d < 0) {
            d += deltaE;
            deltaSE += 2;
        } else {
            d += deltaSE;
            deltaSE += 4;
            k--;
        }

        deltaE += 2;
        h++;
    }
}
