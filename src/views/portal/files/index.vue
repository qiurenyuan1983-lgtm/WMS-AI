<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NButton, NCard, NDataTable, NInput, NSelect, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchGetPortalFileList, fetchGetPortalFileTypeOptions } from '@/service/api/portal';
import FileUploadModal from './modules/file-upload-modal.vue';

defineOptions({ name: 'PortalFiles' });

const loading = ref(false);
const rows = ref<Api.Portal.PortalFile[]>([]);
const keyword = ref('');
const fileType = ref<string | null>(null);
const typeOptions = ref<Array<{ label: string; value: string }>>([]);
const uploadVisible = ref(false);

const columns: DataTableColumns<Api.Portal.PortalFile> = [
  { title: '文件名', key: 'fileName', minWidth: 180, ellipsis: { tooltip: true } },
  { title: '类型', key: 'fileTypeLabel', width: 100 },
  { title: '关联订单', key: 'orderNo', width: 130, render: row => row.orderNo || '—' },
  { title: '海柜', key: 'containerNo', width: 120, render: row => row.containerNo || '—' },
  { title: '上传人', key: 'uploadBy', width: 88 },
  { title: '大小', key: 'fileSize', width: 80 },
  { title: '上传时间', key: 'uploadTime', width: 160 },
  {
    title: '来源',
    key: 'source',
    width: 72,
    render: row => (
      <NTag size="small" type={row.source === 'CUSTOMER' ? 'primary' : 'default'}>
        {row.source === 'CUSTOMER' ? '客户' : '系统'}
      </NTag>
    )
  },
  {
    title: '操作',
    key: 'action',
    width: 72,
    render: () => (
      <NButton text type="primary" size="small" onClick={() => window.$message?.info('原型模式：文件下载已模拟')}>
        下载
      </NButton>
    )
  }
];

async function loadList() {
  loading.value = true;
  try {
    const { data } = await fetchGetPortalFileList({
      pageNum: 1,
      pageSize: 50,
      keyword: keyword.value.trim() || undefined,
      fileType: fileType.value || undefined
    });
    rows.value = data?.rows ?? [];
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  const { data } = await fetchGetPortalFileTypeOptions();
  typeOptions.value = [{ label: '全部类型', value: '' }, ...(data || [])];
  await loadList();
});
</script>

<template>
  <div class="portal-files">
    <NCard title="文件中心" size="small" :bordered="false">
      <div class="mb-12px flex flex-wrap items-center justify-between gap-12px">
        <NSpace wrap>
          <NInput
            v-model:value="keyword"
            placeholder="文件名 / 订单号"
            clearable
            size="small"
            class="w-200px"
            @keyup.enter="loadList"
          />
          <NSelect
            v-model:value="fileType"
            :options="typeOptions"
            class="w-140px"
            size="small"
            @update:value="loadList"
          />
          <NButton size="small" :loading="loading" @click="loadList">查询</NButton>
        </NSpace>
        <NButton type="primary" size="small" @click="uploadVisible = true">上传文件</NButton>
      </div>
      <NDataTable :columns="columns" :data="rows" :loading="loading" :scroll-x="1100" size="small" :bordered="false" />
    </NCard>
    <FileUploadModal v-model:visible="uploadVisible" @success="loadList" />
  </div>
</template>
