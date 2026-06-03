<script setup lang="ts">
import { onMounted, ref } from 'vue';
import QRCode from 'qrcode';
import { NButton, NCard, NInput, useMessage } from 'naive-ui';

defineOptions({ name: 'YmsGateTrailerLink' });

const message = useMessage();

const checkinUrl = ref('');
const qrDataUrl = ref('');

async function init() {
  const url = `${window.location.origin}/h5/yard/trailer-checkin`;
  checkinUrl.value = url;
  qrDataUrl.value = await QRCode.toDataURL(url, {
    width: 240,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' }
  });
}

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(checkinUrl.value);
    message.success('链接已复制');
  } catch {
    message.error('复制失败，请手动复制');
  }
}

function downloadQr() {
  const a = document.createElement('a');
  a.href = qrDataUrl.value;
  a.download = '装车CheckIn.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function printQr() {
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
      <title>装车 Check-in</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
               display: flex; flex-direction: column; align-items: center;
               justify-content: center; min-height: 100vh; padding: 40px; }
        .card { border: 2px solid #e0e0e0; border-radius: 12px; padding: 32px 40px;
                text-align: center; max-width: 360px; }
        .title { font-size: 22px; font-weight: 700; color: #111; margin-bottom: 8px; }
        .desc { font-size: 15px; color: #333; margin: 20px 0 8px; }
        .qr { margin: 8px 0 16px; display: block; }
        .url { font-size: 11px; color: #aaa; word-break: break-all; margin-top: 12px; }
        @media print { @page { margin: 0; } }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="title">装车 Check-in</div>
        <div class="desc">司机扫码填写提货号登记</div>
        <img class="qr" src="${qrDataUrl.value}" width="240" height="240" />
        <div class="url">${checkinUrl.value}</div>
      </div>
      <script>window.onload = () => { window.print(); }<\/script>
    </body>
    </html>
  `);
  win.document.close();
}

onMounted(init);
</script>

<template>
  <div class="h-full overflow-y-auto p-16px">

    <!-- 说明栏 -->
    <NCard :bordered="false" class="mb-16px card-wrapper">
      <div class="flex items-start gap-16px">
        <div class="i-mdi:truck-outline text-40px text-primary-500 flex-shrink-0 mt-2px" />
        <div>
          <div class="text-15px font-semibold text-gray-800 mb-4px">装车 Check-in 链接</div>
          <div class="text-13px text-gray-500 leading-relaxed">
            装车司机通过此链接或扫码进入登记表，输入<strong>提货号 (Pick Up #)</strong> 查询派送安排，填写手机号、驾照号、车厢号完成预登记。<br />
            无需仓库参数，全局唯一链接。
          </div>
        </div>
      </div>
    </NCard>

    <!-- 链接卡片 -->
    <NCard :bordered="false" class="card-wrapper max-w-480px">
      <div class="text-center mb-16px">
        <div class="text-16px font-semibold text-gray-800">装车 Check-in</div>
        <div class="text-11px text-blue-400 mt-4px">Trailer Driver Check-in</div>
      </div>

      <!-- 二维码 -->
      <div class="flex justify-center mb-14px">
        <img
          v-if="qrDataUrl"
          :src="qrDataUrl"
          alt="装车 Check-in QR"
          width="200"
          height="200"
          class="border border-gray-100 rounded-8px"
        />
      </div>

      <!-- 链接输入框 -->
      <NInput
        :value="checkinUrl"
        readonly
        size="small"
        class="mb-12px"
        :input-props="{ style: 'font-size:12px; color:#666; cursor:default' }"
      />

      <!-- 操作 -->
      <div class="flex gap-8px justify-center">
        <NButton size="small" @click="copyUrl">
          <template #icon><div class="i-mdi:content-copy text-14px" /></template>
          复制链接
        </NButton>
        <NButton size="small" @click="downloadQr">
          <template #icon><div class="i-mdi:download text-14px" /></template>
          下载
        </NButton>
        <NButton size="small" type="primary" @click="printQr">
          <template #icon><div class="i-mdi:printer text-14px" /></template>
          打印
        </NButton>
      </div>
    </NCard>

  </div>
</template>
