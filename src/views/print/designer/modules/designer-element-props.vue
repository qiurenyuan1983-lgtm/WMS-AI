<script setup lang="ts">
import { computed, ref } from 'vue';
import type { UploadFileInfo } from 'naive-ui';
import {
  NButton,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
  NSwitch,
  NUpload
} from 'naive-ui';
import { QRCODE_BIND_FIELD_OPTIONS } from '../../constants';
import type { DesignerCanvasElement } from '../utils/paper-size';
import { compressImageForElement } from '../utils/image-compress';
import {
  addTableCol,
  addTableRow,
  countCellsInRange,
  ensureTableConfig,
  getRangeAnchor,
  getTableCellDisplay,
  normalizeCellRange,
  resizeTableConfig,
  setCellSpan,
  type TableCellItem,
  type TableCellRange
} from '../utils/table-utils';

const props = defineProps<{
  element: DesignerCanvasElement;
  index: number;
  widthPx: number;
  heightPx: number;
  tableSelectedRange?: TableCellRange | null;
}>();

const emit = defineEmits<{
  update: [patch: Partial<DesignerCanvasElement>];
  delete: [];
  'table-config-change': [config: ReturnType<typeof ensureTableConfig>];
  'table-cell-clear': [row: number, col: number];
  'table-cell-update': [row: number, col: number, patch: Partial<TableCellItem>];
}>();

const labelLayoutOptions = [
  { label: '上下排列', value: 'vertical' as const },
  { label: '左右排列', value: 'horizontal' as const }
];

const isQrcode = computed(() => props.element.label === '二维码');
const isTable = computed(() => props.element.label === '表格');
const isText = computed(
  () => props.element.kind === 'component' && (props.element.label === '文本' || props.element.label === '标题')
);
const isDynamicField = computed(() => props.element.kind === 'component' && props.element.label === '动态字段');
const isNumberSequence = computed(() => props.element.kind === 'component' && props.element.label === '号码排列');
const isDecorative = computed(
  () =>
    props.element.kind === 'component' &&
    ['横线', '竖线', '方框', '页码', '日期'].includes(props.element.label)
);
const isImage = computed(
  () => props.element.kind === 'component' && (props.element.label === '图片' || props.element.label === '公司Logo')
);
const isSignature = computed(() => props.element.kind === 'component' && props.element.label === '签名栏');

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const imageUploading = ref(false);
const tableConfig = computed(() => (isTable.value ? ensureTableConfig(props.element) : null));

const rangeAnchor = computed(() => {
  if (!props.tableSelectedRange) return null;
  return getRangeAnchor(props.tableSelectedRange);
});

const selectionCount = computed(() => {
  if (!tableConfig.value || !props.tableSelectedRange) return 0;
  return countCellsInRange(tableConfig.value, props.tableSelectedRange);
});

const isSingleCellSelection = computed(() => selectionCount.value <= 1);

const activeCell = computed(() => {
  if (!tableConfig.value || !rangeAnchor.value) return null;
  const { row, col } = rangeAnchor.value;
  return tableConfig.value.cells[row]?.[col] ?? null;
});

const activeCellDisplay = computed(() => (activeCell.value ? getTableCellDisplay(activeCell.value) : null));

const rangeLabel = computed(() => {
  if (!props.tableSelectedRange) return '';
  const { minRow, maxRow, minCol, maxCol } = normalizeCellRange(props.tableSelectedRange);
  if (minRow === maxRow && minCol === maxCol) {
    return `单元格 (${minRow + 1}, ${minCol + 1})`;
  }
  return `区域 (${minRow + 1},${minCol + 1}) — (${maxRow + 1},${maxCol + 1}) · ${selectionCount.value} 格`;
});

function onUpdate(patch: Partial<DesignerCanvasElement>) {
  emit('update', patch);
}

function onQrcodeBindField(field: string) {
  onUpdate({ bindField: field, placeholder: `{${field}}` });
}

function onDynamicFieldBind(field: string) {
  onUpdate({ bindField: field, placeholder: `{${field}}` });
}

function onTableShowHeaderChange(show: boolean) {
  if (!tableConfig.value) return;
  emit('table-config-change', { ...tableConfig.value, showHeader: show });
}

async function handleImageBeforeUpload(data: { file: UploadFileInfo }) {
  const file = data.file.file;
  if (!file) return false;
  if (!file.type.startsWith('image/')) {
    window.$message?.error('请上传图片文件（JPG、PNG、GIF、WebP）');
    return false;
  }
  if (file.size > MAX_IMAGE_SIZE) {
    window.$message?.error('图片大小不能超过 5MB');
    return false;
  }
  imageUploading.value = true;
  try {
    const imageSrc = await compressImageForElement(
      file,
      props.element.width,
      props.element.height
    );
    onUpdate({ imageSrc });
    window.$message?.success(
      `图片已适配组件尺寸 ${Math.round(props.element.width)}×${Math.round(props.element.height)} px`
    );
  } catch {
    window.$message?.error('图片处理失败，请换一张重试');
  } finally {
    imageUploading.value = false;
  }
  return false;
}

function clearImage() {
  onUpdate({ imageSrc: undefined });
}

function clearSignature() {
  onUpdate({ imageSrc: undefined });
  window.$message?.success('签名已清除');
}

function onTableRowsColsChange(rows: number | null, cols: number | null) {
  if (!tableConfig.value) return;
  const next = resizeTableConfig(
    tableConfig.value,
    rows ?? tableConfig.value.rows,
    cols ?? tableConfig.value.cols
  );
  emit('table-config-change', next);
}

function onCellTextChange(text: string) {
  if (!rangeAnchor.value) return;
  const { row, col } = rangeAnchor.value;
  emit('table-cell-update', row, col, { type: 'text', label: '', text });
}

function onAddRow() {
  if (!tableConfig.value || !rangeAnchor.value) return;
  emit('table-config-change', addTableRow(tableConfig.value, rangeAnchor.value.row));
}

function onAddCol() {
  if (!tableConfig.value || !rangeAnchor.value) return;
  emit('table-config-change', addTableCol(tableConfig.value, rangeAnchor.value.col));
}

function onSpanChange(rowSpan: number | null, colSpan: number | null) {
  if (!tableConfig.value || !rangeAnchor.value) return;
  const { row, col } = rangeAnchor.value;
  const cell = tableConfig.value.cells[row][col];
  emit(
    'table-config-change',
    setCellSpan(
      tableConfig.value,
      row,
      col,
      rowSpan ?? cell.rowSpan ?? 1,
      colSpan ?? cell.colSpan ?? 1
    )
  );
}
</script>

<template>
  <div class="element-props">
    <div v-if="index > 0" class="element-props__divider" />
    <div class="element-props__title">元素 {{ index + 1 }} · {{ element.label }}</div>
    <NForm label-placement="top" size="small">
      <NFormItem label="元素">
        <NInput :value="element.label" disabled />
      </NFormItem>

      <NFormItem v-if="isText" :label="element.label === '标题' ? '标题内容' : '文本内容'">
        <NInput
          :value="element.placeholder || ''"
          :placeholder="element.label === '标题' ? '输入标题文字' : '输入静态文本'"
          @update:value="v => onUpdate({ placeholder: v ?? '' })"
        />
      </NFormItem>

      <NFormItem v-if="isDynamicField" label="绑定字段">
        <NSelect
          :value="element.bindField ?? '订单号'"
          :options="QRCODE_BIND_FIELD_OPTIONS"
          size="small"
          @update:value="v => v && onDynamicFieldBind(v)"
        />
      </NFormItem>

      <NFormItem v-if="isSignature" label="签名">
        <div class="signature-props-block">
          <div v-if="element.imageSrc" class="image-upload-preview">
            <img :src="element.imageSrc" alt="签名预览" />
          </div>
          <div v-else class="image-upload-empty">在画布签名栏内按住左键绘制签名</div>
          <NButton
            v-if="element.imageSrc"
            class="mt-8px"
            size="small"
            secondary
            block
            @click="clearSignature"
          >
            清除签名
          </NButton>
        </div>
      </NFormItem>

      <NFormItem v-if="isImage" label="图片">
        <div class="image-upload-block">
          <div v-if="element.imageSrc" class="image-upload-preview">
            <img :src="element.imageSrc" alt="图片预览" />
          </div>
          <div v-else class="image-upload-empty">暂未上传，点击下方按钮选择图片</div>
          <NSpace class="mt-8px">
            <NUpload
              accept="image/*"
              :max="1"
              :show-file-list="false"
              @before-upload="handleImageBeforeUpload"
            >
              <NButton size="small" :loading="imageUploading">
                {{ element.imageSrc ? '更换图片' : '上传图片' }}
              </NButton>
            </NUpload>
            <NButton v-if="element.imageSrc" size="small" secondary @click="clearImage">清除</NButton>
          </NSpace>
          <p class="text-xs text-gray-500 mt-8px mb-0">
            支持 JPG / PNG / GIF / WebP，不超过 5MB；上传后自动压缩至
            {{ Math.round(element.width) }}×{{ Math.round(element.height) }} px
          </p>
        </div>
      </NFormItem>

      <template v-if="isTable && tableConfig">
        <NFormItem label="表头行">
          <div class="flex items-center justify-between w-full">
            <span class="text-sm">显示首行表头</span>
            <NSwitch
              :value="tableConfig.showHeader !== false"
              @update:value="onTableShowHeaderChange"
            />
          </div>
        </NFormItem>
        <NFormItem label="表格规模">
          <NSpace>
            <NInputNumber
              :value="tableConfig.rows"
              :min="1"
              :max="20"
              size="small"
              placeholder="行"
              @update:value="v => v != null && onTableRowsColsChange(v, null)"
            />
            <span class="text-sm text-gray-500">×</span>
            <NInputNumber
              :value="tableConfig.cols"
              :min="1"
              :max="12"
              size="small"
              placeholder="列"
              @update:value="v => v != null && onTableRowsColsChange(null, v)"
            />
          </NSpace>
        </NFormItem>
        <NFormItem v-if="tableSelectedRange" label="结构操作">
          <NSpace>
            <NButton size="tiny" @click="onAddRow">增加行</NButton>
            <NButton size="tiny" @click="onAddCol">增加列</NButton>
          </NSpace>
        </NFormItem>
        <p class="text-xs text-gray-500 -mt-8px mb-12px">
          按住左键拖动可框选多个单元格；右键可合并选中区域、删行/删列。
        </p>
        <template v-if="tableSelectedRange && activeCell">
          <NFormItem :label="rangeLabel">
            <NInput :value="activeCellDisplay?.primary" disabled size="small" />
          </NFormItem>
          <p v-if="!isSingleCellSelection" class="text-xs text-primary mb-12px">
            已框选 {{ selectionCount }} 个单元格，右键选择「合并选中区域」
          </p>
          <template v-if="isSingleCellSelection">
            <NFormItem label="合并跨度">
              <NSpace>
                <NInputNumber
                  :value="activeCell.rowSpan ?? 1"
                  :min="1"
                  :max="tableConfig.rows - (rangeAnchor?.row ?? 0)"
                  size="small"
                  placeholder="行"
                  @update:value="v => v != null && onSpanChange(v, null)"
                />
                <span class="text-sm text-gray-500">×</span>
                <NInputNumber
                  :value="activeCell.colSpan ?? 1"
                  :min="1"
                  :max="tableConfig.cols - (rangeAnchor?.col ?? 0)"
                  size="small"
                  placeholder="列"
                  @update:value="v => v != null && onSpanChange(null, v)"
                />
              </NSpace>
            </NFormItem>
            <NFormItem
              v-if="activeCell.type === 'text' || activeCell.type === 'empty'"
              label="单元格文本"
            >
              <NInput
                :value="activeCell.text || ''"
                placeholder="输入表头或静态文本"
                @update:value="onCellTextChange"
              />
            </NFormItem>
            <NFormItem v-if="activeCell.type === 'field'" label="绑定占位符">
              <NInput
                :value="activeCell.placeholder || ''"
                @update:value="v => rangeAnchor && emit('table-cell-update', rangeAnchor.row, rangeAnchor.col, { placeholder: v })"
              />
            </NFormItem>
            <NFormItem v-if="activeCell.type === 'qrcode'" label="二维码绑定">
              <NSelect
                :value="activeCell.bindField ?? '卡板号'"
                :options="QRCODE_BIND_FIELD_OPTIONS"
                size="small"
                @update:value="v => v && rangeAnchor && emit('table-cell-update', rangeAnchor.row, rangeAnchor.col, { bindField: v, placeholder: `{${v}}` })"
              />
            </NFormItem>
            <NButton
              v-if="activeCell.type !== 'empty'"
              size="small"
              secondary
              block
              @click="rangeAnchor && emit('table-cell-clear', rangeAnchor.row, rangeAnchor.col)"
            >
              清空单元格
            </NButton>
          </template>
        </template>
        <p v-else class="text-xs text-gray-500 mb-12px">在表格中点击或拖动框选单元格</p>
      </template>

      <template v-if="isNumberSequence">
        <NFormItem label="起始序号">
          <NInputNumber
            :value="element.serialStart ?? 1"
            :min="1"
            :max="9999"
            size="small"
            class="w-full"
            @update:value="v => v != null && onUpdate({ serialStart: v })"
          />
        </NFormItem>
        <NFormItem label="显示行数">
          <NInputNumber
            :value="element.serialCount ?? 10"
            :min="1"
            :max="99"
            size="small"
            class="w-full"
            @update:value="v => v != null && onUpdate({ serialCount: v })"
          />
        </NFormItem>
      </template>

      <NFormItem
        v-if="
          !isQrcode &&
          !isTable &&
          !isText &&
          !isImage &&
          !isSignature &&
          !isDynamicField &&
          !isDecorative &&
          !isNumberSequence
        "
        label="占位符 / 绑定"
      >
        <NInput
          :value="element.placeholder"
          @update:value="v => onUpdate({ placeholder: v })"
        />
      </NFormItem>
      <NFormItem v-if="isQrcode && !isTable" label="绑定字段">
        <NSelect
          :value="element.bindField ?? '卡板号'"
          :options="QRCODE_BIND_FIELD_OPTIONS"
          size="small"
          @update:value="v => v && onQrcodeBindField(v)"
        />
      </NFormItem>

      <NFormItem label="显示设置">
        <NSpace vertical class="w-full">
          <div class="flex items-center justify-between">
            <span class="text-sm">显示字段名</span>
            <NSwitch
              :value="element.showLabel !== false"
              @update:value="v => onUpdate({ showLabel: v })"
            />
          </div>
          <div v-if="isQrcode" class="flex items-center justify-between">
            <span class="text-sm">显示绑定字段</span>
            <NSwitch
              :value="element.showBindFieldLabel !== false"
              @update:value="v => onUpdate({ showBindFieldLabel: v })"
            />
          </div>
          <div v-if="element.kind === 'field'" class="flex items-center justify-between">
            <span class="text-sm">排列方向</span>
            <NSelect
              class="w-120px"
              size="small"
              :value="element.labelLayout ?? 'vertical'"
              :options="labelLayoutOptions"
              @update:value="v => v && onUpdate({ labelLayout: v })"
            />
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm">预览/打印输出</span>
            <NSwitch
              :value="element.visible !== false"
              @update:value="v => onUpdate({ visible: v })"
            />
          </div>
        </NSpace>
      </NFormItem>
      <NFormItem label="X / Y (px)">
        <NSpace>
          <NInputNumber
            :value="Math.round(element.x)"
            :min="0"
            :max="widthPx"
            size="small"
            @update:value="v => v != null && onUpdate({ x: v })"
          />
          <NInputNumber
            :value="Math.round(element.y)"
            :min="0"
            :max="heightPx"
            size="small"
            @update:value="v => v != null && onUpdate({ y: v })"
          />
        </NSpace>
      </NFormItem>
      <NFormItem label="宽 / 高 (px)">
        <NSpace vertical class="w-full">
          <NSpace>
            <NInputNumber
              :value="element.width"
              :min="20"
              size="small"
              @update:value="v => v != null && onUpdate({ width: v })"
            />
            <NInputNumber
              :value="element.height"
              :min="16"
              size="small"
              @update:value="v => v != null && onUpdate({ height: v })"
            />
          </NSpace>
          <span class="text-xs text-gray-500">
            当前 {{ Math.round(element.width) }}×{{ Math.round(element.height) }} px
          </span>
        </NSpace>
      </NFormItem>
      <NFormItem label="字体大小 (pt)">
        <NInputNumber
          :value="element.fontSize"
          :min="8"
          :max="36"
          size="small"
          @update:value="v => v != null && onUpdate({ fontSize: v })"
        />
      </NFormItem>
      <NFormItem label="加粗">
        <NSelect
          :value="element.fontWeight"
          :options="[
            { label: '常规', value: 'normal' },
            { label: '加粗', value: 'bold' }
          ]"
          size="small"
          @update:value="v => onUpdate({ fontWeight: v as 'normal' | 'bold' })"
        />
      </NFormItem>
      <NFormItem label="对齐">
        <NSelect
          :value="element.textAlign"
          :options="[
            { label: '左', value: 'left' },
            { label: '中', value: 'center' },
            { label: '右', value: 'right' }
          ]"
          size="small"
          @update:value="v => onUpdate({ textAlign: v as 'left' | 'center' | 'right' })"
        />
      </NFormItem>
      <NFormItem label="格式化">
        <NSelect
          :value="element.format"
          clearable
          :options="[
            { label: '金额大写', value: 'amount_cn' },
            { label: '日期 YYYY-MM-DD', value: 'date' },
            { label: '中英文双语', value: 'bilingual' }
          ]"
          placeholder="无"
          size="small"
          @update:value="v => onUpdate({ format: (v as string) || null })"
        />
      </NFormItem>
      <NButton type="error" secondary block size="small" @click="emit('delete')">
        删除此元素
      </NButton>
    </NForm>
  </div>
</template>

<style scoped>
.element-props__divider {
  margin: 16px 0;
  border-top: 1px dashed var(--n-border-color);
}

.element-props__title {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--n-text-color-2);
}

.image-upload-block {
  width: 100%;
}

.image-upload-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 72px;
  max-height: 120px;
  padding: 8px;
  border: 1px dashed var(--n-border-color);
  border-radius: 6px;
  background: var(--n-color-modal);
  overflow: hidden;
}

.image-upload-preview img {
  max-width: 100%;
  max-height: 104px;
  object-fit: contain;
}

.image-upload-empty {
  padding: 16px 8px;
  font-size: 12px;
  color: var(--n-text-color-3);
  text-align: center;
  border: 1px dashed var(--n-border-color);
  border-radius: 6px;
  background: var(--n-color-modal);
}
</style>
