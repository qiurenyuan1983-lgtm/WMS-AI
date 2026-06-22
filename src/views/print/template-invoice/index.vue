<script setup lang="ts">
import { ref } from 'vue';
import { NAlert, NTabPane, NTabs } from 'naive-ui';
import PrintTemplateList from '../_components/print-template-list.vue';
import { INVOICE_TEMPLATE_CATEGORIES } from '../constants';

defineOptions({ name: 'PrintTemplateInvoice' });

const activeTab = ref<Api.Print.InvoiceSubtype>('sea_container');
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-12px overflow-hidden lt-sm:overflow-auto">
    <NAlert type="info" :bordered="false" title="发票模板分类">
      按费用业务场景管理模板；每类支持独立字段集、费项行与审批流程。发布后的模板由打印规则自动匹配。
    </NAlert>
    <NTabs v-model:value="activeTab" type="line" animated class="flex-1-hidden">
      <NTabPane
        v-for="cat in INVOICE_TEMPLATE_CATEGORIES"
        :key="cat.key"
        :name="cat.key"
        :tab="cat.label"
      >
        <div class="mb-12px text-sm text-gray-500">
          {{ cat.desc }} · 典型费项：{{ cat.feeExamples.join('、') }}
        </div>
        <PrintTemplateList
          template-type="invoice"
          :title="cat.label"
          :invoice-subtype="cat.key"
        />
      </NTabPane>
    </NTabs>
  </div>
</template>

<style scoped>
:deep(.n-tabs-pane-wrapper) {
  height: 100%;
}
</style>
