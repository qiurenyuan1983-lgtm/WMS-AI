<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { fetchBatchGenerateWmsLocations } from '@/service/api/wms';

const visible = defineModel<boolean>('visible', { default: false });

const props = defineProps<{
  warehouseId: CommonType.IdType | null;
  zoneOptions: CommonType.Option[];
}>();

const emit = defineEmits<{ (e: 'submitted', count: number): void }>();

const form = ref<Api.Wms.LocationBatchGenerateParams>({
  warehouseId: null as any,
  zoneId: null as any,
  prefix: 'L-',
  rowFrom: 1,
  rowTo: 5,
  capacity: 30,
  purpose: 'GENERAL',
  status: 'EMPTY'
});

const generateCount = computed(() => {
  return Math.max(0, (form.value.rowTo ?? 0) - (form.value.rowFrom ?? 0) + 1);
});

const codePreview = computed(() => {
  const prefix = form.value.prefix || '';
  const r = String(form.value.rowFrom ?? 1).padStart(2, '0');
  const r2 = String(form.value.rowTo ?? 1).padStart(2, '0');
  return `${prefix}${r} … ${prefix}${r2}`;
});

function syncPrefixFromZone(zoneId: CommonType.IdType | null) {
  const zone = props.zoneOptions.find(z => String(z.value) === String(zoneId));
  if (!zone) return;
  const label = String(zone.label);
  const match = label.match(/^([A-Za-z0-9]+)/);
  if (match) form.value.prefix = match[1];
}

watch(visible, open => {
  if (!open) return;
  form.value.warehouseId = props.warehouseId as CommonType.IdType;
  form.value.zoneId = (props.zoneOptions[0]?.value as CommonType.IdType) ?? null;
  syncPrefixFromZone(form.value.zoneId);
});

watch(
  () => form.value.zoneId,
  zoneId => syncPrefixFromZone(zoneId)
);

watch(
  () => form.value.rowFrom,
  v => {
    if (v != null && form.value.rowTo != null && v > form.value.rowTo) {
      form.value.rowTo = v;
    }
  }
);

async function handleSubmit() {
  if (!form.value.zoneId) {
    window.$message?.warning('请选择库区');
    return;
  }
  if (!form.value.prefix?.trim()) {
    window.$message?.warning('请输入库位编码');
    return;
  }
  if (generateCount.value <= 0) {
    window.$message?.warning('请填写有效的行号范围');
    return;
  }
  const { data, error } = await fetchBatchGenerateWmsLocations(form.value);
  if (error) return;
  const count = data?.length ?? 0;
  window.$message?.success(`已生成 ${count} 个库位`);
  visible.value = false;
  emit('submitted', count);
}
</script>

<template>
  <NModal v-model:show="visible" preset="card" title="批量生成库位" class="w-600px">
    <NForm label-placement="left" label-width="88" size="small">
      <NFormItem label="所属库区" required>
        <NSelect v-model:value="form.zoneId" :options="zoneOptions" placeholder="请选择库区" />
      </NFormItem>
      <NFormItem label="库位编码" required>
        <NInput v-model:value="form.prefix" placeholder="如 F、L-，与行号拼接为 F01" clearable />
        <div class="mt-4px text-12px text-#9ca3af">编码 + 行号自动生成，示例：{{ codePreview }}</div>
      </NFormItem>

      <NFormItem label="生成范围">
        <div class="range-panel">
          <div class="range-row">
            <span class="range-dim">行号</span>
            <span class="range-from">从</span>
            <NInputNumber v-model:value="form.rowFrom" :min="1" :show-button="false" placeholder="起始行" class="range-input" />
            <span class="range-to">至</span>
            <NInputNumber
              v-model:value="form.rowTo"
              :min="form.rowFrom ?? 1"
              :show-button="false"
              placeholder="结束行"
              class="range-input"
            />
          </div>
          <div class="range-preview">
            <span>预计生成 <strong>{{ generateCount }}</strong> 个库位</span>
          </div>
        </div>
      </NFormItem>

      <NFormItem label="默认容量">
        <NInputNumber v-model:value="form.capacity" class="w-full" :min="1" />
      </NFormItem>
      <NFormItem label="用途">
        <DictSelect v-model:value="form.purpose" dict-code="wms_location_purpose" />
      </NFormItem>
      <NFormItem label="初始状态">
        <DictSelect v-model:value="form.status" dict-code="wms_location_status" />
      </NFormItem>
    </NForm>
    <template #footer>
      <div class="flex justify-end gap-12px">
        <NButton @click="visible = false">取消</NButton>
        <NButton type="primary" :disabled="generateCount <= 0" @click="handleSubmit">
          生成 {{ generateCount }} 个库位
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped lang="scss">
.range-panel {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  background: rgb(var(--container-bg-color));
  border: 1px solid var(--n-border-color);
}

.range-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.range-dim {
  flex-shrink: 0;
  width: 32px;
  font-size: 13px;
  font-weight: 600;
  color: var(--n-text-color);
}

.range-from,
.range-to {
  flex-shrink: 0;
  font-size: 13px;
  color: #6b7280;
}

.range-input {
  flex: 1;
  min-width: 0;
}

.range-preview {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--n-border-color);
  font-size: 12px;
  color: #6b7280;

  strong {
    color: rgb(var(--primary-color));
    font-size: 14px;
  }
}
</style>
