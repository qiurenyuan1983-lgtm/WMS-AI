/** WMS 库位 / 库区 Mock 种子数据（对齐库位管理原型截图） */

type ZoneSeed = {
  id: number;
  zoneName: string;
  zoneType: string;
  storageMethod: 'FLOOR' | 'RACK';
  remark?: string | null;
};

type LocationSeed = {
  id: number;
  zoneId: number;
  zoneName: string;
  locationCode: string;
  rowNo: string | null;
  columnNo: string | null;
  capacity: number | null;
  currentQty: number;
  remainingCapacity: number | null;
  status: 'NORMAL' | 'LOCKED' | 'DISABLED';
};

const ZONE_SPECS: Array<Omit<ZoneSeed, 'id'>> = [
  { zoneName: 'A\u533a', zoneType: 'TEMP', storageMethod: 'FLOOR' },
  { zoneName: 'B\u533a', zoneType: 'TEMP', storageMethod: 'FLOOR' },
  { zoneName: 'C\u533a', zoneType: 'PRIVATE', storageMethod: 'FLOOR' },
  { zoneName: 'D\u533a', zoneType: 'BULK', storageMethod: 'FLOOR' },
  { zoneName: 'E\u533a', zoneType: 'EXPRESS', storageMethod: 'FLOOR' },
  { zoneName: 'FedEx\u533a', zoneType: 'EXPRESS', storageMethod: 'FLOOR' },
  { zoneName: 'F\u533a', zoneType: 'FBA', storageMethod: 'FLOOR' },
  { zoneName: 'G\u533a', zoneType: 'BULK', storageMethod: 'FLOOR' },
  { zoneName: 'H\u533a', zoneType: 'PRIVATE', storageMethod: 'FLOOR' },
  { zoneName: 'I\u533a', zoneType: 'TEMP', storageMethod: 'FLOOR' },
  { zoneName: 'J\u533a', zoneType: 'TEMP', storageMethod: 'FLOOR' },
  { zoneName: 'K\u533a', zoneType: 'FBA', storageMethod: 'FLOOR' },
  { zoneName: 'L\u533a', zoneType: 'EXPRESS', storageMethod: 'FLOOR' },
  { zoneName: 'M\u533a', zoneType: 'BULK', storageMethod: 'FLOOR' },
  { zoneName: 'N\u533a', zoneType: 'PRIVATE', storageMethod: 'FLOOR' },
  { zoneName: 'O\u533a', zoneType: 'TEMP', storageMethod: 'RACK' },
  { zoneName: 'P\u533a', zoneType: 'FBA', storageMethod: 'FLOOR' },
  { zoneName: 'Q\u533a', zoneType: 'EXPRESS', storageMethod: 'FLOOR' },
  { zoneName: 'R\u533a', zoneType: 'BULK', storageMethod: 'FLOOR' },
  { zoneName: 'S\u533a', zoneType: 'TEMP', storageMethod: 'FLOOR' },
  { zoneName: 'T\u533a', zoneType: 'PRIVATE', storageMethod: 'FLOOR' },
  { zoneName: 'U\u533a', zoneType: 'FBA', storageMethod: 'FLOOR' },
  { zoneName: 'V\u533a', zoneType: 'EXPRESS', storageMethod: 'FLOOR' },
  { zoneName: 'W\u533a', zoneType: 'BULK', storageMethod: 'FLOOR' },
  { zoneName: 'X\u533a', zoneType: 'TEMP', storageMethod: 'FLOOR' }
];

/** A 区首屏 10 条 — 与原型一致，库存不超过容量 */
const A_ZONE_FIRST_PAGE: Array<{ code: string; row: string; col: string; qty: number }> = [
  { code: 'A01', row: '30', col: '13', qty: 4 },
  { code: 'A02', row: '29', col: '13', qty: 0 },
  { code: 'A03', row: '28', col: '13', qty: 5 },
  { code: 'A04', row: '27', col: '13', qty: 6 },
  { code: 'A05', row: '26', col: '13', qty: 0 },
  { code: 'A06', row: '25', col: '13', qty: 7 },
  { code: 'A07', row: '24', col: '13', qty: 0 },
  { code: 'A08', row: '23', col: '13', qty: 3 },
  { code: 'A09', row: '22', col: '13', qty: 8 },
  { code: 'A10', row: '21', col: '13', qty: 8 }
];

const DEFAULT_CAPACITY = 8;
const DEFAULT_COLUMN = '13';
const LOCATIONS_PER_ZONE = 40;
const LOCATION_TOTAL = 1038;

function zoneIdStart() {
  return 60001;
}

function locationIdStart() {
  return 60101;
}

function zoneCodePrefix(zoneName: string) {
  if (zoneName === 'FedEx\u533a') return 'FedEx';
  return zoneName.replace('\u533a', '');
}

function pickQty(index: number, capacity: number) {
  const pattern = [4, 0, 5, 6, 0, 7, 0, 3, 8, 2, 1, 0, 4, 5, 8, 0, 6, 7, 0, 3];
  return Math.min(capacity, pattern[index % pattern.length]);
}

export function buildMockWmsZones(base: Record<string, unknown>): ZoneSeed[] {
  return ZONE_SPECS.map((spec, index) => ({
    id: zoneIdStart() + index,
    ...spec,
    allowMixedStorage: spec.zoneType === 'PRIVATE' ? 0 : 1,
    maxMixedQty: spec.zoneType === 'PRIVATE' ? null : 50,
    status: 'ENABLED',
    remark: null,
    ...base
  })) as ZoneSeed[];
}

export function buildMockWmsLocations(base: Record<string, unknown>, zones: ZoneSeed[]): LocationSeed[] {
  const rows: LocationSeed[] = [];
  let id = locationIdStart();

  zones.forEach(zone => {
    const prefix = zoneCodePrefix(zone.zoneName);
    const isAZone = zone.zoneName === 'A\u533a';

    for (let i = 0; i < LOCATIONS_PER_ZONE && rows.length < LOCATION_TOTAL; i += 1) {
      const sample = isAZone && i < A_ZONE_FIRST_PAGE.length ? A_ZONE_FIRST_PAGE[i] : null;
      const n = i + 1;
      const code = sample?.code ?? `${prefix}${String(n).padStart(2, '0')}`;
      const rowNo = sample?.row ?? String(Math.max(1, 30 - (i % 30)));
      const columnNo = sample?.col ?? DEFAULT_COLUMN;
      const qty = sample?.qty ?? pickQty(i, DEFAULT_CAPACITY);

      rows.push({
        id: id++,
        zoneId: zone.id,
        zoneName: zone.zoneName,
        locationCode: code,
        rowNo,
        columnNo,
        capacity: DEFAULT_CAPACITY,
        currentQty: qty,
        remainingCapacity: DEFAULT_CAPACITY - qty,
        status: 'NORMAL',
        ...base
      } as LocationSeed);
    }
  });

  return rows.slice(0, LOCATION_TOTAL);
}

export function resolveMockZoneName(zones: ZoneSeed[], zoneId?: CommonType.IdType | null, zoneName?: string | null) {
  const raw = zoneName?.trim();
  if (raw && !/^现存无此/.test(raw)) return raw;
  if (zoneId == null) return raw || '\u2014';
  const zone = zones.find(z => z.id === Number(zoneId));
  return zone?.zoneName || raw || '\u2014';
}
