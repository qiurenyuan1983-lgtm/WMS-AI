<script setup lang="ts">
import { NButton, NDescriptions, NDescriptionsItem, NModal, NSpace, NTag } from 'naive-ui';

defineOptions({ name: 'BatchGenerateTripModal' });

const visible = defineModel<boolean>('visible', { default: false });

defineProps<{
  loading?: boolean;
  preview: Api.Oms.OrderWorkbenchBatchGenerateTripPreview | null;
}>();

const emit = defineEmits<{
  confirm: [];
}>();

const poolLabelMap: Record<Api.Oms.OrderWorkbenchPool, string> = {
  LTL: 'LTL 订单',
  PLATFORM: '平台预约订单',
  LOCAL: '本地/商业地址',
  EXPRESS: '快递订单'
};
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    title="合并生成车次"
    class="w-560px"
    :mask-closable="!loading"
    :closable="!loading"
  >
    <template v-if="preview">
      <NDescriptions :column="1" label-placement="left" bordered size="small">
        <NDescriptionsItem label="车次号">
          <span class="font-semibold text-primary">{{ preview.tripNo }}</span>
        </NDescriptionsItem>
        <NDescriptionsItem label="订单类型">{{ poolLabelMap[preview.pool] }}</NDescriptionsItem>
        <NDescriptionsItem label="合并订单数">{{ preview.orderNos.length }} 笔</NDescriptionsItem>
        <NDescriptionsItem label="订单号">
          <div class="flex flex-wrap gap-4px">
            <NTag v-for="orderNo in preview.orderNos" :key="orderNo" size="small">{{ orderNo }}</NTag>
          </div>
        </NDescriptionsItem>
        <NDescriptionsItem v-if="preview.platform" label="平台">{{ preview.platform }}</NDescriptionsItem>
        <NDescriptionsItem label="目的地">{{ preview.destination }}</NDescriptionsItem>
        <NDescriptionsItem label="合计板数">{{ preview.totalPalletQty }}</NDescriptionsItem>
        <NDescriptionsItem v-if="preview.supplierName" label="供应商">{{ preview.supplierName }}</NDescriptionsItem>
      </NDescriptions>
      <p class="mt-12px text-13px text-gray-500">确认后将写入车次订单列表，所选订单状态更新为已生成。</p>
    </template>

    <template #footer>
      <NSpace justify="end">
        <NButton :disabled="loading" @click="visible = false">取消</NButton>
        <NButton type="primary" :loading="loading" :disabled="!preview" @click="emit('confirm')">确认生成</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
