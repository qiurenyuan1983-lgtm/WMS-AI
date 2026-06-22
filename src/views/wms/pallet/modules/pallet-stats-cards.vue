<script setup lang="ts">
import { NGi, NGrid, NStatistic } from 'naive-ui';

defineProps<{
  stats: Api.Wms.PalletInventoryStats;
  loading?: boolean;
}>();
</script>

<template>
  <NGrid :cols="8" :x-gap="12" :y-gap="12" responsive="screen" item-responsive>
    <NGi span="8 m:4 l:2">
      <NStatistic label="总卡板数" :value="stats.totalCount" />
    </NGi>
    <NGi span="8 m:4 l:2">
      <NStatistic label="可用卡板" :value="stats.availableCount" />
    </NGi>
    <NGi span="8 m:4 l:2">
      <NStatistic label="暂扣卡板" :value="stats.holdCount" />
    </NGi>
    <NGi span="8 m:4 l:2">
      <NStatistic label="异常卡板" :value="stats.exceptionCount" />
    </NGi>
    <NGi span="8 m:4 l:2">
      <NStatistic label="待出库卡板" :value="stats.pendingOutboundCount" />
    </NGi>
    <NGi span="8 m:4 l:2">
      <NStatistic label="已锁定卡板" :value="stats.lockedCount" />
    </NGi>
    <NGi span="8 m:4 l:2">
      <NStatistic label="今日入库" :value="stats.todayInbound" />
    </NGi>
    <NGi span="8 m:4 l:2">
      <NStatistic label="今日出库" :value="stats.todayOutbound" />
    </NGi>
  </NGrid>
</template>
