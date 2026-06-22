import { request } from '@/service/request';

export function fetchGetTmsOverview() {
  return request<Api.Tms.Overview>({ url: '/tms/overview', method: 'get' });
}

export function fetchGetTripOrderList(params: Api.Tms.TripOrderSearchParams) {
  return request<Api.Tms.TripOrderList>({ url: '/tms/trip-order/list', method: 'get', params });
}

export function fetchGetTripOrderStatusCount() {
  return request<Api.Tms.TripStatusCount>({ url: '/tms/trip-order/status-count', method: 'get' });
}

export function fetchGetTripOrderDetail(id: CommonType.IdType) {
  return request<Api.Tms.TripDetail>({ url: `/tms/trip-order/${id}`, method: 'get' });
}

export function fetchTripOrderAction(id: CommonType.IdType, action: string) {
  return request<Api.Tms.ActionResult>({ url: `/tms/trip-order/${id}/action`, method: 'post', data: { action } });
}

export function fetchGetTripAvailableOrders(
  id: CommonType.IdType,
  params?: CommonType.RecordNullable<{ pageNum?: number; pageSize?: number; keyword?: string }>
) {
  return request<Api.Tms.TripAvailableOrderList>({
    url: `/tms/trip-order/${id}/available-orders`,
    method: 'get',
    params
  });
}

export function fetchAddTripCargo(id: CommonType.IdType, orderIds: number[]) {
  return request<Api.Tms.AddTripCargoResult>({
    url: `/tms/trip-order/${id}/add-cargo`,
    method: 'post',
    data: { orderIds }
  });
}

export function fetchGetDispatchPool(params?: CommonType.RecordNullable<{ pageNum?: number; pageSize?: number; keyword?: string }>) {
  return request<Api.Tms.DispatchPoolList>({ url: '/tms/dispatch/pool', method: 'get', params });
}

export function fetchGetDispatchPlans() {
  return request<Api.Tms.DispatchPlan[]>({ url: '/tms/dispatch/plans', method: 'get' });
}

export function fetchAutoDispatch() {
  return request<{ success: boolean; message: string; plans: Api.Tms.DispatchPlan[] }>({
    url: '/tms/dispatch/auto',
    method: 'post'
  });
}

export function fetchConfirmDispatch(planId: CommonType.IdType) {
  return request<Api.Tms.DispatchActionResult>({
    url: `/tms/dispatch/${planId}/confirm`,
    method: 'post'
  });
}

export function fetchGetDispatchLogs() {
  return request<Api.Tms.DispatchLog[]>({ url: '/tms/dispatch/logs', method: 'get' });
}

export function fetchGetDispatchDetail(params: { planId?: number; orderId?: number }) {
  return request<Api.Tms.DispatchTripDetail>({ url: '/tms/dispatch/detail', method: 'get', params });
}

export function fetchDispatchManualCreate(orderIds: number[]) {
  return request<Api.Tms.DispatchActionResult>({ url: '/tms/dispatch/manual-create', method: 'post', data: { orderIds } });
}

export function fetchDispatchMerge(planId: number, orderIds: number[]) {
  return request<Api.Tms.DispatchActionResult>({ url: '/tms/dispatch/merge', method: 'post', data: { planId, orderIds } });
}

export function fetchDispatchSplit(planId: number, orderIds: number[]) {
  return request<Api.Tms.DispatchActionResult>({ url: '/tms/dispatch/split', method: 'post', data: { planId, orderIds } });
}

export function fetchDispatchAssign(planId: number, type: 'dock' | 'driver' | 'vehicle' | 'supplier', value: string) {
  return request<Api.Tms.DispatchActionResult>({ url: '/tms/dispatch/assign', method: 'post', data: { planId, type, value } });
}

export function fetchDispatchPushWms(planId: number) {
  return request<Api.Tms.DispatchActionResult>({ url: '/tms/dispatch/push-wms', method: 'post', data: { planId } });
}

export function fetchDispatchPushDriver(planId: number) {
  return request<Api.Tms.DispatchActionResult>({ url: '/tms/dispatch/push-driver', method: 'post', data: { planId } });
}

export function fetchGetTmsDriverList(params: CommonType.RecordNullable<{ pageNum: number; pageSize?: number; status?: string; keyword?: string }>) {
  return request<Api.Tms.DriverList>({ url: '/tms/driver/list', method: 'get', params });
}

export function fetchGetTmsVehicleList(params: CommonType.RecordNullable<{ pageNum: number; pageSize?: number; status?: string; keyword?: string }>) {
  return request<Api.Tms.VehicleList>({ url: '/tms/vehicle/list', method: 'get', params });
}

export function fetchGetTmsDockBoard() {
  return request<Api.Tms.DockSlot[]>({ url: '/tms/dock-board', method: 'get' });
}

export function fetchGetTmsPodList(params: CommonType.RecordNullable<{ pageNum: number; pageSize?: number; auditStatus?: string }>) {
  return request<Api.Tms.PodList>({ url: '/tms/pod/list', method: 'get', params });
}

export function fetchGetTmsFreightList(params: CommonType.RecordNullable<{ pageNum: number; pageSize?: number; payStatus?: string }>) {
  return request<Api.Tms.FreightList>({ url: '/tms/freight/list', method: 'get', params });
}

export function fetchGetTmsSupplierList(params: CommonType.RecordNullable<{ pageNum: number; pageSize?: number }>) {
  return request<Api.Tms.SupplierList>({ url: '/tms/dispatch/supplier/list', method: 'get', params });
}

export function fetchGetTmsExceptionList(params: CommonType.RecordNullable<{ pageNum: number; pageSize?: number; status?: string }>) {
  return request<Api.Tms.ExceptionList>({ url: '/tms/exception/list', method: 'get', params });
}

export function fetchGetTmsLogList(params: CommonType.RecordNullable<{ pageNum: number; pageSize?: number; module?: string }>) {
  return request<Api.Tms.LogList>({ url: '/tms/log/list', method: 'get', params });
}
