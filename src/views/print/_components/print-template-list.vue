<script setup lang="tsx">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { NButton, NCard, NDataTable, NForm, NFormItem, NInput, NSelect, NSpace, NTag } from 'naive-ui';
import { useDict } from '@/hooks/business/dict';
import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';
import { fetchGetPrintTemplateList } from '@/service/api/print';
import DesignerPreviewModal from '../designer/modules/designer-preview-modal.vue';
import type { DesignerCanvasElement, PaperOrientation, PaperPresetKey } from '../designer/utils/paper-size';
import { getDefaultElementsForBol } from '../designer/utils/bol-template-default';
import { getDefaultElementsForPalletLabel, resolvePaperDimensions } from '../designer/utils/paper-size';
import { PALLET_LABEL_DESTINATION_OPTIONS, PALLET_LABEL_PLATFORM_OPTIONS, PALLET_SCOPE_TYPE_OPTIONS } from '../constants';
import PrintTemplateScopeDrawer from './print-template-scope-drawer.vue';

defineOptions({ name: 'PrintTemplateList' });

const props = defineProps<{
  templateType: Api.Print.TemplateType;
  title: string;
  invoiceSubtype?: Api.Print.InvoiceSubtype | null;
  showInvoiceSubtypeColumn?: boolean;
}>();

const router = useRouter();
const { record: statusRecord } = useDict('print_template_status');
const { record: typeRecord } = useDict('print_template_type');
const { record: invoiceSubtypeRecord } = useDict('print_invoice_subtype');

const isPalletLabel = computed(() => props.templateType === 'pallet_label');

const searchParams = ref<Api.Print.TemplateSearchParams>({
  pageNum: 1,
  pageSize: 10,
  templateName: null,
  templateType: props.templateType,
  invoiceSubtype: props.invoiceSubtype ?? null,
  status: null,
  customerName: null,
  palletScopeType: null,
  palletScopeValue: null
});

const scopeDrawerVisible = ref(false);
const scopeDrawerMode = ref<'create' | 'edit'>('create');
const scopeEditingRow = ref<Api.Print.PrintTemplate | null>(null);

const previewVisible = ref(false);
const previewElements = ref<DesignerCanvasElement[]>([]);
const previewPaperSize = ref<PaperPresetKey | string>('100x150mm');
const previewOrientation = ref<PaperOrientation>('portrait');
const previewTitle = ref('卡板贴预览');
const previewSubtitle = ref('');

const statusOptions = computed(() =>
  Object.entries(statusRecord.value).map(([value, item]) => ({ label: item.dictLabel, value }))
);

const scopeFilterOptions = computed(() => {
  const type = searchParams.value.palletScopeType;
  if (type === 'destination') return PALLET_LABEL_DESTINATION_OPTIONS;
  if (type === 'platform') return PALLET_LABEL_PLATFORM_OPTIONS;
  return [];
});

function protoMsg(msg: string) {
  window.$message?.info(`[原型] ${msg}`);
}

async function openPreview(row: Api.Print.PrintTemplate) {
  if (!isPalletLabel.value) {
    protoMsg(`预览模板：${row.templateName}`);
    return;
  }
  const paper = (row.paperSize as PaperPresetKey) || '100x150mm';
  const orient = (row.orientation as PaperOrientation) || 'portrait';
  const dim = resolvePaperDimensions(paper, orient);
  const { getPrintTemplateDesign } = await import('@/mock/data/print-center');
  const saved = getPrintTemplateDesign(row.id);
  const isBol = row.templateType === 'bol';
  const previewPaper = saved?.paperSize || (isBol ? 'A4' : paper);
  const previewOrient = saved?.orientation || (isBol ? 'landscape' : orient);
  const previewDim = resolvePaperDimensions(previewPaper, previewOrient);
  previewElements.value = saved?.elements?.length
    ? JSON.parse(JSON.stringify(saved.elements))
    : isBol
      ? getDefaultElementsForBol(previewDim.widthPx, previewDim.heightPx)
      : getDefaultElementsForPalletLabel(previewDim.widthPx, previewDim.heightPx);
  previewPaperSize.value = previewPaper;
  previewOrientation.value = previewOrient;
  previewTitle.value = `${isBol ? 'BOL' : '卡板贴'}预览 · ${row.templateName}`;
  previewSubtitle.value = `${row.templateCode} · v${row.version ?? 1}`;
  previewVisible.value = true;
}

function statusTagType(status?: string | null) {
  return (statusRecord.value[status || '']?.listClass as NaiveUI.ThemeColor) || 'default';
}

function openDesigner(row?: Api.Print.PrintTemplate) {
  router.push({
    name: 'print_designer',
    query: {
      templateId: row?.id ? String(row.id) : undefined,
      type: props.templateType,
      invoiceSubtype: row?.invoiceSubtype || props.invoiceSubtype || undefined,
      palletScopeType: row?.palletScopeType || undefined,
      palletScopeValues: row?.palletScopeValues?.length ? row.palletScopeValues.join(',') : undefined
    }
  });
}

function openCreateDrawer() {
  scopeDrawerMode.value = 'create';
  scopeEditingRow.value = null;
  scopeDrawerVisible.value = true;
}

function openScopeDrawer(row: Api.Print.PrintTemplate) {
  scopeDrawerMode.value = 'edit';
  scopeEditingRow.value = row;
  scopeDrawerVisible.value = true;
}

function renderTemplateCode(row: Api.Print.PrintTemplate) {
  return (
    <span
      class="text-primary cursor-pointer font-medium select-none hover:underline"
      title="双击进入画布"
      onDblclick={(e: MouseEvent) => {
        e.stopPropagation();
        openDesigner(row);
      }}
    >
      {row.templateCode}
    </span>
  );
}

async function persistScope(
  row: Api.Print.PrintTemplate | null,
  payload: {
    templateName: string;
    palletScopeType: Api.Print.PalletScopeType;
    palletScopeValues: string[];
  },
  openDesignerAfterCreate = false
) {
  if (row?.id) {
    const { updatePrintTemplateScope } = await import('@/mock/data/print-center');
    updatePrintTemplateScope(row.id, payload);
    window.$message?.success('已保存');
    getData();
    return;
  }
  const { createPrintTemplate } = await import('@/mock/data/print-center');
  const created = createPrintTemplate({
    templateName: payload.templateName,
    templateType: props.templateType,
    invoiceSubtype: props.invoiceSubtype ?? null,
    palletScopeType: payload.palletScopeType,
    palletScopeValues: payload.palletScopeValues
  });
  window.$message?.success(`已创建模板「${payload.templateName}」`);
  getData();
  if (openDesignerAfterCreate) {
    openDesigner(created);
  }
}

function handleScopeSave(payload: {
  templateName: string;
  palletScopeType: Api.Print.PalletScopeType;
  palletScopeValues: string[];
}) {
  const isCreate = scopeDrawerMode.value === 'create';
  persistScope(scopeEditingRow.value, payload, isCreate);
}

function renderScopeCell(row: Api.Print.PrintTemplate) {
  const type = row.palletScopeType || 'all';
  if (type === 'all' || !row.palletScopeValues?.length) {
    return <NTag size="small">全部</NTag>;
  }
  const tagType = type === 'destination' ? 'info' : 'warning';
  return (
    <NSpace size={4} wrap>
      {row.palletScopeValues.map(v => (
        <NTag key={v} size="small" type={tagType}>
          {v}
        </NTag>
      ))}
    </NSpace>
  );
}

const { columns, data, getData, loading, mobilePagination, scrollX } = useNaivePaginatedTable({
  api: () => fetchGetPrintTemplateList(searchParams.value),
  transform: response => defaultTransform(response),
  onPaginationParamsChange: params => {
    searchParams.value.pageNum = params.page;
    searchParams.value.pageSize = params.pageSize;
  },
  columns: () => {
    const cols: any[] = [
      {
        key: 'templateCode',
        title: '模板编号',
        width: 120,
        fixed: 'left',
        render: (row: Api.Print.PrintTemplate) => renderTemplateCode(row)
      },
      { key: 'templateName', title: '模板名称', width: 200, ellipsis: { tooltip: true }, fixed: 'left' }
    ];
    if (props.showInvoiceSubtypeColumn) {
      cols.push({
        key: 'invoiceSubtype',
        title: '发票分类',
        width: 140,
        render: (row: Api.Print.PrintTemplate) =>
          row.invoiceSubtype ? (
            <NTag size="small" type="info">
              {invoiceSubtypeRecord.value[row.invoiceSubtype]?.dictLabel || row.invoiceSubtype}
            </NTag>
          ) : (
            '—'
          )
      });
    }
    cols.push(
      { key: 'warehouseName', title: '适用仓库', width: 120 },
      { key: 'customerName', title: '适用客户', width: 100, render: (row: Api.Print.PrintTemplate) => row.customerName || '全部' }
    );
    if (isPalletLabel.value) {
      cols.push({
        key: 'palletScope',
        title: '目的地/平台',
        width: 180,
        ellipsis: { tooltip: true },
        render: (row: Api.Print.PrintTemplate) => renderScopeCell(row)
      });
    }
    cols.push(
      { key: 'paperSize', title: '纸张', width: 100 },
      {
        key: 'orientation',
        title: '方向',
        width: 72,
        render: (row: Api.Print.PrintTemplate) => (row.orientation === 'landscape' ? '横向' : '纵向')
      },
      { key: 'version', title: '版本', width: 60 },
      {
        key: 'status',
        title: '状态',
        width: 90,
        render: (row: Api.Print.PrintTemplate) => (
          <NTag type={statusTagType(row.status)} size="small">
            {statusRecord.value[row.status || '']?.dictLabel || row.status}
          </NTag>
        )
      },
      { key: 'useCount', title: '使用次数', width: 90 },
      { key: 'publisherName', title: '发布人', width: 90 },
      { key: 'publishTime', title: '发布时间', width: 160 },
      {
        key: 'actions',
        title: '操作',
        width: isPalletLabel.value ? 260 : 220,
        fixed: 'right',
        render: (row: Api.Print.PrintTemplate) => (
          <NSpace size="small">
            <NButton size="small" type="primary" text onClick={() => openDesigner(row)}>
              编辑模版
            </NButton>
            {isPalletLabel.value ? (
              <NButton size="small" text onClick={() => openScopeDrawer(row)}>
                适用范围
              </NButton>
            ) : null}
            <NButton size="small" text onClick={() => openPreview(row)}>
              预览
            </NButton>
            <NButton size="small" text onClick={() => protoMsg(`测试打印：${row.templateName}`)}>
              测试打印
            </NButton>
          </NSpace>
        )
      }
    );
    return cols;
  }
});

watch(
  () => props.invoiceSubtype,
  v => {
    searchParams.value.invoiceSubtype = v ?? null;
    searchParams.value.pageNum = 1;
    getData();
  }
);

watch(
  () => searchParams.value.palletScopeType,
  () => {
    searchParams.value.palletScopeValue = null;
  }
);

function handleSearch() {
  searchParams.value.pageNum = 1;
  getData();
}

function handleReset() {
  searchParams.value.templateName = null;
  searchParams.value.status = null;
  searchParams.value.customerName = null;
  searchParams.value.palletScopeType = null;
  searchParams.value.palletScopeValue = null;
  handleSearch();
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :title="title" :bordered="false" size="small" class="card-wrapper">
      <NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><NForm inline label-placement="left" :show-feedback="false">
        <NFormItem label="模板名称">
          <NInput v-model:value="searchParams.templateName" placeholder="编号/名称" clearable class="w-180px" />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect v-model:value="searchParams.status" :options="statusOptions" clearable class="w-120px" />
        </NFormItem>
        <NFormItem label="客户">
          <NInput v-model:value="searchParams.customerName" placeholder="客户名称" clearable class="w-140px" />
        </NFormItem>
        <template v-if="isPalletLabel">
          <NFormItem label="范围类型">
            <NSelect
              v-model:value="searchParams.palletScopeType"
              :options="PALLET_SCOPE_TYPE_OPTIONS"
              clearable
              class="w-120px"
            />
          </NFormItem>
          <NFormItem v-if="searchParams.palletScopeType && searchParams.palletScopeType !== 'all'" label="目的地/平台">
            <NSelect
              v-model:value="searchParams.palletScopeValue"
              :options="scopeFilterOptions"
              clearable
              filterable
              class="w-140px"
              placeholder="请选择"
            />
          </NFormItem>
        </template>
        <NFormItem>
          <NSpace>
            <NButton type="primary" @click="handleSearch">搜索</NButton>
            <NButton @click="handleReset">重置</NButton>
            <NButton type="primary" @click="isPalletLabel ? openCreateDrawer() : openDesigner()">
              {{ isPalletLabel ? '新建模板' : '制作模板' }}
            </NButton>
          </NSpace>
        </NFormItem>
      </NForm>
    </NCollapseItem></NCollapse></NCard>
    <NCard :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <NSpace size="small" align="center">
          <span class="text-xs text-gray-500">双击模板编号，或点击「编辑模版」进入设计器</span>
          <NTag size="small" type="info">{{ typeRecord[templateType]?.dictLabel || templateType }}</NTag>
        </NSpace>
      </template>
      <NDataTable
        :columns="columns"
        :data="data"
        :loading="loading"
        :scroll-x="scrollX"
        :pagination="mobilePagination"
        remote
        size="small"
        class="sm:h-full"
      />
    </NCard>

    <PrintTemplateScopeDrawer
      v-if="isPalletLabel"
      v-model:show="scopeDrawerVisible"
      :mode="scopeDrawerMode"
      :row="scopeEditingRow"
      @save="handleScopeSave"
    />

    <DesignerPreviewModal
      v-if="isPalletLabel"
      v-model:show="previewVisible"
      :elements="previewElements"
      :paper-size="previewPaperSize"
      :orientation="previewOrientation"
      :title="previewTitle"
      :subtitle="previewSubtitle"
    />
  </div>
</template>
