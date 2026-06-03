import fs from 'fs';

const files = [
  'src/mock/dict-data.ts',
  'src/mock/data/common.ts',
  'src/mock/data/wms.ts',
  'src/mock/data/oms.ts',
  'src/mock/data/yms.ts',
  'src/mock/data/base.ts',
  'src/mock/handler.ts'
];

for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  const hasQ = s.includes('????');
  const label = s.match(/label: "([^"]+)"/)?.[1] || s.match(/companyName: '([^']+)'/)?.[1] || s.match(/driverName: '([^']+)'/)?.[1] || '-';
  console.log(`${f}: ????=${hasQ} sample=${label}`);
}
