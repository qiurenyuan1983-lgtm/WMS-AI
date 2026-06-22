import { MOCK_WAREHOUSE } from './common';
import { mockPage } from '../utils';

const B_ZONE_LOCATIONS = Array.from({ length: 26 }, (_, i) => `B${String(i + 1).padStart(2, '0')}`).join(', ');
const X_ZONE_LOCATIONS = Array.from({ length: 48 }, (_, i) => `X${String(i + 1).padStart(2, '0')}`).join(', ');

export const MOCK_ZONE_RULES: Api.Oms.ZoneRule[] = [
  {
    id: 920000,
    warehouseId: MOCK_WAREHOUSE.id,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    targetType: 'LOCATION',
    conditionLogic: 'OR',
    conditions: [{ priority: 1, deliveryMethod: 'TRUCK', platform: 'AMAZON', platformCode: null }],
    zoneNames: 'X区',
    locationNos: X_ZONE_LOCATIONS,
    zoneType: null,
    storageMethod: null,
    priority: 1,
    deliveryMethod: 'TRUCK',
    platform: 'AMAZON',
    platformCode: '亚马逊: 不限代码',
    createTime: '2026-05-01 09:00:00',
    updateTime: '2026-06-05 10:00:00'
  },
  {
    id: 920001,
    warehouseId: MOCK_WAREHOUSE.id,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    targetType: 'LOCATION',
    conditionLogic: 'OR',
    conditions: [{ priority: 1, deliveryMethod: 'PRIVATE_WH', platform: null, platformCode: null }],
    zoneNames: 'B区',
    locationNos: B_ZONE_LOCATIONS,
    zoneType: null,
    storageMethod: null,
    priority: 1,
    deliveryMethod: 'PRIVATE_WH',
    platform: 'ANY',
    platformCode: null,
    createTime: '2026-05-01 10:00:00',
    updateTime: '2026-06-01 09:00:00'
  },
  {
    id: 920002,
    warehouseId: MOCK_WAREHOUSE.id,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    zoneNames: 'B区',
    locationNos: 'B01, B02, B03, B04, B05, B06, B07, B08, B09, B10',
    zoneType: null,
    storageMethod: null,
    priority: 4,
    deliveryMethod: 'TRUCK',
    platform: 'AMAZON',
    platformCode: '亚马逊: SBD2, 亚马逊: XLX7',
    createTime: '2026-05-02 11:00:00',
    updateTime: '2026-06-02 10:00:00'
  },
  {
    id: 920003,
    warehouseId: MOCK_WAREHOUSE.id,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    zoneNames: 'F区',
    locationNos: 'F01, F02, F03, F04, F05, F06, F07, F08',
    zoneType: null,
    storageMethod: null,
    priority: 1,
    deliveryMethod: 'TRUCK',
    platform: 'AMAZON',
    platformCode: '亚马逊: ONT8, 亚马逊: LGB8',
    createTime: '2026-05-03 09:30:00',
    updateTime: '2026-06-03 08:00:00'
  },
  {
    id: 920004,
    warehouseId: MOCK_WAREHOUSE.id,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    zoneNames: 'H区, I区, J区',
    locationNos: 'H01-H20, I01-I15, J01-J10',
    zoneType: null,
    storageMethod: null,
    priority: 1,
    deliveryMethod: 'DROPSHIP',
    platform: 'ANY',
    platformCode: null,
    createTime: '2026-05-04 14:00:00',
    updateTime: '2026-06-04 07:30:00'
  },
  {
    id: 920005,
    warehouseId: MOCK_WAREHOUSE.id,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    zoneNames: 'C区',
    locationNos: 'C01, C02, C03, C04, C05',
    zoneType: '高架',
    storageMethod: '卡板',
    priority: 2,
    deliveryMethod: 'HOLD_TRANSFER',
    platform: 'ANY',
    platformCode: null,
    createTime: '2026-05-05 10:00:00',
    updateTime: '2026-06-01 16:00:00'
  },
  {
    id: 920006,
    warehouseId: MOCK_WAREHOUSE.id,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    zoneNames: 'A区',
    locationNos: 'A01-A30',
    zoneType: '贵品',
    storageMethod: '卡板',
    priority: 1,
    deliveryMethod: 'TRUCK',
    platform: 'AMAZON',
    platformCode: '亚马逊: XLX7',
    createTime: '2026-05-06 08:00:00',
    updateTime: '2026-05-28 12:00:00'
  },
  {
    id: 920007,
    warehouseId: MOCK_WAREHOUSE.id,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    zoneNames: 'D区',
    locationNos: 'D01-D12',
    zoneType: '地面',
    storageMethod: '地板',
    priority: 3,
    deliveryMethod: 'PRIVATE_WH',
    platform: 'WALMART',
    platformCode: 'Walmart: LAX2',
    createTime: '2026-05-07 11:00:00',
    updateTime: '2026-05-30 09:00:00'
  },
  {
    id: 920008,
    warehouseId: MOCK_WAREHOUSE.id,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    zoneNames: 'E区',
    locationNos: 'E01-E18',
    zoneType: '高架',
    storageMethod: '卡板',
    priority: 2,
    deliveryMethod: 'TRUCK',
    platform: 'AMAZON',
    platformCode: '亚马逊: SBD2',
    createTime: '2026-05-08 13:00:00',
    updateTime: '2026-06-02 15:00:00'
  }
];

const EXTRA_DELIVERY = ['PRIVATE_WH', 'TRUCK', 'DROPSHIP', 'HOLD_TRANSFER'] as const;
const EXTRA_PLATFORM = ['ANY', 'AMAZON', 'WALMART'] as const;
const ZONE_LETTERS = ['G', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

for (let i = 0; i < 24; i++) {
  const letter = ZONE_LETTERS[i % ZONE_LETTERS.length];
  const id = 920009 + i;
  MOCK_ZONE_RULES.push({
    id,
    warehouseId: MOCK_WAREHOUSE.id,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    zoneNames: `${letter}区`,
    locationNos: `${letter}01-${letter}${String(10 + (i % 8)).padStart(2, '0')}`,
    zoneType: i % 3 === 0 ? '高架' : i % 3 === 1 ? '地面' : null,
    storageMethod: i % 2 === 0 ? '卡板' : i % 2 === 1 ? '地板' : null,
    priority: (i % 5) + 1,
    deliveryMethod: EXTRA_DELIVERY[i % EXTRA_DELIVERY.length],
    platform: EXTRA_PLATFORM[i % EXTRA_PLATFORM.length],
    platformCode: i % 3 === 0 ? `亚马逊: XLX7` : i % 3 === 1 ? null : 'Walmart: LAX2',
    createTime: `2026-05-${String(10 + (i % 18)).padStart(2, '0')} 10:00:00`,
    updateTime: '2026-06-03 10:00:00'
  });
}

let seq = 930000;

export function getZoneRuleList(params?: Record<string, unknown>) {
  let rows = [...MOCK_ZONE_RULES];
  const zoneName = params?.zoneName as string | undefined;
  const locationNo = params?.locationNo as string | undefined;
  const zoneType = params?.zoneType as string | undefined;
  const storageMethod = params?.storageMethod as string | undefined;
  const deliveryMethod = params?.deliveryMethod as string | undefined;
  const platform = params?.platform as string | undefined;
  const platformCode = params?.platformCode as string | undefined;

  if (zoneName) {
    const kw = zoneName.toLowerCase();
    rows = rows.filter(r => (r.zoneNames || '').toLowerCase().includes(kw));
  }
  if (locationNo) {
    const kw = locationNo.toLowerCase();
    rows = rows.filter(r => (r.locationNos || '').toLowerCase().includes(kw));
  }
  if (zoneType) rows = rows.filter(r => r.zoneType === zoneType);
  if (storageMethod) rows = rows.filter(r => r.storageMethod === storageMethod);
  if (deliveryMethod) rows = rows.filter(r => r.deliveryMethod === deliveryMethod);
  if (platform) {
    const kw = platform.toLowerCase();
    rows = rows.filter(r => (r.platform || '').toLowerCase().includes(kw));
  }
  if (platformCode) {
    const kw = platformCode.toLowerCase();
    rows = rows.filter(r => (r.platformCode || '').toLowerCase().includes(kw));
  }

  return mockPage(rows, params);
}

export function getZoneRuleDetail(id: CommonType.IdType) {
  return MOCK_ZONE_RULES.find(r => String(r.id) === String(id));
}

export function createZoneRule(data: Api.Oms.ZoneRuleOperateParams) {
  const primary = data.conditions[0];
  const row: Api.Oms.ZoneRule = {
    id: ++seq,
    warehouseId: MOCK_WAREHOUSE.id,
    warehouseName: MOCK_WAREHOUSE.warehouseName,
    targetType: data.targetType,
    conditionLogic: data.conditionLogic,
    conditions: data.conditions,
    zoneNames: data.zoneNames,
    locationNos: data.locationNos,
    zoneType: data.zoneType ?? null,
    storageMethod: data.storageMethod ?? null,
    priority: primary?.priority ?? data.priority,
    deliveryMethod: primary?.deliveryMethod ?? data.deliveryMethod,
    platform: primary?.platform ?? data.platform ?? 'ANY',
    platformCode: primary?.platformCode ?? data.platformCode ?? null,
    remark: data.remark ?? null,
    createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    updateTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
  };
  MOCK_ZONE_RULES.unshift(row);
  return row;
}

export function updateZoneRule(data: Api.Oms.ZoneRuleOperateParams & { id: CommonType.IdType }) {
  const idx = MOCK_ZONE_RULES.findIndex(r => String(r.id) === String(data.id));
  const primary = data.conditions[0];
  if (idx >= 0) {
    MOCK_ZONE_RULES[idx] = {
      ...MOCK_ZONE_RULES[idx],
      ...data,
      priority: primary?.priority ?? data.priority,
      deliveryMethod: primary?.deliveryMethod ?? data.deliveryMethod,
      platform: primary?.platform ?? data.platform ?? 'ANY',
      platformCode: primary?.platformCode ?? data.platformCode ?? null,
      updateTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };
  }
  return MOCK_ZONE_RULES[idx];
}

export function deleteZoneRule(ids: string) {
  const idSet = new Set(ids.split(','));
  for (let i = MOCK_ZONE_RULES.length - 1; i >= 0; i--) {
    if (idSet.has(String(MOCK_ZONE_RULES[i].id))) MOCK_ZONE_RULES.splice(i, 1);
  }
}

export const ZONE_RULE_DEFAULT_FALLBACK = {
  zoneNames: 'Z区',
  locationNos: 'Z01-Z05',
  priority: 99,
  deliveryMethod: 'ANY',
  platform: 'ANY'
};
