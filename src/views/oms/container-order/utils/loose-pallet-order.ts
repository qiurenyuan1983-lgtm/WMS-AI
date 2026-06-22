import type { PalletLabelPrintInput } from '@/views/wms/devanning-work/utils/print-pallet-label';

export type LoosePalletDeliveryMode = 'SELF_PICKUP' | 'DOOR_DELIVERY';

export type LoosePalletOrderForm = {
  peerCustomerName: string;
  carriageNo: string | null;
  platformWarehouseCode: string | null;
  declaredPalletQty: number | null;
  deliveryMode: LoosePalletDeliveryMode;
  deliveryAppointmentTime: string | null;
  groupCode: string | null;
  contactName: string | null;
  contactPhone: string | null;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  remark: string | null;
};

export type LoosePalletLabelItem = PalletLabelPrintInput & {
  id?: number;
  cargoOrderNo?: string;
};

export const LOOSE_PALLET_DELIVERY_MODE_OPTIONS: Array<{ label: string; value: LoosePalletDeliveryMode }> = [
  { label: '自提送货', value: 'SELF_PICKUP' },
  { label: '上门收货', value: 'DOOR_DELIVERY' }
];

export const LOOSE_PALLET_DELIVERY_MODE_LABEL: Record<LoosePalletDeliveryMode, string> = {
  SELF_PICKUP: '自提送货',
  DOOR_DELIVERY: '上门收货'
};

export const PEER_CUSTOMER_PRESETS = [
  '快捷物流同行',
  '太平洋货代',
  'West Coast Forwarding',
  'Harbor Peer Logistics',
  'Sunrise Cargo Peer'
];

export function createDefaultLoosePalletForm(): LoosePalletOrderForm {
  return {
    peerCustomerName: '',
    carriageNo: null,
    platformWarehouseCode: null,
    declaredPalletQty: 1,
    deliveryMode: 'SELF_PICKUP',
    deliveryAppointmentTime: null,
    groupCode: null,
    contactName: null,
    contactPhone: null,
    addressLine1: null,
    city: null,
    state: null,
    zipCode: null,
    remark: null
  };
}

export function validateLoosePalletOrderForm(form: LoosePalletOrderForm): string | null {
  if (!form.peerCustomerName?.trim()) return '请填写同行客户名称';
  if (!form.carriageNo?.trim()) return '请填写车厢号';
  if (!form.declaredPalletQty || form.declaredPalletQty < 1) return '请填写有效的卡板数量';
  if (!form.deliveryAppointmentTime) return '请填写预约送货时间';
  if (form.deliveryMode === 'DOOR_DELIVERY') {
    if (!form.contactName?.trim()) return '上门收货请填写联系人';
    if (!form.contactPhone?.trim()) return '上门收货请填写联系电话';
    if (!form.addressLine1?.trim()) return '上门收货请填写收货地址';
  }
  return null;
}

export function buildLoosePalletLabels(input: {
  cargoOrderNo: string;
  carriageNo?: string | null;
  palletQty: number;
  groupCode?: string | null;
  peerCustomerName?: string | null;
}): LoosePalletLabelItem[] {
  const qty = Math.max(1, Math.floor(input.palletQty));
  const group = input.groupCode?.trim() || input.peerCustomerName?.trim() || '散板';
  return Array.from({ length: qty }, (_, index) => {
    const seq = String(index + 1).padStart(2, '0');
    const palletNo = `${input.cargoOrderNo}-PLT-${seq}`;
    return {
      id: index + 1,
      palletNo,
      cargoOrderNo: input.cargoOrderNo,
      groupCode: group,
      carriageNo: input.carriageNo ?? null,
      boxQty: 0,
      weightKg: null,
      cbm: null,
      orderCount: 1,
      items: [
        {
          cargoOrderNo: input.cargoOrderNo,
          receiveQty: 1,
          receiveUnitLabel: '板',
          boxQty: 0
        }
      ]
    };
  });
}

export function toPalletLabelPrintRows(
  labels: LoosePalletLabelItem[] | null | undefined,
  fallback?: { cargoOrderNo?: string; carriageNo?: string | null; groupCode?: string | null }
) {
  return (labels || []).map(label => ({
    palletNo: label.palletNo,
    groupCode: label.groupCode ?? fallback?.groupCode,
    carriageNo: label.carriageNo ?? fallback?.carriageNo,
    boxQty: label.boxQty ?? 0,
    weightKg: label.weightKg ?? label.weight ?? null,
    cbm: label.cbm ?? null,
    items: label.items
  }));
}
