// TODO: add more cell types, hasGravity for air is weird

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
      "sand-spout": {
        "other": "sand"
      }
    },
    "density": 2,
    "hasGravity": true
  },
  "saltwater": {
    "color": "#4080ff",
    "density": 3,
    "hasGravity": true
  },
  "salt": {
    "color": "#ffffff",
    "conversions": {
      "water": {
        "self": "air",
        "other": "saltwater"
      }
    },
    "density": 4,
    "hasGravity": true
  },
  "sand": {
    "conversions": {
      "oil-spout": {
        "other": "sand"
      },
      "water-spout": {
        "other": "sand"
      }
    },
    "color": "#eecc80",
    "density": 4,
    "hasGravity": true
  },
  "ground": {
    "color": "#aa8820"
  },
  "plant": {
    "color": "#20cc20",
    "conversions": {
      "water": {
        "other": "plant"
      }
    }
  },
  "oil-spout": {
    "color": "#cc6666",
    "conversions": {
      "air": {
        "other": "oil"
      }
    }
  },
  "water-spout": {
    "conversions": {
      "air": {
        "other": "water"
      }
    },
    "color": "#70a0ff"
  },
  "sand-spout": {
    "color": "#edb744",
    "conversions": {
      "air": {
        "other": "sand"
      }
    }
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
  if(!selfData.hasOwnProperty('conversions')) return false;
  if(!selfData.conversions.hasOwnProperty(other.id)) return false;

  const selfId = selfData.conversions[other.id].self;
  const otherId = selfData.conversions[other.id].other;
  if(selfId != null) self.id = selfId;
  if(otherId != null) other.id = otherId;

  return true;
}

export function create(id, obj={}) {
  if(!(id in data)) return null;
  obj.id = id;
  obj.dir = Math.random() < 0.5 ? -1 : 1;
  return obj;
}
