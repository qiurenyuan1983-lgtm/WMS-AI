<script setup lang="ts">
import { ref, watch } from 'vue';
import { NDescriptions, NDescriptionsItem, NEmpty, NTabPane, NTabs } from 'naive-ui';
import { fetchGetPortalBizContext } from '@/service/api/portal';

const props = defineProps<{
  conversationId: string | null;
}>();

const loading = ref(false);
const context = ref<Api.Portal.PortalBizContext | null>(null);

async function load() {
  if (!props.conversationId) {
    context.value = null;
    return;
  }
  loading.value = true;
  const { data } = await fetchGetPortalBizContext(props.conversationId);
  loading.value = false;
  context.value = data ?? null;
}

watch(() => props.conversationId, () => load(), { immediate: true });
</script>

<template>
  <div class="biz-panel">
    <div class="biz-panel__title">关联单据</div>
    <div v-if="!conversationId" class="biz-panel__empty">
      <NEmpty description="选择会话后显示关联信息" size="small" />
    </div>
    <div v-else-if="loading" class="biz-panel__empty">加载中…</div>
    <NTabs v-else type="line" size="small" default-value="order">
      <NTabPane name="order" tab="订单">
        <NDescriptions v-if="context?.orderFields?.length" :column="1" label-placement="left" size="small">
          <NDescriptionsItem v-for="f in context.orderFields" :key="f.label" :label="f.label">
            {{ f.value }}
          </NDescriptionsItem>
        </NDescriptions>
        <NEmpty v-else size="small" description="无关联订单" />
      </NTabPane>
      <NTabPane name="fee" tab="费用">
        <NDescriptions v-if="context?.feeFields?.length" :column="1" label-placement="left" size="small">
          <NDescriptionsItem v-for="f in context.feeFields" :key="f.label" :label="f.label">
            {{ f.value }}
          </NDescriptionsItem>
        </NDescriptions>
        <NEmpty v-else size="small" description="无费用信息" />
      </NTabPane>
      <NTabPane name="file" tab="文件">
        <NDescriptions v-if="context?.fileFields?.length" :column="1" label-placement="left" size="small">
          <NDescriptionsItem v-for="f in context.fileFields" :key="f.label" :label="f.label">
            {{ f.value }}
          </NDescriptionsItem>
        </NDescriptions>
        <NEmpty v-else size="small" description="无文件信息" />
      </NTabPane>
      <NTabPane name="exception" tab="异常">
        <NDescriptions v-if="context?.exceptionFields?.length" :column="1" label-placement="left" size="small">
          <NDescriptionsItem v-for="f in context.exceptionFields" :key="f.label" :label="f.label">
            {{ f.value }}
          </NDescriptionsItem>
        </NDescriptions>
        <NEmpty v-else size="small" description="无异常关联" />
      </NTabPane>
    </NTabs>
  </div>
</template>

<style scoped>
.biz-panel {
  height: 100%;
  border-left: 1px solid var(--n-border-color);
  display: flex;
  flex-direction: column;
}
.biz-panel__title {
  padding: 10px 12px;
  font-weight: 600;
  border-bottom: 1px solid var(--n-border-color);
  flex-shrink: 0;
}
.biz-panel__empty {
  padding: 24px 12px;
  text-align: center;
  color: var(--n-text-color-3);
  font-size: 13px;
}
</style>
