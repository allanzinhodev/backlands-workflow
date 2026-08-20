const fs = require('fs');

const sprPath = "D:\\backlands\\client\\data\\things\\860\\Tibia.spr";
const buffer = fs.readFileSync(sprPath);

for (let i = 0; i < 16; i++) {
    console.log(`SPR Byte ${i}: ${buffer.readUInt8(i).toString(16)}`);
}
