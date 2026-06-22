<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NModal,
  NRadio,
  NRadioGroup,
  NSpace,
  NSpin,
  NStep,
  NSteps,
  NTag
} from 'naive-ui';
import { useRouterPush } from '@/hooks/common/router';
import { LTL_ORDER_METHOD_OPTIONS } from '../ltl-order/constants';
import { useLtlOrderDetail } from '../ltl-order/composables/use-ltl-order-detail';

defineOptions({ name: 'OmsLtlOrderDetail' });

const route = useRoute();
const { routerPushByKey } = useRouterPush();

const orderId = computed(() => route.query.id as string | undefined);

const {
  loading,
  generateModalVisible,
  generatePreview,
  actionLoading,
  detail,
  orderMethod,
  statusMeta,
  ltl,
  selectedSupplierPortal,
  workflowCurrent,
  supplierColumns,
  loadDetail,
  runAction,
  handlePlaceOrder,
  showProtoInfo,
  openGenerateOrderModal,
  confirmGenerateOrder,
  goTripOrderList,
  LTL_WORKFLOW_STEPS
} = useLtlOrderDetail(orderId);

function goList() {
  routerPushByKey('oms_ltl-order' as any);
}
</script>

<template>
  <div class="ltl-detail-page h-full overflow-auto">
    <NSpin :show="loading">
      <template v-if="detail">
        <div class="page-head">
          <div>
            <div class="breadcrumb text-12px text-gray-500 mb-4px">首页 / OMS系统 / LTL订单 / LTL订单详情</div>
            <div class="flex items-center gap-10px flex-wrap">
              <h1 class="text-20px font-bold m-0">LTL订单详情 {{ detail.orderNo }}</h1>
              <NTag v-if="statusMeta" :type="statusMeta.type">{{ statusMeta.label }}</NTag>
              <NTag type="success" :bordered="false">LTL</NTag>
            </div>
          </div>
          <NSpace>
            <NButton size="small" @click="loadDetail">刷新</NButton>
            <NButton size="small" @click="showProtoInfo('原型：打印订单')">打印</NButton>
            <NButton size="small" @click="goList">返回</NButton>
          </NSpace>
        </div>

        <NCard :bordered="false" class="card-wrapper mb-12px">
          <NSteps :current="workflowCurrent" size="small">
            <NStep v-for="step in LTL_WORKFLOW_STEPS" :key="step" :title="step" />
          </NSteps>
        </NCard>

        <div class="main-grid">
          <div class="left-col">
            <NCard title="订单基本信息" size="small" :bordered="false" class="card-wrapper mb-12px">
              <NDescriptions :column="2" label-placement="left" bordered size="small">
                <NDescriptionsItem label="订单号">{{ detail.orderNo }}</NDescriptionsItem>
                <NDescriptionsItem label="订单类型">{{ detail.orderTypeLabel }}</NDescriptionsItem>
                <NDescriptionsItem label="客户">{{ detail.customerName }}</NDescriptionsItem>
                <NDescriptionsItem label="创建时间">{{ detail.createTime }}</NDescriptionsItem>
                <NDescriptionsItem label="起始仓">{{ ltl?.originWarehouse || 'LA' }}</NDescriptionsItem>
                <NDescriptionsItem label="目的地">{{ detail.destination }}</NDescriptionsItem>
                <NDescriptionsItem label="板数">{{ detail.palletQty }} 板</NDescriptionsItem>
                <NDescriptionsItem label="重量">{{ detail.weightLbs }} lbs</NDescriptionsItem>
                <NDescriptionsItem label="体积">{{ detail.volumeCbm }} CBM</NDescriptionsItem>
                <NDescriptionsItem label="订单来源">{{ ltl?.orderSourceLabel || '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="货物类型">{{ ltl?.cargoType || '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="时效要求">{{ ltl?.urgency === 'URGENT' ? '加急' : '普通' }}</NDescriptionsItem>
                <NDescriptionsItem label="预订单号">{{ detail.preTripNo || '—' }}</NDescriptionsItem>
              </NDescriptions>
            </NCard>

            <NCard title="收货信息" size="small" :bordered="false" class="card-wrapper mb-12px">
              <NDescriptions v-if="ltl?.consignee" :column="2" label-placement="left" bordered size="small">
                <NDescriptionsItem label="收货公司">{{ ltl.consignee.companyName }}</NDescriptionsItem>
                <NDescriptionsItem label="收货地址">{{ ltl.consignee.address }}</NDescriptionsItem>
                <NDescriptionsItem label="联系人">{{ ltl.consignee.contactName }}</NDescriptionsItem>
                <NDescriptionsItem label="电话">{{ ltl.consignee.contactPhone }}</NDescriptionsItem>
                <NDescriptionsItem label="地址类型">{{ ltl.consignee.addressType }}</NDescriptionsItem>
                <NDescriptionsItem label="预约收货">{{ ltl.consignee.needAppointment ? '是' : '否' }}</NDescriptionsItem>
                <NDescriptionsItem label="Liftgate">{{ ltl.consignee.needLiftgate ? '是' : '否' }}</NDescriptionsItem>
                <NDescriptionsItem label="收货时间">{{ ltl.consignee.receivingHours }}</NDescriptionsItem>
              </NDescriptions>
            </NCard>

            <NCard title="供应商推荐" size="small" :bordered="false" class="card-wrapper mb-12px">
              <p class="text-12px text-gray-500 mb-8px">
                系统根据起始仓、ZIP、板数、重量、服务范围、准时率与报价自动匹配最优供应商
              </p>
              <div class="table-scroll-wrap">
                <NDataTable
                  size="small"
                  :columns="supplierColumns"
                  :data="ltl?.supplierCandidates ?? []"
                  :row-key="(r: Api.Oms.LtlSupplierCandidate) => r.supplierId"
                  :scroll-x="960"
                />
              </div>
              <div class="mt-8px flex gap-8px flex-wrap">
                <NButton size="small" :loading="actionLoading" @click="runAction('autoMatchSupplier')">自动匹配供应商</NButton>
                <NButton size="small" :loading="actionLoading" @click="runAction('rematchSupplier')">重新匹配</NButton>
              </div>
            </NCard>

            <NCard title="供应商下单信息" size="small" :bordered="false" class="card-wrapper mb-12px">
              <div class="mb-10px flex flex-wrap items-center gap-8px">
                <span class="text-13px text-gray-600">下单方式</span>
                <NRadioGroup v-model:value="orderMethod" size="small">
                  <NRadio v-for="opt in LTL_ORDER_METHOD_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</NRadio>
                </NRadioGroup>
              </div>
              <p v-if="orderMethod === 'MANUAL' && selectedSupplierPortal" class="text-12px text-gray-500 mb-10px break-all">
                人工下单将打开：
                <a :href="selectedSupplierPortal" target="_blank" rel="noopener noreferrer" class="text-primary">
                  {{ selectedSupplierPortal }}
                </a>
              </p>
              <NAlert v-if="ltl?.supplierOrderPlaced" type="success" :show-icon="true" class="mb-10px">
                {{ ltl.supplierOrderMessage }}
              </NAlert>
              <NButton type="primary" size="small" :loading="actionLoading" @click="handlePlaceOrder">
                {{ orderMethod === 'MANUAL' ? '人工下单' : '自动下单' }}
              </NButton>
            </NCard>

            <NCard title="下单返回信息" size="small" :bordered="false" class="card-wrapper mb-12px">
              <NDescriptions :column="2" label-placement="left" bordered size="small">
                <NDescriptionsItem label="车次号">{{ detail.generatedTripNo || '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="PRO号">{{ detail.supplierProNo || '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="BOL号">{{ ltl?.bolNo || '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="提货时间">{{ ltl?.pickupTime || '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="预计送达">{{ ltl?.estimatedDelivery || '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="供应商">{{ detail.supplierName || '—' }}</NDescriptionsItem>
                <NDescriptionsItem label="报价">{{ detail.supplierQuote || '—' }}</NDescriptionsItem>
              </NDescriptions>
            </NCard>

            <NCard title="操作记录" size="small" :bordered="false" class="card-wrapper">
              <NDataTable
                size="small"
                :columns="[
                  { key: 'time', title: '时间', width: 150 },
                  { key: 'operator', title: '操作人', width: 100 },
                  { key: 'action', title: '操作', width: 160 },
                  { key: 'status', title: '状态', width: 80 }
                ]"
                :data="detail.logs"
                :row-key="(r: Api.Oms.OrderWorkbenchLog) => r.id"
              />
            </NCard>
          </div>

          <div class="right-col">
            <NCard :title="`货物明细（${detail.palletQty}板）`" size="small" :bordered="false" class="card-wrapper mb-12px">
              <NDataTable
                v-if="detail.cargoItems.length"
                size="small"
                :columns="[
                  { key: 'palletNo', title: '卡板', width: 100 },
                  { key: 'cartonQty', title: '箱数', width: 64, align: 'center' },
                  { key: 'weightLbs', title: '重量(lbs)', width: 88, align: 'right' },
                  { key: 'volumeCbm', title: 'CBM', width: 72, align: 'right' }
                ]"
                :data="detail.cargoItems"
                :row-key="(r: Api.Oms.OrderWorkbenchCargoItem) => r.id"
              />
              <div v-if="detail.cargoItems.length" class="mt-8px text-12px text-gray-600">
                合计：{{ detail.cargoItems.reduce((s, i) => s + i.cartonQty, 0) }} 箱 /
                {{ detail.weightLbs }} lbs / {{ detail.volumeCbm }} CBM
              </div>
              <NEmpty v-else description="暂无货物" class="py-16px" />
            </NCard>

            <NCard title="费用明细 (USD)" size="small" :bordered="false" class="card-wrapper mb-12px">
              <template v-if="ltl?.costBreakdown">
                <div class="fee-row"><span>基础运费</span><span>${{ ltl.costBreakdown.linehaul.toLocaleString() }}</span></div>
                <div class="fee-row"><span>Liftgate</span><span>${{ ltl.costBreakdown.liftgate }}</span></div>
                <div class="fee-row"><span>保险费</span><span>${{ ltl.costBreakdown.insurance }}</span></div>
                <div class="fee-row total"><span>总费用</span><span>${{ ltl.costBreakdown.total.toLocaleString() }}</span></div>
              </template>
              <NEmpty v-else description="待匹配供应商" class="py-12px" />
            </NCard>

            <NCard title="操作" size="small" :bordered="false" class="card-wrapper">
              <NSpace vertical :size="8">
                <NButton type="primary" block :loading="actionLoading" @click="runAction('manualConfirm')">人工确认</NButton>
                <NButton type="success" block :loading="actionLoading" @click="runAction('addCargo')">添加货物</NButton>
                <NButton type="success" block :loading="actionLoading" @click="openGenerateOrderModal">生成订单</NButton>
                <NButton v-if="detail.generatedTripNo" block @click="goTripOrderList">查看车次订单列表</NButton>
                <NButton block :loading="actionLoading" @click="runAction('rematchSupplier')">重新匹配供应商</NButton>
                <NButton block @click="showProtoInfo('原型：打开供应商报价页')">查看报价单</NButton>
                <NButton block @click="showProtoInfo('原型：查看 BOL 文件')">查看BOL</NButton>
                <NButton block @click="showProtoInfo('原型：发送邮件')">发送邮件</NButton>
                <NButton type="warning" block :loading="actionLoading" @click="runAction('markAbnormal')">标记异常</NButton>
                <NButton type="error" secondary block :loading="actionLoading" @click="runAction('cancel')">取消订单</NButton>
              </NSpace>
            </NCard>
          </div>
        </div>
      </template>
      <NEmpty v-else-if="!loading" description="未找到 LTL 订单" class="py-80px" />
    </NSpin>

    <NModal
      v-model:show="generateModalVisible"
      preset="card"
      title="生成车次订单"
      :style="{ width: '480px' }"
      :mask-closable="false"
    >
      <p class="text-13px text-gray-500 mb-12px">请确认以下信息，确认后将写入车次订单列表。</p>
      <NDescriptions v-if="generatePreview" :column="1" bordered label-placement="left" size="small">
        <NDescriptionsItem label="车次号">
          <span class="font-600 text-primary">{{ generatePreview.tripNo }}</span>
        </NDescriptionsItem>
        <NDescriptionsItem label="订单号">{{ generatePreview.orderNo }}</NDescriptionsItem>
        <NDescriptionsItem label="供应商">{{ generatePreview.supplierName }}</NDescriptionsItem>
        <NDescriptionsItem label="板数">{{ generatePreview.palletQty }} 板</NDescriptionsItem>
      </NDescriptions>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="generateModalVisible = false">取消</NButton>
          <NButton type="primary" :loading="actionLoading" @click="confirmGenerateOrder">确认-生成订单</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.ltl-detail-page {
  padding: 12px;
}
.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.main-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 12px;
  align-items: start;
}
@media (max-width: 1280px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
}
.table-scroll-wrap {
  width: 100%;
  min-width: 0;
  overflow-x: auto;
}
.fee-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 6px 0;
  border-bottom: 1px dashed var(--n-border-color);
  color: #374151;
}
.fee-row.total {
  font-weight: 700;
  font-size: 15px;
  color: #dc2626;
  border-bottom: none;
  margin-top: 4px;
}
</style>
