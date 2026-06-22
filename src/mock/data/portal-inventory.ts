import { buildLocationSummaryFromPallets } from '@/utils/portal/location-summary';
import { mockPage } from '../utils';

const INVENTORY_SKUS: Api.Portal.PortalInventorySku[] = [
  {
    sku: 'SKU-ANK-01',
    productName: '数据线 Type-C',
    warehouseCode: 'LAX',
    onHandQty: 1200,
    availableQty: 980,
    reservedQty: 220,
    safetyQty: 50,
    locationSummary: 'A10(2/板)/A12(1/板)',
    lowStock: false
  },
  {
    sku: 'SKU-POP-12',
    productName: '盲盒系列 A',
    warehouseCode: 'LAX',
    onHandQty: 480,
    availableQty: 320,
    reservedQty: 160,
    safetyQty: 100,
    locationSummary: 'B03(3/板)',
    lowStock: false
  },
  {
    sku: 'SKU-A002',
    productName: '充电器 20W',
    warehouseCode: 'LAX',
    onHandQty: 15,
    availableQty: 12,
    reservedQty: 3,
    safetyQty: 40,
    locationSummary: 'C01(1/板)',
    lowStock: true
  },
  {
    sku: 'SKU-DROP-88',
    productName: '代发爆款耳机',
    warehouseCode: 'NJ',
    onHandQty: 860,
    availableQty: 860,
    reservedQty: 0,
    safetyQty: 200,
    locationSummary: 'NJ-A05(4/板)',
    lowStock: false
  }
];

const ASN_ROWS: Api.Portal.PortalAsnRow[] = [
  {
    id: 1,
    asnNo: 'ASN20260617001',
    warehouseCode: 'LAX',
    containerNo: 'OOLU5566778',
    status: 'ARRIVED',
    statusLabel: '已到仓',
    expectedQty: 120,
    arrivedTime: '2026-06-17 07:30:00',
    createTime: '2026-06-10 14:00:00'
  },
  {
    id: 2,
    asnNo: 'ASN20260617002',
    warehouseCode: 'LAX',
    containerNo: 'MSKU1234567',
    status: 'PENDING_ARRIVAL',
    statusLabel: '待到仓',
    expectedQty: 86,
    arrivedTime: null,
    createTime: '2026-06-12 09:00:00'
  },
  {
    id: 3,
    asnNo: 'ASN20260617003',
    warehouseCode: 'NJ',
    containerNo: null,
    status: 'PUTAWAY',
    statusLabel: '上架中',
    expectedQty: 45,
    arrivedTime: '2026-06-16 18:00:00',
    createTime: '2026-06-14 11:20:00'
  }
];

const SHIPMENT_ROWS: Api.Portal.PortalShipmentRow[] = [
  {
    id: 1,
    shipmentNo: 'SHP-20260617-001',
    orderNo: 'CO-2026-1028',
    warehouseCode: 'LAX',
    status: 'SHIPPED',
    statusLabel: '已发货',
    carrier: 'UPS',
    tracking: '1Z999AA10123456784',
    shipTime: '2026-06-17 09:30:00'
  },
  {
    id: 2,
    shipmentNo: 'SHP-20260616-088',
    orderNo: 'CO-2026-1024',
    warehouseCode: 'LAX',
    status: 'PENDING_PICK',
    statusLabel: '待拣货',
    carrier: '—',
    tracking: null,
    shipTime: null
  },
  {
    id: 3,
    shipmentNo: 'SHP-20260616-072',
    orderNo: 'CO-2026-1035',
    warehouseCode: 'LAX',
    status: 'PENDING_AUDIT',
    statusLabel: '待审核',
    carrier: 'West Coast Linehaul',
    tracking: null,
    shipTime: null
  }
];

/** 一件代发可选 SKU */
export const PORTAL_DROPSHIP_SKU_OPTIONS = INVENTORY_SKUS.filter(s => s.availableQty > 0).map(s => ({
  label: `${s.sku} · ${s.productName}（可用 ${s.availableQty}）`,
  value: s.sku,
  availableQty: s.availableQty
}));

export function getPortalInventoryList(params: Record<string, unknown> = {}) {
  const keyword = String(params.keyword ?? '').trim().toLowerCase();
  const lowStockOnly = params.lowStockOnly === true || params.lowStockOnly === 'true';
  let rows = [...INVENTORY_SKUS];
  if (lowStockOnly) rows = rows.filter(r => r.lowStock);
  if (keyword) {
    rows = rows.filter(
      r => r.sku.toLowerCase().includes(keyword) || r.productName.toLowerCase().includes(keyword)
    );
  }
  return mockPage(rows, params);
}

export function getPortalAsnList(params: Record<string, unknown> = {}) {
  return mockPage(ASN_ROWS, params);
}

export function getPortalShipmentList(params: Record<string, unknown> = {}) {
  return mockPage(SHIPMENT_ROWS, params);
}

export function getPortalDropshipSkuOptions() {
  return PORTAL_DROPSHIP_SKU_OPTIONS;
}

export function resolveSkuLocationSummary(sku: string): string {
  const item = INVENTORY_SKUS.find(s => s.sku === sku);
  return item?.locationSummary || buildLocationSummaryFromPallets([]);
}
