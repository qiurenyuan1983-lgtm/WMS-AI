import { MOCK_COMPANY, MOCK_WAREHOUSE, MOCK_WAREHOUSE_OPTIONS } from './common';
import { mockPage } from '../utils';

export const MOCK_COMPANIES = [{ id: MOCK_COMPANY.id, companyCode: MOCK_COMPANY.companyCode, companyName: MOCK_COMPANY.companyName, status: '0', createTime: '2026-01-01 00:00:00' }];

export const MOCK_WAREHOUSES = MOCK_WAREHOUSE_OPTIONS.map(w => ({ ...w, companyId: MOCK_COMPANY.id, companyName: MOCK_COMPANY.companyName, warehouseType: 'SELF_OP', countryCode: 'US', city: 'Los Angeles', isBonded: 0, createTime: '2026-01-01 00:00:00' }));

export const MOCK_SKUS = [
  { id: 30001, skuCode: 'SKU-DEMO-001', skuName: '演示商品 A', companyId: MOCK_COMPANY.id, status: '0', createTime: '2026-01-01 00:00:00' },
  { id: 30002, skuCode: 'SKU-DEMO-002', skuName: '演示商品 B', companyId: MOCK_COMPANY.id, status: '0', createTime: '2026-01-01 00:00:00' }
];

const t = '2026-05-01 10:00:00';
export const MOCK_CHANNELS = [{ id: 25001, channelCode: 'FCL', channelName: '整柜海运', status: '0', createTime: t }];
export const MOCK_BUSINESS_TYPES = [{ id: 25002, typeCode: 'DEVANNING', typeName: '拆柜业务', status: '0', createTime: t }];
export const MOCK_VAS = [{ id: 25003, serviceCode: 'LABEL', serviceName: '贴标服务', status: '0', createTime: t }];
export const MOCK_COUNTRIES = [{ id: 21001, code: 'US', nameEn: 'United States', isActive: 1, status: '0', createTime: t }];
export const MOCK_STATE_PROVINCES = [{ id: 21002, countryCode: 'US', code: 'CA', nameEn: 'California', status: '0', createTime: t }];
export const MOCK_CITIES = [{ id: 21003, countryCode: 'US', stateCode: 'CA', nameEn: 'Los Angeles', status: '0', createTime: t }];
export const MOCK_TIMEZONES = [{ id: 21004, tzCode: 'America/Los_Angeles', nameEn: 'Pacific Time', utcOffset: 'UTC-8', status: '0', createTime: t }];
export const MOCK_ZIP_CODES = [{ id: 23001, countryCode: 'US', stateCode: 'CA', cityName: 'Los Angeles', zip: '90001', createTime: t }];
export const MOCK_CURRENCIES = [{ id: 22001, code: 'USD', nameEn: 'US Dollar', symbol: '$', isBase: 1, status: '0', createTime: t }];
export const MOCK_EXCHANGE_RATES = [{ id: 22002, fromCurrency: 'USD', toCurrency: 'CNY', rate: 7.2456, effectiveDate: '2026-05-01', expiredDate: null, isCurrent: 1, createTime: t }];
export const MOCK_FEE_ITEMS = [{ id: 20003, feeCode: 'STORAGE', feeName: '仓储费', status: '0', createTime: t }];
export const MOCK_PORTS = [{ id: 23011, portCode: 'USLAX', nameEn: 'Los Angeles', countryCode: 'US', status: '0', createTime: t }];
export const MOCK_TERMINALS = [{ id: 23041, terminalCode: 'LAX-T1', terminalName: 'LA Terminal 1', portCode: 'USLAX', status: '0', createTime: t }];
export const MOCK_SHIPPING_LINES = [{ id: 23021, code: 'COSU', nameEn: 'COSCO', nameAbbr: 'COSCO', status: '0', createTime: t }];
export const MOCK_SHIPPING_ROUTES = [{ id: 23051, routeCode: 'AAS2', routeName: 'US West Express', shippingLineCode: 'COSU', originPortCode: 'CNSHA', destinationPortCode: 'USLAX', status: '0', createTime: t }];
export const MOCK_VESSELS = [{ id: 23061, vesselCode: 'VES-001', vesselName: 'Pacific Star', shippingLineCode: 'COSU', status: '0', createTime: t }];
export const MOCK_PLATFORMS = [{ id: 20061, platformCode: 'AMZ', platformName: 'Amazon', status: '0', createTime: t }];
export const MOCK_PLATFORM_ADDRESSES = [{ id: 20681, platformId: 20061, platformCode: 'AMZ', addressCode: 'LAX-FC', addressName: 'LA FC', status: '0', createTime: t }];

export function getCompanyList(params?: Record<string, any>) { return mockPage(MOCK_COMPANIES, params); }
export function getWarehouseList(params?: Record<string, any>) { let rows = [...MOCK_WAREHOUSES]; if (params?.status) rows = rows.filter(w => w.status === params.status); return mockPage(rows, params); }
export function getSkuList(params?: Record<string, any>) { return mockPage(MOCK_SKUS, params); }
export function getChannelList(params?: Record<string, any>) { return mockPage(MOCK_CHANNELS, params); }
export function getBusinessTypeList(params?: Record<string, any>) { return mockPage(MOCK_BUSINESS_TYPES, params); }
export function getVasList(params?: Record<string, any>) { return mockPage(MOCK_VAS, params); }
export function getCountryList(params?: Record<string, any>) { return mockPage(MOCK_COUNTRIES, params); }
export function getStateProvinceList(params?: Record<string, any>) { return mockPage(MOCK_STATE_PROVINCES, params); }
export function getCityList(params?: Record<string, any>) { return mockPage(MOCK_CITIES, params); }
export function getTimezoneList(params?: Record<string, any>) { return mockPage(MOCK_TIMEZONES, params); }
export function getZipCodeList(params?: Record<string, any>) { return mockPage(MOCK_ZIP_CODES, params); }
export function getCurrencyList(params?: Record<string, any>) { return mockPage(MOCK_CURRENCIES, params); }
export function getExchangeRateList(params?: Record<string, any>) { return mockPage(MOCK_EXCHANGE_RATES, params); }
export function getFeeItemList(params?: Record<string, any>) { return mockPage(MOCK_FEE_ITEMS, params); }
export function getPortList(params?: Record<string, any>) { return mockPage(MOCK_PORTS, params); }
export function getTerminalList(params?: Record<string, any>) { return mockPage(MOCK_TERMINALS, params); }
export function getShippingLineList(params?: Record<string, any>) { return mockPage(MOCK_SHIPPING_LINES, params); }
export function getShippingRouteList(params?: Record<string, any>) { return mockPage(MOCK_SHIPPING_ROUTES, params); }
export function getVesselList(params?: Record<string, any>) { return mockPage(MOCK_VESSELS, params); }
export function getPlatformList(params?: Record<string, any>) { return mockPage(MOCK_PLATFORMS, params); }
export function getPlatformAddressList(params?: Record<string, any>) { return mockPage(MOCK_PLATFORM_ADDRESSES, params); }
