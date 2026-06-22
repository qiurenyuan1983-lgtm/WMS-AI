import { formatMoney } from '@/utils/portal/portal-money';
import { mockPage, nextId } from '../utils';

const FEE_STATUS_META: Record<string, string> = {
  PENDING: '待确认',
  CONFIRMED: '已确认',
  REJECTED: '已驳回'
};

let feeItems: Api.Portal.PortalFeeConfirmItem[] = [
  {
    id: 1,
    feeNo: 'FEE-202606-001',
    feeType: 'STORAGE',
    feeTypeLabel: '仓租费',
    orderNo: null,
    containerNo: 'MSKU1234567',
    warehouseCode: 'LAX',
    period: '2026-06',
    amount: formatMoney(2300, 'USD'),
    status: 'PENDING',
    statusLabel: '待确认',
    submitTime: '2026-06-16 09:00:00',
    remark: '6月 LA 仓月度仓租'
  },
  {
    id: 2,
    feeNo: 'FEE-202606-002',
    feeType: 'DEVANNING',
    feeTypeLabel: '拆柜费',
    orderNo: 'CO-2026-1021',
    containerNo: 'MSKU1234567',
    warehouseCode: 'LAX',
    period: '2026-06',
    amount: formatMoney(850, 'USD'),
    status: 'PENDING',
    statusLabel: '待确认',
    submitTime: '2026-06-16 14:20:00',
    remark: 'MSKU1234567 拆柜操作费'
  },
  {
    id: 3,
    feeNo: 'FEE-202606-003',
    feeType: 'LABELING',
    feeTypeLabel: '贴标费',
    orderNo: 'CO-2026-1045',
    containerNo: null,
    warehouseCode: 'LAX',
    period: '2026-06',
    amount: formatMoney(120, 'USD'),
    status: 'CONFIRMED',
    statusLabel: '已确认',
    submitTime: '2026-06-15 11:00:00',
    remark: 'FBA 换标 2 板'
  },
  {
    id: 4,
    feeNo: 'FEE-202606-004',
    feeType: 'TRANSPORT',
    feeTypeLabel: '运输费',
    orderNo: 'CO-2026-1028',
    containerNo: null,
    warehouseCode: 'LAX',
    period: '2026-06',
    amount: formatMoney(1680, 'USD'),
    status: 'PENDING',
    statusLabel: '待确认',
    submitTime: '2026-06-17 08:30:00',
    remark: 'SMF3 卡派运费'
  }
];

const bills: Api.Portal.PortalBill[] = [
  {
    id: 1,
    billNo: 'BILL-202606',
    billMonth: '2026-06',
    warehouseCode: 'ALL',
    status: 'PENDING_PAY',
    statusLabel: '待付款',
    totalAmount: formatMoney(13400, 'USD'),
    paidAmount: formatMoney(0, 'USD'),
    dueDate: '2026-07-10',
    issueDate: '2026-06-16'
  },
  {
    id: 2,
    billNo: 'BILL-202605',
    billMonth: '2026-05',
    warehouseCode: 'ALL',
    status: 'PAID',
    statusLabel: '已付款',
    totalAmount: formatMoney(11850, 'USD'),
    paidAmount: formatMoney(11850, 'USD'),
    dueDate: '2026-06-10',
    issueDate: '2026-05-16'
  },
  {
    id: 3,
    billNo: 'BILL-202604',
    billMonth: '2026-04',
    warehouseCode: 'ALL',
    status: 'OVERDUE',
    statusLabel: '逾期',
    totalAmount: formatMoney(9200, 'USD'),
    paidAmount: formatMoney(5000, 'USD'),
    dueDate: '2026-05-10',
    issueDate: '2026-04-16'
  }
];

export function getPortalFeeConfirmList(params: Record<string, unknown> = {}) {
  const status = params.status as string | undefined;
  let rows = [...feeItems];
  if (status) rows = rows.filter(r => r.status === status);
  return mockPage(rows, params);
}

export function getPortalFeeConfirmDetail(id: number): Api.Portal.PortalFeeConfirmDetail | null {
  const row = feeItems.find(f => f.id === id);
  if (!row) return null;
  return {
    ...row,
    lines: [
      { label: '计费项目', value: row.feeTypeLabel },
      { label: '计费周期', value: row.period },
      { label: '仓库', value: row.warehouseCode },
      { label: '关联订单', value: row.orderNo || '—' },
      { label: '关联海柜', value: row.containerNo || '—' },
      { label: '金额', value: row.amount.display },
      { label: '说明', value: row.remark || '—' }
    ],
    breakdown:
      row.feeType === 'STORAGE'
        ? [
            { item: '在库板数 × 单价', qty: '120 板', unitPrice: '$18/板', amount: formatMoney(2160, 'USD') },
            { item: '超期仓储附加', qty: '8 板', unitPrice: '$17.5/板', amount: formatMoney(140, 'USD') }
          ]
        : [{ item: row.feeTypeLabel, qty: '1', unitPrice: row.amount.display, amount: row.amount }]
  };
}

export function confirmPortalFee(id: number, payload: { action: 'confirm' | 'reject'; remark?: string }) {
  const row = feeItems.find(f => f.id === id);
  if (!row) return { success: false, message: '费用单不存在' };
  if (row.status !== 'PENDING') return { success: false, message: '当前状态不可操作' };
  if (payload.action === 'confirm') {
    row.status = 'CONFIRMED';
    row.statusLabel = FEE_STATUS_META.CONFIRMED;
    return { success: true, message: `费用 ${row.feeNo} 已确认` };
  }
  row.status = 'REJECTED';
  row.statusLabel = FEE_STATUS_META.REJECTED;
  return { success: true, message: `费用 ${row.feeNo} 已驳回，客服将跟进` };
}

export function getPortalBillList(params: Record<string, unknown> = {}) {
  const status = params.status as string | undefined;
  let rows = [...bills];
  if (status) rows = rows.filter(r => r.status === status);
  return mockPage(rows, params);
}

export function getPortalBillDetail(billNo: string): Api.Portal.PortalBillDetail | null {
  const row = bills.find(b => b.billNo === billNo);
  if (!row) return null;
  const currency = row.totalAmount.currency;
  return {
    ...row,
    feeBreakdown: [
      { label: '仓租费', amount: formatMoney(2300, currency) },
      { label: '入库/拆柜费', amount: formatMoney(1500, currency) },
      { label: '出库费', amount: formatMoney(3200, currency) },
      { label: '贴标费', amount: formatMoney(800, currency) },
      { label: '运输费', amount: formatMoney(5600, currency) }
    ],
    paymentHistory:
      row.status === 'PAID'
        ? [{ time: '2026-06-08 10:00:00', amount: row.paidAmount.display, method: '银行转账' }]
        : row.paidAmount.amount > 0
          ? [{ time: '2026-05-20 14:00:00', amount: row.paidAmount.display, method: '部分付款' }]
          : []
  };
}

export function addPortalFeeFromTransfer(instructionNo: string, amount: number) {
  const id = nextId();
  feeItems = [
    {
      id,
      feeNo: `FEE-202606-${String(id).padStart(3, '0')}`,
      feeType: 'LABELING',
      feeTypeLabel: '库内操作费',
      orderNo: null,
      containerNo: null,
      warehouseCode: 'LAX',
      period: '2026-06',
      amount: formatMoney(amount, 'USD'),
      status: 'PENDING',
      statusLabel: '待确认',
      submitTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      remark: `中转指令 ${instructionNo} 产生的操作费`
    },
    ...feeItems
  ];
}
