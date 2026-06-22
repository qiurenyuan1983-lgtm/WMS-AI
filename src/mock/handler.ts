import type { CustomAxiosRequestConfig } from '@sa/axios';
import { MOCK_CAPTCHA, MOCK_TENANT_LIST, MOCK_TOKEN, MOCK_USER_INFO } from './auth';
import { getAllMockDictTypes, getMockDictByType } from './dict-data';
import * as baseData from './data/base';
import * as wmsData from './data/wms';
import * as wmsPrototypeData from './data/wms-prototype';
import * as omsData from './data/oms';
import * as omsPlatformAppointmentData from './data/oms-platform-appointment';
import * as omsOrderWorkbenchData from './data/oms-order-workbench';
import * as omsTripRecommendData from './data/oms-trip-recommend';
import * as omsSupplierData from './data/oms-supplier';
import * as omsSupplierContainerOpData from './data/oms-supplier-container-op';
import * as omsContainerCargo from './data/oms-container-cargo';
import * as omsLoosePalletData from './data/oms-loose-pallet';
import * as inboundPlanData from './data/inbound-plan';
import * as businessRuleData from './data/business-rule';
import * as approvalFlowData from './data/approval-flow';
import * as zoneRuleData from './data/zone-rule';
import * as platformWarehouseData from './data/platform-warehouse';
import * as printCenterData from './data/print-center';
import * as commCenterData from './data/comm-center';
import * as iecData from './data/iec';
import * as ymsData from './data/yms';
import * as tmsData from './data/tms';
import * as tmsDispatchWorkbench from './data/tms-dispatch-workbench';
import * as tmsSupplierTaskData from './data/tms-supplier-task';
import * as yardData from './data/yard';
import * as devanningWorkData from './data/devanning-work';
import * as wmsTransferWorkbenchData from './data/wms-transfer-workbench';
import * as wmsOutboundMgmtData from './data/wms-outbound-mgmt';
import * as wmsPalletInventoryData from './data/wms-pallet-inventory';
import * as monitorLoginLogData from './data/monitor-login-log';
import * as monitorRedisCacheData from './data/monitor-redis-cache';
import * as monitorOnlineUserData from './data/monitor-online-user';
import * as monitorOperLogData from './data/monitor-oper-log';
import * as systemData from './data/system';
import * as systemThemeConfigData from './data/system-theme-config';
import * as pdaData from './data/pda';
import * as pdaDevanningData from './data/pda-devanning';
import * as portalData from './data/portal';
import * as portalDashboardData from './data/portal-dashboard';
import * as portalTransferOpsData from './data/portal-transfer-ops';
import * as portalFinanceData from './data/portal-finance';
import * as portalFilesData from './data/portal-files';
import * as portalInventoryData from './data/portal-inventory';
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

  // ---------- PDA 作业端 ----------
  '/pda/home/summary': () => pdaData.getPdaHomeSummary(),
  '/pda/inbound/scan-pallet': config => {
    const params = getParams(config);
    const info = pdaData.scanInboundPallet(String(params.labelNo || ''), String(params.biz || ''));
    if (!info) throw new Error('卡板贴不存在，请重新扫描');
    return info;
  },
  '/pda/inbound/confirm': config => pdaData.confirmInbound(getBody(config) || {}),
  '/pda/outbound/trips': config => pdaData.getOutboundTripList(String(getParams(config).biz || '')),
  '/pda/outbound/load': config => pdaData.confirmOutboundLoad(getBody(config) || {}),
  '/pda/outbound/upload-photo': config => pdaData.uploadOutboundSitePhoto(getBody(config) || {}),
  '/pda/outbound/exception': config => pdaData.reportOutboundException(getBody(config) || {}),
  '/pda/outbound/finish': config => pdaData.finishOutbound(getBody(config) || {}),
  '/pda/devanning/push-instructions': config =>
    pdaDevanningData.getDevanningPushInstructions(String(getParams(config).biz || 'transfer')),
  '/pda/devanning/tasks': config => {
    const params = getParams(config);
    return pdaDevanningData.getDevanningTaskList(String(params.biz || 'transfer'), {
      keyword: params.keyword ? String(params.keyword) : null,
      taskId: params.taskId ? String(params.taskId) : null
    });
  },
  '/pda/devanning/scan-container': config => pdaDevanningData.scanDevanningContainer(String(getBody(config)?.containerNo || ''), String(getBody(config)?.biz || 'transfer')),
  '/pda/devanning/start': config => pdaDevanningData.startDevanningTask(String(getBody(config)?.taskId || '')),
  '/pda/devanning/create-pallet': config => pdaDevanningData.createDevanningPallet(getBody(config) || {}),
  '/pda/devanning/print-pallet': config => {
    const body = getBody(config) || {};
    return pdaDevanningData.printDevanningPallet(String(body.taskId || ''), String(body.palletNo || ''));
  },
  '/pda/devanning/inbound-pallet': config => pdaDevanningData.inboundDevanningPallet(getBody(config) || {}),
  '/pda/devanning/photo-pallet': config => pdaDevanningData.captureDevanningPhoto(getBody(config) || {}),
  '/pda/devanning/finish': config => pdaDevanningData.finishDevanningTask(getBody(config) || {}),
  '/pda/devanning/upload-photo': config => pdaDevanningData.uploadDevanningSitePhoto(getBody(config) || {}),
  '/pda/devanning/exception': config => pdaDevanningData.reportDevanningException(getBody(config) || {}),

  // ---------- ??? ----------
  '/system/dict/type/optionselect': () =>
    getAllMockDictTypes().map((t: string, i: number) => ({ dictId: i + 1, dictName: t, dictType: t })),
  '/system/dict/type/list': config => systemData.getDictTypeList(getParams(config)),
  '/system/dict/data/list': config => systemData.getDictDataList(getParams(config)),

  '/system/user/deptTree': () => systemData.getDeptTreeSelect(),
  '/system/user/optionselect': () => systemData.MOCK_USERS,
  '/system/dept/list': config => systemData.getDeptList(getParams(config)),
  '/system/dept/optionselect': () => systemData.getDeptTreeSelect(),
  '/system/menu/treeselect': () => systemData.getMenuTreeSelect(),
  '/system/post/deptTree': () => systemData.getDeptTreeSelect(),
  '/system/post/optionselect': () => systemData.MOCK_POSTS,
  '/system/tenant/package/selectList': () => systemData.MOCK_TENANT_PACKAGES,
  '/system/role/authUser/allocatedList': config => systemData.getRoleAllocatedUsers(getParams(config)),

  '/system/post/list': config => systemData.getPostList(getParams(config)),
  '/system/config/list': config => systemData.getConfigList(getParams(config)),
  '/system/notice/list': config => systemData.getNoticeList(getParams(config)),
  '/system/tenant/list': config => systemData.getTenantList(getParams(config)),
  '/system/tenant/package/list': config => systemData.getTenantPackageList(getParams(config)),
  '/system/client/list': config => systemData.getClientList(getParams(config)),
  '/resource/oss/list': config => systemData.getOssList(getParams(config)),
  '/resource/oss/config/list': config => systemData.getOssConfigList(getParams(config)),
  '/system/themeConfig/list': config => systemThemeConfigData.getThemeConfigList(getParams(config)),
  '/system/themeConfig/default': () => systemThemeConfigData.getDefaultThemeConfig(),

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
  '/wms/zone/options': config => wmsData.getWmsZoneOptions(getParams(config)),
  '/wms/location/list': config => wmsData.getWmsLocationList(getParams(config)),
  '/wms/location/stats': config => wmsData.getWmsLocationStats(getParams(config)),
  '/wms/location/options': () => wmsData.MOCK_WMS_LOCATIONS,
  '/wms/inventory/list': config => wmsData.getWmsInventoryList(getParams(config)),
  '/wms/inventory/stats': () => wmsData.getWmsInventoryStats(),
  '/wms/inventory/pallets': config => wmsData.getWmsPalletList(getParams(config)),
  '/wms/pallet-inventory/stats': config => wmsPalletInventoryData.getPalletInventoryStats(getParams(config)),
  '/wms/pallet-inventory/list': config => wmsPalletInventoryData.getPalletInventoryList(getParams(config)),
  '/wms/pallet-inventory/action': config =>
    wmsPalletInventoryData.palletInventoryAction(getBody(config) as Api.Wms.PalletInventoryActionPayload),
  '/wms/inventory/locks': config => mockEmptyPage(getParams(config)),
  '/wms/inventory/transactions': config => mockEmptyPage(getParams(config)),
  '/wms/inventory/visualization': config => wmsData.getWmsInventoryVisualization(getParams(config)),
  '/wms/transfer-workbench/stats': () => wmsTransferWorkbenchData.getTransferWorkbenchStats(),
  '/wms/transfer-workbench/instructions': config => wmsTransferWorkbenchData.getTransferInstructionList(getParams(config)),
  '/wms/transfer-workbench/orders': config => wmsTransferWorkbenchData.getTransferOrderGroupList(getParams(config)),
  '/wms/transfer-workbench/order-lookup': config => wmsTransferWorkbenchData.lookupTransferOrder(getParams(config).orderNo),
  '/wms/outbound-mgmt/trip-plan/stats': () => wmsOutboundMgmtData.getTripOutboundPlanStats(),
  '/wms/outbound-mgmt/trip-plan/list': config => wmsOutboundMgmtData.getTripOutboundPlanList(getParams(config)),
  '/wms/outbound-mgmt/checkin/stats': () => wmsOutboundMgmtData.getDriverCheckinStats(),
  '/wms/outbound-mgmt/checkin/list': config => wmsOutboundMgmtData.getDriverCheckinList(getParams(config)),
  '/wms/outbound-mgmt/dock/overview': () => wmsOutboundMgmtData.getDockScheduleOverview(),
  '/wms/outbound-mgmt/dock/waiting': config => wmsOutboundMgmtData.getDockWaitingTrips(getParams(config)),
  '/wms/outbound-mgmt/dock/slots': () => wmsOutboundMgmtData.getDockSlotList(),
  '/wms/outbound-mgmt/dock/logs': config => wmsOutboundMgmtData.getDockAssignLogs(getParams(config)),
  '/wms/devanning-order/list': config => wmsData.getWmsDevanningOrderList(getParams(config)),
  '/wms/devanning-order/status-count': config => wmsData.getWmsDevanningOrderStatusCount(getParams(config)),
  '/wms/devanning-order/detail': config => {
    const id = getParams(config).id;
    const detail = wmsData.getWmsDevanningOrderDetail(id) ?? wmsPrototypeData.MOCK_DEVANNING_DETAIL;
    if (detail && detail.id != null) {
      detail.pallets = devanningWorkData.buildDevanningDetailPallets(
        detail.id,
        detail.containerNo || '',
        detail.cargoOrders || []
      );
    }
    return detail;
  },
  '/wms/devanning-work/tasks': config => devanningWorkData.getDevanningWorkTasks(getParams(config)),
  '/wms/devanning-work/session': config => {
    const p = getParams(config);
    const session = devanningWorkData.getDevanningWorkSession(p.taskId, p.dockId);
    if (!session) throw new Error('\u672a\u627e\u5230\u62c6\u67dc\u4f5c\u4e1a\u6570\u636e');
    return session;
  },
  '/wms/operation-order/list': config => wmsPrototypeData.getWmsPrototypeList('operation-order', getParams(config)),
  '/wms/vas-task/list': config => wmsPrototypeData.getWmsPrototypeList('vas-task', getParams(config)),
  '/wms/stock-prep-order/list': config => wmsPrototypeData.getWmsPrototypeList('stock-prep-order', getParams(config)),
  '/wms/outbound-order/list': config => wmsPrototypeData.getWmsPrototypeList('outbound-order', getParams(config)),
  '/wms/outbound-order/status/count': () => ({ CREATED: 1, DISPATCHED: 1, OUTBOUNDED: 1 }),

  // ---------- OMS ----------
  '/oms/container-order/list': config => omsData.getContainerOrderList(getParams(config)),
  '/oms/container-order/status-count': config => omsData.getContainerOrderStatusCount(getParams(config)),
  '/oms/cargo-order/list': config => omsData.getCargoOrderList(getParams(config)),
  '/oms/cargo-order/status-count': () => omsData.getCargoOrderStatusCount(),
  '/oms/outbound-order/list': config => omsData.getOutboundOrderList(getParams(config)),
  '/oms/outbound-order/status/count': () => omsData.getOutboundOrderStatusCount(),
  '/oms/outbound-pool/list': config => omsData.getCargoOrderList(getParams(config)),
  '/oms/outbound-pool/stats': config => omsData.getOutboundPoolStats(getParams(config)),
  '/oms/pre-outbound/list': config => mockEmptyPage(getParams(config)),
  '/oms/platform-appointment/list': config => omsPlatformAppointmentData.getPlatformAppointmentList(getParams(config)),
  '/oms/order-workbench/list': config => omsOrderWorkbenchData.getOrderWorkbenchList(getParams(config)),
  '/oms/order-workbench/stats': () => omsOrderWorkbenchData.getOrderWorkbenchStats(),
  '/oms/trip-recommend/stats': config => omsTripRecommendData.getTripRecommendStats(getParams(config)),
  '/oms/trip-recommend/summary/list': config => omsTripRecommendData.getTripRecommendSummaryList(getParams(config)),
  '/oms/trip-recommend/orders': config => omsTripRecommendData.getTripRecommendOrders(getParams(config)),
  '/tms/supplier/list': config => omsSupplierData.getOmsSupplierList(getParams(config)),
  '/tms/supplier/quote/list': config => omsSupplierData.getOmsSupplierQuoteList(getParams(config)),
  '/tms/supplier/quote/recommend': config => omsSupplierData.recommendOmsSupplierByQuote(getParams(config)),
  '/tms/supplier/account/list': config => omsSupplierData.getOmsSupplierAccountList(getParams(config)),
  '/tms/supplier/bill/list': config => omsSupplierData.getOmsSupplierBillList(getParams(config)),
  '/tms/supplier/vehicle/list': config => omsSupplierData.getOmsSupplierVehicleList(getParams(config)),
  '/tms/supplier/driver/list': config => omsSupplierData.getOmsSupplierDriverList(getParams(config)),
  '/tms/supplier/equipment/list': config => omsSupplierData.getOmsSupplierEquipmentList(getParams(config)),
  '/tms/supplier/kpi/list': config => omsSupplierData.getOmsSupplierKpiList(getParams(config)),
  '/tms/supplier/kpi/summary': () => omsSupplierData.getOmsSupplierKpiSummary(),
  '/tms/supplier/container-op/list': config => omsSupplierContainerOpData.getSupplierContainerOpList(getParams(config)),
  '/tms/supplier/container-op/status-count': config =>
    omsSupplierContainerOpData.getSupplierContainerOpStatusCount(getParams(config)),
  '/tms/supplier-task/list': config => tmsSupplierTaskData.getSupplierTaskList(getParams(config)),
  '/tms/supplier-task/status-count': config => tmsSupplierTaskData.getSupplierTaskStatusCount(getParams(config)),
  '/tms/supplier-task/summary': () => tmsSupplierTaskData.getSupplierTaskSummary(),
  '/oms/platform-appointment/status-count': config => {
    const params = getParams(config);
    const { status: _status, ...rest } = params || {};
    return omsPlatformAppointmentData.getPlatformAppointmentStatusCount(rest);
  },
  '/wms/inbound-plan/list': config => mockEmptyPage(getParams(config)),
  '/wms/inbound-plan/get-or-create': config => inboundPlanData.getOrCreateInboundPlan(getParams(config)),
  '/oms/cargoGroupingRule/list': config => inboundPlanData.getCargoGroupingRuleList(getParams(config)),
  '/oms/businessRule/list': config => businessRuleData.getBusinessRuleList(getParams(config)),
  '/oms/approvalFlow/list': config => approvalFlowData.getApprovalFlowList(getParams(config)),
  '/oms/zoneRule/list': config => zoneRuleData.getZoneRuleList(getParams(config)),
  '/oms/platformWarehouse/platforms': config => platformWarehouseData.getPlatformList(getParams(config)),
  '/oms/platformWarehouse/list': config => platformWarehouseData.getPlatformWarehouseList(getParams(config)),
  // ---------- Print Center ----------
  '/print/workbench': () => printCenterData.getPrintWorkbench(),
  '/print/template/list': config => printCenterData.getPrintTemplateList(getParams(config)),
  '/print/template/get': config => {
    const row = printCenterData.getPrintTemplate(getParams(config)?.id);
    if (!row) throw new Error('模板不存在');
    return row;
  },
  '/print/task/list': config => printCenterData.getPrintTaskList(getParams(config)),
  '/print/record/list': config => printCenterData.getPrintRecordList(getParams(config)),
  '/print/printer/list': config => printCenterData.getPrintPrinterList(getParams(config)),
  '/print/templateVersion/list': config => printCenterData.getPrintTemplateVersionList(getParams(config)),
  '/print/rule/list': config => printCenterData.getPrintRuleList(getParams(config)),

  // ---------- Customer Portal ----------
  '/portal/contacts': () => portalData.getPortalContacts(),
  '/portal/orders/options': () => portalData.getPortalOrderOptions(),
  '/portal/orders/list': config => portalData.getPortalOrderList(getParams(config)),
  '/portal/warehouses': () => portalDashboardData.getPortalWarehouses(),
  '/portal/dashboard/overview': config =>
    portalDashboardData.getPortalDashboardOverview(
      getParams(config)?.warehouseId != null && getParams(config)?.warehouseId !== ''
        ? Number(getParams(config).warehouseId)
        : null
    ),
  '/portal/containers': config =>
    portalDashboardData.getPortalContainers(
      getParams(config)?.warehouseId != null && getParams(config)?.warehouseId !== ''
        ? Number(getParams(config).warehouseId)
        : null
    ),
  '/portal/transfer/instructions': config => {
    if (config.method?.toLowerCase() === 'post') {
      return portalTransferOpsData.submitPortalTransferInstruction(getBody(config) as Api.Portal.SubmitTransferInstructionPayload);
    }
    return portalTransferOpsData.getPortalTransferInstructions(getParams(config));
  },
  '/portal/transfer/eligible-orders': () => portalTransferOpsData.getPortalTransferEligibleOrders(),
  '/portal/transfer/operation-options': () => portalTransferOpsData.PORTAL_TRANSFER_OPERATION_OPTIONS,
  '/portal/settings/alert-config': config => {
    if (config.method?.toLowerCase() === 'put') {
      return portalTransferOpsData.savePortalAlertConfig(getBody(config) as Partial<Api.Portal.AlertConfig>);
    }
    return portalTransferOpsData.getPortalAlertConfig();
  },
  '/portal/conversation/list': config => portalData.getPortalConversations(getParams(config)),
  '/portal/message/list': config => portalData.getPortalMessages(String(getParams(config)?.conversationId || '')),
  '/portal/business/context': config =>
    portalData.getPortalBizContext(String(getParams(config)?.conversationId || '')),
  '/portal/conversation/create': config => portalData.createPortalConversation(getBody(config) as Api.Portal.CreateConversationPayload),
  '/portal/message/send': config => {
    const body = getBody(config);
    return portalData.sendPortalMessage(String(body.conversationId || ''), String(body.content || ''));
  },
  '/portal/exception/list': config => portalData.getPortalExceptionList(getParams(config)),
  '/portal/exception/feedback': config => portalData.submitPortalProblemFeedback(getBody(config) as Api.Portal.SubmitFeedbackPayload),
  '/portal/order/submit': config => portalData.submitPortalOrder(getBody(config) as Api.Portal.SubmitPortalOrderPayload),
  '/portal/fee-confirm/list': config => portalFinanceData.getPortalFeeConfirmList(getParams(config)),
  '/portal/bills/list': config => portalFinanceData.getPortalBillList(getParams(config)),
  '/portal/files/list': config => portalFilesData.getPortalFileList(getParams(config)),
  '/portal/files/type-options': () => portalFilesData.getPortalFileTypeOptions(),
  '/portal/files/upload': config => portalFilesData.uploadPortalFile(getBody(config) as Api.Portal.UploadPortalFilePayload),
  '/portal/inventory/list': config => portalInventoryData.getPortalInventoryList(getParams(config)),
  '/portal/dropship/sku-options': () => portalInventoryData.getPortalDropshipSkuOptions(),
  '/portal/asn/list': config => portalInventoryData.getPortalAsnList(getParams(config)),
  '/portal/shipment/list': config => portalInventoryData.getPortalShipmentList(getParams(config)),
  '/portal/in-transit/list': config =>
    portalDashboardData.getPortalInTransitList(
      getParams(config)?.warehouseId != null && getParams(config)?.warehouseId !== ''
        ? Number(getParams(config).warehouseId)
        : null
    ),

  // ---------- Comm Center ----------
  '/comm/conversation/list': config => commCenterData.getConversationList(getParams(config)),
  '/comm/message/list': config => commCenterData.getMessageList(String(getParams(config)?.conversationId || '')),
  '/comm/business/context': config => commCenterData.getBusinessContext(String(getParams(config)?.conversationId || '')),
  '/comm/contacts/tree': () => commCenterData.getContactTree(),
  '/comm/todo/list': config => commCenterData.getCommTodoList(getParams(config)),
  '/comm/file/list': config => commCenterData.getCommFileList(getParams(config)),
  '/comm/order/search': config => commCenterData.searchCommOrders(getParams(config)?.keyword),
  '/comm/approval-file/list': config => commCenterData.getCommApprovalFiles(getParams(config)),
  '/comm/order/detail': config => commCenterData.getCommOrderDetail(getParams(config)?.orderNo),

  // ---------- 智能员工中心 IEC ----------
  '/iec/dashboard/summary': () => iecData.getIecDashboardSummary(),
  '/iec/employee/list': config => iecData.getIecEmployeeList(getParams(config)),
  '/iec/auto-flow/list': config => iecData.getIecAutoFlowList(getParams(config)),
  '/iec/rpa-flow/list': config => iecData.getIecRpaFlowList(getParams(config)),
  '/iec/task-queue/list': config => iecData.getIecTaskQueueList(getParams(config)),
  '/iec/takeover/list': config => iecData.getIecTakeoverList(getParams(config)),
  '/iec/execution-log/list': config => iecData.getIecExecutionLogList(getParams(config)),
  '/iec/credential/list': config => iecData.getIecCredentialList(getParams(config)),
  '/iec/performance/list': () => iecData.getIecPerformanceList(),

  '/oms/cargoGroupingFieldMeta/list': () => [],
  '/oms/cargoGroupingFieldMeta/admin/list': () => [],

  // ---------- YMS ----------
  '/yms/dispatch/list': config => ymsData.getYmsDispatchList(getParams(config)),
  '/yms/dispatch/stats': config => ymsData.getYmsDispatchStats(getParams(config)),
  '/yms/dispatch/dock-board': config => ymsData.getYmsDockBoard(getParams(config)),
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

  // ---------- TMS ----------
  '/tms/overview': () => tmsData.getTmsOverview(),
  '/tms/trip-order/list': config => tmsData.getTripOrderList(getParams(config)),
  '/tms/trip-order/status-count': () => tmsData.getTripOrderStatusCount(),
  '/tms/dispatch/pool': config => tmsData.getDispatchPool(getParams(config)),
  '/tms/dispatch/plans': () => tmsData.getDispatchPlans(),
  '/tms/dispatch/auto': () => tmsData.autoDispatch(),
  '/tms/dispatch/logs': () => tmsDispatchWorkbench.getDispatchWorkbenchLogs(),
  '/tms/dispatch/detail': config => {
    const p = getParams(config);
    return tmsDispatchWorkbench.getDispatchWorkbenchDetail({
      planId: p.planId ? Number(p.planId) : undefined,
      orderId: p.orderId ? Number(p.orderId) : undefined
    });
  },
  '/tms/driver/list': config => tmsData.getDriverList(getParams(config)),
  '/tms/vehicle/list': config => tmsData.getVehicleList(getParams(config)),
  '/tms/dock-board': () => tmsData.getDockBoard(),
  '/tms/pod/list': config => tmsData.getPodList(getParams(config)),
  '/tms/freight/list': config => tmsData.getFreightList(getParams(config)),
  '/tms/dispatch/supplier/list': config => tmsData.getTmsSupplierList(getParams(config)),
  '/tms/exception/list': config => tmsData.getTmsExceptionList(getParams(config)),
  '/tms/log/list': config => tmsData.getTmsLogList(getParams(config)),
  '/yms/zone/list': config => mockEmptyPage(getParams(config)),
  '/yms/public/parking-slots': () => [],

  // ---------- Yard ----------
  '/yard/dock/list': config => yardData.getYardDockList(getParams(config)),
  '/yard/dock/free': config => yardData.getYardDockFree(getParams(config)?.warehouseId),
  '/yard/zone/list': config => yardData.getYardZoneList(getParams(config)),

  // ---------- System (list endpoints also registered above) ----------
  '/system/user/list': config => systemData.getUserList(getParams(config)),
  '/system/role/list': config => systemData.getRoleList(getParams(config)),
  '/system/role/optionselect': () => systemData.MOCK_ROLES,
  '/system/menu/list': config => systemData.getMenuList(getParams(config)),
  '/system/menu/export': config => systemData.exportMenus(getParams(config)),
  '/system/social/list': config => mockEmptyPage(getParams(config)),
  '/monitor/operlog/stats': () => monitorOperLogData.getOperLogStats(),
  '/monitor/operlog/list': config => monitorOperLogData.getOperLogList(getParams(config)),
  '/monitor/logininfor/stats': () => monitorLoginLogData.getLoginLogStats(),
  '/monitor/logininfor/list': config => monitorLoginLogData.getLoginInforList(getParams(config)),
  '/monitor/online/stats': () => monitorOnlineUserData.getOnlineSessionStats(),
  '/monitor/online/list': config => monitorOnlineUserData.getOnlineUserList(getParams(config)),
  '/monitor/online': config => monitorOnlineUserData.getOnlineUserList(getParams(config)),
  '/monitor/cache': () => monitorRedisCacheData.getRedisCacheInfoLegacy(),
  '/monitor/cache/dashboard': () => monitorRedisCacheData.getRedisCacheDashboard(),
  '/monitor/cache/keys/categories': () => monitorRedisCacheData.getRedisKeyCategories(),
  '/monitor/cache/keys/expiry': () => monitorRedisCacheData.getRedisKeyExpiryStats(),
  '/monitor/cache/keys/big': config => monitorRedisCacheData.getRedisBigKeyList(getParams(config)),
  '/monitor/cache/keys/hot': config => monitorRedisCacheData.getRedisHotKeyList(getParams(config)),
  '/monitor/cache/slow-queries': config => monitorRedisCacheData.getRedisSlowQueryList(getParams(config)),
  '/monitor/cache/alerts': config => monitorRedisCacheData.getRedisAlertList(getParams(config)),
  '/monitor/cache/ops-logs': config => monitorRedisCacheData.getRedisOpsLogList(getParams(config)),

  // ---------- Tool / Demo ----------
  '/tool/gen/list': config => mockEmptyPage(getParams(config)),
  '/tool/gen/db/list': config => mockEmptyPage(getParams(config)),
  '/demo/demo/list': config => mockEmptyPage(getParams(config)),
  '/demo/tree/list': () => mockTree([]),

  // ---------- Resource ----------
  '/resource/oss/upload': () => ({ url: 'https://mock.local/demo.png', fileName: 'demo.png', ossId: nextId() })
};

function matchPattern(url: string, config: CustomAxiosRequestConfig): any {
  const method = (config.method || 'get').toLowerCase();
  const params = getParams(config);
  const body = getBody(config);

  const portalExceptionAction = url.match(/^\/portal\/exception\/(\d+)\/action$/);
  if (portalExceptionAction && method === 'post') {
    return portalData.portalExceptionAction(Number(portalExceptionAction[1]), body as Api.Portal.ExceptionActionPayload);
  }

  const portalExceptionDetail = url.match(/^\/portal\/exception\/(\d+)$/);
  if (portalExceptionDetail && method === 'get') {
    const detail = portalData.getPortalExceptionDetail(Number(portalExceptionDetail[1]));
    if (!detail) throw new Error('异常不存在或未推送给客户');
    return detail;
  }

  const portalOrderDetail = url.match(/^\/portal\/orders\/(\d+)$/);
  if (portalOrderDetail && method === 'get') {
    const detail = portalData.getPortalOrderDetail(Number(portalOrderDetail[1]));
    if (!detail) throw new Error('订单不存在');
    return detail;
  }

  const portalContainerDetail = url.match(/^\/portal\/containers\/([^/]+)$/);
  if (portalContainerDetail && method === 'get') {
    const detail = portalDashboardData.getPortalContainerDetail(decodeURIComponent(portalContainerDetail[1]));
    if (!detail) throw new Error('海柜不存在');
    return detail;
  }

  const portalFeeConfirmAction = url.match(/^\/portal\/fee-confirm\/(\d+)\/action$/);
  if (portalFeeConfirmAction && method === 'post') {
    return portalFinanceData.confirmPortalFee(
      Number(portalFeeConfirmAction[1]),
      body as { action: 'confirm' | 'reject'; remark?: string }
    );
  }

  const portalFeeConfirmDetail = url.match(/^\/portal\/fee-confirm\/(\d+)$/);
  if (portalFeeConfirmDetail && method === 'get') {
    const detail = portalFinanceData.getPortalFeeConfirmDetail(Number(portalFeeConfirmDetail[1]));
    if (!detail) throw new Error('费用单不存在');
    return detail;
  }

  const portalBillDetail = url.match(/^\/portal\/bills\/([^/]+)$/);
  if (portalBillDetail && method === 'get') {
    const detail = portalFinanceData.getPortalBillDetail(decodeURIComponent(portalBillDetail[1]));
    if (!detail) throw new Error('账单不存在');
    return detail;
  }

  const portalInTransitDetail = url.match(/^\/portal\/in-transit\/(\d+)$/);
  if (portalInTransitDetail && method === 'get') {
    const detail = portalDashboardData.getPortalInTransitDetail(Number(portalInTransitDetail[1]));
    if (!detail) throw new Error('在途记录不存在');
    return detail;
  }

  const portalTransferInstructionDetail = url.match(/^\/portal\/transfer\/instructions\/(\d+)$/);
  if (portalTransferInstructionDetail && method === 'get') {
    const detail = portalTransferOpsData.getPortalTransferInstructionDetail(Number(portalTransferInstructionDetail[1]));
    if (!detail) throw new Error('指令不存在');
    return detail;
  }

  const palletInventoryDetail = url.match(/^\/wms\/pallet-inventory\/(\d+)$/);
  if (palletInventoryDetail && method === 'get') {
    const detail = wmsPalletInventoryData.getPalletInventoryDetail(Number(palletInventoryDetail[1]));
    if (!detail) throw new Error('仓库库存记录不存在');
    return detail;
  }

  const pdaBusinessModules = url.match(/^\/pda\/business\/([^/]+)\/modules$/);
  if (pdaBusinessModules && method === 'get') {
    const data = pdaData.getPdaBusinessModules(pdaBusinessModules[1]);
    if (!data) throw new Error('无效的业务线');
    return data;
  }

  const pdaTaskAction = url.match(/^\/pda\/task\/([^/]+)\/action$/);
  if (pdaTaskAction && method === 'post') {
    return pdaData.pdaTaskAction(decodeURIComponent(pdaTaskAction[1]), body || {});
  }

  const pdaTaskDetail = url.match(/^\/pda\/task\/([^/]+)$/);
  if (pdaTaskDetail && method === 'get') {
    return pdaData.getPdaTask(
      decodeURIComponent(pdaTaskDetail[1]),
      params.biz ? String(params.biz) : undefined,
      params.taskType ? String(params.taskType) : undefined
    );
  }

  const pdaDevanningTaskDetail = url.match(/^\/pda\/devanning\/tasks\/([^/]+)$/);
  if (pdaDevanningTaskDetail && method === 'get') {
    const detail = pdaDevanningData.getDevanningTaskDetail(decodeURIComponent(pdaDevanningTaskDetail[1]));
    if (!detail) throw new Error('拆柜任务不存在');
    return detail;
  }

  const pdaDevanningReport = url.match(/^\/pda\/devanning\/report\/([^/]+)$/);
  if (pdaDevanningReport && method === 'get') {
    const report = pdaDevanningData.getDevanningReport(decodeURIComponent(pdaDevanningReport[1]));
    if (!report) throw new Error('拆柜报表不存在');
    return report;
  }

  const pdaDevanningValidate = url.match(/^\/pda\/devanning\/validate-finish\/([^/]+)$/);
  if (pdaDevanningValidate && method === 'get') {
    return pdaDevanningData.validateDevanningFinish(decodeURIComponent(pdaDevanningValidate[1]));
  }

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

  const devanningFees = url.match(/^\/wms\/devanning-order\/(\d+)\/fees$/);
  if (devanningFees && method === 'put') {
    return wmsData.updateDevanningOrderFees(devanningFees[1], body || {});
  }

  const tripPlanDetail = url.match(/^\/wms\/outbound-mgmt\/trip-plan\/(\d+)$/);
  if (tripPlanDetail && method === 'get') {
    return wmsOutboundMgmtData.getTripOutboundPlanDetail(tripPlanDetail[1]);
  }
  if (method === 'post' && url === '/wms/outbound-mgmt/trip-plan/notify') {
    return wmsOutboundMgmtData.notifyTripDriver(body?.ids || [], body?.channels);
  }
  if (method === 'post' && url === '/wms/outbound-mgmt/trip-plan/assign-dock') {
    return wmsOutboundMgmtData.assignTripDock(Number(body?.tripId), body?.dockNo || '', body?.reason);
  }
  if (method === 'post' && url === '/wms/outbound-mgmt/checkin/submit') {
    return wmsOutboundMgmtData.submitDriverCheckin(body || {});
  }
  if (method === 'post' && url === '/wms/outbound-mgmt/dock/auto-assign') {
    return wmsOutboundMgmtData.autoAssignDock(Number(body?.tripId));
  }

  if (method === 'post' && url === '/wms/transfer-workbench/instructions') {
    return wmsTransferWorkbenchData.createTransferInstruction(body || {});
  }
  if (method === 'put' && url === '/wms/transfer-workbench/instructions/action') {
    return wmsTransferWorkbenchData.executeTransferInstructionAction(body || {});
  }

  if (method === 'put' && url === '/monitor/logininfor/action') {
    return monitorLoginLogData.executeLoginLogAction(body || {});
  }

  if (method === 'post' && url === '/monitor/cache/action') {
    return monitorRedisCacheData.executeRedisCacheAction(body || {});
  }

  if (method === 'put' && url === '/monitor/online/action') {
    return monitorOnlineUserData.executeOnlineSessionAction(body || {});
  }

  const onlineSessionDetail = url.match(/^\/monitor\/online\/sessions\/(.+)$/);
  if (onlineSessionDetail && method === 'get') {
    return monitorOnlineUserData.getOnlineSessionDetail(decodeURIComponent(onlineSessionDetail[1]));
  }

  const onlineForceLogout = url.match(/^\/monitor\/online\/([^/]+)$/);
  if (onlineForceLogout && method === 'delete' && !onlineForceLogout[1].startsWith('myself')) {
    return monitorOnlineUserData.forceLogoutOnlineUser(decodeURIComponent(onlineForceLogout[1]));
  }

  const operLogDetail = url.match(/^\/monitor\/operlog\/(\d+)$/);
  if (operLogDetail && method === 'get') {
    return monitorOperLogData.getOperLogDetail(operLogDetail[1]);
  }

  const operLogDelete = url.match(/^\/monitor\/operlog\/([\d,]+)$/);
  if (operLogDelete && method === 'delete' && url !== '/monitor/operlog/clean') {
    return monitorOperLogData.deleteOperLog(operLogDelete[1].split(','));
  }

  if (method === 'delete' && url === '/monitor/operlog/clean') {
    return monitorOperLogData.cleanOperLog();
  }

  const redisInstanceDetail = url.match(/^\/monitor\/cache\/instances\/(\d+)$/);
  if (redisInstanceDetail && method === 'get') {
    return monitorRedisCacheData.getRedisInstanceDetail(redisInstanceDetail[1]);
  }

  const loginInforDetail = url.match(/^\/monitor\/logininfor\/(\d+)$/);
  if (loginInforDetail && method === 'get') {
    return monitorLoginLogData.getLoginInforDetail(loginInforDetail[1]);
  }

  const loginInforUnlock = url.match(/^\/monitor\/logininfor\/unlock\/(.+)$/);
  if (loginInforUnlock && method === 'get') {
    return monitorLoginLogData.unlockLoginInfor(decodeURIComponent(loginInforUnlock[1]));
  }

  const loginInforDelete = url.match(/^\/monitor\/logininfor\/([\d,]+)$/);
  if (loginInforDelete && method === 'delete' && !url.endsWith('/clean')) {
    return monitorLoginLogData.deleteLoginInfor(loginInforDelete[1].split(','));
  }

  if (method === 'delete' && url === '/monitor/logininfor/clean') {
    return monitorLoginLogData.cleanLoginInfor();
  }

  const transferInstructionDetail = url.match(/^\/wms\/transfer-workbench\/instructions\/(\d+)$/);
  if (transferInstructionDetail && method === 'get') {
    return wmsTransferWorkbenchData.getTransferInstructionDetail(transferInstructionDetail[1]);
  }

  if (method === 'put' && url === '/oms/container-order') {
    return omsSupplierContainerOpData.updateContainerOrderMock(body || {});
  }

  const containerOrderStatus = url.match(/^\/oms\/container-order\/(\d+)\/status$/);
  if (containerOrderStatus && method === 'put') {
    return omsSupplierContainerOpData.updateContainerOrderStatusMock(containerOrderStatus[1], body || {});
  }

  if (method === 'put' && url === '/tms/supplier/container-op/sync') {
    return omsSupplierContainerOpData.syncSupplierContainerOp(body || {});
  }
  if (method === 'put' && url === '/tms/supplier/container-op/fees') {
    return omsSupplierContainerOpData.saveSupplierContainerFees(body || {});
  }
  if (method === 'put' && url === '/tms/supplier/container-op/fees/audit') {
    return omsSupplierContainerOpData.auditSupplierContainerFees(body || {});
  }

  const supplierContainerOpDetail = url.match(/^\/tms\/supplier\/container-op\/(\d+)$/);
  if (supplierContainerOpDetail && method === 'get') {
    return omsSupplierContainerOpData.getSupplierContainerOpDetail(supplierContainerOpDetail[1]);
  }

  const loosePalletOrder = url.match(/^\/oms\/container-order\/(\d+)\/loose-pallet-order$/);
  if (loosePalletOrder && method === 'post') {
    return omsLoosePalletData.createLoosePalletCargoOrder(loosePalletOrder[1], body || {});
  }

  const containerCargoOrders = url.match(/^\/oms\/container-order\/(\d+)\/cargo-orders$/);
  if (containerCargoOrders && method === 'post') {
    omsLoosePalletData.addContainerCargoOrders(containerCargoOrders[1], body?.cargoOrders || []);
    return true;
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

  if (method === 'post' && url === '/wms/location') {
    return wmsData.createWmsLocation(body || {});
  }
  if (method === 'put' && url === '/wms/location') {
    return wmsData.updateWmsLocation(body || {});
  }
  if (method === 'put' && url === '/wms/location/changeStatus') {
    wmsData.changeWmsLocationStatus(body?.ids || [], body?.status);
    return true;
  }
  if (method === 'put' && url === '/wms/location/batchBind') {
    wmsData.batchBindWmsLocations(body || {});
    return true;
  }
  if (method === 'put' && url === '/wms/location/batchCapacity') {
    wmsData.batchSetWmsLocationCapacity(body || {});
    return true;
  }
  if (method === 'post' && url === '/wms/location/batchGenerate') {
    return wmsData.batchGenerateWmsLocations(body || {});
  }
  const wmsLocationDelete = url.match(/^\/wms\/location\/([\d,]+)$/);
  if (wmsLocationDelete && method === 'delete') {
    wmsData.deleteWmsLocations(wmsLocationDelete[1]);
    return true;
  }
  const wmsLocationInventory = url.match(/^\/wms\/location\/(\d+)\/inventory$/);
  if (wmsLocationInventory && method === 'get') {
    return wmsData.getWmsLocationInventory(wmsLocationInventory[1]);
  }
  const wmsLocationLogs = url.match(/^\/wms\/location\/(\d+)\/operationLogs$/);
  if (wmsLocationLogs && method === 'get') {
    return wmsData.getWmsLocationOperationLogs(wmsLocationLogs[1]);
  }

  const orderWorkbenchAction = url.match(/^\/oms\/order-workbench\/(\d+)\/action$/);
  if (orderWorkbenchAction && method === 'post') {
    return omsOrderWorkbenchData.executeOrderWorkbenchAction(orderWorkbenchAction[1], body?.action || '', body);
  }
  if (method === 'post' && url === '/oms/order-workbench/batch-action') {
    return omsOrderWorkbenchData.batchOrderWorkbenchAction(body?.ids || [], body?.action || '');
  }
  if (method === 'post' && url === '/oms/order-workbench/batch-generate-trip') {
    const { ids, ...payload } = body || {};
    return omsOrderWorkbenchData.batchGenerateTrip(ids || [], payload);
  }
  if (method === 'post' && url === '/oms/trip-recommend/preview-load') {
    return omsTripRecommendData.previewTripRecommendLoad(body?.orderIds || [], String(body?.groupId || ''));
  }
  if (method === 'post' && url === '/oms/trip-recommend/generate-trip') {
    return omsTripRecommendData.generateTripRecommend({
      groupId: String(body?.groupId || ''),
      orderIds: body?.orderIds || [],
      operatorName: body?.operatorName
    });
  }
  const orderWorkbenchDetail = url.match(/^\/oms\/order-workbench\/(\d+)$/);
  if (orderWorkbenchDetail && method === 'get') {
    return omsOrderWorkbenchData.getOrderWorkbenchDetail(orderWorkbenchDetail[1]);
  }

  const iecEmployeePut = url.match(/^\/iec\/employee\/(\d+)$/);
  if (iecEmployeePut && method === 'put') {
    return iecData.updateIecEmployee(Number(iecEmployeePut[1]), body || {});
  }
  const iecEmployeeGet = url.match(/^\/iec\/employee\/(\d+)$/);
  if (iecEmployeeGet && method === 'get') {
    return iecData.getIecEmployeeDetail(Number(iecEmployeeGet[1]));
  }
  const iecRpaFlowGet = url.match(/^\/iec\/rpa-flow\/(\d+)$/);
  if (iecRpaFlowGet && method === 'get') {
    return iecData.getIecRpaFlowDetail(Number(iecRpaFlowGet[1]));
  }
  if (iecRpaFlowGet && method === 'put') {
    return iecData.saveIecRpaFlow(Number(iecRpaFlowGet[1]), body?.nodes || []);
  }
  const iecTaskAction = url.match(/^\/iec\/task-queue\/(\d+)\/action$/);
  if (iecTaskAction && method === 'post') {
    return iecData.iecTaskAction(Number(iecTaskAction[1]), body?.action || '');
  }
  const iecTakeoverAction = url.match(/^\/iec\/takeover\/(\d+)\/action$/);
  if (iecTakeoverAction && method === 'post') {
    return iecData.iecTakeoverAction(Number(iecTakeoverAction[1]), body?.action || '');
  }

  const tmsTripAction = url.match(/^\/tms\/trip-order\/(\d+)\/action$/);
  if (tmsTripAction && method === 'post') {
    return tmsData.tripOrderAction(Number(tmsTripAction[1]), body?.action || '');
  }
  const tmsTripAddCargo = url.match(/^\/tms\/trip-order\/(\d+)\/add-cargo$/);
  if (tmsTripAddCargo && method === 'post') {
    return tmsData.addTripCargo(Number(tmsTripAddCargo[1]), body?.orderIds || []);
  }
  const tmsTripAvailableOrders = url.match(/^\/tms\/trip-order\/(\d+)\/available-orders$/);
  if (tmsTripAvailableOrders && method === 'get') {
    return tmsData.getTripAvailableOrders(Number(tmsTripAvailableOrders[1]), getParams(config));
  }
  const tmsTripDetail = url.match(/^\/tms\/trip-order\/(\d+)$/);
  if (tmsTripDetail && method === 'get') {
    return tmsData.getTripOrderDetail(Number(tmsTripDetail[1]));
  }
  const tmsDispatchConfirm = url.match(/^\/tms\/dispatch\/(\d+)\/confirm$/);
  if (tmsDispatchConfirm && method === 'post') {
    return tmsData.confirmDispatch(Number(tmsDispatchConfirm[1]));
  }
  if (method === 'post' && url === '/tms/dispatch/manual-create') {
    return tmsDispatchWorkbench.manualCreateTripWorkbench(body?.orderIds || []);
  }
  if (method === 'post' && url === '/tms/dispatch/merge') {
    return tmsDispatchWorkbench.mergeDispatchWorkbench(Number(body?.planId), body?.orderIds || []);
  }
  if (method === 'post' && url === '/tms/dispatch/split') {
    return tmsDispatchWorkbench.splitDispatchWorkbench(Number(body?.planId), body?.orderIds || []);
  }
  if (method === 'post' && url === '/tms/dispatch/assign') {
    return tmsDispatchWorkbench.assignDispatchWorkbench(Number(body?.planId), body?.type, body?.value);
  }
  if (method === 'post' && url === '/tms/dispatch/push-wms') {
    return tmsDispatchWorkbench.pushWmsWorkbench(Number(body?.planId));
  }
  if (method === 'post' && url === '/tms/dispatch/push-driver') {
    return tmsDispatchWorkbench.pushDriverWorkbench(Number(body?.planId));
  }

  const omsOutboundAddCargo = url.match(/^\/oms\/outbound-order\/(\d+)\/add-cargo$/);
  if (omsOutboundAddCargo && method === 'post') {
    return omsData.addOutboundCargo(Number(omsOutboundAddCargo[1]), body?.orderIds || []);
  }
  const omsOutboundAvailableOrders = url.match(/^\/oms\/outbound-order\/(\d+)\/available-orders$/);
  if (omsOutboundAvailableOrders && method === 'get') {
    return omsData.getOutboundAvailableOrders(Number(omsOutboundAvailableOrders[1]), getParams(config));
  }
  const omsOutboundItems = url.match(/^\/oms\/outbound-order\/(\d+)\/items$/);
  if (omsOutboundItems && method === 'get') {
    return omsData.getOutboundOrderItems(Number(omsOutboundItems[1]));
  }

  if (method === 'post' && url === '/oms/businessRule/test') {
    return businessRuleData.testBusinessRule(body || {});
  }
  if (method === 'post' && url === '/oms/businessRule') {
    return businessRuleData.createBusinessRule(body || {});
  }
  if (method === 'put' && url === '/oms/businessRule') {
    return businessRuleData.updateBusinessRule(body || {});
  }
  const businessRuleEnable = url.match(/^\/oms\/businessRule\/(\d+)\/(enable|disable)$/);
  if (businessRuleEnable && method === 'put') {
    return businessRuleData.setBusinessRuleStatus(
      businessRuleEnable[1],
      businessRuleEnable[2] === 'enable' ? 'enabled' : 'disabled'
    );
  }
  const businessRuleDelete = url.match(/^\/oms\/businessRule\/([\d,]+)$/);
  if (businessRuleDelete && method === 'delete') {
    businessRuleData.deleteBusinessRule(businessRuleDelete[1]);
    return true;
  }

  if (method === 'post' && url === '/oms/approvalFlow') {
    return approvalFlowData.createApprovalFlow(body || {});
  }
  if (method === 'put' && url === '/oms/approvalFlow') {
    return approvalFlowData.updateApprovalFlow(body || {});
  }
  const approvalFlowEnable = url.match(/^\/oms\/approvalFlow\/(\d+)\/(enable|disable)$/);
  if (approvalFlowEnable && method === 'put') {
    return approvalFlowData.setApprovalFlowStatus(
      approvalFlowEnable[1],
      approvalFlowEnable[2] === 'enable' ? 'enabled' : 'disabled'
    );
  }
  const approvalFlowDelete = url.match(/^\/oms\/approvalFlow\/([\d,]+)$/);
  if (approvalFlowDelete && method === 'delete') {
    approvalFlowData.deleteApprovalFlow(approvalFlowDelete[1]);
    return true;
  }

  if (method === 'post' && url === '/oms/zoneRule') {
    return zoneRuleData.createZoneRule(body || {});
  }
  if (method === 'put' && url === '/oms/zoneRule') {
    return zoneRuleData.updateZoneRule(body || {});
  }
  if (method === 'post' && url === '/oms/zoneRule/fallback') {
    return true;
  }
  const zoneRuleDelete = url.match(/^\/oms\/zoneRule\/([\d,]+)$/);
  if (zoneRuleDelete && method === 'delete') {
    zoneRuleData.deleteZoneRule(zoneRuleDelete[1]);
    return true;
  }

  if (method === 'post' && url === '/oms/platformWarehouse/platform') {
    return platformWarehouseData.createPlatform(body || {});
  }
  if (method === 'put' && url === '/oms/platformWarehouse/platform') {
    platformWarehouseData.updatePlatform(body || {});
    return true;
  }
  const platformDelete = url.match(/^\/oms\/platformWarehouse\/platform\/([\d,]+)$/);
  if (platformDelete && method === 'delete') {
    platformWarehouseData.deletePlatform(platformDelete[1]);
    return true;
  }
  if (method === 'post' && url === '/oms/platformWarehouse') {
    return platformWarehouseData.createPlatformWarehouse(body || {});
  }
  if (method === 'put' && url === '/oms/platformWarehouse') {
    platformWarehouseData.updatePlatformWarehouse(body || {});
    return true;
  }
  const pwStatus = url.match(/^\/oms\/platformWarehouse\/(\d+)\/status$/);
  if (pwStatus && method === 'put') {
    platformWarehouseData.updatePlatformWarehouseStatus(Number(pwStatus[1]), body?.status ?? '0');
    return true;
  }
  const platformWarehouseDelete = url.match(/^\/oms\/platformWarehouse\/([\d,]+)$/);
  if (platformWarehouseDelete && method === 'delete' && !url.includes('/platform/')) {
    platformWarehouseData.deletePlatformWarehouse(platformWarehouseDelete[1]);
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

  if (method === 'post' && url === '/oms/outbound-pool/create-pre-outbound') {
    return omsData.createPoolPreOutbound(body || {});
  }
  if (method === 'post' && url === '/oms/outbound-pool/create-outbound-order') {
    return omsData.createPoolOutboundOrder(body || {});
  }
  if (method === 'post' && url === '/oms/outbound-pool/batch-create-pre-outbound') {
    return omsData.batchCreatePoolPreOutbound(body || {});
  }
  if (method === 'post' && url === '/oms/outbound-pool/batch-create-outbound-order') {
    return omsData.batchCreatePoolOutboundOrder(body || {});
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

  if (method === 'post' && url === '/wms/devanning-work/pallet/label') {
    return devanningWorkData.createGroupPalletLabel(body?.taskId, {
      groupCode: String(body?.groupCode || ''),
      qty: Number(body?.qty || 0),
      lengthCm: Number(body?.lengthCm || 0),
      widthCm: Number(body?.widthCm || 0),
      heightCm: Number(body?.heightCm || 0),
      weightKg: Number(body?.weightKg || 0)
    });
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

  if (method === 'post' && url === '/wms/devanning-work/dock') {
    return devanningWorkData.updateDevanningWorkDock(body?.taskId, body?.dockId);
  }

  if (method === 'post' && url === '/wms/devanning-work/devanning-date') {
    return devanningWorkData.updateDevanningWorkDate(body?.taskId, body?.devanningDate);
  }

  if (method === 'post' && url === '/wms/devanning-work/extra-fee') {
    return devanningWorkData.updateDevanningWorkExtraFee(body?.taskId, {
      amount: Number(body?.amount ?? 0),
      remark: String(body?.remark ?? '')
    });
  }

  const platformApptInboundLines = url.match(/^\/oms\/platform-appointment\/(\d+)\/inbound-lines$/);
  if (platformApptInboundLines && method === 'get') {
    return omsPlatformAppointmentData.getPlatformAppointmentInboundLines(platformApptInboundLines[1]);
  }

  const platformApptPreOutboundLines = url.match(/^\/oms\/platform-appointment\/(\d+)\/pre-outbound-lines$/);
  if (platformApptPreOutboundLines && method === 'get') {
    return omsPlatformAppointmentData.getPlatformAppointmentPreOutboundLines(
      platformApptPreOutboundLines[1],
      getParams(config)
    );
  }

  const platformApptCreateOutbound = url.match(/^\/oms\/platform-appointment\/(\d+)\/create-outbound$/);
  if (platformApptCreateOutbound && method === 'post') {
    return omsPlatformAppointmentData.createPlatformAppointmentOutbound(platformApptCreateOutbound[1], body);
  }

  const platformApptCreatePreOutbound = url.match(/^\/oms\/platform-appointment\/(\d+)\/create-pre-outbound$/);
  if (platformApptCreatePreOutbound && method === 'post') {
    return omsPlatformAppointmentData.createPlatformAppointmentPreOutbound(platformApptCreatePreOutbound[1], body);
  }

  if (method === 'post' && url === '/oms/platform-appointment') {
    return omsPlatformAppointmentData.createPlatformAppointment(body || {});
  }

  // ---------- System CRUD / detail ----------
  if (method === 'get') {
    const userAuthRole = url.match(/^\/system\/user\/authRole\/(\d+)$/);
    if (userAuthRole) return systemData.getAuthRole(userAuthRole[1]);

    const userDetail = url.match(/^\/system\/user(?:\/(\d+))?$/);
    if (userDetail && !url.includes('/list')) return systemData.getUserDetail(userDetail[1]);

    const roleMenuTree = url.match(/^\/system\/menu\/roleMenuTreeselect\/(\d+)$/);
    if (roleMenuTree) return systemData.getRoleMenuTreeSelect(roleMenuTree[1]);

    const tenantPkgMenu = url.match(/^\/system\/menu\/tenantPackageMenuTreeselect\/(\d+)$/);
    if (tenantPkgMenu) return systemData.getTenantPackageMenuTreeSelect(tenantPkgMenu[1]);

    const roleDeptTree = url.match(/^\/system\/role\/deptTree\/(\d+)$/);
    if (roleDeptTree) return systemData.getRoleDeptTreeSelect(roleDeptTree[1]);

    const ossByIds = url.match(/^\/resource\/oss\/listByIds\/([\d,]+)$/);
    if (ossByIds) {
      const idSet = new Set(ossByIds[1].split(','));
      return systemData.MOCK_OSS_FILES.filter(f => idSet.has(String(f.ossId)));
    }

    const deptUserList = url.match(/^\/system\/user\/list\/dept\/(\d+)$/);
    if (deptUserList) return systemData.getUserList({ deptId: deptUserList[1], pageNum: 1, pageSize: 500 }).rows;
  }

  if (method === 'post' && url === '/system/user') return systemData.createUser(body || {});
  if (method === 'put' && url === '/system/user') {
    systemData.updateUser(body || {});
    return true;
  }
  if (method === 'put' && url === '/system/user/changeStatus') {
    systemData.updateUserStatus(body?.userId, body?.status);
    return true;
  }
  if (method === 'put' && url === '/system/user/resetPwd') return true;
  if (method === 'put' && url === '/system/user/authRole') {
    systemData.authUserRole(body?.userId, body?.roleIds || []);
    return true;
  }
  const userDelete = url.match(/^\/system\/user\/([\d,]+)$/);
  if (userDelete && method === 'delete') {
    systemData.deleteUsers(userDelete[1]);
    return true;
  }

  if (method === 'post' && url === '/system/role') return systemData.createRole(body || {});
  if (method === 'put' && url === '/system/role') {
    systemData.updateRole(body || {});
    return true;
  }
  if (method === 'put' && url === '/system/role/changeStatus') {
    systemData.updateRoleStatus(body?.roleId, body?.status);
    return true;
  }
  if (method === 'put' && url === '/system/role/dataScope') {
    systemData.updateRoleDataScope(body || {});
    return true;
  }
  if (method === 'put' && url === '/system/role/authUser/selectAll') {
    systemData.updateRoleAuthUsers(params.roleId ?? body?.roleId, String(params.userIds || body?.userIds || '').split(',').filter(Boolean));
    return true;
  }
  if (method === 'put' && url === '/system/role/authUser/cancelAll') {
    systemData.updateRoleAuthUsers(params.roleId ?? body?.roleId, String(params.userIds || body?.userIds || '').split(',').filter(Boolean), true);
    return true;
  }
  const roleDelete = url.match(/^\/system\/role\/([\d,]+)$/);
  if (roleDelete && method === 'delete') {
    systemData.deleteRoles(roleDelete[1]);
    return true;
  }

  if (method === 'post' && url === '/system/dept') return systemData.createDept(body || {});
  if (method === 'put' && url === '/system/dept') {
    systemData.updateDept(body || {});
    return true;
  }
  const deptDelete = url.match(/^\/system\/dept\/(\d+)$/);
  if (deptDelete && method === 'delete') {
    systemData.deleteDept(deptDelete[1]);
    return true;
  }

  if (method === 'post' && url === '/system/menu') return systemData.createMenu(body || {});
  if (method === 'put' && url === '/system/menu/sort') return systemData.sortMenus(body?.items || body || []);
  if (method === 'put' && url === '/system/menu/batchStatus') {
    systemData.batchUpdateMenuStatus(body?.menuIds || [], body?.status ?? '0');
    return true;
  }
  if (method === 'post' && url === '/system/menu/refreshCache') return systemData.refreshMenuCache();
  if (method === 'post' && url === '/system/menu/import') return systemData.importMenus(body || { menus: [] });
  if (method === 'post' && url === '/system/menu/buttonTemplate') return systemData.applyMenuButtonTemplate(body || {});
  const menuDeletable = url.match(/^\/system\/menu\/(\d+)\/deletable$/);
  if (menuDeletable && method === 'get') return systemData.getMenuDeletable(menuDeletable[1]);
  if (method === 'put' && url === '/system/menu') {
    systemData.updateMenu(body || {});
    return true;
  }
  const menuDelete = url.match(/^\/system\/menu\/(?:cascade\/)?([\d,]+)$/);
  if (menuDelete && method === 'delete') {
    systemData.deleteMenus(menuDelete[1]);
    return true;
  }

  if (method === 'post' && url === '/system/post') return systemData.createPost(body || {});
  if (method === 'put' && url === '/system/post') {
    systemData.updatePost(body || {});
    return true;
  }
  const postDelete = url.match(/^\/system\/post\/([\d,]+)$/);
  if (postDelete && method === 'delete') {
    systemData.deletePosts(postDelete[1]);
    return true;
  }

  if (method === 'post' && url === '/system/config') return systemData.createConfig(body || {});
  if (method === 'put' && url === '/system/config') {
    systemData.updateConfig(body || {});
    return true;
  }
  if (method === 'put' && url === '/system/config/updateByKey') {
    systemData.updateConfig(body || {});
    return true;
  }
  if (method === 'delete' && url === '/system/config/refreshCache') return true;
  const configDelete = url.match(/^\/system\/config\/([\d,]+)$/);
  if (configDelete && method === 'delete') {
    systemData.deleteConfigs(configDelete[1]);
    return true;
  }

  if (method === 'post' && url === '/system/notice') return systemData.createNotice(body || {});
  if (method === 'put' && url === '/system/notice') {
    systemData.updateNotice(body || {});
    return true;
  }
  const noticeDelete = url.match(/^\/system\/notice\/([\d,]+)$/);
  if (noticeDelete && method === 'delete') {
    systemData.deleteNotices(noticeDelete[1]);
    return true;
  }

  if (method === 'post' && url === '/system/tenant') return systemData.createTenant(body || {});
  if (method === 'put' && url === '/system/tenant') {
    systemData.updateTenant(body || {});
    return true;
  }
  const tenantDelete = url.match(/^\/system\/tenant\/([\d,]+)$/);
  if (tenantDelete && method === 'delete') {
    systemData.deleteTenants(tenantDelete[1]);
    return true;
  }

  if (method === 'post' && url === '/system/tenant/package') return systemData.createTenantPackage(body || {});
  if (method === 'put' && url === '/system/tenant/package') {
    systemData.updateTenantPackage(body || {});
    return true;
  }
  const tenantPkgDelete = url.match(/^\/system\/tenant\/package\/([\d,]+)$/);
  if (tenantPkgDelete && method === 'delete') {
    systemData.deleteTenantPackages(tenantPkgDelete[1]);
    return true;
  }

  if (method === 'post' && url === '/system/client') return systemData.createClient(body || {});
  if (method === 'put' && url === '/system/client') {
    systemData.updateClient(body || {});
    return true;
  }
  if (method === 'put' && url === '/system/client/changeStatus') {
    systemData.updateClientStatus(body?.id, body?.status);
    return true;
  }
  const clientDelete = url.match(/^\/system\/client\/([\d,]+)$/);
  if (clientDelete && method === 'delete') {
    systemData.deleteClients(clientDelete[1]);
    return true;
  }

  if (method === 'post' && url === '/system/dict/type') return systemData.createDictType(body || {});
  if (method === 'put' && url === '/system/dict/type') {
    systemData.updateDictType(body || {});
    return true;
  }
  if (method === 'delete' && url === '/system/dict/type/refreshCache') return true;
  const dictTypeDelete = url.match(/^\/system\/dict\/type\/([\d,]+)$/);
  if (dictTypeDelete && method === 'delete') {
    systemData.deleteDictTypes(dictTypeDelete[1]);
    return true;
  }

  if (method === 'post' && url === '/system/dict/data') return systemData.createDictData(body || {});
  if (method === 'put' && url === '/system/dict/data') {
    systemData.updateDictData(body || {});
    return true;
  }
  const dictDataDelete = url.match(/^\/system\/dict\/data\/([\d,]+)$/);
  if (dictDataDelete && method === 'delete') {
    systemData.deleteDictData(dictDataDelete[1]);
    return true;
  }

  if (method === 'post' && url === '/resource/oss/config') return systemData.createOssConfig(body || {});
  if (method === 'put' && url === '/resource/oss/config') {
    systemData.updateOssConfig(body || {});
    return true;
  }
  if (method === 'put' && url === '/resource/oss/config/changeStatus') {
    systemData.updateOssConfig(body || {});
    return true;
  }
  const ossConfigDelete = url.match(/^\/resource\/oss\/config\/([\d,]+)$/);
  if (ossConfigDelete && method === 'delete') {
    systemData.deleteOssConfigs(ossConfigDelete[1]);
    return true;
  }
  const ossDelete = url.match(/^\/resource\/oss\/([\d,]+)$/);
  if (ossDelete && method === 'delete') {
    systemData.deleteOss(ossDelete[1]);
    return true;
  }

  if (method === 'put' && url === '/system/org-scope/current') {
    systemData.updateOrgScopeCurrent(body || {});
    return true;
  }

  if (method === 'post' && url === '/print/template/publish') {
    const row = printCenterData.publishPrintTemplate(body || {});
    if (!row) throw new Error('模板不存在');
    return row;
  }

  if (method === 'post' && url === '/print/template/submitTest') {
    const row = printCenterData.submitPrintTemplateTest(body || {});
    if (!row) throw new Error('模板不存在');
    return row;
  }

  if (method === 'post' && url === '/print/rule/save') {
    return printCenterData.savePrintRule(body || {});
  }

  if (method === 'post' && url === '/system/themeConfig') return systemThemeConfigData.createThemeConfig(body || {});
  if (method === 'put' && url === '/system/themeConfig') {
    systemThemeConfigData.updateThemeConfig(body || {});
    return true;
  }
  if (method === 'put' && url === '/system/themeConfig/batchStatus') {
    systemThemeConfigData.batchUpdateThemeStatus(body?.themeIds || [], body?.status || '0');
    return true;
  }
  if (method === 'put' && url === '/system/themeConfig/publish') {
    return systemThemeConfigData.publishThemeConfig(body || {});
  }
  if (method === 'put' && url === '/system/themeConfig/draft') {
    return systemThemeConfigData.saveThemeDraft(body || {});
  }
  const themeConfigCopy = url.match(/^\/system\/themeConfig\/(\d+)\/copy$/);
  if (themeConfigCopy && method === 'post') {
    return systemThemeConfigData.copyThemeConfig(themeConfigCopy[1]);
  }
  const themeConfigDefault = url.match(/^\/system\/themeConfig\/(\d+)\/default$/);
  if (themeConfigDefault && method === 'put') {
    return systemThemeConfigData.setDefaultThemeConfig(themeConfigDefault[1]);
  }
  const themeConfigDelete = url.match(/^\/system\/themeConfig\/([\d,]+)$/);
  if (themeConfigDelete && method === 'delete') {
    systemThemeConfigData.deleteThemeConfigs(themeConfigDelete[1]);
    return true;
  }

  // ???????
  const dictMatch = url.match(/^\/system\/dict\/data\/type\/(.+)$/);
  if (dictMatch) {
    return getMockDictByType(dictMatch[1]);
  }

  // ?????? key
  const configKeyMatch = url.match(/^\/system\/config\/configKey\/(.+)$/);
  if (configKeyMatch) {
    return systemData.MOCK_CONFIGS.find(c => c.configKey === configKeyMatch[1])?.configValue ?? '';
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
    if (url.startsWith('/system/') || url.startsWith('/resource/')) {
      return null;
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
  if (url.startsWith('/oms/platform-appointment/')) return omsPlatformAppointmentData.getPlatformAppointmentDetail(id);
  if (url.startsWith('/oms/businessRule/')) return businessRuleData.getBusinessRuleDetail(id);
  if (url.startsWith('/oms/approvalFlow/')) return approvalFlowData.getApprovalFlowDetail(id);
  if (url.startsWith('/oms/zoneRule/')) return zoneRuleData.getZoneRuleDetail(id);
  if (url.startsWith('/system/themeConfig/')) return systemThemeConfigData.getThemeConfigDetail(id);
  if (url.startsWith('/tms/supplier/container-op/')) {
    return omsSupplierContainerOpData.getSupplierContainerOpDetail(id);
  }
  if (url.startsWith('/tms/supplier/') && !url.includes('/list') && !url.includes('/kpi/') && !url.includes('/container-op/')) {
    return omsSupplierData.getOmsSupplierDetail(numId);
  }
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
