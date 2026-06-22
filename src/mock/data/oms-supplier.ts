import { buildSupplierQuoteRecommendResult } from '@/utils/oms/supplier-quote-recommend';
import { MOCK_WAREHOUSE } from './common';
import { mockPage } from '../utils';

const wh = MOCK_WAREHOUSE.warehouseName;

export const MOCK_OMS_SUPPLIERS: Api.Oms.Supplier[] = [
  {
    id: 800001,
    supplierCode: 'SUP-DRY-001',
    supplierName: 'Pacific Drayage LLC',
    supplierType: 'DRAYAGE',
    contactName: 'John Miller',
    contactPhone: '+1 562-555-0101',
    contactEmail: 'dispatch@pacificdrayage.com',
    serviceRegion: 'LA / Long Beach',
    serviceTerminals: 'LBCT, APMT, TraPac',
    scacCode: 'PDRY',
    dotNo: 'DOT-3829102',
    mcNo: 'MC-884521',
    insuranceInfo: 'Cargo $1M / Liability $2M',
    contractExpireDate: '2027-06-30',
    paymentTerms: 'NET30',
    status: 'ENABLED',
    score: 4.6,
    warehouseNames: wh,
    remark: '主力提柜供应商',
    createTime: '2025-01-10 09:00:00'
  },
  {
    id: 800002,
    supplierCode: 'SUP-DRY-002',
    supplierName: 'Harbor Trucking Co.',
    supplierType: 'DRAYAGE',
    contactName: 'Maria Garcia',
    contactPhone: '+1 310-555-0202',
    contactEmail: 'ops@harbortruck.com',
    serviceRegion: 'LA / LB',
    serviceTerminals: 'LBCT, WBCT',
    scacCode: 'HBTC',
    dotNo: 'DOT-2910384',
    mcNo: 'MC-772103',
    insuranceInfo: 'Cargo $1M',
    contractExpireDate: '2026-12-31',
    paymentTerms: 'NET15',
    status: 'ENABLED',
    score: 4.2,
    warehouseNames: wh,
    remark: null,
    createTime: '2025-03-05 11:20:00'
  },
  {
    id: 800003,
    supplierCode: 'SUP-LHL-001',
    supplierName: 'West Coast Linehaul Inc.',
    supplierType: 'LINEHAUL',
    contactName: 'David Chen',
    contactPhone: '+1 626-555-0303',
    contactEmail: 'dispatch@wclinehaul.com',
    serviceRegion: 'CA / AZ / NV',
    serviceTerminals: null,
    scacCode: 'WCLH',
    dotNo: 'DOT-4410291',
    mcNo: 'MC-901234',
    insuranceInfo: 'Cargo $2M',
    contractExpireDate: '2027-03-31',
    paymentTerms: 'NET30',
    status: 'ENABLED',
    score: 4.8,
    warehouseNames: wh,
    remark: 'FBA 卡派主力',
    createTime: '2024-11-01 08:00:00'
  },
  {
    id: 800004,
    supplierCode: 'SUP-LHL-002',
    supplierName: 'Swift Cartage Services',
    supplierType: 'LINEHAUL',
    contactName: 'Amy Wong',
    contactPhone: '+1 909-555-0404',
    contactEmail: 'amy@swiftcartage.com',
    serviceRegion: 'Southern CA',
    serviceTerminals: null,
    scacCode: 'SWFT',
    dotNo: 'DOT-5520193',
    mcNo: 'MC-663412',
    insuranceInfo: 'Cargo $1M',
    contractExpireDate: '2026-08-15',
    paymentTerms: 'NET30',
    status: 'ENABLED',
    score: 4.4,
    warehouseNames: wh,
    remark: null,
    createTime: '2025-02-18 14:30:00'
  },
  {
    id: 800005,
    supplierCode: 'SUP-DEV-001',
    supplierName: 'LA Warehouse Labor Team',
    supplierType: 'DEVANNING_LOADING',
    contactName: '张师傅',
    contactPhone: '626-555-0505',
    contactEmail: 'zhang@lawlabor.com',
    serviceRegion: 'LA 仓库',
    serviceTerminals: null,
    scacCode: null,
    dotNo: null,
    mcNo: null,
    insuranceInfo: 'Workers Comp',
    contractExpireDate: '2027-01-31',
    paymentTerms: 'NET15',
    status: 'ENABLED',
    score: 4.5,
    warehouseNames: wh,
    remark: '拆柜装车劳务',
    createTime: '2024-09-20 10:00:00'
  },
  {
    id: 800006,
    supplierCode: 'SUP-DEV-002',
    supplierName: 'Prime Devanning Crew',
    supplierType: 'DEVANNING_LOADING',
    contactName: 'Mike Lee',
    contactPhone: '562-555-0606',
    contactEmail: 'mike@primedev.com',
    serviceRegion: 'LA / OC',
    serviceTerminals: null,
    scacCode: null,
    dotNo: null,
    mcNo: null,
    insuranceInfo: 'General Liability',
    contractExpireDate: '2026-05-30',
    paymentTerms: 'NET30',
    status: 'DISABLED',
    score: 3.8,
    warehouseNames: wh,
    remark: '暂停合作',
    createTime: '2025-04-01 09:00:00'
  },
  {
    id: 800101,
    supplierCode: 'SUP-LTL-001',
    supplierName: 'FedEx Freight',
    supplierType: 'LTL',
    contactName: 'LTL Dispatch',
    contactPhone: '+1 800-463-3339',
    contactEmail: 'freight@fedex.com',
    serviceRegion: 'TX / CA / AZ / NV / OK',
    serviceTerminals: null,
    scacCode: 'FXFE',
    dotNo: 'DOT-2845120',
    mcNo: 'MC-665432',
    insuranceInfo: 'Cargo $100K / Liability $1M',
    contractExpireDate: '2027-12-31',
    paymentTerms: 'NET30',
    status: 'ENABLED',
    score: 4.8,
    warehouseNames: wh,
    orderPortalUrl: 'https://www.fedex.com/en-us/shipping/freight/ltl.html',
    remark: '支持 API 自动下单',
    createTime: '2024-08-01 08:00:00'
  },
  {
    id: 800102,
    supplierCode: 'SUP-LTL-002',
    supplierName: 'US Xpress',
    supplierType: 'LTL',
    contactName: 'Operations Desk',
    contactPhone: '+1 800-251-6291',
    contactEmail: 'ops@usxpress.com',
    serviceRegion: 'TX / LA / MS / AL / GA',
    serviceTerminals: null,
    scacCode: 'USXP',
    dotNo: 'DOT-3312048',
    mcNo: 'MC-778901',
    insuranceInfo: 'Cargo $100K',
    contractExpireDate: '2027-06-30',
    paymentTerms: 'NET30',
    status: 'ENABLED',
    score: 4.5,
    warehouseNames: wh,
    orderPortalUrl: 'https://www.usxpress.com/',
    remark: '支持 API 自动下单',
    createTime: '2024-10-15 10:00:00'
  },
  {
    id: 800103,
    supplierCode: 'SUP-LTL-003',
    supplierName: 'R+L Carriers',
    supplierType: 'LTL',
    contactName: 'Customer Service',
    contactPhone: '+1 800-543-5589',
    contactEmail: 'service@rlcarriers.com',
    serviceRegion: 'TX / CA / Midwest / Southeast',
    serviceTerminals: null,
    scacCode: 'RLCA',
    dotNo: 'DOT-1928374',
    mcNo: 'MC-554321',
    insuranceInfo: 'Cargo $100K',
    contractExpireDate: '2026-12-31',
    paymentTerms: 'NET15',
    status: 'ENABLED',
    score: 4.3,
    warehouseNames: wh,
    orderPortalUrl: 'https://www.rlcarriers.com/freight/shipping/quote',
    remark: '仅人工门户下单',
    createTime: '2025-01-20 09:30:00'
  },
  {
    id: 800104,
    supplierCode: 'SUP-LTL-004',
    supplierName: 'Estes Express',
    supplierType: 'LTL',
    contactName: 'MyEstes Support',
    contactPhone: '+1 800-378-3778',
    contactEmail: 'myestes@estes-express.com',
    serviceRegion: 'TX / CA / Southeast / Northeast',
    serviceTerminals: null,
    scacCode: 'EXLA',
    dotNo: 'DOT-4410299',
    mcNo: 'MC-882104',
    insuranceInfo: 'Cargo $100K / Liability $1M',
    contractExpireDate: '2027-09-30',
    paymentTerms: 'NET30',
    status: 'ENABLED',
    score: 4.6,
    warehouseNames: wh,
    orderPortalUrl: 'https://www.estes-express.com/myestes/shipment/create',
    remark: '支持 RPA 网页下单',
    createTime: '2024-12-05 11:00:00'
  }
];

export const MOCK_OMS_SUPPLIER_QUOTES: Api.Oms.SupplierQuote[] = [
  {
    id: 810001,
    supplierId: 800001,
    supplierName: 'Pacific Drayage LLC',
    supplierType: 'DRAYAGE',
    feeType: 'PICKUP',
    feeTypeLabel: '提柜费',
    terminalCode: 'LBCT',
    warehouseName: wh,
    containerType: '40HQ',
    destination: null,
    unitPrice: 385,
    currency: 'USD',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    status: 'ACTIVE',
    versionNo: 'V2026-01',
    remark: null
  },
  {
    id: 810002,
    supplierId: 800001,
    supplierName: 'Pacific Drayage LLC',
    supplierType: 'DRAYAGE',
    feeType: 'DETENTION',
    feeTypeLabel: 'Detention Fee',
    terminalCode: 'LBCT',
    warehouseName: wh,
    containerType: '40HQ',
    destination: null,
    unitPrice: 85,
    currency: 'USD',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    status: 'ACTIVE',
    versionNo: 'V2026-01',
    remark: '每小时'
  },
  {
    id: 810003,
    supplierId: 800003,
    supplierName: 'West Coast Linehaul Inc.',
    supplierType: 'LINEHAUL',
    feeType: 'LINEHAUL',
    feeTypeLabel: '卡派运费',
    terminalCode: null,
    warehouseName: wh,
    containerType: null,
    destination: 'LAX9',
    unitPrice: 520,
    currency: 'USD',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    status: 'ACTIVE',
    versionNo: 'V2026-01',
    remark: '53ft 整车'
  },
  {
    id: 810004,
    supplierId: 800005,
    supplierName: 'LA Warehouse Labor Team',
    supplierType: 'DEVANNING_LOADING',
    feeType: 'DEVANNING_40',
    feeTypeLabel: '40尺拆柜费',
    terminalCode: null,
    warehouseName: wh,
    containerType: '40HQ',
    destination: null,
    unitPrice: 450,
    currency: 'USD',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    status: 'ACTIVE',
    versionNo: 'V2026-01',
    remark: null
  },
  {
    id: 810005,
    supplierId: 800004,
    supplierName: 'Swift Cartage Services',
    supplierType: 'LINEHAUL',
    feeType: 'LINEHAUL',
    feeTypeLabel: '卡派运费',
    terminalCode: null,
    warehouseName: wh,
    containerType: null,
    destination: 'LAX9',
    unitPrice: 495,
    currency: 'USD',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    status: 'ACTIVE',
    versionNo: 'V2026-01',
    remark: '53ft 整车 · LAX9 优选'
  },
  {
    id: 810006,
    supplierId: 800003,
    supplierName: 'West Coast Linehaul Inc.',
    supplierType: 'LINEHAUL',
    feeType: 'LINEHAUL',
    feeTypeLabel: '卡派运费',
    terminalCode: null,
    warehouseName: wh,
    containerType: null,
    destination: 'ONT8',
    unitPrice: 480,
    currency: 'USD',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    status: 'ACTIVE',
    versionNo: 'V2026-01',
    remark: '53ft 整车'
  },
  {
    id: 810007,
    supplierId: 800004,
    supplierName: 'Swift Cartage Services',
    supplierType: 'LINEHAUL',
    feeType: 'LINEHAUL',
    feeTypeLabel: '卡派运费',
    terminalCode: null,
    warehouseName: wh,
    containerType: null,
    destination: 'ONT8',
    unitPrice: 505,
    currency: 'USD',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    status: 'ACTIVE',
    versionNo: 'V2026-01',
    remark: '53ft 整车'
  },
  {
    id: 810008,
    supplierId: 800003,
    supplierName: 'West Coast Linehaul Inc.',
    supplierType: 'LINEHAUL',
    feeType: 'LINEHAUL',
    feeTypeLabel: '卡派运费',
    terminalCode: null,
    warehouseName: wh,
    containerType: null,
    destination: 'SBD1',
    unitPrice: 460,
    currency: 'USD',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    status: 'ACTIVE',
    versionNo: 'V2026-01',
    remark: '53ft 整车'
  },
  {
    id: 810009,
    supplierId: 800004,
    supplierName: 'Swift Cartage Services',
    supplierType: 'LINEHAUL',
    feeType: 'LINEHAUL',
    feeTypeLabel: '卡派运费',
    terminalCode: null,
    warehouseName: wh,
    containerType: null,
    destination: 'SBD1',
    unitPrice: 448,
    currency: 'USD',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    status: 'ACTIVE',
    versionNo: 'V2026-01',
    remark: '53ft 整车'
  }
];

export const MOCK_OMS_SUPPLIER_ACCOUNTS: Api.Oms.SupplierAccount[] = [
  {
    id: 820001,
    supplierId: 800001,
    supplierName: 'Pacific Drayage LLC',
    loginName: 'pacific_dispatch',
    contactName: 'John Miller',
    contactPhone: '+1 562-555-0101',
    roleCodes: 'TASK,BILL,DRIVER',
    status: 'ENABLED',
    lastLoginTime: '2026-05-28 08:12:00',
    createTime: '2025-01-10 09:30:00'
  },
  {
    id: 820002,
    supplierId: 800003,
    supplierName: 'West Coast Linehaul Inc.',
    loginName: 'wclinehaul_ops',
    contactName: 'David Chen',
    contactPhone: '+1 626-555-0303',
    roleCodes: 'TASK,BILL,DRIVER,VEHICLE',
    status: 'ENABLED',
    lastLoginTime: '2026-05-27 16:40:00',
    createTime: '2024-11-01 08:30:00'
  }
];

export const MOCK_OMS_SUPPLIER_BILLS: Api.Oms.SupplierBill[] = [
  {
    id: 830001,
    billNo: 'AP-202605-0001',
    supplierId: 800001,
    supplierName: 'Pacific Drayage LLC',
    supplierType: 'DRAYAGE',
    sourceTaskNo: 'YT-2026-0001',
    sourceRefNo: 'MSCU1234567',
    billAmount: 470,
    currency: 'USD',
    billStatus: 'PENDING_AUDIT',
    submitTime: '2026-05-28 10:00:00',
    auditTime: null,
    remark: '提柜+等候费'
  },
  {
    id: 830002,
    billNo: 'AP-202605-0002',
    supplierId: 800003,
    supplierName: 'West Coast Linehaul Inc.',
    supplierType: 'LINEHAUL',
    sourceTaskNo: 'YT-2026-0002',
    sourceRefNo: 'TRIP-20260528001',
    billAmount: 520,
    currency: 'USD',
    billStatus: 'SUPPLIER_CONFIRMED',
    submitTime: '2026-05-27 18:00:00',
    auditTime: null,
    remark: null
  },
  {
    id: 830003,
    billNo: 'AP-202605-0003',
    supplierId: 800005,
    supplierName: 'LA Warehouse Labor Team',
    supplierType: 'DEVANNING_LOADING',
    sourceTaskNo: 'DV-202605-0012',
    sourceRefNo: 'MSCU1234567',
    billAmount: 450,
    currency: 'USD',
    billStatus: 'PAID',
    submitTime: '2026-05-26 20:00:00',
    auditTime: '2026-05-27 11:00:00',
    remark: '40HQ 拆柜'
  }
];

export const MOCK_OMS_SUPPLIER_VEHICLES: Api.Oms.SupplierVehicle[] = [
  {
    id: 840001,
    supplierId: 800003,
    supplierName: 'West Coast Linehaul Inc.',
    plateNo: 'CA-ABC1234',
    vehicleType: '53FT',
    vehicleSize: '53ft Dry Van',
    maxWeightLbs: 45000,
    insuranceExpireDate: '2026-12-31',
    driverName: 'Tom Wilson',
    gpsDeviceNo: 'GPS-88321',
    vehicleStatus: 'ACTIVE',
    annualInspectionDate: '2026-03-15'
  },
  {
    id: 840002,
    supplierId: 800001,
    supplierName: 'Pacific Drayage LLC',
    plateNo: 'CA-TRK-8821',
    vehicleType: 'CHASSIS',
    vehicleSize: '40ft Chassis',
    maxWeightLbs: 67200,
    insuranceExpireDate: '2026-09-30',
    driverName: 'James Park',
    gpsDeviceNo: 'GPS-77210',
    vehicleStatus: 'ACTIVE',
    annualInspectionDate: '2026-06-01'
  }
];

export const MOCK_OMS_SUPPLIER_DRIVERS: Api.Oms.SupplierDriver[] = [
  {
    id: 850001,
    supplierId: 800001,
    supplierName: 'Pacific Drayage LLC',
    driverName: 'James Park',
    driverPhone: '+1 562-555-1101',
    licenseNo: 'D1234567',
    boundPlateNo: 'CA-TRK-8821',
    status: 'ACTIVE',
    gpsOnline: 1
  },
  {
    id: 850002,
    supplierId: 800003,
    supplierName: 'West Coast Linehaul Inc.',
    driverName: 'Tom Wilson',
    driverPhone: '+1 626-555-2202',
    licenseNo: 'D7654321',
    boundPlateNo: 'CA-ABC1234',
    status: 'ACTIVE',
    gpsOnline: 1
  }
];

export const MOCK_OMS_SUPPLIER_EQUIPMENTS: Api.Oms.SupplierEquipment[] = [
  {
    id: 860001,
    supplierId: 800005,
    supplierName: 'LA Warehouse Labor Team',
    equipmentType: 'FORKLIFT',
    equipmentNo: 'FL-001',
    assigneeName: '张师傅',
    assignTime: '2026-05-28 08:00:00',
    returnTime: null,
    relatedTaskNo: 'DV-202605-0012',
    equipmentStatus: 'IN_USE',
    damageFlag: 0,
    remark: null
  },
  {
    id: 860002,
    supplierId: 800005,
    supplierName: 'LA Warehouse Labor Team',
    equipmentType: 'PDA',
    equipmentNo: 'PDA-012',
    assigneeName: '李工',
    assignTime: '2026-05-28 07:30:00',
    returnTime: null,
    relatedTaskNo: 'DV-202605-0012',
    equipmentStatus: 'IN_USE',
    damageFlag: 0,
    remark: null
  }
];

export const MOCK_OMS_SUPPLIER_KPI: Api.Oms.SupplierKpiRow[] = [
  {
    id: 870001,
    supplierId: 800001,
    supplierName: 'Pacific Drayage LLC',
    supplierType: 'DRAYAGE',
    statMonth: '2026-05',
    warehouseName: wh,
    onTimePickupRate: 96.5,
    onTimeReturnRate: 94.2,
    gpsOnlineRate: 98.0,
    exceptionRate: 2.1,
    billAccuracyRate: 99.0,
    score: 4.6
  },
  {
    id: 870002,
    supplierId: 800003,
    supplierName: 'West Coast Linehaul Inc.',
    supplierType: 'LINEHAUL',
    statMonth: '2026-05',
    warehouseName: wh,
    onTimeArrivalRate: 97.8,
    onTimeDeliveryRate: 95.5,
    podUploadRate: 96.0,
    checkInPassRate: 98.5,
    rejectRate: 1.2,
    exceptionRate: 1.8,
    score: 4.8
  },
  {
    id: 870003,
    supplierId: 800005,
    supplierName: 'LA Warehouse Labor Team',
    supplierType: 'DEVANNING_LOADING',
    statMonth: '2026-05',
    warehouseName: wh,
    onTimeFinishRate: 93.5,
    devanningEfficiency: 88.0,
    loadingEfficiency: 91.2,
    siteExceptionRate: 3.5,
    equipmentDamageRate: 0.5,
    reworkRate: 1.2,
    score: 4.5
  }
];

function filterSupplierType<T extends { supplierType?: string | null }>(
  rows: T[],
  supplierType?: string | null
) {
  if (!supplierType) return rows;
  return rows.filter(r => r.supplierType === supplierType);
}

export function getOmsSupplierList(params?: Record<string, any>) {
  let rows = [...MOCK_OMS_SUPPLIERS];
  if (params?.supplierType) rows = rows.filter(r => r.supplierType === params.supplierType);
  if (params?.status) rows = rows.filter(r => r.status === params.status);
  if (params?.keyword) {
    const kw = String(params.keyword).toLowerCase();
    rows = rows.filter(r =>
      r.supplierName.toLowerCase().includes(kw)
      || r.supplierCode.toLowerCase().includes(kw)
      || (r.contactName || '').toLowerCase().includes(kw)
    );
  }
  return mockPage(rows, params);
}

export function getOmsSupplierDetail(id: number) {
  return MOCK_OMS_SUPPLIERS.find(r => r.id === id) ?? null;
}

export function getOmsSupplierQuoteList(params?: Record<string, any>) {
  let rows = [...MOCK_OMS_SUPPLIER_QUOTES];
  if (params?.supplierType) rows = filterSupplierType(rows, params.supplierType);
  if (params?.supplierId) rows = rows.filter(r => r.supplierId === Number(params.supplierId));
  if (params?.status) rows = rows.filter(r => r.status === params.status);
  if (params?.keyword) {
    const kw = String(params.keyword).toLowerCase();
    rows = rows.filter(r =>
      r.supplierName.toLowerCase().includes(kw) || r.feeTypeLabel.toLowerCase().includes(kw)
    );
  }
  return mockPage(rows, params);
}

export function recommendOmsSupplierByQuote(params?: Api.Oms.SupplierQuoteRecommendParams) {
  return buildSupplierQuoteRecommendResult(MOCK_OMS_SUPPLIER_QUOTES, {
    destination: params?.destination,
    warehouseName: params?.warehouseName,
    transportType: params?.transportType,
    loadingType: params?.loadingType
  });
}

export function getOmsSupplierAccountList(params?: Record<string, any>) {
  let rows = [...MOCK_OMS_SUPPLIER_ACCOUNTS];
  if (params?.supplierId) rows = rows.filter(r => r.supplierId === Number(params.supplierId));
  if (params?.status) rows = rows.filter(r => r.status === params.status);
  if (params?.keyword) {
    const kw = String(params.keyword).toLowerCase();
    rows = rows.filter(r =>
      r.supplierName.toLowerCase().includes(kw) || r.loginName.toLowerCase().includes(kw)
    );
  }
  return mockPage(rows, params);
}

export function getOmsSupplierBillList(params?: Record<string, any>) {
  let rows = [...MOCK_OMS_SUPPLIER_BILLS];
  if (params?.supplierType) rows = filterSupplierType(rows, params.supplierType);
  if (params?.billStatus) rows = rows.filter(r => r.billStatus === params.billStatus);
  if (params?.keyword) {
    const kw = String(params.keyword).toLowerCase();
    rows = rows.filter(r =>
      r.billNo.toLowerCase().includes(kw)
      || r.supplierName.toLowerCase().includes(kw)
      || (r.sourceRefNo || '').toLowerCase().includes(kw)
    );
  }
  return mockPage(rows, params);
}

export function getOmsSupplierVehicleList(params?: Record<string, any>) {
  let rows = [...MOCK_OMS_SUPPLIER_VEHICLES];
  if (params?.supplierId) rows = rows.filter(r => r.supplierId === Number(params.supplierId));
  if (params?.keyword) {
    const kw = String(params.keyword).toLowerCase();
    rows = rows.filter(r =>
      r.plateNo.toLowerCase().includes(kw) || r.supplierName.toLowerCase().includes(kw)
    );
  }
  return mockPage(rows, params);
}

export function getOmsSupplierDriverList(params?: Record<string, any>) {
  let rows = [...MOCK_OMS_SUPPLIER_DRIVERS];
  if (params?.supplierId) rows = rows.filter(r => r.supplierId === Number(params.supplierId));
  if (params?.keyword) {
    const kw = String(params.keyword).toLowerCase();
    rows = rows.filter(r =>
      r.driverName.toLowerCase().includes(kw) || r.supplierName.toLowerCase().includes(kw)
    );
  }
  return mockPage(rows, params);
}

export function getOmsSupplierEquipmentList(params?: Record<string, any>) {
  let rows = [...MOCK_OMS_SUPPLIER_EQUIPMENTS];
  if (params?.supplierId) rows = rows.filter(r => r.supplierId === Number(params.supplierId));
  if (params?.equipmentType) rows = rows.filter(r => r.equipmentType === params.equipmentType);
  if (params?.keyword) {
    const kw = String(params.keyword).toLowerCase();
    rows = rows.filter(r =>
      r.equipmentNo.toLowerCase().includes(kw) || r.supplierName.toLowerCase().includes(kw)
    );
  }
  return mockPage(rows, params);
}

export function getOmsSupplierKpiList(params?: Record<string, any>) {
  let rows = [...MOCK_OMS_SUPPLIER_KPI];
  if (params?.supplierType) rows = filterSupplierType(rows, params.supplierType);
  if (params?.statMonth) rows = rows.filter(r => r.statMonth === params.statMonth);
  if (params?.keyword) {
    const kw = String(params.keyword).toLowerCase();
    rows = rows.filter(r => r.supplierName.toLowerCase().includes(kw));
  }
  return mockPage(rows, params);
}

export function getOmsSupplierKpiSummary(): Api.Oms.SupplierKpiSummary {
  return {
    totalSuppliers: MOCK_OMS_SUPPLIERS.filter(s => s.status === 'ENABLED').length,
    drayageCount: MOCK_OMS_SUPPLIERS.filter(s => s.supplierType === 'DRAYAGE' && s.status === 'ENABLED').length,
    linehaulCount: MOCK_OMS_SUPPLIERS.filter(s => s.supplierType === 'LINEHAUL' && s.status === 'ENABLED').length,
    devanningLoadingCount: MOCK_OMS_SUPPLIERS.filter(s => s.supplierType === 'DEVANNING_LOADING' && s.status === 'ENABLED').length,
    pendingBills: MOCK_OMS_SUPPLIER_BILLS.filter(b => ['DRAFT', 'SUPPLIER_CONFIRMED', 'PENDING_AUDIT'].includes(b.billStatus)).length,
    avgScore: 4.5
  };
}
