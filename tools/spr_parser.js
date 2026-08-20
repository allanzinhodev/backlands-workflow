// tools/spr_parser.js
const fs = require('fs');

/**
 * Lê e escreve o formato SPR (Tibia.spr)
 * Algoritmo RLE portado do ObjectBuilder/src/otlib/sprites/Sprite.as
 */
class SpriteStorage {
    constructor() {
        this.signature = 0;
        this.spritesCount = 0;
        this.spritesOffset = []; // array de posicoes
    }

    load(filePath) {
        this.filePath = filePath;
        const buffer = fs.readFileSync(filePath);
        let offset = 0;

        this.signature = buffer.readUInt32LE(offset); offset += 4;
        
        // Em extended format, a contagem é UInt32 (4 bytes)
        this.spritesCount = buffer.readUInt32LE(offset); offset += 4;
        
        this.spritesOffset = new Array(this.spritesCount + 1);
        this.spritesOffset[0] = 0; // 1-based index
        
        for (let i = 1; i <= this.spritesCount; i++) {
            this.spritesOffset[i] = buffer.readUInt32LE(offset);
            offset += 4;
        }

        console.log(`[SPR] Carregado: ${this.spritesCount} sprites. Signature: ${this.signature.toString(16).toUpperCase()}`);
        this.buffer = buffer; // Manter o buffer para quando formos compilar
    }

    // Comprime imagem RGBA (1024 pixels, 4096 bytes) usando RLE do Tibia
    compressPixels(rgbaBuffer) {
        if (rgbaBuffer.length !== 4096) {
            throw new Error("A imagem deve ter 32x32 pixels (4096 bytes RGBA)");
        }

        const compressed = Buffer.alloc(4096 * 2); // Mais que o suficiente
        let writeOffset = 0;

        let index = 0;
        const length = 1024;

        while (index < length) {
            let chunkSize = 0;
            let alphaCount = 0;

            // Contar pixels transparentes
            while (index < length) {
                // pngjs dá rgba: r=0, g=1, b=2, a=3
                let r = rgbaBuffer[index * 4 + 0];
                let g = rgbaBuffer[index * 4 + 1];
                let b = rgbaBuffer[index * 4 + 2];
                let a = rgbaBuffer[index * 4 + 3];

                // No Tibia 8.60, a cor transparente tradicional é magenta (255, 0, 255)
                // ou alpha == 0
                let isTransparent = (a === 0) || (r === 255 && g === 0 && b === 255);
                if (!isTransparent) break;

                alphaCount++;
                chunkSize++;
                index++;
            }

            if (alphaCount < length) {
                if (index < length) {
                    compressed.writeUInt16LE(chunkSize, writeOffset); writeOffset += 2; // Transparent
                    
                    let coloredPos = writeOffset;
                    writeOffset += 2; // Espaço para a contagem de cores
                    
                    chunkSize = 0;
                    while (index < length) {
                        let r = rgbaBuffer[index * 4 + 0];
                        let g = rgbaBuffer[index * 4 + 1];
                        let b = rgbaBuffer[index * 4 + 2];
                        let a = rgbaBuffer[index * 4 + 3];

                        let isTransparent = (a === 0) || (r === 255 && g === 0 && b === 255);
                        if (isTransparent) break;

                        compressed.writeUInt8(r, writeOffset++);
                        compressed.writeUInt8(g, writeOffset++);
                        compressed.writeUInt8(b, writeOffset++);
                        
                        chunkSize++;
                        index++;
                    }

                    // Volta e escreve quantos coloridos foram
                    let finishOffset = writeOffset;
                    compressed.writeUInt16LE(chunkSize, coloredPos);
                    writeOffset = finishOffset;
                }
            }
        }

        return compressed.slice(0, writeOffset);
    }

    addSprite(rgbaBuffer) {
        const compressed = this.compressPixels(rgbaBuffer);
        
        // Format sprite block: 3 bytes (magenta colorkey) + 2 bytes size + data
        const spriteBlock = Buffer.alloc(5 + compressed.length);
        spriteBlock.writeUInt8(0xFF, 0); // R
        spriteBlock.writeUInt8(0x00, 1); // G
        spriteBlock.writeUInt8(0xFF, 2); // B
        spriteBlock.writeUInt16LE(compressed.length, 3);
        compressed.copy(spriteBlock, 5);

        // Armazenar temporariamente no objeto
        if (!this.newSprites) this.newSprites = [];
        this.newSprites.push(spriteBlock);

        const newId = this.spritesCount + this.newSprites.length;
        return newId;
    }

    save(outputPath) {
        const totalSprites = this.spritesCount + (this.newSprites ? this.newSprites.length : 0);
        
        // Calcular novo tamanho de cabeçalho
        const headerSize = 8 + (totalSprites * 4); // signature(4) + count(4) + addresses
        
        // O corpo antigo começa em (8 + this.spritesCount * 4)
        const oldHeaderSize = 8 + (this.spritesCount * 4);
        const oldBody = this.buffer.slice(oldHeaderSize);

        let outStream = fs.createWriteStream(outputPath);
        
        // Escreve header
        let headerBuffer = Buffer.alloc(headerSize);
        headerBuffer.writeUInt32LE(this.signature, 0);
        headerBuffer.writeUInt32LE(totalSprites, 4);

        let currentDataOffset = headerSize;
        let addressWriteOffset = 8;

        // Repopular endereços antigos mas shiftados
        for (let i = 1; i <= this.spritesCount; i++) {
            let oldAddr = this.spritesOffset[i];
            if (oldAddr === 0) {
                headerBuffer.writeUInt32LE(0, addressWriteOffset);
            } else {
                let shiftedAddr = oldAddr - oldHeaderSize + headerSize;
                headerBuffer.writeUInt32LE(shiftedAddr, addressWriteOffset);
            }
            addressWriteOffset += 4;
        }

        currentDataOffset += oldBody.length;

        // Escrever endereços dos novos sprites
        if (this.newSprites) {
            for (let spriteBlock of this.newSprites) {
                headerBuffer.writeUInt32LE(currentDataOffset, addressWriteOffset);
                addressWriteOffset += 4;
                currentDataOffset += spriteBlock.length;
            }
        }

        outStream.write(headerBuffer);
        outStream.write(oldBody);

        if (this.newSprites) {
            for (let spriteBlock of this.newSprites) {
                outStream.write(spriteBlock);
            }
        }

        outStream.end();
        console.log(`[SPR] Salvo com sucesso! Total de sprites: ${totalSprites}`);
        return totalSprites;
    }
}

module.exports = SpriteStorage;
