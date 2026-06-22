import { mockPage, nextId } from '../utils';

let files: Api.Portal.PortalFile[] = [
  {
    id: 1,
    fileName: 'POD-CO-2026-1028.pdf',
    fileType: 'POD',
    fileTypeLabel: '签收凭证',
    orderNo: 'CO-2026-1028',
    containerNo: null,
    exceptionNo: null,
    uploadBy: '系统',
    uploadTime: '2026-06-17 09:35:00',
    fileSize: '245 KB',
    source: 'SYSTEM'
  },
  {
    id: 2,
    fileName: 'Invoice-BILL-202605.pdf',
    fileType: 'INVOICE',
    fileTypeLabel: '发票',
    orderNo: null,
    containerNo: null,
    exceptionNo: null,
    uploadBy: '财务',
    uploadTime: '2026-05-16 10:00:00',
    fileSize: '128 KB',
    source: 'SYSTEM'
  },
  {
    id: 3,
    fileName: 'FBA-Label-NEW-v2.pdf',
    fileType: 'LABEL',
    fileTypeLabel: '标签文件',
    orderNo: 'CO-2026-1045',
    containerNo: null,
    exceptionNo: null,
    uploadBy: '客户',
    uploadTime: '2026-06-16 10:15:00',
    fileSize: '56 KB',
    source: 'CUSTOMER'
  },
  {
    id: 4,
    fileName: 'Damage-Photo-001.jpg',
    fileType: 'EXCEPTION',
    fileTypeLabel: '异常附件',
    orderNo: 'CO-2026-1021',
    containerNo: null,
    exceptionNo: 'EXC-250516-003',
    uploadBy: '客服 Amy',
    uploadTime: '2026-05-16 09:10:00',
    fileSize: '1.2 MB',
    source: 'SYSTEM'
  },
  {
    id: 5,
    fileName: 'BOL-MSKU1234567.pdf',
    fileType: 'BOL',
    fileTypeLabel: '提单',
    orderNo: null,
    containerNo: 'MSKU1234567',
    exceptionNo: null,
    uploadBy: '系统',
    uploadTime: '2026-06-10 08:00:00',
    fileSize: '312 KB',
    source: 'SYSTEM'
  }
];

const FILE_TYPE_OPTIONS = [
  { value: 'POD', label: '签收凭证' },
  { value: 'INVOICE', label: '发票' },
  { value: 'LABEL', label: '标签文件' },
  { value: 'BOL', label: '提单' },
  { value: 'EXCEPTION', label: '异常附件' },
  { value: 'OTHER', label: '其他' }
];

export function getPortalFileList(params: Record<string, unknown> = {}) {
  const fileType = params.fileType as string | undefined;
  const keyword = String(params.keyword ?? '').trim().toLowerCase();
  let rows = [...files];
  if (fileType) rows = rows.filter(r => r.fileType === fileType);
  if (keyword) {
    rows = rows.filter(
      r =>
        r.fileName.toLowerCase().includes(keyword) ||
        (r.orderNo && r.orderNo.toLowerCase().includes(keyword)) ||
        (r.containerNo && r.containerNo.toLowerCase().includes(keyword))
    );
  }
  return mockPage(rows, params);
}

export function getPortalFileTypeOptions() {
  return FILE_TYPE_OPTIONS;
}

export function uploadPortalFile(payload: Api.Portal.UploadPortalFilePayload) {
  if (!payload.fileName?.trim()) return { success: false, message: '请填写文件名' };
  const id = nextId();
  const typeOpt = FILE_TYPE_OPTIONS.find(t => t.value === payload.fileType);
  const row: Api.Portal.PortalFile = {
    id,
    fileName: payload.fileName.trim(),
    fileType: payload.fileType || 'OTHER',
    fileTypeLabel: typeOpt?.label || '其他',
    orderNo: payload.orderNo || null,
    containerNo: payload.containerNo || null,
    exceptionNo: payload.exceptionNo || null,
    uploadBy: '客户',
    uploadTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    fileSize: payload.fileSize || '—',
    source: 'CUSTOMER'
  };
  files = [row, ...files];
  return { success: true, message: `文件 ${row.fileName} 已上传`, file: row };
}

export function addPortalFilesFromTransfer(names: string[], orderNo: string) {
  const added = names.map(name => {
    const id = nextId();
    const row: Api.Portal.PortalFile = {
      id,
      fileName: name,
      fileType: 'LABEL',
      fileTypeLabel: '标签文件',
      orderNo,
      containerNo: null,
      exceptionNo: null,
      uploadBy: '客户',
      uploadTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      fileSize: '—',
      source: 'CUSTOMER'
    };
    return row;
  });
  files = [...added, ...files];
  return added;
}
