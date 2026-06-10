// Run with: npx electron generate-icons.js
// Generates assets/trayIcon.png and assets/icon.ico from the app SVG clock.

const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");

app.dock?.hide();

const SIZES = [16, 32, 48, 256];

// Single HTML page that exposes a drawIcon(size, strokeColor, bgColor, bgRadius, padding, strokeWidth) function
const PAGE_HTML = `<!doctype html><html><head><style>
* { margin:0; padding:0; }
body { background:#000; }
canvas { display:block; }
</style></head><body>
<canvas id="c"></canvas>
<script>
window.drawIcon = function(size, strokeColor, padding, strokeWidth) {
  var c = document.getElementById('c');
  c.width = size; c.height = size;
  var ctx = c.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  var cx = size / 2, cy = size / 2;
  var r = cx - padding;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  var scale = r / 10;
  ctx.beginPath();
  ctx.moveTo(cx + (12-12)*scale, cy + (6-12)*scale);
  ctx.lineTo(cx + (12-12)*scale, cy + (12-12)*scale);
  ctx.lineTo(cx + (16-12)*scale, cy + (14-12)*scale);
  ctx.stroke();
  return c.toDataURL('image/png');
};
</script>
</body></html>`;

app.whenReady().then(async () => {
  const tmpFile = path.join(os.tmpdir(), "shift-icon-gen.html");
  fs.writeFileSync(tmpFile, PAGE_HTML, "utf8");

  const win = new BrowserWindow({
    width: 300,
    height: 300,
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: false },
  });

  await win.loadFile(tmpFile);
  console.log("Window loaded");

  const pngBuffers = {};
  for (const size of SIZES) {
    const strokeColor = "#0CB5A4";
    const padding = size <= 16 ? 1 : size <= 32 ? 2 : size <= 48 ? 3 : 24;
    const strokeWidth = size <= 16 ? 1.8 : 2;

    const dataUrl = await win.webContents.executeJavaScript(
      `window.drawIcon(${size}, "${strokeColor}", ${padding}, ${strokeWidth})`
    );

    const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
    pngBuffers[size] = Buffer.from(base64, "base64");
    console.log(`Rendered ${size}x${size} (${pngBuffers[size].length} bytes)`);
  }

  win.destroy();
  fs.unlinkSync(tmpFile);

  fs.writeFileSync(path.join(__dirname, "assets", "trayIcon.png"), pngBuffers[32]);
  console.log("Wrote assets/trayIcon.png");

  const icoBuffer = buildIco(
    [pngBuffers[16], pngBuffers[32], pngBuffers[48], pngBuffers[256]],
    [16, 32, 48, 256]
  );
  fs.writeFileSync(path.join(__dirname, "assets", "icon.ico"), icoBuffer);
  console.log("Wrote assets/icon.ico");

  app.quit();
});

function buildIco(pngBuffers, sizes) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;

  let offset = headerSize + count * dirEntrySize;
  const offsets = pngBuffers.map((buf) => { const o = offset; offset += buf.length; return o; });

  const buf = Buffer.alloc(offset);
  buf.writeUInt16LE(0, 0);
  buf.writeUInt16LE(1, 2);
  buf.writeUInt16LE(count, 4);

  pngBuffers.forEach((png, i) => {
    const base = headerSize + i * dirEntrySize;
    const s = sizes[i];
    buf.writeUInt8(s >= 256 ? 0 : s, base);
    buf.writeUInt8(s >= 256 ? 0 : s, base + 1);
    buf.writeUInt8(0, base + 2);
    buf.writeUInt8(0, base + 3);
    buf.writeUInt16LE(1, base + 4);
    buf.writeUInt16LE(32, base + 6);
    buf.writeUInt32LE(png.length, base + 8);
    buf.writeUInt32LE(offsets[i], base + 12);
    png.copy(buf, offsets[i]);
  });

  return buf;
}
