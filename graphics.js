// linearly interpolate x from range x1..x2 to y1..y2
const lerp = (x, x1, x2, y1, y2) => y1 + (x - x1) / (x2 - x1) * (y2 - y1);

// sets discrete pixels between x1..x2 at y
function drawHorizontal(x1, x2, y, setPixel) {
  for(let x = x1; x <= x2; x++) {
    setPixel(x, y);
  }
}
// sets discrete pixels between y1..y2 at x
function drawVertical(x, y1, y2, setPixel) {
  for(let y = y1; y <= y2; y++) {
    setPixel(x, y);
  }
}

// sets discrete pixels contained in polygon defined by ordered list of points
// Resources:
//  https://youtu.be/q8bEoSn4KZk
//  http://web.cs.ucdavis.edu/~ma/ECS175_S00/Notes/0411_b.pdf
//  https://www.techfak.uni-bielefeld.de/ags/wbski/lehre/digiSA/WS0607/3DVRCG/Vorlesung/13.RT3DCGVR-vertex-2-fragment.pdf
export function fillPolygon(points, setPixel) {
  if(points.length < 3) return;

  let minY, maxY = minY = points[0][1];

  // find min and max y of polygon
  points.forEach(([, y]) => {
    minY = Math.min(minY, y);
    maxY = Math.max(y, maxY);
  });
  // scan from ceil(minY) to floor(maxY), unless maxY is an integer,
  // in which case scan to maxY-1 to prevent empty final scan
  minY = Math.ceil(minY);
  maxY = -Math.floor(1 - maxY);

  // scan polygon
  for(let y = minY; y <= maxY; y++) {
    const spans = scanline(y, points);
    // draw spans of scanline
    for(let i = 0; i < spans.length; i += 2) {
      const x1 = Math.ceil(spans[i]);
      const x2 = -Math.floor(1 - spans[i + 1]);
      // fill from ceil(x1) to floor(x2) at y, unless x2 is an integer,
      // in which case fill to x2-1 to prevent issues with adjacent polygons
      drawHorizontal(x1, x2, y, setPixel);
    }
  }
}

// find scanline intersections with edges
function scanline(y, points) {
  const spans = [];
  let [x1, y1] = points[points.length - 1];

  for(const [x2, y2] of points) {
    const localMinY = Math.min(y1, y2);
    const localMaxY = Math.max(y1, y2);
    // consider only non-horizontal edges the scanline intersects
    // where scanline doesn't intersect at its max y
    if(localMinY <= y && y < localMaxY) {
      spans.push(lerp(y, y1, y2, x1, x2));
    }

    [x1, y1] = [x2, y2];
  }

  // sort x intersections to discern spans
  return spans.sort((a, b) => a - b);
}

// sets discrete pixels contained in circle with center (x,y) and radius r
// Resources:
//  http://www.cs.mun.ca/av/old/teaching/cg/notes/raster_circ_inclass.pdf
export function fillCircle(x, y, r, setPixel) {
  [x, y, r] = [x, y, r].map(Math.floor);
  let h = 0;
  let k = r;
  let d = 1 - r;
  let deltaE = 3;
  let deltaSE = -2 * r + 5;

  while(h <= k) {
    scanCircle(x, y, h, k, setPixel);

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

// fills rows/columns of pixels for each mirrored point (x+h,y+k)
// on circle towards diagonals
function scanCircle(x, y, h, k, setPixel) {
  // top-right quad
  drawVertical(x + h, y + h, y + k, setPixel);
  drawHorizontal(x + h + 1, x + k, y + h, setPixel);
  // bottom-left quad
  const yOff = h == 0 ? -1 : 0;
  drawVertical(x - h, y - k, y - h + yOff, setPixel);
  drawHorizontal(x - k, x - h - 1, y - h, setPixel);

  // don't repeat on axes
  if(h > 0) {
    // top-left quad
    drawVertical(x - h, y + h, y + k, setPixel);
    drawHorizontal(x - k, x - h - 1, y + h, setPixel);
    // bottom-right quad
    drawVertical(x + h, y - k, y - h, setPixel);
    drawHorizontal(x + h + 1, x + k, y - h, setPixel);
  }
}
