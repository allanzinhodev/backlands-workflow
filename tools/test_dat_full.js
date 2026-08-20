const fs = require('fs');

const datPath = "D:\\backlands\\client\\data\\things\\860\\Tibia.dat";
const buffer = fs.readFileSync(datPath);
let offset = 4 + 2 + 2 + 2 + 2;

try {
    const readThing = (category, id) => {
        let startOff = offset;
        while (true) {
            let flag = buffer.readUInt8(offset++);
            if (flag === 0xFF) break;
            
            switch (flag) {
                case 0: offset += 2; break;
                case 8: case 9: offset += 2; break;
                case 21: offset += 4; break;
                case 24: offset += 4; break;
                case 25: offset += 2; break;
                case 28: offset += 2; break;
                case 29: offset += 2; break;
                case 32: offset += 2; break;
                case 33: 
                    offset += 6;
                    let nameLen = buffer.readUInt16LE(offset); offset += 2;
                    offset += nameLen;
                    offset += 4;
                    break;
                case 34: offset += 16; break;
                default:
                    if (flag > 34) {
                        console.error(`Unknown flag ${flag} at ${category} ${id}, offset ${offset-1}`);
                        console.log(`Hex dump of last 30 bytes before error:`);
                        for(let i=0; i<30; i++) {
                            console.log(`Byte ${offset-30+i}: ${buffer.readUInt8(offset-30+i).toString(16)}`);
                        }
                        process.exit(1);
                    }
                    break;
            }
        }
        let width = buffer.readUInt8(offset++);
        let height = buffer.readUInt8(offset++);
        if (width > 1 || height > 1) offset++;
        let layers = buffer.readUInt8(offset++);
        let patternX = buffer.readUInt8(offset++);
        let patternY = buffer.readUInt8(offset++);
        let patternZ = buffer.readUInt8(offset++);
        let frames = buffer.readUInt8(offset++);
        
        let totalSprites = width * height * layers * patternX * patternY * patternZ * frames;
        if (id >= 105 && id <= 107) {
            console.log(`Item ${id}: w=${width} h=${height} l=${layers} px=${patternX} py=${patternY} pz=${patternZ} f=${frames} sprites=${totalSprites}`);
        }
        offset += totalSprites * 4; // U32
    };

    for (let i = 100; i <= 107; i++) readThing('item', i);

} catch(e) {
    console.error("Failed", e);
}
