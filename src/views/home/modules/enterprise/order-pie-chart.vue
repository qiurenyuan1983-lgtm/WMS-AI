<script setup lang="ts">
import { computed, watch } from 'vue';
import type { EnterpriseOrderSlice } from '@/mock/data/enterprise-dashboard';
import { useEcharts } from '@/hooks/common/echarts';

const props = defineProps<{ data: EnterpriseOrderSlice[]; total: number }>();

const centerText = computed(() => `\u5408\u8ba1\n${props.total.toLocaleString()} \u5355`);

const { domRef, updateOptions } = useEcharts(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11 } },
  series: [
    {
      type: 'pie',
      radius: ['48%', '72%'],
      center: ['50%', '42%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
      data: [] as { name: string; value: number }[]
    }
  ],
  graphic: [
    {
      type: 'text',
      left: 'center',
      top: '34%',
      style: {
        text: '',
        textAlign: 'center',
        fill: '#374151',
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 18
      }
    }
  ]
}));

function render() {
  updateOptions(opts => {
    opts.series[0].data = props.data.map(d => ({ name: `${d.name} ${d.percent}%`, value: d.value }));
    if (opts.graphic?.[0] && 'style' in opts.graphic[0]) {
      (opts.graphic[0] as { style: { text: string } }).style.text = centerText.value;
    }
    return opts;
  });
}

watch([() => props.data, () => props.total], render, { deep: true, immediate: true });
</script>

<template>
  <div ref="domRef" class="chart-box" />
</template>

<style scoped>
.chart-box {
  height: 280px;
}
</style>
