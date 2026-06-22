<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { DesignerCanvasElement } from '../utils/paper-size';

const props = defineProps<{
  element: DesignerCanvasElement;
  zoom: number;
}>();

const emit = defineEmits<{
  'signature-change': [imageSrc: string | undefined];
  'signature-drag-start': [e: MouseEvent];
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const drawing = ref(false);
const lastPoint = ref<{ x: number; y: number } | null>(null);

function canvasSize() {
  return {
    width: Math.max(1, Math.round(props.element.width)),
    height: Math.max(1, Math.round(props.element.height))
  };
}

function getCtx() {
  return canvasRef.value?.getContext('2d') ?? null;
}

function clearCanvasPixels() {
  const canvas = canvasRef.value;
  const ctx = getCtx();
  if (!canvas || !ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function paintFromImageSrc(src?: string) {
  const canvas = canvasRef.value;
  const ctx = getCtx();
  if (!canvas || !ctx) return;

  clearCanvasPixels();
  if (!src) return;

  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  img.src = src;
}

function syncCanvasSize() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const prevSrc = props.element.imageSrc;
  const { width, height } = canvasSize();
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  paintFromImageSrc(prevSrc);
}

function getPoint(e: MouseEvent) {
  const canvas = canvasRef.value!;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

function onCanvasMouseDown(e: MouseEvent) {
  if (e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();
  drawing.value = true;
  lastPoint.value = getPoint(e);
}

function onCanvasMouseMove(e: MouseEvent) {
  if (!drawing.value) return;
  e.preventDefault();
  e.stopPropagation();
  const ctx = getCtx();
  const canvas = canvasRef.value;
  if (!ctx || !canvas || !lastPoint.value) return;

  const point = getPoint(e);
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = Math.max(1.5, props.element.width / 80);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(lastPoint.value.x, lastPoint.value.y);
  ctx.lineTo(point.x, point.y);
  ctx.stroke();
  lastPoint.value = point;
}

function commitSignature() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = getCtx();
  if (!ctx) return;

  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let hasInk = false;
  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] > 0) {
      hasInk = true;
      break;
    }
  }
  emit('signature-change', hasInk ? canvas.toDataURL('image/png') : undefined);
}

function endDrawing() {
  if (!drawing.value) return;
  drawing.value = false;
  lastPoint.value = null;
  commitSignature();
}

function onWindowMouseUp() {
  endDrawing();
}

function onHandleMouseDown(e: MouseEvent) {
  e.stopPropagation();
  emit('signature-drag-start', e);
}

watch(
  () => [props.element.width, props.element.height, props.zoom] as const,
  () => {
    nextTick(syncCanvasSize);
  }
);

watch(
  () => props.element.imageSrc,
  src => {
    if (drawing.value) return;
    nextTick(() => paintFromImageSrc(src));
  }
);

onMounted(() => {
  syncCanvasSize();
  window.addEventListener('mouseup', onWindowMouseUp);
});

onBeforeUnmount(() => {
  window.removeEventListener('mouseup', onWindowMouseUp);
  endDrawing();
});
</script>

<template>
  <div class="signature-block" @mousedown.stop>
    <div class="signature-block__handle" @mousedown="onHandleMouseDown">
      签名栏 · 拖此移动 · 在下方按住左键签名
    </div>
    <div class="signature-block__body">
      <canvas
        ref="canvasRef"
        class="signature-block__canvas"
        @mousedown="onCanvasMouseDown"
        @mousemove="onCanvasMouseMove"
      />
      <span v-if="!element.imageSrc && !drawing" class="signature-block__hint">按住左键签名</span>
    </div>
  </div>
</template>

<style scoped>
.signature-block {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.signature-block__handle {
  flex-shrink: 0;
  padding: 2px 6px;
  font-size: 9px;
  color: #6b7280;
  background: #f3f4f6;
  border-bottom: 1px solid #d1d5db;
  cursor: grab;
  user-select: none;
}

.signature-block__handle:active {
  cursor: grabbing;
}

.signature-block__body {
  position: relative;
  flex: 1;
  min-height: 0;
  background: #fff;
}

.signature-block__canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
  touch-action: none;
}

.signature-block__hint {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #9ca3af;
  pointer-events: none;
  user-select: none;
}
</style>
