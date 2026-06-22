import { MOCK_WAREHOUSE } from './common';

function paginate<T>(rows: T[], params?: Record<string, any>) {
  const pageNum = Number(params?.pageNum || 1);
  const pageSize = Number(params?.pageSize || 20);
  const start = (pageNum - 1) * pageSize;
  return { rows: rows.slice(start, start + pageSize), total: rows.length, pageNum, pageSize };
}

export const MOCK_CONVERSATIONS: Api.Comm.Conversation[] = [
  {
    id: 'conv-001',
    type: 'customer',
    name: 'Forest Zhang',
    avatarText: '客',
    avatarColor: '#2563eb',
    lastMessage: 'FSHY2508058785 这个订单什么时候派送？',
    lastTime: '10:32',
    unreadCount: 3,
    pinned: true,
    hasBizLink: true,
    bizType: 'order',
    bizId: 'FSHY2508058785'
  },
  {
    id: 'conv-002',
    type: 'supplier',
    name: 'ABC Trucking',
    avatarText: '供',
    avatarColor: '#059669',
    lastMessage: 'TRIP250604001 司机已到仓',
    lastTime: '09:48',
    unreadCount: 0,
    hasBizLink: true,
    bizType: 'trip',
    bizId: 'TRIP250604001'
  },
  {
    id: 'conv-003',
    type: 'group',
    name: 'XLX7车次异常群',
    avatarText: '群',
    avatarColor: '#dc2626',
    lastMessage: '缺少2板，需要QC确认',
    lastTime: '09:15',
    unreadCount: 5,
    mentioned: true,
    hasBizLink: true,
    hasTodo: true,
    bizType: 'exception',
    bizId: 'EXC250601003',
    memberCount: 8
  },
  {
    id: 'conv-004',
    type: 'system',
    name: '账单审批提醒',
    avatarText: '系',
    avatarColor: '#6b7280',
    lastMessage: '拆柜费用发票待审核',
    lastTime: '昨天',
    unreadCount: 1,
    bizType: 'bill',
    bizId: 'INV250601008'
  },
  {
    id: 'conv-005',
    type: 'driver',
    name: 'John · 8ABC123',
    avatarText: '司',
    avatarColor: '#d97706',
    lastMessage: '已在 DOCK 05 等待装车',
    lastTime: '昨天',
    unreadCount: 0,
    overdueReply: true,
    bizType: 'trip',
    bizId: 'TRIP250604001'
  },
  {
    id: 'conv-006',
    type: 'internal',
    name: '入库组 · 早班',
    avatarText: '内',
    avatarColor: '#7c3aed',
    lastMessage: '今日拆柜目标 65 条海柜',
    lastTime: '08:00',
    unreadCount: 0,
    muted: true,
    memberCount: 12
  }
];

const MESSAGE_MAP: Record<string, Api.Comm.ChatMessage[]> = {
  'conv-001': [
    {
      id: 'm1',
      conversationId: 'conv-001',
      senderName: 'Forest Zhang',
      senderRole: '客户',
      isSelf: false,
      type: 'text',
      content: 'FSHY2508058785 这票货 ISA 有消息了吗？',
      time: '10:20'
    },
    {
      id: 'm2',
      conversationId: 'conv-001',
      senderName: '客服 Amy',
      isSelf: true,
      type: 'text',
      content: '您好，我们已在 06/04 10:30 提交 ISA 预约，等待平台确认。',
      time: '10:25',
      read: true
    },
    {
      id: 'm3',
      conversationId: 'conv-001',
      senderName: 'Forest Zhang',
      senderRole: '客户',
      isSelf: false,
      type: 'card_order',
      content: '',
      time: '10:28',
      cardPayload: {
        orderNo: 'FSHY2508058785',
        customer: 'Forest',
        destination: 'XLX7',
        status: '待预约',
        pallets: '18'
      }
    },
    {
      id: 'm4',
      conversationId: 'conv-001',
      senderName: 'Forest Zhang',
      senderRole: '客户',
      isSelf: false,
      type: 'text',
      content: 'FSHY2508058785 这个订单什么时候派送？',
      time: '10:32',
      reactions: ['👀']
    },
    {
      id: 'm4-file',
      conversationId: 'conv-001',
      senderName: '我',
      isSelf: true,
      type: 'file',
      content: '[文件] 拆柜费用审批单.pdf (420 KB) · 订单 FSHY2508058785 · 审批附件',
      time: '10:35',
      read: true,
      cardPayload: {
        订单号: 'FSHY2508058785',
        文件名: '拆柜费用审批单.pdf',
        大小: '420 KB',
        来源: '审批文件'
      }
    }
  ],
  'conv-002': [
    {
      id: 'm5',
      conversationId: 'conv-002',
      senderName: 'ABC调度',
      senderRole: '供应商',
      isSelf: false,
      type: 'card_trip',
      content: '',
      time: '09:40',
      cardPayload: {
        tripNo: 'TRIP250604001',
        destination: 'XLX7',
        appointmentTime: '2026-06-05 10:00',
        palletQty: '26',
        status: '待装车'
      }
    },
    {
      id: 'm6',
      conversationId: 'conv-002',
      senderName: '调度 Aaron',
      isSelf: true,
      type: 'text',
      content: '收到，请司机在 DOCK 05 等候，仓库已安排装车。',
      time: '09:45',
      read: true
    },
    {
      id: 'm7',
      conversationId: 'conv-002',
      senderName: 'ABC调度',
      isSelf: false,
      type: 'text',
      content: 'TRIP250604001 司机已到仓',
      time: '09:48'
    }
  ],
  'conv-003': [
    {
      id: 'm8',
      conversationId: 'conv-003',
      senderName: '入库组长',
      isSelf: false,
      type: 'text',
      content: '@QC @客服 XLX7 装车少 2 板，现场照片已传。',
      time: '09:10'
    },
    {
      id: 'm9',
      conversationId: 'conv-003',
      senderName: 'QC Lisa',
      isSelf: false,
      type: 'image',
      content: '[图片] 库位 A09-01 现场',
      time: '09:12'
    },
    {
      id: 'm10',
      conversationId: 'conv-003',
      senderName: '客服 Amy',
      isSelf: true,
      type: 'text',
      content: '已通知客户，正在核对库存明细。',
      time: '09:14',
      read: true
    },
    {
      id: 'm11',
      conversationId: 'conv-003',
      senderName: '入库组长',
      isSelf: false,
      type: 'text',
      content: '缺少2板，需要QC确认',
      time: '09:15'
    }
  ]
};

const BIZ_CONTEXT_MAP: Record<string, Api.Comm.BusinessContext> = {
  'conv-001': {
    conversationId: 'conv-001',
    bizType: 'order',
    title: '关联订单',
    fields: [
      { label: '订单号', value: 'FSHY2508058785', highlight: true },
      { label: '客户', value: 'Forest' },
      { label: '目的地', value: 'XLX7' },
      { label: '状态', value: '待预约' },
      { label: '板数', value: '18' },
      { label: '库位', value: 'A09-01 / A09-02' },
      { label: 'ISA', value: '未确认' },
      { label: '异常', value: '无' },
      { label: '账单', value: '未生成' }
    ],
    actions: [
      { key: 'view_order', label: '查看订单', type: 'primary' },
      { key: 'send_card', label: '发送订单卡片' },
      { key: 'create_exception', label: '创建异常', type: 'warning' },
      { key: 'create_todo', label: '创建待办' },
      { key: 'notify_dispatch', label: '通知调度' },
      { key: 'print_label', label: '打印卡板贴' }
    ]
  },
  'conv-002': {
    conversationId: 'conv-002',
    bizType: 'trip',
    title: '关联车次订单',
    fields: [
      { label: '车次号', value: 'TRIP250604001', highlight: true },
      { label: '供应商', value: 'ABC Trucking' },
      { label: '司机', value: 'John' },
      { label: '车牌', value: '8ABC123' },
      { label: '目的地', value: 'XLX7' },
      { label: '预约时间', value: '2026-06-05 10:00' },
      { label: 'DOCK', value: '05' },
      { label: '状态', value: '待装车' }
    ],
    actions: [
      { key: 'notify_dock', label: '通知进 DOCK', type: 'primary' },
      { key: 'send_address', label: '发送仓库地址' },
      { key: 'view_loading', label: '查看装车清单' },
      { key: 'upload_bol', label: '上传 BOL' },
      { key: 'upload_pod', label: '上传 POD' },
      { key: 'confirm_depart', label: '确认发车' }
    ]
  },
  'conv-003': {
    conversationId: 'conv-003',
    bizType: 'exception',
    title: '关联异常',
    fields: [
      { label: '异常号', value: 'EXC250601003', highlight: true },
      { label: '类型', value: '少货' },
      { label: '责任部门', value: '入库组' },
      { label: '状态', value: '处理中' },
      { label: '关联订单', value: 'FSHY2508058785' },
      { label: '仓库', value: MOCK_WAREHOUSE.warehouseName }
    ],
    actions: [
      { key: 'view_exception', label: '查看异常', type: 'primary' },
      { key: 'upload_image', label: '上传图片' },
      { key: 'close_exception', label: '关闭异常', type: 'warning' }
    ]
  }
};

export const MOCK_CONTACT_TREE: Api.Comm.ContactNode[] = [
  {
    key: 'internal',
    label: '内部员工',
    type: 'dept',
    children: [
      {
        key: 'wh',
        label: '仓库部',
        type: 'dept',
        children: [
          { key: 'u1', label: '张三', type: 'person', title: '入库组长', phone: '138****1001', company: MOCK_WAREHOUSE.warehouseName }
        ]
      },
      {
        key: 'dispatch',
        label: '调度中心',
        type: 'dept',
        children: [{ key: 'u2', label: 'Aaron', type: 'person', title: '调度', phone: '138****1002' }]
      },
      {
        key: 'cs',
        label: '客服部',
        type: 'dept',
        children: [{ key: 'u3', label: 'Amy', type: 'person', title: '客服', phone: '138****1003' }]
      }
    ]
  },
  {
    key: 'customer',
    label: '客户联系人',
    type: 'dept',
    children: [{ key: 'c1', label: 'Forest Zhang', type: 'person', title: '客户', company: 'Forest', phone: '626****8888' }]
  },
  {
    key: 'supplier',
    label: '供应商联系人',
    type: 'dept',
    children: [{ key: 's1', label: 'ABC Trucking', type: 'person', title: '调度', company: 'ABC Trucking' }]
  },
  {
    key: 'driver',
    label: '司机联系人',
    type: 'dept',
    children: [{ key: 'd1', label: 'John', type: 'person', title: '司机', phone: '213****5566' }]
  }
];

export const MOCK_COMM_TODOS: Api.Comm.CommTodo[] = [
  {
    id: 880001,
    title: '确认订单是否可今日排车',
    source: '客户消息',
    assignee: 'Aaron',
    dueTime: '2026-06-05 16:00',
    status: 'pending',
    bizNo: 'FSHY2508058785',
    createTime: '2026-06-05 10:35:00',
    updateTime: '2026-06-05 10:35:00',
    createBy: 'system',
    updateBy: 'system'
  },
  {
    id: 880002,
    title: 'QC 确认 XLX7 少货 2 板',
    source: '异常群',
    assignee: 'Lisa',
    dueTime: '2026-06-05 12:00',
    status: 'pending',
    bizNo: 'EXC250601003',
    createTime: '2026-06-05 09:20:00',
    updateTime: '2026-06-05 09:20:00',
    createBy: 'system',
    updateBy: 'system'
  }
];

export const MOCK_COMM_FILES: Api.Comm.CommFile[] = [
  {
    id: 890001,
    fileName: 'BOL-PC250601001.pdf',
    fileType: 'PDF',
    sizeLabel: '1.2 MB',
    uploader: 'Aaron',
    bizNo: 'PC250601001',
    uploadTime: '2026-06-05 09:50:00',
    createTime: '2026-06-05 09:50:00',
    updateTime: '2026-06-05 09:50:00',
    createBy: 'Aaron',
    updateBy: 'Aaron'
  },
  {
    id: 890002,
    fileName: '异常现场-少货.jpg',
    fileType: '图片',
    sizeLabel: '860 KB',
    uploader: 'Lisa',
    bizNo: 'EXC250601003',
    uploadTime: '2026-06-05 09:12:00',
    createTime: '2026-06-05 09:12:00',
    updateTime: '2026-06-05 09:12:00',
    createBy: 'Lisa',
    updateBy: 'Lisa'
  }
];

export function getConversationList(params?: Record<string, any>) {
  let rows = [...MOCK_CONVERSATIONS];
  const tab = params?.tab as string | undefined;
  if (tab === 'unread') rows = rows.filter(r => r.unreadCount > 0);
  if (tab === 'mention') rows = rows.filter(r => r.mentioned);
  if (tab && !['all', 'unread', 'mention'].includes(tab)) {
    const typeMap: Record<string, Api.Comm.ConversationType[]> = {
      customer: ['customer'],
      supplier: ['supplier'],
      driver: ['driver'],
      internal: ['internal', 'group'],
      order: ['order'],
      exception: ['exception'],
      bill: ['bill', 'system']
    };
    const types = typeMap[tab];
    if (types) rows = rows.filter(r => types.includes(r.type));
  }
  const keyword = String(params?.keyword || '').trim().toLowerCase();
  if (keyword) {
    rows = rows.filter(
      r => r.name.toLowerCase().includes(keyword) || r.lastMessage.toLowerCase().includes(keyword)
    );
  }
  rows.sort((a, b) => Number(b.pinned) - Number(a.pinned));
  return paginate(rows, params);
}

export function getMessageList(conversationId: string) {
  return MESSAGE_MAP[conversationId] || [];
}

export function getBusinessContext(conversationId: string) {
  return BIZ_CONTEXT_MAP[conversationId] || null;
}

export function getContactTree() {
  return MOCK_CONTACT_TREE;
}

export function getCommTodoList(params?: Record<string, any>) {
  return paginate(MOCK_COMM_TODOS, params);
}

export function getCommFileList(params?: Record<string, any>) {
  return paginate(MOCK_COMM_FILES, params);
}

export const MOCK_COMM_ORDER_OPTIONS: Api.Comm.CommOrderOption[] = [
  { orderNo: 'FSHY2508058785', customerName: 'Forest Zhang', destination: 'XLX7', containerCs: '陈晓雯', status: '待预约' },
  { orderNo: 'CO-2026-0001', customerName: 'Anker Innovations', destination: 'ONT8', containerCs: '王海涛', status: '已入库' },
  { orderNo: 'CO-2026-0012', customerName: 'LuckyImport LLC', destination: 'LAX9', containerCs: '李思琪', status: '已入库' },
  { orderNo: 'CO-2026-0033', customerName: 'PopMart US', destination: 'LGB8', containerCs: '赵明远', status: '待出库' },
  { orderNo: 'TRIP250604001', customerName: 'ABC Trucking', destination: 'XLX7', containerCs: '陈晓雯', status: '待装车' },
  { orderNo: 'CTN-2026-0008', customerName: 'Robotime Corp', destination: 'SMF3', containerCs: '周雅琴', status: '拆柜中' }
];

export const MOCK_COMM_APPROVAL_FILES: Api.Comm.CommApprovalFile[] = [
  {
    id: 'appr-001',
    fileName: '拆柜费用审批单.pdf',
    fileType: '审批单',
    sizeLabel: '420 KB',
    orderNo: 'FSHY2508058785',
    status: '已通过',
    approver: '财务 Linda',
    updateTime: '2026-06-04 16:20:00'
  },
  {
    id: 'appr-002',
    fileName: '异常处理审批-少货.jpg',
    fileType: '审批附件',
    sizeLabel: '860 KB',
    orderNo: 'EXC250601003',
    status: '待审批',
    updateTime: '2026-06-05 09:10:00'
  },
  {
    id: 'appr-003',
    fileName: '出库费用确认单.pdf',
    fileType: '审批单',
    sizeLabel: '310 KB',
    orderNo: 'CO-2026-0033',
    status: '已通过',
    approver: '主管 Mike',
    updateTime: '2026-06-03 11:05:00'
  }
];

export function searchCommOrders(keyword?: string) {
  const q = String(keyword || '').trim().toLowerCase();
  let rows = [...MOCK_COMM_ORDER_OPTIONS];
  if (q) {
    rows = rows.filter(
      row =>
        row.orderNo.toLowerCase().includes(q) ||
        row.customerName.toLowerCase().includes(q) ||
        row.destination.toLowerCase().includes(q) ||
        row.containerCs.toLowerCase().includes(q)
    );
  }
  return rows.slice(0, 20);
}

export function getCommApprovalFiles(params?: Record<string, any>) {
  const q = String(params?.keyword || params?.orderNo || '').trim().toLowerCase();
  let rows = [...MOCK_COMM_APPROVAL_FILES];
  if (q) {
    rows = rows.filter(
      row =>
        row.orderNo.toLowerCase().includes(q) ||
        row.fileName.toLowerCase().includes(q)
    );
  }
  return rows;
}

const MOCK_COMM_ORDER_DETAIL_MAP: Record<string, Api.Comm.CommOrderDetail> = {
  FSHY2508058785: {
    orderNo: 'FSHY2508058785',
    customerName: 'Forest Zhang',
    destination: 'XLX7',
    containerCs: '陈晓雯',
    status: '待预约',
    palletQty: 18,
    cartonQty: 1260,
    weightKg: 8420,
    volumeCbm: 68.5,
    warehouse: MOCK_WAREHOUSE.warehouseName,
    locationCodes: 'A09-01 / A09-02',
    isaStatus: '已提交，待平台确认',
    appointmentTime: '2026-06-04 10:30',
    inboundTime: '2026-06-02 14:20',
    exceptionStatus: '无',
    billStatus: '未生成',
    remark: '客户关注 ISA 预约与派送时间，需优先跟进。',
    timeline: [
      { time: '2026-06-02 14:20', event: '订单入库完成', operator: '仓库张三' },
      { time: '2026-06-04 10:30', event: '提交 ISA 预约', operator: '客服 Amy' },
      { time: '2026-06-05 09:10', event: '客户询问派送时间', operator: 'Forest Zhang' }
    ]
  },
  'CO-2026-0001': {
    orderNo: 'CO-2026-0001',
    customerName: 'Anker Innovations',
    destination: 'ONT8',
    containerCs: '王海涛',
    status: '已入库',
    palletQty: 24,
    cartonQty: 1680,
    weightKg: 11200,
    volumeCbm: 82,
    warehouse: MOCK_WAREHOUSE.warehouseName,
    locationCodes: 'B03-05',
    isaStatus: '已确认',
    appointmentTime: '2026-06-03 08:00',
    inboundTime: '2026-06-01 11:00',
    exceptionStatus: '无',
    billStatus: '待确认',
    timeline: [
      { time: '2026-06-01 11:00', event: '订单入库完成', operator: '仓库李四' },
      { time: '2026-06-03 08:00', event: 'ISA 预约确认', operator: '客服 Amy' }
    ]
  }
};

export function getCommOrderDetail(orderNo?: string) {
  const no = String(orderNo || '').trim();
  if (!no) return null;
  if (MOCK_COMM_ORDER_DETAIL_MAP[no]) return MOCK_COMM_ORDER_DETAIL_MAP[no];

  const option = MOCK_COMM_ORDER_OPTIONS.find(row => row.orderNo === no);
  if (!option) return null;

  return {
    orderNo: option.orderNo,
    customerName: option.customerName,
    destination: option.destination,
    containerCs: option.containerCs,
    status: option.status || '处理中',
    palletQty: 0,
    warehouse: MOCK_WAREHOUSE.warehouseName,
    isaStatus: '未知',
    exceptionStatus: '无',
    billStatus: '未生成'
  } satisfies Api.Comm.CommOrderDetail;
}
