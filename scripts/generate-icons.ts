/**
 * Generate the brand mark + PWA icons + browser-tab favicons from the cat-base
 * mascot sprite. Run with: npm run icons:gen
 *
 * Source: public/branding/mascot/cat-base.png (the south-facing rotation of the
 * Tazzie Cow-Cat character generated via the pixellab MCP).
 *
 * Writes:
 *   public/branding/logo-transparent.png  — pass-through copy used in the
 *                                            landing hero, header, and welcome
 *                                            dialog
 *   public/icons/icon-{192,512,1024}.png  — PWA icons on cream
 *   public/icons/icon-maskable-512.png    — maskable icon on cocoa
 *   app/icon.png                          — browser-tab favicon (Next.js
 *                                            picks this up automatically)
 *   app/apple-icon.png                    — iOS home-screen icon
 */
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const SRC = resolve(process.cwd(), "public/branding/mascot/cat-base.png");
const TRANSPARENT_OUT = resolve(
  process.cwd(),
  "public/branding/logo-transparent.png",
);

const ICON_BG = "#f8f1de"; // milk — matches manifest background_color
const MASKABLE_BG = "#231a13"; // cocoa — matches manifest theme_color

const pwaSizes = [
  { name: "icon-192.png", size: 192, bg: ICON_BG, padding: 0.12 },
  { name: "icon-512.png", size: 512, bg: ICON_BG, padding: 0.12 },
  { name: "icon-1024.png", size: 1024, bg: ICON_BG, padding: 0.12 },
  { name: "icon-maskable-512.png", size: 512, bg: MASKABLE_BG, padding: 0.22 },
];

// Browser tab + iOS home screen. Tiny canvases want extra padding so the cat
// doesn't bleed into the corners at favicon sizes.
const appIcons = [
  { path: "app/icon.png", size: 64, bg: ICON_BG, padding: 0.08 },
  { path: "app/apple-icon.png", size: 180, bg: ICON_BG, padding: 0.12 },
];

async function main() {
  // Standalone logo for inline UI use — pass-through copy, alpha already clean
  // because the pixel-art sprite was rendered with transparency.
  await copyFile(SRC, TRANSPARENT_OUT);
  console.log(`wrote ${TRANSPARENT_OUT}`);

  // Pixel-art is tiny (64×92ish). Trim transparent border so the cat fills the
  // icon, then nearest-neighbor upscale to keep pixels crisp at icon sizes.
  const trimmed = await sharp(SRC).trim().toBuffer();

  async function compose(size: number, bg: string, padding: number): Promise<Buffer> {
    const inner = Math.round(size * (1 - padding * 2));
    const cat = await sharp(trimmed)
      .resize(inner, inner, {
        fit: "contain",
        kernel: "nearest", // keep pixel-art crisp on upscale
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toBuffer();
    return sharp({
      create: { width: size, height: size, channels: 4, background: bg },
    })
      .composite([{ input: cat, gravity: "center" }])
      .png()
      .toBuffer();
  }

  const outDir = resolve(process.cwd(), "public/icons");
  await mkdir(outDir, { recursive: true });

  for (const { name, size, bg, padding } of pwaSizes) {
    const buf = await compose(size, bg, padding);
    await writeFile(resolve(outDir, name), buf);
    console.log(`wrote ${name}`);
  }

  for (const { path, size, bg, padding } of appIcons) {
    const buf = await compose(size, bg, padding);
    await writeFile(resolve(process.cwd(), path), buf);
    console.log(`wrote ${path}`);
  }
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
