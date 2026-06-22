<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NAlert, NButton, NDataTable, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchGetPortalExceptionList } from '@/service/api/portal';
import { PORTAL_EXCEPTION_STATUS_META } from '../constants';
import ExceptionDetailDrawer from './modules/exception-detail-drawer.vue';
import FeedbackModal from './modules/feedback-modal.vue';

defineOptions({ name: 'PortalException' });

const loading = ref(false);
const rows = ref<Api.Portal.PortalException[]>([]);
const showFeedback = ref(false);
const showDetail = ref(false);
const detailId = ref<number | null>(null);

async function loadList() {
  loading.value = true;
  const { data } = await fetchGetPortalExceptionList({ pageNum: 1, pageSize: 50 });
  loading.value = false;
  rows.value = (data as any)?.rows ?? [];
}

function openDetail(id: number) {
  detailId.value = id;
  showDetail.value = true;
}

const columns: DataTableColumns<Api.Portal.PortalException> = [
  { title: '异常单号', key: 'exceptionNo', width: 140 },
  { title: '关联订单号', key: 'orderNo', width: 130 },
  { title: '客户订单号', key: 'customerOrderNo', width: 150 },
  { title: '异常类型', key: 'exceptionType', width: 90 },
  {
    title: '当前状态',
    key: 'customerStatus',
    width: 100,
    render: row => {
      const meta = PORTAL_EXCEPTION_STATUS_META[row.customerStatus];
      return <NTag size="small" type={meta.type}>{meta.label}</NTag>;
    }
  },
  { title: '推送人', key: 'pushedBy', width: 100 },
  { title: '推送时间', key: 'pushedTime', width: 160 },
  {
    title: '需客户确认',
    key: 'needCustomerConfirm',
    width: 100,
    render: row => (row.needCustomerConfirm ? '是' : '否')
  },
  {
    title: '截止回复',
    key: 'replyDeadline',
    width: 160,
    render: row => row.replyDeadline || '—'
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    fixed: 'right',
    render: row => (
      <NButton text type="primary" size="small" onClick={() => openDetail(row.id)}>
        查看
      </NButton>
    )
  }
];

onMounted(loadList);
</script>

<template>
  <div class="portal-exception">
    <NAlert type="info" :bordered="false">
      本页仅展示客服/调度审核后推送给您的异常。您不能直接创建异常单或修改内部处理状态。
    </NAlert>

    <div class="portal-exception__toolbar">
      <NSpace>
        <NButton type="primary" @click="showFeedback = true">提交问题反馈</NButton>
      </NSpace>
      <span class="portal-exception__hint">无「新建异常」入口 — 问题反馈由客服审核后决定是否转内部异常</span>
    </div>

    <NDataTable
      :columns="columns"
      :data="rows"
      :loading="loading"
      :scroll-x="1200"
      size="small"
      striped
    />

    <FeedbackModal v-model:show="showFeedback" />
    <ExceptionDetailDrawer v-model:show="showDetail" :exception-id="detailId" @updated="loadList" />
  </div>
</template>

<style scoped>
.portal-exception {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.portal-exception__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.portal-exception__hint {
  font-size: 12px;
  color: var(--n-text-color-3);
}
</style>
