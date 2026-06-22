import { mockPage } from '../utils';

const USERS = [
  { userName: 'admin', nickName: '系统管理员', accountType: 'SYSTEM', deptName: '信息技术部', warehouseName: '总部虚拟仓' },
  { userName: 'wms01', nickName: '仓库主管', accountType: 'WMS', deptName: '仓储运营部', warehouseName: 'LAX 一号仓' },
  { userName: 'wms02', nickName: '上架员张三', accountType: 'WMS', deptName: '仓储运营部', warehouseName: 'LAX 一号仓' },
  { userName: 'oms01', nickName: '订单专员', accountType: 'OMS', deptName: '订单运营部', warehouseName: 'ONT 中转仓' },
  { userName: 'driver01', nickName: '司机李强', accountType: 'DRIVER', deptName: '运输调度部', warehouseName: 'DFW 干线仓' },
  { userName: 'supplier01', nickName: '供应商协同', accountType: 'SUPPLIER', deptName: '供应商协同部', warehouseName: 'ONT 中转仓' },
  { userName: 'tms01', nickName: '调度员王五', accountType: 'TMS', deptName: '运输调度部', warehouseName: 'DFW 干线仓' },
  { userName: 'demo', nickName: '演示账号', accountType: 'CUSTOMER', deptName: '订单运营部', warehouseName: 'LAX 一号仓' }
];

function todayStr(hour: number, minute = 0) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function yesterdayStr(hour: number) {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

type Seed = {
  loginStatus: Api.Monitor.LoginLogStatus;
  failReason?: Api.Monitor.LoginFailReason;
  riskLevel: Api.Monitor.LoginRiskLevel;
  loginPort: Api.Monitor.LoginPort;
  loginMethod?: Api.Monitor.LoginMethod;
  abnormalFlag?: boolean;
  onlineFlag?: boolean;
  userIdx: number;
  ip: string;
  location: string;
  deviceType: string;
  browser: string;
  os: string;
  loginHour: number;
  logoutHour?: number;
  msg?: string;
};

const SEEDS: Seed[] = [
  { loginStatus: 'SUCCESS', riskLevel: 'NORMAL', loginPort: 'PC', userIdx: 0, ip: '192.168.1.10', location: '内网-上海', deviceType: 'pc', browser: 'Chrome 125', os: 'Windows 11', loginHour: 8, onlineFlag: true },
  { loginStatus: 'SUCCESS', riskLevel: 'NORMAL', loginPort: 'PDA', userIdx: 1, ip: '10.20.30.41', location: 'LAX仓内网', deviceType: 'android', browser: 'PDA App', os: 'Android 13', loginHour: 7, onlineFlag: true },
  { loginStatus: 'FAILED', failReason: 'PASSWORD_ERROR', riskLevel: 'MEDIUM', loginPort: 'PC', userIdx: 4, ip: '203.0.113.18', location: '美国-洛杉矶', deviceType: 'pc', browser: 'Chrome 124', os: 'Windows 10', loginHour: 9, msg: '密码错误，累计失败 2 次' },
  { loginStatus: 'FAILED', failReason: 'CAPTCHA_ERROR', riskLevel: 'LOW', loginPort: 'MOBILE', userIdx: 7, ip: '198.51.100.8', location: '美国-达拉斯', deviceType: 'iphone', browser: 'Safari', os: 'iOS 17', loginHour: 9, msg: '验证码错误' },
  { loginStatus: 'ABNORMAL', riskLevel: 'HIGH', loginPort: 'PC', userIdx: 2, ip: '45.76.88.12', location: '美国-纽约', deviceType: 'pc', browser: 'Firefox 126', os: 'macOS 14', loginHour: 2, abnormalFlag: true, msg: '异地+非工作时间登录' },
  { loginStatus: 'LOCKED', failReason: 'ACCOUNT_LOCKED', riskLevel: 'HIGH', loginPort: 'PC', userIdx: 7, ip: '203.0.113.99', location: '美国-芝加哥', deviceType: 'pc', browser: 'Edge 125', os: 'Windows 11', loginHour: 10, msg: '连续失败 5 次，账号已锁定' },
  { loginStatus: 'ONLINE', riskLevel: 'NORMAL', loginPort: 'PC', userIdx: 3, ip: '192.168.2.15', location: '内网-深圳', deviceType: 'pc', browser: 'Chrome 125', os: 'Windows 11', loginHour: 8, onlineFlag: true },
  { loginStatus: 'LOGGED_OUT', riskLevel: 'NORMAL', loginPort: 'PDA', userIdx: 1, ip: '10.20.30.42', location: 'LAX仓内网', deviceType: 'android', browser: 'PDA App', os: 'Android 13', loginHour: 6, logoutHour: 14 },
  { loginStatus: 'FORCE_LOGOUT', riskLevel: 'MEDIUM', loginPort: 'PC', userIdx: 5, ip: '192.168.3.20', location: '内网-广州', deviceType: 'pc', browser: 'Chrome 124', os: 'Windows 10', loginHour: 11, logoutHour: 11, msg: '管理员强制退出' },
  { loginStatus: 'FAILED', failReason: 'IP_RESTRICTED', riskLevel: 'HIGH', loginPort: 'API', userIdx: 0, ip: '185.220.101.5', location: '境外-未知', deviceType: 'pc', browser: 'API Client', os: 'Linux', loginHour: 12, msg: 'IP 不在白名单' },
  { loginStatus: 'SUCCESS', riskLevel: 'LOW', loginPort: 'MOBILE', userIdx: 4, ip: '10.88.1.33', location: '车载热点', deviceType: 'android', browser: 'Chrome Mobile', os: 'Android 12', loginHour: 13, onlineFlag: true },
  { loginStatus: 'ABNORMAL', riskLevel: 'MEDIUM', loginPort: 'PC', userIdx: 6, ip: '198.18.0.55', location: '美国-西雅图', deviceType: 'pc', browser: 'Chrome 125', os: 'Windows 11', loginHour: 22, abnormalFlag: true, msg: '新设备首次登录' },
  { loginStatus: 'FAILED', failReason: 'USER_DISABLED', riskLevel: 'MEDIUM', loginPort: 'PC', userIdx: 7, ip: '192.168.1.88', location: '内网-上海', deviceType: 'pc', browser: 'Chrome 125', os: 'Windows 11', loginHour: 14 },
  { loginStatus: 'SUCCESS', riskLevel: 'NORMAL', loginPort: 'PC', loginMethod: 'SSO', userIdx: 0, ip: '192.168.1.10', location: '内网-上海', deviceType: 'pc', browser: 'Chrome 125', os: 'Windows 11', loginHour: 15, onlineFlag: false, logoutHour: 16 },
  { loginStatus: 'FAILED', failReason: 'DEVICE_RESTRICTED', riskLevel: 'MEDIUM', loginPort: 'PDA', userIdx: 2, ip: '10.20.30.50', location: 'LAX仓内网', deviceType: 'android', browser: '未知PDA', os: 'Android 11', loginHour: 15 },
  { loginStatus: 'SUCCESS', riskLevel: 'NORMAL', loginPort: 'API', loginMethod: 'TOKEN', userIdx: 5, ip: '10.10.0.8', location: '供应商专线', deviceType: 'pc', browser: 'API Client', os: 'Linux', loginHour: 16, onlineFlag: true },
  { loginStatus: 'FAILED', failReason: 'PERMISSION_DENIED', riskLevel: 'LOW', loginPort: 'PC', userIdx: 7, ip: '192.168.1.20', location: '内网-上海', deviceType: 'pc', browser: 'Chrome 125', os: 'Windows 11', loginHour: 17 },
  { loginStatus: 'ONLINE', riskLevel: 'LOW', loginPort: 'PC', userIdx: 2, ip: '10.20.30.45', location: 'LAX仓内网', deviceType: 'pc', browser: 'Chrome 125', os: 'Windows 11', loginHour: 7, onlineFlag: true },
  { loginStatus: 'LOGGED_OUT', riskLevel: 'NORMAL', loginPort: 'MOBILE', userIdx: 4, ip: '10.88.1.40', location: '车载热点', deviceType: 'android', browser: 'Chrome Mobile', os: 'Android 12', loginHour: 5, logoutHour: 18 },
  { loginStatus: 'FAILED', failReason: 'SYSTEM_ERROR', riskLevel: 'HIGH', loginPort: 'PC', userIdx: 3, ip: '192.168.2.15', location: '内网-深圳', deviceType: 'pc', browser: 'Chrome 125', os: 'Windows 11', loginHour: 18, msg: '认证服务超时' }
];

function buildRiskAnalysis(row: Api.Monitor.LoginInfor): Api.Monitor.LoginLogRiskAnalysis {
  const factors: string[] = [];
  if (row.abnormalFlag) factors.push('异常登录行为');
  if (row.loginPort === 'API' && row.ipaddr.startsWith('185.')) factors.push('境外 API 访问');
  if (row.failReason) factors.push(FAIL_LABEL[row.failReason] || String(row.failReason));
  if (row.loginTime && new Date(row.loginTime.replace(' ', 'T')).getHours() < 6) factors.push('非工作时间登录');
  if (!row.trustedDevice && row.loginStatus === 'ABNORMAL') factors.push('未信任设备');
  if (!factors.length) factors.push('常规登录，未发现明显风险');
  const scoreMap = { NORMAL: 12, LOW: 35, MEDIUM: 62, HIGH: 88 };
  return {
    level: row.riskLevel as Api.Monitor.LoginRiskLevel,
    score: scoreMap[row.riskLevel as keyof typeof scoreMap] || 20,
    factors,
    suggestion:
      row.riskLevel === 'HIGH'
        ? '建议立即锁定账号并核查 IP，必要时加入黑名单'
        : row.riskLevel === 'MEDIUM'
          ? '建议人工复核并关注后续登录行为'
          : '可标记为正常并持续监控'
  };
}

const FAIL_LABEL: Record<string, string> = {
  PASSWORD_ERROR: '密码错误累计',
  CAPTCHA_ERROR: '验证码错误',
  USER_NOT_FOUND: '账号不存在',
  USER_DISABLED: '账号停用',
  ACCOUNT_LOCKED: '账号锁定',
  IP_RESTRICTED: 'IP 限制',
  DEVICE_RESTRICTED: '设备限制',
  PERMISSION_DENIED: '权限不足',
  SYSTEM_ERROR: '系统异常'
};

function formatDuration(loginHour: number, logoutHour?: number) {
  if (logoutHour == null) return null;
  const mins = Math.max((logoutHour - loginHour) * 60, 15);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}小时${m}分` : `${m}分钟`;
}

function enrich(row: Api.Monitor.LoginInfor): Api.Monitor.LoginInfor {
  const riskAnalysis = buildRiskAnalysis(row);
  return {
    ...row,
    riskAnalysis,
    processRecords: [
      { time: row.loginTime, operatorName: '系统', action: '记录登录', remark: row.msg || '自动记录登录行为' },
      ...(row.loginStatus === 'FORCE_LOGOUT'
        ? [{ time: row.logoutTime || row.loginTime, operatorName: 'admin', action: '强制退出', remark: '管理员手动强制退出' }]
        : []),
      ...(row.loginStatus === 'LOCKED'
        ? [{ time: row.loginTime, operatorName: '系统', action: '自动锁定', remark: '失败次数达到阈值' }]
        : [])
    ]
  };
}

export let MOCK_LOGIN_LOGS: Api.Monitor.LoginInfor[] = SEEDS.map((seed, i) => {
  const user = USERS[seed.userIdx];
  const loginTime = i % 3 === 0 ? yesterdayStr(seed.loginHour) : todayStr(seed.loginHour, (i * 7) % 60);
  const logoutTime =
    seed.logoutHour != null
      ? todayStr(seed.logoutHour, 5)
      : seed.onlineFlag
        ? null
        : seed.loginStatus === 'SUCCESS' || seed.loginStatus === 'LOGGED_OUT'
          ? todayStr((seed.loginHour + 2) % 24, 10)
          : null;
  const row: Api.Monitor.LoginInfor = {
    infoId: i + 1,
    logNo: `LOG${String(i + 1).padStart(3, '0')}`,
    userName: user.userName,
    nickName: user.nickName,
    accountType: user.accountType,
    deptName: user.deptName,
    warehouseName: user.warehouseName,
    clientKey: `client-${user.userName}`,
    deviceType: seed.deviceType,
    loginPort: seed.loginPort,
    loginMethod: seed.loginMethod || 'PASSWORD',
    ipaddr: seed.ip,
    loginLocation: seed.location,
    browser: seed.browser,
    os: seed.os,
    loginTime,
    logoutTime,
    onlineDuration: formatDuration(seed.loginHour, seed.logoutHour) || (seed.onlineFlag ? '在线中' : null),
    loginStatus: seed.loginStatus,
    failReason: seed.failReason || null,
    riskLevel: seed.riskLevel,
    abnormalFlag: seed.abnormalFlag || false,
    onlineFlag: seed.onlineFlag || false,
    tokenId: seed.onlineFlag ? `tk-${1000 + i}` : null,
    msg: seed.msg || null,
    status: seed.loginStatus === 'SUCCESS' || seed.loginStatus === 'ONLINE' ? '0' : '1',
    phone: `138${String(10000000 + i).slice(-8)}`,
    email: `${user.userName}@forest-wms.com`,
    deviceId: `DEV-${user.userName}-${seed.deviceType}`,
    deviceFingerprint: `fp-${i + 1}-abc`,
    trustedDevice: !seed.abnormalFlag,
    isp: seed.ip.startsWith('192.') || seed.ip.startsWith('10.') ? '内网专线' : '公网 ISP',
    proxyFlag: seed.ip.startsWith('185.'),
    whitelistIp: seed.ip.startsWith('192.168.'),
    blacklistIp: seed.ip.startsWith('185.')
  };
  return enrich(row);
});

function isToday(time: string) {
  const today = new Date().toISOString().slice(0, 10);
  return time.startsWith(today);
}

function matchTab(row: Api.Monitor.LoginInfor, tab?: string | null) {
  if (!tab || tab === 'ALL') return true;
  if (tab === 'ABNORMAL') return row.abnormalFlag || row.loginStatus === 'ABNORMAL';
  if (tab === 'ONLINE') return row.onlineFlag || row.loginStatus === 'ONLINE';
  return row.loginStatus === tab;
}

function filterLogs(params?: Api.Monitor.LoginInforSearchParams) {
  let list = [...MOCK_LOGIN_LOGS];
  const p = params || {};
  if (p.tabKey) list = list.filter(r => matchTab(r, p.tabKey));
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
  if (p.loginStatus) list = list.filter(r => r.loginStatus === p.loginStatus);
  if (p.loginMethod) list = list.filter(r => r.loginMethod === p.loginMethod);
  if (p.loginPort) {
    const kw = String(p.loginPort).toLowerCase();
    list = list.filter(r => (r.loginPort || '').toLowerCase().includes(kw));
  }
  if (p.ipaddr) {
    const kw = String(p.ipaddr).toLowerCase();
    list = list.filter(r => (r.ipaddr || '').toLowerCase().includes(kw));
  }
  if (p.deviceType) {
    const kw = String(p.deviceType).toLowerCase();
    list = list.filter(r => String(r.deviceType || '').toLowerCase().includes(kw));
  }
  if (p.riskLevel) list = list.filter(r => r.riskLevel === p.riskLevel);
  if (p.params?.beginTime) list = list.filter(r => r.loginTime >= String(p.params!.beginTime));
  if (p.params?.endTime) list = list.filter(r => r.loginTime <= String(p.params!.endTime));
  return list;
}

export function getLoginLogStats(): Api.Monitor.LoginLogStats {
  const todayRows = MOCK_LOGIN_LOGS.filter(r => isToday(r.loginTime));
  const tabCounts = {
    ALL: MOCK_LOGIN_LOGS.length,
    SUCCESS: MOCK_LOGIN_LOGS.filter(r => r.loginStatus === 'SUCCESS').length,
    FAILED: MOCK_LOGIN_LOGS.filter(r => r.loginStatus === 'FAILED').length,
    ABNORMAL: MOCK_LOGIN_LOGS.filter(r => r.abnormalFlag || r.loginStatus === 'ABNORMAL').length,
    LOCKED: MOCK_LOGIN_LOGS.filter(r => r.loginStatus === 'LOCKED').length,
    ONLINE: MOCK_LOGIN_LOGS.filter(r => r.onlineFlag || r.loginStatus === 'ONLINE').length,
    LOGGED_OUT: MOCK_LOGIN_LOGS.filter(r => r.loginStatus === 'LOGGED_OUT').length
  };
  return {
    todayLogin: todayRows.length,
    success: todayRows.filter(r => r.loginStatus === 'SUCCESS' || r.loginStatus === 'ONLINE').length,
    failed: todayRows.filter(r => r.loginStatus === 'FAILED').length,
    abnormal: todayRows.filter(r => r.abnormalFlag || r.loginStatus === 'ABNORMAL').length,
    locked: MOCK_LOGIN_LOGS.filter(r => r.loginStatus === 'LOCKED').length,
    onlineUsers: MOCK_LOGIN_LOGS.filter(r => r.onlineFlag || r.loginStatus === 'ONLINE').length,
    tabCounts
  };
}

export function getLoginInforList(params?: Api.Monitor.LoginInforSearchParams) {
  return mockPage(filterLogs(params), params);
}

export function getLoginInforDetail(id: CommonType.IdType) {
  const row = MOCK_LOGIN_LOGS.find(r => String(r.infoId) === String(id));
  return row ? enrich(row) : null;
}

const ACTION_LABEL: Record<string, string> = {
  FORCE_LOGOUT: '强制退出',
  LOCK_ACCOUNT: '锁定账号',
  UNLOCK_ACCOUNT: '解锁账号',
  BLACKLIST_IP: '加入黑名单IP',
  WHITELIST_IP: '加入白名单IP',
  MARK_NORMAL: '标记正常'
};

export function executeLoginLogAction(body: Api.Monitor.LoginLogActionParams) {
  const ids = (body.infoIds || []).map(String);
  const now = todayStr(new Date().getHours(), new Date().getMinutes());
  MOCK_LOGIN_LOGS = MOCK_LOGIN_LOGS.map(row => {
    if (!ids.includes(String(row.infoId))) return row;
    const records = [...(row.processRecords || [])];
    const remark = body.remark || null;
    records.push({ time: now, operatorName: 'admin', action: ACTION_LABEL[body.action] || body.action, remark });
    if (body.action === 'FORCE_LOGOUT') {
      return enrich({
        ...row,
        loginStatus: 'FORCE_LOGOUT',
        onlineFlag: false,
        logoutTime: now,
        onlineDuration: row.onlineDuration === '在线中' ? '已强制结束' : row.onlineDuration,
        processRecords: records
      });
    }
    if (body.action === 'LOCK_ACCOUNT') {
      return enrich({ ...row, loginStatus: 'LOCKED', failReason: 'ACCOUNT_LOCKED', riskLevel: 'HIGH', processRecords: records });
    }
    if (body.action === 'UNLOCK_ACCOUNT') {
      return enrich({ ...row, loginStatus: 'SUCCESS', failReason: null, riskLevel: 'NORMAL', processRecords: records });
    }
    if (body.action === 'BLACKLIST_IP') {
      return enrich({ ...row, blacklistIp: true, whitelistIp: false, riskLevel: 'HIGH', processRecords: records });
    }
    if (body.action === 'WHITELIST_IP') {
      return enrich({ ...row, whitelistIp: true, blacklistIp: false, riskLevel: 'NORMAL', processRecords: records });
    }
    if (body.action === 'MARK_NORMAL') {
      return enrich({ ...row, abnormalFlag: false, riskLevel: 'NORMAL', loginStatus: row.onlineFlag ? 'ONLINE' : 'SUCCESS', processRecords: records });
    }
    return row;
  });
  const updated = MOCK_LOGIN_LOGS.filter(r => ids.includes(String(r.infoId)));
  return updated;
}

export function unlockLoginInfor(username: string) {
  MOCK_LOGIN_LOGS = MOCK_LOGIN_LOGS.map(row => {
    if (row.userName !== username) return row;
    if (row.loginStatus !== 'LOCKED') return row;
    const records = [...(row.processRecords || []), { time: todayStr(new Date().getHours(), 5), operatorName: 'admin', action: '解锁账号', remark: '管理员手动解锁' }];
    return enrich({ ...row, loginStatus: 'SUCCESS', failReason: null, riskLevel: 'NORMAL', processRecords: records });
  });
  return true;
}

export function deleteLoginInfor(ids: CommonType.IdType[]) {
  const idSet = new Set(ids.map(String));
  MOCK_LOGIN_LOGS = MOCK_LOGIN_LOGS.filter(r => !idSet.has(String(r.infoId)));
  return true;
}

export function cleanLoginInfor() {
  MOCK_LOGIN_LOGS = [];
  return true;
}
