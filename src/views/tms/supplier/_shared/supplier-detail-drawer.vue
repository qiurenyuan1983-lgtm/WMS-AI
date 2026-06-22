<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NDescriptions, NDescriptionsItem, NDrawer, NDrawerContent, NSpin, NTabPane, NTabs, NTag } from 'naive-ui';
import { useDict } from '@/hooks/business/dict';
import { fetchGetSupplierDetail } from '@/service/api/tms/supplier';

const props = defineProps<{
  visible: boolean;
  supplierId: CommonType.IdType | null;
}>();

const emit = defineEmits<{ 'update:visible': [value: boolean] }>();

const { record: typeRecord } = useDict('oms_supplier_type');
const { record: statusRecord } = useDict('oms_supplier_status');

const loading = ref(false);
const detail = ref<Api.Oms.Supplier | null>(null);

const show = computed({
  get: () => props.visible,
  set: v => emit('update:visible', v)
});

function text(v: unknown) {
  return v === null || v === undefined || v === '' ? '--' : String(v);
}

async function loadDetail() {
  if (!props.supplierId) {
    detail.value = null;
    return;
  }
  loading.value = true;
  try {
    const { data } = await fetchGetSupplierDetail(props.supplierId);
    detail.value = data ?? null;
  } finally {
    loading.value = false;
  }
}

watch(() => [props.visible, props.supplierId], () => {
  if (props.visible) loadDetail();
}, { immediate: true });
</script>

<template>
  <NDrawer v-model:show="show" :width="560" placement="right">
    <NDrawerContent :title="detail?.supplierName || '供应商详情'" closable>
      <NSpin :show="loading">
        <template v-if="detail">
          <div class="mb-12px flex items-center gap-8px flex-wrap">
            <NTag size="small" :type="(typeRecord[detail.supplierType]?.listClass as NaiveUI.ThemeColor) || 'default'">
              {{ typeRecord[detail.supplierType]?.dictLabel || detail.supplierType }}
            </NTag>
            <NTag size="small" :type="(statusRecord[detail.status]?.listClass as NaiveUI.ThemeColor) || 'default'">
              {{ statusRecord[detail.status]?.dictLabel || detail.status }}
            </NTag>
            <span v-if="detail.score != null" class="text-13px text-amber-600 font-medium">评分 {{ detail.score }}</span>
          </div>

          <NTabs type="line" animated>
            <NTabPane name="base" tab="基础资料">
              <NDescriptions :column="1" label-placement="left" :label-style="{ width: '108px', color: '#6b7280' }">
                <NDescriptionsItem label="供应商编码">{{ text(detail.supplierCode) }}</NDescriptionsItem>
                <NDescriptionsItem label="联系人">{{ text(detail.contactName) }}</NDescriptionsItem>
                <NDescriptionsItem label="联系电话">{{ text(detail.contactPhone) }}</NDescriptionsItem>
                <NDescriptionsItem label="邮箱">{{ text(detail.contactEmail) }}</NDescriptionsItem>
                <NDescriptionsItem label="合作区域">{{ text(detail.serviceRegion) }}</NDescriptionsItem>
                <NDescriptionsItem label="服务码头">{{ text(detail.serviceTerminals) }}</NDescriptionsItem>
                <NDescriptionsItem label="SCAC">{{ text(detail.scacCode) }}</NDescriptionsItem>
                <NDescriptionsItem label="DOT">{{ text(detail.dotNo) }}</NDescriptionsItem>
                <NDescriptionsItem label="MC">{{ text(detail.mcNo) }}</NDescriptionsItem>
                <NDescriptionsItem label="保险资料">{{ text(detail.insuranceInfo) }}</NDescriptionsItem>
                <NDescriptionsItem label="合同有效期">{{ text(detail.contractExpireDate) }}</NDescriptionsItem>
                <NDescriptionsItem label="付款账期">{{ text(detail.paymentTerms) }}</NDescriptionsItem>
                <NDescriptionsItem label="合作仓库">{{ text(detail.warehouseNames) }}</NDescriptionsItem>
                <NDescriptionsItem v-if="detail.supplierType === 'LTL'" label="下单门户">
                  <a
                    v-if="detail.orderPortalUrl"
                    :href="detail.orderPortalUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-primary"
                  >
                    {{ detail.orderPortalUrl }}
                  </a>
                  <span v-else>--</span>
                </NDescriptionsItem>
                <NDescriptionsItem label="备注">{{ text(detail.remark) }}</NDescriptionsItem>
              </NDescriptions>
            </NTabPane>
            <NTabPane name="quote" tab="报价">
              <div class="text-13px text-gray-500 py-20px text-center">
                请在「供应商报价管理」中维护该供应商报价版本与生效日期。
              </div>
            </NTabPane>
            <NTabPane name="account" tab="账号">
              <div class="text-13px text-gray-500 py-20px text-center">
                请在「供应商账号权限管理」中配置门户登录账号与权限范围。
              </div>
            </NTabPane>
            <NTabPane name="task" tab="任务">
              <div class="text-13px text-gray-500 py-20px text-center">
                任务数据来自 OMS 海柜订单 / 出库车次 / WMS 拆柜装车作业推送。
              </div>
            </NTabPane>
            <NTabPane name="bill" tab="账单">
              <div class="text-13px text-gray-500 py-20px text-center">
                任务完成后系统自动生成应付账单草稿，可在账单管理中审核。
              </div>
            </NTabPane>
            <NTabPane name="kpi" tab="绩效">
              <div class="text-13px text-gray-500 py-20px text-center">
                绩效指标汇总见「供应商绩效看板」。
              </div>
            </NTabPane>
          </NTabs>
        </template>
      </NSpin>
    </NDrawerContent>
  </NDrawer>
</template>
