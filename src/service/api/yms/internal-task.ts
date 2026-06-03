import { request } from '@/service/request';

export function fetchGetInternalTaskList(params?: Api.Yms.InternalTaskSearchParams) {
  return request<Api.Yms.InternalTaskList>({ url: '/yms/internal-task/list', method: 'get', params });
}

export function fetchGetInternalTaskBoard(warehouseId?: CommonType.IdType | null, internalTaskType?: string) {
  return request<Api.Yms.InternalTaskBoardColumn[]>({
    url: '/yms/internal-task/board',
    method: 'get',
    params: { warehouseId, internalTaskType }
  });
}

export function fetchGetInternalTaskDetail(id: CommonType.IdType) {
  return request<Api.Yms.InternalTask>({ url: `/yms/internal-task/${id}`, method: 'get' });
}

export function fetchCreateInternalTask(data: Api.Yms.InternalTaskCreate) {
  return request<Api.Yms.InternalTask>({ url: '/yms/internal-task', method: 'post', data });
}

export function fetchAssignInternalTask(data: Api.Yms.InternalTaskAssign) {
  return request<null>({ url: '/yms/internal-task/assign', method: 'post', data });
}

export function fetchAcceptInternalTask(id: CommonType.IdType) {
  return request<null>({ url: `/yms/internal-task/${id}/accept`, method: 'post' });
}

export function fetchStartInternalTask(id: CommonType.IdType) {
  return request<null>({ url: `/yms/internal-task/${id}/start`, method: 'post' });
}

export function fetchCompleteInternalTask(id: CommonType.IdType, data?: { photoUrls?: string | null }) {
  return request<null>({ url: `/yms/internal-task/${id}/complete`, method: 'post', data });
}

export function fetchFailInternalTask(id: CommonType.IdType, reason: string) {
  return request<null>({ url: `/yms/internal-task/${id}/fail`, method: 'post', params: { reason } });
}

export function fetchCancelInternalTask(id: CommonType.IdType, reason?: string) {
  return request<null>({ url: `/yms/internal-task/${id}/cancel`, method: 'post', params: { reason } });
}
