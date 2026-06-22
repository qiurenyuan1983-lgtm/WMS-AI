import { request } from '@/service/request';

const BASE = '/print';

export function fetchGetPrintWorkbench() {
  return request<Api.Print.WorkbenchStats>({ url: `${BASE}/workbench`, method: 'get' });
}

export function fetchGetPrintTemplateList(params?: Api.Print.TemplateSearchParams) {
  return request<Api.Common.PaginatingQueryRecord<Api.Print.PrintTemplate>>({
    url: `${BASE}/template/list`,
    method: 'get',
    params
  });
}

export function fetchGetPrintTaskList(params?: Api.Print.TaskSearchParams) {
  return request<Api.Common.PaginatingQueryRecord<Api.Print.PrintTask>>({
    url: `${BASE}/task/list`,
    method: 'get',
    params
  });
}

export function fetchGetPrintRecordList(params?: Api.Print.RecordSearchParams) {
  return request<Api.Common.PaginatingQueryRecord<Api.Print.PrintRecord>>({
    url: `${BASE}/record/list`,
    method: 'get',
    params
  });
}

export function fetchGetPrintPrinterList(params?: Api.Print.PrinterSearchParams) {
  return request<Api.Common.PaginatingQueryRecord<Api.Print.Printer>>({
    url: `${BASE}/printer/list`,
    method: 'get',
    params
  });
}

export function fetchGetPrintTemplateVersionList(params?: Api.Print.VersionSearchParams) {
  return request<Api.Common.PaginatingQueryRecord<Api.Print.TemplateVersion>>({
    url: `${BASE}/templateVersion/list`,
    method: 'get',
    params
  });
}

export function fetchGetPrintRuleList(params?: Api.Print.RuleSearchParams) {
  return request<Api.Common.PaginatingQueryRecord<Api.Print.PrintRule>>({
    url: `${BASE}/rule/list`,
    method: 'get',
    params
  });
}

export function fetchGetPrintTemplate(id: CommonType.IdType) {
  return request<Api.Print.PrintTemplate>({
    url: `${BASE}/template/get`,
    method: 'get',
    params: { id }
  });
}

export function fetchPublishPrintTemplate(data: Api.Print.PublishTemplatePayload) {
  return request<Api.Print.PrintTemplate>({
    url: `${BASE}/template/publish`,
    method: 'post',
    data
  });
}

export function fetchSubmitPrintTemplateTest(data: Api.Print.SubmitTemplateTestPayload) {
  return request<Api.Print.PrintTemplate>({
    url: `${BASE}/template/submitTest`,
    method: 'post',
    data
  });
}

export function fetchSavePrintRule(data: Api.Print.SavePrintRulePayload) {
  return request<Api.Print.PrintRule>({
    url: `${BASE}/rule/save`,
    method: 'post',
    data
  });
}
