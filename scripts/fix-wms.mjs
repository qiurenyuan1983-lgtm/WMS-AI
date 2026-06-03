import fs from 'fs';

const p = 'src/mock/data/wms.ts';
let c = fs.readFileSync(p, 'utf8');

const rep = (from, to) => {
  c = c.split(from).join(to);
};

// zones
c = c.replace(
  /export const MOCK_WMS_ZONES = \[[\s\S]*?\];/,
  `export const MOCK_WMS_ZONES = [
  { id: 60001, ...base, zoneName: 'FedEx\u533a', storageMethod: 'FLOOR', zoneType: 'EXPRESS', allowMixedStorage: 1, maxMixedQty: 50, status: 'ENABLED', remark: '\u5feb\u9012\u5730\u9762\u6682\u5b58\u533a' },
  { id: 60002, ...base, zoneName: 'A\u533a', storageMethod: 'RACK', zoneType: 'PRIVATE', allowMixedStorage: 0, maxMixedQty: null, status: 'ENABLED', remark: null },
  { id: 60003, ...base, zoneName: '\u5f02\u5e38\u6682\u5b58\u533a', storageMethod: 'FLOOR', zoneType: 'EXCEPTION', allowMixedStorage: 1, maxMixedQty: 20, status: 'ENABLED', remark: '\u5f02\u5e38\u8d27\u7269\u6682\u5b58' }
];`
);

c = c.replace(
  /export const MOCK_WMS_LOCATIONS = \[[\s\S]*?\];/,
  `export const MOCK_WMS_LOCATIONS = [
  { id: 60101, ...base, zoneId: 60001, zoneName: 'FedEx\u533a', locationCode: 'A-01-01', rowNo: '01', columnNo: '01', capacity: 100, currentQty: 45, remainingCapacity: 55, status: 'NORMAL', remark: null },
  { id: 60102, ...base, zoneId: 60001, zoneName: 'FedEx\u533a', locationCode: 'A-01-02', rowNo: '01', columnNo: '02', capacity: 100, currentQty: 80, remainingCapacity: 20, status: 'NORMAL', remark: null },
  { id: 60103, ...base, zoneId: 60002, zoneName: 'A\u533a', locationCode: 'B-02-01', rowNo: '02', columnNo: '01', capacity: 50, currentQty: 0, remainingCapacity: 50, status: 'NORMAL', remark: null }
];`
);

c = c.replace(
  /export const MOCK_WMS_INVENTORY = \[[\s\S]*?\];/,
  `export const MOCK_WMS_INVENTORY = [
  { id: 60201, ...base, customerId: 70001, customerName: '\u6f14\u793a\u5ba2\u6237 A', cargoOrderId: 80001, cargoOrderNo: 'CO-2026-0001', shipmentId: 90001, shipmentCode: 'SHP-001', totalBoxQty: 120, availableBoxQty: 80, lockedBoxQty: 40, exceptionBoxQty: 0, totalWeight: 1500.5, totalCbm: 12.8, inventoryStatus: 'IN_STOCK', firstInboundTime: '2026-05-10 08:00:00', lastInboundTime: '2026-05-15 14:30:00', lastTransactionTime: '2026-05-20 09:00:00', version: 1, remark: null },
  { id: 60202, ...base, customerId: 70002, customerName: '\u6f14\u793a\u5ba2\u6237 B', cargoOrderId: 80002, cargoOrderNo: 'CO-2026-0002', shipmentId: 90002, shipmentCode: 'SHP-002', totalBoxQty: 60, availableBoxQty: 60, lockedBoxQty: 0, exceptionBoxQty: 5, totalWeight: 800, totalCbm: 6.2, inventoryStatus: 'PARTIAL_OUT', firstInboundTime: '2026-05-12 10:00:00', lastInboundTime: '2026-05-18 16:00:00', lastTransactionTime: '2026-05-22 11:00:00', version: 2, remark: '\u90e8\u5206\u7bb1\u91cf\u5f02\u5e38' }
];`
);

c = c.replace(
  /export const MOCK_WMS_PALLETS = \[[\s\S]*?\];/,
  `export const MOCK_WMS_PALLETS = [
  { id: 60301, ...base, palletNo: 'PLT-2026-0001', palletType: 'NORMAL', palletStatus: 'IN_STOCK', locationId: 60101, locationCode: 'A-01-01', zoneId: 60001, zoneName: 'FedEx\u533a', boxQty: 40, weight: 500, cbm: 4.2, cargoOrderNo: 'CO-2026-0001', remark: null },
  { id: 60302, ...base, palletNo: 'PLT-2026-0002', palletType: 'NORMAL', palletStatus: 'PRE_OUTBOUND', locationId: 60102, locationCode: 'A-01-02', zoneId: 60001, zoneName: 'FedEx\u533a', boxQty: 35, weight: 420, cbm: 3.5, cargoOrderNo: 'CO-2026-0001', remark: '\u5df2\u5206\u914d\u5f85\u51fa\u5e93' }
];`
);

// devanning orders - replace string fields on each order
const devanningStrings = [
  { id: 60401, remark: '\u53c9\u8f66\u62c6\u67dc\u8fdb\u884c\u4e2d', customer: 'A', channel: '\u6574\u67dc\u6d77\u8fd0', cs: '\u5f20\u5ba2\u670d' },
  { id: 60402, remark: null, customer: 'B', channel: 'FCL', cs: '\u5f20\u5ba2\u670d' },
  { id: 60403, remark: null, customer: 'C', channel: 'FCL', cs: '\u5f20\u5ba2\u670d' },
  { id: 60404, remark: '\u5f85\u5b89\u6392\u63d0\u67dc', customer: 'D', channel: '\u6574\u67dc\u6d77\u8fd0', cs: '\u5f20\u5ba2\u670d' },
  { id: 60405, remark: '\u62c6\u67dc\u5df2\u5b8c\u6210', customer: 'A', channel: 'FCL', cs: '\u5f20\u5ba2\u670d' },
  { id: 60406, remark: '\u62c6\u67dc\u8fc7\u7a0b\u6709\u5f02\u5e38', customer: 'B', channel: '\u6574\u67dc\u6d77\u8fd0', cs: '\u5f20\u5ba2\u670d' },
  { id: 60407, remark: '\u5ba2\u6237\u53d6\u6d88\u8ba2\u5355', customer: 'C', channel: 'FCL', cs: '\u5f20\u5ba2\u670d' }
];

for (const o of devanningStrings) {
  const blockRe = new RegExp(`(\\{[\\s\\S]*?id: ${o.id},[\\s\\S]*?customerName: ')[^']*(')`);
  c = c.replace(blockRe, `$1\u6f14\u793a\u5ba2\u6237 ${o.customer}$2`);
  if (o.channel !== 'FCL') {
    const chRe = new RegExp(`(id: ${o.id},[\\s\\S]*?channelName: ')[^']*(')`);
    c = c.replace(chRe, `$1${o.channel}$2`);
  }
  const csRe = new RegExp(`(id: ${o.id},[\\s\\S]*?customerServiceName: ')[^']*(')`);
  c = c.replace(csRe, `$1${o.cs}$2`);
  if (o.remark) {
    const rmRe = new RegExp(`(id: ${o.id},[\\s\\S]*?remark: ')[^']*(')`);
    c = c.replace(rmRe, `$1${o.remark}$2`);
  }
}

c = c.replace(
  /\/\*\* Mock[^*]+\*\//,
  '/** Mock \u5185\u5b58\u62c6\u67dc\u5355\u72b6\u6001\u6d41\u8f6c\uff08\u539f\u578b\u6f14\u793a\u7528\uff09 */'
);

fs.writeFileSync(p, c, 'utf8');
console.log('wms.ts rewritten');

const sample = fs.readFileSync(p, 'utf8');
console.log(sample.match(/zoneName: '[^']+'/)?.[0]);
console.log(sample.match(/customerName: '[^']+'/)?.[0]);
