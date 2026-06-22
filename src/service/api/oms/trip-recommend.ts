import { request } from '@/service/request';

export function fetchGetTripRecommendStats(params?: Api.Oms.TripRecommendSearchParams) {
  return request<Api.Oms.TripRecommendStats>({ url: '/oms/trip-recommend/stats', method: 'get', params });
}

export function fetchGetTripRecommendSummaryList(params?: Api.Oms.TripRecommendSearchParams) {
  return request<Api.Oms.TripRecommendSummaryList>({
    url: '/oms/trip-recommend/summary/list',
    method: 'get',
    params
  });
}

export function fetchGetTripRecommendOrders(params?: Api.Oms.TripRecommendSearchParams) {
  return request<Api.Oms.TripRecommendOrdersResult>({
    url: '/oms/trip-recommend/orders',
    method: 'get',
    params
  });
}

export function fetchPreviewTripRecommendLoad(groupId: string, orderIds: number[]) {
  return request<Api.Oms.TripRecommendLoadPreview | null>({
    url: '/oms/trip-recommend/preview-load',
    method: 'post',
    data: { groupId, orderIds }
  });
}

export function fetchGenerateTripRecommend(data: Api.Oms.TripRecommendGenerateParams) {
  return request<Api.Oms.TripRecommendGenerateResult>({
    url: '/oms/trip-recommend/generate-trip',
    method: 'post',
    data
  });
}
