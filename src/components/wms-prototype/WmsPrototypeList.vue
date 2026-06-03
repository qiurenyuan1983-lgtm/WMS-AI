<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { NButton, NCard, NDataTable, NForm, NFormItem, NInput, NSelect, NSpace, NTag } from 'naive-ui';
import { getMockDictByType, isMockMode } from '@/mock';
import { request } from '@/service/request';
import { useDict } from '@/hooks/business/dict';
import { useNaivePaginatedTable } from '@/hooks/common/table';
import { useAppStore } from '@/store/modules/app';
import type { PrototypeListConfig } from '@/views/wms/_prototype/configs';

const props = defineProps<{ config: PrototypeListConfig }>();

const router = useRouter();
const appStore = useAppStore();

const dictKeys = [...new Set(props.config.columns.map(c => c.dictKey).filter(Boolean))] as string[];
const dictRecords = dictKeys.map(key => ({ key, ...useDict(key, true) }));

const listClassTag: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error' | 'primary'> = {
  default: 'default',
  info: 'info',
  warning: 'warning',
  success: 'success',
  danger: 'error',
  error: 'error',
  primary: 'info'
};

function getDictMeta(dictKey: string | undefined, value: string) {
  if (!dictKey) return { label: value, tagType: 'default' as const };
  if (isMockMode()) {
    const item = getMockDictByType(dictKey).find(d => d.dictValue === String(value));
    if (item) {
      const tagType = listClassTag[item.listClass || 'default'] || 'default';
      return { label: item.dictLabel || value, tagType };
    }
  }
  const found = dictRecords.find(d => d.key === dictKey);
  const item = found?.record.value[value];
  const tagType = listClassTag[item?.listClass || 'default'] || 'default';
  return { label: item?.dictLabel || value, tagType };
}

const statusDict = computed(() => props.config.statusDict || '');
const { options: statusOptions } = useDict(statusDict.value || 'sys_normal_disable', true);

const searchModel = ref<Record<string, string | null>>({});
const searchParams = ref({ pageNum: 1, pageSize: 10 });

onMounted(() => {
  props.config.searchFields.forEach(f => {
    searchModel.value[f.key] = null;
  });
});

function protoMsg(msg: string) {
  window.$message?.info(`[\u539f\u578b] ${msg}`);
}

function parseCommaList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  return String(raw || '')
    .split(/,\s*/)
    .map(s => s.trim())
    .filter(Boolean);
}

function handleToolbar(btn: string) {
  protoMsg(btn);
}

function handleRow(btn: string, row: Record<string, any>) {
  const mk = props.config.mockKey;
  const btns = props.config.rowButtons || [];

  if (mk === 'inbound-order') {
    if (btn === btns[0]) {
      router.push({
        name: 'wms_inbound-task',
        query: {
          inboundNo: row.inboundNo,
          palletNo: row.palletNo,
          containerNo: row.containerNo,
          groupCode: row.groupCode,
          recommendLocation: row.recommendLocation
        }
      });
      return;
    }
    if (btn === btns[1]) {
      router.push({
        name: 'wms_inbound-task',
        query: {
          inboundNo: row.inboundNo,
          containerNo: row.containerNo,
          groupCode: row.groupCode,
          recommendLocation: row.recommendLocation
        }
      });
      return;
    }
  }

  if (mk === 'putaway-task' && (btn === btns[0] || btn === btns[1])) {
    router.push({
      name: 'wms_putaway-pda',
      query: { taskNo: row.taskNo, mode: row.putawayMode || 'BATCH' }
    });
    return;
  }

  if (mk === 'vas-task' && (btn === btns[0] || btn === btns[1])) {
    router.push({
      name: 'wms_vas-work',
      query: {
        taskNo: row.taskNo,
        operationOrderNo: row.operationOrderNo,
        cargoOrderNo: row.cargoOrderNo,
        customerName: row.customerName,
        serviceType: row.serviceType,
        qty: row.qty
      }
    });
    return;
  }

  if (mk === 'stock-prep-order' && (btn === btns[0] || btn === btns[1])) {
    router.push({
      name: 'wms_stock-prep-exec',
      query: { orderNo: row.orderNo, outboundOrderNo: row.outboundOrderNo }
    });
    return;
  }

  if (mk === 'outbound-order' && (btn === btns[0] || btn === btns[1])) {
    router.push({ name: 'wms_outbound-exec', query: { outboundOrderNo: row.outboundOrderNo } });
    return;
  }

  protoMsg(`${btn} \u00b7 ${row.orderNo || row.taskNo || row.id}`);
}

const { columns, data, getData, getDataByPage, loading, mobilePagination, scrollX } = useNaivePaginatedTable({
  api: () =>
    request<any>({
      url: `/wms/${props.config.mockKey}/list`,
      method: 'get',
      params: { ...searchParams.value, ...searchModel.value }
    }),
  onPaginationParamsChange: params => {
    searchParams.value.pageNum = params.page;
    searchParams.value.pageSize = params.pageSize;
  },
  columns: () => {
    const cols = props.config.columns.map(col => {
      if (col.format === 'comma-tags') {
        return {
          key: col.key,
          title: col.title,
          width: col.width,
          render: (row: Record<string, any>) => {
            const items = parseCommaList(row[col.key]);
            const show = items.slice(0, 3);
            const more = items.length - show.length;
            return (
              <NSpace size={4} wrap>
                {show.map(no => (
                  <NTag size="small" bordered={false}>
                    {no}
                  </NTag>
                ))}
                {more > 0 ? (
                  <NTag size="small" bordered={false} type="info">
                    +{more}
                  </NTag>
                ) : null}
              </NSpace>
            );
          }
        };
      }
      if (col.tag) {
        return {
          key: col.key,
          title: col.title,
          width: col.width,
          render: (row: Record<string, any>) => {
            const { label, tagType } = getDictMeta(col.dictKey, row[col.key]);
            return (
              <NTag size="small" type={tagType}>
                {label}
              </NTag>
            );
          }
        };
      }
      if (col.dictKey) {
        return {
          key: col.key,
          title: col.title,
          width: col.width,
          render: (row: Record<string, any>) => getDictMeta(col.dictKey, row[col.key]).label
        };
      }
      return { key: col.key, title: col.title, width: col.width };
    });
    if (props.config.rowButtons?.length) {
      cols.push({
        key: 'operate',
        title: '\u64cd\u4f5c',
        width: 200,
        fixed: 'right' as const,
        render: (row: Record<string, any>) => (
          <NSpace size="small">
            {props.config.rowButtons!.map(btn => (
              <NButton size="small" quaternary type="primary" onClick={() => handleRow(btn, row)}>
                {btn}
              </NButton>
            ))}
          </NSpace>
        )
      });
    }
    return cols;
  }
});

function handleSearch() {
  searchParams.value.pageNum = 1;
  getDataByPage();
}

function resetSearch() {
  Object.keys(searchModel.value).forEach(k => {
    searchModel.value[k] = null;
  });
  handleSearch();
}

getData();
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :title="config.title" :bordered="false" size="small" class="card-wrapper">
      <NForm inline label-placement="left" :show-feedback="false" class="mb-12px">
        <NFormItem v-for="field in config.searchFields" :key="field.key" :label="field.label">
          <NSelect
            v-if="field.type === 'select' && field.key === 'status' && statusDict"
            v-model:value="searchModel[field.key]"
            clearable
            class="w-160px"
            :options="statusOptions"
            placeholder="请选择状态"
          />
          <NInput v-else v-model:value="searchModel[field.key]" clearable class="w-160px" />
        </NFormItem>
        <NFormItem>
          <NSpace>
            <NButton type="primary" @click="handleSearch">查询</NButton>
            <NButton @click="resetSearch">重置</NButton>
          </NSpace>
        </NFormItem>
      </NForm>
      <NSpace v-if="config.toolbarButtons?.length" class="mb-12px">
        <NButton v-for="btn in config.toolbarButtons" :key="btn" type="primary" ghost @click="handleToolbar(btn)">
          {{ btn }}
        </NButton>
      </NSpace>
      <NDataTable
        :columns="columns"
        :data="data"
        :loading="loading"
        :scroll-x="scrollX"
        :pagination="mobilePagination"
        :flex-height="!appStore.isMobile"
        remote
        size="small"
        class="sm:h-full"
      />
    </NCard>
  </div>
</template>
