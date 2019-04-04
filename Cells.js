// TODO:
//  add more cell types
//  hasGravity for air is weird
export const SIZE = 4;
export const SPREAD_RATE = 1/16;

export const data = {
  "air": {
    "color": "#000000",
    "density": 0,
    "hasGravity": true
  },
  "oil": {
    "color": "#804040",
    "density": 1,
    "hasGravity": true
  },
  "water": {
    "color": "#2020fe",
    "conversions": {
      "sand-spout": "sand"
    },
    "density": 2,
    "hasGravity": true
  },
  "sand": {
    "conversions": {
      "oil-spout": "sand",
      "water-spout": "sand"
    },
    "color": "#eecc80",
    "density": 3,
    "hasGravity": true
  },
  "ground": {
    "color": "#aa8820"
  },
  "plant": {
    "conversions": {
      "water": "plant"
    },
    "color": "#20cc20"
  },
  "oil-spout": {
    "conversions": {
      "air": "oil"
    },
    "color": "#cc6666"
  },
  "water-spout": {
    "conversions": {
      "air": "water"
    },
    "color": "#70a0ff"
  },
  "sand-spout": {
    "conversions": {
      "air": "sand"
    },
    "color": "#edb744"
  }
};

export function canPhase(self, other) {
  if(self == null || other == null) return false;
  const selfData = data[self.id];
  const otherData = data[other.id];
  return selfData.hasGravity && otherData.hasGravity && selfData.density > otherData.density;
}

export function convert(self, other) {
  if(self == null || other == null) return false;

  const selfData = data[self.id];
  const otherData = data[other.id];
  if(!selfData.hasOwnProperty('conversions')) return false;
  if(!selfData.conversions.hasOwnProperty(other.id)) return false;

  other.id = selfData.conversions[other.id];
  return true;
}

export function create(id, obj={}) {
  if(!(id in data)) return null;
  obj.id = id;
  obj.dir = Math.random() < 0.5 ? -1 : 1;
  return obj;
}
