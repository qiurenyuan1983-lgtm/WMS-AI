<script setup lang="ts">
import WmsPrototypeList from '@/components/wms-prototype/WmsPrototypeList.vue';
import { PROTOTYPE_LIST_CONFIGS } from '@/views/wms/_prototype/configs';

defineOptions({ name: 'WmsStockPrepOrderList' });
</script>

<template>
  <WmsPrototypeList :config="PROTOTYPE_LIST_CONFIGS['stock-prep-order']" />
</template>
