import { MOCK_COMPANY, MOCK_WAREHOUSE, MOCK_WAREHOUSE_OPTIONS } from './common';

const base = {
  tenantId: '000000',
  companyId: MOCK_COMPANY.id,
  warehouseId: MOCK_WAREHOUSE.id,
  warehouseCode: MOCK_WAREHOUSE.warehouseCode,
  warehouseName: MOCK_WAREHOUSE.warehouseName,
  createTime: '2026-05-01 10:00:00',
  updateTime: '2026-06-01 11:00:00'
};

const CUSTOMERS = [
  'Anker Innovations',
  'SHEIN',
  'LuckyImport LLC',
  'ABC Trading Co.',
  'PopMart US',
  'Robotime Corp',
  'Forest Zhang',
  'Pacific Goods Inc',
  'Golden Bridge LLC',
  'Nova Retail Group'
];

const CHANNELS = ['整柜海运', '拼柜海运', '空运转海运', '客户自报'];
const BUSINESS_TYPES = ['整送', '拆送', '中转', '仓储'];
const SHIPPING_LINES = ['MSC', 'OOCL', 'COSCO', 'EVERGREEN', 'HMM', 'ONE', 'CMA CGM', 'Yang Ming'];
const VESSELS = ['MSC OSCAR', 'OOCL TOKYO', 'COSCO SHIPPING', 'EVER GOLDEN', 'HMM ALGECIRAS', 'ONE STORK'];
const CONTAINER_TYPES = ['40HQ', '40GP', '20GP', '45HQ'];
const PORTS = ['Los Angeles', 'Long Beach', 'Oakland', 'Seattle', 'New York'];
const TERMINALS = ['LBCT', 'Trapac', 'APMT Los Angeles', 'Fenix Marine', 'SSA Marine'];
const DRAYAGE_VENDORS = ['ABC Trucking', 'Pacific Haul', 'FastLine Logistics', 'Harbor Drayage', 'West Coast Transport'];
const ORDER_SOURCES = ['SELF', 'API', 'PORTAL', 'IMPORT'];
const TIMELINESS_LEVELS = ['T', 'K', 'NORMAL_SHIP'] as const;
const DEVANNING_METHODS = ['FORKLIFT', 'MANUAL', 'CRANE'];
const LOADING_TYPES = ['PALLET', 'FLOOR', 'MIXED'];
const EXAM_TYPES = ['NONE', 'XRAY', 'INTENSIVE', 'DOCUMENT'];
const EMPTY_RETURN_LOCATIONS = ['LBCT Empty Yard', 'Trapac Return', 'APM Empty Depot', 'Fenix Return Gate'];

const CONTAINER_STATUSES = [
  'PENDING_ACCEPT',
  'IN_TRANSIT',
  'ARRIVED_PORT',
  'HOLDING',
  'EXAMINING',
  'AVAILABLE_FOR_PICKUP',
  'PICKUP_APPOINTED',
  'PICKED_UP',
  'ARRIVED_WAREHOUSE',
  'DEVANNING',
  'DEVANNED',
  'EMPTY_RETURNED',
  'COMPLETED'
];

const TERMINAL_RELEASE_STATUSES = ['NONE', 'HOLD', 'RELEASE'];
const EXAM_STATUSES = ['NONE', 'EXAMINING', 'EXAMINED'];

const PLATFORMS = ['Amazon', 'Walmart', 'SHEIN', 'Target', 'Wayfair', 'Local'];
const ADDRESS_TYPES = ['PLATFORM_WH', 'COMMERCIAL', 'RESIDENTIAL', 'FBA'];
const PLATFORM_WAREHOUSES = ['ONT8', 'LAX9', 'LGB8', 'SMF3', 'ORD2', 'DFW6', 'ATL2', 'SBD1'];
const GROUP_CODES = ['FedEx-LAX', 'UPS-ORD', 'FBA-ONT', 'LTL-DAL', 'AMZ-SMF', 'WMT-LAX'];
const PARCEL_CARRIERS = ['UPS', 'FedEx', 'USPS', 'DHL'];
const FULFILLMENT_STATUSES = [
  'IN_TRANSIT',
  'ARRIVED_PORT',
  'PICKED_UP',
  'ARRIVED_WAREHOUSE',
  'DEVANNING',
  'DEVANNED',
  'INBOUNDED',
  'OUTBOUND_ORDERED',
  'DELIVERY_APPOINTED',
  'OUTBOUNDED',
  'DELIVERING',
  'DELIVERED',
  'POD_UPLOADED',
  'BILLED',
  'COMPLETED'
];
const BILLING_STATUSES = ['UNBILLED', 'BILLED', 'VOIDED'];
const PRE_OUTBOUND_STATUSES = ['NONE', 'PRE_CREATED', 'CONVERTED', 'CANCELLED'];
const OUTBOUND_ORDER_STATUSES = ['NONE', 'CREATED', 'CANCELLED'];
const APPOINTMENT_STATUSES = ['NONE', 'APPOINTED'];
const POD_STATUSES = ['PENDING', 'UPLOADED', 'EXCEPTION'];
const HOLD_STATUSES = ['NORMAL', 'HOLDING', 'RELEASED'];
const HOLD_TYPES = ['CUSTOMS', 'BILLING', 'QUALITY', 'OPERATION'];

function pick<T>(arr: T[], index: number): T {
  return arr[index % arr.length];
}

function padNum(n: number, len = 4) {
  return String(n).padStart(len, '0');
}

function dateStr(year: number, month: number, day: number, hour = 10, minute = 0) {
  return `${year}-${padNum(month, 2)}-${padNum(day, 2)} ${padNum(hour, 2)}:${padNum(minute, 2)}:00`;
}

function dateOnly(year: number, month: number, day: number) {
  return `${year}-${padNum(month, 2)}-${padNum(day, 2)}`;
}

function isoContainerNo(index: number) {
  const prefixes = ['MSCU', 'OOLU', 'COSU', 'EGLV', 'HDMU', 'ONEY'];
  const prefix = pick(prefixes, index);
  const suffix = padNum(1000000 + index * 137, 7);
  return `${prefix}${suffix}`;
}

function buildShipments(cargoId: number, index: number, cargoOrderNo: string) {
  const shipmentId = cargoId * 10 + 1;
  const cartonQty = 40 + (index % 12) * 10;
  const palletQty = 1 + (index % 5);
  const weight = cartonQty * 12 + index * 3;
  const cbm = Number((cartonQty * 0.08 + index * 0.1).toFixed(2));
  const platform = pick(PLATFORMS, index);
  const shipmentNo =
    platform === 'Amazon' ? `FBA18${padNum(100000 + index, 6)}` : `SHP-${padNum(index + 1)}`;
  const poNo = `PO-${20260000 + index}`;
  const mark = cargoOrderNo;
  const wh = pick(PLATFORM_WAREHOUSES, index);
  const group = pick(GROUP_CODES, index);

  return [
    {
      id: shipmentId,
      cargoOrderId: cargoId,
      shipmentNo,
      shippingMark: mark,
      cartonQty,
      palletQty,
      weight,
      cbm,
      poNo,
      shipmentCode: shipmentNo,
      mark,
      skuSummary: `SKU-BUNDLE-${index + 1}`,
      expectedQty: cartonQty,
      expectedBoxQty: cartonQty,
      expectedWeight: weight,
      expectedCbm: cbm,
      dwTime: dateStr(2026, 5, 10 + (index % 20), 9 + (index % 8)),
      remark: `货件备注 ${index + 1}`,
      groupCode: group,
      platformWarehouseCode: wh,
      platformName: platform,
      addressType: pick(ADDRESS_TYPES, index),
      preLocation: `A-${padNum((index % 9) + 1)}-${padNum((index % 12) + 1)}`,
      actualInboundLocation: `A-${padNum((index % 9) + 1)}-${padNum((index % 12) + 1)}`
    },
    {
      id: shipmentId + 1,
      cargoOrderId: cargoId,
      shipmentNo: `${shipmentNo}-B`,
      shippingMark: mark,
      cartonQty: Math.max(20, Math.floor(cartonQty / 2)),
      palletQty: Math.max(1, Math.floor(palletQty / 2)),
      weight: Math.floor(weight / 2),
      cbm: Number((cbm / 2).toFixed(2)),
      poNo: `PO-${20261000 + index}`,
      shipmentCode: `${shipmentNo}-B`,
      mark,
      skuSummary: `SKU-BUNDLE-${index + 1}-B`,
      expectedQty: Math.max(20, Math.floor(cartonQty / 2)),
      expectedBoxQty: Math.max(20, Math.floor(cartonQty / 2)),
      expectedWeight: Math.floor(weight / 2),
      expectedCbm: Number((cbm / 2).toFixed(2)),
      dwTime: dateStr(2026, 5, 12 + (index % 18), 14),
      remark: `补充货件 ${index + 1}`,
      groupCode: group,
      platformWarehouseCode: wh,
      platformName: platform,
      addressType: pick(ADDRESS_TYPES, index),
      preLocation: `B-${padNum((index % 8) + 1)}-${padNum((index % 10) + 1)}`,
      actualInboundLocation: `B-${padNum((index % 8) + 1)}-${padNum((index % 10) + 1)}`
    }
  ];
}

function buildContainerOrder(index: number) {
  const i = index + 1;
  const id = 70000 + i;
  const customer = pick(CUSTOMERS, index);
  const shippingLine = pick(SHIPPING_LINES, index);
  const warehouse = pick(MOCK_WAREHOUSE_OPTIONS, index);
  const containerStatus =
    index === 0 ? 'DEVANNING' : index === 1 ? 'ARRIVED_WAREHOUSE' : pick(CONTAINER_STATUSES, index);
  const terminalReleaseStatus = index === 1 ? 'RELEASE' : pick(TERMINAL_RELEASE_STATUSES, index + 1);
  const examStatus = index === 1 ? 'NONE' : pick(EXAM_STATUSES, index);
  const totalCartonQty = 180 + (index % 15) * 40;
  const totalPalletQty = 8 + (index % 10) * 2;
  const totalWeight = totalCartonQty * 11 + index * 50;
  const totalCbm = Number((totalCartonQty * 0.065 + index * 0.8).toFixed(2));
  const etaMonth = 4 + Math.floor(index / 10);
  const etaDay = 5 + (index % 25);
  const hasException = index % 11 === 0;
  const hasDownstream = index % 13 === 0;

  return {
    ...base,
    id,
    companyName: MOCK_COMPANY.companyName,
    customerId: 7100000 + i,
    customerName: customer,
    channelId: 1000 + (index % 4),
    channelName: pick(CHANNELS, index),
    businessTypeId: 2000 + (index % 4),
    businessTypeName: pick(BUSINESS_TYPES, index),
    ownerUserId: 3000 + (index % 5),
    ownerUserName: `负责人${(index % 5) + 1}`,
    customerServiceId: 4000 + (index % 4),
    customerServiceName: `客服${(index % 4) + 1}`,
    warehouseId: warehouse.id,
    warehouseName: warehouse.warehouseName,
    inboundWarehouseName: warehouse.warehouseName,
    containerOrderNo: `CTN-2026-${padNum(i)}`,
    orderSource: pick(ORDER_SOURCES, index),
    containerNo: isoContainerNo(index),
    containerType: pick(CONTAINER_TYPES, index),
    sealNo: `SEAL-${padNum(880000 + i)}`,
    shippingLineId: 5000 + (index % SHIPPING_LINES.length),
    shippingLineName: shippingLine,
    vesselName: pick(VESSELS, index),
    voyageNo: `V${2026}${padNum(100 + index)}`,
    routeCode: `TP-${pick(['USWC', 'USEC', 'USGC'], index)}-${padNum(index + 1, 3)}`,
    mblNo: `MBL${2026}${padNum(i, 6)}`,
    hblNo: `HBL${2026}${padNum(i, 6)}`,
    dischargePortId: 6000 + (index % PORTS.length),
    dischargePortName: pick(PORTS, index),
    terminalId: 6100 + (index % TERMINALS.length),
    terminalName: pick(TERMINALS, index),
    eta: dateOnly(2026, etaMonth, etaDay),
    ata: containerStatus !== 'IN_TRANSIT' && containerStatus !== 'PENDING_ACCEPT'
      ? dateOnly(2026, etaMonth, Math.min(etaDay + 2, 28))
      : null,
    pickupLfd: dateOnly(2026, etaMonth, Math.min(etaDay + 7, 28)),
    emptyReturnLfd: dateOnly(2026, etaMonth + 1, Math.min(etaDay + 3, 28)),
    availableTime: dateStr(2026, etaMonth, Math.min(etaDay + 3, 28), 8),
    terminalReleaseStatus,
    holdFlag: terminalReleaseStatus === 'HOLD' ? 1 : 0,
    holdTypes: terminalReleaseStatus === 'HOLD' ? 'CUSTOMS,BILLING' : null,
    holdRemark: terminalReleaseStatus === 'HOLD' ? '码头费用待确认' : null,
    examStatus,
    examFlag: examStatus === 'EXAMINING' ? 1 : 0,
    examTypes: pick(EXAM_TYPES, index),
    examType: pick(EXAM_TYPES, index),
    examRemark: examStatus === 'EXAMINING' ? '海关查验中，等待放行' : '无查验',
    drayageVendorId: 6200 + (index % DRAYAGE_VENDORS.length),
    drayageVendorName: pick(DRAYAGE_VENDORS, index),
    pickupAppointmentNo: `PU-APT-${padNum(i)}`,
    pickupAppointmentTime: dateStr(2026, etaMonth, Math.min(etaDay + 4, 28), 9),
    actualPickupTime: ['PICKED_UP', 'ARRIVED_WAREHOUSE', 'DEVANNING', 'DEVANNED', 'EMPTY_RETURNED', 'COMPLETED'].includes(containerStatus)
      ? dateStr(2026, etaMonth, Math.min(etaDay + 5, 28), 11)
      : null,
    pickupRemark: '提柜司机已确认预约',
    expectedArrivalTime: dateStr(2026, etaMonth, Math.min(etaDay + 6, 28), 15),
    requiredArrivalTime: dateStr(2026, etaMonth, Math.min(etaDay + 6, 28), 18),
    actualArrivalTime: ['ARRIVED_WAREHOUSE', 'DEVANNING', 'DEVANNED', 'EMPTY_RETURNED', 'COMPLETED'].includes(containerStatus)
      ? dateStr(2026, etaMonth, Math.min(etaDay + 6, 28), 16, 30)
      : null,
    containerLocation: `YARD-${padNum((index % 20) + 1)}-SLOT-${padNum((index % 50) + 1)}`,
    arrivalRemark: '到仓卸柜正常',
    devanningNo: `DV-${padNum(2026000 + i)}`,
    devanningOrderNo: `DVN-${padNum(2026000 + i)}`,
    devanningWarehouseId: warehouse.id,
    expectedDevanningTime: dateOnly(2026, etaMonth, Math.min(etaDay + 7, 28)),
    devanningAppointmentTime: dateStr(2026, etaMonth, Math.min(etaDay + 7, 28), 8),
    devanningMethod: pick(DEVANNING_METHODS, index),
    loadingType: pick(LOADING_TYPES, index),
    sortingMethod: index % 2 === 0 ? 'BY_DESTINATION' : 'BY_CUSTOMER',
    devanningDockNo:
      ['ARRIVED_WAREHOUSE', 'DEVANNING'].includes(containerStatus) && index % 3 !== 2 ? `D-${String((index % 8) + 1).padStart(2, '0')}` : null,
    devanningDockReady: ['ARRIVED_WAREHOUSE', 'DEVANNING'].includes(containerStatus) && index % 2 === 0,
    devanningStartTime: ['DEVANNING', 'DEVANNED', 'EMPTY_RETURNED', 'COMPLETED'].includes(containerStatus)
      ? dateStr(2026, etaMonth, Math.min(etaDay + 7, 28), 9)
      : null,
    devanningFinishTime: ['DEVANNED', 'EMPTY_RETURNED', 'COMPLETED'].includes(containerStatus)
      ? dateStr(2026, etaMonth, Math.min(etaDay + 7, 28), 17)
      : null,
    devanningRemark: '拆柜按目的地分区码放',
    emptyReturnLocation: pick(EMPTY_RETURN_LOCATIONS, index),
    emptyReturnAppointmentNo: `ER-APT-${padNum(i)}`,
    emptyReturnTime: ['EMPTY_RETURNED', 'COMPLETED'].includes(containerStatus)
      ? dateStr(2026, etaMonth + 1, Math.min(etaDay + 1, 28), 10)
      : null,
    emptyReturnStatus: ['EMPTY_RETURNED', 'COMPLETED'].includes(containerStatus) ? 'RETURNED' : 'PENDING',
    emptyReturnRemark: '空柜已还至指定堆场',
    prePlanTruckQty: 2 + (index % 4),
    prePlanPalletQty: totalPalletQty,
    prePlanCbm: totalCbm,
    totalCartonQty,
    totalPalletQty,
    totalWeight,
    totalCbm,
    totalBoxQty: totalCartonQty,
    containerExceptionFlag: hasException ? 1 : 0,
    containerExceptionType: hasException ? 'SHORTAGE' : null,
    containerExceptionCount: hasException ? 1 + (index % 3) : 0,
    downstreamExceptionFlag: hasDownstream ? 1 : 0,
    downstreamExceptionCount: hasDownstream ? 1 + (index % 2) : 0,
    attachmentCount: 1 + (index % 5),
    doAttachmentCount: index % 3 === 0 ? 1 : 0,
    latestAttachmentTime: dateStr(2026, 5, 1 + (index % 28), 14),
    latestDoUploadTime: index % 3 === 0 ? dateStr(2026, 5, 2 + (index % 28), 10) : null,
    containerStatus,
    status: containerStatus,
    internalRemark: `内部备注：海柜 ${i} 跟进中`,
    remark: `客户备注：海柜 ${i} 正常操作`
  };
}

function buildCargoOrder(index: number, container: ReturnType<typeof buildContainerOrder>) {
  const i = index + 1;
  const id = 80000 + i;
  const customer = container.customerName;
  const platform = pick(PLATFORMS, index);
  const addressType = pick(ADDRESS_TYPES, index);
  const fulfillmentStatus =
    index < 32
      ? 'INBOUNDED'
      : pick(
          [
            'OUTBOUND_ORDERED',
            'DELIVERY_APPOINTED',
            'OUTBOUNDED',
            'DELIVERING',
            'DELIVERED',
            'POD_UPLOADED',
            'BILLED',
            'COMPLETED',
            'IN_TRANSIT',
            'ARRIVED_WAREHOUSE',
            'DEVANNED'
          ],
          index
        );
  const billingStatus = pick(BILLING_STATUSES, index);
  const holdFlag = index % 17 === 0 ? 1 : 0;
  const transferFlag = index % 9 === 0 ? 1 : 0;
  const exceptionFlag = index % 11 === 0 ? 1 : 0;
  const cargoOrderNo = `CO-2026-${padNum(i)}`;
  const shipments = buildShipments(id, index, cargoOrderNo);
  const declaredCartonQty = shipments.reduce((s, r) => s + (r.cartonQty || 0), 0);
  const declaredPalletQty = shipments.reduce((s, r) => s + (r.palletQty || 0), 0);
  const declaredWeight = shipments.reduce((s, r) => s + (r.weight || 0), 0);
  const declaredCbm = Number(shipments.reduce((s, r) => s + (r.cbm || 0), 0).toFixed(2));
  const actualCartonQty = ['INBOUNDED', 'OUTBOUND_ORDERED', 'OUTBOUNDED', 'DELIVERED', 'COMPLETED', 'BILLED'].includes(fulfillmentStatus)
    ? declaredCartonQty
    : Math.max(0, declaredCartonQty - (index % 5));
  const actualPalletQty = Math.max(1, declaredPalletQty - (index % 2));
  const actualWeight = actualCartonQty * 11;
  const actualCbm = Number((actualCartonQty * 0.07).toFixed(2));
  const warehouse = pick(MOCK_WAREHOUSE_OPTIONS, index);
  const groupCode = pick(GROUP_CODES, index);
  const platformWarehouseCode = pick(PLATFORM_WAREHOUSES, index);
  const city = pick(['Los Angeles', 'Dallas', 'Chicago', 'Atlanta', 'Seattle', 'Miami'], index);
  const state = pick(['CA', 'TX', 'IL', 'GA', 'WA', 'FL'], index);
  const zipCode = `${90000 + index * 101}`.slice(0, 5);
  const actualInboundTime = ['INBOUNDED', 'OUTBOUND_ORDERED', 'OUTBOUNDED', 'DELIVERED', 'COMPLETED', 'BILLED'].includes(fulfillmentStatus)
    ? dateStr(2026, 5, 26 + (index % 5), 10, 30)
    : null;

  return {
    ...base,
    id,
    bizRootId: id,
    companyId: MOCK_COMPANY.id,
    warehouseId: warehouse.id,
    containerOrderId: container.id,
    containerOrderNo: container.containerOrderNo,
    containerNo: container.containerNo,
    cargoOrderNo,
    externalOrderNo: `REF-${2026}${padNum(i, 6)}`,
    orderSource: pick(ORDER_SOURCES, index),
    customerId: container.customerId,
    customerName: customer,
    channelId: container.channelId,
    channelName: container.channelName,
    businessTypeId: container.businessTypeId,
    businessTypeName: container.businessTypeName,
    platformId: 7000 + (index % PLATFORMS.length),
    platformCode: platform.slice(0, 3).toUpperCase(),
    platformName: platform,
    customerServiceId: container.customerServiceId,
    customerServiceName: container.customerServiceName,
    orderTag: index % 4 === 0 ? 'VIP' : 'STANDARD',
    orderTagName: index % 4 === 0 ? '重点客户' : '普通客户',
    timelinessLevel: pick(TIMELINESS_LEVELS, index),
    dispatchRemark: '调度备注：优先安排出库',
    storageLocation: `STG-${padNum((index % 30) + 1)}`,
    inboundWarehouseId: warehouse.id,
    inboundWarehouseName: warehouse.warehouseName,
    addressType,
    platformWarehouseCode,
    groupCode,
    consigneeName: `${customer} Warehouse`,
    addressLine1: `${1000 + index} Commerce Blvd`,
    addressLine2: index % 2 === 0 ? `Suite ${100 + index}` : `Building ${String.fromCharCode(65 + (index % 5))}`,
    city,
    state,
    zipCode,
    country: 'US',
    contactName: `Contact ${(index % 8) + 1}`,
    contactPhone: `+1 ${200 + (index % 700)}-555-${padNum(1000 + index, 4)}`,
    contactEmail: `ops${i}@${customer.toLowerCase().replace(/\s+/g, '')}.com`,
    shipmentCodes: shipments.map(s => `${s.shipmentNo} / ${s.skuSummary}`).join('; '),
    poNos: shipments.map(s => s.poNo).join(', '),
    marks: shipments.map(s => s.shippingMark).join(', '),
    holdFlag,
    holdStatus: holdFlag ? 'HOLDING' : pick(HOLD_STATUSES, index),
    holdType: holdFlag ? pick(HOLD_TYPES, index) : null,
    holdReason: holdFlag ? '待客户确认费用' : null,
    holdTime: holdFlag ? dateStr(2026, 5, 10 + (index % 10), 9) : null,
    releaseTime: holdFlag ? null : dateStr(2026, 5, 12 + (index % 10), 11),
    holdRemark: holdFlag ? '暂扣待财务审核' : null,
    deliveryLfd: dateOnly(2026, 6, 5 + (index % 20)),
    appointmentNo:
      ['DELIVERY_APPOINTED', 'OUTBOUNDED', 'DELIVERED', 'COMPLETED'].includes(fulfillmentStatus) || index % 4 === 0
        ? platform === 'Amazon'
          ? `ISA-${padNum(8844000 + i)}`
          : `APT-2026-${padNum(i)}`
        : null,
    followUpRemark: `跟进记录 ${i}：已联系客户确认派送窗口`,
    remark: `订单备注 ${i}`,
    parcelCarrierName: pick(PARCEL_CARRIERS, index),
    parcelTrackingNo: `TRK${2026}${padNum(i, 8)}`,
    transferFlag,
    transferWarehouseCode: transferFlag ? pick(PLATFORM_WAREHOUSES, index + 3) : null,
    transferOutboundWarehouseCode: transferFlag ? `OUT-${pick(PLATFORM_WAREHOUSES, index + 5)}` : null,
    forecastQtyUnit: index % 2 === 0 ? 'BY_CARTON' : 'BY_PALLET',
    declaredCartonQty,
    declaredPalletQty,
    declaredPieceQty: declaredCartonQty * 4,
    declaredWeight,
    declaredCbm,
    actualCartonQty,
    actualPalletQty,
    actualPieceQty: actualCartonQty * 4,
    actualWeight,
    actualCbm,
    palletLengthCm: 120 + (index % 3) * 2,
    palletWidthCm: 100 + (index % 2) * 2,
    palletHeightCm: 150 + (index % 4) * 10,
    weightUnit: 'KG',
    volumeUnit: 'CBM',
    preOutboundFlag: index % 5 === 0 ? 1 : 0,
    preOutboundNo: index % 5 === 0 ? `PRE-${padNum(i)}` : null,
    preOutboundStatus: ['OUTBOUND_ORDERED', 'OUTBOUNDED', 'DELIVERED', 'COMPLETED'].includes(fulfillmentStatus)
      ? 'CONVERTED'
      : index % 5 === 0
        ? 'PRE_CREATED'
        : 'NONE',
    preOutboundTime: index % 5 === 0 ? dateStr(2026, 5, 20 + (index % 8), 10) : null,
    preOutboundConvertTime: index % 5 === 0 ? dateStr(2026, 5, 22 + (index % 6), 14) : null,
    outboundBatchNo: ['OUTBOUND_ORDERED', 'OUTBOUNDED', 'DELIVERED', 'COMPLETED'].includes(fulfillmentStatus)
      ? `TRIP${2026}${padNum(i)}`
      : null,
    outboundOrderStatus: ['OUTBOUND_ORDERED', 'OUTBOUNDED', 'DELIVERED', 'COMPLETED'].includes(fulfillmentStatus)
      ? 'CREATED'
      : 'NONE',
    outboundOrderTime: ['OUTBOUND_ORDERED', 'OUTBOUNDED', 'DELIVERED', 'COMPLETED'].includes(fulfillmentStatus)
      ? dateStr(2026, 5, 24 + (index % 5), 9)
      : null,
    orderStatus: fulfillmentStatus,
    fulfillmentStatus,
    appointmentStatus: ['DELIVERY_APPOINTED', 'OUTBOUNDED', 'DELIVERED'].includes(fulfillmentStatus)
      ? 'APPOINTED'
      : pick(APPOINTMENT_STATUSES, index),
    podStatus: ['POD_UPLOADED', 'DELIVERED', 'COMPLETED'].includes(fulfillmentStatus)
      ? 'UPLOADED'
      : pick(POD_STATUSES, index),
    billingStatus,
    earliestDwTime: shipments[0]?.dwTime ?? dateStr(2026, 5, 10, 9),
    eta: container.eta,
    ata: container.ata,
    actualPickupTime: container.actualPickupTime,
    actualArrivalTime: container.actualArrivalTime,
    devanningFinishTime: container.devanningFinishTime,
    actualInboundTime,
    deliveryAppointmentTime: ['DELIVERY_APPOINTED', 'OUTBOUNDED', 'DELIVERED'].includes(fulfillmentStatus)
      ? dateStr(2026, 6, 2 + (index % 10), 10)
      : null,
    actualOutboundTime: ['OUTBOUNDED', 'DELIVERED', 'COMPLETED'].includes(fulfillmentStatus)
      ? dateStr(2026, 6, 3 + (index % 8), 8)
      : null,
    signedTime: ['DELIVERED', 'COMPLETED', 'POD_UPLOADED'].includes(fulfillmentStatus)
      ? dateStr(2026, 6, 4 + (index % 6), 16)
      : null,
    podUploadTime: ['POD_UPLOADED', 'COMPLETED'].includes(fulfillmentStatus)
      ? dateStr(2026, 6, 5 + (index % 5), 11)
      : null,
    billingTime: billingStatus === 'BILLED' ? dateStr(2026, 6, 8 + (index % 4), 15) : null,
    completedTime: fulfillmentStatus === 'COMPLETED' ? dateStr(2026, 6, 10 + (index % 3), 18) : null,
    exceptionFlag,
    exceptionCount: exceptionFlag ? 1 + (index % 3) : 0,
    parentOrderId: null,
    parentOrderNo: null,
    rootOrderId: id,
    rootOrderNo: `CO-2026-${padNum(i)}`,
    splitFlag: 0,
    splitRole: null,
    splitStatus: null,
    splitGroupNo: null,
    childOrderCount: 0,
    splitSource: null,
    customerVisibleFlag: 1,
    attachmentCount: 1 + (index % 4),
    podAttachmentCount: ['POD_UPLOADED', 'DELIVERED', 'COMPLETED'].includes(fulfillmentStatus) ? 1 : 0,
    exceptionAttachmentCount: exceptionFlag ? 1 : 0,
    latestAttachmentTime: dateStr(2026, 5, 8 + (index % 20), 13),
    customerRemark: `客户备注：订单 ${i} 需准时派送`,
    internalRemark: `内部备注：订单 ${i} 已核对货件`,
    operationRemark: `操作备注：订单 ${i} 库位已分配`,
    preLocation: shipments.map(s => s.preLocation).join(', '),
    actualInboundLocation: shipments.map(s => s.actualInboundLocation).filter(Boolean).join(', '),
    cargoQty: declaredCartonQty,
    expectedBoxQty: declaredCartonQty,
    expectedPalletQty: declaredPalletQty,
    expectedWeight: declaredWeight,
    expectedCbm: declaredCbm,
    totalBoxQty: actualCartonQty,
    totalWeight: actualWeight,
    totalCbm: actualCbm,
    parcelCarrier: pick(PARCEL_CARRIERS, index),
    shipments,
    nodeTraces: [
      { id: id * 10 + 1, nodeCode: 'CREATE', nodeName: '创建订单', status: 'DONE', operatorName: 'admin', operateTime: dateStr(2026, 5, 1, 10) },
      { id: id * 10 + 2, nodeCode: 'INBOUND', nodeName: '入库完成', status: actualInboundTime ? 'DONE' : 'PENDING', operatorName: 'warehouse', operateTime: dateStr(2026, 5, 26, 10, 30) }
    ]
  };
}

function buildLoosePalletSeedOrder(index: number, container: ReturnType<typeof buildContainerOrder>) {
  const i = index + 1;
  const id = 80500 + i;
  const palletQty = 2 + (index % 4);
  const deliveryMode = index % 2 === 0 ? 'SELF_PICKUP' : 'DOOR_DELIVERY';
  const peerName = `同行客户${String.fromCharCode(65 + index)}`;
  const appointment = dateStr(2026, 6, 8 + index, 14);
  const carriageNo = `CAR-${80500 + i}`;
  const platformWarehouseCode = pick(PLATFORM_WAREHOUSES, index);
  const cargoOrderNo = `CO-2026-LP${String(i).padStart(2, '0')}`;

  return {
    ...base,
    id,
    bizRootId: id,
    containerOrderId: container.id,
    containerOrderNo: container.containerOrderNo,
    containerNo: container.containerNo,
    cargoOrderNo,
    externalOrderNo: `PEER-REF-${padNum(i, 6)}`,
    orderSource: 'PEER_PORTAL',
    orderSubType: 'LOOSE_PALLET',
    channelCode: 'PEER_BULK',
    channelName: '同行散板',
    customerId: 7200000 + id,
    customerName: peerName,
    peerCustomerName: peerName,
    carriageNo,
    platformWarehouseCode,
    businessTypeId: 2099,
    businessTypeName: '同行散板',
    platformName: '同行散板',
    timelinessLevel: pick(TIMELINESS_LEVELS, index),
    addressType: deliveryMode === 'DOOR_DELIVERY' ? 'COMMERCIAL' : 'SELF_PICKUP',
    deliveryMode,
    deliveryAppointmentTime: appointment,
    appointmentNo: `APT-2026-LP${padNum(i)}`,
    forecastQtyUnit: 'BY_PALLET',
    declaredPalletQty: palletQty,
    declaredCartonQty: 0,
    declaredWeight: palletQty * 450,
    declaredCbm: Number((palletQty * 1.6).toFixed(2)),
    actualPalletQty: palletQty,
    actualCartonQty: 0,
    actualWeight: palletQty * 450,
    actualCbm: Number((palletQty * 1.6).toFixed(2)),
    groupCode: '同行散板',
    inboundWarehouseName: container.inboundWarehouseName || MOCK_WAREHOUSE.warehouseName,
    contactName: `联系人${i}`,
    contactPhone: `+1-310-555-${String(1000 + i).slice(-4)}`,
    addressLine1: `${2000 + index} Peer Logistics Ave`,
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90001',
    country: 'US',
    fulfillmentStatus: index % 3 === 0 ? 'INBOUNDED' : 'OUTBOUND_ORDERED',
    orderStatus: index % 3 === 0 ? 'INBOUNDED' : 'OUTBOUND_ORDERED',
    billingStatus: 'UNBILLED',
    preOutboundStatus: 'NONE',
    outboundOrderStatus: 'NONE',
    appointmentStatus: 'APPOINTED',
    podStatus: 'PENDING',
    exceptionFlag: 0,
    exceptionCount: 0,
    holdFlag: 0,
    transferFlag: 0,
    remark: '同行散板演示数据',
    customerRemark: '同行散板演示数据',
    palletLabelPrinted: index % 2 === 0,
    marks: cargoOrderNo,
    shipments: Array.from({ length: palletQty }, (_, pi) => ({
      id: id * 10 + pi + 1,
      cargoOrderId: id,
      shipmentNo: `${container.containerNo}-P${String(pi + 1).padStart(2, '0')}`,
      shippingMark: cargoOrderNo,
      palletQty: 1,
      cartonQty: 0,
      weight: 450,
      cbm: 1.6,
      poNo: `PEER-${String(pi + 1).padStart(3, '0')}`,
      remark: deliveryMode === 'DOOR_DELIVERY' ? '上门收货' : '自提送货'
    })),
    nodeTraces: [
      { id: id * 100 + 1, nodeCode: 'CREATE', nodeName: '散板订单创建', status: 'DONE', operatorName: 'admin', operateTime: base.createTime }
    ]
  };
}

const MOCK_CONTAINER_ORDERS = Array.from({ length: 50 }, (_, index) => buildContainerOrder(index));
const MOCK_CARGO_ORDERS = [
  ...Array.from({ length: 50 }, (_, index) => buildCargoOrder(index, MOCK_CONTAINER_ORDERS[index])),
  ...Array.from({ length: 5 }, (_, index) => buildLoosePalletSeedOrder(index, MOCK_CONTAINER_ORDERS[index]))
];

export { MOCK_CONTAINER_ORDERS, MOCK_CARGO_ORDERS };
