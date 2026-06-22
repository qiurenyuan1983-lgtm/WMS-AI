<script setup lang="ts">
import { watch } from 'vue';
import type { EnterpriseTrendPoint } from '@/mock/data/enterprise-dashboard';
import { useEcharts } from '@/hooks/common/echarts';

const props = defineProps<{ data: EnterpriseTrendPoint[] }>();

const { domRef, updateOptions } = useEcharts(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['\u5165\u5e93\u8ba2\u5355', '\u51fa\u5e93\u8ba2\u5355'], top: 0, right: 0 },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '18%', containLabel: true },
  xAxis: { type: 'category', boundaryGap: false, data: [] as string[] },
  yAxis: { type: 'value' },
  series: [
    { name: '\u5165\u5e93\u8ba2\u5355', type: 'line', smooth: true, color: '#2563eb', data: [] as number[] },
    { name: '\u51fa\u5e93\u8ba2\u5355', type: 'line', smooth: true, color: '#059669', data: [] as number[] }
  ]
}));

function render() {
  updateOptions(opts => {
    opts.xAxis.data = props.data.map(d => d.date);
    opts.series[0].data = props.data.map(d => d.inbound);
    opts.series[1].data = props.data.map(d => d.outbound);
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
