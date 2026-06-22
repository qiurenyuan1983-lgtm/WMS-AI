import { MOCK_CONTAINER_ORDERS, MOCK_CARGO_ORDERS } from './oms-list-seed';
import { MOCK_WMS_DEVANNING_ORDERS } from './wms';

/** 演示黄金样本：OOLU1000137 / CTN-2026-0002 / 拆柜任务 60402 */
export const GOLDEN_CONTAINER_ID = 70002;
export const GOLDEN_CONTAINER_NO = 'OOLU1000137';
export const GOLDEN_CONTAINER_ORDER_NO = 'CTN-2026-0002';
export const GOLDEN_DEVANNING_TASK_ID = 60402;
export const GOLDEN_CARGO_ORDER_NO = 'CO-2026-0002';

const SOURCE_ORDER_NO_TO_CONTAINER_ID: Record<string, number> = {
  'CTN-2026-0001': 70001,
  'CTN-2026-0002': 70002,
  'CTN-2026-0003': 70003
};

function nowStr() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

export function resolveContainerIdFromDevanningTask(taskId: number | string): number | null {
  const order = MOCK_WMS_DEVANNING_ORDERS.find(d => d.id === Number(taskId)) as Record<string, any> | undefined;
  if (!order) return null;
  if (order.sourceOrderId != null && order.sourceOrderId !== '') return Number(order.sourceOrderId);
  if (order.sourceOrderNo && SOURCE_ORDER_NO_TO_CONTAINER_ID[order.sourceOrderNo]) {
    return SOURCE_ORDER_NO_TO_CONTAINER_ID[order.sourceOrderNo];
  }
  return null;
}

export function getContainerOrderRecord(containerId: number) {
  return MOCK_CONTAINER_ORDERS.find(c => c.id === containerId) as Record<string, any> | undefined;
}

export function getCargoOrdersByContainer(containerId: number) {
  return MOCK_CARGO_ORDERS.filter(c => Number(c.containerOrderId) === Number(containerId));
}

/** 码头 HOLD 拦截出库 */
export function assertTerminalReleasedForContainer(containerId: number | null | undefined) {
  if (!containerId) return;
  const container = getContainerOrderRecord(containerId);
  if (container?.terminalReleaseStatus === 'HOLD') {
    throw new Error(`海柜 ${container.containerNo || container.containerOrderNo} 码头放行 HOLD，暂不可出库`);
  }
  if (container?.examStatus === 'EXAMINING') {
    throw new Error(`海柜 ${container.containerNo || container.containerOrderNo} 查验中，暂不可出库`);
  }
}

/** 订单 HOLD / 未入库 拦截出库 */
export function assertCargoOutboundEligible(cargoIds: Array<number | string>) {
  const ids = [...new Set(cargoIds.map(Number).filter(Boolean))];
  if (!ids.length) throw new Error('请选择要出库的订单');

  for (const id of ids) {
    const cargo = MOCK_CARGO_ORDERS.find(c => c.id === id) as Record<string, any> | undefined;
    if (!cargo) throw new Error(`订单不存在：${id}`);
    if (cargo.holdFlag === 1 || cargo.holdStatus === 'HOLDING') {
      throw new Error(`订单 ${cargo.cargoOrderNo} 处于暂扣，不可出库`);
    }
    const eligible = new Set(['INBOUNDED', 'OUTBOUND_ORDERED', 'DELIVERY_APPOINTED']);
    if (!eligible.has(String(cargo.fulfillmentStatus))) {
      throw new Error(`订单 ${cargo.cargoOrderNo} 未入库完成（${cargo.fulfillmentStatus}），不可出库`);
    }
    assertTerminalReleasedForContainer(Number(cargo.containerOrderId));
  }
}

/** 拆柜完成后回写海柜、订单履约状态 */
export function syncDevanningComplete(taskId: number | string) {
  const containerId = resolveContainerIdFromDevanningTask(taskId);
  if (!containerId) return;

  const finishTime = nowStr();
  const container = getContainerOrderRecord(containerId);
  if (container) {
    container.containerStatus = 'DEVANNED';
    container.status = 'DEVANNED';
    container.devanningFinishTime = finishTime;
  }

  const cargoOrders = getCargoOrdersByContainer(containerId);
  for (const cargo of cargoOrders) {
    const c = cargo as Record<string, any>;
    const terminal = ['OUTBOUNDED', 'DELIVERED', 'COMPLETED', 'BILLED', 'CANCELLED'];
    if (terminal.includes(String(c.fulfillmentStatus))) continue;
    c.fulfillmentStatus = 'INBOUNDED';
    c.orderStatus = 'INBOUNDED';
    if (!c.actualInboundTime) c.actualInboundTime = finishTime;
    if (Number(c.actualCartonQty || 0) < Number(c.declaredCartonQty || 0)) {
      c.actualCartonQty = c.declaredCartonQty;
    }
  }

  const devanning = MOCK_WMS_DEVANNING_ORDERS.find(d => d.id === Number(taskId)) as Record<string, any> | undefined;
  if (devanning) {
    devanning.inboundedBoxQty = cargoOrders.reduce(
      (sum, row) => sum + Number((row as Record<string, any>).actualCartonQty || 0),
      0
    );
  }
}

const OUTBOUND_ORDERED_STATUSES = new Set([
  'OUTBOUND_ORDERED',
  'DELIVERY_APPOINTED',
  'OUTBOUNDED',
  'DELIVERED',
  'COMPLETED',
  'BILLED',
  'POD_UPLOADED'
]);

/** 车次生成后回写海柜出库进度（关联货单状态汇总） */
export function syncContainerAfterCargoOutbound(containerId: number | null | undefined) {
  if (!containerId) return;
  const container = getContainerOrderRecord(containerId);
  if (!container) return;

  const cargos = getCargoOrdersByContainer(containerId).filter(
    c => String((c as Record<string, any>).fulfillmentStatus) !== 'CANCELLED'
  );
  if (!cargos.length) return;

  const outboundCount = cargos.filter(c =>
    OUTBOUND_ORDERED_STATUSES.has(String((c as Record<string, any>).fulfillmentStatus))
  ).length;

  container.outboundCargoCount = outboundCount;
  container.totalCargoCount = cargos.length;
  container.partialOutbound = outboundCount > 0 && outboundCount < cargos.length;
  container.allCargoOutboundOrdered = outboundCount === cargos.length;

  if (outboundCount > 0 && ['DEVANNED', 'ARRIVED_WAREHOUSE'].includes(String(container.containerStatus))) {
    container.lastOutboundTime = nowStr();
  }
}

/** 装车完成后回写订单为已出库 */
export function syncOutboundComplete(cargoOrderIds: number[]) {
  const finishTime = nowStr();
  cargoOrderIds.forEach(id => {
    const cargo = MOCK_CARGO_ORDERS.find(c => c.id === Number(id)) as Record<string, any> | undefined;
    if (!cargo) return;
    if (['DELIVERED', 'COMPLETED', 'BILLED', 'CANCELLED'].includes(String(cargo.fulfillmentStatus))) return;
    cargo.fulfillmentStatus = 'OUTBOUNDED';
    cargo.orderStatus = 'OUTBOUNDED';
    cargo.outboundOrderStatus = 'CREATED';
    if (!cargo.actualOutboundTime) cargo.actualOutboundTime = finishTime;
  });
}
