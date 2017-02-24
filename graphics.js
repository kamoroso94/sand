"use strict";

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

function drawHorizontal(x1, x2, y, setPixel) {
    [x1, x2, y] = [x1, x2, y].map(v => Math.floor(v));

    for(let x of range(x1, x2)) {
        setPixel(x, y);
    }
}

// https://youtu.be/q8bEoSn4KZk
function fillPolygon(points, setPixel) {
    let minY, maxY;
    minY = maxY = points[0].y;

    points.forEach(p => {
        minY = Math.min(minY, p.y);
        maxY = Math.max(p.y, maxY);
    });

    for(let y of range(minY, maxY)) {
        let row = [];
        let p1 = points[points.length - 1];

        points.forEach(p2 => {
            if(p1.y <= y && y <= p2.y || p2.y <= y && y <= p1.y) {
                row.push(map(y, p1.y, p2.y, p1.x, p2.x));
            }
            p1 = p2;
        });
        row = row.sort((a, b) => a - b).filter((v, i, a) => i == 0 || v != a[i - 1]);

        for(let i = 1; i < row.length; i++) {
            const x1 = row[i - 1];
            const x2 = row[i];
            drawHorizontal(x1, x2, y, setPixel);
        }
    }
}

// http://www.cs.mun.ca/av/old/teaching/cg/notes/raster_circ_inclass.pdf
function fillCircle(x, y, r, setPixel) {
    let h = 0;
    let k = r;
    let d = 1 - r;
    let deltaE = 3;
    let deltaSE = -2 * r + 5;
    let scanCircle = (h, k) => {
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
