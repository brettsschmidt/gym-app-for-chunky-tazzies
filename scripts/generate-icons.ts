/**
 * Generate the brand mark + PWA icons from a simple inline dumbbell SVG.
 * Run with: npm run icons:gen
 *
 * Writes:
 *   public/branding/logo-transparent.png  — transparent-bg dumbbell, used in
 *                                            the landing hero, header, and
 *                                            welcome dialog
 *   public/icons/icon-{192,512,1024}.png  — PWA icons on cream
 *   public/icons/icon-maskable-512.png    — maskable icon on cocoa
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const ICON_BG = "#f8f1de"; // milk — matches manifest background_color
const MASKABLE_BG = "#231a13"; // cocoa — matches manifest theme_color
const DUMBBELL_COLOR = "#231a13"; // cocoa primary

const dumbbellSvg = (color: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
    <g fill="${color}">
      <rect x="120" y="430" width="120" height="164" rx="40"/>
      <rect x="784" y="430" width="120" height="164" rx="40"/>
      <rect x="240" y="468" width="80" height="88" rx="24"/>
      <rect x="704" y="468" width="80" height="88" rx="24"/>
      <rect x="320" y="488" width="384" height="48" rx="20"/>
    </g>
  </svg>`;

const sizes = [
  { name: "icon-192.png", size: 192, bg: ICON_BG, padding: 0.12, fg: DUMBBELL_COLOR },
  { name: "icon-512.png", size: 512, bg: ICON_BG, padding: 0.12, fg: DUMBBELL_COLOR },
  { name: "icon-1024.png", size: 1024, bg: ICON_BG, padding: 0.12, fg: DUMBBELL_COLOR },
  { name: "icon-maskable-512.png", size: 512, bg: MASKABLE_BG, padding: 0.22, fg: ICON_BG },
];

async function main() {
  // Standalone transparent-bg logo for inline UI use.
  const standalone = await sharp(Buffer.from(dumbbellSvg(DUMBBELL_COLOR)))
    .resize(1024, 1024)
    .png()
    .toBuffer();
  const standaloneOut = resolve(
    process.cwd(),
    "public/branding/logo-transparent.png",
  );
  await writeFile(standaloneOut, standalone);
  console.log(`wrote ${standaloneOut}`);

  // PWA icons.
  const outDir = resolve(process.cwd(), "public/icons");
  await mkdir(outDir, { recursive: true });
  for (const { name, size, bg, padding, fg } of sizes) {
    const inner = Math.round(size * (1 - padding * 2));
    const dumbbell = await sharp(Buffer.from(dumbbellSvg(fg)))
      .resize(inner, inner)
      .png()
      .toBuffer();
    const composed = await sharp({
      create: { width: size, height: size, channels: 4, background: bg },
    })
      .composite([{ input: dumbbell, gravity: "center" }])
      .png()
      .toBuffer();
    await writeFile(resolve(outDir, name), composed);
    console.log(`wrote ${name}`);
  }
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
