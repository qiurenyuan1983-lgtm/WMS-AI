/** 派送费用分摊行（按车次 + 订单 CBM） */
export type DeliveryFeeCbmRow = {
  tripOrderNo: string;
  tripTotalFee: number | null;
  cargoOrderNo?: string | null;
  orderCbm?: number | null;
  allocatedFee?: number | null;
  allocationBasis?: string | null;
};

/**
 * 按车次总费用 × (订单CBM / 车次总CBM) 分摊派送费。
 * 同一车次多行共享 tripTotalFee，按 orderCbm 比例分配；末行补差。
 */
export function allocateDeliveryFeeByCbm<T extends DeliveryFeeCbmRow>(rows: T[]): T[] {
  const result = rows.map(row => ({ ...row }));
  const tripIndexMap = new Map<string, number[]>();

  result.forEach((row, index) => {
    const trip = row.tripOrderNo?.trim();
    if (!trip) return;
    const list = tripIndexMap.get(trip) || [];
    list.push(index);
    tripIndexMap.set(trip, list);
  });

  tripIndexMap.forEach(indices => {
    const tripRows = indices.map(i => result[i]);
    const tripTotalFee = Number(tripRows[0]?.tripTotalFee) || 0;
    if (tripTotalFee <= 0) return;

    const cbmList = tripRows.map(row => Math.max(0, Number(row.orderCbm) || 0));
    const tripTotalCbm = cbmList.reduce((sum, cbm) => sum + cbm, 0);
    if (tripTotalCbm <= 0) return;

    let allocatedSum = 0;
    indices.forEach((rowIndex, i) => {
      const orderCbm = cbmList[i];
      const isLast = i === indices.length - 1;
      let fee: number;
      if (isLast) {
        fee = Number((tripTotalFee - allocatedSum).toFixed(2));
      } else {
        fee = Number(((tripTotalFee * orderCbm) / tripTotalCbm).toFixed(2));
        allocatedSum += fee;
      }
      result[rowIndex].allocatedFee = fee;
      result[rowIndex].allocationBasis = `按CBM分摊 ${orderCbm}/${tripTotalCbm.toFixed(2)} CBM`;
    });
  });

  return result;
}
