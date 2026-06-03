import { computed, ref } from 'vue';
import { NButton, NDataTable, NDropdown, NTag } from 'naive-ui';
import {
  fetchGetWmsLocationOptions,
  fetchGetWmsPalletItems,
  fetchMoveWmsPalletLocation,
  fetchOutboundWmsPallet
} from '@/service/api/wms';
import { useAuth } from '@/hooks/business/auth';
import { useDict } from '@/hooks/business/dict';

export function useWmsPalletOperate(options?: { onRefresh?: () => void }) {
  const { hasAuth } = useAuth();
  const { record: statusRecord } = useDict('wms_pallet_status');
  const { record: typeRecord } = useDict('wms_pallet_type');
  const { record: addressTypeRecord } = useDict('oms_address_type');

  const orderDrawerVisible = ref(false);
  const moveModalVisible = ref(false);
  const expandedOrderKeys = ref<string[]>([]);
  const currentPallet = ref<Api.Wms.Pallet | null>(null);
  const allPalletItems = ref<Api.Wms.PalletItem[]>([]);
  const locationOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);
  const moveForm = ref<Api.Wms.PalletMoveParams>({ palletId: null as any, locationId: null as any, remark: null });

  const orderRows = computed(() => buildOrderRows(allPalletItems.value));

  function formatDateTime(value?: string | null) {
    if (!value) return '';
    return String(value).replace('T', ' ').slice(0, 19);
  }

  function palletStatusTagType(status?: string | null) {
    if (status === 'IN_STOCK') return 'success';
    if (status === 'PRE_OUTBOUND') return 'info';
    if (status === 'HOLD') return 'warning';
    return 'default';
  }

  function renderHoldTag(flag?: number | null) {
    if (flag === 1) {
      return <NTag size="small" type="warning">HOLD</NTag>;
    }
    return <span class="text-gray-400">—</span>;
  }

  function getPalletMoreOptions(row: Api.Wms.Pallet) {
    const options: Array<{ label: string; key: string }> = [{ label: '明细', key: 'detail' }];
    if (hasAuth('wms:pallet:moveLocation') && row.palletStatus !== 'OUTBOUND' && row.palletStatus !== 'HOLD') {
      options.push({ label: '移动库位', key: 'moveLocation' });
    }
    if (hasAuth('wms:pallet:outbound') && row.palletStatus !== 'OUTBOUND' && row.palletStatus !== 'HOLD') {
      options.push({ label: '卡板出库', key: 'outbound' });
    }
    return options;
  }

  function renderPalletOperate(row: Api.Wms.Pallet) {
    const opts = getPalletMoreOptions(row);
    if (!opts.length) return '—';
    return (
      <NDropdown trigger="click" options={opts} onSelect={(key: string) => handlePalletMore(key, row)}>
        <NButton size="small">更多</NButton>
      </NDropdown>
    );
  }

  function handlePalletMore(key: string, row: Api.Wms.Pallet) {
    if (key === 'detail') {
      openOrderDetail(row);
      return;
    }
    if (key === 'moveLocation') {
      openMoveModal(row);
      return;
    }
    if (key === 'outbound') {
      window.$dialog?.warning({
        title: '卡板出库',
        content: `确认将卡板「${row.palletNo}」出库？`,
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: async () => {
          await handleOutbound(row);
        }
      });
    }
  }

  function buildPalletTableColumns(extra?: { hideLocation?: boolean }): NaiveUI.TableColumn<Api.Wms.Pallet>[] {
    const cols: NaiveUI.TableColumn<Api.Wms.Pallet>[] = [
      { key: 'palletNo', title: '卡板号', width: 150, fixed: 'left' },
      {
        key: 'palletStatus',
        title: '状态',
        width: 100,
        render: row => (
          <NTag size="small" type={palletStatusTagType(row.palletStatus)}>
            {statusRecord.value[row.palletStatus]?.dictLabel || row.palletStatus}
          </NTag>
        )
      },
      {
        key: 'palletType',
        title: '卡板类型',
        width: 90,
        render: row => typeRecord.value[row.palletType || 'NORMAL']?.dictLabel || row.palletType || '常规'
      },
      { key: 'businessTypeName', title: '业务类型', width: 120, ellipsis: { tooltip: true } },
      { key: 'containerNo', title: '柜号', width: 130, ellipsis: { tooltip: true } },
      { key: 'groupDestination', title: '分组/目的地', width: 140, ellipsis: { tooltip: true } }
    ];
    if (!extra?.hideLocation) {
      cols.push({ key: 'locationCode', title: '库位', width: 110 });
    }
    cols.push(
      { key: 'createTime', title: '创建时间', width: 170, render: row => formatDateTime(row.createTime as string) },
      {
        key: 'operate',
        title: '操作',
        width: 90,
        fixed: 'right',
        render: row => renderPalletOperate(row)
      }
    );
    return cols;
  }

  function isSameOrder(item: Api.Wms.PalletItem, order: Api.Wms.PalletOrderSummary) {
    if (order.cargoOrderId != null && item.cargoOrderId != null) {
      return String(item.cargoOrderId) === String(order.cargoOrderId);
    }
    return (item.cargoOrderNo || '') === order.cargoOrderNo;
  }

  function pickFirst(values: Array<string | null | undefined>) {
    return values.find(v => v) || null;
  }

  function buildOrderRows(items: Api.Wms.PalletItem[]): Api.Wms.PalletOrderSummary[] {
    const map = new Map<string, Api.Wms.PalletOrderSummary & { shipmentKeys: Set<string> }>();
    for (const item of items) {
      const key = String(item.cargoOrderId ?? item.cargoOrderNo ?? 'unknown');
      let row = map.get(key);
      if (!row) {
        row = {
          cargoOrderId: item.cargoOrderId ?? null,
          cargoOrderNo: item.cargoOrderNo || '—',
          businessTypeName: item.businessTypeName,
          containerNo: item.containerNo,
          groupDestination: item.groupDestination,
          platformName: item.platformName,
          platformWarehouseCode: item.platformWarehouseCode,
          addressType: item.addressType,
          holdFlag: 0,
          shipmentCount: 0,
          boxQty: 0,
          availableBoxQty: 0,
          lockedBoxQty: 0,
          exceptionBoxQty: 0,
          weight: 0,
          cbm: 0,
          shipmentKeys: new Set()
        };
        map.set(key, row);
      }
      if (item.holdFlag === 1) {
        row.holdFlag = 1;
      }
      row.businessTypeName = pickFirst([row.businessTypeName, item.businessTypeName]);
      row.containerNo = pickFirst([row.containerNo, item.containerNo]);
      row.groupDestination = pickFirst([row.groupDestination, item.groupDestination]);
      row.platformName = pickFirst([row.platformName, item.platformName]);
      row.platformWarehouseCode = pickFirst([row.platformWarehouseCode, item.platformWarehouseCode]);
      row.addressType = pickFirst([row.addressType, item.addressType]);
      const shipmentKey = String(item.shipmentId ?? item.shipmentCode ?? item.id);
      row.shipmentKeys.add(shipmentKey);
      row.boxQty += item.boxQty || 0;
      row.availableBoxQty += item.availableBoxQty || 0;
      row.lockedBoxQty += item.lockedBoxQty || 0;
      row.exceptionBoxQty += item.exceptionBoxQty || 0;
      row.weight += Number(item.weight || 0);
      row.cbm += Number(item.cbm || 0);
    }
    return Array.from(map.values()).map(({ shipmentKeys, ...row }) => ({
      ...row,
      shipmentCount: shipmentKeys.size
    }));
  }

  async function openOrderDetail(row: Api.Wms.Pallet) {
    const { data: itemData } = await fetchGetWmsPalletItems(row.id);
    allPalletItems.value = itemData || [];
    currentPallet.value = row;
    expandedOrderKeys.value = [];
    orderDrawerVisible.value = true;
  }

  async function openMoveModal(row: Api.Wms.Pallet) {
    currentPallet.value = row;
    moveForm.value = { palletId: row.id, locationId: null as any, remark: null };
    const { data } = await fetchGetWmsLocationOptions({
      pageNum: 1,
      pageSize: 500,
      warehouseId: row.warehouseId
    } as any);
    locationOptions.value = (data || []).map(item => ({
      label: `${item.zoneName || ''} / ${item.locationCode}`,
      value: item.id
    }));
    moveModalVisible.value = true;
  }

  async function submitMove() {
    if (!moveForm.value.locationId) {
      window.$message?.warning('请选择目标库位');
      return;
    }
    const { error } = await fetchMoveWmsPalletLocation(moveForm.value);
    if (error) return;
    window.$message?.success('库位已更新');
    moveModalVisible.value = false;
    options?.onRefresh?.();
  }

  async function handleOutbound(row: Api.Wms.Pallet) {
    const { error } = await fetchOutboundWmsPallet({ palletId: row.id });
    if (error) return;
    window.$message?.success('卡板已出库');
    options?.onRefresh?.();
  }

  function orderRowKey(order: Api.Wms.PalletOrderSummary) {
    return String(order.cargoOrderId ?? order.cargoOrderNo);
  }

  function isOrderExpanded(order: Api.Wms.PalletOrderSummary) {
    return expandedOrderKeys.value.includes(orderRowKey(order));
  }

  function toggleOrderExpand(order: Api.Wms.PalletOrderSummary) {
    const key = orderRowKey(order);
    if (isOrderExpanded(order)) {
      expandedOrderKeys.value = expandedOrderKeys.value.filter(k => k !== key);
    } else {
      expandedOrderKeys.value = [...expandedOrderKeys.value, key];
    }
  }

  const shipmentColumns: NaiveUI.TableColumn<Api.Wms.PalletItem>[] = [
    { key: 'shipmentCode', title: '货件编码', minWidth: 150, ellipsis: { tooltip: true } },
    { key: 'poNo', title: 'PO号', width: 120, ellipsis: { tooltip: true } },
    { key: 'shippingMark', title: '唛头', width: 120, ellipsis: { tooltip: true } },
    {
      key: 'holdFlag',
      title: 'HOLD',
      width: 72,
      align: 'center',
      render: row => renderHoldTag(row.holdFlag)
    },
    { key: 'boxQty', title: '总箱数', width: 90, align: 'right' },
    { key: 'availableBoxQty', title: '可用', width: 80, align: 'right' },
    { key: 'lockedBoxQty', title: '锁定', width: 80, align: 'right' },
    { key: 'weight', title: '重量KG', width: 100, align: 'right' },
    { key: 'cbm', title: 'CBM', width: 90, align: 'right' }
  ];

  function renderOrderExpand(row: Api.Wms.PalletOrderSummary) {
    const items = allPalletItems.value.filter(item => isSameOrder(item, row));
    return (
      <div class="px-12px py-8px">
        <div class="mb-8px text-13px text-gray-500">订单 {row.cargoOrderNo} 货件明细</div>
        <NDataTable columns={shipmentColumns} data={items} pagination={false} scroll-x={980} size="small" bordered />
      </div>
    );
  }

  const orderColumns: NaiveUI.TableColumn<Api.Wms.PalletOrderSummary>[] = [
    { type: 'expand', renderExpand: renderOrderExpand },
    { key: 'cargoOrderNo', title: '订单号', minWidth: 160, ellipsis: { tooltip: true } },
    {
      key: 'holdFlag',
      title: 'HOLD',
      width: 72,
      align: 'center',
      render: row => renderHoldTag(row.holdFlag)
    },
    { key: 'businessTypeName', title: '业务类型', width: 110, ellipsis: { tooltip: true } },
    { key: 'containerNo', title: '柜号', width: 120, ellipsis: { tooltip: true } },
    { key: 'groupDestination', title: '分组/目的地', width: 120, ellipsis: { tooltip: true } },
    { key: 'platformName', title: '平台', width: 100, ellipsis: { tooltip: true } },
    { key: 'platformWarehouseCode', title: '平台代码', width: 100, ellipsis: { tooltip: true } },
    {
      key: 'addressType',
      title: '地址类型',
      width: 100,
      render: row => addressTypeRecord.value[row.addressType || '']?.dictLabel || row.addressType || '—'
    },
    { key: 'shipmentCount', title: '货件数', width: 80, align: 'center' },
    { key: 'boxQty', title: '总箱数', width: 80, align: 'right' },
    {
      key: 'operate',
      title: '操作',
      width: 90,
      fixed: 'right',
      render: row => (
        <NButton size="small" onClick={() => toggleOrderExpand(row)}>
          {isOrderExpanded(row) ? '收起' : '明细'}
        </NButton>
      )
    }
  ];

  return {
    orderDrawerVisible,
    moveModalVisible,
    expandedOrderKeys,
    currentPallet,
    orderRows,
    orderColumns,
    orderRowKey,
    locationOptions,
    moveForm,
    buildPalletTableColumns,
    palletStatusTagType,
    openOrderDetail,
    submitMove,
    handlePalletMore
  };
}
