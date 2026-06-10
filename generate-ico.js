// Run with: node generate-ico.js
// Scales assets/trayIcon.png to needed sizes and writes assets/icon.ico
// using a properly formatted ICO that electron-builder/rcedit can embed into the .exe.

const fs = require("fs");
const path = require("path");

async function main() {
  const { Jimp } = require("jimp");
  const { default: pngToIco } = await import("png-to-ico");

  const src = path.join(__dirname, "assets", "trayIcon.png");
  const sizes = [16, 32, 48, 256];

  const pngs = await Promise.all(
    sizes.map(async (s) => {
      const img = await Jimp.read(src);
      img.resize({ w: s, h: s });
      return img.getBuffer("image/png");
    })
  );

  const ico = await pngToIco(pngs);
  fs.writeFileSync(path.join(__dirname, "assets", "icon.ico"), ico);
  console.log("Wrote assets/icon.ico (16, 32, 48, 256px)");
}

main().catch((err) => { console.error(err); process.exit(1); });
