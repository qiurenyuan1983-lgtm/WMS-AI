<script setup lang="ts">
import { computed } from 'vue';
import { NButton, NDivider, NEmpty, NInput, NInputNumber, NSelect, NSpace } from 'naive-ui';
import { CONDITION_OPERATORS, FAILURE_OPTIONS } from '../utils/rpa-node-config';

const props = defineProps<{
  node: Api.Iec.RpaNode | null;
}>();

const showCondition = computed(
  () => props.node?.type === 'CONDITION' || Boolean(props.node?.config.conditionField)
);

const showTakeover = computed(
  () =>
    props.node?.type === 'MANUAL_CONFIRM' ||
    props.node?.config.onFailure === 'MANUAL_TAKEOVER'
);

function addMapping() {
  if (!props.node) return;
  props.node.config.fieldMappings.push({ source: '', target: '' });
}

function removeMapping(index: number) {
  if (!props.node) return;
  if (props.node.config.fieldMappings.length <= 1) return;
  props.node.config.fieldMappings.splice(index, 1);
}
</script>

<template>
  <div class="config-panel">
    <div class="panel-title">参数配置</div>
    <template v-if="node">
      <div class="config-section">
        <div class="section-title">基础信息</div>
        <div class="config-field">
          <label>节点名称</label>
          <NInput v-model:value="node.label" size="small" />
        </div>
        <div class="config-field">
          <label>动作类型</label>
          <NInput :value="node.type" size="small" disabled />
        </div>
      </div>

      <NDivider class="!my-10px" />

      <div class="config-section">
        <div class="section-title">字段映射</div>
        <p class="section-hint">将业务字段映射到本步骤输入/输出参数</p>
        <div v-for="(map, idx) in node.config.fieldMappings" :key="idx" class="mapping-row">
          <NInput v-model:value="map.source" size="small" placeholder="源字段" />
          <span class="mapping-arrow">→</span>
          <NInput v-model:value="map.target" size="small" placeholder="目标字段" />
          <NButton
            size="tiny"
            quaternary
            type="error"
            :disabled="node.config.fieldMappings.length <= 1"
            @click="removeMapping(idx)"
          >
            删
          </NButton>
        </div>
        <NButton size="tiny" dashed block class="mt-6px" @click="addMapping">添加映射</NButton>
      </div>

      <NDivider class="!my-10px" />

      <div class="config-section">
        <div class="section-title">条件配置</div>
        <p v-if="!showCondition" class="section-hint">非「判断条件」节点可留空；也可配置前置校验。</p>
        <div class="config-field">
          <label>判断字段</label>
          <NInput
            v-model:value="node.config.conditionField"
            size="small"
            placeholder="如 order.status"
          />
        </div>
        <div class="config-field">
          <label>运算符</label>
          <NSelect
            v-model:value="node.config.conditionOperator"
            size="small"
            :options="CONDITION_OPERATORS"
          />
        </div>
        <div class="config-field">
          <label>比较值</label>
          <NInput v-model:value="node.config.conditionValue" size="small" placeholder="如 PENDING" />
        </div>
      </div>

      <NDivider class="!my-10px" />

      <div class="config-section">
        <div class="section-title">失败处理</div>
        <div class="config-field">
          <label>失败后动作</label>
          <NSelect v-model:value="node.config.onFailure" size="small" :options="FAILURE_OPTIONS" />
        </div>
        <div v-if="node.config.onFailure === 'RETRY'" class="config-field">
          <label>重试次数</label>
          <NInputNumber v-model:value="node.config.retryTimes" size="small" :min="0" :max="5" class="w-full" />
        </div>
      </div>

      <NDivider class="!my-10px" />

      <div v-if="showTakeover" class="config-section">
        <div class="section-title">接管人</div>
        <div class="config-field">
          <label>异常接管负责人</label>
          <NInput v-model:value="node.config.takeoverOwner" size="small" placeholder="如 运营主管" />
        </div>
        <p class="section-hint">失败或需人工确认时，将生成接管任务并通知此人。</p>
      </div>

      <p class="proto-hint">第一阶段为前端 Mock，不控制真实浏览器。</p>
    </template>
    <NEmpty v-else description="选择或拖入画布节点" class="py-40px" />
  </div>
</template>

<style scoped>
.config-panel {
  height: 100%;
  overflow-y: auto;
}
.panel-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1e3a5f;
}
.config-section {
  margin-bottom: 4px;
}
.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}
.section-hint {
  font-size: 11px;
  color: #9ca3af;
  margin: 0 0 8px;
  line-height: 1.4;
}
.config-field {
  margin-bottom: 8px;
}
.config-field label {
  display: block;
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 4px;
}
.mapping-row {
  display: grid;
  grid-template-columns: 1fr 16px 1fr 28px;
  gap: 4px;
  align-items: center;
  margin-bottom: 6px;
}
.mapping-arrow {
  text-align: center;
  color: #94a3b8;
  font-size: 12px;
}
.proto-hint {
  margin-top: 12px;
  font-size: 11px;
  color: #9ca3af;
}
</style>
