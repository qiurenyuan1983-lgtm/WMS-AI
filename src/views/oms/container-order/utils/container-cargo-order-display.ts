export type ContainerCargoOrderDraftRow = Api.Oms.ContainerCargoOrderForm & {
  _draftKey?: string;
  shipmentCodes?: string | null;
  poNos?: string | null;
  marks?: string | null;
  earliestDwTime?: string | null;
};

export function ensureDraftKey(cargo: ContainerCargoOrderDraftRow) {
  if (!cargo._draftKey) {
    cargo._draftKey = `d_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
  return cargo._draftKey;
}

export function displayCargoOrderNo(row: { cargoOrderNo?: string | null; externalOrderNo?: string | null }) {
  return row.cargoOrderNo?.trim() || row.externalOrderNo?.trim() || '待生成';
}

export function countValidShipments(row: Api.Oms.CargoOrder) {
  return (row.shipments || []).filter(item => item.shipmentNo?.trim()).length;
}
