<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { fetchCreateSku, fetchUpdateSku } from '@/service/api/base/sku';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';

defineOptions({ name: 'SkuOperateDrawer' });

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Base.MdmSku | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const title = computed(() => (props.operateType === 'add' ? '新增SKU' : '编辑SKU'));

type Model = Api.Base.MdmSkuOperateParams;

const model = ref<any>(createDefaultModel());

function createDefaultModel(): Model {
  return {
    id: null,
    clientId: null,
    skuCode: null,
    skuName: null,
    skuNameEn: null,
    barcode: null,
    brand: null,
    model: null,
    color: null,
    sizeSpec: null,
    unit: 'pcs',
    lengthCm: null,
    widthCm: null,
    heightCm: null,
    weightKg: null,
    packageLengthCm: null,
    packageWidthCm: null,
    packageHeightCm: null,
    packageWeightKg: null,
    isFragile: 0,
    isLiquid: 0,
    isBattery: 0,
    isMagnetic: 0,
    isDangerous: 0,
    isOversize: 0,
    defaultPkgId: null,
    defaultFeeCodes: null,
    declaredNameCn: null,
    declaredNameEn: null,
    hsCode: null,
    declaredValue: null,
    declaredCurrency: null,
    originCountryCode: null,
    imageUrl: null,
    status: '0',
    remark: null
  };
}

type RuleKey = 'clientId' | 'skuCode' | 'skuName';

const rules: Record<RuleKey, App.Global.FormRule> = {
  clientId: createRequiredRule('所属客户不能为空'),
  skuCode:  createRequiredRule('SKU编码不能为空'),
  skuName:  createRequiredRule('SKU名称不能为空')
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
    const { error } = await fetchCreateSku(model.value);
    if (error) return;
    window.$message?.success('新增成功');
  }
  if (props.operateType === 'edit') {
    const { error } = await fetchUpdateSku(model.value);
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
  <NDrawer v-model:show="visible" :title="title" display-directive="show" :width="760" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="110">

        <!-- 基础信息 -->
        <NDivider title-placement="left">基础信息</NDivider>
        <NGrid :cols="2" x-gap="16">
          <NGridItem>
            <NFormItem label="所属客户" path="clientId">
              <!-- TODO: 客户模块建成后替换为远程搜索选择器 -->
              <NInputNumber v-model:value="model.clientId" placeholder="客户ID（临时）" class="w-full" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="SKU编码" path="skuCode">
              <NInput
                v-model:value="model.skuCode"
                placeholder="如：PROD-001（新增后不可修改）"
                :disabled="operateType === 'edit'"
              />
            </NFormItem>
          </NGridItem>
          <NGridItem :span="2">
            <NFormItem label="SKU名称" path="skuName">
              <NInput v-model:value="model.skuName" placeholder="商品中文名称" />
            </NFormItem>
          </NGridItem>
          <NGridItem :span="2">
            <NFormItem label="英文名称" path="skuNameEn">
              <NInput v-model:value="model.skuNameEn" placeholder="商品英文名称（可选）" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="条形码" path="barcode">
              <NInput v-model:value="model.barcode" placeholder="UPC / EAN（可选）" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="计量单位" path="unit">
              <NInput v-model:value="model.unit" placeholder="如：pcs / box" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="品牌" path="brand">
              <NInput v-model:value="model.brand" placeholder="品牌（可选）" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="型号" path="model">
              <NInput v-model:value="model.model" placeholder="型号（可选）" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="颜色" path="color">
              <NInput v-model:value="model.color" placeholder="颜色（可选）" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="尺寸规格" path="sizeSpec">
              <NInput v-model:value="model.sizeSpec" placeholder="如：L / XL（可选）" />
            </NFormItem>
          </NGridItem>
        </NGrid>
        <NFormItem label="状态" path="status">
          <NRadioGroup v-model:value="model.status">
            <NRadio value="0">正常</NRadio>
            <NRadio value="1">禁用</NRadio>
          </NRadioGroup>
        </NFormItem>

        <!-- 尺寸重量 -->
        <NDivider title-placement="left">尺寸 & 重量</NDivider>
        <NGrid :cols="3" x-gap="16">
          <NGridItem>
            <NFormItem label="长(cm)" path="lengthCm">
              <NInputNumber v-model:value="model.lengthCm" :min="0" :precision="2" placeholder="长" class="w-full" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="宽(cm)" path="widthCm">
              <NInputNumber v-model:value="model.widthCm" :min="0" :precision="2" placeholder="宽" class="w-full" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="高(cm)" path="heightCm">
              <NInputNumber v-model:value="model.heightCm" :min="0" :precision="2" placeholder="高" class="w-full" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="重量(kg)" path="weightKg">
              <NInputNumber v-model:value="model.weightKg" :min="0" :precision="3" placeholder="重量" class="w-full" />
            </NFormItem>
          </NGridItem>
        </NGrid>
        <p class="text-gray-400 text-12px mt-4px mb-12px">* 体积(CBM)由系统根据长×宽×高自动计算</p>

        <!-- 外箱规格 -->
        <NDivider title-placement="left">外箱规格</NDivider>
        <NGrid :cols="3" x-gap="16">
          <NGridItem>
            <NFormItem label="外箱长(cm)" path="packageLengthCm">
              <NInputNumber v-model:value="model.packageLengthCm" :min="0" :precision="2" placeholder="外箱长" class="w-full" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="外箱宽(cm)" path="packageWidthCm">
              <NInputNumber v-model:value="model.packageWidthCm" :min="0" :precision="2" placeholder="外箱宽" class="w-full" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="外箱高(cm)" path="packageHeightCm">
              <NInputNumber v-model:value="model.packageHeightCm" :min="0" :precision="2" placeholder="外箱高" class="w-full" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="外箱重(kg)" path="packageWeightKg">
              <NInputNumber v-model:value="model.packageWeightKg" :min="0" :precision="3" placeholder="外箱重" class="w-full" />
            </NFormItem>
          </NGridItem>
        </NGrid>

        <!-- 物流属性 -->
        <NDivider title-placement="left">物流属性</NDivider>
        <NGrid :cols="3" x-gap="16">
          <NGridItem>
            <NFormItem label="易碎" path="isFragile">
              <NSwitch v-model:value="model.isFragile" :checked-value="1" :unchecked-value="0" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="液体" path="isLiquid">
              <NSwitch v-model:value="model.isLiquid" :checked-value="1" :unchecked-value="0" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="含电池" path="isBattery">
              <NSwitch v-model:value="model.isBattery" :checked-value="1" :unchecked-value="0" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="带磁" path="isMagnetic">
              <NSwitch v-model:value="model.isMagnetic" :checked-value="1" :unchecked-value="0" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="危险品" path="isDangerous">
              <NSwitch v-model:value="model.isDangerous" :checked-value="1" :unchecked-value="0" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="超大件" path="isOversize">
              <NSwitch v-model:value="model.isOversize" :checked-value="1" :unchecked-value="0" />
            </NFormItem>
          </NGridItem>
        </NGrid>

        <!-- 申报信息 -->
        <NDivider title-placement="left">申报信息</NDivider>
        <NGrid :cols="2" x-gap="16">
          <NGridItem>
            <NFormItem label="申报品名(中)" path="declaredNameCn">
              <NInput v-model:value="model.declaredNameCn" placeholder="海关申报中文名（可选）" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="申报品名(英)" path="declaredNameEn">
              <NInput v-model:value="model.declaredNameEn" placeholder="海关申报英文名（可选）" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="HS编码" path="hsCode">
              <NInput v-model:value="model.hsCode" placeholder="HS Code（可选）" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="原产国" path="originCountryCode">
              <NInput v-model:value="model.originCountryCode" placeholder="如：CN / US（可选）" style="text-transform: uppercase" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="申报价值" path="declaredValue">
              <NInputNumber v-model:value="model.declaredValue" :min="0" :precision="2" placeholder="申报价值（可选）" class="w-full" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="申报货币" path="declaredCurrency">
              <NInput v-model:value="model.declaredCurrency" placeholder="如：USD / CNY（可选）" style="text-transform: uppercase" />
            </NFormItem>
          </NGridItem>
        </NGrid>

        <!-- 图片与备注 -->
        <NDivider title-placement="left">图片 & 备注</NDivider>
        <NFormItem label="商品图片URL" path="imageUrl">
          <NInput v-model:value="model.imageUrl" placeholder="商品主图链接（可选）" />
        </NFormItem>
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
