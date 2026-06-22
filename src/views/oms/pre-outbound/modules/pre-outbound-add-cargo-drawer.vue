<script setup lang="tsx">
import { computed, ref, watch } from 'vue';
import { NButton, NDataTable, NDrawer, NInput, NSpace, NTag } from 'naive-ui';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { fetchGetOutboundPoolList } from '@/service/api/oms/outbound-pool';
import { fetchAddPreOutboundItems } from '@/service/api/oms/pre-outbound';
import { OUTBOUND_READINESS_META, resolveOutboundReadiness } from '../utils/outbound-readiness';

defineOptions({ name: 'PreOutboundAddCargoDrawer' });

const props = defineProps<{
  preOutboundId: CommonType.IdType | null;
  excludedCargoOrderIds?: CommonType.IdType[];
}>();

const visible = defineModel<boolean>('visible', { default: false });
const emit = defineEmits<{ (e: 'added'): void }>();

const keyword = ref('');
const checkedRowKeys = ref<CommonType.IdType[]>([]);
const submitting = ref(false);

const searchParams = ref<Api.Oms.OutboundPoolSearchParams>({ pageNum: 1, pageSize: 20, keyword: '' });

const excludedSet = computed(() => new Set((props.excludedCargoOrderIds || []).map(String)));

const { columns, data, getData, getDataByPage, loading, mobilePagination } = useNaivePaginatedTable<
  Api.Oms.NewCargoOrderList,
  Api.Oms.NewCargoOrder
>({
  api: () => fetchGetOutboundPoolList(searchParams.value),
  columns: () => [
    { type: 'selection' },
    { key: 'cargoOrderNo', title: '订单号', minWidth: 150 },
    { key: 'containerNo', title: '柜号', width: 120 },
    { key: 'customerName', title: '客户', minWidth: 120 },
    { key: 'shipmentCodes', title: '货件编码', minWidth: 140, ellipsis: { tooltip: true } },
    { key: 'poNos', title: '追踪编码', minWidth: 120, ellipsis: { tooltip: true } },
    {
      key: 'readiness',
      title: '状态',
      width: 100,
      render: row => {
        const readiness = resolveOutboundReadiness(row);
        const meta = OUTBOUND_READINESS_META[readiness];
        return <NTag type={meta.type}>{meta.label}</NTag>;
      }
    },
    { key: 'declaredCartonQty', title: '预计箱数', width: 90 },
    { key: 'actualCartonQty', title: '入库箱数', width: 90 }
  ],
  transform: response => defaultTransform(response),
  onPaginationParamsChange: ({ page, pageSize }) => {
    searchParams.value.pageNum = page;
    searchParams.value.pageSize = pageSize;
  }
});

const selectableData = computed(() => data.value.filter(row => !excludedSet.value.has(String(row.id))));

watch(visible, val => {
  if (val) {
    keyword.value = '';
    checkedRowKeys.value = [];
    searchParams.value = { pageNum: 1, pageSize: 20, keyword: '' };
    getData();
  }
});

function handleSearch() {
  searchParams.value.keyword = keyword.value.trim() || null;
  searchParams.value.pageNum = 1;
  getDataByPage(1);
}

async function handleConfirm() {
  if (!props.preOutboundId || !checkedRowKeys.value.length) {
    window.$message?.warning('请选择要新增的货物');
    return;
  }
  submitting.value = true;
  try {
    const { error } = await fetchAddPreOutboundItems(props.preOutboundId, checkedRowKeys.value);
    if (error) return;
    window.$message?.success('已新增到预出单');
    visible.value = false;
    emit('added');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <NDrawer v-model:show="visible" :width="920" placement="right">
    <template #header>新增货物信息</template>
    <div class="drawer-body">
      <NSpace vertical :size="12">
        <NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><NSpace>
          <NInput v-model:value="keyword" placeholder="订单号/柜号/货件/追踪编码" clearable style="width: 280px" @keyup.enter="handleSearch" />
          <NButton type="primary" @click="handleSearch">搜索</NButton>
        </NSpace></NCollapseItem></NCollapse>
        <NDataTable
          v-model:checked-row-keys="checkedRowKeys"
          remote
          :row-key="(row: Api.Oms.NewCargoOrder) => row.id"
          :columns="columns"
          :data="selectableData"
          :loading="loading"
          :pagination="mobilePagination"
          :scroll-x="900"
        />
      </NSpace>
    </div>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">取消</NButton>
        <NButton type="primary" :loading="submitting" :disabled="!checkedRowKeys.length" @click="handleConfirm">
          确认新增 ({{ checkedRowKeys.length }})
        </NButton>
      </NSpace>
    </template>
  </NDrawer>
</template>

<style scoped>
.drawer-body {
  padding: 4px 0 12px;
}
</style>
