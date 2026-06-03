<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  NButton, NCard, NDatePicker, NForm, NFormItem,
  NInput, NSelect
} from 'naive-ui';
import type { FormInst, FormRules } from 'naive-ui';
import { fetchCreateTask } from '@/service/api/yms/dispatch';
import { fetchGetWarehouseList } from '@/service/api/base';
import { YMS_ROUTE, ymsTo } from '../shared/yms-route';

defineOptions({ name: 'YmsDispatchCreate' });

const router = useRouter();

// ─── 仓库选项 ────────────────────────────────────────────────────────

const warehouseOptions = ref<{ label: string; value: CommonType.IdType }[]>([]);

async function loadWarehouses() {
  const { data } = await fetchGetWarehouseList({ pageNum: 1, pageSize: 200 } as any);
  const rows = (data as any)?.rows ?? (Array.isArray(data) ? data : []);
  warehouseOptions.value = rows.map((w: any) => ({ label: w.warehouseName, value: w.id }));
}

// ─── 表单 ────────────────────────────────────────────────────────────

const formRef = ref<FormInst | null>(null);
const submitting = ref(false);

type FormModel = {
  taskType: Api.Yms.TaskType | null;
  warehouseId: CommonType.IdType | null;
  containerNo: string | null;
  truckNo: string | null;
  driverName: string | null;
  driverPhone: string | null;
  etaYardTime: number | null;
  remark: string | null;
};

const model = ref<FormModel>({
  taskType: null,
  warehouseId: null,
  containerNo: null,
  truckNo: null,
  driverName: null,
  driverPhone: null,
  etaYardTime: null,
  remark: null,
});

const TASK_TYPE_OPTIONS = [
  { label: '卸柜任务', value: 'DEVANNING' },
  { label: '派送装车', value: 'DELIVERY_LOADING' },
  { label: '调拨装车', value: 'TRANSFER_LOADING' },
  { label: '自提装车', value: 'PICKUP_LOADING' },
  { label: '退货装车', value: 'RETURN_LOADING' },
  { label: '其他', value: 'OTHER' },
];

const rules: FormRules = {
  taskType: [{ required: true, message: '请选择任务类型', trigger: ['change', 'blur'] }],
  warehouseId: [{ required: true, message: '请选择仓库', trigger: ['change', 'blur'] }],
};

async function handleSubmit() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  submitting.value = true;
  const { error } = await fetchCreateTask({
    taskType: model.value.taskType!,
    warehouseId: model.value.warehouseId!,
    sourceOrderType: 'MANUAL',
    containerNo: model.value.containerNo || null,
    truckNo: model.value.truckNo || null,
    driverName: model.value.driverName || null,
    driverPhone: model.value.driverPhone || null,
    etaYardTime: model.value.etaYardTime
      ? new Date(model.value.etaYardTime).toISOString().slice(0, 19).replace('T', ' ')
      : null,
    remark: model.value.remark || null,
  });
  submitting.value = false;

  if (!error) {
    window.$message?.success('任务创建成功');
    router.push(ymsTo(YMS_ROUTE.dispatch));
  }
}

function handleReset() {
  model.value = {
    taskType: null, warehouseId: null, containerNo: null,
    truckNo: null, driverName: null, driverPhone: null,
    etaYardTime: null, remark: null,
  };
  formRef.value?.restoreValidation();
}

onMounted(loadWarehouses);
</script>

<template>
  <div class="h-full flex flex-col gap-12px overflow-y-auto">

    <!-- 顶部导航 -->
    <div class="flex items-center gap-8px">
      <NButton size="small" quaternary @click="router.push(ymsTo(YMS_ROUTE.dispatch))">
        ← 返回总览
      </NButton>
      <span class="text-gray-400">/</span>
      <span class="text-gray-600 text-14px">新建园区任务</span>
    </div>

    <NCard :bordered="false" class="card-wrapper max-w-720px">
      <div class="mb-16px">
        <div class="text-16px font-semibold text-gray-800">新建手动任务</div>
        <div class="text-12px text-gray-400 mt-2px">
          用于登记计划外到仓车辆，系统将自动创建园区调度任务
        </div>
      </div>

      <NForm
        ref="formRef"
        :model="model"
        :rules="rules"
        label-placement="left"
        :label-width="90"
        require-mark-placement="right-hanging"
      >
        <!-- 基础信息 -->
        <div class="form-section-title">基础信息</div>

        <NFormItem label="任务类型" path="taskType">
          <NSelect
            v-model:value="model.taskType"
            :options="TASK_TYPE_OPTIONS"
            placeholder="请选择任务类型"
            class="w-240px"
          />
        </NFormItem>

        <NFormItem label="仓库" path="warehouseId">
          <NSelect
            v-model:value="model.warehouseId"
            :options="warehouseOptions"
            filterable
            placeholder="请选择仓库"
            class="w-240px"
          />
        </NFormItem>

        <!-- 车辆信息 -->
        <div class="form-section-title mt-16px">车辆信息</div>

        <NFormItem label="柜号">
          <NInput
            v-model:value="model.containerNo"
            placeholder="海运柜号（选填）"
            clearable
            class="w-240px"
          />
        </NFormItem>

        <NFormItem label="车牌号">
          <NInput
            v-model:value="model.truckNo"
            placeholder="车牌号码（选填）"
            clearable
            class="w-240px"
          />
        </NFormItem>

        <NFormItem label="司机姓名">
          <NInput
            v-model:value="model.driverName"
            placeholder="选填"
            clearable
            class="w-200px"
          />
        </NFormItem>

        <NFormItem label="司机电话">
          <NInput
            v-model:value="model.driverPhone"
            placeholder="选填"
            clearable
            class="w-200px"
          />
        </NFormItem>

        <!-- 时间与备注 -->
        <div class="form-section-title mt-16px">其他信息</div>

        <NFormItem label="预计到仓">
          <NDatePicker
            v-model:value="model.etaYardTime"
            type="datetime"
            clearable
            placeholder="选填"
            class="w-240px"
          />
        </NFormItem>

        <NFormItem label="备注">
          <NInput
            v-model:value="model.remark"
            type="textarea"
            placeholder="选填"
            :rows="3"
            class="w-360px"
          />
        </NFormItem>
      </NForm>

      <!-- 操作按钮 -->
      <div class="flex items-center gap-12px mt-8px border-t border-gray-100 pt-16px">
        <NButton
          type="primary"
          :loading="submitting"
          @click="handleSubmit"
        >
          创建任务
        </NButton>
        <NButton @click="handleReset">重置</NButton>
        <NButton quaternary @click="router.push(ymsTo(YMS_ROUTE.dispatch))">取消</NButton>
      </div>
    </NCard>

  </div>
</template>

<style scoped>
.form-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f3f4f6;
}
</style>
