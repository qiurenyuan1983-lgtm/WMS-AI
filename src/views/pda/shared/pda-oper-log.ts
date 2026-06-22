import { appendOperLog } from '@/mock/data/monitor-oper-log';

export function appendPdaOperLog(params: {
  operType: string;
  operObject: string;
  operContent: string;
  bizNo?: string;
  operResult?: Api.Monitor.OperLogResult;
}) {
  appendOperLog({
    operModule: 'PDA作业',
    operPage: 'PDA',
    operCategory: 'INVENTORY',
    operType: params.operType,
    operObject: params.operObject,
    bizNo: params.bizNo,
    operContent: `[PDA] ${params.operContent}`,
    operResult: params.operResult ?? 'SUCCESS'
  });
}
