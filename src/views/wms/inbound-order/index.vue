<script setup lang="ts">
import WmsPrototypeList from '@/components/wms-prototype/WmsPrototypeList.vue';
import { PROTOTYPE_LIST_CONFIGS } from '@/views/wms/_prototype/configs';

defineOptions({ name: 'WmsInboundOrderList' });
</script>

<template>
  <WmsPrototypeList :config="PROTOTYPE_LIST_CONFIGS['inbound-order']" />
</template>
