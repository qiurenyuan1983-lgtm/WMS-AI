<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { fetchCreateWarehouse, fetchUpdateWarehouse } from '@/service/api/base/warehouse';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';

defineOptions({ name: 'WarehouseOperateDrawer' });

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Base.MdmWarehouse | null;
  companyOptions?: { label: string; value: CommonType.IdType }[];
}

const props = withDefaults(defineProps<Props>(), {
  companyOptions: () => []
});

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const WAREHOUSE_TYPE_OPTIONS = [
  { label: '自营仓',     value: 'SELF_OP' },
  { label: '合作仓',     value: 'PARTNER' },
  { label: '中转仓',     value: 'TRANSIT' },
  { label: '客户指定仓', value: 'CUSTOMER' }
];

const title = computed(() => (props.operateType === 'add' ? '新增仓库' : '编辑仓库'));

type Model = Api.Base.MdmWarehouseOperateParams;

const model = ref<any>(createDefaultModel());

function createDefaultModel(): Model {
  return {
    id: null,
    companyId: null,
    warehouseCode: null,
    warehouseName: null,
    warehouseType: null,
    countryCode: null,
    stateCode: null,
    city: null,
    address: null,
    zipCode: null,
    timezone: null,
    currencyCode: null,
    contactName: null,
    contactPhone: null,
    isBonded: 0,
    operationStartTime: null,
    operationEndTime: null,
    supportUnloading: 0,
    supportDropship: 0,
    supportTransit: 0,
    supportTransfer: 0,
    supportFba: 0,
    supportSelfPickup: 0,
    supportAppointment: 0,
    maxCapacityCbm: null,
    dailyUnloadingCap: null,
    dailyOutboundCap: null,
    dockCount: 0,
    doorCount: 0,
    forkliftCount: 0,
    pdaEnabled: 0,
    apiEnabled: 0,
    apiConfig: null,
    status: '0',
    remark: null
  };
}

type RuleKey = 'companyId' | 'warehouseCode' | 'warehouseName' | 'warehouseType' | 'countryCode';

const rules: Record<RuleKey, App.Global.FormRule> = {
  companyId:     createRequiredRule('请选择所属主体'),
  warehouseCode: createRequiredRule('仓库编码不能为空'),
  warehouseName: createRequiredRule('仓库名称不能为空'),
  warehouseType: createRequiredRule('请选择仓库类型'),
  countryCode:   createRequiredRule('国家代码不能为空')
};

function handleUpdateModelWhenEdit() {
  model.value = createDefaultModel();
  if (props.operateType === 'edit' && props.rowData) {
    Object.assign(model.value, jsonClone(props.rowData));
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();
  if (props.operateType === 'add') {
    const { error } = await fetchCreateWarehouse(model.value);
    if (error) return;
    window.$message?.success('新增成功');
  }
  if (props.operateType === 'edit') {
    const { error } = await fetchUpdateWarehouse(model.value);
    if (error) return;
    window.$message?.success('修改成功');
  }
  closeDrawer();
  emit('submitted');
}

watch(visible, () => {
  if (visible.value) {
    handleUpdateModelWhenEdit();
    restoreValidation();
  }
});
</script>

<template>
  <NDrawer v-model:show="visible" :title="title" display-directive="show" :width="720" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="110">

        <!-- 基础信息 -->
        <NDivider title-placement="left">基础信息</NDivider>
        <NGrid :cols="2" x-gap="16">
          <NGridItem>
            <NFormItem label="所属主体" path="companyId">
              <NSelect
                v-model:value="model.companyId"
                :options="companyOptions"
                :disabled="operateType === 'edit'"
                placeholder="请选择主体"
                filterable
              />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="仓库类型" path="warehouseType">
              <NSelect v-model:value="model.warehouseType" :options="WAREHOUSE_TYPE_OPTIONS" placeholder="请选择类型" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="仓库编码" path="warehouseCode">
              <NInput
                v-model:value="model.warehouseCode"
                placeholder="如：LA01（新增后不可修改）"
                :disabled="operateType === 'edit'"
                style="text-transform: uppercase"
              />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="仓库名称" path="warehouseName">
              <NInput v-model:value="model.warehouseName" placeholder="仓库全名" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="国家代码" path="countryCode">
              <NInput v-model:value="model.countryCode" placeholder="如：US / CN" style="text-transform: uppercase" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="州/省" path="stateCode">
              <NInput v-model:value="model.stateCode" placeholder="如：CA / NY（可选）" style="text-transform: uppercase" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="城市" path="city">
              <NInput v-model:value="model.city" placeholder="城市名称（可选）" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="邮编" path="zipCode">
              <NInput v-model:value="model.zipCode" placeholder="邮编（可选）" />
            </NFormItem>
          </NGridItem>
        </NGrid>
        <NFormItem label="详细地址" path="address">
          <NInput v-model:value="model.address" placeholder="详细地址（可选）" />
        </NFormItem>
        <NGrid :cols="2" x-gap="16">
          <NGridItem>
            <NFormItem label="时区" path="timezone">
              <NInput v-model:value="model.timezone" placeholder="如：America/Los_Angeles" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="结算货币" path="currencyCode">
              <NInput v-model:value="model.currencyCode" placeholder="如：USD / CNY" style="text-transform: uppercase" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="联系人" path="contactName">
              <NInput v-model:value="model.contactName" placeholder="仓库联系人（可选）" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="联系电话" path="contactPhone">
              <NInput v-model:value="model.contactPhone" placeholder="联系电话（可选）" />
            </NFormItem>
          </NGridItem>
        </NGrid>
        <NFormItem label="保税仓" path="isBonded">
          <NRadioGroup v-model:value="model.isBonded">
            <NRadio :value="0">否</NRadio>
            <NRadio :value="1">是</NRadio>
          </NRadioGroup>
        </NFormItem>
        <NFormItem label="状态" path="status">
          <NRadioGroup v-model:value="model.status">
            <NRadio value="0">启用</NRadio>
            <NRadio value="1">停用</NRadio>
          </NRadioGroup>
        </NFormItem>

        <!-- 运营配置 -->
        <NDivider title-placement="left">运营配置</NDivider>
        <NGrid :cols="2" x-gap="16">
          <NGridItem>
            <NFormItem label="开始时间" path="operationStartTime">
              <NInput v-model:value="model.operationStartTime" placeholder="如：08:00" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="结束时间" path="operationEndTime">
              <NInput v-model:value="model.operationEndTime" placeholder="如：18:00" />
            </NFormItem>
          </NGridItem>
        </NGrid>

        <!-- 服务能力 -->
        <NDivider title-placement="left">服务能力</NDivider>
        <NGrid :cols="3" x-gap="16">
          <NGridItem>
            <NFormItem label="卸柜" path="supportUnloading">
              <NSwitch v-model:value="model.supportUnloading" :checked-value="1" :unchecked-value="0" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="一件代发" path="supportDropship">
              <NSwitch v-model:value="model.supportDropship" :checked-value="1" :unchecked-value="0" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="转运" path="supportTransit">
              <NSwitch v-model:value="model.supportTransit" :checked-value="1" :unchecked-value="0" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="调拨" path="supportTransfer">
              <NSwitch v-model:value="model.supportTransfer" :checked-value="1" :unchecked-value="0" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="FBA头程" path="supportFba">
              <NSwitch v-model:value="model.supportFba" :checked-value="1" :unchecked-value="0" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="自提" path="supportSelfPickup">
              <NSwitch v-model:value="model.supportSelfPickup" :checked-value="1" :unchecked-value="0" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="支持预约" path="supportAppointment">
              <NSwitch v-model:value="model.supportAppointment" :checked-value="1" :unchecked-value="0" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="PDA" path="pdaEnabled">
              <NSwitch v-model:value="model.pdaEnabled" :checked-value="1" :unchecked-value="0" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="API对接" path="apiEnabled">
              <NSwitch v-model:value="model.apiEnabled" :checked-value="1" :unchecked-value="0" />
            </NFormItem>
          </NGridItem>
        </NGrid>

        <!-- 仓库能力 -->
        <NDivider title-placement="left">仓库能力</NDivider>
        <NGrid :cols="2" x-gap="16">
          <NGridItem>
            <NFormItem label="最大容量(CBM)" path="maxCapacityCbm">
              <NInputNumber v-model:value="model.maxCapacityCbm" :min="0" placeholder="最大容量（可选）" class="w-full" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="日卸柜量(柜)" path="dailyUnloadingCap">
              <NInputNumber v-model:value="model.dailyUnloadingCap" :min="0" placeholder="日卸柜上限（可选）" class="w-full" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="日出库量(单)" path="dailyOutboundCap">
              <NInputNumber v-model:value="model.dailyOutboundCap" :min="0" placeholder="日出库上限（可选）" class="w-full" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="月台数" path="dockCount">
              <NInputNumber v-model:value="model.dockCount" :min="0" class="w-full" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="仓门数" path="doorCount">
              <NInputNumber v-model:value="model.doorCount" :min="0" class="w-full" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="叉车数" path="forkliftCount">
              <NInputNumber v-model:value="model.forkliftCount" :min="0" class="w-full" />
            </NFormItem>
          </NGridItem>
        </NGrid>

        <!-- 备注 -->
        <NDivider title-placement="left">备注</NDivider>
        <NFormItem label="备注" path="remark">
          <NInput v-model:value="model.remark" type="textarea" placeholder="备注（可选）" :rows="2" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace :size="16">
          <NButton @click="closeDrawer">取消</NButton>
          <NButton type="primary" @click="handleSubmit">确定</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>
