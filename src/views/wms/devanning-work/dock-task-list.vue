<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NCard, NDataTable, NDropdown, NForm, NFormItem, NInput, NSelect, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchGetDevanningWorkTasks } from '@/service/api/wms/devanning-work';
import { fetchGetYardDockList } from '@/service/api/yard/dock';
defineOptions({ name: 'WmsDevanningWorkDockList' });

const route = useRoute();
const router = useRouter();

const dockId = ref(String(route.query.dockId || '3010001'));
const containerNo = ref('');
const loading = ref(false);
const tasks = ref<Api.Wms.DevanningWorkTask[]>([]);
const selectedId = ref<number | null>(null);
const dockOptions = ref<Array<{ label: string; value: string }>>([]);

const dockLabel = computed(() => {
  const opt = dockOptions.value.find(o => o.value === dockId.value);
  return opt?.label || dockId.value;
});

const STATUS_TAG: Record<string, 'default' | 'warning' | 'success' | 'info'> = {
  NOT_STARTED: 'warning',
  IN_PROGRESS: 'info',
  COMPLETED: 'success'
};

async function loadDocks() {
  const { data } = await fetchGetYardDockList({ pageNum: 1, pageSize: 50 } as any);
  const rows = (data as any)?.rows || [];
  dockOptions.value = rows
    .filter((d: any) => d.dockType === 'DEVANNING' || d.dockCode?.includes('DOC'))
    .map((d: any) => ({ label: d.dockName + ' (' + d.dockCode + ')', value: String(d.id) }));
  if (!dockOptions.value.length) {
    dockOptions.value = [
      { label: 'LA 拆柜口 1 (DOC-LA-001)', value: '3010001' },
      { label: 'LA 拆柜口 2 (DOC-LA-002)', value: '3010002' }
    ];
  }
}

async function loadTasks() {
  loading.value = true;
  const { data } = await fetchGetDevanningWorkTasks({
    dockId: dockId.value,
    containerNo: containerNo.value || undefined
  });
  loading.value = false;
  tasks.value = (data as any)?.rows || [];
}

function onDockChange(val: string) {
  dockId.value = val;
  router.replace({ query: { ...route.query, dockId: val } });
  loadTasks();
}

function handleSearch() {
  loadTasks();
}

function handleReset() {
  containerNo.value = '';
  loadTasks();
}

function enterWork(row: Api.Wms.DevanningWorkTask) {
  selectedId.value = row.id;
  router.push({
    name: 'wms_devanning-work-exec',
    query: { dockId: String(row.dockId), taskId: String(row.id), containerNo: row.containerNo }
  });
}

function enterSelected() {
  const row = tasks.value.find(t => t.id === selectedId.value) || tasks.value[0];
  if (!row) {
    window.$message?.warning('请先选择一条拆柜任务');
    return;
  }
  enterWork(row);
}

function buildColumns(): DataTableColumns<Api.Wms.DevanningWorkTask> {
  return [
    { key: 'containerNo', title: '柜号', width: 140 },
    { key: 'orderType', title: '类型', width: 90 },
    { key: 'totalBoxQty', title: '总箱数', width: 90, align: 'center' },
    { key: 'markedBoxQty', title: '已打标箱数', width: 110, align: 'center' },
    {
      key: 'workStatus',
      title: '拆柜状态',
      width: 100,
      render: row => (
        <NTag size="small" type={STATUS_TAG[row.workStatus] || 'default'}>
          {row.workStatusLabel}
        </NTag>
      )
    },
    {
      key: 'devanningStartTime',
      title: '开始拆柜时间',
      width: 160,
      render: row => row.devanningStartTime || '—'
    },
    {
      key: 'devanningFinishTime',
      title: '拆柜完成时间',
      width: 160,
      render: row => row.devanningFinishTime || '—'
    },
    { key: 'dockCode', title: 'Dock', width: 110 },
    {
      key: 'operate',
      title: '操作',
      width: 100,
      fixed: 'right',
      render: row => (
        <NDropdown
          trigger="click"
          options={[
            { label: '进入拆柜', key: 'enter' },
            { label: '卡看详情', key: 'detail' }
          ]}
          onSelect={(key: string) => {
            if (key === 'enter') enterWork(row);
            if (key === 'detail') {
              router.push({ name: 'wms_devanning-order', query: { highlight: row.devanningNo } });
            }
          }}
        >
          <NButton size="small" secondary>
            更多
          </NButton>
        </NDropdown>
      )
    }
  ];
}

const columns = buildColumns();

onMounted(async () => {
  await loadDocks();
  await loadTasks();
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-12px p-16px">
    <NCard :bordered="false" size="small">
      <div class="mb-12px flex flex-wrap items-center justify-between gap-12px">
        <div>
          <h2 class="text-18px font-600 m-0">人工拆柜作业</h2>
          <p class="mt-4px text-13px text-#6b7280">Dock：{{ dockLabel }}</p>
        </div>
        <NFormItem label="切换 Dock" label-placement="left" :show-feedback="false" class="mb-0">
          <NSelect
            v-model:value="dockId"
            :options="dockOptions"
            class="w-280px"
            @update:value="onDockChange"
          />
        </NFormItem>
      </div>
      <NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="柜号">
          <NInput v-model:value="containerNo" clearable placeholder="柜号" class="w-200px" @keydown.enter="handleSearch" />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="handleSearch">搜索</NButton>
          <NButton class="ml-8px" @click="handleReset">重置</NButton>
        </NFormItem>
      </NForm>
    </NCard>

    <NCard :bordered="false" size="small" class="sm:flex-1-hidden">
      <template #header-extra>
        <div class="flex flex-wrap gap-8px">
          <NButton secondary type="info">蓝牙连接</NButton>
          <NButton secondary type="success">卡板记录</NButton>
          <NButton type="success" ghost>开始拆柜</NButton>
          <NButton type="primary" @click="enterSelected">进入拆柜</NButton>
        </div>
      </template>
      <NDataTable
        :columns="columns"
        :data="tasks"
        :loading="loading"
        :row-key="row => row.id"
        size="small"
        :scroll-x="1100"
        :row-props="row => ({ onClick: () => { selectedId = row.id; } })"
        @row-dblclick="enterWork"
      />
      <p class="mt-8px text-12px text-#9ca3af">共 {{ tasks.length }} 条任务：双击进入拆柜作业</p>
    </NCard>
  </div>
</template>
