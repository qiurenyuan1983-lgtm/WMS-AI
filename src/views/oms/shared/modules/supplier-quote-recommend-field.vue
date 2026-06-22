<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NAlert, NFormItem, NSelect, NTag } from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { fetchRecommendSupplierByQuote } from '@/service/api/tms/supplier';
import type { SupplierQuoteRecommendContext } from '@/utils/oms/supplier-quote-recommend';

defineOptions({ name: 'SupplierQuoteRecommendField' });

const props = withDefaults(
  defineProps<{
    context: SupplierQuoteRecommendContext;
    enabled?: boolean;
    label?: string;
  }>(),
  {
    enabled: true,
    label: '供应商'
  }
);

const supplierId = defineModel<CommonType.IdType | null>('supplierId', { default: null });
const supplierQuoteId = defineModel<CommonType.IdType | null>('supplierQuoteId', { default: null });
const recommendedSupplierId = defineModel<CommonType.IdType | null>('recommendedSupplierId', { default: null });
const deliveryCost = defineModel<number | null>('deliveryCost', { default: null });

const loading = ref(false);
const manuallyChanged = ref(false);
const recommendResult = ref<Api.Oms.SupplierQuoteRecommendResult | null>(null);

const supplierOptions = computed(() => {
  const candidates = recommendResult.value?.candidates ?? [];
  return candidates.map(item => ({
    label: item.recommended ? `${item.supplierName}（系统推荐）` : item.supplierName,
    value: item.supplierId,
    quoteId: item.quoteId,
    unitPrice: item.unitPrice,
    currency: item.currency,
    matchReason: item.matchReason,
    recommended: item.recommended
  }));
});

const selectedCandidate = computed(() =>
  supplierOptions.value.find(item => String(item.value) === String(supplierId.value))
);

const isRecommendedSelection = computed(
  () =>
    Boolean(recommendResult.value?.recommendedSupplierId) &&
    String(supplierId.value) === String(recommendResult.value?.recommendedSupplierId)
);

async function loadRecommendation(forceApply = false) {
  if (!props.enabled) {
    recommendResult.value = null;
    return;
  }
  loading.value = true;
  const { data } = await fetchRecommendSupplierByQuote({
    destination: props.context.destination,
    warehouseName: props.context.warehouseName,
    transportType: props.context.transportType,
    loadingType: props.context.loadingType
  });
  loading.value = false;
  recommendResult.value = data ?? null;
  recommendedSupplierId.value = data?.recommendedSupplierId ?? null;
  if (!data?.candidates.length) {
    supplierId.value = null;
    supplierQuoteId.value = null;
    return;
  }
  if (forceApply || !manuallyChanged.value || !supplierId.value) {
    applyCandidate(data.recommendedSupplierId, data.recommendedQuoteId, data.unitPrice);
    manuallyChanged.value = false;
  }
}

function applyCandidate(id: CommonType.IdType | null, quoteId: CommonType.IdType | null, price: number | null) {
  supplierId.value = id;
  supplierQuoteId.value = quoteId;
  if (price != null) deliveryCost.value = price;
}

function handleSupplierChange(value: CommonType.IdType | null) {
  manuallyChanged.value = true;
  const option = supplierOptions.value.find(item => String(item.value) === String(value));
  supplierQuoteId.value = option?.quoteId ?? null;
  if (option?.unitPrice != null) deliveryCost.value = option.unitPrice;
}

watch(
  () => [props.enabled, props.context.destination, props.context.warehouseName, props.context.transportType, props.context.loadingType],
  () => {
    if (props.enabled) loadRecommendation(false);
    else {
      recommendResult.value = null;
      supplierId.value = null;
      supplierQuoteId.value = null;
    }
  },
  { immediate: true }
);
</script>

<template>
  <div v-if="enabled" class="supplier-recommend-block">
    <NFormItem :label="label">
      <div class="supplier-recommend-wrap">
        <NSelect
          :to="POPUP_TO_BODY"
          :value="supplierId"
          :options="supplierOptions"
          :loading="loading"
          clearable
          filterable
          placeholder="系统将根据报价推荐供应商，可手动更改"
          class="supplier-select"
          @update:value="handleSupplierChange"
        />
        <NTag v-if="isRecommendedSelection" size="small" type="success" class="recommend-tag">系统推荐</NTag>
      </div>
    </NFormItem>
    <NAlert
      v-if="selectedCandidate"
      type="info"
      :bordered="false"
      class="supplier-quote-hint"
    >
      <template v-if="selectedCandidate.matchReason">
        {{ selectedCandidate.matchReason }} · 参考报价
        {{ selectedCandidate.unitPrice }} {{ selectedCandidate.currency }}
      </template>
      <template v-else>
        参考报价 {{ selectedCandidate.unitPrice }} {{ selectedCandidate.currency }}
      </template>
    </NAlert>
    <NAlert v-else-if="!loading && enabled" type="warning" :bordered="false" class="supplier-quote-hint">
      未匹配到有效卡派报价，请确认目的地或先在供应商报价中维护
    </NAlert>
  </div>
</template>

<style scoped>
.supplier-recommend-block {
  grid-column: 1 / -1;
}

.supplier-recommend-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.supplier-select {
  flex: 1;
  min-width: 0;
}

.recommend-tag {
  flex-shrink: 0;
}

.supplier-quote-hint {
  margin: -4px 0 8px;
}
</style>
