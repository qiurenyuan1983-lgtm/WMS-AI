import type { TripRecommendSummaryAppointmentType } from '@/utils/oms/trip-recommend-rules';

export type TripRecommendConfirmItem = {
  key: string;
  appointmentDate: string;
  appointmentNo: string;
  destination: string;
  appointmentType: string;
  appointmentTypeCode?: TripRecommendSummaryAppointmentType | Api.Oms.TripRecommendAppointmentType;
  palletQty: number;
  weightKg: number;
  cbm: number;
  orderIds: number[];
};

export function formatTripRecommendAppointmentDate(appointmentTime?: string | null) {
  if (!appointmentTime) return '—';
  const text = String(appointmentTime).trim();
  if (!text) return '—';
  return text.slice(0, 10);
}

export function formatTripRecommendAppointmentTypeLabel(
  type?: TripRecommendSummaryAppointmentType | Api.Oms.TripRecommendAppointmentType | null
) {
  if (type === 'MIXED') return 'Floor/Pallet';
  if (type === 'FLOOR') return 'Floor';
  if (type === 'PALLET') return 'Pallet';
  return type || '—';
}

export function buildConfirmItemFromSummary(
  row: Api.Oms.TripRecommendSummaryRow,
  orderIds: number[],
  preview?: Api.Oms.TripRecommendLoadPreview | null
): TripRecommendConfirmItem {
  return {
    key: row.id,
    appointmentDate: formatTripRecommendAppointmentDate(row.appointmentTime),
    appointmentNo: row.appointmentNo || '—',
    destination: row.destination,
    appointmentType: formatTripRecommendAppointmentTypeLabel(row.appointmentType),
    appointmentTypeCode: row.appointmentType,
    palletQty: preview?.selectedPalletQty ?? row.totalPalletQty,
    weightKg: preview?.selectedWeightKg ?? row.totalWeightKg,
    cbm: preview?.selectedCbm ?? row.totalCbm,
    orderIds
  };
}

export function buildConfirmItemFromOrderLine(row: Api.Oms.TripRecommendOrderLine): TripRecommendConfirmItem {
  return {
    key: String(row.id),
    appointmentDate: formatTripRecommendAppointmentDate(row.appointmentTime),
    appointmentNo: row.appointmentNo || '—',
    destination: row.destination,
    appointmentType: formatTripRecommendAppointmentTypeLabel(row.appointmentType),
    appointmentTypeCode: row.appointmentType,
    palletQty: row.palletQty,
    weightKg: row.weightKg,
    cbm: row.cbm,
    orderIds: [row.id]
  };
}

export function buildConfirmItemsFromOrderLines(
  rows: Api.Oms.TripRecommendOrderLine[],
  orderIds: number[]
): TripRecommendConfirmItem[] {
  const selected = rows.filter(row => orderIds.includes(row.id));
  const groupMap = new Map<string, TripRecommendConfirmItem>();

  selected.forEach(row => {
    const groupKey = `${row.appointmentNo}|${row.appointmentTime}|${row.destination}|${row.appointmentType}`;
    const existing = groupMap.get(groupKey);
    if (existing) {
      existing.palletQty += row.palletQty;
      existing.weightKg += row.weightKg;
      existing.cbm += row.cbm;
      existing.orderIds.push(row.id);
      return;
    }
    groupMap.set(groupKey, buildConfirmItemFromOrderLine(row));
  });

  return Array.from(groupMap.values());
}
