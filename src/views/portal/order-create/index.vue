<script setup lang="ts">
import { computed, ref } from 'vue';
import { NAlert, NButton, NCard, NForm, NFormItem, NInput, NInputNumber, NSelect, NSteps, NStep } from 'naive-ui';
import { useRouterPush } from '@/hooks/common/router';
import { fetchGetPortalContainers, fetchGetPortalDropshipSkuOptions, fetchSubmitPortalOrder } from '@/service/api/portal';
import { PORTAL_ORDER_CHANNEL_OPTIONS } from '../constants';
import type { PortalOrderChannel } from '@/utils/portal/portal-order-channel';
import { PORTAL_ORDER_PUSH_MAX_LENGTH, validatePortalOrderPushNo } from '@/utils/oms/shipping-mark';

defineOptions({ name: 'PortalOrderCreate' });

const { routerPushByKey } = useRouterPush();

const TIMELINESS_OPTIONS = [
  { label: 'T（第一等级）', value: 'T' },
  { label: 'K（第二等级）', value: 'K' },
  { label: '普船（第三等级）', value: 'NORMAL_SHIP' }
];

const FBA_DESTINATIONS = [
  { label: 'ONT8', value: 'ONT8' },
  { label: 'LGB8', value: 'LGB8' },
  { label: 'SMF3', value: 'SMF3' },
  { label: 'DFW6', value: 'DFW6' },
  { label: 'ATL2', value: 'ATL2' }
];

const PLATFORM_DESTINATIONS = [
  { label: 'Walmart ORD2', value: 'ORD2' },
  { label: 'Target XLX7', value: 'XLX7' }
];

const step = ref(1);
const orderChannel = ref<PortalOrderChannel | null>(null);
const containerNo = ref<string | null>(null);
const containerOptions = ref<Array<{ label: string; value: string }>>([]);

const customerOrderNo = ref('');
const destination = ref<string | null>(null);
const timelinessLevel = ref<string | null>(null);
const cartonQty = ref<number | null>(null);
const palletQty = ref<number | null>(null);
const remark = ref('');

const recipientName = ref('');
const addressLine1 = ref('');
const city = ref('');
const state = ref('');
const zipCode = ref('');

const skuCode = ref<string | null>(null);
const skuOptions = ref<Array<{ label: string; value: string; availableQty: number }>>([]);
const shipQty = ref<number | null>(null);

const submitting = ref(false);
const lastResult = ref<Api.Portal.SubmitPortalOrderResult | null>(null);

const channelMeta = computed(() => PORTAL_ORDER_CHANNEL_OPTIONS.find(c => c.value === orderChannel.value));

async function loadContainers() {
  const { data } = await fetchGetPortalContainers();
  containerOptions.value = (data || []).map(c => ({
    label: `${c.containerNo} (${c.cargoCount}票 · ${c.loadingType})`,
    value: c.containerNo
  }));
}

function selectChannel(ch: PortalOrderChannel) {
  orderChannel.value = ch;
  step.value = 2;
  loadContainers();
}

function goForm() {
  if (orderChannel.value === 'DROPSHIP' || orderChannel.value === 'TRANSFER') {
    containerNo.value = null;
  }
  if (orderChannel.value === 'DROPSHIP') loadSkuOptions();
  step.value = 3;
}

async function loadSkuOptions() {
  const { data } = await fetchGetPortalDropshipSkuOptions();
  skuOptions.value = data || [];
}

const selectedSkuAvailable = computed(() => skuOptions.value.find(s => s.value === skuCode.value)?.availableQty);

async function handleSubmit() {
  if (!orderChannel.value) return;
  const pushError = validatePortalOrderPushNo(customerOrderNo.value);
  if (pushError) {
    window.$message?.warning(pushError);
    return;
  }

  submitting.value = true;
  lastResult.value = null;
  const { data, error } = await fetchSubmitPortalOrder({
    orderChannel: orderChannel.value,
    customerOrderNo: customerOrderNo.value.trim(),
    containerNo: containerNo.value,
    destination: destination.value || undefined,
    timelinessLevel: timelinessLevel.value || undefined,
    cartonQty: cartonQty.value ?? undefined,
    palletQty: palletQty.value ?? undefined,
    remark: remark.value.trim() || undefined,
    recipientName: recipientName.value || undefined,
    addressLine1: addressLine1.value || undefined,
    city: city.value || undefined,
    state: state.value || undefined,
    zipCode: zipCode.value || undefined,
    skuCode: skuCode.value || undefined,
    shipQty: shipQty.value ?? undefined,
    platform: orderChannel.value === 'COMMERCIAL_PLATFORM' ? 'Walmart' : undefined
  });
  submitting.value = false;
  if (error) return;
  const result = data as Api.Portal.SubmitPortalOrderResult;
  lastResult.value = result;
  if (!result?.success) {
    window.$message?.warning(result?.message || '提交失败');
    return;
  }
  window.$message?.success(result.message);
  step.value = 4;
}
</script>

<template>
  <div class="portal-order-create mx-auto max-w-800px flex flex-col gap-12px">
    <NAlert type="info" :bordered="false">
      支持亚马逊 / 商业平台 / 私人地址 / 一件代发 / 中转业务混装同一海柜。客户推送单号不超过
      {{ PORTAL_ORDER_PUSH_MAX_LENGTH }} 个字符。
    </NAlert>

    <NSteps :current="step" size="small">
      <NStep title="选择类型" />
      <NStep title="关联海柜" />
      <NStep title="填写信息" />
      <NStep title="完成" />
    </NSteps>

    <NCard v-if="step === 1" title="选择订单类型" size="small">
      <div class="grid grid-cols-1 gap-10px md:grid-cols-2">
        <div
          v-for="ch in PORTAL_ORDER_CHANNEL_OPTIONS"
          :key="ch.value"
          class="cursor-pointer rounded-8px border border-#e5e7eb p-12px transition hover:border-primary"
          @click="selectChannel(ch.value)"
        >
          <div class="font-medium">{{ ch.label }}</div>
          <div class="mt-4px text-12px text-#6b7280">{{ ch.desc }}</div>
        </div>
      </div>
    </NCard>

    <NCard v-else-if="step === 2" size="small" :title="`关联海柜 · ${channelMeta?.label}`">
      <p class="mb-12px text-13px text-#6b7280">
        跟海柜混装请选择柜号；一件代发或在库中转操作可不关联海柜。
      </p>
      <NForm label-placement="left" label-width="88">
        <NFormItem label="海柜号">
          <NSelect
            v-model:value="containerNo"
            :options="containerOptions"
            clearable
            placeholder="可选 — 混装到已有海柜"
            class="w-full"
          />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="goForm">下一步</NButton>
          <NButton class="ml-8px" @click="step = 1">上一步</NButton>
        </NFormItem>
      </NForm>
    </NCard>

    <NCard v-else-if="step === 3" size="small" :title="`填写订单 · ${channelMeta?.label}`">
      <NForm label-placement="left" label-width="100">
        <NFormItem label="客户订单号" required>
          <NInput v-model:value="customerOrderNo" :maxlength="PORTAL_ORDER_PUSH_MAX_LENGTH" show-count />
        </NFormItem>

        <template v-if="orderChannel === 'AMAZON'">
          <NFormItem label="FBA 仓" required>
            <NSelect v-model:value="destination" :options="FBA_DESTINATIONS" />
          </NFormItem>
          <NFormItem label="时效等级" required>
            <NSelect v-model:value="timelinessLevel" :options="TIMELINESS_OPTIONS" />
          </NFormItem>
          <NFormItem label="板数">
            <NInputNumber v-model:value="palletQty" :min="1" class="w-full" />
          </NFormItem>
        </template>

        <template v-else-if="orderChannel === 'COMMERCIAL_PLATFORM'">
          <NFormItem label="平台仓" required>
            <NSelect v-model:value="destination" :options="PLATFORM_DESTINATIONS" />
          </NFormItem>
          <NFormItem label="时效等级" required>
            <NSelect v-model:value="timelinessLevel" :options="TIMELINESS_OPTIONS" />
          </NFormItem>
        </template>

        <template v-else-if="orderChannel === 'PRIVATE_ADDRESS'">
          <NFormItem label="收件人">
            <NInput v-model:value="recipientName" />
          </NFormItem>
          <NFormItem label="地址" required>
            <NInput v-model:value="addressLine1" />
          </NFormItem>
          <NFormItem label="城市" required>
            <NInput v-model:value="city" />
          </NFormItem>
          <NFormItem label="州/省">
            <NInput v-model:value="state" class="w-120px" />
          </NFormItem>
          <NFormItem label="邮编">
            <NInput v-model:value="zipCode" class="w-160px" />
          </NFormItem>
        </template>

        <template v-else-if="orderChannel === 'DROPSHIP'">
          <NFormItem label="SKU" required>
            <NSelect v-model:value="skuCode" :options="skuOptions" filterable placeholder="从在库 SKU 选择" />
          </NFormItem>
          <NFormItem v-if="selectedSkuAvailable != null" label="可用库存">
            <span class="text-13px">{{ selectedSkuAvailable }}</span>
          </NFormItem>
          <NFormItem label="发货数量" required>
            <NInputNumber v-model:value="shipQty" :min="1" :max="selectedSkuAvailable || undefined" class="w-full" />
          </NFormItem>
          <NFormItem label="收件城市">
            <NInput v-model:value="city" />
          </NFormItem>
        </template>

        <template v-else-if="orderChannel === 'TRANSFER'">
          <NFormItem label="说明">
            <NInput v-model:value="remark" type="textarea" placeholder="中转/暂扣/换标等业务说明" :rows="3" />
          </NFormItem>
          <NAlert type="warning" :bordered="false" class="mb-12px">
            到仓后可在「中转与库内操作」下发贴标、换箱等指令并上传附件。
          </NAlert>
        </template>

        <NFormItem v-if="orderChannel !== 'TRANSFER'" label="备注">
          <NInput v-model:value="remark" type="textarea" :rows="2" />
        </NFormItem>

        <NFormItem>
          <NButton type="primary" :loading="submitting" @click="handleSubmit">推送订单</NButton>
          <NButton class="ml-8px" @click="step = 2">上一步</NButton>
        </NFormItem>
      </NForm>
    </NCard>

    <NCard v-else-if="step === 4 && lastResult?.success" title="推送成功" size="small">
      <p>系统运单号：<strong>{{ lastResult.cargoOrderNo }}</strong></p>
      <p>唛头号：<strong>{{ lastResult.shippingMark }}</strong></p>
      <p class="text-12px text-#6b7280">{{ lastResult.message }}</p>
      <div class="mt-12px flex flex-wrap gap-8px">
        <NButton @click="step = 1; lastResult = null; orderChannel = null">继续创建</NButton>
        <NButton v-if="orderChannel === 'TRANSFER'" type="primary" @click="routerPushByKey('portal_transfer-ops')">
          去下发库内指令
        </NButton>
      </div>
    </NCard>
  </div>
</template>
