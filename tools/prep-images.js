const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");
const jpeg = require("jpeg-js");

function readImage(file) {
  const buf = fs.readFileSync(file);
  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;
  if (isJpeg) {
    const raw = jpeg.decode(buf, { useTArray: true, formatAsRGBA: true });
    return { width: raw.width, height: raw.height, data: raw.data };
  }
  const png = PNG.sync.read(buf);
  return { width: png.width, height: png.height, data: png.data };
}

const root = path.resolve(__dirname, "..");
const assetsDir = path.join(root, "assets");
fs.mkdirSync(assetsDir, { recursive: true });

const shotPath =
  "C:\\Users\\Camil\\.cursor\\projects\\c-Users-Camil-Pictures-efeti\\assets\\c__Users_Camil_AppData_Roaming_Cursor_User_workspaceStorage_7b2466b6c031a650a55874e21d9d8db5_images_image-5a93c12f-2429-4d8a-a74c-0d183b6ea351.png";
const heroSrc =
  "C:\\Users\\Camil\\.cursor\\projects\\c-Users-Camil-Pictures-efeti\\assets\\hero-fridge.png";
const cardSrc =
  "C:\\Users\\Camil\\.cursor\\projects\\c-Users-Camil-Pictures-efeti\\assets\\fridge-card.png";

function hex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
      .join("")
  );
}

const shot = readImage(shotPath);
const sw = shot.width;
const sh = shot.height;
const sample = (x, y) => {
  const i = (Math.round(y) * sw + Math.round(x)) * 4;
  return hex(shot.data[i], shot.data[i + 1], shot.data[i + 2]);
};
const pts = {
  bg: [0.12 * sw, 0.45 * sh],
  headline: [0.1 * sw, 0.38 * sh],
  footer: [0.3 * sw, 0.975 * sh],
  btn: [0.8 * sw, 0.055 * sh],
  yellow: [0.09 * sw, 0.7 * sh],
  shape: [0.96 * sw, 0.2 * sh],
  card: [0.9 * sw, 0.82 * sh],
  nav: [0.25 * sw, 0.055 * sh],
};
console.log("screenshot", sw, sh);
for (const [name, [x, y]] of Object.entries(pts)) {
  console.log(name, sample(x, y), "at", Math.round(x), Math.round(y));
}

function knockOut(src, dest, threshold = 32, feather = 58) {
  const decoded = readImage(src);
  const { width, height } = decoded;
  const data = Buffer.from(decoded.data);
  const png = new PNG({ width, height });
  const corners = [
    [1, 1],
    [width - 2, 1],
    [1, height - 2],
    [width - 2, height - 2],
    [Math.floor(width / 2), 1],
  ];
  let br = 0;
  let bg = 0;
  let bb = 0;
  for (const [x, y] of corners) {
    const i = (y * width + x) * 4;
    br += data[i];
    bg += data[i + 1];
    bb += data[i + 2];
  }
  br /= corners.length;
  bg /= corners.length;
  bb /= corners.length;

  const visited = new Uint8Array(width * height);
  const qx = new Int32Array(width * height);
  const qy = new Int32Array(width * height);
  let qe = 0;

  const limit = threshold * threshold;
  function consider(x, y) {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (visited[p]) return;
    const i = p * 4;
    const dr = data[i] - br;
    const dg = data[i + 1] - bg;
    const db = data[i + 2] - bb;
    if (dr * dr + dg * dg + db * db > limit) return;
    visited[p] = 1;
    qx[qe] = x;
    qy[qe] = y;
    qe++;
  }

  for (let x = 0; x < width; x++) {
    consider(x, 0);
    consider(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    consider(0, y);
    consider(width - 1, y);
  }
  for (let qs = 0; qs < qe; qs++) {
    const x = qx[qs];
    const y = qy[qs];
    consider(x + 1, y);
    consider(x - 1, y);
    consider(x, y + 1);
    consider(x, y - 1);
  }

  for (let p = 0; p < width * height; p++) {
    if (visited[p]) data[p * 4 + 3] = 0;
  }

  const featherLimit = feather * feather;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const p = y * width + x;
      if (visited[p]) continue;
      const up = visited[p - width];
      const dn = visited[p + width];
      const lf = visited[p - 1];
      const rt = visited[p + 1];
      if (!up && !dn && !lf && !rt) continue;
      const i = p * 4;
      const dr = data[i] - br;
      const dg = data[i + 1] - bg;
      const db = data[i + 2] - bb;
      const dist2 = dr * dr + dg * dg + db * db;
      if (dist2 >= featherLimit) continue;
      const dist = Math.sqrt(dist2);
      const t = (dist - threshold) / (feather - threshold);
      data[i + 3] = Math.max(0, Math.min(255, Math.round(t * 255)));
    }
  }

  function clampByte(v) {
    return Math.max(0, Math.min(255, Math.round(v)));
  }
  const alphaSnap = new Uint8Array(width * height);
  for (let p = 0; p < alphaSnap.length; p++) alphaSnap[p] = data[p * 4 + 3];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const p = y * width + x;
      if (alphaSnap[p] === 0) continue;
      const edge =
        alphaSnap[p - 1] < 28 ||
        alphaSnap[p + 1] < 28 ||
        alphaSnap[p - width] < 28 ||
        alphaSnap[p + width] < 28 ||
        alphaSnap[p - width - 1] < 28 ||
        alphaSnap[p - width + 1] < 28 ||
        alphaSnap[p + width - 1] < 28 ||
        alphaSnap[p + width + 1] < 28;
      if (!edge) continue;
      const i = p * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const dist = Math.hypot(r - br, g - bg, b - bb);
      let alpha = alphaSnap[p] / 255;
      if (dist < 46) alpha = Math.min(alpha, dist / 46);
      if (alpha < 0.05) {
        data[i + 3] = 0;
        continue;
      }
      data[i] = clampByte((r - br * (1 - alpha)) / alpha);
      data[i + 1] = clampByte((g - bg * (1 - alpha)) / alpha);
      data[i + 2] = clampByte((b - bb * (1 - alpha)) / alpha);
      data[i + 3] = clampByte(alpha * 255);
    }
  }

  let cleared = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] === 0) cleared++;
  png.data.set(data);
  fs.writeFileSync(dest, PNG.sync.write(png));
  console.log("wrote", dest, width, height, "bg", hex(br, bg, bb), "cleared", cleared);
}

knockOut(heroSrc, path.join(assetsDir, "hero-fridge.png"));
fs.copyFileSync(cardSrc, path.join(assetsDir, "fridge-card.jpg"));
console.log("copied card");
