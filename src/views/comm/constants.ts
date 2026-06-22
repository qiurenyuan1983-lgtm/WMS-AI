/** 沟通中心 — 常量 */

export const CONVERSATION_TABS = [
  { key: 'all', label: '全部' },
  { key: 'unread', label: '未读' },
  { key: 'mention', label: '@我' },
  { key: 'customer', label: '客户' },
  { key: 'supplier', label: '供应商' },
  { key: 'driver', label: '司机' },
  { key: 'internal', label: '内部' },
  { key: 'order', label: '订单' },
  { key: 'exception', label: '异常' },
  { key: 'bill', label: '账单' }
] as const;

export const CONVERSATION_TYPE_LABEL: Record<Api.Comm.ConversationType, string> = {
  direct: '单聊',
  group: '群聊',
  customer: '客户',
  supplier: '供应商',
  driver: '司机',
  order: '订单',
  trip: '车次',
  exception: '异常',
  bill: '账单',
  system: '系统',
  internal: '内部'
};

export const COMM_MENU_ITEMS = [
  { key: 'message', route: 'comm_message', label: '消息', icon: 'mdi:message-text-outline' },
  { key: 'settings', route: 'comm_settings', label: '设置', icon: 'mdi:cog-outline' }
] as const;
