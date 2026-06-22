<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  NButton,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NInput,
  NSpace,
  NSpin,
  NTable,
  NTag
} from 'naive-ui';
import { fetchGetPortalFeeConfirmDetail, fetchPortalFeeConfirmAction } from '@/service/api/portal';
import { PORTAL_FEE_STATUS_META } from '../../constants';

const visible = defineModel<boolean>('visible', { default: false });
const props = defineProps<{ feeId: number | null }>();
const emit = defineEmits<{ updated: [] }>();

const loading = ref(false);
const actionLoading = ref(false);
const rejectRemark = ref('');
const detail = ref<Api.Portal.PortalFeeConfirmDetail | null>(null);

async function loadDetail() {
  if (!props.feeId) {
    detail.value = null;
    return;
  }
  loading.value = true;
  try {
    const { data } = await fetchGetPortalFeeConfirmDetail(props.feeId);
    detail.value = data ?? null;
  } finally {
    loading.value = false;
  }
}

async function doAction(action: 'confirm' | 'reject') {
  if (!props.feeId) return;
  actionLoading.value = true;
  const { data, error } = await fetchPortalFeeConfirmAction(props.feeId, {
    action,
    remark: action === 'reject' ? rejectRemark.value.trim() : undefined
  });
  actionLoading.value = false;
  if (error) return;
  window.$message?.success(data?.message || '操作成功');
  rejectRemark.value = '';
  await loadDetail();
  emit('updated');
}

watch([() => props.feeId, visible], () => {
  if (visible.value) loadDetail();
});
</script>

<template>
  <NDrawer v-model:show="visible" :width="560" placement="right">
    <NDrawerContent :title="detail ? `费用 ${detail.feeNo}` : '费用详情'" closable>
      <NSpin :show="loading">
        <template v-if="detail">
          <NTag size="small" :type="PORTAL_FEE_STATUS_META[detail.status]?.type || 'default'" class="mb-12px">
            {{ PORTAL_FEE_STATUS_META[detail.status]?.label || detail.statusLabel }}
          </NTag>
          <NDescriptions :column="1" label-placement="left" size="small" bordered>
            <NDescriptionsItem v-for="line in detail.lines" :key="line.label" :label="line.label">
              {{ line.value }}
            </NDescriptionsItem>
          </NDescriptions>

          <div class="mt-16px text-13px font-medium">费用明细</div>
          <NTable size="small" class="mt-8px" :single-line="false">
            <thead>
              <tr>
                <th>项目</th>
                <th>数量</th>
                <th>单价</th>
                <th class="text-right">金额</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(line, idx) in detail.breakdown" :key="idx">
                <td>{{ line.item }}</td>
                <td>{{ line.qty }}</td>
                <td>{{ line.unitPrice }}</td>
                <td class="text-right">{{ line.amount.display }}</td>
              </tr>
            </tbody>
          </NTable>

          <template v-if="detail.status === 'PENDING'">
            <div class="mt-16px text-13px font-medium">驳回说明（可选）</div>
            <NInput v-model:value="rejectRemark" type="textarea" :rows="2" class="mt-8px" placeholder="如有异议请填写" />
            <NSpace class="mt-12px">
              <NButton type="primary" :loading="actionLoading" @click="doAction('confirm')">确认费用</NButton>
              <NButton :loading="actionLoading" @click="doAction('reject')">驳回</NButton>
            </NSpace>
          </template>
        </template>
      </NSpin>
    </NDrawerContent>
  </NDrawer>
</template>
