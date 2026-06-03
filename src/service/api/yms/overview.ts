import { request } from '@/service/request';

/** 园区总览 Dashboard */
export function fetchGetOverview(warehouseId?: CommonType.IdType | null) {
  return request<Api.Yms.Overview>({
    url: '/yms/overview',
    method: 'get',
    params: warehouseId != null ? { warehouseId } : undefined
  });
}
