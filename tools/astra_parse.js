const fs = require('fs');
const buffer = fs.readFileSync('D:\\backlands\\client\\data\\things\\860\\Tibia.dat');

let offset = 0;
const signature = buffer.readUInt32LE(offset); offset += 4;
const itemsCount = buffer.readUInt16LE(offset); offset += 2;
const outfitsCount = buffer.readUInt16LE(offset); offset += 2;
const effectsCount = buffer.readUInt16LE(offset); offset += 2;
const missilesCount = buffer.readUInt16LE(offset); offset += 2;

console.log(`Sig: ${signature.toString(16)}, items: ${itemsCount}`);

function readThing(id, category) {
    let count = 0;
    while (true) {
        if (offset >= buffer.length) break;
        let attr = buffer.readUInt8(offset++);
        count++;
        if (attr === 255) break;

        // Custom AstraClient attribute sizes
        if (attr === 24) offset += 4; // Displacement
        else if (attr === 21) offset += 4; // Light
        else if (attr === 33) { // Market
            offset += 6;
            let len = buffer.readUInt16LE(offset); offset += 2;
            offset += len; // name
            offset += 4; // restrict
        }
        else if (attr === 25) offset += 2; // Elevation
        else if (attr === 34 || attr === 0 || attr === 8 || attr === 9 || attr === 28 || attr === 32 || attr === 29) {
            offset += 2; // U16
        }
        else if (attr === 38) offset += 16; // Bones
    }

    let groupCount = category === 'outfit' ? buffer.readUInt8(offset++) : 1;

    for (let g = 0; g < groupCount; g++) {
        if (category === 'outfit') {
            offset++; // frameGroupType
        }
        let width = buffer.readUInt8(offset++);
        let height = buffer.readUInt8(offset++);
        let realSize = 0;
        if (width > 1 || height > 1) {
            realSize = buffer.readUInt8(offset++);
        }
        let layers = buffer.readUInt8(offset++);
        let patternX = buffer.readUInt8(offset++);
        let patternY = buffer.readUInt8(offset++);
        let patternZ = buffer.readUInt8(offset++);
        let animationPhases = buffer.readUInt8(offset++);

        if (animationPhases > 1) { // EnhancedAnimations
            let async = buffer.readUInt8(offset++);
            let loopCount = buffer.readUInt32LE(offset); offset += 4;
            let startPhase = buffer.readUInt8(offset++);
            for (let i = 0; i < animationPhases; i++) {
                offset += 8; // min, max
            }
        }

        let area = width * height;
        let totalSprites = area * layers * patternX * patternY * patternZ * animationPhases;
        if (totalSprites > 100) {
            console.log(`LARGE SPRITES! ${category} ${id}: w=${width}, h=${height}, l=${layers}, px=${patternX}, py=${patternY}, pz=${patternZ}, f=${animationPhases}, totalSprites=${totalSprites}, offset=${offset}`);
        }
        
        for (let i = 0; i < totalSprites; i++) {
            offset += 4; // GameSpritesU32
        }
        
        if (id >= 54752) {
            console.log(`Item ${id}: w=${width}, h=${height}, l=${layers}, px=${patternX}, py=${patternY}, pz=${patternZ}, f=${animationPhases}, totalSprites=${totalSprites}, offset after=${offset}`);
        }
    }
}

try {
    for (let i = 100; i <= 100 + itemsCount - 1; i++) {
        readThing(i, 'item');
    }
    for (let i = 1; i <= outfitsCount; i++) {
        readThing(i, 'outfit');
    }
    for (let i = 1; i <= effectsCount; i++) {
        readThing(i, 'effect');
    }
    for (let i = 1; i <= missilesCount; i++) {
        readThing(i, 'missile');
    }
    console.log(`Success! Final offset: ${offset}`);
} catch (e) {
    console.error(`Crashed: ${e.message} at offset ${offset}`);
}
