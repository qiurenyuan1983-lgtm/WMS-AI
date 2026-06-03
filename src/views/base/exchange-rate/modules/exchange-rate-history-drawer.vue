<script setup lang="ts">
import { h } from 'vue';
import { NTag } from 'naive-ui';

defineOptions({ name: 'ExchangeRateHistoryDrawer' });

interface Props {
  title: string;
  data: Api.Base.ExchangeRate[];
}

defineProps<Props>();

const visible = defineModel<boolean>('visible', { default: false });

const columns = [
  {
    key: 'rate',
    title: '汇率',
    align: 'center' as const,
    width: 130,
    render: (row: Api.Base.ExchangeRate) => Number(row.rate).toFixed(6)
  },
  {
    key: 'effectiveDate',
    title: '生效日期',
    align: 'center' as const,
    width: 120
  },
  {
    key: 'expiredDate',
    title: '失效日期',
    align: 'center' as const,
    width: 130,
    render: (row: Api.Base.ExchangeRate) =>
      row.expiredDate
        ? row.expiredDate
        : h(NTag, { type: 'success', size: 'small' }, { default: () => '当前有效' })
  },
  {
    key: 'remark',
    title: '备注',
    align: 'center' as const,
    minWidth: 120
  }
];
</script>

<template>
  <NDrawer v-model:show="visible" :title="title" display-directive="show" :width="620" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NDataTable
        :columns="columns"
        :data="data"
        :bordered="false"
        size="small"
        :row-key="(row: Api.Base.ExchangeRate) => row.id"
      />
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>
