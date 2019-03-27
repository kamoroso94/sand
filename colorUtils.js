export const u32ToHex = (color) => "#" + (1 << 24 | color).toString(16).slice(1);
export const hexToU32 = (hexColor) => {
	const sliced = hexColor.startsWith("#") ? hexColor.slice(1) : hexColor;
	const b16 = sliced.length === 3 ? sliced.split("").map(a => a + a).join("") : sliced;
	return parseInt(b16, 16);
};
