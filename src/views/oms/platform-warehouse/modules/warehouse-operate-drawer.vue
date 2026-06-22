<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  NButton,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NRadioButton,
  NRadioGroup,
  NSelect
} from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { fetchCreatePlatformWarehouse, fetchUpdatePlatformWarehouse } from '@/service/api/oms/platform-warehouse';
import { COUNTRY_OPTIONS, STATUS_OPTIONS } from '../constants';

defineOptions({ name: 'WarehouseOperateDrawer' });

const visible = defineModel<boolean>('visible', { default: false });
const props = defineProps<{
  platform?: Api.Oms.PlatformEntity | null;
  row?: Api.Oms.PlatformWarehouse | null;
}>();
const emit = defineEmits<{ submitted: [] }>();

const loading = ref(false);
const form = ref<Api.Oms.PlatformWarehouseOperateParams>({
  platformId: null,
  warehouseCode: null,
  warehouseName: null,
  countryCode: 'US',
  countryName: '美国',
  address: null,
  zipCode: null,
  cbmPerPallet: 2,
  status: '0'
});

const isEdit = computed(() => Boolean(props.row?.id));
const title = computed(() => (isEdit.value ? '编辑仓库' : '新增仓库'));

watch(visible, val => {
  if (!val) return;
  if (props.row) {
    form.value = {
      platformId: props.row.platformId,
      warehouseCode: props.row.warehouseCode,
      warehouseName: props.row.warehouseName,
      countryCode: props.row.countryCode,
      countryName: props.row.countryName,
      address: props.row.address,
      zipCode: props.row.zipCode,
      cbmPerPallet: props.row.cbmPerPallet,
      status: props.row.status
    };
  } else {
    form.value = {
      platformId: props.platform?.id ?? null,
      warehouseCode: null,
      warehouseName: null,
      countryCode: 'US',
      countryName: '美国',
      address: null,
      zipCode: null,
      cbmPerPallet: 2,
      status: '0'
    };
  }
});

function onCountryChange(code: string) {
  form.value.countryCode = code;
  form.value.countryName = COUNTRY_OPTIONS.find(o => o.value === code)?.name || code;
}

async function handleSubmit() {
  if (!form.value.warehouseCode?.trim()) {
    window.$message?.warning('请输入仓库代码');
    return;
  }
  if (!form.value.warehouseName?.trim()) {
    window.$message?.warning('请输入仓库名称');
    return;
  }
  if (!form.value.address?.trim()) {
    window.$message?.warning('请输入详细地址');
    return;
  }
  loading.value = true;
  const payload = {
    platformId: form.value.platformId ?? props.platform?.id,
    warehouseCode: form.value.warehouseCode.trim().toUpperCase(),
    warehouseName: form.value.warehouseName.trim(),
    countryCode: form.value.countryCode!,
    countryName: form.value.countryName!,
    address: form.value.address.trim(),
    zipCode: form.value.zipCode?.trim() || '',
    cbmPerPallet: form.value.cbmPerPallet ?? 2,
    status: form.value.status ?? '0'
  };
  const { error } = isEdit.value
    ? await fetchUpdatePlatformWarehouse({ ...payload, id: props.row!.id })
    : await fetchCreatePlatformWarehouse(payload);
  loading.value = false;
  if (error) return;
  window.$message?.success(isEdit.value ? '仓库已更新' : '仓库已添加');
  visible.value = false;
  emit('submitted');
}
</script>

<template>
  <NDrawer v-model:show="visible" :width="520">
    <NDrawerContent :title="title" closable>
      <NForm label-placement="top" size="small">
        <NFormItem label="所属平台">
          <NInput
            :value="platform ? `${platform.platformName} (${platform.platformCode})` : '—'"
            readonly
          />
        </NFormItem>
        <NFormItem label="仓库代码" required>
          <NInput v-model:value="form.warehouseCode" placeholder="如 ONT8、TOL3" />
        </NFormItem>
        <NFormItem label="仓库名称" required>
          <NInput v-model:value="form.warehouseName" placeholder="仓库名称" />
        </NFormItem>
        <NFormItem label="国家/地区" required>
          <NSelect
            :to="POPUP_TO_BODY"
            :value="form.countryCode || null"
            :options="COUNTRY_OPTIONS.map(o => ({ label: o.label, value: o.value }))"
            @update:value="onCountryChange"
          />
        </NFormItem>
        <NFormItem label="详细地址" required>
          <NInput v-model:value="form.address" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" />
        </NFormItem>
        <NFormItem label="邮编">
          <NInput v-model:value="form.zipCode" placeholder="邮编" />
        </NFormItem>
        <NFormItem label="单托 CBM">
          <NInputNumber v-model:value="form.cbmPerPallet" :min="0.1" :step="0.1" class="w-full" />
        </NFormItem>
        <NFormItem label="状态">
          <NRadioGroup v-model:value="form.status" size="small">
            <NRadioButton v-for="opt in STATUS_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </NRadioButton>
          </NRadioGroup>
        </NFormItem>
      </NForm>
      <template #footer>
        <div class="flex justify-end gap-8px">
          <NButton @click="visible = false">取消</NButton>
          <NButton type="primary" :loading="loading" @click="handleSubmit">保存</NButton>
        </div>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
