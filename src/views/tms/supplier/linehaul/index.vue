<script setup lang="ts">
import SupplierTypeList from '../_shared/supplier-type-list.vue';

defineOptions({ name: 'TmsSupplierLinehaul' });
</script>

<template>
  <SupplierTypeList
    supplier-type="LINEHAUL"
    page-title="卡派供应商管理"
    page-description="管理出库车次承运、车辆安排、到仓 Check In 与卡派费用结算相关供应商。"
  />
</template>
