<script setup lang="ts">
import SupplierTypeList from '../_shared/supplier-type-list.vue';

defineOptions({ name: 'TmsSupplierLtl' });
</script>

<template>
  <SupplierTypeList
    supplier-type="LTL"
    page-title="LTL供应商管理"
    page-description="管理零担承运商、服务范围、下单门户与 LTL 订单人工/自动下单对接。"
    show-order-portal
  />
</template>
