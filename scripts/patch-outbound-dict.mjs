import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const p = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/mock/dict-data.ts');
let c = fs.readFileSync(p, 'utf8');
if (c.includes('wms_outbound_status')) {
  console.log('wms_outbound_status already exists');
  process.exit(0);
}
const block = `  wms_outbound_direction: [
    { label: '\u6d3e\u9001', value: 'DELIVERY' },
    { label: '\u8c03\u62e8', value: 'TRANSFER' }
  ],
  wms_outbound_status: [
    { label: '\u5df2\u521b\u5efa', value: 'CREATED' },
    { label: '\u5df2\u6d3e\u53d1', value: 'DISPATCHED', listClass: 'info' },
    { label: '\u5df2\u51fa\u5e93', value: 'OUTBOUNDED', listClass: 'warning' },
    { label: '\u6d3e\u9001\u4e2d', value: 'DELIVERING', listClass: 'primary' },
    { label: '\u5df2\u7b7e\u6536', value: 'DELIVERED', listClass: 'success' },
    { label: '\u5df2\u5b8c\u6210', value: 'COMPLETED', listClass: 'success' },
    { label: '\u5df2\u53d6\u6d88', value: 'CANCELLED' }
  ],
`;
c = c.replace('  wms_inbound_status:', `${block}  wms_inbound_status:`);
fs.writeFileSync(p, c, 'utf8');
console.log('added wms_outbound dict');
