import { request } from '@/service/request';

const BASE = '/wms/inbound-plan';

/** 分页列表 */
export function fetchGetInboundPlanList(params?: Api.Oms.InboundPlanSearchParams) {
  return request<Api.Oms.InboundPlanList>({ url: `${BASE}/list`, method: 'get', params });
}

/** 获取或创建入库计划（从海柜订单入口进入） */
export function fetchGetOrCreateInboundPlan(containerOrderId: CommonType.IdType, warehouseId: CommonType.IdType) {
  return request<Api.Oms.InboundPlan>({
    url: `${BASE}/get-or-create`,
    method: 'get',
    params: { containerOrderId, warehouseId }
  });
}

/** 计划详情（含分组 + 明细） */
export function fetchGetInboundPlanDetail(planId: CommonType.IdType) {
  return request<Api.Oms.InboundPlan>({ url: `${BASE}/${planId}`, method: 'get' });
}

/** 预览自动分组（不写库） */
export function fetchPreviewAutoGroupInboundPlan(planId: CommonType.IdType) {
  return request<Api.Oms.InboundPlanItemPreview[]>({
    url: `${BASE}/${planId}/preview-auto-group`,
    method: 'post'
  });
}

/** 预览快速配置规则（不写库） */
export function fetchPreviewApplyRuleInboundPlan(planId: CommonType.IdType, ruleId: CommonType.IdType) {
  return request<Api.Oms.InboundPlanItemPreview[]>({
    url: `${BASE}/${planId}/preview-apply-rule`,
    method: 'post',
    params: { ruleId }
  });
}

/** 确认保存分组变更 */
export function fetchSaveGroupInboundPlan(planId: CommonType.IdType, changes: Api.Oms.InboundPlanSaveGroupParams[]) {
  return request<null>({ url: `${BASE}/${planId}/save-group`, method: 'post', data: changes });
}

/** 自动分组（直接写库，旧接口保留备用） */
export function fetchAutoGroupInboundPlan(planId: CommonType.IdType) {
  return request<null>({ url: `${BASE}/${planId}/auto-group`, method: 'post' });
}

/** 快速配置：应用指定分组规则（直接写库，旧接口保留备用） */
export function fetchApplyRuleInboundPlan(planId: CommonType.IdType, ruleId: CommonType.IdType) {
  return request<null>({ url: `${BASE}/${planId}/apply-rule`, method: 'post', data: { ruleId } });
}

/** 手动编辑单行 groupCode / preLocation */
export function fetchUpdateInboundPlanItem(data: Api.Oms.InboundPlanItemUpdateParams) {
  return request<null>({ url: `${BASE}/item`, method: 'put', data });
}

/** 开始作业：draft → in_progress */
export function fetchStartWorkInboundPlan(planId: CommonType.IdType) {
  return request<null>({ url: `${BASE}/${planId}/start-work`, method: 'post' });
}

/** 完结计划：in_progress → completed */
export function fetchCompleteInboundPlan(planId: CommonType.IdType) {
  return request<null>({ url: `${BASE}/${planId}/complete`, method: 'post' });
}

/** 取消计划 */
export function fetchCancelInboundPlan(planId: CommonType.IdType) {
  return request<null>({ url: `${BASE}/${planId}/cancel`, method: 'post' });
}
