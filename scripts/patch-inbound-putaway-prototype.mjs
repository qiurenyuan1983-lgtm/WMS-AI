/**
 * Inbound list: one row per pallet. Putaway: batch multi-pallet tasks.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const prototypePath = path.join(root, 'src/mock/data/wms-prototype.ts');
let proto = fs.readFileSync(prototypePath, 'utf8');

const inboundBlock = `export const MOCK_INBOUND_ORDERS = [
  {
    id: 71001,
    ...base,
    inboundNo: 'IN-2026-0001',
    palletNo: 'PLT-IN-2026-001',
    devanningNo: 'DV-2026-0001',
    customerName: '\\u6f14\\u793a\\u5ba2\\u6237 A',
    boxQty: 40,
    weight: 520,
    stagingDock: 'STG-DEV-01',
    status: 'PENDING',
    createTime: '2026-06-01 10:00:00'
  },
  {
    id: 71002,
    ...base,
    inboundNo: 'IN-2026-0001',
    palletNo: 'PLT-IN-2026-002',
    devanningNo: 'DV-2026-0001',
    customerName: '\\u6f14\\u793a\\u5ba2\\u6237 A',
    boxQty: 35,
    weight: 455,
    stagingDock: 'STG-DEV-01',
    status: 'PENDING',
    createTime: '2026-06-01 10:05:00'
  },
  {
    id: 71003,
    ...base,
    inboundNo: 'IN-2026-0001',
    palletNo: 'PLT-IN-2026-003',
    devanningNo: 'DV-2026-0001',
    customerName: '\\u6f14\\u793a\\u5ba2\\u6237 A',
    boxQty: 45,
    weight: 580,
    stagingDock: 'STG-DEV-01',
    status: 'IN_PROGRESS',
    createTime: '2026-06-01 10:10:00'
  },
  {
    id: 71004,
    ...base,
    inboundNo: 'IN-2026-0002',
    palletNo: 'PLT-IN-2026-004',
    devanningNo: 'DV-2026-0002',
    customerName: '\\u6f14\\u793a\\u5ba2\\u6237 B',
    boxQty: 28,
    weight: 360,
    stagingDock: 'STG-DEV-02',
    status: 'PENDING',
    createTime: '2026-06-02 09:00:00'
  },
  {
    id: 71005,
    ...base,
    inboundNo: 'IN-2026-0002',
    palletNo: 'PLT-IN-2026-005',
    devanningNo: 'DV-2026-0002',
    customerName: '\\u6f14\\u793a\\u5ba2\\u6237 B',
    boxQty: 32,
    weight: 410,
    stagingDock: 'STG-DEV-02',
    status: 'COMPLETED',
    createTime: '2026-06-02 09:30:00'
  }
];`;

const putawayBlock = `export const MOCK_PUTAWAY_TASKS = [
  {
    id: 72001,
    ...base,
    taskNo: 'PT-2026-0001',
    customerName: '\\u6f14\\u793a\\u5ba2\\u6237 A',
    palletQty: 3,
    palletNos: 'PLT-IN-2026-001, PLT-IN-2026-002, PLT-IN-2026-003',
    recommendLocation: 'A-02-03',
    putawayMode: 'BATCH',
    status: 'PENDING',
    createTime: '2026-06-01 14:00:00'
  },
  {
    id: 72002,
    ...base,
    taskNo: 'PT-2026-0002',
    customerName: '\\u6f14\\u793a\\u5ba2\\u6237 B',
    palletQty: 2,
    palletNos: 'PLT-IN-2026-004, PLT-IN-2026-005',
    recommendLocation: 'B-01-02',
    putawayMode: 'BATCH',
    status: 'ASSIGNED',
    createTime: '2026-06-02 15:00:00'
  },
  {
    id: 72003,
    ...base,
    taskNo: 'PT-2026-0003',
    customerName: '\\u6f14\\u793a\\u5ba2\\u6237 A',
    palletQty: 1,
    palletNos: 'PLT-IN-2026-006',
    recommendLocation: 'A-03-01',
    putawayMode: 'SINGLE',
    status: 'IN_PROGRESS',
    createTime: '2026-06-03 08:00:00'
  }
];

/** PDA \\u6279\\u91cf\\u4e0a\\u67b6\\u660e\\u7ec6\\uff08\\u6309 taskNo \\u67e5\\uff09 */
export const MOCK_PUTAWAY_TASK_LINES: Record<string, Array<{ palletNo: string; boxQty: number; recommendLocation: string; status: string }>> = {
  'PT-2026-0001': [
    { palletNo: 'PLT-IN-2026-001', boxQty: 40, recommendLocation: 'A-02-03', status: 'PENDING' },
    { palletNo: 'PLT-IN-2026-002', boxQty: 35, recommendLocation: 'A-02-03', status: 'PENDING' },
    { palletNo: 'PLT-IN-2026-003', boxQty: 45, recommendLocation: 'A-02-04', status: 'PENDING' }
  ],
  'PT-2026-0002': [
    { palletNo: 'PLT-IN-2026-004', boxQty: 28, recommendLocation: 'B-01-02', status: 'PENDING' },
    { palletNo: 'PLT-IN-2026-005', boxQty: 32, recommendLocation: 'B-01-02', status: 'PENDING' }
  ],
  'PT-2026-0003': [
    { palletNo: 'PLT-IN-2026-006', boxQty: 50, recommendLocation: 'A-03-01', status: 'PENDING' }
  ]
};`;

function replaceExport(name, block, content) {
  const re = new RegExp(`export const ${name} = \\[[\\s\\S]*?\\];\\r?\\n`);
  if (!re.test(content)) throw new Error(`block ${name} not found`);
  return content.replace(re, `${block}\n`);
}

proto = replaceExport('MOCK_INBOUND_ORDERS', inboundBlock, proto);
// Putaway: replace tasks + insert lines before MOCK_OPERATION
const putRe = /export const MOCK_PUTAWAY_TASKS = \[[\s\S]*?\];\r?\n\r?\nexport const MOCK_OPERATION/;
if (!putRe.test(proto)) throw new Error('putaway block not found');
proto = proto.replace(putRe, `${putawayBlock}\n\nexport const MOCK_OPERATION`);
fs.writeFileSync(prototypePath, proto, 'utf8');

// Fix dict labels if corrupted
const dictPath = path.join(root, 'src/mock/dict-data.ts');
let dict = fs.readFileSync(dictPath, 'utf8');
const inboundDict = `  wms_inbound_status: [
    { label: '\\u5f85\\u5165\\u5e93', value: 'PENDING' },
    { label: '\\u5165\\u5e93\\u4e2d', value: 'IN_PROGRESS', listClass: 'warning' },
    { label: '\\u5df2\\u5165\\u5e93', value: 'COMPLETED', listClass: 'success' }
  ]`;
const putawayDict = `  wms_putaway_status: [
    { label: '\\u5f85\\u4e0a\\u67b6', value: 'PENDING' },
    { label: '\\u5df2\\u5206\\u914d', value: 'ASSIGNED', listClass: 'info' },
    { label: '\\u4e0a\\u67b6\\u4e2d', value: 'IN_PROGRESS', listClass: 'warning' },
    { label: '\\u5df2\\u5b8c\\u6210', value: 'COMPLETED', listClass: 'success' }
  ]`;
dict = dict.replace(/  wms_inbound_status: \[[\s\S]*?\],/, `${inboundDict},`);
dict = dict.replace(/  wms_putaway_status: \[[\s\S]*?\],/, `${putawayDict},`);
if (!dict.includes('wms_putaway_mode')) {
  dict = dict.replace(
    /  wms_putaway_status:/,
    `  wms_putaway_mode: [
    { label: '\\u5355\\u677f', value: 'SINGLE' },
    { label: '\\u6279\\u91cf', value: 'BATCH', listClass: 'primary' }
  ],
  wms_putaway_status:`
  );
}
fs.writeFileSync(dictPath, dict, 'utf8');

console.log('patched inbound (per-pallet) + putaway (batch) mock');
