<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { NCard, NGi, NGrid, NProgress, NTag } from 'naive-ui';
import { fetchGetIecPerformanceList } from '@/service/api/iec';

defineOptions({ name: 'IecPerformance' });

const loading = ref(false);
const rows = ref<Api.Iec.PerformanceStat[]>([]);

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchGetIecPerformanceList();
    rows.value = (data as any)?.rows ?? [];
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="h-full overflow-auto">
    <NGrid :cols="1" :y-gap="12" class="pb-12px">
      <NGi v-for="item in rows" :key="item.employeeId">
        <NCard :title="item.employeeName" size="small" :bordered="false" class="card-wrapper">
          <div class="perf-grid">
            <div class="perf-kpi">
              <div class="perf-val">{{ item.taskCount }}</div>
              <div class="perf-lbl">近7日任务量</div>
            </div>
            <div class="perf-kpi">
              <div class="perf-val text-green-600">{{ item.successRate }}%</div>
              <div class="perf-lbl">成功率</div>
            </div>
            <div class="perf-kpi">
              <div class="perf-val">{{ item.savedHours }}h</div>
              <div class="perf-lbl">节省人工</div>
            </div>
            <div class="perf-kpi">
              <div class="perf-val text-orange-500">{{ item.takeoverRate }}%</div>
              <div class="perf-lbl">人工接管率</div>
            </div>
          </div>

          <div class="mt-12px">
            <div class="text-12px font-600 mb-6px">近7天趋势</div>
            <div class="trend-row">
              <div v-for="d in item.trend7d" :key="d.date" class="trend-cell">
                <div class="text-11px text-gray-400">{{ d.date }}</div>
                <div class="text-13px font-600">{{ d.tasks }}</div>
                <NProgress type="line" :percentage="d.successRate" :show-indicator="false" :height="4" />
              </div>
            </div>
          </div>

          <div class="mt-12px">
            <div class="text-12px font-600 mb-6px">失败原因排行</div>
            <NTag v-for="f in item.failReasons" :key="f.reason" size="small" class="mr-6px mb-4px">
              {{ f.reason }} ({{ f.count }})
            </NTag>
          </div>
        </NCard>
      </NGi>
    </NGrid>
    <div v-if="loading" class="text-center py-40px text-gray-400">加载中…</div>
  </div>
</template>

<style scoped>
.perf-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.perf-val {
  font-size: 20px;
  font-weight: 700;
}
.perf-lbl {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}
.trend-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}
.trend-cell {
  text-align: center;
  padding: 8px;
  background: #f9fafb;
  border-radius: 6px;
}
</style>
