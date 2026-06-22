<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NButton, NCard, NDataTable, NInput, NSpace } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { request } from '@/service/request';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { useTripDeadlineColumns } from '@/views/tms/composables/use-trip-deadline-columns';

defineOptions({ name: 'WmsOutboundOrderList' });

type OutboundOrderRow = {
  id: number;
  outboundOrderNo: string;
  customerName: string;
  outboundType: string;
  palletQty: number;
  boxQty: number;
  status: string;
  destination?: string;
  originWarehouse?: string;
  appointmentTime?: string | null;
  distanceMiles?: number;
  estimatedTravelMinutes?: number;
  latestStartLoadingTime?: string | null;
  latestFinishTime?: string | null;
  remainingMinutes?: number | null;
  deadlineRiskLevel?: string;
};

const keyword = ref('');
const searchParams = ref({ pageNum: 1, pageSize: 10 });
const deadlineCols = useTripDeadlineColumns<OutboundOrderRow>({ showCountdown: false });

const { columns, data, loading, getData, mobilePagination } = useNaivePaginatedTable({
  api: () =>
    request({
      url: '/wms/outbound-order/list',
      method: 'get',
      params: { ...searchParams.value, keyword: keyword.value || undefined }
    }),
  transform: response => defaultTransform(response),
  onPaginationParamsChange: ({ page, pageSize }) => {
    searchParams.value.pageNum = page ?? 1;
    searchParams.value.pageSize = pageSize ?? 10;
  },
  columns: () =>
    [
      { key: 'outboundOrderNo', title: '车次订单号', width: 150, fixed: 'left' },
      { key: 'customerName', title: '客户', width: 120 },
      { key: 'destination', title: '目的地', width: 100, render: row => row.destination ?? '—' },
      ...deadlineCols,
      { key: 'palletQty', title: '板数', width: 72, align: 'center' },
      { key: 'boxQty', title: '箱数', width: 72, align: 'center' },
      { key: 'status', title: '状态', width: 100 },
      { key: 'createTime', title: '创建时间', width: 160 }
    ] as DataTableColumns<OutboundOrderRow>
});

onMounted(getData);
</script>

<template>
  <div class="h-full flex flex-col gap-12px overflow-hidden">
    <NCard :bordered="false" class="card-wrapper flex-shrink-0">
      <div class="mb-8px">
        <span class="text-16px font-semibold">车次装车单列表</span>
        <span class="text-13px text-gray-500 ml-8px">含预约时效与装车截止时间</span>
      </div>
      <NCollapse default-expanded-names="['search']">
        <NCollapseItem title="搜索" name="search">
          <NSpace>
            <NInput v-model:value="keyword" placeholder="车次订单号/客户" clearable class="w-200px" @keyup.enter="getData" />
            <NButton @click="getData">搜索</NButton>
          </NSpace>
        </NCollapseItem>
      </NCollapse>
    </NCard>
    <NCard :bordered="false" class="card-wrapper flex-1 overflow-hidden flex flex-col">
      <NDataTable
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="mobilePagination"
        :row-key="(r: OutboundOrderRow) => r.id"
        size="small"
        :scroll-x="1500"
        flex-height
        class="flex-1"
      />
    </NCard>
  </div>
</template>
