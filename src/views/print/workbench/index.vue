<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { NButton, NCard, NEmpty, NGrid, NGridItem, NList, NListItem, NSpace, NStatistic, NTag, NThing } from 'naive-ui';
import { fetchGetPrintWorkbench } from '@/service/api/print';

defineOptions({ name: 'PrintWorkbench' });

const router = useRouter();

const stats = ref<Api.Print.WorkbenchStats>({
  pendingToday: 0,
  printedToday: 0,
  failedToday: 0,
  onlinePrinters: 0,
  totalPrinters: 0,
  recentTemplates: [],
  recentRecords: [],
  printerStatus: [],
  alerts: []
});

const quickEntries = [
  { label: '卡板贴模板', route: 'print_template-pallet-label', icon: 'mdi:label-outline' },
  { label: '拆柜单模板', route: 'print_template-devanning', icon: 'mdi:file-document-outline' },
  { label: 'BOL 模板', route: 'print_template-bol', icon: 'mdi:file-sign' },
  { label: '海柜费用发票', route: 'print_template-invoice', icon: 'mdi:file-chart-outline' },
  { label: '库位标签模板', route: 'print_template-location', icon: 'mdi:map-marker-outline' },
  { label: '报表模板', route: 'print_template-report', icon: 'mdi:chart-bar' },
  { label: '模板版本', route: 'print_template-version', icon: 'mdi:history' },
  { label: '打印规则', route: 'print_rule', icon: 'mdi:tune-variant' }
];

const publishedTemplateCount = computed(() => stats.value.recentTemplates.length);

async function loadStats() {
  const { data } = await fetchGetPrintWorkbench();
  if (data) stats.value = data;
}

function goRoute(name: string) {
  router.push({ name });
}

onMounted(loadStats);
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-auto">
    <NGrid :x-gap="16" :y-gap="16" cols="1 s:2 m:3" responsive="screen">
      <NGridItem>
        <NCard size="small" hoverable class="cursor-pointer" @click="goRoute('print_template-pallet-label')">
          <NStatistic label="常用模板" :value="publishedTemplateCount">
            <template #suffix>个</template>
          </NStatistic>
        </NCard>
      </NGridItem>
      <NGridItem>
        <NCard size="small" hoverable class="cursor-pointer" @click="goRoute('print_template-version')">
          <NStatistic label="模板总使用次数">
            <template #default>
              {{ stats.recentTemplates.reduce((sum, t) => sum + t.useCount, 0) }}
            </template>
            <template #suffix>次</template>
          </NStatistic>
        </NCard>
      </NGridItem>
      <NGridItem>
        <NCard size="small" hoverable class="cursor-pointer" @click="goRoute('print_rule')">
          <NStatistic label="打印规则" value="配置" />
        </NCard>
      </NGridItem>
    </NGrid>

    <NGrid :x-gap="16" :y-gap="16" cols="1 m:3" responsive="screen">
      <NGridItem span="1 m:2">
        <NCard title="快捷入口" size="small" :bordered="false" class="card-wrapper">
          <NGrid :x-gap="12" :y-gap="12" cols="2 s:4" responsive="screen">
            <NGridItem v-for="item in quickEntries" :key="item.label">
              <NButton block secondary size="large" @click="goRoute(item.route)">
                {{ item.label }}
              </NButton>
            </NGridItem>
          </NGrid>
        </NCard>
      </NGridItem>

      <NGridItem>
        <NCard title="常用模板" size="small" :bordered="false" class="card-wrapper">
          <NList v-if="stats.recentTemplates.length">
            <NListItem v-for="t in stats.recentTemplates" :key="t.id">
              <NThing :title="t.name" :description="`使用 ${t.useCount} 次`" />
            </NListItem>
          </NList>
          <NEmpty v-else description="暂无模板数据" />
        </NCard>

        <NCard title="提醒" size="small" :bordered="false" class="card-wrapper mt-16px">
          <NList v-if="stats.alerts.length">
            <NListItem v-for="(a, i) in stats.alerts" :key="i">
              <NThing :title="a.message" :description="a.time">
                <template #header-extra>
                  <NTag :type="a.level === 'error' ? 'error' : 'warning'" size="small">
                    {{ a.level === 'error' ? '异常' : '提醒' }}
                  </NTag>
                </template>
              </NThing>
            </NListItem>
          </NList>
          <NEmpty v-else description="暂无提醒" />
        </NCard>
      </NGridItem>
    </NGrid>
  </div>
</template>
