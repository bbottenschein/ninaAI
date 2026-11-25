// Rendert das App-Icon (mouse.svg) in alle PNG-Größen der PWA.
// Aufruf: node scripts/icons/render.mjs   (braucht Playwright mit Chromium)
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const svg = readFileSync(here("./mouse.svg"), "utf8");

// any: abgerundetes Quadrat · maskable/apple: vollflächig, Maus etwas kleiner (Safe Zone)
const variants = [
  { file: "icon-192.png", size: 192, shape: "rounded", scale: 1 },
  { file: "icon-512.png", size: 512, shape: "rounded", scale: 1 },
  { file: "icon-maskable-512.png", size: 512, shape: "full", scale: 0.82 },
  { file: "apple-touch-icon.png", size: 180, shape: "full", scale: 0.92 },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const v of variants) {
  const radius = v.shape === "rounded" ? "22%" : "0";
  const inner = svg.replace(
    '<g id="mouse">',
    `<g id="mouse" transform="translate(256 256) scale(${v.scale}) translate(-256 -256)">`,
  );
  await page.setViewportSize({ width: v.size, height: v.size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">
      <div style="width:${v.size}px;height:${v.size}px;border-radius:${radius};overflow:hidden">${inner.replace("<svg ", `<svg width="${v.size}" height="${v.size}" `)}</div>
    </body></html>`,
  );
  const png = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: v.size, height: v.size } });
  writeFileSync(here(`../../public/icons/${v.file}`), png);
  console.log("✓", v.file);
}
await browser.close();
