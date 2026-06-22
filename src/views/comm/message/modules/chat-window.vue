<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { NButton, NDropdown, NInput, NSpace, NTag } from 'naive-ui';
import type { DropdownOption } from 'naive-ui';
import { fetchGetMessageList } from '@/service/api/comm';
import ChatAttachModal from './chat-attach-modal.vue';
import ChatVoiceModal from './chat-voice-modal.vue';
import ChatMentionModal from './chat-mention-modal.vue';
import ChatScreenshotModal from './chat-screenshot-modal.vue';
import ChatFilePreviewModal from './chat-file-preview-modal.vue';
import ChatExpressionPicker from './chat-expression-picker.vue';
import ChatSendCardModal from './chat-send-card-modal.vue';
import { downloadParsedFile, parseFileMessage, type ParsedFileMessage } from '../utils/file-message';
import {
  isAnimatedImageMessage,
  parseAnimatedImageMessage,
  summarizeMessageReactions,
  CHAT_QUICK_REACTIONS,
  type ChatStickerItem
} from '../utils/chat-expression';

const props = defineProps<{
  conversationId: string | null;
  conversationName?: string;
}>();

const emit = defineEmits<{
  (e: 'open-business-panel'): void;
  (e: 'open-order-detail', orderNo: string): void;
}>();

const draft = ref('');
const loading = ref(false);
const messages = ref<Api.Comm.ChatMessage[]>([]);
const messagesRef = ref<HTMLElement | null>(null);

const imageModalVisible = ref(false);
const fileModalVisible = ref(false);
const voiceModalVisible = ref(false);
const mentionModalVisible = ref(false);
const screenshotModalVisible = ref(false);
const cardModalVisible = ref(false);
const filePreviewVisible = ref(false);
const previewFile = ref<ParsedFileMessage | null>(null);

let fileClickTimer: ReturnType<typeof setTimeout> | null = null;

const contextMenuShow = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const expressionPickerVisible = ref(false);
const expressionPickerX = ref(0);
const expressionPickerY = ref(0);
const expressionPickerTab = ref<'emoji' | 'sticker'>('emoji');
const expressionPickerTarget = ref<'composer' | 'bubble'>('composer');
const expressionPickerEmojiOnly = ref(false);
const reactionTargetMessageId = ref<string | null>(null);

const bubbleContextMenuShow = ref(false);
const bubbleContextMenuX = ref(0);
const bubbleContextMenuY = ref(0);

const composerContextMenuOptions: DropdownOption[] = [
  { label: '插入表情', key: 'emoji' },
  { label: '发送动态图', key: 'sticker' }
];

const bubbleContextMenuOptions = computed<DropdownOption[]>(() => [
  ...CHAT_QUICK_REACTIONS.map(emoji => ({ label: emoji, key: `quick:${emoji}` })),
  { type: 'divider', key: 'divider' },
  { label: '更多表情…', key: 'emoji' }
]);

const aiSuggestion =
  '您好，该订单目前已完成入库，正在等待 ISA 预约确认。预约完成后我们会第一时间安排派送，并同步派送时间。';

async function loadMessages() {
  if (!props.conversationId) {
    messages.value = [];
    return;
  }
  loading.value = true;
  const { data } = await fetchGetMessageList(props.conversationId);
  loading.value = false;
  messages.value = Array.isArray(data) ? data : [];
  scrollToBottom();
}

watch(() => props.conversationId, () => loadMessages(), { immediate: true });

const title = computed(() => props.conversationName || '选择会话');

function nowTime() {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function appendMessage(message: Api.Comm.ChatMessage) {
  if (!props.conversationId) return;
  messages.value.push({
    ...message,
    conversationId: props.conversationId,
    time: message.time || nowTime()
  });
  scrollToBottom();
}

async function scrollToBottom() {
  await nextTick();
  const el = messagesRef.value;
  if (el) el.scrollTop = el.scrollHeight;
}

function ensureConversation() {
  if (!props.conversationId) {
    window.$message?.warning('请先选择会话');
    return false;
  }
  return true;
}

function proto(msg: string) {
  window.$message?.info(`[原型] ${msg}`);
}

function sendText() {
  if (!draft.value.trim() || !props.conversationId) return;
  appendMessage({
    id: `local-${Date.now()}`,
    conversationId: props.conversationId,
    senderName: '我',
    isSelf: true,
    type: 'text',
    content: draft.value.trim(),
    time: nowTime(),
    read: false
  });
  draft.value = '';
}

function openImageModal() {
  if (!ensureConversation()) return;
  imageModalVisible.value = true;
}

function openFileModal() {
  if (!ensureConversation()) return;
  fileModalVisible.value = true;
}

function openVoiceModal() {
  if (!ensureConversation()) return;
  voiceModalVisible.value = true;
}

function openMentionModal() {
  if (!ensureConversation()) return;
  mentionModalVisible.value = true;
}

function openScreenshotModal() {
  if (!ensureConversation()) return;
  screenshotModalVisible.value = true;
}

function openCardModal() {
  if (!ensureConversation()) return;
  cardModalVisible.value = true;
}

function handleCardConfirm(payload: { type: Api.Comm.MessageType; cardPayload: Record<string, string> }) {
  if (!props.conversationId) return;
  appendMessage({
    id: `local-card-${Date.now()}`,
    conversationId: props.conversationId,
    senderName: '我',
    isSelf: true,
    type: payload.type,
    content: '',
    time: nowTime(),
    read: false,
    cardPayload: payload.cardPayload
  });
  window.$message?.success('业务卡片已发送');
}

function handleAttachConfirm(payload: {
  type: 'image' | 'file';
  orderNo: string;
  files: Array<{ name: string; sizeLabel: string; source: 'upload' | 'approval'; orderNo?: string }>;
}) {
  payload.files.forEach((file, index) => {
    const orderNo = file.orderNo || payload.orderNo;
    appendMessage({
      id: `local-${Date.now()}-${index}`,
      conversationId: props.conversationId!,
      senderName: '我',
      isSelf: true,
      type: payload.type,
      content:
        payload.type === 'image'
          ? `[图片] ${file.name} · 订单 ${orderNo}`
          : `[文件] ${file.name} (${file.sizeLabel}) · 订单 ${orderNo}${file.source === 'approval' ? ' · 审批附件' : ''}`,
      time: nowTime(),
      read: false,
      cardPayload: {
        订单号: orderNo,
        文件名: file.name,
        大小: file.sizeLabel,
        来源: file.source === 'approval' ? '审批文件' : '本地上传'
      }
    });
  });
  window.$message?.success(`已发送 ${payload.files.length} 个${payload.type === 'image' ? '图片' : '文件'}`);
}

function handleVoiceConfirm(payload: { durationSec: number; label: string }) {
  appendMessage({
    id: `local-voice-${Date.now()}`,
    conversationId: props.conversationId!,
    senderName: '我',
    isSelf: true,
    type: 'voice',
    content: `[语音消息] ${payload.label}`,
    time: nowTime(),
    read: false
  });
  window.$message?.success('语音已发送');
}

function handleMentionSelect(payload: { name: string; key: string; title?: string }) {
  draft.value = `${draft.value}@${payload.name} `;
  window.$message?.success(`已提及 ${payload.name}`);
}

function handleScreenshotConfirm(payload: { fileName: string }) {
  appendMessage({
    id: `local-shot-${Date.now()}`,
    conversationId: props.conversationId!,
    senderName: '我',
    isSelf: true,
    type: 'image',
    content: `[截图] ${payload.fileName}`,
    time: nowTime(),
    read: false
  });
  window.$message?.success('截图已发送');
}

function cardTitle(type: Api.Comm.MessageType) {
  const map: Partial<Record<Api.Comm.MessageType, string>> = {
    card_order: '订单卡片',
    card_trip: '车次订单卡片',
    card_container: '海柜卡片',
    card_exception: '异常卡片',
    card_bill: '账单卡片'
  };
  return map[type] || '业务卡片';
}

function cardFieldLabel(key: string) {
  const map: Record<string, string> = {
    orderNo: '订单号',
    customer: '客户',
    destination: '目的地',
    status: '状态',
    pallets: '板数',
    tripNo: '车次号',
    appointmentTime: '预约时间',
    palletQty: '板数',
    containerNo: '海柜号',
    vessel: '船名',
    eta: '预计到港',
    exceptionNo: '异常号',
    type: '类型',
    billNo: '账单号',
    amount: '金额'
  };
  return map[key] || key;
}

function getCardOrderNo(msg: Api.Comm.ChatMessage) {
  if (!msg.cardPayload) return null;
  return msg.cardPayload.orderNo || msg.cardPayload['订单号'] || null;
}

function openOrderDetail(msg: Api.Comm.ChatMessage) {
  const orderNo = getCardOrderNo(msg);
  if (!orderNo) {
    window.$message?.warning('未找到关联订单号');
    return;
  }
  emit('open-order-detail', orderNo);
}

function handleCardDetail(msg: Api.Comm.ChatMessage) {
  if (msg.type === 'card_order') {
    openOrderDetail(msg);
    return;
  }
  if (msg.type === 'card_trip') {
    proto('查看车次详情');
    return;
  }
  if (msg.type === 'card_container') {
    proto('查看海柜详情');
    return;
  }
  if (msg.type === 'card_exception') {
    proto('查看异常详情');
    return;
  }
  if (msg.type === 'card_bill') {
    proto('查看账单详情');
    return;
  }
  proto('查看详情');
}

function voiceLabel(content: string) {
  return content.replace('[语音消息] ', '');
}

function getFileInfo(msg: Api.Comm.ChatMessage) {
  return parseFileMessage(msg);
}

function openFilePreview(msg: Api.Comm.ChatMessage) {
  const file = getFileInfo(msg);
  if (!file) {
    window.$message?.warning('无法解析文件信息');
    return;
  }
  previewFile.value = file;
  filePreviewVisible.value = true;
}

function downloadFileMessage(msg: Api.Comm.ChatMessage) {
  const file = getFileInfo(msg);
  if (!file) {
    window.$message?.warning('无法解析文件信息');
    return;
  }
  downloadParsedFile(file);
}

function handleFileClick(msg: Api.Comm.ChatMessage) {
  if (fileClickTimer) return;
  fileClickTimer = setTimeout(() => {
    downloadFileMessage(msg);
    fileClickTimer = null;
  }, 250);
}

function handleFileDblClick(msg: Api.Comm.ChatMessage) {
  if (fileClickTimer) {
    clearTimeout(fileClickTimer);
    fileClickTimer = null;
  }
  openFilePreview(msg);
}

function fileDisplayName(msg: Api.Comm.ChatMessage) {
  return getFileInfo(msg)?.fileName || msg.content;
}

function fileDisplayMeta(msg: Api.Comm.ChatMessage) {
  const file = getFileInfo(msg);
  if (!file) return '';
  const parts = [file.sizeLabel, file.orderNo ? `订单 ${file.orderNo}` : '', file.source].filter(Boolean);
  return parts.join(' · ');
}

function closeComposerContextMenu() {
  contextMenuShow.value = false;
}

function closeBubbleContextMenu() {
  bubbleContextMenuShow.value = false;
}

function openExpressionPicker(tab: 'emoji' | 'sticker', x: number, y: number, target: 'composer' | 'bubble' = 'composer') {
  if (expressionPickerVisible.value && expressionPickerTab.value === tab && expressionPickerTarget.value === target) {
    expressionPickerVisible.value = false;
    return;
  }
  expressionPickerTarget.value = target;
  expressionPickerEmojiOnly.value = target === 'bubble';
  expressionPickerTab.value = tab;
  expressionPickerX.value = x;
  expressionPickerY.value = y;
  expressionPickerVisible.value = true;
}

function openEmojiPickerFromToolbar(event: MouseEvent) {
  if (!ensureConversation()) return;
  reactionTargetMessageId.value = null;
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const panelHeight = 280;
  openExpressionPicker('emoji', rect.left, Math.max(12, rect.top - panelHeight - 8), 'composer');
}

function openStickerPickerFromToolbar(event: MouseEvent) {
  if (!ensureConversation()) return;
  reactionTargetMessageId.value = null;
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const panelHeight = 280;
  openExpressionPicker('sticker', rect.left, Math.max(12, rect.top - panelHeight - 8), 'composer');
}

function handleComposerContextMenu(event: MouseEvent) {
  if (!ensureConversation()) return;
  event.preventDefault();
  reactionTargetMessageId.value = null;
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  contextMenuShow.value = true;
}

function handleComposerContextMenuSelect(key: string | number) {
  closeComposerContextMenu();
  if (key === 'emoji') {
    openExpressionPicker('emoji', contextMenuX.value, contextMenuY.value, 'composer');
    return;
  }
  if (key === 'sticker') {
    openExpressionPicker('sticker', contextMenuX.value, contextMenuY.value, 'composer');
  }
}

function handleBubbleContextMenu(event: MouseEvent, msg: Api.Comm.ChatMessage) {
  if (!ensureConversation()) return;
  event.preventDefault();
  event.stopPropagation();
  reactionTargetMessageId.value = msg.id;
  bubbleContextMenuX.value = event.clientX;
  bubbleContextMenuY.value = event.clientY;
  bubbleContextMenuShow.value = true;
}

function handleBubbleContextMenuSelect(key: string | number) {
  closeBubbleContextMenu();
  const messageId = reactionTargetMessageId.value;
  if (!messageId) return;

  const keyStr = String(key);
  if (keyStr.startsWith('quick:')) {
    addMessageReaction(messageId, keyStr.replace('quick:', ''));
    return;
  }
  if (keyStr === 'emoji') {
    openExpressionPicker('emoji', bubbleContextMenuX.value, bubbleContextMenuY.value, 'bubble');
  }
}

function addMessageReaction(messageId: string, emoji: string) {
  const msg = messages.value.find(item => item.id === messageId);
  if (!msg) return;
  if (!msg.reactions) msg.reactions = [];
  msg.reactions.push(emoji);
  expressionPickerVisible.value = false;
}

function handleEmojiSelect(emoji: string) {
  if (expressionPickerTarget.value === 'bubble' && reactionTargetMessageId.value) {
    addMessageReaction(reactionTargetMessageId.value, emoji);
    return;
  }
  draft.value = `${draft.value}${emoji}`;
}

function getMessageReactions(msg: Api.Comm.ChatMessage) {
  return summarizeMessageReactions(msg.reactions);
}

function sendAnimatedSticker(sticker: ChatStickerItem) {
  if (!props.conversationId) return;
  appendMessage({
    id: `local-sticker-${Date.now()}`,
    conversationId: props.conversationId,
    senderName: '我',
    isSelf: true,
    type: 'image',
    content: `[动态图] ${sticker.label}`,
    time: nowTime(),
    read: false,
    cardPayload: {
      类型: '动态图',
      名称: sticker.label,
      emoji: sticker.emoji,
      animation: sticker.animation,
      animated: 'true'
    }
  });
  window.$message?.success(`已发送动态图：${sticker.label}`);
}

function getAnimatedSticker(msg: Api.Comm.ChatMessage) {
  return parseAnimatedImageMessage(msg);
}
</script>

<template>
  <div class="chat-root">
    <div class="chat-header">
      <span class="chat-title">{{ title }}</span>
      <NSpace size="small" class="chat-header-actions">
        <NButton size="small" :disabled="!conversationId" @click="emit('open-business-panel')">业务面板</NButton>
        <NButton size="small" @click="proto('语音通话')">语音</NButton>
        <NButton size="small" @click="proto('视频通话')">视频</NButton>
        <NButton size="small" @click="proto('发起会议')">会议</NButton>
      </NSpace>
    </div>

    <div v-if="!conversationId" class="chat-empty">请从左侧选择会话</div>
    <div v-else-if="loading" class="chat-empty">加载消息…</div>
    <div v-else ref="messagesRef" class="chat-messages">
      <div v-for="msg in messages" :key="msg.id" class="msg-row" :class="{ 'msg-row--self': msg.isSelf }">
        <div class="msg-wrap" :class="{ 'msg-wrap--self': msg.isSelf }">
          <div
            class="msg-bubble"
            :class="{ 'msg-bubble--self': msg.isSelf, 'msg-bubble--card': msg.type.startsWith('card_') }"
            title="右键添加表情"
            @contextmenu.prevent="handleBubbleContextMenu($event, msg)"
          >
          <div v-if="!msg.isSelf && msg.senderName" class="msg-sender">{{ msg.senderName }}</div>
          <template v-if="msg.type.startsWith('card_') && msg.cardPayload">
            <div class="msg-card-title">{{ cardTitle(msg.type) }}</div>
            <div v-for="(val, key) in msg.cardPayload" :key="key" class="msg-card-line">
              <span class="msg-card-key">{{ cardFieldLabel(String(key)) }}：</span>{{ val }}
            </div>
            <NSpace size="small" class="mt-8px">
              <NButton size="tiny" type="primary" @click="handleCardDetail(msg)">查看详情</NButton>
            </NSpace>
          </template>
          <template v-else-if="msg.type === 'image'">
            <div v-if="isAnimatedImageMessage(msg)" class="msg-sticker">
              <span
                class="msg-sticker-emoji"
                :class="`msg-sticker-emoji--${getAnimatedSticker(msg)?.animation || 'bounce'}`"
              >
                {{ getAnimatedSticker(msg)?.emoji || '🎬' }}
              </span>
              <div class="msg-sticker-label">{{ getAnimatedSticker(msg)?.label || '动态图' }}</div>
            </div>
            <div v-else class="msg-image">{{ msg.content }}</div>
          </template>
          <template v-else-if="msg.type === 'file'">
            <div
              class="msg-file msg-file--interactive"
              title="单击下载，双击预览"
              @click="handleFileClick(msg)"
              @dblclick="handleFileDblClick(msg)"
            >
              <div class="msg-file-icon">📎</div>
              <div class="msg-file-body">
                <div class="msg-file-name">{{ fileDisplayName(msg) }}</div>
                <div v-if="fileDisplayMeta(msg)" class="msg-file-meta">{{ fileDisplayMeta(msg) }}</div>
                <div class="msg-file-action">单击下载 · 双击预览</div>
              </div>
            </div>
          </template>
          <template v-else-if="msg.type === 'voice'">
            <div class="msg-voice">
              <span class="msg-voice-icon">▶</span>
              <span>{{ voiceLabel(msg.content) }}</span>
            </div>
          </template>
          <template v-else>{{ msg.content }}</template>
          <div class="msg-time">{{ msg.time }}</div>
          </div>
          <div v-if="getMessageReactions(msg).length" class="msg-reactions" :class="{ 'msg-reactions--self': msg.isSelf }">
            <button
              v-for="item in getMessageReactions(msg)"
              :key="`${msg.id}-${item.emoji}`"
              type="button"
              class="msg-reaction-chip"
              :title="`再次添加 ${item.emoji}`"
              @click="addMessageReaction(msg.id, item.emoji)"
            >
              <span>{{ item.emoji }}</span>
              <span v-if="item.count > 1" class="msg-reaction-count">{{ item.count }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="conversationId" class="chat-footer" @contextmenu.prevent="handleComposerContextMenu">
      <div class="ai-bar">
        <NTag size="small" type="info">AI 建议回复</NTag>
        <span class="ai-text">{{ aiSuggestion }}</span>
        <NButton size="tiny" type="primary" ghost @click="draft = aiSuggestion">采用</NButton>
      </div>
      <div class="toolbar">
        <NButton size="tiny" quaternary @click="openImageModal">图片</NButton>
        <NButton size="tiny" quaternary @click="openFileModal">文件</NButton>
        <NButton size="tiny" quaternary @click="openVoiceModal">语音</NButton>
        <NButton size="tiny" quaternary @click="openEmojiPickerFromToolbar">😀 表情</NButton>
        <NButton size="tiny" quaternary @click="openStickerPickerFromToolbar">🎬 动态图</NButton>
        <NButton size="tiny" quaternary @click="openCardModal">卡片</NButton>
        <NButton size="tiny" quaternary @click="emit('open-business-panel')">业务</NButton>
        <NButton size="tiny" quaternary @click="openScreenshotModal">截图</NButton>
        <NButton size="tiny" quaternary @click="openMentionModal">@</NButton>
      </div>
      <div class="composer">
        <NInput
          v-model:value="draft"
          type="textarea"
          placeholder="输入消息，Enter 发送；工具栏或右键可插入表情/动态图"
          :autosize="{ minRows: 2, maxRows: 4 }"
          @keydown.enter.exact.prevent="sendText"
          @contextmenu.prevent="handleComposerContextMenu"
        />
        <NButton type="primary" class="send-btn" @click="sendText">发送</NButton>
      </div>
    </div>

    <NDropdown
      trigger="manual"
      placement="bottom-start"
      :show="bubbleContextMenuShow"
      :x="bubbleContextMenuX"
      :y="bubbleContextMenuY"
      :options="bubbleContextMenuOptions"
      @select="handleBubbleContextMenuSelect"
      @clickoutside="closeBubbleContextMenu"
    />

    <NDropdown
      trigger="manual"
      placement="bottom-start"
      :show="contextMenuShow"
      :x="contextMenuX"
      :y="contextMenuY"
      :options="composerContextMenuOptions"
      @select="handleComposerContextMenuSelect"
      @clickoutside="closeComposerContextMenu"
    />

    <ChatExpressionPicker
      v-model:visible="expressionPickerVisible"
      :x="expressionPickerX"
      :y="expressionPickerY"
      :initial-tab="expressionPickerTab"
      :emoji-only="expressionPickerEmojiOnly"
      @select-emoji="handleEmojiSelect"
      @select-sticker="sendAnimatedSticker"
    />

    <ChatSendCardModal v-model:visible="cardModalVisible" @confirm="handleCardConfirm" />
    <ChatAttachModal v-model:visible="imageModalVisible" mode="image" @confirm="handleAttachConfirm" />
    <ChatAttachModal v-model:visible="fileModalVisible" mode="file" @confirm="handleAttachConfirm" />
    <ChatVoiceModal v-model:visible="voiceModalVisible" @confirm="handleVoiceConfirm" />
    <ChatMentionModal v-model:visible="mentionModalVisible" @select="handleMentionSelect" />
    <ChatScreenshotModal v-model:visible="screenshotModalVisible" @confirm="handleScreenshotConfirm" />
    <ChatFilePreviewModal v-model:visible="filePreviewVisible" :file="previewFile" />
  </div>
</template>

<style scoped>
.chat-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #ededed;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f7f7f7;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.chat-title {
  font-size: 15px;
  font-weight: 600;
}

.chat-header-actions :deep(.n-button) {
  font-size: 14px;
  border: 1px solid #22c55e;
  color: #15803d;
  background: #fff;
}

.chat-header-actions :deep(.n-button:hover:not(.n-button--disabled)) {
  border-color: #16a34a;
  color: #166534;
  background: #f0fdf4;
}

.chat-header-actions :deep(.n-button--disabled) {
  border-color: #bbf7d0;
  color: #86efac;
}

.chat-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  min-height: 0;
}

.msg-row {
  display: flex;
  margin-bottom: 12px;
}

.msg-row--self {
  justify-content: flex-end;
}

.msg-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 72%;
}

.msg-wrap--self {
  align-items: flex-end;
}

.msg-bubble {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  line-height: 1.5;
  box-shadow: 0 1px 2px rgb(0 0 0 / 6%);
}

.msg-bubble--self {
  background: #95ec69;
}

.msg-bubble--card {
  background: #fff;
  border: 1px solid #e5e7eb;
  min-width: 240px;
}

.msg-sender {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.msg-time {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
  text-align: right;
}

.msg-reactions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.msg-reactions--self {
  justify-content: flex-end;
}

.msg-reaction-chip {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 14px;
  line-height: 1.4;
  cursor: pointer;
}

.msg-reaction-chip:hover {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.msg-reaction-count {
  font-size: 11px;
  color: #6b7280;
}

.msg-card-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.msg-card-line {
  font-size: 13px;
  margin-bottom: 2px;
}

.msg-card-key {
  color: #6b7280;
}

.msg-image {
  padding: 20px;
  background: #f3f4f6;
  border-radius: 6px;
  text-align: center;
  color: #374151;
  min-width: 160px;
}

.msg-sticker {
  min-width: 96px;
  padding: 8px 12px 10px;
  text-align: center;
}

.msg-sticker-emoji {
  font-size: 48px;
  line-height: 1;
  display: inline-block;
}

.msg-sticker-label {
  margin-top: 6px;
  font-size: 12px;
  color: #4b5563;
}

.msg-sticker-emoji--bounce {
  animation: sticker-bounce 1s ease-in-out infinite;
}

.msg-sticker-emoji--pulse {
  animation: sticker-pulse 1.2s ease-in-out infinite;
}

.msg-sticker-emoji--shake {
  animation: sticker-shake 0.8s ease-in-out infinite;
}

.msg-sticker-emoji--spin {
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

.msg-file {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.msg-file--interactive {
  cursor: pointer;
  user-select: none;
  border-radius: 6px;
  padding: 4px;
  margin: -4px;
  transition: background 0.15s ease;
}

.msg-file--interactive:hover {
  background: rgb(255 255 255 / 35%);
}

.msg-file-body {
  min-width: 0;
}

.msg-file-name {
  font-weight: 600;
  word-break: break-all;
}

.msg-file-meta {
  margin-top: 2px;
  font-size: 12px;
  color: #4b5563;
}

.msg-file-action {
  margin-top: 4px;
  font-size: 11px;
  color: #6b7280;
}

.msg-file-icon {
  font-size: 18px;
}

.msg-voice {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
  padding: 4px 0;
}

.msg-voice-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgb(37 99 235 / 12%);
  color: #2563eb;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}

.chat-footer {
  flex-shrink: 0;
  background: #f7f7f7;
  border-top: 1px solid #e5e7eb;
  padding: 8px 12px 12px;
}

.ai-bar {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  margin-bottom: 8px;
  background: #eff6ff;
  border-radius: 8px;
  font-size: 12px;
}

.ai-text {
  flex: 1;
  color: #374151;
  line-height: 1.4;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.composer {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.composer :deep(.n-input) {
  flex: 1;
}

.send-btn {
  flex-shrink: 0;
}
</style>
