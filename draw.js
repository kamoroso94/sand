import * as Cells from './Cells.js';

export default function draw(event) {
	const {dt} = event.detail;
	const {canvas, ctx, pen, grid, commonId = 'air'} = this.state;

	// reset canvas
	ctx.fillStyle = Cells.data[commonId].color;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// reset edges
	for(let y = 0; y < grid.height; y++) {
		grid.get(0, y).id = 'ground';
		grid.get(grid.width - 1, y).id = 'ground';
	}

	// pen
	pen.stroke(grid);

	// count types for improved drawing performance
	const typeFreq = new Map();
	let bestId = null;
	let bestFreq = 0;

	// draw cells
	grid.forEach((cell, [x, y]) => {
		const freq = 1 + (typeFreq.get(cell.id) || 0);
		typeFreq.set(cell.id, freq);

		if(freq > bestFreq) {
			bestId = cell.id;
			bestFreq = freq;
		}

		if(cell.id == commonId) return;
		ctx.fillStyle = Cells.data[cell.id].color;
		ctx.fillRect(Cells.SIZE * x, Cells.SIZE * y, Cells.SIZE, Cells.SIZE);
	});

	this.state.commonId = bestId || commonId;
}
