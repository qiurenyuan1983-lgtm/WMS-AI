import type { PortalOrderChannel } from '@/utils/portal/portal-order-channel';
import { formatMoney } from '@/utils/portal/portal-money';

export const PORTAL_WAREHOUSES: Api.Portal.WarehouseOption[] = [
  { id: 0, code: 'ALL', name: '全部仓库', timezone: 'America/Los_Angeles', defaultCurrency: 'USD' },
  { id: 101, code: 'LAX', name: 'Los Angeles DC', timezone: 'America/Los_Angeles', defaultCurrency: 'USD' },
  { id: 102, code: 'NJ', name: 'New Jersey DC', timezone: 'America/New_York', defaultCurrency: 'USD' },
  { id: 103, code: 'TX', name: 'Dallas DC', timezone: 'America/Chicago', defaultCurrency: 'USD' }
];

const ORDER_TREND = Array.from({ length: 30 }, (_, i) => {
  const day = String(i + 1).padStart(2, '0');
  return { date: `06/${day}`, orderCount: 12 + (i % 7) * 3 + (i % 3) };
});

const INVENTORY_STATS = {
  skuTotal: 5000,
  onHandQty: 120000,
  availableQty: 100000,
  lockedQty: 15000,
  damagedQty: 5000
};

const LOW_STOCK = [
  { sku: 'A001', productName: '数据线', currentQty: 20, safetyQty: 50 },
  { sku: 'A002', productName: '充电器', currentQty: 15, safetyQty: 40 },
  { sku: 'B018', productName: '蓝牙音箱', currentQty: 8, safetyQty: 30 }
];

const ASN_STATUS = [
  { status: 'PENDING_ARRIVAL', label: '待到仓', count: 10 },
  { status: 'ARRIVED', label: '已到仓', count: 8 },
  { status: 'PUTAWAY', label: '上架中', count: 3 },
  { status: 'COMPLETED', label: '已完成', count: 25 }
];

const SHIPMENT_STATUS = [
  { status: 'PENDING_AUDIT', label: '待审核', count: 20 },
  { status: 'PENDING_PICK', label: '待拣货', count: 15 },
  { status: 'PENDING_SHIP', label: '待出库', count: 8 },
  { status: 'COMPLETED', label: '已完成', count: 180 }
];

const RECENT_ASN = ['ASN20260617001', 'ASN20260617002', 'ASN20260617003'];

const RECENT_SHIPMENTS = [
  { shipmentNo: 'SHP-20260617-001', tracking: '1Z999AA10123456784', carrier: 'UPS', shipTime: '2026-06-17 09:30:00' },
  { shipmentNo: 'SHP-20260616-088', tracking: '9400111899223344556677', carrier: 'USPS', shipTime: '2026-06-16 16:20:00' },
  { shipmentNo: 'SHP-20260616-072', tracking: 'TRK-WCL-8821', carrier: 'West Coast Linehaul', shipTime: '2026-06-16 14:05:00' }
];

const IN_TRANSIT = [
  {
    id: 1,
    refNo: 'Truck #001',
    route: 'Los Angeles → Phoenix',
    gpsStatus: 'TRACKING',
    eta: '2026-06-17 18:00:00',
    statusLabel: '运输中'
  },
  {
    id: 2,
    refNo: 'Truck #002',
    route: 'Los Angeles → Dallas',
    gpsStatus: 'TRACKING',
    eta: '2026-06-18 10:30:00',
    statusLabel: '运输中'
  },
  {
    id: 3,
    refNo: 'Container #MSKU1234567',
    route: 'Long Beach Port → LAX DC',
    gpsStatus: 'IN_FENCE',
    eta: '2026-06-17 12:00:00',
    statusLabel: '已到港'
  }
];

const NOTIFICATIONS = [
  { id: 1, type: 'ASN', title: 'ASN 到仓通知', content: 'ASN20260617002 已到达 LA 仓', time: '2026-06-17 08:10:00' },
  { id: 2, type: 'SHIP', title: '订单发货通知', content: 'SHP-20260617-001 已发货', time: '2026-06-17 09:35:00' },
  { id: 3, type: 'STOCK', title: '库存预警通知', content: 'SKU A002 低于安全库存', time: '2026-06-16 22:00:00' },
  { id: 4, type: 'BILL', title: '账单生成通知', content: '2026-06 账单已生成', time: '2026-06-16 09:00:00' }
];

const KPI = {
  onTimeRate: 99.2,
  inventoryAccuracy: 99.8,
  inboundHours: 4.2,
  outboundHours: 2.1,
  exceptionHours: 3.5
};

function filterByWarehouse<T extends { warehouseId?: number }>(rows: T[], warehouseId?: number | null) {
  if (!warehouseId) return rows;
  return rows.filter(r => !r.warehouseId || r.warehouseId === warehouseId);
}

export function getPortalWarehouses() {
  return PORTAL_WAREHOUSES;
}

export function getPortalDashboardOverview(warehouseId?: number | null): Api.Portal.DashboardOverview {
  const wh = PORTAL_WAREHOUSES.find(w => w.id === warehouseId) || PORTAL_WAREHOUSES[1];
  const currency = wh.defaultCurrency;
  const factor = warehouseId && warehouseId !== 0 ? 0.45 : 1;

  return {
    warehouseId: warehouseId ?? 0,
    currency,
    order: {
      todayTotal: Math.round(42 * factor),
      pending: Math.round(15 * factor),
      shipped: Math.round(180 * factor),
      completed: Math.round(320 * factor),
      exception: Math.round(3 * factor),
      todayStatus: [
        { label: '待审核', count: Math.round(15 * factor) },
        { label: '待拣货', count: Math.round(35 * factor) },
        { label: '待包装', count: Math.round(20 * factor) },
        { label: '待出库', count: Math.round(12 * factor) },
        { label: '已发货', count: Math.round(180 * factor) },
        { label: '异常订单', count: Math.round(3 * factor) }
      ]
    },
    inventory: {
      skuTotal: Math.round(INVENTORY_STATS.skuTotal * factor),
      totalQty: Math.round(INVENTORY_STATS.onHandQty * factor),
      availableQty: Math.round(INVENTORY_STATS.availableQty * factor),
      reservedQty: Math.round(INVENTORY_STATS.lockedQty * factor),
      outOfStockSku: warehouseId && warehouseId !== 0 ? 1 : 2,
      stats: INVENTORY_STATS,
      lowStockAlerts: LOW_STOCK
    },
    inTransit: {
      expectedArrivalQty: Math.round(860 * factor),
      containerInTransit: Math.round(4 * factor),
      pendingDevanning: Math.round(2 * factor),
      pendingPutaway: Math.round(18 * factor),
      mapItems: IN_TRANSIT
    },
    finance: {
      monthlyStorage: formatMoney(2300 * factor, currency),
      monthlyOperation: formatMoney(1500 * factor, currency),
      pendingPayment: formatMoney(4200 * factor, currency),
      accountBalance: formatMoney(12800 * factor, currency),
      monthTotal: formatMoney(13400 * factor, currency),
      feeBreakdown: [
        { label: '仓租费', amount: formatMoney(2300 * factor, currency) },
        { label: '入库费', amount: formatMoney(1500 * factor, currency) },
        { label: '出库费', amount: formatMoney(3200 * factor, currency) },
        { label: '贴标费', amount: formatMoney(800 * factor, currency) },
        { label: '运输费', amount: formatMoney(5600 * factor, currency) }
      ]
    },
    asn: { statusRows: ASN_STATUS, recentAsn: RECENT_ASN },
    shipment: { statusRows: SHIPMENT_STATUS, recentRows: RECENT_SHIPMENTS },
    notifications: NOTIFICATIONS,
    kpi: KPI,
    orderTrend: ORDER_TREND.map(p => ({ ...p, orderCount: Math.round(p.orderCount * factor) }))
  };
}

export function getPortalContainers(warehouseId?: number | null): Api.Portal.PortalContainerSummary[] {
  const rows: Api.Portal.PortalContainerSummary[] = [
    {
      id: 1,
      containerNo: 'MSKU1234567',
      warehouseId: 101,
      warehouseCode: 'LAX',
      loadingType: 'MIXED',
      cargoCount: 5,
      channelBreakdown: [
        { channel: 'AMAZON', count: 2 },
        { channel: 'COMMERCIAL_PLATFORM', count: 1 },
        { channel: 'PRIVATE_ADDRESS', count: 1 },
        { channel: 'TRANSFER', count: 1 }
      ],
      status: '在途',
      eta: '2026-06-17 12:00:00'
    },
    {
      id: 2,
      containerNo: 'TCLU9876543',
      warehouseId: 101,
      warehouseCode: 'LAX',
      loadingType: 'PALLET',
      cargoCount: 3,
      channelBreakdown: [
        { channel: 'AMAZON', count: 2 },
        { channel: 'DROPSHIP', count: 1 }
      ],
      status: '已到仓',
      eta: null
    },
    {
      id: 3,
      containerNo: 'OOLU5566778',
      warehouseId: 102,
      warehouseCode: 'NJ',
      loadingType: 'MIXED',
      cargoCount: 4,
      channelBreakdown: [
        { channel: 'COMMERCIAL_PLATFORM', count: 2 },
        { channel: 'PRIVATE_ADDRESS', count: 1 },
        { channel: 'TRANSFER', count: 1 }
      ],
      status: '拆柜中',
      eta: null
    }
  ];
  return filterByWarehouse(rows, warehouseId && warehouseId !== 0 ? warehouseId : undefined);
}

export function getPortalContainerDetail(containerNo: string): Api.Portal.PortalContainerDetail | null {
  const summary = getPortalContainers().find(c => c.containerNo === containerNo);
  if (!summary) return null;

  const cargoLines: Api.Portal.PortalContainerCargoLine[] = [
    {
      orderNo: 'CO-2026-1021',
      customerOrderNo: 'FSHY2508058785',
      orderChannel: 'AMAZON',
      destination: 'ONT8',
      palletQty: 2,
      locationSummary: 'A10(2/板)',
      status: '已入库'
    },
    {
      orderNo: 'CO-2026-1035',
      customerOrderNo: 'FSHY2508061201',
      orderChannel: 'COMMERCIAL_PLATFORM',
      destination: 'ORD2',
      palletQty: 1,
      locationSummary: 'A12(1/板)',
      status: '已出单'
    },
    {
      orderNo: 'CO-2026-1042',
      customerOrderNo: 'FSHY2508061305',
      orderChannel: 'PRIVATE_ADDRESS',
      destination: 'Dallas, TX',
      palletQty: 1,
      locationSummary: 'B03(1/板)',
      status: '待派送'
    },
    {
      orderNo: 'CO-2026-1045',
      customerOrderNo: 'FSHY2508061310',
      orderChannel: 'TRANSFER',
      destination: '暂扣区',
      palletQty: 1,
      locationSummary: 'HOLD-01(1/板)',
      status: '已入库'
    }
  ];

  return { ...summary, cargoLines: cargoLines.slice(0, summary.cargoCount) };
}

const GPS_STATUS_LABEL: Record<string, string> = {
  TRACKING: 'GPS 追踪中',
  IN_FENCE: '已到围栏',
  OFFLINE: '信号中断'
};

const IN_TRANSIT_DETAILS: Api.Portal.PortalInTransitDetail[] = [
  {
    id: 1,
    refNo: 'Truck #001',
    refType: 'TRUCK',
    route: 'Los Angeles → Phoenix',
    gpsStatus: 'TRACKING',
    gpsStatusLabel: 'GPS 追踪中',
    eta: '2026-06-17 18:00:00',
    statusLabel: '运输中',
    relatedOrders: ['CO-2026-1028', 'CO-2026-1035'],
    lastLocation: 'I-10 E, near Indio, CA',
    driverName: 'Mike R.'
  },
  {
    id: 2,
    refNo: 'Truck #002',
    refType: 'TRUCK',
    route: 'Los Angeles → Dallas',
    gpsStatus: 'TRACKING',
    gpsStatusLabel: 'GPS 追踪中',
    eta: '2026-06-18 10:30:00',
    statusLabel: '运输中',
    relatedOrders: ['CO-2026-1042'],
    lastLocation: 'I-40 E, near Flagstaff, AZ',
    driverName: 'James L.'
  },
  {
    id: 3,
    refNo: 'Container MSKU1234567',
    refType: 'CONTAINER',
    route: 'Long Beach Port → LAX DC',
    gpsStatus: 'IN_FENCE',
    gpsStatusLabel: '已到围栏',
    eta: '2026-06-17 12:00:00',
    statusLabel: '已到港',
    relatedOrders: ['CO-2026-1021', 'CO-2026-1035', 'CO-2026-1045'],
    lastLocation: 'LAX DC 卸货区',
    driverName: null
  }
];

export function getPortalInTransitList(warehouseId?: number | null): Api.Portal.PortalInTransitDetail[] {
  if (warehouseId && warehouseId !== 0 && warehouseId !== 101) {
    return IN_TRANSIT_DETAILS.filter(i => i.id === 2);
  }
  return IN_TRANSIT_DETAILS;
}

export function getPortalInTransitDetail(id: number): Api.Portal.PortalInTransitDetail | null {
  return IN_TRANSIT_DETAILS.find(i => i.id === id) ?? null;
}

export type { PortalOrderChannel };
