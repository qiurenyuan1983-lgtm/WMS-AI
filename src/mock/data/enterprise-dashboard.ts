/** FOREST AI WMS 操作数据看板 — 企业级 Dashboard Mock */

export type EnterpriseKpiKey = 'inbound' | 'outbound' | 'inventory' | 'trip' | 'exception' | 'dock';

export type EnterpriseKpiCard = {
  key: EnterpriseKpiKey;
  label: string;
  value: number | string;
  unit?: string;
  trend: number;
  trendLabel: string;
  yesterday: string;
  icon: string;
  color: string;
  routeKey?: App.Global.RouteKey;
};

export type EnterpriseTrendPoint = { date: string; inbound: number; outbound: number };

export type EnterpriseZoneUtil = { zoneName: string; percent: number };

export type EnterpriseOrderSlice = { name: string; value: number; percent: number };

export type EnterprisePendingTask = {
  key: string;
  label: string;
  count: number;
  delta: number;
  routeKey?: App.Global.RouteKey;
};

export type EnterpriseAbnormalAlert = {
  id: number;
  title: string;
  severity: 'severe' | 'high' | 'medium';
  severityLabel: string;
  count: number;
  elapsed: string;
  routeKey?: App.Global.RouteKey;
};

export type EnterpriseDockStatus = {
  id: string;
  dockNo: string;
  status: 'loading' | 'checked_in' | 'idle' | 'abnormal';
  statusLabel: string;
  driver: string;
  plateNo: string;
};

export type EnterpriseAppointmentSlot = { time: string; tripCount: number };

export type EnterpriseOperationLog = {
  id: number;
  time: string;
  module: string;
  action: string;
  operator: string;
  status: string;
};

export type EnterpriseAiSuggestion = {
  id: number;
  type: 'info' | 'success' | 'warning';
  title: string;
  detail: string;
  expanded?: string;
};

export type EnterpriseDashboardData = {
  refreshTime: string;
  kpis: EnterpriseKpiCard[];
  trendDays: number;
  trend: EnterpriseTrendPoint[];
  zoneUtilization: EnterpriseZoneUtil[];
  orderStructure: EnterpriseOrderSlice[];
  orderTotal: number;
  pendingTasks: EnterprisePendingTask[];
  abnormalAlerts: EnterpriseAbnormalAlert[];
  dockStatuses: EnterpriseDockStatus[];
  appointmentDate: string;
  appointmentSlots: EnterpriseAppointmentSlot[];
  operationLogs: EnterpriseOperationLog[];
  aiSuggestions: EnterpriseAiSuggestion[];
};

const BASE: EnterpriseDashboardData = {
  refreshTime: '',
  kpis: [
    {
      key: 'inbound',
      label: '\u4eca\u65e5\u5165\u5e93\u8ba2\u5355',
      value: 1248,
      unit: '\u5355',
      trend: 12.6,
      trendLabel: '\u8f83\u6628\u65e5',
      yesterday: '1,108 \u5355',
      icon: 'material-symbols:inventory-2-outline',
      color: '#2563eb',
      routeKey: 'wms_devanning-work'
    },
    {
      key: 'outbound',
      label: '\u4eca\u65e5\u51fa\u5e93\u8ba2\u5355',
      value: 2306,
      unit: '\u5355',
      trend: 15.3,
      trendLabel: '\u8f83\u6628\u65e5',
      yesterday: '1,999 \u5355',
      icon: 'material-symbols:local-shipping-outline',
      color: '#059669',
      routeKey: 'wms_outbound-exec'
    },
    {
      key: 'inventory',
      label: '\u5e93\u5b58\u603b\u677f\u6570',
      value: 56782,
      unit: '\u677f',
      trend: 2.1,
      trendLabel: '\u8f83\u6628\u65e5',
      yesterday: '55,623 \u677f',
      icon: 'material-symbols:inventory-2-outline',
      color: '#7c3aed',
      routeKey: 'wms_inventory-visualization'
    },
    {
      key: 'trip',
      label: '\u5728\u9014\u8f66\u6b21',
      value: 38,
      unit: '\u8f66\u6b21',
      trend: 8.6,
      trendLabel: '\u8f83\u6628\u65e5',
      yesterday: '35 \u8f66\u6b21',
      icon: 'material-symbols:directions-bus-outline',
      color: '#0284c7',
      routeKey: 'wms_outbound-order'
    },
    {
      key: 'exception',
      label: '\u5f02\u5e38\u6570\u91cf',
      value: 15,
      unit: '\u6761',
      trend: 7,
      trendLabel: '\u8f83\u6628\u65e5',
      yesterday: '8 \u6761',
      icon: 'material-symbols:warning-outline',
      color: '#ea580c',
      routeKey: 'wms_trip-exception'
    },
    {
      key: 'dock',
      label: 'DOCK\u5229\u7528\u7387',
      value: '82.6%',
      trend: 4.8,
      trendLabel: '\u8f83\u6628\u65e5',
      yesterday: '77.8%',
      icon: 'material-symbols:warehouse-outline',
      color: '#1d4ed8',
      routeKey: 'wms_driver-checkin'
    }
  ],
  trendDays: 7,
  trend: [
    { date: '05-10', inbound: 980, outbound: 1820 },
    { date: '05-11', inbound: 1050, outbound: 1950 },
    { date: '05-12', inbound: 1120, outbound: 2010 },
    { date: '05-13', inbound: 1180, outbound: 2100 },
    { date: '05-14', inbound: 1210, outbound: 2180 },
    { date: '05-15', inbound: 1108, outbound: 1999 },
    { date: '05-16', inbound: 1248, outbound: 2306 }
  ],
  zoneUtilization: [
    { zoneName: 'A\u533a', percent: 92.1 },
    { zoneName: 'B\u533a', percent: 78.3 },
    { zoneName: 'C\u533a', percent: 63.5 },
    { zoneName: 'D\u533a', percent: 71.2 },
    { zoneName: 'FedEx\u533a', percent: 55.4 },
    { zoneName: '\u8d35\u54c1\u533a', percent: 88.7 }
  ],
  orderStructure: [
    { name: 'Amazon', value: 1128, percent: 48.9 },
    { name: 'Walmart', value: 533, percent: 23.1 },
    { name: 'SHEIN', value: 355, percent: 15.4 },
    { name: '\u79c1\u4eba\u5730\u5740', value: 175, percent: 7.6 },
    { name: 'FBX', value: 115, percent: 5.0 }
  ],
  orderTotal: 2306,
  pendingTasks: [
    { key: 'putaway', label: '\u5f85\u4e0a\u67b6', count: 568, delta: -36, routeKey: 'wms_pallet' },
    { key: 'loading', label: '\u5f85\u88c5\u8f66', count: 312, delta: 18, routeKey: 'wms_outbound-loading' },
    { key: 'count', label: '\u5f85\u76d8\u70b9', count: 126, delta: 5, routeKey: 'wms_pallet' },
    { key: 'review', label: '\u5f85\u590d\u6838', count: 84, delta: -7, routeKey: 'wms_outbound-exec' }
  ],
  abnormalAlerts: [
    { id: 1, title: '\u6df7\u8d27\u5f02\u5e38', severity: 'severe', severityLabel: '\u4e25\u91cd', count: 6, elapsed: '10\u5206\u949f\u524d', routeKey: 'wms_trip-exception' },
    { id: 2, title: '\u5c11\u4ef6\u5f02\u5e38', severity: 'high', severityLabel: '\u8f83\u9ad8', count: 4, elapsed: '23\u5206\u949f\u524d', routeKey: 'wms_trip-exception' },
    { id: 3, title: '\u88c5\u9519\u8f66', severity: 'high', severityLabel: '\u8f83\u9ad8', count: 3, elapsed: '45\u5206\u949f\u524d', routeKey: 'wms_trip-exception' },
    { id: 4, title: '\u7834\u635f\u5f02\u5e38', severity: 'medium', severityLabel: '\u4e2d\u7b49', count: 2, elapsed: '1\u5c0f\u65f6\u524d', routeKey: 'wms_trip-exception' }
  ],
  dockStatuses: [
    { id: 'd1', dockNo: 'DOCK-01', status: 'loading', statusLabel: '\u88c5\u8f66\u4e2d', driver: 'John Smith', plateNo: 'CA-8K2910' },
    { id: 'd2', dockNo: 'DOCK-02', status: 'checked_in', statusLabel: '\u5df2\u7b7e\u5230', driver: 'Mike Chen', plateNo: 'CA-5H8821' },
    { id: 'd3', dockNo: 'DOCK-03', status: 'idle', statusLabel: '\u7a7a\u95f2', driver: '\u2014', plateNo: '\u2014' },
    { id: 'd4', dockNo: 'DOCK-04', status: 'loading', statusLabel: '\u88c5\u8f66\u4e2d', driver: 'Carlos Ruiz', plateNo: 'CA-2M4419' },
    { id: 'd5', dockNo: 'DOCK-05', status: 'abnormal', statusLabel: '\u5f02\u5e38', driver: 'Tom Lee', plateNo: 'CA-9P1102' },
    { id: 'd6', dockNo: 'DOCK-06', status: 'idle', statusLabel: '\u7a7a\u95f2', driver: '\u2014', plateNo: '\u2014' }
  ],
  appointmentDate: '2026-05-16',
  appointmentSlots: [
    { time: '09:00', tripCount: 10 },
    { time: '10:00', tripCount: 8 },
    { time: '11:00', tripCount: 12 },
    { time: '13:00', tripCount: 6 },
    { time: '14:00', tripCount: 9 },
    { time: '15:00', tripCount: 14 },
    { time: '16:00', tripCount: 11 }
  ],
  operationLogs: [
    { id: 1, time: '14:32:08', module: 'WMS\u7cfb\u7edf', action: '\u521b\u5efa\u51fa\u5e93\u8ba2\u5355 TRIP250516008', operator: '\u5f20\u4e09', status: '\u6210\u529f' },
    { id: 2, time: '14:28:15', module: 'WMS\u7cfb\u7edf', action: '\u5b8c\u6210\u62c6\u67dc MSCU1234567', operator: '\u674e\u56db', status: '\u6210\u529f' },
    { id: 3, time: '14:25:42', module: 'OMS\u7cfb\u7edf', action: '\u5ba1\u6279\u8f66\u6b21\u8ba2\u5355 TRIP250516005', operator: '\u7cfb\u7edf\u7ba1\u7406\u5458', status: '\u6210\u529f' },
    { id: 4, time: '14:20:33', module: 'WMS\u7cfb\u7edf', action: '\u4e0a\u67b6\u5b8c\u6210 PLT-202605-088', operator: '\u738b\u4e94', status: '\u6210\u529f' },
    { id: 5, time: '14:15:19', module: 'WMS\u7cfb\u7edf', action: '\u53d1\u8d77\u5f02\u5e38 EXC250516003', operator: 'QC Lisa', status: '\u6210\u529f' }
  ],
  aiSuggestions: [
    {
      id: 1,
      type: 'info',
      title: '\u5efa\u8bae\u4f18\u5148\u91ca\u653eA\u533a\u9ad8\u5360\u7528\u5e93\u4f4d',
      detail: 'A\u533a\u5f53\u524d\u5360\u7528\u7387 92.1%\uff0c\u5efa\u8bae\u4f18\u5148\u5b89\u6392\u5c3e\u677f\u51fa\u5e93\u6216\u8f6c\u79fb\u81f3 B\u533a\u7a7a\u95f2\u5e93\u4f4d\u3002',
      expanded: '\u5f71\u54cd\u5e93\u4f4d\uff1aA01-A16 \u5171 28 \u4e2a\u9ad8\u5360\u7528\u5e93\u4f4d\u3002\u9884\u8ba1\u53ef\u91ca\u653e 120 \u677f\u5bb9\u91cf\u3002\u5efa\u8bae\u5728 15:30 \u51fa\u5e93\u9ad8\u5cf0\u524d\u5b8c\u6210\u8c03\u5ea6\u3002'
    },
    {
      id: 2,
      type: 'success',
      title: '\u4eca\u65e5\u51fa\u5e93\u9ad8\u5cf0\u9884\u8ba1 15:30-17:00',
      detail: '\u6839\u636e\u8fd1 7 \u5929\u8f66\u6b21\u6570\u636e\uff0c\u4eca\u65e5\u4e0b\u5348\u51fa\u5e93\u91cf\u9884\u8ba1\u8f83\u6628\u65e5\u540c\u671f\u589e\u957f 18%\u3002',
      expanded: '\u5efa\u8bae\u63d0\u524d\u5b89\u6392 DOCK-01/04 \u88c5\u8f66\u4eba\u5458\uff0c\u5e76\u901a\u77e5\u5361\u6d3e\u4f9b\u5e94\u5546 ABC Trucking \u52a0\u6d3e 2 \u8f86\u8f66\u3002'
    },
    {
      id: 3,
      type: 'warning',
      title: '\u8d35\u54c1\u533a\u5269\u4f59\u5bb9\u91cf\u4e0d\u8db3',
      detail: '\u8d35\u54c1\u533a\u5f53\u524d\u5360\u7528\u7387 88.7%\uff0c\u4ec5\u5269 42 \u677f\u5bb9\u91cf\uff0c\u5efa\u8bae\u9650\u5236\u65b0\u5165\u5e93\u5206\u914d\u3002',
      expanded: '\u9884\u8ba1\u4eca\u65e5\u65b0\u589e\u8d35\u54c1\u5165\u5e93 56 \u677f\uff0c\u5bb9\u91cf\u4e0d\u8db3\u3002\u53ef\u8003\u8651\u8f6c\u81f3 C\u533a\u79c1\u4eba\u5e93\u533a\u6216\u542f\u7528\u5f85\u7528\u5e93\u4f4d\u3002'
    }
  ]
};

function nowStr() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function jitterNum(n: number, pct = 0.015) {
  const delta = Math.round(n * pct * (Math.random() * 2 - 1));
  return Math.max(0, n + delta);
}

function cloneBase(): EnterpriseDashboardData {
  return JSON.parse(JSON.stringify(BASE)) as EnterpriseDashboardData;
}

export function getEnterpriseDashboardData(params?: { trendDays?: number }): EnterpriseDashboardData {
  const data = cloneBase();
  const days = params?.trendDays === 30 ? 30 : 7;
  data.trendDays = days;
  data.refreshTime = nowStr();

  if (days === 30) {
    const trend: EnterpriseTrendPoint[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      trend.push({
        date: label,
        inbound: jitterNum(1000 + (29 - i) * 8),
        outbound: jitterNum(1700 + (29 - i) * 18)
      });
    }
    data.trend = trend;
  }

  data.kpis = data.kpis.map(k => {
    if (typeof k.value === 'number') {
      return { ...k, value: jitterNum(k.value) };
    }
    if (k.key === 'dock') {
      const v = 82.6 + (Math.random() - 0.5) * 2;
      return { ...k, value: `${v.toFixed(1)}%` };
    }
    return k;
  });

  data.pendingTasks = data.pendingTasks.map(t => ({
    ...t,
    count: jitterNum(t.count, 0.03)
  }));

  const lastTrend = data.trend[data.trend.length - 1];
  if (lastTrend) {
    const inboundKpi = data.kpis.find(k => k.key === 'inbound');
    const outboundKpi = data.kpis.find(k => k.key === 'outbound');
    if (inboundKpi && typeof inboundKpi.value === 'number') inboundKpi.value = lastTrend.inbound;
    if (outboundKpi && typeof outboundKpi.value === 'number') outboundKpi.value = lastTrend.outbound;
  }

  return data;
}
