<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { fetchGetWarehouseList } from '@/service/api/base';
import { fetchGateCheckOut, fetchLookupCheckOut } from '@/service/api/yms/gate';
import GatePhotoUpload from '../../gate/modules/gate-photo-upload.vue';

const emit = defineEmits<{
  (e: 'looked-up', result: Api.Yms.CheckOut): void;
  (e: 'checked-out', result: Api.Yms.CheckOut): void;
}>();

const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

const warehouseOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);
const lookupLoading = ref(false);
const submitLoading = ref(false);
const preview = ref<Api.Yms.CheckOut | null>(null);

const model = ref<Api.Yms.CheckOutParams>({
  warehouseId: null as any,
  keyword: '',
  confirmed: false,
  plateNo: null,
  driverName: null,
  driverPhone: null,
  idCardNo: null,
  photoUrls: null,
  remark: null
});

const rules = {
  warehouseId: [defaultRequiredRule],
  keyword: [defaultRequiredRule]
};

async function loadWarehouses() {
  const { data } = await fetchGetWarehouseList({ pageNum: 1, pageSize: 200 } as any);
  const rows = (data as any)?.rows ?? [];
  warehouseOptions.value = rows.map((w: any) => ({ label: w.warehouseName, value: w.id }));
  if (!model.value.warehouseId && warehouseOptions.value.length) {
    model.value.warehouseId = warehouseOptions.value[0].value as any;
  }
}

onMounted(() => {
  loadWarehouses();
});

watch(
  () => model.value.keyword,
  () => {
    preview.value = null;
  }
);

async function handleLookup() {
  await validate();
  lookupLoading.value = true;
  try {
    const { data, error } = await fetchLookupCheckOut(model.value.warehouseId, model.value.keyword.trim());
    if (!error && data) {
      preview.value = data;
      if (!model.value.plateNo) {
        model.value.plateNo = data.gateInPlateNo ?? data.plateNo ?? null;
      }
      emit('looked-up', data);
    }
  } finally {
    lookupLoading.value = false;
  }
}

async function handleCheckOut(confirmed = false) {
  submitLoading.value = true;
  try {
    const { data, error } = await fetchGateCheckOut({
      ...model.value,
      keyword: model.value.keyword.trim(),
      confirmed
    });
    if (!error && data) {
      preview.value = data;
      if (data.checkOutResult === 'PASSED' && data.gateOutTime) {
        emit('checked-out', data);
        window.$message?.success('离场办理成功');
        model.value.keyword = '';
        model.value.plateNo = null;
        model.value.driverName = null;
        model.value.driverPhone = null;
        model.value.idCardNo = null;
        model.value.photoUrls = null;
        model.value.remark = null;
        model.value.confirmed = false;
        restoreValidation();
      } else if (data.checkOutResult === 'PENDING') {
        emit('looked-up', data);
      }
    }
  } finally {
    submitLoading.value = false;
  }
}

function onConfirmFromCard(confirmed: boolean) {
  handleCheckOut(confirmed);
}

defineExpose({ onConfirmFromCard });
</script>

<template>
  <NCard title="Check-out 离场" :bordered="false" class="card-wrapper">
    <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="90">
      <NFormItem label="仓库" path="warehouseId">
        <NSelect v-model:value="model.warehouseId" :options="warehouseOptions" filterable placeholder="请选择仓库" />
      </NFormItem>
      <NFormItem label="车牌/柜号/车厢号" path="keyword">
        <NInput
          v-model:value="model.keyword"
          size="large"
          placeholder="输入车牌号 / 柜号 / 车厢号"
          clearable
          @keyup.enter="handleLookup"
        />
      </NFormItem>
      <NGrid :cols="2" :x-gap="16">
        <NGi>
          <NFormItem label="离场车牌" path="plateNo">
            <NInput v-model:value="model.plateNo" placeholder="空柜提走等可填新车牌" clearable />
          </NFormItem>
        </NGi>
        <NGi>
          <NFormItem label="司机姓名" path="driverName">
            <NInput v-model:value="model.driverName" placeholder="离场司机" clearable />
          </NFormItem>
        </NGi>
        <NGi>
          <NFormItem label="司机电话" path="driverPhone">
            <NInput v-model:value="model.driverPhone" placeholder="用于黑名单校验" clearable />
          </NFormItem>
        </NGi>
        <NGi>
          <NFormItem label="身份证号" path="idCardNo">
            <NInput v-model:value="model.idCardNo" placeholder="可选" clearable />
          </NFormItem>
        </NGi>
      </NGrid>
      <NFormItem label="离场照片" path="photoUrls">
        <GatePhotoUpload v-model:value="model.photoUrls" />
      </NFormItem>
      <NFormItem label="备注" path="remark">
        <NInput v-model:value="model.remark" placeholder="可选" clearable />
      </NFormItem>
    </NForm>
    <div class="mt-16px flex justify-end gap-8px">
      <NButton :loading="lookupLoading" size="large" @click="handleLookup">查询匹配</NButton>
      <NButton
        v-if="preview?.checkOutResult === 'PASSED' && !preview?.gateOutTime"
        type="primary"
        :loading="submitLoading"
        size="large"
        @click="handleCheckOut(false)"
      >
        办理离场
      </NButton>
    </div>
  </NCard>
</template>
