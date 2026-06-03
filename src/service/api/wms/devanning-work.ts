import { request } from '@/service/request';

export function fetchGetDevanningWorkTasks(params?: {
  dockId?: string | number;
  containerNo?: string;
  keyword?: string;
}) {
  return request<Api.Wms.DevanningWorkTaskList>({
    url: '/wms/devanning-work/tasks',
    method: 'get',
    params
  });
}

export function fetchGetDevanningWorkSession(taskId: CommonType.IdType, dockId?: CommonType.IdType) {
  return request<Api.Wms.DevanningWorkSession>({
    url: '/wms/devanning-work/session',
    method: 'get',
    params: { taskId, dockId }
  });
}

export function fetchResolveDevanningScan(taskId: CommonType.IdType, scanCode: string) {
  return request<Api.Wms.DevanningScanResolve>({
    url: '/wms/devanning-work/scan/resolve',
    method: 'post',
    data: { taskId, scanCode }
  });
}

export function fetchReceiveDevanningByOrder(
  taskId: CommonType.IdType,
  data: { groupCode: string; cargoOrderId: number; qty: number }
) {
  return request<Api.Wms.DevanningWorkSession>({
    url: '/wms/devanning-work/receive/order',
    method: 'post',
    data: { taskId, ...data }
  });
}

export function fetchReceiveDevanningByBox(
  taskId: CommonType.IdType,
  data: { scanCode: string; qty?: number; groupCode?: string }
) {
  return request<Api.Wms.DevanningWorkSession>({
    url: '/wms/devanning-work/receive/box',
    method: 'post',
    data: { taskId, ...data }
  });
}

export function fetchReceiveDevanningByPallet(
  taskId: CommonType.IdType,
  data: { palletNo: string; groupCode?: string; boxQty?: number }
) {
  return request<Api.Wms.DevanningWorkSession>({
    url: '/wms/devanning-work/receive/pallet',
    method: 'post',
    data: { taskId, ...data }
  });
}

export function fetchPalletizeDevanningSelection(
  taskId: CommonType.IdType,
  data: {
    groupCode: string;
    items: Array<{ cargoOrderId: number; qty: number }>;
    palletNo?: string;
  }
) {
  return request<Api.Wms.DevanningWorkSession>({
    url: '/wms/devanning-work/palletize',
    method: 'post',
    data: { taskId, ...data }
  });
}

export function fetchCreateDevanningWorkPallet(
  taskId: CommonType.IdType,
  data: { groupCode: string; cargoOrderId: number; boxQty: number; palletNo?: string }
) {
  return request<Api.Wms.DevanningWorkSession>({
    url: '/wms/devanning-work/pallet/create',
    method: 'post',
    data: { taskId, ...data }
  });
}

export function fetchDeleteDevanningWorkPallet(taskId: CommonType.IdType, palletId: number) {
  return request<Api.Wms.DevanningWorkSession>({
    url: `/wms/devanning-work/pallet/${palletId}`,
    method: 'delete',
    params: { taskId }
  });
}

export function fetchStartDevanningWorkTask(taskId: CommonType.IdType) {
  return request<Api.Wms.DevanningWorkSession>({
    url: '/wms/devanning-work/start',
    method: 'post',
    data: { taskId }
  });
}

export function fetchCompleteDevanningWorkTask(taskId: CommonType.IdType) {
  return request<Api.Wms.DevanningWorkSession>({
    url: '/wms/devanning-work/complete',
    method: 'post',
    data: { taskId }
  });
}
