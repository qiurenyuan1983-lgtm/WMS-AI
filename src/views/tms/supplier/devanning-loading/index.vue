<script setup lang="ts">
import SupplierTypeList from '../_shared/supplier-type-list.vue';

defineOptions({ name: 'TmsSupplierDevanningLoading' });
</script>

<template>
  <SupplierTypeList
    supplier-type="DEVANNING_LOADING"
    page-title="拆柜/装车供应商管理"
    page-description="管理海柜拆柜、地板/卡板装车、劳务安排、设备使用与操作费用结算相关供应商。"
  />
</template>
