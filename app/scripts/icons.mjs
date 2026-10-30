// Generates PNG icons from public/icons/icon.svg.  Run: node scripts/icons.mjs
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '..', 'public', 'icons');
const svg = readFileSync(join(dir, 'icon.svg'));

const out = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
  ['badge-96.png', 96],
];
for (const [name, size] of out) {
  await sharp(svg, { density: 300 }).resize(size, size).png().toFile(join(dir, name));
  console.log('wrote', name);
}
