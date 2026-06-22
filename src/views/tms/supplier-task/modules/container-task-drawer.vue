<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  fetchAuditSupplierContainerFees,
  fetchGetSupplierContainerOpDetail,
  fetchSaveSupplierContainerFees,
  fetchSyncSupplierContainerOp
} from '@/service/api/tms/supplier-container-op';
import {
  FEE_AUDIT_STATUS_LABEL,
  FEE_AUDIT_STATUS_TAG,
  SUPPLIER_OP_STATUS_LABEL
} from '../container-op-constants';

const props = defineProps<{
  orderId?: CommonType.IdType;
  initialTab?: string;
}>();

const emit = defineEmits<{
  (e: 'updated'): void;
}>();

const visible = defineModel<boolean>('visible', { default: false });
const activeTab = ref('info');
const loading = ref(false);
const saving = ref(false);
const feeSaving = ref(false);
const auditing = ref(false);
const detail = ref<Api.Oms.SupplierContainerOpDetail | null>(null);
const infoForm = ref<Record<string, any>>({});
const timeForm = ref<Record<string, any>>({});
const feeForm = ref<Api.Oms.SupplierContainerFeeBundle | null>(null);
const syncRemark = ref('');
const auditRemark = ref('');

const feeTotal = computed(() => {
  const f = feeForm.value;
  if (!f) return 0;
  return [f.pickupFee, f.detentionFee, f.chassisFee, f.portFee, f.exceptionFee, f.emptyReturnFee, f.otherFee]
    .map(v => Number(v || 0))
    .reduce((sum, n) => sum + n, 0);
});

async function loadDetail() {
  if (!props.orderId) return;
  loading.value = true;
  const { data, error } = await fetchGetSupplierContainerOpDetail(props.orderId);
  loading.value = false;
  if (error || !data) return;
  detail.value = data;
  infoForm.value = {
    containerNo: data.containerNo,
    containerType: data.containerType,
    sealNo: data.sealNo,
    vesselName: data.vesselName,
    voyageNo: data.voyageNo,
    mblNo: data.mblNo,
    hblNo: data.hblNo,
    terminalName: data.terminalName,
    eta: data.eta,
    ata: data.ata,
    pickupLfd: data.pickupLfd,
    emptyReturnLfd: data.emptyReturnLfd,
    terminalReleaseStatus: data.terminalReleaseStatus,
    remark: data.remark
  };
  timeForm.value = {
    pickupAppointmentNo: data.pickupAppointmentNo,
    pickupAppointmentTime: data.pickupAppointmentTime,
    actualPickupTime: data.actualPickupTime,
    pickupRemark: data.pickupRemark,
    expectedArrivalTime: data.expectedArrivalTime,
    requiredArrivalTime: data.requiredArrivalTime,
    actualArrivalTime: data.actualArrivalTime,
    containerLocation: data.containerLocation,
    arrivalRemark: data.arrivalRemark,
    expectedDevanningTime: data.expectedDevanningTime,
    devanningAppointmentTime: data.devanningAppointmentTime,
    devanningStartTime: data.devanningStartTime,
    devanningFinishTime: data.devanningFinishTime,
    devanningMethod: data.devanningMethod,
    loadingType: data.loadingType,
    devanningRemark: data.devanningRemark,
    emptyReturnLocation: data.emptyReturnLocation,
    emptyReturnAppointmentNo: data.emptyReturnAppointmentNo,
    emptyReturnTime: data.emptyReturnTime,
    emptyReturnStatus: data.emptyReturnStatus,
    emptyReturnRemark: data.emptyReturnRemark
  };
  feeForm.value = { ...(data.supplierFee || {}) };
}

watch(
  () => [visible.value, props.orderId, props.initialTab] as const,
  ([vis, id, tab]) => {
    if (vis && id) {
      activeTab.value = tab || 'info';
      syncRemark.value = '';
      auditRemark.value = '';
      loadDetail();
    }
  }
);

async function handleSync() {
  if (!props.orderId) return;
  saving.value = true;
  const { data, error } = await fetchSyncSupplierContainerOp({
    id: props.orderId,
    ...infoForm.value,
    ...timeForm.value,
    syncRemark: syncRemark.value || '供应商海柜操作同步'
  });
  saving.value = false;
  if (error || !data) {
    window.$message?.error('同步失败');
    return;
  }
  detail.value = data;
  feeForm.value = { ...(data.supplierFee || {}) };
  window.$message?.success('已同步至海柜订单');
  emit('updated');
}

async function handleSaveFees() {
  if (!props.orderId || !feeForm.value) return;
  feeSaving.value = true;
  const { data, error } = await fetchSaveSupplierContainerFees({
    containerOrderId: props.orderId,
    ...feeForm.value,
    submitterName: detail.value?.drayageVendorName || '供应商操作员'
  });
  feeSaving.value = false;
  if (error || !data) {
    window.$message?.error('费用保存失败');
    return;
  }
  detail.value = data;
  feeForm.value = { ...(data.supplierFee || {}) };
  window.$message?.success('费用已提交审核');
  emit('updated');
}

async function handleAudit(status: 'APPROVED' | 'REJECTED') {
  if (!props.orderId) return;
  if (status === 'REJECTED' && !auditRemark.value.trim()) {
    window.$message?.warning('驳回时请填写审核意见');
    return;
  }
  auditing.value = true;
  const { data, error } = await fetchAuditSupplierContainerFees({
    containerOrderId: props.orderId,
    auditStatus: status,
    auditRemark: auditRemark.value || null,
    auditorName: '财务审核'
  });
  auditing.value = false;
  if (error || !data) {
    window.$message?.error('审核失败');
    return;
  }
  detail.value = data;
  feeForm.value = { ...(data.supplierFee || {}) };
  window.$message?.success(status === 'APPROVED' ? '费用审核通过' : '费用已驳回');
  emit('updated');
}
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="920" class="max-w-98%">
    <NDrawerContent closable :native-scrollbar="false">
      <template #header>
        <div class="flex flex-wrap items-center gap-8px">
          <span class="text-16px font-medium">供应商海柜操作</span>
          <NTag v-if="detail?.containerNo" type="info" size="small">{{ detail.containerNo }}</NTag>
          <NTag v-if="detail?.containerStatus" size="small">
            {{ SUPPLIER_OP_STATUS_LABEL[detail.containerStatus] || detail.containerStatus }}
          </NTag>
          <NTag
            v-if="detail?.supplierFee?.auditStatus"
            :type="FEE_AUDIT_STATUS_TAG[detail.supplierFee.auditStatus] || 'default'"
            size="small"
          >
            费用{{ FEE_AUDIT_STATUS_LABEL[detail.supplierFee.auditStatus] || detail.supplierFee.auditStatus }}
          </NTag>
        </div>
      </template>

      <NSpin :show="loading">
        <NAlert type="info" class="mb-12px">
          录入海柜信息、时间节点与费用后保存，操作节点将同步至海柜订单轨迹。
        </NAlert>

        <NDescriptions v-if="detail" bordered :column="3" size="small" label-placement="left" class="mb-12px">
          <NDescriptionsItem label="工作单号">{{ detail.containerOrderNo }}</NDescriptionsItem>
          <NDescriptionsItem label="客户">{{ detail.customerName }}</NDescriptionsItem>
          <NDescriptionsItem label="提柜供应商">{{ detail.drayageVendorName || '--' }}</NDescriptionsItem>
          <NDescriptionsItem label="最近同步">{{ detail.lastSupplierSyncTime || '--' }}</NDescriptionsItem>
        </NDescriptions>

        <NTabs v-model:value="activeTab" type="line" animated>
          <NTabPane name="info" tab="海柜信息">
            <NForm label-placement="left" label-width="110" class="mt-8px">
              <NGrid :cols="2" :x-gap="16">
                <NGridItem>
                  <NFormItem label="柜号">
                    <NInput v-model:value="infoForm.containerNo" />
                  </NFormItem>
                </NGridItem>
                <NGridItem>
                  <NFormItem label="柜型">
                    <NInput v-model:value="infoForm.containerType" />
                  </NFormItem>
                </NGridItem>
                <NGridItem>
                  <NFormItem label="封条号">
                    <NInput v-model:value="infoForm.sealNo" />
                  </NFormItem>
                </NGridItem>
                <NGridItem>
                  <NFormItem label="码头">
                    <NInput v-model:value="infoForm.terminalName" />
                  </NFormItem>
                </NGridItem>
                <NGridItem>
                  <NFormItem label="船名">
                    <NInput v-model:value="infoForm.vesselName" />
                  </NFormItem>
                </NGridItem>
                <NGridItem>
                  <NFormItem label="航次">
                    <NInput v-model:value="infoForm.voyageNo" />
                  </NFormItem>
                </NGridItem>
                <NGridItem>
                  <NFormItem label="MBL">
                    <NInput v-model:value="infoForm.mblNo" />
                  </NFormItem>
                </NGridItem>
                <NGridItem>
                  <NFormItem label="HBL">
                    <NInput v-model:value="infoForm.hblNo" />
                  </NFormItem>
                </NGridItem>
                <NGridItem>
                  <NFormItem label="ETA">
                    <NInput v-model:value="infoForm.eta" placeholder="yyyy-MM-dd HH:mm:ss" />
                  </NFormItem>
                </NGridItem>
                <NGridItem>
                  <NFormItem label="ATA">
                    <NInput v-model:value="infoForm.ata" placeholder="yyyy-MM-dd HH:mm:ss" />
                  </NFormItem>
                </NGridItem>
                <NGridItem>
                  <NFormItem label="提柜LFD">
                    <NInput v-model:value="infoForm.pickupLfd" />
                  </NFormItem>
                </NGridItem>
                <NGridItem>
                  <NFormItem label="还柜LFD">
                    <NInput v-model:value="infoForm.emptyReturnLfd" />
                  </NFormItem>
                </NGridItem>
                <NGridItem :span="2">
                  <NFormItem label="备注">
                    <NInput v-model:value="infoForm.remark" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" />
                  </NFormItem>
                </NGridItem>
              </NGrid>
            </NForm>
          </NTabPane>

          <NTabPane name="nodes" tab="时间节点">
            <div class="mt-8px flex flex-col gap-12px">
              <NCard title="提柜" size="small">
                <NGrid :cols="2" :x-gap="16">
                  <NGridItem><NFormItem label="提柜预约号"><NInput v-model:value="timeForm.pickupAppointmentNo" /></NFormItem></NGridItem>
                  <NGridItem><NFormItem label="提柜预约时间"><NInput v-model:value="timeForm.pickupAppointmentTime" /></NFormItem></NGridItem>
                  <NGridItem><NFormItem label="实际提柜时间"><NInput v-model:value="timeForm.actualPickupTime" /></NFormItem></NGridItem>
                  <NGridItem><NFormItem label="提柜备注"><NInput v-model:value="timeForm.pickupRemark" /></NFormItem></NGridItem>
                </NGrid>
              </NCard>
              <NCard title="到仓" size="small">
                <NGrid :cols="2" :x-gap="16">
                  <NGridItem><NFormItem label="预计到仓"><NInput v-model:value="timeForm.expectedArrivalTime" /></NFormItem></NGridItem>
                  <NGridItem><NFormItem label="要求到仓"><NInput v-model:value="timeForm.requiredArrivalTime" /></NFormItem></NGridItem>
                  <NGridItem><NFormItem label="实际到仓"><NInput v-model:value="timeForm.actualArrivalTime" /></NFormItem></NGridItem>
                  <NGridItem><NFormItem label="海柜Location"><NInput v-model:value="timeForm.containerLocation" /></NFormItem></NGridItem>
                  <NGridItem :span="2"><NFormItem label="到仓备注"><NInput v-model:value="timeForm.arrivalRemark" /></NFormItem></NGridItem>
                </NGrid>
              </NCard>
              <NCard title="拆柜" size="small">
                <NGrid :cols="2" :x-gap="16">
                  <NGridItem><NFormItem label="预计拆柜"><NInput v-model:value="timeForm.expectedDevanningTime" /></NFormItem></NGridItem>
                  <NGridItem><NFormItem label="拆柜预约"><NInput v-model:value="timeForm.devanningAppointmentTime" /></NFormItem></NGridItem>
                  <NGridItem><NFormItem label="开始拆柜"><NInput v-model:value="timeForm.devanningStartTime" /></NFormItem></NGridItem>
                  <NGridItem><NFormItem label="拆柜完成"><NInput v-model:value="timeForm.devanningFinishTime" /></NFormItem></NGridItem>
                  <NGridItem><NFormItem label="拆柜方式"><NInput v-model:value="timeForm.devanningMethod" /></NFormItem></NGridItem>
                  <NGridItem><NFormItem label="装载类型"><NInput v-model:value="timeForm.loadingType" /></NFormItem></NGridItem>
                  <NGridItem :span="2"><NFormItem label="拆柜备注"><NInput v-model:value="timeForm.devanningRemark" /></NFormItem></NGridItem>
                </NGrid>
              </NCard>
              <NCard title="还柜" size="small">
                <NGrid :cols="2" :x-gap="16">
                  <NGridItem><NFormItem label="还柜地点"><NInput v-model:value="timeForm.emptyReturnLocation" /></NFormItem></NGridItem>
                  <NGridItem><NFormItem label="还柜预约号"><NInput v-model:value="timeForm.emptyReturnAppointmentNo" /></NFormItem></NGridItem>
                  <NGridItem><NFormItem label="还柜时间"><NInput v-model:value="timeForm.emptyReturnTime" /></NFormItem></NGridItem>
                  <NGridItem><NFormItem label="还柜状态"><NInput v-model:value="timeForm.emptyReturnStatus" /></NFormItem></NGridItem>
                  <NGridItem :span="2"><NFormItem label="还柜备注"><NInput v-model:value="timeForm.emptyReturnRemark" /></NFormItem></NGridItem>
                </NGrid>
              </NCard>
              <NFormItem label="同步备注">
                <NInput v-model:value="syncRemark" placeholder="可选，写入海柜订单轨迹" />
              </NFormItem>
            </div>
          </NTabPane>

          <NTabPane name="fees" tab="费用审核">
            <NCard v-if="feeForm" size="small" class="mt-8px" title="费用录入">
              <NGrid :cols="2" :x-gap="16">
                <NGridItem><NFormItem label="提柜费"><NInputNumber v-model:value="feeForm.pickupFee" :min="0" :precision="2" class="w-full" /></NFormItem></NGridItem>
                <NGridItem><NFormItem label="滞箱费"><NInputNumber v-model:value="feeForm.detentionFee" :min="0" :precision="2" class="w-full" /></NFormItem></NGridItem>
                <NGridItem><NFormItem label="车架费"><NInputNumber v-model:value="feeForm.chassisFee" :min="0" :precision="2" class="w-full" /></NFormItem></NGridItem>
                <NGridItem><NFormItem label="港口费"><NInputNumber v-model:value="feeForm.portFee" :min="0" :precision="2" class="w-full" /></NFormItem></NGridItem>
                <NGridItem><NFormItem label="异常费"><NInputNumber v-model:value="feeForm.exceptionFee" :min="0" :precision="2" class="w-full" /></NFormItem></NGridItem>
                <NGridItem><NFormItem label="还柜费"><NInputNumber v-model:value="feeForm.emptyReturnFee" :min="0" :precision="2" class="w-full" /></NFormItem></NGridItem>
                <NGridItem><NFormItem label="其他费用"><NInputNumber v-model:value="feeForm.otherFee" :min="0" :precision="2" class="w-full" /></NFormItem></NGridItem>
                <NGridItem><NFormItem label="费用合计"><span class="text-16px font-medium text-primary">${{ feeTotal.toFixed(2) }}</span></NFormItem></NGridItem>
                <NGridItem :span="2">
                  <NFormItem label="费用备注">
                    <NInput v-model:value="feeForm.feeRemark" type="textarea" :autosize="{ minRows: 2, maxRows: 3 }" />
                  </NFormItem>
                </NGridItem>
              </NGrid>
              <div class="mt-8px flex gap-8px">
                <NButton type="primary" :loading="feeSaving" @click="handleSaveFees">提交费用审核</NButton>
              </div>
            </NCard>

            <NCard v-if="feeForm" size="small" class="mt-12px" title="费用审核">
              <NDescriptions bordered :column="2" size="small" label-placement="left">
                <NDescriptionsItem label="审核状态">
                  <NTag :type="FEE_AUDIT_STATUS_TAG[feeForm.auditStatus] || 'default'" size="small">
                    {{ FEE_AUDIT_STATUS_LABEL[feeForm.auditStatus] || feeForm.auditStatus || '--' }}
                  </NTag>
                </NDescriptionsItem>
                <NDescriptionsItem label="提交人">{{ feeForm.submitterName || '--' }}</NDescriptionsItem>
                <NDescriptionsItem label="提交时间">{{ feeForm.submitTime || '--' }}</NDescriptionsItem>
                <NDescriptionsItem label="审核人">{{ feeForm.auditorName || '--' }}</NDescriptionsItem>
                <NDescriptionsItem label="审核时间">{{ feeForm.auditTime || '--' }}</NDescriptionsItem>
                <NDescriptionsItem label="审核意见">{{ feeForm.auditRemark || '--' }}</NDescriptionsItem>
              </NDescriptions>
              <div v-if="feeForm.auditStatus === 'PENDING'" class="mt-12px">
                <NFormItem label="审核意见">
                  <NInput v-model:value="auditRemark" type="textarea" :autosize="{ minRows: 2, maxRows: 3 }" placeholder="驳回时必填" />
                </NFormItem>
                <NSpace>
                  <NButton type="success" :loading="auditing" @click="handleAudit('APPROVED')">审核通过</NButton>
                  <NButton type="error" :loading="auditing" @click="handleAudit('REJECTED')">驳回</NButton>
                </NSpace>
              </div>
            </NCard>
          </NTabPane>

          <NTabPane name="trace" tab="同步轨迹">
            <NTimeline v-if="detail?.traces?.length" class="mt-12px">
              <NTimelineItem
                v-for="item in detail.traces"
                :key="item.id"
                :title="item.actionDesc || item.action"
                :time="item.createTime"
              >
                <div class="text-13px text-#606266">
                  {{ item.statusFrom || '--' }} → {{ item.statusTo }}
                  <span v-if="item.operatorName"> · {{ item.operatorName }}</span>
                </div>
                <div v-if="item.remark" class="text-12px text-#909399">{{ item.remark }}</div>
              </NTimelineItem>
            </NTimeline>
            <NEmpty v-else description="暂无同步轨迹" class="py-24px" />
          </NTabPane>
        </NTabs>
      </NSpin>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="visible = false">关闭</NButton>
          <NButton type="primary" :loading="saving" @click="handleSync">保存并同步海柜订单</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
