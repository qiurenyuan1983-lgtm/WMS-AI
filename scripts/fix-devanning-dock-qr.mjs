import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const u = (...c) => c.map(x => String.fromCharCode(x)).join('');
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// Fix yard mock dock names
const yardPath = path.join(root, 'src/mock/data/yard.ts');
let yard = fs.readFileSync(yardPath, 'utf8');
yard = yard
  .replace(/zoneName: '[^']* A'/, `zoneName: '${u(0x6d77, 0x67f3, 0x533a)} A'`)
  .replace(/zoneName: '[^']* B'/, `zoneName: '${u(0x8f66, 0x5e26, 0x533a)} B'`)
  .replace(/dockName: 'LA [^']* 1'/, `dockName: 'LA ${u(0x62c6, 0x67dc, 0x53e3)} 1'`)
  .replace(/dockName: 'LA [^']* 2'/, `dockName: 'LA ${u(0x62c6, 0x67dc, 0x53e3)} 2'`)
  .replace(/dockName: '[^']* 01'/, `dockName: '${u(0x7b49, 0x5f85, 0x4f4d)} 01'`);
fs.writeFileSync(yardPath, yard, 'utf8');

const vuePath = path.join(root, 'src/views/wms/devanning-dock-qr/index.vue');
const vue = `<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import QRCode from 'qrcode';
import { NButton, NCard, NInput, NSpin, NTag, useMessage } from 'naive-ui';
import { fetchGetYardDockList } from '@/service/api/yard/dock';

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
    name: 'wms_devanning-work',
    query: { dockId: String(dockId) }
  });
  const origin = window.location.origin;
  const base = import.meta.env.VITE_BASE_URL || '/';
  const historyMode = import.meta.env.VITE_ROUTER_HISTORY_MODE === 'history';

  if (historyMode) {
    const basePath = base === '/' ? '' : base.replace(/\\/$/, '');
    const path = resolved.fullPath.startsWith('/') ? resolved.fullPath : \`/\${resolved.fullPath}\`;
    return \`\${origin}\${basePath}\${path}\`;
  }

  const baseHref = new URL(base, origin).href.replace(/\\/$/, '');
  const hashPath = resolved.href.startsWith('#') ? resolved.href : \`#\${resolved.href}\`;
  return \`\${baseHref}\${hashPath}\`;
}

async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 240,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' }
  });
}

const DOCK_STATUS_MAP: Record<string, { label: string; type: 'default' | 'success' | 'warning' | 'error' }> = {
  IDLE: { label: '${u(0x7a7a, 0x95f2)}', type: 'success' },
  OCCUPIED: { label: '${u(0x5360, 0x7528)}', type: 'warning' },
  DISABLED: { label: '${u(0x505c, 0x7528)}', type: 'default' }
};

const DOCK_TYPE_MAP: Record<string, string> = {
  DEVANNING: '${u(0x62c6, 0x67dc, 0x53e3)}',
  LOADING: '${u(0x88c5, 0x8f66, 0x53e3)}',
  MIXED: '${u(0x6df7, 0x5408)}'
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
        { id: 3010001, dockCode: 'DOC-LA-001', dockName: 'LA ${u(0x62c6, 0x67dc, 0x53e3)} 1', dockType: 'DEVANNING', dockStatus: 'IDLE', zoneCode: 'CZ-A' },
        { id: 3010002, dockCode: 'DOC-LA-002', dockName: 'LA ${u(0x62c6, 0x67dc, 0x53e3)} 2', dockType: 'DEVANNING', dockStatus: 'IDLE', zoneCode: 'CZ-A' }
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

async function copyUrl(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    message.success('${u(0x94fe, 0x63a5, 0x5df2, 0x590d, 0x5236)}');
  } catch {
    message.error('${u(0x590d, 0x5236, 0x5931, 0x8d25, 0xff0c, 0x8bf7, 0x624b, 0x52a8, 0x590d, 0x5236)}');
  }
}

function openWorkPage(d: DockQrItem) {
  router.push({ name: 'wms_devanning-work', query: { dockId: String(d.id) } });
}

function downloadQr(d: DockQrItem) {
  const a = document.createElement('a');
  a.href = d.qrDataUrl;
  a.download = \`${u(0x62c6, 0x67dc, 0x4f5c, 0x4e1a)}_\${d.dockCode}.png\`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function printQr(d: DockQrItem) {
  const win = window.open('', '_blank');
  if (!win) {
    message.error('${u(0x8bf7, 0x5141, 0x8bb8, 0x5f39, 0x51fa, 0x7a97, 0x53e3, 0x540e, 0x91cd, 0x8bd5)}');
    return;
  }
  const typeLabel = DOCK_TYPE_MAP[d.dockType] || d.dockType;
  win.document.write(\`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${u(0x62c6, 0x67dc, 0x4f5c, 0x4e1a)} - \${d.dockName}</title>
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
        <div class="title">\${d.dockName}</div>
        <div class="code">\${d.dockCode} \\u00b7 \${typeLabel}</div>
        <div class="desc">${u(0x626b, 0x7801, 0x8fdb, 0x5165, 0x672c, 0x20, 0x44, 0x6f, 0x63, 0x6b, 0x20, 0x62b1, 0x67dc, 0x4efb, 0x52a1, 0x5217, 0x8868)}</div>
        <img class="qr" src="\${d.qrDataUrl}" width="240" height="240" />
        <div class="url">\${d.workUrl}</div>
      </div>
      <script>window.onload = () => { window.print(); }<\\/script>
    </body>
    </html>
  \`);
  win.document.close();
}

onMounted(loadDocks);
</script>

<template>
  <div class="h-full overflow-y-auto p-16px">
    <NCard :bordered="false" class="mb-16px card-wrapper">
      <div class="flex items-start gap-16px">
        <div class="i-mdi:qrcode-scan text-40px text-primary-500 flex-shrink-0 mt-2px" />
        <div>
          <div class="text-15px font-semibold text-gray-800 mb-4px">${u(0x62c6, 0x67dc, 0x20, 0x44, 0x6f, 0x63, 0x6b, 0x20, 0x4f5c, 0x4e1a, 0x94fe, 0x8b63)}</div>
          <div class="text-13px text-gray-500 leading-relaxed">
            ${u(0x6bcf, 0x4e2a, 0x62c6, 0x67dc, 0x20, 0x44, 0x6f, 0x63, 0x6b, 0x20, 0x5bf9, 0x5e94, 0x72ec, 0x7acb, 0x4efb, 0x52a1, 0x5217, 0x8868, 0xff0c, 0x6253, 0x5370, 0x4e8c, 0x7ef4, 0x7801, 0x5f20, 0x8d34, 0x5728, 0x9053, 0x53e3, 0x65c1, 0x3002, 0x4f5c, 0x4e1a, 0x4eba, 0x5458, 0x626b, 0x7801, 0x5373, 0x53ef, 0x8fdb, 0x5165, 0x8be5, 0x20, 0x44, 0x6f, 0x63, 0x6b, 0x20, 0x7684)}
            <strong>${u(0x4eba, 0x5de5, 0x62c6, 0x67dc)}</strong>${u(0x4efb, 0x52a1, 0x5217, 0x8868, 0xff0c, 0x518d, 0x9009, 0x6d77, 0x67dc, 0x8fdb, 0x5165, 0x62c6, 0x67dc, 0x4f5c, 0x4e1a, 0x3002, 0x94fe, 0x63a5, 0x542b, 0x20, 0x64, 0x6f, 0x63, 0x6b, 0x49, 0x64, 0x20, 0x53f7, 0xff0c, 0x4e0e, 0x5806, 0x573a, 0x20, 0x44, 0x6f, 0x63, 0x6b, 0x20, 0x4e00, 0x4e00, 0x5bf9, 0x5e94, 0x3002)}
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
        class="card-wrapper"
        content-style="padding: 20px;"
      >
        <div class="text-center mb-16px">
          <div class="text-16px font-semibold text-gray-800">{{ d.dockName }}</div>
          <div class="text-12px text-gray-400 mt-2px">
            {{ d.dockCode }}<span v-if="d.zoneCode"> ?? {{ d.zoneCode }}</span>
          </div>
          <div class="mt-8px flex justify-center gap-8px">
            <NTag size="small" type="info">{{ DOCK_TYPE_MAP[d.dockType] || d.dockType }}</NTag>
            <NTag size="small" :type="DOCK_STATUS_MAP[d.dockStatus]?.type || 'default'">
              {{ DOCK_STATUS_MAP[d.dockStatus]?.label || d.dockStatus }}
            </NTag>
          </div>
          <div class="text-11px text-blue-400 mt-6px">${u(0x4eba, 0x5de5, 0x62c6, 0x67dc)} ?? Dock {{ d.id }}</div>
        </div>

        <div class="flex justify-center mb-14px">
          <img
            :src="d.qrDataUrl"
            :alt="d.dockName + '${u(0x20, 0x4e8c, 0x7ef4, 0x7801)}'"
            width="200"
            height="200"
            class="border border-gray-100 rounded-8px"
          />
        </div>

        <NInput
          :value="d.workUrl"
          readonly
          size="small"
          class="mb-12px"
          :input-props="{ style: 'font-size:11px; color:#999; cursor:default' }"
        />

        <div class="flex flex-wrap gap-8px justify-center">
          <NButton size="small" @click="copyUrl(d.workUrl)">
            <template #icon><div class="i-mdi:content-copy text-14px" /></template>
            ${u(0x590d, 0x5236, 0x94fe, 0x63a5)}
          </NButton>
          <NButton size="small" @click="openWorkPage(d)">
            <template #icon><div class="i-mdi:open-in-new text-14px" /></template>
            ${u(0x6253, 0x5f00)}
          </NButton>
          <NButton size="small" @click="downloadQr(d)">
            <template #icon><div class="i-mdi:download text-14px" /></template>
            ${u(0x4e0b, 0x8f7d)}
          </NButton>
          <NButton size="small" type="primary" @click="printQr(d)">
            <template #icon><div class="i-mdi:printer text-14px" /></template>
            ${u(0x6253, 0x5370)}
          </NButton>
        </div>
      </NCard>
    </div>

    <NCard v-else :bordered="false" class="card-wrapper">
      <div class="flex justify-center items-center h-160px text-gray-400 text-14px">
        ${u(0x6682, 0x65e0, 0x62c6, 0x67dc, 0x20, 0x44, 0x6f, 0x63, 0x6b, 0xff0c, 0x8bf7, 0x5148, 0x5728, 0x5806, 0x573a, 0x7ba1, 0x7406, 0x4e2d, 0x914d, 0x7f6e, 0x62c6, 0x67dc, 0x7c7b, 0x578b, 0x9053, 0x9053)}
      </div>
    </NCard>
  </div>
</template>
`;

fs.writeFileSync(vuePath, vue, 'utf8');
console.log('fixed devanning-dock-qr + yard.ts');
