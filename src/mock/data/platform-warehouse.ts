import { mockPage, nextId } from '../utils';

const AMAZON_CODES = [
  'TOL3', 'OLM1', 'AMZ', 'ABQ2', 'ONT8', 'LGB8', 'SBD2', 'XLX7', 'PHX3', 'PHX5',
  'FTW1', 'DFW6', 'HOU2', 'SAT1', 'MDW2', 'IND9', 'CMH1', 'AVP1', 'TEB3', 'TEB6',
  'ABE8', 'ACY2', 'BWI2', 'CLT2', 'GSP1', 'JAX3', 'MGE3', 'PBI3', 'TPA2', 'XUS3',
  'YVR2', 'YYZ4', 'YOW1', 'YHM1', 'YEG1', 'YVR4', 'YYC1', 'YXX2', 'YOW3', 'YHM2'
];

const US_ADDRESSES = [
  '9240 Fremont Pike Perrysburg OH',
  '410 West Valley Blvd Alhambra CA',
  '550 Oak Ridge Rd Hazleton PA',
  '5000 Pan American Fwy NE Albuquerque NM',
  '1910 E Central Ave San Bernardino CA',
  '21501 Gateway Center Dr Clarksburg MD',
  '401 Independence Rd Florence NJ',
  '500 Amazon Way Dupont WA'
];

const CA_ADDRESSES = [
  '8050 Heritage Rd Brampton ON',
  '6363 Millcreek Drive Mississauga ON',
  '4500 Dixie Road Mississauga ON',
  '11555 24 Street SE Calgary AB'
];

function parseWarehouseCode(raw: string) {
  return raw.split(' / ')[0].trim();
}

function parseZipFromAddress(address: string) {
  const match = address.match(/\b(\d{5})(?:-\d{4})?\s*$/);
  return match?.[1] ?? '';
}

/** Walmart / WFS 官方仓库清单 */
const WALMART_WFS_PRESETS: Array<{
  warehouseName: string;
  warehouseCode: string;
  address: string;
}> = [
  { warehouseName: 'Walmart LAX2 Chino CA', warehouseCode: 'LAX2', address: '6720 Kimball Ave, Chino, CA 91708' },
  { warehouseName: 'Walmart LAX1 Chino CA', warehouseCode: 'LAX1', address: '6750 Kimball Ave, Chino, CA 91708' },
  { warehouseName: 'Walmart SMF1 Sacramento CA', warehouseCode: 'SMF1', address: '7000 Powerline Rd, Sacramento, CA 95837' },
  { warehouseName: 'Walmart PHX1 Litchfield Park AZ', warehouseCode: 'PHX1', address: '6600 N Sarival Ave, Litchfield Park, AZ 85340' },
  { warehouseName: 'Walmart NJ3 Pedricktown NJ', warehouseCode: 'NJ3', address: '3 Sorbello Rd, Pedricktown, NJ 08067' },
  { warehouseName: 'Walmart NJ3T Pedricktown NJ', warehouseCode: 'NJ3T', address: '7 Sorbello Rd, Pedricktown, NJ 08067' },
  {
    warehouseName: 'Walmart PHL2 Bethlehem PA',
    warehouseCode: parseWarehouseCode('PHL2 / W-PHL2'),
    address: '2785 Commerce Center Blvd, Bethlehem, PA 18015'
  },
  { warehouseName: 'Walmart PHL1 Bethlehem PA', warehouseCode: 'PHL1s', address: '3215 Commerce Center Blvd, Bethlehem, PA 18015' },
  { warehouseName: 'Walmart PHL4 Shippensburg PA', warehouseCode: 'PHL4n', address: '1410 United Dr, Shippensburg, PA 17257' },
  { warehouseName: 'Walmart ORD1 Joliet IL', warehouseCode: 'ORD1s', address: '3501 Brandon Rd, Joliet, IL 60436' },
  { warehouseName: 'Walmart IND1 Plainfield IN', warehouseCode: 'IND1', address: '9590 AllPoints Pkwy, Plainfield, IN 46168' },
  {
    warehouseName: 'Walmart IND2 Avon / Plainfield IN',
    warehouseCode: 'IND2',
    address: '9360 AllPoints Pkwy, Avon / Plainfield, IN 46123 / 46168'
  },
  { warehouseName: 'Walmart W-IND3 McCordsville IN', warehouseCode: 'W-IND3', address: '5756 Enterprise Dr, McCordsville, IN 46055' },
  { warehouseName: 'Walmart CVG1 Monroe OH', warehouseCode: 'CVG1n', address: '650 Gateway Blvd, Monroe, OH 45050' },
  {
    warehouseName: 'Walmart DFW / Fort Worth TX',
    warehouseCode: parseWarehouseCode('DFW6n / 3005 / 3865'),
    address: '14700 Blue Mound Rd, Fort Worth, TX 76052'
  },
  { warehouseName: 'Walmart DFW5 Lancaster TX', warehouseCode: 'DFW5s', address: '2500 E Belt Line Rd, Lancaster, TX 75146' },
  {
    warehouseName: 'Walmart DFW1 Fort Worth TX',
    warehouseCode: parseWarehouseCode('DFW1s / 7006'),
    address: '5300 Westport Pkwy, Fort Worth, TX 76177'
  },
  {
    warehouseName: 'Walmart ATL1 Atlanta GA',
    warehouseCode: parseWarehouseCode('ATL1 / 4030'),
    address: '6055 S Fulton Pkwy, Atlanta, GA 30349'
  },
  { warehouseName: 'Walmart ATL2 Carrollton GA', warehouseCode: 'ATL2', address: '3101 US-27 / 3101 N Highway 27, Carrollton, GA 30117' },
  {
    warehouseName: 'Walmart ATL3 Pendergrass GA',
    warehouseCode: parseWarehouseCode('ATL3 / CLT1n'),
    address: '445 Valentine Industrial Pkwy / 117 Valentine Industrial Parkway Extension, Pendergrass, GA 30567'
  },
  { warehouseName: 'Walmart MCI1 Topeka KS', warehouseCode: 'MCI1n', address: '1303 SW Innovation Pkwy, Topeka, KS 66619' },
  { warehouseName: 'Walmart KS1 Edgerton KS', warehouseCode: 'KS1', address: '30801 W 191st St, Edgerton, KS 66021' },
  { warehouseName: 'Walmart MCO1 Davenport FL', warehouseCode: 'MCO1', address: '5100 N Ridge Trail, Davenport, FL 33897' },
  {
    warehouseName: 'Walmart MEM1 Olive Branch MS',
    warehouseCode: parseWarehouseCode('MEM1-S / W-MEM1s'),
    address: '10480 Marina Dr / 9200 Alexander Rd, Olive Branch, MS 38654'
  },
  { warehouseName: 'Walmart KY1 Shepherdsville KY', warehouseCode: 'KY1', address: '120 Velocity Way, Shepherdsville, KY 40165' },
  { warehouseName: 'Walmart CLT1 Troutman NC', warehouseCode: 'CLT1n', address: '386 Murdock Rd, Troutman, NC 28166' },
  { warehouseName: 'Walmart SLC Salt Lake City UT', warehouseCode: '3365', address: '990 N 6550 W, Salt Lake City, UT 84116' },
  { warehouseName: 'Walmart Stockton CA', warehouseCode: '4091', address: '5150 E Mariposa Rd, Stockton, CA 95215' },
  { warehouseName: 'Walmart Chino Regional DC', warehouseCode: '4093', address: '6730 Kimball Ave, Chino, CA 91708' }
];

function buildWalmartWfsWarehouses(platformId: number): Api.Oms.PlatformWarehouse[] {
  return WALMART_WFS_PRESETS.map((item, index) => ({
    id: 940001 + index,
    platformId,
    platformCode: 'WAL',
    warehouseCode: item.warehouseCode,
    warehouseName: item.warehouseName,
    countryCode: 'US',
    countryName: '\u7f8e\u56fd',
    address: item.address,
    zipCode: parseZipFromAddress(item.address),
    cbmPerPallet: 2,
    status: '0',
    createTime: `2024-03-${String((index % 28) + 1).padStart(2, '0')} ${String(9 + (index % 10)).padStart(2, '0')}:00:00`
  }));
}

function buildAmazonWarehouses(platformId: number, platformCode: string) {
  const rows: Api.Oms.PlatformWarehouse[] = [];
  for (let i = 0; i < 344; i += 1) {
    const code = AMAZON_CODES[i % AMAZON_CODES.length] + (i >= AMAZON_CODES.length ? String(Math.floor(i / AMAZON_CODES.length)) : '');
    const isCa = i % 7 === 3 || i % 11 === 5;
    const countryCode = isCa ? 'CA' : 'US';
    const countryName = isCa ? '\u52a0\u62ff\u5927' : '\u7f8e\u56fd';
    const addressPool = isCa ? CA_ADDRESSES : US_ADDRESSES;
    const address = addressPool[i % addressPool.length];
    rows.push({
      id: 941001 + i,
      platformId,
      platformCode,
      warehouseCode: code,
      warehouseName: i % 5 === 2 && isCa ? '\u4e9a\u9a6c\u900a-\u52a0\u62ff\u5927' : code,
      countryCode,
      countryName,
      address,
      zipCode: isCa ? String(60000 + (i % 9000)) : String(40000 + (i % 50000)),
      cbmPerPallet: 2,
      status: '0',
      createTime: `2024-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')} ${String(8 + (i % 12)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00`
    });
  }
  return rows;
}

export let MOCK_PLATFORMS: Api.Oms.PlatformEntity[] = [
  {
    id: 930001,
    platformName: 'Walmart',
    platformCode: 'WAL',
    status: '0',
    warehouseCount: WALMART_WFS_PRESETS.length,
    remark: 'Walmart / WFS',
    createTime: '2024-01-10 09:00:00'
  },
  {
    id: 930002,
    platformName: '\u4e9a\u9a6c\u900a',
    platformCode: 'AMZ',
    status: '0',
    warehouseCount: 344,
    remark: null,
    createTime: '2024-01-08 10:30:00'
  },
  {
    id: 930003,
    platformName: 'Target',
    platformCode: 'TGT',
    status: '0',
    warehouseCount: 12,
    remark: null,
    createTime: '2024-02-15 14:20:00'
  }
];

export let MOCK_PLATFORM_WAREHOUSES: Api.Oms.PlatformWarehouse[] = [
  ...buildWalmartWfsWarehouses(930001),
  ...buildAmazonWarehouses(930002, 'AMZ'),
  ...Array.from({ length: 12 }, (_, i) => ({
    id: 950001 + i,
    platformId: 930003,
    platformCode: 'TGT',
    warehouseCode: `TGT${String(i + 1).padStart(2, '0')}`,
    warehouseName: `Target FC ${i + 1}`,
    countryCode: 'US',
    countryName: '\u7f8e\u56fd',
    address: US_ADDRESSES[i % US_ADDRESSES.length],
    zipCode: String(55000 + i * 111),
    cbmPerPallet: 2,
    status: i === 10 ? '1' : '0',
    createTime: `2024-06-${String((i % 28) + 1).padStart(2, '0')} 10:00:00`
  }))
];

function syncPlatformCounts() {
  MOCK_PLATFORMS = MOCK_PLATFORMS.map(p => ({
    ...p,
    warehouseCount: MOCK_PLATFORM_WAREHOUSES.filter(w => w.platformId === p.id).length
  }));
}

syncPlatformCounts();

export function getPlatformList(params?: Record<string, any>) {
  const keyword = String(params?.keyword || '').trim().toLowerCase();
  let rows = [...MOCK_PLATFORMS];
  if (keyword) {
    rows = rows.filter(
      p =>
        p.platformName.toLowerCase().includes(keyword) ||
        p.platformCode.toLowerCase().includes(keyword)
    );
  }
  if (params?.status !== undefined && params?.status !== null && params?.status !== '') {
    rows = rows.filter(p => p.status === params.status);
  }
  return { rows, total: rows.length };
}

export function getPlatformWarehouseList(params?: Record<string, any>) {
  let rows = [...MOCK_PLATFORM_WAREHOUSES];
  if (params?.platformId) {
    rows = rows.filter(w => String(w.platformId) === String(params.platformId));
  }
  const keyword = String(params?.keyword || '').trim().toLowerCase();
  if (keyword) {
    rows = rows.filter(
      w =>
        w.warehouseCode.toLowerCase().includes(keyword) ||
        w.warehouseName.toLowerCase().includes(keyword)
    );
  }
  if (params?.status !== undefined && params?.status !== null && params?.status !== '') {
    rows = rows.filter(w => w.status === params.status);
  }
  if (params?.countryCode) {
    const kw = String(params.countryCode).toLowerCase();
    rows = rows.filter(w => (w.countryCode || '').toLowerCase().includes(kw));
  }
  return mockPage(rows, params);
}

export function createPlatform(data: Api.Oms.PlatformOperateParams) {
  const row: Api.Oms.PlatformEntity = {
    id: nextId(),
    platformName: data.platformName!,
    platformCode: data.platformCode!,
    status: data.status ?? '0',
    warehouseCount: 0,
    remark: data.remark ?? null,
    createTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
  };
  MOCK_PLATFORMS.push(row);
  return row;
}

export function updatePlatform(data: Api.Oms.PlatformOperateParams & { id: CommonType.IdType }) {
  const idx = MOCK_PLATFORMS.findIndex(p => p.id === data.id);
  if (idx >= 0) {
    MOCK_PLATFORMS[idx] = {
      ...MOCK_PLATFORMS[idx],
      platformName: data.platformName ?? MOCK_PLATFORMS[idx].platformName,
      platformCode: data.platformCode ?? MOCK_PLATFORMS[idx].platformCode,
      status: data.status ?? MOCK_PLATFORMS[idx].status,
      remark: data.remark ?? MOCK_PLATFORMS[idx].remark
    };
  }
}

export function deletePlatform(ids: string) {
  const idList = ids.split(',').map(Number);
  MOCK_PLATFORMS = MOCK_PLATFORMS.filter(p => !idList.includes(Number(p.id)));
  MOCK_PLATFORM_WAREHOUSES = MOCK_PLATFORM_WAREHOUSES.filter(w => !idList.includes(Number(w.platformId)));
  syncPlatformCounts();
}

export function createPlatformWarehouse(data: Api.Oms.PlatformWarehouseOperateParams) {
  const platform = MOCK_PLATFORMS.find(p => p.id === data.platformId);
  const row: Api.Oms.PlatformWarehouse = {
    id: nextId(),
    platformId: data.platformId!,
    platformCode: platform?.platformCode || '',
    warehouseCode: data.warehouseCode!,
    warehouseName: data.warehouseName!,
    countryCode: data.countryCode!,
    countryName: data.countryName!,
    address: data.address!,
    zipCode: data.zipCode!,
    cbmPerPallet: data.cbmPerPallet ?? 2,
    status: data.status ?? '0',
    createTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
  };
  MOCK_PLATFORM_WAREHOUSES.push(row);
  syncPlatformCounts();
  return row;
}

export function updatePlatformWarehouse(data: Api.Oms.PlatformWarehouseOperateParams & { id: CommonType.IdType }) {
  const idx = MOCK_PLATFORM_WAREHOUSES.findIndex(w => w.id === data.id);
  if (idx >= 0) {
    MOCK_PLATFORM_WAREHOUSES[idx] = {
      ...MOCK_PLATFORM_WAREHOUSES[idx],
      warehouseCode: data.warehouseCode ?? MOCK_PLATFORM_WAREHOUSES[idx].warehouseCode,
      warehouseName: data.warehouseName ?? MOCK_PLATFORM_WAREHOUSES[idx].warehouseName,
      countryCode: data.countryCode ?? MOCK_PLATFORM_WAREHOUSES[idx].countryCode,
      countryName: data.countryName ?? MOCK_PLATFORM_WAREHOUSES[idx].countryName,
      address: data.address ?? MOCK_PLATFORM_WAREHOUSES[idx].address,
      zipCode: data.zipCode ?? MOCK_PLATFORM_WAREHOUSES[idx].zipCode,
      cbmPerPallet: data.cbmPerPallet ?? MOCK_PLATFORM_WAREHOUSES[idx].cbmPerPallet,
      status: data.status ?? MOCK_PLATFORM_WAREHOUSES[idx].status
    };
  }
}

export function updatePlatformWarehouseStatus(id: CommonType.IdType, status: string) {
  const row = MOCK_PLATFORM_WAREHOUSES.find(w => w.id === id);
  if (row) row.status = status;
}

export function deletePlatformWarehouse(ids: string) {
  const idList = ids.split(',').map(Number);
  MOCK_PLATFORM_WAREHOUSES = MOCK_PLATFORM_WAREHOUSES.filter(w => !idList.includes(Number(w.id)));
  syncPlatformCounts();
}
