export type LocationSummaryItem = {
  locationCode: string;
  palletQty: number;
};

/** 单库位直显；多库位 A10(1/板)/A12(1/板) */
export function formatLocationSummary(items: LocationSummaryItem[]): string {
  const valid = items.filter(i => i.locationCode && i.palletQty > 0);
  if (!valid.length) return '—';
  if (valid.length === 1) {
    const [one] = valid;
    return one.palletQty === 1 ? one.locationCode : `${one.locationCode}(${one.palletQty}/板)`;
  }
  return valid.map(i => `${i.locationCode}(${i.palletQty}/板)`).join('/');
}

export function buildLocationSummaryFromPallets(
  pallets: Array<{ locationCode?: string | null; palletQty?: number }>
): string {
  const group = new Map<string, number>();
  pallets.forEach(p => {
    const code = p.locationCode?.trim();
    if (!code) return;
    const qty = p.palletQty ?? 1;
    group.set(code, (group.get(code) || 0) + qty);
  });
  return formatLocationSummary(
    Array.from(group.entries()).map(([locationCode, palletQty]) => ({ locationCode, palletQty }))
  );
}
