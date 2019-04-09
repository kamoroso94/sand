const fs = require('fs');

fs.readFile('./materials.json', (err, data) => {
    if (err) {
      console.error(err);
    } else {
      if (!verify(JSON.parse(data))) {
        console.log('Conversions test passed.');
      } else {
        console.log('Conversions test failed.');
      }
    }
});

function verify(cells) {
  for (const cellName in cells) {
    const cell = cells[cellName];
    if(!cell.hasOwnProperty('conversions')) continue;
    const conversions = cell.conversions;
    for (const conversionName in conversions) {
      const conversion = conversions[conversionName];
      for (const which of ['self', 'other']) {
        const convertName = conversion[which];
        if (convertName == undefined) {
          console.error(`Conversion '${conversionName}' in cell '${cellName}' is missing '${which}' property.`);
          return true;
        }
        if(!cells[convertName]) {
          console.error(`Conversion '${conversionName}' in cell '${cellName}' references '${convertName}' which doesn't exist.`);
          return true;
        }
      }
    }
  }
}
