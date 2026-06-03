/**
 * Shared mock: container-linked cargo orders + shipments (used by container detail, inbound plan, devanning).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const u = (...codes) => codes.map(c => String.fromCharCode(c)).join('');
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'src/mock/data/oms-container-cargo.ts');

const content = `import { MOCK_COMPANY, MOCK_WAREHOUSE } from './common';
import { MOCK_CONTAINER_ORDERS } from './oms';

const base = {
  tenantId: '000000',
  companyId: MOCK_COMPANY.id,
  warehouseId: MOCK_WAREHOUSE.id,
  warehouseCode: MOCK_WAREHOUSE.warehouseCode,
  warehouseName: MOCK_WAREHOUSE.warehouseName,
  createTime: '2026-06-01 10:00:00',
  updateTime: '2026-06-01 11:00:00'
};

type ShipmentRow = {
  id: number;
  shipmentNo: string;
  shippingMark: string;
  cartonQty: number;
  weight: number;
  cbm: number;
  palletQty: number;
  poNo: string;
  groupCode: string;
  platformWarehouseCode: string;
  platformName: string;
  addressType: string;
  preLocation: string;
};

type CargoPreset = {
  id: number;
  cargoOrderNo: string;
  customerName: string;
  fulfillmentStatus: string;
  billingStatus: string;
  addressType: string;
  platformName: string;
  groupCode: string;
  businessTypeName: string;
  shipments: ShipmentRow[];
};

const CARGO_BY_CONTAINER: Record<string, CargoPreset[]> = {
  '70001': [
    {
      id: 80001,
      cargoOrderNo: 'CO-2026-0001',
      customerName: '${u(0x6f14, 0x793a, 0x5ba2, 0x6237, 0x20, 0x41)}',
      fulfillmentStatus: 'INBOUNDED',
      billingStatus: 'UNBILLED',
      addressType: 'PLATFORM_WH',
      platformName: 'Amazon',
      groupCode: 'FedEx-LAX',
      businessTypeName: '${u(0x6574, 0x9001)}',
      shipments: [
        { id: 90001, shipmentNo: 'SHP-001', shippingMark: 'MK-A01', cartonQty: 80, weight: 900, cbm: 7.2, palletQty: 2, poNo: 'PO-10001', groupCode: 'FedEx-LAX', platformWarehouseCode: 'LAX9', platformName: 'Amazon', addressType: 'PLATFORM_WH', preLocation: 'A-01-01' },
        { id: 90002, shipmentNo: 'SHP-002', shippingMark: 'MK-A02', cartonQty: 40, weight: 600, cbm: 5.6, palletQty: 1, poNo: 'PO-10002', groupCode: 'FedEx-LAX', platformWarehouseCode: 'LAX9', platformName: 'Amazon', addressType: 'PLATFORM_WH', preLocation: 'A-01-02' },
        { id: 90003, shipmentNo: 'SHP-003', shippingMark: 'MK-B01', cartonQty: 120, weight: 1500, cbm: 12.5, palletQty: 3, poNo: 'PO-10003', groupCode: 'UPS-ORD', platformWarehouseCode: 'ORD2', platformName: 'Walmart', addressType: 'PLATFORM_WH', preLocation: 'B-02-01' },
        { id: 90004, shipmentNo: 'SHP-004', shippingMark: 'MK-B02', cartonQty: 60, weight: 720, cbm: 6.1, palletQty: 2, poNo: 'PO-10004', groupCode: 'UPS-ORD', platformWarehouseCode: 'ORD2', platformName: 'Walmart', addressType: 'PLATFORM_WH', preLocation: 'B-02-02' }
      ]
    }
  ],
  '70002': [
    {
      id: 80002,
      cargoOrderNo: 'CO-2026-0002',
      customerName: '${u(0x6f14, 0x793a, 0x5ba2, 0x6237, 0x20, 0x42)}',
      fulfillmentStatus: 'OUTBOUND_ORDERED',
      billingStatus: 'BILLED',
      addressType: 'PLATFORM_WH',
      platformName: 'Amazon',
      groupCode: 'FBA-ONT',
      businessTypeName: '${u(0x6574, 0x9001)}',
      shipments: [
        { id: 90011, shipmentNo: 'SHP-011', shippingMark: 'MK-C01', cartonQty: 35, weight: 420, cbm: 3.5, palletQty: 1, poNo: 'PO-20001', groupCode: 'FBA-ONT', platformWarehouseCode: 'ONT8', platformName: 'Amazon', addressType: 'PLATFORM_WH', preLocation: 'C-03-01' },
        { id: 90012, shipmentNo: 'SHP-012', shippingMark: 'MK-C02', cartonQty: 25, weight: 380, cbm: 2.7, palletQty: 1, poNo: 'PO-20002', groupCode: 'FBA-ONT', platformWarehouseCode: 'ONT8', platformName: 'Amazon', addressType: 'PLATFORM_WH', preLocation: 'C-03-02' }
      ]
    }
  ]
};

function sumShipments(shipments: ShipmentRow[], field: 'cartonQty' | 'weight' | 'cbm' | 'palletQty') {
  return shipments.reduce((s, row) => s + (row[field] || 0), 0);
}

export function buildCargoOrdersForContainer(containerOrderId: string | number) {
  const cid = String(containerOrderId);
  const container = MOCK_CONTAINER_ORDERS.find(c => String(c.id) === cid) ?? MOCK_CONTAINER_ORDERS[0];
  const presets = CARGO_BY_CONTAINER[cid] ?? CARGO_BY_CONTAINER['70001'];

  return presets.map(preset => {
    const shipments = preset.shipments.map(s => ({
      id: s.id,
      cargoOrderId: preset.id,
      shipmentNo: s.shipmentNo,
      shippingMark: s.shippingMark,
      cartonQty: s.cartonQty,
      weight: s.weight,
      cbm: s.cbm,
      palletQty: s.palletQty,
      poNo: s.poNo
    }));
    const shipmentCodes = preset.shipments.map(s => s.shipmentNo).join(', ');
    const poNos = preset.shipments.map(s => s.poNo).join(', ');
    const marks = preset.shipments.map(s => s.shippingMark).join(', ');

    return {
      ...base,
      id: preset.id,
      bizRootId: preset.id,
      containerOrderId: Number(cid),
      containerOrderNo: container.containerOrderNo,
      containerNo: container.containerNo,
      cargoOrderNo: preset.cargoOrderNo,
      externalOrderNo: null,
      customerId: 70001,
      customerName: preset.customerName,
      channelId: null,
      businessTypeId: 1,
      platformCode: 'AMZ',
      platformName: preset.platformName,
      addressType: preset.addressType,
      warehouseCode: MOCK_WAREHOUSE.warehouseCode,
      platformWarehouseCode: preset.shipments[0]?.platformWarehouseCode ?? null,
      groupCode: preset.groupCode,
      inboundWarehouseName: MOCK_WAREHOUSE.warehouseName,
      customerServiceName: '${u(0x5c0f, 0x738b)}',
      fulfillmentStatus: preset.fulfillmentStatus,
      billingStatus: preset.billingStatus,
      preOutboundStatus: 'NONE',
      exceptionFlag: 0,
      exceptionCount: 0,
      holdFlag: 0,
      holdStatus: 'NORMAL',
      transferFlag: 0,
      shipmentCodes,
      poNos,
      marks,
      expectedBoxQty: sumShipments(preset.shipments, 'cartonQty'),
      expectedPalletQty: sumShipments(preset.shipments, 'palletQty'),
      expectedWeight: sumShipments(preset.shipments, 'weight'),
      expectedCbm: sumShipments(preset.shipments, 'cbm'),
      remark: null,
      shipments
    };
  });
}

/** ${u(0x5165, 0x5e93, 0x8ba1, 0x5212, 0x660e, 0x7ec6, 0x8f6c, 0x5c55, 0x4e3a, 0x5165, 0x5e93, 0x8ba1, 0x5212, 0x884c)} */
export function buildInboundPlanItemsFromContainer(containerOrderId: string | number, planId: number) {
  const cargoOrders = buildCargoOrdersForContainer(containerOrderId);
  const items: any[] = [];
  let seq = planId * 1000 + 1;
  for (const co of cargoOrders) {
    for (const sh of co.shipments || []) {
      const preset = (CARGO_BY_CONTAINER[String(containerOrderId)] ?? CARGO_BY_CONTAINER['70001'])
        .flatMap(p => p.shipments)
        .find(s => s.id === sh.id);
      items.push({
        id: seq++,
        planId,
        cargoOrderId: co.id,
        shipmentId: sh.id,
        groupCode: preset?.groupCode ?? co.groupCode,
        preLocation: preset?.preLocation ?? null,
        cargoOrderNo: co.cargoOrderNo,
        businessTypeName: co.businessTypeName ?? '${u(0x6574, 0x9001)}',
        platformName: preset?.platformName ?? co.platformName,
        addressType: preset?.addressType ?? co.addressType,
        orderStatus: co.fulfillmentStatus,
        shipmentNo: sh.shipmentNo,
        poNo: sh.poNo,
        shippingMark: sh.shippingMark,
        platformWarehouseCode: preset?.platformWarehouseCode ?? null,
        cartonQty: sh.cartonQty,
        weight: sh.weight,
        cbm: sh.cbm,
        palletQty: sh.palletQty
      });
    }
  }
  return items;
}

const CONTAINER_STATUS_MAP: Record<string, string> = {
  '70001': 'DEVANNING',
  '70002': 'ARRIVED_WAREHOUSE'
};

export function getContainerOrderDetail(id: string | number) {
  const cid = String(id);
  const row = MOCK_CONTAINER_ORDERS.find(c => String(c.id) === cid);
  if (!row) return null;
  const cargoOrders = buildCargoOrdersForContainer(cid);
  const containerStatus = CONTAINER_STATUS_MAP[cid] || (row as any).status || 'ARRIVED_WAREHOUSE';

  return {
    ...row,
    ...base,
    containerStatus,
    channelName: '${u(0x6574, 0x67dc, 0x6d77, 0x8fd0)}',
    channelId: 1,
    customerName: cargoOrders[0]?.customerName ?? '${u(0x6f14, 0x793a, 0x5ba2, 0x6237)}',
    customerServiceName: '${u(0x5c0f, 0x738b)}',
    ownerUserName: '${u(0x5c0f, 0x738b)}',
    orderSource: 'SELF',
    attachmentCount: 2,
    doAttachmentCount: 1,
    containerExceptionFlag: 0,
    containerExceptionCount: 0,
    downstreamExceptionFlag: 0,
    downstreamExceptionCount: 0,
    cargoOrders,
    traces: [
      { id: 1, action: 'CREATE', actionDesc: '${u(0x521b, 0x5efa, 0x6d77, 0x67dc, 0x8ba2, 0x5355)}', statusFrom: 'DRAFT', statusTo: 'PENDING_ACCEPT', operatorName: 'admin', createTime: '2026-05-01 10:00:00' },
      { id: 2, action: 'ARRIVE', actionDesc: '${u(0x5df2, 0x5230, 0x6e2f)}', statusFrom: 'IN_TRANSIT', statusTo: 'ARRIVED_PORT', operatorName: 'admin', createTime: '2026-05-18 08:00:00' },
      { id: 3, action: 'WAREHOUSE', actionDesc: '${u(0x5df2, 0x5230, 0x4ed3)}', statusFrom: 'PICKED_UP', statusTo: containerStatus, operatorName: 'admin', createTime: '2026-05-25 15:00:00' }
    ]
  };
}
`;

fs.writeFileSync(out, content, 'utf8');
console.log('wrote', out);
