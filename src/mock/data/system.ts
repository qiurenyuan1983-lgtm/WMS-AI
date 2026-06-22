import { fuzzyIncludes, fuzzyKeyword } from '../fuzzy-search';
import { mockPage, mockTree, nextId } from '../utils';
import { getAllMockDictTypes, getMockDictByType } from '../dict-data';
import { buildSystemMenuFlat, getAllSystemMenuIds, getSystemMenuIdsByModules } from './system-menu-seed';
import { appendOperLog } from './monitor-oper-log';
import { BUTTON_PERM_TEMPLATES } from '@/views/system/menu/constants';
import { matchIntlPhoneKeyword } from '@/utils/phone/intl-phone';

const NOW = '2026-06-01 10:00:00';

function filterRows<T extends Record<string, any>>(rows: T[], params?: Record<string, any>, rules?: Record<string, (row: T, v: string) => boolean>) {
  let list = [...rows];
  Object.entries(rules || {}).forEach(([key, fn]) => {
    const value = params?.[key];
    if (value !== undefined && value !== null && value !== '') {
      const normalized = fuzzyKeyword(value);
      list = list.filter(row => fn(row, normalized));
    }
  });
  const keyword = fuzzyKeyword(params?.keyword);
  if (keyword) {
    list = list.filter(row => Object.values(row).some(v => v != null && fuzzyIncludes(v, keyword)));
  }
  return list;
}

// ---------- 部门 ----------
export let MOCK_DEPTS = mockTree([
  {
    deptId: 100,
    parentId: 0,
    deptName: '\u6f14\u793a\u516c\u53f8',
    deptCategory: 'COMPANY',
    orderNum: 0,
    leader: '\u5f20\u603b',
    phone: '13800000000',
    email: 'ceo@demo.local',
    status: '0',
    createTime: NOW,
    children: [
      {
        deptId: 101,
        parentId: 100,
        deptName: '\u4ed3\u50a8\u90e8',
        deptCategory: 'DEPT',
        orderNum: 1,
        leader: '\u674e\u4ed3\u7ba1',
        phone: '13800000001',
        email: 'wh@demo.local',
        status: '0',
        createTime: NOW,
        children: [
          {
            deptId: 111,
            parentId: 101,
            deptName: '\u6536\u8d27\u7ec4',
            deptCategory: 'TEAM',
            orderNum: 1,
            leader: '\u738b\u6536\u8d27',
            status: '0',
            createTime: NOW,
            children: []
          },
          {
            deptId: 112,
            parentId: 101,
            deptName: '\u51fa\u5e93\u7ec4',
            deptCategory: 'TEAM',
            orderNum: 2,
            leader: '\u8d75\u51fa\u5e93',
            status: '0',
            createTime: NOW,
            children: []
          }
        ]
      },
      {
        deptId: 102,
        parentId: 100,
        deptName: '\u8fd0\u8425\u90e8',
        deptCategory: 'DEPT',
        orderNum: 2,
        leader: '\u9648\u8fd0\u8425',
        status: '0',
        createTime: NOW,
        children: []
      },
      {
        deptId: 103,
        parentId: 100,
        deptName: 'IT \u90e8',
        deptCategory: 'DEPT',
        orderNum: 3,
        leader: '\u5218\u6280\u672f',
        status: '0',
        createTime: NOW,
        children: []
      }
    ]
  }
]);

function flattenDepts(nodes: typeof MOCK_DEPTS, acc: any[] = []) {
  nodes.forEach(node => {
    acc.push(node);
    if (node.children?.length) flattenDepts(node.children, acc);
  });
  return acc;
}

function findDeptName(deptId?: CommonType.IdType | null) {
  if (deptId == null) return '';
  return flattenDepts(MOCK_DEPTS).find(d => String(d.deptId) === String(deptId))?.deptName || '';
}

function toDeptTreeSelect(nodes: typeof MOCK_DEPTS): any[] {
  return nodes.map(node => ({
    id: node.deptId,
    label: node.deptName,
    key: node.deptId,
    deptId: node.deptId,
    deptName: node.deptName,
    children: node.children?.length ? toDeptTreeSelect(node.children) : undefined
  }));
}

// ---------- 岗位 ----------
export let MOCK_POSTS: Api.System.Post[] = [
  { postId: 1, tenantId: '000000', postCode: 'CEO', postCategory: 'MGT', postName: '\u603b\u7ecf\u7406', postSort: 1, status: '0', remark: '', createTime: NOW, deptId: 100 },
  { postId: 2, tenantId: '000000', postCode: 'WH_MGR', postCategory: 'WH', postName: '\u4ed3\u5e93\u7ecf\u7406', postSort: 2, status: '0', remark: '', createTime: NOW, deptId: 101 },
  { postId: 3, tenantId: '000000', postCode: 'INBOUND', postCategory: 'WH', postName: '\u6536\u8d27\u5458', postSort: 3, status: '0', remark: '', createTime: NOW, deptId: 111 },
  { postId: 4, tenantId: '000000', postCode: 'OUTBOUND', postCategory: 'WH', postName: '\u51fa\u5e93\u5458', postSort: 4, status: '0', remark: '', createTime: NOW, deptId: 112 },
  { postId: 5, tenantId: '000000', postCode: 'OMS_OP', postCategory: 'OPS', postName: 'OMS \u8fd0\u8425', postSort: 5, status: '0', remark: '', createTime: NOW, deptId: 102 },
  { postId: 6, tenantId: '000000', postCode: 'DEV', postCategory: 'IT', postName: '\u5f00\u53d1\u5de5\u7a0b\u5e08', postSort: 6, status: '0', remark: '', createTime: NOW, deptId: 103 }
];

// ---------- 角色 ----------
export let MOCK_ROLES: Api.System.Role[] = [
  {
    roleId: 1,
    roleName: '\u8d85\u7ea7\u7ba1\u7406\u5458',
    roleKey: 'admin',
    roleSort: 1,
    dataScope: '1',
    menuCheckStrictly: true,
    deptCheckStrictly: true,
    status: '0',
    superAdmin: true,
    flag: false,
    remark: '\u5168\u90e8\u6743\u9650',
    createTime: NOW
  },
  {
    roleId: 2,
    roleName: 'WMS \u4ed3\u50a1\u7ecf\u7406',
    roleKey: 'wms_manager',
    roleSort: 2,
    dataScope: '4',
    menuCheckStrictly: true,
    deptCheckStrictly: true,
    status: '0',
    superAdmin: false,
    flag: false,
    remark: null,
    createTime: NOW
  },
  {
    roleId: 3,
    roleName: 'OMS \u8fd0\u8425',
    roleKey: 'oms_operator',
    roleSort: 3,
    dataScope: '3',
    menuCheckStrictly: true,
    deptCheckStrictly: true,
    status: '0',
    superAdmin: false,
    flag: false,
    remark: null,
    createTime: NOW
  },
  {
    roleId: 4,
    roleName: '\u666e\u901a\u89d2\u8272',
    roleKey: 'common',
    roleSort: 4,
    dataScope: '5',
    menuCheckStrictly: true,
    deptCheckStrictly: true,
    status: '0',
    superAdmin: false,
    flag: false,
    remark: null,
    createTime: NOW
  }
];

export let MOCK_ROLE_MENUS: Record<number, number[]> = {};

function initRoleMenuBindings() {
  const allMenuIds = getAllSystemMenuIds(MENU_FLAT);
  MOCK_ROLE_MENUS[1] = allMenuIds;
  MOCK_ROLE_MENUS[2] = getSystemMenuIdsByModules(['system', 'base', 'wms'], MENU_FLAT);
  MOCK_ROLE_MENUS[3] = getSystemMenuIdsByModules(['system', 'base', 'oms'], MENU_FLAT);
  MOCK_ROLE_MENUS[4] = getSystemMenuIdsByModules(['system'], MENU_FLAT);
}

const MOCK_ROLE_DEPTS: Record<number, number[]> = {
  1: [100, 101, 102, 103, 111, 112],
  2: [101, 111, 112],
  3: [102],
  4: [103]
};

export let MOCK_ROLE_USERS: Record<number, number[]> = {
  1: [1],
  2: [2, 3],
  3: [4],
  4: [5]
};

// ---------- 用户 ----------
export let MOCK_USERS: Api.System.User[] = [
  {
    userId: 1,
    deptId: 103,
    deptName: 'IT \u90e8',
    userName: 'admin',
    nickName: '\u539f\u578b\u7ba1\u7406\u5458',
    userType: 'sys_user',
    email: 'admin@demo.local',
    phonenumber: '13800000000',
    phoneCountryCode: '+86',
    sex: '0',
    avatar: '',
    password: '',
    status: '0',
    loginIp: '127.0.0.1',
    loginDate: NOW as unknown as Date,
    remark: null,
    createTime: NOW
  },
  {
    userId: 2,
    deptId: 101,
    deptName: '\u4ed3\u50a8\u90e8',
    userName: 'wms_mgr',
    nickName: '\u4ed3\u5e93\u7ecf\u7406\u5458',
    userType: 'sys_user',
    email: 'wms@demo.local',
    phonenumber: '13800000002',
    phoneCountryCode: '+86',
    sex: '0',
    avatar: '',
    password: '',
    status: '0',
    loginIp: '127.0.0.1',
    loginDate: NOW as unknown as Date,
    remark: null,
    createTime: NOW
  },
  {
    userId: 3,
    deptId: 111,
    deptName: '\u6536\u8d27\u7ec4',
    userName: 'inbound01',
    nickName: '\u6536\u8d27\u5458\u5c0f\u738b',
    userType: 'sys_user',
    email: 'inbound@demo.local',
    phonenumber: '13800000003',
    phoneCountryCode: '+86',
    sex: '0',
    avatar: '',
    password: '',
    status: '0',
    loginIp: '',
    loginDate: NOW as unknown as Date,
    remark: null,
    createTime: NOW
  },
  {
    userId: 4,
    deptId: 102,
    deptName: '\u8fd0\u8425\u90e8',
    userName: 'oms01',
    nickName: 'OMS \u8fd0\u8425\u674e',
    userType: 'sys_user',
    email: 'oms@demo.local',
    phonenumber: '6265550303',
    phoneCountryCode: '+1',
    sex: '1',
    avatar: '',
    password: '',
    status: '0',
    loginIp: '',
    loginDate: NOW as unknown as Date,
    remark: null,
    createTime: NOW
  },
  {
    userId: 5,
    deptId: 103,
    deptName: 'IT \u90e8',
    userName: 'demo',
    nickName: '\u6f14\u793a\u7528\u6237',
    userType: 'sys_user',
    email: 'demo@demo.local',
    phonenumber: '13800000005',
    phoneCountryCode: '+86',
    sex: '2',
    avatar: '',
    password: '',
    status: '0',
    loginIp: '',
    loginDate: NOW as unknown as Date,
    remark: null,
    createTime: NOW
  },
  {
    userId: 6,
    deptId: 112,
    deptName: '\u51fa\u5e93\u7ec4',
    userName: 'outbound01',
    nickName: '\u51fa\u5e93\u5458\u5c0f\u8d75',
    userType: 'sys_user',
    email: 'outbound@demo.local',
    phonenumber: '13800000006',
    phoneCountryCode: '+86',
    sex: '0',
    avatar: '',
    password: '',
    status: '0',
    loginIp: '',
    loginDate: NOW as unknown as Date,
    remark: null,
    createTime: NOW
  },
  {
    userId: 7,
    deptId: 102,
    deptName: '\u8fd0\u8425\u90e8',
    userName: 'cs01',
    nickName: '\u5ba2\u670d\u5c0f\u9648',
    userType: 'sys_user',
    email: 'cs@demo.local',
    phonenumber: '91234567',
    phoneCountryCode: '+852',
    sex: '1',
    avatar: '',
    password: '',
    status: '1',
    loginIp: '',
    loginDate: NOW as unknown as Date,
    remark: '\u505c\u7528\u793a\u4f8b',
    createTime: NOW
  }
];

export const MOCK_USER_ROLES: Record<number, number[]> = {
  1: [1],
  2: [2],
  3: [2],
  4: [3],
  5: [4],
  6: [2],
  7: [4]
};

export const MOCK_USER_WAREHOUSES: Record<number, number[]> = {
  1: [5000001, 5000002],
  2: [5000001, 5000002],
  3: [5000001],
  4: [5000002],
  5: [5000001],
  6: [5000001],
  7: [5000002]
};

export const MOCK_USER_ACCOUNT_TYPE: Record<number, string> = {
  1: 'INTERNAL',
  2: 'INTERNAL',
  3: 'PDA',
  4: 'INTERNAL',
  5: 'INTERNAL',
  6: 'PDA',
  7: 'EXTERNAL'
};

export const MOCK_USER_POSTS: Record<number, number[]> = {
  1: [6],
  2: [2],
  3: [3],
  4: [5],
  5: [6],
  6: [4],
  7: [5]
};

function syncUserDeptNames() {
  MOCK_USERS.forEach(user => {
    user.deptName = findDeptName(user.deptId);
  });
}
syncUserDeptNames();

// ---------- 菜单（含全量功能按钮 + 字段显示） ----------
let menuFlatInitialized = false;

/** 延迟构建全量菜单，避免应用启动时同步阻塞白屏 */
export function getMenuFlat(): Api.System.Menu[] {
  if (!menuFlatInitialized) {
    menuFlatInitialized = true;
    MENU_FLAT = buildSystemMenuFlat();
    MOCK_MENUS = mockTree(buildMenuTree(MENU_FLAT));
    initRoleMenuBindings();
  }
  return MENU_FLAT;
}

export let MENU_FLAT: Api.System.Menu[] = [];

export let MOCK_MENUS: Api.System.Menu[] = [];

function rebuildMockMenus() {
  getMenuFlat();
  MOCK_MENUS = mockTree(buildMenuTree(MENU_FLAT));
}

function buildMenuTree(flat: Api.System.Menu[], parentId: CommonType.IdType = 0): Api.System.Menu[] {
  return flat
    .filter(item => String(item.parentId) === String(parentId))
    .sort((a, b) => (a.orderNum ?? 0) - (b.orderNum ?? 0))
    .map(item => ({
      ...item,
      children: buildMenuTree(flat, item.menuId)
    }));
}

function flattenMenus(nodes: Api.System.Menu[], acc: Api.System.Menu[] = []) {
  nodes.forEach(node => {
    acc.push(node);
    if (node.children?.length) flattenMenus(node.children, acc);
  });
  return acc;
}

function toMenuTreeSelect(nodes: Api.System.Menu[]): Api.System.MenuList {
  return nodes.map(node => ({
    ...node,
    id: node.menuId,
    label: node.menuName,
    children: node.children?.length ? toMenuTreeSelect(node.children) : undefined
  })) as Api.System.MenuList;
}

// ---------- 参数配置 ----------
export let MOCK_CONFIGS: Api.System.Config[] = [
  { configId: 1, configName: '\u4e3b\u6846\u67b6\u9875', configKey: 'sys.index.skinName', configValue: 'skin-blue', configType: 'Y', remark: '\u84dd\u8272 skin-blue', createTime: NOW },
  { configId: 2, configName: '\u7528\u6237\u7ba1\u7406-\u8d26\u53f7\u521d\u59cb\u5bc6\u7801', configKey: 'sys.user.initPassword', configValue: '123456', configType: 'Y', remark: null, createTime: NOW },
  { configId: 3, configName: '\u4e3b\u6846\u67b6\u9875-\u4fa7\u8fb9\u680f\u5c55\u5f00', configKey: 'sys.index.sideTheme', configValue: 'theme-dark', configType: 'Y', remark: null, createTime: NOW },
  { configId: 4, configName: '\u8d26\u53f7\u81ea\u52a9-\u662f\u5426\u5f00\u542f', configKey: 'sys.account.registerUser', configValue: 'false', configType: 'Y', remark: null, createTime: NOW },
  { configId: 5, configName: '\u7528\u6237\u767b\u5f55-\u9ed1\u540d\u5355', configKey: 'sys.login.blackIPList', configValue: '', configType: 'N', remark: '\u591a\u4e2a IP \u9017\u53f7\u5206\u9694', createTime: NOW },
  { configId: 6, configName: 'WMS \u9ed8\u8ba4\u4ed3\u5e93', configKey: 'wms.default.warehouseId', configValue: '5000001', configType: 'N', remark: '\u539f\u578b\u6f14\u793a', createTime: NOW },
  { configId: 7, configName: 'OMS \u8ba2\u5355\u53f7\u524d\u7f00', configKey: 'oms.order.prefix', configValue: 'CO', configType: 'N', remark: null, createTime: NOW },
  { configId: 8, configName: '\u6587\u4ef6\u4e0a\u4f20\u5927\u5c0f\u9650\u5236(MB)', configKey: 'sys.upload.maxSize', configValue: '50', configType: 'N', remark: null, createTime: NOW }
];

// ---------- 通知公告 ----------
export let MOCK_NOTICES: Api.System.Notice[] = [
  { noticeId: 1, noticeTitle: '\u7cfb\u7edf\u5347\u7ea7\u516c\u544a', noticeType: '2', noticeContent: '<p>WMS \u539f\u578b\u73af\u5883\u5df2\u5347\u7ea7\uff0c\u8bf7\u786c\u5237\u9875\u9762\u540e\u4f53\u9a8c\u3002</p>', status: '0', remark: null, createBy: 'admin', createTime: NOW },
  { noticeId: 2, noticeTitle: '\u6536\u8d27\u65f6\u95f4\u8c03\u6574', noticeType: '1', noticeContent: '<p>\u5468\u672b\u6536\u8d27\u622a\u6b62\u65f6\u95f4\u8c03\u6574\u4e3a 16:00\u3002</p>', status: '0', remark: null, createBy: 'admin', createTime: NOW },
  { noticeId: 3, noticeTitle: 'PDA \u4f5c\u4e1a\u6307\u5f15', noticeType: '1', noticeContent: '<p>\u8bf7\u4f7f\u7528\u6700\u65b0\u7248 PDA \u5165\u5e93/\u51fa\u5e93\u6d41\u7a0b\u3002</p>', status: '0', remark: null, createBy: 'wms_mgr', createTime: NOW },
  { noticeId: 4, noticeTitle: '\u5b89\u5168\u63d0\u793a', noticeType: '2', noticeContent: '<p>\u8bf7\u5b9a\u671f\u4fee\u6539\u767b\u5f55\u5bc6\u7801\u3002</p>', status: '0', remark: null, createBy: 'admin', createTime: NOW },
  { noticeId: 5, noticeTitle: '\u505c\u7528\u516c\u544a\u793a\u4f8b', noticeType: '1', noticeContent: '<p>\u505c\u7528\u72b6\u6001\u793a\u4f8b\u3002</p>', status: '1', remark: null, createBy: 'admin', createTime: NOW }
];

// ---------- 租户 / 套餐 ----------
export let MOCK_TENANT_PACKAGES: Api.System.TenantPackage[] = [
  {
    packageId: 1,
    packageName: '\u6807\u51c6\u7248',
    menuIds: getSystemMenuIdsByModules(['system'], MENU_FLAT),
    remark: '\u57fa\u7840\u529f\u80fd',
    status: '0',
    createTime: NOW
  },
  {
    packageId: 2,
    packageName: 'WMS \u4e13\u4e1a\u7248',
    menuIds: getSystemMenuIdsByModules(['system', 'base', 'wms'], MENU_FLAT),
    remark: '\u542b WMS \u4e1a\u52a1\u83dc\u5355',
    status: '0',
    createTime: NOW
  },
  {
    packageId: 3,
    packageName: '\u5168\u529f\u80fd\u7248',
    menuIds: getAllSystemMenuIds(MENU_FLAT),
    remark: null,
    status: '0',
    createTime: NOW
  }
];

export let MOCK_TENANTS: Api.System.Tenant[] = [
  { id: 1, tenantId: '000000', contactUserName: '\u7cfb\u7edf\u7ba1\u7406\u5458', contactPhone: '13800000000', contactPhoneCountryCode: '+86', companyName: '\u6f14\u793a\u79df\u6237', licenseNumber: '', address: '\u6d1b\u6749\u77f6', intro: '\u9ed8\u8ba4\u79df\u6237', domain: '', remark: null, packageId: 3, expireTime: '2099-12-31 23:59:59', accountCount: 100, status: '0', createTime: NOW },
  { id: 2, tenantId: '100001', contactUserName: '\u738b\u7ecf\u7406', contactPhone: '6265550100', contactPhoneCountryCode: '+1', companyName: 'Demo Logistics LLC', licenseNumber: '', address: 'CA, USA', intro: null, domain: 'demo.wms.local', remark: null, packageId: 2, expireTime: '2027-12-31 23:59:59', accountCount: 50, status: '0', createTime: NOW },
  { id: 3, tenantId: '100002', contactUserName: '\u674e\u8d1f\u8d23', contactPhone: '91234567', contactPhoneCountryCode: '+852', companyName: 'Trial Tenant', licenseNumber: '', address: '', intro: '\u8bd5\u7528\u79df\u6237', domain: '', remark: null, packageId: 1, expireTime: '2026-12-31 23:59:59', accountCount: 10, status: '1', createTime: NOW }
];

// ---------- 客户端 ----------
export let MOCK_CLIENTS: Api.System.Client[] = [
  { id: 1, clientId: 'web', clientKey: 'web', clientSecret: '******', grantType: 'password', grantTypeList: ['password'], deviceType: 'pc', activeTimeout: 1800, timeout: 604800, status: '0', delFlag: '0', remark: 'PC \u7aef', createTime: NOW },
  { id: 2, clientId: 'pda', clientKey: 'pda', clientSecret: '******', grantType: 'password', grantTypeList: ['password'], deviceType: 'android', activeTimeout: 3600, timeout: 604800, status: '0', delFlag: '0', remark: 'PDA \u7aef', createTime: NOW },
  { id: 3, clientId: 'supplier_portal', clientKey: 'supplier', clientSecret: '******', grantType: 'client_credentials', grantTypeList: ['client_credentials'], deviceType: 'pc', activeTimeout: 1800, timeout: 86400, status: '1', delFlag: '0', remark: '\u505c\u7528\u793a\u4f8b', createTime: NOW }
];

// ---------- OSS ----------
export let MOCK_OSS_FILES: Api.System.Oss[] = [
  { ossId: 1, fileName: 'inbound-template.xlsx', originalName: '\u5165\u5e93\u5bfc\u5165\u6a21\u677f.xlsx', fileSuffix: '.xlsx', url: 'https://mock.local/files/inbound-template.xlsx', createBy: 'admin', service: 'mock', createTime: NOW },
  { ossId: 2, fileName: 'location-template.xlsx', originalName: '\u5e93\u4f4d\u5bfc\u5165\u6a21\u677f.xlsx', fileSuffix: '.xlsx', url: 'https://mock.local/files/location-template.xlsx', createBy: 'wms_mgr', service: 'mock', createTime: NOW },
  { ossId: 3, fileName: 'pallet-label.pdf', originalName: '\u5361\u677f\u8d34\u6837\u672c.pdf', fileSuffix: '.pdf', url: 'https://mock.local/files/pallet-label.pdf', createBy: 'admin', service: 'mock', createTime: NOW },
  { ossId: 4, fileName: 'warehouse-photo.jpg', originalName: '\u4ed3\u5e93\u73b0\u573a.jpg', fileSuffix: '.jpg', url: 'https://mock.local/files/warehouse-photo.jpg', createBy: 'inbound01', service: 'mock', createTime: NOW },
  { ossId: 5, fileName: 'notice-banner.png', originalName: '\u516c\u544a\u6a2a\u5e45.png', fileSuffix: '.png', url: 'https://mock.local/files/notice-banner.png', createBy: 'admin', service: 'mock', createTime: NOW }
];

export let MOCK_OSS_CONFIGS: Api.System.OssConfig[] = [
  { ossConfigId: 1, configKey: 'mock', accessKey: 'mock-ak', secretKey: '******', bucketName: 'wms-demo', prefix: 'upload/', endpoint: 'https://mock.local', domain: 'https://mock.local', isHttps: 'Y', region: 'us-west-1', accessPolicy: '1', status: '0', remark: '\u539f\u578b\u9ed8\u8ba4', createTime: NOW },
  { ossConfigId: 2, configKey: 'minio', accessKey: 'minioadmin', secretKey: '******', bucketName: 'wms-files', prefix: 'prod/', endpoint: 'http://127.0.0.1:9000', domain: '', isHttps: 'N', region: '', accessPolicy: '1', status: '1', remark: '\u505c\u7528\u793a\u4f8b', createTime: NOW }
];

// ---------- 字典（可变副本） ----------
let dictTypeRows = getAllMockDictTypes().map((type, i) => ({
  dictId: i + 1,
  dictName: type,
  dictType: type,
  status: '0',
  remark: 'Mock \u5b57\u5178',
  createTime: NOW
}));

const dictDataStore: Record<string, Api.System.DictData[]> = Object.fromEntries(
  getAllMockDictTypes().map(type => [type, getMockDictByType(type).map(row => ({ ...row }))])
);

export const MOCK_ORG_SCOPE = {
  companies: [{ companyId: 4000001, companyCode: 'DEMO', companyName: '\u6f14\u793a\u7269\u6d41\u516c\u53f8' }],
  warehouses: [
    { warehouseId: 5000001, warehouseCode: 'WH-LA-01', warehouseName: '\u6d1b\u6749\u77f6\u4e00\u53f7\u4ed3' },
    { warehouseId: 5000002, warehouseCode: 'WH-NJ-01', warehouseName: '\u65b0\u6cfd\u897f\u4e00\u53f7\u4ed3' }
  ],
  current: { companyId: 4000001, warehouseId: 5000001, companyName: '\u6f14\u793a\u7269\u6d41\u516c\u53f8', warehouseName: '\u6d1b\u6749\u77f6\u4e00\u53f7\u4ed3' }
};

// ---------- 查询 ----------
export function getUserList(params?: Record<string, any>) {
  let rows = [...MOCK_USERS];
  if (params?.deptId != null && params.deptId !== '') {
    const target = String(params.deptId);
    rows = rows.filter(u => String(u.deptId) === target);
  }
  if (params?.roleId != null && params.roleId !== '') {
    rows = rows.filter(u => (MOCK_USER_ROLES[Number(u.userId)] || []).includes(Number(params.roleId)));
  }
  if (params?.warehouseId != null && params.warehouseId !== '') {
    rows = rows.filter(u => (MOCK_USER_WAREHOUSES[Number(u.userId)] || []).includes(Number(params.warehouseId)));
  }
  if (params?.accountType != null && params.accountType !== '') {
    rows = rows.filter(u => (MOCK_USER_ACCOUNT_TYPE[Number(u.userId)] || 'INTERNAL') === params.accountType);
  }
  if (params?.postId != null && params.postId !== '') {
    rows = rows.filter(u => (MOCK_USER_POSTS[Number(u.userId)] || []).includes(Number(params.postId)));
  }
  const keyword = fuzzyKeyword(params?.keyword);
  if (keyword) {
    rows = rows.filter(u =>
      [u.userName, u.email, u.nickName].some(v => fuzzyIncludes(v, keyword)) ||
      matchIntlPhoneKeyword(u.phonenumber, u.phoneCountryCode, keyword)
    );
  }
  rows = filterRows(rows, params, {
    userName: (row, v) => fuzzyIncludes(row.userName, v),
    nickName: (row, v) => fuzzyIncludes(row.nickName, v),
    phonenumber: (row, v) => fuzzyIncludes(row.phonenumber, v) || matchIntlPhoneKeyword(row.phonenumber, row.phoneCountryCode, v),
    status: (row, v) => row.status === v
  });
  const page = mockPage(rows, params);
  page.rows = page.rows.map(enrichUserWorkbenchRow);
  return page;
}

export function enrichUserWorkbenchRow(user: Api.System.User) {
  const roleIds = MOCK_USER_ROLES[Number(user.userId)] || [];
  const roleNames = roleIds.map(id => MOCK_ROLES.find(r => r.roleId === id)?.roleName).filter(Boolean) as string[];
  const postIds = MOCK_USER_POSTS[Number(user.userId)] || [];
  const postName = postIds.map(id => MOCK_POSTS.find(p => p.postId === id)?.postName).filter(Boolean).join('、') || '-';
  const whIds = MOCK_USER_WAREHOUSES[Number(user.userId)] || [];
  const accountType = MOCK_USER_ACCOUNT_TYPE[Number(user.userId)] || 'INTERNAL';
  const accountLabels: Record<string, string> = {
    INTERNAL: '内部员工',
    EXTERNAL: '外部协作',
    PDA: 'PDA 账号',
    DRIVER: '司机账号'
  };
  const warehouseLabel = whIds.length
    ? whIds
        .map(id => MOCK_ORG_SCOPE.warehouses.find(w => w.warehouseId === id)?.warehouseName)
        .filter(Boolean)
        .join('、')
    : '未授权';

  return {
    ...user,
    roleNames,
    roleIds,
    postName,
    warehouseLabel,
    accountType,
    accountTypeLabel: accountLabels[accountType] || accountType,
    lastLoginTime: user.loginDate ? String(user.loginDate) : '-'
  };
}

export function getRoleList(params?: Record<string, any>) {
  const rows = filterRows(MOCK_ROLES, params, {
    roleName: (row, v) => fuzzyIncludes(row.roleName, v),
    roleKey: (row, v) => fuzzyIncludes(row.roleKey, v),
    status: (row, v) => row.status === v
  });
  return mockPage(rows, params);
}

export function getDeptList(params?: Record<string, any>) {
  const flat = flattenDepts(MOCK_DEPTS).map(({ children, ...rest }) => rest);
  return filterRows(flat, params, {
    deptName: (row, v) => fuzzyIncludes(row.deptName, v),
    status: (row, v) => row.status === v
  });
}

export function getDeptTreeSelect() {
  return toDeptTreeSelect(MOCK_DEPTS);
}

export function getMenuList(params?: Record<string, any>) {
  let rows = [...MENU_FLAT];

  if (params?.parentId != null && params.parentId !== '') {
    rows = rows.filter(item => String(item.parentId) === String(params.parentId));
  }
  if (params?.menuType) {
    rows = rows.filter(item => item.menuType === params.menuType);
  }

  rows = filterRows(rows, params, {
    menuName: (row, v) => fuzzyIncludes(row.menuName, v),
    status: (row, v) => row.status === v
  });

  if (params?.parentId != null && params.parentId !== '') {
    return rows.sort((a, b) => (a.orderNum ?? 0) - (b.orderNum ?? 0));
  }

  return mockTree(buildMenuTree(rows, 0));
}

export function getMenuTreeSelect() {
  return toMenuTreeSelect(MOCK_MENUS);
}

export function getRoleMenuTreeSelect(roleId: CommonType.IdType) {
  return {
    checkedKeys: [...(MOCK_ROLE_MENUS[Number(roleId)] || [])],
    menus: toMenuTreeSelect(MOCK_MENUS)
  };
}

export function getRoleDeptTreeSelect(roleId: CommonType.IdType) {
  return {
    checkedKeys: [...(MOCK_ROLE_DEPTS[Number(roleId)] || [])],
    depts: MOCK_DEPTS
  };
}

export function getTenantPackageMenuTreeSelect(packageId: CommonType.IdType) {
  const pkg = MOCK_TENANT_PACKAGES.find(p => String(p.packageId) === String(packageId));
  const checkedKeys = Array.isArray(pkg?.menuIds)
    ? pkg!.menuIds.map(Number)
    : String(pkg?.menuIds || '')
        .split(',')
        .filter(Boolean)
        .map(Number);
  return { checkedKeys, menus: toMenuTreeSelect(MOCK_MENUS) };
}

export function getRoleAllocatedUsers(params?: Record<string, any>) {
  const roleId = Number(params?.roleId);
  const userIds = new Set((MOCK_ROLE_USERS[roleId] || []).map(String));
  const rows = MOCK_USERS.filter(u => userIds.has(String(u.userId)));
  return mockPage(rows, params);
}

export function getPostList(params?: Record<string, any>) {
  const rows = filterRows(MOCK_POSTS, params, {
    postCode: (row, v) => fuzzyIncludes(row.postCode, v),
    postName: (row, v) => fuzzyIncludes(row.postName, v),
    status: (row, v) => row.status === v
  });
  return mockPage(rows, params);
}

export function getConfigList(params?: Record<string, any>) {
  const rows = filterRows(MOCK_CONFIGS, params, {
    configName: (row, v) => fuzzyIncludes(row.configName, v),
    configKey: (row, v) => fuzzyIncludes(row.configKey, v),
    configType: (row, v) => row.configType === v
  });
  return mockPage(rows, params);
}

export function getNoticeList(params?: Record<string, any>) {
  const rows = filterRows(MOCK_NOTICES, params, {
    noticeTitle: (row, v) => fuzzyIncludes(row.noticeTitle, v),
    noticeType: (row, v) => row.noticeType === v,
    status: (row, v) => row.status === v
  });
  return mockPage(rows, params);
}

export function getTenantList(params?: Record<string, any>) {
  const rows = filterRows(MOCK_TENANTS, params, {
    companyName: (row, v) => fuzzyIncludes(row.companyName, v),
    contactPhone: (row, v) => matchIntlPhoneKeyword(row.contactPhone, row.contactPhoneCountryCode, v),
    status: (row, v) => row.status === v
  });
  return mockPage(rows, params);
}

export function getTenantPackageList(params?: Record<string, any>) {
  const rows = filterRows(MOCK_TENANT_PACKAGES, params, {
    packageName: (row, v) => fuzzyIncludes(row.packageName, v),
    status: (row, v) => row.status === v
  });
  return mockPage(rows, params);
}

export function getClientList(params?: Record<string, any>) {
  const rows = filterRows(MOCK_CLIENTS, params, {
    clientId: (row, v) => fuzzyIncludes(row.clientId, v),
    clientKey: (row, v) => fuzzyIncludes(row.clientKey, v),
    status: (row, v) => row.status === v
  });
  return mockPage(rows, params);
}

export function getOssList(params?: Record<string, any>) {
  const rows = filterRows(MOCK_OSS_FILES, params, {
    fileName: (row, v) => fuzzyIncludes(row.fileName, v),
    originalName: (row, v) => fuzzyIncludes(row.originalName, v)
  });
  return mockPage(rows, params);
}

export function getOssConfigList(params?: Record<string, any>) {
  const rows = filterRows(MOCK_OSS_CONFIGS, params, {
    configKey: (row, v) => fuzzyIncludes(row.configKey, v),
    status: (row, v) => row.status === v
  });
  return mockPage(rows, params);
}

export function getDictTypeList(params?: Record<string, any>) {
  const rows = filterRows(dictTypeRows, params, {
    dictName: (row, v) => fuzzyIncludes(row.dictName, v),
    dictType: (row, v) => fuzzyIncludes(row.dictType, v),
    status: (row, v) => row.status === v
  });
  return mockPage(rows, params);
}

export function getDictDataList(params?: Record<string, any>) {
  const dictType = params?.dictType;
  let rows = dictType ? [...(dictDataStore[String(dictType)] || [])] : Object.values(dictDataStore).flat();
  rows = filterRows(rows, params, {
    dictLabel: (row, v) => fuzzyIncludes(row.dictLabel, v),
    status: (row, v) => row.status === v
  });
  return mockPage(rows, params);
}

export function getUserDetail(userId?: CommonType.IdType) {
  if (userId == null || userId === '') {
    return { postIds: [], roleIds: [], roles: MOCK_ROLES };
  }
  return {
    postIds: (MOCK_USER_POSTS[Number(userId)] || []).map(String),
    roleIds: (MOCK_USER_ROLES[Number(userId)] || []).map(String),
    roles: MOCK_ROLES
  };
}

export function getAuthRole(userId: CommonType.IdType) {
  const user = MOCK_USERS.find(u => String(u.userId) === String(userId));
  const roleIds = new Set((MOCK_USER_ROLES[Number(userId)] || []).map(String));
  return {
    user,
    roles: MOCK_ROLES.map(role => ({ ...role, flag: roleIds.has(String(role.roleId)) }))
  };
}

// ---------- 写入 ----------
function removeByIds<T extends Record<string, any>>(rows: T[], ids: string, idField: string) {
  const idSet = new Set(ids.split(','));
  return rows.filter(row => !idSet.has(String(row[idField])));
}

export function createUser(data: Api.System.UserOperateParams) {
  const userId = nextId();
  const user: Api.System.User = {
    userId,
    deptId: data.deptId!,
    deptName: findDeptName(data.deptId),
    userName: data.userName!,
    nickName: data.nickName!,
    userType: 'sys_user',
    email: data.email || '',
    phonenumber: data.phonenumber || '',
    phoneCountryCode: data.phoneCountryCode || '+86',
    sex: data.sex || '0',
    avatar: '',
    password: '',
    status: data.status || '0',
    loginIp: '',
    loginDate: NOW as unknown as Date,
    remark: data.remark ?? null,
    createTime: NOW
  };
  MOCK_USERS.unshift(user);
  MOCK_USER_ROLES[userId] = (data.roleIds || []).map(Number);
  MOCK_USER_POSTS[userId] = (data.postIds || []).map(Number);
  return user;
}

export function updateUser(data: Api.System.UserOperateParams) {
  const idx = MOCK_USERS.findIndex(u => String(u.userId) === String(data.userId));
  if (idx >= 0) {
    Object.assign(MOCK_USERS[idx], data, { deptName: findDeptName(data.deptId) });
    if (data.roleIds) MOCK_USER_ROLES[Number(data.userId)] = data.roleIds.map(Number);
    if (data.postIds) MOCK_USER_POSTS[Number(data.userId)] = data.postIds.map(Number);
  }
}

export function deleteUsers(ids: string) {
  MOCK_USERS = removeByIds(MOCK_USERS, ids, 'userId');
}

export function updateUserStatus(userId: CommonType.IdType, status: string) {
  const user = MOCK_USERS.find(u => String(u.userId) === String(userId));
  if (user) user.status = status as Api.System.User['status'];
}

export function authUserRole(userId: CommonType.IdType, roleIds: CommonType.IdType[]) {
  MOCK_USER_ROLES[Number(userId)] = roleIds.map(Number);
}

export function updateUserWarehouses(userId: CommonType.IdType, warehouseIds: CommonType.IdType[]) {
  MOCK_USER_WAREHOUSES[Number(userId)] = warehouseIds.map(Number);
}

export function createRole(data: Api.System.RoleOperateParams) {
  const roleId = nextId();
  const row: Api.System.Role = {
    roleId,
    roleName: data.roleName!,
    roleKey: data.roleKey!,
    roleSort: data.roleSort ?? 1,
    dataScope: data.dataScope || '1',
    menuCheckStrictly: data.menuCheckStrictly ?? true,
    deptCheckStrictly: data.deptCheckStrictly ?? true,
    status: data.status || '0',
    superAdmin: false,
    flag: false,
    remark: data.remark ?? null,
    createTime: NOW
  };
  MOCK_ROLES.push(row);
  MOCK_ROLE_MENUS[roleId] = (data.menuIds || []).map(Number);
  MOCK_ROLE_USERS[roleId] = [];
  return row;
}

export function updateRole(data: Api.System.RoleOperateParams) {
  const idx = MOCK_ROLES.findIndex(r => String(r.roleId) === String(data.roleId));
  if (idx >= 0) Object.assign(MOCK_ROLES[idx], data);
  if (data.menuIds) MOCK_ROLE_MENUS[Number(data.roleId)] = data.menuIds.map(Number);
}

export function deleteRoles(ids: string) {
  MOCK_ROLES = removeByIds(MOCK_ROLES, ids, 'roleId');
}

export function updateRoleStatus(roleId: CommonType.IdType, status: string) {
  const role = MOCK_ROLES.find(r => String(r.roleId) === String(roleId));
  if (role) role.status = status as Api.System.Role['status'];
}

export function updateRoleDataScope(data: Api.System.RoleOperateParams) {
  updateRole(data);
  if (data.deptIds) MOCK_ROLE_DEPTS[Number(data.roleId)] = data.deptIds.map(Number);
}

export function updateRoleAuthUsers(roleId: CommonType.IdType, userIds: CommonType.IdType[], cancel = false) {
  const set = new Set(MOCK_ROLE_USERS[Number(roleId)] || []);
  userIds.map(Number).forEach(id => (cancel ? set.delete(id) : set.add(id)));
  MOCK_ROLE_USERS[Number(roleId)] = [...set];
}

export function createDept(data: Api.System.DeptOperateParams) {
  const deptId = nextId();
  const row = { ...data, deptId, createTime: NOW, children: [] };
  const flat = flattenDepts(MOCK_DEPTS);
  flat.push(row);
  MOCK_DEPTS = mockTree(flat.map(({ children, ...rest }) => rest));
  return row;
}

export function updateDept(data: Api.System.DeptOperateParams) {
  const flat = flattenDepts(MOCK_DEPTS);
  const idx = flat.findIndex(d => String(d.deptId) === String(data.deptId));
  if (idx >= 0) Object.assign(flat[idx], data);
  MOCK_DEPTS = mockTree(flat.map(({ children, ...rest }) => rest));
  syncUserDeptNames();
}

export function deleteDept(deptId: CommonType.IdType) {
  const flat = flattenDepts(MOCK_DEPTS).filter(d => String(d.deptId) !== String(deptId));
  MOCK_DEPTS = mockTree(flat.map(({ children, ...rest }) => rest));
}

function menuDisplayName(menu?: Api.System.Menu | null) {
  if (!menu?.menuName) return '';
  const name = menu.menuName;
  return name.startsWith('route.') || name.startsWith('menu.') ? name : name;
}

function appendMenuOperLog(
  operType: string,
  operContent: string,
  bizNo?: string,
  changeFields?: Api.Monitor.OperLogChangeField[],
  options?: { confirmRemark?: string; highRiskFlag?: boolean; operCategory?: Api.Monitor.OperLogCategory }
) {
  const category =
    options?.operCategory ||
    (operType.includes('\u5220\u9664')
      ? 'DELETE'
      : operType.includes('\u5bfc\u5165') || operType.includes('\u5bfc\u51fa')
        ? 'IMPORT_EXPORT'
        : operType.includes('\u65b0\u589e')
          ? 'CREATE'
          : 'UPDATE');

  appendOperLog({
    operModule: '\u7cfb\u7edf\u7ba1\u7406',
    operPage: '\u83dc\u5355\u7ba1\u7406',
    operCategory: category,
    operType,
    operObject: '\u83dc\u5355',
    bizNo: bizNo || '',
    operContent,
    changeFields,
    confirmRemark: options?.confirmRemark,
    highRiskFlag: options?.highRiskFlag,
    riskLevel: options?.highRiskFlag ? 'HIGH' : 'NORMAL'
  });
}

function insertMenuRow(data: Api.System.MenuOperateParams, withLog = true) {
  const menuId = nextId();
  const row: Api.System.Menu = {
    ...(data as Api.System.Menu),
    menuId,
    createTime: NOW,
    updateTime: NOW,
    children: []
  };
  MENU_FLAT.push(row);
  if (withLog) {
    const confirmRemark = String(data.remark || '')
      .split('|')
      .find(part => part.startsWith('confirm:'))
      ?.slice(8);
    appendMenuOperLog(
      '\u65b0\u589e\u83dc\u5355',
      `\u65b0\u589e${data.menuType === 'F' ? '\u6309\u94ae\u6743\u9650' : data.menuType === 'M' ? '\u76ee\u5f55' : '\u83dc\u5355'}\u300c${menuDisplayName(row)}\u300d`,
      String(menuId),
      undefined,
      { confirmRemark, highRiskFlag: Boolean(data.highRisk), operCategory: 'CREATE' }
    );
  }
  return row;
}

export function createMenu(data: Api.System.MenuOperateParams) {
  const row = insertMenuRow(data, true);
  rebuildMockMenus();
  return row;
}

export function updateMenu(data: Api.System.MenuOperateParams) {
  const idx = MENU_FLAT.findIndex(m => String(m.menuId) === String(data.menuId));
  if (idx < 0) return;
  const before = { ...MENU_FLAT[idx] };
  Object.assign(MENU_FLAT[idx], data, { updateTime: NOW });
  rebuildMockMenus();
  const changes: Api.Monitor.OperLogChangeField[] = [];
  (
    [
      'menuName',
      'menuNameEn',
      'menuCode',
      'orderNum',
      'status',
      'visible',
      'perms',
      'permName',
      'path',
      'applicablePorts',
      'highRisk'
    ] as const
  ).forEach(field => {
    const afterVal = MENU_FLAT[idx][field];
    const beforeVal = before[field];
    if (String(afterVal ?? '') !== String(beforeVal ?? '')) {
      changes.push({ field, beforeValue: String(beforeVal ?? ''), afterValue: String(afterVal ?? '') });
    }
  });
  const confirmRemark = String(data.remark || MENU_FLAT[idx].remark || '')
    .split('|')
    .find(part => part.startsWith('confirm:'))
    ?.slice(8);
  appendMenuOperLog(
    '\u4fee\u6539\u83dc\u5355',
    `\u4fee\u6539\u83dc\u5355\u300c${menuDisplayName(MENU_FLAT[idx])}\u300d`,
    String(data.menuId),
    changes.length ? changes : undefined,
    { confirmRemark, highRiskFlag: Boolean(MENU_FLAT[idx].highRisk), operCategory: 'UPDATE' }
  );
}

export function deleteMenus(ids: string) {
  const idSet = new Set(ids.split(','));
  const removed = MENU_FLAT.filter(m => idSet.has(String(m.menuId)));
  for (let i = MENU_FLAT.length - 1; i >= 0; i -= 1) {
    if (idSet.has(String(MENU_FLAT[i].menuId))) MENU_FLAT.splice(i, 1);
  }
  rebuildMockMenus();
  removed.forEach(menu => {
    appendMenuOperLog(
      '\u5220\u9664\u83dc\u5355',
      `\u5220\u9664\u83dc\u5355\u300c${menuDisplayName(menu)}\u300d`,
      String(menu.menuId)
    );
  });
}

export function sortMenus(items: Array<{ menuId: CommonType.IdType; orderNum: number }>) {
  const changes: Api.Monitor.OperLogChangeField[] = [];
  items.forEach(({ menuId, orderNum }) => {
    const idx = MENU_FLAT.findIndex(m => String(m.menuId) === String(menuId));
    if (idx < 0) return;
    const before = MENU_FLAT[idx].orderNum;
    if (before !== orderNum) {
      changes.push({
        field: `\u6392\u5e8f(${menuDisplayName(MENU_FLAT[idx])})`,
        beforeValue: String(before),
        afterValue: String(orderNum)
      });
      MENU_FLAT[idx].orderNum = orderNum;
      MENU_FLAT[idx].updateTime = NOW;
    }
  });
  rebuildMockMenus();
  if (changes.length) {
    appendMenuOperLog('\u4fee\u6539\u6392\u5e8f', `\u8c03\u6574 ${changes.length} \u4e2a\u540c\u7ea7\u83dc\u5355\u6392\u5e8f`, 'MENU_SORT', changes);
  }
  return true;
}

export function refreshMenuCache() {
  appendMenuOperLog('\u5237\u65b0\u7f13\u5b58', '\u5237\u65b0\u83dc\u5355\u8def\u7531\u7f13\u5b58\uff0c\u91cd\u65b0\u52a0\u8f7d\u4fa7\u8fb9\u680f\u83dc\u5355');
  return true;
}

export function hasMenuChildren(menuId: CommonType.IdType) {
  return MENU_FLAT.some(m => String(m.parentId) === String(menuId));
}

export function getMenuDeletable(menuId: CommonType.IdType): Api.System.MenuDeletableResult {
  const childMenuCount = MENU_FLAT.filter(
    m => String(m.parentId) === String(menuId) && m.menuType !== 'F'
  ).length;
  const buttonCount = MENU_FLAT.filter(
    m => String(m.parentId) === String(menuId) && m.menuType === 'F'
  ).length;

  if (childMenuCount > 0 || buttonCount > 0) {
    const parts: string[] = [];
    if (childMenuCount > 0) parts.push(`${childMenuCount} \u4e2a\u5b50\u83dc\u5355`);
    if (buttonCount > 0) parts.push(`${buttonCount} \u4e2a\u6309\u94ae\u6743\u9650`);
    return {
      canDelete: false,
      message: `\u5b58\u5728${parts.join('\u3001')}\uff0c\u4e0d\u5141\u8bb8\u76f4\u63a5\u5220\u9664`,
      childMenuCount,
      buttonCount
    };
  }

  return { canDelete: true, childMenuCount: 0, buttonCount: 0 };
}

function collectMenuSubtree(parentId?: CommonType.IdType | null) {
  if (parentId == null || parentId === '' || String(parentId) === '0') {
    return MENU_FLAT.map(({ children, ...rest }) => rest);
  }

  const result: Api.System.Menu[] = [];
  const walk = (pid: CommonType.IdType) => {
    MENU_FLAT.filter(item => String(item.parentId) === String(pid)).forEach(item => {
      const { children, ...rest } = item;
      result.push(rest as Api.System.Menu);
      walk(item.menuId);
    });
  };
  walk(parentId);
  return result;
}

export function exportMenus(params?: Api.System.MenuExportParams) {
  const rows = collectMenuSubtree(params?.parentId ?? 0);
  appendMenuOperLog(
    '\u5bfc\u51fa\u83dc\u5355',
    `\u5bfc\u51fa\u83dc\u5355\u914d\u7f6e ${rows.length} \u6761`,
    String(params?.parentId ?? 0),
    undefined,
    { operCategory: 'IMPORT_EXPORT' }
  );
  return rows;
}

export function importMenus(payload: Api.System.MenuImportParams): Api.System.MenuImportResult {
  const mode = payload.mode || 'merge';
  let created = 0;
  let updated = 0;
  let skipped = 0;

  payload.menus.forEach(raw => {
    const { menuId: _ignored, children, ...data } = raw as Api.System.Menu;
    if (!data.menuName && !data.menuCode && !data.perms) {
      skipped += 1;
      return;
    }

    const matchIdx =
      data.menuCode && String(data.menuCode).trim()
        ? MENU_FLAT.findIndex(m => m.menuCode === data.menuCode)
        : data.perms && data.parentId != null
          ? MENU_FLAT.findIndex(
              m =>
                m.perms === data.perms &&
                String(m.parentId) === String(data.parentId) &&
                m.menuType === (data.menuType || m.menuType)
            )
          : -1;

    if (matchIdx >= 0) {
      Object.assign(MENU_FLAT[matchIdx], data, { updateTime: NOW });
      updated += 1;
      return;
    }

    insertMenuRow(
      {
        ...data,
        parentId: data.parentId ?? 0,
        menuType: data.menuType || 'C',
        orderNum: data.orderNum ?? 1,
        path: data.path || '',
        component: data.component || '',
        perms: data.perms || '',
        icon: data.icon || 'mdi:file-outline'
      } as Api.System.MenuOperateParams,
      false
    );
    created += 1;
  });

  rebuildMockMenus();
  appendMenuOperLog(
    '\u5bfc\u5165\u83dc\u5355',
    `\u5bfc\u5165\u83dc\u5355\uff1a\u65b0\u589e ${created} \u6761\uff0c\u66f4\u65b0 ${updated} \u6761\uff0c\u8df3\u8fc7 ${skipped} \u6761`,
    `IMPORT-${Date.now()}`,
    [
      { field: '\u65b0\u589e', beforeValue: '0', afterValue: String(created) },
      { field: '\u66f4\u65b0', beforeValue: '0', afterValue: String(updated) }
    ],
    { operCategory: 'IMPORT_EXPORT' }
  );

  return { created, updated, skipped };
}

export function findPageMenuByRouteKey(routeKey: string) {
  return MENU_FLAT.find(m => m.menuName === routeKey && m.menuType === 'C');
}

export function applyMenuButtonTemplate(payload: Api.System.MenuButtonTemplateApplyParams): Api.System.MenuButtonTemplateApplyResult {
  const template = BUTTON_PERM_TEMPLATES.find(item => item.key === payload.templateKey);
  if (!template) {
    return { success: false, message: '\u672a\u627e\u5230\u6309\u94ae\u6743\u9650\u6a21\u677f', added: 0, skipped: 0 };
  }

  const parent =
    (payload.parentMenuId != null
      ? MENU_FLAT.find(m => String(m.menuId) === String(payload.parentMenuId))
      : undefined) ||
    findPageMenuByRouteKey(payload.routeKey || template.routeKey);

  if (!parent || parent.menuType !== 'C') {
    return { success: false, message: '\u8bf7\u5148\u9009\u62e9\u9875\u9762\u83dc\u5355\u6216\u6307\u5b9a\u6709\u6548\u7684\u7236\u7ea7\u83dc\u5355', added: 0, skipped: 0 };
  }

  const existingPerms = new Set(
    MENU_FLAT.filter(m => String(m.parentId) === String(parent.menuId) && m.menuType === 'F').map(m => m.perms)
  );

  let added = 0;
  let skipped = 0;

  template.buttons.forEach(btn => {
    if (existingPerms.has(btn.perms)) {
      skipped += 1;
      return;
    }
    insertMenuRow(
      {
        parentId: parent.menuId,
        menuName: btn.menuName,
        permName: btn.permName,
        perms: btn.perms,
        menuType: 'F',
        orderNum: btn.orderNum,
        path: '',
        component: '',
        isFrame: '1',
        isCache: '1',
        visible: '0',
        status: '0',
        icon: 'mdi:gesture-tap-button',
        permType: 'button',
        highRisk: btn.highRisk ?? false,
        needConfirm: btn.needConfirm ?? false,
        auditLog: btn.auditLog ?? true,
        remark: 'btn_perm|template:wms_instruction'
      },
      false
    );
    added += 1;
  });

  appendMenuOperLog(
    '\u5e94\u7528\u6309\u94ae\u6a21\u677f',
    `\u4e3a\u300c${menuDisplayName(parent)}\u300d\u5e94\u7528\u6a21\u677f\u300c${template.label}\u300d\uff0c\u65b0\u589e ${added} \u4e2a\u6309\u94ae\u6743\u9650`,
    String(parent.menuId),
    [{ field: '\u6a21\u677f', beforeValue: '-', afterValue: template.key }]
  );

  rebuildMockMenus();
  return { success: true, added, skipped };
}

export function batchUpdateMenuStatus(menuIds: CommonType.IdType[], status: Api.Common.EnableStatus) {
  const label = status === '0' ? '\u542f\u7528' : '\u505c\u7528';
  const changes: Api.Monitor.OperLogChangeField[] = [];

  menuIds.forEach(menuId => {
    const idx = MENU_FLAT.findIndex(m => String(m.menuId) === String(menuId));
    if (idx < 0) return;
    const before = MENU_FLAT[idx].status;
    if (before !== status) {
      changes.push({
        field: menuDisplayName(MENU_FLAT[idx]),
        beforeValue: before === '0' ? '\u6b63\u5e38' : '\u505c\u7528',
        afterValue: status === '0' ? '\u6b63\u5e38' : '\u505c\u7528'
      });
      MENU_FLAT[idx].status = status;
      MENU_FLAT[idx].updateTime = NOW;
    }
  });

  rebuildMockMenus();
  appendMenuOperLog(
    `\u6279\u91cf${label}\u83dc\u5355`,
    `\u6279\u91cf${label} ${changes.length} \u4e2a\u83dc\u5355`,
    menuIds.join(','),
    changes.length ? changes : undefined
  );
  return true;
}

export function createPost(data: Api.System.PostOperateParams) {
  const postId = nextId();
  const row: Api.System.Post = { ...(data as Api.System.Post), postId, createTime: NOW };
  MOCK_POSTS.unshift(row);
  return row;
}

export function updatePost(data: Api.System.PostOperateParams) {
  const idx = MOCK_POSTS.findIndex(p => String(p.postId) === String(data.postId));
  if (idx >= 0) Object.assign(MOCK_POSTS[idx], data);
}

export function deletePosts(ids: string) {
  MOCK_POSTS = removeByIds(MOCK_POSTS, ids, 'postId');
}

export function createConfig(data: Api.System.ConfigOperateParams) {
  const configId = nextId();
  const row: Api.System.Config = { ...(data as Api.System.Config), configId, createTime: NOW };
  MOCK_CONFIGS.unshift(row);
  return row;
}

export function updateConfig(data: Api.System.ConfigOperateParams) {
  const idx = MOCK_CONFIGS.findIndex(c => String(c.configId) === String(data.configId));
  if (idx >= 0) Object.assign(MOCK_CONFIGS[idx], data);
}

export function deleteConfigs(ids: string) {
  MOCK_CONFIGS = removeByIds(MOCK_CONFIGS, ids, 'configId');
}

export function createNotice(data: Api.System.NoticeOperateParams) {
  const noticeId = nextId();
  const row: Api.System.Notice = { ...(data as Api.System.Notice), noticeId, createBy: 'admin', createTime: NOW };
  MOCK_NOTICES.unshift(row);
  return row;
}

export function updateNotice(data: Api.System.NoticeOperateParams) {
  const idx = MOCK_NOTICES.findIndex(n => String(n.noticeId) === String(data.noticeId));
  if (idx >= 0) Object.assign(MOCK_NOTICES[idx], data);
}

export function deleteNotices(ids: string) {
  MOCK_NOTICES = removeByIds(MOCK_NOTICES, ids, 'noticeId');
}

export function createTenant(data: Api.System.TenantOperateParams) {
  const id = nextId();
  const row: Api.System.Tenant = {
    ...(data as Api.System.Tenant),
    id,
    contactPhoneCountryCode: data.contactPhoneCountryCode || '+86',
    createTime: NOW
  };
  MOCK_TENANTS.unshift(row);
  return row;
}

export function updateTenant(data: Api.System.TenantOperateParams) {
  const idx = MOCK_TENANTS.findIndex(t => String(t.id) === String(data.id));
  if (idx >= 0) Object.assign(MOCK_TENANTS[idx], data);
}

export function deleteTenants(ids: string) {
  MOCK_TENANTS = removeByIds(MOCK_TENANTS, ids, 'id');
}

export function createTenantPackage(data: Api.System.TenantPackageOperateParams) {
  const packageId = nextId();
  const row: Api.System.TenantPackage = { ...(data as Api.System.TenantPackage), packageId, createTime: NOW };
  MOCK_TENANT_PACKAGES.unshift(row);
  return row;
}

export function updateTenantPackage(data: Api.System.TenantPackageOperateParams) {
  const idx = MOCK_TENANT_PACKAGES.findIndex(p => String(p.packageId) === String(data.packageId));
  if (idx >= 0) Object.assign(MOCK_TENANT_PACKAGES[idx], data);
}

export function deleteTenantPackages(ids: string) {
  MOCK_TENANT_PACKAGES = removeByIds(MOCK_TENANT_PACKAGES, ids, 'packageId');
}

export function createClient(data: Api.System.ClientOperateParams) {
  const id = nextId();
  const row: Api.System.Client = { ...(data as Api.System.Client), id, createTime: NOW };
  MOCK_CLIENTS.unshift(row);
  return row;
}

export function updateClient(data: Api.System.ClientOperateParams) {
  const idx = MOCK_CLIENTS.findIndex(c => String(c.id) === String(data.id));
  if (idx >= 0) Object.assign(MOCK_CLIENTS[idx], data);
}

export function deleteClients(ids: string) {
  MOCK_CLIENTS = removeByIds(MOCK_CLIENTS, ids, 'id');
}

export function updateClientStatus(id: CommonType.IdType, status: string) {
  const row = MOCK_CLIENTS.find(c => String(c.id) === String(id));
  if (row) row.status = status as Api.System.Client['status'];
}

export function deleteOss(ids: string) {
  MOCK_OSS_FILES = removeByIds(MOCK_OSS_FILES, ids, 'ossId');
}

export function createOssConfig(data: Api.System.OssConfigOperateParams) {
  const ossConfigId = nextId();
  const row: Api.System.OssConfig = { ...(data as Api.System.OssConfig), ossConfigId, createTime: NOW };
  MOCK_OSS_CONFIGS.unshift(row);
  return row;
}

export function updateOssConfig(data: Api.System.OssConfigOperateParams) {
  const idx = MOCK_OSS_CONFIGS.findIndex(c => String(c.ossConfigId) === String(data.ossConfigId));
  if (idx >= 0) Object.assign(MOCK_OSS_CONFIGS[idx], data);
}

export function deleteOssConfigs(ids: string) {
  MOCK_OSS_CONFIGS = removeByIds(MOCK_OSS_CONFIGS, ids, 'ossConfigId');
}

export function createDictType(data: Api.System.DictTypeOperateParams) {
  const dictId = nextId();
  dictTypeRows.unshift({ dictId, dictName: data.dictName!, dictType: data.dictType!, status: data.status || '0', remark: data.remark ?? '', createTime: NOW });
  if (!dictDataStore[data.dictType!]) dictDataStore[data.dictType!] = getMockDictByType(data.dictType!);
  return dictTypeRows[0];
}

export function updateDictType(data: Api.System.DictTypeOperateParams) {
  const idx = dictTypeRows.findIndex(d => String(d.dictId) === String(data.dictId));
  if (idx >= 0) Object.assign(dictTypeRows[idx], data);
}

export function deleteDictTypes(ids: string) {
  dictTypeRows = removeByIds(dictTypeRows, ids, 'dictId');
}

export function createDictData(data: Api.System.DictDataOperateParams) {
  const dictCode = nextId();
  const row: Api.System.DictData = { ...(data as Api.System.DictData), dictCode, createTime: NOW, updateTime: NOW };
  const list = dictDataStore[row.dictType] || (dictDataStore[row.dictType] = []);
  list.unshift(row);
  return row;
}

export function updateDictData(data: Api.System.DictDataOperateParams) {
  const list = dictDataStore[data.dictType!] || [];
  const idx = list.findIndex(d => String(d.dictCode) === String(data.dictCode));
  if (idx >= 0) Object.assign(list[idx], data, { updateTime: NOW });
}

export function deleteDictData(ids: string) {
  const idSet = new Set(ids.split(','));
  Object.keys(dictDataStore).forEach(type => {
    dictDataStore[type] = dictDataStore[type].filter(row => !idSet.has(String(row.dictCode)));
  });
}

export function updateOrgScopeCurrent(data: Api.System.OrgScopeCurrentOperateParams) {
  const company = MOCK_ORG_SCOPE.companies.find(c => String(c.companyId) === String(data.companyId));
  const warehouse = MOCK_ORG_SCOPE.warehouses.find(w => String(w.warehouseId) === String(data.warehouseId));
  MOCK_ORG_SCOPE.current = {
    companyId: data.companyId ?? MOCK_ORG_SCOPE.current.companyId,
    warehouseId: data.warehouseId ?? MOCK_ORG_SCOPE.current.warehouseId,
    companyName: company?.companyName ?? MOCK_ORG_SCOPE.current.companyName,
    warehouseName: warehouse?.warehouseName ?? MOCK_ORG_SCOPE.current.warehouseName
  };
}
