import { jsonClone } from '@sa/utils';
import type { ContainerCargoOrderDraftRow } from './container-cargo-order-display';

/** 海柜上下文下创建/编辑货物订单的默认值来源 */
export type ContainerCargoDefaults = {
  customerId?: CommonType.IdType | null;
  customerName?: string | null;
  channelId?: CommonType.IdType | null;
  businessTypeId?: CommonType.IdType | null;
  customerServiceId?: CommonType.IdType | null;
  customerServiceName?: string | null;
  inboundWarehouseId?: CommonType.IdType | null;
  inboundWarehouseName?: string | null;
};

export const FORECAST_QTY_UNIT_OPTIONS = [
  { label: '按箱', value: 'BY_CARTON' },
  { label: '按板', value: 'BY_PALLET' }
] as const;

export function isByPallet(cargo?: Pick<Api.Oms.ContainerCargoOrderForm, 'forecastQtyUnit'> | null) {
  return cargo?.forecastQtyUnit === 'BY_PALLET';
}

/** 根据关联货物订单的下单计量推断海柜装载类型 */
export function resolveLoadingTypeFromCargoOrders(
  cargoOrders?: Api.Oms.ContainerCargoOrderForm[] | null
): 'FLOOR' | 'PALLET' | 'MIXED' | null {
  const units = (cargoOrders || [])
    .filter(cargo => {
      const hasHeader = Boolean(cargo.customerId || cargo.customerName?.trim() || cargo.businessTypeId);
      const hasShipment = (cargo.shipments || []).some(item => item.shipmentNo?.trim());
      return hasHeader || hasShipment;
    })
    .map(cargo => cargo.forecastQtyUnit)
    .filter(Boolean);
  if (!units.length) return null;
  const hasCarton = units.includes('BY_CARTON');
  const hasPallet = units.includes('BY_PALLET');
  if (hasCarton && hasPallet) return 'MIXED';
  if (hasPallet) return 'PALLET';
  return 'FLOOR';
}

export const LOADING_TYPE_LABELS: Record<string, string> = {
  FLOOR: '散装',
  PALLET: '卡板',
  MIXED: '混装'
};

export function getBusinessTypeText(cargo?: Pick<Api.Oms.ContainerCargoOrderForm, 'businessTypeName'> & { businessTypeCode?: string | null } | null) {
  return `${cargo?.businessTypeCode || ''} ${cargo?.businessTypeName || ''}`.toUpperCase();
}

export function resolveBusinessTypeId(
  rows: Api.Base.BusinessType[],
  id?: CommonType.IdType | null,
  name?: string | null
): CommonType.IdType | null {
  if (id != null && id !== '') return id;
  const normalized = name?.trim();
  if (!normalized) return null;
  return rows.find(item => item.businessTypeName === normalized || item.businessTypeCode === normalized)?.id ?? null;
}

export function getBusinessTypeNameById(
  rows: Api.Base.BusinessType[],
  id?: CommonType.IdType | null
): string | null {
  if (id == null || id === '') return null;
  return rows.find(item => String(item.id) === String(id))?.businessTypeName ?? null;
}

export function mapBusinessTypeOptions(rows: Api.Base.BusinessType[]): CommonType.Option[] {
  return rows.map(item => {
    const id = item.id == null ? null : Number(item.id);
    return {
      label: item.businessTypeName,
      value: (id != null && !Number.isNaN(id) ? id : item.id) as CommonType.IdType
    };
  });
}

export function isTruckDeliveryBusinessType(
  cargo?: Pick<Api.Oms.ContainerCargoOrderForm, 'businessTypeName'> & { businessTypeCode?: string | null } | null
) {
  const text = getBusinessTypeText(cargo);
  return text.includes('TRUCK_DELIVERY') || text.includes('卡车派送');
}

export function isExpressDeliveryBusinessType(
  cargo?: Pick<Api.Oms.ContainerCargoOrderForm, 'businessTypeName'> & { businessTypeCode?: string | null } | null
) {
  const text = getBusinessTypeText(cargo);
  return text.includes('EXPRESS_DELIVERY') || text.includes('EXPRESS') || text.includes('PARCEL') || text.includes('快递');
}

export function createDefaultShipment(): Api.Oms.CargoOrderShipmentItem {
  return {
    shipmentNo: null,
    poNo: null,
    shippingMark: null,
    cartonQty: null,
    palletQty: null,
    weight: null,
    cbm: null,
    dwTime: null,
    remark: null
  };
}

/** Naive UI 日期选择器：仅日期 yyyy-MM-dd，非法值转 null */
export function normalizeDatePickerDate(value?: string | null): string | null {
  if (value == null || value === '') return null;
  const datePart = String(value).trim().replace('T', ' ').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null;
  const d = new Date(`${datePart}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : datePart;
}

/** Naive UI 日期选择器：日期时间 yyyy-MM-dd HH:mm:ss，非法值转 null */
export function normalizeDatePickerDateTime(value?: string | null): string | null {
  if (value == null || value === '') return null;
  let text = String(value).trim().replace('T', ' ');
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) text = `${text} 00:00:00`;
  const normalized = text.slice(0, 19);
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(normalized)) return null;
  const d = new Date(normalized.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : normalized;
}

export function createDefaultContainerCargoOrder(
  defaults?: ContainerCargoDefaults
): Api.Oms.ContainerCargoOrderForm {
  return {
    id: null,
    cargoOrderNo: null,
    externalOrderNo: null,
    orderSource: 'SELF',
    customerId: defaults?.customerId ?? null,
    customerName: defaults?.customerName ?? null,
    channelId: defaults?.channelId ?? null,
    businessTypeId: defaults?.businessTypeId ?? null,
    customerServiceId: defaults?.customerServiceId ?? null,
    customerServiceName: defaults?.customerServiceName ?? null,
    inboundWarehouseId: defaults?.inboundWarehouseId ?? null,
    inboundWarehouseName: defaults?.inboundWarehouseName ?? null,
    platformId: null,
    addressType: null,
    platformWarehouseCode: null,
    consigneeName: null,
    addressLine1: null,
    addressLine2: null,
    city: null,
    state: null,
    zipCode: null,
    country: null,
    contactName: null,
    contactPhone: null,
    contactEmail: null,
    transferFlag: 0,
    transferWarehouseCode: null,
    forecastQtyUnit: 'BY_CARTON',
    declaredCartonQty: null,
    declaredPalletQty: null,
    declaredPieceQty: null,
    declaredWeight: null,
    declaredCbm: null,
    parcelCarrierName: null,
    parcelTrackingNo: null,
    customerRemark: null,
    internalRemark: null,
    operationRemark: null,
    shipments: [createDefaultShipment()]
  };
}

/** Excel 解析结果合并海柜默认值（新增海柜 Step2 导入） */
export function mergeImportedCargoWithDefaults(
  rows: Api.Oms.CargoOrder[],
  defaults?: ContainerCargoDefaults
): Api.Oms.ContainerCargoOrderForm[] {
  return rows.map(row => {
    const form = normalizeCargoOrderFromVo(row);
    if (defaults) {
      if (!form.customerId) form.customerId = defaults.customerId ?? null;
      if (!form.customerName?.trim()) form.customerName = defaults.customerName ?? null;
      if (!form.channelId) form.channelId = defaults.channelId ?? null;
      if (!form.businessTypeId) form.businessTypeId = defaults.businessTypeId ?? null;
      if (!form.customerServiceId) form.customerServiceId = defaults.customerServiceId ?? null;
      if (!form.customerServiceName?.trim()) form.customerServiceName = defaults.customerServiceName ?? null;
      if (!form.inboundWarehouseId) form.inboundWarehouseId = defaults.inboundWarehouseId ?? null;
      if (!form.inboundWarehouseName?.trim()) form.inboundWarehouseName = defaults.inboundWarehouseName ?? null;
    }
    syncCargoOrderTableFields(form as ContainerCargoOrderDraftRow);
    return form;
  });
}

/** 将列表/详情 VO 转为表单模型 */
export function normalizeCargoOrderFromVo(item: Api.Oms.CargoOrder): Api.Oms.ContainerCargoOrderForm {
  const shipments = (item.shipments || []).map(shipment => ({
    id: shipment.id ?? null,
    shipmentNo: shipment.shipmentNo ?? (shipment as Api.Oms.CargoOrderShipment).shipmentCode ?? null,
    poNo: shipment.poNo ?? null,
    shippingMark: shipment.shippingMark ?? (shipment as Api.Oms.CargoOrderShipment).mark ?? null,
    cartonQty: shipment.cartonQty ?? (shipment as Api.Oms.CargoOrderShipment).expectedBoxQty ?? null,
    palletQty: shipment.palletQty ?? null,
    weight: shipment.weight ?? (shipment as Api.Oms.CargoOrderShipment).expectedWeight ?? null,
    cbm: shipment.cbm ?? (shipment as Api.Oms.CargoOrderShipment).expectedCbm ?? null,
    dwTime: normalizeDatePickerDateTime(shipment.dwTime),
    remark: shipment.remark ?? null
  }));
  return {
    ...(jsonClone(item) as Api.Oms.ContainerCargoOrderForm),
    shipments: shipments.length ? shipments : [createDefaultShipment()]
  };
}

function joinDistinct(values: Array<string | null | undefined>) {
  const set = new Set<string>();
  values.forEach(value => {
    const text = value?.trim();
    if (text) set.add(text);
  });
  return [...set].join(', ') || null;
}

/** 同步表格展示字段（货件汇总、预报量等），与详情列表 VO 对齐 */
export function syncCargoOrderTableFields(cargo: ContainerCargoOrderDraftRow) {
  summarizeCargoOrderForm(cargo);
  const shipments = (cargo.shipments || []).filter(item => item.shipmentNo?.trim());
  cargo.shipmentCodes = joinDistinct(shipments.map(item => item.shipmentNo));
  cargo.poNos = joinDistinct(shipments.map(item => item.poNo));
  cargo.marks = joinDistinct(shipments.map(item => item.shippingMark));
  const dwTimes = shipments.map(item => item.dwTime).filter(Boolean) as string[];
  cargo.earliestDwTime = dwTimes.length ? dwTimes.sort()[0] : null;
}

export function syncCargoOrderListTableFields(list: ContainerCargoOrderDraftRow[]) {
  list.forEach(syncCargoOrderTableFields);
}

/** 汇总货件预报到订单主表 */
export function summarizeCargoOrderForm(cargo: Api.Oms.ContainerCargoOrderForm) {
  const shipments = (cargo.shipments || []).filter(item => item.shipmentNo?.trim());
  if (!shipments.length) return;
  const sum = (values: Array<number | null | undefined>) =>
    values.reduce<number>((acc, val) => acc + (Number(val) || 0), 0);
  if (isByPallet(cargo)) {
    cargo.declaredPalletQty = sum(shipments.map(item => item.palletQty)) || null;
    cargo.declaredCartonQty = null;
  } else {
    cargo.declaredCartonQty = sum(shipments.map(item => item.cartonQty)) || null;
    cargo.declaredPalletQty = null;
  }
  cargo.declaredWeight = sum(shipments.map(item => item.weight)) || null;
  cargo.declaredCbm = sum(shipments.map(item => item.cbm)) || null;
}

/** 提交前转为后端 CargoOrderBo 结构 */
export function toApiCargoOrder(cargo: Api.Oms.ContainerCargoOrderForm): Api.Oms.ContainerCargoOrderForm {
  summarizeCargoOrderForm(cargo);
  const shipments = (cargo.shipments || [])
    .filter(item => item.shipmentNo?.trim())
    .map(item => ({
      id: item.id ?? null,
      shipmentNo: item.shipmentNo?.trim() || null,
      poNo: item.poNo?.trim() || null,
      shippingMark: item.shippingMark?.trim() || null,
      cartonQty: item.cartonQty ?? null,
      palletQty: item.palletQty ?? null,
      weight: item.weight ?? null,
      cbm: item.cbm ?? null,
      dwTime: item.dwTime ?? null,
      remark: item.remark?.trim() || null
    }));
  return {
    ...cargo,
    transferFlag: cargo.transferFlag ? 1 : 0,
    shipments
  };
}

export function validateContainerCargoOrder(
  cargo: Api.Oms.ContainerCargoOrderForm,
  options?: { requireShipments?: boolean }
): string | null {
  const requireShipments = options?.requireShipments !== false;
  if (!cargo.customerId || !cargo.customerName?.trim()) {
    return '请填写客户信息';
  }
  if (!cargo.businessTypeId) {
    return '请选择业务类型';
  }
  if (isExpressDeliveryBusinessType(cargo) && !cargo.parcelCarrierName?.trim()) {
    return '快递派送须填写快递商';
  }
  if (isTruckDeliveryBusinessType(cargo)) {
    if (!cargo.addressType) {
      return '卡车派送须选择地址类型';
    }
    if (cargo.addressType === 'PLATFORM_WH') {
      if (!cargo.platformId) {
        return '卡车派送到平台仓须选择平台';
      }
      if (!cargo.platformWarehouseCode?.trim()) {
        return '卡车派送到平台仓须选择或填写仓库代码';
      }
    }
    if (!cargo.consigneeName?.trim()) {
      return '卡车派送须填写收货方';
    }
    if (!cargo.addressLine1?.trim() || !cargo.city?.trim() || !cargo.state?.trim() || !cargo.zipCode?.trim()) {
      return '卡车派送须完善地址（Address Line1、City、State、Zip）';
    }
  }
  if (cargo.transferFlag && !cargo.transferWarehouseCode?.trim()) {
    return '转仓时须填写转仓仓库代码';
  }
  const shipments = (cargo.shipments || []).filter(item => item.shipmentNo?.trim());
  if (requireShipments && !shipments.length) {
    return '至少需要一条货件';
  }
  const codes = new Set<string>();
  for (const shipment of shipments) {
    const code = shipment.shipmentNo!.trim();
    if (codes.has(code)) {
      return `货件编码重复：${code}`;
    }
    codes.add(code);
    if (isByPallet(cargo)) {
      if (shipment.palletQty == null || Number(shipment.palletQty) <= 0) {
        return `货件 ${code} 板数须大于 0`;
      }
    } else if (shipment.cartonQty == null || Number(shipment.cartonQty) <= 0) {
      return `货件 ${code} 箱数须大于 0`;
    }
    if (shipment.weight == null || Number(shipment.weight) <= 0) {
      return `货件 ${code} 重量须大于 0`;
    }
    if (shipment.cbm == null || Number(shipment.cbm) <= 0) {
      return `货件 ${code} 体积须大于 0`;
    }
  }
  return null;
}
