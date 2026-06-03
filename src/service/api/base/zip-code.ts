import { request } from '@/service/request';

export function fetchGetZipCodeList(params?: Api.Base.ZipCodeSearchParams) {
  return request<Api.Base.ZipCodeList>({ url: '/base/zip-code/list', method: 'get', params });
}
export function fetchGetZipCodeDetail(id: CommonType.IdType) {
  return request<Api.Base.ZipCode>({ url: `/base/zip-code/${id}`, method: 'get' });
}
export function fetchCreateZipCode(data: Api.Base.ZipCodeOperateParams) {
  return request<null>({ url: '/base/zip-code', method: 'post', data });
}
export function fetchUpdateZipCode(data: Api.Base.ZipCodeOperateParams) {
  return request<null>({ url: '/base/zip-code', method: 'put', data });
}
export function fetchBatchDeleteZipCode(ids: CommonType.IdType[]) {
  return request<null>({ url: `/base/zip-code/${ids.join(',')}`, method: 'delete' });
}
export function fetchExportZipCode(params?: Api.Base.ZipCodeSearchParams) {
  return request<Blob>({ url: '/base/zip-code/export', method: 'post', params, responseType: 'blob' as any });
}
/** é‚®ç¼–è‡ªåŠ¨è¡¥å…¨ï¼šè¾“å…¥å›½å®¶+é‚®ç¼–ï¼Œè¿”å›žå·ž/çœä»£ç å’ŒåŸŽå¸‚åï¼›æ— åŒ¹é…è¿”å›ž null */
export function fetchZipCodeAutocomplete(countryCode: string, zip: string) {
  return request<Api.Base.ZipCodeAutocomplete>({ url: '/base/zip-code/autocomplete', method: 'get', params: { countryCode, zip } });
}
