<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

defineOptions({ name: 'WmsStockPrepTaskList' });

const router = useRouter();

onMounted(() => {
  router.replace({ name: 'wms_stock-prep-order' });
});
</script>

<template>
  <div />
</template>
