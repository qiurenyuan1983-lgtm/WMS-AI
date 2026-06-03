import { request } from '@/service/request';

/** 签到记录分页列表（进出流水） */
export function fetchGetCheckInList(params?: Api.Yms.CheckInSearchParams) {
  return request<Api.Yms.CheckInList>({ url: '/yms/gate/list', method: 'get', params });
}

/** 门岗统一 Check-in（替代原拆分的海柜/装车入口） */
export function fetchUnifiedCheckIn(data: Api.Yms.UnifiedCheckInParams) {
  return request<Api.Yms.CheckIn>({ url: '/yms/gate/unified-check-in', method: 'post', data });
}

/** 手动放行（覆盖 REJECTED/PENDING 结果） */
export function fetchManualPass(id: CommonType.IdType, remark?: string) {
  return request<Api.Yms.CheckIn>({ url: `/yms/gate/${id}/manual-pass`, method: 'post', params: { remark } });
}

/** 当前在场车辆/海柜/车厢 */
export function fetchGetInYardList(params?: Api.Yms.InYardSearchParams) {
  return request<Api.Yms.InYardList>({ url: '/yms/gate/in-yard', method: 'get', params });
}

/** Check-out 匹配预览 */
export function fetchLookupCheckOut(warehouseId: CommonType.IdType, keyword: string) {
  return request<Api.Yms.CheckOut>({
    url: '/yms/gate/check-out/lookup',
    method: 'get',
    params: { warehouseId, keyword }
  });
}

/** Check-out 离场确认 */
export function fetchGateCheckOut(data: Api.Yms.CheckOutParams) {
  return request<Api.Yms.CheckOut>({ url: '/yms/gate/check-out', method: 'post', data });
}

/** 入场小票数据 */
export function fetchGetCheckInReceipt(id: CommonType.IdType) {
  return request<Api.Yms.CheckInReceipt>({ url: `/yms/gate/${id}/receipt`, method: 'get' });
}

// ─── 公开接口（司机 H5 使用，无需登录）─────────────────────────────────────

/** 司机自助 Check-in */
export function fetchDriverSelfCheckIn(data: Api.Yms.DriverSelfCheckInParams) {
  return request<Api.Yms.DriverSelfCheckInResult>({ url: '/yms/public/driver-checkin', method: 'post', data });
}

/** 查询仓库可用停车位列表 */
export function fetchPublicParkingSlots(warehouseId: CommonType.IdType, tenantId: string) {
  return request<Api.Yms.ParkingSlot[]>({ url: '/yms/public/parking-slots', method: 'get', params: { warehouseId, tenantId } });
}

/** 装车司机 Check-in — 按提货号查询派送信息（公开接口） */
export function fetchPublicTrailerCheckinLookup(pickupNo: string) {
  return request<Api.Yms.TrailerCheckinLookup>({
    url: '/yms/public/trailer-checkin/lookup',
    method: 'get',
    params: { pickupNo }
  });
}

/** 装车司机 Check-in — 提交登记（公开接口） */
export function fetchPublicTrailerCheckin(data: Api.Yms.TrailerCheckinSubmitParams) {
  return request<Api.Yms.TrailerCheckinSubmitResult>({
    url: '/yms/public/trailer-checkin',
    method: 'post',
    data
  });
}
