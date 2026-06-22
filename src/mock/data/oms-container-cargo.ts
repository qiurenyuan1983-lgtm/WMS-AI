import { resolveCargoOperationStatus } from '@/utils/oms/operation-status';
import { MOCK_COMPANY, MOCK_WAREHOUSE } from './common';
import { MOCK_CARGO_ORDERS, MOCK_CONTAINER_ORDERS } from './oms';

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
  actualInboundLocation?: string | null;
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
  /** 下单预报维度：按箱 / 按板 */
  forecastQtyUnit: 'BY_CARTON' | 'BY_PALLET';
  shipments: ShipmentRow[];
};

const CARGO_BY_CONTAINER: Record<string, CargoPreset[]> = {
  '70001': [
    {
      id: 80001,
      cargoOrderNo: 'CO-2026-0001',
      customerName: '演示客户 A',
      fulfillmentStatus: 'INBOUNDED',
      billingStatus: 'UNBILLED',
      addressType: 'PLATFORM_WH',
      platformName: 'Amazon',
      groupCode: 'FedEx-LAX',
      businessTypeName: '整送',
      forecastQtyUnit: 'BY_CARTON',
      shipments: [
        { id: 90001, shipmentNo: 'SHP-001', shippingMark: 'CO-2026-0001', cartonQty: 80, weight: 900, cbm: 7.2, palletQty: 2, poNo: 'PO-10001', groupCode: 'FedEx-LAX', platformWarehouseCode: 'LAX9', platformName: 'Amazon', addressType: 'PLATFORM_WH', preLocation: 'A-01-01', actualInboundLocation: 'A-01-01' },
        { id: 90002, shipmentNo: 'SHP-002', shippingMark: 'CO-2026-0001', cartonQty: 40, weight: 600, cbm: 5.6, palletQty: 1, poNo: 'PO-10002', groupCode: 'FedEx-LAX', platformWarehouseCode: 'LAX9', platformName: 'Amazon', addressType: 'PLATFORM_WH', preLocation: 'A-01-02', actualInboundLocation: 'A-01-02' },
        { id: 90003, shipmentNo: 'SHP-003', shippingMark: 'CO-2026-0001', cartonQty: 120, weight: 1500, cbm: 12.5, palletQty: 3, poNo: 'PO-10003', groupCode: 'UPS-ORD', platformWarehouseCode: 'ORD2', platformName: 'Walmart', addressType: 'PLATFORM_WH', preLocation: 'B-02-01', actualInboundLocation: 'B-02-05' },
        { id: 90004, shipmentNo: 'SHP-004', shippingMark: 'CO-2026-0001', cartonQty: 60, weight: 720, cbm: 6.1, palletQty: 2, poNo: 'PO-10004', groupCode: 'UPS-ORD', platformWarehouseCode: 'ORD2', platformName: 'Walmart', addressType: 'PLATFORM_WH', preLocation: 'B-02-02', actualInboundLocation: 'B-02-02' }
      ]
    },
    {
      id: 80003,
      cargoOrderNo: 'CO-2026-0003',
      customerName: '演示客户 A',
      fulfillmentStatus: 'INBOUNDED',
      billingStatus: 'UNBILLED',
      addressType: 'PLATFORM_WH',
      platformName: 'Walmart',
      groupCode: 'UPS-ORD',
      businessTypeName: '整送',
      forecastQtyUnit: 'BY_PALLET',
      shipments: [
        { id: 90005, shipmentNo: 'SHP-005', shippingMark: 'CO-2026-0003', cartonQty: 60, weight: 700, cbm: 6, palletQty: 3, poNo: 'PO-10005', groupCode: 'UPS-ORD', platformWarehouseCode: 'ORD2', platformName: 'Walmart', addressType: 'PLATFORM_WH', preLocation: 'B-02-03', actualInboundLocation: 'B-02-03' }
      ]
    }
  ],
  '70002': [
    {
      id: 80002,
      cargoOrderNo: 'CO-2026-0002',
      customerName: '演示客户 B',
      fulfillmentStatus: 'ARRIVED_WAREHOUSE',
      billingStatus: 'UNBILLED',
      addressType: 'PLATFORM_WH',
      platformName: 'Amazon',
      groupCode: 'FBA-ONT',
      businessTypeName: '整送',
      forecastQtyUnit: 'BY_CARTON',
      shipments: [
        { id: 90011, shipmentNo: 'SHP-011', shippingMark: 'CO-2026-0002', cartonQty: 35, weight: 420, cbm: 3.5, palletQty: 1, poNo: 'PO-20001', groupCode: 'FBA-ONT', platformWarehouseCode: 'ONT8', platformName: 'Amazon', addressType: 'PLATFORM_WH', preLocation: 'C-03-01', actualInboundLocation: 'C-03-01' },
        { id: 90012, shipmentNo: 'SHP-012', shippingMark: 'CO-2026-0002', cartonQty: 25, weight: 380, cbm: 2.7, palletQty: 1, poNo: 'PO-20002', groupCode: 'FBA-ONT', platformWarehouseCode: 'ONT8', platformName: 'Amazon', addressType: 'PLATFORM_WH', preLocation: 'C-03-02', actualInboundLocation: 'C-03-02' }
      ]
    }
  ]
};

function sumShipments(shipments: ShipmentRow[], field: 'cartonQty' | 'weight' | 'cbm' | 'palletQty') {
  return shipments.reduce((s, row) => s + (row[field] || 0), 0);
}

function joinUnique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter(Boolean) as string[])].join(', ');
}

function mapListCargoToDetail(row: (typeof MOCK_CARGO_ORDERS)[number]) {
  const r = row as Record<string, any>;
  return {
    ...row,
    preOutboundStatus: r.preOutboundStatus ?? 'NONE',
    exceptionFlag: r.exceptionFlag ?? 0,
    exceptionCount: r.exceptionCount ?? 0,
    holdFlag: r.holdFlag ?? 0,
    holdStatus: r.holdStatus ?? 'NORMAL',
    transferFlag: r.transferFlag ?? 0,
    shipments: r.shipments ?? []
  };
}

export function buildCargoOrdersForContainer(containerOrderId: string | number) {
  const cid = String(containerOrderId);
  const container = MOCK_CONTAINER_ORDERS.find(c => String(c.id) === cid) ?? MOCK_CONTAINER_ORDERS[0];
  const fromList = MOCK_CARGO_ORDERS.filter(c => String(c.containerOrderId) === cid);
  if (fromList.length > 0) {
    return fromList.map(mapListCargoToDetail);
  }

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
    const shipmentCodes = preset.shipments
      .map(s => {
        const fba = s.shipmentNo;
        const sku = (s as { skuSummary?: string }).skuSummary || `SKU-${s.poNo}`;
        return `${fba} / ${sku}`;
      })
      .join('; ');
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
      customerServiceName: '小王',
      businessTypeName: preset.businessTypeName,
      forecastQtyUnit: preset.forecastQtyUnit || 'BY_CARTON',
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
      preLocation: joinUnique(preset.shipments.map(s => s.preLocation)),
      actualInboundLocation: joinUnique(preset.shipments.map(s => s.actualInboundLocation)) || null,
      actualInboundTime: preset.fulfillmentStatus === 'INBOUNDED' || preset.fulfillmentStatus === 'OUTBOUND_ORDERED'
        ? '2026-05-26 10:30:00'
        : null,
      remark: null,
      shipments
    };
  });
}

/** 入库计划明细转展为入库计划行 */
export function buildInboundPlanItemsFromContainer(containerOrderId: string | number, planId: number) {
  const cargoOrders = buildCargoOrdersForContainer(containerOrderId);
  const items: any[] = [];
  let seq = planId * 1000 + 1;
  for (const co of cargoOrders) {
    for (const sh of co.shipments || []) {
      const shRow = sh as Record<string, any>;
      items.push({
        id: seq++,
        planId,
        cargoOrderId: co.id,
        shipmentId: sh.id,
        groupCode: shRow.groupCode ?? co.groupCode,
        preLocation: shRow.preLocation ?? co.preLocation ?? null,
        cargoOrderNo: co.cargoOrderNo,
        businessTypeName: co.businessTypeName ?? '整送',
        platformName: shRow.platformName ?? co.platformName,
        addressType: shRow.addressType ?? co.addressType,
        orderStatus: co.fulfillmentStatus,
        shipmentNo: sh.shipmentNo,
        poNo: sh.poNo ?? shRow.poNo,
        shippingMark: sh.shippingMark,
        platformWarehouseCode: shRow.platformWarehouseCode ?? co.platformWarehouseCode ?? null,
        cartonQty: sh.cartonQty,
        weight: sh.weight,
        cbm: sh.cbm,
        palletQty: sh.palletQty,
        outboundStatus: 'NOT_OUTBOUND',
        deliveryMethod: co.businessTypeName ?? 'LTL',
        holdFlag: null
      });
    }
  }
  return items;
}

export function getCargoOrderDetail(id: string | number) {
  const fromList = MOCK_CARGO_ORDERS.find(c => String(c.id) === String(id));
  if (fromList) {
    const row = mapListCargoToDetail(fromList) as Record<string, any>;
    return {
      ...row,
      orderSubType: row.orderSubType ?? 'STANDARD',
      peerCustomerName: row.peerCustomerName ?? null,
      deliveryMode: row.deliveryMode ?? null,
      deliveryAppointmentTime: row.deliveryAppointmentTime ?? null,
      loosePalletLabels: row.loosePalletLabels ?? [],
      palletLabelPrinted: row.palletLabelPrinted ?? false,
      orderStatus: row.orderStatus ?? row.fulfillmentStatus,
      preOutboundStatus: row.preOutboundStatus ?? 'NONE',
      outboundOrderStatus: row.outboundOrderStatus ?? 'NONE',
      appointmentStatus: row.appointmentStatus ?? 'NONE',
      podStatus: row.podStatus ?? 'PENDING',
      billingStatus: row.billingStatus ?? 'UNBILLED',
      exceptionFlag: row.exceptionFlag ?? 0,
      exceptionCount: row.exceptionCount ?? 0,
      nodeTraces: row.nodeTraces ?? [],
      shipments: row.shipments ?? [],
      operationStatus: resolveCargoOperationStatus(row)
    };
  }
  for (const container of MOCK_CONTAINER_ORDERS) {
    const found = buildCargoOrdersForContainer(container.id).find(c => String(c.id) === String(id));
    if (found) return found;
  }
  return null;
}

export function getContainerOrderDetail(id: string | number) {
  const cid = String(id);
  const row = MOCK_CONTAINER_ORDERS.find(c => String(c.id) === cid);
  if (!row) return null;
  const cargoOrders = buildCargoOrdersForContainer(cid);
  const r = row as Record<string, any>;
  const containerStatus = r.containerStatus ?? r.status ?? 'ARRIVED_WAREHOUSE';

  return {
    ...row,
    ...base,
    containerStatus,
    channelName: r.channelName ?? '\u6574\u67dc\u6d77\u8fd0',
    channelId: r.channelId ?? 1,
    customerName: r.customerName ?? cargoOrders[0]?.customerName ?? '\u6f14\u793a\u5ba2\u6237',
    customerServiceName: r.customerServiceName ?? '\u5c0f\u738b',
    ownerUserName: r.ownerUserName ?? '\u5c0f\u738b',
    orderSource: r.orderSource ?? 'SELF',
    terminalReleaseStatus: r.terminalReleaseStatus ?? 'RELEASE',
    examStatus: r.examStatus ?? 'NONE',
    attachmentCount: r.attachmentCount ?? 2,
    doAttachmentCount: r.doAttachmentCount ?? 1,
    containerExceptionFlag: r.containerExceptionFlag ?? 0,
    containerExceptionCount: r.containerExceptionCount ?? 0,
    downstreamExceptionFlag: r.downstreamExceptionFlag ?? 0,
    downstreamExceptionCount: r.downstreamExceptionCount ?? 0,
    cargoOrders,
    traces: [
      { id: 1, action: 'CREATE', actionDesc: '创建海柜订单', statusFrom: 'DRAFT', statusTo: 'PENDING_ACCEPT', operatorName: 'admin', createTime: '2026-05-01 10:00:00' },
      { id: 2, action: 'ARRIVE', actionDesc: '已到港', statusFrom: 'IN_TRANSIT', statusTo: 'ARRIVED_PORT', operatorName: 'admin', createTime: '2026-05-18 08:00:00' },
      { id: 3, action: 'WAREHOUSE', actionDesc: '已到仓', statusFrom: 'PICKED_UP', statusTo: containerStatus, operatorName: 'admin', createTime: '2026-05-25 15:00:00' }
    ]
  };
}
