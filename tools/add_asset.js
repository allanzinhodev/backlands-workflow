const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const SprStorage = require('./spr_parser');
const DatStorage = require('./dat_parser');
const OtbStorage = require('./otb_parser');

async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log("Uso: node add_asset.js <caminho_da_imagem_ou_pasta> [--name=\"Nome do Item\"] [--isGround=true/false]");
        return;
    }

    const inputPath = args[0];
    let itemName = "New Item";
    let isGround = false;

    for (let arg of args) {
        if (arg.startsWith('--name=')) itemName = arg.split('=')[1];
        if (arg.startsWith('--isGround=')) isGround = arg.split('=')[1] === 'true';
    }

    const clientThings = "D:\\backlands\\client\\data\\things\\860";
    const serverItems = "D:\\backlands\\server\\data\\items";

    const sprPath = path.join(clientThings, "Tibia.spr");
    const datPath = path.join(clientThings, "Tibia.dat");
    const otbPath = path.join(serverItems, "items.otb");
    const xmlPath = path.join(serverItems, "items.xml");

    console.log("Iniciando injeção de assets...");

    const spr = new SprStorage();
    spr.load(sprPath);

    const dat = new DatStorage();
    dat.load(datPath);

    const otb = new OtbStorage();
    otb.load(otbPath);

    let lastServerId = 0;
    for (let item of otb.items) {
        if (item.attrs[16]) {
            let sId = item.attrs[16].readUInt16LE(0);
            if (sId > lastServerId) lastServerId = sId;
        }
    }

    let itemsXmlAppend = `\n\t<!-- Auto-injected: ${itemName} -->\n`;

    let images = [];
    if (fs.statSync(inputPath).isDirectory()) {
        const files = fs.readdirSync(inputPath).filter(f => f.endsWith('.png'));
        // Try to sort them numerically if they have numbers
        files.sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.replace(/\D/g, '')) || 0;
            return numA - numB;
        });
        images = files.map(f => path.join(inputPath, f));
    } else {
        images.push(inputPath);
    }

    for (let imgPath of images) {
        if (!fs.existsSync(imgPath)) {
            console.error(`Imagem não encontrada: ${imgPath}`);
            continue;
        }

        const data = fs.readFileSync(imgPath);
        const png = PNG.sync.read(data);

        if (png.width !== 32 || png.height !== 32) {
            console.error(`A imagem ${imgPath} não é 32x32! Pulando.`);
            continue;
        }

        let spriteId = spr.addSprite(png.data);
        console.log(`[SPR] ${path.basename(imgPath)} -> Sprite ID: ${spriteId}`);

        let clientId = dat.addItem(spriteId, isGround);
        console.log(`[DAT] ${path.basename(imgPath)} -> Client ID: ${clientId}`);

        let serverId = ++lastServerId;
        otb.addItem(serverId, clientId, isGround);
        console.log(`[OTB] ${path.basename(imgPath)} -> Server ID: ${serverId}`);

        itemsXmlAppend += `\t<item id="${serverId}" article="a" name="${itemName}" />\n`;
    }

    spr.save(sprPath);
    dat.save(datPath);
    otb.save(otbPath);

    let xmlContent = fs.readFileSync(xmlPath, 'utf8');
    xmlContent = xmlContent.replace('</items>', itemsXmlAppend + '</items>');
    fs.writeFileSync(xmlPath, xmlContent);
    console.log(`[XML] items.xml atualizado.`);

    console.log("Injeção concluída com sucesso! Rode tools/sync_mapeditor.ps1 para aplicar no mapa.");
}

main().catch(console.error);
