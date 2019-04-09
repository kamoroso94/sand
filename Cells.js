// TODO: add more cell types, hasGravity for air is weird

export const SIZE = 4;
export const SPREAD_RATE = 1/16;

export const data = window.materials;

export function canPhase(self, other) {
  if(self == null || other == null) return false;
  const selfData = data[self.id];
  const otherData = data[other.id];
  return selfData.hasGravity && otherData.hasGravity && selfData.density > otherData.density;
}

export function create(id, obj={}) {
  if(!(id in data)) return null;
  obj.id = id;
  obj.dir = Math.random() < 0.5 ? -1 : 1;
  return obj;
}
