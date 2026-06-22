<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { NButton, NCard, NEmpty, NSelect, NSpace } from 'naive-ui';
import { fetchGetIecRpaFlowDetail, fetchGetIecRpaFlowList, fetchSaveIecRpaFlow } from '@/service/api/iec';
import { RPA_NODE_PALETTE } from '../constants';
import RpaNodeConfigPanel from './modules/rpa-node-config-panel.vue';
import { createDefaultNodeConfig, normalizeRpaNodeConfig } from './utils/rpa-node-config';

defineOptions({ name: 'IecRpa' });

const DRAG_TYPE = 'application/iec-rpa-node';

const flowId = ref(1);
const flowMeta = ref<{ flowName: string; employeeName: string } | null>(null);
const nodes = ref<Api.Iec.RpaNode[]>([]);
const selectedNodeId = ref<string | null>(null);
const saving = ref(false);
const canvasRef = ref<HTMLElement | null>(null);
const flowOptions = ref<Array<{ label: string; value: number }>>([]);

const draggingPalette = ref<{ type: Api.Iec.RpaNodeType; label: string } | null>(null);
const movingNodeId = ref<string | null>(null);
const moveStart = ref({ nodeX: 0, nodeY: 0, pointerX: 0, pointerY: 0 });

const selectedNode = computed(() => nodes.value.find(n => n.id === selectedNodeId.value) ?? null);

const connectorPaths = computed(() => {
  const sorted = [...nodes.value].sort((a, b) => a.x - b.x);
  return sorted.slice(0, -1).map((node, idx) => {
    const next = sorted[idx + 1];
    return {
      x1: node.x + 60,
      y1: node.y + 28,
      x2: next.x,
      y2: next.y + 28
    };
  });
});

async function loadFlowList() {
  const { data } = await fetchGetIecRpaFlowList({ pageNum: 1, pageSize: 20 });
  const rows = (data as any)?.rows ?? [];
  flowOptions.value = rows.map((r: any) => ({ label: r.flowName, value: r.id }));
  if (rows.length && !flowOptions.value.find(o => o.value === flowId.value)) {
    flowId.value = rows[0].id;
  }
}

async function loadFlowDetail() {
  const { data } = await fetchGetIecRpaFlowDetail(flowId.value);
  if (!data) return;
  flowMeta.value = { flowName: data.flowName, employeeName: data.employeeName };
  nodes.value = (data.nodes ?? []).map(n => ({
    ...n,
    config: normalizeRpaNodeConfig(n.config as any, n.type)
  }));
  selectedNodeId.value = nodes.value[0]?.id ?? null;
}

function createNode(type: Api.Iec.RpaNodeType, label: string, x: number, y: number): Api.Iec.RpaNode {
  return {
    id: `n${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    label,
    x: Math.max(16, x),
    y: Math.max(16, y),
    config: createDefaultNodeConfig(type)
  };
}

function addNodeAtEnd(type: Api.Iec.RpaNodeType, label: string) {
  const last = nodes.value[nodes.value.length - 1];
  const node = createNode(type, label, (last?.x ?? 20) + 160, last?.y ?? 80);
  nodes.value.push(node);
  selectedNodeId.value = node.id;
}

function onPaletteDragStart(e: DragEvent, type: Api.Iec.RpaNodeType, label: string) {
  draggingPalette.value = { type, label };
  e.dataTransfer?.setData(DRAG_TYPE, JSON.stringify({ type, label }));
  e.dataTransfer!.effectAllowed = 'copy';
}

function onCanvasDragOver(e: DragEvent) {
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
}

function onCanvasDrop(e: DragEvent) {
  e.preventDefault();
  const canvas = canvasRef.value;
  if (!canvas) return;
  const wrap = canvas.parentElement;
  const rect = canvas.getBoundingClientRect();
  const scrollLeft = wrap?.scrollLeft ?? 0;
  const scrollTop = wrap?.scrollTop ?? 0;
  const x = e.clientX - rect.left + scrollLeft - 60;
  const y = e.clientY - rect.top + scrollTop - 28;
  let payload = draggingPalette.value;
  if (!payload) {
    try {
      payload = JSON.parse(e.dataTransfer?.getData(DRAG_TYPE) || '{}');
    } catch {
      payload = null;
    }
  }
  if (!payload?.type) return;
  const node = createNode(payload.type, payload.label, x, y);
  nodes.value.push(node);
  selectedNodeId.value = node.id;
  draggingPalette.value = null;
}

function selectNode(id: string) {
  selectedNodeId.value = id;
}

function onNodePointerDown(e: PointerEvent, node: Api.Iec.RpaNode) {
  if ((e.target as HTMLElement).closest('.rpa-node-delete')) return;
  e.stopPropagation();
  e.preventDefault();
  selectNode(node.id);
  movingNodeId.value = node.id;
  moveStart.value = {
    nodeX: node.x,
    nodeY: node.y,
    pointerX: e.clientX,
    pointerY: e.clientY
  };
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
}

function onNodePointerMove(e: PointerEvent, node: Api.Iec.RpaNode) {
  if (movingNodeId.value !== node.id) return;
  node.x = Math.max(8, moveStart.value.nodeX + (e.clientX - moveStart.value.pointerX));
  node.y = Math.max(8, moveStart.value.nodeY + (e.clientY - moveStart.value.pointerY));
}

function onNodePointerUp(e: PointerEvent) {
  if (movingNodeId.value) {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }
  movingNodeId.value = null;
}

function removeNode(id: string, e: Event) {
  e.stopPropagation();
  nodes.value = nodes.value.filter(n => n.id !== id);
  if (selectedNodeId.value === id) {
    selectedNodeId.value = nodes.value[0]?.id ?? null;
  }
}

function onCanvasClick() {
  selectedNodeId.value = null;
}

async function saveFlow() {
  saving.value = true;
  try {
    const { data } = await fetchSaveIecRpaFlow(flowId.value, nodes.value);
    window.$message?.success((data as any)?.message ?? '已保存');
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await loadFlowList();
  await loadFlowDetail();
});

onUnmounted(() => {
  movingNodeId.value = null;
});
</script>

<template>
  <div class="rpa-editor h-full flex flex-col gap-12px overflow-hidden">
    <NCard :bordered="false" class="card-wrapper flex-shrink-0" size="small">
      <div class="flex items-center justify-between flex-wrap gap-8px">
        <div>
          <span class="text-16px font-semibold">RPA 流程编辑器</span>
          <span v-if="flowMeta" class="text-13px text-gray-500 ml-8px">
            {{ flowMeta.flowName }} · {{ flowMeta.employeeName }}
          </span>
        </div>
        <NSpace>
          <NSelect v-model:value="flowId" :options="flowOptions" class="w-220px" @update:value="loadFlowDetail" />
          <NButton :loading="saving" type="primary" @click="saveFlow">保存流程</NButton>
        </NSpace>
      </div>
    </NCard>

    <div class="rpa-workspace flex-1 min-h-0">
      <!-- 左侧动作组件 -->
      <aside class="rpa-palette">
        <div class="panel-title">动作组件</div>
        <p class="palette-hint">拖拽到中间画布，或点击追加到流程末尾</p>
        <div
          v-for="item in RPA_NODE_PALETTE"
          :key="item.type"
          class="palette-item"
          draggable="true"
          @dragstart="onPaletteDragStart($event, item.type, item.label)"
          @click="addNodeAtEnd(item.type, item.label)"
        >
          <SvgIcon :icon="item.icon" class="palette-icon" />
          <span>{{ item.label }}</span>
        </div>
      </aside>

      <!-- 中间流程画布 -->
      <main class="rpa-canvas-wrap">
        <div
          ref="canvasRef"
          class="rpa-canvas"
          @dragover="onCanvasDragOver"
          @drop="onCanvasDrop"
          @click="onCanvasClick"
        >
          <svg class="rpa-lines" aria-hidden="true">
            <line
              v-for="(line, idx) in connectorPaths"
              :key="`line-${idx}`"
              :x1="line.x1"
              :y1="line.y1"
              :x2="line.x2"
              :y2="line.y2"
              stroke="#94a3b8"
              stroke-width="2"
              marker-end="url(#rpa-arrow)"
            />
            <defs>
              <marker id="rpa-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8" />
              </marker>
            </defs>
          </svg>

          <div
            v-for="node in nodes"
            :key="node.id"
            class="rpa-node"
            :class="{ active: selectedNodeId === node.id, moving: movingNodeId === node.id }"
            :style="{ left: `${node.x}px`, top: `${node.y}px` }"
            @pointerdown="onNodePointerDown($event, node)"
            @pointermove="onNodePointerMove($event, node)"
            @pointerup="onNodePointerUp"
            @pointercancel="onNodePointerUp"
          >
            <button type="button" class="rpa-node-delete" title="删除节点" @click="removeNode(node.id, $event)">
              ×
            </button>
            <div class="rpa-node-title">{{ node.label }}</div>
            <div class="rpa-node-type">{{ node.type }}</div>
            <div v-if="node.config.onFailure === 'MANUAL_TAKEOVER'" class="rpa-node-badge">人工</div>
          </div>

          <div v-if="!nodes.length" class="canvas-empty">
            <NEmpty description="拖拽左侧动作组件到此处" />
          </div>
        </div>
      </main>

      <!-- 右侧参数配置 -->
      <aside class="rpa-config">
        <RpaNodeConfigPanel :node="selectedNode" />
      </aside>
    </div>
  </div>
</template>

<style scoped>
.rpa-workspace {
  display: grid;
  grid-template-columns: 200px 1fr 280px;
  gap: 12px;
  min-height: 0;
}
.rpa-palette,
.rpa-config {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 12px;
  overflow-y: auto;
  min-height: 0;
}
.panel-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #1e3a5f;
}
.palette-hint {
  font-size: 11px;
  color: #9ca3af;
  margin: 0 0 10px;
}
.palette-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: left;
  padding: 8px 10px;
  margin-bottom: 6px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f8fafc;
  font-size: 12px;
  cursor: grab;
  user-select: none;
  transition: border-color 0.15s, color 0.15s;
}
.palette-item:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: #eff6ff;
}
.palette-item:active {
  cursor: grabbing;
}
.palette-icon {
  font-size: 16px;
  flex-shrink: 0;
}
.rpa-canvas-wrap {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: auto;
  min-height: 0;
}
.rpa-canvas {
  position: relative;
  min-width: 1100px;
  min-height: 420px;
  background: repeating-linear-gradient(0deg, #f9fafb, #f9fafb 19px, #f3f4f6 20px),
    repeating-linear-gradient(90deg, transparent, transparent 19px, #f3f4f6 20px);
}
.rpa-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  min-width: 1100px;
  min-height: 420px;
  pointer-events: none;
}
.rpa-node {
  position: absolute;
  width: 120px;
  padding: 10px 10px 8px;
  border-radius: 8px;
  border: 2px solid #cbd5e1;
  background: #fff;
  cursor: grab;
  box-shadow: 0 1px 4px rgb(0 0 0 / 6%);
  touch-action: none;
  z-index: 2;
}
.rpa-node.moving {
  cursor: grabbing;
  z-index: 3;
  box-shadow: 0 4px 12px rgb(37 99 235 / 18%);
}
.rpa-node.active {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgb(37 99 235 / 20%);
}
.rpa-node-delete {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: #ef4444;
  color: #fff;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
}
.rpa-node:hover .rpa-node-delete,
.rpa-node.active .rpa-node-delete {
  opacity: 1;
}
.rpa-node-title {
  font-size: 12px;
  font-weight: 600;
  padding-right: 8px;
}
.rpa-node-type {
  font-size: 10px;
  color: #9ca3af;
  margin-top: 4px;
}
.rpa-node-badge {
  margin-top: 6px;
  font-size: 10px;
  color: #ea580c;
  background: #fff7ed;
  border-radius: 4px;
  padding: 2px 4px;
  display: inline-block;
}
.canvas-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
</style>
