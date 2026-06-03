<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { NButton, NCard, NDataTable, NInput, NSpace } from 'naive-ui';

defineOptions({ name: 'WmsOutboundLoading' });

const router = useRouter();
const truckNo = ref('CA-TRK-100');
const driver = ref('王师付');
const phone = ref('13800000000');
const pallets = [{ palletNo: 'PLT-001' }, { palletNo: 'PLT-002' }];
</script>

<template>
  <div class="p-16px">
    <NCard title="装车确认">
      <NSpace vertical class="mb-16px">
        <NInput v-model:value="truckNo" placeholder="车牌号" />
        <NInput v-model:value="driver" placeholder="司机" />
        <NInput v-model:value="phone" placeholder="联系方式" />
      </NSpace>
      <NDataTable size="small" :data="pallets" :columns="[{ title: '托盘号', key: 'palletNo' }]" />
      <NSpace class="mt-16px" size="large">
        <NButton size="large">上传照片</NButton>
        <NButton type="primary" size="large">确认装车</NButton>
        <NButton type="success" size="large">完成出库</NButton>
        <NButton @click="router.back()">返回</NButton>
      </NSpace>
    </NCard>
  </div>
</template>
