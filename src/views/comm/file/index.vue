<script setup lang="ts">
import { h, onMounted, ref } from 'vue';
import { NButton, NCard, NDataTable } from 'naive-ui';
import { fetchGetCommFileList } from '@/service/api/comm';

defineOptions({ name: 'CommFile' });

const loading = ref(false);
const data = ref<Api.Comm.CommFile[]>([]);

onMounted(async () => {
  loading.value = true;
  const { data: res } = await fetchGetCommFileList({ pageNum: 1, pageSize: 20 });
  data.value = (res as any)?.rows ?? [];
  loading.value = false;
});

const columns = [
  { key: 'fileName', title: '文件名', ellipsis: { tooltip: true } },
  { key: 'fileType', title: '类型', width: 80 },
  { key: 'sizeLabel', title: '大小', width: 80 },
  { key: 'bizNo', title: '关联业务', width: 140 },
  { key: 'uploader', title: '上传人', width: 90 },
  { key: 'uploadTime', title: '上传时间', width: 160 },
  {
    key: 'actions',
    title: '操作',
    width: 140,
    render: () =>
      h('div', { class: 'flex gap-8px' }, [
        h(NButton, { size: 'small', text: true, type: 'primary', onClick: () => window.$message?.info('[原型] 预览') }, () => '预览'),
        h(NButton, { size: 'small', text: true, onClick: () => window.$message?.info('[原型] 下载') }, () => '下载')
      ])
  }
];
</script>

<template>
  <NCard title="文件" size="small" class="card-wrapper sm:flex-1-hidden">
    <p class="text-sm text-gray-500 mb-12px">聊天文件自动归档，支持 BOL、POD、发票等按订单/异常关联。</p>
    <NDataTable :columns="columns" :data="data" :loading="loading" size="small" />
  </NCard>
</template>
