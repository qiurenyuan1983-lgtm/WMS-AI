import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/views/pda/task/index.vue');

const titles = {
  receive: '\u6536\u8d27',
  move: '\u5e93\u4f4d\u53d8\u66f4',
  merge: '\u5408\u677f',
  split: '\u62c6\u677f',
  operation: '\u6307\u4ee4\u64cd\u4f5c',
  count: '\u5e93\u5b58\u76d8\u70b9',
  pick: '\u62e3\u8d27',
  default: '\u7edf\u4e00\u4efb\u52a1'
};
const L = {
  back: '\u8fd4\u56de',
  taskNo: '\u4efb\u52a1\u53f7',
  customer: '\u5ba2\u6237',
  pallet: '\u6258\u76d8\u53f7',
  curLoc: '\u5f53\u524d\u5e93\u4f4d',
  tgtLoc: '\u76ee\u6807\u5e93\u4f4d',
  demoCustomer: '\u6f14\u793a\u5ba2\u6237 A',
  scan: '\u626b\u63cf',
  confirm: '\u786e\u8ba4',
  exception: '\u5f02\u5e38',
  photo: '\u62cd\u7167',
  complete: '\u5b8c\u6210'
};

const content = `<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PdaPhoneShell from '@/components/pda/PdaPhoneShell.vue';

defineOptions({ name: 'PdaTask' });

const route = useRoute();
const router = useRouter();

const pageTitle = computed(() => {
  const t = String(route.query.taskType || '');
  return (${JSON.stringify(titles)} as Record<string, string>)[t] || titles.default;
});

function goHome() {
  router.push({ name: 'pda_home' });
}
</script>

<template>
  <PdaPhoneShell>
    <div class="pda-task-app">
      <header class="pda-task-header">
        <button type="button" class="pda-task-back" @click="goHome">&larr; ${L.back}</button>
        <h2 class="pda-task-title">{{ pageTitle }}</h2>
      </header>
      <section class="pda-task-card">
        <dl class="pda-task-dl">
          <dt>${L.taskNo}</dt><dd>TASK-2026-001</dd>
          <dt>${L.customer}</dt><dd>${L.demoCustomer}</dd>
          <dt>${L.pallet}</dt><dd>PLT-001</dd>
          <dt>${L.curLoc}</dt><dd>A-01-01</dd>
          <dt>${L.tgtLoc}</dt><dd>A-02-03</dd>
        </dl>
      </section>
      <div class="pda-task-actions">
        <button type="button" class="btn primary">${L.scan}</button>
        <button type="button" class="btn success">${L.confirm}</button>
        <button type="button" class="btn warn">${L.exception}</button>
        <button type="button" class="btn">${L.photo}</button>
        <button type="button" class="btn info">${L.complete}</button>
      </div>
    </div>
  </PdaPhoneShell>
</template>

<style scoped>
.pda-task-app {
  min-height: 100%;
  padding: 4px 12px 20px;
  background: linear-gradient(165deg, #8f7ff5 0%, #7568eb 38%, #6a5fe0 100%);
  color: #fff;
}
.pda-task-header { margin-bottom: 14px; }
.pda-task-back {
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
  cursor: pointer;
  padding: 0;
}
.pda-task-title { margin: 10px 0 0; font-size: 18px; font-weight: 700; }
.pda-task-card {
  background: #fff;
  border-radius: 10px;
  padding: 14px;
  color: #333;
  margin-bottom: 12px;
}
.pda-task-dl {
  margin: 0;
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 8px;
  font-size: 13px;
}
.pda-task-dl dt { color: #888; margin: 0; }
.pda-task-dl dd { margin: 0; font-weight: 600; }
.pda-task-actions { display: flex; flex-direction: column; gap: 8px; }
.btn {
  height: 44px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
.btn.primary { background: #fff; color: #5b54d8; }
.btn.success { background: #34c759; color: #fff; }
.btn.warn { background: #ff9500; color: #fff; }
.btn.info { background: #5ac8fa; color: #fff; }
.btn:not(.primary):not(.success):not(.warn):not(.info) {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}
</style>
`;

fs.writeFileSync(file, content, 'utf8');
console.log('wrote pda task');
