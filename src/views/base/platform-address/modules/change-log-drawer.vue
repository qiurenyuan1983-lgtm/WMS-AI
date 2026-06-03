<script setup lang="ts">
import { ref, watch } from 'vue';
import { NTag } from 'naive-ui';
import { fetchGetPlatformAddressChangeLogs } from '@/service/api/base/platform-address';

defineOptions({ name: 'ChangeLogDrawer' });

interface Props {
  addressId: CommonType.IdType;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', { default: false });

const loading = ref(false);
const logs = ref<Api.Base.PlatformAddressChangeLog[]>([]);

const CHANGE_TYPE_MAP: Record<string, { label: string; type: 'info' | 'success' | 'warning' | 'error' }> = {
  CREATE: { label: '新增', type: 'success' },
  UPDATE: { label: '编辑', type: 'info' },
  DISABLE: { label: '禁用', type: 'error' }
};

function formatJson(jsonStr: string | null): string {
  if (!jsonStr) return '';
  try {
    return JSON.stringify(JSON.parse(jsonStr), null, 2);
  } catch {
    return jsonStr;
  }
}

async function loadLogs() {
  if (!props.addressId) return;
  loading.value = true;
  try {
    const { data } = await fetchGetPlatformAddressChangeLogs(props.addressId);
    logs.value = data ?? [];
  } finally {
    loading.value = false;
  }
}

watch(visible, val => {
  if (val) loadLogs();
  else logs.value = [];
});
</script>

<template>
  <NDrawer v-model:show="visible" title="变更记录" display-directive="show" :width="680" class="max-w-90%">
    <NDrawerContent title="变更记录" :native-scrollbar="false" closable>
      <NSpin :show="loading">
        <NEmpty v-if="!loading && logs.length === 0" description="暂无变更记录" class="mt-40px" />
        <NTimeline v-else>
          <NTimelineItem
            v-for="log in logs"
            :key="log.id"
            :time="log.createTime"
          >
            <template #header>
              <div class="flex items-center gap-8px">
                <NTag :type="CHANGE_TYPE_MAP[log.changeType]?.type ?? 'default'" size="small">
                  {{ CHANGE_TYPE_MAP[log.changeType]?.label ?? log.changeType }}
                </NTag>
                <span class="text-gray-600 text-12px">{{ log.operatorName }}</span>
              </div>
            </template>
            <div v-if="log.changeReason" class="text-gray-500 text-12px mt-4px">
              原因：{{ log.changeReason }}
            </div>
            <NGrid v-if="log.beforeValue || log.afterValue" :cols="2" x-gap="8" class="mt-8px">
              <NGridItem v-if="log.beforeValue">
                <div class="text-12px text-gray-400 mb-4px">变更前</div>
                <pre class="bg-gray-50 rounded p-8px text-11px overflow-auto max-h-200px">{{ formatJson(log.beforeValue) }}</pre>
              </NGridItem>
              <NGridItem v-if="log.afterValue">
                <div class="text-12px text-gray-400 mb-4px">变更后</div>
                <pre class="bg-gray-50 rounded p-8px text-11px overflow-auto max-h-200px">{{ formatJson(log.afterValue) }}</pre>
              </NGridItem>
            </NGrid>
          </NTimelineItem>
        </NTimeline>
      </NSpin>
    </NDrawerContent>
  </NDrawer>
</template>


