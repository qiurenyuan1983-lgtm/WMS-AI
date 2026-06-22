import { request } from '@/service/request';

export function fetchPdaHomeSummary() {
  return request<Api.Pda.HomeSummary>({
    url: '/pda/home/summary',
    method: 'get'
  });
}

export function fetchPdaBusinessModules(biz: string) {
  return request<Api.Pda.BusinessGroupSummary>({
    url: `/pda/business/${biz}/modules`,
    method: 'get'
  });
}

export function fetchPdaInboundScanPallet(labelNo: string, biz: string) {
  return request<Api.Pda.InboundPalletInfo>({
    url: '/pda/inbound/scan-pallet',
    method: 'get',
    params: { labelNo, biz }
  });
}

export function fetchPdaInboundConfirm(data: Api.Pda.InboundConfirmPayload) {
  return request<{ success: boolean; message: string }>({
    url: '/pda/inbound/confirm',
    method: 'post',
    data
  });
}

export function fetchPdaOutboundTrips(biz: string) {
  return request<Api.Pda.OutboundTripListItem[]>({
    url: '/pda/outbound/trips',
    method: 'get',
    params: { biz }
  });
}

export function fetchPdaOutboundLoad(data: Api.Pda.OutboundLoadPayload) {
  return request<Api.Pda.OutboundLoadResult>({
    url: '/pda/outbound/load',
    method: 'post',
    data
  });
}

export function fetchPdaOutboundUploadPhoto(data: Api.Pda.OutboundSitePhotoPayload) {
  return request<Api.Pda.OutboundActionResult>({
    url: '/pda/outbound/upload-photo',
    method: 'post',
    data
  });
}

export function fetchPdaOutboundException(data: Api.Pda.OutboundExceptionPayload) {
  return request<Api.Pda.OutboundActionResult>({
    url: '/pda/outbound/exception',
    method: 'post',
    data
  });
}

export function fetchPdaOutboundFinish(data: Api.Pda.OutboundFinishPayload) {
  return request<{ success: boolean; message: string }>({
    url: '/pda/outbound/finish',
    method: 'post',
    data
  });
}

export function fetchPdaTask(taskId: string, params?: { biz?: string; taskType?: string }) {
  return request<Api.Pda.TaskDetail>({
    url: `/pda/task/${taskId}`,
    method: 'get',
    params
  });
}

export function fetchPdaTaskAction(taskId: string, data: Api.Pda.TaskActionPayload) {
  return request<Api.Pda.TaskActionResult>({
    url: `/pda/task/${taskId}/action`,
    method: 'post',
    data
  });
}

export function fetchPdaDevanningPushInstructions(biz: string) {
  return request<Api.Pda.DevanningPushInstruction[]>({
    url: '/pda/devanning/push-instructions',
    method: 'get',
    params: { biz }
  });
}

export function fetchPdaDevanningTasks(
  biz: string,
  options?: { keyword?: string | null; taskId?: string | null }
) {
  return request<Api.Pda.DevanningTaskListItem[]>({
    url: '/pda/devanning/tasks',
    method: 'get',
    params: {
      biz,
      keyword: options?.keyword || undefined,
      taskId: options?.taskId || undefined
    }
  });
}

export function fetchPdaDevanningTaskDetail(taskId: string) {
  return request<Api.Pda.DevanningTaskDetail>({
    url: `/pda/devanning/tasks/${taskId}`,
    method: 'get'
  });
}

export function fetchPdaDevanningScanContainer(containerNo: string, biz: string) {
  return request<Api.Pda.DevanningScanResult>({
    url: '/pda/devanning/scan-container',
    method: 'post',
    data: { containerNo, biz }
  });
}

export function fetchPdaDevanningStart(taskId: string) {
  return request<Api.Pda.DevanningActionResult>({
    url: '/pda/devanning/start',
    method: 'post',
    data: { taskId }
  });
}

export function fetchPdaDevanningCreatePallet(data: Api.Pda.DevanningCreatePalletPayload) {
  return request<Api.Pda.DevanningActionResult>({
    url: '/pda/devanning/create-pallet',
    method: 'post',
    data
  });
}

export function fetchPdaDevanningPrint(taskId: string, palletNo: string) {
  return request<Api.Pda.DevanningActionResult>({
    url: '/pda/devanning/print-pallet',
    method: 'post',
    data: { taskId, palletNo }
  });
}

export function fetchPdaDevanningInbound(data: Api.Pda.DevanningInboundPayload) {
  return request<Api.Pda.DevanningActionResult>({
    url: '/pda/devanning/inbound-pallet',
    method: 'post',
    data
  });
}

export function fetchPdaDevanningPhoto(data: Api.Pda.DevanningPhotoPayload) {
  return request<Api.Pda.DevanningActionResult>({
    url: '/pda/devanning/photo-pallet',
    method: 'post',
    data
  });
}

export function fetchPdaDevanningReport(taskId: string) {
  return request<Api.Pda.DevanningReport>({
    url: `/pda/devanning/report/${taskId}`,
    method: 'get'
  });
}

export function fetchPdaDevanningValidateFinish(taskId: string) {
  return request<Api.Pda.DevanningFinishValidation>({
    url: `/pda/devanning/validate-finish/${taskId}`,
    method: 'get'
  });
}

export function fetchPdaDevanningFinish(data: Api.Pda.DevanningFinishPayload) {
  return request<Api.Pda.DevanningActionResult>({
    url: '/pda/devanning/finish',
    method: 'post',
    data
  });
}

export function fetchPdaDevanningUploadPhoto(data: Api.Pda.DevanningSitePhotoPayload) {
  return request<Api.Pda.DevanningActionResult>({
    url: '/pda/devanning/upload-photo',
    method: 'post',
    data
  });
}

export function fetchPdaDevanningException(data: Api.Pda.DevanningExceptionPayload) {
  return request<Api.Pda.DevanningActionResult>({
    url: '/pda/devanning/exception',
    method: 'post',
    data
  });
}
