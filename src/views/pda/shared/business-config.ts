export type BusinessKey = 'transfer' | 'transit' | 'dropship';

export type PdaModule = {
  key: string;
  label: string;
  badge: number;
  icon: string;
  route: string;
  query?: Record<string, string>;
};

export type BusinessGroup = {
  key: BusinessKey;
  label: string;
  desc: string;
  accent: string;
  icon: string;
  modules: PdaModule[];
};

export const BIZ_LABELS: Record<BusinessKey, string> = {
  transfer: '转运业务',
  transit: '中转业务',
  dropship: '一件代发'
};

export const VALID_BUSINESS_KEYS: BusinessKey[] = ['transfer', 'transit', 'dropship'];

export function isValidBusinessKey(biz: string): biz is BusinessKey {
  return VALID_BUSINESS_KEYS.includes(biz as BusinessKey);
}

export function resolveTaskType(raw: string): string {
  const valid = ['putaway', 'move', 'count', 'operation', 'exception', 'receive', 'merge', 'split'];
  return valid.includes(raw) ? raw : 'exception';
}

export const PDA_BUSINESS_GROUPS: BusinessGroup[] = [
  {
    key: 'transfer',
    label: '转运业务',
    desc: '快进快出 · 海柜拆转',
    accent: '#5b54d8',
    icon: '\uD83D\uDEA2',
    modules: [
      { key: 'inbound', label: '入库', badge: 5, icon: '\uD83D\uDCE6', route: 'pda_inbound', query: { biz: 'transfer' } },
      { key: 'outbound', label: '出库', badge: 12, icon: '\uD83D\uDE9A', route: 'pda_outbound', query: { biz: 'transfer' } },
      { key: 'devanning', label: '拆柜', badge: 3, icon: '\uD83D\uDEA2', route: 'pda_devanning', query: { biz: 'transfer' } },
      { key: 'move', label: '库位变更', badge: 2, icon: '\uD83D\uDD04', route: 'pda_task', query: { taskType: 'move', biz: 'transfer' } },
      { key: 'count', label: '盘点', badge: 1, icon: '\uD83D\uDCCA', route: 'pda_task', query: { taskType: 'count', biz: 'transfer' } },
      { key: 'exception', label: '异常', badge: 4, icon: '\u26A0\uFE0F', route: 'pda_task', query: { taskType: 'exception', biz: 'transfer' } }
    ]
  },
  {
    key: 'transit',
    label: '中转业务',
    desc: '大货中转 · 指令作业',
    accent: '#0ea5e9',
    icon: '\uD83D\uDCE6',
    modules: [
      { key: 'putaway', label: '上库', badge: 22, icon: '\u2B06\uFE0F', route: 'pda_task', query: { taskType: 'putaway', biz: 'transit' } },
      { key: 'pick', label: '指令拣货', badge: 18, icon: '\uD83D\uDCCB', route: 'wms_outbound-exec', query: { biz: 'transit', mode: 'instruction' } },
      { key: 'order-op', label: '订单操作', badge: 7, icon: '\uD83D\uDCDD', route: 'pda_task', query: { taskType: 'operation', biz: 'transit' } },
      { key: 'move', label: '库位变更', badge: 3, icon: '\uD83D\uDD04', route: 'pda_task', query: { taskType: 'move', biz: 'transit' } },
      { key: 'count', label: '盘点', badge: 2, icon: '\uD83D\uDCCA', route: 'pda_task', query: { taskType: 'count', biz: 'transit' } },
      { key: 'exception', label: '异常', badge: 5, icon: '\u26A0\uFE0F', route: 'pda_task', query: { taskType: 'exception', biz: 'transit' } }
    ]
  },
  {
    key: 'dropship',
    label: '一件代发',
    desc: '电商代发 · 小件作业',
    accent: '#10b981',
    icon: '\uD83D\uDECD\uFE0F',
    modules: [
      { key: 'putaway', label: '上库', badge: 15, icon: '\u2B06\uFE0F', route: 'pda_task', query: { taskType: 'putaway', biz: 'dropship' } },
      { key: 'pick', label: '指令拣货', badge: 26, icon: '\uD83D\uDCCB', route: 'wms_outbound-exec', query: { biz: 'dropship', mode: 'instruction' } },
      { key: 'order-op', label: '订单操作', badge: 9, icon: '\uD83D\uDCDD', route: 'pda_task', query: { taskType: 'operation', biz: 'dropship' } },
      { key: 'move', label: '库位变更', badge: 1, icon: '\uD83D\uDD04', route: 'pda_task', query: { taskType: 'move', biz: 'dropship' } },
      { key: 'count', label: '盘点', badge: 0, icon: '\uD83D\uDCCA', route: 'pda_task', query: { taskType: 'count', biz: 'dropship' } },
      { key: 'exception', label: '异常', badge: 2, icon: '\u26A0\uFE0F', route: 'pda_task', query: { taskType: 'exception', biz: 'dropship' } }
    ]
  }
];

export function getBusinessGroup(biz: string): BusinessGroup | undefined {
  return PDA_BUSINESS_GROUPS.find(g => g.key === biz);
}

export function getBusinessPendingTotal(group: BusinessGroup): number {
  return group.modules.reduce((sum, m) => sum + (m.badge > 0 ? m.badge : 0), 0);
}

export function applyModuleBadges(biz: BusinessKey, badges: Record<string, number>) {
  const group = getBusinessGroup(biz);
  if (!group) return;
  group.modules.forEach(m => {
    if (badges[m.key] !== undefined) m.badge = badges[m.key];
  });
}

export const PDA_PERFORMANCE: Api.Pda.PerformanceSummary = {
  dateLabel: '2026-06-06',
  shift: '白班 08:00–20:00',
  summary: [
    { key: 'done', label: '今日完成', value: 47, unit: '单', color: '#34c759' },
    { key: 'doing', label: '进行中', value: 6, unit: '单', color: '#5ac8fa' },
    { key: 'exception', label: '异常', value: 2, unit: '单', color: '#ff9500' }
  ],
  metrics: [
    { label: '入库', value: 12 },
    { label: '出库', value: 18 },
    { label: '上库', value: 9 },
    { label: '拣货行', value: 156 },
    { label: '拆柜', value: 3 },
    { label: '盘点', value: 5 }
  ],
  rank: { position: 3, total: 28, score: 96, trend: '+2' }
};
