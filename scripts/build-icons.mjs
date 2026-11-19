// Generates every favicon / app icon in public/favicon from the vector designs below.
// Run with: node scripts/build-icons.mjs
import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

const out = join(process.cwd(), "public/favicon");
const colors = { terminal: "#300a24", surface: "#5e2750", accent: "#77216f", paper: "#fbfaf4", orange: "#e95420", pink: "#f0c4e8" };

// The C/D mark of the header, drawn on a 64×64 grid.
const mark = (ink, slash) => `
  <path d="M25 16c-2.6-2.7-5.6-4-8.7-4-7.3 0-12.3 8.2-12.3 20s5 20 12.3 20c3.1 0 6.1-1.3 8.7-4" fill="none" stroke="${ink}" stroke-width="7" stroke-linecap="square"/>
  <path d="M28 52 36 12" fill="none" stroke="${slash}" stroke-width="7" stroke-linecap="square"/>
  <path d="M42 12v40h5c8 0 13-8.2 13-20S55 12 47 12z" fill="none" stroke="${ink}" stroke-width="7"/>`;

// Small sizes: just the mark, as large as possible so it reads at 16 px.
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="${colors.terminal}"/>
  <g transform="translate(4 4) scale(.875)">${mark(colors.paper, colors.orange)}</g>
</svg>
`;

// Large sizes: a terminal window like the frames used across the site.
const app = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="${colors.terminal}"/>
  <rect width="64" height="12" fill="${colors.surface}"/>
  <rect y="12" width="64" height="1" fill="${colors.accent}"/>
  <circle cx="8" cy="6" r="2.2" fill="${colors.orange}"/>
  <circle cx="14.5" cy="6" r="2" fill="none" stroke="${colors.pink}" stroke-width=".8"/>
  <circle cx="21" cy="6" r="2" fill="none" stroke="${colors.pink}" stroke-width=".8"/>
  <g transform="translate(12 19) scale(.625)">${mark(colors.paper, colors.orange)}</g>
  <rect x="50" y="51" width="5" height="5" fill="${colors.orange}"/>
</svg>
`;

async function png(svg, size, file) {
  const buffer = await sharp(Buffer.from(svg), { density: Math.ceil((72 * size) / 64) * 4 }).resize(size, size).png().toBuffer();
  if (file) await writeFile(join(out, file), buffer);
  return buffer;
}

// Minimal ICO container holding PNG images (supported by every current browser).
function ico(images) {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, index) => {
    const entry = 6 + index * 16;
    header.writeUInt8(size >= 256 ? 0 : size, entry);
    header.writeUInt8(size >= 256 ? 0 : size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map(({ data }) => data)]);
}

await writeFile(join(out, "favicon.svg"), favicon);
const small = await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(favicon, size, size === 48 ? undefined : `favicon-${size}x${size}.png`) })));
await writeFile(join(out, "favicon.ico"), ico(small));
await png(app, 180, "apple-touch-icon.png");
await png(app, 192, "android-chrome-192x192.png");
await png(app, 512, "android-chrome-512x512.png");
await png(app, 150, "mstile-150x150.png");
console.log("Icons written to public/favicon");
