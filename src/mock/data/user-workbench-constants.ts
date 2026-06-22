/** 用户与权限工作台轻量常量（避免 import system.ts 触发 MENU_FLAT 构建） */

export const ACCOUNT_TYPE_OPTIONS = [
  { label: '内部员工', value: 'INTERNAL' },
  { label: '外部协作', value: 'EXTERNAL' },
  { label: 'PDA 账号', value: 'PDA' },
  { label: '司机账号', value: 'DRIVER' }
];

export const MOCK_ORG_SCOPE = {
  companies: [{ companyId: 4000001, companyCode: 'DEMO', companyName: '演示物流公司' }],
  warehouses: [
    { warehouseId: 5000001, warehouseCode: 'WH-LA-01', warehouseName: '洛杉矶一号仓' },
    { warehouseId: 5000002, warehouseCode: 'WH-NJ-01', warehouseName: '新泽西一号仓' }
  ],
  current: {
    companyId: 4000001,
    warehouseId: 5000001,
    companyName: '演示物流公司',
    warehouseName: '洛杉矶一号仓'
  }
};
