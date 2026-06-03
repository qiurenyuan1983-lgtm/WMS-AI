import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const detail = fs.readFileSync(path.join(root, 'src/views/wms/devanning-order-detail/index.vue'), 'utf8');
const m = detail.match(/UNPICKEDUP: '([^']+)'/);
console.log('UNPICKEDUP label:', m?.[1]);
console.log('codepoints:', [...(m?.[1] || '')].map(c => 'U+' + c.charCodeAt(0).toString(16).toUpperCase()).join(' '));
const expect = '\u672a\u63d0\u67dc';
console.log('matches Œ¥Ã·πÒ:', m?.[1] === expect);
