import { mockPage, mockTree } from '../utils';
import { getAllMockDictTypes } from '../dict-data';

export const MOCK_USERS = [
  { userId: 1, userName: 'admin', nickName: '原型管理员', deptId: 100, deptName: '研发部门', phonenumber: '13800000000', status: '0', createTime: '2026-01-01 00:00:00' },
  { userId: 2, userName: 'demo', nickName: '演示用户', deptId: 100, deptName: '研发部门', phonenumber: '13800000001', status: '0', createTime: '2026-01-02 00:00:00' }
];

export const MOCK_ROLES = [
  { roleId: 1, roleName: '超级管理员', roleKey: 'admin', status: '0', createTime: '2026-01-01' },
  { roleId: 2, roleName: '普通角色', roleKey: 'common', status: '0', createTime: '2026-01-01' }
];

export const MOCK_DEPTS = mockTree([
  { deptId: 100, parentId: 0, deptName: '演示公司', orderNum: 0, status: '0', children: [
    { deptId: 101, parentId: 100, deptName: '仓储部', orderNum: 1, status: '0', children: [] },
    { deptId: 102, parentId: 100, deptName: '运营部', orderNum: 2, status: '0', children: [] }
  ]}
]);

export const MOCK_MENUS = mockTree([
  { menuId: 1, menuName: '系统管理', parentId: 0, orderNum: 1, path: 'system', component: 'Layout', menuType: 'M', status: '0', children: [
    { menuId: 2, menuName: '用户管理', parentId: 1, orderNum: 1, path: 'user', component: 'system/user/index', menuType: 'C', status: '0', children: [] }
  ]}
]);

export function getUserList(params?: Record<string, any>) { return mockPage(MOCK_USERS, params); }
export function getRoleList(params?: Record<string, any>) { return mockPage(MOCK_ROLES, params); }

export function getDictTypeList(params?: Record<string, any>) {
  const rows = getAllMockDictTypes().map((type, i) => ({ dictId: i + 1, dictName: type, dictType: type, status: '0', remark: 'Mock 字典' }));
  return mockPage(rows, params);
}

export const MOCK_ORG_SCOPE = {
  companies: [{ companyId: 4000001, companyCode: 'DEMO', companyName: '演示物流公司' }],
  warehouses: [
    { warehouseId: 5000001, warehouseCode: 'WH-LA-01', warehouseName: '洛杉矶一号仓' },
    { warehouseId: 5000002, warehouseCode: 'WH-NJ-01', warehouseName: '新泽西一号仓' }
  ],
  current: { companyId: 4000001, warehouseId: 5000001 }
};
