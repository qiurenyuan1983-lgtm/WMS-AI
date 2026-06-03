import type { CustomAxiosRequestConfig } from '@sa/axios';
import { MOCK_CAPTCHA, MOCK_TENANT_LIST, MOCK_TOKEN, MOCK_USER_INFO } from './auth';
import { getAllMockDictTypes, getMockDictByType } from './dict-data';
import * as baseData from './data/base';
import * as wmsData from './data/wms';
import * as wmsPrototypeData from './data/wms-prototype';
import * as omsData from './data/oms';
import * as omsContainerCargo from './data/oms-container-cargo';
import * as inboundPlanData from './data/inbound-plan';
import * as ymsData from './data/yms';
import * as yardData from './data/yard';
import * as devanningWorkData from './data/devanning-work';
import * as systemData from './data/system';
import { MOCK_WAREHOUSE, MOCK_WAREHOUSE_OPTIONS } from './data/common';
import {
  getBody,
  getParams,
  mockDelay,
  mockEmptyPage,
  mockExportBlob,
  mockPage,
  mockTree,
  normalizeUrl,
  nextId
} from './utils';

type MockHandler = (config: CustomAxiosRequestConfig) => any | Promise<any>;

/** ??? URL ?????? */
const EXACT_HANDLERS: Record<string, MockHandler> = {
  // ---------- ??? ----------
  '/auth/login': () => MOCK_TOKEN,
  '/auth/logout': () => null,
  '/auth/code': () => MOCK_CAPTCHA,
  '/auth/tenant/list': () => MOCK_TENANT_LIST,
  '/auth/register': () => MOCK_TOKEN,
  '/auth/social/callback': () => MOCK_TOKEN,

  // ---------- ?? ----------
  '/system/user/getInfo': () => MOCK_USER_INFO,

  // ---------- ??? ----------
  '/system/dict/type/optionselect': () =>
    getAllMockDictTypes().map((t: string, i: number) => ({ dictId: i + 1, dictName: t, dictType: t })),
  '/system/dict/type/list': config => systemData.getDictTypeList(getParams(config)),
  '/system/dict/data/list': config => mockEmptyPage(getParams(config)),

  // ---------- ????????? ----------
  '/system/org-scope/companies': () => systemData.MOCK_ORG_SCOPE.companies,
  '/system/org-scope/warehouses': () => systemData.MOCK_ORG_SCOPE.warehouses,
  '/system/org-scope/current': () => systemData.MOCK_ORG_SCOPE.current,

  // ---------- Base MDM ----------
  '/base/company/list': config => baseData.getCompanyList(getParams(config)),
  '/base/warehouse/list': config => baseData.getWarehouseList(getParams(config)),
  '/base/sku/list': config => baseData.getSkuList(getParams(config)),
  '/base/channel/list': config => baseData.getChannelList(getParams(config)),
  '/base/business-type/list': config => baseData.getBusinessTypeList(getParams(config)),
  '/base/vas/list': config => baseData.getVasList(getParams(config)),
  '/base/country/list': config => baseData.getCountryList(getParams(config)),
  '/base/currency/list': config => baseData.getCurrencyList(getParams(config)),
  '/base/city/list': config => baseData.getCityList(getParams(config)),
  '/base/port/list': config => baseData.getPortList(getParams(config)),
  '/base/platform/list': config => baseData.getPlatformList(getParams(config)),
  '/base/platform-address/list': config => baseData.getPlatformAddressList(getParams(config)),
  '/base/vessel/list': config => baseData.getVesselList(getParams(config)),
  '/base/vessel/options': () => baseData.MOCK_VESSELS,
  '/base/terminal/list': config => baseData.getTerminalList(getParams(config)),
  '/base/shipping-line/list': config => baseData.getShippingLineList(getParams(config)),
  '/base/shipping-route/list': config => baseData.getShippingRouteList(getParams(config)),
  '/base/state-province/list': config => baseData.getStateProvinceList(getParams(config)),
  '/base/timezone/list': config => baseData.getTimezoneList(getParams(config)),
  '/base/zip-code/list': config => baseData.getZipCodeList(getParams(config)),
  '/base/zip-code/autocomplete': () => baseData.MOCK_ZIP_CODES,
  '/base/fee-item/list': config => baseData.getFeeItemList(getParams(config)),
  '/base/exchange-rate/list': config => baseData.getExchangeRateList(getParams(config)),
  '/base/exchange-rate/history': () => baseData.MOCK_EXCHANGE_RATES,

  // ---------- WMS ----------
  '/wms/zone/list': config => wmsData.getWmsZoneList(getParams(config)),
  '/wms/zone/options': () => wmsData.MOCK_WMS_ZONES,
  '/wms/location/list': config => wmsData.getWmsLocationList(getParams(config)),
  '/wms/location/options': () => wmsData.MOCK_WMS_LOCATIONS,
  '/wms/inventory/list': config => wmsData.getWmsInventoryList(getParams(config)),
  '/wms/inventory/stats': () => wmsData.getWmsInventoryStats(),
  '/wms/inventory/pallets': config => wmsData.getWmsPalletList(getParams(config)),
  '/wms/inventory/locks': config => mockEmptyPage(getParams(config)),
  '/wms/inventory/transactions': config => mockEmptyPage(getParams(config)),
  '/wms/inventory/visualization': () => wmsData.getWmsInventoryVisualization(),
  '/wms/devanning-order/list': config => wmsData.getWmsDevanningOrderList(getParams(config)),
  '/wms/devanning-order/status-count': config => wmsData.getWmsDevanningOrderStatusCount(getParams(config)),
  '/wms/devanning-order/detail': config => {
    const id = getParams(config).id;
    return wmsData.getWmsDevanningOrderDetail(id) ?? wmsPrototypeData.MOCK_DEVANNING_DETAIL;
  },
  '/wms/devanning-work/tasks': config => devanningWorkData.getDevanningWorkTasks(getParams(config)),
  '/wms/devanning-work/session': config => {
    const p = getParams(config);
    const session = devanningWorkData.getDevanningWorkSession(p.taskId, p.dockId);
    if (!session) throw new Error('\u672a\u627e\u5230\u62c6\u67dc\u4f5c\u4e1a\u6570\u636e');
    return session;
  },
  '/wms/inbound-order/list': config => wmsPrototypeData.getWmsPrototypeList('inbound-order', getParams(config)),
  '/wms/putaway-task/list': config => wmsPrototypeData.getWmsPrototypeList('putaway-task', getParams(config)),
  '/wms/putaway-task/lines': config => {
    const taskNo = String(getParams(config).taskNo || '');
    return wmsPrototypeData.MOCK_PUTAWAY_TASK_LINES[taskNo] || [];
  },
  '/wms/operation-order/list': config => wmsPrototypeData.getWmsPrototypeList('operation-order', getParams(config)),
  '/wms/vas-task/list': config => wmsPrototypeData.getWmsPrototypeList('vas-task', getParams(config)),
  '/wms/stock-prep-order/list': config => wmsPrototypeData.getWmsPrototypeList('stock-prep-order', getParams(config)),
  '/wms/outbound-order/list': config => wmsPrototypeData.getWmsPrototypeList('outbound-order', getParams(config)),
  '/wms/outbound-order/status/count': () => ({ CREATED: 1, DISPATCHED: 1, OUTBOUNDED: 1 }),

  // ---------- OMS ----------
  '/oms/container-order/list': config => omsData.getContainerOrderList(getParams(config)),
  '/oms/container-order/status-count': () => omsData.getContainerOrderStatusCount(),
  '/oms/cargo-order/list': config => omsData.getCargoOrderList(getParams(config)),
  '/oms/cargo-order/status-count': () => omsData.getCargoOrderStatusCount(),
  '/oms/outbound-order/list': config => omsData.getOutboundOrderList(getParams(config)),
  '/oms/outbound-order/status/count': () => ({ CREATED: 1, COMPLETED: 0 }),
  '/oms/outbound-pool/list': config => omsData.getCargoOrderList(getParams(config)),
  '/oms/outbound-pool/stats': () => omsData.getOutboundPoolStats(),
  '/oms/pre-outbound/list': config => mockEmptyPage(getParams(config)),
  '/wms/inbound-plan/list': config => mockEmptyPage(getParams(config)),
  '/wms/inbound-plan/get-or-create': config => inboundPlanData.getOrCreateInboundPlan(getParams(config)),
  '/oms/cargoGroupingRule/list': config => inboundPlanData.getCargoGroupingRuleList(getParams(config)),
  '/oms/cargoGroupingFieldMeta/list': () => [],
  '/oms/cargoGroupingFieldMeta/admin/list': () => [],

  // ---------- YMS ----------
  '/yms/dispatch/list': config => ymsData.getYmsDispatchList(getParams(config)),
  '/yms/dispatch/stats': () => ymsData.getYmsDispatchStats(),
  '/yms/dispatch/dock-board': () => ymsData.getYmsDockBoard(),
  '/yms/internal-task/board': () => ymsData.getYmsInternalTaskBoard(),
  '/yms/gate/list': config => mockEmptyPage(getParams(config)),
  '/yms/gate/in-yard': config => mockEmptyPage(getParams(config)),
  '/yms/gate/check-out/lookup': () => ({ checkInId: null, tasks: [] }),
  '/yms/gate/unified-check-in': () => ({ id: 90001, checkInNo: 'CI-DEMO-001', status: 'PASSED' }),
  '/yms/trailer/list': config => ymsData.getYmsTrailerList(getParams(config)),
  '/yms/container/list': config => ymsData.getYmsContainerList(getParams(config)),
  '/yms/internal-task/list': config => ymsData.getYmsInternalTaskList(getParams(config)),
  '/yms/yard-position/list': config => mockEmptyPage(getParams(config)),
  '/yms/yard-position/free': config => ymsData.getYmsFreeYardSlots(),
  '/yms/yard-inventory/list': config => mockEmptyPage(getParams(config)),
  '/yms/overview': () => ymsData.getYmsOverview(),
  '/yms/zone/list': config => mockEmptyPage(getParams(config)),
  '/yms/public/parking-slots': () => [],

  // ---------- Yard ----------
  '/yard/dock/list': config => yardData.getYardDockList(getParams(config)),
  '/yard/dock/free': config => yardData.getYardDockFree(getParams(config)?.warehouseId),
  '/yard/zone/list': config => yardData.getYardZoneList(getParams(config)),

  // ---------- System ----------
  '/system/user/list': config => systemData.getUserList(getParams(config)),
  '/system/role/list': config => systemData.getRoleList(getParams(config)),
  '/system/role/optionselect': () => systemData.MOCK_ROLES,
  '/system/dept/list': () => systemData.MOCK_DEPTS,
  '/system/menu/list': () => systemData.MOCK_MENUS,
  '/system/post/list': config => mockEmptyPage(getParams(config)),
  '/system/config/list': config => mockEmptyPage(getParams(config)),
  '/system/notice/list': config => mockEmptyPage(getParams(config)),
  '/system/tenant/list': config => mockEmptyPage(getParams(config)),
  '/system/tenant/package/list': config => mockEmptyPage(getParams(config)),
  '/system/client/list': config => mockEmptyPage(getParams(config)),
  '/system/social/list': config => mockEmptyPage(getParams(config)),

  // ---------- Monitor ----------
  '/monitor/operlog/list': config => mockEmptyPage(getParams(config)),
  '/monitor/logininfor/list': config => mockEmptyPage(getParams(config)),
  '/monitor/online/list': config => mockEmptyPage(getParams(config)),
  '/monitor/cache': () => ({ info: {}, dbSize: 0, commandStats: [] }),

  // ---------- Tool / Demo ----------
  '/tool/gen/list': config => mockEmptyPage(getParams(config)),
  '/tool/gen/db/list': config => mockEmptyPage(getParams(config)),
  '/demo/demo/list': config => mockEmptyPage(getParams(config)),
  '/demo/tree/list': () => mockTree([]),

  // ---------- Resource ----------
  '/resource/oss/list': config => mockEmptyPage(getParams(config)),
  '/resource/oss/config/list': config => mockEmptyPage(getParams(config)),
  '/resource/oss/upload': () => ({ url: 'https://mock.local/demo.png', fileName: 'demo.png', ossId: nextId() })
};

function matchPattern(url: string, config: CustomAxiosRequestConfig): any {
  const method = (config.method || 'get').toLowerCase();
  const params = getParams(config);
  const body = getBody(config);

  const devanningAction = url.match(
    /^\/wms\/devanning-order\/(\d+)\/(confirm-pickup|confirm-arrival|start-devanning|complete-devanning|mark-exception|clear-exception|cancel)$/
  );
  if (devanningAction && method === 'put') {
    const result = wmsData.applyDevanningAction(devanningAction[1], devanningAction[2]);
    if (!result.ok) {
      throw new Error(result.msg);
    }
    return result;
  }

  const inboundPlanPreviewAuto = url.match(/^\/wms\/inbound-plan\/(\d+)\/preview-auto-group$/);
  if (inboundPlanPreviewAuto && method === 'post') {
    return inboundPlanData.previewAutoGroup(inboundPlanPreviewAuto[1]);
  }

  const inboundPlanPreviewRule = url.match(/^\/wms\/inbound-plan\/(\d+)\/preview-apply-rule$/);
  if (inboundPlanPreviewRule && method === 'post') {
    return inboundPlanData.previewApplyRule(inboundPlanPreviewRule[1], params.ruleId ?? body?.ruleId);
  }

  const inboundPlanIdAction = url.match(/^\/wms\/inbound-plan\/(\d+)\/(start-work|complete|cancel|save-group|auto-group|apply-rule)$/);
  if (inboundPlanIdAction && method === 'post') {
    return true;
  }

  if (method === 'get' && url.match(/^\/wms\/inbound-plan\/\d+$/)) {
    const planId = url.split('/').pop();
    const plan = inboundPlanData.getOrCreateInboundPlan({
      containerOrderId: '70001',
      warehouseId: MOCK_WAREHOUSE.id
    });
    if (plan && String(plan.id) === String(planId)) return plan;
    return inboundPlanData.getOrCreateInboundPlan({ containerOrderId: '70002', warehouseId: MOCK_WAREHOUSE.id });
  }

  if (method === 'put' && url === '/wms/inbound-plan/item') {
    return true;
  }

  if (method === 'put' && url === '/wms/devanning-order' && body?.id) {
    const row = wmsData.MOCK_WMS_DEVANNING_ORDERS.find(d => d.id === Number(body.id));
    if (row) Object.assign(row, body);
    return true;
  }

  if (method === 'post' && url === '/wms/devanning-order') {
    return true;
  }

  if (method === 'post' && url === '/wms/devanning-work/receive/order') {
    const session = devanningWorkData.receiveByOrder(body?.taskId, {
      groupCode: String(body?.groupCode || ''),
      cargoOrderId: Number(body?.cargoOrderId),
      qty: Number(body?.qty || 0)
    });
    if (!session) throw new Error('receive failed');
    return session;
  }

  if (method === 'post' && url === '/wms/devanning-work/palletize') {
    const items = Array.isArray(body?.items)
      ? body.items.map((i: any) => ({
          cargoOrderId: Number(i.cargoOrderId),
          qty: Number(i.qty)
        }))
      : [];
    const session = devanningWorkData.palletizeSelection(body?.taskId, {
      groupCode: String(body?.groupCode || ''),
      items,
      palletNo: body?.palletNo
    });
    if (!session) throw new Error('\u6253\u677f\u5931\u8d25');
    return session;
  }

  if (method === 'post' && url === '/wms/devanning-work/pallet/create') {
    const session = devanningWorkData.createWorkPallet(body?.taskId, {
      groupCode: String(body?.groupCode || ''),
      cargoOrderId: Number(body?.cargoOrderId),
      boxQty: Number(body?.boxQty || 0),
      palletNo: body?.palletNo
    });
    if (!session) throw new Error('pallet create failed');
    return session;
  }

  const devanningPalletDelete = url.match(/^\/wms\/devanning-work\/pallet\/(\d+)$/);
  if (devanningPalletDelete && method === 'delete') {
    const session = devanningWorkData.deleteWorkPallet(
      getParams(config).taskId ?? body?.taskId,
      Number(devanningPalletDelete[1])
    );
    if (!session) throw new Error('\u5220\u9664\u5361\u677f\u5931\u8d25');
    return session;
  }

  if (method === 'post' && url === '/wms/devanning-work/scan/resolve') {
    return devanningWorkData.resolveDevanningScan(body?.taskId, String(body?.scanCode || ''));
  }

  if (method === 'post' && url === '/wms/devanning-work/receive/box') {
    const taskId = body?.taskId;
    const session = devanningWorkData.receiveByBox(taskId, {
      scanCode: String(body?.scanCode || ''),
      qty: body?.qty,
      groupCode: body?.groupCode ? String(body.groupCode) : undefined
    });
    if (!session) throw new Error('\u6309\u7bb1\u626b\u7801\u6536\u8d27\u5931\u8d25');
    return session;
  }

  if (method === 'post' && url === '/wms/devanning-work/receive/pallet') {
    const session = devanningWorkData.receiveByPallet(body?.taskId, {
      palletNo: String(body?.palletNo || ''),
      groupCode: body?.groupCode ? String(body.groupCode) : undefined,
      boxQty: body?.boxQty != null ? Number(body.boxQty) : undefined
    });
    if (!session) throw new Error('\u6309\u677f\u626b\u7801\u6536\u8d27\u5931\u8d25');
    return session;
  }

  if (method === 'post' && url === '/wms/devanning-work/start') {
    const session = devanningWorkData.startDevanningWork(body?.taskId);
    if (!session) throw new Error('start failed');
    return session;
  }

  if (method === 'post' && url === '/wms/devanning-work/complete') {
    const session = devanningWorkData.completeDevanningWork(body?.taskId);
    if (!session) throw new Error('complete failed');
    return session;
  }

  // ???????
  const dictMatch = url.match(/^\/system\/dict\/data\/type\/(.+)$/);
  if (dictMatch) {
    return getMockDictByType(dictMatch[1]);
  }

  // ?????? key
  const configKeyMatch = url.match(/^\/system\/config\/configKey\/(.+)$/);
  if (configKeyMatch) {
    return '';
  }

  // ?????? GET /module/resource/:id
  const detailMatch = url.match(/^\/([\w-]+)\/([\w-]+)\/(\d+[\w,-]*)$/);
  if (detailMatch && method === 'get') {
    const id = detailMatch[3].split(',')[0];
    return findDetailMock(url, id) ?? { id, remark: 'Mock \u6570\u636e' };
  }

  // ????????? GET
  if (method === 'get' && (url.includes('/items') || url.includes('/attachments') || url.includes('/logs') || url.includes('/shipments') || url.includes('/sku-items') || url.includes('/node-traces') || url.includes('/change-log') || url.includes('/cargo-orders'))) {
    return [];
  }

  // ?????
  if (url.includes('status-count') || url.includes('status/count')) {
    return {};
  }

  // stats
  if (url.endsWith('/stats')) {
    return {};
  }

  // board ?????????????????
  if (url.endsWith('/board')) {
    if (url.startsWith('/yms/internal-task/')) {
      return ymsData.getYmsInternalTaskBoard();
    }
    return [];
  }

  // options / free / optionselect / treeselect
  if (url === '/yms/yard-position/free') {
    return ymsData.getYmsFreeYardSlots();
  }

  if (url.includes('/options') || url.endsWith('/free') || url.includes('optionselect') || url.includes('treeselect')) {
    if (url === '/yard/dock/free') {
      return yardData.getYardDockFree(getParams(config)?.warehouseId);
    }
    return [];
  }

  // ???????
  if (url.endsWith('/list') || url.includes('/list/')) {
    return mockEmptyPage(params);
  }

  // ???????
  if (url.endsWith('/export')) {
    return mockExportBlob();
  }

  // POST/PUT/DELETE ????????????
  if (['post', 'put', 'delete', 'patch'].includes(method)) {
    if (url.includes('/upload')) {
      return { url: 'https://mock.local/file/demo.pdf', fileName: 'demo.pdf', ossId: nextId() };
    }
    return body?.id ?? true;
  }

  return null;
}

function findDetailMock(url: string, id: string) {
  const numId = Number(id);
  if (url.startsWith('/wms/zone/')) return wmsData.MOCK_WMS_ZONES.find(z => z.id === numId);
  if (url.startsWith('/wms/location/')) return wmsData.MOCK_WMS_LOCATIONS.find(l => l.id === numId);
  if (url.startsWith('/wms/inventory/') && !url.includes('pallets')) return wmsData.MOCK_WMS_INVENTORY.find(i => i.id === numId);
  if (url.startsWith('/wms/inbound-plan/')) {
    return inboundPlanData.getOrCreateInboundPlan({ containerOrderId: '70001', warehouseId: MOCK_WAREHOUSE.id });
  }
  if (url.startsWith('/wms/devanning-order/')) {
    return wmsData.getWmsDevanningOrderDetail(id) ?? wmsData.MOCK_WMS_DEVANNING_ORDERS.find(d => d.id === numId);
  }
  if (url.startsWith('/oms/container-order/')) {
    return omsContainerCargo.getContainerOrderDetail(id) ?? omsData.MOCK_CONTAINER_ORDERS.find(c => c.id === numId);
  }
  if (url.startsWith('/oms/cargo-order/')) {
    return omsContainerCargo.getCargoOrderDetail(id) ?? omsData.MOCK_CARGO_ORDERS.find(c => c.id === numId);
  }
  if (url.startsWith('/oms/outbound-order/')) return omsData.MOCK_OUTBOUND_ORDERS.find(o => o.id === numId);
  if (url.startsWith('/yms/dispatch/')) return ymsData.MOCK_YMS_DISPATCH.find(t => t.id === numId);
  if (url.startsWith('/yms/internal-task/')) return ymsData.MOCK_YMS_INTERNAL_TASKS.find(t => t.id === numId);
  if (url.startsWith('/yms/trailer/')) return ymsData.MOCK_YMS_TRAILERS.find(t => t.id === numId);
  if (url.startsWith('/yms/container/')) return ymsData.MOCK_YMS_CONTAINERS.find(t => t.id === numId);
  if (url.startsWith('/yard/dock/')) return yardData.MOCK_YARD_DOCKS.find(d => d.id === numId);
  if (url.startsWith('/yard/zone/')) return yardData.MOCK_YARD_ZONES.find(z => z.id === numId);
  if (url.startsWith('/base/fee-item/')) return baseData.MOCK_FEE_ITEMS.find(f => f.id === numId);
  if (url.startsWith('/base/exchange-rate/')) return baseData.MOCK_EXCHANGE_RATES.find(r => r.id === numId);
  if (url.startsWith('/base/warehouse/')) return MOCK_WAREHOUSE_OPTIONS.find(w => w.id === numId);
  if (url.startsWith('/base/company/')) return baseData.MOCK_COMPANIES.find(c => c.id === numId);
  return null;
}

/**
 * ???? Mock ?????prototype ??????? HTTP ????
 */
export async function resolveMockResponse(config: CustomAxiosRequestConfig): Promise<any> {
  await mockDelay();

  const url = normalizeUrl(config.url);
  const method = (config.method || 'get').toLowerCase();

  // ??????????
  const exactHandler = EXACT_HANDLERS[url];
  if (exactHandler) {
    return exactHandler(config);
  }

  // ?????
  const patternResult = matchPattern(url, config);
  if (patternResult !== null) {
    return patternResult;
  }

  // ?????? / ???????
  if (['post', 'put', 'delete', 'patch'].includes(method)) {
    return getBody(config)?.id ?? true;
  }

  if (method === 'get') {
    if (url.endsWith('/list')) {
      return mockEmptyPage(getParams(config));
    }
    return {};
  }

  // eslint-disable-next-line no-console
  console.warn(`[Mock] \u672a\u5339\u914d\u7684\u8bf7\u6c42: ${method.toUpperCase()} ${url}`);
  return null;
}
