import { h, ref } from 'vue';
import { NInput } from 'naive-ui';
import { fetchCancelCargoOrderTransfer, fetchModifyCargoOrderTransfer } from '@/service/api/oms/cargo-order';

type CargoRow = Pick<Api.Oms.CargoOrder, 'id' | 'cargoOrderNo' | 'transferFlag' | 'transferWarehouseCode'>;

export function useCargoOrderTransfer(onSuccess?: () => void) {
  function cancelTransfer(row: CargoRow) {
    window.$dialog?.warning({
      title: '取消转仓',
      content: `确认取消货物订单 ${row.cargoOrderNo} 的转仓设置？`,
      positiveText: '确认',
      negativeText: '取消',
      onPositiveClick: async () => {
        const { error } = await fetchCancelCargoOrderTransfer(row.id);
        if (!error) {
          window.$message?.success('已取消转仓');
          onSuccess?.();
        }
      }
    });
  }

  function modifyTransfer(row: CargoRow) {
    const warehouseCode = ref(row.transferWarehouseCode || '');
    window.$dialog?.create({
      title: '修改转仓',
      content: () =>
        h(NInput, {
          value: warehouseCode.value,
          placeholder: '转仓仓库代码',
          onUpdateValue: (v: string) => {
            warehouseCode.value = v;
          }
        }),
      positiveText: '保存',
      negativeText: '取消',
      onPositiveClick: async () => {
        if (!warehouseCode.value?.trim()) {
          window.$message?.warning('请填写转仓仓库代码');
          return false;
        }
        const { error } = await fetchModifyCargoOrderTransfer(row.id, {
          transferWarehouseCode: warehouseCode.value.trim()
        });
        if (error) return false;
        window.$message?.success('转仓信息已更新');
        onSuccess?.();
        return true;
      }
    });
  }

  return { cancelTransfer, modifyTransfer };
}
