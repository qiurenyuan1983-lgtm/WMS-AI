import { computed, type ComputedRef } from 'vue';
import { NButton, NDropdown, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { useDict } from '@/hooks/business/dict';
import { displayCargoOrderNo, countValidShipments } from '../utils/container-cargo-order-display';

export const FULFILLMENT_LABELS: Record<string, string> = {
  IN_TRANSIT: '在途',
  ARRIVED_PORT: '已到港',
  PICKED_UP: '已提柜',
  ARRIVED_WAREHOUSE: '已到仓',
  DEVANNING: '拆柜中',
  DEVANNED: '拆柜完成',
  INBOUNDED: '已入库',
  OUTBOUND_ORDERED: '已出单',
  DELIVERY_APPOINTED: '已预约',
  OUTBOUNDED: '已出库',
  DELIVERING: '派送中',
  DELIVERED: '已签收',
  POD_UPLOADED: 'POD回传',
  BILLED: '已出账单',
  COMPLETED: '已完成',
  EXCEPTION: '异常中',
  CANCELLED: '已取消',
  PENDING_ACCEPT: '待受理'
};

export interface ContainerCargoTableColumnOptions {
  mode: 'detail' | 'draft';
  getBusinessTypeName: (row: Api.Oms.CargoOrder) => string;
  /** 详情模式：打开货物订单详情抽屉 */
  onViewDetail?: (row: Api.Oms.CargoOrder, index: number) => void;
  /** 草稿模式：打开货件编辑抽屉 */
  onOpenShipment?: (row: Api.Oms.CargoOrder, index: number) => void;
  onEdit?: (row: Api.Oms.CargoOrder, index: number) => void;
  onDelete?: (index: number) => void;
  isCargoHolding?: (row: Api.Oms.CargoOrder) => boolean;
  cargoHoldLabel?: (row: Api.Oms.CargoOrder) => string;
  cargoHoldTagType?: (row: Api.Oms.CargoOrder) => 'default' | 'warning' | 'success' | 'error' | 'info';
  hasAuth?: (code: string) => boolean;
  onHold?: (row: Api.Oms.CargoOrder) => void;
  onReleaseHold?: (row: Api.Oms.CargoOrder) => void;
  onModifyTransfer?: (row: Api.Oms.CargoOrder) => void;
  onCancelTransfer?: (row: Api.Oms.CargoOrder) => void;
}

function valText(value: unknown) {
  return value === null || value === undefined || value === '' ? '--' : String(value);
}

export function useContainerCargoTableColumns(
  options: ContainerCargoTableColumnOptions
): ComputedRef<DataTableColumns<Api.Oms.CargoOrder>> {
  const { record: addressTypeRecord } = useDict('oms_address_type');

  return computed(() => {
    const isDraft = options.mode === 'draft';

    function renderOrderNo(row: Api.Oms.CargoOrder, index: number) {
      const label = displayCargoOrderNo(row);
      return (
        <span
          class="cursor-pointer text-primary hover:underline"
          onClick={() =>
            isDraft ? options.onEdit?.(row, index) : options.onViewDetail?.(row, index)
          }
        >
          {label}
          {!isDraft && options.isCargoHolding?.(row) ? (
            <span
              class="absolute -right-4px -top-9px flex h-15px min-w-15px items-center justify-center rounded-full bg-#d03050 px-3px text-10px text-white font-semibold leading-15px shadow-sm"
              title="暂扣"
            >
              扣
            </span>
          ) : null}
        </span>
      );
    }

    const baseColumns: DataTableColumns<Api.Oms.CargoOrder> = [
      {
        title: '货物订单号',
        key: 'cargoOrderNo',
        width: 165,
        fixed: 'left',
        render: (row, index) => renderOrderNo(row, index)
      },
      {
        title: '货件编码汇总',
        key: 'shipmentCodes',
        width: 180,
        ellipsis: { tooltip: true },
        render: row => valText(row.shipmentCodes)
      },
      {
        title: 'PO汇总',
        key: 'poNos',
        width: 150,
        ellipsis: { tooltip: true },
        render: row => valText(row.poNos)
      },
      {
        title: '参考号',
        key: 'externalOrderNo',
        width: 130,
        ellipsis: { tooltip: true },
        render: row => valText(row.externalOrderNo)
      },
      {
        title: '唛头号',
        key: 'marks',
        width: 120,
        ellipsis: { tooltip: true },
        render: row => valText(row.marks)
      },
      {
        title: '仓库代码',
        key: 'platformWarehouseCode',
        width: 110,
        ellipsis: { tooltip: true },
        render: row => valText(row.platformWarehouseCode || row.warehouseCode)
      },
      {
        title: '平台',
        key: 'platformName',
        width: 110,
        ellipsis: { tooltip: true },
        render: row => valText(row.platformName || row.platformCode)
      },
      {
        title: '地址类型',
        key: 'addressType',
        width: 100,
        render: row => addressTypeRecord.value[row.addressType as string]?.dictLabel ?? row.addressType ?? '--'
      },
      {
        title: '业务类型',
        key: 'businessTypeId',
        width: 110,
        ellipsis: { tooltip: true },
        render: row => options.getBusinessTypeName(row)
      },
      {
        title: 'HOLD',
        key: 'holdFlag',
        width: 80,
        render: row => {
          if (isDraft) return '--';
          return (
            <NTag type={options.cargoHoldTagType?.(row) || 'default'} size="small">
              {options.cargoHoldLabel?.(row) || '正常'}
            </NTag>
          );
        }
      },
      { title: '客户', key: 'customerName', width: 130, ellipsis: { tooltip: true } },
      {
        title: '履约状态',
        key: 'fulfillmentStatus',
        width: 120,
        render: row => {
          if (isDraft || !row.fulfillmentStatus) return '--';
          return (
            <NTag type="info" size="small">
              {FULFILLMENT_LABELS[row.fulfillmentStatus] ?? row.fulfillmentStatus}
            </NTag>
          );
        }
      },
      {
        title: '备注',
        key: 'remark',
        width: 150,
        ellipsis: { tooltip: true },
        render: row => valText(row.remark)
      },
      {
        title: '跟进记录',
        key: 'followUpRemark',
        width: 200,
        ellipsis: { tooltip: true },
        render: row => valText(row.followUpRemark)
      },
      {
        title: '派送LFD',
        key: 'deliveryLfd',
        width: 120,
        render: row => valText(row.deliveryLfd)
      },
      {
        title: 'DW时间',
        key: 'earliestDwTime',
        width: 130,
        render: row => valText(row.earliestDwTime)
      },
      {
        title: '库龄(天)',
        key: 'storageAge',
        width: 80,
        align: 'right',
        render: row => {
          if (!row.actualInboundTime) return '--';
          return String(Math.floor((Date.now() - new Date(row.actualInboundTime).getTime()) / 86400000));
        }
      },
      {
        title: '预报箱数',
        key: 'declaredCartonQty',
        width: 90,
        align: 'right',
        render: row => String(row.declaredCartonQty ?? row.expectedBoxQty ?? '--')
      },
      {
        title: '预报重量',
        key: 'declaredWeight',
        width: 90,
        align: 'right',
        render: row => String(row.declaredWeight ?? row.expectedWeight ?? '--')
      },
      {
        title: '预报体积',
        key: 'declaredCbm',
        width: 90,
        align: 'right',
        render: row => String(row.declaredCbm ?? row.expectedCbm ?? '--')
      },
      {
        title: '出库单号',
        key: 'outboundBatchNo',
        width: 140,
        ellipsis: { tooltip: true },
        render: row => valText(row.outboundBatchNo)
      },
      {
        title: '入库仓库',
        key: 'inboundWarehouseName',
        width: 130,
        ellipsis: { tooltip: true },
        render: row => valText(row.inboundWarehouseName)
      },
      {
        title: '是否转仓',
        key: 'transferFlag',
        width: 80,
        render: row =>
          row.transferFlag ? (
            <NTag type="warning" size="small">
              是
            </NTag>
          ) : (
            <NTag type="default" size="small">
              否
            </NTag>
          )
      },
      {
        title: '转仓仓库',
        key: 'transferWarehouseCode',
        width: 110,
        ellipsis: { tooltip: true },
        render: row => valText(row.transferWarehouseCode)
      },
      {
        title: 'ETA',
        key: 'eta',
        width: 120,
        render: row => valText(row.eta)
      },
      {
        title: '异常',
        key: 'exceptionFlag',
        width: 90,
        render: row => {
          if (isDraft) return <NTag size="small">--</NTag>;
          return row.exceptionFlag ? (
            <NTag type="error" size="small">
              {`异常(${row.exceptionCount ?? 0})`}
            </NTag>
          ) : (
            <NTag type="default" size="small">
              正常
            </NTag>
          );
        }
      },
      { title: '客服', key: 'customerServiceName', width: 100, ellipsis: { tooltip: true } },
      {
        title: '收货方地址',
        key: 'address',
        width: 220,
        ellipsis: { tooltip: true },
        render: row => {
          const line = [row.addressLine1, row.addressLine2].filter(Boolean).join(' ');
          const loc = [row.city, row.state, row.zipCode].filter(Boolean).join(' ');
          return [line, loc].filter(Boolean).join(', ') || '--';
        }
      },
      {
        title: '收货人',
        key: 'contactName',
        width: 100,
        ellipsis: { tooltip: true },
        render: row => valText(row.contactName || row.consigneeName)
      },
      {
        title: '收货电话',
        key: 'contactPhone',
        width: 130,
        ellipsis: { tooltip: true },
        render: row => valText(row.contactPhone)
      },
      {
        title: '收货邮箱',
        key: 'contactEmail',
        width: 160,
        ellipsis: { tooltip: true },
        render: row => valText(row.contactEmail)
      },
      {
        title: '客户备注',
        key: 'customerRemark',
        width: 160,
        ellipsis: { tooltip: true },
        render: row => valText(row.customerRemark)
      },
      {
        title: '内部备注',
        key: 'internalRemark',
        width: 160,
        ellipsis: { tooltip: true },
        render: row => valText(row.internalRemark)
      }
    ];

    if (isDraft) {
      baseColumns.push({
        title: '操作',
        key: 'operate',
        width: 200,
        fixed: 'right',
        render: (row, index) => (
          <div class="flex gap-4px">
            <NButton text type="primary" size="small" onClick={() => options.onEdit?.(row, index)}>
              编辑
            </NButton>
            <NButton text type="primary" size="small" onClick={() => options.onOpenShipment?.(row, index)}>
              {`货件(${countValidShipments(row)})`}
            </NButton>
            <NButton text type="error" size="small" onClick={() => options.onDelete?.(index)}>
              删除
            </NButton>
          </div>
        )
      });
    } else {
      baseColumns.push({
        title: '操作',
        key: 'operate',
        width: 130,
        fixed: 'right',
        render: row => {
          const menuOptions = [
            { label: '查看详情', key: 'detail' },
            { label: '文件管理', key: 'files' },
            options.isCargoHolding?.(row)
              ? { label: '货物放行', key: 'releaseHold' }
              : { label: '货物暂扣', key: 'hold' }
          ];
          if (options.hasAuth?.('oms:cargoOrder:modifyTransfer')) {
            menuOptions.push({ label: '修改转仓', key: 'modifyTransfer' });
          }
          if (row.transferFlag && options.hasAuth?.('oms:cargoOrder:cancelTransfer')) {
            menuOptions.push({ label: '取消转仓', key: 'cancelTransfer' });
          }
          menuOptions.push(
            { label: '拆单', key: 'split' },
            { label: '回并原单', key: 'mergeBack' },
            { label: '异常跟进', key: 'exception' },
            { label: '查看轨迹', key: 'trace' },
            { label: '操作日志', key: 'log' }
          );
          const onSelect = (key: string) => {
            if (key === 'detail') options.onViewDetail?.(row, -1);
            else if (key === 'hold') options.onHold?.(row);
            else if (key === 'releaseHold') options.onReleaseHold?.(row);
            else if (key === 'modifyTransfer') options.onModifyTransfer?.(row);
            else if (key === 'cancelTransfer') options.onCancelTransfer?.(row);
            else
              window.$message?.info(
                key === 'files'
                  ? '请在货物订单列表/详情中进入文件管理'
                  : '功能开发中，敬请期待'
              );
          };
          return (
            <NDropdown trigger="click" options={menuOptions} onSelect={onSelect}>
              {{
                default: () => (
                  <NButton size="small" secondary>
                    更多
                  </NButton>
                )
              }}
            </NDropdown>
          );
        }
      });
    }

    return baseColumns;
  });
}
