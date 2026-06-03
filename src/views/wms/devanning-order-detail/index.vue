<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DevanningOrderDetailDrawer from '../devanning-order/modules/devanning-order-detail-drawer.vue';

defineOptions({ name: 'WmsDevanningOrderDetail' });

const route = useRoute();
const router = useRouter();
const visible = ref(true);
const orderId = computed(() => route.query.id as string | undefined);
const initialTab = computed(() => (route.query.tab as string) || 'basic');

watch(visible, val => {
  if (!val) router.back();
});

watch(
  () => route.query.id,
  id => {
    if (!id) router.replace({ name: 'wms_devanning-order' });
  },
  { immediate: true }
);
</script>

<template>
  <DevanningOrderDetailDrawer
    v-model:visible="visible"
    :order-id="orderId"
    :initial-tab="initialTab"
  />
</template>
