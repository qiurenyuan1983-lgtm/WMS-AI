<script setup lang="tsx">

import { ref, watch } from 'vue';

import { NButton, NPopconfirm, NTag, useDialog } from 'naive-ui';

import { defaultTransform, useNaivePaginatedTable } from '@/hooks/common/table';

import {

  fetchBatchThemeConfigStatus,

  fetchCopyThemeConfig,

  fetchDeleteThemeConfig,

  fetchGetThemeConfigDetail,

  fetchGetThemeConfigList,

  fetchPublishThemeConfig,

  fetchSaveThemeDraft,

  fetchSetDefaultThemeConfig

} from '@/service/api/system/theme-config';

import { applyVisualConfigToSession } from '@/utils/theme-config-helper';

import {

  PORT_OPTIONS,

  WAREHOUSE_OPTIONS,

  parseVisualConfig,

  serializeVisualConfig,

  visualConfigToLegacySummary,

  createDefaultVisualConfig

} from './shared/theme-visual-config';

import ThemeToolbar from './modules/theme-toolbar.vue';

import ThemeListPanel from './modules/theme-list-panel.vue';

import ThemeEditorPanel from './modules/theme-editor-panel.vue';

import ThemePreviewPanel from './modules/theme-preview-panel.vue';

import ThemeVersionModal from './modules/theme-version-modal.vue';

import type { ThemeEditorModel } from './modules/types';



defineOptions({ name: 'SystemThemeConfig' });



const dialog = useDialog();

const portLabel = Object.fromEntries(PORT_OPTIONS.map(o => [o.value, o.label]));

const warehouseLabel = Object.fromEntries(WAREHOUSE_OPTIONS.map(o => [o.value, o.label]));



const searchParams = ref<Api.System.ThemeConfigSearchParams>({

  pageNum: 1,

  pageSize: 10,

  themeName: null,

  themeCode: null,

  applicablePorts: null,

  applicableWarehouses: null,

  status: null,

  isDefault: null

});



const selectedId = ref<CommonType.IdType | null>(null);

const editorMode = ref<'create' | 'edit'>('edit');

const editorKey = ref(0);

const editorModel = ref<ThemeEditorModel>(createEmptyEditor());

const previewVisible = ref(false);

const versionVisible = ref(false);

const saving = ref(false);

const checkedRowKeys = ref<Array<string | number>>([]);



const PREVIEW_GRADIENT: Record<string, [string, string]> = {

  'light-glass': ['#1890ff', '#eef7ff'],

  'sky-blue': ['#58B8FF', '#e6f4ff'],

  silver: ['#8c8c8c', '#f5f5f5'],

  dark: ['#1a1a2e', '#16213e']

};



function createEmptyEditor(): ThemeEditorModel {

  const visual = createDefaultVisualConfig();

  visual.scope.wholeSystem = true;

  visual.scope.supplierPortal = true;

  visual.scope.pda = true;

  visual.scope.driverApp = true;

  visual.colors.secondary = '#58B8FF';

  return {

    themeName: '',

    themeCode: '',

    remark: '',

    applicablePorts: ['BACKEND', 'PDA'],

    applicableWarehouses: ['LA', 'DAL', 'SAV', 'NJ', 'DE'],

    applicableAccounts: 'ALL',

    applicableRoles: ['ADMIN', 'WH', 'OPERATOR'],

    isDefault: 'N',

    status: '0',

    publishStatus: 'DRAFT',

    version: 'V1.0.0',

    visual

  };

}



function rowToEditor(row: Api.System.ThemeConfig): ThemeEditorModel {

  return {

    themeId: row.themeId,

    themeName: row.themeName,

    themeCode: row.themeCode,

    remark: row.remark || '',

    applicablePorts: String(row.applicablePorts || 'BACKEND').split(',').filter(Boolean),

    applicableWarehouses: String(row.applicableWarehouses || 'ALL').split(',').filter(Boolean),

    applicableAccounts: row.applicableAccounts || 'ALL',

    applicableRoles: String(row.applicableRoles || 'ADMIN').split(',').filter(Boolean),

    isDefault: row.isDefault,

    status: row.status,

    publishStatus: row.publishStatus || 'DRAFT',

    version: row.version,

    createTime: row.createTime,

    updateTime: row.updateTime,

    visual: parseVisualConfig(row.configJson)

  };

}



function editorToPayload(model: ThemeEditorModel): Api.System.ThemeConfigOperateParams {

  const summary = visualConfigToLegacySummary(model.visual);

  return {

    themeId: model.themeId,

    themeName: model.themeName,

    themeCode: model.themeCode,

    remark: model.remark,

    applicablePorts: model.applicablePorts.join(','),

    applicableWarehouses: model.applicableWarehouses.join(','),

    applicableAccounts: model.applicableAccounts,

    applicableRoles: model.applicableRoles.join(','),

    themeStyle: model.visual.basic.themeStyle,

    publishStatus: model.publishStatus,

    version: model.version,

    configJson: serializeVisualConfig(model.visual),

    ...summary

  };

}



function formatPorts(ports?: string | null) {

  if (!ports) return '全部端口';

  const labels = String(ports)

    .split(',')

    .filter(Boolean)

    .map(v => portLabel[v] || v);

  if (labels.length >= 4) return '全部端口';

  return labels.join(' / ') || '--';

}



function formatWarehouses(warehouses?: string | null) {

  const raw = String(warehouses || '');

  if (!raw || raw === 'ALL') return '全部仓库';

  const labels = raw.split(',').filter(Boolean).map(v => warehouseLabel[v] || v);

  if (labels.length >= 4) return '全部仓库';

  if (labels.length >= 2) return '部分仓库';

  return labels.join('/') || '--';

}



function getPreviewStyle(row: Api.System.ThemeConfig): [string, string] {

  const code = row.themeCode?.toUpperCase() || '';

  if (code.includes('DARK')) return PREVIEW_GRADIENT.dark;

  if (code.includes('SILVER')) return PREVIEW_GRADIENT.silver;

  if (code.includes('SKY')) return PREVIEW_GRADIENT['sky-blue'];

  return PREVIEW_GRADIENT['light-glass'];

}



const { columns, data, getData, loading, mobilePagination, scrollX } = useNaivePaginatedTable({

  api: () => fetchGetThemeConfigList(searchParams.value),

  transform: response => defaultTransform(response),

  onPaginationParamsChange: params => {

    searchParams.value.pageNum = params.page;

    searchParams.value.pageSize = params.pageSize;

  },

  columns: () => [

    { type: 'selection', align: 'center', width: 40 },

    {

      key: 'thumb',

      title: '',

      width: 56,

      align: 'center',

      render: row => {

        const [c1, c2] = getPreviewStyle(row);

        return (

          <div

            class="mx-auto h-28px w-40px rounded-4px border border-#dcebfa"

            style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}

          />

        );

      }

    },

    {

      key: 'themeName',

      title: '主题名称',

      minWidth: 110,

      ellipsis: { tooltip: true }

    },

    { key: 'themeCode', title: '主题编码', width: 120, ellipsis: { tooltip: true } },

    {

      key: 'applicablePorts',

      title: '适用端口',

      width: 130,

      ellipsis: { tooltip: true },

      render: row => formatPorts(row.applicablePorts)

    },

    {

      key: 'applicableWarehouses',

      title: '适用仓库',

      width: 100,

      ellipsis: { tooltip: true },

      render: row => formatWarehouses(row.applicableWarehouses)

    },

    {

      key: 'isDefault',

      title: '默认主题',

      width: 72,

      align: 'center',

      render: row =>

        row.isDefault === 'Y' ? (

          <span class="text-16px text-#1890ff font-bold leading-none">✓</span>

        ) : null

    },

    {

      key: 'status',

      title: '状态',

      width: 72,

      align: 'center',

      render: row => (

        <NTag size="small" bordered={false} type={row.status === '0' ? 'success' : 'error'}>

          {row.status === '0' ? '启用' : '停用'}

        </NTag>

      )

    },

    { key: 'updateTime', title: '更新时间', width: 150 },

    {

      key: 'operate',

      title: '操作',

      width: 200,

      fixed: 'right',

      render: row => (

        <div class="flex flex-wrap gap-x-6px" onClick={(e: Event) => e.stopPropagation()}>

          <NButton size="tiny" text type="primary" onClick={() => selectRow(row)}>

            编辑

          </NButton>

          <NButton size="tiny" text onClick={() => handleCopy(row)}>

            复制

          </NButton>

          <NButton size="tiny" text type={row.status === '0' ? 'warning' : 'success'} onClick={() => handleToggleStatus(row)}>

            {row.status === '0' ? '停用' : '启用'}

          </NButton>

          <NPopconfirm onPositiveClick={() => handleDelete(row.themeId)}>

            {{

              default: () => `删除「${row.themeName}」？`,

              trigger: () => (

                <NButton size="tiny" text type="error">

                  删除

                </NButton>

              )

            }}

          </NPopconfirm>

        </div>

      )

    }

  ]

});



async function selectRow(row: Api.System.ThemeConfig) {

  editorMode.value = 'edit';

  selectedId.value = row.themeId;

  const { data: detail } = await fetchGetThemeConfigDetail(row.themeId);

  editorModel.value = rowToEditor(detail || row);

  editorKey.value += 1;

}



watch(data, list => {

  if (editorMode.value === 'create') return;

  if (!selectedId.value && list.length) selectRow(list[0]);

});



function handleSearch() {

  searchParams.value.pageNum = 1;

  getData();

}



function handleReset() {

  searchParams.value.themeName = null;

  searchParams.value.applicablePorts = null;

  searchParams.value.applicableWarehouses = null;

  searchParams.value.status = null;

  handleSearch();

}



function handleAdd() {

  editorMode.value = 'create';

  selectedId.value = null;

  checkedRowKeys.value = [];

  editorModel.value = createEmptyEditor();

  editorKey.value += 1;

}



function handlePreviewFullscreen() {

  previewVisible.value = true;

}



function handleApplyPreview() {

  applyVisualConfigToSession(editorModel.value.visual);

  window.$message?.success(`已应用主题「${editorModel.value.themeName}」到当前会话`);

}



async function handleCopy(row: Api.System.ThemeConfig) {

  const { data: copied, error } = await fetchCopyThemeConfig(row.themeId);

  if (error || !copied) return;

  window.$message?.success('主题已复制');

  await getData();

  await selectRow(copied);

}



async function handleToggleStatus(row: Api.System.ThemeConfig) {

  const next = row.status === '0' ? '1' : '0';

  const { error } = await fetchBatchThemeConfigStatus({ themeIds: [row.themeId], status: next });

  if (error) return;

  window.$message?.success(next === '0' ? '已启用' : '已停用');

  getData();

}



async function handleDelete(id: CommonType.IdType) {

  const { error } = await fetchDeleteThemeConfig(String(id));

  if (error) return;

  if (String(selectedId.value) === String(id)) {

    selectedId.value = null;

    editorModel.value = createEmptyEditor();

  }

  window.$message?.success('删除成功');

  getData();

}



async function handleBatchEnable() {

  if (!checkedRowKeys.value.length) {

    window.$message?.warning('请先勾选主题');

    return;

  }

  const { error } = await fetchBatchThemeConfigStatus({ themeIds: checkedRowKeys.value, status: '0' });

  if (error) return;

  window.$message?.success('批量启用成功');

  getData();

}



async function handleSetDefault() {

  if (!selectedId.value) {

    window.$message?.warning('请先选择主题');

    return;

  }

  const { error } = await fetchSetDefaultThemeConfig(selectedId.value);

  if (error) return;

  editorModel.value.isDefault = 'Y';

  window.$message?.success('已设为默认主题');

  getData();

}



async function handleSaveDraft() {

  if (!editorModel.value.themeName || !editorModel.value.themeCode) {

    window.$message?.warning('请填写主题名称和编码');

    return;

  }

  saving.value = true;

  editorModel.value.publishStatus = 'DRAFT';

  const { data: saved, error } = await fetchSaveThemeDraft(editorToPayload(editorModel.value));

  saving.value = false;

  if (error) return;

  window.$message?.success('主题草稿已保存');

  if (saved?.themeId) {

    selectedId.value = saved.themeId;

    editorModel.value.themeId = saved.themeId;

    editorMode.value = 'edit';

  }

  getData();

}



function handlePublishConfirm() {

  dialog.warning({

    title: '确认发布',

    content: '确认发布当前主题？发布后将立即生效于已勾选的应用范围。',

    positiveText: '确认发布',

    negativeText: '取消',

    onPositiveClick: () => handlePublish()

  });

}



async function handlePublish() {

  if (!editorModel.value.themeName || !editorModel.value.themeCode) {

    window.$message?.warning('请填写主题名称和编码');

    return;

  }

  saving.value = true;

  const payload = editorToPayload(editorModel.value);

  payload.publishStatus = 'PUBLISHED';

  payload.status = '0';

  const { data: saved, error } = await fetchPublishThemeConfig(payload);

  saving.value = false;

  if (error) return;

  editorModel.value.publishStatus = 'PUBLISHED';

  editorModel.value.status = '0';

  if (saved?.version) editorModel.value.version = saved.version;

  if (saved?.themeId) {

    selectedId.value = saved.themeId;

    editorModel.value.themeId = saved.themeId;

    editorMode.value = 'edit';

  }

  window.$message?.success('主题已发布');

  getData();

}



function handleRestoreDefault() {

  editorModel.value.visual = createDefaultVisualConfig();

  editorModel.value.visual.colors.secondary = '#58B8FF';

  window.$message?.info('已恢复为默认主题配置（未保存）');

}



function handleImportExport(type: 'import' | 'export') {

  window.$message?.info(`原型模式：${type === 'import' ? '导入' : '导出'}主题配置文件待接入`);

}



getData();

</script>



<template>
  <div class="forest-theme-page theme-config-page">
    <ThemeToolbar

      @add="handleAdd"

      @import="handleImportExport('import')"

      @export="handleImportExport('export')"

      @set-default="handleSetDefault"

      @batch-enable="handleBatchEnable"

    />



    <div class="main-split">

      <ThemeListPanel

        v-model:search-params="searchParams"

        v-model:checked-row-keys="checkedRowKeys"

        :columns="columns"

        :data="data"

        :loading="loading"

        :scroll-x="scrollX"

        :pagination="mobilePagination"

        :selected-id="selectedId"

        :editor-mode="editorMode"

        @search="handleSearch"

        @reset="handleReset"

        @select="selectRow"

      />



      <ThemeEditorPanel

        :key="editorKey"

        v-model="editorModel"

        :creating="editorMode === 'create'"

        :saving="saving"

        class="editor-column"

        @preview-fullscreen="handlePreviewFullscreen"

        @save-draft="handleSaveDraft"

        @publish="handlePublishConfirm"

        @restore="handleRestoreDefault"

        @version="versionVisible = true"

      />

    </div>



    <NModal v-model:show="previewVisible" preset="card" title="全屏预览" class="w-960px max-w-98vw preview-modal">

      <ThemePreviewPanel :visual="editorModel.visual">

        <template #extra>

          <NButton size="small" type="primary" @click="handleApplyPreview">应用到当前会话</NButton>

        </template>

      </ThemePreviewPanel>

      <template #footer>

        <NButton @click="previewVisible = false">关闭</NButton>

      </template>

    </NModal>



    <ThemeVersionModal v-model:visible="versionVisible" />
  </div>
</template>

<style lang="scss">
@import './styles/forest-theme.scss';
</style>

<style scoped lang="scss">
.theme-config-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.main-split {
  display: flex;
  gap: 14px;
  flex: 1;
  min-height: 0;
  align-items: stretch;
  height: calc(100vh - 220px - var(--calc-footer-height, 0px));
  min-height: 560px;
}

.editor-column {
  flex: 1;
  min-width: 0;
  min-height: 0;
}

@media (max-width: 1366px) {
  .main-split {
    flex-direction: column;
    height: auto;
  }

  .editor-column {
    min-height: 620px;
  }
}

:deep(.n-slider-rail) {
  background: #dcebfa;
}

:deep(.n-slider-fill) {
  background: #1890ff !important;
}
</style>


