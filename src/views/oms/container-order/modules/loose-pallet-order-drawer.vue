<script setup lang="ts">
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { ref, watch } from 'vue';
import { fetchCreateLoosePalletOrder } from '@/service/api/oms/container-order';
import {
  createDefaultLoosePalletForm,
  LOOSE_PALLET_DELIVERY_MODE_OPTIONS,
  PEER_CUSTOMER_PRESETS,
  toPalletLabelPrintRows,
  validateLoosePalletOrderForm,
  type LoosePalletOrderForm
} from '../utils/loose-pallet-order';
import { printPalletLabels } from '@/views/wms/devanning-work/utils/print-pallet-label';

defineOptions({ name: 'LoosePalletOrderDrawer' });

const props = defineProps<{
  containerOrderId?: CommonType.IdType | null;
  containerNo?: string | null;
}>();

const emit = defineEmits<{
  (e: 'submitted', payload: Record<string, any>): void;
}>();

const visible = defineModel<boolean>('visible', { default: false });
const loading = ref(false);
const successVisible = ref(false);
const createdOrder = ref<Record<string, any> | null>(null);
const formModel = ref<LoosePalletOrderForm>(createDefaultLoosePalletForm());

const peerCustomerOptions = PEER_CUSTOMER_PRESETS.map(name => ({ label: name, value: name }));

watch(visible, val => {
  if (val) {
    formModel.value = createDefaultLoosePalletForm();
    createdOrder.value = null;
    successVisible.value = false;
  }
});

async function handleSubmit() {
  const message = validateLoosePalletOrderForm(formModel.value);
  if (message) {
    window.$message?.warning(message);
    return;
  }
  if (!props.containerOrderId) {
    window.$message?.warning('海柜订单不存在');
    return;
  }
  loading.value = true;
  const { data, error } = await fetchCreateLoosePalletOrder(props.containerOrderId, formModel.value);
  loading.value = false;
  if (error || !data) return;
  createdOrder.value = data as Record<string, any>;
  visible.value = false;
  successVisible.value = true;
  emit('submitted', createdOrder.value);
}

function handlePrintLabels() {
  const order = createdOrder.value;
  if (!order) return;
  const rows = toPalletLabelPrintRows(order.loosePalletLabels, {
    cargoOrderNo: order.cargoOrderNo,
    carriageNo: order.carriageNo,
    groupCode: order.groupCode
  });
  printPalletLabels(rows);
}
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="720" class="max-w-96%">
    <NDrawerContent title="新增散板订单（同行客户）" :native-scrollbar="false" closable>
      <NAlert type="info" class="mb-12px">
        按卡板数量下单，支持同行客户自提送货或上门收货，生成订单后可打印板贴。
      </NAlert>
      <NSpin :show="loading">
        <NForm label-placement="left" label-width="110">
          <NFormItem label="同行客户" required>
            <NAutoComplete
              :to="POPUP_TO_BODY"
              v-model:value="formModel.peerCustomerName"
              :options="peerCustomerOptions"
              placeholder="选择或输入同行客户名称"
              clearable
            />
          </NFormItem>
          <NFormItem label="车厢号" required>
            <NInput v-model:value="formModel.carriageNo" placeholder="如 CAR-88921" />
          </NFormItem>
          <NFormItem label="仓库代码">
            <NInput v-model:value="formModel.platformWarehouseCode" placeholder="可选，用于订单详情展示" />
          </NFormItem>
          <NFormItem label="卡板数量" required>
            <NInputNumber v-model:value="formModel.declaredPalletQty" :min="1" :max="999" class="w-full" />
          </NFormItem>
          <NFormItem label="收货方式" required>
            <NRadioGroup v-model:value="formModel.deliveryMode">
              <NSpace>
                <NRadio
                  v-for="item in LOOSE_PALLET_DELIVERY_MODE_OPTIONS"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
                </NRadio>
              </NSpace>
            </NRadioGroup>
          </NFormItem>
          <NFormItem label="预约送货时间" required>
            <NDatePicker
              :to="POPUP_TO_BODY"
              v-model:formatted-value="formModel.deliveryAppointmentTime"
              type="datetime"
              value-format="yyyy-MM-dd HH:mm:ss"
              class="w-full"
              clearable
            />
          </NFormItem>
          <NFormItem label="目的仓/分组">
            <NInput v-model:value="formModel.groupCode" placeholder="可选，用于板贴目的地展示" />
          </NFormItem>
          <template v-if="formModel.deliveryMode === 'DOOR_DELIVERY'">
            <NFormItem label="联系人" required>
              <NInput v-model:value="formModel.contactName" placeholder="上门收货联系人" />
            </NFormItem>
            <NFormItem label="联系电话" required>
              <NInput v-model:value="formModel.contactPhone" placeholder="联系电话" />
            </NFormItem>
            <NFormItem label="收货地址" required>
              <NInput v-model:value="formModel.addressLine1" placeholder="街道地址" />
            </NFormItem>
            <NFormItem label="City / State / Zip">
              <NSpace class="w-full">
                <NInput v-model:value="formModel.city" placeholder="City" class="flex-1" />
                <NInput v-model:value="formModel.state" placeholder="State" class="w-100px" />
                <NInput v-model:value="formModel.zipCode" placeholder="Zip" class="w-120px" />
              </NSpace>
            </NFormItem>
          </template>
          <NFormItem label="备注">
            <NInput v-model:value="formModel.remark" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" />
          </NFormItem>
        </NForm>
      </NSpin>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="visible = false">取消</NButton>
          <NButton type="primary" :loading="loading" @click="handleSubmit">生成订单</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>

  <NModal v-model:show="successVisible" preset="dialog" title="散板订单已生成" positive-text="打印板贴" negative-text="稍后">
    <div class="text-14px leading-24px">
      <div>订单号：{{ createdOrder?.cargoOrderNo }}</div>
      <div>同行客户：{{ createdOrder?.peerCustomerName || createdOrder?.customerName }}</div>
      <div>车厢号：{{ createdOrder?.carriageNo }}</div>
      <div>卡板数量：{{ createdOrder?.declaredPalletQty }} 板</div>
      <div>预约送货：{{ createdOrder?.deliveryAppointmentTime }}</div>
    </div>
    <template #action>
      <NSpace>
        <NButton @click="successVisible = false">稍后</NButton>
        <NButton type="primary" @click="handlePrintLabels">打印板贴</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
