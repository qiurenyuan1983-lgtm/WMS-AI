<script setup lang="ts">
import { computed, watch } from 'vue';
import { NDescriptions, NDescriptionsItem, NDrawer, NDrawerContent, NSpace, NTag } from 'naive-ui';
import { useDict } from '@/hooks/business/dict';
import { displayAppointmentNo } from '@/utils/oms/appointment-no';

defineOptions({ name: 'PlatformAppointmentDetailDrawer' });

const visible = defineModel<boolean>('visible', { default: false });
const row = defineModel<Api.Oms.PlatformAppointment | null>('row', { default: null });

const { record: statusRecord } = useDict('oms_platform_appointment_status');
const { record: typeRecord } = useDict('oms_platform_appointment_type');
const { record: tagRecord } = useDict('oms_platform_appointment_tag');

const statusMeta = computed(() => {
  const code = row.value?.status || '';
  const dict = statusRecord.value[code];
  return {
    label: dict?.dictLabel || code || '--',
    type: (dict?.listClass as NaiveUI.ThemeColor) || 'default'
  };
});

const typeLabel = computed(() => {
  const code = row.value?.appointmentType || '';
  return typeRecord.value[code]?.dictLabel || code || '--';
});

const tagLabels = computed(() => {
  const codes = row.value?.tagCodes || [];
  if (!codes.length) return [];
  return codes.map(code => ({
    code,
    label: tagRecord.value[code]?.dictLabel || code,
    type: (tagRecord.value[code]?.listClass as NaiveUI.ThemeColor) || 'default'
  }));
});

watch(visible, val => {
  if (!val) row.value = null;
});
</script>

<template>
  <NDrawer v-model:show="visible" :width="520" display-directive="show">
    <NDrawerContent
      :title="row ? `预约详情 · ${displayAppointmentNo(row.appointmentNo, { platformName: row.platformName })}` : '预约详情'"
      closable
    >
      <template v-if="row">
        <NDescriptions :column="1" label-placement="left" bordered size="small">
          <NDescriptionsItem label="平台">{{ row.platformName }}</NDescriptionsItem>
          <NDescriptionsItem label="仓库代码">{{ row.warehouseCode }}</NDescriptionsItem>
          <NDescriptionsItem label="预约号">
            {{ displayAppointmentNo(row.appointmentNo, { platformName: row.platformName }) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="预约时间">{{ row.appointmentTime }}</NDescriptionsItem>
          <NDescriptionsItem label="创建时间">{{ row.createTime }}</NDescriptionsItem>
          <NDescriptionsItem label="类型">{{ typeLabel }}</NDescriptionsItem>
          <NDescriptionsItem label="状态">
            <NTag size="small" :type="statusMeta.type">{{ statusMeta.label }}</NTag>
          </NDescriptionsItem>
          <NDescriptionsItem label="出库单号">
            <span v-if="row.outboundOrderNo" class="text-primary font-600">{{ row.outboundOrderNo }}</span>
            <span v-else>--</span>
          </NDescriptionsItem>
          <NDescriptionsItem label="预出单号">
            <span v-if="row.preOutboundNo" class="text-primary font-600">{{ row.preOutboundNo }}</span>
            <span v-else>--</span>
          </NDescriptionsItem>
          <NDescriptionsItem label="现有货物CBM">{{ Number(row.existingCargoCbm || 0).toFixed(2) }}</NDescriptionsItem>
          <NDescriptionsItem label="备注">{{ row.remark || '--' }}</NDescriptionsItem>
          <NDescriptionsItem label="标签">
            <NSpace v-if="tagLabels.length" size="small">
              <NTag v-for="tag in tagLabels" :key="tag.code" size="small" :type="tag.type">{{ tag.label }}</NTag>
            </NSpace>
            <span v-else>--</span>
          </NDescriptionsItem>
        </NDescriptions>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
