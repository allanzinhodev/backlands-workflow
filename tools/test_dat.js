const fs = require('fs');

const datPath = "D:\\backlands\\client\\data\\things\\860\\Tibia.dat";
const buffer = fs.readFileSync(datPath);
let offset = 0;

let signature = buffer.readUInt32LE(offset); offset += 4;
let itemsCount = buffer.readUInt16LE(offset); offset += 2;
let outfitsCount = buffer.readUInt16LE(offset); offset += 2;
let effectsCount = buffer.readUInt16LE(offset); offset += 2;
let missilesCount = buffer.readUInt16LE(offset); offset += 2;

console.log(`Sig: ${signature.toString(16)}, items: ${itemsCount}, out: ${outfitsCount}, eff: ${effectsCount}, mis: ${missilesCount}`);

try {
    for (let i = 100; i <= 100 + itemsCount - 1; i++) {
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
                    if (flag > 34 && flag !== 0xFF) {
                        console.log(`Unknown flag ${flag} at Item ${i}, offset ${offset-1}`);
                        process.exit(1);
                    }
                    break; // Flags sem dados
            }
        }
        let width = buffer.readUInt8(offset++);
        let height = buffer.readUInt8(offset++);
        if (width > 1 || height > 1) {
            offset++;
        }
        let layers = buffer.readUInt8(offset++);
        let patternX = buffer.readUInt8(offset++);
        let patternY = buffer.readUInt8(offset++);
        let patternZ = buffer.readUInt8(offset++);
        let frames = buffer.readUInt8(offset++);
        
        let totalSprites = width * height * layers * patternX * patternY * patternZ * frames;
        offset += totalSprites * 2;
    }
    console.log("Items OK");
} catch (e) {
    console.error("Error at offset", offset, e);
}
