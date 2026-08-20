const fs = require('fs');

const datPath = "D:\\backlands\\client\\data\\things\\860\\Tibia.dat";
const buffer = fs.readFileSync(datPath);
let offset = 4 + 2 + 2 + 2 + 2;

// Offset now points to Item 100
for (let i = 0; i < 90; i++) {
    console.log(`Byte ${i}: ${buffer.readUInt8(offset + i).toString(16)}`);
}
