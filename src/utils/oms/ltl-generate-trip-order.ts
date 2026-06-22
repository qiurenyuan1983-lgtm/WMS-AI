function buildTripDateSuffix() {
  const d = new Date();
  return `${String(d.getFullYear()).slice(-2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

/** 根据 LTL 工作台订单生成车次订单号（TRIPyyMMdd + 序号） */
export function buildLtlTripOrderNo(orderId: CommonType.IdType) {
  const suffix = String(orderId).padStart(3, '0');
  return `TRIP${buildTripDateSuffix()}${suffix}`;
}

/** 多订单合并生成车次号（TRIPyyMMddB + 合并序号） */
export function buildBatchTripOrderNo(orderIds: CommonType.IdType[]) {
  const sorted = [...orderIds].map(String).sort();
  const seed = sorted.reduce((sum, id) => sum + Number(id), 0);
  const suffix = String((seed + sorted.length * 17) % 1000).padStart(3, '0');
  return `TRIP${buildTripDateSuffix()}B${suffix}`;
}

export type LtlGenerateTripPreview = {
  tripNo: string;
  orderNo: string;
  supplierName: string;
  palletQty: number;
};
