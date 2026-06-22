<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  fetchExecuteTransferInstructionAction,
  fetchGetTransferInstructionDetail
} from '@/service/api/wms/transfer-workbench';
import {
  formatRemainingMinutes,
  INSTRUCTION_CATEGORY_LABEL,
  OPERATION_TYPE_LABEL,
  RISK_COLOR,
  RISK_LABEL,
  STATUS_LABEL,
  STATUS_TAG
} from '../constants';

const props = defineProps<{ instructionId?: CommonType.IdType | null }>();
const emit = defineEmits<{ (e: 'updated'): void; (e: 'close'): void }>();

const loading = ref(false);
const acting = ref(false);
const detail = ref<Api.Wms.TransferInstruction | null>(null);
const actionRemark = ref('');

const riskStyle = computed(() => ({
  color: RISK_COLOR[detail.value?.riskLevel || 'NORMAL']
}));

async function loadDetail() {
  if (!props.instructionId) {
    detail.value = null;
    return;
  }
  loading.value = true;
  const { data, error } = await fetchGetTransferInstructionDetail(props.instructionId);
  loading.value = false;
  if (!error && data) detail.value = data;
}

watch(() => props.instructionId, loadDetail, { immediate: true });

const availableActions = computed(() => {
  const s = detail.value?.status;
  if (!s) return [];
  if (s === 'PENDING' || s === 'OVERDUE') return ['DISPATCH', 'CANCEL'];
  if (s === 'RECEIVED') return ['START', 'CANCEL'];
  if (s === 'IN_PROGRESS') return ['SUBMIT'];
  if (s === 'PENDING_REVIEW') return ['COMPLETE', 'REJECT'];
  return [];
});

const actionLabels: Record<string, string> = {
  DISPATCH: '派发',
  RECEIVE: '接收',
  START: '开始执行',
  SUBMIT: '提交结果',
  COMPLETE: '复核通过',
  REJECT: '驳回',
  CANCEL: '取消'
};

async function runAction(action: Api.Wms.TransferInstructionActionParams['action']) {
  if (!detail.value) return;
  acting.value = true;
  const { data, error } = await fetchExecuteTransferInstructionAction({
    instructionId: detail.value.id,
    action,
    remark: actionRemark.value || null,
    reviewResult: action === 'COMPLETE' ? '通过' : undefined
  });
  acting.value = false;
  if (error || !data) return;
  detail.value = data;
  actionRemark.value = '';
  window.$message?.success(`${actionLabels[action]}成功`);
  emit('updated');
}
</script>

<template>
  <div class="h-full flex flex-col border-l border-#e5e7eb bg-white">
    <div class="flex items-center justify-between border-b border-#e5e7eb px-14px py-10px">
      <div class="text-15px font-medium">指令详情</div>
      <NButton quaternary size="small" @click="emit('close')">收起</NButton>
    </div>

    <NSpin :show="loading" class="min-h-0 flex-1">
      <div v-if="detail" class="h-full overflow-y-auto px-14px py-12px">
        <div class="mb-12px flex flex-wrap items-center gap-6px">
          <NTag type="primary" size="small">{{ detail.instructionNo }}</NTag>
          <NTag :type="STATUS_TAG[detail.status] || 'default'" size="small">{{ STATUS_LABEL[detail.status] }}</NTag>
          <NTag size="small">{{ INSTRUCTION_CATEGORY_LABEL[detail.category] }}</NTag>
          <NTag size="small">{{ OPERATION_TYPE_LABEL[detail.operationType] || detail.operationType }}</NTag>
        </div>

        <div class="mb-12px rounded-8px bg-#f8fafc px-12px py-8px text-13px">
          <div class="font-medium" :style="riskStyle">
            {{ RISK_LABEL[detail.riskLevel] }} · {{ formatRemainingMinutes(detail.remainingMinutes) }}
          </div>
          <div class="text-12px text-#6b7280">最晚完成：{{ detail.deadline }}</div>
        </div>

        <NTabs type="line" size="small">
          <NTabPane name="basic" tab="基础信息">
            <NDescriptions bordered :column="1" size="small" label-placement="left" class="mt-8px">
              <NDescriptionsItem label="指令号">{{ detail.instructionNo }}</NDescriptionsItem>
              <NDescriptionsItem label="订单号">{{ detail.orderNo }}</NDescriptionsItem>
              <NDescriptionsItem label="责任部门">{{ detail.deptName }}</NDescriptionsItem>
              <NDescriptionsItem label="指派人员">{{ detail.assigneeName || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="执行人">{{ detail.executorName || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="优先级">{{ detail.priority }}</NDescriptionsItem>
            </NDescriptions>
          </NTabPane>

          <NTabPane name="order" tab="订单信息">
            <NDescriptions bordered :column="1" size="small" label-placement="left" class="mt-8px">
              <NDescriptionsItem label="客户">{{ detail.customerName }}</NDescriptionsItem>
              <NDescriptionsItem label="平台">{{ detail.platform }}</NDescriptionsItem>
              <NDescriptionsItem label="目的地">{{ detail.destination }}</NDescriptionsItem>
              <NDescriptionsItem label="订单状态">{{ detail.orderStatus }}</NDescriptionsItem>
              <NDescriptionsItem label="当前库位">{{ detail.currentLocation }}</NDescriptionsItem>
              <NDescriptionsItem label="目标位置">{{ detail.targetLocation || '—' }}</NDescriptionsItem>
            </NDescriptions>
          </NTabPane>

          <NTabPane name="cargo" tab="货物明细">
            <NDataTable
              class="mt-8px"
              size="small"
              :columns="[
                { title: '货物编号', key: 'cargoNo' },
                { title: 'SKU', key: 'sku' },
                { title: '数量', key: 'qty' },
                { title: '库位', key: 'currentLocation' }
              ]"
              :data="detail.cargoLines || []"
              :pagination="false"
            />
          </NTabPane>

          <NTabPane name="requirement" tab="操作要求">
            <NAlert type="info" class="mt-8px">{{ detail.operationRequirement }}</NAlert>
            <div v-if="detail.relabelTypes?.length" class="mt-8px">
              <span class="text-12px text-#6b7280">换标类型：</span>
              <NSpace class="mt-4px">
                <NTag v-for="t in detail.relabelTypes" :key="t" size="small">{{ t }}</NTag>
              </NSpace>
            </div>
            <div v-if="detail.holdFlag" class="mt-8px">
              <NAlert type="warning">货物已暂扣：禁止出库、禁止装车、禁止自动分配</NAlert>
            </div>
          </NTabPane>

          <NTabPane name="route" tab="路由信息">
            <NSteps vertical class="mt-12px" :current="(detail.routeSteps || []).findIndex(s => s.status === 'CURRENT') + 1">
              <NStep
                v-for="step in detail.routeSteps || []"
                :key="step.code"
                :title="step.label"
                :description="step.time || (step.status === 'BLOCKED' ? '阻塞' : '')"
                :status="step.status === 'DONE' ? 'finish' : step.status === 'CURRENT' ? 'process' : 'wait'"
              />
            </NSteps>
          </NTabPane>

          <NTabPane name="exec" tab="执行信息">
            <NDescriptions bordered :column="1" size="small" label-placement="left" class="mt-8px">
              <NDescriptionsItem label="接收时间">{{ detail.receivedTime || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="开始时间">{{ detail.startTime || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="提交时间">{{ detail.submitTime || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="完成时间">{{ detail.completeTime || '—' }}</NDescriptionsItem>
            </NDescriptions>
          </NTabPane>

          <NTabPane name="attach" tab="附件/照片">
            <NList v-if="detail.attachments?.length" class="mt-8px">
              <NListItem v-for="file in detail.attachments" :key="file.id">
                {{ file.fileName }} · {{ file.uploaderName }} · {{ file.uploadTime }}
              </NListItem>
            </NList>
            <NEmpty v-else description="暂无附件" class="py-16px" />
          </NTabPane>

          <NTabPane name="review" tab="复核结果">
            <NDescriptions bordered :column="1" size="small" class="mt-8px">
              <NDescriptionsItem label="复核结果">{{ detail.reviewResult || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="复核备注">{{ detail.reviewRemark || '—' }}</NDescriptionsItem>
            </NDescriptions>
          </NTabPane>

          <NTabPane name="log" tab="操作日志">
            <NTimeline class="mt-12px">
              <NTimelineItem v-for="log in detail.logs || []" :key="log.id" :title="log.action" :time="log.createTime">
                {{ log.operatorName }}<span v-if="log.remark"> · {{ log.remark }}</span>
              </NTimelineItem>
            </NTimeline>
          </NTabPane>
        </NTabs>

        <NCard v-if="availableActions.length" size="small" class="mt-16px" title="指令操作">
          <NInput v-model:value="actionRemark" type="textarea" :autosize="{ minRows: 2, maxRows: 3 }" placeholder="操作备注（驳回时建议填写）" class="mb-8px" />
          <NSpace>
            <NButton
              v-for="act in availableActions"
              :key="act"
              :type="act === 'COMPLETE' ? 'success' : act === 'REJECT' || act === 'CANCEL' ? 'error' : 'primary'"
              size="small"
              :loading="acting"
              @click="runAction(act as any)"
            >
              {{ actionLabels[act] }}
            </NButton>
          </NSpace>
        </NCard>
      </div>
      <NEmpty v-else description="请选择一条指令查看详情" class="py-40px" />
    </NSpin>
  </div>
</template>
