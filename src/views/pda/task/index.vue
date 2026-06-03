<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PdaPhoneShell from '@/components/pda/PdaPhoneShell.vue';

defineOptions({ name: 'PdaTask' });

const route = useRoute();
const router = useRouter();

const TASK_TITLES: Record<string, string> = {
  receive: '收货',
  move: '库位变更',
  merge: '合板',
  split: '拆板',
  operation: '订单操作',
  count: '盘点',
  pick: '指令拣货',
  exception: '异常处理'
};

const BIZ_LABELS: Record<string, string> = {
  transfer: '转运',
  transit: '中转',
  dropship: '一件代发'
};

const pageTitle = computed(() => {
  const t = String(route.query.taskType || '');
  const biz = String(route.query.biz || '');
  const taskLabel = TASK_TITLES[t] || '统一任务';
  const bizLabel = BIZ_LABELS[biz];
  return bizLabel ? `${bizLabel} · ${taskLabel}` : taskLabel;
});

function goBack() {
  const biz = String(route.query.biz || '');
  if (biz) {
    router.push({ name: 'pda_business', query: { biz } });
    return;
  }
  router.push({ name: 'pda_home' });
}
</script>

<template>
  <PdaPhoneShell>
    <div class="pda-task-app">
      <header class="pda-task-header">
        <button type="button" class="pda-task-back" @click="goBack">&larr; 返回</button>
        <h2 class="pda-task-title">{{ pageTitle }}</h2>
      </header>
      <section class="pda-task-card">
        <dl class="pda-task-dl">
          <dt>任务号</dt><dd>TASK-2026-001</dd>
          <dt>客户</dt><dd>演示客户 A</dd>
          <dt>托盘号</dt><dd>PLT-001</dd>
          <dt>当前库位</dt><dd>A-01-01</dd>
          <dt>目标库位</dt><dd>A-02-03</dd>
        </dl>
      </section>
      <div class="pda-task-actions">
        <button type="button" class="btn primary">扫描</button>
        <button type="button" class="btn success">确认</button>
        <button type="button" class="btn warn">异常</button>
        <button type="button" class="btn">拍照</button>
        <button type="button" class="btn info">完成</button>
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
