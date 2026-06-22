<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  NAlert,
  NButton,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NInput,
  NSpace,
  NStep,
  NSteps,
  NTag,
  NTimeline,
  NTimelineItem
} from 'naive-ui';
import { useRouterPush } from '@/hooks/common/router';
import { fetchGetPortalExceptionDetail, fetchPortalExceptionAction } from '@/service/api/portal';
import { PORTAL_EXCEPTION_STATUS_META } from '../../constants';

const visible = defineModel<boolean>('show', { default: false });

const props = defineProps<{
  exceptionId: number | null;
}>();

const emit = defineEmits<{
  updated: [];
}>();

const { routerPushByKey } = useRouterPush();

const loading = ref(false);
const detail = ref<Api.Portal.PortalExceptionDetail | null>(null);
const replyDraft = ref('');
const actionLoading = ref(false);

async function loadDetail() {
  if (!props.exceptionId) {
    detail.value = null;
    return;
  }
  loading.value = true;
  const { data } = await fetchGetPortalExceptionDetail(props.exceptionId);
  loading.value = false;
  detail.value = data ?? null;
}

watch([() => props.exceptionId, visible], () => {
  if (visible.value) loadDetail();
});

async function doAction(action: Api.Portal.ExceptionActionPayload['action'], content?: string) {
  if (!props.exceptionId) return;
  actionLoading.value = true;
  const { data, error } = await fetchPortalExceptionAction(props.exceptionId, { action, content });
  actionLoading.value = false;
  if (error) return;
  const result = data as { success: boolean; message: string };
  window.$message?.success(result?.message || '操作成功');
  replyDraft.value = '';
  await loadDetail();
  emit('updated');
}

function statusTag(status: Api.Portal.CustomerExceptionStatus) {
  const meta = PORTAL_EXCEPTION_STATUS_META[status];
  return meta;
}
</script>

<template>
  <NDrawer v-model:show="visible" :width="640" placement="right">
    <NDrawerContent :title="detail ? `异常 ${detail.exceptionNo}` : '异常详情'" closable>
      <div v-if="loading" class="drawer-loading">加载中…</div>
      <template v-else-if="detail">
        <NAlert type="warning" :bordered="false" class="mb-12">
          以下为客户可见信息。内部责任人、仓库操作员、内部赔付判定等字段不对客户展示。
        </NAlert>

        <section class="section">
          <div class="section__title">异常基础信息</div>
          <NDescriptions :column="2" label-placement="left" size="small" bordered>
            <NDescriptionsItem label="异常单号">{{ detail.exceptionNo }}</NDescriptionsItem>
            <NDescriptionsItem label="异常类型">{{ detail.exceptionType }}</NDescriptionsItem>
            <NDescriptionsItem label="关联订单号">{{ detail.orderNo }}</NDescriptionsItem>
            <NDescriptionsItem label="客户订单号">{{ detail.customerOrderNo }}</NDescriptionsItem>
            <NDescriptionsItem label="发生时间">{{ detail.occurredTime }}</NDescriptionsItem>
            <NDescriptionsItem :span="2" label="快捷操作">
              <NSpace>
                <NButton size="tiny" @click="routerPushByKey('portal_orders')">查看订单</NButton>
                <NButton size="tiny" type="primary" @click="routerPushByKey('portal_comm')">沟通中心</NButton>
                <NButton size="tiny" @click="routerPushByKey('portal_files')">文件中心</NButton>
              </NSpace>
            </NDescriptionsItem>
            <NDescriptionsItem label="当前状态">
              <NTag size="small" :type="statusTag(detail.customerStatus).type">
                {{ statusTag(detail.customerStatus).label }}
              </NTag>
            </NDescriptionsItem>
            <NDescriptionsItem label="推送人">{{ detail.pushedBy }}</NDescriptionsItem>
            <NDescriptionsItem label="推送时间">{{ detail.pushedTime }}</NDescriptionsItem>
          </NDescriptions>
        </section>

        <section class="section">
          <div class="section__title">客户可见说明</div>
          <p class="desc">{{ detail.customerVisibleDesc }}</p>
          <div v-if="detail.images.length" class="images">
            <NTag v-for="img in detail.images" :key="img" size="small">{{ img }}</NTag>
          </div>
        </section>

        <section class="section">
          <div class="section__title">处理进度</div>
          <NSteps size="small" :current="detail.progressSteps.findIndex(s => s.status === 'current') + 1">
            <NStep v-for="step in detail.progressSteps" :key="step.title" :title="step.title" :description="step.time" />
          </NSteps>
        </section>

        <section v-if="detail.needCustomerConfirm" class="section">
          <div class="section__title">客户确认区</div>
          <ul class="confirm-list">
            <li v-for="item in detail.confirmItems" :key="item">{{ item }}</li>
          </ul>
          <NSpace class="mt-8">
            <NButton type="primary" size="small" :loading="actionLoading" @click="doAction('confirm_plan')">
              确认处理方案
            </NButton>
            <NButton size="small" :loading="actionLoading" @click="doAction('fee_question')">费用有疑问</NButton>
            <NButton size="small" :loading="actionLoading" @click="doAction('close_confirm')">关闭确认</NButton>
          </NSpace>
        </section>

        <section class="section">
          <div class="section__title">客服/调度回复</div>
          <NTimeline>
            <NTimelineItem v-for="(r, i) in detail.csReplies" :key="i" :title="r.operator" :time="r.time">
              {{ r.content }}
            </NTimelineItem>
          </NTimeline>
        </section>

        <section class="section">
          <div class="section__title">客户回复</div>
          <NTimeline v-if="detail.customerReplies.length">
            <NTimelineItem v-for="(r, i) in detail.customerReplies" :key="i" :time="r.time">
              {{ r.content }}
            </NTimelineItem>
          </NTimeline>
          <p v-else class="muted">暂无客户回复</p>
          <NInput v-model:value="replyDraft" type="textarea" :rows="2" placeholder="回复说明…" class="mt-8" />
          <NButton
            class="mt-8"
            type="primary"
            size="small"
            :loading="actionLoading"
            :disabled="!replyDraft.trim()"
            @click="doAction('reply', replyDraft)"
          >
            提交回复
          </NButton>
        </section>

        <section class="section">
          <div class="section__title">沟通记录</div>
          <NTimeline>
            <NTimelineItem v-for="(r, i) in detail.commRecords" :key="i" :title="r.from" :time="r.time">
              {{ r.content }}
            </NTimelineItem>
          </NTimeline>
        </section>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped>
.mb-12 {
  margin-bottom: 12px;
}
.mt-8 {
  margin-top: 8px;
}
.section {
  margin-bottom: 20px;
}
.section__title {
  font-weight: 600;
  margin-bottom: 8px;
}
.desc {
  margin: 0;
  line-height: 1.6;
  color: var(--n-text-color-2);
}
.images {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.confirm-list {
  margin: 0;
  padding-left: 18px;
  color: var(--n-text-color-2);
}
.muted {
  color: var(--n-text-color-3);
  font-size: 13px;
}
.drawer-loading {
  padding: 24px;
  text-align: center;
}
</style>
