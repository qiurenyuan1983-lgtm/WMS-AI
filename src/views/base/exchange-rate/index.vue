<script setup lang="tsx">
import { ref } from 'vue';
import { NButton, NTag } from 'naive-ui';
import {
  fetchGetExchangeRateList,
  fetchVoidExchangeRate,
  fetchGetExchangeRateHistory
} from '@/service/api/base/exchange-rate';
import { useAuth } from '@/hooks/business/auth';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import ButtonIcon from '@/components/custom/button-icon.vue';
import ExchangeRateOperateDrawer from './modules/exchange-rate-operate-drawer.vue';
import ExchangeRateHistoryDrawer from './modules/exchange-rate-history-drawer.vue';

defineOptions({ name: 'ExchangeRateList' });

const appStore = useAppStore();
const { hasAuth } = useAuth();

const searchParams = ref<Api.Base.ExchangeRateSearchParams>({
  pageNum: 1,
  pageSize: 10,
  fromCurrency: null,
  toCurrency: null,
  orderByColumn: null,
  isAsc: null,
  params: { isCurrent: 1 }
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination, scrollX } =
  useNaivePaginatedTable({
    api: () => fetchGetExchangeRateList(searchParams.value),
    transform: response => defaultTransform(response),
    onPaginationParamsChange: params => {
      searchParams.value.pageNum = params.page;
      searchParams.value.pageSize = params.pageSize;
    },
    columns: () => [
      {
        key: 'index',
        title: '序号',
        align: 'center',
        width: 64,
        render: (_, index) => index + 1
      },
      {
        key: 'pair',
        title: '货币对',
        align: 'center',
        width: 140,
        render: row => `${row.fromCurrency} → ${row.toCurrency}`
      },
      {
        key: 'rate',
        title: '汇率',
        align: 'center',
        width: 130,
        render: row => Number(row.rate).toFixed(6)
      },
      {
        key: 'effectiveDate',
        title: '生效日期',
        align: 'center',
        width: 120
      },
      {
        key: 'expiredDate',
        title: '失效日期',
        align: 'center',
        width: 130,
        render: row =>
          row.expiredDate
            ? row.expiredDate
            : <NTag type="success" size="small">当前有效</NTag>
      },
      {
        key: 'isCurrent',
        title: '状态',
        align: 'center',
        width: 90,
        render: row => (
          <NTag type={row.isCurrent === 1 ? 'success' : 'default'} size="small">
            {row.isCurrent === 1 ? '有效' : '历史'}
          </NTag>
        )
      },
      {
        key: 'remark',
        title: '备注',
        align: 'center',
        minWidth: 140
      },
      {
        key: 'operate',
        title: '操作',
        align: 'center',
        width: 160,
        render: row => {
          const historyBtn = () => (
            <ButtonIcon
              text
              type="info"
              icon="material-symbols:history"
              tooltipContent="历史汇率"
              onClick={() => openHistory(row.fromCurrency, row.toCurrency)}
            />
          );
          const editBtn = () => {
            if (!hasAuth('base:exchangeRate:edit') || row.isCurrent !== 1) return null;
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
          const voidBtn = () => {
            if (!hasAuth('base:exchangeRate:edit') || row.isCurrent !== 1) return null;
            return (
              <ButtonIcon
                text
                type="error"
                icon="material-symbols:block"
                tooltipContent="作废"
                popconfirmContent="确认作废该汇率？"
                onPositiveClick={() => handleVoid(row.id)}
              />
            );
          };
          return <div class="flex-center gap-8px">{historyBtn()}{editBtn()}{voidBtn()}</div>;
        }
      }
    ]
  });

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, onDeleted } =
  useTableOperate(data, 'id', getData);

async function handleVoid(id: CommonType.IdType) {
  const { error } = await fetchVoidExchangeRate(id);
  if (error) return;
  window.$message?.success('作废成功');
  onDeleted();
}

// 历史汇率抽屉
const historyVisible = ref(false);
const historyData = ref<Api.Base.ExchangeRate[]>([]);
const historyTitle = ref('');

async function openHistory(fromCurrency: string, toCurrency: string) {
  historyTitle.value = `${fromCurrency} → ${toCurrency} 历史汇率`;
  const { data: res, error } = await fetchGetExchangeRateHistory(fromCurrency, toCurrency);
  if (error) return;
  historyData.value = res ?? [];
  historyVisible.value = true;
}

// 搜索参数中的 isCurrent 过滤
const isCurrentFilter = ref<number | null>(1);

function handleSearch() {
  searchParams.value.params = isCurrentFilter.value !== null ? { isCurrent: isCurrentFilter.value } : {};
  searchParams.value.pageNum = 1;
  getDataByPage();
}

function handleReset() {
  searchParams.value = {
    pageNum: 1,
    pageSize: 10,
    fromCurrency: null,
    toCurrency: null,
    orderByColumn: null,
    isAsc: null,
    params: { isCurrent: 1 }
  };
  isCurrentFilter.value = 1;
  getDataByPage();
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper">
      <NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="源货币">
          <NInput v-model:value="searchParams.fromCurrency" clearable placeholder="如 USD" class="w-90px" />
        </NFormItem>
        <NFormItem label="目标货币">
          <NInput v-model:value="searchParams.toCurrency" clearable placeholder="如 CNY" class="w-90px" />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect
            v-model:value="isCurrentFilter"
            :options="[{ label: '当前有效', value: 1 }, { label: '历史', value: 0 }]"
            clearable
            placeholder="全部"
            class="w-120px"
          />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="handleSearch">搜索</NButton>
          <NButton class="ml-8px" @click="handleReset">重置</NButton>
        </NFormItem>
      </NForm>
    </NCollapseItem></NCollapse></NCard>

    <NCard title="汇率配置" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :loading="loading"
          :show-add="hasAuth('base:exchangeRate:add')"
          :show-delete="false"
          :show-export="false"
          @add="handleAdd"
          @refresh="getData"
        />
      </template>
      <DataTable
        :columns="columns"
        :data="data"
        :flex-height="!appStore.isMobile"
        :scroll-x="scrollX"
        :loading="loading"
        remote
        :row-key="(row: Api.Base.ExchangeRate) => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <ExchangeRateOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getDataByPage"
      />
      <ExchangeRateHistoryDrawer
        v-model:visible="historyVisible"
        :title="historyTitle"
        :data="historyData"
      />
    </NCard>
  </div>
</template>

<style scoped></style>
