<script setup lang="tsx">
import { computed, ref, watch } from 'vue';
import { NTag } from 'naive-ui';
import { useDict } from '@/hooks/business/dict';
import { useAuth } from '@/hooks/business/auth';
import {
  fetchGetYardInventoryDetail,
  fetchScanYardInventoryItem
} from '@/service/api/yms/yard-inventory';

interface Props {
  taskId?: CommonType.IdType | null;
  readonly?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'submitted'): void }>();
const visible = defineModel<boolean>('visible', { default: false });

const { hasAuth } = useAuth();
const { record: scanStatusRecord } = useDict('yms_inventory_scan_status');
const { record: diffTypeRecord } = useDict('yms_inventory_diff_type');

const loading = ref(false);
const task = ref<Api.Yms.YardInventoryTask | null>(null);
const scanForm = ref({
  objectNo: '',
  actualPositionCode: '',
  remark: ''
});

const canScan = computed(
  () => !props.readonly && hasAuth('yms:inventory:execute') && task.value?.status === 'IN_PROGRESS'
);

const SCAN_TAG: Record<string, NaiveUI.ThemeColor> = {
  PENDING: 'default',
  SCANNED: 'success',
  MISSING: 'error',
  EXTRA: 'warning'
};

const itemColumns = computed(() => [
  { key: 'objectNo', title: '对象编号', width: 130 },
  { key: 'objectType', title: '类型', width: 80 },
  { key: 'systemPositionCode', title: '系统位置', width: 100 },
  { key: 'actualPositionCode', title: '实盘位置', width: 100 },
  {
    key: 'scanStatus',
    title: '扫码状态',
    width: 90,
    render: (row: Api.Yms.YardInventoryItem) => (
      <NTag size="small" type={SCAN_TAG[row.scanStatus] ?? 'default'}>
        {scanStatusRecord.value[row.scanStatus]?.dictLabel ?? row.scanStatus}
      </NTag>
    )
  },
  {
    key: 'diffType',
    title: '差异',
    width: 100,
    render: (row: Api.Yms.YardInventoryItem) =>
      row.diffType ? (
        <NTag size="small" type="warning">
          {diffTypeRecord.value[row.diffType]?.dictLabel ?? row.diffType}
        </NTag>
      ) : (
        '—'
      )
  }
]);

async function loadDetail() {
  if (!props.taskId) return;
  loading.value = true;
  const { data } = await fetchGetYardInventoryDetail(props.taskId);
  task.value = data ?? null;
  loading.value = false;
}

async function handleScan() {
  if (!task.value || !scanForm.value.objectNo.trim()) {
    window.$message?.warning('请输入柜号/车厢号');
    return;
  }
  const { error } = await fetchScanYardInventoryItem({
    inventoryId: task.value.id,
    objectNo: scanForm.value.objectNo.trim(),
    actualPositionCode: scanForm.value.actualPositionCode || undefined,
    remark: scanForm.value.remark || undefined
  });
  if (!error) {
    window.$message?.success('扫码成功');
    scanForm.value = { objectNo: '', actualPositionCode: '', remark: '' };
    await loadDetail();
    emit('submitted');
  }
}

watch(visible, val => {
  if (val) {
    scanForm.value = { objectNo: '', actualPositionCode: '', remark: '' };
    loadDetail();
  }
});

watch(
  () => props.taskId,
  () => {
    if (visible.value) loadDetail();
  }
);
</script>

<template>
  <NDrawer v-model:show="visible" :width="640" display-directive="show">
    <NDrawerContent :title="readonly ? '盘点详情' : '扫码盘点'" closable>
      <NSpin :show="loading">
        <template v-if="task">
          <div class="mb-16px grid grid-cols-2 gap-8px text-13px">
            <div><span class="text-gray-500">单号：</span>{{ task.inventoryNo }}</div>
            <div><span class="text-gray-500">状态：</span>{{ task.status }}</div>
            <div><span class="text-gray-500">应盘：</span>{{ task.expectedCount }}</div>
            <div><span class="text-gray-500">实盘：</span>{{ task.actualCount }}</div>
            <div><span class="text-gray-500">差异：</span>{{ task.diffCount }}</div>
            <div><span class="text-gray-500">操作人：</span>{{ task.operatorName ?? '—' }}</div>
          </div>

          <NCard v-if="canScan" size="small" class="mb-16px" title="扫码录入">
            <NForm label-placement="left" :label-width="80">
              <NFormItem label="对象编号">
                <NInput
                  v-model:value="scanForm.objectNo"
                  placeholder="柜号/车厢号"
                  @keyup.enter="handleScan"
                />
              </NFormItem>
              <NFormItem label="实盘位置">
                <NInput v-model:value="scanForm.actualPositionCode" placeholder="位置编码（可选）" />
              </NFormItem>
              <NFormItem label="备注">
                <NInput v-model:value="scanForm.remark" placeholder="备注" />
              </NFormItem>
              <NButton type="primary" @click="handleScan">确认扫码</NButton>
            </NForm>
          </NCard>

          <NDataTable
            size="small"
            :columns="itemColumns"
            :data="task.items ?? []"
            :row-key="(row: Api.Yms.YardInventoryItem) => row.id"
            :max-height="360"
          />
        </template>
      </NSpin>
    </NDrawerContent>
  </NDrawer>
</template>
