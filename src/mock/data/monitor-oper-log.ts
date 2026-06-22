import { mockPage } from '../utils';

type Seed = {
  operName: string;
  operNickName: string;
  deptName: string;
  warehouseName: string;
  operModule: string;
  operPage: string;
  operCategory: Api.Monitor.OperLogCategory;
  operType: string;
  operObject: string;
  bizNo: string;
  operContent: string;
  operResult: Api.Monitor.OperLogResult;
  riskLevel: Api.Monitor.LoginRiskLevel;
  highRiskFlag?: boolean;
  failReason?: Api.Monitor.OperLogFailReason;
  costTime: number;
  hour: number;
  minute: number;
  changeFields?: Api.Monitor.OperLogChangeField[];
  confirmRemark?: string;
  errorMsg?: string;
};

const SEEDS: Seed[] = [
  { operName: 'zhangsan', operNickName: '张三', deptName: '仓储运营部', warehouseName: 'LAX 一号仓', operModule: 'WMS', operPage: '指令中心', operCategory: 'DISPATCH', operType: '派单', operObject: '中转指令', bizNo: 'INS001', operContent: '派发换标指令给上架组', operResult: 'SUCCESS', riskLevel: 'NORMAL', costTime: 86, hour: 10, minute: 30 },
  { operName: 'lisi', operNickName: '李四', deptName: '仓储运营部', warehouseName: 'LAX 一号仓', operModule: 'WMS', operPage: '库存管理', operCategory: 'INVENTORY', operType: '暂扣', operObject: '托盘', bizNo: 'PALLET001', operContent: '客户要求暂扣托盘库存', operResult: 'SUCCESS', riskLevel: 'MEDIUM', costTime: 120, hour: 10, minute: 35, changeFields: [{ field: '库存状态', beforeValue: '可用', afterValue: '暂扣中' }, { field: '锁定标记', beforeValue: '否', afterValue: '是' }] },
  { operName: 'admin', operNickName: '系统管理员', deptName: '信息技术部', warehouseName: '总部虚拟仓', operModule: '系统管理', operPage: '权限变更', operCategory: 'PERMISSION', operType: '角色授权', operObject: '用户', bizNo: 'user01', operContent: '为用户分配 WMS 仓储经理角色', operResult: 'SUCCESS', riskLevel: 'HIGH', highRiskFlag: true, costTime: 210, hour: 10, minute: 40, confirmRemark: '客户项目上线需要临时授权', changeFields: [{ field: '角色', beforeValue: '普通用户', afterValue: 'WMS仓储经理' }, { field: '菜单权限数', beforeValue: '12', afterValue: '48' }] },
  { operName: 'oms01', operNickName: '王订单', deptName: '订单运营部', warehouseName: 'ONT 中转仓', operModule: 'OMS', operPage: '订单管理', operCategory: 'CREATE', operType: '新增', operObject: '海柜订单', bizNo: 'CO-2026-0088', operContent: '新建海柜订单', operResult: 'SUCCESS', riskLevel: 'LOW', costTime: 156, hour: 9, minute: 15 },
  { operName: 'oms01', operNickName: '王订单', deptName: '订单运营部', warehouseName: 'ONT 中转仓', operModule: 'OMS', operPage: '订单管理', operCategory: 'UPDATE', operType: '编辑', operObject: '海柜订单', bizNo: 'CO-2026-0088', operContent: '修改目的地仓库', operResult: 'SUCCESS', riskLevel: 'NORMAL', costTime: 98, hour: 9, minute: 42, changeFields: [{ field: '目的地', beforeValue: 'LAX9', afterValue: 'ONT8' }] },
  { operName: 'wms02', operNickName: '赵六', deptName: '仓储运营部', warehouseName: 'LAX 一号仓', operModule: 'WMS', operPage: '出库执行', operCategory: 'INVENTORY', operType: '库存扣减', operObject: '库存', bizNo: 'OUT20260606001', operContent: '出库确认扣减库存', operResult: 'SUCCESS', riskLevel: 'HIGH', highRiskFlag: true, costTime: 180, hour: 11, minute: 5, confirmRemark: '装车完成确认出库', changeFields: [{ field: '可用数量', beforeValue: '120', afterValue: '96' }] },
  { operName: 'finance01', operNickName: '财务专员', deptName: '财务部', warehouseName: '总部虚拟仓', operModule: 'OMS', operPage: '费用管理', operCategory: 'FEE', operType: '费用修改', operObject: '拆柜费用', bizNo: 'FEE-2026-120', operContent: '调整拆柜操作费', operResult: 'SUCCESS', riskLevel: 'HIGH', highRiskFlag: true, costTime: 240, hour: 11, minute: 20, changeFields: [{ field: '操作费', beforeValue: '280', afterValue: '320' }] },
  { operName: 'zhangsan', operNickName: '张三', deptName: '仓储运营部', warehouseName: 'LAX 一号仓', operModule: 'WMS', operPage: '库存管理', operCategory: 'INVENTORY', operType: '放行', operObject: '托盘', bizNo: 'PALLET001', operContent: '审核通过后放行暂扣库存', operResult: 'SUCCESS', riskLevel: 'MEDIUM', costTime: 95, hour: 11, minute: 35 },
  { operName: 'lisi', operNickName: '李四', deptName: '仓储运营部', warehouseName: 'LAX 一号仓', operModule: 'WMS', operPage: '库存管理', operCategory: 'DELETE', operType: '注销货物', operObject: '托盘', bizNo: 'PALLET009', operContent: '注销异常托盘', operResult: 'SUCCESS', riskLevel: 'HIGH', highRiskFlag: true, costTime: 320, hour: 12, minute: 10, confirmRemark: '客户确认货物报废' },
  { operName: 'oms02', operNickName: '运营小李', deptName: '订单运营部', warehouseName: 'ONT 中转仓', operModule: 'OMS', operPage: '审批中心', operCategory: 'APPROVE', operType: '审批', operObject: '出库审批', bizNo: 'APV-2026-55', operContent: '审批通过出库申请', operResult: 'SUCCESS', riskLevel: 'NORMAL', costTime: 75, hour: 12, minute: 30 },
  { operName: 'admin', operNickName: '系统管理员', deptName: '信息技术部', warehouseName: '总部虚拟仓', operModule: '系统管理', operPage: '系统配置', operCategory: 'UPDATE', operType: '修改系统配置', operObject: '系统参数', bizNo: 'SYS-CFG-01', operContent: '修改会话超时时间', operResult: 'SUCCESS', riskLevel: 'HIGH', highRiskFlag: true, costTime: 160, hour: 13, minute: 5, changeFields: [{ field: '会话超时(分钟)', beforeValue: '30', afterValue: '60' }] },
  { operName: 'wms01', operNickName: '仓库主管', deptName: '仓储运营部', warehouseName: 'LAX 一号仓', operModule: 'WMS', operPage: '导入中心', operCategory: 'IMPORT_EXPORT', operType: '批量导入', operObject: '库位', bizNo: 'IMP-LOC-06', operContent: '批量导入库位数据', operResult: 'SUCCESS', riskLevel: 'HIGH', highRiskFlag: true, costTime: 1850, hour: 13, minute: 40 },
  { operName: 'zhangsan', operNickName: '张三', deptName: '仓储运营部', warehouseName: 'LAX 一号仓', operModule: 'WMS', operPage: '打印中心', operCategory: 'PRINT', operType: '打印', operObject: '板贴', bizNo: 'PLT-PRINT-88', operContent: '打印托盘标签 20 张', operResult: 'SUCCESS', riskLevel: 'LOW', costTime: 420, hour: 14, minute: 0 },
  { operName: 'oms01', operNickName: '王订单', deptName: '订单运营部', warehouseName: 'ONT 中转仓', operModule: 'OMS', operPage: '订单管理', operCategory: 'DELETE', operType: '删除订单', operObject: '散板订单', bizNo: 'LOOSE-2026-03', operContent: '删除草稿散板订单', operResult: 'FAILED', riskLevel: 'HIGH', highRiskFlag: true, failReason: 'STATUS_NOT_ALLOWED', costTime: 65, hour: 14, minute: 18, errorMsg: '订单状态不允许删除' },
  { operName: 'tms01', operNickName: '调度员', deptName: '运输调度部', warehouseName: 'DFW 干线仓', operModule: 'TMS', operPage: '车次管理', operCategory: 'UPDATE', operType: '改派', operObject: '车次', bizNo: 'TRIP-2026-120', operContent: '改派车次目的地', operResult: 'SUCCESS', riskLevel: 'MEDIUM', costTime: 110, hour: 14, minute: 35, changeFields: [{ field: '目的地', beforeValue: 'DFW6', afterValue: 'ORD2' }] },
  { operName: 'admin', operNickName: '系统管理员', deptName: '信息技术部', warehouseName: '总部虚拟仓', operModule: '系统监控', operPage: '在线用户', operCategory: 'ABNORMAL', operType: '强制下线', operObject: '会话', bizNo: 'S002', operContent: '强制下线异常PDA会话', operResult: 'SUCCESS', riskLevel: 'HIGH', highRiskFlag: true, costTime: 88, hour: 15, minute: 0 },
  { operName: 'wms02', operNickName: '赵六', deptName: '仓储运营部', warehouseName: 'LAX 一号仓', operModule: 'WMS', operPage: '发运管理', operCategory: 'UPDATE', operType: '发运确认', operObject: '出库单', bizNo: 'OUT20260606001', operContent: '确认发运出库', operResult: 'SUCCESS', riskLevel: 'MEDIUM', costTime: 132, hour: 15, minute: 20 },
  { operName: 'finance01', operNickName: '财务专员', deptName: '财务部', warehouseName: '总部虚拟仓', operModule: 'OMS', operPage: '费用管理', operCategory: 'FEE', operType: '费用修改', operObject: '仓储费', bizNo: 'FEE-INV-09', operContent: '修改仓储计费规则', operResult: 'FAILED', riskLevel: 'HIGH', failReason: 'PERMISSION_DENIED', costTime: 45, hour: 15, minute: 45, errorMsg: '权限不足' },
  { operName: 'oms01', operNickName: '王订单', deptName: '订单运营部', warehouseName: 'ONT 中转仓', operModule: 'OMS', operPage: '导出中心', operCategory: 'IMPORT_EXPORT', operType: '导出', operObject: '订单列表', bizNo: 'EXP-ORD-06', operContent: '导出订单列表 Excel', operResult: 'SUCCESS', riskLevel: 'LOW', costTime: 680, hour: 16, minute: 10 },
  { operName: 'admin', operNickName: '系统管理员', deptName: '信息技术部', warehouseName: '总部虚拟仓', operModule: '系统管理', operPage: '缓存监控', operCategory: 'DELETE', operType: '清理缓存', operObject: 'Redis', bizNo: 'wms:cache:temp:*', operContent: '清理临时缓存前缀', operResult: 'SUCCESS', riskLevel: 'HIGH', highRiskFlag: true, costTime: 520, hour: 16, minute: 30 }
];

function todayTime(hour: number, minute: number) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function buildRisk(row: Api.Monitor.OperLog): Api.Monitor.OperLogRiskAnalysis {
  const factors: string[] = [];
  if (row.highRiskFlag) factors.push('高风险操作类型');
  if (row.operResult === 'FAILED') factors.push('操作失败');
  if (row.changeFields?.length) factors.push(`变更 ${row.changeFields.length} 个字段`);
  if (!factors.length) factors.push('常规业务操作');
  const scoreMap = { NORMAL: 8, LOW: 25, MEDIUM: 52, HIGH: 85 };
  return {
    level: (row.riskLevel || 'NORMAL') as Api.Monitor.LoginRiskLevel,
    score: scoreMap[(row.riskLevel || 'NORMAL') as keyof typeof scoreMap] || 10,
    factors,
    highRisk: row.highRiskFlag,
    suggestion: row.highRiskFlag ? '建议复核操作原因与审批记录' : '可正常归档'
  };
}

function enrich(row: Api.Monitor.OperLog, all: Api.Monitor.OperLog[]): Api.Monitor.OperLog {
  const related = all
    .filter(r => r.bizNo === row.bizNo && r.logNo !== row.logNo)
    .slice(0, 3)
    .map(r => ({
      logNo: r.logNo,
      operTime: r.operTime,
      operType: r.operType || '',
      summary: r.operContent || ''
    }));
  return { ...row, riskAnalysis: buildRisk(row), relatedLogs: related };
}

const BASE_OPER_LOGS: Api.Monitor.OperLog[] = SEEDS.map((seed, i) => {
  const row: Api.Monitor.OperLog = {
    operId: i + 1,
    logNo: `OP${String(i + 1).padStart(3, '0')}`,
    operTime: todayTime(seed.hour, seed.minute),
    operName: seed.operName,
    operNickName: seed.operNickName,
    deptName: seed.deptName,
    warehouseName: seed.warehouseName,
    title: seed.operModule,
    operModule: seed.operModule,
    operPage: seed.operPage,
    operCategory: seed.operCategory,
    operType: seed.operType,
    operObject: seed.operObject,
    bizNo: seed.bizNo,
    operContent: seed.operContent,
    operResult: seed.operResult,
    riskLevel: seed.riskLevel,
    highRiskFlag: seed.highRiskFlag || false,
    confirmRemark: seed.confirmRemark || null,
    businessType: '0',
    method: 'com.forest.mock.OperController.oper',
    requestMethod: 'post',
    operatorType: '1',
    operUrl: `/api/${seed.operModule.toLowerCase()}/operate`,
    operIp: i % 3 === 0 ? '192.168.1.10' : '10.20.30.18',
    operLocation: i % 3 === 0 ? '内网-上海' : '仓内网',
    deviceType: i % 4 === 0 ? 'pda' : 'pc',
    operParam: JSON.stringify({ bizNo: seed.bizNo, action: seed.operType }),
    jsonResult: JSON.stringify({ code: seed.operResult === 'SUCCESS' ? 200 : 500 }),
    status: seed.operResult === 'SUCCESS' ? '0' : '1',
    errorMsg: seed.errorMsg || (seed.operResult === 'FAILED' ? '操作失败' : ''),
    failReason: seed.failReason || null,
    costTime: seed.costTime,
    changeFields: seed.changeFields || [],
    userAgent: 'Mozilla/5.0'
  };
  return row;
});

export let MOCK_OPER_LOGS: Api.Monitor.OperLog[] = BASE_OPER_LOGS.map(row => enrich(row, BASE_OPER_LOGS));

function isToday(time: string) {
  return time.startsWith(new Date().toISOString().slice(0, 10));
}

function matchTab(row: Api.Monitor.OperLog, tab?: string | null) {
  if (!tab || tab === 'ALL') return true;
  if (tab === 'ABNORMAL') return row.operResult === 'FAILED' || row.highRiskFlag;
  return row.operCategory === tab;
}

function filterLogs(params?: Api.Monitor.OperLogSearchParams) {
  let list = [...MOCK_OPER_LOGS];
  const p = params || {};
  if (p.tabKey) list = list.filter(r => matchTab(r, p.tabKey));
  if (p.operName) {
    const kw = String(p.operName).toLowerCase();
    list = list.filter(r => r.operName.toLowerCase().includes(kw));
  }
  if (p.operNickName) {
    const kw = String(p.operNickName).toLowerCase();
    list = list.filter(r => (r.operNickName || '').toLowerCase().includes(kw));
  }
  if (p.deptName) {
    const kw = String(p.deptName).toLowerCase();
    list = list.filter(r => (r.deptName || '').toLowerCase().includes(kw));
  }
  if (p.warehouseName) {
    const kw = String(p.warehouseName).toLowerCase();
    list = list.filter(r => (r.warehouseName || '').toLowerCase().includes(kw));
  }
  if (p.title || p.operModule) {
    const kw = String(p.operModule || p.title).toLowerCase();
    list = list.filter(r => (r.operModule || '').toLowerCase().includes(kw) || (r.title || '').toLowerCase().includes(kw));
  }
  if (p.operPage) list = list.filter(r => (r.operPage || '').includes(String(p.operPage)));
  if (p.operCategory) list = list.filter(r => r.operCategory === p.operCategory);
  if (p.operType) list = list.filter(r => (r.operType || '').includes(String(p.operType)));
  if (p.operObject) list = list.filter(r => (r.operObject || '').includes(String(p.operObject)));
  if (p.bizNo) {
    const kw = String(p.bizNo).toLowerCase();
    list = list.filter(r => (r.bizNo || '').toLowerCase().includes(kw));
  }
  if (p.operResult) list = list.filter(r => r.operResult === p.operResult);
  if (p.riskLevel) list = list.filter(r => r.riskLevel === p.riskLevel);
  if (p.operIp) {
    const kw = String(p.operIp).toLowerCase();
    list = list.filter(r => (r.operIp || '').toLowerCase().includes(kw));
  }
  if (p.deviceType) {
    const kw = String(p.deviceType).toLowerCase();
    list = list.filter(r => String(r.deviceType || '').toLowerCase().includes(kw));
  }
  if (p.params?.beginTime) list = list.filter(r => r.operTime >= String(p.params!.beginTime));
  if (p.params?.endTime) list = list.filter(r => r.operTime <= String(p.params!.endTime));
  return list;
}

export function getOperLogStats(): Api.Monitor.OperLogStats {
  const todayRows = MOCK_OPER_LOGS.filter(r => isToday(r.operTime));
  const tabCounts = {
    ALL: MOCK_OPER_LOGS.length,
    CREATE: MOCK_OPER_LOGS.filter(r => r.operCategory === 'CREATE').length,
    UPDATE: MOCK_OPER_LOGS.filter(r => r.operCategory === 'UPDATE').length,
    DELETE: MOCK_OPER_LOGS.filter(r => r.operCategory === 'DELETE').length,
    APPROVE: MOCK_OPER_LOGS.filter(r => r.operCategory === 'APPROVE').length,
    IMPORT_EXPORT: MOCK_OPER_LOGS.filter(r => r.operCategory === 'IMPORT_EXPORT').length,
    PRINT: MOCK_OPER_LOGS.filter(r => r.operCategory === 'PRINT').length,
    DISPATCH: MOCK_OPER_LOGS.filter(r => r.operCategory === 'DISPATCH').length,
    INVENTORY: MOCK_OPER_LOGS.filter(r => r.operCategory === 'INVENTORY').length,
    PERMISSION: MOCK_OPER_LOGS.filter(r => r.operCategory === 'PERMISSION').length,
    FEE: MOCK_OPER_LOGS.filter(r => r.operCategory === 'FEE').length,
    ABNORMAL: MOCK_OPER_LOGS.filter(r => r.operResult === 'FAILED' || r.highRiskFlag).length
  };
  return {
    todayTotal: todayRows.length,
    successCount: todayRows.filter(r => r.operResult === 'SUCCESS').length,
    failedCount: todayRows.filter(r => r.operResult === 'FAILED').length,
    highRiskCount: todayRows.filter(r => r.highRiskFlag).length,
    dataChangeCount: todayRows.filter(r => (r.changeFields || []).length > 0).length,
    exportCount: todayRows.filter(r => r.operCategory === 'IMPORT_EXPORT').length,
    approveCount: todayRows.filter(r => r.operCategory === 'APPROVE').length,
    abnormalCount: todayRows.filter(r => r.operResult === 'FAILED' || r.highRiskFlag).length,
    tabCounts
  };
}

export function getOperLogList(params?: Api.Monitor.OperLogSearchParams) {
  return mockPage(filterLogs(params), params);
}

export function getOperLogDetail(id: CommonType.IdType) {
  const row = MOCK_OPER_LOGS.find(r => String(r.operId) === String(id));
  return row ? enrich(row, MOCK_OPER_LOGS) : null;
}

export function deleteOperLog(ids: CommonType.IdType[]) {
  const idSet = new Set(ids.map(String));
  MOCK_OPER_LOGS = MOCK_OPER_LOGS.filter(r => !idSet.has(String(r.operId)));
  return true;
}

export function cleanOperLog() {
  MOCK_OPER_LOGS = [];
  return true;
}

type AppendOperLogInput = {
  operModule: string;
  operPage: string;
  operCategory: Api.Monitor.OperLogCategory;
  operType: string;
  operObject: string;
  bizNo?: string;
  operContent: string;
  operResult?: Api.Monitor.OperLogResult;
  riskLevel?: Api.Monitor.LoginRiskLevel;
  highRiskFlag?: boolean;
  changeFields?: Api.Monitor.OperLogChangeField[];
  confirmRemark?: string;
};

/** 运行时追加操作日志（菜单管理等写操作） */
export function appendOperLog(input: AppendOperLogInput) {
  const now = new Date();
  const operId = MOCK_OPER_LOGS.length ? Math.max(...MOCK_OPER_LOGS.map(r => Number(r.operId))) + 1 : 1;
  const row: Api.Monitor.OperLog = {
    operId,
    logNo: `OP${String(operId).padStart(3, '0')}`,
    operTime: now.toISOString().slice(0, 19).replace('T', ' '),
    operName: 'admin',
    operNickName: '\u7cfb\u7edf\u7ba1\u7406\u5458',
    deptName: '\u4fe1\u606f\u6280\u672f\u90e8',
    warehouseName: '\u603b\u90e8\u865a\u62df\u4ed3',
    title: input.operModule,
    operModule: input.operModule,
    operPage: input.operPage,
    operCategory: input.operCategory,
    operType: input.operType,
    operObject: input.operObject,
    bizNo: input.bizNo || '',
    operContent: input.operContent,
    operResult: input.operResult || 'SUCCESS',
    riskLevel: input.riskLevel || 'NORMAL',
    highRiskFlag: input.highRiskFlag || false,
    businessType: '0',
    method: 'com.forest.mock.MenuController.oper',
    requestMethod: 'post',
    operatorType: '1',
    operUrl: '/api/system/menu/operate',
    operIp: '192.168.1.10',
    operLocation: '\u5185\u7f51',
    deviceType: 'pc',
    operParam: JSON.stringify({ bizNo: input.bizNo, action: input.operType }),
    jsonResult: JSON.stringify({ code: 200 }),
    status: '0',
    costTime: 32,
    changeFields: input.changeFields || [],
    userAgent: 'Mozilla/5.0'
  };
  MOCK_OPER_LOGS.unshift(enrich(row, MOCK_OPER_LOGS));
  return row;
}
