import type { CustomAxiosRequestConfig } from '@sa/axios';

let idSeq = 10000;

export function nextId(): number {
  idSeq += 1;
  return idSeq;
}

export function normalizeUrl(url?: string): string {
  if (!url) return '';
  const path = url.split('?')[0];
  return path.startsWith('/') ? path : `/${path}`;
}

export function getParams(config: CustomAxiosRequestConfig): Record<string, any> {
  return (config.params || {}) as Record<string, any>;
}

export function getBody(config: CustomAxiosRequestConfig): Record<string, any> {
  const data = config.data;
  if (!data) return {};
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return data as Record<string, any>;
}

/** 分页列表数据 */
export function mockPage<T extends Record<string, any>>(
  rows: T[],
  params?: { pageNum?: number; pageSize?: number }
): { rows: T[]; total: number; pageNum: number; pageSize: number } {
  const pageNum = Number(params?.pageNum || 1);
  const pageSize = Number(params?.pageSize || 10);
  const start = (pageNum - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);
  return { rows: pageRows, total: rows.length, pageNum, pageSize };
}

/** 空分页 */
export function mockEmptyPage(params?: { pageNum?: number; pageSize?: number }) {
  return mockPage([], params);
}

/** 树形列表（部门/菜单等） */
export function mockTree<T>(rows: T[]): T[] {
  return rows;
}

/** 导出文件 Blob */
export function mockExportBlob(): Blob {
  return new Blob(['mock export data'], { type: 'application/vnd.ms-excel' });
}

/** 模拟网络延迟 */
export function mockDelay(ms = 30): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
