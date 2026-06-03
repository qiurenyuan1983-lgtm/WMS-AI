<script setup lang="ts">
import { ref } from 'vue';
import { fetchGetCheckInReceipt } from '@/service/api/yms/gate';

interface Props {
  result: Api.Yms.CheckIn | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'pass', id: CommonType.IdType): void }>();

const printing = ref(false);

const RESULT_LABEL: Record<string, string> = {
  PASSED: 'PASS：可放行',
  PENDING: 'WARN：需确认',
  BLACKLISTED: 'BLOCK：黑名单',
  REJECTED: 'BLOCK：拦截'
};

const MATCH_LABEL: Record<string, string> = {
  APT_MATCH: '预约匹配',
  WALK_IN: '即时入场',
  MANUAL: '手动放行'
};

async function handlePrint() {
  if (!props.result?.id) return;
  printing.value = true;
  try {
    const { data } = await fetchGetCheckInReceipt(props.result.id);
    if (!data) return;
    const w = window.open('', '_blank', 'width=400,height=600');
    if (!w) return;
    w.document.write(`<html><head><title>入场小票</title></head><body style="font-family:monospace;padding:16px">
      <h3>入场小票</h3>
      <p>小票号：${data.receiptNo ?? '—'}</p>
      <p>时间：${data.checkInTime ?? '—'}</p>
      <p>车牌：${data.plateNo ?? '—'}</p>
      <p>司机：${data.driverName ?? '—'}</p>
      <p>柜号：${data.containerNo ?? '—'}</p>
      <p>车厢：${data.trailerNo ?? '—'}</p>
      <p>预约：${data.aptNo ?? '—'}</p>
      <p>结果：${data.checkResult ?? '—'}</p>
      </body></html>`);
    w.document.close();
    w.print();
  } finally {
    printing.value = false;
  }
}
</script>

<template>
  <NCard v-if="result" title="登记结果" :bordered="false" class="card-wrapper">
    <NResult
      :status="result.checkResult === 'PASSED' ? 'success' : result.checkResult === 'PENDING' ? 'warning' : 'error'"
      :title="RESULT_LABEL[result.checkResult] ?? result.checkResult"
    >
      <template #default>
        <NDescriptions bordered :column="2" size="small" class="mt-16px">
          <NDescriptionsItem label="车牌号">{{ result.plateNo }}</NDescriptionsItem>
          <NDescriptionsItem label="司机">{{ result.driverName ?? '—' }}</NDescriptionsItem>
          <NDescriptionsItem label="任务类型">{{ result.taskType }}</NDescriptionsItem>
          <NDescriptionsItem label="匹配方式">
            <NTag :type="result.matchType === 'APT_MATCH' ? 'success' : 'default'" size="small">
              {{ MATCH_LABEL[result.matchType] ?? result.matchType }}
            </NTag>
          </NDescriptionsItem>
          <NDescriptionsItem v-if="result.receiptNo" label="小票号">{{ result.receiptNo }}</NDescriptionsItem>
          <NDescriptionsItem v-if="result.containerNo" label="柜号">{{ result.containerNo }}</NDescriptionsItem>
          <NDescriptionsItem v-if="result.trailerNo" label="车厢号">{{ result.trailerNo }}</NDescriptionsItem>
          <NDescriptionsItem v-if="result.vehicleSource" label="车辆来源">{{ result.vehicleSource }}</NDescriptionsItem>
          <NDescriptionsItem v-if="result.rejectReason" label="拦截原因" :span="2">
            {{ result.rejectReason }}
          </NDescriptionsItem>
        </NDescriptions>
      </template>
      <template #footer>
        <div class="flex gap-8px justify-center">
          <NButton
            v-if="result.checkResult === 'PASSED' && result.receiptNo"
            :loading="printing"
            @click="handlePrint"
          >打印小票</NButton>
          <NButton v-if="result.checkResult === 'PENDING'" type="primary" @click="emit('pass', result.id)">
            确认放行
          </NButton>
        </div>
      </template>
    </NResult>
  </NCard>
</template>
