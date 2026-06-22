<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NTabPane, NTabs } from 'naive-ui';
import { CHAT_EMOJI_GROUPS, CHAT_STICKERS, type ChatStickerItem } from '../utils/chat-expression';

const visible = defineModel<boolean>('visible', { default: false });

const props = defineProps<{
  x: number;
  y: number;
  initialTab?: 'emoji' | 'sticker';
  emojiOnly?: boolean;
}>();

const emit = defineEmits<{
  (e: 'select-emoji', emoji: string): void;
  (e: 'select-sticker', sticker: ChatStickerItem): void;
}>();

const activeTab = ref<'emoji' | 'sticker'>('emoji');

const panelStyle = computed(() => {
  const width = 320;
  const height = 280;
  const margin = 12;
  let left = props.x;
  let top = props.y;
  if (left + width + margin > window.innerWidth) left = window.innerWidth - width - margin;
  if (top + height + margin > window.innerHeight) top = window.innerHeight - height - margin;
  return {
    left: `${Math.max(margin, left)}px`,
    top: `${Math.max(margin, top)}px`
  };
});

watch(visible, open => {
  if (open) activeTab.value = props.emojiOnly ? 'emoji' : props.initialTab || 'emoji';
});

function handleEmojiSelect(emoji: string) {
  emit('select-emoji', emoji);
}

function handleStickerSelect(sticker: ChatStickerItem) {
  emit('select-sticker', sticker);
  visible.value = false;
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="expression-mask" @click="visible = false" @contextmenu.prevent />
    <div v-if="visible" class="expression-picker" :style="panelStyle" @click.stop @contextmenu.prevent>
      <NTabs v-model:value="activeTab" type="line" size="small" class="expression-tabs">
        <NTabPane name="emoji" tab="表情">
          <div class="expression-scroll">
            <div v-for="group in CHAT_EMOJI_GROUPS" :key="group.key" class="emoji-group">
              <div class="emoji-group-title">{{ group.label }}</div>
              <div class="emoji-grid">
                <button
                  v-for="emoji in group.emojis"
                  :key="`${group.key}-${emoji}`"
                  type="button"
                  class="emoji-item"
                  @click="handleEmojiSelect(emoji)"
                >
                  {{ emoji }}
                </button>
              </div>
            </div>
          </div>
        </NTabPane>
        <NTabPane v-if="!emojiOnly" name="sticker" tab="动态图">
          <div class="expression-scroll">
            <div class="sticker-grid">
              <button
                v-for="sticker in CHAT_STICKERS"
                :key="sticker.id"
                type="button"
                class="sticker-item"
                @click="handleStickerSelect(sticker)"
              >
                <span class="sticker-emoji" :class="`sticker-emoji--${sticker.animation}`">{{ sticker.emoji }}</span>
                <span class="sticker-label">{{ sticker.label }}</span>
              </button>
            </div>
          </div>
        </NTabPane>
      </NTabs>
    </div>
  </Teleport>
</template>

<style scoped>
.expression-mask {
  position: fixed;
  inset: 0;
  z-index: 1999;
  background: transparent;
}

.expression-picker {
  position: fixed;
  z-index: 2000;
  width: 320px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 12px 32px rgb(15 23 42 / 14%);
  overflow: hidden;
}

.expression-tabs :deep(.n-tabs-pane) {
  padding-top: 4px;
}

.expression-scroll {
  max-height: 220px;
  overflow-y: auto;
  padding: 0 4px 8px;
}

.emoji-group + .emoji-group {
  margin-top: 8px;
}

.emoji-group-title {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
}

.emoji-item {
  border: none;
  background: transparent;
  font-size: 22px;
  line-height: 1;
  padding: 6px 0;
  border-radius: 6px;
  cursor: pointer;
}

.emoji-item:hover {
  background: #f3f4f6;
}

.sticker-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.sticker-item {
  border: 1px solid #f0f0f0;
  background: #fafafa;
  border-radius: 8px;
  padding: 10px 6px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.sticker-item:hover {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.sticker-emoji {
  font-size: 28px;
  line-height: 1;
  display: inline-block;
}

.sticker-label {
  font-size: 11px;
  color: #6b7280;
}

.sticker-emoji--bounce {
  animation: sticker-bounce 1s ease-in-out infinite;
}

.sticker-emoji--pulse {
  animation: sticker-pulse 1.2s ease-in-out infinite;
}

.sticker-emoji--shake {
  animation: sticker-shake 0.8s ease-in-out infinite;
}

.sticker-emoji--spin {
  animation: sticker-spin 2s linear infinite;
}

@keyframes sticker-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

@keyframes sticker-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
}

@keyframes sticker-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-3px);
  }
  75% {
    transform: translateX(3px);
  }
}

@keyframes sticker-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
