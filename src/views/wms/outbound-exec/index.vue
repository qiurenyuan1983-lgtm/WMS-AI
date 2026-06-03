<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NCard, NDataTable, NInput, NSpace } from 'naive-ui';

defineOptions({ name: 'WmsOutboundExec' });

const route = useRoute();
const router = useRouter();
const scanPallet = ref('');
const scanned = ref<Array<{ palletNo: string; status: string }>>([]);

const outboundOrderNo = (route.query.outboundOrderNo as string) || 'WOB-2026-0001';

function scanPalletAction() {
  const v = scanPallet.value.trim();
  if (!v) {
    window.$message?.warning('请输入或扫描托盘号');
    return;
  }
  if (scanned.value.some(p => p.palletNo === v)) {
    window.$message?.warning('该托盘已扫描');
    return;
  }
  scanned.value.push({ palletNo: v, status: '待复核' });
  scanPallet.value = '';
}

function reviewAll() {
  scanned.value = scanned.value.map(p => ({ ...p, status: '已复核' }));
  window.$message?.success('[原型] 复核完成');
}

function completeOutbound() {
  if (!scanned.value.length) {
    window.$message?.warning('请先扫描托盘');
    return;
  }
  window.$message?.success(`[原型] 出库单 ${outboundOrderNo} 已完成，共 ${scanned.value.length} 板`);
}
</script>

<template>
  <div class="p-16px">
    <NCard title="出库执行">
      <p class="mb-8px">
        出库单号：{{ outboundOrderNo }} ｜ 客户：演示客户 A
      </p>
      <NSpace class="mb-12px">
        <NInput
          v-model:value="scanPallet"
          size="large"
          placeholder="扫描托盘号"
          class="max-w-320px"
          @keyup.enter="scanPalletAction"
        />
        <NButton type="primary" size="large" @click="scanPalletAction">扫描托盘</NButton>
      </NSpace>
      <NDataTable
        size="small"
        :data="scanned"
        :columns="[
          { title: '托盘号', key: 'palletNo' },
          { title: '状态', key: 'status' }
        ]"
      />
      <NSpace class="mt-16px" size="large">
        <NButton size="large" @click="reviewAll">复核</NButton>
        <NButton type="info" size="large" @click="router.push({ name: 'wms_outbound-loading' })">装车确认</NButton>
        <NButton type="success" size="large" @click="completeOutbound">完成出库</NButton>
        <NButton @click="router.back()">返回</NButton>
      </NSpace>
    </NCard>
  </div>
</template>
