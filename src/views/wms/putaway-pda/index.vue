<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NCard, NCheckbox, NCheckboxGroup, NInput, NSpace, NTag } from 'naive-ui';
import { request } from '@/service/request';
import PdaPhoneShell from '@/components/pda/PdaPhoneShell.vue';

defineOptions({ name: 'WmsPutawayPda' });

type PutawayLine = {
  palletNo: string;
  boxQty: number;
  recommendLocation: string;
  status: string;
};

const route = useRoute();
const router = useRouter();

const taskNo = ref(String(route.query.taskNo || 'PT-2026-0001'));
const batchMode = computed(() => String(route.query.mode || 'BATCH') !== 'SINGLE');
const lines = ref<PutawayLine[]>([]);
const selected = ref<string[]>([]);
const targetLoc = ref('');
const scanInput = ref('');

const recommendLoc = computed(() => {
  if (!lines.value.length) return '—';
  const locs = [...new Set(lines.value.map(l => l.recommendLocation))];
  return locs.length === 1 ? locs[0] : locs.join(' / ');
});

onMounted(async () => {
  const res = await request<PutawayLine[]>({
    url: '/wms/putaway-task/lines',
    method: 'get',
    params: { taskNo: taskNo.value }
  });
  const rows = (res as any)?.data ?? res ?? [];
  lines.value = Array.isArray(rows) ? rows : [];
  if (batchMode.value) {
    selected.value = lines.value.map(l => l.palletNo);
    targetLoc.value = lines.value[0]?.recommendLocation || '';
  } else if (lines.value[0]) {
    selected.value = [lines.value[0].palletNo];
    targetLoc.value = lines.value[0].recommendLocation;
  }
});

function toggleAll(checked: boolean) {
  selected.value = checked ? lines.value.map(l => l.palletNo) : [];
}

function addByScan() {
  const v = scanInput.value.trim();
  if (!v) return;
  const hit = lines.value.find(l => l.palletNo === v);
  if (!hit) {
    window.$message?.warning(`[原型] 未找到卡板 ${v}`);
    return;
  }
  if (!selected.value.includes(v)) selected.value = [...selected.value, v];
  scanInput.value = '';
}

function confirmPutaway() {
  if (!selected.value.length) {
    window.$message?.warning('请勾选至少一块卡板');
    return;
  }
  if (!targetLoc.value.trim()) {
    window.$message?.warning('请输入目标库位');
    return;
  }
  window.$message?.success(
    `[原型] 已上架 ${selected.value.length} 板 \u2192 ${targetLoc.value}`
  );
}

function goBack() {
  router.push({ name: 'pda_home' });
}
</script>

<template>
  <PdaPhoneShell>
    <div class="putaway-app">
      <header class="putaway-head">
        <button type="button" class="putaway-back" @click="goBack">&larr; 返回</button>
        <h2 class="putaway-title">上架作业</h2>
        <p class="putaway-sub">
          {{ batchMode ? '批量模式：可多选卡板一次上架' : '单板模式' }} · 任务 {{ taskNo }}
        </p>
      </header>
      <NCard size="small" class="putaway-card mb-10px">
        <p>推荐库位：<span class="loc-ok">{{ recommendLoc }}</span></p>
        <NInput v-model:value="targetLoc" class="mt-10px" size="large" placeholder="目标库位（批量共用）" />
        <NInput
          v-model:value="scanInput"
          class="mt-10px"
          size="large"
          placeholder="扫描托盘号加入批量列表"
          @keyup.enter="addByScan"
        />
      </NCard>
      <NCard v-if="batchMode && lines.length > 1" size="small" class="putaway-card mb-10px">
        <NSpace justify="space-between" align="center">
          <span>待上架卡板 ({{ lines.length }})</span>
          <NButton size="tiny" quaternary type="primary" @click="toggleAll(selected.length < lines.length)">
            {{ selected.length === lines.length ? '取消全选' : '全选' }}
          </NButton>
        </NSpace>
        <NCheckboxGroup v-model:value="selected" class="mt-10px flex flex-col gap-8px">
          <NCheckbox v-for="line in lines" :key="line.palletNo" :value="line.palletNo">
            <span>{{ line.palletNo }}</span>
            <NTag size="tiny" class="ml-6px">{{ line.boxQty }}箱</NTag>
            <span class="ml-6px text-12px opacity-70">→ {{ line.recommendLocation }}</span>
          </NCheckbox>
        </NCheckboxGroup>
      </NCard>
      <NCard v-else-if="lines.length" size="small" class="putaway-card mb-10px">
        <p>托盘：{{ lines[0].palletNo }} · {{ lines[0].boxQty }}箱</p>
      </NCard>
      <NSpace vertical size="large" class="w-full">
        <NButton block size="large" type="primary" @click="addByScan">扫描加入</NButton>
        <NButton block size="large" type="success" @click="confirmPutaway">
          确认上架 ({{ selected.length }}板)
        </NButton>
        <NButton block size="large" type="warning">异常上报</NButton>
      </NSpace>
    </div>
  </PdaPhoneShell>
</template>

<style scoped>
.putaway-app {
  min-height: 100%;
  padding: 4px 10px 16px;
  background: linear-gradient(165deg, #8f7ff5 0%, #7568eb 38%, #6a5fe0 100%);
  color: #fff;
  box-sizing: border-box;
}
.putaway-head { margin-bottom: 10px; }
.putaway-back {
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
  cursor: pointer;
  padding: 0;
}
.putaway-title { margin: 8px 0 4px; font-size: 17px; font-weight: 700; }
.putaway-sub { margin: 0; font-size: 11px; opacity: 0.85; }
.putaway-card :deep(.n-card) { background: rgba(255, 255, 255, 0.96); color: #333; }
.loc-ok { color: #2d8a4e; font-weight: 600; }
.mb-10px { margin-bottom: 10px; }
</style>
