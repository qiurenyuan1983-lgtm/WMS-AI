import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const p = path.join(root, 'src/mock/dict-data.ts');
let c = fs.readFileSync(p, 'utf8');

const method = `  wms_devanning_method: [
    { label: '\u4eba\u5de5', value: 'MANUAL' },
    { label: '\u53c9\u8f66', value: 'FORKLIFT', listClass: 'info' },
    { label: '\u673a\u68b0', value: 'MACHINE', listClass: 'primary' }
  ],`;

const status = `  wms_devanning_status: [
    { label: '\u672a\u63d0\u67dc', value: 'UNPICKEDUP' },
    { label: '\u5df2\u63d0\u67dc', value: 'PICKEDUP', listClass: 'info' },
    { label: '\u5df2\u5230\u4ed3', value: 'ARRIVED', listClass: 'processing' },
    { label: '\u62c6\u67dc\u4e2d', value: 'DEVANNING', listClass: 'warning' },
    { label: '\u62c6\u67dc\u5b8c\u6210', value: 'DEVANNED', listClass: 'success' },
    { label: '\u5f02\u5e38', value: 'EXCEPTION', listClass: 'error' },
    { label: '\u53d6\u6d88', value: 'CANCELLED' }
  ],`;

c = c.replace(/  wms_devanning_method:\s*\[[\s\S]*?\],\s*  wms_devanning_status:\s*\[[\s\S]*?\],/, `${method}\n${status}`);
fs.writeFileSync(p, c, 'utf8');
console.log('fixed wms_devanning dict');
