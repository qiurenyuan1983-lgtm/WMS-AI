<script setup lang="ts">
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import {
  fetchGetChannelList,
  fetchGetCompanyList,
  fetchGetPortList,
  fetchGetShippingLineList,
  fetchGetShippingRouteList,
  fetchGetTerminalList,
  fetchGetVesselList,
  fetchGetWarehouseList
} from '@/service/api/base';
import { fetchGetUserList } from '@/service/api/system/user';
import {
  fetchCreateContainerOrder,
  fetchCreateContainerOrderDraft,
  fetchGetContainerOrderDetail,
  fetchUpdateContainerOrder
} from '@/service/api/oms/container-order';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import ContainerCargoOrderListEditor from './container-cargo-order-list-editor.vue';
import {
  LOADING_TYPE_LABELS,
  normalizeCargoOrderFromVo,
  resolveLoadingTypeFromCargoOrders,
  toApiCargoOrder,
  validateContainerCargoOrder
} from '../utils/container-cargo-order';

defineOptions({ name: 'ContainerOrderOperateDrawer' });

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Oms.ContainerOrder | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'submitted'): void }>();
const visible = defineModel<boolean>('visible', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const currentStep = ref(1);
const loading = ref(false);
const companyOptions = ref<CommonType.Option<CommonType.IdType>[]>([]);
const warehouseOptions = ref<CommonType.Option<CommonType.IdType>[]>([]);
const channelOptions = ref<CommonType.Option<CommonType.IdType>[]>([]);
const userRows = ref<Api.System.User[]>([]);
const shippingLineRows = ref<Api.Base.ShippingLine[]>([]);
const shippingRouteRows = ref<Api.Base.ShippingRoute[]>([]);
const vesselRows = ref<Api.Base.Vessel[]>([]);
const portRows = ref<Api.Base.Port[]>([]);
const terminalRows = ref<Api.Base.Terminal[]>([]);

const ORDER_SOURCE_OPTIONS = [
  { label: '自建单', value: 'SELF' },
  { label: 'API下单', value: 'API' },
  { label: '客户门户下单', value: 'PORTAL' }
];

const CONTAINER_TYPE_OPTIONS = [
  { label: '20GP', value: '20GP' },
  { label: '40GP', value: '40GP' },
  { label: '40HQ', value: '40HQ' },
  { label: '45HQ', value: '45HQ' }
];

const title = computed(() => (props.operateType === 'add' ? '新增海柜订单' : '编辑海柜订单'));

const model = ref<any>(createDefaultModel());

const ownerUserOptions = computed(() => toUserOptions(model.value.ownerUserName));
const customerServiceOptions = computed(() => toUserOptions(model.value.customerServiceName));

const shippingLineOptions = computed(() =>
  shippingLineRows.value.map(item => ({
    label: [item.nameAbbr, item.nameEn, item.code].filter(Boolean).join(' / '),
    value: item.id
  }))
);

const vesselOptions = computed(() =>
  vesselRows.value.map(item => ({
    label: [item.vesselName, item.vesselNameEn, item.shippingLineName].filter(Boolean).join(' / '),
    value: item.vesselName
  }))
);

const shippingRouteOptions = computed(() =>
  shippingRouteRows.value.map(item => ({
    label: [item.routeCode, item.routeName, item.shippingLineName].filter(Boolean).join(' / '),
    value: item.routeCode
  }))
);

const portOptions = computed(() =>
  portRows.value.map(item => ({
    label: [item.portCode, item.nameEn].filter(Boolean).join(' / '),
    value: item.id
  }))
);

const terminalOptions = computed(() =>
  terminalRows.value.map(item => ({
    label: [item.terminalCode, item.terminalName, item.portName].filter(Boolean).join(' / '),
    value: item.id
  }))
);

const computedLoadingType = computed(() => resolveLoadingTypeFromCargoOrders(model.value.cargoOrders));
const computedLoadingTypeLabel = computed(() => {
  const type = computedLoadingType.value;
  return type ? LOADING_TYPE_LABELS[type] || type : '待根据订单推断';
});

const cargoDefaults = computed(() => {
  const warehouseName = warehouseOptions.value.find(item => item.value === model.value.warehouseId)?.label;
  return {
    customerId: model.value.customerId,
    customerName: model.value.customerName,
    channelId: model.value.channelId,
    businessTypeId: model.value.businessTypeId,
    customerServiceId: model.value.customerServiceId,
    customerServiceName: model.value.customerServiceName,
    inboundWarehouseId: model.value.warehouseId,
    inboundWarehouseName: (warehouseName as string) || model.value.inboundWarehouseName
  };
});

function createDefaultModel(): Api.Oms.ContainerOrderOperateParams {
  return {
    id: null,
    containerOrderNo: null,
    companyId: null,
    customerId: null,
    customerName: null,
    channelId: null,
    businessTypeId: null,
    ownerUserId: null,
    ownerUserName: null,
    customerServiceId: null,
    customerServiceName: null,
    warehouseId: null,
    inboundWarehouseName: null,
    containerNo: null,
    orderSource: 'SELF',
    containerType: '40HQ',
    sealNo: null,
    shippingLineId: null,
    shippingLineName: null,
    vesselName: null,
    voyageNo: null,
    routeCode: null,
    mblNo: null,
    hblNo: null,
    dischargePortId: null,
    dischargePortName: null,
    terminalId: null,
    terminalName: null,
    eta: null,
    ata: null,
    pickupLfd: null,
    emptyReturnLfd: null,
    availableTime: null,
    terminalReleaseStatus: 'NONE',
    examStatus: 'NONE',
    examTypes: null,
    examType: null,
    examRemark: null,
    drayageVendorId: null,
    drayageVendorName: null,
    pickupAppointmentNo: null,
    pickupAppointmentTime: null,
    actualPickupTime: null,
    pickupRemark: null,
    expectedArrivalTime: null,
    requiredArrivalTime: null,
    actualArrivalTime: null,
    containerLocation: null,
    arrivalRemark: null,
    devanningNo: null,
    devanningMethod: null,
    expectedDevanningTime: null,
    devanningAppointmentTime: null,
    devanningStartTime: null,
    devanningFinishTime: null,
    loadingType: null,
    sortingMethod: null,
    devanningRemark: null,
    emptyReturnLocation: null,
    emptyReturnAppointmentNo: null,
    emptyReturnTime: null,
    emptyReturnRemark: null,
    containerStatus: 'PENDING_ACCEPT',
    internalRemark: null,
    status: '0',
    remark: null,
    cargoOrders: []
  };
}

const rules = {
  companyId: createRequiredRule('请选择主体'),
  customerId: createRequiredRule('请输入客户ID'),
  customerName: createRequiredRule('请输入客户名称'),
  warehouseId: createRequiredRule('请选择入库仓库'),
  containerNo: createRequiredRule('请输入柜号'),
  containerType: createRequiredRule('请选择柜型'),
  dischargePortId: createRequiredRule('请选择卸货港'),
  terminalId: createRequiredRule('请选择码头'),
  eta: createRequiredRule('请选择ETA')
};

async function loadOptions() {
  const [
    { data: companyData },
    { data: warehouseData },
    { data: channelData },
    { data: userData },
    { data: shippingLineData },
    { data: shippingRouteData },
    { data: vesselData },
    { data: portData },
    { data: terminalData }
  ] = await Promise.all([
    fetchGetCompanyList({ pageNum: 1, pageSize: 200, status: '0', params: {} }),
    fetchGetWarehouseList({ pageNum: 1, pageSize: 200, status: '0', params: {} }),
    fetchGetChannelList({ pageNum: 1, pageSize: 500, status: '0', params: {} }),
    fetchGetUserList({ pageNum: 1, pageSize: 1000, status: '0', params: {} }),
    fetchGetShippingLineList({ pageNum: 1, pageSize: 500, status: '0', params: {} }),
    fetchGetShippingRouteList({ pageNum: 1, pageSize: 500, status: '0', params: {} }),
    fetchGetVesselList({ pageNum: 1, pageSize: 500, status: '0', params: {} }),
    fetchGetPortList({ pageNum: 1, pageSize: 500, status: '0', params: {} }),
    fetchGetTerminalList({ pageNum: 1, pageSize: 500, status: '0', params: {} })
  ]);
  companyOptions.value = (companyData?.rows || []).map(item => ({ label: item.companyName, value: item.id }));
  warehouseOptions.value = (warehouseData?.rows || []).map(item => ({ label: item.warehouseName, value: item.id }));
  channelOptions.value = (channelData?.rows || []).map(item => ({ label: item.channelName, value: item.id }));
  userRows.value = userData?.rows || [];
  shippingLineRows.value = shippingLineData?.rows || [];
  shippingRouteRows.value = shippingRouteData?.rows || [];
  vesselRows.value = vesselData?.rows || [];
  portRows.value = portData?.rows || [];
  terminalRows.value = terminalData?.rows || [];
}

function toUserOptions(keyword?: string | null) {
  const text = (keyword || '').trim().toLowerCase();
  return userRows.value
    .filter(item => {
      const label = `${item.nickName || ''} ${item.userName || ''} ${item.phonenumber || ''}`.toLowerCase();
      return !text || label.includes(text);
    })
    .slice(0, 30)
    .map(item => ({
      label: [item.nickName || item.userName, item.userName].filter(Boolean).join(' / '),
      value: item.nickName || item.userName
    }));
}

function handleOwnerSelect(value: string | number) {
  const user = userRows.value.find(item => item.nickName === value || item.userName === value);
  if (!user) return;
  model.value.ownerUserId = user.userId;
  model.value.ownerUserName = user.nickName || user.userName;
}

function handleOwnerInput(value: string) {
  const user = userRows.value.find(item => item.nickName === value || item.userName === value);
  model.value.ownerUserId = user?.userId ?? null;
}

function handleCustomerServiceSelect(value: string | number) {
  const user = userRows.value.find(item => item.nickName === value || item.userName === value);
  if (!user) return;
  model.value.customerServiceId = user.userId;
  model.value.customerServiceName = user.nickName || user.userName;
}

function handleCustomerServiceInput(value: string) {
  const user = userRows.value.find(item => item.nickName === value || item.userName === value);
  model.value.customerServiceId = user?.userId ?? null;
}

function handleShippingLineChange(value: CommonType.IdType | null) {
  const line = shippingLineRows.value.find(item => item.id === value);
  model.value.shippingLineName = line ? line.nameAbbr || line.nameEn : null;
}

function fillShippingLineFromId(id?: CommonType.IdType | null, name?: string | null) {
  if (!id && !name) return;
  model.value.shippingLineId = id || null;
  const line = shippingLineRows.value.find(item => item.id === id);
  model.value.shippingLineName = line ? line.nameAbbr || line.nameEn : name || null;
}

function handleVesselChange(value: string | null) {
  const vessel = vesselRows.value.find(item => item.vesselName === value || item.vesselNameEn === value);
  if (!vessel) return;
  model.value.vesselName = vessel.vesselName;
  fillShippingLineFromId(vessel.shippingLineId, vessel.shippingLineName);
}

function handleShippingRouteChange(value: string | null) {
  const route = shippingRouteRows.value.find(item => item.routeCode === value);
  if (!route) return;
  model.value.routeCode = route.routeCode;
  fillShippingLineFromId(route.shippingLineId, route.shippingLineName);
  if (route.destinationPortId || route.destinationPortName) {
    model.value.dischargePortId = route.destinationPortId || null;
    model.value.dischargePortName = route.destinationPortName || route.destinationPortCode || null;
  }
}

function handlePortChange(value: CommonType.IdType | null) {
  const port = portRows.value.find(item => item.id === value);
  model.value.dischargePortName = port ? port.nameEn || port.portCode : null;
  if (!port) return;
  const terminals = terminalRows.value.filter(item => item.portId === port.id);
  if (terminals.length === 1) {
    handleTerminalChange(terminals[0].id);
  }
}

function handleTerminalChange(value: CommonType.IdType | null) {
  const terminal = terminalRows.value.find(item => item.id === value);
  model.value.terminalName = terminal ? terminal.terminalName : null;
  if (terminal?.portId) {
    model.value.dischargePortId = terminal.portId;
    model.value.dischargePortName = terminal.portName || terminal.portCode || model.value.dischargePortName;
  }
}

async function loadDetail() {
  model.value = createDefaultModel();
  if (props.operateType === 'edit' && props.rowData?.id) {
    const { data } = await fetchGetContainerOrderDetail(props.rowData.id);
    if (data) {
      model.value = {
        ...createDefaultModel(),
        ...jsonClone(data),
        cargoOrders: (data.cargoOrders || []).map(item => normalizeCargoOrderFromVo(item))
      };
    }
  }
}

function buildSubmitPayload() {
  const payload = jsonClone(model.value) as Api.Oms.ContainerOrderOperateParams;
  payload.cargoOrders = (payload.cargoOrders || [])
    .filter(item => {
      const hasHeader =
        item.cargoOrderNo?.trim() ||
        item.customerId ||
        item.customerName?.trim() ||
        item.businessTypeId;
      const hasShipment = (item.shipments || []).some(s => s.shipmentNo?.trim());
      return hasHeader || hasShipment;
    })
    .map(item => toApiCargoOrder(item));
  payload.loadingType = resolveLoadingTypeFromCargoOrders(payload.cargoOrders);
  return payload;
}

function validateCargoOrdersBeforeSubmit(): boolean {
  for (const cargo of model.value.cargoOrders || []) {
    const hasAny =
      cargo.cargoOrderNo?.trim() ||
      cargo.customerId ||
      cargo.customerName?.trim() ||
      (cargo.shipments || []).some((s: Api.Oms.CargoOrderShipmentItem) => s.shipmentNo?.trim());
    if (!hasAny) continue;
    const message = validateContainerCargoOrder(cargo);
    if (message) {
      window.$message?.warning(message);
      return false;
    }
  }
  return true;
}

function closeDrawer() {
  visible.value = false;
}

async function handleSaveDraft() {
  await validate();
  const { error } = await fetchCreateContainerOrderDraft(buildSubmitPayload());
  if (error) return;
  window.$message?.success('草稿已保存');
  closeDrawer();
  emit('submitted');
}

async function handleSubmit() {
  await validate();
  if (!validateCargoOrdersBeforeSubmit()) return;
  const api = props.operateType === 'add' ? fetchCreateContainerOrder : fetchUpdateContainerOrder;
  const { error } = await api(buildSubmitPayload());
  if (error) return;
  window.$message?.success(props.operateType === 'add' ? '新增成功' : '修改成功');
  closeDrawer();
  emit('submitted');
}

watch(visible, async () => {
  if (!visible.value) return;
  loading.value = true;
  currentStep.value = 1;
  restoreValidation();
  await loadOptions();
  await loadDetail();
  loading.value = false;
});
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="1200" class="max-w-96%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NSpin :show="loading">
        <NSteps v-model:current="currentStep" class="mb-18px">
          <NStep title="基础信息" />
          <NStep title="订单（可选）" />
          <NStep title="确认提交" />
        </NSteps>

        <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="112">
          <div v-show="currentStep === 1">
            <NDivider title-placement="left">业务归属</NDivider>
            <NGrid :cols="3" x-gap="16">
              <NGridItem>
                <NFormItem label="主体" path="companyId">
                  <NSelect :to="POPUP_TO_BODY" v-model:value="model.companyId" :options="companyOptions" filterable placeholder="请选择主体" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem label="客户ID" path="customerId">
                  <NInput
                    :value="model.customerId == null ? '' : String(model.customerId)"
                    placeholder="客户ID（后续接客户资料）"
                    @update:value="value => (model.customerId = value || null)"
                  />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem label="客户名称" path="customerName">
                  <NInput v-model:value="model.customerName" placeholder="请输入客户名称" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem label="渠道">
                  <NSelect :to="POPUP_TO_BODY" v-model:value="model.channelId" :options="channelOptions" filterable clearable placeholder="请选择渠道" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem label="负责人">
                  <NAutoComplete
                    v-model:value="model.ownerUserName"
                    clearable
                    :options="ownerUserOptions"
                    placeholder="输入或选择负责人"
                    @select="handleOwnerSelect"
                    @update:value="handleOwnerInput"
                  />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem label="客服">
                  <NAutoComplete
                    v-model:value="model.customerServiceName"
                    clearable
                    :options="customerServiceOptions"
                    placeholder="输入或选择客服"
                    @select="handleCustomerServiceSelect"
                    @update:value="handleCustomerServiceInput"
                  />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem label="订单来源">
                  <NSelect :to="POPUP_TO_BODY" v-model:value="model.orderSource" :options="ORDER_SOURCE_OPTIONS" />
                </NFormItem>
              </NGridItem>
            </NGrid>

            <NDivider title-placement="left">柜子信息</NDivider>
            <NGrid :cols="4" x-gap="16">
              <NGridItem>
                <NFormItem label="柜号" path="containerNo">
                  <NInput v-model:value="model.containerNo" placeholder="如 TGHU1234567" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem label="柜型" path="containerType">
                  <NSelect :to="POPUP_TO_BODY" v-model:value="model.containerType" :options="CONTAINER_TYPE_OPTIONS" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem label="封条号">
                  <NInput v-model:value="model.sealNo" placeholder="封条号" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem label="船公司">
                  <NSelect :to="POPUP_TO_BODY"
                    v-model:value="model.shippingLineId"
                    :options="shippingLineOptions"
                    filterable
                    clearable
                    placeholder="请选择船公司"
                    @update:value="handleShippingLineChange"
                  />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem label="船名">
                  <NAutoComplete
                    v-model:value="model.vesselName"
                    clearable
                    :options="vesselOptions"
                    placeholder="输入或选择船名"
                    @select="handleVesselChange"
                  />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem label="航次">
                  <NInput v-model:value="model.voyageNo" placeholder="请输入航次" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem label="航线代码">
                  <NAutoComplete
                    v-model:value="model.routeCode"
                    clearable
                    :options="shippingRouteOptions"
                    placeholder="输入或选择航线代码"
                    @select="handleShippingRouteChange"
                  />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem label="MBL">
                  <NInput v-model:value="model.mblNo" placeholder="MBL" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem label="HBL">
                  <NInput v-model:value="model.hblNo" placeholder="HBL" />
                </NFormItem>
              </NGridItem>
            </NGrid>

            <NDivider title-placement="left">港口与码头</NDivider>
            <NGrid :cols="3" x-gap="16">
              <NGridItem>
                <NFormItem label="卸货港" path="dischargePortId">
                  <NSelect :to="POPUP_TO_BODY"
                    v-model:value="model.dischargePortId"
                    :options="portOptions"
                    filterable
                    clearable
                    placeholder="请选择卸货港"
                    @update:value="handlePortChange"
                  />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem label="码头" path="terminalId">
                  <NSelect :to="POPUP_TO_BODY"
                    v-model:value="model.terminalId"
                    :options="terminalOptions"
                    filterable
                    clearable
                    placeholder="请选择码头"
                    @update:value="handleTerminalChange"
                  />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem label="ETA" path="eta">
                  <NDatePicker :to="POPUP_TO_BODY" v-model:formatted-value="model.eta" type="datetime" value-format="yyyy-MM-dd HH:mm:ss" class="w-full" clearable />
                </NFormItem>
              </NGridItem>
            </NGrid>

            <NDivider title-placement="left">提柜信息</NDivider>
            <NGrid :cols="3" x-gap="16">
              <NGridItem>
                <NFormItem label="提柜供应商">
                  <NInput v-model:value="model.drayageVendorName" placeholder="提柜公司" />
                </NFormItem>
              </NGridItem>
            </NGrid>

            <NDivider title-placement="left">入库仓</NDivider>
            <NGrid :cols="3" x-gap="16">
              <NGridItem>
                <NFormItem label="入库仓库" path="warehouseId">
                  <NSelect :to="POPUP_TO_BODY" v-model:value="model.warehouseId" :options="warehouseOptions" filterable placeholder="请选择仓库" />
                </NFormItem>
              </NGridItem>
            </NGrid>
            <NFormItem label="备注">
              <NInput v-model:value="model.remark" type="textarea" placeholder="备注" :rows="2" />
            </NFormItem>
          </div>

          <div v-show="currentStep === 2">
            <ContainerCargoOrderListEditor v-model="model.cargoOrders!" :defaults="cargoDefaults" />
          </div>

          <div v-show="currentStep === 3">
            <NResult status="info" title="确认提交海柜订单">
              <template #footer>
                <NSpace vertical align="start">
                  <div>海柜基础信息已填写：{{ model.containerNo || '-' }}</div>
                  <div>关联订单：{{ model.cargoOrders?.length || 0 }} 条</div>
                  <div>装载类型：{{ computedLoadingTypeLabel }}（根据订单下单计量自动推断）</div>
                  <div>正式提交后，订单会生成自己的业务主线 biz_root_id，并与海柜建立关联。</div>
                </NSpace>
              </template>
            </NResult>
          </div>
        </NForm>
      </NSpin>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="closeDrawer">取消</NButton>
          <NButton v-if="currentStep > 1" @click="currentStep--">上一步</NButton>
          <NButton v-if="currentStep < 3" type="primary" @click="currentStep++">下一步</NButton>
          <NButton v-if="operateType === 'add'" @click="handleSaveDraft">保存草稿</NButton>
          <NButton v-if="currentStep === 3" type="primary" @click="handleSubmit">提交</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
