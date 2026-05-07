/**
 * Generate PWA icons from a dumbbell SVG. Run with: npm run icons:gen
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" rx="180" fill="#3f9d4a"/>
  <g fill="#fff">
    <rect x="120" y="430" width="120" height="164" rx="40"/>
    <rect x="784" y="430" width="120" height="164" rx="40"/>
    <rect x="240" y="468" width="80" height="88" rx="24"/>
    <rect x="704" y="468" width="80" height="88" rx="24"/>
    <rect x="320" y="488" width="384" height="48" rx="20"/>
  </g>
</svg>
`.trim();

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "icon-1024.png", size: 1024 },
  { name: "icon-maskable-512.png", size: 512 },
];

async function main() {
  const outDir = resolve(process.cwd(), "public/icons");
  await mkdir(outDir, { recursive: true });
  for (const { name, size } of sizes) {
    const buf = await sharp(Buffer.from(SVG)).resize(size, size).png().toBuffer();
    await writeFile(resolve(outDir, name), buf);
    console.log(`wrote ${name}`);
  }
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
