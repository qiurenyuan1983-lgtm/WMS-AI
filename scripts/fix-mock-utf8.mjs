/**
 * Rewrite mock files with correct UTF-8 Chinese (Write tool may corrupt encoding on Windows).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mockRoot = path.join(__dirname, '../src/mock');

function write(rel, content) {
  const file = path.join(mockRoot, rel);
  fs.writeFileSync(file, content, 'utf8');
  console.log('wrote', rel);
}

// --- dict-data.ts ---
const dictDefs = {
  sys_normal_disable: [['\u6b63\u5e38', '0', 'success'], ['\u505c\u7528', '1', 'danger']],
  sys_user_sex: [['\u7537', '0'], ['\u5973', '1'], ['\u672a\u77e5', '2']],
  sys_yes_no: [['\u662f', 'Y', 'success'], ['\u5426', 'N', 'danger']],
  sys_show_hide: [['\u663e\u793a', '0', 'success'], ['\u9690\u85cf', '1', 'danger']],
  sys_notice_type: [['\u901a\u77e5', '1'], ['\u516c\u544a', '2']],
  sys_grant_type: [['\u5bc6\u7801\u6a21\u5f0f', 'password'], ['\u5ba2\u6237\u7aef\u6a21\u5f0f', 'client_credentials']],
  sys_device_type: [['PC', 'pc'], ['\u79fb\u52a8\u7aef', 'mobile']],
  sys_common_status: [['\u6210\u529f', '0', 'success'], ['\u5931\u8d25', '1', 'danger']],
  sys_oper_type: [['\u5176\u5b83', '0'], ['\u65b0\u589e', '1'], ['\u4fee\u6539', '2'], ['\u5220\u9664', '3']],
  wms_zone_type: [['\u5feb\u9012\u533a', 'EXPRESS', 'info'], ['\u6682\u5b58\u533a', 'TEMP', 'success'], ['\u79c1\u4ed3\u5e93\u533a', 'PRIVATE', 'warning'], ['\u5f02\u5e38\u533a', 'EXCEPTION', 'error']],
  wms_zone_status: [['\u542f\u7528', 'ENABLED', 'success'], ['\u505c\u7528', 'DISABLED', 'default']],
  wms_storage_method: [['\u5730\u5806', 'FLOOR', 'info'], ['\u8d27\u67b6', 'RACK', 'success']],
  wms_location_status: [['\u6b63\u5e38', 'NORMAL', 'success'], ['\u505c\u7528', 'DISABLED', 'default'], ['\u9501\u5b9a', 'LOCKED', 'warning']],
  wms_inventory_status: [['\u5728\u5e93', 'IN_STOCK', 'success'], ['\u90e8\u5206\u51fa\u5e93', 'PARTIAL_OUT', 'warning'], ['\u5df2\u6e05\u7a7a', 'DEPLETED', 'default'], ['\u51bb\u7ed3', 'HOLD', 'error']],
  wms_pallet_status: [['\u5728\u5e93', 'IN_STOCK', 'success'], ['\u5df2\u51fa\u5355', 'PRE_OUTBOUND', 'info'], ['\u51fa\u5e93', 'OUTBOUND', 'default'], ['HOLD', 'HOLD', 'warning']],
  wms_pallet_type: [['\u5e38\u89c4', 'NORMAL', 'info'], ['\u9000\u8d27', 'RETURN', 'warning']],
  wms_inventory_lock_status: [['\u9501\u5b9a\u4e2d', 'LOCKED', 'warning'], ['\u5df2\u91ca\u653e', 'RELEASED', 'default'], ['\u5df2\u6d88\u8017', 'CONSUMED', 'success']],
  wms_inventory_transaction_type: [
    ['\u6536\u8d27', 'RECEIVE', 'success'], ['\u6253\u677f', 'PALLETIZE', 'info'], ['\u4e0a\u67b6', 'PUTAWAY', 'info'],
    ['\u79fb\u5e93', 'MOVE', 'info'], ['\u9501\u5b9a', 'LOCK', 'warning'], ['\u91ca\u653e', 'UNLOCK', 'default'],
    ['\u51fa\u5e93', 'OUTBOUND', 'success'], ['\u76d8\u70b9', 'COUNT', 'warning'], ['\u8c03\u6574', 'ADJUST', 'warning'], ['\u5f02\u5e38', 'EXCEPTION', 'error']
  ],
  wms_devanning_method: [['\u4eba\u5de5', 'MANUAL'], ['\u53c9\u8f66', 'FORKLIFT', 'info'], ['\u673a\u68b0', 'MACHINE', 'primary']],
  wms_devanning_status: [
    ['\u672a\u63d0\u67dc', 'UNPICKEDUP'], ['\u5df2\u63d0\u67dc', 'PICKEDUP', 'info'], ['\u5df2\u5230\u4ed3', 'ARRIVED', 'processing'],
    ['\u62c6\u67dc\u4e2d', 'DEVANNING', 'warning'], ['\u62c6\u67dc\u5b8c\u6210', 'DEVANNED', 'success'], ['\u5f02\u5e38', 'EXCEPTION', 'error'], ['\u53d6\u6d88', 'CANCELLED']
  ],
  oms_address_type: [['\u5e73\u53f0\u4ed3', 'PLATFORM_WH'], ['\u79c1\u4ed3', 'PRIVATE'], ['\u5546\u4e1a\u5730\u5740', 'COMMERCIAL']],
  oms_parcel_carrier: [['UPS', 'UPS', 'primary'], ['FedEx', 'FedEx', 'info'], ['USPS', 'USPS', 'success'], ['DHL', 'DHL', 'warning'], ['OnTrac', 'OnTrac'], ['LaserShip', 'LaserShip'], ['Amazon Shipping', 'Amazon Shipping']],
  oms_devanning_method: [['\u4eba\u5de5\u62c6\u67dc', 'MANUAL'], ['\u53c9\u8f66\u62c6\u67dc', 'FORKLIFT'], ['\u6d41\u6c34\u7ebf\u62c6\u67dc', 'CONVEYOR'], ['\u6df7\u5408\u62c6\u67dc', 'MIXED']],
  oms_loading_type: [['\u6563\u88c5', 'FLOOR'], ['\u5361\u677f', 'PALLET'], ['\u6df7\u88c5', 'MIXED']],
  oms_container_hold_type: [['\u6d77\u5173Hold', 'CUSTOMS', 'error'], ['\u8239\u516c\u53f8Hold', 'CARRIER', 'warning'], ['\u7801\u5934Hold', 'TERMINAL', 'warning'], ['\u8d39\u7528Hold', 'FEE']],
  oms_container_exam_type: [['X-Ray', 'X_RAY'], ['Tailgate', 'TAILGATE'], ['Intensive', 'INTENSIVE', 'warning'], ['CES', 'CES']],
  oms_cargo_fulfillment_status: [
    ['\u5f85\u53d7\u7406', 'PENDING_ACCEPT'], ['\u5df2\u53d7\u7406', 'ACCEPTED', 'info'], ['\u5728\u9014', 'IN_TRANSIT', 'info'],
    ['\u5df2\u5230\u6e2f', 'ARRIVED_PORT', 'warning'], ['\u5df2\u63d0\u67dc', 'PICKED_UP', 'warning'], ['\u5df2\u5230\u4ed3', 'ARRIVED_WAREHOUSE', 'warning'],
    ['\u62c6\u67dc\u4e2d', 'DEVANNING', 'warning'], ['\u62c6\u67dc\u5b8c\u6210', 'DEVANNED', 'warning'], ['\u5df2\u5165\u5e93', 'INBOUNDED', 'success'],
    ['\u5df2\u51fa\u5355', 'OUTBOUND_ORDERED', 'success'], ['\u5df2\u9884\u7ea6\u6d3e\u9001', 'DELIVERY_APPOINTED', 'success'], ['\u5df2\u51fa\u5e93', 'OUTBOUNDED', 'success'],
    ['\u6d3e\u9001\u4e2d', 'DELIVERING', 'primary'], ['\u5df2\u7b7e\u6536', 'DELIVERED', 'success'], ['POD\u5df2\u56de\u4f20', 'POD_UPLOADED', 'success'],
    ['\u5df2\u51fa\u8d26\u5355', 'BILLED', 'success'], ['\u5df2\u5b8c\u6210', 'COMPLETED', 'success'], ['\u5f02\u5e38\u4e2d', 'EXCEPTION', 'error'], ['\u5df2\u53d6\u6d88', 'CANCELLED']
  ],
  oms_cargo_billing_status: [['\u672a\u51fa\u8d26\u5355', 'UNBILLED'], ['\u5df2\u51fa\u8d26\u5355', 'BILLED', 'success'], ['\u5df2\u4f5c\u5e9f', 'VOIDED', 'default']],
  oms_attachment_type: [['DO', 'DO', 'primary'], ['BOL/\u63d0\u5355', 'BOL'], ['POD', 'POD', 'success'], ['\u53d1\u7968', 'INVOICE'], ['\u5f02\u5e38\u56fe\u7247', 'EXCEPTION_IMAGE', 'error'], ['\u5ba2\u6237\u6587\u4ef6', 'CUSTOMER_FILE', 'info'], ['\u5176\u4ed6', 'OTHER']],
  oms_cargo_grouping_rule_status: [['\u542f\u7528', 'ENABLED', 'success'], ['\u505c\u7528', 'DISABLED', 'danger']],
  yms_zone_type: [['\u96c6\u88c5\u7bb1\u533a', 'CONTAINER'], ['\u5361\u8f66\u533a', 'TRUCK'], ['\u81ea\u63d0\u533a', 'SELF_PICKUP'], ['\u505c\u8f66\u533a', 'PARKING']],
  yms_task_type: [
    ['\u62c6\u67dc', 'DEVANNING'], ['\u6d3e\u9001\u88c5\u8f66', 'DELIVERY_LOADING'], ['\u8c03\u62e8\u88c5\u8f66', 'TRANSFER_LOADING'],
    ['\u81ea\u63d0\u88c5\u8f66', 'PICKUP_LOADING'], ['\u9000\u8d27\u88c5\u8f66', 'RETURN_LOADING'], ['\u9662\u5185\u632a\u67dc', 'INTERNAL_MOVE'], ['\u56ed\u533a\u76d8\u70b9', 'YARD_INVENTORY']
  ],
  yms_internal_task_type: [
    ['\u6d77\u67dc\u4e0a\u53e3', 'CONTAINER_TO_DOCK'], ['\u6d77\u67dc\u4e0b\u53e3', 'CONTAINER_OFF_DOCK'], ['\u8f66\u53a2\u4e0a\u53e3', 'TRAILER_TO_DOCK'],
    ['\u8f66\u53a2\u4e0b\u53e3', 'TRAILER_OFF_DOCK'], ['\u9662\u5185\u632a\u67dc', 'CONTAINER_MOVE'], ['\u9662\u5185\u632a\u8f66\u53a2', 'TRAILER_MOVE'],
    ['\u7a7a\u67dc\u8fd8\u67dc', 'EMPTY_CONTAINER_RETURN'], ['\u56ed\u533a\u76d8\u70b9', 'YARD_INVENTORY_SCAN']
  ],
  yms_internal_task_status: [
    ['\u5f85\u5206\u914d', 'PENDING'], ['\u5df2\u5206\u914d', 'ASSIGNED', 'info'], ['\u5df2\u63a5\u5355', 'ACCEPTED', 'warning'],
    ['\u6267\u884c\u4e2d', 'IN_PROGRESS', 'primary'], ['\u5df2\u5b8c\u6210', 'COMPLETED', 'success'], ['\u5931\u8d25', 'FAILED', 'error'], ['\u5df2\u53d6\u6d88', 'CANCELLED']
  ],
  yms_trailer_status: [
    ['\u9884\u8ba1\u5230\u4ed3', 'EXPECTED_ARRIVAL'], ['\u7a7a\u8f66\u53a2\u5df2\u5230', 'ARRIVED_EMPTY', 'info'], ['\u7b49\u5f85\u88c5\u8f66', 'WAIT_LOADING', 'warning'],
    ['\u5df2\u4e0a\u53e3', 'ON_DOCK', 'primary'], ['\u88c5\u8f66\u4e2d', 'LOADING', 'primary'], ['\u88c5\u8f66\u5b8c\u6210', 'LOADED', 'success'],
    ['\u7b49\u5f85\u63d0\u8d70', 'WAIT_PICKUP', 'warning'], ['\u5df2\u79bb\u573a', 'LEFT_YARD', 'default'], ['\u5f02\u5e38', 'EXCEPTION', 'error']
  ],
  yms_vehicle_source: [['\u4f9b\u5e94\u5546\u8f66\u8f86', 'SUPPLIER_TRUCK'], ['\u79df\u8d41\u8f66\u53a2', 'RENTED_TRAILER'], ['\u81ea\u6709\u8f66\u53a2', 'OWN_TRAILER'], ['\u4e34\u65f6\u8f66\u8f86', 'TEMP_TRUCK']],
  yms_container_status: [
    ['\u9884\u8ba1\u5230\u4ed3', 'EXPECTED_ARRIVAL'], ['\u8fd0\u8f93\u4e2d', 'IN_TRANSIT', 'info'], ['\u5df2\u5230\u56ed\u533a', 'ARRIVED', 'primary'],
    ['\u5df2\u6324\u67dc', 'DROPPED', 'warning'], ['\u7b49\u5f85\u62c6\u67dc', 'WAIT_DEVANNING', 'warning'], ['\u5df2\u4e0a\u53e3', 'ON_DOCK', 'primary'],
    ['\u62c6\u67dc\u4e2d', 'DEVANNING', 'primary'], ['\u62c6\u67dc\u5b8c\u6210', 'DEVANNED', 'success'], ['\u7a7a\u67dc\u5f85\u8fd8', 'EMPTY_WAIT_RETURN', 'warning'],
    ['\u5df2\u8fd8\u67dc', 'RETURNED', 'success'], ['\u5df2\u79bb\u56ed', 'LEFT_YARD', 'default'], ['\u5f02\u5e38', 'EXCEPTION', 'error']
  ],
  yms_position_type: [
    ['\u6d77\u67dc\u4f4d', 'CONTAINER_SLOT'], ['\u7a7a\u67dc\u4f4d', 'EMPTY_CONTAINER_SLOT'], ['\u8f66\u53a2\u4f4d', 'TRAILER_SLOT'],
    ['\u4e34\u65f6\u7b49\u5f85\u4f4d', 'WAITING_SLOT'], ['\u7981\u7528\u4f4d', 'BLOCKED_SLOT']
  ],
  yms_position_status: [['\u7a7a\u95f2', 'FREE', 'success'], ['\u5360\u7528\u4e2d', 'OCCUPIED', 'primary'], ['\u5df2\u9884\u5360', 'RESERVED', 'warning'], ['\u7981\u7528', 'DISABLED', 'default']],
  yms_inventory_type: [['\u5206\u533a\u76d8\u70b9', 'ZONE'], ['\u5168\u5e93\u76d8\u70b9', 'FULL'], ['\u6307\u5b9a\u5217\u8868', 'CONTAINER_LIST']],
  yms_inventory_status: [['\u5f85\u5f00\u59cb', 'PENDING', 'default'], ['\u76d8\u70b9\u4e2d', 'IN_PROGRESS', 'warning'], ['\u5df2\u5b8c\u6210', 'COMPLETED', 'success'], ['\u6709\u5dee\u5f02', 'DIFF_FOUND', 'warning']],
  yms_inventory_scan_status: [['\u5f85\u626b', 'PENDING', 'default'], ['\u5df2\u626b', 'SCANNED', 'success'], ['\u7f3a\u5931', 'MISSING', 'error'], ['\u591a\u4f59', 'EXTRA', 'warning']],
  yms_inventory_diff_type: [['\u7f3a\u5931', 'MISSING', 'error'], ['\u591a\u4f59', 'EXTRA', 'warning'], ['\u4f4d\u7f6e\u4e0d\u7b26', 'POSITION_MISMATCH', 'warning'], ['\u72b6\u6001\u4e0d\u7b26', 'STATUS_MISMATCH', 'warning']],
  yard_zone_type: [['\u6d77\u67dc\u533a', 'CONTAINER'], ['\u8f66\u53a2\u533a', 'TRUCK'], ['\u81ea\u63d0\u533a', 'SELF_PICKUP'], ['\u505c\u8f66\u533a', 'PARKING']],
  yard_location_type: [['\u9053\u53e3', 'DOCK', 'info'], ['\u505c\u8f66\u4f4d', 'PARKING']],
  yard_dock_location: [
    ['\u524d\u9662\u9053\u53e3', 'FRONT_YARD_DOCK', 'success'], ['\u540e\u9662\u9053\u53e3', 'BACK_YARD_DOCK', 'info'],
    ['\u524d\u9662\u505c\u8f66\u4f4d', 'FRONT_YARD_PARKING', 'warning'], ['\u540e\u9662\u505c\u8f66\u4f4d', 'BACK_YARD_PARKING']
  ]
};

function genDictTs() {
  const lines = [
    'type DictItem = { label: string; value: string; listClass?: string };',
    '',
    'function build(dictType: string, items: DictItem[], startCode = 1): Api.System.DictData[] {',
    "  const now = '2026-01-01 00:00:00';",
    '  return items.map((item, index) => ({',
    '    dictCode: startCode + index,',
    '    dictSort: index + 1,',
    '    dictLabel: item.label,',
    '    dictValue: item.value,',
    '    dictType,',
    "    cssClass: '',",
    "    listClass: (item.listClass || 'default') as NaiveUI.ThemeColor,",
    "    isDefault: index === 0 ? 'Y' : 'N',",
    "    remark: '',",
    "    createBy: 'admin',",
    '    createTime: now,',
    "    updateBy: 'admin',",
    '    updateTime: now',
    '  }));',
    '}',
    '',
    'const DICT_DEFINITIONS: Record<string, DictItem[]> = {'
  ];
  for (const [type, items] of Object.entries(dictDefs)) {
    lines.push(`  ${type}: [`);
    for (const row of items) {
      const [label, value, listClass] = row;
      const lc = listClass ? `, listClass: '${listClass}'` : '';
      lines.push(`    { label: ${JSON.stringify(label)}, value: '${value}'${lc} },`);
    }
    lines.push('  ],');
  }
  lines.push(
    '};',
    '',
    'const MOCK_DICT_MAP: Record<string, Api.System.DictData[]> = Object.fromEntries(',
    '  Object.entries(DICT_DEFINITIONS).map(([type, items]) => [type, build(type, items)])',
    ');',
    '',
    'export function getMockDictByType(dictType: string): Api.System.DictData[] {',
    '  if (MOCK_DICT_MAP[dictType]) {',
    '    return MOCK_DICT_MAP[dictType];',
    '  }',
    '  return build(dictType, [',
    "    { label: '\u9009\u9879\u4e00', value: 'OPTION_1' },",
    "    { label: '\u9009\u9879\u4e8c', value: 'OPTION_2' },",
    "    { label: '\u9009\u9879\u4e09', value: 'OPTION_3' }",
    '  ]);',
    '}',
    '',
    'export function getAllMockDictTypes(): string[] {',
    '  return Object.keys(MOCK_DICT_MAP);',
    '}',
    ''
  );
  write('dict-data.ts', lines.join('\n'));
}

genDictTs();

write('data/common.ts', `/** \u539f\u578b\u6a21\u5f0f\u516c\u5171\u57fa\u7840\u6570\u636e */

export const MOCK_COMPANY = {
  id: 4000001,
  companyCode: 'DEMO',
  companyName: '\u6f14\u793a\u7269\u6d41\u516c\u53f8',
  status: '0'
};

export const MOCK_WAREHOUSE = {
  id: 5000001,
  companyId: 4000001,
  warehouseCode: 'WH-LA-01',
  warehouseName: '\u6d1b\u6749\u77f6\u4e00\u53f7\u4ed3',
  status: '0'
};

export const MOCK_WAREHOUSE_OPTIONS = [
  {
    id: 5000001,
    companyId: 4000001,
    warehouseCode: 'WH-LA-01',
    warehouseName: '\u6d1b\u6749\u77f6\u4e00\u53f7\u4ed3',
    status: '0'
  },
  {
    id: 5000002,
    companyId: 4000001,
    warehouseCode: 'WH-NJ-01',
    warehouseName: '\u65b0\u6cfd\u897f\u4e00\u53f7\u4ed3',
    status: '0'
  }
];
`);

write('auth.ts', `export const MOCK_TOKEN: Api.Auth.LoginToken = {
  access_token: 'mock-access-token-prototype',
  refresh_token: 'mock-refresh-token-prototype',
  expire_in: 7200,
  refresh_expire_in: 86400,
  client_id: import.meta.env.VITE_APP_CLIENT_ID,
  scope: 'all'
};

export const MOCK_USER_INFO: Api.Auth.UserInfo = {
  user: {
    userId: 1,
    userName: 'admin',
    nickName: '\u539f\u578b\u7ba1\u7406\u5458',
    email: 'admin@mock.local',
    phonenumber: '13800000000',
    sex: '0',
    avatar: '',
    status: '0',
    deptId: 100,
    deptName: '\u7814\u53d1\u90e8\u95e8',
    roles: [{ roleId: 1, roleName: '\u8d85\u7ea7\u7ba1\u7406\u5458', roleKey: 'admin' } as Api.System.Role]
  } as Api.System.User & { roles: Api.System.Role[] },
  roles: ['admin', 'R_SUPER'],
  permissions: ['*:*:*']
};

export const MOCK_CAPTCHA: Api.Auth.CaptchaCode = {
  captchaEnabled: false,
  uuid: 'mock-captcha-uuid'
};

export const MOCK_TENANT_LIST: Api.Auth.LoginTenant = {
  tenantEnabled: false,
  voList: [{ tenantId: '000000', companyName: '\u6f14\u793a\u79df\u6237', domain: '' }]
};
`);

write('data/system.ts', `import { mockPage, mockTree } from '../utils';
import { getAllMockDictTypes } from '../dict-data';

export const MOCK_USERS = [
  { userId: 1, userName: 'admin', nickName: '\u539f\u578b\u7ba1\u7406\u5458', deptId: 100, deptName: '\u7814\u53d1\u90e8\u95e8', phonenumber: '13800000000', status: '0', createTime: '2026-01-01 00:00:00' },
  { userId: 2, userName: 'demo', nickName: '\u6f14\u793a\u7528\u6237', deptId: 100, deptName: '\u7814\u53d1\u90e8\u95e8', phonenumber: '13800000001', status: '0', createTime: '2026-01-02 00:00:00' }
];

export const MOCK_ROLES = [
  { roleId: 1, roleName: '\u8d85\u7ea7\u7ba1\u7406\u5458', roleKey: 'admin', status: '0', createTime: '2026-01-01' },
  { roleId: 2, roleName: '\u666e\u901a\u89d2\u8272', roleKey: 'common', status: '0', createTime: '2026-01-01' }
];

export const MOCK_DEPTS = mockTree([
  { deptId: 100, parentId: 0, deptName: '\u6f14\u793a\u516c\u53f8', orderNum: 0, status: '0', children: [
    { deptId: 101, parentId: 100, deptName: '\u4ed3\u50a8\u90e8', orderNum: 1, status: '0', children: [] },
    { deptId: 102, parentId: 100, deptName: '\u8fd0\u8425\u90e8', orderNum: 2, status: '0', children: [] }
  ]}
]);

export const MOCK_MENUS = mockTree([
  { menuId: 1, menuName: '\u7cfb\u7edf\u7ba1\u7406', parentId: 0, orderNum: 1, path: 'system', component: 'Layout', menuType: 'M', status: '0', children: [
    { menuId: 2, menuName: '\u7528\u6237\u7ba1\u7406', parentId: 1, orderNum: 1, path: 'user', component: 'system/user/index', menuType: 'C', status: '0', children: [] }
  ]}
]);

export function getUserList(params?: Record<string, any>) { return mockPage(MOCK_USERS, params); }
export function getRoleList(params?: Record<string, any>) { return mockPage(MOCK_ROLES, params); }

export function getDictTypeList(params?: Record<string, any>) {
  const rows = getAllMockDictTypes().map((type, i) => ({ dictId: i + 1, dictName: type, dictType: type, status: '0', remark: 'Mock \u5b57\u5178' }));
  return mockPage(rows, params);
}

export const MOCK_ORG_SCOPE = {
  companies: [{ companyId: 4000001, companyCode: 'DEMO', companyName: '\u6f14\u793a\u7269\u6d41\u516c\u53f8' }],
  warehouses: [
    { warehouseId: 5000001, warehouseCode: 'WH-LA-01', warehouseName: '\u6d1b\u6749\u77f6\u4e00\u53f7\u4ed3' },
    { warehouseId: 5000002, warehouseCode: 'WH-NJ-01', warehouseName: '\u65b0\u6cfd\u897f\u4e00\u53f7\u4ed3' }
  ],
  current: { companyId: 4000001, warehouseId: 5000001 }
};
`);

write('data/wms.ts', `import { MOCK_COMPANY, MOCK_WAREHOUSE } from './common';
import { mockPage } from '../utils';

const base = { tenantId: '000000', companyId: MOCK_COMPANY.id, warehouseId: MOCK_WAREHOUSE.id, warehouseCode: MOCK_WAREHOUSE.warehouseCode, warehouseName: MOCK_WAREHOUSE.warehouseName, createTime: '2026-05-01 10:00:00' };

export const MOCK_WMS_ZONES = [
  { id: 60001, ...base, zoneName: 'FedEx\u533a', storageMethod: 'FLOOR', zoneType: 'EXPRESS', allowMixedStorage: 1, maxMixedQty: 50, status: 'ENABLED', remark: '\u5feb\u9012\u6682\u5b58\u533a' },
  { id: 60002, ...base, zoneName: 'A\u533a', storageMethod: 'RACK', zoneType: 'PRIVATE', allowMixedStorage: 0, maxMixedQty: null, status: 'ENABLED', remark: null },
  { id: 60003, ...base, zoneName: '\u5f02\u5e38\u6682\u5b58\u533a', storageMethod: 'FLOOR', zoneType: 'EXCEPTION', allowMixedStorage: 1, maxMixedQty: 20, status: 'ENABLED', remark: '\u5f02\u5e38\u4ef6\u6682\u5b58' }
];

export const MOCK_WMS_LOCATIONS = [
  { id: 60101, ...base, zoneId: 60001, zoneName: 'FedEx\u533a', locationCode: 'A-01-01', rowNo: '01', columnNo: '01', capacity: 100, currentQty: 45, remainingCapacity: 55, status: 'NORMAL', remark: null },
  { id: 60102, ...base, zoneId: 60001, zoneName: 'FedEx\u533a', locationCode: 'A-01-02', rowNo: '01', columnNo: '02', capacity: 100, currentQty: 80, remainingCapacity: 20, status: 'NORMAL', remark: null },
  { id: 60103, ...base, zoneId: 60002, zoneName: 'A\u533a', locationCode: 'B-02-01', rowNo: '02', columnNo: '01', capacity: 50, currentQty: 0, remainingCapacity: 50, status: 'NORMAL', remark: null }
];

export const MOCK_WMS_INVENTORY = [
  { id: 60201, ...base, customerId: 70001, customerName: '\u6f14\u793a\u5ba2\u6237 A', cargoOrderId: 80001, cargoOrderNo: 'CO-2026-0001', shipmentId: 90001, shipmentCode: 'SHP-001', totalBoxQty: 120, availableBoxQty: 80, lockedBoxQty: 40, exceptionBoxQty: 0, totalWeight: 1500.5, totalCbm: 12.8, inventoryStatus: 'IN_STOCK', firstInboundTime: '2026-05-10 08:00:00', lastInboundTime: '2026-05-15 14:30:00', lastTransactionTime: '2026-05-20 09:00:00', version: 1, remark: null },
  { id: 60202, ...base, customerId: 70002, customerName: '\u6f14\u793a\u5ba2\u6237 B', cargoOrderId: 80002, cargoOrderNo: 'CO-2026-0002', shipmentId: 90002, shipmentCode: 'SHP-002', totalBoxQty: 60, availableBoxQty: 60, lockedBoxQty: 0, exceptionBoxQty: 5, totalWeight: 800, totalCbm: 6.2, inventoryStatus: 'PARTIAL_OUT', firstInboundTime: '2026-05-12 10:00:00', lastInboundTime: '2026-05-18 16:00:00', lastTransactionTime: '2026-05-22 11:00:00', version: 2, remark: '\u90e8\u5206\u5df2\u51fa\u5e93' }
];

export const MOCK_WMS_PALLETS = [
  { id: 60301, ...base, palletNo: 'PLT-2026-0001', palletType: 'NORMAL', palletStatus: 'IN_STOCK', locationId: 60101, locationCode: 'A-01-01', zoneId: 60001, zoneName: 'FedEx\u533a', boxQty: 40, weight: 500, cbm: 4.2, cargoOrderNo: 'CO-2026-0001', remark: null },
  { id: 60302, ...base, palletNo: 'PLT-2026-0002', palletType: 'NORMAL', palletStatus: 'PRE_OUTBOUND', locationId: 60102, locationCode: 'A-01-02', zoneId: 60001, zoneName: 'FedEx\u533a', boxQty: 35, weight: 420, cbm: 3.5, cargoOrderNo: 'CO-2026-0001', remark: '\u5df2\u51fa\u5355\u5f85\u51fa\u5e93' }
];

export const MOCK_WMS_DEVANNING_ORDERS = [
  { id: 60401, ...base, orderNo: 'DV-2026-0001', sourceOrderType: 'CONTAINER_ORDER', sourceOrderNo: 'CTN-2026-0001', containerNo: 'MSCU1234567', devanningMethod: 'FORKLIFT', status: 'DEVANNING', plannedPickupTime: '2026-05-25 08:00:00', actualPickupTime: '2026-05-25 09:30:00', plannedArrivalTime: '2026-05-25 14:00:00', actualArrivalTime: '2026-05-25 15:00:00', remark: '\u62c6\u67dc\u8fdb\u884c\u4e2d' },
  { id: 60402, ...base, orderNo: 'DV-2026-0002', sourceOrderType: 'MANUAL', sourceOrderNo: null, containerNo: 'OOLU7654321', devanningMethod: 'MANUAL', status: 'ARRIVED', plannedPickupTime: '2026-05-28 08:00:00', actualPickupTime: null, plannedArrivalTime: '2026-05-28 16:00:00', actualArrivalTime: '2026-05-28 17:00:00', remark: null }
];

export function getWmsZoneList(params?: Record<string, any>) { return mockPage(MOCK_WMS_ZONES, params); }
export function getWmsLocationList(params?: Record<string, any>) { return mockPage(MOCK_WMS_LOCATIONS, params); }
export function getWmsInventoryList(params?: Record<string, any>) { return mockPage(MOCK_WMS_INVENTORY, params); }
export function getWmsPalletList(params?: Record<string, any>) { return mockPage(MOCK_WMS_PALLETS, params); }
export function getWmsDevanningOrderList(params?: Record<string, any>) { return mockPage(MOCK_WMS_DEVANNING_ORDERS, params); }

export function getWmsInventoryStats() {
  return { totalInventoryCount: 2, totalBoxQty: 180, availableBoxQty: 140, lockedBoxQty: 40, exceptionBoxQty: 5, totalPalletCount: 2, inStockPalletCount: 1 };
}

export function getWmsInventoryVisualization() {
  return {
    warehouseId: MOCK_WAREHOUSE.id,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    zones: MOCK_WMS_ZONES.map(zone => ({
      zoneId: zone.id, zoneName: zone.zoneName, zoneType: zone.zoneType, storageMethod: zone.storageMethod,
      locations: MOCK_WMS_LOCATIONS.filter(loc => loc.zoneId === zone.id).map(loc => ({
        locationId: loc.id, locationCode: loc.locationCode, status: loc.status, capacity: loc.capacity, currentQty: loc.currentQty,
        occupancyRate: loc.capacity ? Math.round((loc.currentQty / loc.capacity) * 100) : 0
      }))
    }))
  };
}
`);

write('data/oms.ts', `import { MOCK_COMPANY, MOCK_WAREHOUSE } from './common';
import { mockPage } from '../utils';

const base = { tenantId: '000000', companyId: MOCK_COMPANY.id, warehouseId: MOCK_WAREHOUSE.id, warehouseCode: MOCK_WAREHOUSE.warehouseCode, warehouseName: MOCK_WAREHOUSE.warehouseName, createTime: '2026-05-01 10:00:00' };

export const MOCK_CONTAINER_ORDERS = [
  { id: 70001, ...base, containerOrderNo: 'CTN-2026-0001', containerNo: 'MSCU1234567', status: 'INBOUNDED', shippingLine: 'MSC', vesselName: 'MSC OSCAR', eta: '2026-05-20', devanningMethod: 'FORKLIFT', loadingType: 'PALLET', totalBoxQty: 500, remark: '\u6d77\u67dc\u8ba2\u5355\u6f14\u793a' },
  { id: 70002, ...base, containerOrderNo: 'CTN-2026-0002', containerNo: 'OOLU7654321', status: 'ARRIVED_PORT', shippingLine: 'OOCL', vesselName: 'OOCL TOKYO', eta: '2026-05-28', devanningMethod: 'MANUAL', loadingType: 'FLOOR', totalBoxQty: 320, remark: null }
];

export const MOCK_CARGO_ORDERS = [
  { id: 80001, ...base, cargoOrderNo: 'CO-2026-0001', customerName: '\u6f14\u793a\u5ba2\u6237 A', fulfillmentStatus: 'INBOUNDED', billingStatus: 'UNBILLED', addressType: 'PLATFORM_WH', parcelCarrier: 'UPS', totalBoxQty: 120, totalWeight: 1500, totalCbm: 12.8, remark: null },
  { id: 80002, ...base, cargoOrderNo: 'CO-2026-0002', customerName: '\u6f14\u793a\u5ba2\u6237 B', fulfillmentStatus: 'OUTBOUND_ORDERED', billingStatus: 'BILLED', addressType: 'COMMERCIAL', parcelCarrier: 'FedEx', totalBoxQty: 60, totalWeight: 800, totalCbm: 6.2, remark: '\u52a0\u6025\u51fa\u5e93' }
];

export const MOCK_OUTBOUND_ORDERS = [
  { id: 90001, ...base, outboundOrderNo: 'OB-2026-0001', status: 'CREATED', direction: 'DELIVERY', customerName: '\u6f14\u793a\u5ba2\u6237 A', totalBoxQty: 40, remark: null }
];

function countByField<T extends Record<string, any>>(rows: T[], field: keyof T) {
  return rows.reduce((acc, row) => { const k = String(row[field] ?? ''); if (k) acc[k] = (acc[k] || 0) + 1; return acc; }, {} as Record<string, number>);
}

export function getContainerOrderList(params?: Record<string, any>) { return mockPage(MOCK_CONTAINER_ORDERS, params); }
export function getCargoOrderList(params?: Record<string, any>) { return mockPage(MOCK_CARGO_ORDERS, params); }
export function getOutboundOrderList(params?: Record<string, any>) { return mockPage(MOCK_OUTBOUND_ORDERS, params); }
export function getContainerOrderStatusCount() { return countByField(MOCK_CONTAINER_ORDERS, 'status'); }
export function getCargoOrderStatusCount() { return countByField(MOCK_CARGO_ORDERS, 'fulfillmentStatus'); }
export function getOutboundPoolStats() { return { total: MOCK_CARGO_ORDERS.length, readyCount: 1, pendingCount: 1 }; }
`);

write('data/yard.ts', `import { MOCK_WAREHOUSE } from './common';
import { mockPage } from '../utils';

const base = { tenantId: '000000', warehouseId: MOCK_WAREHOUSE.id, warehouseCode: MOCK_WAREHOUSE.warehouseCode, warehouseName: MOCK_WAREHOUSE.warehouseName, status: '0', createTime: '2026-05-01 10:00:00' };

export const MOCK_YARD_ZONES = [
  { id: 2620001, ...base, zoneCode: 'CZ-A', zoneName: '\u6d77\u67dc\u533a A', zoneType: 'CONTAINER', sortOrder: 1, remark: null },
  { id: 2620002, ...base, zoneCode: 'TZ-B', zoneName: '\u8f66\u53a2\u533a B', zoneType: 'TRUCK', sortOrder: 2, remark: null }
];

export const MOCK_YARD_DOCKS = [
  { id: 3010001, ...base, dockCode: 'DOC-LA-001', dockName: 'LA \u62c6\u67dc\u53e3 1', locationType: 'DOCK', zoneId: 2620001, zoneCode: 'CZ-A', dockType: 'DEVANNING', dockLocation: 'FRONT_YARD_DOCK', dockStatus: 'IDLE', enabledFlag: 1, sortOrder: 1, remark: null },
  { id: 3010002, ...base, dockCode: 'DOC-LA-002', dockName: 'LA \u88c5\u8f66\u53e3 2', locationType: 'DOCK', zoneId: 2620001, zoneCode: 'CZ-A', dockType: 'LOADING', dockLocation: 'FRONT_YARD_DOCK', dockStatus: 'OCCUPIED', enabledFlag: 1, sortOrder: 2, remark: null },
  { id: 3010003, ...base, dockCode: 'PARK-LA-01', dockName: '\u7b49\u5f85\u4f4d 01', locationType: 'PARKING', zoneId: 2620002, zoneCode: 'TZ-B', dockType: 'MIXED', dockLocation: 'FRONT_YARD_PARKING', dockStatus: 'IDLE', enabledFlag: 1, sortOrder: 3, remark: null }
];

export function getYardZoneList(params?: Record<string, any>) { return mockPage(MOCK_YARD_ZONES, params); }
export function getYardDockList(params?: Record<string, any>) { return mockPage(MOCK_YARD_DOCKS, params); }
export function getYardDockFree(warehouseId?: number | string) {
  return MOCK_YARD_DOCKS.filter(d => d.dockStatus === 'IDLE' && (!warehouseId || d.warehouseId === warehouseId));
}
`);

write('data/base.ts', `import { MOCK_COMPANY, MOCK_WAREHOUSE, MOCK_WAREHOUSE_OPTIONS } from './common';
import { mockPage } from '../utils';

export const MOCK_COMPANIES = [{ id: MOCK_COMPANY.id, companyCode: MOCK_COMPANY.companyCode, companyName: MOCK_COMPANY.companyName, status: '0', createTime: '2026-01-01 00:00:00' }];

export const MOCK_WAREHOUSES = MOCK_WAREHOUSE_OPTIONS.map(w => ({ ...w, companyId: MOCK_COMPANY.id, companyName: MOCK_COMPANY.companyName, warehouseType: 'SELF_OP', countryCode: 'US', city: 'Los Angeles', isBonded: 0, createTime: '2026-01-01 00:00:00' }));

export const MOCK_SKUS = [
  { id: 30001, skuCode: 'SKU-DEMO-001', skuName: '\u6f14\u793a\u5546\u54c1 A', companyId: MOCK_COMPANY.id, status: '0', createTime: '2026-01-01 00:00:00' },
  { id: 30002, skuCode: 'SKU-DEMO-002', skuName: '\u6f14\u793a\u5546\u54c1 B', companyId: MOCK_COMPANY.id, status: '0', createTime: '2026-01-01 00:00:00' }
];

const t = '2026-05-01 10:00:00';
export const MOCK_CHANNELS = [{ id: 25001, channelCode: 'FCL', channelName: '\u6574\u67dc\u6d77\u8fd0', status: '0', createTime: t }];
export const MOCK_BUSINESS_TYPES = [{ id: 25002, typeCode: 'DEVANNING', typeName: '\u62c6\u67dc\u4e1a\u52a1', status: '0', createTime: t }];
export const MOCK_VAS = [{ id: 25003, serviceCode: 'LABEL', serviceName: '\u8d34\u6807\u670d\u52a1', status: '0', createTime: t }];
export const MOCK_COUNTRIES = [{ id: 21001, code: 'US', nameEn: 'United States', isActive: 1, status: '0', createTime: t }];
export const MOCK_STATE_PROVINCES = [{ id: 21002, countryCode: 'US', code: 'CA', nameEn: 'California', status: '0', createTime: t }];
export const MOCK_CITIES = [{ id: 21003, countryCode: 'US', stateCode: 'CA', nameEn: 'Los Angeles', status: '0', createTime: t }];
export const MOCK_TIMEZONES = [{ id: 21004, tzCode: 'America/Los_Angeles', nameEn: 'Pacific Time', utcOffset: 'UTC-8', status: '0', createTime: t }];
export const MOCK_ZIP_CODES = [{ id: 23001, countryCode: 'US', stateCode: 'CA', cityName: 'Los Angeles', zip: '90001', createTime: t }];
export const MOCK_CURRENCIES = [{ id: 22001, code: 'USD', nameEn: 'US Dollar', symbol: '$', isBase: 1, status: '0', createTime: t }];
export const MOCK_EXCHANGE_RATES = [{ id: 22002, fromCurrency: 'USD', toCurrency: 'CNY', rate: 7.2456, effectiveDate: '2026-05-01', expiredDate: null, isCurrent: 1, createTime: t }];
export const MOCK_FEE_ITEMS = [{ id: 20003, feeCode: 'STORAGE', feeName: '\u4ed3\u50a8\u8d39', status: '0', createTime: t }];
export const MOCK_PORTS = [{ id: 23011, portCode: 'USLAX', nameEn: 'Los Angeles', countryCode: 'US', status: '0', createTime: t }];
export const MOCK_TERMINALS = [{ id: 23041, terminalCode: 'LAX-T1', terminalName: 'LA Terminal 1', portCode: 'USLAX', status: '0', createTime: t }];
export const MOCK_SHIPPING_LINES = [{ id: 23021, code: 'COSU', nameEn: 'COSCO', nameAbbr: 'COSCO', status: '0', createTime: t }];
export const MOCK_SHIPPING_ROUTES = [{ id: 23051, routeCode: 'AAS2', routeName: 'US West Express', shippingLineCode: 'COSU', originPortCode: 'CNSHA', destinationPortCode: 'USLAX', status: '0', createTime: t }];
export const MOCK_VESSELS = [{ id: 23061, vesselCode: 'VES-001', vesselName: 'Pacific Star', shippingLineCode: 'COSU', status: '0', createTime: t }];
export const MOCK_PLATFORMS = [{ id: 20061, platformCode: 'AMZ', platformName: 'Amazon', status: '0', createTime: t }];
export const MOCK_PLATFORM_ADDRESSES = [{ id: 20681, platformId: 20061, platformCode: 'AMZ', addressCode: 'LAX-FC', addressName: 'LA FC', status: '0', createTime: t }];

export function getCompanyList(params?: Record<string, any>) { return mockPage(MOCK_COMPANIES, params); }
export function getWarehouseList(params?: Record<string, any>) { let rows = [...MOCK_WAREHOUSES]; if (params?.status) rows = rows.filter(w => w.status === params.status); return mockPage(rows, params); }
export function getSkuList(params?: Record<string, any>) { return mockPage(MOCK_SKUS, params); }
export function getChannelList(params?: Record<string, any>) { return mockPage(MOCK_CHANNELS, params); }
export function getBusinessTypeList(params?: Record<string, any>) { return mockPage(MOCK_BUSINESS_TYPES, params); }
export function getVasList(params?: Record<string, any>) { return mockPage(MOCK_VAS, params); }
export function getCountryList(params?: Record<string, any>) { return mockPage(MOCK_COUNTRIES, params); }
export function getStateProvinceList(params?: Record<string, any>) { return mockPage(MOCK_STATE_PROVINCES, params); }
export function getCityList(params?: Record<string, any>) { return mockPage(MOCK_CITIES, params); }
export function getTimezoneList(params?: Record<string, any>) { return mockPage(MOCK_TIMEZONES, params); }
export function getZipCodeList(params?: Record<string, any>) { return mockPage(MOCK_ZIP_CODES, params); }
export function getCurrencyList(params?: Record<string, any>) { return mockPage(MOCK_CURRENCIES, params); }
export function getExchangeRateList(params?: Record<string, any>) { return mockPage(MOCK_EXCHANGE_RATES, params); }
export function getFeeItemList(params?: Record<string, any>) { return mockPage(MOCK_FEE_ITEMS, params); }
export function getPortList(params?: Record<string, any>) { return mockPage(MOCK_PORTS, params); }
export function getTerminalList(params?: Record<string, any>) { return mockPage(MOCK_TERMINALS, params); }
export function getShippingLineList(params?: Record<string, any>) { return mockPage(MOCK_SHIPPING_LINES, params); }
export function getShippingRouteList(params?: Record<string, any>) { return mockPage(MOCK_SHIPPING_ROUTES, params); }
export function getVesselList(params?: Record<string, any>) { return mockPage(MOCK_VESSELS, params); }
export function getPlatformList(params?: Record<string, any>) { return mockPage(MOCK_PLATFORMS, params); }
export function getPlatformAddressList(params?: Record<string, any>) { return mockPage(MOCK_PLATFORM_ADDRESSES, params); }
`);

// yms.ts: patch garbled Chinese fields only
const ymsPath = path.join(mockRoot, 'data/yms.ts');
let yms = fs.readFileSync(ymsPath, 'utf8');
const ymsPatches = [
  ["driverName: '\u738b\u5e08\u4ed8'", "driverName: '\u738b\u5e08\u4ed8'"],
  ["remark: '\u7b49\u5f85\u88c5\u8f66\u4f5c\u4e1a'", "remark: '\u7b49\u5f85\u88c5\u8f66\u4f5c\u4e1a'"],
  ["remark: '\u9662\u5185\u632a\u67dc'", "remark: '\u9662\u5185\u632a\u67dc'"],
  ["statusLabel: '\u5f85\u63a5\u53d6'", "statusLabel: '\u5f85\u63a5\u53d6'"],
  ["statusLabel: '\u5df2\u63a5\u53d6'", "statusLabel: '\u5df2\u63a5\u53d6'"],
  ["statusLabel: '\u6267\u884c\u4e2d'", "statusLabel: '\u6267\u884c\u4e2d'"],
  ["statusLabel: '\u5931\u8d25'", "statusLabel: '\u5931\u8d25'"],
  ["dockName: 'LA \u62c6\u67dc\u53e3 1'", "dockName: 'LA \u62c6\u67dc\u53e3 1'"],
  ["dockName: 'LA \u88c5\u8f66\u53e3 2'", "dockName: 'LA \u88c5\u8f66\u53e3 2'"],
  ["dockLocation: '\u524d\u9662'", "dockLocation: '\u524d\u9662'"],
  ["message: '\u8f66\u8f86 CA-TRK-001 \u7b7e\u5230\u5165\u573a'", "message: '\u8f66\u8f86 CA-TRK-001 \u7b7e\u5230\u5165\u573a'"],
  ["message: '\u4efb\u52a1 YT-2026-0001 \u5f00\u59cb\u4f5c\u4e1a'", "message: '\u4efb\u52a1 YT-2026-0001 \u5f00\u59cb\u4f5c\u4e1a'"],
  ["vehicleSource: 'OWN'", "vehicleSource: 'OWN_TRAILER'"],
  ["status: 'IN_YARD'", "status: 'ARRIVED'"]
];
// Replace any non-ascii string literals that look corrupted - use regex replace for driverName
yms = yms.replace(/driverName: '[^']*'/g, "driverName: '\u738b\u5e08\u4ed8'");
yms = yms.replace(/remark: '\u7b49\u5f85\u88c5\u8f66\u4f5c\u4e1a'|remark: '[^']*'/g, (m, i, s) => {
  if (m.includes('µÈ´ý')) return m;
  const idx = s.indexOf(m);
  const ctx = s.slice(Math.max(0, idx - 80), idx);
  if (ctx.includes('YT-2026-0002')) return "remark: '\u7b49\u5f85\u88c5\u8f66\u4f5c\u4e1a'";
  if (ctx.includes('CONTAINER_MOVE') || ctx.includes('IT-2026')) return "remark: '\u9662\u5185\u632a\u67dc'";
  return m;
});
yms = yms.replace(/statusLabel: '[^']+'/g, (m) => {
  if (m.includes('PENDING')) return "statusLabel: '\u5f85\u63a5\u53d6'";
  if (m.includes('ACCEPTED')) return "statusLabel: '\u5df2\u63a5\u53d6'";
  if (m.includes('IN_PROGRESS')) return "statusLabel: '\u6267\u884c\u4e2d'";
  if (m.includes('FAILED')) return "statusLabel: '\u5931\u8d25'";
  return m;
});
yms = yms.replace(/dockName: 'LA [^']+'/g, (m, i, s) => {
  const idx = s.indexOf(m);
  return s.slice(idx, idx + 30).includes('3010001') ? "dockName: 'LA \u62c6\u67dc\u53e3 1'" : "dockName: 'LA \u88c5\u8f66\u53e3 2'";
});
yms = yms.replace(/dockLocation: '[^']+'/g, "dockLocation: '\u524d\u9662'");
yms = yms.replace(/message: '[^']+'/g, (m, i, s) => {
  const idx = s.indexOf(m);
  const ctx = s.slice(idx - 40, idx);
  return ctx.includes('CHECK_IN') ? "message: '\u8f66\u8f86 CA-TRK-001 \u7b7e\u5230\u5165\u573a'" : "message: '\u4efb\u52a1 YT-2026-0001 \u5f00\u59cb\u4f5c\u4e1a'";
});
yms = yms.replace(/vehicleSource: 'OWN'/g, "vehicleSource: 'OWN_TRAILER'");
yms = yms.replace(/status: 'IN_YARD'/g, "status: 'ARRIVED'");
fs.writeFileSync(ymsPath, yms, 'utf8');
console.log('patched data/yms.ts');

const handlerPath = path.join(mockRoot, 'handler.ts');
let handler = fs.readFileSync(handlerPath, 'utf8');
handler = handler.replace("remark: 'Mock ????'", "remark: 'Mock \u8be6\u60c5'");
fs.writeFileSync(handlerPath, handler, 'utf8');
console.log('patched handler.ts');

console.log('done');
