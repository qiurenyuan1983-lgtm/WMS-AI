<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { fetchAddContainerCargoOrders } from '@/service/api/oms/container-order';
import ContainerCargoOrderForm from './container-cargo-order-form.vue';
import ContainerCargoOrderShipmentTable from './container-cargo-order-shipment-table.vue';
import {
  createDefaultContainerCargoOrder,
  toApiCargoOrder,
  validateContainerCargoOrder,
  type ContainerCargoDefaults
} from '../utils/container-cargo-order';
import type { ContainerCargoOrderDraftRow } from '../utils/container-cargo-order-display';
import { ensureDraftKey } from '../utils/container-cargo-order-display';
import { syncCargoOrderTableFields } from '../utils/container-cargo-order';

defineOptions({ name: 'ContainerCargoOrderAddDrawer' });

const props = defineProps<{
  containerOrderId?: CommonType.IdType | null;
  defaults?: ContainerCargoDefaults;
  /** 编辑草稿时传入 */
  editCargo?: ContainerCargoOrderDraftRow | null;
  /** 打开时默认页签 */
  initialTab?: 'basic' | 'shipment';
}>();

const emit = defineEmits<{
  (e: 'submitted'): void;
  (e: 'saved', payload: { cargo: Api.Oms.ContainerCargoOrderForm; draftKey?: string }): void;
}>();

const visible = defineModel<boolean>('visible', { default: false });
const loading = ref(false);
const activeTab = ref<'basic' | 'shipment'>('basic');
const formModel = ref<ContainerCargoOrderDraftRow>(createDefaultContainerCargoOrder());

const isDraftMode = computed(() => !props.containerOrderId);
const isEdit = computed(() => Boolean(props.editCargo));
const drawerTitle = computed(() => {
  if (isEdit.value) return '编辑订单';
  return isDraftMode.value ? '新增订单' : '新增关联订单';
});

function resolveTabByValidationMessage(message: string): 'basic' | 'shipment' {
  if (message.includes('货件')) return 'shipment';
  return 'basic';
}

watch(visible, val => {
  if (val) {
    formModel.value = props.editCargo
      ? (jsonClone(props.editCargo) as ContainerCargoOrderDraftRow)
      : createDefaultContainerCargoOrder(props.defaults);
    if (isDraftMode.value) ensureDraftKey(formModel.value);
    activeTab.value = props.initialTab || 'basic';
  }
});

async function handleSubmit() {
  const message = validateContainerCargoOrder(formModel.value, {
    requireShipments: !isDraftMode.value
  });
  if (message) {
    activeTab.value = resolveTabByValidationMessage(message);
    window.$message?.warning(message);
    return;
  }
  syncCargoOrderTableFields(formModel.value);
  const cargo = toApiCargoOrder(formModel.value) as ContainerCargoOrderDraftRow;
  if (isDraftMode.value) {
    if (props.editCargo?._draftKey) cargo._draftKey = props.editCargo._draftKey;
    else ensureDraftKey(cargo);
    visible.value = false;
    emit('saved', { cargo, draftKey: cargo._draftKey });
    window.$message?.success(isEdit.value ? '订单已更新' : '订单已添加');
    return;
  }
  if (!props.containerOrderId) {
    window.$message?.warning('海柜订单不存在');
    return;
  }
  loading.value = true;
  const { error } = await fetchAddContainerCargoOrders(props.containerOrderId, [cargo]);
  loading.value = false;
  if (error) return;
  window.$message?.success('订单已添加');
  visible.value = false;
  emit('submitted');
}
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="1100" class="max-w-96%">
    <NDrawerContent :title="drawerTitle" :native-scrollbar="false" closable>
      <NSpin :show="loading">
        <NTabs v-model:value="activeTab" type="line" animated>
          <NTabPane name="basic" tab="基础信息">
            <ContainerCargoOrderForm v-model="formModel" :defaults="defaults" :show-shipment-table="false" />
          </NTabPane>
          <NTabPane name="shipment" tab="货件信息">
            <NAlert type="info" class="mb-12px">
              下单计量请在「基础信息」中设置；填写货件后将自动汇总预报箱数/板数、件数、重量与体积。
            </NAlert>
            <ContainerCargoOrderShipmentTable v-model="formModel" />
          </NTabPane>
        </NTabs>
      </NSpin>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="visible = false">取消</NButton>
          <NButton type="primary" :loading="loading" @click="handleSubmit">保存</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
