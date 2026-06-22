<script setup lang="ts">
import { NButton, NCard, NSpace } from 'naive-ui';

defineOptions({ name: 'CommMeeting' });

const meetings = [
  { title: 'XLX7 异常复盘', time: '今天 14:00', members: 6, status: '未开始' },
  { title: '仓库早会', time: '每天 08:00', members: 12, status: '周期' }
];

function proto(msg: string) {
  window.$message?.info(`[原型] ${msg}`);
}
</script>

<template>
  <NCard title="会议" size="small" class="card-wrapper">
    <p class="text-sm text-gray-500 mb-16px">支持语音/视频会议、屏幕共享；第三阶段支持 AI 纪要与录制。</p>
    <NSpace class="mb-16px">
      <NButton type="primary" @click="proto('发起即时会议')">发起即时会议</NButton>
      <NButton @click="proto('预约会议')">预约会议</NButton>
    </NSpace>
    <div class="flex flex-col gap-12px">
      <div v-for="m in meetings" :key="m.title" class="rounded-8px border border-gray-200 p-16px flex justify-between items-center">
        <div>
          <div class="font-medium">{{ m.title }}</div>
          <div class="text-sm text-gray-500">{{ m.time }} · {{ m.members }} 人 · {{ m.status }}</div>
        </div>
        <NButton size="small" type="primary" @click="proto('加入会议')">加入</NButton>
      </div>
    </div>
  </NCard>
</template>
