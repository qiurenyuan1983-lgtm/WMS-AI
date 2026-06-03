<script setup lang="ts">
import { onMounted, ref } from 'vue';
import QRCode from 'qrcode';
import { NButton, NCard, NInput, NSpin, useMessage } from 'naive-ui';
import { fetchGetWarehouseList } from '@/service/api/base';
import { useAuth } from '@/hooks/business/auth';

defineOptions({ name: 'YmsGateDriverQr' });

useAuth();
const message = useMessage();

interface WarehouseQr {
  id: CommonType.IdType;
  tenantId: string;
  warehouseCode: string;
  warehouseName: string;
  city: string | null;
  checkinUrl: string;
  yardgoUrl: string;
  qrDataUrl: string;
  yardgoQrDataUrl: string;
}

const warehouses = ref<WarehouseQr[]>([]);
const loading = ref(false);

function buildCheckinUrl(warehouseId: CommonType.IdType, tenantId: string): string {
  return `${window.location.origin}/h5/yard/driver-checkin?warehouseId=${warehouseId}&tenantId=${tenantId}`;
}

function buildYardgoUrl(warehouseId: CommonType.IdType, tenantId: string): string {
  return `${window.location.origin}/h5/yard/task?warehouseId=${warehouseId}&tenantId=${tenantId}`;
}

async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 240,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' }
  });
}

async function loadWarehouses() {
  loading.value = true;
  try {
    const { data } = await fetchGetWarehouseList({ pageNum: 1, pageSize: 200, status: '0' } as any);
    const rows: Api.Base.MdmWarehouse[] = (data as any)?.rows ?? [];
    const result: WarehouseQr[] = [];
    for (const w of rows) {
      const url = buildCheckinUrl(w.id, w.tenantId);
      const yardgoUrl = buildYardgoUrl(w.id, w.tenantId);
      const qrDataUrl = await generateQrDataUrl(url);
      const yardgoQrDataUrl = await generateQrDataUrl(yardgoUrl);
      result.push({
        id: w.id,
        tenantId: w.tenantId,
        warehouseCode: w.warehouseCode,
        warehouseName: w.warehouseName,
        city: w.city,
        checkinUrl: url,
        yardgoUrl,
        qrDataUrl,
        yardgoQrDataUrl
      });
    }
    warehouses.value = result;
  } finally {
    loading.value = false;
  }
}

async function copyUrl(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    message.success('链接已复制');
  } catch {
    message.error('复制失败，请手动复制');
  }
}

function downloadQr(w: WarehouseQr) {
  const a = document.createElement('a');
  a.href = w.qrDataUrl;
  a.download = `海柜CheckIn_${w.warehouseCode}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function printQr(w: WarehouseQr) {
  const win = window.open('', '_blank');
  if (!win) {
    message.error('请允许弹出窗口后重试');
    return;
  }
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>司机签到码 - ${w.warehouseName}</title>
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
        <div class="title">${w.warehouseName}</div>
        <div class="code">${w.warehouseCode}${w.city ? ' · ' + w.city : ''}</div>
        <div class="desc">海柜司机扫码自助签到</div>
        <img class="qr" src="${w.qrDataUrl}" width="240" height="240" />
        <div class="url">${w.checkinUrl}</div>
      </div>
      <script>window.onload = () => { window.print(); }<\/script>
    </body>
    </html>
  `);
  win.document.close();
}

onMounted(loadWarehouses);
</script>

<template>
  <div class="h-full overflow-y-auto p-16px">

    <!-- 说明栏 -->
    <NCard :bordered="false" class="mb-16px card-wrapper">
      <div class="flex items-start gap-16px">
        <div class="i-mdi:qrcode text-40px text-primary-500 flex-shrink-0 mt-2px" />
        <div>
          <div class="text-15px font-semibold text-gray-800 mb-4px">海柜 Check-in QR 码管理</div>
          <div class="text-13px text-gray-500 leading-relaxed">
            每个仓库对应一个固定二维码，打印后张贴在园区入口。<br />
            海柜司机到达后扫码，填写<strong>海柜号</strong>、<strong>堆场位</strong>、<strong>手机号</strong>即可完成自助入场登记。YardGo 码用于内部司机查看并领取当前仓库的院内移动任务。
          </div>
        </div>
      </div>
    </NCard>

    <!-- 加载中 -->
    <div v-if="loading" class="flex justify-center items-center h-240px">
      <NSpin size="large" />
    </div>

    <!-- 卡片网格 -->
    <div
      v-else-if="warehouses.length"
      class="grid gap-16px"
      style="grid-template-columns: repeat(auto-fill, minmax(360px, 1fr))"
    >
      <NCard
        v-for="w in warehouses"
        :key="String(w.id)"
        :bordered="false"
        class="card-wrapper"
        content-style="padding: 20px;"
      >
        <!-- 仓库名 + 编码 -->
        <div class="text-center mb-16px">
          <div class="text-16px font-semibold text-gray-800">{{ w.warehouseName }}</div>
          <div class="text-12px text-gray-400 mt-2px">
            {{ w.warehouseCode }}<span v-if="w.city"> · {{ w.city }}</span>
          </div>
          <div class="text-11px text-blue-400 mt-4px">海柜 Check-in</div>
        </div>

        <!-- 二维码 -->
        <div class="mb-14px grid grid-cols-2 gap-12px">
          <div class="text-center">
            <img
              :src="w.qrDataUrl"
              :alt="`${w.warehouseName} 签到码`"
              width="144"
              height="144"
              class="mx-auto border border-gray-100 rounded-8px"
            />
            <div class="mt-6px text-12px text-gray-500">海柜 Check-in</div>
          </div>
          <div class="text-center">
            <img
              :src="w.yardgoQrDataUrl"
              :alt="`${w.warehouseName} YardGo码`"
              width="144"
              height="144"
              class="mx-auto border border-gray-100 rounded-8px"
            />
            <div class="mt-6px text-12px text-gray-500">YardGo 任务</div>
          </div>
        </div>

        <!-- 链接输入框 -->
        <NInput
          :value="w.checkinUrl"
          readonly
          size="small"
          class="mb-12px"
          :input-props="{ style: 'font-size:11px; color:#999; cursor:default' }"
        />
        <NInput
          :value="w.yardgoUrl"
          readonly
          size="small"
          class="mb-12px"
          :input-props="{ style: 'font-size:11px; color:#999; cursor:default' }"
        />

        <!-- 操作 -->
        <div class="flex gap-8px justify-center">
          <NButton size="small" @click="copyUrl(w.checkinUrl)">
            <template #icon><div class="i-mdi:content-copy text-14px" /></template>
            复制签到
          </NButton>
          <NButton size="small" @click="copyUrl(w.yardgoUrl)">
            <template #icon><div class="i-mdi:forklift text-14px" /></template>
            复制YardGo
          </NButton>
          <NButton size="small" @click="downloadQr(w)">
            <template #icon><div class="i-mdi:download text-14px" /></template>
            下载
          </NButton>
          <NButton size="small" type="primary" @click="printQr(w)">
            <template #icon><div class="i-mdi:printer text-14px" /></template>
            打印
          </NButton>
        </div>
      </NCard>
    </div>

    <!-- 空状态 -->
    <NCard v-else :bordered="false" class="card-wrapper">
      <div class="flex justify-center items-center h-160px text-gray-400 text-14px">
        暂无仓库数据，请先在基础数据中配置仓库
      </div>
    </NCard>

  </div>
</template>
