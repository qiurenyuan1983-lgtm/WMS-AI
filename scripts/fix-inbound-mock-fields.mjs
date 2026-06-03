import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mockPath = path.join(__dirname, '../src/mock/data/wms-prototype.ts');

let mock = fs.readFileSync(mockPath, 'utf8');

mock = mock
  .replace(/devanningNo: 'DV-2026-0001',\n/g, "containerNo: 'MSCU1234567',\n    groupCode: 'FedEx-LAX',\n")
  .replace(/devanningNo: 'DV-2026-0002',\n/g, "containerNo: 'OOLU7654321',\n    groupCode: 'UPS-ORD',\n");

// PLT-003 use different group for demo variety
mock = mock.replace(
  "palletNo: 'PLT-IN-2026-003',\n    containerNo: 'MSCU1234567',\n    groupCode: 'FedEx-LAX',",
  "palletNo: 'PLT-IN-2026-003',\n    containerNo: 'MSCU1234567',\n    groupCode: 'UPS-ORD',"
);

const putawayBlock = `export const MOCK_PUTAWAY_TASKS = [
  {
    id: 72001,
    ...base,
    taskNo: 'PT-2026-0001',
    containerNo: 'MSCU1234567',
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
    containerNo: 'OOLU7654321',
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
    containerNo: 'MSCU1234567',
    customerName: '\\u6f14\\u793a\\u5ba2\\u6237 A',
    palletQty: 1,
    palletNos: 'PLT-IN-2026-006',
    recommendLocation: 'A-03-01',
    putawayMode: 'SINGLE',
    status: 'IN_PROGRESS',
    createTime: '2026-06-03 08:00:00'
  }
];`;

mock = mock.replace(/export const MOCK_PUTAWAY_TASKS = \[[\s\S]*?\];/, putawayBlock);

fs.writeFileSync(mockPath, mock, 'utf8');
console.log('Updated mock:', mockPath);
