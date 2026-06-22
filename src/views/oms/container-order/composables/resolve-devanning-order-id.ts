import { fetchGetDevanningOrderList } from '@/service/api/wms/devanning-order';

const CONTAINER_ID_TO_DEVANNING_ID: Record<string, CommonType.IdType> = {
  '70001': 60401,
  '70002': 60402
};

/** 由海柜订单解析关联拆柜订单 ID（原型 Mock 映射 + 列表检索） */
export async function resolveDevanningOrderIdFromContainer(row: {
  id: CommonType.IdType;
  warehouseId?: CommonType.IdType | null;
  containerOrderNo?: string | null;
  containerNo?: string | null;
  devanningNo?: string | null;
}): Promise<CommonType.IdType | null> {
  const mapped = CONTAINER_ID_TO_DEVANNING_ID[String(row.id)];
  if (mapped) return mapped;

  const keyword = row.devanningNo || row.containerOrderNo || row.containerNo || '';
  if (!keyword) return null;

  const { data } = await fetchGetDevanningOrderList({
    keyword,
    warehouseId: row.warehouseId ?? null,
    pageNum: 1,
    pageSize: 20
  });

  const match = data?.rows?.find(r =>
    String(r.sourceOrderNo) === String(row.containerOrderNo) ||
    (row.devanningNo && r.devanningNo === row.devanningNo) ||
    (row.containerNo && r.containerNo === row.containerNo)
  );

  return match?.id ?? data?.rows?.[0]?.id ?? null;
}
