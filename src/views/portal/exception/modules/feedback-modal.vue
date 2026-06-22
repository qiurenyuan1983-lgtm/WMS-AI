<script setup lang="ts">
import { ref } from 'vue';
import { NAlert, NForm, NFormItem, NInput, NModal } from 'naive-ui';
import { fetchSubmitPortalFeedback } from '@/service/api/portal';

const visible = defineModel<boolean>('show', { default: false });

const orderNo = ref('');
const description = ref('');
const submitting = ref(false);

async function submit() {
  if (!description.value.trim()) {
    window.$message?.warning('请填写问题描述');
    return;
  }
  submitting.value = true;
  const { data, error } = await fetchSubmitPortalFeedback({
    orderNo: orderNo.value || undefined,
    description: description.value.trim()
  });
  submitting.value = false;
  if (error) return;
  const result = data as { success: boolean; message: string };
  window.$message?.success(result?.message || '已提交');
  visible.value = false;
  orderNo.value = '';
  description.value = '';
}
</script>

<template>
  <NModal v-model:show="visible" preset="card" title="提交问题反馈" style="width: 480px">
    <NAlert type="info" :bordered="false" class="mb-12">
      问题反馈将先由对接客服审核，客服判断是否转为内部异常单。客户不能直接创建异常处理单。
    </NAlert>
    <NForm label-placement="left" label-width="88">
      <NFormItem label="关联订单">
        <NInput v-model:value="orderNo" placeholder="可选，如 CO-2026-1021" />
      </NFormItem>
      <NFormItem label="问题描述" required>
        <NInput v-model:value="description" type="textarea" :rows="4" placeholder="请描述您发现的问题" />
      </NFormItem>
    </NForm>
    <template #footer>
      <div class="modal-footer">
        <button class="n-button n-button--default-type" @click="visible = false">取消</button>
        <button class="n-button n-button--primary-type" :disabled="submitting" @click="submit">提交反馈</button>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.mb-12 {
  margin-bottom: 12px;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
