<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NCard, NDescriptions, NDescriptionsItem, NInput, NSpace, NTag } from 'naive-ui';

defineOptions({ name: 'WmsInboundTask' });

const route = useRoute();
const router = useRouter();

const palletNo = ref(String(route.query.palletNo || 'PLT-IN-2026-001'));
const scanInput = ref('');

const inboundNo = computed(() => String(route.query.inboundNo || 'IN-2026-0001'));
const containerNo = computed(() => String(route.query.containerNo || 'MSCU1234567'));
const groupCode = computed(() => String(route.query.groupCode || 'FedEx-LAX'));

const recommendLocation = computed(() => {
  const fromQuery = route.query.recommendLocation;
  if (fromQuery) return String(fromQuery);
  if (palletNo.value.endsWith('004') || palletNo.value.endsWith('005')) return 'B-01-02';
  if (palletNo.value.endsWith('003')) return 'A-02-04';
  return 'A-02-03';
});

const palletInfo = computed(() => ({
  palletNo: palletNo.value,
  boxQty: palletNo.value.endsWith('003') ? 45 : palletNo.value.endsWith('002') ? 35 : palletNo.value.endsWith('004') ? 28 : palletNo.value.endsWith('005') ? 32 : 40,
  weight: palletNo.value.endsWith('003') ? 580 : palletNo.value.endsWith('002') ? 455 : palletNo.value.endsWith('004') ? 360 : palletNo.value.endsWith('005') ? 410 : 520,
  recommendLocation: recommendLocation.value,
  status: 'PENDING'
}));

function applyScan() {
  const v = scanInput.value.trim();
  if (!v) return;
  palletNo.value = v;
  scanInput.value = '';
  window.$message?.success(`[原型] 已切换到卡板 ${v}`);
}

function confirmInbound() {
  window.$message?.success(`[原型] 卡板 ${palletNo.value} 入库完成，将按推荐库位 ${recommendLocation.value} 进入上架任务`);
}
</script>

<template>
  <div class="p-16px">
    <NCard :title="`卡板入库 - ${palletNo}`">
      <template #header-extra>
        <NButton @click="router.back()">返回</NButton>
      </template>
      <p class="mb-8px text-gray-500">
        入库单按卡板维度处理：待入库卡板展示系统推荐库位，确认入库后由上架任务落位至该库位
      </p>
      <NDescriptions :column="2" bordered label-placement="left" class="mb-16px">
        <NDescriptionsItem label="入库批次">{{ inboundNo }}</NDescriptionsItem>
        <NDescriptionsItem label="柜号">{{ containerNo }}</NDescriptionsItem>
        <NDescriptionsItem label="分组">{{ groupCode }}</NDescriptionsItem>
        <NDescriptionsItem label="卡板号">{{ palletInfo.palletNo }}</NDescriptionsItem>
        <NDescriptionsItem label="推荐库位">{{ palletInfo.recommendLocation }}</NDescriptionsItem>
        <NDescriptionsItem label="箱数">{{ palletInfo.boxQty }}</NDescriptionsItem>
        <NDescriptionsItem label="重量(kg)">{{ palletInfo.weight }}</NDescriptionsItem>
        <NDescriptionsItem label="状态">
          <NTag type="warning" size="small">待入库</NTag>
        </NDescriptionsItem>
      </NDescriptions>
      <NSpace class="mb-16px" align="center">
        <NInput
          v-model:value="scanInput"
          class="max-w-360px"
          placeholder="扫描托盘号切换卡板"
          @keyup.enter="applyScan"
        />
        <NButton @click="applyScan">扫描确认</NButton>
      </NSpace>
      <NSpace>
        <NButton type="primary" size="large" @click="confirmInbound">确认本板入库</NButton>
        <NButton size="large">打印卡板标签</NButton>
        <NButton type="warning" size="large">异常登记</NButton>
      </NSpace>
    </NCard>
  </div>
</template>
