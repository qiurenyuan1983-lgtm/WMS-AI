<script setup lang="tsx">
import { ref } from 'vue';
import { NTag } from 'naive-ui';
import { fetchBatchDeleteSku, fetchGetSkuList } from '@/service/api/base/sku';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import ButtonIcon from '@/components/custom/button-icon.vue';
import SkuOperateDrawer from './modules/sku-operate-drawer.vue';

defineOptions({ name: 'SkuList' });

const appStore = useAppStore();
const { hasAuth } = useAuth();
const { download } = useDownload();

const searchParams = ref<Api.Base.MdmSkuSearchParams>({
  pageNum: 1,
  pageSize: 10,
  keyword: null,
  clientId: null,
  brand: null,
  status: null,
  params: {}
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetSkuList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      { type: 'selection', align: 'center', width: 48 },
      { key: 'index', title: '序号', align: 'center', width: 64, render: (_, i) => i + 1 },
      {
        key: 'image',
        title: '图片',
        align: 'center',
        width: 64,
        render: row => row.imageUrl
          ? <img src={row.imageUrl} alt="SKU" style="width:40px;height:40px;object-fit:cover;border-radius:4px;" />
          : <span class="text-gray-400">—</span>
      },
      { key: 'skuCode', title: 'SKU编码', align: 'center', width: 140 },
      { key: 'skuName', title: 'SKU名称', align: 'center', minWidth: 160, ellipsis: { tooltip: true } },
      { key: 'barcode', title: '条形码', align: 'center', width: 130 },
      { key: 'brand', title: '品牌', align: 'center', width: 100 },
      {
        key: 'dimensions',
        title: '尺寸(cm)',
        align: 'center',
        width: 140,
        render: row => {
          const parts = [row.lengthCm, row.widthCm, row.heightCm].filter(v => v != null);
          return <span>{parts.length === 3 ? parts.join('×') : '—'}</span>;
        }
      },
      {
        key: 'weightKg',
        title: '重量(kg)',
        align: 'center',
        width: 90,
        render: row => <span>{row.weightKg ?? '—'}</span>
      },
      {
        key: 'volumeCbm',
        title: '体积(CBM)',
        align: 'center',
        width: 100,
        render: row => <span>{row.volumeCbm ?? '—'}</span>
      },
      {
        key: 'flags',
        title: '物流属性',
        align: 'center',
        width: 160,
        render: row => {
          const tags = [];
          if (row.isFragile)   tags.push(<NTag size="small" type="error" class="mr-2px">易碎</NTag>);
          if (row.isLiquid)    tags.push(<NTag size="small" type="warning" class="mr-2px">液体</NTag>);
          if (row.isBattery)   tags.push(<NTag size="small" type="warning" class="mr-2px">含电</NTag>);
          if (row.isDangerous) tags.push(<NTag size="small" type="error" class="mr-2px">危品</NTag>);
          if (row.isOversize)  tags.push(<NTag size="small" type="info" class="mr-2px">超大</NTag>);
          return tags.length ? <div class="flex flex-wrap gap-2px">{tags}</div> : <span class="text-gray-400">—</span>;
        }
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
      {
        key: 'operate',
        title: '操作',
        align: 'center',
        width: 120,
        render: row => {
          const editBtn = () => {
            if (!hasAuth('base:sku:edit')) return null;
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
            if (!hasAuth('base:sku:remove')) return null;
            return (
              <ButtonIcon
                text
                type="error"
                icon="material-symbols:delete-outline"
                tooltipContent="删除"
                popconfirmContent="确认删除该SKU？"
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
  const { error } = await fetchBatchDeleteSku(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchBatchDeleteSku([id]);
  if (error) return;
  onDeleted();
}

function handleExport() {
  download('/base/sku/export', searchParams.value, `SKU数据_${new Date().getTime()}.xlsx`);
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
    clientId: null,
    brand: null,
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
        <NFormItem label="编码/名称/条码">
          <NInput v-model:value="searchParams.keyword" clearable placeholder="SKU编码、名称或条形码" class="w-200px" />
        </NFormItem>
        <NFormItem label="品牌">
          <NInput v-model:value="searchParams.brand" clearable placeholder="品牌名称" class="w-120px" />
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

    <NCard title="SKU管理" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          :show-add="hasAuth('base:sku:add')"
          :show-delete="hasAuth('base:sku:remove')"
          :show-export="hasAuth('base:sku:export')"
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
        :row-key="(row: Api.Base.MdmSku) => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <SkuOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getDataByPage"
      />
    </NCard>
  </div>
</template>

<style scoped></style>
