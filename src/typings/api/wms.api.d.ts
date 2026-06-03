declare namespace Api {
  namespace Wms {
    type Zone = Common.CommonRecord<{
      id: CommonType.IdType;
      tenantId: string;
      companyId: CommonType.IdType;
      warehouseId: CommonType.IdType;
      warehouseCode: string | null;
      warehouseName: string | null;
      zoneName: string;
      storageMethod: string;
      zoneType: string;
      allowMixedStorage: number | null;
      maxMixedQty: number | null;
      status: string;
      remark: string | null;
      createTime?: string;
    }>;

    type ZoneSearchParams = CommonType.RecordNullable<
      Pick<Zone, 'companyId' | 'warehouseId' | 'zoneName' | 'zoneType' | 'storageMethod' | 'status'> &
        Api.Common.CommonSearchParams
    >;

    type ZoneOperateParams = CommonType.RecordNullable<
      Pick<
        Zone,
        | 'id'
        | 'companyId'
        | 'warehouseId'
        | 'warehouseCode'
        | 'warehouseName'
        | 'zoneName'
        | 'storageMethod'
        | 'zoneType'
        | 'allowMixedStorage'
        | 'maxMixedQty'
        | 'status'
        | 'remark'
      >
    >;

    type ZoneList = Api.Common.PaginatingQueryRecord<Zone>;

    type Location = Common.CommonRecord<{
      id: CommonType.IdType;
      tenantId: string;
      companyId: CommonType.IdType;
      warehouseId: CommonType.IdType;
      warehouseCode: string | null;
      warehouseName: string | null;
      zoneId: CommonType.IdType | null;
      zoneName: string | null;
      locationCode: string;
      rowNo: string | null;
      columnNo: string | null;
      capacity: number | null;
      currentQty: number | null;
      remainingCapacity: number | null;
      status: string;
      remark: string | null;
    }>;

    type LocationSearchParams = CommonType.RecordNullable<
      Pick<Location, 'companyId' | 'warehouseId' | 'zoneId' | 'zoneName' | 'locationCode' | 'status'> &
        Api.Common.CommonSearchParams
    >;

    type LocationOperateParams = CommonType.RecordNullable<
      Pick<
        Location,
        | 'id'
        | 'companyId'
        | 'warehouseId'
        | 'warehouseCode'
        | 'warehouseName'
        | 'zoneId'
        | 'zoneName'
        | 'locationCode'
        | 'rowNo'
        | 'columnNo'
        | 'capacity'
        | 'status'
        | 'remark'
      >
    >;

    type LocationBatchStatusParams = {
      ids: CommonType.IdType[];
      status: string;
    };

    type LocationList = Api.Common.PaginatingQueryRecord<Location>;

    type Inventory = Common.CommonRecord<{
      id: CommonType.IdType;
      tenantId: string;
      companyId: CommonType.IdType;
      warehouseId: CommonType.IdType;
      warehouseCode: string | null;
      warehouseName: string | null;
      customerId: CommonType.IdType | null;
      customerName: string | null;
      bizRootId: CommonType.IdType | null;
      cargoOrderId: CommonType.IdType | null;
      cargoOrderNo: string | null;
      shipmentId: CommonType.IdType | null;
      shipmentCode: string | null;
      totalBoxQty: number;
      availableBoxQty: number;
      lockedBoxQty: number;
      exceptionBoxQty: number;
      totalWeight: number;
      totalCbm: number;
      inventoryStatus: string;
      firstInboundTime: string | null;
      lastInboundTime: string | null;
      lastTransactionTime: string | null;
      version: number | null;
      remark: string | null;
    }>;

    type InventorySearchParams = CommonType.RecordNullable<
      Pick<
        Inventory,
        | 'companyId'
        | 'warehouseId'
        | 'customerId'
        | 'cargoOrderNo'
        | 'shipmentCode'
        | 'skuCode'
        | 'inventoryStatus'
      > &
        Api.Common.CommonSearchParams & {
          keyword: string;
          /** 是否包含已清空/零库存 */
          includeDepleted?: boolean | null;
        }
    >;

    type InventoryAdjustParams = {
      inventoryId: CommonType.IdType;
      deltaAvailableBoxQty?: number | null;
      deltaLockedBoxQty?: number | null;
      deltaExceptionBoxQty?: number | null;
      remark?: string | null;
    };

    type InventoryList = Api.Common.PaginatingQueryRecord<Inventory>;

    type InventoryStats = {
      inventoryCount: number;
      palletCount: number;
      totalBoxQty: number;
      availableBoxQty: number;
      lockedBoxQty: number;
      exceptionBoxQty: number;
      totalWeight: number;
      totalCbm: number;
    };

    type InventoryVisualizationParams = {
      warehouseId: CommonType.IdType;
      zoneId?: CommonType.IdType | null;
      zoneKeyword?: string | null;
    };

    type LocationDestinationStat = {
      groupDestination: string;
      palletCount: number;
    };

    type LocationVisualization = {
      id: CommonType.IdType;
      zoneId: CommonType.IdType;
      zoneName: string;
      locationCode: string;
      rowNo: string | null;
      columnNo: string | null;
      capacity: number | null;
      currentQty: number;
      remainingCapacity: number | null;
      status: string;
      occupancyPercent: number;
      occupancyLevel: 'EMPTY' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'INVALID';
      destinationStats?: LocationDestinationStat[];
    };

    type ZoneVisualization = {
      zoneId: CommonType.IdType;
      zoneName: string;
      zoneType: string;
      storageMethod: string;
      status: string;
      usedPalletCount: number;
      totalCapacity: number;
      locationCount: number;
      occupancyPercent: number;
      locations: LocationVisualization[];
    };

    type InventoryVisualization = {
      warehouseId: CommonType.IdType;
      warehouseCode: string | null;
      warehouseName: string | null;
      usedPalletCount: number;
      totalCapacity: number;
      locationCount: number;
      occupancyPercent: number;
      zones: ZoneVisualization[];
    };

    type Pallet = Common.CommonRecord<{
      id: CommonType.IdType;
      tenantId: string;
      companyId: CommonType.IdType;
      warehouseId: CommonType.IdType;
      warehouseCode: string | null;
      warehouseName: string | null;
      palletNo: string;
      palletType: string | null;
      businessTypeName: string | null;
      containerNo: string | null;
      groupDestination: string | null;
      locationId: CommonType.IdType | null;
      locationCode: string | null;
      cargoOrderId: CommonType.IdType | null;
      cargoOrderNo: string | null;
      shipmentId: CommonType.IdType | null;
      shipmentCode: string | null;
      orderCount: number | null;
      shipmentCount: number | null;
      zoneId: CommonType.IdType | null;
      zoneCode: string | null;
      zoneName: string | null;
      totalBoxQty: number;
      availableBoxQty: number;
      lockedBoxQty: number;
      exceptionBoxQty: number;
      weight: number;
      cbm: number;
      palletStatus: string;
      inboundTime: string | null;
      remark: string | null;
    }>;

    type PalletSearchParams = CommonType.RecordNullable<
      Pick<Pallet, 'companyId' | 'warehouseId' | 'palletNo' | 'locationCode' | 'customerId' | 'palletStatus'> &
        Api.Common.CommonSearchParams & {
          keyword: string;
          cargoOrderNo: string;
          shipmentCode: string;
          locationId?: CommonType.IdType | null;
          /** ACTIVE | OUTBOUND | ALL */
          scope?: string | null;
        }
    >;

    type PalletList = Api.Common.PaginatingQueryRecord<Pallet>;

    type PalletOrderSummary = {
      cargoOrderId: CommonType.IdType | null;
      cargoOrderNo: string;
      /** 1=该订单任一货件 HOLD */
      holdFlag?: number | null;
      businessTypeName: string | null;
      containerNo: string | null;
      groupDestination: string | null;
      platformName: string | null;
      platformWarehouseCode: string | null;
      addressType: string | null;
      shipmentCount: number;
      boxQty: number;
      availableBoxQty: number;
      lockedBoxQty: number;
      exceptionBoxQty: number;
      weight: number;
      cbm: number;
    };

    type PalletMoveParams = {
      palletId: CommonType.IdType;
      locationId: CommonType.IdType;
      remark?: string | null;
    };

    type PalletOutboundParams = {
      palletId: CommonType.IdType;
      remark?: string | null;
    };

    type PalletItem = Common.CommonRecord<{
      id: CommonType.IdType;
      palletId: CommonType.IdType;
      palletNo: string;
      cargoOrderId: CommonType.IdType | null;
      cargoOrderNo: string | null;
      businessTypeName: string | null;
      containerNo: string | null;
      groupDestination: string | null;
      platformName: string | null;
      platformWarehouseCode: string | null;
      addressType: string | null;
      /** 1=订单 HOLD（来自 OMS） */
      holdFlag?: number | null;
      shipmentId: CommonType.IdType | null;
      shipmentCode: string | null;
      poNo: string | null;
      shippingMark: string | null;
      boxQty: number;
      availableBoxQty: number;
      lockedBoxQty: number;
      exceptionBoxQty: number;
      weight: number;
      cbm: number;
    }>;

    type InventoryLock = Common.CommonRecord<{
      id: CommonType.IdType;
      tenantId: string;
      companyId: CommonType.IdType;
      warehouseId: CommonType.IdType;
      bizDocType: string;
      bizDocId: CommonType.IdType | null;
      bizDocLineId: CommonType.IdType | null;
      shipmentCode: string | null;
      palletNo: string | null;
      lockedBoxQty: number;
      lockStatus: string;
      lockTime: string | null;
      releaseTime: string | null;
      remark: string | null;
    }>;

    type InventoryLockSearchParams = CommonType.RecordNullable<
      Pick<InventoryLock, 'companyId' | 'warehouseId' | 'bizDocType' | 'shipmentCode' | 'lockStatus'> &
        Api.Common.CommonSearchParams & {
          keyword: string;
        }
    >;

    type InventoryLockList = Api.Common.PaginatingQueryRecord<InventoryLock>;

    type InventoryTransaction = Common.CommonRecord<{
      id: CommonType.IdType;
      tenantId: string;
      companyId: CommonType.IdType;
      warehouseId: CommonType.IdType;
      transactionNo: string;
      transactionType: string;
      customerName: string | null;
      cargoOrderNo: string | null;
      shipmentCode: string | null;
      palletNo: string | null;
      fromLocationCode: string | null;
      toLocationCode: string | null;
      changeTotal: number;
      changeAvailable: number;
      changeLocked: number;
      changeException: number;
      operateTime: string | null;
      remark: string | null;
    }>;

    type InventoryTransactionSearchParams = CommonType.RecordNullable<
      Pick<InventoryTransaction, 'companyId' | 'warehouseId' | 'transactionNo' | 'transactionType' | 'cargoOrderNo' | 'shipmentCode'> &
        Api.Common.CommonSearchParams & {
          keyword: string;
        }
    >;

    type InventoryTransactionList = Api.Common.PaginatingQueryRecord<InventoryTransaction>;

    type InventoryReceiveParams = CommonType.RecordNullable<{
      companyId: CommonType.IdType;
      warehouseId: CommonType.IdType;
      warehouseCode: string;
      warehouseName: string;
      customerId: CommonType.IdType;
      customerName: string;
      cargoOrderId: CommonType.IdType;
      cargoOrderNo: string;
      shipmentId: CommonType.IdType;
      shipmentCode: string;
      palletNo: string;
      zoneId: CommonType.IdType;
      zoneCode: string;
      zoneName: string;
      locationId: CommonType.IdType;
      locationCode: string;
      boxQty: number;
      weight: number;
      cbm: number;
      bizDocType: string;
      bizDocId: CommonType.IdType;
      bizDocLineId: CommonType.IdType;
      remark: string;
    }>;

    type InventoryLockOperateParams = CommonType.RecordNullable<{
      warehouseId: CommonType.IdType;
      shipmentId: CommonType.IdType;
      bizDocType: string;
      bizDocId: CommonType.IdType;
      bizDocLineId: CommonType.IdType;
      boxQty: number;
      remark: string;
    }>;

    type DevanningOrderStatus =
      | 'UNPICKEDUP'
      | 'PICKEDUP'
      | 'ARRIVED'
      | 'DEVANNING'
      | 'DEVANNED'
      | 'EXCEPTION'
      | 'CANCELLED';

    type DevanningOrder = Common.CommonRecord<{
      id: CommonType.IdType;
      companyId: CommonType.IdType | null;
      warehouseId: CommonType.IdType;
      bizRootId: CommonType.IdType | null;
      devanningNo: string;
      sourceOrderId: CommonType.IdType | null;
      sourceOrderNo: string | null;
      sourceOrderType: string | null;
      containerNo: string;
      customerId: CommonType.IdType | null;
      customerName: string | null;
      channelId: CommonType.IdType | null;
      channelName: string | null;
      customerServiceId: CommonType.IdType | null;
      customerServiceName: string | null;
      etaWarehouseTime: string | null;
      pickupTime: string | null;
      actualArrivalTime: string | null;
      plannedDevanningTime: string | null;
      devanningStartTime: string | null;
      devanningFinishTime: string | null;
      dockId: CommonType.IdType | null;
      dockCode: string | null;
      dockAssignTime: string | null;
      devanningMethod: string;
      devanningRemark: string | null;
      timelinessLevel: string | null;
      devanningFee: number | null;
      operationStatus: string | null;
      devanningSupplier: string | null;
      devanningTeam: string | null;
      devanningProgressPercent: number | null;
      plannedTruckQty: number | null;
      plannedCbm: number | null;
      totalBoxQty: number | null;
      totalWeight: number | null;
      totalCbm: number | null;
      inboundedBoxQty: number | null;
      inboundedPalletQty: number | null;
      examStatus: string | null;
      terminalReleaseStatus: string | null;
      devanningRound: number | null;
      attachmentCount: number | null;
      exceptionFlag: number;
      exceptionCount: number;
      status: DevanningOrderStatus;
      version: number | null;
      remark: string | null;
      createTime?: string;
      updateTime?: string;
    }>;

    type DevanningOrderSearchParams = CommonType.RecordNullable<
      Pick<DevanningOrder, 'warehouseId' | 'status'> & {
        keyword: string | null;
        devanningNo: string | null;
        containerNo: string | null;
        channelId: CommonType.IdType | null;
        customerServiceId: CommonType.IdType | null;
        etaBegin: string | null;
        etaEnd: string | null;
        arrivalBegin: string | null;
        arrivalEnd: string | null;
        finishBegin: string | null;
        finishEnd: string | null;
      } & Api.Common.CommonSearchParams
    >;

    type DevanningOrderOperateParams = CommonType.RecordNullable<
      Pick<
        DevanningOrder,
        | 'id'
        | 'warehouseId'
        | 'companyId'
        | 'containerNo'
        | 'customerId'
        | 'customerName'
        | 'channelId'
        | 'channelName'
        | 'customerServiceId'
        | 'customerServiceName'
        | 'etaWarehouseTime'
        | 'plannedDevanningTime'
        | 'devanningMethod'
        | 'devanningRemark'
        | 'plannedTruckQty'
        | 'plannedCbm'
        | 'totalBoxQty'
        | 'totalWeight'
        | 'totalCbm'
        | 'remark'
        | 'version'
      >
    >;

    type DevanningOrderList = Api.Common.PaginatingQueryRecord<DevanningOrder>;

    type DevanningWorkTask = {
      id: number;
      devanningNo: string;
      containerNo: string;
      orderType: string;
      totalBoxQty: number;
      markedBoxQty: number;
      workStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
      workStatusLabel: string;
      devanningStartTime: string | null;
      devanningFinishTime: string | null;
      dockId: number;
      dockCode: string;
      sourceOrderId: number | null;
      customerName: string | null;
    };

    type DevanningWorkTaskList = { rows: DevanningWorkTask[]; total: number };

    type DevanningWorkOrder = {
      cargoOrderId: number;
      cargoOrderNo: string;
      customerName: string;
      forecastQtyUnit: 'BY_CARTON' | 'BY_PALLET';
      qtyUnitLabel: string;
      expectedQty: number;
      receivedQty: number;
      palletizedQty: number;
      pendingPalletizeQty: number;
    };

    type DevanningWorkGroup = {
      groupCode: string;
      totalExpectedQty: number;
      totalReceivedQty: number;
      orders: DevanningWorkOrder[];
    };

    type DevanningWorkPalletItem = {
      cargoOrderId: number;
      cargoOrderNo: string;
      customerName: string;
      receiveQty: number;
      receiveUnitLabel: string;
      boxQty: number;
    };

    type DevanningWorkPallet = {
      id: number;
      palletNo: string;
      groupCode: string;
      items: DevanningWorkPalletItem[];
      orderCount: number;
      boxQty: number;
      receiveQty: number;
      receiveUnitLabel: string;
      status: 'DONE';
      statusLabel: string;
      createTime: string;
      lengthCm?: number;
      widthCm?: number;
      heightCm?: number;
      weightKg?: number;
    };

    type DevanningGroupPalletLabelResult = {
      session: DevanningWorkSession;
      pallet: DevanningWorkPallet;
    };

    type DevanningWorkSession = {
      taskId: number;
      devanningNo: string;
      containerNo: string;
      dockId: number;
      dockCode: string;
      customerName: string;
      status: string;
      devanningStartTime: string | null;
      devanningFinishTime: string | null;
      totalBoxQty: number;
      markedBoxQty: number;
      groups: DevanningWorkGroup[];
      pallets: DevanningWorkPallet[];
    };

    type DevanningScanResolve = {
      groupCode: string;
      cargoOrderId: number;
      cargoOrderNo: string;
      customerName: string;
      qtyUnitLabel: string;
      shippingMark?: string;
      shipmentNo?: string;
      scanCode: string;
      isPallet: boolean;
      qty: number;
      remark: string;
    };
  }
}
