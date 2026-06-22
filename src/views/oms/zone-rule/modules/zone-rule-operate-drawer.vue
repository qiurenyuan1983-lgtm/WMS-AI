<script setup lang="tsx">
import { computed, ref, watch } from 'vue';
import {
  NButton,
  NCheckbox,
  NCheckboxGroup,
  NDrawer,
  NDrawerContent,
  NFormItem,
  NInput,
  NInputNumber,
  NRadio,
  NRadioGroup,
  NSelect,
  NSpace
} from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { fetchCreateZoneRule, fetchUpdateZoneRule } from '@/service/api/oms/zone-rule';
import {
  DELIVERY_METHOD_OPTIONS,
  PLATFORM_CODE_OPTIONS,
  PLATFORM_OPTIONS,
  STORAGE_METHOD_OPTIONS,
  TARGET_TYPE_OPTIONS,
  ZONE_AREA_OPTIONS,
  ZONE_TYPE_OPTIONS,
  buildLocationOptions,
  filterOptionsByKeyword,
  filterPlatformCodeOption,
  formatLocationTags,
  formatPlatformCodes,
  parseLocationTags,
  parsePlatformCodes
} from '../constants';

defineOptions({ name: 'ZoneRuleOperateDrawer' });

type ConditionFormRow = Omit<Api.Oms.ZoneRuleCondition, 'platformCode'> & {
  platformCodes: string[];
};

const props = defineProps<{
  row: Api.Oms.ZoneRule | null;
  mode?: 'create' | 'edit';
}>();

const visible = defineModel<boolean>('visible', { default: false });
const emit = defineEmits<{ (e: 'submitted'): void }>();

const submitting = ref(false);
const targetType = ref<Api.Oms.ZoneRuleTargetType>('LOCATION');
const conditionLogic = ref<Api.Oms.ZoneRuleConditionLogic>('OR');
const zoneName = ref('B区');
const locationKeyword = ref('');
const selectedLocations = ref<string[]>([]);
const zoneType = ref<string | null>(null);
const storageMethod = ref<string | null>(null);
const conditions = ref<ConditionFormRow[]>([
  { priority: 1, deliveryMethod: 'PRIVATE_WH', platform: null, platformCodes: [] }
]);

const isEdit = computed(() => props.mode === 'edit' || props.row?.id != null);
const title = computed(() => (isEdit.value ? '编辑规则' : '新增规则'));

const locationOptions = computed(() => buildLocationOptions(zoneName.value));

const filteredLocationOptions = computed(() =>
  filterOptionsByKeyword(locationOptions.value, locationKeyword.value)
);

const targetHint = computed(() => {
  const map: Record<Api.Oms.ZoneRuleTargetType, string> = {
    ZONE: '选择库区后，规则作用于该库区下全部库位。',
    LOCATION: '选择库区与具体库位，可多选。',
    ZONE_TYPE: '按库区类型匹配，如高架、地面、贵品等。',
    STORAGE_METHOD: '按存放方式匹配，如卡板、地板。'
  };
  return map[targetType.value];
});

function toConditionFormRow(condition: Api.Oms.ZoneRuleCondition): ConditionFormRow {
  const { platformCode, ...rest } = condition;
  return {
    ...rest,
    platformCodes: parsePlatformCodes(platformCode)
  };
}

function createEmptyCondition(): ConditionFormRow {
  return { priority: 1, deliveryMethod: 'PRIVATE_WH', platform: null, platformCodes: [] };
}

function resetForm() {
  locationKeyword.value = '';
  if (props.row) {
    targetType.value = props.row.targetType || 'LOCATION';
    conditionLogic.value = props.row.conditionLogic || 'OR';
    zoneName.value = props.row.zoneNames?.split(/[,，]/)[0]?.trim() || 'B区';
    selectedLocations.value = parseLocationTags(zoneName.value, props.row.locationNos);
    zoneType.value = props.row.zoneType ?? null;
    storageMethod.value = props.row.storageMethod ?? null;
    conditions.value = props.row.conditions?.length
      ? props.row.conditions.map(toConditionFormRow)
      : [
          toConditionFormRow({
            priority: props.row.priority,
            deliveryMethod: props.row.deliveryMethod,
            platform: props.row.platform === 'ANY' ? null : props.row.platform,
            platformCode: props.row.platformCode ?? null
          })
        ];
  } else {
    targetType.value = 'LOCATION';
    conditionLogic.value = 'OR';
    zoneName.value = 'B区';
    locationKeyword.value = '';
    selectedLocations.value = [];
    zoneType.value = null;
    storageMethod.value = null;
    conditions.value = [createEmptyCondition()];
  }
}

watch(
  () => [visible.value, props.row, props.mode] as const,
  ([show]) => {
    if (show) resetForm();
  }
);

watch(zoneName, (next, prev) => {
  if (!visible.value || next === prev) return;
  selectedLocations.value = selectedLocations.value
    .map(tag => {
      const code = tag.split('/').pop();
      return code ? `${next}/${code}` : tag;
    })
    .filter(tag => locationOptions.value.some(o => o.value === tag));
});

function selectAllFilteredLocations() {
  const values = filteredLocationOptions.value.map(opt => String(opt.value));
  selectedLocations.value = [...new Set([...selectedLocations.value, ...values])];
}

function clearLocations() {
  selectedLocations.value = [];
}

function addCondition() {
  conditions.value.push(createEmptyCondition());
}

function removeCondition(index: number) {
  if (conditions.value.length <= 1) {
    window.$message?.warning('至少保留一条上架条件');
    return;
  }
  conditions.value.splice(index, 1);
}

function buildPayload(): Api.Oms.ZoneRuleOperateParams {
  const sorted = [...conditions.value].sort((a, b) => a.priority - b.priority);
  const primary = sorted[0];
  let locationNos = '';
  if (targetType.value === 'LOCATION') {
    locationNos = formatLocationTags(selectedLocations.value);
  } else if (targetType.value === 'ZONE') {
    locationNos = '';
  }
  return {
    targetType: targetType.value,
    conditionLogic: conditionLogic.value,
    conditions: sorted.map(c => ({
      priority: c.priority,
      deliveryMethod: c.deliveryMethod,
      platform: c.platform || 'ANY',
      platformCode: formatPlatformCodes(c.platformCodes)
    })),
    zoneNames: zoneName.value,
    locationNos,
    zoneType: targetType.value === 'ZONE_TYPE' ? zoneType.value : null,
    storageMethod: targetType.value === 'STORAGE_METHOD' ? storageMethod.value : null,
    priority: primary.priority,
    deliveryMethod: primary.deliveryMethod,
    platform: primary.platform || 'ANY',
    platformCode: formatPlatformCodes(primary.platformCodes)
  };
}

async function handleSubmit() {
  if (!zoneName.value.trim() && targetType.value !== 'ZONE_TYPE' && targetType.value !== 'STORAGE_METHOD') {
    window.$message?.warning('请选择库区');
    return;
  }
  if (targetType.value === 'LOCATION' && !selectedLocations.value.length) {
    window.$message?.warning('请选择库位');
    return;
  }
  if (targetType.value === 'ZONE_TYPE' && !zoneType.value) {
    window.$message?.warning('请选择库区类型');
    return;
  }
  if (targetType.value === 'STORAGE_METHOD' && !storageMethod.value) {
    window.$message?.warning('请选择存放方式');
    return;
  }
  if (conditions.value.some(c => !c.deliveryMethod)) {
    window.$message?.warning('请完善派送方式');
    return;
  }

  submitting.value = true;
  const payload = buildPayload();
  const { error } = isEdit.value
    ? await fetchUpdateZoneRule({ ...payload, id: props.row!.id })
    : await fetchCreateZoneRule(payload);
  submitting.value = false;
  if (!error) {
    window.$message?.success(isEdit.value ? '已保存' : '已创建');
    visible.value = false;
    emit('submitted');
  }
}
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="1120" class="max-w-98%">
    <NDrawerContent :title="title" :native-scrollbar="true" closable>
    <div class="rule-editor">
      <!-- 左：规则对象 -->
      <div class="rule-editor__panel">
        <div class="panel-title">规则对象</div>
        <p class="panel-hint">以下 4 种方式任选 1 种</p>

        <NRadioGroup v-model:value="targetType" class="target-type-group">
          <NRadio v-for="opt in TARGET_TYPE_OPTIONS" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </NRadio>
        </NRadioGroup>
        <p class="target-desc">{{ targetHint }}</p>

        <NFormItem v-if="targetType === 'ZONE' || targetType === 'LOCATION'" label="库区" required label-placement="top">
          <NSelect :to="POPUP_TO_BODY" v-model:value="zoneName" :options="ZONE_AREA_OPTIONS" />
        </NFormItem>

        <NFormItem v-if="targetType === 'LOCATION'" label="库位" label-placement="top">
          <div class="location-picker">
            <div class="location-picker__toolbar">
              <NInput v-model:value="locationKeyword" clearable size="small" placeholder="搜索库位" />
              <NSpace :size="6">
                <NButton size="tiny" @click="selectAllFilteredLocations">全选</NButton>
                <NButton size="tiny" @click="clearLocations">清空</NButton>
              </NSpace>
            </div>
            <div class="location-picker__meta">
              已选 {{ selectedLocations.length }} / {{ locationOptions.length }}
              <template v-if="locationKeyword.trim()">（筛选 {{ filteredLocationOptions.length }}）</template>
            </div>
            <NCheckboxGroup v-model:value="selectedLocations" class="location-picker__list">
              <NSpace vertical :size="4">
                <NCheckbox
                  v-for="opt in filteredLocationOptions"
                  :key="opt.value"
                  :value="opt.value"
                  :label="opt.label"
                />
              </NSpace>
            </NCheckboxGroup>
          </div>
        </NFormItem>

        <NFormItem v-if="targetType === 'ZONE_TYPE'" label="库区类型" required label-placement="top">
          <NSelect :to="POPUP_TO_BODY" v-model:value="zoneType" :options="ZONE_TYPE_OPTIONS" />
        </NFormItem>

        <NFormItem v-if="targetType === 'STORAGE_METHOD'" label="存放方式" required label-placement="top">
          <NSelect :to="POPUP_TO_BODY" v-model:value="storageMethod" :options="STORAGE_METHOD_OPTIONS" />
        </NFormItem>
      </div>

      <!-- 右：上架条件 -->
      <div class="rule-editor__panel">
        <div class="panel-title">上架条件</div>
        <div class="condition-logic">
          <NRadioGroup v-model:value="conditionLogic" size="small">
            <NRadio value="AND">且</NRadio>
            <NRadio value="OR">或</NRadio>
          </NRadioGroup>
        </div>

        <div class="condition-table">
          <div class="condition-table__head">
            <span class="col-priority">优先级</span>
            <span class="col-delivery">*派送方式</span>
            <span class="col-platform">平台</span>
            <span class="col-code">平台代码</span>
            <span class="col-action">操作</span>
          </div>
          <div v-for="(row, index) in conditions" :key="index" class="condition-table__row">
            <div class="col-priority">
              <NInputNumber v-model:value="row.priority" :min="1" :max="99" size="small" class="w-full" />
            </div>
            <div class="col-delivery">
              <NSelect
                :to="POPUP_TO_BODY"
                v-model:value="row.deliveryMethod"
                size="small"
                class="condition-select"
                :consistent-menu-width="false"
                :options="DELIVERY_METHOD_OPTIONS.filter(o => o.value !== 'ANY')"
              />
            </div>
            <div class="col-platform">
              <NSelect
                :to="POPUP_TO_BODY"
                v-model:value="row.platform"
                size="small"
                clearable
                class="condition-select"
                :consistent-menu-width="false"
                placeholder="全部平台"
                :options="PLATFORM_OPTIONS.filter(o => o.value !== 'ANY')"
              />
            </div>
            <div class="col-code">
              <NSelect
                :to="POPUP_TO_BODY"
                v-model:value="row.platformCodes"
                size="small"
                multiple
                filterable
                clearable
                tag
                class="condition-select condition-select--multi"
                :consistent-menu-width="false"
                :filter="filterPlatformCodeOption"
                :options="PLATFORM_CODE_OPTIONS"
                placeholder="搜索平台代码，可多选"
              />
            </div>
            <div class="col-action">
              <NButton size="small" quaternary type="error" @click="removeCondition(index)">删除</NButton>
            </div>
          </div>
        </div>

        <NButton class="mt-8px" size="small" dashed block @click="addCondition">+ 新增</NButton>
      </div>
    </div>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">取消</NButton>
        <NButton type="primary" :loading="submitting" @click="handleSubmit">确认</NButton>
      </NSpace>
    </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped>
.rule-editor {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  min-height: 420px;
}

@media (max-width: 768px) {
  .rule-editor {
    grid-template-columns: 1fr;
  }
}

.rule-editor__panel {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  background: #fafbfc;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.panel-hint {
  margin: 0 0 12px;
  font-size: 12px;
  color: #6b7280;
}

.target-type-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.target-desc {
  margin: 12px 0 16px;
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.5;
}

.condition-logic {
  margin-bottom: 12px;
}

.condition-table__head,
.condition-table__row {
  display: grid;
  grid-template-columns: 76px minmax(140px, 1.5fr) minmax(130px, 1.2fr) minmax(180px, 1.8fr) 64px;
  gap: 10px;
  align-items: center;
}

.condition-select {
  width: 100%;
}

.condition-select :deep(.n-base-selection-label) {
  white-space: normal;
  line-height: 1.35;
}

.condition-select--multi :deep(.n-base-selection-tags) {
  flex-wrap: wrap;
}

.condition-select--multi :deep(.n-tag) {
  max-width: 100%;
}

.location-picker {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 10px;
  background: #fff;
}

.location-picker__toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.location-picker__toolbar .n-input {
  flex: 1;
}

.location-picker__meta {
  margin-bottom: 8px;
  font-size: 12px;
  color: #6b7280;
}

.location-picker__list {
  max-height: 300px;
  overflow-y: auto;
  padding-right: 4px;
}

.condition-table__head {
  font-size: 12px;
  color: #6b7280;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 8px;
}

.condition-table__row + .condition-table__row {
  margin-top: 8px;
}

.col-action {
  text-align: center;
}
</style>
