import {
  mapCargoToPortalCustomerStatus,
  sanitizePortalCustomerStatus
} from '@/utils/portal/portal-order-status';
import { validatePortalOrderPushNo } from '@/utils/oms/shipping-mark';
import { buildLocationSummaryFromPallets } from '@/utils/portal/location-summary';
import type { PortalOrderChannel } from '@/utils/portal/portal-order-channel';
import { MOCK_CARGO_ORDERS } from './oms-list-seed';
import { mockPage } from '../utils';

const nowStr = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

/** 客户仅可联系的对接人 */
export const PORTAL_ASSIGNED_CONTACTS: Api.Portal.AssignedContact[] = [
  {
    id: 'portal-cs-amy',
    role: '客服',
    name: '客服 Amy',
    title: '专属对接客服',
    phone: '+1 626-555-1001',
    email: 'amy@wms.mock',
    online: true
  },
  {
    id: 'portal-dsp-tom',
    role: '调度',
    name: '调度 Tom',
    title: '专属对接调度',
    phone: '+1 626-555-1002',
    email: 'tom@wms.mock',
    online: true
  }
];

const ALLOWED_CONTACT_IDS = new Set(PORTAL_ASSIGNED_CONTACTS.map(c => c.id));

function findPortalCargo(orderNo: string) {
  return MOCK_CARGO_ORDERS.find(c => c.cargoOrderNo === orderNo) as Record<string, any> | undefined;
}

function resolvePortalOrderRow(order: Api.Portal.PortalOrderOption): Api.Portal.PortalOrderOption {
  const cargo = findPortalCargo(order.orderNo);
  const status = cargo ? mapCargoToPortalCustomerStatus(cargo) : sanitizePortalCustomerStatus(order.status);
  return {
    ...order,
    status,
    timelinessLevel: order.timelinessLevel ?? (cargo?.timelinessLevel ? String(cargo.timelinessLevel) : null),
    fbaSku: order.fbaSku ?? (cargo?.shipmentCodes ? String(cargo.shipmentCodes) : null),
    locationSummary:
      order.locationSummary ??
      (order.palletLines?.length ? buildLocationSummaryFromPallets(order.palletLines) : null)
  };
}

const PORTAL_TIMELINESS_LABEL: Record<string, string> = {
  T: 'T（第一等级）',
  K: 'K（第二等级）',
  NORMAL_SHIP: '普船（第三等级）'
};

const PORTAL_ORDERS: Api.Portal.PortalOrderOption[] = [
  {
    id: 1,
    orderNo: 'CO-2026-1021',
    customerOrderNo: 'FSHY2508058785',
    destination: 'ONT8',
    status: '已入库',
    orderChannel: 'AMAZON',
    containerNo: 'MSKU1234567',
    warehouseId: 101,
    warehouseCode: 'LAX',
    locationSummary: 'A10(2/板)',
    palletLines: [
      { palletNo: 'PLT-1021-01', locationCode: 'A10', palletQty: 1 },
      { palletNo: 'PLT-1021-02', locationCode: 'A10', palletQty: 1 }
    ],
    timelinessLevel: 'T',
    fbaSku: 'FBA181000001 / SKU-ANK-01, SKU-ANK-02; FBA181000002-B / SKU-ANK-01-B'
  },
  {
    id: 2,
    orderNo: 'CO-2026-1024',
    customerOrderNo: 'FSHY2508058790',
    destination: 'LGB8',
    status: '待派送',
    orderChannel: 'AMAZON',
    containerNo: 'TCLU9876543',
    warehouseId: 101,
    warehouseCode: 'LAX',
    locationSummary: 'A12(1/板)',
    palletLines: [{ palletNo: 'PLT-1024-01', locationCode: 'A12', palletQty: 1 }],
    timelinessLevel: 'K',
    fbaSku: 'FBA181000004 / SKU-POP-12, SKU-POP-18'
  },
  {
    id: 3,
    orderNo: 'CO-2026-1028',
    customerOrderNo: 'FSHY2508058801',
    destination: 'SMF3',
    status: '运输中',
    orderChannel: 'AMAZON',
    containerNo: null,
    warehouseId: 101,
    warehouseCode: 'LAX',
    locationSummary: 'B05(1/板)',
    timelinessLevel: 'NORMAL_SHIP',
    fbaSku: 'FBA181000008 / SKU-POP-SMF-01'
  },
  {
    id: 4,
    orderNo: 'CO-2026-1035',
    customerOrderNo: 'FSHY2508061201',
    destination: 'ORD2',
    status: '已出单',
    orderChannel: 'COMMERCIAL_PLATFORM',
    containerNo: 'MSKU1234567',
    warehouseId: 101,
    warehouseCode: 'LAX',
    locationSummary: 'A12(1/板)',
    timelinessLevel: 'T',
    fbaSku: 'FBA181000035 / SKU-WMT-A01, SKU-WMT-A02'
  },
  {
    id: 5,
    orderNo: 'CO-2026-1040',
    customerOrderNo: 'FSHY2508061208',
    destination: 'XLX7',
    status: '拆柜中',
    orderChannel: 'AMAZON',
    containerNo: 'MSKU1234567',
    warehouseId: 101,
    warehouseCode: 'LAX',
    locationSummary: '—',
    timelinessLevel: 'K',
    fbaSku: 'FBA181000040 / SKU-DEMO-XLX7'
  },
  {
    id: 6,
    orderNo: 'CO-2026-1042',
    customerOrderNo: 'FSHY2508061305',
    destination: 'Dallas, TX',
    status: '待派送',
    orderChannel: 'PRIVATE_ADDRESS',
    containerNo: 'MSKU1234567',
    warehouseId: 101,
    warehouseCode: 'LAX',
    locationSummary: 'B03(1/板)',
    timelinessLevel: 'K',
    fbaSku: null
  },
  {
    id: 7,
    orderNo: 'CO-2026-1044',
    customerOrderNo: 'DS-20260616-008',
    destination: 'Phoenix, AZ',
    status: '已出单',
    orderChannel: 'DROPSHIP',
    containerNo: null,
    warehouseId: 101,
    warehouseCode: 'LAX',
    locationSummary: 'A10(1/板)/A12(1/板)',
    palletLines: [
      { palletNo: 'PLT-1044-01', locationCode: 'A10', palletQty: 1 },
      { palletNo: 'PLT-1044-02', locationCode: 'A12', palletQty: 1 }
    ],
    timelinessLevel: 'T',
    fbaSku: 'SKU-DS-001 x 12'
  },
  {
    id: 8,
    orderNo: 'CO-2026-1045',
    customerOrderNo: 'FSHY2508061310',
    destination: '暂扣区',
    status: '已入库',
    orderChannel: 'TRANSFER',
    containerNo: 'MSKU1234567',
    warehouseId: 101,
    warehouseCode: 'LAX',
    locationSummary: 'HOLD-01(1/板)',
    palletLines: [{ palletNo: 'PLT-1045-01', locationCode: 'HOLD-01', palletQty: 1 }],
    timelinessLevel: 'NORMAL_SHIP',
    fbaSku: null
  }
];

let conversations: Api.Portal.PortalConversation[] = [
  {
    id: 'pconv-001',
    category: 'ORDER',
    title: '订单咨询 · ONT8',
    contactId: 'portal-cs-amy',
    contactName: '客服 Amy',
    contactRole: '客服',
    orderNo: 'CO-2026-1021',
    customerOrderNo: 'FSHY2508058785',
    lastMessage: '您好，ONT8 预约已提交，等待平台确认。',
    lastTime: '10:32',
    unreadCount: 1
  },
  {
    id: 'pconv-002',
    category: 'FEE',
    title: '费用沟通 · 拆柜费',
    contactId: 'portal-cs-amy',
    contactName: '客服 Amy',
    contactRole: '客服',
    orderNo: 'CO-2026-1021',
    customerOrderNo: 'FSHY2508058785',
    lastMessage: '拆柜费用明细已更新，请查看账单中心确认。',
    lastTime: '昨天',
    unreadCount: 0
  },
  {
    id: 'pconv-003',
    category: 'DELIVERY_TIME',
    title: '派送时间确认',
    contactId: 'portal-dsp-tom',
    contactName: '调度 Tom',
    contactRole: '调度',
    orderNo: 'CO-2026-1024',
    customerOrderNo: 'FSHY2508058790',
    lastMessage: '建议派送窗口 06/06 14:00-16:00，请确认。',
    lastTime: '昨天',
    unreadCount: 2
  },
  {
    id: 'pconv-004',
    category: 'EXCEPTION_REPLY',
    title: '异常回复 · 少板',
    contactId: 'portal-cs-amy',
    contactName: '客服 Amy',
    contactRole: '客服',
    orderNo: 'CO-2026-1028',
    customerOrderNo: 'FSHY2508058801',
    lastMessage: '异常 EXC-250516-003 已推送，请查看说明并回复。',
    lastTime: '09:15',
    unreadCount: 1
  },
  {
    id: 'pconv-005',
    category: 'SYSTEM',
    title: '系统通知',
    contactId: 'portal-cs-amy',
    contactName: '系统通知',
    contactRole: '客服',
    orderNo: null,
    customerOrderNo: null,
    lastMessage: '您有一笔费用待确认，请前往费用确认页面处理。',
    lastTime: '08:00',
    unreadCount: 0
  }
];

const messageMap: Record<string, Api.Portal.PortalMessage[]> = {
  'pconv-001': [
    {
      id: 'pm1',
      conversationId: 'pconv-001',
      senderName: '我',
      senderRole: '客户',
      isSelf: true,
      content: 'FSHY2508058785 这票 ONT8 ISA 有消息了吗？',
      time: '10:20',
      type: 'text'
    },
    {
      id: 'pm2',
      conversationId: 'pconv-001',
      senderName: '客服 Amy',
      senderRole: '客服',
      isSelf: false,
      content: '您好，我们已在 06/04 10:30 提交 ISA 预约，等待平台确认。确认后第一时间通知您。',
      time: '10:32',
      type: 'text'
    }
  ],
  'pconv-003': [
    {
      id: 'pm3',
      conversationId: 'pconv-003',
      senderName: '调度 Tom',
      senderRole: '调度',
      isSelf: false,
      content: 'LGB8 车次建议派送窗口 06/06 14:00-16:00，请确认是否可行。',
      time: '16:40',
      type: 'text'
    }
  ],
  'pconv-004': [
    {
      id: 'pm4',
      conversationId: 'pconv-004',
      senderName: '客服 Amy',
      senderRole: '客服',
      isSelf: false,
      content: '异常 EXC-250516-003（少板 2 板）已审核并推送给您，请在异常跟进页面查看详情。',
      time: '09:15',
      type: 'text'
    }
  ]
};

/** 仅客服/调度推送后客户可见的异常 */
let portalExceptions: Api.Portal.PortalException[] = [
  {
    id: 1,
    exceptionNo: 'EXC-250516-003',
    orderNo: 'CO-2026-1028',
    customerOrderNo: 'FSHY2508058801',
    exceptionType: '少板',
    customerStatus: 'PENDING_CONFIRM',
    pushedBy: '客服 Amy',
    pushedTime: '2026-05-16 09:10:00',
    needCustomerConfirm: true,
    replyDeadline: '2026-05-17 18:00:00',
    customerVisibleDesc: '出库清点发现少 2 板，已安排仓库复核。请确认是否接受补发方案或调整派送计划。',
    occurredTime: '2026-05-16 08:30:00',
    images: ['exception-photo-1.jpg', 'exception-photo-2.jpg']
  },
  {
    id: 2,
    exceptionNo: 'EXC-250515-008',
    orderNo: 'CO-2026-1021',
    customerOrderNo: 'FSHY2508058785',
    exceptionType: '破损',
    customerStatus: 'COMPLETED',
    pushedBy: '调度 Tom',
    pushedTime: '2026-05-15 14:20:00',
    needCustomerConfirm: false,
    replyDeadline: null,
    customerVisibleDesc: '外箱轻微破损 3 箱，内物完好。已拍照留档并完成加固处理。',
    occurredTime: '2026-05-15 11:00:00',
    images: ['damage-1.jpg']
  }
];

let convSeq = 100;
let msgSeq = 1000;
let feedbackSeq = 1;
let portalOrderSeq = 1100;

const CATEGORY_MAP: Record<Api.Portal.CommInitiateType, Api.Portal.CommCategory> = {
  ORDER_INQUIRY: 'ORDER',
  APPOINTMENT_INQUIRY: 'ORDER',
  FEE_INQUIRY: 'FEE',
  FILE_SUPPLEMENT: 'FILE',
  DELIVERY_TIME_CONFIRM: 'DELIVERY_TIME',
  OTHER: 'ORDER'
};

export function getPortalContacts() {
  return PORTAL_ASSIGNED_CONTACTS;
}

export function getPortalOrderOptions() {
  return PORTAL_ORDERS.map(resolvePortalOrderRow);
}

export function getPortalOrderList(params: Record<string, any> = {}) {
  const keyword = String(params.keyword ?? '').trim().toLowerCase();
  const orderChannel = params.orderChannel as Api.Portal.PortalOrderChannel | undefined;
  const status = params.status as string | undefined;
  const warehouseId = params.warehouseId != null && params.warehouseId !== '' ? Number(params.warehouseId) : null;
  let rows = PORTAL_ORDERS.map(resolvePortalOrderRow);
  if (warehouseId) {
    rows = rows.filter(o => o.warehouseId === warehouseId);
  }
  if (orderChannel) {
    rows = rows.filter(o => o.orderChannel === orderChannel);
  }
  if (status) {
    rows = rows.filter(o => sanitizePortalCustomerStatus(o.status) === status);
  }
  if (keyword) {
    rows = rows.filter(
      o =>
        o.orderNo.toLowerCase().includes(keyword) ||
        o.customerOrderNo.toLowerCase().includes(keyword) ||
        o.destination.toLowerCase().includes(keyword) ||
        (o.containerNo && o.containerNo.toLowerCase().includes(keyword)) ||
        (o.fbaSku && o.fbaSku.toLowerCase().includes(keyword))
    );
  }
  return mockPage(rows, params);
}

export function getPortalOrderDetail(id: number): Api.Portal.PortalOrderDetail | null {
  const row = PORTAL_ORDERS.map(resolvePortalOrderRow).find(o => o.id === id);
  if (!row) return null;
  const operationLogs: Api.Portal.PortalOrderOperationLog[] = [
    { time: '2026-06-10 08:00:00', operator: '系统', action: '订单推送', remark: '客户门户创建' },
    { time: '2026-06-11 14:30:00', operator: '仓库', action: '到仓登记', remark: row.containerNo ? `海柜 ${row.containerNo}` : null },
    { time: '2026-06-12 09:15:00', operator: '仓库', action: '上架完成', remark: row.locationSummary || null }
  ];
  if (row.status === '运输中' || row.status === '待派送') {
    operationLogs.push({ time: '2026-06-16 16:00:00', operator: '调度 Tom', action: '已排车次', remark: null });
  }
  return {
    ...row,
    contactName: row.orderChannel === 'PRIVATE_ADDRESS' ? 'John Smith' : null,
    contactPhone: row.orderChannel === 'PRIVATE_ADDRESS' ? '+1 214-555-0199' : null,
    remark: row.orderChannel === 'TRANSFER' ? '暂扣待换标后放行' : null,
    operationLogs
  };
}

export function getPortalConversations(params: Record<string, any> = {}) {
  const category = params.category as string | undefined;
  let rows = [...conversations];
  if (category && category !== 'all') rows = rows.filter(r => r.category === category);
  const keyword = String(params.keyword ?? '').trim().toLowerCase();
  if (keyword) {
    rows = rows.filter(
      r =>
        r.title.toLowerCase().includes(keyword) ||
        (r.orderNo && r.orderNo.toLowerCase().includes(keyword)) ||
        (r.customerOrderNo && r.customerOrderNo.toLowerCase().includes(keyword))
    );
  }
  return mockPage(rows, params);
}

export function getPortalMessages(conversationId: string) {
  return messageMap[conversationId] ?? [];
}

export function getPortalBizContext(conversationId: string): Api.Portal.PortalBizContext | null {
  const conv = conversations.find(c => c.id === conversationId);
  if (!conv) return null;
  const order = getPortalOrderOptions().find(o => o.orderNo === conv.orderNo);
  return {
    conversationId,
    orderNo: conv.orderNo,
    orderFields: order
      ? [
          { label: '系统订单号', value: order.orderNo },
          { label: '客户订单号', value: order.customerOrderNo },
          { label: 'FBA/SKU', value: order.fbaSku || '—' },
          { label: '目的地', value: order.destination },
          { label: '时效等级', value: PORTAL_TIMELINESS_LABEL[order.timelinessLevel || ''] || order.timelinessLevel || '—' },
          { label: '状态', value: order.status }
        ]
      : [],
    feeFields: conv.category === 'FEE' ? [{ label: '待确认费用', value: '$1,280.00' }, { label: '费用类型', value: '拆柜+仓储' }] : [],
    fileFields:
      conv.category === 'FILE'
        ? [{ label: '待补充', value: 'POD 签收单' }, { label: '已上传', value: '2 份' }]
        : [],
    exceptionFields:
      conv.category === 'EXCEPTION_REPLY'
        ? [{ label: '异常单号', value: 'EXC-250516-003' }, { label: '客户状态', value: '待确认' }]
        : []
  };
}

export function createPortalConversation(payload: Api.Portal.CreateConversationPayload) {
  if (!ALLOWED_CONTACT_IDS.has(payload.contactId)) {
    return { success: false, message: '仅可联系专属对接客服或对接调度' };
  }
  const order = getPortalOrderOptions().find(o => o.id === payload.orderId);
  if (!order) return { success: false, message: '请选择有效订单' };
  const contact = PORTAL_ASSIGNED_CONTACTS.find(c => c.id === payload.contactId)!;
  const category = CATEGORY_MAP[payload.commType];
  const id = `pconv-${++convSeq}`;
  const conv: Api.Portal.PortalConversation = {
    id,
    category,
    title: `${contact.role}沟通 · ${order.customerOrderNo}`,
    contactId: contact.id,
    contactName: contact.name,
    contactRole: contact.role,
    orderNo: order.orderNo,
    customerOrderNo: order.customerOrderNo,
    lastMessage: payload.initialMessage || '新会话已创建',
    lastTime: nowStr().slice(11, 16),
    unreadCount: 0
  };
  conversations.unshift(conv);
  messageMap[id] = [];
  if (payload.initialMessage?.trim()) {
    messageMap[id].push({
      id: `pm-${++msgSeq}`,
      conversationId: id,
      senderName: '我',
      senderRole: '客户',
      isSelf: true,
      content: payload.initialMessage.trim(),
      time: nowStr().slice(11, 16),
      type: 'text'
    });
  }
  return { success: true, message: '会话已创建', conversation: conv };
}

export function sendPortalMessage(conversationId: string, content: string) {
  const conv = conversations.find(c => c.id === conversationId);
  if (!conv) return { success: false, message: '会话不存在' };
  const msg: Api.Portal.PortalMessage = {
    id: `pm-${++msgSeq}`,
    conversationId,
    senderName: '我',
    senderRole: '客户',
    isSelf: true,
    content: content.trim(),
    time: nowStr().slice(11, 16),
    type: 'text'
  };
  if (!messageMap[conversationId]) messageMap[conversationId] = [];
  messageMap[conversationId].push(msg);
  conv.lastMessage = content.trim();
  conv.lastTime = msg.time;
  return { success: true, message: '已发送' };
}

export function getPortalExceptionList(params: Record<string, any> = {}) {
  return mockPage(portalExceptions, params);
}

export function getPortalExceptionDetail(id: number): Api.Portal.PortalExceptionDetail | null {
  const row = portalExceptions.find(e => e.id === id);
  if (!row) return null;
  return {
    ...row,
    progressSteps: [
      { title: '异常发生', time: row.occurredTime, status: 'done' },
      { title: '内部处理', time: '2026-05-16 08:45:00', status: 'done' },
      { title: '推送客户', time: row.pushedTime, status: 'done' },
      {
        title: '客户确认',
        time: row.needCustomerConfirm ? '待处理' : row.pushedTime,
        status: row.customerStatus === 'PENDING_CONFIRM' ? 'current' : 'done'
      },
      { title: '处理完成', time: row.customerStatus === 'COMPLETED' ? '2026-05-15 16:00:00' : '—', status: row.customerStatus === 'COMPLETED' ? 'done' : 'pending' }
    ],
    csReplies: [
      { time: '2026-05-16 09:10:00', operator: '客服 Amy', content: row.customerVisibleDesc },
      ...(row.customerStatus === 'COMPLETED'
        ? [{ time: '2026-05-15 15:30:00', operator: '调度 Tom', content: '破损箱已加固，可正常派送。' }]
        : [])
    ],
    customerReplies: [],
    confirmItems: row.needCustomerConfirm ? ['确认接受补发方案', '或选择调整派送时间'] : [],
    commRecords: [
      { time: row.pushedTime, content: '异常已推送给客户', from: row.pushedBy },
      { time: '2026-05-16 09:15:00', content: '已在沟通中心发送异常回复通知', from: '客服 Amy' }
    ]
  };
}

export function submitPortalProblemFeedback(payload: Api.Portal.SubmitFeedbackPayload) {
  feedbackSeq += 1;
  return {
    success: true,
    message: `问题反馈 FB-${String(feedbackSeq).padStart(4, '0')} 已提交，对接客服 Amy 将在审核后回复（不会直接创建异常单）`
  };
}

export function submitPortalOrder(payload: Api.Portal.SubmitPortalOrderPayload) {
  const pushError = validatePortalOrderPushNo(payload.customerOrderNo);
  if (pushError) return { success: false, message: pushError };

  const channel = payload.orderChannel;
  if (!channel) return { success: false, message: '请选择订单类型' };

  if (channel === 'AMAZON' || channel === 'COMMERCIAL_PLATFORM') {
    if (!payload.destination?.trim()) return { success: false, message: '请选择目的地' };
    if (!payload.timelinessLevel) return { success: false, message: '请选择时效等级' };
  }
  if (channel === 'PRIVATE_ADDRESS') {
    if (!payload.addressLine1?.trim() || !payload.city?.trim()) {
      return { success: false, message: '请填写完整收货地址' };
    }
  }
  if (channel === 'DROPSHIP') {
    if (!payload.skuCode?.trim()) return { success: false, message: '请填写 SKU' };
  }

  portalOrderSeq += 1;
  const cargoOrderNo = `CO-2026-${portalOrderSeq}`;
  const customerOrderNo = payload.customerOrderNo.trim();
  const destination =
    channel === 'PRIVATE_ADDRESS'
      ? `${payload.city}, ${payload.state || ''}`.trim()
      : channel === 'DROPSHIP'
        ? payload.city || '一件代发'
        : channel === 'TRANSFER'
          ? '暂扣区'
          : (payload.destination || '').trim();

  const palletLines =
    payload.palletQty && payload.palletQty > 0
      ? [{ palletNo: `PLT-${portalOrderSeq}-01`, locationCode: '—', palletQty: payload.palletQty }]
      : undefined;

  PORTAL_ORDERS.unshift({
    id: portalOrderSeq,
    orderNo: cargoOrderNo,
    customerOrderNo,
    destination,
    status: channel === 'DROPSHIP' ? '已出单' : '待入库',
    orderChannel: channel,
    containerNo: payload.containerNo?.trim() || null,
    warehouseId: 101,
    warehouseCode: 'LAX',
    locationSummary: palletLines ? buildLocationSummaryFromPallets(palletLines) : '—',
    palletLines,
    timelinessLevel: payload.timelinessLevel || 'NORMAL_SHIP',
    fbaSku: channel === 'DROPSHIP' ? `${payload.skuCode} x ${payload.shipQty || 1}` : null
  });

  const containerHint = payload.containerNo ? `，已关联海柜 ${payload.containerNo}` : '';
  return {
    success: true,
    message: `订单已推送，系统单号 ${cargoOrderNo}${containerHint}，唛头号与打印内容均为 ${cargoOrderNo}`,
    cargoOrderNo,
    shippingMark: cargoOrderNo
  };
}

export function portalExceptionAction(id: number, payload: Api.Portal.ExceptionActionPayload) {
  const row = portalExceptions.find(e => e.id === id);
  if (!row) return { success: false, message: '异常不存在' };
  if (payload.action === 'reply' && payload.content?.trim()) {
    const detail = getPortalExceptionDetail(id)!;
    detail.customerReplies.push({ time: nowStr(), content: payload.content.trim() });
    if (row.customerStatus === 'PENDING_VIEW') row.customerStatus = 'PROCESSING';
    return { success: true, message: '回复已提交' };
  }
  if (payload.action === 'confirm_plan') {
    row.customerStatus = 'COMPLETED';
    row.needCustomerConfirm = false;
    return { success: true, message: '已确认处理方案' };
  }
  if (payload.action === 'fee_question') {
    return { success: true, message: '费用疑问已转客服跟进，请同时在沟通中心查看回复' };
  }
  if (payload.action === 'close_confirm') {
    row.customerStatus = 'CLOSED';
    return { success: true, message: '已确认关闭' };
  }
  return { success: false, message: '无效操作' };
}
