<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
  NStep,
  NSteps,
  NTag
} from 'naive-ui';
import { BATCH_PRINT_SCENES } from '../constants';

defineOptions({ name: 'PrintBatch' });

const route = useRoute();
const currentStep = ref(1);

const sceneOptions = BATCH_PRINT_SCENES.map(s => ({ label: s.label, value: s.key }));

const form = ref({
  scene: (route.query.scene as string) || 'container_pallet',
  sourceNo: '',
  templateName: '',
  printerName: '',
  printQty: 1,
  previewCount: 0,
  successCount: 0,
  failCount: 0
});

const activeScene = computed(() => BATCH_PRINT_SCENES.find(s => s.key === form.value.scene));

const previewColumns = [
  { title: '序号', key: 'id', width: 60 },
  { title: '来源单号', key: 'sourceNo' },
  { title: '状态', key: 'status' }
];

const previewRows = computed(() => {
  const n = form.value.previewCount || 0;
  return Array.from({ length: Math.min(n, 8) }, (_, i) => ({
    id: i + 1,
    sourceNo: `${form.value.sourceNo || 'SRC'}-${String(i + 1).padStart(3, '0')}`,
    status: '待打印'
  }));
});

function protoMsg(msg: string) {
  window.$message?.info(`[原型] ${msg}`);
}

function nextStep() {
  if (currentStep.value === 1 && !form.value.sourceNo) {
    window.$message?.warning(`请输入${activeScene.value?.sourceLabel || '来源单号'}`);
    return;
  }
  if (currentStep.value === 2) {
    form.value.previewCount = Math.floor(Math.random() * 20) + 5;
  }
  if (currentStep.value < 4) currentStep.value += 1;
}

function prevStep() {
  if (currentStep.value > 1) currentStep.value -= 1;
}

function confirmPrint() {
  const total = form.value.previewCount || form.value.printQty;
  form.value.successCount = total - 1;
  form.value.failCount = 1;
  currentStep.value = 4;
  protoMsg(`批量打印已提交：${activeScene.value?.label}，共 ${total} 份`);
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-auto">
    <NAlert type="info" :bordered="false">
      批量打印适用于拆柜、入库、装车等高频现场操作。系统按场景读取业务数据，逐条生成打印任务并记录每张单据状态。
    </NAlert>

    <NCard title="批量打印向导" :bordered="false" size="small" class="card-wrapper">
      <NSteps :current="currentStep" class="mb-24px">
        <NStep title="选择场景" description="海柜/车次/订单等" />
        <NStep title="读取数据" description="按规则汇总待打印单据" />
        <NStep title="确认模板与打印机" />
        <NStep title="执行打印" description="逐条记录成功/失败" />
      </NSteps>

      <NForm label-placement="left" label-width="128">
        <template v-if="currentStep === 1">
          <NFormItem label="批量场景">
            <NSelect v-model:value="form.scene" :options="sceneOptions" class="w-320px" />
          </NFormItem>
          <NFormItem v-if="activeScene" label="数据规则">
            <NTag type="info">{{ activeScene.dataRule }}</NTag>
          </NFormItem>
          <NFormItem :label="activeScene?.sourceLabel || '来源单号'">
            <NInput
              v-model:value="form.sourceNo"
              :placeholder="activeScene?.sourcePlaceholder"
              class="w-400px"
            />
          </NFormItem>
        </template>

        <template v-if="currentStep === 2">
          <NFormItem label="读取结果">
            <NSpace>
              <NTag type="info">已匹配 {{ form.previewCount || '—' }} 条待打印</NTag>
              <NTag>单据类型：{{ activeScene?.docType }}</NTag>
            </NSpace>
          </NFormItem>
          <NFormItem label="预览明细">
            <NDataTable
              size="small"
              :columns="previewColumns"
              :data="previewRows"
              :max-height="200"
            />
          </NFormItem>
        </template>

        <template v-if="currentStep === 3">
          <NFormItem label="打印模板">
            <NSelect
              v-model:value="form.templateName"
              :options="[
                { label: 'Anker 高货值卡板贴', value: 'Anker 高货值卡板贴' },
                { label: '标准卡板贴（FOREST）', value: '标准卡板贴（FOREST）' },
                { label: '40/45尺海柜拆柜单', value: '40/45尺海柜拆柜单' },
                { label: '海柜费用发票（标准）', value: '海柜费用发票（标准）' }
              ]"
              placeholder="选择模板（可由打印规则自动推荐）"
              class="w-320px"
            />
          </NFormItem>
          <NFormItem label="打印机">
            <NSelect
              v-model:value="form.printerName"
              :options="[
                { label: '贵品区标签打印机', value: '贵品区标签打印机' },
                { label: 'DOCK-01 标签机', value: 'DOCK-01 标签机' },
                { label: '办公室 A4 打印机', value: '办公室 A4 打印机' }
              ]"
              placeholder="选择打印机"
              class="w-320px"
            />
          </NFormItem>
          <NFormItem label="每单份数">
            <NInputNumber v-model:value="form.printQty" :min="1" :max="10" />
          </NFormItem>
        </template>

        <template v-if="currentStep === 4">
          <NFormItem label="执行结果">
            <NSpace vertical>
              <NTag type="success">批量任务已创建</NTag>
              <NSpace>
                <NTag type="success">成功 {{ form.successCount }}</NTag>
                <NTag type="error">失败 {{ form.failCount }}</NTag>
              </NSpace>
              <span class="text-sm text-gray-500">
                可在「打印任务」「打印记录」查看逐条状态；失败项支持重打与更换打印机
              </span>
            </NSpace>
          </NFormItem>
        </template>

        <NFormItem>
          <NSpace>
            <NButton v-if="currentStep > 1 && currentStep < 4" @click="prevStep">上一步</NButton>
            <NButton v-if="currentStep < 3" type="primary" @click="nextStep">下一步</NButton>
            <NButton v-if="currentStep === 3" type="primary" @click="confirmPrint">确认批量打印</NButton>
          </NSpace>
        </NFormItem>
      </NForm>
    </NCard>
  </div>
</template>
