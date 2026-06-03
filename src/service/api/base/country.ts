import { request } from '@/service/request';

/** èŽ·å–å›½å®¶åˆ—è¡¨ */
export function fetchGetCountryList(params?: Api.Base.CountrySearchParams) {
  return request<Api.Base.CountryList>({
    url: '/base/country/list',
    method: 'get',
    params
  });
}

/** èŽ·å–å›½å®¶è¯¦æƒ… */
export function fetchGetCountryDetail(id: CommonType.IdType) {
  return request<Api.Base.Country>({
    url: `/base/country/${id}`,
    method: 'get'
  });
}

/** æ–°å¢žå›½å®¶ */
export function fetchCreateCountry(data: Api.Base.CountryOperateParams) {
  return request<null>({
    url: '/base/country',
    method: 'post',
    data
  });
}

/** ä¿®æ”¹å›½å®¶ */
export function fetchUpdateCountry(data: Api.Base.CountryOperateParams) {
  return request<null>({
    url: '/base/country',
    method: 'put',
    data
  });
}

/** æ‰¹é‡åˆ é™¤å›½å®¶ */
export function fetchBatchDeleteCountry(ids: CommonType.IdType[]) {
  return request<null>({
    url: `/base/country/${ids.join(',')}`,
    method: 'delete'
  });
}

/** å¯¼å‡ºå›½å®¶æ•°æ® */
export function fetchExportCountry(params?: Api.Base.CountrySearchParams) {
  return request<Blob>({
    url: '/base/country/export',
    method: 'post',
    params,
    responseType: 'blob' as any
  });
}
