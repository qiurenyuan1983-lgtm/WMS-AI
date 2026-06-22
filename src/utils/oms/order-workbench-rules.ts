import { evaluateBusinessRules } from '@/utils/oms/business-rule-evaluator';

export type OrderWorkbenchPool = 'PLATFORM' | 'LTL' | 'LOCAL' | 'EXPRESS';

export type OrderWorkbenchStatus =
  | 'PENDING_APPT'
  | 'PRE_TRIP'
  | 'PENDING_MANUAL'
  | 'PENDING_CARGO'
  | 'PENDING_CUSTOMER'
  | 'GENERATED'
  | 'ABNORMAL';

export type WorkbenchOverlay = {
  excluded?: boolean;
  status?: OrderWorkbenchStatus;
  generatedTripNo?: string | null;
  pool?: OrderWorkbenchPool;
  [key: string]: unknown;
};

/** 与业务规则中心 triggerEvent 对齐 */
export const ORDER_WORKBENCH_TRIGGERS = {
  SYNC: 'ORDER_WORKBENCH_SYNC',
  CLASSIFY_POOL: 'ORDER_WORKBENCH_CLASSIFY_POOL',
  MAP_STATUS: 'ORDER_WORKBENCH_MAP_STATUS',
  GENERATE_TRIP: 'ORDER_WORKBENCH_GENERATE_TRIP'
} as const;

export type OrderWorkbenchTrigger = (typeof ORDER_WORKBENCH_TRIGGERS)[keyof typeof ORDER_WORKBENCH_TRIGGERS];

const TRIP_GENERATED_FULFILLMENT = new Set([
  'OUTBOUND_ORDERED',
  'DELIVERY_APPOINTED',
  'OUTBOUNDED',
  'DELIVERING',
  'DELIVERED',
  'POD_UPLOADED',
  'BILLED',
  'COMPLETED',
  'GENERATED',
  'CANCELLED'
]);

const WORKBENCH_ELIGIBLE_FULFILLMENT = new Set(['INBOUNDED']);

type RuleProvider = () => Api.Oms.BusinessRule[];

let ruleProvider: RuleProvider | null = null;

/** Mock 启动时注入业务规则数据源 */
export function registerOrderWorkbenchRuleProvider(provider: RuleProvider) {
  ruleProvider = provider;
}

function listWorkbenchRules(trigger?: OrderWorkbenchTrigger) {
  const rules = ruleProvider?.() ?? [];
  return rules.filter(rule => rule.category === 'ORDER' && (!trigger || rule.triggerEvent === trigger));
}

export function buildOrderWorkbenchContext(
  cargo: Record<string, any>,
  overlay?: WorkbenchOverlay,
  extra?: Record<string, unknown>
) {
  const cartonQty = Number(cargo.actualCartonQty ?? cargo.declaredCartonQty ?? 0);
  const palletQty = Number(cargo.actualPalletQty ?? cargo.declaredPalletQty ?? 0);

  return {
    'oms_order-workbench': {
      excluded: overlay?.excluded ? '1' : '0',
      status: overlay?.status ?? null,
      generated_trip_no: overlay?.generatedTripNo ?? null,
      pool: overlay?.pool ?? null
    },
    'oms_cargo-order': {
      fulfillmentStatus: cargo.fulfillmentStatus ?? null,
      preOutboundStatus: cargo.preOutboundStatus ?? null,
      outboundOrderStatus: cargo.outboundOrderStatus ?? null,
      exceptionFlag: String(cargo.exceptionFlag ?? 0),
      holdFlag: String(cargo.holdFlag ?? 0),
      holdStatus: cargo.holdStatus ?? null,
      appointmentNo: cargo.appointmentNo ?? null,
      deliveryAppointmentTime: cargo.deliveryAppointmentTime ?? null,
      groupCode: cargo.groupCode ?? null,
      addressType: cargo.addressType ?? null,
      parcelCarrierName: cargo.parcelCarrierName ?? null,
      declaredCartonQty: cartonQty,
      declaredPalletQty: palletQty,
      platformName: cargo.platformName ?? null,
      supplierName: cargo.supplierName ?? null
    },
    ...extra
  };
}

function hasWorkbenchAction(
  trigger: OrderWorkbenchTrigger,
  cargo: Record<string, any>,
  overlay: WorkbenchOverlay | undefined,
  actionType: string
) {
  const rules = listWorkbenchRules(trigger);
  if (!rules.length) return false;
  const { hits } = evaluateBusinessRules(rules, buildOrderWorkbenchContext(cargo, overlay), { triggerEvent: trigger });
  return hits.some(hit => hit.actions.some(action => action.type === actionType));
}

/** ORD-WB-001 ~ 005：已生成车次 / 已排除，不再进入工作台 */
export function isTripGeneratedCargo(cargo: Record<string, any>, overlay?: WorkbenchOverlay): boolean {
  if (hasWorkbenchAction(ORDER_WORKBENCH_TRIGGERS.SYNC, cargo, overlay, 'EXCLUDE_WORKBENCH')) {
    return true;
  }

  if (overlay?.excluded) return true;
  if (overlay?.status === 'GENERATED' || overlay?.generatedTripNo) return true;
  if (TRIP_GENERATED_FULFILLMENT.has(String(cargo.fulfillmentStatus))) return true;
  if (cargo.preOutboundStatus === 'CONVERTED' && cargo.outboundOrderStatus === 'CREATED') return true;
  return false;
}

/** ORD-WB-006：仅已入库订单进入工作台 */
export function isWorkbenchEligibleCargo(cargo: Record<string, any>, overlay?: WorkbenchOverlay): boolean {
  if (overlay && !overlay.excluded) return true;
  return WORKBENCH_ELIGIBLE_FULFILLMENT.has(String(cargo.fulfillmentStatus));
}

export function shouldIncludeInWorkbenchList(cargo: Record<string, any>, overlay?: WorkbenchOverlay) {
  return isWorkbenchEligibleCargo(cargo, overlay) && !isTripGeneratedCargo(cargo, overlay);
}

export function resolveWorkbenchPool(cargo: Record<string, any>, overlay?: WorkbenchOverlay): OrderWorkbenchPool {
  const rules = listWorkbenchRules(ORDER_WORKBENCH_TRIGGERS.CLASSIFY_POOL);
  if (rules.length) {
    const context = buildOrderWorkbenchContext(cargo, overlay);
    const { hits } = evaluateBusinessRules(rules, context, { triggerEvent: ORDER_WORKBENCH_TRIGGERS.CLASSIFY_POOL });
    for (const hit of hits) {
      const action = hit.actions.find(item => item.type === 'ASSIGN_WORKBENCH_POOL');
      const pool = action?.params?.pool;
      if (pool === 'PLATFORM' || pool === 'LTL' || pool === 'LOCAL' || pool === 'EXPRESS') {
        return pool;
      }
    }
  }

  if (overlay?.pool) return overlay.pool;
  if (cargo.parcelCarrierName && Number(cargo.declaredCartonQty) > 0 && Number(cargo.declaredPalletQty || 0) <= 0) {
    return 'EXPRESS';
  }
  const groupCode = String(cargo.groupCode || '').toUpperCase();
  if (groupCode.includes('LTL')) return 'LTL';
  if (['COMMERCIAL', 'RESIDENTIAL', 'SELF_PICKUP'].includes(String(cargo.addressType))) {
    return 'LOCAL';
  }
  return 'PLATFORM';
}

export function resolveWorkbenchInitialStatus(
  cargo: Record<string, any>,
  pool: OrderWorkbenchPool,
  overlay?: WorkbenchOverlay
): OrderWorkbenchStatus {
  const rules = listWorkbenchRules(ORDER_WORKBENCH_TRIGGERS.MAP_STATUS);
  if (rules.length) {
    const context = buildOrderWorkbenchContext(cargo, overlay, { 'oms_order-workbench': { pool } });
    const { hits } = evaluateBusinessRules(rules, context, { triggerEvent: ORDER_WORKBENCH_TRIGGERS.MAP_STATUS });
    for (const hit of hits) {
      const action = hit.actions.find(item => item.type === 'SET_WORKBENCH_STATUS');
      const status = action?.params?.status;
      if (
        status === 'PENDING_APPT' ||
        status === 'PRE_TRIP' ||
        status === 'PENDING_MANUAL' ||
        status === 'PENDING_CARGO' ||
        status === 'PENDING_CUSTOMER' ||
        status === 'GENERATED' ||
        status === 'ABNORMAL'
      ) {
        return status;
      }
    }
  }

  if (overlay?.status) return overlay.status;
  if (Number(cargo.exceptionFlag) > 0) return 'ABNORMAL';
  if (pool === 'LOCAL' && cargo.appointmentNo && !cargo.deliveryAppointmentTime) return 'PENDING_CUSTOMER';
  if (!cargo.appointmentNo && (pool === 'PLATFORM' || pool === 'LOCAL')) return 'PENDING_APPT';
  if (cargo.preOutboundStatus === 'PRE_CREATED' || cargo.appointmentNo) return 'PRE_TRIP';
  return 'PENDING_MANUAL';
}

export function resolveWorkbenchOrderTypeLabel(pool: OrderWorkbenchPool, platform: string | null): string {
  if (pool === 'EXPRESS') return '快递订单';
  if (pool === 'LTL') return 'LTL订单';
  if (pool === 'LOCAL') return '商业地址订单';
  if (platform === 'Amazon') return 'Amazon预约订单';
  if (platform === 'Walmart') return 'Walmart预约订单';
  return `${platform || '平台'}预约订单`;
}

export type WorkbenchGenerateTripValidation = {
  ok: boolean;
  message?: string;
  blockRuleCode?: string | null;
};

export function validateWorkbenchGenerateTrip(
  rows: Array<Pick<Api.Oms.OrderWorkbenchRow, 'id' | 'orderNo' | 'pool' | 'supplierName' | 'generatedTripNo' | 'status'>>,
  cargoById?: Map<string, Record<string, any>>
) {
  if (!rows.length) {
    return { ok: false, message: '请选择订单' } satisfies WorkbenchGenerateTripValidation;
  }

  const pool = rows[0].pool;
  if (!rows.every(row => row.pool === pool)) {
    return { ok: false, message: '所选订单类型不一致，无法合并生成车次' } satisfies WorkbenchGenerateTripValidation;
  }

  for (const row of rows) {
    const cargo = cargoById?.get(String(row.id));
    const context = buildOrderWorkbenchContext(cargo ?? {}, undefined, {
      'oms_order-workbench': {
        pool: row.pool,
        status: row.status,
        generated_trip_no: row.generatedTripNo ?? null
      },
      batch: {
        pool,
        selected_count: rows.length,
        same_pool: '1'
      }
    });
    const rules = listWorkbenchRules(ORDER_WORKBENCH_TRIGGERS.GENERATE_TRIP);
    const { hits, blockAction } = evaluateBusinessRules(rules, context, {
      triggerEvent: ORDER_WORKBENCH_TRIGGERS.GENERATE_TRIP
    });
    if (blockAction) {
      return {
        ok: false,
        message: blockAction.message || '生成车次被业务规则拦截',
        blockRuleCode: hits[0]?.rule.ruleCode ?? null
      } satisfies WorkbenchGenerateTripValidation;
    }
  }

  if (rows.some(row => row.generatedTripNo || row.status === 'GENERATED')) {
    return { ok: false, message: '所选订单中包含已生成车次的订单' } satisfies WorkbenchGenerateTripValidation;
  }
  if (pool === 'EXPRESS') {
    return { ok: false, message: '快递订单不支持生成车次' } satisfies WorkbenchGenerateTripValidation;
  }
  if (pool !== 'LTL' && pool !== 'PLATFORM' && pool !== 'LOCAL') {
    return { ok: false, message: '当前订单类型不支持批量生成车次' } satisfies WorkbenchGenerateTripValidation;
  }
  if (pool === 'LTL' && rows.some(row => !row.supplierName)) {
    return { ok: false, message: 'LTL 订单请先在详情中匹配供应商' } satisfies WorkbenchGenerateTripValidation;
  }

  return { ok: true } satisfies WorkbenchGenerateTripValidation;
}

export function buildWorkbenchRuleTestContextFromCargo(cargo: Record<string, any>) {
  return buildOrderWorkbenchContext(cargo);
}

export { TRIP_GENERATED_FULFILLMENT, WORKBENCH_ELIGIBLE_FULFILLMENT };
