import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/views/wms/putaway-pda/index.vue');

const L = {
  proto: '\u539f\u578b',
  notFound: '\u672a\u627e\u5230\u5361\u677f',
  selectOne: '\u8bf7\u52fe\u9009\u81f3\u5c11\u4e00\u5757\u5361\u677f',
  inputLoc: '\u8bf7\u8f93\u5165\u76ee\u6807\u5e93\u4f4d',
  done: '\u5df2\u4e0a\u67b6',
  board: '\u677f',
  title: '\u4e0a\u67b6\u4f5c\u4e1a',
  batchHint: '\u6279\u91cf\u6a21\u5f0f\uff1a\u53ef\u591a\u9009\u5361\u677f\u4e00\u6b21\u4e0a\u67b6',
  singleHint: '\u5355\u677f\u6a21\u5f0f',
  task: '\u4efb\u52a1',
  recLoc: '\u63a8\u8350\u5e93\u4f4d',
  tgtPh: '\u76ee\u6807\u5e93\u4f4d\uff08\u6279\u91cf\u5171\u7528\uff09',
  scanPh: '\u626b\u63cf\u6258\u76d8\u53f7\u52a0\u5165\u6279\u91cf\u5217\u8868',
  pending: '\u5f85\u4e0a\u67b6\u5361\u677f',
  cancelAll: '\u53d6\u6d88\u5168\u9009',
  selectAll: '\u5168\u9009',
  box: '\u7bb1',
  scanAdd: '\u626b\u63cf\u52a0\u5165',
  confirm: '\u786e\u8ba4\u4e0a\u67b6',
  exception: '\u5f02\u5e38\u4e0a\u62a5',
  back: '\u8fd4\u56de',
  pallet: '\u6258\u76d8'
};

const content = `<script setup lang="ts">
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
  if (!lines.value.length) return '\u2014';
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
    window.$message?.warning(\`[${L.proto}] ${L.notFound} \${v}\`);
    return;
  }
  if (!selected.value.includes(v)) selected.value = [...selected.value, v];
  scanInput.value = '';
}

function confirmPutaway() {
  if (!selected.value.length) {
    window.$message?.warning('${L.selectOne}');
    return;
  }
  if (!targetLoc.value.trim()) {
    window.$message?.warning('${L.inputLoc}');
    return;
  }
  window.$message?.success(
    \`[${L.proto}] ${L.done} \${selected.value.length} ${L.board} \\u2192 \${targetLoc.value}\`
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
        <button type="button" class="putaway-back" @click="goBack">&larr; ${L.back}</button>
        <h2 class="putaway-title">${L.title}</h2>
        <p class="putaway-sub">
          {{ batchMode ? '${L.batchHint}' : '${L.singleHint}' }} \u00b7 ${L.task} {{ taskNo }}
        </p>
      </header>
      <NCard size="small" class="putaway-card mb-10px">
        <p>${L.recLoc}\uff1a<span class="loc-ok">{{ recommendLoc }}</span></p>
        <NInput v-model:value="targetLoc" class="mt-10px" size="large" placeholder="${L.tgtPh}" />
        <NInput
          v-model:value="scanInput"
          class="mt-10px"
          size="large"
          placeholder="${L.scanPh}"
          @keyup.enter="addByScan"
        />
      </NCard>
      <NCard v-if="batchMode && lines.length > 1" size="small" class="putaway-card mb-10px">
        <NSpace justify="space-between" align="center">
          <span>${L.pending} ({{ lines.length }})</span>
          <NButton size="tiny" quaternary type="primary" @click="toggleAll(selected.length < lines.length)">
            {{ selected.length === lines.length ? '${L.cancelAll}' : '${L.selectAll}' }}
          </NButton>
        </NSpace>
        <NCheckboxGroup v-model:value="selected" class="mt-10px flex flex-col gap-8px">
          <NCheckbox v-for="line in lines" :key="line.palletNo" :value="line.palletNo">
            <span>{{ line.palletNo }}</span>
            <NTag size="tiny" class="ml-6px">{{ line.boxQty }}${L.box}</NTag>
            <span class="ml-6px text-12px opacity-70">${'\u2192'} {{ line.recommendLocation }}</span>
          </NCheckbox>
        </NCheckboxGroup>
      </NCard>
      <NCard v-else-if="lines.length" size="small" class="putaway-card mb-10px">
        <p>${L.pallet}\uff1a{{ lines[0].palletNo }} \u00b7 {{ lines[0].boxQty }}${L.box}</p>
      </NCard>
      <NSpace vertical size="large" class="w-full">
        <NButton block size="large" type="primary" @click="addByScan">${L.scanAdd}</NButton>
        <NButton block size="large" type="success" @click="confirmPutaway">
          ${L.confirm} ({{ selected.length }}${L.board})
        </NButton>
        <NButton block size="large" type="warning">${L.exception}</NButton>
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
`;

fs.writeFileSync(file, content, 'utf8');
console.log('wrote putaway-pda');
