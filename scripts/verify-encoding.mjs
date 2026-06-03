import fs from 'fs';
import path from 'path';

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules') walk(p, files);
    else if (/\.(ts|tsx|vue|js)$/.test(e.name)) files.push(p);
  }
  return files;
}

const root = path.resolve('src');
let fffd = 0;
let qqq = 0;
let garbled = 0;

for (const f of walk(root)) {
  const c = fs.readFileSync(f, 'utf8');
  fffd += (c.match(/\uFFFD/g) || []).length;
  qqq += (c.match(/\?{3,}/g) || []).length;
  garbled += (c.match(/\u951f\u65a4\u62f7/g) || []).length;
}

console.log('FFFD count:', fffd);
console.log('??? sequences:', qqq);
console.log('garbled count:', garbled);

const samples = [
  'mock/data/wms.ts',
  'mock/dict-data.ts',
  'components/wms-prototype/WmsPrototypeList.vue',
  'mock/handler.ts'
];
for (const rel of samples) {
  const c = fs.readFileSync(path.join(root, rel), 'utf8');
  console.log('\n--', rel, '--');
  if (rel.includes('wms.ts')) console.log(c.match(/zoneName: '[^']+'/)?.[0]);
  if (rel.includes('dict')) console.log(c.split('\n')[23]);
  if (rel.includes('Wms')) {
    const line = c.split('\n').find(l => l.includes('handleSearch'));
    console.log(line?.trim());
  }
  if (rel.includes('handler')) {
    console.log(c.split('\n').find(l => l.includes('¾«È· URL'))?.trim());
  }
}
