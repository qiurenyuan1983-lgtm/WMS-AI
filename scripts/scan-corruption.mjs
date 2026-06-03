import fs from 'fs';
import path from 'path';

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules') walk(p, files);
    else if (/\.(ts|tsx|vue|js|jsx)$/.test(e.name)) files.push(p);
  }
  return files;
}

function isCorruptedLine(line) {
  if (!/\?/.test(line)) return false;
  if (/\?{3,}/.test(line)) return true;
  if (/['`][^'`]*\?{2,}[^'`]*['`]/.test(line)) return true;
  if (/(\/\/|\/\*|\*|label=|title:|placeholder=|message\.|>)[^\n]*\?{2,}/.test(line)) return true;
  if (/title:\s*'[^']*\?[^']*'/.test(line)) return true;
  if (/label="[^"]*\?[^"]*"/.test(line)) return true;
  if (/>[^<{]*\?{2,}[^<{]*</.test(line)) return true;
  return false;
}

const root = new URL('../src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const files = walk(root);
const results = new Map();

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, i) => {
    if (isCorruptedLine(line)) {
      const rel = path.relative(root, f).replace(/\\/g, '/');
      if (!results.has(rel)) results.set(rel, []);
      results.get(rel).push({ line: i + 1, text: line.trim().slice(0, 140) });
    }
  });
}

console.log('Files:', results.size);
let total = 0;
for (const [f, lines] of [...results.entries()].sort()) {
  total += lines.length;
  console.log(`\n${f} (${lines.length})`);
  lines.forEach(l => console.log(`  L${l.line}: ${l.text}`));
}
console.log('\nTotal lines:', total);
