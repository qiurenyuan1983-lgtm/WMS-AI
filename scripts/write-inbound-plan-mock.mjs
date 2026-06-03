/**
 * Mock data for OMS inbound plan (get-or-create with groups/items).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const u = (...codes) => codes.map(c => String.fromCharCode(c)).join('');
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'src/mock/data/inbound-plan.ts');

const content = `import { MOCK_WAREHOUSE } from './common';
import { MOCK_CONTAINER_ORDERS } from './oms';

export type MockInboundPlanItem = {
  id: number;
  planId: number;
  cargoOrderId: number;
  shipmentId: number;
  groupCode: string | null;
  preLocation: string | null;
  cargoOrderNo: string | null;
  businessTypeName: string | null;
  platformName: string | null;
  addressType: string | null;
  orderStatus: string | null;
  shipmentNo: string | null;
  poNo: string | null;
  shippingMark: string | null;
  platformWarehouseCode: string | null;
  cartonQty: number | null;
  weight: number | null;
  cbm: number | null;
  palletQty: number | null;
};

const PLAN_BY_CONTAINER: Record<string, {
  planId: number;
  planNo: string;
  items: MockInboundPlanItem[];
}> = {
  '70001': {
    planId: 81001,
    planNo: 'IP-2026-0001',
    items: [
      {
        id: 9101001,
        planId: 81001,
        cargoOrderId: 80001,
        shipmentId: 90001,
        groupCode: 'FedEx-LAX',
        preLocation: 'A-01-01',
        cargoOrderNo: 'CO-2026-0001',
        businessTypeName: '${u(0x6574, 0x9001)}',
        platformName: 'Amazon',
        addressType: 'PLATFORM_WH',
        orderStatus: 'INBOUNDED',
        shipmentNo: 'SHP-001',
        poNo: 'PO-10001',
        shippingMark: 'MK-A01',
        platformWarehouseCode: 'LAX9',
        cartonQty: 80,
        weight: 900,
        cbm: 7.2,
        palletQty: 2
      },
      {
        id: 9101002,
        planId: 81001,
        cargoOrderId: 80001,
        shipmentId: 90002,
        groupCode: 'FedEx-LAX',
        preLocation: 'A-01-02',
        cargoOrderNo: 'CO-2026-0001',
        businessTypeName: '${u(0x6574, 0x9001)}',
        platformName: 'Amazon',
        addressType: 'PLATFORM_WH',
        orderStatus: 'INBOUNDED',
        shipmentNo: 'SHP-002',
        poNo: 'PO-10002',
        shippingMark: 'MK-A02',
        platformWarehouseCode: 'LAX9',
        cartonQty: 40,
        weight: 600,
        cbm: 5.6,
        palletQty: 1
      },
      {
        id: 9101003,
        planId: 81001,
        cargoOrderId: 80001,
        shipmentId: 90003,
        groupCode: 'UPS-ORD',
        preLocation: 'B-02-01',
        cargoOrderNo: 'CO-2026-0001',
        businessTypeName: '${u(0x6574, 0x9001)}',
        platformName: 'Walmart',
        addressType: 'PLATFORM_WH',
        orderStatus: 'INBOUNDED',
        shipmentNo: 'SHP-003',
        poNo: 'PO-10003',
        shippingMark: 'MK-B01',
        platformWarehouseCode: 'ORD2',
        cartonQty: 120,
        weight: 1500,
        cbm: 12.5,
        palletQty: 3
      },
      {
        id: 9101004,
        planId: 81001,
        cargoOrderId: 80001,
        shipmentId: 90004,
        groupCode: 'UPS-ORD',
        preLocation: 'B-02-02',
        cargoOrderNo: 'CO-2026-0001',
        businessTypeName: '${u(0x6574, 0x9001)}',
        platformName: 'Walmart',
        addressType: 'PLATFORM_WH',
        orderStatus: 'INBOUNDED',
        shipmentNo: 'SHP-004',
        poNo: 'PO-10004',
        shippingMark: 'MK-B02',
        platformWarehouseCode: 'ORD2',
        cartonQty: 60,
        weight: 720,
        cbm: 6.1,
        palletQty: 2
      }
    ]
  },
  '70002': {
    planId: 81002,
    planNo: 'IP-2026-0002',
    items: [
      {
        id: 9102001,
        planId: 81002,
        cargoOrderId: 80002,
        shipmentId: 90011,
        groupCode: 'FBA-ONT',
        preLocation: 'C-03-01',
        cargoOrderNo: 'CO-2026-0002',
        businessTypeName: '${u(0x6574, 0x9001)}',
        platformName: 'Amazon',
        addressType: 'PLATFORM_WH',
        orderStatus: 'OUTBOUND_ORDERED',
        shipmentNo: 'SHP-011',
        poNo: 'PO-20001',
        shippingMark: 'MK-C01',
        platformWarehouseCode: 'ONT8',
        cartonQty: 35,
        weight: 420,
        cbm: 3.5,
        palletQty: 1
      },
      {
        id: 9102002,
        planId: 81002,
        cargoOrderId: 80002,
        shipmentId: 90012,
        groupCode: 'FBA-ONT',
        preLocation: 'C-03-02',
        cargoOrderNo: 'CO-2026-0002',
        businessTypeName: '${u(0x6574, 0x9001)}',
        platformName: 'Amazon',
        addressType: 'PLATFORM_WH',
        orderStatus: 'OUTBOUND_ORDERED',
        shipmentNo: 'SHP-012',
        poNo: 'PO-20002',
        shippingMark: 'MK-C02',
        platformWarehouseCode: 'ONT8',
        cartonQty: 25,
        weight: 380,
        cbm: 2.7,
        palletQty: 1
      }
    ]
  }
};

function buildGroups(items: MockInboundPlanItem[]) {
  const map = new Map<string, MockInboundPlanItem[]>();
  for (const item of items) {
    const key = item.groupCode || '__UNGROUPED__';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries()).map(([key, groupItems]) => {
    const groupCode = key === '__UNGROUPED__' ? null : key;
    const totalCartonQty = groupItems.reduce((s, i) => s + (i.cartonQty || 0), 0);
    const totalWeight = groupItems.reduce((s, i) => s + (i.weight || 0), 0);
    const totalCbm = groupItems.reduce((s, i) => s + (i.cbm || 0), 0);
    const expectedPalletQty = groupItems.reduce((s, i) => s + (i.palletQty || 0), 0);
    return {
      groupCode,
      totalCbm,
      totalCartonQty,
      totalWeight,
      itemCount: groupItems.length,
      expectedPalletQty,
      items: groupItems
    };
  });
}

export function getOrCreateInboundPlan(params?: Record<string, any>) {
  const containerOrderId = String(params?.containerOrderId ?? '70001');
  const warehouseId = params?.warehouseId ?? MOCK_WAREHOUSE.id;
  const container =
    MOCK_CONTAINER_ORDERS.find(c => String(c.id) === containerOrderId) ?? MOCK_CONTAINER_ORDERS[0];
  const preset = PLAN_BY_CONTAINER[containerOrderId] ?? PLAN_BY_CONTAINER['70001'];
  const groups = buildGroups(preset.items);
  const totalCartonQty = preset.items.reduce((s, i) => s + (i.cartonQty || 0), 0);
  const totalWeight = preset.items.reduce((s, i) => s + (i.weight || 0), 0);
  const totalCbm = preset.items.reduce((s, i) => s + (i.cbm || 0), 0);

  return {
    id: preset.planId,
    planNo: preset.planNo,
    status: 'draft' as const,
    warehouseId,
    containerOrderId: Number(containerOrderId),
    containerOrderNo: container.containerOrderNo,
    channelName: '${u(0x6574, 0x9001, 0x6e20, 0x9053)}',
    customerName: '${u(0x6f14, 0x793a, 0x5ba2, 0x6237, 0x20, 0x41)}',
    eta: container.eta || '2026-05-28',
    totalCbm,
    totalCartonQty,
    totalWeight,
    remark: null,
    createTime: '2026-06-01 09:00:00',
    updateTime: '2026-06-01 10:00:00',
    groups
  };
}

export const MOCK_CARGO_GROUPING_RULES = [
  {
    id: 82001,
    ruleName: '${u(0x6309, 0x5e73, 0x53f0, 0x4ed3, 0x5206, 0x7ec4)}',
    warehouseId: MOCK_WAREHOUSE.id,
    status: 'enabled',
    isDefault: 1,
    priority: 1
  },
  {
    id: 82002,
    ruleName: '${u(0x4e1a, 0x52a1, 0x7c7b, 0x578b, 0x5206, 0x7ec4)}',
    warehouseId: MOCK_WAREHOUSE.id,
    status: 'enabled',
    isDefault: 0,
    priority: 2
  }
];

export function getCargoGroupingRuleList(params?: Record<string, any>) {
  const wh = params?.warehouseId != null ? String(params.warehouseId) : null;
  let rows = MOCK_CARGO_GROUPING_RULES;
  if (wh) rows = rows.filter(r => String(r.warehouseId) === wh);
  if (params?.status === 'enabled') rows = rows.filter(r => r.status === 'enabled');
  return { rows, total: rows.length, pageNum: 1, pageSize: rows.length || 10 };
}

export function previewAutoGroup(planId: number | string) {
  const preset = Object.values(PLAN_BY_CONTAINER).find(p => p.planId === Number(planId)) ?? PLAN_BY_CONTAINER['70001'];
  return preset.items.map(item => ({
    itemId: item.id,
    cargoOrderNo: item.cargoOrderNo,
    shipmentNo: item.shipmentNo,
    currentGroupCode: item.groupCode,
    proposedGroupCode: item.groupCode?.includes('FedEx') ? 'FedEx-LAX' : item.groupCode,
    changed: false
  }));
}

export function previewApplyRule(planId: number | string, _ruleId: number | string) {
  const preset = Object.values(PLAN_BY_CONTAINER).find(p => p.planId === Number(planId)) ?? PLAN_BY_CONTAINER['70001'];
  return preset.items.map((item, index) => ({
    itemId: item.id,
    cargoOrderNo: item.cargoOrderNo,
    shipmentNo: item.shipmentNo,
    currentGroupCode: item.groupCode,
    proposedGroupCode: index % 2 === 0 ? 'RULE-A' : 'RULE-B',
    changed: item.groupCode !== (index % 2 === 0 ? 'RULE-A' : 'RULE-B')
  }));
}
`;

fs.writeFileSync(out, content, 'utf8');
console.log('wrote', out);
