import { request } from '@/service/request';

const BASE = '/system/themeConfig';

export function fetchGetThemeConfigList(params?: Api.System.ThemeConfigSearchParams) {
  return request<Api.System.ThemeConfigList>({ url: `${BASE}/list`, method: 'get', params });
}

export function fetchGetThemeConfigDetail(themeId: CommonType.IdType) {
  return request<Api.System.ThemeConfig>({ url: `${BASE}/${themeId}`, method: 'get' });
}

export function fetchGetDefaultThemeConfig() {
  return request<Api.System.ThemeConfig>({ url: `${BASE}/default`, method: 'get' });
}

export function fetchCreateThemeConfig(data: Api.System.ThemeConfigOperateParams) {
  return request<Api.System.ThemeConfig>({ url: BASE, method: 'post', data });
}

export function fetchUpdateThemeConfig(data: Api.System.ThemeConfigOperateParams) {
  return request<null>({ url: BASE, method: 'put', data });
}

export function fetchDeleteThemeConfig(ids: string) {
  return request<null>({ url: `${BASE}/${ids}`, method: 'delete' });
}

export function fetchSetDefaultThemeConfig(themeId: CommonType.IdType) {
  return request<null>({ url: `${BASE}/${themeId}/default`, method: 'put' });
}

export function fetchCopyThemeConfig(themeId: CommonType.IdType) {
  return request<Api.System.ThemeConfig>({ url: `${BASE}/${themeId}/copy`, method: 'post' });
}

export function fetchBatchThemeConfigStatus(data: Api.System.ThemeConfigBatchStatusParams) {
  return request<null>({ url: `${BASE}/batchStatus`, method: 'put', data });
}

export function fetchPublishThemeConfig(data: Api.System.ThemeConfigOperateParams) {
  return request<Api.System.ThemeConfig>({ url: `${BASE}/publish`, method: 'put', data });
}

export function fetchSaveThemeDraft(data: Api.System.ThemeConfigOperateParams) {
  return request<Api.System.ThemeConfig>({ url: `${BASE}/draft`, method: 'put', data });
}
