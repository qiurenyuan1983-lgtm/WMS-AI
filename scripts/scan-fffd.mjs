import fs from 'fs';
import path from 'path';

const root = path.resolve('src');

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules') walk(p, files);
    else if (/\.(ts|tsx|vue|js)$/.test(e.name)) files.push(p);
  }
  return files;
}

const files = walk(root);
const repFiles = [];
const qFiles = [];

for (const f of files) {
  const c = fs.readFileSync(f, 'utf8');
  const rel = path.relative(root, f).replace(/\\/g, '/');
  if (c.includes('\uFFFD')) repFiles.push(rel);
  if (/\?{3,}/.test(c)) qFiles.push(rel);
}

console.log('FFFD files:', repFiles.length);
repFiles.forEach(f => console.log(' ', f));
console.log('??? files:', qFiles.length);
qFiles.forEach(f => console.log(' ', f));
