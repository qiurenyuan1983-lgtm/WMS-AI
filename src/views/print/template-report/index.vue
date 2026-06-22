<script setup lang="ts">
import PrintTemplateList from '../_components/print-template-list.vue';

defineOptions({ name: 'PrintTemplateReport' });
</script>

<template>
  <PrintTemplateList template-type="report" title="报表模板" />
</template>
