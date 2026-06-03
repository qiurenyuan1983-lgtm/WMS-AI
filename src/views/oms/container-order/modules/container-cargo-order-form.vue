<script setup lang="ts">
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { computed, onMounted, ref } from 'vue';
import { useDict } from '@/hooks/business/dict';
import { fetchGetBusinessTypeList, fetchGetChannelList, fetchGetPlatformAddressList, fetchGetPlatformList } from '@/service/api/base';
import { fetchGetUserList } from '@/service/api/system/user';
import {
  FORECAST_QTY_UNIT_OPTIONS,
  isExpressDeliveryBusinessType,
  isTruckDeliveryBusinessType,
  summarizeCargoOrderForm,
  type ContainerCargoDefaults
} from '../utils/container-cargo-order';
import type { ContainerCargoOrderDraftRow } from '../utils/container-cargo-order-display';
import ContainerCargoOrderShipmentTable from './container-cargo-order-shipment-table.vue';

defineOptions({ name: 'ContainerCargoOrderForm' });

interface Props {
  defaults?: ContainerCargoDefaults;
  /** 为 false 时货件在独立抽屉维护（新增海柜表格模式） */
  showShipmentTable?: boolean;
}

const props = withDefaults(defineProps<Props>(), { showShipmentTable: true });
const model = defineModel<any>({ required: true });
const { options: parcelCarrierOptions } = useDict('oms_parcel_carrier');
const { options: addressTypeOptions } = useDict('oms_address_type');

const channelOptions = ref<CommonType.Option[]>([]);
const businessTypeOptions = ref<CommonType.Option[]>([]);
const businessTypeRows = ref<Api.Base.BusinessType[]>([]);
const platformOptions = ref<CommonType.Option[]>([]);
const platformRows = ref<Api.Base.Platform[]>([]);
const platformAddressRows = ref<Api.Base.PlatformAddress[]>([]);
const userRows = ref<Api.System.User[]>([]);


const YES_NO_OPTIONS = [
  { label: '不转仓', value: 0 },
  { label: '需要转仓', value: 1 }
];

async function loadOptions() {
  const [channelRes, businessRes, platformRes, platformAddressRes, userRes] = await Promise.all([
    fetchGetChannelList({ pageNum: 1, pageSize: 500, status: '0', params: {} }),
    fetchGetBusinessTypeList({ pageNum: 1, pageSize: 500, status: '0', params: {} }),
    fetchGetPlatformList({ pageNum: 1, pageSize: 500, status: '0', params: {} }),
    fetchGetPlatformAddressList({ pageNum: 1, pageSize: 1000, status: '0', params: {} }),
    fetchGetUserList({ pageNum: 1, pageSize: 1000, status: '0', params: {} })
  ]);
  channelOptions.value = (channelRes.data?.rows || []).map(item => ({ label: item.channelName, value: item.id }));
  businessTypeRows.value = businessRes.data?.rows || [];
  businessTypeOptions.value = (businessRes.data?.rows || []).map(item => ({
    label: item.businessTypeName,
    value: item.id
  }));
  platformRows.value = platformRes.data?.rows || [];
  platformAddressRows.value = platformAddressRes.data?.rows || [];
  userRows.value = userRes.data?.rows || [];
  platformOptions.value = (platformRes.data?.rows || []).map(item => ({
    label: item.nameEn || item.code,
    value: item.id
  }));
}

const selectedPlatformAddresses = computed(() =>
  platformAddressRows.value.filter(item => !model.value.platformId || item.platformId === model.value.platformId)
);

const warehouseCodeOptions = computed(() => {
  const keyword = model.value.platformWarehouseCode?.trim().toLowerCase() || '';
  return selectedPlatformAddresses.value
    .filter(item => {
      if (!keyword) return true;
      return [item.addressCode, item.nameEn, item.city, item.stateCode].some(value => value?.toLowerCase().includes(keyword));
    })
    .slice(0, 30)
    .map(item => ({
      label: `${item.addressCode} - ${item.nameEn}`,
      value: item.addressCode
    }));
});

const customerServiceOptions = computed(() => {
  const keyword = model.value.customerServiceName?.trim().toLowerCase() || '';
  return userRows.value
    .filter(item => {
      if (!keyword) return true;
      return [item.nickName, item.userName, item.phonenumber].some(value => value?.toLowerCase().includes(keyword));
    })
    .slice(0, 30)
    .map(item => ({
      label: `${item.nickName || item.userName} (${item.userName})`,
      value: item.nickName || item.userName,
      userId: item.userId
    }));
});

const isExpressDelivery = computed(() => {
  const businessType = businessTypeRows.value.find(item => item.id === model.value.businessTypeId);
  return isExpressDeliveryBusinessType({ businessTypeCode: businessType?.businessTypeCode, businessTypeName: businessType?.businessTypeName || model.value.businessTypeName });
});

const isTruckDelivery = computed(() => {
  const businessType = businessTypeRows.value.find(item => item.id === model.value.businessTypeId);
  return isTruckDeliveryBusinessType({ businessTypeCode: businessType?.businessTypeCode, businessTypeName: businessType?.businessTypeName || model.value.businessTypeName });
});

function handleBusinessTypeChange(value: CommonType.IdType | null) {
  const businessType = businessTypeRows.value.find(item => item.id === value);
  model.value.businessTypeName = businessType?.businessTypeName || null;
  if (!isTruckDelivery.value) {
    model.value.addressType = null;
    handleAddressTypeChange(null);
  }
}

function handleAddressTypeChange(value: string | null) {
  if (value === 'PLATFORM_WH') return;
  model.value.platformId = null;
  model.value.platformName = null;
  model.value.platformWarehouseCode = null;
}

function handleCustomerServiceSelect(value: string) {
  const user = userRows.value.find(item => (item.nickName || item.userName) === value);
  model.value.customerServiceId = user?.userId ?? null;
  model.value.customerServiceName = value;
}

function handleCustomerServiceInput(value: string) {
  const user = userRows.value.find(item => item.nickName === value || item.userName === value);
  model.value.customerServiceId = user?.userId ?? null;
}

function handlePlatformChange(value: CommonType.IdType | null) {
  const platform = platformRows.value.find(item => item.id === value);
  model.value.platformName = platform ? platform.nameEn || platform.code : null;
  const matchedAddresses = platformAddressRows.value.filter(item => item.platformId === value);
  if (!model.value.platformWarehouseCode && matchedAddresses.length === 1) {
    applyPlatformAddress(matchedAddresses[0].addressCode);
  }
}

function applyPlatformAddress(addressCode: string | null) {
  model.value.platformWarehouseCode = addressCode;
  const address = platformAddressRows.value.find(
    item => item.addressCode === addressCode && (!model.value.platformId || item.platformId === model.value.platformId)
  );
  if (!address) return;
  model.value.platformId = address.platformId;
  model.value.platformName = address.platformName || model.value.platformName;
  model.value.consigneeName = model.value.consigneeName || address.nameEn;
  model.value.addressLine1 = model.value.addressLine1 || address.addressLine1;
  model.value.addressLine2 = model.value.addressLine2 || address.addressLine2;
  model.value.city = model.value.city || address.city;
  model.value.state = model.value.state || address.stateCode;
  model.value.zipCode = model.value.zipCode || address.zipCode;
  model.value.country = model.value.country || address.countryCode;
  model.value.contactName = model.value.contactName || address.contactName;
  model.value.contactPhone = model.value.contactPhone || address.contactPhone;
}

function applyDefaults() {
  if (!props.defaults || !model.value) return;
  const d = props.defaults;
  if (!model.value.customerId && d.customerId) model.value.customerId = d.customerId;
  if (!model.value.customerName && d.customerName) model.value.customerName = d.customerName;
  if (!model.value.channelId && d.channelId) model.value.channelId = d.channelId;
  if (!model.value.businessTypeId && d.businessTypeId) model.value.businessTypeId = d.businessTypeId;
  if (model.value.businessTypeId && !model.value.businessTypeName) handleBusinessTypeChange(model.value.businessTypeId);
  if (!model.value.customerServiceId && d.customerServiceId) model.value.customerServiceId = d.customerServiceId;
  if (!model.value.customerServiceName && d.customerServiceName) model.value.customerServiceName = d.customerServiceName;
  if (!model.value.inboundWarehouseId && d.inboundWarehouseId) model.value.inboundWarehouseId = d.inboundWarehouseId;
  if (!model.value.inboundWarehouseName && d.inboundWarehouseName) {
    model.value.inboundWarehouseName = d.inboundWarehouseName;
  }
}

function onForecastUnitChange() {
  summarizeCargoOrderForm(model.value);
}

onMounted(async () => {
  await loadOptions();
  applyDefaults();
});
</script>

<template>
  <div class="flex-col gap-12px">
    <NDescriptions bordered :column="4" label-placement="left" size="small" title="订单信息">
      <NDescriptionsItem label="货物订单号">
        <NInput v-model:value="model.cargoOrderNo" size="small" placeholder="留空则系统自动生成" />
      </NDescriptionsItem>
      <NDescriptionsItem label="参考号">
        <NInput v-model:value="model.externalOrderNo" size="small" placeholder="客户外部单号" />
      </NDescriptionsItem>
      <NDescriptionsItem label="订单来源">
        <NSelect :to="POPUP_TO_BODY"
          v-model:value="model.orderSource"
          size="small"
          :options="[
            { label: '自建单', value: 'SELF' },
            { label: 'API下单', value: 'API' },
            { label: '客户门户下单', value: 'PORTAL' }
          ]"
        />
      </NDescriptionsItem>
      <NDescriptionsItem label="入库仓库">
        <NInput v-model:value="model.inboundWarehouseName" size="small" disabled placeholder="继承海柜入库仓" />
      </NDescriptionsItem>
    </NDescriptions>

    <NDescriptions bordered :column="4" label-placement="left" size="small" title="客户与业务">
      <NDescriptionsItem label="客户ID">
        <NInput
          :value="model.customerId == null ? '' : String(model.customerId)"
          size="small"
          placeholder="客户ID"
          @update:value="v => (model.customerId = v || null)"
        />
      </NDescriptionsItem>
      <NDescriptionsItem label="* 客户名称">
        <NInput v-model:value="model.customerName" size="small" placeholder="必填" />
      </NDescriptionsItem>
      <NDescriptionsItem label="渠道">
        <NSelect :to="POPUP_TO_BODY" v-model:value="model.channelId" size="small" filterable clearable :options="channelOptions" />
      </NDescriptionsItem>
      <NDescriptionsItem label="* 业务类型">
        <NSelect :to="POPUP_TO_BODY"
          v-model:value="model.businessTypeId"
          size="small"
          filterable
          clearable
          :options="businessTypeOptions"
          @update:value="handleBusinessTypeChange"
        />
      </NDescriptionsItem>
      <NDescriptionsItem label="客服">
        <NAutoComplete
          v-model:value="model.customerServiceName"
          size="small"
          clearable
          :options="customerServiceOptions"
          placeholder="输入或选择客服姓名"
          @select="handleCustomerServiceSelect"
          @update:value="handleCustomerServiceInput"
        />
      </NDescriptionsItem>
    </NDescriptions>

    <NDescriptions bordered :column="4" label-placement="left" size="small" title="收货地址">
      <NDescriptionsItem :label="isTruckDelivery ? '* 地址类型' : '地址类型'">
        <NSelect :to="POPUP_TO_BODY"
          v-model:value="model.addressType"
          size="small"
          clearable
          :options="addressTypeOptions"
          @update:value="handleAddressTypeChange"
        />
      </NDescriptionsItem>
      <NDescriptionsItem :label="isTruckDelivery && model.addressType === 'PLATFORM_WH' ? '* 平台' : '平台'">
        <NSelect :to="POPUP_TO_BODY"
          v-model:value="model.platformId"
          size="small"
          filterable
          clearable
          :options="platformOptions"
          :disabled="model.addressType !== 'PLATFORM_WH'"
          @update:value="handlePlatformChange"
        />
      </NDescriptionsItem>
      <NDescriptionsItem :label="isTruckDelivery && model.addressType === 'PLATFORM_WH' ? '* 仓库代码' : '仓库代码'">
        <NAutoComplete
          v-model:value="model.platformWarehouseCode"
          size="small"
          clearable
          :options="warehouseCodeOptions"
          :disabled="model.addressType !== 'PLATFORM_WH'"
          placeholder="输入或选择仓库代码"
          @select="applyPlatformAddress"
        />
      </NDescriptionsItem>
      <NDescriptionsItem :label="isTruckDelivery ? '* 收货方' : '收货方'">
        <NInput v-model:value="model.consigneeName" size="small" :placeholder="isTruckDelivery ? '卡车派送必填' : '可选'" />
      </NDescriptionsItem>
      <NDescriptionsItem label="联系人">
        <NInput v-model:value="model.contactName" size="small" />
      </NDescriptionsItem>
      <NDescriptionsItem :label="isTruckDelivery ? '* Address Line1' : 'Address Line1'" :span="2">
        <NInput v-model:value="model.addressLine1" size="small" :placeholder="isTruckDelivery ? '卡车派送必填' : '可选'" />
      </NDescriptionsItem>
      <NDescriptionsItem label="Address Line2" :span="2">
        <NInput v-model:value="model.addressLine2" size="small" />
      </NDescriptionsItem>
      <NDescriptionsItem :label="isTruckDelivery ? '* City' : 'City'">
        <NInput v-model:value="model.city" size="small" />
      </NDescriptionsItem>
      <NDescriptionsItem :label="isTruckDelivery ? '* State' : 'State'">
        <NInput v-model:value="model.state" size="small" />
      </NDescriptionsItem>
      <NDescriptionsItem :label="isTruckDelivery ? '* Zip Code' : 'Zip Code'">
        <NInput v-model:value="model.zipCode" size="small" />
      </NDescriptionsItem>
      <NDescriptionsItem label="Country">
        <NInput v-model:value="model.country" size="small" placeholder="如 US" />
      </NDescriptionsItem>
      <NDescriptionsItem label="电话">
        <NInput v-model:value="model.contactPhone" size="small" />
      </NDescriptionsItem>
      <NDescriptionsItem label="邮箱" :span="3">
        <NInput v-model:value="model.contactEmail" size="small" />
      </NDescriptionsItem>
    </NDescriptions>

    <NDescriptions bordered :column="4" label-placement="left" size="small" title="计量与转仓">
      <NDescriptionsItem label="是否转仓">
        <NSelect :to="POPUP_TO_BODY" v-model:value="model.transferFlag" size="small" :options="YES_NO_OPTIONS" />
      </NDescriptionsItem>
      <NDescriptionsItem label="转仓仓库">
        <NInput
          v-model:value="model.transferWarehouseCode"
          size="small"
          :disabled="!model.transferFlag"
          placeholder="转仓时必填"
        />
      </NDescriptionsItem>
      <NDescriptionsItem :label="isExpressDelivery ? '* 快递商' : '快递商'">
        <NSelect
          :to="POPUP_TO_BODY"
          v-model:value="model.parcelCarrierName"
          size="small"
          filterable
          clearable
          tag
          :options="parcelCarrierOptions"
          placeholder="快递派送必填，选择或输入快递商"
        />
      </NDescriptionsItem>
      <NDescriptionsItem label="追踪号">
        <NInput v-model:value="model.parcelTrackingNo" size="small" placeholder="可选" />
      </NDescriptionsItem>
    </NDescriptions>

    <NDescriptions bordered :column="4" label-placement="left" size="small" title="预报货量（可由货件自动汇总）">
      <NDescriptionsItem label="* 下单计量">
        <NSelect :to="POPUP_TO_BODY"
          v-model:value="model.forecastQtyUnit"
          size="small"
          :options="[...FORECAST_QTY_UNIT_OPTIONS]"
          @update:value="onForecastUnitChange"
        />
      </NDescriptionsItem>
      <NDescriptionsItem v-if="model.forecastQtyUnit !== 'BY_PALLET'" label="* 预报箱数">
        <NInputNumber v-model:value="model.declaredCartonQty" size="small" class="w-full" :min="0" />
      </NDescriptionsItem>
      <NDescriptionsItem v-else label="* 预报板数">
        <NInputNumber v-model:value="model.declaredPalletQty" size="small" class="w-full" :min="0" />
      </NDescriptionsItem>
      <NDescriptionsItem label="* 预报件数">
        <NInputNumber v-model:value="model.declaredPieceQty" size="small" class="w-full" :min="0" />
      </NDescriptionsItem>
      <NDescriptionsItem label="* 预报重量KG">
        <NInputNumber v-model:value="model.declaredWeight" size="small" class="w-full" :min="0" />
      </NDescriptionsItem>
      <NDescriptionsItem label="* 预报体积CBM">
        <NInputNumber v-model:value="model.declaredCbm" size="small" class="w-full" :min="0" />
      </NDescriptionsItem>
    </NDescriptions>

    <NDescriptions bordered :column="3" label-placement="left" size="small" title="备注">
      <NDescriptionsItem label="客户备注">
        <NInput v-model:value="model.customerRemark" size="small" type="textarea" :rows="2" />
      </NDescriptionsItem>
      <NDescriptionsItem label="内部备注">
        <NInput v-model:value="model.internalRemark" size="small" type="textarea" :rows="2" />
      </NDescriptionsItem>
      <NDescriptionsItem label="操作备注">
        <NInput v-model:value="model.operationRemark" size="small" type="textarea" :rows="2" />
      </NDescriptionsItem>
    </NDescriptions>

    <ContainerCargoOrderShipmentTable v-if="showShipmentTable" v-model="model" />
  </div>
</template>
