<script setup lang="ts">
import { watch } from 'vue';
import { useEcharts } from '@/hooks/common/echarts';

const props = defineProps<{ trends: Api.Monitor.RedisTrendPoint[] }>();

function buildLineOption(title: string, color: string, data: number[], formatter?: string) {
  return {
    tooltip: { trigger: 'axis' as const },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '12%', containLabel: true },
    xAxis: { type: 'category' as const, boundaryGap: false, data: props.trends.map(t => t.time) },
    yAxis: { type: 'value' as const },
    series: [
      {
        name: title,
        type: 'line' as const,
        smooth: true,
        color,
        areaStyle: { opacity: 0.08 },
        data
      }
    ],
    ...(formatter ? { tooltip: { trigger: 'axis' as const, valueFormatter: (v: number) => `${v}${formatter}` } } : {})
  };
}

const { domRef: memoryRef, setOptions: setMemory } = useEcharts(() => buildLineOption('内存使用率', '#f0a020', []));
const { domRef: hitRef, setOptions: setHit } = useEcharts(() => buildLineOption('命中率', '#18a058', []));
const { domRef: connRef, setOptions: setConn } = useEcharts(() => buildLineOption('连接数', '#2563eb', []));
const { domRef: qpsRef, setOptions: setQps } = useEcharts(() => buildLineOption('QPS', '#7c3aed', []));

function render() {
  if (!props.trends.length) return;
  setMemory(buildLineOption('内存使用率', '#f0a020', props.trends.map(t => Number(t.memoryPercent.toFixed(1))), '%'));
  setHit(buildLineOption('命中率', '#18a058', props.trends.map(t => Number(t.hitRate.toFixed(1))), '%'));
  setConn(buildLineOption('连接数', '#2563eb', props.trends.map(t => t.connections)));
  setQps(buildLineOption('QPS', '#7c3aed', props.trends.map(t => t.qps)));
}

watch(() => props.trends, render, { deep: true, immediate: true });
</script>

<template>
  <NGrid :cols="2" :x-gap="12" :y-gap="12" responsive="screen" item-responsive>
    <NGi span="0:24 1000:12">
      <NCard title="内存使用趋势" :bordered="false" size="small" class="card-wrapper">
        <div ref="memoryRef" class="chart-box" />
      </NCard>
    </NGi>
    <NGi span="0:24 1000:12">
      <NCard title="缓存命中率趋势" :bordered="false" size="small" class="card-wrapper">
        <div ref="hitRef" class="chart-box" />
      </NCard>
    </NGi>
    <NGi span="0:24 1000:12">
      <NCard title="连接数趋势" :bordered="false" size="small" class="card-wrapper">
        <div ref="connRef" class="chart-box" />
      </NCard>
    </NGi>
    <NGi span="0:24 1000:12">
      <NCard title="QPS趋势" :bordered="false" size="small" class="card-wrapper">
        <div ref="qpsRef" class="chart-box" />
      </NCard>
    </NGi>
  </NGrid>
</template>

<style scoped>
.chart-box {
  height: 260px;
}
</style>
