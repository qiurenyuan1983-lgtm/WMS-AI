<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NAlert, NForm, NFormItem, NInput, NModal, NRadio, NRadioGroup, NSelect } from 'naive-ui';
import { fetchCreatePortalConversation, fetchGetPortalOrderOptions } from '@/service/api/portal';
import { PORTAL_COMM_INITIATE_OPTIONS } from '../../constants';

const visible = defineModel<boolean>('show', { default: false });

const emit = defineEmits<{
  created: [conv: Api.Portal.PortalConversation];
}>();

const props = defineProps<{
  contacts: Api.Portal.AssignedContact[];
}>();

const commType = ref<Api.Portal.CommInitiateType>('ORDER_INQUIRY');
const orderId = ref<number | null>(null);
const contactId = ref<string | null>(null);
const initialMessage = ref('');
const submitting = ref(false);
const orderOptions = ref<Api.Portal.PortalOrderOption[]>([]);

const orderSelectOptions = computed(() =>
  orderOptions.value.map(o => ({
    label: `${o.customerOrderNo} · ${o.destination}（${o.orderNo}）`,
    value: o.id
  }))
);

const contactRadios = computed(() => props.contacts);

async function loadOrders() {
  const { data } = await fetchGetPortalOrderOptions();
  orderOptions.value = Array.isArray(data) ? data : [];
}

watch(visible, v => {
  if (v) {
    loadOrders();
    contactId.value = props.contacts[0]?.id ?? null;
  }
});

async function submit() {
  if (!orderId.value || !contactId.value) {
    window.$message?.warning('请选择关联订单与联系对象');
    return;
  }
  submitting.value = true;
  const { data, error } = await fetchCreatePortalConversation({
    commType: commType.value,
    orderId: orderId.value,
    contactId: contactId.value,
    initialMessage: initialMessage.value
  });
  submitting.value = false;
  if (error) return;
  const result = data as { success: boolean; message: string; conversation?: Api.Portal.PortalConversation };
  if (!result?.success) {
    window.$message?.warning(result?.message || '创建失败');
    return;
  }
  window.$message?.success(result.message);
  if (result.conversation) emit('created', result.conversation);
  visible.value = false;
  commType.value = 'ORDER_INQUIRY';
  orderId.value = null;
  initialMessage.value = '';
}
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    title="发起沟通"
    style="width: 520px"
    :mask-closable="false"
    @positive-click="submit"
  >
    <NAlert type="warning" :bordered="false" class="mb-12">
      客户仅可联系专属对接客服或对接调度，无法搜索或选择仓库、财务、司机等其他内部员工。
    </NAlert>
    <NForm label-placement="left" label-width="88">
      <NFormItem label="沟通类型" required>
        <NSelect v-model:value="commType" :options="PORTAL_COMM_INITIATE_OPTIONS" />
      </NFormItem>
      <NFormItem label="关联订单" required>
        <NSelect v-model:value="orderId" :options="orderSelectOptions" placeholder="请选择订单" filterable />
      </NFormItem>
      <NFormItem label="联系对象" required>
        <NRadioGroup v-model:value="contactId">
          <NRadio v-for="c in contactRadios" :key="c.id" :value="c.id">
            {{ c.name }}（{{ c.role }}）
          </NRadio>
        </NRadioGroup>
      </NFormItem>
      <NFormItem label="首条消息">
        <NInput v-model:value="initialMessage" type="textarea" :rows="3" placeholder="可选，描述您的问题" />
      </NFormItem>
    </NForm>
    <template #footer>
      <div class="modal-footer">
        <button class="n-button n-button--default-type" @click="visible = false">取消</button>
        <button class="n-button n-button--primary-type" :disabled="submitting" @click="submit">发起沟通</button>
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
