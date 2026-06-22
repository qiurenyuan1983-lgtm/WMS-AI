import { request } from '@/service/request';

export function fetchGetTripOutboundPlanStats() {
  return request<Api.Wms.TripOutboundPlanStats>({ url: '/wms/outbound-mgmt/trip-plan/stats', method: 'get' });
}

export function fetchGetTripOutboundPlanList(params?: Api.Wms.TripOutboundPlanSearchParams) {
  return request<Api.Wms.TripOutboundPlanList>({ url: '/wms/outbound-mgmt/trip-plan/list', method: 'get', params });
}

export function fetchGetTripOutboundPlanDetail(id: CommonType.IdType) {
  return request<Api.Wms.TripOutboundPlanRow>({ url: `/wms/outbound-mgmt/trip-plan/${id}`, method: 'get' });
}

export function fetchNotifyTripDrivers(ids: CommonType.IdType[], channels?: string[]) {
  return request<{ success: boolean; message: string; count: number }>({
    url: '/wms/outbound-mgmt/trip-plan/notify',
    method: 'post',
    data: { ids, channels }
  });
}

export function fetchAssignTripDock(tripId: CommonType.IdType, dockNo: string, reason?: string) {
  return request<{ success: boolean; message: string }>({
    url: '/wms/outbound-mgmt/trip-plan/assign-dock',
    method: 'post',
    data: { tripId, dockNo, reason }
  });
}

export function fetchGetDriverCheckinStats() {
  return request<Api.Wms.DriverCheckinStats>({ url: '/wms/outbound-mgmt/checkin/stats', method: 'get' });
}

export function fetchGetDriverCheckinList(params?: Record<string, any>) {
  return request<Api.Wms.DriverCheckinList>({ url: '/wms/outbound-mgmt/checkin/list', method: 'get', params });
}

export function fetchSubmitDriverCheckin(data: Record<string, any>) {
  return request<{ success: boolean; message: string }>({
    url: '/wms/outbound-mgmt/checkin/submit',
    method: 'post',
    data
  });
}

export function fetchGetDockScheduleOverview() {
  return request<Api.Wms.DockScheduleOverview>({ url: '/wms/outbound-mgmt/dock/overview', method: 'get' });
}

export function fetchGetDockWaitingTrips(params?: Record<string, any>) {
  return request<Api.Common.PaginatingQueryRecord<Api.Wms.DockWaitingTripRow>>({
    url: '/wms/outbound-mgmt/dock/waiting',
    method: 'get',
    params
  });
}

export function fetchGetDockSlotList() {
  return request<Api.Wms.DockSlotRow[]>({ url: '/wms/outbound-mgmt/dock/slots', method: 'get' });
}

export function fetchGetDockAssignLogs(params?: Record<string, any>) {
  return request<Api.Common.PaginatingQueryRecord<Api.Wms.DockAssignLogRow>>({
    url: '/wms/outbound-mgmt/dock/logs',
    method: 'get',
    params
  });
}

export function fetchAutoAssignDock(tripId: CommonType.IdType) {
  return request<{ success: boolean; message: string }>({
    url: '/wms/outbound-mgmt/dock/auto-assign',
    method: 'post',
    data: { tripId }
  });
}
