import { mockPage, nextId } from '../utils';
import { addPortalFilesFromTransfer } from './portal-files';

const OPERATION_LABEL: Record<string, string> = {  RELABEL_FBA: '换标-FBA标签',
  RELABEL_SKU: '换标-SKU标签',
  RELABEL_CARTON: '换标-箱唛',
  RELABEL_PALLET: '换标-板贴',
  PHOTO: '拍照',
  HOLD: '暂扣',
  RELEASE: '放行',
  CUSTOM: '客户特殊操作'
};

let instructions: Api.Portal.PortalTransferInstruction[] = [
  {
    id: 1,
    instructionNo: 'INS-20260616-001',
    orderNo: 'CO-2026-1045',
    customerOrderNo: 'FSHY2508061310',
    operationType: 'RELABEL_FBA',
    operationTypeLabel: '换标-FBA标签',
    status: 'PROCESSING',
    statusLabel: '处理中',
    submitTime: '2026-06-16 10:20:00',
    remark: '请更换为新版 FBA 标签，附件已上传',
    attachmentCount: 2,
    progressSteps: [
      { title: '已提交', time: '2026-06-16 10:20:00', status: 'done' },
      { title: '仓库接单', time: '2026-06-16 11:00:00', status: 'done' },
      { title: '作业中', time: '—', status: 'current' },
      { title: '完成', time: '—', status: 'pending' }
    ]
  },
  {
    id: 2,
    instructionNo: 'INS-20260615-008',
    orderNo: 'CO-2026-1021',
    customerOrderNo: 'FSHY2508058785',
    operationType: 'PHOTO',
    operationTypeLabel: '拍照',
    status: 'COMPLETED',
    statusLabel: '已完成',
    submitTime: '2026-06-15 14:30:00',
    remark: '出库前复核拍照',
    attachmentCount: 0,
    progressSteps: [
      { title: '已提交', time: '2026-06-15 14:30:00', status: 'done' },
      { title: '已完成', time: '2026-06-15 16:10:00', status: 'done' }
    ]
  }
];

const instructionAttachments = new Map<number, Api.Portal.PortalTransferAttachment[]>([
  [
    1,
    [
      { id: 1, fileName: 'FBA-Label-NEW-v2.pdf', fileSize: '56 KB', uploadTime: '2026-06-16 10:18:00' },
      { id: 2, fileName: 'carton-mark-template.png', fileSize: '128 KB', uploadTime: '2026-06-16 10:19:00' }
    ]
  ]
]);

const ELIGIBLE_ORDERS = [  { orderNo: 'CO-2026-1045', customerOrderNo: 'FSHY2508061310', locationSummary: 'HOLD-01(1/板)', palletQty: 1 },
  { orderNo: 'CO-2026-1021', customerOrderNo: 'FSHY2508058785', locationSummary: 'A10(2/板)', palletQty: 2 }
];

export function getPortalTransferInstructions(params?: Record<string, unknown>) {
  return mockPage(instructions, params);
}

export function getPortalTransferEligibleOrders() {
  return ELIGIBLE_ORDERS;
}

export function submitPortalTransferInstruction(
  payload: Api.Portal.SubmitTransferInstructionPayload
): Api.Portal.SubmitTransferInstructionResult {
  if (!payload.orderNo?.trim()) return { success: false, message: '请选择订单号' };
  if (!payload.operationType) return { success: false, message: '请选择操作类型' };

  const id = nextId();
  const instructionNo = `INS-20260617-${String(id).padStart(3, '0')}`;
  const row: Api.Portal.PortalTransferInstruction = {
    id,
    instructionNo,
    orderNo: payload.orderNo,
    customerOrderNo: ELIGIBLE_ORDERS.find(o => o.orderNo === payload.orderNo)?.customerOrderNo || '—',
    operationType: payload.operationType,
    operationTypeLabel: OPERATION_LABEL[payload.operationType] || payload.operationType,
    status: 'SUBMITTED',
    statusLabel: '已提交',
    submitTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    remark: payload.remark || null,
    attachmentCount: payload.attachmentNames?.length || 0,
    progressSteps: [{ title: '已提交', time: new Date().toISOString().slice(0, 19).replace('T', ' '), status: 'current' }]
  };
  instructions = [row, ...instructions];
  if (payload.attachmentNames?.length) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    instructionAttachments.set(
      id,
      payload.attachmentNames.map((name, idx) => ({
        id: idx + 1,
        fileName: name,
        fileSize: '—',
        uploadTime: now
      }))
    );
    addPortalFilesFromTransfer(payload.attachmentNames, payload.orderNo);
  }
  return { success: true, message: `指令 ${instructionNo} 已提交，仓库将尽快处理`, instructionNo };
}

export function getPortalTransferInstructionDetail(id: number): Api.Portal.PortalTransferInstructionDetail | null {
  const row = instructions.find(i => i.id === id);
  if (!row) return null;
  return {
    ...row,
    attachments: instructionAttachments.get(id) || []
  };
}
export const PORTAL_TRANSFER_OPERATION_OPTIONS = Object.entries(OPERATION_LABEL).map(([value, label]) => ({
  value,
  label
}));

export function getPortalAlertConfig(): Api.Portal.AlertConfig {
  return {
    emailEnabled: true,
    wechatEnabled: false,
    systemMessageEnabled: true,
    safetyStockEnabled: true,
    defaultCurrency: 'USD',
    displayCurrency: 'USD'
  };
}

export function savePortalAlertConfig(patch: Partial<Api.Portal.AlertConfig>): Api.Portal.AlertConfig {
  const current = getPortalAlertConfig();
  return { ...current, ...patch };
}
