<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '@/hooks/business/auth';
import CheckoutForm from './modules/checkout-form.vue';
import CheckoutResultCard from './modules/checkout-result-card.vue';

defineOptions({ name: 'YmsGateCheckOut' });

const { hasAuth } = useAuth();
const lastResult = ref<Api.Yms.CheckOut | null>(null);
const formRef = ref<InstanceType<typeof CheckoutForm> | null>(null);

function onLookedUp(result: Api.Yms.CheckOut) {
  lastResult.value = result;
}

function onCheckedOut(result: Api.Yms.CheckOut) {
  lastResult.value = result;
}

function onConfirm(confirmed: boolean) {
  formRef.value?.onConfirmFromCard(confirmed);
}
</script>

<template>
  <div class="h-full flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <div class="grid grid-cols-2 gap-16px lt-md:grid-cols-1">
      <CheckoutForm
        v-if="hasAuth('yms:gate:checkout')"
        ref="formRef"
        @looked-up="onLookedUp"
        @checked-out="onCheckedOut"
      />
      <CheckoutResultCard :result="lastResult" @confirm="onConfirm" />
    </div>
  </div>
</template>
