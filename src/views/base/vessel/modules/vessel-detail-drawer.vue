<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ name: 'VesselDetailDrawer' });

const props = defineProps<{
  rowData?: Api.Base.Vessel | null;
}>();

const visible = defineModel<boolean>('visible', { default: false });

const vesselTypeLabel = computed(() => {
  const map: Record<string, string> = {
    CONTAINER: '集装箱船',
    BULK: '散货船',
    REEFER: '冷藏船',
    RORO: '滚装船',
    OTHER: '其他'
  };
  return map[props.rowData?.vesselType || 'OTHER'] || '其他';
});
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="720" class="max-w-90%">
    <NDrawerContent title="船舶详情" :native-scrollbar="false" closable>
      <NDescriptions v-if="rowData" label-placement="left" bordered :column="2" size="small">
        <NDescriptionsItem label="船舶编码">{{ rowData.vesselCode }}</NDescriptionsItem>
        <NDescriptionsItem label="状态">{{ rowData.status === '0' ? '启用' : '停用' }}</NDescriptionsItem>
        <NDescriptionsItem label="船名">{{ rowData.vesselName }}</NDescriptionsItem>
        <NDescriptionsItem label="英文船名">{{ rowData.vesselNameEn || '--' }}</NDescriptionsItem>
        <NDescriptionsItem label="IMO编号">{{ rowData.imoNo || '--' }}</NDescriptionsItem>
        <NDescriptionsItem label="MMSI">{{ rowData.mmsi || '--' }}</NDescriptionsItem>
        <NDescriptionsItem label="呼号">{{ rowData.callSign || '--' }}</NDescriptionsItem>
        <NDescriptionsItem label="所属船司">{{ rowData.shippingLineName || '--' }}</NDescriptionsItem>
        <NDescriptionsItem label="船舶类型">{{ vesselTypeLabel }}</NDescriptionsItem>
        <NDescriptionsItem label="TEU容量">{{ rowData.capacityTeu ?? '--' }}</NDescriptionsItem>
        <NDescriptionsItem label="船长(米)">{{ rowData.lengthM ?? '--' }}</NDescriptionsItem>
        <NDescriptionsItem label="船宽(米)">{{ rowData.widthM ?? '--' }}</NDescriptionsItem>
        <NDescriptionsItem label="建造年份">{{ rowData.buildYear ?? '--' }}</NDescriptionsItem>
        <NDescriptionsItem label="船籍国家">{{ rowData.flagCountry || '--' }}</NDescriptionsItem>
        <NDescriptionsItem label="更新时间">{{ rowData.updateTime || '--' }}</NDescriptionsItem>
        <NDescriptionsItem label="备注">{{ rowData.remark || '--' }}</NDescriptionsItem>
      </NDescriptions>
    </NDrawerContent>
  </NDrawer>
</template>
