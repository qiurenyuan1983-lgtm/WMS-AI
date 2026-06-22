import { request } from '@/service/request';

export function fetchGetIecDashboardSummary() {
  return request<Api.Iec.DashboardSummary>({ url: '/iec/dashboard/summary', method: 'get' });
}

export function fetchGetIecEmployeeList(params?: Record<string, any>) {
  return request({ url: '/iec/employee/list', method: 'get', params });
}

export function fetchGetIecEmployeeDetail(id: number) {
  return request<Api.Iec.IntelligentEmployee>({ url: `/iec/employee/${id}`, method: 'get' });
}

export function fetchUpdateIecEmployee(id: number, data: Partial<Api.Iec.IntelligentEmployee>) {
  return request({ url: `/iec/employee/${id}`, method: 'put', data });
}

export function fetchGetIecAutoFlowList(params?: Record<string, any>) {
  return request({ url: '/iec/auto-flow/list', method: 'get', params });
}

export function fetchGetIecRpaFlowList(params?: Record<string, any>) {
  return request({ url: '/iec/rpa-flow/list', method: 'get', params });
}

export function fetchGetIecRpaFlowDetail(id: number) {
  return request<Api.Iec.RpaFlow>({ url: `/iec/rpa-flow/${id}`, method: 'get' });
}

export function fetchSaveIecRpaFlow(id: number, nodes: Api.Iec.RpaNode[]) {
  return request({ url: `/iec/rpa-flow/${id}`, method: 'put', data: { nodes } });
}

export function fetchGetIecTaskQueueList(params?: Record<string, any>) {
  return request({ url: '/iec/task-queue/list', method: 'get', params });
}

export function fetchIecTaskAction(id: number, action: string) {
  return request({ url: `/iec/task-queue/${id}/action`, method: 'post', data: { action } });
}

export function fetchGetIecTakeoverList(params?: Record<string, any>) {
  return request({ url: '/iec/takeover/list', method: 'get', params });
}

export function fetchIecTakeoverAction(id: number, action: string) {
  return request({ url: `/iec/takeover/${id}/action`, method: 'post', data: { action } });
}

export function fetchGetIecExecutionLogList(params?: Record<string, any>) {
  return request({ url: '/iec/execution-log/list', method: 'get', params });
}

export function fetchGetIecCredentialList(params?: Record<string, any>) {
  return request({ url: '/iec/credential/list', method: 'get', params });
}

export function fetchGetIecPerformanceList() {
  return request({ url: '/iec/performance/list', method: 'get' });
}
