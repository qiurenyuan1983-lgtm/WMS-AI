/**
 * Vue <template> does not decode \\uXXXX ?? convert to UTF-8 Chinese in .vue files.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function decodeUnicode(str) {
  return str.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function fixVueFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  const fixed = decodeUnicode(content);
  if (fixed === content) return false;
  fs.writeFileSync(file, fixed, 'utf8');
  return true;
}

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith('.vue')) out.push(p);
  }
  return out;
}

const dirs = [
  path.join(root, 'src/views/wms'),
  path.join(root, 'src/components/wms-prototype')
];
let n = 0;
for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  for (const f of walk(dir)) {
    if (fixVueFile(f)) {
      console.log('fixed', path.relative(root, f));
      n += 1;
    }
  }
}
console.log(`done, ${n} files`);
