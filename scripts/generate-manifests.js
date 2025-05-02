// scripts/generate-manifests.js
const fs   = require('fs');
const path = require('path');

const imgRoot = path.join(__dirname, '..', 'images');
const exts = ['.jpg', '.jpeg', '.png', '.gif', '.wav'];

function walkDirs(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => path.join(dir, d.name));
}

function makeManifest(folder) {
  const files = fs.readdirSync(folder)
    .filter(f => exts.includes(path.extname(f).toLowerCase()))
    .sort();
  const manifest = { images: files };
  fs.writeFileSync(
    path.join(folder, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n'
  );
  console.log(`→ ${path.relative(process.cwd(), folder)}/manifest.json (${files.length} Bilder)`);
}

walkDirs(imgRoot).forEach(sub => makeManifest(sub));
