import { mockPage } from '../utils';

const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

let employees: Api.Iec.IntelligentEmployee[] = [
  {
    id: 1,
    employeeName: 'AI调度助理',
    roleType: 'DISPATCH',
    roleTypeLabel: '调度助理',
    status: 'WORKING',
    todayTaskCount: 42,
    successRate: 96,
    manualTakeoverCount: 2,
    avgDurationMinutes: 3.2,
    lastExecuteTime: now(),
    responsibleModules: ['TMS', 'WMS', 'YMS'],
    allowedActions: ['读取订单', '分配DOCK', '推送司机', '生成任务'],
    forbiddenActions: ['删除订单', '付款', '扣减库存'],
    needManualConfirm: true,
    workSchedule: '08:00-20:00',
    retryCount: 2,
    takeoverOwner: '调度主管',
    logLevel: 'INFO'
  },
  {
    id: 2,
    employeeName: 'AI客服文员',
    roleType: 'CS',
    roleTypeLabel: '客服文员',
    status: 'IDLE',
    todayTaskCount: 28,
    successRate: 98,
    manualTakeoverCount: 1,
    avgDurationMinutes: 2.1,
    lastExecuteTime: '2026-06-06 09:15:00',
    responsibleModules: ['OMS', '沟通中心'],
    allowedActions: ['发送邮件', '读取订单', '生成回复建议'],
    forbiddenActions: ['删除订单', '关闭严重异常'],
    needManualConfirm: false,
    workSchedule: '全天',
    retryCount: 1,
    takeoverOwner: '客服主管',
    logLevel: 'INFO'
  },
  {
    id: 3,
    employeeName: 'AI供应商下单员',
    roleType: 'SUPPLIER_ORDER',
    roleTypeLabel: '供应商下单员',
    status: 'WORKING',
    todayTaskCount: 15,
    successRate: 88,
    manualTakeoverCount: 5,
    avgDurationMinutes: 8.5,
    lastExecuteTime: now(),
    responsibleModules: ['OMS', '供应商门户'],
    allowedActions: ['打开网页', '填写表单', '获取报价'],
    forbiddenActions: ['付款', '删除订单'],
    needManualConfirm: true,
    workSchedule: '09:00-18:00',
    retryCount: 3,
    takeoverOwner: '采购主管',
    logLevel: 'DEBUG'
  },
  {
    id: 4,
    employeeName: 'AI异常跟进员',
    roleType: 'EXCEPTION',
    roleTypeLabel: '异常跟进员',
    status: 'ERROR',
    todayTaskCount: 19,
    successRate: 91,
    manualTakeoverCount: 4,
    avgDurationMinutes: 5.6,
    lastExecuteTime: '2026-06-06 10:02:00',
    responsibleModules: ['WMS', 'TMS', 'OMS'],
    allowedActions: ['读取异常', '生成跟进任务', '发送通知'],
    forbiddenActions: ['关闭严重异常', '扣减库存'],
    needManualConfirm: true,
    workSchedule: '全天',
    retryCount: 2,
    takeoverOwner: '运营主管',
    logLevel: 'WARN'
  },
  {
    id: 5,
    employeeName: 'AI库存巡检员',
    roleType: 'INVENTORY',
    roleTypeLabel: '库存巡检员',
    status: 'WORKING',
    todayTaskCount: 6,
    successRate: 99,
    manualTakeoverCount: 0,
    avgDurationMinutes: 12.3,
    lastExecuteTime: now(),
    responsibleModules: ['WMS'],
    allowedActions: ['查询库存', '库龄分析', '生成报告'],
    forbiddenActions: ['扣减库存', '删除订单'],
    needManualConfirm: false,
    workSchedule: '06:00 / 18:00',
    retryCount: 1,
    takeoverOwner: '仓储主管',
    logLevel: 'INFO'
  },
  {
    id: 6,
    employeeName: 'AI财务对账员',
    roleType: 'FINANCE',
    roleTypeLabel: '财务对账员',
    status: 'PAUSED',
    todayTaskCount: 8,
    successRate: 94,
    manualTakeoverCount: 3,
    avgDurationMinutes: 15.2,
    lastExecuteTime: '2026-06-05 17:30:00',
    responsibleModules: ['TMS', 'OMS'],
    allowedActions: ['读取账单', '比对费用', '生成差异报告'],
    forbiddenActions: ['付款', '删除订单'],
    needManualConfirm: true,
    workSchedule: '10:00-19:00',
    retryCount: 2,
    takeoverOwner: '财务主管',
    logLevel: 'INFO'
  },
  {
    id: 7,
    employeeName: 'AI报表员',
    roleType: 'REPORT',
    roleTypeLabel: '报表员',
    status: 'IDLE',
    todayTaskCount: 4,
    successRate: 100,
    manualTakeoverCount: 0,
    avgDurationMinutes: 6.8,
    lastExecuteTime: '2026-06-06 08:00:00',
    responsibleModules: ['OMS', 'WMS', 'TMS'],
    allowedActions: ['聚合数据', '生成日报', '发送邮件'],
    forbiddenActions: ['删除订单', '付款'],
    needManualConfirm: false,
    workSchedule: '07:30 / 19:30',
    retryCount: 1,
    takeoverOwner: '运营经理',
    logLevel: 'INFO'
  }
];

const autoFlows: Api.Iec.AutoFlow[] = [
  {
    id: 1,
    flowName: '客户确认邮件自动发送',
    triggerType: 'EVENT',
    triggerTypeLabel: '事件触发',
    employeeId: 2,
    employeeName: 'AI客服文员',
    stepSummary: '读取订单 → 生成邮件 → 发送 → 记录日志',
    status: 'ENABLED',
    successRate: 97,
    lastExecuteTime: now()
  },
  {
    id: 2,
    flowName: 'LTL供应商网页下单',
    triggerType: 'MANUAL',
    triggerTypeLabel: '人工触发',
    employeeId: 3,
    employeeName: 'AI供应商下单员',
    stepSummary: '打开网页 → 登录 → 填表 → 提交 → 获取PRO#',
    status: 'ENABLED',
    successRate: 86,
    lastExecuteTime: '2026-06-06 09:40:00'
  },
  {
    id: 3,
    flowName: 'POD催收流程',
    triggerType: 'SCHEDULE',
    triggerTypeLabel: '定时触发',
    employeeId: 4,
    employeeName: 'AI异常跟进员',
    stepSummary: '扫描未回传POD → 发送提醒 → 升级异常',
    status: 'ENABLED',
    successRate: 92,
    lastExecuteTime: '2026-06-06 08:30:00'
  },
  {
    id: 4,
    flowName: '每日运营日报',
    triggerType: 'SCHEDULE',
    triggerTypeLabel: '定时触发',
    employeeId: 7,
    employeeName: 'AI报表员',
    stepSummary: '汇总KPI → 生成报表 → 邮件推送',
    status: 'ENABLED',
    successRate: 100,
    lastExecuteTime: '2026-06-06 07:35:00'
  },
  {
    id: 5,
    flowName: '异常超时升级',
    triggerType: 'SCHEDULE',
    triggerTypeLabel: '定时触发',
    employeeId: 4,
    employeeName: 'AI异常跟进员',
    stepSummary: '扫描超时异常 → 判断等级 → 通知主管',
    status: 'ENABLED',
    successRate: 95,
    lastExecuteTime: now()
  },
  {
    id: 6,
    flowName: '库存库龄巡检',
    triggerType: 'SCHEDULE',
    triggerTypeLabel: '定时触发',
    employeeId: 5,
    employeeName: 'AI库存巡检员',
    stepSummary: '查询库龄 → 标记风险 → 生成建议',
    status: 'ENABLED',
    successRate: 99,
    lastExecuteTime: '2026-06-06 06:10:00'
  }
];

let rpaFlows: Api.Iec.RpaFlow[] = [
  {
    id: 1,
    flowName: 'LTL Estes 下单流程',
    employeeName: 'AI供应商下单员',
    nodeCount: 6,
    status: 'ENABLED',
    updatedTime: '2026-06-05 16:20:00',
    nodes: [
      {
        id: 'n1',
        type: 'READ_ORDER',
        label: '读取订单',
        x: 40,
        y: 80,
        config: {
          fieldMappings: [
            { source: 'omsOrderNo', target: 'orderNo' },
            { source: 'destination', target: 'dest' }
          ],
          conditionField: '',
          conditionOperator: 'eq',
          conditionValue: '',
          onFailure: 'RETRY',
          retryTimes: 2,
          takeoverOwner: '运营主管'
        }
      },
      {
        id: 'n2',
        type: 'OPEN_WEB',
        label: '打开网页',
        x: 200,
        y: 80,
        config: {
          fieldMappings: [{ source: 'portalUrl', target: 'url' }],
          conditionField: '',
          conditionOperator: 'eq',
          conditionValue: '',
          onFailure: 'RETRY',
          retryTimes: 2,
          takeoverOwner: 'IT运维'
        }
      },
      {
        id: 'n3',
        type: 'FILL_FORM',
        label: '填写表单',
        x: 360,
        y: 80,
        config: {
          fieldMappings: [
            { source: 'order.palletQty', target: 'palletQty' },
            { source: 'order.weight', target: 'weight' }
          ],
          conditionField: '',
          conditionOperator: 'eq',
          conditionValue: '',
          onFailure: 'RETRY',
          retryTimes: 2,
          takeoverOwner: '运营主管'
        }
      },
      {
        id: 'n4',
        type: 'MANUAL_CONFIRM',
        label: '人工确认',
        x: 520,
        y: 80,
        config: {
          fieldMappings: [{ source: 'confirmReason', target: 'reason' }],
          conditionField: '',
          conditionOperator: 'eq',
          conditionValue: '',
          onFailure: 'MANUAL_TAKEOVER',
          retryTimes: 0,
          takeoverOwner: '采购主管'
        }
      },
      {
        id: 'n5',
        type: 'CLICK_BUTTON',
        label: '点击提交',
        x: 680,
        y: 80,
        config: {
          fieldMappings: [{ source: 'submitSelector', target: 'selector' }],
          conditionField: '',
          conditionOperator: 'eq',
          conditionValue: '',
          onFailure: 'ABORT',
          retryTimes: 0,
          takeoverOwner: '运营主管'
        }
      },
      {
        id: 'n6',
        type: 'GET_RESULT',
        label: '获取PRO#',
        x: 840,
        y: 80,
        config: {
          fieldMappings: [{ source: 'proNo', target: 'result.proNo' }],
          conditionField: 'result.proNo',
          conditionOperator: 'empty',
          conditionValue: '',
          onFailure: 'MANUAL_TAKEOVER',
          retryTimes: 1,
          takeoverOwner: '采购主管'
        }
      }
    ]
  }
];

let executionTasks: Api.Iec.ExecutionTask[] = [
  {
    id: 1,
    taskNo: 'IEC-T20260606001',
    employeeName: 'AI调度助理',
    taskType: 'DOCK分配',
    relatedDocNo: 'TR2505160001',
    currentStep: '推送WMS',
    status: 'RUNNING',
    startTime: '2026-06-06 10:05:00',
    finishTime: null,
    failReason: null,
    flowName: '自动排车流程'
  },
  {
    id: 2,
    taskNo: 'IEC-T20260606002',
    employeeName: 'AI供应商下单员',
    taskType: '网页下单',
    relatedDocNo: 'SO2505160008',
    currentStep: '填写表单',
    status: 'WAITING_MANUAL',
    startTime: '2026-06-06 09:38:00',
    finishTime: null,
    failReason: '需要输入验证码',
    flowName: 'LTL Estes 下单流程'
  },
  {
    id: 3,
    taskNo: 'IEC-T20260606003',
    employeeName: 'AI客服文员',
    taskType: '邮件发送',
    relatedDocNo: 'LO2506040012',
    currentStep: '完成',
    status: 'SUCCESS',
    startTime: '2026-06-06 09:10:00',
    finishTime: '2026-06-06 09:12:00',
    failReason: null,
    flowName: '客户确认邮件自动发送'
  },
  {
    id: 4,
    taskNo: 'IEC-T20260606004',
    employeeName: 'AI异常跟进员',
    taskType: '异常升级',
    relatedDocNo: 'EX2506060003',
    currentStep: '通知主管',
    status: 'FAILED',
    startTime: '2026-06-06 08:55:00',
    finishTime: '2026-06-06 08:58:00',
    failReason: '联系人邮箱为空',
    flowName: '异常超时升级'
  }
];

let takeoverTasks: Api.Iec.TakeoverTask[] = [
  {
    id: 1,
    takeoverNo: 'TK-20260606001',
    employeeName: 'AI供应商下单员',
    reasonType: 'CAPTCHA',
    reasonLabel: '供应商网页验证码',
    relatedDocNo: 'SO2505160008',
    description: 'Estes 登录页出现验证码，需人工输入后继续填表',
    status: 'OPEN',
    createTime: '2026-06-06 09:40:00',
    handler: null
  },
  {
    id: 2,
    takeoverNo: 'TK-20260606002',
    employeeName: 'AI客服文员',
    reasonType: 'MISSING_FIELD',
    reasonLabel: '订单缺字段',
    relatedDocNo: 'LO2506040018',
    description: '客户地址缺少门牌号，无法生成确认邮件',
    status: 'IN_PROGRESS',
    createTime: '2026-06-06 09:20:00',
    handler: '张主管'
  },
  {
    id: 3,
    takeoverNo: 'TK-20260606003',
    employeeName: 'AI财务对账员',
    reasonType: 'FEE_DIFF',
    reasonLabel: '费用差异过大',
    relatedDocNo: 'TR2505150099',
    description: '承运商账单与系统预估差异超过 15%',
    status: 'OPEN',
    createTime: '2026-06-06 08:45:00',
    handler: null
  }
];

const executionLogs: Api.Iec.ExecutionLog[] = [
  {
    id: 1,
    executeTime: now(),
    employeeName: 'AI调度助理',
    flowName: '自动排车流程',
    stepName: '读取待排车次',
    inputSummary: 'status=PENDING_DISPATCH',
    outputSummary: '匹配 3 条车次',
    status: 'SUCCESS',
    failReason: null,
    operator: null
  },
  {
    id: 2,
    executeTime: '2026-06-06 09:40:12',
    employeeName: 'AI供应商下单员',
    flowName: 'LTL Estes 下单流程',
    stepName: '打开网页',
    inputSummary: 'url=estes.com/book',
    outputSummary: '页面加载成功',
    status: 'SUCCESS',
    failReason: null,
    operator: null
  },
  {
    id: 3,
    executeTime: '2026-06-06 09:41:05',
    employeeName: 'AI供应商下单员',
    flowName: 'LTL Estes 下单流程',
    stepName: '人工确认',
    inputSummary: '验证码节点',
    outputSummary: '等待人工接管',
    status: 'FAILED',
    failReason: '验证码未提供',
    operator: null
  }
];

const credentials: Api.Iec.Credential[] = [
  {
    id: 1,
    platformName: 'Estes Express',
    accountType: '供应商网页',
    username: 'forest.la.ops',
    passwordMasked: '********（已加密）',
    status: 'ACTIVE',
    lastUsedTime: now(),
    authScope: 'LTL下单、报价查询'
  },
  {
    id: 2,
    platformName: '企业邮箱',
    accountType: 'SMTP',
    username: 'noreply@forest-wms.com',
    passwordMasked: '********（已加密）',
    status: 'ACTIVE',
    lastUsedTime: '2026-06-06 09:12:00',
    authScope: '客户确认邮件、日报推送'
  },
  {
    id: 3,
    platformName: 'Amazon Carrier Central',
    accountType: 'API',
    username: 'api-forest-prod',
    passwordMasked: '********（已加密）',
    status: 'EXPIRED',
    lastUsedTime: '2026-05-28 14:00:00',
    authScope: '预约查询'
  }
];

export function getIecDashboardSummary(): Api.Iec.DashboardSummary {
  return {
    totalEmployees: employees.length,
    workingCount: employees.filter(e => e.status === 'WORKING').length,
    todayTasks: employees.reduce((s, e) => s + e.todayTaskCount, 0),
    avgSuccessRate: Math.round(employees.reduce((s, e) => s + e.successRate, 0) / employees.length),
    openTakeoverCount: takeoverTasks.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length
  };
}

export function getIecEmployeeList(params?: Record<string, any>) {
  let rows = [...employees];
  const status = params?.status as string | undefined;
  const keyword = (params?.keyword as string | undefined)?.trim();
  if (status) rows = rows.filter(r => r.status === status);
  if (keyword) {
    const kw = keyword.toLowerCase();
    rows = rows.filter(r => r.employeeName.toLowerCase().includes(kw) || r.roleTypeLabel.toLowerCase().includes(kw));
  }
  return mockPage(rows, params);
}

export function getIecEmployeeDetail(id: number) {
  return employees.find(e => e.id === id) ?? null;
}

export function updateIecEmployee(id: number, patch: Partial<Api.Iec.IntelligentEmployee>) {
  const row = employees.find(e => e.id === id);
  if (!row) return { success: false, message: '智能员工不存在' };
  Object.assign(row, patch);
  return { success: true, message: '配置已保存', data: row };
}

export function getIecAutoFlowList(params?: Record<string, any>) {
  return mockPage([...autoFlows], params);
}

export function getIecRpaFlowList(params?: Record<string, any>) {
  return mockPage(rpaFlows.map(({ nodes, ...r }) => r), params);
}

export function getIecRpaFlowDetail(id: number) {
  return rpaFlows.find(f => f.id === id) ?? null;
}

export function saveIecRpaFlow(id: number, nodes: Api.Iec.RpaNode[]) {
  const flow = rpaFlows.find(f => f.id === id);
  if (!flow) return { success: false, message: '流程不存在' };
  flow.nodes = nodes;
  flow.nodeCount = nodes.length;
  flow.updatedTime = now();
  return { success: true, message: '流程已保存（原型）', data: flow };
}

export function getIecTaskQueueList(params?: Record<string, any>) {
  let rows = [...executionTasks];
  const status = params?.status as string | undefined;
  if (status) rows = rows.filter(r => r.status === status);
  return mockPage(rows, params);
}

export function iecTaskAction(id: number, action: string) {
  const task = executionTasks.find(t => t.id === id);
  if (!task) return { success: false, message: '任务不存在' };
  if (action === 'retry') {
    task.status = 'PENDING';
    task.failReason = null;
    task.currentStep = '重试排队';
  } else if (action === 'cancel') {
    task.status = 'CANCELLED';
    task.finishTime = now();
  } else if (action === 'takeover') {
    task.status = 'WAITING_MANUAL';
  }
  return { success: true, message: '操作成功', data: task };
}

export function getIecTakeoverList(params?: Record<string, any>) {
  let rows = [...takeoverTasks];
  const status = params?.status as string | undefined;
  if (status) rows = rows.filter(r => r.status === status);
  return mockPage(rows, params);
}

export function iecTakeoverAction(id: number, action: string) {
  const row = takeoverTasks.find(t => t.id === id);
  if (!row) return { success: false, message: '接管任务不存在' };
  if (action === 'claim') row.status = 'IN_PROGRESS';
  if (action === 'resolve') row.status = 'RESOLVED';
  if (action === 'close') row.status = 'CLOSED';
  if (action === 'continue') {
    row.status = 'RESOLVED';
    const task = executionTasks.find(t => t.relatedDocNo === row.relatedDocNo && t.status === 'WAITING_MANUAL');
    if (task) {
      task.status = 'RUNNING';
      task.currentStep = '继续执行';
      task.failReason = null;
    }
  }
  return { success: true, message: '操作成功', data: row };
}

export function getIecExecutionLogList(params?: Record<string, any>) {
  return mockPage([...executionLogs], params);
}

export function getIecCredentialList(params?: Record<string, any>) {
  return mockPage([...credentials], params);
}

export function getIecPerformanceList() {
  const stats: Api.Iec.PerformanceStat[] = employees.map(e => ({
    employeeId: e.id,
    employeeName: e.employeeName,
    taskCount: e.todayTaskCount * 7,
    successRate: e.successRate,
    savedHours: Math.round(e.todayTaskCount * e.avgDurationMinutes / 60 * 10) / 10,
    takeoverRate: Math.round((e.manualTakeoverCount / Math.max(e.todayTaskCount, 1)) * 100),
    failReasons: [
      { reason: '需人工验证码', count: e.manualTakeoverCount },
      { reason: '字段不完整', count: Math.max(0, e.manualTakeoverCount - 1) },
      { reason: '外部页面超时', count: 1 }
    ].filter(r => r.count > 0),
    trend7d: Array.from({ length: 7 }, (_, i) => ({
      date: `06-${String(i + 1).padStart(2, '0')}`,
      tasks: Math.max(2, e.todayTaskCount - 3 + i),
      successRate: Math.min(100, e.successRate - 2 + (i % 3))
    }))
  }));
  return { rows: stats, total: stats.length };
}
