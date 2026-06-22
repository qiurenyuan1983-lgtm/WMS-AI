import { computed, ref } from 'vue';

export type DevanningWorkGroupField =
  | 'devanningSupplier'
  | 'devanningGroups'
  | 'devanningStatus'
  | 'devanningDate'
  | 'dockCode';

export type DevanningWorkDockDef = {
  dockCode: string;
  dockName: string;
};

export const DOCK_UNASSIGNED_VALUE = '__UNASSIGNED__';

/** @deprecated 单选分组已改为多选，保留类型兼容 */
export type DevanningWorkGroupBy = 'none' | DevanningWorkGroupField;

export type DevanningWorkSortBy =
  | 'expectedArrivalTime'
  | 'devanningDate'
  | 'devanningPriorityLevel'
  | 'progressPercent'
  | 'totalBoxQty';

export type DevanningWorkFilters = {
  devanningStatus: string | null;
  devanningDate: string | null;
  devanningPriorityLevel: string | null;
  devanningSupplier: string | null;
  devanningGroups: string | null;
  dockCode: string | null;
};

export const DEVANNING_STATUS_FILTER_OPTIONS = [
  { label: '未提柜', value: 'UNPICKEDUP' },
  { label: '已提柜', value: 'PICKEDUP' },
  { label: '已到仓', value: 'ARRIVED' },
  { label: '拆柜中', value: 'DEVANNING' },
  { label: '拆柜完成', value: 'DEVANNED' },
  { label: '异常', value: 'EXCEPTION' },
  { label: '已取消', value: 'CANCELLED' }
];

const PRIORITY_ORDER: Record<string, number> = { A: 1, B: 2, C: 3 };

function taskProgress(row: Api.Wms.DevanningWorkTask) {
  if (row.progressPercent != null) return row.progressPercent;
  if (!row.totalBoxQty) return 0;
  return Math.min(100, Math.round((row.markedBoxQty / row.totalBoxQty) * 100));
}

function compareString(a: string | null | undefined, b: string | null | undefined) {
  return String(a || '').localeCompare(String(b || ''));
}

export function useDevanningWorkListView() {
  const keyword = ref('');
  const activeStatusTab = ref('ALL');
  const filterDrawerVisible = ref(false);
  const groupBy = ref<DevanningWorkGroupField[]>([]);
  const sortBy = ref<DevanningWorkSortBy>('expectedArrivalTime');
  const sortOrder = ref<'asc' | 'desc'>('asc');

  const filters = ref<DevanningWorkFilters>({
    devanningStatus: null,
    devanningDate: null,
    devanningPriorityLevel: null,
    devanningSupplier: null,
    devanningGroups: null,
    dockCode: null
  });

  const GROUP_OPTIONS: Array<{ label: string; value: DevanningWorkGroupField }> = [
    { label: '按 DOCK', value: 'dockCode' },
    { label: '按拆柜供应商', value: 'devanningSupplier' },
    { label: '按拆柜组别', value: 'devanningGroups' },
    { label: '按拆柜状态', value: 'devanningStatus' },
    { label: '按拆柜日期', value: 'devanningDate' }
  ];

  const SORT_OPTIONS: Array<{ label: string; value: DevanningWorkSortBy }> = [
    { label: '预计到仓时间', value: 'expectedArrivalTime' },
    { label: '拆柜日期', value: 'devanningDate' },
    { label: '拆柜优先级', value: 'devanningPriorityLevel' },
    { label: '进度', value: 'progressPercent' },
    { label: '总箱数', value: 'totalBoxQty' }
  ];

  const activeFilterCount = computed(() => {
    return Object.values(filters.value).filter(v => v != null && v !== '').length;
  });

  const groupByLabel = computed(() => {
    if (!groupBy.value.length) return '不分组';
    return GROUP_OPTIONS.filter(o => groupBy.value.includes(o.value))
      .map(o => o.label.replace(/^按/, ''))
      .join(' → ');
  });

  const hasGrouping = computed(() => groupBy.value.length > 0);

  const sortLabel = computed(() => {
    const field = SORT_OPTIONS.find(o => o.value === sortBy.value)?.label || '';
    return `${field} · ${sortOrder.value === 'asc' ? '升序' : '降序'}`;
  });

  function resetFilters() {
    filters.value = {
      devanningStatus: null,
      devanningDate: null,
      devanningPriorityLevel: null,
      devanningSupplier: null,
      devanningGroups: null,
      dockCode: null
    };
  }

  function resetView() {
    keyword.value = '';
    activeStatusTab.value = 'ALL';
    groupBy.value = [];
    sortBy.value = 'expectedArrivalTime';
    sortOrder.value = 'asc';
    resetFilters();
  }

  function applyFilters(rows: Api.Wms.DevanningWorkTask[]) {
    const kw = keyword.value.trim().toLowerCase();
    return rows.filter(row => {
      if (kw) {
        const hit = [row.containerNo, row.devanningNo, row.customerName, row.devanningSupplier, row.devanningGroups]
          .filter(Boolean)
          .some(v => String(v).toLowerCase().includes(kw));
        if (!hit) return false;
      }
      if (filters.value.devanningStatus && row.devanningStatus !== filters.value.devanningStatus) return false;
      if (filters.value.devanningDate && row.devanningDate !== filters.value.devanningDate) return false;
      if (filters.value.devanningPriorityLevel && row.devanningPriorityLevel !== filters.value.devanningPriorityLevel)
        return false;
      if (filters.value.devanningSupplier && row.devanningSupplier !== filters.value.devanningSupplier) return false;
      if (filters.value.devanningGroups && row.devanningGroups !== filters.value.devanningGroups) return false;
      if (filters.value.dockCode === DOCK_UNASSIGNED_VALUE) {
        if (row.dockCode) return false;
      } else if (filters.value.dockCode && row.dockCode !== filters.value.dockCode) {
        return false;
      }
      if (activeStatusTab.value !== 'ALL' && row.devanningStatus !== activeStatusTab.value) return false;
      return true;
    });
  }

  function applySort(rows: Api.Wms.DevanningWorkTask[]) {
    const list = [...rows];
    const dir = sortOrder.value === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortBy.value) {
        case 'devanningPriorityLevel':
          cmp = (PRIORITY_ORDER[a.devanningPriorityLevel] || 99) - (PRIORITY_ORDER[b.devanningPriorityLevel] || 99);
          break;
        case 'progressPercent':
          cmp = taskProgress(a) - taskProgress(b);
          break;
        case 'totalBoxQty':
          cmp = (a.totalBoxQty || 0) - (b.totalBoxQty || 0);
          break;
        case 'devanningDate':
          cmp = compareString(a.devanningDate, b.devanningDate);
          break;
        default:
          cmp = compareString(a.expectedArrivalTime, b.expectedArrivalTime);
      }
      return cmp * dir;
    });
    return list;
  }

  function dockGroupLabel(dockCode: string | null | undefined, allDocks: DevanningWorkDockDef[]) {
    if (!dockCode) return '待分配 DOCK';
    const matched = allDocks.find(d => d.dockCode === dockCode);
    return matched ? `${matched.dockName} (${dockCode})` : dockCode;
  }

  function resolveGroupPart(
    row: Api.Wms.DevanningWorkTask,
    field: DevanningWorkGroupField,
    allDocks: DevanningWorkDockDef[] = []
  ): string {
    switch (field) {
      case 'dockCode':
        return dockGroupLabel(row.dockCode, allDocks);
      case 'devanningSupplier':
        return row.devanningSupplier || '未分配供应商';
      case 'devanningGroups':
        return row.devanningGroups || '未分配组别';
      case 'devanningStatus':
        return row.devanningStatusLabel || row.devanningStatus;
      case 'devanningDate':
        return row.devanningDate || '未排期';
      default:
        return '—';
    }
  }

  function getActiveGroupFields(): DevanningWorkGroupField[] {
    return GROUP_OPTIONS.map(o => o.value).filter(v => groupBy.value.includes(v));
  }

  function buildGroups(rows: Api.Wms.DevanningWorkTask[], allDocks: DevanningWorkDockDef[] = []) {
    const fields = getActiveGroupFields();
    if (!fields.length) {
      return [{ key: '_all', label: '全部任务', rows }];
    }
    const map = new Map<string, Api.Wms.DevanningWorkTask[]>();
    for (const row of rows) {
      const label = fields.map(field => resolveGroupPart(row, field, allDocks)).join(' / ');
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(row);
    }
    let groups = Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, groupRows]) => ({ key: label, label, rows: groupRows }));

    if (fields.length === 1 && fields[0] === 'dockCode') {
      const existing = new Set(groups.map(g => g.label));
      for (const dock of allDocks) {
        const label = dockGroupLabel(dock.dockCode, allDocks);
        if (!existing.has(label)) {
          groups.push({ key: label, label, rows: [] });
        }
      }
      const unassignedLabel = dockGroupLabel(null, allDocks);
      if (!existing.has(unassignedLabel)) {
        groups.push({ key: unassignedLabel, label: unassignedLabel, rows: [] });
      }
      groups = groups.sort((a, b) => {
        if (a.label === unassignedLabel) return 1;
        if (b.label === unassignedLabel) return -1;
        return a.label.localeCompare(b.label);
      });
    }

    return groups;
  }

  function buildDockFilterOptions(rows: Api.Wms.DevanningWorkTask[], allDocks: DevanningWorkDockDef[] = []) {
    const optionMap = new Map<string, { label: string; value: string }>();
    for (const dock of allDocks) {
      optionMap.set(dock.dockCode, {
        label: `${dock.dockName} (${dock.dockCode})`,
        value: dock.dockCode
      });
    }
    for (const row of rows) {
      if (row.dockCode && !optionMap.has(row.dockCode)) {
        optionMap.set(row.dockCode, { label: row.dockCode, value: row.dockCode });
      }
    }
    return [
      ...Array.from(optionMap.values()).sort((a, b) => a.label.localeCompare(b.label)),
      { label: '待分配', value: DOCK_UNASSIGNED_VALUE }
    ];
  }

  function buildFilterOptions(rows: Api.Wms.DevanningWorkTask[], allDocks: DevanningWorkDockDef[] = []) {
    const uniq = (pick: (r: Api.Wms.DevanningWorkTask) => string | null | undefined) =>
      [...new Set(rows.map(pick).filter(Boolean) as string[])].map(v => ({ label: v, value: v }));

    return {
      statusOptions: DEVANNING_STATUS_FILTER_OPTIONS,
      dateOptions: uniq(r => r.devanningDate),
      priorityOptions: [
        { label: '高', value: 'A' },
        { label: '中', value: 'B' },
        { label: '低', value: 'C' }
      ],
      supplierOptions: uniq(r => r.devanningSupplier),
      groupOptions: uniq(r => r.devanningGroups),
      dockOptions: buildDockFilterOptions(rows, allDocks)
    };
  }

  function countTasksByDock(rows: Api.Wms.DevanningWorkTask[], allDocks: DevanningWorkDockDef[] = []) {
    const counts: Record<string, number> = { ALL: rows.length, [DOCK_UNASSIGNED_VALUE]: 0 };
    for (const dock of allDocks) counts[dock.dockCode] = 0;
    for (const row of rows) {
      if (!row.dockCode) {
        counts[DOCK_UNASSIGNED_VALUE] += 1;
        continue;
      }
      counts[row.dockCode] = (counts[row.dockCode] || 0) + 1;
    }
    return counts;
  }

  function processTasks(raw: Api.Wms.DevanningWorkTask[], allDocks: DevanningWorkDockDef[] = []) {
    const filtered = applyFilters(raw);
    const sorted = applySort(filtered);
    const groups = buildGroups(sorted, allDocks);
    return {
      filtered,
      sorted,
      groups,
      filterOptions: buildFilterOptions(raw, allDocks),
      dockCounts: countTasksByDock(
        raw.filter(row => {
          const kw = keyword.value.trim().toLowerCase();
          if (kw) {
            const hit = [row.containerNo, row.devanningNo, row.customerName, row.devanningSupplier, row.devanningGroups]
              .filter(Boolean)
              .some(v => String(v).toLowerCase().includes(kw));
            if (!hit) return false;
          }
          if (filters.value.devanningStatus && row.devanningStatus !== filters.value.devanningStatus) return false;
          if (filters.value.devanningDate && row.devanningDate !== filters.value.devanningDate) return false;
          if (filters.value.devanningPriorityLevel && row.devanningPriorityLevel !== filters.value.devanningPriorityLevel)
            return false;
          if (filters.value.devanningSupplier && row.devanningSupplier !== filters.value.devanningSupplier) return false;
          if (filters.value.devanningGroups && row.devanningGroups !== filters.value.devanningGroups) return false;
          if (activeStatusTab.value !== 'ALL' && row.devanningStatus !== activeStatusTab.value) return false;
          return true;
        }),
        allDocks
      )
    };
  }

  return {
    keyword,
    activeStatusTab,
    filterDrawerVisible,
    groupBy,
    sortBy,
    sortOrder,
    filters,
    GROUP_OPTIONS,
    SORT_OPTIONS,
    activeFilterCount,
    groupByLabel,
    hasGrouping,
    sortLabel,
    DEVANNING_STATUS_FILTER_OPTIONS,
    DOCK_UNASSIGNED_VALUE,
    dockGroupLabel,
    resetFilters,
    resetView,
    processTasks,
    taskProgress
  };
}
