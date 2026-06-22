<script setup lang="ts">

import { computed, ref, watch } from 'vue';

import { fetchGetWmsLocationInventory, fetchGetWmsLocationOperationLogs, fetchUpdateWmsLocation } from '@/service/api/wms';

import { useDict } from '@/hooks/business/dict';

import {

  DESTINATION_OPTIONS,

  PLATFORM_OPTIONS,

  normalizeLocationDestinations,

  occupancyPercent,

  statusTagType

} from '../constants';



const visible = defineModel<boolean>('visible', { default: false });



const props = defineProps<{

  row: Api.Wms.Location | null;

  zoneOptions: CommonType.Option[];

  warehouseOptions: CommonType.Option[];

}>();



const emit = defineEmits<{ (e: 'submitted'): void; (e: 'print-qr'): void }>();



const { record: statusRecord } = useDict('wms_location_status');

const { options: purposeOptions } = useDict('wms_location_purpose');



const detailTab = ref('basic');

const saving = ref(false);

const inventoryLoading = ref(false);

const inventory = ref<Api.Wms.LocationInventoryItem[]>([]);

const logs = ref<Api.Wms.LocationOperationLog[]>([]);



const form = ref<Api.Wms.LocationOperateParams>({});



const destinationLimit = computed(() => Math.max(1, form.value.destinationLimit ?? 1));



const destinationSelectValue = computed<string | string[] | null>({

  get() {

    const codes = form.value.destinationCodes ?? [];

    return destinationLimit.value === 1 ? (codes[0] ?? null) : codes;

  },

  set(val) {

    updateDestinations(val == null ? [] : Array.isArray(val) ? val : [val]);

  }

});



watch(

  () => [visible.value, props.row?.id] as const,

  async ([open, id]) => {

    if (!open || !props.row) return;

    form.value = { ...props.row, ...normalizeLocationDestinations(props.row) };

    detailTab.value = 'basic';

    await loadSideData(id!);

  }

);



async function loadSideData(id: CommonType.IdType) {

  inventoryLoading.value = true;

  const [invRes, logRes] = await Promise.all([

    fetchGetWmsLocationInventory(id),

    fetchGetWmsLocationOperationLogs(id)

  ]);

  inventory.value = invRes.data || [];

  logs.value = logRes.data || [];

  inventoryLoading.value = false;

}



function updateDestinations(raw: string[]) {

  const limit = destinationLimit.value;

  let codes = limit === 1 ? (raw.length ? [raw[raw.length - 1]] : []) : raw.slice(0, limit);

  if (limit > 1 && raw.length > limit) {

    window.$message?.warning(`该库位最多允许绑定 ${limit} 个目的地`);

  }

  const normalized = normalizeLocationDestinations({

    ...form.value,

    destinationLimit: limit,

    destinationCodes: codes

  });

  form.value.destinationCodes = normalized.destinationCodes;

  form.value.destinationCode = normalized.destinationCode;

  form.value.destinationName = normalized.destinationName;

}



function onDestinationLimitChange(val: number | null) {

  const limit = Math.max(1, val ?? 1);

  form.value.destinationLimit = limit;

  const normalized = normalizeLocationDestinations({

    ...form.value,

    destinationLimit: limit

  });

  form.value.destinationCodes = normalized.destinationCodes;

  form.value.destinationCode = normalized.destinationCode;

  form.value.destinationName = normalized.destinationName;

}



async function handleSave(): Promise<boolean> {

  if (!props.row) return false;

  const payload = { ...form.value, ...normalizeLocationDestinations(form.value as Api.Wms.Location) };

  saving.value = true;

  const { error } = await fetchUpdateWmsLocation(payload);

  saving.value = false;

  if (error) return false;

  window.$message?.success('保存成功');

  emit('submitted');

  return true;

}



async function handleConfirm() {

  const ok = await handleSave();

  if (ok) visible.value = false;

}



function handleCancel() {

  visible.value = false;

}



function handlePrintQr() {

  emit('print-qr');

  window.$message?.success(`已发送打印任务：${props.row?.locationCode}`);

}

</script>



<template>

  <NDrawer v-model:show="visible" :width="480" placement="right" display-directive="show">

    <NDrawerContent v-if="row" closable :title="`库位详情 · ${row.locationCode}`">

      <template #header-extra>

        <NSpace>

          <NButton size="small" @click="handlePrintQr">打印二维码</NButton>

          <NButton size="small" type="primary" :loading="saving" @click="handleSave">保存</NButton>

        </NSpace>

      </template>



      <div class="mb-12px flex flex-wrap items-center gap-8px">

        <NTag :type="statusTagType(row.status)">{{ statusRecord[row.status]?.dictLabel || row.status }}</NTag>

        <span class="text-12px text-#6b7280">{{ row.zoneName }} · 占用 {{ occupancyPercent(row) }}%</span>

      </div>



      <NTabs v-model:value="detailTab" type="line" size="small">

        <NTabPane name="basic" tab="基本信息" />

        <NTabPane name="inventory" tab="当前库存" />

        <NTabPane name="logs" tab="操作记录" />

      </NTabs>



      <div v-show="detailTab === 'basic'" class="mt-12px">

        <NForm label-placement="top" size="small">

          <NGrid :cols="2" :x-gap="12">

            <NGridItem :span="2">

              <NFormItem label="库位编码">

                <NInput v-model:value="form.locationCode" />

              </NFormItem>

            </NGridItem>

            <NGridItem>

              <NFormItem label="所属仓库">

                <NSelect v-model:value="form.warehouseId" :options="warehouseOptions" disabled />

              </NFormItem>

            </NGridItem>

            <NGridItem>

              <NFormItem label="所属库区">

                <NSelect v-model:value="form.zoneId" :options="zoneOptions" />

              </NFormItem>

            </NGridItem>

            <NGridItem>

              <NFormItem label="行号">

                <NInput v-model:value="form.rowNo" />

              </NFormItem>

            </NGridItem>

            <NGridItem>

              <NFormItem label="库位容量">
                <NInputNumber v-model:value="form.capacity" class="w-full" :min="0" />
              </NFormItem>

            </NGridItem>

            <NGridItem>

              <NFormItem label="状态">

                <DictSelect v-model:value="form.status" dict-code="wms_location_status" />

              </NFormItem>

            </NGridItem>

            <NGridItem>

              <NFormItem label="用途">

                <NSelect v-model:value="form.purpose" :options="purposeOptions" clearable />

              </NFormItem>

            </NGridItem>

            <NGridItem>

              <NFormItem label="绑定客户">

                <NInput v-model:value="form.customerName" placeholder="客户名称" />

              </NFormItem>

            </NGridItem>

            <NGridItem>

              <NFormItem label="绑定平台">

                <NSelect

                  v-model:value="form.platformCode"

                  :options="PLATFORM_OPTIONS"

                  clearable

                  @update:value="(v: string) => { form.platformName = PLATFORM_OPTIONS.find(o => o.value === v)?.label as string }"

                />

              </NFormItem>

            </NGridItem>

            <NGridItem>

              <NFormItem label="目的地数量">

                <NInputNumber

                  v-model:value="form.destinationLimit"

                  class="w-full"

                  :min="1"

                  :max="10"

                  @update:value="onDestinationLimitChange"

                />

              </NFormItem>

            </NGridItem>

            <NGridItem :span="2">

              <NFormItem :label="destinationLimit === 1 ? '绑定目的地' : `绑定目的地（最多 ${destinationLimit} 个）`">

                <NSelect

                  v-model:value="destinationSelectValue"

                  :options="DESTINATION_OPTIONS"

                  :multiple="destinationLimit > 1"

                  clearable

                />

              </NFormItem>

            </NGridItem>

            <NGridItem :span="2">

              <NFormItem label="备注">

                <NInput v-model:value="form.remark" type="textarea" :rows="2" />

              </NFormItem>

            </NGridItem>

          </NGrid>

        </NForm>

        <NDescriptions :column="2" size="small" bordered class="mt-12px">

          <NDescriptionsItem label="当前库存">{{ row.currentQty ?? 0 }}</NDescriptionsItem>

          <NDescriptionsItem label="托盘数">{{ row.palletCount ?? 0 }}</NDescriptionsItem>

          <NDescriptionsItem label="剩余容量">{{ row.remainingCapacity ?? '—' }}</NDescriptionsItem>

          <NDescriptionsItem label="更新时间">{{ row.updateTime || '—' }}</NDescriptionsItem>

        </NDescriptions>

      </div>



      <div v-show="detailTab === 'inventory'" class="mt-12px">

        <NSpin :show="inventoryLoading">

          <NDataTable

            v-if="inventory.length"

            :columns="[

              { key: 'palletNo', title: '卡板号', width: 130 },

              { key: 'cargoOrderNo', title: '订单号', width: 120 },

              { key: 'customerName', title: '客户', width: 100 },

              { key: 'boxQty', title: '箱数', width: 70 },

              { key: 'palletStatus', title: '状态', width: 90 }

            ]"

            :data="inventory"

            size="small"

            :bordered="false"

          />

          <NEmpty v-else description="该库位暂无在库卡板" class="py-40px" />

        </NSpin>

      </div>



      <div v-show="detailTab === 'logs'" class="mt-12px">

        <NTimeline v-if="logs.length">

          <NTimelineItem v-for="log in logs" :key="log.id" :title="log.actionType" :time="log.operateTime">

            <div class="text-13px">{{ log.content }}</div>

            <div class="mt-4px text-12px text-#6b7280">操作人：{{ log.operator }}</div>

            <div v-if="log.beforeValue || log.afterValue" class="mt-2px text-12px text-#9ca3af">

              {{ log.beforeValue || '—' }} → {{ log.afterValue || '—' }}

            </div>

          </NTimelineItem>

        </NTimeline>

        <NEmpty v-else description="暂无操作记录" class="py-40px" />

      </div>



      <template #footer>

        <div class="flex justify-end gap-12px">

          <NButton @click="handleCancel">取消</NButton>

          <NButton type="primary" :loading="saving" @click="handleConfirm">确认</NButton>

        </div>

      </template>

    </NDrawerContent>

  </NDrawer>

</template>

