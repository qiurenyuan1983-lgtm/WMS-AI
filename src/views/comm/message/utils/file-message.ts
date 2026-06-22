export type CommFilePreviewType = 'pdf' | 'image' | 'doc' | 'other';

export type ParsedFileMessage = {
  fileName: string;
  sizeLabel: string;
  orderNo?: string;
  source?: string;
  extension: string;
  previewType: CommFilePreviewType;
};

function getExtension(fileName: string) {
  const idx = fileName.lastIndexOf('.');
  return idx >= 0 ? fileName.slice(idx + 1).toLowerCase() : '';
}

export function resolveFilePreviewType(fileName: string): CommFilePreviewType {
  const ext = getExtension(fileName);
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'image';
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'doc';
  return 'other';
}

export function parseFileMessage(msg: Api.Comm.ChatMessage): ParsedFileMessage | null {
  if (msg.type !== 'file') return null;

  const payload = msg.cardPayload;
  if (payload?.文件名) {
    const fileName = payload.文件名;
    return {
      fileName,
      sizeLabel: payload.大小 || '',
      orderNo: payload.订单号,
      source: payload.来源,
      extension: getExtension(fileName),
      previewType: resolveFilePreviewType(fileName)
    };
  }

  const match = msg.content.match(/^\[文件\]\s+(.+?)\s+\(([^)]+)\)(?:\s+·\s+订单\s+(\S+))?(?:\s+·\s+(.+))?$/);
  if (!match) return null;

  const fileName = match[1].trim();
  return {
    fileName,
    sizeLabel: match[2].trim(),
    orderNo: match[3]?.trim(),
    source: match[4]?.trim(),
    extension: getExtension(fileName),
    previewType: resolveFilePreviewType(fileName)
  };
}

export function buildMockFileBlob(file: ParsedFileMessage) {
  const lines = [
    `文件名: ${file.fileName}`,
    `大小: ${file.sizeLabel || '未知'}`,
    file.orderNo ? `关联订单: ${file.orderNo}` : '',
    file.source ? `来源: ${file.source}` : '',
    '',
    '[原型] 沟通中心文件下载占位内容'
  ].filter(Boolean);

  return new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
}

export function downloadParsedFile(file: ParsedFileMessage) {
  const blob = buildMockFileBlob(file);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.fileName;
  link.click();
  URL.revokeObjectURL(url);
  window.$message?.success(`已开始下载 ${file.fileName}`);
}
