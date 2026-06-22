import { MOCK_COMPANY, MOCK_WAREHOUSE } from './common';
import { MOCK_CARGO_ORDERS, MOCK_CONTAINER_ORDERS } from './oms-list-seed';
import type { LoosePalletOrderForm } from '@/views/oms/container-order/utils/loose-pallet-order';
import { buildLoosePalletLabels } from '@/views/oms/container-order/utils/loose-pallet-order';

const base = {
  tenantId: '000000',
  companyId: MOCK_COMPANY.id,
  warehouseId: MOCK_WAREHOUSE.id,
  warehouseCode: MOCK_WAREHOUSE.warehouseCode,
  warehouseName: MOCK_WAREHOUSE.warehouseName,
  createTime: '2026-06-06 10:00:00',
  updateTime: '2026-06-06 10:00:00'
};

let cargoOrderIdSeq = 80501;
let cargoOrderNoSeq = 51;

function nextCargoIdentity() {
  const id = cargoOrderIdSeq++;
  const no = `CO-2026-${String(cargoOrderNoSeq++).padStart(4, '0')}`;
  return { id, cargoOrderNo: no };
}

function resolveContainer(containerOrderId: CommonType.IdType) {
  const container = MOCK_CONTAINER_ORDERS.find(c => String(c.id) === String(containerOrderId));
  if (!container) throw new Error('\u6d77\u67dc\u8ba2\u5355\u4e0d\u5b58\u5728');
  return container as Record<string, any>;
}

export function createLoosePalletCargoOrder(
  containerOrderId: CommonType.IdType,
  form: LoosePalletOrderForm
) {
  const container = resolveContainer(containerOrderId);
  const { id, cargoOrderNo } = nextCargoIdentity();
  const palletQty = Math.max(1, Number(form.declaredPalletQty || 1));
  const appointment = form.deliveryAppointmentTime;
  const labels = buildLoosePalletLabels({
    cargoOrderNo,
    carriageNo: form.carriageNo.trim(),
    palletQty,
    groupCode: form.groupCode,
    peerCustomerName: form.peerCustomerName
  });

  const row = {
    ...base,
    id,
    bizRootId: id,
    containerOrderId: container.id,
    containerOrderNo: container.containerOrderNo,
    containerNo: container.containerNo,
    cargoOrderNo,
    externalOrderNo: `PEER-${cargoOrderNo}`,
    orderSource: 'PEER_PORTAL',
    orderSubType: 'LOOSE_PALLET',
    channelCode: 'PEER_BULK',
    channelName: '\u540c\u884c\u6563\u677f',
    customerId: 7200000 + id,
    customerName: form.peerCustomerName.trim(),
    peerCustomerName: form.peerCustomerName.trim(),
    carriageNo: form.carriageNo.trim(),
    platformWarehouseCode: form.platformWarehouseCode?.trim() || null,
    businessTypeId: 2099,
    businessTypeName: '\u540c\u884c\u6563\u677f',
    platformName: '\u540c\u884c\u6563\u677f',
    addressType: form.deliveryMode === 'DOOR_DELIVERY' ? 'COMMERCIAL' : 'SELF_PICKUP',
    deliveryMode: form.deliveryMode,
    deliveryAppointmentTime: appointment,
    appointmentNo: appointment ? `APT-${cargoOrderNo}` : null,
    forecastQtyUnit: 'BY_PALLET',
    declaredPalletQty: palletQty,
    declaredCartonQty: 0,
    declaredWeight: palletQty * 450,
    declaredCbm: Number((palletQty * 1.6).toFixed(2)),
    actualPalletQty: palletQty,
    actualCartonQty: 0,
    actualWeight: palletQty * 450,
    actualCbm: Number((palletQty * 1.6).toFixed(2)),
    expectedPalletQty: palletQty,
    expectedBoxQty: 0,
    groupCode: form.groupCode || '\u540c\u884c\u6563\u677f',
    inboundWarehouseName: container.inboundWarehouseName || MOCK_WAREHOUSE.warehouseName,
    contactName: form.contactName,
    contactPhone: form.contactPhone,
    addressLine1: form.addressLine1,
    city: form.city,
    state: form.state,
    zipCode: form.zipCode,
    country: 'US',
    fulfillmentStatus: 'GENERATED',
    orderStatus: 'GENERATED',
    billingStatus: 'UNBILLED',
    preOutboundStatus: 'NONE',
    outboundOrderStatus: 'NONE',
    appointmentStatus: appointment ? 'APPOINTED' : 'NONE',
    podStatus: 'PENDING',
    exceptionFlag: 0,
    exceptionCount: 0,
    holdFlag: 0,
    transferFlag: 0,
    remark: form.remark,
    customerRemark: form.remark,
    loosePalletLabels: labels,
    palletLabelPrinted: false,
    shipments: labels.map((label, index) => ({
      id: id * 10 + index + 1,
      cargoOrderId: id,
      shipmentNo: label.palletNo,
      shippingMark: label.palletNo,
      palletQty: 1,
      cartonQty: 0,
      weight: 450,
      cbm: 1.6,
      poNo: `PEER-${String(index + 1).padStart(3, '0')}`,
      remark: LOOSE_PALLET_DELIVERY_LABEL(form.deliveryMode)
    })),
    nodeTraces: [
      {
        id: id * 100 + 1,
        nodeCode: 'CREATE',
        nodeName: '\u6563\u677f\u8ba2\u5355\u521b\u5efa',
        status: 'DONE',
        operatorName: 'admin',
        operateTime: base.createTime
      }
    ]
  };

  MOCK_CARGO_ORDERS.unshift(row as (typeof MOCK_CARGO_ORDERS)[number]);
  return row;
}

function LOOSE_PALLET_DELIVERY_LABEL(mode: string) {
  return mode === 'DOOR_DELIVERY' ? '\u4e0a\u95e8\u6536\u8d27' : '\u81ea\u63d0\u9001\u8d27';
}

export function addContainerCargoOrders(
  containerOrderId: CommonType.IdType,
  cargoOrders: Array<Record<string, any>>
) {
  const container = resolveContainer(containerOrderId);
  const created = cargoOrders.map(raw => {
    const { id, cargoOrderNo } = nextCargoIdentity();
    return {
      ...base,
      ...raw,
      id,
      cargoOrderNo: raw.cargoOrderNo || cargoOrderNo,
      containerOrderId: container.id,
      containerOrderNo: container.containerOrderNo,
      containerNo: container.containerNo,
      orderSubType: raw.orderSubType || 'STANDARD',
      fulfillmentStatus: raw.fulfillmentStatus || 'PENDING_CARGO',
      billingStatus: raw.billingStatus || 'UNBILLED',
      preOutboundStatus: raw.preOutboundStatus || 'NONE',
      outboundOrderStatus: raw.outboundOrderStatus || 'NONE',
      appointmentStatus: raw.appointmentStatus || 'NONE',
      podStatus: raw.podStatus || 'PENDING',
      exceptionFlag: raw.exceptionFlag ?? 0,
      exceptionCount: raw.exceptionCount ?? 0
    };
  });
  created.forEach(row => MOCK_CARGO_ORDERS.unshift(row as (typeof MOCK_CARGO_ORDERS)[number]));
  return created;
}

export function markLoosePalletLabelsPrinted(cargoOrderId: CommonType.IdType) {
  const row = MOCK_CARGO_ORDERS.find(c => String(c.id) === String(cargoOrderId)) as Record<string, any> | undefined;
  if (!row) return null;
  row.palletLabelPrinted = true;
  row.updateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
  return row;
}
