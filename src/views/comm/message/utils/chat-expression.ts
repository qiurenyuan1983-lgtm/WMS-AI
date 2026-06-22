export type ChatEmojiGroup = {
  key: string;
  label: string;
  emojis: string[];
};

export const CHAT_QUICK_REACTIONS = ['👍', '❤️', '😂', '👏', '🙏', '😊', '🎉', '👀'];

export const CHAT_EMOJI_GROUPS: ChatEmojiGroup[] = [
  {
    key: 'common',
    label: '常用',
    emojis: ['😀', '😁', '😂', '🤣', '😊', '😉', '😍', '🥰', '😘', '😎', '🤔', '😅', '😭', '😡', '👍', '👎', '🙏', '👏', '🎉', '❤️']
  },
  {
    key: 'work',
    label: '办公',
    emojis: ['📦', '🚚', '🏭', '📋', '✅', '❌', '⚠️', '💰', '📞', '📧', '🕒', '📍', '🔗', '📝', '🧾', '📊', '🗂️', '📎', '🔔', '💬']
  },
  {
    key: 'gesture',
    label: '手势',
    emojis: ['👋', '🤝', '✌️', '🤞', '👌', '🫡', '💪', '🙌', '🤷', '🤦', '👀', '💡', '🔥', '⭐', '✨', '🌈', '☀️', '🌙', '❄️', '☕']
  }
];

export type ChatStickerItem = {
  id: string;
  label: string;
  emoji: string;
  animation: 'bounce' | 'pulse' | 'shake' | 'spin';
};

export const CHAT_STICKERS: ChatStickerItem[] = [
  { id: 'ok', label: 'OK', emoji: '👌', animation: 'bounce' },
  { id: 'clap', label: '鼓掌', emoji: '👏', animation: 'pulse' },
  { id: 'rocket', label: '发货', emoji: '🚀', animation: 'shake' },
  { id: 'truck', label: '派送', emoji: '🚛', animation: 'shake' },
  { id: 'box', label: '入库', emoji: '📦', animation: 'bounce' },
  { id: 'check', label: '完成', emoji: '✅', animation: 'pulse' },
  { id: 'warn', label: '注意', emoji: '⚠️', animation: 'shake' },
  { id: 'party', label: '庆祝', emoji: '🎉', animation: 'spin' },
  { id: 'heart', label: '感谢', emoji: '💖', animation: 'pulse' },
  { id: 'hi', label: '你好', emoji: '👋', animation: 'bounce' },
  { id: 'think', label: '思考', emoji: '🤔', animation: 'pulse' },
  { id: 'cool', label: '赞', emoji: '😎', animation: 'bounce' }
];

export function summarizeMessageReactions(reactions?: string[]) {
  if (!reactions?.length) return [];
  const counter = new Map<string, number>();
  reactions.forEach(emoji => counter.set(emoji, (counter.get(emoji) || 0) + 1));
  return Array.from(counter.entries()).map(([emoji, count]) => ({ emoji, count }));
}

export function isAnimatedImageMessage(msg: Api.Comm.ChatMessage) {
  if (msg.type !== 'image') return false;
  if (msg.cardPayload?.类型 === '动态图' || msg.cardPayload?.animated === 'true') return true;
  return msg.content.startsWith('[动态图]');
}

export function parseAnimatedImageMessage(msg: Api.Comm.ChatMessage) {
  if (!isAnimatedImageMessage(msg)) return null;
  const label = msg.cardPayload?.名称 || msg.content.replace('[动态图]', '').trim() || '动态图';
  const animation = (msg.cardPayload?.animation as ChatStickerItem['animation']) || 'bounce';
  const emoji = msg.cardPayload?.emoji || '🎬';
  return { label, animation, emoji };
}
