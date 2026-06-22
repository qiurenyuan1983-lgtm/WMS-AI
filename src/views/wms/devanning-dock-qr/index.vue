<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import QRCode from 'qrcode';
import { NButton, NCard, NInput, NSpin, NTag, useMessage } from 'naive-ui';
import { fetchGetDevanningWorkTasks } from '@/service/api/wms/devanning-work';
import { fetchGetYardDockList } from '@/service/api/yard/dock';
import {
  buildDevanningExecQuery,
  pickDevanningExecTask
} from '@/views/wms/devanning-work/utils/resolve-exec-task';

defineOptions({ name: 'WmsDevanningDockQr' });

const router = useRouter();
const message = useMessage();

interface DockQrItem {
  id: number;
  dockCode: string;
  dockName: string;
  dockType: string;
  dockStatus: string;
  zoneCode: string | null;
  workUrl: string;
  qrDataUrl: string;
}

const docks = ref<DockQrItem[]>([]);
const loading = ref(false);

function buildDevanningWorkUrl(dockId: CommonType.IdType): string {
  const resolved = router.resolve({
    name: 'wms_devanning-work-exec',
    query: { dockId: String(dockId) }
  });
  const origin = window.location.origin;
  const base = import.meta.env.VITE_BASE_URL || '/';
  const historyMode = import.meta.env.VITE_ROUTER_HISTORY_MODE === 'history';

  if (historyMode) {
    const basePath = base === '/' ? '' : base.replace(/\/$/, '');
    const path = resolved.fullPath.startsWith('/') ? resolved.fullPath : `/${resolved.fullPath}`;
    return `${origin}${basePath}${path}`;
  }

  const baseHref = new URL(base, origin).href.replace(/\/$/, '');
  const hashPath = resolved.href.startsWith('#') ? resolved.href : `#${resolved.href}`;
  return `${baseHref}${hashPath}`;
}

async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 240,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' }
  });
}

const DOCK_STATUS_MAP: Record<string, { label: string; type: 'default' | 'success' | 'warning' | 'error' }> = {
  IDLE: { label: '空闲', type: 'success' },
  OCCUPIED: { label: '占用', type: 'warning' },
  DISABLED: { label: '停用', type: 'default' }
};

const DOCK_TYPE_MAP: Record<string, string> = {
  DEVANNING: '拆柜口',
  LOADING: '装车口',
  MIXED: '混合'
};

async function loadDocks() {
  loading.value = true;
  try {
    const { data } = await fetchGetYardDockList({ pageNum: 1, pageSize: 200, enabledFlag: 1 } as any);
    let rows: any[] = (data as any)?.rows ?? [];
    rows = rows.filter(
      (d: any) => d.dockType === 'DEVANNING' || String(d.dockCode || '').includes('DOC-LA')
    );
    if (!rows.length) {
      rows = [
        { id: 3010001, dockCode: 'DOC-LA-001', dockName: 'LA 拆柜口 1', dockType: 'DEVANNING', dockStatus: 'IDLE', zoneCode: 'CZ-A' },
        { id: 3010002, dockCode: 'DOC-LA-002', dockName: 'LA 拆柜口 2', dockType: 'DEVANNING', dockStatus: 'IDLE', zoneCode: 'CZ-A' }
      ];
    }

    const result: DockQrItem[] = [];
    for (const d of rows) {
      const workUrl = buildDevanningWorkUrl(d.id);
      const qrDataUrl = await generateQrDataUrl(workUrl);
      result.push({
        id: Number(d.id),
        dockCode: d.dockCode,
        dockName: d.dockName,
        dockType: d.dockType,
        dockStatus: d.dockStatus,
        zoneCode: d.zoneCode ?? null,
        workUrl,
        qrDataUrl
      });
    }
    docks.value = result.sort((a, b) => a.dockCode.localeCompare(b.dockCode));
  } finally {
    loading.value = false;
  }
}

async function copyUrl(url: string, e?: Event) {
  e?.stopPropagation();
  try {
    await navigator.clipboard.writeText(url);
    message.success('链接已复制');
  } catch {
    message.error('复制失败，请手动复制');
  }
}

/** 进入该 Dock 的拆柜操作界面（与任务列表「进入拆柜操作」一致） */
async function openWorkPage(d: DockQrItem) {
  const { data } = await fetchGetDevanningWorkTasks({ dockId: d.id });
  const rows = (data as Api.Wms.DevanningWorkTaskList | undefined)?.rows ?? [];
  const task = pickDevanningExecTask(rows, d.id);
  if (!task) {
    message.warning('该 Dock 暂无可用拆柜任务，请先在海柜任务列表中选择');
    router.push({ name: 'wms_devanning-work', query: { dockId: String(d.id) } });
    return;
  }
  router.push({
    name: 'wms_devanning-work-exec',
    query: buildDevanningExecQuery(task)
  });
}

function downloadQr(d: DockQrItem, e?: Event) {
  e?.stopPropagation();
  const a = document.createElement('a');
  a.href = d.qrDataUrl;
  a.download = `拆柜作业_${d.dockCode}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function printQr(d: DockQrItem, e?: Event) {
  e?.stopPropagation();
  const win = window.open('', '_blank');
  if (!win) {
    message.error('请允许弹出窗口后重试');
    return;
  }
  const typeLabel = DOCK_TYPE_MAP[d.dockType] || d.dockType;
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>拆柜作业 - ${d.dockName}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
               display: flex; flex-direction: column; align-items: center;
               justify-content: center; min-height: 100vh; padding: 40px; }
        .card { border: 2px solid #e0e0e0; border-radius: 12px; padding: 32px 40px;
                text-align: center; max-width: 360px; }
        .title { font-size: 22px; font-weight: 700; color: #111; margin-bottom: 4px; }
        .code { font-size: 14px; color: #888; margin-bottom: 4px; }
        .desc { font-size: 15px; color: #333; margin: 20px 0 8px; }
        .qr { margin: 8px 0 16px; display: block; }
        .url { font-size: 11px; color: #aaa; word-break: break-all; margin-top: 12px; }
        @media print { @page { margin: 0; } }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="title">${d.dockName}</div>
        <div class="code">${d.dockCode} \u00b7 ${typeLabel}</div>
        <div class="desc">扫码进入本 Dock 拆柜操作</div>
        <img class="qr" src="${d.qrDataUrl}" width="240" height="240" />
        <div class="url">${d.workUrl}</div>
      </div>
      <script>window.onload = () => { window.print(); }<\/script>
    </body>
    </html>
  `);
  win.document.close();
}

onMounted(loadDocks);
</script>

<template>
  <div class="h-full overflow-y-auto p-16px">
    <NCard :bordered="false" class="mb-16px card-wrapper">
      <div class="flex items-start gap-16px">
        <div class="i-mdi:qrcode-scan text-40px text-primary-500 flex-shrink-0 mt-2px" />
        <div class="flex-1 min-w-0">
          <div class="text-15px font-semibold text-gray-800 mb-4px">拆柜 Dock 作业链路</div>
          <div class="text-13px text-gray-500 leading-relaxed mb-12px">
            每个拆柜 Dock 对应独立拆柜任务。点击下方 Dock 卡片、扫码或「进入拆柜操作」，将直接进入
            <strong>拆柜操作</strong>界面（扫码收货、打板等）；无可用任务时跳转任务列表。
          </div>
          <div v-if="docks.length" class="flex flex-wrap gap-8px">
            <NButton
              v-for="d in docks"
              :key="'chip-' + d.id"
              size="small"
              type="primary"
              ghost
              @click="openWorkPage(d)"
            >
              {{ d.dockCode }} · 进入拆柜操作
            </NButton>
          </div>
        </div>
      </div>
    </NCard>

    <div v-if="loading" class="flex justify-center items-center h-240px">
      <NSpin size="large" />
    </div>

    <div
      v-else-if="docks.length"
      class="grid gap-16px"
      style="grid-template-columns: repeat(auto-fill, minmax(360px, 1fr))"
    >
      <NCard
        v-for="d in docks"
        :key="String(d.id)"
        :bordered="false"
        class="card-wrapper dock-card"
        content-style="padding: 20px;"
        hoverable
        @click="openWorkPage(d)"
      >
        <div class="text-center mb-16px">
          <div class="text-16px font-semibold text-gray-800">{{ d.dockName }}</div>
          <div class="text-12px text-gray-400 mt-2px">
            {{ d.dockCode }}<span v-if="d.zoneCode"> · {{ d.zoneCode }}</span>
          </div>
          <div class="mt-8px flex justify-center gap-8px">
            <NTag size="small" type="info">{{ DOCK_TYPE_MAP[d.dockType] || d.dockType }}</NTag>
            <NTag size="small" :type="DOCK_STATUS_MAP[d.dockStatus]?.type || 'default'">
              {{ DOCK_STATUS_MAP[d.dockStatus]?.label || d.dockStatus }}
            </NTag>
          </div>
          <div class="text-11px text-primary mt-8px">点击卡片进入本 Dock 拆柜操作</div>
        </div>

        <div class="flex justify-center mb-14px" @click.stop>
          <img
            :src="d.qrDataUrl"
            :alt="d.dockName + ' 二维码'"
            width="200"
            height="200"
            class="border border-gray-100 rounded-8px"
          />
        </div>

        <div @click.stop>
          <NInput
            :value="d.workUrl"
            readonly
            size="small"
            class="mb-12px"
            :input-props="{ style: 'font-size:11px; color:#999; cursor:default' }"
          />

          <div class="flex flex-wrap gap-8px justify-center">
            <NButton size="small" type="primary" @click="openWorkPage(d)">
              <template #icon><div class="i-mdi:play-circle-outline text-14px" /></template>
              进入拆柜操作
            </NButton>
            <NButton size="small" @click="copyUrl(d.workUrl, $event)">
              <template #icon><div class="i-mdi:content-copy text-14px" /></template>
              复制链接
            </NButton>
            <NButton size="small" @click="downloadQr(d, $event)">
              <template #icon><div class="i-mdi:download text-14px" /></template>
              下载二维码
            </NButton>
            <NButton size="small" @click="printQr(d, $event)">
              <template #icon><div class="i-mdi:printer text-14px" /></template>
              打印
            </NButton>
          </div>
        </div>
      </NCard>
    </div>

    <NCard v-else :bordered="false" class="card-wrapper">
      <div class="flex justify-center items-center h-160px text-gray-400 text-14px">
        暂无拆柜 Dock，请先在堆场管理中配置拆柜类型道口
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.dock-card {
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.dock-card:hover {
  transform: translateY(-2px);
}
</style>
