// Генератор PNG-иконок для PWA-манифеста.
// Запуск: `node scripts/generate-icons.mjs`. Кладёт icon-192.png и icon-512.png в public/.
// Дизайн временный — нейтральная сэйдж-палитра, буква 'N'. Заменим при финальном брендинге.

import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '..', 'public');

const svg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#e7f0ea"/>
  <circle cx="256" cy="256" r="170" fill="#4a6b58"/>
  <text x="256" y="320" font-family="-apple-system, system-ui, sans-serif"
        font-size="220" font-weight="600" fill="#e7f0ea" text-anchor="middle">N</text>
</svg>`;

async function main() {
  await mkdir(publicDir, { recursive: true });
  for (const size of [192, 512]) {
    const out = resolve(publicDir, `icon-${size}.png`);
    await sharp(Buffer.from(svg(size)))
      .resize(size, size)
      .png()
      .toFile(out);
    console.log(`Wrote ${out}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
