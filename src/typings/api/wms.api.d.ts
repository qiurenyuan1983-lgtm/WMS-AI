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
      palletCount?: number | null;
      occupancyRate?: number | null;
      status: string;
      purpose?: string | null;
      customerId?: CommonType.IdType | null;
      customerName?: string | null;
      platformCode?: string | null;
      platformName?: string | null;
      destinationCode?: string | null;
      destinationName?: string | null;
      /** 允许安排的目的地数量，为 1 时仅能绑定一个目的地 */
      destinationLimit?: number | null;
      destinationCodes?: string[] | null;
      locked?: boolean | null;
      remark: string | null;
      createTime?: string;
      updateTime?: string;
    }>;

    type LocationStats = {
      total: number;
      empty: number;
      partial: number;
      full: number;
      locked: number;
      disabled: number;
      maintenance: number;
      abnormal: number;
      preOccupied: number;
      pendingClean: number;
      utilizationRate: number;
    };

    type LocationInventoryItem = {
      id: CommonType.IdType;
      palletNo: string;
      cargoOrderNo: string | null;
      customerName: string | null;
      boxQty: number | null;
      weight: number | null;
      cbm: number | null;
      palletStatus: string | null;
    };

    type LocationOperationLog = {
      id: CommonType.IdType;
      locationId: CommonType.IdType;
      locationCode: string;
      actionType: string;
      operator: string;
      content: string;
      beforeValue: string | null;
      afterValue: string | null;
      operateTime: string;
    };

    type LocationBatchGenerateParams = {
      warehouseId: CommonType.IdType;
      zoneId: CommonType.IdType;
      prefix: string;
      rowFrom: number;
      rowTo: number;
      colFrom?: number;
      colTo?: number;
      capacity?: number | null;
      purpose?: string | null;
      status?: string | null;
    };

    type LocationBatchBindParams = {
      ids: CommonType.IdType[];
      customerId?: CommonType.IdType | null;
      customerName?: string | null;
      platformCode?: string | null;
      platformName?: string | null;
      destinationCode?: string | null;
      destinationName?: string | null;
      destinationLimit?: number | null;
      destinationCodes?: string[] | null;
      purpose?: string | null;
    };

    type LocationBatchCapacityParams = {
      ids: CommonType.IdType[];
      capacity: number;
    };

    type LocationSearchParams = CommonType.RecordNullable<
      Pick<Location, 'companyId' | 'warehouseId' | 'zoneId' | 'zoneName' | 'locationCode' | 'status' | 'purpose'> & {
        keyword?: string | null;
        platformCode?: string | null;
        customerName?: string | null;
      } & Api.Common.CommonSearchParams
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
        | 'purpose'
        | 'customerId'
        | 'customerName'
        | 'platformCode'
        | 'platformName'
        | 'destinationCode'
        | 'destinationName'
        | 'destinationLimit'
        | 'destinationCodes'
        | 'locked'
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
      platformCode?: string | null;
      deliveryMethod?: string | null;
      destinationCode?: string | null;
      customerName?: string | null;
      status?: string | null;
      onlyAvailable?: boolean | string | null;
    };

    type InventoryFloorPlanStats = {
      totalLocations: number;
      usedLocations: number;
      emptyLocations: number;
      occupancyRate: number;
      highOccupancyCount: number;
      abnormalCount: number;
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
      platformCode?: string | null;
      platformName?: string | null;
      customerName?: string | null;
      deliveryMethod?: string | null;
      purpose?: string | null;
      locked?: boolean;
      abnormal?: boolean;
      palletCount?: number;
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
      refreshTime?: string;
      stats?: InventoryFloorPlanStats;
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

    type PalletInventoryStatus =
      | 'AVAILABLE'
      | 'HOLD'
      | 'LOCKED'
      | 'PENDING_OUTBOUND'
      | 'PICKING'
      | 'PENDING_LOAD'
      | 'LOADING'
      | 'OUTBOUND'
      | 'EXCEPTION'
      | 'VOIDED';

    type PalletInventoryRecord = {
      id: CommonType.IdType;
      palletNo: string;
      cargoOrderNo: string;
      customerOrderNo: string | null;
      containerNo: string | null;
      customerName: string;
      platformName: string;
      destination: string;
      warehouseName: string;
      zoneName: string | null;
      locationCode: string;
      palletQty: number;
      boxQty: number;
      skuQty: number;
      lengthCm: number | null;
      widthCm: number | null;
      heightCm: number | null;
      weight: number;
      inventoryStatus: PalletInventoryStatus;
      inboundTime: string;
      ageDays: number;
      exceptionFlag: boolean;
      businessTypeName: string | null;
    };

    type PalletInventoryStats = {
      totalCount: number;
      availableCount: number;
      holdCount: number;
      exceptionCount: number;
      pendingOutboundCount: number;
      lockedCount: number;
      todayInbound: number;
      todayOutbound: number;
    };

    type PalletInventorySearchParams = CommonType.RecordNullable<
      Api.Common.CommonSearchParams & {
        tab?: string;
        palletNo?: string;
        cargoOrderNo?: string;
        containerNo?: string;
        customerName?: string;
        platformName?: string;
        destination?: string;
        warehouseName?: string;
        zoneName?: string;
        locationCode?: string;
        inventoryStatus?: PalletInventoryStatus;
        inboundTimeFrom?: string;
        inboundTimeTo?: string;
        ageDaysMin?: number;
        exceptionFlag?: boolean;
        scanCode?: string;
      }
    >;

    type PalletInventoryList = Api.Common.PaginatingQueryRecord<PalletInventoryRecord>;

    type PalletInventoryOrderInfo = {
      cargoOrderNo: string;
      customerOrderNo: string | null;
      inboundOrderNo: string | null;
      outboundOrderNo: string | null;
      tripNo: string | null;
      devanningNo: string | null;
      containerNo: string | null;
      appointmentNo: string | null;
      referenceId: string | null;
      poNumber: string | null;
    };

    type PalletInventoryCargoItem = {
      sku: string;
      fnsku: string | null;
      boxQty: number;
      pcs: number;
      unitWeight: number | null;
      unitSize: string | null;
      labelStatus: string | null;
      packStatus: string | null;
      remark: string | null;
    };

    type PalletInventoryLocationInfo = {
      warehouseName: string;
      zoneName: string;
      locationCode: string;
      locationType: string;
      capacity: number;
      highValueZone: boolean;
      holdZone: boolean;
      pendingOutboundZone: boolean;
      putawayTime: string | null;
      lastMoveTime: string | null;
    };

    type PalletInventoryInstruction = {
      instructionNo: string;
      instructionType: string;
      status: string;
      assignee: string;
      deadline: string | null;
    };

    type PalletInventoryAttachment = {
      category: string;
      fileName: string;
      uploadTime: string;
    };

    type PalletInventoryFee = {
      feeType: string;
      amount: number;
      currency: string;
      status: string;
    };

    type PalletInventoryTransaction = {
      time: string;
      actionType: string;
      beforeValue: string;
      afterValue: string;
      operatorName: string;
      sourceModule: string;
      remark: string | null;
    };

    type PalletInventoryDetail = PalletInventoryRecord & {
      orderInfo: PalletInventoryOrderInfo;
      cargoItems: PalletInventoryCargoItem[];
      locationInfo: PalletInventoryLocationInfo;
      instructions: PalletInventoryInstruction[];
      attachments: PalletInventoryAttachment[];
      fees: PalletInventoryFee[];
      transactions: PalletInventoryTransaction[];
    };

    type PalletInventoryActionPayload = {
      palletId: CommonType.IdType;
      action:
        | 'hold'
        | 'release'
        | 'lock'
        | 'unlock'
        | 'move'
        | 'pick_instruction'
        | 'relabel_instruction'
        | 'repack_instruction'
        | 'exception'
        | 'void'
        | 'print_label';
      remark?: string;
      targetLocationCode?: string;
    };

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

    type DevanningDeliveryFeeAllocation = {
      id?: CommonType.IdType | null;
      /** 车次订单号 */
      tripOrderNo: string;
      /** 车次派送总费用 */
      tripTotalFee: number | null;
      /** 关联散货/海柜订单号 */
      cargoOrderNo?: string | null;
      /** 订单 CBM（用于分摊） */
      orderCbm?: number | null;
      allocatedFee: number | null;
      allocationBasis?: string | null;
      remark?: string | null;
    };

    type DevanningOrderFeePayload = {
      pickupFee?: number | null;
      exceptionFee?: number | null;
      devanningFee?: number | null;
      otherOperationFee?: number | null;
      otherOperationFeeRemark?: string | null;
      deliveryFeeAllocations?: DevanningDeliveryFeeAllocation[];
    };

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
      pickupFee?: number | null;
      exceptionFee?: number | null;
      deliveryFeeAllocations?: DevanningDeliveryFeeAllocation[];
      deliveryFeeTotal?: number | null;
      feeTotal?: number | null;
      extraOperationFee: number;
      extraOperationFeeRemark: string | null;
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
      expectedArrivalTime: string | null;
      plannedDevanningTime: string | null;
      devanningDate: string | null;
      isTodayDevanning: boolean;
      dispatchSynced: boolean;
      devanningPriority: string;
      devanningPriorityLevel: 'A' | 'B' | 'C' | string;
      isaTripQty: number;
      totalCbm: number;
      isaCbmLabel: string;
      devanningStatus: string;
      devanningStatusLabel: string;
      workStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
      workStatusLabel: string;
      dockId: number;
      dockCode: string | null;
      progressPercent: number;
      markedBoxQty: number;
      totalPalletQty: number;
      devanningGroups: string;
      totalBoxQty: number;
      devanningSupplier: string | null;
      devanningFee: number | null;
      extraOperationFee: number;
      extraOperationFeeRemark: string | null;
      devanningStartTime: string | null;
      devanningFinishTime: string | null;
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
      /** 上架规则预推荐库位（来自入库计划 preLocation） */
      recommendedLocations?: string[];
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
      boxScans: DevanningBoxScanLog[];
    };

    type DevanningBoxScanLog = {
      id: number;
      scanCode: string;
      groupCode: string;
      cargoOrderId: number;
      cargoOrderNo: string;
      customerName: string;
      qty: number;
      scanTime: string;
      shippingMark?: string | null;
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

    // ─── 中转业务 / 指令工作台 ─────────────────────────────

    type TransferInstructionCategory =
      | 'PUTAWAY'
      | 'PICK'
      | 'OPERATION'
      | 'HOLD_RELEASE'
      | 'RELABEL_REBOX'
      | 'CANCEL_REASSIGN'
      | 'EXCEPTION';

    type TransferOperationType =
      | 'RELABEL_FBA'
      | 'RELABEL_SKU'
      | 'RELABEL_CARTON'
      | 'RELABEL_PALLET'
      | 'RELABEL_OTHER'
      | 'REBOX'
      | 'PHOTO'
      | 'MEASURE'
      | 'REVIEW'
      | 'RE_PALLET'
      | 'MERGE_PALLET'
      | 'SPLIT_PALLET'
      | 'REWRAP'
      | 'HOLD'
      | 'RELEASE'
      | 'CANCEL'
      | 'REASSIGN'
      | 'CUSTOM'
      | 'PUTAWAY'
      | 'PICK';

    type TransferInstructionStatus =
      | 'PENDING'
      | 'RECEIVED'
      | 'IN_PROGRESS'
      | 'PENDING_REVIEW'
      | 'COMPLETED'
      | 'REJECTED'
      | 'CANCELLED'
      | 'EXCEPTION'
      | 'OVERDUE';

    type TransferRiskLevel = 'NORMAL' | 'WARNING' | 'URGENT' | 'OVERDUE';

    type TransferRouteStep = {
      code: string;
      label: string;
      status: 'DONE' | 'CURRENT' | 'PENDING' | 'BLOCKED';
      time?: string | null;
    };

    type TransferCargoLine = {
      id: CommonType.IdType;
      cargoNo: string;
      sku?: string | null;
      qty: number;
      unit: string;
      currentLocation: string;
      targetLocation?: string | null;
      holdFlag?: boolean;
    };

    type TransferInstructionLog = {
      id: CommonType.IdType;
      action: string;
      operatorName: string;
      remark?: string | null;
      createTime: string;
    };

    type TransferInstructionAttachment = {
      id: CommonType.IdType;
      fileName: string;
      fileType: string;
      uploadTime: string;
      uploaderName: string;
    };

    type TransferInstruction = {
      id: CommonType.IdType;
      instructionNo: string;
      orderNo: string;
      category: TransferInstructionCategory;
      operationType: TransferOperationType | string;
      customerName: string;
      platform: string;
      destination: string;
      cargoQty: number;
      currentLocation: string;
      targetLocation: string | null;
      operationRequirement: string;
      deptName: string;
      assigneeName: string | null;
      deadline: string;
      remainingMinutes: number;
      riskLevel: TransferRiskLevel;
      status: TransferInstructionStatus;
      priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
      overdueFlag: boolean;
      holdFlag?: boolean;
      orderStatus?: string | null;
      reviewResult?: string | null;
      reviewRemark?: string | null;
      executorName?: string | null;
      receivedTime?: string | null;
      startTime?: string | null;
      submitTime?: string | null;
      completeTime?: string | null;
      routeSteps?: TransferRouteStep[];
      cargoLines?: TransferCargoLine[];
      attachments?: TransferInstructionAttachment[];
      logs?: TransferInstructionLog[];
      relabelTypes?: string[] | null;
      createTime?: string | null;
    };

    type TransferInstructionList = CommonType.PaginatingData<TransferInstruction>;

    type TransferOrderGroup = {
      orderNo: string;
      customerName: string;
      platform: string;
      destination: string;
      orderStatus: string;
      instructionCount: number;
      pendingCount: number;
      holdFlag: boolean;
      instructions: TransferInstruction[];
    };

    type TransferOrderGroupList = CommonType.PaginatingData<TransferOrderGroup>;

    type TransferWorkbenchStats = {
      total: number;
      pending: number;
      inProgress: number;
      pendingReview: number;
      overdue: number;
      exception: number;
      completedToday: number;
      holdCargo: number;
      categoryCounts: Record<string, number>;
    };

    type TransferOrderLookup = {
      orderNo: string;
      customerName: string;
      platform: string;
      destination: string;
      orderStatus: string;
      currentLocation: string;
      cargoLines: TransferCargoLine[];
    };

    type TransferInstructionSearchParams = CommonType.RecordNullable<{
      orderNo?: string | null;
      instructionNo?: string | null;
      customerName?: string | null;
      platform?: string | null;
      destination?: string | null;
      category?: TransferInstructionCategory | string | null;
      cargoNo?: string | null;
      status?: TransferInstructionStatus | string | null;
      deptName?: string | null;
      assigneeName?: string | null;
      overdueOnly?: boolean | null;
      deadlineEnd?: string | null;
    } & Api.Common.CommonSearchParams>;

    type TransferInstructionCreateParams = {
      orderNo: string;
      category: TransferInstructionCategory;
      operationType: TransferOperationType | string;
      operationRequirement?: string | null;
      targetLocation?: string | null;
      deptName?: string | null;
      assigneeName?: string | null;
      deadline: string;
      priority?: TransferInstruction['priority'];
      relabelTypes?: string[] | null;
      cargoLineIds?: CommonType.IdType[] | null;
    };

    type TransferInstructionActionParams = {
      instructionId: CommonType.IdType;
      action: 'DISPATCH' | 'RECEIVE' | 'START' | 'SUBMIT' | 'COMPLETE' | 'REJECT' | 'CANCEL';
      remark?: string | null;
      reviewResult?: string | null;
    };

    // ─── 出库管理（WMS Phase-1）────────────────────────────

    type TripOutboundPlanStats = {
      todayTrips: number;
      pendingNotify: number;
      notified: number;
      pendingCheckin: number;
      checkedIn: number;
      waitingDock: number;
      dockAssigned: number;
      overtimeRisk: number;
    };

    type TripOutboundPlanRow = {
      id: CommonType.IdType;
      tripNo: string;
      orderNos: string;
      customerName: string;
      destination: string;
      appointmentTime: string;
      palletQty: number;
      cartonQty: number;
      vehicleType: string;
      driverName: string | null;
      plateNo: string | null;
      supplierName: string;
      notifyStatus: string;
      checkinStatus: string;
      dockNo: string | null;
      dockStatus: string;
      operationStatus: string;
      latestLoadStart: string;
      latestLoadFinish: string;
      outboundStatus: string;
      flowTab: string;
      overtimeRisk: boolean;
      cargoReady: boolean;
      vipFlag: boolean;
      notifyChannels: string[];
      logs: { time: string; operator: string; action: string }[];
    };

    type TripOutboundPlanSearchParams = CommonType.RecordNullable<
      {
        flowTab?: string | null;
        tripNo?: string | null;
        orderNo?: string | null;
        customerName?: string | null;
        destination?: string | null;
        driverName?: string | null;
        plateNo?: string | null;
        supplierName?: string | null;
        notifyStatus?: string | null;
        checkinStatus?: string | null;
        dockStatus?: string | null;
        operationStatus?: string | null;
        outboundStatus?: string | null;
        appointmentTime?: string | null;
      } & Api.Common.CommonSearchParams
    >;

    type TripOutboundPlanList = Api.Common.PaginatingQueryRecord<TripOutboundPlanRow>;

    type DriverCheckinStats = {
      todayAppointments: number;
      checkedIn: number;
      onsite: number;
      app: number;
      selfPickup: number;
      waitingDock: number;
      exception: number;
    };

    type DriverCheckinRow = {
      id: CommonType.IdType;
      tripNo: string;
      driverName: string;
      driverPhone: string;
      plateNo: string;
      supplierName: string;
      checkinMethod: string;
      checkinTime: string | null;
      appointmentTime: string;
      currentStatus: string;
      dockNo: string | null;
      gpsVerified?: boolean;
      selfPickupNo?: string | null;
    };

    type DriverCheckinList = Api.Common.PaginatingQueryRecord<DriverCheckinRow>;

    type DockScheduleOverview = {
      total: number;
      idle: number;
      reserved: number;
      waiting: number;
      loading: number;
      paused: number;
      maintenance: number;
      disabled: number;
      waitingVehicles: number;
    };

    type DockSlotRow = {
      id: CommonType.IdType;
      dockNo: string;
      status: string;
      vehicleTypes: string[];
      currentTripNo: string | null;
      expectedReleaseTime: string | null;
      zone: string;
    };

    type DockWaitingTripRow = {
      id: CommonType.IdType;
      tripNo: string;
      destination: string;
      customerName: string;
      appointmentTime: string;
      palletQty: number;
      vehicleType: string;
      checkinTime: string;
      waitMinutes: number;
      cargoStatus: string;
      latestFinish: string;
      priority: number;
      recommendedDock: string;
      vipFlag: boolean;
    };

    type DockAssignLogRow = {
      id: CommonType.IdType;
      time: string;
      tripNo: string;
      dockNo: string;
      action: string;
      operator: string;
      reason: string | null;
    };
  }
}
