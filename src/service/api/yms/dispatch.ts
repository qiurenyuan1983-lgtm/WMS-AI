import { request } from '@/service/request';

/** 园区任务分页列表 */
export function fetchGetYardTaskList(params?: Api.Yms.YardTaskSearchParams) {
  return request<Api.Yms.YardTaskList>({ url: '/yms/dispatch/list', method: 'get', params });
}

/** 任务详情 */
export function fetchGetYardTaskDetail(id: CommonType.IdType) {
  return request<Api.Yms.YardTask>({ url: `/yms/dispatch/${id}`, method: 'get' });
}

/** Dock看板 */
export function fetchGetDockBoard(
  warehouseId?: CommonType.IdType | null,
  taskGroup?: '' | 'DEVANNING' | 'LOADING' | null
) {
  return request<Api.Yms.DockBoard[]>({
    url: '/yms/dispatch/dock-board',
    method: 'get',
    params: { warehouseId, taskGroup: taskGroup || undefined },
  });
}

/** 顶部统计 */
export function fetchGetDispatchStats(warehouseId?: CommonType.IdType | null, taskGroup?: string) {
  return request<Api.Yms.DispatchStats>({ url: '/yms/dispatch/stats', method: 'get', params: { warehouseId, taskGroup } });
}

/** OMS推送任务（幂等） */
export function fetchPushTask(data: Api.Yms.PushTaskParams) {
  return request<Api.Yms.YardTask>({ url: '/yms/dispatch/push', method: 'post', data });
}

/** 手动新建任务 */
export function fetchCreateTask(data: Api.Yms.CreateTaskParams) {
  return request<Api.Yms.YardTask>({ url: '/yms/dispatch', method: 'post', data });
}

/** 签到 */
export function fetchCheckIn(id: CommonType.IdType) {
  return request<null>({ url: `/yms/dispatch/${id}/check-in`, method: 'post' });
}

/** 分配/取消Dock */
export function fetchAssignDock(data: Api.Yms.AssignDockParams) {
  return request<null>({ url: '/yms/dispatch/assign-dock', method: 'post', data });
}

/** 开始作业 */
export function fetchStartWork(id: CommonType.IdType) {
  return request<null>({ url: `/yms/dispatch/${id}/start`, method: 'post' });
}

/** 暂停作业 */
export function fetchPauseWork(id: CommonType.IdType) {
  return request<null>({ url: `/yms/dispatch/${id}/pause`, method: 'post' });
}

/** 恢复作业 */
export function fetchResumeWork(id: CommonType.IdType) {
  return request<null>({ url: `/yms/dispatch/${id}/resume`, method: 'post' });
}

/** 完成作业（可附带下口目标位置） */
export function fetchFinishWork(id: CommonType.IdType, data?: Record<string, any>) {
  return request<null>({ url: `/yms/dispatch/${id}/finish`, method: 'post', data });
}

/** 获取仓库空闲停车位列表（用于下口目的地选择） */
export function fetchGetFreeYardSlots(warehouseId: CommonType.IdType) {
  return request<any[]>({ url: '/yms/yard-position/free', method: 'get', params: { warehouseId } });
}

/** 获取仓库空闲道口列表（用于下口目的地选择） */
export function fetchGetFreeDocks(warehouseId: CommonType.IdType) {
  return request<any[]>({ url: '/yard/dock/free', method: 'get', params: { warehouseId } });
}

/** 调整优先级 */
export function fetchUpdatePriority(data: { yardTaskId: CommonType.IdType; priority: number }) {
  return request<null>({ url: '/yms/dispatch/priority', method: 'post', data });
}

/** WMS 备货状态回写 */
export function fetchSyncWmsReady(data: {
  yardTaskId: CommonType.IdType;
  wmsReadyStatus: Api.Yms.WmsReadyStatus;
  wmsReadyTime?: string | null;
}) {
  return request<null>({ url: '/yms/dispatch/wms-ready', method: 'post', data });
}

/** 放行 */
export function fetchRelease(id: CommonType.IdType) {
  return request<null>({ url: `/yms/dispatch/${id}/release`, method: 'post' });
}

/** 离园 */
export function fetchLeaveYard(id: CommonType.IdType) {
  return request<null>({ url: `/yms/dispatch/${id}/leave`, method: 'post' });
}

/** 标记异常 */
export function fetchMarkException(id: CommonType.IdType, reason: string) {
  return request<null>({ url: `/yms/dispatch/${id}/exception`, method: 'post', params: { reason } });
}

/** 解除异常 */
export function fetchClearException(id: CommonType.IdType) {
  return request<null>({ url: `/yms/dispatch/${id}/clear-exception`, method: 'post' });
}

/** 取消任务 */
export function fetchCancelTask(id: CommonType.IdType, reason?: string) {
  return request<null>({ url: `/yms/dispatch/${id}/cancel`, method: 'post', params: { reason } });
}

/** 操作日志 */
export function fetchGetTaskLogs(id: CommonType.IdType) {
  return request<Api.Yms.YardTaskLog[]>({ url: `/yms/dispatch/${id}/logs`, method: 'get' });
}
