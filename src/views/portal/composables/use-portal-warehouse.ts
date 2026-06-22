import { ref, watch } from 'vue';

const STORAGE_KEY = 'portal_current_warehouse_id';

const warehouseId = ref<number>(readStored());

function readStored(): number {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw == null || raw === '') return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

watch(warehouseId, id => {
  try {
    sessionStorage.setItem(STORAGE_KEY, String(id ?? 0));
  } catch {
    /* ignore */
  }
});

export function usePortalWarehouse() {
  return { warehouseId };
}
