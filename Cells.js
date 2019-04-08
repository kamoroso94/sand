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
    "color": "#eecc80",
    "conversions": {
      "oil-spout": {
        "other": "sand"
      },
      "water-spout": {
        "other": "sand"
      }
    },
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
    "color": "#70a0ff",
    "conversions": {
      "air": {
        "other": "water"
      }
    }
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

(function verifyCells(cells) {
  for (const cellName in cells) {
    const cell = cells[cellName];
    if(!cell.hasOwnProperty('conversions')) continue;
    const conversions = cell.conversions;
    for (const conversionName in conversions) {
      const conversion = conversions[conversionName];
      if(!conversion.self) {
        conversion.self = cellName;
      }
      for (const which of ['self', 'other']) {
        const convertName = conversion[which];
        if(!cells[convertName]) {
          throw new Error(`Cell '${cellName}' references '${convertName}' which doesn't exist.`);
        }
      }
    }
  }
})(data);

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
