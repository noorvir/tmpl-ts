const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');

const distPreload = path.join(dist, 'preload.js');
if (!fs.existsSync(dist)) fs.mkdirSync(dist, { recursive: true });

if (!fs.existsSync(distPreload)) {
  const srcPreload = path.join(root, 'src', 'preload.js');
  if (fs.existsSync(srcPreload)) {
    fs.copyFileSync(srcPreload, distPreload);
    console.log('Copied preload.js to dist');
  } else {
    console.warn('preload.js not found in src or dist');
  }
}