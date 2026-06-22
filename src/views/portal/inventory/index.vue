<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NButton, NCard, NDataTable, NInput, NSpace, NTabPane, NTabs, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import {
  fetchGetPortalAsnList,
  fetchGetPortalInventoryList,
  fetchGetPortalShipmentList
} from '@/service/api/portal';
import { PORTAL_ASN_STATUS_META, PORTAL_SHIPMENT_STATUS_META } from '../constants';

defineOptions({ name: 'PortalInventory' });

const activeTab = ref('sku');
const loading = ref(false);
const keyword = ref('');
const lowStockOnly = ref(false);

const skuRows = ref<Api.Portal.PortalInventorySku[]>([]);
const asnRows = ref<Api.Portal.PortalAsnRow[]>([]);
const shipmentRows = ref<Api.Portal.PortalShipmentRow[]>([]);

const skuColumns: DataTableColumns<Api.Portal.PortalInventorySku> = [
  { title: 'SKU', key: 'sku', width: 120 },
  { title: '产品名称', key: 'productName', minWidth: 140, ellipsis: { tooltip: true } },
  { title: '仓库', key: 'warehouseCode', width: 72 },
  { title: '在库', key: 'onHandQty', width: 80 },
  { title: '可用', key: 'availableQty', width: 80 },
  { title: '预留', key: 'reservedQty', width: 80 },
  { title: '安全库存', key: 'safetyQty', width: 88 },
  { title: '库位', key: 'locationSummary', width: 160, ellipsis: { tooltip: true } },
  {
    title: '预警',
    key: 'lowStock',
    width: 72,
    render: row =>
      row.lowStock ? <NTag size="small" type="error">缺货</NTag> : <NTag size="small" type="success">正常</NTag>
  }
];

const asnColumns: DataTableColumns<Api.Portal.PortalAsnRow> = [
  { title: 'ASN 号', key: 'asnNo', width: 150 },
  { title: '仓库', key: 'warehouseCode', width: 72 },
  { title: '海柜', key: 'containerNo', width: 120, render: row => row.containerNo || '—' },
  {
    title: '状态',
    key: 'status',
    width: 96,
    render: row => {
      const meta = PORTAL_ASN_STATUS_META[row.status];
      return <NTag size="small" type={meta?.type || 'default'}>{row.statusLabel}</NTag>;
    }
  },
  { title: '预计件数', key: 'expectedQty', width: 88 },
  { title: '到仓时间', key: 'arrivedTime', width: 160, render: row => row.arrivedTime || '—' },
  { title: '创建时间', key: 'createTime', width: 160 }
];

const shipmentColumns: DataTableColumns<Api.Portal.PortalShipmentRow> = [
  { title: '出库单号', key: 'shipmentNo', width: 160 },
  { title: '关联订单', key: 'orderNo', width: 130 },
  { title: '仓库', key: 'warehouseCode', width: 72 },
  {
    title: '状态',
    key: 'status',
    width: 96,
    render: row => {
      const meta = PORTAL_SHIPMENT_STATUS_META[row.status];
      return <NTag size="small" type={meta?.type || 'default'}>{row.statusLabel}</NTag>;
    }
  },
  { title: '承运商', key: 'carrier', width: 140, ellipsis: { tooltip: true } },
  { title: '运单号', key: 'tracking', width: 180, render: row => row.tracking || '—' },
  { title: '发货时间', key: 'shipTime', width: 160, render: row => row.shipTime || '—' }
];

async function loadSku() {
  loading.value = true;
  try {
    const { data } = await fetchGetPortalInventoryList({
      pageNum: 1,
      pageSize: 50,
      keyword: keyword.value.trim() || undefined,
      lowStockOnly: lowStockOnly.value
    });
    skuRows.value = data?.rows ?? [];
  } finally {
    loading.value = false;
  }
}

async function loadAsn() {
  loading.value = true;
  try {
    const { data } = await fetchGetPortalAsnList({ pageNum: 1, pageSize: 50 });
    asnRows.value = data?.rows ?? [];
  } finally {
    loading.value = false;
  }
}

async function loadShipment() {
  loading.value = true;
  try {
    const { data } = await fetchGetPortalShipmentList({ pageNum: 1, pageSize: 50 });
    shipmentRows.value = data?.rows ?? [];
  } finally {
    loading.value = false;
  }
}

function onTabChange(tab: string) {
  if (tab === 'sku') loadSku();
  else if (tab === 'asn') loadAsn();
  else loadShipment();
}

onMounted(loadSku);
</script>

<template>
  <div class="portal-inventory">
    <NCard title="库存与出入库" size="small" :bordered="false">
      <NTabs v-model:value="activeTab" type="line" size="small" @update:value="onTabChange">
        <NTabPane name="sku" tab="SKU 库存">
          <div class="mb-12px">
            <NSpace>
              <NInput
                v-model:value="keyword"
                placeholder="SKU / 产品名"
                clearable
                size="small"
                class="w-200px"
                @keyup.enter="loadSku"
              />
              <NButton size="small" :type="lowStockOnly ? 'warning' : 'default'" @click="lowStockOnly = !lowStockOnly; loadSku()">
                {{ lowStockOnly ? '仅预警' : '全部 SKU' }}
              </NButton>
              <NButton size="small" :loading="loading" @click="loadSku">查询</NButton>
            </NSpace>
          </div>
          <NDataTable :columns="skuColumns" :data="skuRows" :loading="loading" :scroll-x="1000" size="small" :bordered="false" />
        </NTabPane>
        <NTabPane name="asn" tab="入库 ASN">
          <NDataTable :columns="asnColumns" :data="asnRows" :loading="loading" :scroll-x="900" size="small" :bordered="false" />
        </NTabPane>
        <NTabPane name="shipment" tab="出库 Shipment">
          <NDataTable :columns="shipmentColumns" :data="shipmentRows" :loading="loading" :scroll-x="960" size="small" :bordered="false" />
        </NTabPane>
      </NTabs>
    </NCard>
  </div>
</template>
