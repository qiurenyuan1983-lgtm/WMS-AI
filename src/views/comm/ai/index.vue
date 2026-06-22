<script setup lang="ts">
import { ref } from 'vue';
import { NButton, NCard, NInput, NSpace } from 'naive-ui';

defineOptions({ name: 'CommAi' });

const prompt = ref('总结 FSHY2508058785 订单群最近沟通要点');

const suggestions = [
  '生成客户英文回复',
  '提取聊天中的待办事项',
  '翻译最新一条英文消息',
  '总结异常群处理进度'
];

function proto(msg: string) {
  window.$message?.info(`[原型] ${msg}`);
}
</script>

<template>
  <NCard title="AI 助手" size="small" class="card-wrapper max-w-800px">
    <p class="text-sm text-gray-500 mb-16px">快捷回复、聊天总结、待办提取、中英文翻译（第一阶段为原型演示）。</p>
    <NSpace vertical class="w-full">
      <NInput v-model:value="prompt" type="textarea" :autosize="{ minRows: 3, maxRows: 6 }" />
      <NSpace>
        <NButton type="primary" @click="proto('AI 处理')">发送</NButton>
        <NButton v-for="s in suggestions" :key="s" size="small" @click="prompt = s">{{ s }}</NButton>
      </NSpace>
      <div class="rounded-8px bg-gray-50 p-16px text-sm leading-relaxed">
        <div class="font-medium mb-8px">示例输出 · 沟通摘要</div>
        <ol class="m-0 pl-20px">
          <li>客户要求尽快确认 XLX7 派送时间。</li>
          <li>调度已于 06/04 10:30 提交 ISA 预约。</li>
          <li>仓库确认库存 18 板，库位 A09-01 / A09-02。</li>
          <li>当前等待 ISA 确认，责任人：调度 Aaron。</li>
        </ol>
      </div>
    </NSpace>
  </NCard>
</template>
