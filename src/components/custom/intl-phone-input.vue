<script setup lang="ts">
import { computed } from 'vue';
import { NInput, NInputGroup, NSelect } from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { DEFAULT_PHONE_COUNTRY_CODE, PHONE_COUNTRY_OPTIONS, getPhoneCountryOption } from '@/constants/phone-country';
import { normalizePhoneDigits } from '@/utils/phone/intl-phone';

defineOptions({ name: 'IntlPhoneInput' });

withDefaults(
  defineProps<{
    disabled?: boolean;
    size?: 'small' | 'medium' | 'large';
  }>(),
  {
    disabled: false,
    size: 'medium'
  }
);

const phoneCountryCode = defineModel<string>('phoneCountryCode', { default: DEFAULT_PHONE_COUNTRY_CODE });
const phonenumber = defineModel<string>('phonenumber', { default: '' });

const countryOptions = computed(() =>
  PHONE_COUNTRY_OPTIONS.map(item => ({
    label: item.label,
    value: item.value
  }))
);

const activeOption = computed(() => getPhoneCountryOption(phoneCountryCode.value));

function handlePhoneInput(value: string) {
  phonenumber.value = normalizePhoneDigits(value).slice(0, activeOption.value.maxLength);
}
</script>

<template>
  <NInputGroup>
    <NSelect
      :to="POPUP_TO_BODY"
      v-model:value="phoneCountryCode"
      :options="countryOptions"
      :disabled="disabled"
      :size="size"
      filterable
      class="intl-phone-country"
      :consistent-menu-width="false"
    />
    <NInput
      :value="phonenumber"
      :disabled="disabled"
      :size="size"
      :placeholder="activeOption.placeholder"
      :maxlength="activeOption.maxLength"
      @update:value="handlePhoneInput"
    />
  </NInputGroup>
</template>

<style scoped>
.intl-phone-country {
  width: 132px;
  flex-shrink: 0;
}
</style>
