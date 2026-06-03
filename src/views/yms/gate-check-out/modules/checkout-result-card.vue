<script setup lang="ts">
interface Props {
  result: Api.Yms.CheckOut | null;
}

defineProps<Props>();
const emit = defineEmits<{ (e: 'confirm', confirmed: boolean): void }>();

const RESULT_LABEL: Record<string, string> = {
  PASSED: 'PASS：可放行离场',
  PENDING: 'WARN：需确认',
  REJECTED: 'BLOCK：不可离场'
};

const TASK_TYPE_LABEL: Record<string, string> = {
  DOCK_IN: '上口',
  DOCK_OUT: '下口到堆场位',
  CONTAINER_TO_DOCK: '海柜上口',
  TRAILER_TO_DOCK: '车厢上口'
};

const TASK_STATUS_LABEL: Record<string, string> = {
  PENDING: '待领取',
  ASSIGNED: '待领取',
  ACCEPTED: '已领取',
  IN_PROGRESS: '执行中'
};

function formatStayMinutes(minutes: number | null) {
  if (minutes == null) return '—';
  if (minutes < 60) return `${minutes} 分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} 小时 ${m} 分` : `${h} 小时`;
}

function formatTaskType(type: string | null) {
  if (!type) return '—';
  return TASK_TYPE_LABEL[type] ?? type;
}

function formatTaskStatus(status: string | null) {
  if (!status) return '—';
  return TASK_STATUS_LABEL[status] ?? status;
}
</script>

<template>
  <NCard v-if="result" title="离场匹配结果" :bordered="false" class="card-wrapper">
    <NResult
      :status="result.checkOutResult === 'PASSED' ? 'success' : result.checkOutResult === 'PENDING' ? 'warning' : 'error'"
      :title="RESULT_LABEL[result.checkOutResult] ?? result.checkOutResult"
    >
      <template #default>
        <NDescriptions bordered :column="2" size="small" class="mt-16px">
          <NDescriptionsItem label="类型">{{ result.objectType === 'CONTAINER' ? '海柜' : '车厢/车辆' }}</NDescriptionsItem>
          <NDescriptionsItem label="资源车牌">{{ result.plateNo ?? '—' }}</NDescriptionsItem>
          <NDescriptionsItem label="入场车牌">{{ result.gateInPlateNo ?? '—' }}</NDescriptionsItem>
          <NDescriptionsItem label="入场司机">{{ result.gateInDriverName ?? '—' }}</NDescriptionsItem>
          <NDescriptionsItem label="入场电话">{{ result.gateInDriverPhone ?? '—' }}</NDescriptionsItem>
          <NDescriptionsItem v-if="result.checkOutPlateNo || result.checkOutDriverName" label="离场车牌">
            {{ result.checkOutPlateNo ?? '—' }}
          </NDescriptionsItem>
          <NDescriptionsItem v-if="result.checkOutDriverName" label="离场司机">
            {{ result.checkOutDriverName }}
          </NDescriptionsItem>
          <NDescriptionsItem v-if="result.checkOutDriverPhone" label="离场电话">
            {{ result.checkOutDriverPhone }}
          </NDescriptionsItem>
          <NDescriptionsItem v-if="result.containerNo" label="柜号">{{ result.containerNo }}</NDescriptionsItem>
          <NDescriptionsItem v-if="result.trailerNo" label="车厢号">{{ result.trailerNo }}</NDescriptionsItem>
          <NDescriptionsItem label="当前状态">{{ result.currentStatus }}</NDescriptionsItem>
          <NDescriptionsItem label="位置">{{ result.areaLabel ?? '—' }}</NDescriptionsItem>
          <NDescriptionsItem label="到场时间">{{ result.gateInTime ?? '—' }}</NDescriptionsItem>
          <NDescriptionsItem label="在场时长">{{ formatStayMinutes(result.stayMinutes) }}</NDescriptionsItem>
          <NDescriptionsItem v-if="result.rejectReason" label="提示" :span="2">
            {{ result.rejectReason }}
          </NDescriptionsItem>
          <NDescriptionsItem v-if="result.openInternalTaskId" label="YardGo后续任务" :span="2">
            <NSpace vertical size="small">
              <NAlert type="info" :show-icon="false">
                存在后续 YardGo 院内任务，仅作为离场提醒，不阻止业务人员确认 Check-out。
              </NAlert>
              <NSpace>
                <NTag type="info">{{ formatTaskType(result.openInternalTaskType) }}</NTag>
                <NTag>{{ formatTaskStatus(result.openInternalTaskStatus) }}</NTag>
                <span>{{ result.openInternalTaskNo ?? '—' }}</span>
                <span v-if="result.openInternalTaskTargetCode">目标：{{ result.openInternalTaskTargetCode }}</span>
              </NSpace>
            </NSpace>
          </NDescriptionsItem>
          <NDescriptionsItem v-if="result.gateOutTime" label="离场时间">{{ result.gateOutTime }}</NDescriptionsItem>
        </NDescriptions>
      </template>
      <template v-if="result.checkOutResult === 'PENDING' && !result.gateOutTime" #footer>
        <NButton type="primary" @click="emit('confirm', true)">确认离场</NButton>
      </template>
      <template v-else-if="result.checkOutResult === 'PASSED' && !result.gateOutTime" #footer>
        <NButton type="primary" @click="emit('confirm', false)">办理离场</NButton>
      </template>
    </NResult>
  </NCard>
</template>
