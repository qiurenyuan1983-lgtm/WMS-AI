<script setup lang="ts">
import { ref, watch } from 'vue';
import { NButton, NDrawer, NDrawerContent, NEmpty, NSpace } from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { fetchGetBusinessContext } from '@/service/api/comm';

const props = defineProps<{
  conversationId: string | null;
}>();

const visible = defineModel<boolean>('visible', { default: false });

const emit = defineEmits<{
  (e: 'open-order-detail', orderNo: string): void;
}>();

const loading = ref(false);
const context = ref<Api.Comm.BusinessContext | null>(null);

async function loadContext() {
  if (!props.conversationId) {
    context.value = null;
    return;
  }
  loading.value = true;
  const { data } = await fetchGetBusinessContext(props.conversationId);
  loading.value = false;
  context.value = data ?? null;
}

watch(
  () => props.conversationId,
  () => {
    loadContext();
  },
  { immediate: true }
);

watch(visible, open => {
  if (open && props.conversationId) loadContext();
});

function handleAction(key: string, label: string) {
  if (key === 'view_order' && context.value) {
    const orderField = context.value.fields.find(field => field.label === '订单号');
    if (orderField?.value) {
      emit('open-order-detail', orderField.value);
      return;
    }
  }
  window.$message?.info(`[原型] ${label} (${key})`);
}
</script>

<template>
  <NDrawer v-model:show="visible" :width="320" placement="right" :to="POPUP_TO_BODY">
    <NDrawerContent title="业务面板" closable>
      <div v-if="loading" class="biz-panel-empty">加载中…</div>
      <NEmpty v-else-if="!context" description="当前会话无关联业务" class="biz-panel-empty" />
      <div v-else class="biz-panel-body">
        <div class="biz-panel-title">{{ context.title }}</div>
        <dl class="biz-fields">
          <div v-for="field in context.fields" :key="field.label" class="biz-field">
            <dt>{{ field.label }}</dt>
            <dd :class="{ 'biz-field--highlight': field.highlight }">{{ field.value }}</dd>
          </div>
        </dl>
      </div>

      <template v-if="context && !loading" #footer>
        <div class="biz-actions">
          <div class="biz-actions-label">快捷操作</div>
          <NSpace vertical class="w-full">
            <NButton
              v-for="action in context.actions"
              :key="action.key"
              block
              size="small"
              :type="action.type || 'default'"
              @click="handleAction(action.key, action.label)"
            >
              {{ action.label }}
            </NButton>
          </NSpace>
        </div>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped>
.biz-panel-body {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.biz-panel-title {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.biz-panel-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 24px;
}

.biz-fields {
  margin: 0;
  padding: 0;
}

.biz-field {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px dashed #f3f4f6;
  font-size: 13px;
}

.biz-field dt {
  color: #6b7280;
  flex-shrink: 0;
}

.biz-field dd {
  margin: 0;
  text-align: right;
  color: #111827;
}

.biz-field--highlight {
  color: #2563eb;
  font-weight: 600;
}

.biz-actions {
  width: 100%;
  padding-top: 4px;
}

.biz-actions-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
}
</style>
