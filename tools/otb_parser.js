// tools/otb_parser.js
const fs = require('fs');

const NODE_START = 0xFE;
const NODE_END = 0xFF;
const ESCAPE_CHAR = 0xFD;

class OtbNode {
    constructor(type) {
        this.type = type;
        this.data = Buffer.alloc(0);
        this.children = [];
    }
}

class OtbStorage {
    constructor() {
        this.versionData = null;
        this.items = [];
    }

    load(filePath) {
        this.filePath = filePath;
        const buffer = fs.readFileSync(filePath);
        
        // Skip first 4 bytes (version)
        let offset = 4;
        
        let rootNode = this.readNode(buffer, { offset });
        if (!rootNode) throw new Error("Raiz do OTB não encontrada.");

        // rootNode.data: 4 bytes flags + attributes
        let dataOff = 4; // skip flags
        
        // Parse root attributes
        while (dataOff < rootNode.data.length) {
            let attr = rootNode.data.readUInt8(dataOff++);
            let len = rootNode.data.readUInt16LE(dataOff); dataOff += 2;
            
            if (attr === 1) { // VERSION
                this.versionData = rootNode.data.slice(dataOff, dataOff + len);
            }
            dataOff += len;
        }

        // Parse items (children of root)
        for (let child of rootNode.children) {
            let item = { group: child.type, flags: child.data.readUInt32LE(0), attrs: {} };
            let cOff = 4;
            
            while (cOff < child.data.length) {
                let attr = child.data.readUInt8(cOff++);
                let len = child.data.readUInt16LE(cOff); cOff += 2;
                let attrData = child.data.slice(cOff, cOff + len);
                item.attrs[attr] = attrData;
                cOff += len;
            }
            this.items.push(item);
        }

        console.log(`[OTB] Carregado com sucesso! Total de itens: ${this.items.length}`);
    }

    readNode(buffer, ctx) {
        let val = buffer.readUInt8(ctx.offset++);
        if (val !== NODE_START) return null;

        let type = buffer.readUInt8(ctx.offset++);
        let node = new OtbNode(type);

        let dataBuf = [];

        while (ctx.offset < buffer.length) {
            val = buffer.readUInt8(ctx.offset++);
            
            if (val === NODE_END) {
                break;
            } else if (val === NODE_START) {
                ctx.offset--; // Volta 1 byte
                let childNode = this.readNode(buffer, ctx);
                if (childNode) node.children.push(childNode);
            } else if (val === ESCAPE_CHAR) {
                val = buffer.readUInt8(ctx.offset++);
                dataBuf.push(val);
            } else {
                dataBuf.push(val);
            }
        }
        
        node.data = Buffer.from(dataBuf);
        return node;
    }

    addItem(serverId, clientId, isGround = true) {
        // Find existing to avoid duplicates? Usually we just append.
        let item = {
            group: isGround ? 1 : 2, // 1 = Ground, 2 = Container (or Item/None in some sources, let's use 0 = NONE)
            // No, ServerItemGroup: NONE=0, GROUND=1, CONTAINER=2, SPLASH=3, FLUID=4
            flags: 0,
            attrs: {}
        };
        item.group = isGround ? 1 : 0;

        let bufServerId = Buffer.alloc(2); bufServerId.writeUInt16LE(serverId, 0);
        let bufClientId = Buffer.alloc(2); bufClientId.writeUInt16LE(clientId, 0);

        // Attr 16: ServerID, Attr 17: ClientID
        item.attrs[16] = bufServerId;
        item.attrs[17] = bufClientId;

        if (isGround) {
            let bufSpeed = Buffer.alloc(2); bufSpeed.writeUInt16LE(100, 0);
            item.attrs[19] = bufSpeed; // Attr 19: Ground speed
        }

        this.items.push(item);
    }

    writeNode(node, outStream) {
        outStream.push(NODE_START);
        outStream.push(node.type);

        const writeData = (buf) => {
            for (let i = 0; i < buf.length; i++) {
                let val = buf[i];
                if (val === NODE_START || val === NODE_END || val === ESCAPE_CHAR) {
                    outStream.push(ESCAPE_CHAR);
                }
                outStream.push(val);
            }
        };

        writeData(node.data);

        for (let child of node.children) {
            this.writeNode(child, outStream);
        }

        outStream.push(NODE_END);
    }

    save(outputPath) {
        let rootNode = new OtbNode(0);
        
        // Build root data: 4 bytes flags (0) + Attr 1 (VERSION)
        let rootData = Buffer.alloc(4 + 1 + 2 + this.versionData.length);
        rootData.writeUInt32LE(0, 0); // flags
        rootData.writeUInt8(1, 4); // attr VERSION
        rootData.writeUInt16LE(this.versionData.length, 5); // len
        this.versionData.copy(rootData, 7);
        rootNode.data = rootData;

        // Build children nodes
        for (let item of this.items) {
            let cNode = new OtbNode(item.group);
            
            // Build data size
            let cDataSize = 4; // flags
            for (let attrId in item.attrs) {
                cDataSize += 1 + 2 + item.attrs[attrId].length; // ID + LEN + DATA
            }
            
            let cData = Buffer.alloc(cDataSize);
            cData.writeUInt32LE(item.flags, 0);
            let off = 4;
            
            // Ordem numérica das keys? Não importa muito, mas garantimos int
            for (let attrId in item.attrs) {
                cData.writeUInt8(parseInt(attrId), off++);
                cData.writeUInt16LE(item.attrs[attrId].length, off); off += 2;
                item.attrs[attrId].copy(cData, off); off += item.attrs[attrId].length;
            }
            cNode.data = cData;
            rootNode.children.push(cNode);
        }

        let outStream = [];
        // Header (4 bytes de 0)
        outStream.push(0, 0, 0, 0);

        this.writeNode(rootNode, outStream);

        fs.writeFileSync(outputPath, Buffer.from(outStream));
        console.log(`[OTB] Salvo com sucesso! Total de itens: ${this.items.length}`);
    }
}

module.exports = OtbStorage;
