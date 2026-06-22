<script setup lang="ts">
import { ref, watch } from 'vue';
import { NButton, NDescriptions, NDescriptionsItem, NDrawer, NDrawerContent, NSpace, NSpin, NTable } from 'naive-ui';
import { fetchGetPortalBillDetail } from '@/service/api/portal';
import { PORTAL_BILL_STATUS_META } from '../../constants';

const visible = defineModel<boolean>('visible', { default: false });
const props = defineProps<{ billNo: string | null }>();

const loading = ref(false);
const detail = ref<Api.Portal.PortalBillDetail | null>(null);

async function loadDetail() {
  if (!props.billNo) {
    detail.value = null;
    return;
  }
  loading.value = true;
  try {
    const { data } = await fetchGetPortalBillDetail(props.billNo);
    detail.value = data ?? null;
  } finally {
    loading.value = false;
  }
}

function downloadMock(format: 'pdf' | 'excel') {
  window.$message?.info(`原型模式：账单 ${props.billNo} ${format.toUpperCase()} 下载已模拟`);
}

watch([() => props.billNo, visible], () => {
  if (visible.value) loadDetail();
});
</script>

<template>
  <NDrawer v-model:show="visible" :width="560" placement="right">
    <NDrawerContent :title="detail ? `账单 ${detail.billNo}` : '账单详情'" closable>
      <NSpin :show="loading">
        <template v-if="detail">
          <NDescriptions :column="2" label-placement="left" size="small" bordered class="mb-16px">
            <NDescriptionsItem label="账期">{{ detail.billMonth }}</NDescriptionsItem>
            <NDescriptionsItem label="状态">
              {{ PORTAL_BILL_STATUS_META[detail.status]?.label || detail.statusLabel }}
            </NDescriptionsItem>
            <NDescriptionsItem label="账单总额">{{ detail.totalAmount.display }}</NDescriptionsItem>
            <NDescriptionsItem label="已付金额">{{ detail.paidAmount.display }}</NDescriptionsItem>
            <NDescriptionsItem label="开票日">{{ detail.issueDate }}</NDescriptionsItem>
            <NDescriptionsItem label="到期日">{{ detail.dueDate }}</NDescriptionsItem>
          </NDescriptions>

          <div class="text-13px font-medium">费用构成</div>
          <NTable size="small" class="mt-8px" :single-line="false">
            <thead>
              <tr>
                <th>费用项</th>
                <th class="text-right">金额</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in detail.feeBreakdown" :key="item.label">
                <td>{{ item.label }}</td>
                <td class="text-right">{{ item.amount.display }}</td>
              </tr>
            </tbody>
          </NTable>

          <div v-if="detail.paymentHistory.length" class="mt-16px text-13px font-medium">付款记录</div>
          <NTable v-if="detail.paymentHistory.length" size="small" class="mt-8px" :single-line="false">
            <thead>
              <tr>
                <th>时间</th>
                <th>金额</th>
                <th>方式</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(p, idx) in detail.paymentHistory" :key="idx">
                <td>{{ p.time }}</td>
                <td>{{ p.amount }}</td>
                <td>{{ p.method }}</td>
              </tr>
            </tbody>
          </NTable>

          <NSpace class="mt-16px">
            <NButton type="primary" @click="downloadMock('pdf')">下载 PDF</NButton>
            <NButton @click="downloadMock('excel')">下载 Excel</NButton>
          </NSpace>
        </template>
      </NSpin>
    </NDrawerContent>
  </NDrawer>
</template>
