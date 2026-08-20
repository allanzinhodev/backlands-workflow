// tools/dat_parser.js
const fs = require('fs');

/**
 * Parser para Tibia.dat 8.60
 * Estrutura portada do ObjectBuilder/src/otlib/things/ThingSerializer.as
 */
class DatStorage {
    constructor() {
        this.signature = 0;
        this.itemsCount = 0;
        this.outfitsCount = 0;
        this.effectsCount = 0;
        this.missilesCount = 0;

        this.things = {
            item: [],
            outfit: [],
            effect: [],
            missile: []
        };
    }

    load(filePath) {
        const buffer = fs.readFileSync(filePath);
        let offset = 0;

        this.signature = buffer.readUInt32LE(offset); offset += 4;
        this.itemsCount = buffer.readUInt16LE(offset); offset += 2;
        this.outfitsCount = buffer.readUInt16LE(offset); offset += 2;
        this.effectsCount = buffer.readUInt16LE(offset); offset += 2;
        this.missilesCount = buffer.readUInt16LE(offset); offset += 2;

        console.log(`[DAT] Carregado: ${this.itemsCount} itens, ${this.outfitsCount} outfits. Sig: ${this.signature.toString(16)}`);

        const readThing = (category, id) => {
            let thing = {
                category: category,
                id: id,
                flags: [],
                spriteData: null
            };

            // Read Flags
            while (true) {
                if (offset >= buffer.length) throw new Error("EOF reached while reading flags.");
                let flag = buffer.readUInt8(offset++);
                if (flag === 0xFF) break;

                let flagData = { flag: flag };
                switch (flag) {
                    case 0: // GROUND
                        flagData.speed = buffer.readUInt16LE(offset); offset += 2;
                        break;
                    case 8: case 9: // WRITABLE
                        flagData.maxChars = buffer.readUInt16LE(offset); offset += 2;
                        break;
                    case 21: // HAS_LIGHT
                        flagData.lightLevel = buffer.readUInt16LE(offset); offset += 2;
                        flagData.lightColor = buffer.readUInt16LE(offset); offset += 2;
                        break;
                    case 24: // HAS_OFFSET
                        flagData.offsetX = buffer.readInt16LE(offset); offset += 2;
                        flagData.offsetY = buffer.readInt16LE(offset); offset += 2;
                        break;
                    case 25: // HAS_ELEVATION
                        flagData.elevation = buffer.readUInt16LE(offset); offset += 2;
                        break;
                    case 28: // MINI_MAP
                        flagData.miniMapColor = buffer.readUInt16LE(offset); offset += 2;
                        break;
                    case 29: // LENS_HELP
                        flagData.lensHelp = buffer.readUInt16LE(offset); offset += 2;
                        break;
                    case 32: // CLOTH
                        flagData.clothSlot = buffer.readUInt16LE(offset); offset += 2;
                        break;
                    case 33: // MARKET_ITEM
                        flagData.category = buffer.readUInt16LE(offset); offset += 2;
                        flagData.tradeAs = buffer.readUInt16LE(offset); offset += 2;
                        flagData.showAs = buffer.readUInt16LE(offset); offset += 2;
                        let nameLen = buffer.readUInt16LE(offset); offset += 2;
                        flagData.name = buffer.toString('utf8', offset, offset + nameLen); offset += nameLen;
                        flagData.restrictProf = buffer.readUInt16LE(offset); offset += 2;
                        flagData.restrictLevel = buffer.readUInt16LE(offset); offset += 2;
                        break;
                    case 39: // HAS_BONES (8 * int16)
                        flagData.bones = [];
                        for(let i=0; i<8; i++) {
                            flagData.bones.push(buffer.readInt16LE(offset)); offset += 2;
                        }
                        break;
                    default:
                        if (flag > 39) {
                            throw new Error(`Unknown flag ${flag} at offset ${offset - 1} for ${category} ${id}`);
                        }
                        break;
                }
                thing.flags.push(flagData);
            }

            let groupCount = 1;
            if (category === 'outfit') {
                groupCount = buffer.readUInt8(offset++);
            }

            thing.groups = [];

            for (let g = 0; g < groupCount; g++) {
                let groupType = 0;
                if (category === 'outfit') {
                    groupType = buffer.readUInt8(offset++);
                }

                let width = buffer.readUInt8(offset++);
                let height = buffer.readUInt8(offset++);
                let exactSize = 0;
                if (width > 1 || height > 1) {
                    exactSize = buffer.readUInt8(offset++);
                }
                let layers = buffer.readUInt8(offset++);
                let patternX = buffer.readUInt8(offset++);
                let patternY = buffer.readUInt8(offset++);
                let patternZ = buffer.readUInt8(offset++);
                let frames = buffer.readUInt8(offset++);
                
                let frameDurations = null;
                if (frames > 1) {
                    frameDurations = {
                        animationMode: buffer.readUInt8(offset++),
                        loopCount: buffer.readInt32LE(offset),
                        startFrame: buffer.readInt8(offset + 4),
                        durations: []
                    };
                    offset += 5;

                    for (let i = 0; i < frames; i++) {
                        let min = buffer.readUInt32LE(offset); offset += 4;
                        let max = buffer.readUInt32LE(offset); offset += 4;
                        frameDurations.durations.push({ min, max });
                    }
                }
                
                let groupData = { groupType, width, height, exactSize, layers, patternX, patternY, patternZ, frames, frameDurations, sprites: [] };
                
                let totalSprites = width * height * layers * patternX * patternY * patternZ * frames;
                for (let i = 0; i < totalSprites; i++) {
                    groupData.sprites.push(buffer.readUInt32LE(offset));
                    offset += 4;
                }
                thing.groups.push(groupData);
            }

            thing.spriteData = thing.groups[0];

            return thing;
        };

        for (let i = 100; i <= 100 + this.itemsCount - 1; i++) {
            this.things.item.push(readThing('item', i));
        }
        for (let i = 1; i <= this.outfitsCount; i++) {
            this.things.outfit.push(readThing('outfit', i));
        }
        for (let i = 1; i <= this.effectsCount; i++) {
            this.things.effect.push(readThing('effect', i));
        }
        for (let i = 1; i <= this.missilesCount; i++) {
            this.things.missile.push(readThing('missile', i));
        }
    }

    addItem(spriteId, isGround = true) {
        let newId = 100 + this.itemsCount;
        this.itemsCount++;
        
        let flags = [];
        if (isGround) {
            flags.push({ flag: 0, speed: 100 });
        } else {
            flags.push({ flag: 13 });
        }

        let newThing = {
            category: 'item',
            id: newId,
            flags: flags,
            groups: [{
                groupType: 0, width: 1, height: 1, exactSize: 0,
                layers: 1, patternX: 1, patternY: 1, patternZ: 1, frames: 1,
                frameDurations: null,
                sprites: [spriteId]
            }]
        };
        newThing.spriteData = newThing.groups[0];

        this.things.item.push(newThing);
        return newId;
    }

    save(outputPath) {
        const buffer = Buffer.alloc(20 * 1024 * 1024);
        let offset = 0;

        buffer.writeUInt32LE(this.signature, offset); offset += 4;
        buffer.writeUInt16LE(this.itemsCount, offset); offset += 2;
        buffer.writeUInt16LE(this.outfitsCount, offset); offset += 2;
        buffer.writeUInt16LE(this.effectsCount, offset); offset += 2;
        buffer.writeUInt16LE(this.missilesCount, offset); offset += 2;

        const writeThing = (thing) => {
            for (let f of thing.flags) {
                buffer.writeUInt8(f.flag, offset++);
                switch (f.flag) {
                    case 0: buffer.writeUInt16LE(f.speed, offset); offset += 2; break;
                    case 8: case 9: buffer.writeUInt16LE(f.maxChars, offset); offset += 2; break;
                    case 21: 
                        buffer.writeUInt16LE(f.lightLevel, offset); offset += 2;
                        buffer.writeUInt16LE(f.lightColor, offset); offset += 2;
                        break;
                    case 24:
                        buffer.writeInt16LE(f.offsetX, offset); offset += 2;
                        buffer.writeInt16LE(f.offsetY, offset); offset += 2;
                        break;
                    case 25: buffer.writeUInt16LE(f.elevation, offset); offset += 2; break;
                    case 28: buffer.writeUInt16LE(f.miniMapColor, offset); offset += 2; break;
                    case 29: buffer.writeUInt16LE(f.lensHelp, offset); offset += 2; break;
                    case 32: buffer.writeUInt16LE(f.clothSlot, offset); offset += 2; break;
                    case 33:
                        buffer.writeUInt16LE(f.category || 0, offset); offset += 2;
                        buffer.writeUInt16LE(f.tradeAs || 0, offset); offset += 2;
                        buffer.writeUInt16LE(f.showAs || 0, offset); offset += 2;
                        let mName = f.name || '';
                        let nameBuf = Buffer.from(mName, 'utf8');
                        buffer.writeUInt16LE(nameBuf.length, offset); offset += 2;
                        nameBuf.copy(buffer, offset); offset += nameBuf.length;
                        buffer.writeUInt16LE(f.restrictProf || 0, offset); offset += 2;
                        buffer.writeUInt16LE(f.restrictLevel || 0, offset); offset += 2;
                        break;
                    case 39:
                        for(let i=0; i<8; i++) {
                            buffer.writeInt16LE(f.bones[i] || 0, offset); offset += 2;
                        }
                        break;
                }
            }
            buffer.writeUInt8(0xFF, offset++); // LAST_FLAG

            if (thing.category === 'outfit') {
                buffer.writeUInt8(thing.groups.length, offset++);
            }

            for (let g = 0; g < thing.groups.length; g++) {
                let sd = thing.groups[g];
                
                if (thing.category === 'outfit') {
                    buffer.writeUInt8(sd.groupType || 0, offset++);
                }

                buffer.writeUInt8(sd.width, offset++);
                buffer.writeUInt8(sd.height, offset++);
                if (sd.width > 1 || sd.height > 1) {
                    buffer.writeUInt8(sd.exactSize, offset++);
                }
                buffer.writeUInt8(sd.layers, offset++);
                buffer.writeUInt8(sd.patternX, offset++);
                buffer.writeUInt8(sd.patternY, offset++);
                buffer.writeUInt8(sd.patternZ, offset++);
                buffer.writeUInt8(sd.frames, offset++);

                if (sd.frames > 1 && sd.frameDurations) {
                    buffer.writeUInt8(sd.frameDurations.animationMode, offset++);
                    buffer.writeInt32LE(sd.frameDurations.loopCount, offset); offset += 4;
                    buffer.writeInt8(sd.frameDurations.startFrame, offset++);
                    
                    for (let dur of sd.frameDurations.durations) {
                        buffer.writeUInt32LE(dur.min, offset); offset += 4;
                        buffer.writeUInt32LE(dur.max, offset); offset += 4;
                    }
                }

                for (let sprId of sd.sprites) {
                    buffer.writeUInt32LE(sprId, offset); offset += 4;
                }
            }
        };

        for (let t of this.things.item) writeThing(t);
        for (let t of this.things.outfit) writeThing(t);
        for (let t of this.things.effect) writeThing(t);
        for (let t of this.things.missile) writeThing(t);

        fs.writeFileSync(outputPath, buffer.slice(0, offset));
        console.log(`[DAT] Salvo com sucesso! Total de itens: ${this.itemsCount}`);
    }
}

module.exports = DatStorage;
