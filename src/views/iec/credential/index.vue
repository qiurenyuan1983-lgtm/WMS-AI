<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NButton, NCard, NDataTable, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchGetIecCredentialList } from '@/service/api/iec';
import { CREDENTIAL_STATUS_META } from '../constants';

defineOptions({ name: 'IecCredential' });

const loading = ref(false);
const rows = ref<Api.Iec.Credential[]>([]);

const columns: DataTableColumns<Api.Iec.Credential> = [
  { key: 'platformName', title: '平台名称', width: 150 },
  { key: 'accountType', title: '账号类型', width: 110 },
  { key: 'username', title: '用户名', width: 160 },
  { key: 'passwordMasked', title: '密码', width: 140 },
  {
    key: 'status',
    title: '状态',
    width: 88,
    render: row => {
      const m = CREDENTIAL_STATUS_META[row.status];
      return <NTag size="small" type={m.type}>{m.label}</NTag>;
    }
  },
  { key: 'lastUsedTime', title: '最近使用', width: 158, render: row => row.lastUsedTime ?? '—' },
  { key: 'authScope', title: '授权范围', minWidth: 160, ellipsis: { tooltip: true } },
  {
    key: 'action',
    title: '操作',
    width: 120,
    fixed: 'right',
    render: () => <NButton size="tiny" onClick={() => window.$message?.info('[原型] 编辑凭证')}>编辑</NButton>
  }
];

async function load() {
  loading.value = true;
  try {
    const { data } = await fetchGetIecCredentialList({ pageNum: 1, pageSize: 50 });
    rows.value = (data as any)?.rows ?? [];
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <NCard title="账号凭证管理" :bordered="false" class="card-wrapper h-full flex flex-col">
    <p class="text-13px text-gray-500 mb-12px">管理 RPA 使用的供应商网页、邮箱、API 账号。密码仅显示加密占位，不明文存储。</p>
    <NDataTable :columns="columns" :data="rows" :loading="loading" :row-key="(r: Api.Iec.Credential) => r.id" size="small" :scroll-x="1100" flex-height class="flex-1" />
  </NCard>
</template>
