/** 原型模式公共基础数据 */

export const MOCK_COMPANY = {
  id: 4000001,
  companyCode: 'DEMO',
  companyName: '演示物流公司',
  status: '0'
};

export const MOCK_WAREHOUSE = {
  id: 5000001,
  companyId: 4000001,
  warehouseCode: 'WH-LA-01',
  warehouseName: '洛杉矶一号仓',
  status: '0'
};

export const MOCK_WAREHOUSE_OPTIONS = [
  {
    id: 5000001,
    companyId: 4000001,
    warehouseCode: 'WH-LA-01',
    warehouseName: '洛杉矶一号仓',
    status: '0'
  },
  {
    id: 5000002,
    companyId: 4000001,
    warehouseCode: 'WH-NJ-01',
    warehouseName: '新泽西一号仓',
    status: '0'
  }
];
