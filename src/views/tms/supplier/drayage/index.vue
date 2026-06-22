<script setup lang="ts">
import SupplierTypeList from '../_shared/supplier-type-list.vue';

defineOptions({ name: 'TmsSupplierDrayage' });
</script>

<template>
  <SupplierTypeList
    supplier-type="DRAYAGE"
    page-title="提柜供应商管理"
    page-description="管理海柜提柜、还柜、码头预约、GPS 跟踪与提柜费用结算相关供应商。"
  />
</template>
