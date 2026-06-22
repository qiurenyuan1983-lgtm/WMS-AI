import { MOCK_WAREHOUSE } from './common';

const whIds = JSON.stringify([MOCK_WAREHOUSE.id]);

function buildNodes(steps: Array<Omit<Api.Oms.ApprovalFlowNode, 'stepNo'>>) {
  return JSON.stringify(
    steps.map((step, index) => ({
      stepNo: index + 1,
      approveMode: 'ANY' as Api.Oms.ApprovalMode,
      timeoutHours: 24,
      autoPass: false,
      ...step
    }))
  );
}

function summarize(nodesConfig: string) {
  try {
    const nodes = JSON.parse(nodesConfig) as Api.Oms.ApprovalFlowNode[];
    return nodes.map(n => n.nodeName).join(' → ');
  } catch {
    return '—';
  }
}

export const MOCK_APPROVAL_FLOWS: Api.Oms.ApprovalFlow[] = [
  {
    id: 920001,
    flowCode: 'AF-FEE-001',
    flowName: '仓储费用超额审批',
    category: 'FEE',
    warehouseIds: whIds,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    triggerDesc: '单笔费用金额 ≥ $500 或月度累计调整 ≥ $2000',
    triggerConfig: JSON.stringify({ amountThreshold: 500, monthlyThreshold: 2000, currency: 'USD' }),
    nodesConfig: buildNodes([
      { nodeName: '费用录入人上级', nodeType: 'SUPERVISOR', approverNames: '直属上级' },
      { nodeName: '财务审核', nodeType: 'ROLE', approverNames: '财务主管', approverIds: 'FINANCE_SUPERVISOR' },
      { nodeName: '仓库经理终审', nodeType: 'ROLE', approverNames: '仓库经理', approverIds: 'WAREHOUSE_MANAGER' }
    ]),
    nodeSummary: '',
    version: 2,
    status: 'enabled',
    remark: '适用于仓储、操作类费用',
    creatorName: 'admin',
    updateByName: '财务 Amy',
    createTime: '2026-04-01 09:00:00',
    updateTime: '2026-06-01 14:20:00'
  },
  {
    id: 920002,
    flowCode: 'AF-SB-001',
    flowName: '供应商账单对账审批',
    category: 'SUPPLIER_BILL',
    warehouseIds: whIds,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    triggerDesc: '供应商账单提交对账、账单金额与报价差异 > 5%',
    triggerConfig: JSON.stringify({ diffRateThreshold: 0.05 }),
    nodesConfig: buildNodes([
      { nodeName: '采购/运营复核', nodeType: 'ROLE', approverNames: '运营主管', approverIds: 'OPS_SUPERVISOR' },
      { nodeName: '财务确认', nodeType: 'ROLE', approverNames: '财务主管', approverIds: 'FINANCE_SUPERVISOR' }
    ]),
    nodeSummary: '',
    version: 1,
    status: 'enabled',
    creatorName: 'admin',
    updateByName: 'admin',
    createTime: '2026-04-10 10:00:00',
    updateTime: '2026-05-15 11:30:00'
  },
  {
    id: 920003,
    flowCode: 'AF-EC-001',
    flowName: '货损异常赔付审批',
    category: 'EXCEPTION_COMPENSATION',
    warehouseIds: whIds,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    triggerDesc: '异常赔付申请提交，赔付金额 ≥ $100',
    triggerConfig: JSON.stringify({ amountThreshold: 100 }),
    nodesConfig: buildNodes([
      { nodeName: 'QC 确认', nodeType: 'ROLE', approverNames: 'QC 主管' },
      { nodeName: '仓库经理审批', nodeType: 'ROLE', approverNames: '仓库经理', approverIds: 'WAREHOUSE_MANAGER' },
      { nodeName: '财务放款', nodeType: 'ROLE', approverNames: '财务主管', approverIds: 'FINANCE_SUPERVISOR' }
    ]),
    nodeSummary: '',
    version: 1,
    status: 'enabled',
    creatorName: 'admin',
    updateByName: 'QC 主管',
    createTime: '2026-04-12 09:00:00',
    updateTime: '2026-05-20 16:00:00'
  },
  {
    id: 920004,
    flowCode: 'AF-OA-001',
    flowName: '库存数量调整审批',
    category: 'OPERATION_ADJUSTMENT',
    warehouseIds: whIds,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    triggerDesc: '库存数量调整、库位强制变更、单据状态回退',
    nodesConfig: buildNodes([
      { nodeName: '操作组长确认', nodeType: 'DEPT_HEAD', approverNames: '仓储组长' },
      { nodeName: '仓库主管审批', nodeType: 'ROLE', approverNames: '仓库主管', approverIds: 'WAREHOUSE_SUPERVISOR' }
    ]),
    nodeSummary: '',
    version: 3,
    status: 'enabled',
    creatorName: 'admin',
    updateByName: '仓库主管',
    createTime: '2026-03-01 09:00:00',
    updateTime: '2026-06-02 09:15:00'
  },
  {
    id: 920005,
    flowCode: 'AF-PC-001',
    flowName: '用户权限变更审批',
    category: 'PERMISSION_CHANGE',
    warehouseIds: whIds,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    triggerDesc: '新增/变更用户角色、菜单权限、数据权限',
    nodesConfig: buildNodes([
      { nodeName: '部门负责人', nodeType: 'DEPT_HEAD', approverNames: '申请部门负责人' },
      { nodeName: '系统管理员', nodeType: 'ROLE', approverNames: '系统管理员', approverIds: 'SYS_ADMIN' }
    ]),
    nodeSummary: '',
    version: 1,
    status: 'enabled',
    creatorName: 'admin',
    updateByName: 'admin',
    createTime: '2026-05-01 09:00:00',
    updateTime: '2026-05-28 10:00:00'
  },
  {
    id: 920006,
    flowCode: 'AF-PM-001',
    flowName: '供应商报价修改审批',
    category: 'PRICE_MODIFY',
    warehouseIds: whIds,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    triggerDesc: '供应商报价、费率、单价修改或新增',
    triggerConfig: JSON.stringify({ requireFinance: true }),
    nodesConfig: buildNodes([
      { nodeName: '运营主管审核', nodeType: 'ROLE', approverNames: '运营主管', approverIds: 'OPS_SUPERVISOR' },
      { nodeName: '财务定价确认', nodeType: 'ROLE', approverNames: '财务主管', approverIds: 'FINANCE_SUPERVISOR' }
    ]),
    nodeSummary: '',
    version: 1,
    status: 'enabled',
    creatorName: 'admin',
    updateByName: '运营主管',
    createTime: '2026-05-05 09:00:00',
    updateTime: '2026-05-30 14:00:00'
  },
  {
    id: 920007,
    flowCode: 'AF-DD-001',
    flowName: '关键业务数据删除审批',
    category: 'DATA_DELETE',
    warehouseIds: whIds,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    triggerDesc: '删除订单、账单、库存记录等不可恢复数据',
    nodesConfig: buildNodes([
      { nodeName: '业务负责人', nodeType: 'DEPT_HEAD', approverNames: '业务部门负责人' },
      { nodeName: '仓库经理', nodeType: 'ROLE', approverNames: '仓库经理', approverIds: 'WAREHOUSE_MANAGER' },
      { nodeName: '系统管理员备案', nodeType: 'ROLE', approverNames: '系统管理员', approverIds: 'SYS_ADMIN' }
    ]),
    nodeSummary: '',
    version: 1,
    status: 'enabled',
    creatorName: 'admin',
    updateByName: 'admin',
    createTime: '2026-05-08 09:00:00',
    updateTime: '2026-05-08 09:00:00'
  },
  {
    id: 920008,
    flowCode: 'AF-TA-001',
    flowName: '跨仓临时授权审批',
    category: 'TEMP_AUTH',
    warehouseIds: whIds,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    triggerDesc: '临时跨仓访问、限时提权，有效期 ≤ 7 天',
    triggerConfig: JSON.stringify({ maxDays: 7 }),
    nodesConfig: buildNodes([
      { nodeName: '直属上级', nodeType: 'SUPERVISOR', approverNames: '直属上级' },
      { nodeName: '目标仓主管', nodeType: 'ROLE', approverNames: '仓库主管', approverIds: 'WAREHOUSE_SUPERVISOR' }
    ]),
    nodeSummary: '',
    version: 1,
    status: 'enabled',
    creatorName: 'admin',
    updateByName: 'admin',
    createTime: '2026-05-10 09:00:00',
    updateTime: '2026-05-10 09:00:00'
  },
  {
    id: 920009,
    flowCode: 'AF-FEE-002',
    flowName: '卡派运输费审批（草稿）',
    category: 'FEE',
    warehouseIds: whIds,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    triggerDesc: '卡派运输费单笔 ≥ $300',
    nodesConfig: buildNodes([
      { nodeName: '调度主管', nodeType: 'ROLE', approverNames: '调度主管' },
      { nodeName: '财务审核', nodeType: 'ROLE', approverNames: '财务主管', approverIds: 'FINANCE_SUPERVISOR' }
    ]),
    nodeSummary: '',
    version: 1,
    status: 'draft',
    creatorName: 'admin',
    updateByName: 'admin',
    createTime: '2026-06-01 09:00:00',
    updateTime: '2026-06-01 09:00:00'
  }
];

MOCK_APPROVAL_FLOWS.forEach(flow => {
  flow.nodeSummary = summarize(flow.nodesConfig);
});

export function getApprovalFlowList(params?: Record<string, any>) {
  let rows = [...MOCK_APPROVAL_FLOWS];
  if (params?.category) rows = rows.filter(r => r.category === params.category);
  if (params?.status) rows = rows.filter(r => r.status === params.status);
  if (params?.flowName) {
    const k = String(params.flowName).toLowerCase();
    rows = rows.filter(r => r.flowName.toLowerCase().includes(k) || r.flowCode.toLowerCase().includes(k));
  }
  if (params?.warehouseId) {
    rows = rows.filter(r => {
      try {
        const ids = JSON.parse(r.warehouseIds || '[]') as string[];
        return ids.includes(String(params.warehouseId));
      } catch {
        return true;
      }
    });
  }
  rows.sort((a, b) => (a.flowCode > b.flowCode ? 1 : -1));
  const pageNum = Number(params?.pageNum || 1);
  const pageSize = Number(params?.pageSize || 10);
  const start = (pageNum - 1) * pageSize;
  return { rows: rows.slice(start, start + pageSize), total: rows.length, pageNum, pageSize };
}

export function getApprovalFlowDetail(id: string | number) {
  return MOCK_APPROVAL_FLOWS.find(f => String(f.id) === String(id)) || null;
}

export function createApprovalFlow(data: Api.Oms.ApprovalFlowOperateParams) {
  const nodesConfig = data.nodesConfig || '[]';
  const id = Date.now();
  const row: Api.Oms.ApprovalFlow = {
    id,
    flowCode: data.flowCode || `AF-${id}`,
    flowName: data.flowName || '',
    category: data.category || 'FEE',
    warehouseIds: data.warehouseIds,
    warehouseName: data.warehouseName,
    triggerDesc: data.triggerDesc || '',
    triggerConfig: data.triggerConfig,
    nodesConfig,
    nodeSummary: summarize(nodesConfig),
    version: 1,
    status: data.status || 'draft',
    remark: data.remark,
    creatorName: 'admin',
    updateByName: 'admin',
    createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    updateTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
  };
  MOCK_APPROVAL_FLOWS.unshift(row);
  return row;
}

export function updateApprovalFlow(data: Api.Oms.ApprovalFlowOperateParams) {
  const idx = MOCK_APPROVAL_FLOWS.findIndex(f => String(f.id) === String(data.id));
  if (idx < 0) return null;
  const prev = MOCK_APPROVAL_FLOWS[idx];
  const nodesConfig = data.nodesConfig ?? prev.nodesConfig;
  Object.assign(prev, data, {
    nodesConfig,
    nodeSummary: summarize(nodesConfig),
    version: (prev.version || 1) + 1,
    updateTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
  });
  return prev;
}

export function setApprovalFlowStatus(id: string | number, status: Api.Oms.ApprovalFlowStatus) {
  const row = MOCK_APPROVAL_FLOWS.find(f => String(f.id) === String(id));
  if (row) {
    row.status = status;
    row.updateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
  return row;
}

export function deleteApprovalFlow(ids: string) {
  const idSet = new Set(ids.split(','));
  for (let i = MOCK_APPROVAL_FLOWS.length - 1; i >= 0; i -= 1) {
    if (idSet.has(String(MOCK_APPROVAL_FLOWS[i].id))) MOCK_APPROVAL_FLOWS.splice(i, 1);
  }
  return null;
}
