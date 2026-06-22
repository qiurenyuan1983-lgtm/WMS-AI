export type PalletInventoryTab =
  | 'all'
  | 'AVAILABLE'
  | 'HOLD'
  | 'LOCKED'
  | 'EXCEPTION'
  | 'PENDING_OUTBOUND'
  | 'OUTBOUND'
  | 'AGE_WARNING';

export const PALLET_INVENTORY_TABS: Array<{ key: PalletInventoryTab; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'AVAILABLE', label: '可用库存' },
  { key: 'HOLD', label: '暂扣库存' },
  { key: 'LOCKED', label: '锁定库存' },
  { key: 'EXCEPTION', label: '异常库存' },
  { key: 'PENDING_OUTBOUND', label: '待出库' },
  { key: 'OUTBOUND', label: '已出库' },
  { key: 'AGE_WARNING', label: '库龄预警' }
];

export const PALLET_INVENTORY_STATUS_META: Record<
  Api.Wms.PalletInventoryStatus,
  { label: string; type: 'default' | 'info' | 'success' | 'warning' | 'error' }
> = {
  AVAILABLE: { label: '可用', type: 'success' },
  HOLD: { label: '暂扣', type: 'warning' },
  LOCKED: { label: '锁定', type: 'info' },
  PENDING_OUTBOUND: { label: '待出库', type: 'info' },
  PICKING: { label: '拣货中', type: 'info' },
  PENDING_LOAD: { label: '待装车', type: 'warning' },
  LOADING: { label: '装车中', type: 'warning' },
  OUTBOUND: { label: '已出库', type: 'default' },
  EXCEPTION: { label: '异常', type: 'error' },
  VOIDED: { label: '已注销', type: 'default' }
};

export const PALLET_INSTRUCTION_TYPE_LABELS: Record<string, string> = {
  PUTAWAY: '上架指令',
  PICK: '拣货指令',
  RELABEL: '换标指令',
  REPACK: '换箱指令',
  HOLD: '暂扣指令',
  RELEASE: '放行指令',
  MOVE: '库调指令',
  EXCEPTION: '异常处理指令',
  VOID: '注销指令',
  REASSIGN: '改派指令'
};

export const AGE_WARNING_DAYS = 30;
