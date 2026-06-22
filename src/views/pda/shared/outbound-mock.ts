import { enrichTripDeadlineFields } from '@/utils/tms/trip-deadline';

export type OutboundPallet = {
  palletNo: string;
  destination: string;
  containerNo: string;
  qty: number;
  scanned: boolean;
  loaded: boolean;
  loadScanned: boolean;
  /** HOLD 货物禁止装车 */
  hold?: boolean;
};

export type OutboundLocation = {
  locationCode: string;
  pallets: OutboundPallet[];
};

export type OutboundTrip = {
  tripNo: string;
  dockNo: string;
  carriageNo: string;
  locations: OutboundLocation[];
  appointmentTime?: string | null;
  originWarehouse?: string;
  destination?: string;
  palletQty?: number;
  cartonQty?: number;
  latestStartLoadingTime?: string | null;
  latestFinishTime?: string | null;
  remainingMinutes?: number | null;
  deadlineRiskLevel?: 'NORMAL' | 'NEAR' | 'URGENT' | 'OVERDUE';
  distanceMiles?: number;
  estimatedTravelMinutes?: number;
};

function formatTripDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function enrichOutboundTrip(trip: OutboundTrip): OutboundTrip {
  const pallets = trip.locations.flatMap(l => l.pallets);
  const palletQty = pallets.length;
  const cartonQty = pallets.reduce((s, p) => s + p.qty, 0);
  const destination = pallets[0]?.destination ?? '洛杉矶';
  const finishOffsets = [18, 42, 68];
  const tripIdx = OUTBOUND_TRIP_POOL.findIndex(t => t.tripNo === trip.tripNo);
  const finishInMin = finishOffsets[Math.max(0, tripIdx) % finishOffsets.length];
  const probe = enrichTripDeadlineFields({
    appointmentTime: '2099-06-06 20:00:00',
    originWarehouse: 'LA',
    destination,
    palletQty,
    cartonQty
  });
  const routeMinutes =
    probe.estimatedTravelMinutes +
    probe.trafficBufferMinutes +
    probe.exitCheckMinutes +
    probe.sealSignMinutes;
  const appointmentTime = formatTripDateTime(
    new Date(Date.now() + (finishInMin + routeMinutes) * 60_000)
  );
  const deadline = enrichTripDeadlineFields({
    appointmentTime,
    originWarehouse: 'LA',
    destination,
    palletQty,
    cartonQty
  });
  return {
    ...trip,
    appointmentTime,
    originWarehouse: 'LA',
    destination,
    palletQty,
    cartonQty,
    distanceMiles: deadline.distanceMiles,
    estimatedTravelMinutes: deadline.estimatedTravelMinutes,
    latestStartLoadingTime: deadline.latestStartLoadingTime,
    latestFinishTime: deadline.latestFinishTime,
    remainingMinutes: deadline.remainingMinutes,
    deadlineRiskLevel: deadline.deadlineRiskLevel
  };
}

function cloneTrip(trip: OutboundTrip): OutboundTrip {
  const enriched = enrichOutboundTrip(trip);
  return {
    ...enriched,
    locations: trip.locations.map(loc => ({
      ...loc,
      pallets: loc.pallets.map(p => ({ ...p, loadScanned: p.loadScanned ?? false }))
    }))
  };
}

export const OUTBOUND_TRIP_POOL: OutboundTrip[] = [
  {
    tripNo: 'TR-2026-0603-01',
    dockNo: 'DOC-OUT-03',
    carriageNo: 'CAR-88921',
    locations: [
      {
        locationCode: 'A-01-03',
        pallets: [
          { palletNo: 'PLT-OUT-001', destination: '洛杉矶', containerNo: 'MSCU1234567', qty: 48, scanned: false, loaded: false, loadScanned: false },
          { palletNo: 'PLT-OUT-002', destination: '洛杉矶', containerNo: 'MSCU1234567', qty: 36, scanned: false, loaded: false, loadScanned: false }
        ]
      },
      {
        locationCode: 'A-02-08',
        pallets: [
          { palletNo: 'PLT-OUT-003', destination: '长滩', containerNo: 'HLCU7654321', qty: 52, scanned: false, loaded: false, loadScanned: false }
        ]
      },
      {
        locationCode: 'B-01-05',
        pallets: [
          { palletNo: 'PLT-OUT-004', destination: '旧金山', containerNo: 'OOLU9988776', qty: 40, scanned: false, loaded: false, loadScanned: false },
          { palletNo: 'PLT-OUT-005', destination: '旧金山', containerNo: 'OOLU9988776', qty: 44, scanned: false, loaded: false, loadScanned: false }
        ]
      }
    ]
  },
  {
    tripNo: 'TR-2026-0603-02',
    dockNo: 'DOC-OUT-05',
    carriageNo: 'CAR-77210',
    locations: [
      {
        locationCode: 'C-03-12',
        pallets: [
          { palletNo: 'PLT-OUT-101', destination: '西雅图', containerNo: 'EGLV5566778', qty: 30, scanned: false, loaded: false, loadScanned: false }
        ]
      },
      {
        locationCode: 'C-03-15',
        pallets: [
          { palletNo: 'PLT-OUT-102', destination: '西雅图', containerNo: 'EGLV5566778', qty: 28, scanned: false, loaded: false, loadScanned: false },
          { palletNo: 'PLT-OUT-103', destination: '波特兰', containerNo: 'COSU3344556', qty: 32, scanned: false, loaded: false, loadScanned: false }
        ]
      }
    ]
  },
  {
    tripNo: 'TR-2026-0603-03',
    dockNo: 'DOC-OUT-01',
    carriageNo: 'CAR-66105',
    locations: [
      {
        locationCode: 'D-01-02',
        pallets: [
          { palletNo: 'PLT-OUT-201', destination: '芝加哥', containerNo: 'MAEU1122334', qty: 56, scanned: false, loaded: false, loadScanned: false }
        ]
      }
    ]
  }
];

export function createOutboundTrip(tripNo: string): OutboundTrip | undefined {
  const found = OUTBOUND_TRIP_POOL.find(t => t.tripNo === tripNo);
  return found ? cloneTrip(found) : undefined;
}

export function getPendingOutboundTrips(): OutboundTrip[] {
  return OUTBOUND_TRIP_POOL.map(t => cloneTrip(t));
}

export function getAllPallets(trip: OutboundTrip): OutboundPallet[] {
  return trip.locations.flatMap(loc => loc.pallets);
}

export function getLocationPalletCount(trip: OutboundTrip, locationCode: string): number {
  return trip.locations.find(l => l.locationCode === locationCode)?.pallets.length ?? 0;
}

export function getScannedUnloadPallets(trip: OutboundTrip): OutboundPallet[] {
  return getAllPallets(trip).filter(p => p.scanned && !p.loaded);
}

export function getRemainingPallets(trip: OutboundTrip): OutboundPallet[] {
  return getAllPallets(trip).filter(p => !p.loaded);
}

export function isAllLoaded(trip: OutboundTrip): boolean {
  return getAllPallets(trip).every(p => p.loaded);
}

export function getNextUnscannedPallet(trip: OutboundTrip): OutboundPallet | undefined {
  return getAllPallets(trip).find(p => !p.loaded && !p.scanned);
}

export function getLocationSummary(loc: OutboundLocation) {
  const pending = loc.pallets.filter(p => !p.loaded);
  const destinations = [...new Set(pending.map(p => p.destination))];
  const containers = [...new Set(pending.map(p => p.containerNo))];
  return {
    palletCount: pending.length,
    totalQty: pending.reduce((sum, p) => sum + p.qty, 0),
    destination: destinations.length === 1 ? destinations[0] : destinations.join(' / '),
    containerNo: containers.length === 1 ? containers[0] : '多柜'
  };
}

const ADD_PALLET_TEMPLATES: Array<Omit<OutboundPallet, 'scanned' | 'loaded' | 'loadScanned'>> = [
  { palletNo: 'PLT-ADD-001', destination: '洛杉矶', containerNo: 'MSCU1234567', qty: 42 },
  { palletNo: 'PLT-ADD-002', destination: '长滩', containerNo: 'HLCU7654321', qty: 38 },
  { palletNo: 'PLT-ADD-003', destination: '西雅图', containerNo: 'EGLV5566778', qty: 35 },
  { palletNo: 'PLT-ADD-004', destination: '芝加哥', containerNo: 'MAEU1122334', qty: 44 }
];

let addPalletSeq = 0;

export const PDA_WRONG_PALLET_NO = 'PLT-WRONG-001';

export type LoadScanResult = 'success' | 'duplicate' | 'wrong' | 'hold';

export function evaluateLoadScan(
  trip: OutboundTrip,
  palletNo: string
): { result: LoadScanResult; message: string; pallet?: OutboundPallet } {
  if (palletNo === PDA_WRONG_PALLET_NO) {
    return { result: 'wrong', message: '该托盘不属于当前车次，禁止装车' };
  }
  const pallet = getAllPallets(trip).find(p => p.palletNo === palletNo);
  if (!pallet) return { result: 'wrong', message: '该托盘不属于当前车次，禁止装车' };
  if (pallet.hold) return { result: 'hold', message: 'HOLD 货物，禁止装车', pallet };
  if (pallet.loadScanned || pallet.loaded) {
    return { result: 'duplicate', message: '该托盘已扫描，请勿重复扫描', pallet };
  }
  return { result: 'success', message: '允许装车', pallet };
}

export function addScannedPalletToTrip(trip: OutboundTrip): OutboundPallet | null {
  const existing = new Set(getAllPallets(trip).map(p => p.palletNo));
  const template = ADD_PALLET_TEMPLATES[addPalletSeq % ADD_PALLET_TEMPLATES.length];
  addPalletSeq += 1;

  let palletNo = template.palletNo;
  if (existing.has(palletNo)) {
    palletNo = `${template.palletNo}-${Date.now().toString().slice(-4)}`;
  }

  const pallet: OutboundPallet = {
    ...template,
    palletNo,
    scanned: true,
    loaded: false,
    loadScanned: false
  };

  const locationCode = 'A-01-03';
  let loc = trip.locations.find(l => l.locationCode === locationCode);
  if (!loc) {
    loc = { locationCode, pallets: [] };
    trip.locations.unshift(loc);
  }
  loc.pallets.push(pallet);
  return pallet;
}
