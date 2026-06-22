<script setup lang="ts">
import { NCard, NForm, NFormItem, NInput, NButton, NSpace } from 'naive-ui';

defineOptions({ name: 'CommArchive' });

function proto(msg: string) {
  window.$message?.info(`[原型] ${msg}`);
}
</script>

<template>
  <NCard title="消息归档" size="small" class="card-wrapper max-w-720px">
    <p class="text-sm text-gray-500 mb-16px">按关键词、联系人、订单号、时间范围搜索历史沟通并导出。</p>
    <NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><NForm label-placement="left" label-width="80">
      <NFormItem label="关键词">
        <NInput placeholder="消息内容关键词" />
      </NFormItem>
      <NFormItem label="订单号">
        <NInput placeholder="FSHY2508058785" />
      </NFormItem>
      <NFormItem label="海柜号">
        <NInput placeholder="OOCU6861115" />
      </NFormItem>
      <NFormItem label="车次号">
        <NInput placeholder="PC250601001" />
      </NFormItem>
      <NFormItem>
        <NSpace>
          <NButton type="primary" @click="proto('搜索归档')">搜索</NButton>
          <NButton @click="proto('导出沟通记录')">导出</NButton>
        </NSpace>
      </NFormItem>
    </NForm></NCollapseItem></NCollapse>
  </NCard>
</template>
