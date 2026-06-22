<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  NButton,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NSpin,
  NStep,
  NSteps,
  NTable,
  NTag
} from 'naive-ui';
import { fetchGetPortalTransferInstructionDetail } from '@/service/api/portal';

const visible = defineModel<boolean>('visible', { default: false });
const props = defineProps<{ instructionId: number | null }>();

const loading = ref(false);
const detail = ref<Api.Portal.PortalTransferInstructionDetail | null>(null);

const STATUS_TYPE: Record<string, NaiveUI.ThemeColor> = {
  SUBMITTED: 'info',
  PROCESSING: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'default'
};

async function loadDetail() {
  if (!props.instructionId) {
    detail.value = null;
    return;
  }
  loading.value = true;
  try {
    const { data } = await fetchGetPortalTransferInstructionDetail(props.instructionId);
    detail.value = data ?? null;
  } finally {
    loading.value = false;
  }
}

watch([() => props.instructionId, visible], () => {
  if (visible.value) loadDetail();
});

function previewAttachment() {
  window.$message?.info('原型模式：附件预览已模拟');
}
</script>

<template>
  <NDrawer v-model:show="visible" :width="600" placement="right">
    <NDrawerContent :title="detail ? `指令 ${detail.instructionNo}` : '指令详情'" closable>
      <NSpin :show="loading">
        <template v-if="detail">
          <NTag size="small" :type="STATUS_TYPE[detail.status] || 'default'" class="mb-12px">
            {{ detail.statusLabel }}
          </NTag>
          <NDescriptions :column="1" label-placement="left" size="small" bordered class="mb-16px">
            <NDescriptionsItem label="系统订单号">{{ detail.orderNo }}</NDescriptionsItem>
            <NDescriptionsItem label="客户订单号">{{ detail.customerOrderNo }}</NDescriptionsItem>
            <NDescriptionsItem label="操作类型">{{ detail.operationTypeLabel }}</NDescriptionsItem>
            <NDescriptionsItem label="提交时间">{{ detail.submitTime }}</NDescriptionsItem>
            <NDescriptionsItem label="备注">{{ detail.remark || '—' }}</NDescriptionsItem>
          </NDescriptions>

          <div class="mb-8px text-13px font-medium">处理进度</div>
          <NSteps
            size="small"
            class="mb-16px"
            :current="detail.progressSteps.findIndex(s => s.status === 'current') + 1 || detail.progressSteps.length"
          >
            <NStep v-for="(step, idx) in detail.progressSteps" :key="idx" :title="step.title" :description="step.time" />
          </NSteps>

          <div class="mb-8px text-13px font-medium">附件 ({{ detail.attachments.length }})</div>
          <NTable v-if="detail.attachments.length" size="small" :single-line="false">
            <thead>
              <tr>
                <th>文件名</th>
                <th>大小</th>
                <th>上传时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="file in detail.attachments" :key="file.id">
                <td>{{ file.fileName }}</td>
                <td>{{ file.fileSize }}</td>
                <td>{{ file.uploadTime }}</td>
                <td>
                  <NButton text type="primary" size="small" @click="previewAttachment">
                    预览
                  </NButton>
                </td>
              </tr>
            </tbody>
          </NTable>
          <p v-else class="text-12px text-#6b7280">无附件</p>
        </template>
      </NSpin>
    </NDrawerContent>
  </NDrawer>
</template>
