<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { NButton, NCard, NGi, NGrid, NSelect, NSpace, NSpin, NStatistic, NTable, NTag } from 'naive-ui';
import { useRouterPush } from '@/hooks/common/router';
import { fetchGetPortalDashboardOverview, fetchGetPortalWarehouses } from '@/service/api/portal';
import { usePortalWarehouse } from '../composables/use-portal-warehouse';
import OrderTrendChart from './modules/order-trend-chart.vue';

defineOptions({ name: 'PortalHome' });

const { routerPushByKey } = useRouterPush();
const { warehouseId } = usePortalWarehouse();

const loading = ref(false);
const warehouses = ref<Api.Portal.WarehouseOption[]>([]);
const overview = ref<Api.Portal.DashboardOverview | null>(null);

const warehouseOptions = computed(() =>
  warehouses.value.map(w => ({ label: w.id === 0 ? w.name : `${w.code} · ${w.name}`, value: w.id }))
);

const orderKpis = computed(() => {
  const o = overview.value?.order;
  if (!o) return [];
  return [
    { label: '今日订单', value: o.todayTotal, color: '#2563eb' },
    { label: '待处理', value: o.pending, color: '#f59e0b' },
    { label: '已发货', value: o.shipped, color: '#0ea5e9' },
    { label: '已完成', value: o.completed, color: '#16a34a' },
    { label: '异常', value: o.exception, color: '#ef4444' }
  ];
});

const inventoryKpis = computed(() => {
  const inv = overview.value?.inventory;
  if (!inv) return [];
  return [
    { label: '总 SKU', value: inv.skuTotal },
    { label: '总库存', value: inv.totalQty },
    { label: '可用库存', value: inv.availableQty },
    { label: '预留库存', value: inv.reservedQty },
    { label: '缺货 SKU', value: inv.outOfStockSku }
  ];
});

const inTransitKpis = computed(() => {
  const t = overview.value?.inTransit;
  if (!t) return [];
  return [
    { label: '预计到仓', value: t.expectedArrivalQty },
    { label: '在途柜', value: t.containerInTransit },
    { label: '待拆柜', value: t.pendingDevanning },
    { label: '待上架', value: t.pendingPutaway }
  ];
});

async function loadWarehouses() {
  const { data } = await fetchGetPortalWarehouses();
  warehouses.value = data || [];
}

async function loadOverview() {
  loading.value = true;
  try {
    const { data } = await fetchGetPortalDashboardOverview({
      warehouseId: warehouseId.value || null
    });
    overview.value = data ?? null;
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadWarehouses();
  await loadOverview();
});

watch(warehouseId, () => loadOverview());
</script>

<template>
  <div class="portal-home flex flex-col gap-12px">
    <NCard size="small" :bordered="false">
      <div class="flex flex-wrap items-center justify-between gap-12px">
        <div>
          <div class="text-16px font-medium">客户门户概览</div>
          <div class="mt-4px text-12px text-#6b7280">
            订单状态 · 库存预警 · 在途运输 · 账单费用
            <span v-if="overview?.currency" class="ml-8px">币种 {{ overview.currency }}</span>
          </div>
        </div>
        <div class="flex items-center gap-8px">
          <span class="text-13px text-#6b7280">仓库</span>
          <NSelect
            v-model:value="warehouseId"
            :options="warehouseOptions"
            class="w-200px"
            size="small"
          />
          <NButton size="small" :loading="loading" @click="loadOverview">刷新</NButton>
        </div>
      </div>
    </NCard>

    <NSpin :show="loading">
      <template v-if="overview">
        <!-- 四卡 KPI -->
        <NGrid :cols="24" :x-gap="12" :y-gap="12" responsive="screen" item-responsive class="mb-12px">
          <NGi span="24 xl:6">
            <NCard size="small" title="订单" class="h-full">
              <NGrid :cols="2" :x-gap="8" :y-gap="8">
                <NGi v-for="item in orderKpis" :key="item.label" span="1">
                  <NStatistic :label="item.label" :value="item.value">
                    <template #prefix>
                      <span class="mr-4px inline-block h-6px w-6px rounded-full" :style="{ background: item.color }" />
                    </template>
                  </NStatistic>
                </NGi>
              </NGrid>
            </NCard>
          </NGi>
          <NGi span="24 xl:6">
            <NCard size="small" title="库存" class="h-full">
              <NGrid :cols="2" :x-gap="8" :y-gap="8">
                <NGi v-for="item in inventoryKpis" :key="item.label" span="1">
                  <NStatistic :label="item.label" :value="item.value" tabular-nums />
                </NGi>
              </NGrid>
            </NCard>
          </NGi>
          <NGi span="24 xl:6">
            <NCard size="small" title="在途" class="h-full">
              <NGrid :cols="2" :x-gap="8" :y-gap="8">
                <NGi v-for="item in inTransitKpis" :key="item.label" span="1">
                  <NStatistic :label="item.label" :value="item.value" tabular-nums />
                </NGi>
              </NGrid>
            </NCard>
          </NGi>
          <NGi span="24 xl:6">
            <NCard size="small" title="费用" class="h-full">
              <div class="flex flex-col gap-8px text-13px">
                <div class="flex justify-between">
                  <span class="text-#6b7280">本月仓租</span>
                  <span>{{ overview.finance.monthlyStorage.display }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-#6b7280">本月操作费</span>
                  <span>{{ overview.finance.monthlyOperation.display }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-#6b7280">待付款</span>
                  <span class="text-amber-600">{{ overview.finance.pendingPayment.display }}</span>
                </div>
                <div class="flex justify-between border-t border-#eee pt-8px font-medium">
                  <span>账户余额</span>
                  <span>{{ overview.finance.accountBalance.display }}</span>
                </div>
              </div>
            </NCard>
          </NGi>
        </NGrid>

        <!-- 趋势 + 库存表 -->
        <NGrid :cols="24" :x-gap="12" :y-gap="12" class="mb-12px">
          <NGi span="24 lg:12">
            <NCard size="small" title="近 30 天订单趋势">
              <OrderTrendChart :data="overview.orderTrend" />
            </NCard>
          </NGi>
          <NGi span="24 lg:12">
            <NCard size="small" title="库存概览">
              <NTable size="small" :single-line="false">
                <thead>
                  <tr>
                    <th>项目</th>
                    <th class="text-right">数量</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>SKU 总数</td>
                    <td class="text-right">{{ overview.inventory.stats.skuTotal.toLocaleString() }}</td>
                  </tr>
                  <tr>
                    <td>在库数量</td>
                    <td class="text-right">{{ overview.inventory.stats.onHandQty.toLocaleString() }}</td>
                  </tr>
                  <tr>
                    <td>可用库存</td>
                    <td class="text-right">{{ overview.inventory.stats.availableQty.toLocaleString() }}</td>
                  </tr>
                  <tr>
                    <td>锁定库存</td>
                    <td class="text-right">{{ overview.inventory.stats.lockedQty.toLocaleString() }}</td>
                  </tr>
                  <tr>
                    <td>损坏库存</td>
                    <td class="text-right">{{ overview.inventory.stats.damagedQty.toLocaleString() }}</td>
                  </tr>
                </tbody>
              </NTable>
              <div class="mt-12px text-13px font-medium">库存预警</div>
              <NTable size="small" class="mt-8px" :single-line="false">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>产品</th>
                    <th class="text-right">当前库存</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in overview.inventory.lowStockAlerts" :key="row.sku">
                    <td>{{ row.sku }}</td>
                    <td>{{ row.productName }}</td>
                    <td class="text-right text-red-500">{{ row.currentQty }}</td>
                  </tr>
                </tbody>
              </NTable>
              <NButton text type="primary" class="mt-8px" @click="routerPushByKey('portal_inventory')">
                查看 SKU 库存与 ASN/Shipment →
              </NButton>
              <NButton text type="primary" class="mt-4px" @click="routerPushByKey('portal_settings')">
                安全库存与提醒配置 →
              </NButton>
            </NCard>
          </NGi>
        </NGrid>

        <!-- ASN + Shipment -->
        <NGrid :cols="24" :x-gap="12" :y-gap="12" class="mb-12px">
          <NGi span="24 lg:12">
            <NCard size="small" title="入库 ASN">
              <NTable size="small" :single-line="false">
                <thead>
                  <tr><th>状态</th><th class="text-right">数量</th></tr>
                </thead>
                <tbody>
                  <tr v-for="row in overview.asn.statusRows" :key="row.status">
                    <td>{{ row.label }}</td>
                    <td class="text-right">{{ row.count }}</td>
                  </tr>
                </tbody>
              </NTable>
              <div class="mt-8px text-12px text-#6b7280">近期收货</div>
              <div class="mt-4px flex flex-wrap gap-8px">
                <NTag v-for="asn in overview.asn.recentAsn" :key="asn" size="small" type="info">{{ asn }}</NTag>
              </div>
              <NButton text type="primary" class="mt-8px" @click="routerPushByKey('portal_inventory')">
                ASN / Shipment 明细 →
              </NButton>
            </NCard>
          </NGi>
          <NGi span="24 lg:12">
            <NCard size="small" title="出库 Shipment">
              <NTable size="small" :single-line="false">
                <thead>
                  <tr><th>状态</th><th class="text-right">数量</th></tr>
                </thead>
                <tbody>
                  <tr v-for="row in overview.shipment.statusRows" :key="row.status">
                    <td>{{ row.label }}</td>
                    <td class="text-right">{{ row.count }}</td>
                  </tr>
                </tbody>
              </NTable>
              <NTable size="small" class="mt-12px" :single-line="false">
                <thead>
                  <tr>
                    <th>Shipment</th>
                    <th>Tracking</th>
                    <th>承运商</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in overview.shipment.recentRows" :key="row.shipmentNo">
                    <td>{{ row.shipmentNo }}</td>
                    <td class="text-12px">{{ row.tracking }}</td>
                    <td>{{ row.carrier }}</td>
                  </tr>
                </tbody>
              </NTable>
            </NCard>
          </NGi>
        </NGrid>

        <!-- 在途 + 异常/消息 -->
        <NGrid :cols="24" :x-gap="12" :y-gap="12" class="mb-12px">
          <NGi span="24 lg:12">
            <NCard size="small" title="在途运输（TMS）">
              <div v-for="item in overview.inTransit.mapItems" :key="item.id" class="mb-10px rounded-8px bg-#f8fafc p-10px">
                <div class="font-medium">{{ item.refNo }}</div>
                <div class="text-12px text-#6b7280">{{ item.route }}</div>
                <div class="mt-4px flex flex-wrap gap-8px text-12px">
                  <NTag size="tiny" type="info">{{ item.statusLabel }}</NTag>
                  <span>GPS: {{ item.gpsStatus }}</span>
                  <span v-if="item.eta">ETA {{ item.eta }}</span>
                </div>
              </div>
              <NButton text type="primary" class="mt-8px" @click="routerPushByKey('portal_in-transit')">
                查看在途详情 →
              </NButton>
            </NCard>
          </NGi>
          <NGi span="24 lg:12">
            <NCard size="small" title="消息中心">
              <div
                v-for="n in overview.notifications"
                :key="n.id"
                class="mb-8px border-b border-#f0f0f0 pb-8px last:border-0"
              >
                <div class="text-13px font-medium">{{ n.title }}</div>
                <div class="text-12px text-#6b7280">{{ n.content }}</div>
                <div class="text-11px text-#9ca3af">{{ n.time }}</div>
              </div>
              <NButton text type="primary" @click="routerPushByKey('portal_exception')">异常中心 →</NButton>
            </NCard>
          </NGi>
        </NGrid>

        <!-- 财务 + KPI + 快捷操作 -->
        <NCard size="small" title="财务中心" class="mb-12px">
          <NGrid :cols="24" :x-gap="12" :y-gap="8">
            <NGi v-for="fee in overview.finance.feeBreakdown" :key="fee.label" span="24 s:12 m:8 l:4">
              <div class="flex justify-between text-13px">
                <span>{{ fee.label }}</span>
                <span>{{ fee.amount.display }}</span>
              </div>
            </NGi>
            <NGi span="24">
              <div class="flex justify-between border-t border-#eee pt-8px text-14px font-semibold">
                <span>合计</span>
                <span>{{ overview.finance.monthTotal.display }}</span>
              </div>
            </NGi>
          </NGrid>
          <NSpace class="mt-12px">
            <NButton size="small" type="primary" @click="routerPushByKey('portal_fee-confirm')">费用确认</NButton>
            <NButton size="small" @click="routerPushByKey('portal_bill')">账单中心</NButton>
            <NButton size="small" @click="routerPushByKey('portal_bill')">下载账单 PDF</NButton>
            <NButton size="small" @click="routerPushByKey('portal_bill')">下载 Excel</NButton>
          </NSpace>
        </NCard>

        <NCard size="small" title="KPI 看板" class="mb-12px">
          <NGrid :cols="24" :x-gap="12" :y-gap="8">
            <NGi span="24 s:12 m:8">
              <NStatistic label="订单准时率" :value="overview.kpi.onTimeRate" tabular-nums>
                <template #suffix>%</template>
              </NStatistic>
            </NGi>
            <NGi span="24 s:12 m:8">
              <NStatistic label="库存准确率" :value="overview.kpi.inventoryAccuracy" tabular-nums>
                <template #suffix>%</template>
              </NStatistic>
            </NGi>
            <NGi span="24 s:12 m:8">
              <NStatistic label="收货时效" :value="overview.kpi.inboundHours" tabular-nums>
                <template #suffix>小时</template>
              </NStatistic>
            </NGi>
            <NGi span="24 s:12 m:8">
              <NStatistic label="出库时效" :value="overview.kpi.outboundHours" tabular-nums>
                <template #suffix>小时</template>
              </NStatistic>
            </NGi>
            <NGi span="24 s:12 m:8">
              <NStatistic label="异常处理时效" :value="overview.kpi.exceptionHours" tabular-nums>
                <template #suffix>小时</template>
              </NStatistic>
            </NGi>
          </NGrid>
        </NCard>

        <NCard size="small" title="快捷操作">
          <NSpace wrap>
            <NButton type="primary" @click="routerPushByKey('portal_order-create')">创建入库通知 ASN</NButton>
            <NButton @click="routerPushByKey('portal_order-create')">创建出库订单</NButton>
            <NButton @click="routerPushByKey('portal_orders')">我的订单</NButton>
            <NButton @click="routerPushByKey('portal_inventory')">库存查询</NButton>
            <NButton @click="routerPushByKey('portal_containers')">我的海柜</NButton>
            <NButton @click="routerPushByKey('portal_in-transit')">在途运输</NButton>
            <NButton @click="routerPushByKey('portal_transfer-ops')">中转与库内操作</NButton>
            <NButton @click="routerPushByKey('portal_fee-confirm')">费用确认</NButton>
            <NButton @click="routerPushByKey('portal_bill')">账单中心</NButton>
            <NButton @click="routerPushByKey('portal_comm')">在线客服</NButton>
          </NSpace>
        </NCard>
      </template>
    </NSpin>
  </div>
</template>
