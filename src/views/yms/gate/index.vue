<script setup lang="tsx">
import { ref } from 'vue';
import { NButton, NTag } from 'naive-ui';
import { useNaivePaginatedTable } from '@/hooks/common/table';
import { useAuth } from '@/hooks/business/auth';
import { fetchGetCheckInList, fetchManualPass } from '@/service/api/yms/gate';
import CheckInForm from './modules/check-in-form.vue';
import CheckInResultCard from './modules/check-in-result-card.vue';

const { hasAuth } = useAuth();
const lastResult = ref<Api.Yms.CheckIn | null>(null);
const searchParams = ref<Api.Yms.CheckInSearchParams>({ pageNum: 1, pageSize: 20 });

const RESULT_TYPE: Record<string, NaiveUI.ThemeColor> = {
  PASSED: 'success',
  BLACKLISTED: 'error',
  REJECTED: 'warning',
  PENDING: 'info'
};

const RESULT_LABEL: Record<string, string> = {
  PASSED: '通过',
  BLACKLISTED: '黑名单',
  REJECTED: '拒绝',
  PENDING: '待审'
};

const MATCH_TYPE_LABEL: Record<string, string> = {
  APT_MATCH: '预约匹配',
  WALK_IN: '即时入场',
  MANUAL: '手动放行'
};

function matchTypeLabel(value: string) {
  return MATCH_TYPE_LABEL[value] ?? value;
}

const { columns, data, getData, loading, mobilePagination } = useNaivePaginatedTable({
  api: () => fetchGetCheckInList(searchParams.value),
  columns: () => [
    { key: 'checkInTime', title: '入场时间', width: 170 },
    { key: 'checkInType', title: '类型', width: 110 },
    { key: 'plateNo', title: '车牌号', width: 120 },
    { key: 'driverName', title: '司机', width: 100 },
    { key: 'taskType', title: '任务类型', width: 110 },
    { key: 'containerNo', title: '柜号', width: 150, ellipsis: { tooltip: true } },
    { key: 'trailerNo', title: '车厢号', width: 140, ellipsis: { tooltip: true } },
    {
      key: 'matchType',
      title: '匹配方式',
      width: 110,
      render: row => {
        // @ts-ignore
        const label = { APT_MATCH: '预约匹配', WALK_IN: '即时入场', MANUAL: '手动放行' }[row.matchType] ?? row.matchType;
        return <NTag size="small">{label}</NTag>;
      }
    },
    {
      key: 'checkResult',
      title: '结果',
      width: 90,
      render: row => {
        const type = (RESULT_TYPE[row.checkResult] ?? 'default') as NaiveUI.ThemeColor;
        return <NTag type={type} size="small">{RESULT_LABEL[row.checkResult] ?? row.checkResult}</NTag>;
      }
    },
    { key: 'rejectReason', title: '原因', ellipsis: { tooltip: true } },
    { key: 'operatorName', title: '操作员', width: 100 },
    {
      key: 'operate',
      title: '操作',
      width: 100,
      fixed: 'right',
      render: row => (
        <div>
          {hasAuth('yms:gate:manualPass') && row.checkResult === 'PENDING' && (
            <NButton size="tiny" quaternary type="primary" onClick={() => handleManualPass(row.id)}>手动放行</NButton>
          )}
        </div>
      )
    }
  ]
});

function onCheckedIn(result: Api.Yms.CheckIn) {
  lastResult.value = result;
  getData();
}

async function handleManualPass(id: CommonType.IdType) {
  const { error } = await fetchManualPass(id);
  if (!error) { window.$message?.success('已手动放行'); getData(); }
}

async function handleManualPassFromResult(id: CommonType.IdType) {
  await handleManualPass(id);
  lastResult.value = null;
}

function handleSearch() { searchParams.value.pageNum = 1; getData(); }
function handleReset() { searchParams.value = { pageNum: 1, pageSize: 20 }; getData(); }
</script>

<template>
  <div class="h-full flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <div class="grid grid-cols-2 gap-16px lt-md:grid-cols-1">
      <CheckInForm v-if="hasAuth('yms:gate:checkIn')" @checked-in="onCheckedIn" />
      <CheckInResultCard :result="lastResult" @pass="handleManualPassFromResult" />
    </div>

    <NCard :bordered="false" class="card-wrapper">
      <template #header>
        <span>今日入场记录</span>
      </template>
      <template #header-extra>
        <NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><NForm inline label-placement="left" :show-feedback="false">
          <NFormItem label="车牌号">
            <NInput v-model:value="searchParams.plateNo" clearable placeholder="请输入车牌号" size="small" />
          </NFormItem>
          <NFormItem label="结果">
            <NSelect v-model:value="searchParams.checkResult" clearable placeholder="全部" class="w-100px" size="small"
              :options="[
                { label: '通过', value: 'PASSED' },
                { label: '黑名单', value: 'BLACKLISTED' },
                { label: '待审', value: 'PENDING' }
              ]"
            />
          </NFormItem>
          <NFormItem>
            <NButton size="small" type="primary" @click="handleSearch">搜索</NButton>
            <NButton size="small" class="ml-8px" @click="handleReset">重置</NButton>
          </NFormItem>
        </NForm></NCollapseItem></NCollapse>
      </template>
      <NDataTable
        :columns="columns" :data="data" :loading="loading"
        :pagination="mobilePagination"
        :row-key="(row: Api.Yms.CheckIn) => row.id"
        size="small" :max-height="350" remote scroll-x="1100"
      />
    </NCard>
  </div>
</template>
