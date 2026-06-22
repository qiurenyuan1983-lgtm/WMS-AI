<script setup lang="ts">
import { NCard, NDescriptions, NDescriptionsItem, NDivider, NTag } from 'naive-ui';

defineOptions({ name: 'OmsTripOrderDetail' });
</script>

<template>
  <div class="min-h-500px p-16px">
    <NCard title="车次订单详情 — TRIP250604001" size="small" :bordered="false">
      <p class="mb-12px text-13px text-#6b7280">原型演示页：展示车次订单基础信息、供应商/司机、仓库装车信息结构。</p>

      <NDivider title-placement="left">基础信息</NDivider>
      <NDescriptions :columns="3" label-placement="left" bordered size="small" class="mb-12px">
        <NDescriptionsItem label="车次订单号">TRIP250604001</NDescriptionsItem>
        <NDescriptionsItem label="目的地">XLX7</NDescriptionsItem>
        <NDescriptionsItem label="业务类型">Amazon</NDescriptionsItem>
        <NDescriptionsItem label="客户">演示客户 A / 演示客户 B</NDescriptionsItem>
        <NDescriptionsItem label="预约号">ISA-8844221</NDescriptionsItem>
        <NDescriptionsItem label="预约时间">2026-06-05 10:00</NDescriptionsItem>
        <NDescriptionsItem label="车型">53尺</NDescriptionsItem>
        <NDescriptionsItem label="总板数">26</NDescriptionsItem>
        <NDescriptionsItem label="总箱数">120</NDescriptionsItem>
        <NDescriptionsItem label="总重量">8500 kg</NDescriptionsItem>
        <NDescriptionsItem label="总 CBM">42.5</NDescriptionsItem>
        <NDescriptionsItem label="状态">
          <NTag type="info" size="small">待装车</NTag>
        </NDescriptionsItem>
      </NDescriptions>

      <NDivider title-placement="left">供应商与司机信息</NDivider>
      <NDescriptions :columns="3" label-placement="left" bordered size="small" class="mb-12px">
        <NDescriptionsItem label="供应商">ABC Trucking</NDescriptionsItem>
        <NDescriptionsItem label="司机姓名">John</NDescriptionsItem>
        <NDescriptionsItem label="司机电话">+1 626-555-0100</NDescriptionsItem>
        <NDescriptionsItem label="车牌号">8ABC123</NDescriptionsItem>
        <NDescriptionsItem label="车厢号">TRL-5521</NDescriptionsItem>
        <NDescriptionsItem label="Check In 时间">--</NDescriptionsItem>
        <NDescriptionsItem label="发车时间">--</NDescriptionsItem>
      </NDescriptions>

      <NDivider title-placement="left">仓库装车信息</NDivider>
      <NDescriptions :columns="3" label-placement="left" bordered size="small">
        <NDescriptionsItem label="分配 DOCK">05</NDescriptionsItem>
        <NDescriptionsItem label="装车组">出库组 A</NDescriptionsItem>
        <NDescriptionsItem label="装车方式">卡板装车</NDescriptionsItem>
        <NDescriptionsItem label="装车开始时间">--</NDescriptionsItem>
        <NDescriptionsItem label="装车完成时间">--</NDescriptionsItem>
        <NDescriptionsItem label="扫描数量">0 / 26</NDescriptionsItem>
      </NDescriptions>
    </NCard>
  </div>
</template>
