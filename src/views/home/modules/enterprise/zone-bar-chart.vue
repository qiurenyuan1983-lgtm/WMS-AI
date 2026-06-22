<script setup lang="ts">
import { watch } from 'vue';
import type { EnterpriseZoneUtil } from '@/mock/data/enterprise-dashboard';
import { useEcharts } from '@/hooks/common/echarts';

const props = defineProps<{ data: EnterpriseZoneUtil[] }>();

const { domRef, updateOptions } = useEcharts(() => ({
  tooltip: { trigger: 'axis', formatter: '{b}: {c}%' },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
  xAxis: { type: 'category', data: [] as string[], axisLabel: { fontSize: 11 } },
  yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
  series: [
    {
      type: 'bar',
      barMaxWidth: 36,
      data: [] as number[],
      itemStyle: {
        color: (params: { dataIndex: number }) => {
          const v = Number(params.value);
          if (v >= 90) return '#dc2626';
          if (v >= 80) return '#ea580c';
          if (v >= 60) return '#2563eb';
          return '#059669';
        },
        borderRadius: [4, 4, 0, 0]
      },
      label: { show: true, position: 'top', formatter: '{c}%', fontSize: 10 }
    }
  ]
}));

function render() {
  updateOptions(opts => {
    opts.xAxis.data = props.data.map(d => d.zoneName);
    opts.series[0].data = props.data.map(d => d.percent);
    return opts;
  });
}

watch(() => props.data, render, { deep: true, immediate: true });
</script>

<template>
  <div ref="domRef" class="chart-box" />
</template>

<style scoped>
.chart-box {
  height: 280px;
}
</style>
