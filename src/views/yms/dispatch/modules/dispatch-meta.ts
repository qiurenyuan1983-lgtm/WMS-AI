/** WMS 备货状态展示 */
export const WMS_READY_META: Record<string, { label: string; type: 'default' | 'info' | 'success' | 'warning' | 'error' }> = {
  NOT_REQUIRED: { label: '无需备货', type: 'default' },
  PENDING:      { label: '备货中',   type: 'warning' },
  READY:        { label: '已备齐',   type: 'success' },
};

/** Dock 类型标签 */
export const DOCK_TYPE_LABEL: Record<string, string> = {
  CONTAINER_DOCK:   '海柜Dock',
  TRUCK_DOCK:       '装车Dock',
  SELF_PICKUP_DOCK: '自提Dock',
  MIXED_DOCK:       '混合Dock',
  UNLOADING:        '卸货Dock',
  LOADING:          '装货Dock',
  DEVANNING:        '拆柜Dock',
};

export function isLoadingTaskType(taskType: string | null | undefined): boolean {
  return !!taskType && taskType !== 'DEVANNING' && taskType !== 'OTHER';
}
