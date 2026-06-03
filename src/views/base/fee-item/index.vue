<script setup lang="tsx">
import { ref } from 'vue';
import { NTag } from 'naive-ui';
import { fetchBatchDeleteFeeItem, fetchGetFeeItemList } from '@/service/api/base/fee-item';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import ButtonIcon from '@/components/custom/button-icon.vue';
import FeeItemOperateDrawer from './modules/fee-item-operate-drawer.vue';

defineOptions({ name: 'FeeItemList' });

const appStore = useAppStore();
const { hasAuth } = useAuth();
const { download } = useDownload();

const FEE_CATEGORY_MAP: Record<string, { label: string; type: 'info' | 'success' | 'warning' | 'error' | 'default' }> = {
  INBOUND:   { label: '入库',   type: 'info' },
  OUTBOUND:  { label: '出库',   type: 'success' },
  STORAGE:   { label: '仓储',   type: 'warning' },
  RETURN:    { label: '退货',   type: 'error' },
  TRANSPORT: { label: '运输',   type: 'default' },
  OTHER:     { label: '其他',   type: 'default' }
};

const FEE_CATEGORY_OPTIONS = Object.entries(FEE_CATEGORY_MAP).map(([v, o]) => ({ label: o.label, value: v }));
const BUSINESS_STAGE_OPTIONS = FEE_CATEGORY_OPTIONS;

const searchParams = ref<Api.Base.FeeItemSearchParams>({
  pageNum: 1,
  pageSize: 10,
  keyword: null,
  feeCategory: null,
  businessStage: null,
  businessType: null,
  status: null,
  params: {}
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetFeeItemList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      { type: 'selection', align: 'center', width: 48 },
      { key: 'index', title: '序号', align: 'center', width: 64, render: (_, i) => i + 1 },
      { key: 'feeCode', title: '费项编码', align: 'center', width: 140 },
      { key: 'feeName', title: '费项名称', align: 'center', minWidth: 140 },
      {
        key: 'feeCategory',
        title: '费项类别',
        align: 'center',
        width: 100,
        render: row => {
          const info = FEE_CATEGORY_MAP[row.feeCategory ?? ''];
          return info
            ? <NTag type={info.type} size="small">{info.label}</NTag>
            : <span>{row.feeCategory}</span>;
        }
      },
      {
        key: 'businessStage',
        title: '业务阶段',
        align: 'center',
        width: 100,
        render: row => {
          const info = FEE_CATEGORY_MAP[row.businessStage ?? ''];
          return info
            ? <NTag type={info.type} size="small">{info.label}</NTag>
            : <span>{row.businessStage}</span>;
        }
      },
      { key: 'businessType', title: '业务类型', align: 'center', width: 110, render: row => <span>{row.businessType ?? '通用'}</span> },
      {
        key: 'isSystem',
        title: '系统预设',
        align: 'center',
        width: 90,
        render: row => (
          <NTag type={row.isSystem === 1 ? 'warning' : 'default'} size="small">
            {row.isSystem === 1 ? '是' : '否'}
          </NTag>
        )
      },
      {
        key: 'isBillable',
        title: '出账单',
        align: 'center',
        width: 90,
        render: row => (
          <NTag type={row.isBillable === 1 ? 'success' : 'default'} size="small">
            {row.isBillable === 1 ? '是' : '否'}
          </NTag>
        )
      },
      {
        key: 'status',
        title: '状态',
        align: 'center',
        width: 80,
        render: row => (
          <NTag type={row.status === '0' ? 'success' : 'error'} size="small">
            {row.status === '0' ? '正常' : '禁用'}
          </NTag>
        )
      },
      { key: 'sortOrder', title: '排序', align: 'center', width: 70 },
      {
        key: 'operate',
        title: '操作',
        align: 'center',
        width: 120,
        render: row => {
          const editBtn = () => {
            if (!hasAuth('base:feeItem:edit')) return null;
            return (
              <ButtonIcon
                text
                type="primary"
                icon="material-symbols:drive-file-rename-outline-outline"
                tooltipContent="编辑"
                onClick={() => handleEdit(row.id)}
              />
            );
          };
          const deleteBtn = () => {
            if (!hasAuth('base:feeItem:remove') || row.isSystem === 1) return null;
            return (
              <ButtonIcon
                text
                type="error"
                icon="material-symbols:delete-outline"
                tooltipContent="删除"
                popconfirmContent="确认删除该费项？"
                onPositiveClick={() => handleDelete(row.id)}
              />
            );
          };
          return (
            <div class="flex-center gap-8px">
              {editBtn()}{deleteBtn()}
            </div>
          );
        }
      }
    ]
  });

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onBatchDeleted, onDeleted } =
  useTableOperate(data, 'id', getData);

async function handleBatchDelete() {
  const { error } = await fetchBatchDeleteFeeItem(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchBatchDeleteFeeItem([id]);
  if (error) return;
  onDeleted();
}

function handleExport() {
  download('/base/fee-item/export', searchParams.value, `费项数据_${new Date().getTime()}.xlsx`);
}

function handleSearch() {
  searchParams.value.pageNum = 1;
  getDataByPage();
}

function handleReset() {
  searchParams.value = {
    pageNum: 1,
    pageSize: 10,
    keyword: null,
    feeCategory: null,
    businessStage: null,
    businessType: null,
    status: null,
    params: {}
  };
  getDataByPage();
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper">
      <NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="编码/名称">
          <NInput v-model:value="searchParams.keyword" clearable placeholder="费项编码或名称" class="w-160px" />
        </NFormItem>
        <NFormItem label="费项类别">
          <NSelect
            v-model:value="searchParams.feeCategory"
            :options="FEE_CATEGORY_OPTIONS"
            clearable
            placeholder="全部"
            class="w-110px"
          />
        </NFormItem>
        <NFormItem label="业务阶段">
          <NSelect
            v-model:value="searchParams.businessStage"
            :options="BUSINESS_STAGE_OPTIONS"
            clearable
            placeholder="全部"
            class="w-110px"
          />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect
            v-model:value="searchParams.status"
            :options="[{ label: '正常', value: '0' }, { label: '禁用', value: '1' }]"
            clearable
            placeholder="全部"
            class="w-100px"
          />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="handleSearch">查询</NButton>
          <NButton class="ml-8px" @click="handleReset">重置</NButton>
        </NFormItem>
      </NForm>
    </NCard>

    <NCard title="费项管理" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          :show-add="hasAuth('base:feeItem:add')"
          :show-delete="hasAuth('base:feeItem:remove')"
          :show-export="hasAuth('base:feeItem:export')"
          @add="handleAdd"
          @delete="handleBatchDelete"
          @export="handleExport"
          @refresh="getData"
        />
      </template>
      <DataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        :flex-height="!appStore.isMobile"
        :scroll-x="scrollX"
        :loading="loading"
        remote
        :row-key="(row: Api.Base.FeeItem) => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <FeeItemOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getDataByPage"
      />
    </NCard>
  </div>
</template>

<style scoped></style>
