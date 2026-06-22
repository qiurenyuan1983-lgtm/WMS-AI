<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DevanningOrderDetailDrawer from '@/views/wms/devanning-order/modules/devanning-order-detail-drawer.vue';
import { resolveDevanningOrderIdFromContainer } from '@/views/oms/container-order/composables/resolve-devanning-order-id';

defineOptions({ name: 'OmsInboundPlan' });

const route = useRoute();
const router = useRouter();
const visible = ref(true);
const devanningOrderId = ref<CommonType.IdType | null>(null);

const containerOrderId = computed(() => route.query.containerOrderId as string | undefined);
const warehouseId = computed(() => route.query.warehouseId as string | undefined);
const directDevanningId = computed(() => route.query.devanningOrderId as string | undefined);

watch(visible, val => {
  if (!val) router.back();
});

async function resolveAndOpen() {
  if (directDevanningId.value) {
    devanningOrderId.value = directDevanningId.value;
    return;
  }
  if (!containerOrderId.value) {
    router.replace({ name: 'oms_container-order' });
    return;
  }
  const id = await resolveDevanningOrderIdFromContainer({
    id: containerOrderId.value,
    warehouseId: warehouseId.value ?? null
  });
  if (!id) {
    window.$message?.warning('未找到关联拆柜订单');
    router.replace({ name: 'oms_container-order' });
    return;
  }
  devanningOrderId.value = id;
}

watch(
  () => [route.query.containerOrderId, route.query.devanningOrderId] as const,
  () => {
    resolveAndOpen();
  },
  { immediate: true }
);
</script>

<template>
  <DevanningOrderDetailDrawer
    v-if="devanningOrderId"
    v-model:visible="visible"
    :order-id="devanningOrderId"
  />
</template>
