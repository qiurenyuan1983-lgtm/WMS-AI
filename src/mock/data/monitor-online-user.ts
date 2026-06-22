import { mockPage } from '../utils';

type Seed = {
  userName: string;
  nickName: string;
  accountType: Api.Monitor.LoginAccountType;
  roleName: string;
  deptName: string;
  warehouseName: string;
  loginPort: Api.Monitor.LoginPort;
  portTab: Api.Monitor.OnlineSessionTab;
  currentPage: string;
  ip: string;
  location: string;
  deviceType: string;
  browser: string;
  os: string;
  onlineMinutes: number;
  idleMinutes: number;
  onlineStatus: Api.Monitor.OnlineSessionStatus;
  riskLevel: Api.Monitor.LoginRiskLevel;
  abnormalFlag?: boolean;
};

const SEEDS: Seed[] = [
  { userName: 'admin', nickName: '系统管理员', accountType: 'SYSTEM', roleName: '超级管理员', deptName: '信息技术部', warehouseName: '总部虚拟仓', loginPort: 'PC', portTab: 'PC', currentPage: 'Dashboard', ip: '192.168.1.10', location: '内网-上海', deviceType: 'pc', browser: 'Chrome 125', os: 'Windows 11', onlineMinutes: 120, idleMinutes: 2, onlineStatus: 'ONLINE', riskLevel: 'NORMAL' },
  { userName: 'wms01', nickName: '仓库主管', accountType: 'WMS', roleName: '仓储经理', deptName: '仓储运营部', warehouseName: 'LAX 一号仓', loginPort: 'PC', portTab: 'PC', currentPage: '库存可视化', ip: '192.168.2.15', location: '内网-深圳', deviceType: 'pc', browser: 'Chrome 125', os: 'Windows 11', onlineMinutes: 85, idleMinutes: 8, onlineStatus: 'ONLINE', riskLevel: 'NORMAL' },
  { userName: 'pda01', nickName: '入库PDA', accountType: 'WMS', roleName: '上架员', deptName: '仓储运营部', warehouseName: 'LAX 一号仓', loginPort: 'PDA', portTab: 'PDA', currentPage: '上架任务', ip: '10.20.30.41', location: 'LAX仓内网', deviceType: 'android', browser: 'PDA App', os: 'Android 13', onlineMinutes: 35, idleMinutes: 1, onlineStatus: 'ONLINE', riskLevel: 'NORMAL' },
  { userName: 'pda02', nickName: '拣货PDA', accountType: 'WMS', roleName: '拣货员', deptName: '仓储运营部', warehouseName: 'ONT 中转仓', loginPort: 'PDA', portTab: 'PDA', currentPage: '拣货执行', ip: '10.20.30.52', location: 'ONT仓内网', deviceType: 'android', browser: 'PDA App', os: 'Android 12', onlineMinutes: 48, idleMinutes: 0, onlineStatus: 'ONLINE', riskLevel: 'LOW' },
  { userName: 'customer01', nickName: '客户门户', accountType: 'CUSTOMER', roleName: '客户用户', deptName: '客户协同', warehouseName: 'LAX 一号仓', loginPort: 'PC', portTab: 'CUSTOMER', currentPage: '订单跟踪', ip: '203.0.113.18', location: '美国-洛杉矶', deviceType: 'pc', browser: 'Chrome 124', os: 'Windows 10', onlineMinutes: 22, idleMinutes: 5, onlineStatus: 'ONLINE', riskLevel: 'LOW' },
  { userName: 'supplier01', nickName: '供应商协同', accountType: 'SUPPLIER', roleName: '供应商', deptName: '供应商协同部', warehouseName: 'ONT 中转仓', loginPort: 'PC', portTab: 'SUPPLIER', currentPage: '海柜操作', ip: '198.51.100.8', location: '美国-达拉斯', deviceType: 'pc', browser: 'Edge 125', os: 'Windows 11', onlineMinutes: 56, idleMinutes: 12, onlineStatus: 'IDLE', riskLevel: 'NORMAL' },
  { userName: 'driver01', nickName: '司机李强', accountType: 'DRIVER', roleName: '司机', deptName: '运输调度部', warehouseName: 'DFW 干线仓', loginPort: 'MOBILE', portTab: 'DRIVER', currentPage: 'Check-in', ip: '172.16.8.33', location: '车载热点', deviceType: 'android', browser: 'Chrome Mobile', os: 'Android 12', onlineMinutes: 12, idleMinutes: 0, onlineStatus: 'ONLINE', riskLevel: 'NORMAL' },
  { userName: 'oms01', nickName: '订单专员', accountType: 'OMS', roleName: '运营专员', deptName: '订单运营部', warehouseName: 'ONT 中转仓', loginPort: 'PC', portTab: 'PC', currentPage: '订单工作台', ip: '192.168.2.20', location: '内网-深圳', deviceType: 'pc', browser: 'Chrome 125', os: 'macOS 14', onlineMinutes: 95, idleMinutes: 45, onlineStatus: 'IDLE', riskLevel: 'LOW' },
  { userName: 'wms02', nickName: '异常PDA', accountType: 'WMS', roleName: '作业员', deptName: '仓储运营部', warehouseName: 'LAX 一号仓', loginPort: 'PDA', portTab: 'PDA', currentPage: '未知页面', ip: '45.76.88.12', location: '美国-纽约', deviceType: 'android', browser: '未知PDA', os: 'Android 11', onlineMinutes: 18, idleMinutes: 18, onlineStatus: 'ABNORMAL', riskLevel: 'HIGH', abnormalFlag: true },
  { userName: 'demo', nickName: '演示账号', accountType: 'CUSTOMER', roleName: '客户演示', deptName: '客户协同', warehouseName: 'LAX 一号仓', loginPort: 'PC', portTab: 'CUSTOMER', currentPage: '门户首页', ip: '192.168.1.88', location: '内网-上海', deviceType: 'pc', browser: 'Firefox 126', os: 'Windows 10', onlineMinutes: 8, idleMinutes: 28, onlineStatus: 'EXPIRING', riskLevel: 'MEDIUM' },
  { userName: 'pda03', nickName: '拆柜PDA', accountType: 'WMS', roleName: '拆柜员', deptName: '仓储运营部', warehouseName: 'LAX 一号仓', loginPort: 'PDA', portTab: 'PDA', currentPage: '拆柜作业', ip: '10.20.30.60', location: 'LAX仓内网', deviceType: 'android', browser: 'PDA App', os: 'Android 13', onlineMinutes: 62, idleMinutes: 3, onlineStatus: 'ONLINE', riskLevel: 'NORMAL' },
  { userName: 'supplier02', nickName: '供应商门户', accountType: 'SUPPLIER', roleName: '供应商', deptName: '供应商协同部', warehouseName: 'DFW 干线仓', loginPort: 'PC', portTab: 'SUPPLIER', currentPage: '报价管理', ip: '10.10.0.8', location: '供应商专线', deviceType: 'pc', browser: 'Chrome 124', os: 'Windows 11', onlineMinutes: 40, idleMinutes: 6, onlineStatus: 'ONLINE', riskLevel: 'NORMAL' }
];

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}小时${m}分` : `${h}小时`;
}

function ago(minutes: number) {
  const d = new Date(Date.now() - minutes * 60000);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function buildRisk(row: Api.Monitor.OnlineUser): Api.Monitor.OnlineSessionRiskAnalysis {
  const factors: string[] = [];
  if (row.abnormalFlag) factors.push('异常会话行为');
  if (row.idleDuration && row.idleDuration.includes('45')) factors.push('长时间无操作');
  if (row.loginPort === 'PDA' && row.ipaddr.startsWith('45.')) factors.push('PDA异地登录');
  if (row.onlineStatus === 'EXPIRING') factors.push('会话即将超时');
  if (!factors.length) factors.push('会话正常');
  const scoreMap = { NORMAL: 10, LOW: 28, MEDIUM: 55, HIGH: 82 };
  return {
    level: row.riskLevel as Api.Monitor.LoginRiskLevel,
    score: scoreMap[row.riskLevel as keyof typeof scoreMap] || 15,
    factors,
    suggestion: row.riskLevel === 'HIGH' ? '建议强制下线并核查设备' : '可持续观察'
  };
}

function enrich(row: Api.Monitor.OnlineUser): Api.Monitor.OnlineUser {
  return {
    ...row,
    riskAnalysis: buildRisk(row),
    operationTracks: [
      { time: row.loginTime, page: '登录页', action: '登录成功' },
      { time: row.lastActiveTime || row.loginTime, page: row.currentPage || '—', action: '页面访问' }
    ],
    manageRecords: row.manageRecords || []
  };
}

export let MOCK_ONLINE_SESSIONS: Api.Monitor.OnlineUser[] = SEEDS.map((seed, i) => {
  const row: Api.Monitor.OnlineUser = {
    sessionId: `S${String(i + 1).padStart(3, '0')}`,
    tokenId: `tk-online-${1000 + i}`,
    userName: seed.userName,
    nickName: seed.nickName,
    accountType: seed.accountType,
    roleName: seed.roleName,
    deptName: seed.deptName,
    warehouseName: seed.warehouseName,
    loginPort: seed.loginPort,
    currentPage: seed.currentPage,
    ipaddr: seed.ip,
    loginLocation: seed.location,
    deviceType: seed.deviceType,
    browser: seed.browser,
    os: seed.os,
    loginTime: ago(seed.onlineMinutes + 5),
    lastActiveTime: ago(seed.idleMinutes),
    onlineDuration: formatDuration(seed.onlineMinutes),
    idleDuration: formatDuration(seed.idleMinutes),
    onlineStatus: seed.onlineStatus,
    riskLevel: seed.riskLevel,
    abnormalFlag: seed.abnormalFlag || false,
    phone: `138${String(20000000 + i).slice(-8)}`,
    email: `${seed.userName}@forest-wms.com`,
    deviceId: `DEV-${seed.userName}`,
    trustedDevice: !seed.abnormalFlag,
    isp: seed.ip.startsWith('192.') || seed.ip.startsWith('10.') ? '内网' : '公网',
    whitelistIp: seed.ip.startsWith('192.168.'),
    blacklistIp: seed.ip.startsWith('45.'),
    manageRecords: []
  };
  (row as any)._portTab = seed.portTab;
  return enrich(row);
});

let forceLogoutToday = 3;

function matchTab(row: Api.Monitor.OnlineUser & { _portTab?: string }, tab?: string | null) {
  if (!tab || tab === 'ALL') return ['ONLINE', 'IDLE', 'EXPIRING', 'ABNORMAL'].includes(row.onlineStatus);
  if (tab === 'IDLE') return row.onlineStatus === 'IDLE' || row.onlineStatus === 'EXPIRING';
  if (tab === 'ABNORMAL') return row.abnormalFlag || row.onlineStatus === 'ABNORMAL';
  return (row as any)._portTab === tab;
}

function filterSessions(params?: Api.Monitor.OnlineUserSearchParams) {
  let list = MOCK_ONLINE_SESSIONS.filter(r => !['FORCE_LOGOUT', 'EXPIRED'].includes(r.onlineStatus));
  const p = params || {};
  if (p.tabKey) list = list.filter(r => matchTab(r as any, p.tabKey));
  if (p.userName) {
    const kw = String(p.userName).toLowerCase();
    list = list.filter(r => r.userName.toLowerCase().includes(kw));
  }
  if (p.nickName) {
    const kw = String(p.nickName).toLowerCase();
    list = list.filter(r => (r.nickName || '').toLowerCase().includes(kw));
  }
  if (p.accountType) list = list.filter(r => r.accountType === p.accountType);
  if (p.deptName) {
    const kw = String(p.deptName).toLowerCase();
    list = list.filter(r => (r.deptName || '').toLowerCase().includes(kw));
  }
  if (p.warehouseName) {
    const kw = String(p.warehouseName).toLowerCase();
    list = list.filter(r => (r.warehouseName || '').toLowerCase().includes(kw));
  }
  if (p.loginPort) {
    const kw = String(p.loginPort).toLowerCase();
    list = list.filter(r => (r.loginPort || '').toLowerCase().includes(kw));
  }
  if (p.onlineStatus) list = list.filter(r => r.onlineStatus === p.onlineStatus);
  if (p.ipaddr) {
    const kw = String(p.ipaddr).toLowerCase();
    list = list.filter(r => (r.ipaddr || '').toLowerCase().includes(kw));
  }
  if (p.deviceType) {
    const kw = String(p.deviceType).toLowerCase();
    list = list.filter(r => String(r.deviceType || '').toLowerCase().includes(kw));
  }
  if (p.riskLevel) list = list.filter(r => r.riskLevel === p.riskLevel);
  return list;
}

export function getOnlineSessionStats(): Api.Monitor.OnlineSessionStats {
  const active = MOCK_ONLINE_SESSIONS.filter(r => !['FORCE_LOGOUT', 'EXPIRED'].includes(r.onlineStatus));
  const tabCounts = {
    ALL: active.length,
    PC: active.filter(r => (r as any)._portTab === 'PC').length,
    PDA: active.filter(r => (r as any)._portTab === 'PDA').length,
    CUSTOMER: active.filter(r => (r as any)._portTab === 'CUSTOMER').length,
    SUPPLIER: active.filter(r => (r as any)._portTab === 'SUPPLIER').length,
    DRIVER: active.filter(r => (r as any)._portTab === 'DRIVER').length,
    IDLE: active.filter(r => r.onlineStatus === 'IDLE' || r.onlineStatus === 'EXPIRING').length,
    ABNORMAL: active.filter(r => r.abnormalFlag || r.onlineStatus === 'ABNORMAL').length
  };
  return {
    totalOnline: active.length,
    pcOnline: tabCounts.PC,
    pdaOnline: tabCounts.PDA,
    customerOnline: tabCounts.CUSTOMER,
    supplierOnline: tabCounts.SUPPLIER,
    driverOnline: tabCounts.DRIVER,
    abnormalSessions: tabCounts.ABNORMAL,
    forceLogoutToday,
    tabCounts
  };
}

export function getOnlineUserList(params?: Api.Monitor.OnlineUserSearchParams) {
  return mockPage(filterSessions(params), params);
}

export function getOnlineSessionDetail(tokenId: string) {
  const row = MOCK_ONLINE_SESSIONS.find(r => r.tokenId === tokenId || r.sessionId === tokenId);
  return row ? enrich(row) : null;
}

const ACTION_LABEL: Record<string, string> = {
  FORCE_LOGOUT: '强制下线',
  LOCK_ACCOUNT: '锁定账号',
  MARK_NORMAL: '标记正常',
  BLACKLIST_IP: '加入黑名单IP',
  WHITELIST_IP: '加入白名单IP',
  NOTIFY_USER: '通知用户'
};

export function executeOnlineSessionAction(body: Api.Monitor.OnlineSessionActionParams) {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const ids = new Set(body.tokenIds || []);
  MOCK_ONLINE_SESSIONS = MOCK_ONLINE_SESSIONS.map(row => {
    if (!ids.has(row.tokenId)) return row;
    const records = [...(row.manageRecords || []), { time: now, operatorName: 'admin', action: ACTION_LABEL[body.action] || body.action, remark: body.remark || null }];
    if (body.action === 'FORCE_LOGOUT' || body.action === 'LOCK_ACCOUNT') {
      forceLogoutToday += 1;
      return enrich({
        ...row,
        onlineStatus: body.action === 'LOCK_ACCOUNT' ? 'FORCE_LOGOUT' : 'FORCE_LOGOUT',
        manageRecords: records
      });
    }
    if (body.action === 'MARK_NORMAL') {
      return enrich({ ...row, abnormalFlag: false, onlineStatus: 'ONLINE', riskLevel: 'NORMAL', manageRecords: records });
    }
    if (body.action === 'BLACKLIST_IP') {
      return enrich({ ...row, blacklistIp: true, whitelistIp: false, riskLevel: 'HIGH', manageRecords: records });
    }
    if (body.action === 'WHITELIST_IP') {
      return enrich({ ...row, whitelistIp: true, blacklistIp: false, riskLevel: 'NORMAL', manageRecords: records });
    }
    if (body.action === 'NOTIFY_USER') {
      return enrich({ ...row, manageRecords: records });
    }
    return row;
  });
  if (body.action === 'FORCE_LOGOUT' || body.action === 'LOCK_ACCOUNT') {
    MOCK_ONLINE_SESSIONS = MOCK_ONLINE_SESSIONS.filter(r => !ids.has(r.tokenId) || r.onlineStatus !== 'FORCE_LOGOUT');
  }
  return MOCK_ONLINE_SESSIONS.filter(r => ids.has(r.tokenId));
}

export function forceLogoutOnlineUser(tokenId: string, remark?: string) {
  executeOnlineSessionAction({ tokenIds: [tokenId], action: 'FORCE_LOGOUT', remark: remark || '管理员强制下线' });
  return true;
}
