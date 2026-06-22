import { MOCK_WAREHOUSE } from './common';
import { MOCK_CONTAINER_ORDERS } from './oms';
import { buildCargoOrdersForContainer, buildInboundPlanItemsFromContainer } from './oms-container-cargo';

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

const PLAN_META: Record<string, { planId: number; planNo: string }> = {
  '70001': { planId: 81001, planNo: 'IP-2026-0001' },
  '70002': { planId: 81002, planNo: 'IP-2026-0002' }
};

function resolvePlanPreset(containerOrderId: string) {
  const meta = PLAN_META[containerOrderId] ?? PLAN_META['70001'];
  const items = buildInboundPlanItemsFromContainer(containerOrderId, meta.planId) as MockInboundPlanItem[];
  return { ...meta, items };
}

const PLAN_BY_CONTAINER: Record<string, { planId: number; planNo: string; items: MockInboundPlanItem[] }> = {
  '70001': resolvePlanPreset('70001'),
  '70002': resolvePlanPreset('70002')
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
  const preset = resolvePlanPreset(containerOrderId);
  const cargoOrders = buildCargoOrdersForContainer(containerOrderId);
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
    containerNo: container.containerNo ?? 'C5228-20260602-01',
    channelName: '\u6574\u67dc\u6d77\u8fd0',
    customerName: cargoOrders[0]?.customerName ?? '\u6f14\u793a\u5ba2\u6237',
    eta: container.eta || '2026-05-28',
    totalCbm,
    totalCartonQty,
    totalWeight,
    remark: container.remark ?? null,
    createTime: '2026-06-03 23:09:21',
    updateTime: '2026-06-03 23:09:21',
    mblNo: (container as any).mblNo ?? null,
    containerStatusLabel: containerOrderId === '70002' ? '已到仓' : '待拆柜',
    devanningFinishTime: null,
    expectedDevanningTime: container.eta?.slice(0, 10) || '2026-06-02',
    warehouseName: 'Forest',
    orderLevel: null,
    devanningStatusLabel: containerOrderId === '70002' ? '等待拆柜' : '未到仓',
    queueNo: null,
    dockCode: null,
    driverPhone: null,
    cargoQty: totalCartonQty,
    cargoWeight: totalWeight,
    devanningRoundNo: null,
    attachmentCount: 2,
    attachments: [
      { name: 'DO.pdf', type: 'DO' },
      { name: '装箱单.pdf', type: 'PACKING' }
    ],
    groups
  };
}

export const MOCK_CARGO_GROUPING_RULES = [
  {
    id: 82001,
    ruleName: '按平台仓分组',
    warehouseId: MOCK_WAREHOUSE.id,
    status: 'enabled',
    isDefault: 1,
    priority: 1
  },
  {
    id: 82002,
    ruleName: '业务类型分组',
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
