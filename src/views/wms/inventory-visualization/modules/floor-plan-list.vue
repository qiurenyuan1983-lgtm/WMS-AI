<script setup lang="tsx">
import { computed } from 'vue';
import { NButton, NProgress, NTag } from 'naive-ui';
import { FLOOR_PLAN_OCCUPANCY_STYLES } from '@/mock/data/wms-inventory-floor';

const props = defineProps<{
  zones: Api.Wms.ZoneVisualization[];
  fillHeight?: boolean;
}>();

const emit = defineEmits<{ (e: 'select', loc: Api.Wms.LocationVisualization): void }>();

const rows = computed(() => props.zones.flatMap(z => z.locations.map(l => ({ ...l, zoneName: z.zoneName }))));

const columns = [
  {
    key: 'locationCode',
    title: '库位编码',
    width: 120,
    render: (row: Api.Wms.LocationVisualization) => (
      <NButton text type="primary" onClick={() => emit('select', row)}>
        {row.locationCode}
      </NButton>
    )
  },
  { key: 'zoneName', title: '库区', width: 90 },
  {
    key: 'occupancyLevel',
    title: '占用等级',
    width: 110,
    render: (row: Api.Wms.LocationVisualization) => (
      <NTag size="small">{FLOOR_PLAN_OCCUPANCY_STYLES[row.occupancyLevel]?.label || row.occupancyLevel}</NTag>
    )
  },
  {
    key: 'qty',
    title: '占用',
    width: 100,
    render: (row: Api.Wms.LocationVisualization) => `${row.currentQty}/${row.capacity ?? 30}`
  },
  { key: 'remainingCapacity', title: '剩余库容', width: 90 },
  { key: 'platformCode', title: '平台代码', width: 100, render: (row: Api.Wms.LocationVisualization) => row.platformCode || '—' },
  { key: 'palletCount', title: '板数', width: 70 },
  { key: 'customerName', title: '客户', width: 100, ellipsis: { tooltip: true }, render: (row: Api.Wms.LocationVisualization) => row.customerName || '—' }
];
</script>

<template>
  <NDataTable
    :columns="columns"
    :data="rows"
    size="small"
    :scroll-x="900"
    :max-height="fillHeight ? undefined : 520"
    :flex-height="fillHeight"
    :class="fillHeight ? 'h-full min-h-0' : ''"
    virtual-scroll
  />
</template>
