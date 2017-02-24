"use strict";

function drawHorizontal(x1, x2, y, setPixel) {
    [x1, x2, y] = [x1, x2, y].map(v => Math.floor(v));

    for(let x of range(x1, x2)) {
        setPixel(x, y);
    }
}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    static comparator(p1, p2) {
        return p1.y == p2.y ? p1.x - p2.x : p1.y - p2.y;
    }
}

// http://www.sunshine2k.de/coding/java/TriangleRasterization/TriangleRasterization.html
class Triangle {
    /*  1   1 2
     * 2 3   3
     */
    constructor(p1, p2, p3) {
        [p1, p2, p3] = [p1, p2, p3].sort(Point.comparator);
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
    }

    fill(setPixel) {
        if (this.hasFlatEdge()) {
            Triangle.fillFlatEdge(this.p1, this.p2, this.p3, setPixel);
        } else {
            const p4 = new Point(map(this.p2.y, this.p1.y, this.p3.y, this.p1.x, this.p3.x), this.p2.y);
            Triangle.fillFlatEdge(this.p1, this.p2, p4, setPixel);
            Triangle.fillFlatEdge(this.p2, p4, this.p3, setPixel);
        }
    }

    hasFlatEdge() {
        return this.p1.y == this.p2.y || this.p2.y == this.p3.y;
    }

    static fillFlatEdge(p1, p2, p3, setPixel) {
        [p1, p2, p3] = [p1, p2, p3].sort(Point.comparator);

        const isBottomFlat = p1.y < p2.y;
        const point = isBottomFlat ? p1 : p3;
        const base = {
            left: isBottomFlat ? p2 : p1,
            right: isBottomFlat ? p3 : p2
        };
        let leftX = point.x;
        let rightX = point.x;

        for(let y of range(point.y, base.left.y)) {
            drawHorizontal(leftX, rightX, y, setPixel);
            leftX = map(y, point.y, base.left.y, point.x, base.left.x);
            rightX = map(y, point.y, base.right.y, point.x, base.right.x);
        }
    }
}

class Circle {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
    }

    fill(setPixel) {
        let x = 0;
        let y = this.radius;
        let d = 1 - this.radius;
        let deltaE = 3;
        let deltaSE = -2 * this.radius + 5;

        while(y >= x) {
            this.scanlines(x, y, setPixel);

            if(d < 0) {
                d += deltaE;
                deltaSE += 2;
            } else {
                d += deltaSE;
                deltaSE += 4;
                y--;
            }

            deltaE += 2;
            x++;
        }
    }

    scanlines(x, y, setPixel) {
        drawHorizontal(this.x - x, this.x + x, this.y + y, setPixel);
        drawHorizontal(this.x - y, this.x + y, this.y + x, setPixel);
        drawHorizontal(this.x - y, this.x + y, this.y - x, setPixel);
        drawHorizontal(this.x - x, this.x + x, this.y - y, setPixel);
    }
}
