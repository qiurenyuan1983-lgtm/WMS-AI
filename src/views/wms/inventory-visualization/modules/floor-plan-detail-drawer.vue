<script setup lang="ts">
import { ref, watch } from 'vue';
import { FLOOR_PLAN_OCCUPANCY_STYLES } from '@/mock/data/wms-inventory-floor';
import {
  fetchChangeWmsLocationStatus,
  fetchGetWmsLocationInventory,
  fetchGetWmsLocationOperationLogs
} from '@/service/api/wms';
import { useDict } from '@/hooks/business/dict';

const visible = defineModel<boolean>('visible', { default: false });

const props = defineProps<{
  location: Api.Wms.LocationVisualization | null;
  warehouseId: CommonType.IdType | null;
}>();

const emit = defineEmits<{ (e: 'refresh'): void; (e: 'move'): void }>();

const { record: statusRecord } = useDict('wms_location_status');
const { record: purposeRecord } = useDict('wms_location_purpose');

const detailTab = ref('basic');
const inventory = ref<Api.Wms.LocationInventoryItem[]>([]);
const logs = ref<Api.Wms.LocationOperationLog[]>([]);
const loading = ref(false);

watch(
  () => [visible.value, props.location?.id] as const,
  async ([open, id]) => {
    if (!open || !id) return;
    detailTab.value = 'basic';
    loading.value = true;
    const [inv, log] = await Promise.all([fetchGetWmsLocationInventory(id), fetchGetWmsLocationOperationLogs(id)]);
    inventory.value = inv.data || [];
    logs.value = log.data || [];
    loading.value = false;
  }
);

async function setStatus(status: string) {
  if (!props.location) return;
  const { error } = await fetchChangeWmsLocationStatus({ ids: [props.location.id], status });
  if (error) return;
  window.$message?.success('状态已更新');
  emit('refresh');
}

function handleLock() {
  setStatus(props.location?.locked ? 'EMPTY' : 'LOCKED');
}

function handleAbnormal() {
  setStatus(props.location?.abnormal ? 'EMPTY' : 'ABNORMAL');
}

function handleRecords() {
  window.$message?.info('库位记录（原型）');
}

function levelLabel(level: string) {
  return FLOOR_PLAN_OCCUPANCY_STYLES[level as keyof typeof FLOOR_PLAN_OCCUPANCY_STYLES]?.label || level;
}

function handleConfirm() {
  visible.value = false;
}
</script>

<template>
  <NDrawer v-model:show="visible" :width="460" placement="right" display-directive="show">
    <NDrawerContent v-if="location" closable :title="`库位详情 · ${location.locationCode}`">
      <div class="mb-10px flex flex-wrap gap-6px">
        <NTag size="small" type="info">{{ levelLabel(location.occupancyLevel) }}</NTag>
        <NTag v-if="location.locked" size="small" type="warning">已锁定</NTag>
        <NTag v-if="location.abnormal" size="small" type="error">异常</NTag>
      </div>

      <NTabs v-model:value="detailTab" type="line" size="small">
        <NTabPane name="basic" tab="基础信息" />
        <NTabPane name="inventory" tab="当前库存" />
        <NTabPane name="logs" tab="操作记录" />
      </NTabs>

      <div v-show="detailTab === 'basic'" class="mt-12px">
        <NDescriptions :column="1" size="small" bordered label-placement="left">
          <NDescriptionsItem label="库位编号">{{ location.locationCode }}</NDescriptionsItem>
          <NDescriptionsItem label="所属库区">{{ location.zoneName }}</NDescriptionsItem>
          <NDescriptionsItem label="行号">{{ location.rowNo || '—' }}</NDescriptionsItem>
          <NDescriptionsItem label="最大库容">{{ location.capacity ?? '—' }} 板</NDescriptionsItem>
          <NDescriptionsItem label="当前占用">{{ location.currentQty }} 板</NDescriptionsItem>
          <NDescriptionsItem label="剩余库容">{{ location.remainingCapacity ?? '—' }} 板</NDescriptionsItem>
          <NDescriptionsItem label="占用率">{{ location.occupancyPercent }}%</NDescriptionsItem>
          <NDescriptionsItem label="状态">{{ statusRecord[location.status]?.dictLabel || location.status }}</NDescriptionsItem>
          <NDescriptionsItem label="用途">{{ purposeRecord[location.purpose || '']?.dictLabel || location.purpose || '—' }}</NDescriptionsItem>
          <NDescriptionsItem label="绑定客户">{{ location.customerName || '—' }}</NDescriptionsItem>
          <NDescriptionsItem label="平台代码">{{ location.platformCode || '—' }}</NDescriptionsItem>
          <NDescriptionsItem label="派送方式">{{ location.deliveryMethod || '—' }}</NDescriptionsItem>
        </NDescriptions>
      </div>

      <div v-show="detailTab === 'inventory'" class="mt-12px">
        <NSpin :show="loading">
          <NDataTable
            v-if="inventory.length"
            size="small"
            :bordered="false"
            :columns="[
              { key: 'palletNo', title: '卡板号', width: 130 },
              { key: 'cargoOrderNo', title: '订单号', ellipsis: { tooltip: true } },
              { key: 'boxQty', title: '箱数', width: 70 },
              { key: 'palletStatus', title: '状态', width: 90 }
            ]"
            :data="inventory"
          />
          <NEmpty v-else description="暂无在库卡板" class="py-32px" />
        </NSpin>
      </div>

      <div v-show="detailTab === 'logs'" class="mt-12px">
        <NTimeline v-if="logs.length">
          <NTimelineItem v-for="log in logs" :key="log.id" :title="log.actionType" :time="log.operateTime">
            <div class="text-13px">{{ log.content }}</div>
            <div class="text-12px text-#9ca3af">{{ log.operator }}</div>
          </NTimelineItem>
        </NTimeline>
        <NEmpty v-else description="暂无操作记录" class="py-32px" />
      </div>

      <template #footer>
        <NSpace vertical :size="8" class="w-full">
          <NSpace>
            <NButton size="small" type="primary" @click="detailTab = 'inventory'">查看库存</NButton>
            <NButton size="small" @click="emit('move')">发起移位</NButton>
          </NSpace>
          <NSpace>
            <NButton size="small" @click="handleLock">{{ location.locked ? '解锁库位' : '锁定库位' }}</NButton>
            <NButton size="small" type="warning" @click="handleAbnormal">{{ location.abnormal ? '解除异常' : '设置异常' }}</NButton>
            <NButton size="small" @click="handleRecords">库位记录</NButton>
          </NSpace>
          <div class="flex justify-end pt-4px">
            <NButton type="primary" @click="handleConfirm">确认</NButton>
          </div>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
