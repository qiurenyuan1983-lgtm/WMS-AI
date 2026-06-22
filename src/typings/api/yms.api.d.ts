declare namespace Api {
  namespace Yms {

    // ─── 园区任务 ─────────────────────────────────────────

    type YardTaskStatus =
      | 'CREATED' | 'PRE_ARRIVAL' | 'ARRIVED' | 'WAITING'
      | 'QUEUED' | 'DOCK_ASSIGNED' | 'DOCK_WORKING'
      | 'DEVANNING' | 'LOADING' | 'OPERATION_PAUSED'
      | 'OPERATION_FINISHED' | 'RELEASED' | 'LEFT_YARD'
      | 'CANCELLED' | 'EXCEPTION_PROCESSING' | 'EXCEPTION_CLOSED';

    type TaskType =
      | 'DEVANNING' | 'DELIVERY_LOADING' | 'TRANSFER_LOADING'
      | 'PICKUP_LOADING' | 'RETURN_LOADING' | 'OTHER';

    type WmsReadyStatus = 'NOT_REQUIRED' | 'PENDING' | 'READY';

    type YardTask = {
      appointmentTime?: string | null;
      destination?: string | null;
      originWarehouse?: string | null;
      distanceMiles?: number;
      estimatedTravelMinutes?: number;
      latestStartLoadingTime?: string | null;
      latestFinishTime?: string | null;
      remainingMinutes?: number | null;
      deadlineRiskLevel?: 'NORMAL' | 'NEAR' | 'URGENT' | 'OVERDUE';
      id: CommonType.IdType;
      yardTaskNo: string;
      taskType: TaskType;
      warehouseId: CommonType.IdType | null;
      sourceOrderType: string | null;
      sourceOrderId: CommonType.IdType | null;
      sourceOrderNo: string | null;
      containerNo: string | null;
      wmsReadyStatus: WmsReadyStatus | null;
      wmsReadyTime: string | null;
      priority: number | null;
      truckNo: string | null;
      driverName: string | null;
      driverPhone: string | null;
      etaYardTime: string | null;
      gateInTime: string | null;
      dockStartTime: string | null;
      dockFinishTime: string | null;
      releaseTime: string | null;
      gateOutTime: string | null;
      dockId: CommonType.IdType | null;
      dockCode: string | null;
      operationTaskId: CommonType.IdType | null;
      operationStatus: string | null;
      operationProgress: number | null;
      operationStartTime: string | null;
      operationFinishTime: string | null;
      estimatedFinishTime: string | null;
      loadedQty: number | null;
      totalQty: number | null;
      loadedPalletQty: number | null;
      totalPalletQty: number | null;
      yardStatus: YardTaskStatus;
      openInternalTaskId: CommonType.IdType | null;
      openInternalTaskNo: string | null;
      openInternalTaskType: string | null;
      openInternalTaskStatus: string | null;
      openInternalTaskTargetCode: string | null;
      visitNo: number;
      unloadRoundNo: number;
      isReentry: number;
      reentryReason: string | null;
      parentTaskId: CommonType.IdType | null;
      exceptionFlag: number;
      exceptionReason: string | null;
      source: string;
      remark: string | null;
      createTime: string | null;
    };

    type YardTaskList = CommonType.PaginatingData<YardTask>;

    type YardTaskSearchParams = CommonType.PaginatingQueryRecord & {
      warehouseId?: CommonType.IdType | null;
      taskType?: string | null;
      taskGroup?: string | null;
      yardStatus?: string | null;
      keyword?: string | null;
      containerNo?: string | null;
      truckNo?: string | null;
      sourceOrderNo?: string | null;
      beginGateInTime?: string | null;
      endGateInTime?: string | null;
      timeField?: string | null;
      beginTime?: string | null;
      endTime?: string | null;
    };

    // ─── Dock ──────────────────────────────────────────────

    type DockBoard = {
      id: CommonType.IdType;
      dockCode: string;
      dockName: string;
      dockType: string | null;
      dockLocation: string | null;
      gridRow: number | null;
      gridCol: number | null;
      dockStatus: string;
      enableQueue: number | null;
      maxQueueCount: number | null;
      sortOrder: number | null;
      enabledFlag: number | null;
      activeTask: YardTask | null;
      incomingTasks: YardTask[];
      queuedTasks: YardTask[];
    };

    // ─── 统计 ──────────────────────────────────────────────

    type DispatchStats = {
      totalTasks: number;
      waitingTasks: number;
      workingTasks: number;
      devanningTasks: number;
      loadingTasks: number;
      finishedTasks: number;
      inYardVehicles: number;
      totalDocks: number;
      occupiedDocks: number;
      statusCounts?: Record<string, number>;
    };

    type OverviewEvent = {
      eventTime: string | null;
      eventType: string;
      message: string;
      refId: CommonType.IdType | null;
    };

    type Overview = {
      todayCheckIns: number;
      inYardCount: number;
      waitDevanningCount: number;
      waitLoadingCount: number;
      totalDocks: number;
      occupiedDocks: number;
      freeDocks: number;
      exceptionCount: number;
      dispatchStats: DispatchStats | null;
      recentEvents: OverviewEvent[];
      hourlyTrends?: OverviewTrend[];
      timeoutWaitingCount?: number;
    };

    type OverviewTrend = {
      hour: number;
      checkInCount: number;
    };

    // ─── 操作参数 ──────────────────────────────────────────

    type PushTaskParams = {
      taskType: TaskType;
      warehouseId: CommonType.IdType;
      sourceOrderType: string;
      sourceOrderId?: CommonType.IdType | null;
      sourceOrderNo?: string | null;
      containerNo?: string | null;
      truckNo?: string | null;
      driverName?: string | null;
      driverPhone?: string | null;
      etaYardTime?: string | null;
    };

    type CreateTaskParams = PushTaskParams & {
      remark?: string | null;
    };

    type AssignDockParams = {
      yardTaskId: CommonType.IdType;
      dockId?: CommonType.IdType | null;
    };

    // ─── 操作日志 ──────────────────────────────────────────────
    type YardTaskLog = {
      id: CommonType.IdType;
      yardTaskId: CommonType.IdType;
      actionType: string;
      beforeStatus: string | null;
      afterStatus: string | null;
      actionContent: string | null;
      operatorId: CommonType.IdType | null;
      operatorName: string | null;
      actionTime: string | null;
    };

    // ─── M7 堆场分区 ───────────────────────────────────────────

    type YardZone = {
      id: CommonType.IdType;
      warehouseId: CommonType.IdType | null;
      warehouseName: string | null;
      zoneCode: string;
      zoneName: string;
      zoneType: string;
      sortOrder: number | null;
      remark: string | null;
    };

    type YardZoneList = CommonType.PaginatingData<YardZone>;

    type YardZoneSearchParams = CommonType.PaginatingQueryRecord & {
      warehouseId?: CommonType.IdType | null;
      zoneCode?: string | null;
      zoneType?: string | null;
    };

    type YardZoneOperate = {
      id?: CommonType.IdType;
      warehouseId: CommonType.IdType;
      zoneCode: string;
      zoneName: string;
      zoneType: string;
      sortOrder?: number | null;
      remark?: string | null;
    };

    // ─── 堆场位 ───────────────────────────────────────────────

    type YardPosition = {
      id: CommonType.IdType;
      warehouseId: CommonType.IdType | null;
      warehouseName: string | null;
      zoneId: CommonType.IdType | null;
      zoneCode: string | null;
      zoneName: string | null;
      positionCode: string;
      positionName: string | null;
      positionType: string;
      positionStatus: string;
      gridRow: number | null;
      gridCol: number | null;
      occupiedObjectType: string | null;
      occupiedObjectId: CommonType.IdType | null;
      occupiedObjectNo: string | null;
      occupiedSince: string | null;
      remark: string | null;
      createTime: string | null;
    };

    type YardPositionList = CommonType.PaginatingData<YardPosition>;

    type YardPositionSearchParams = CommonType.PaginatingQueryRecord & {
      warehouseId?: CommonType.IdType | null;
      zoneId?: CommonType.IdType | null;
      positionCode?: string | null;
      positionType?: string | null;
      positionStatus?: string | null;
      occupiedObjectNo?: string | null;
    };

    type YardPositionOperate = {
      id?: CommonType.IdType;
      warehouseId: CommonType.IdType;
      zoneId: CommonType.IdType;
      positionCode: string;
      positionName?: string | null;
      positionType: string;
      positionStatus?: string | null;
      gridRow?: number | null;
      gridCol?: number | null;
      remark?: string | null;
    };

    // ─── 海柜资源 ─────────────────────────────────────────────

    type ContainerResource = {
      id: CommonType.IdType;
      companyId: CommonType.IdType | null;
      warehouseId: CommonType.IdType | null;
      containerNo: string;
      containerType: string | null;
      carrier: string | null;
      sealNo: string | null;
      relatedOrderId: CommonType.IdType | null;
      relatedOrderNo: string | null;
      bizRootId: CommonType.IdType | null;
      containerStatus: string;
      emptyStatus: string | null;
      yardPositionId: CommonType.IdType | null;
      yardZoneId: CommonType.IdType | null;
      dockId: CommonType.IdType | null;
      dockCode: string | null;
      etaTime: string | null;
      arrivedTime: string | null;
      devanningStartTime: string | null;
      devanningFinishTime: string | null;
      leaveTime: string | null;
      lfdPickup: string | null;
      lfdReturn: string | null;
      tractorNo: string | null;
      plateNo: string | null;
      driverName: string | null;
      driverPhone: string | null;
      exceptionFlag: number | null;
      exceptionReason: string | null;
      remark: string | null;
      createTime: string | null;
      positionCode: string | null;
      zoneCode: string | null;
      zoneName: string | null;
    };

    type ContainerResourceList = CommonType.PaginatingData<ContainerResource>;

    type ContainerResourceSearchParams = CommonType.PaginatingQueryRecord & {
      warehouseId?: CommonType.IdType | null;
      companyId?: CommonType.IdType | null;
      containerNo?: string | null;
      containerType?: string | null;
      containerStatus?: string | null;
      emptyStatus?: string | null;
      plateNo?: string | null;
      lfdWithinDays?: number | null;
    };

    type ContainerResourceOperate = {
      id?: CommonType.IdType;
      warehouseId: CommonType.IdType;
      companyId?: CommonType.IdType | null;
      containerNo: string;
      containerType?: string | null;
      carrier?: string | null;
      sealNo?: string | null;
      relatedOrderId?: CommonType.IdType | null;
      relatedOrderNo?: string | null;
      bizRootId?: CommonType.IdType | null;
      emptyStatus?: string | null;
      etaTime?: string | null;
      lfdPickup?: string | null;
      lfdReturn?: string | null;
      tractorNo?: string | null;
      plateNo?: string | null;
      driverName?: string | null;
      driverPhone?: string | null;
      remark?: string | null;
    };

    // ─── 车厢资源 ─────────────────────────────────────────────

    type TrailerResource = {
      id: CommonType.IdType;
      companyId: CommonType.IdType | null;
      warehouseId: CommonType.IdType | null;
      trailerNo: string | null;
      tractorNo: string | null;
      plateNo: string | null;
      driverName: string | null;
      driverPhone: string | null;
      vehicleSource: string;
      supplierId: CommonType.IdType | null;
      supplierName: string | null;
      relatedLoadingTaskId: CommonType.IdType | null;
      relatedOrderNo: string | null;
      bizRootId: CommonType.IdType | null;
      trailerStatus: string;
      yardPositionId: CommonType.IdType | null;
      yardZoneId: CommonType.IdType | null;
      dockId: CommonType.IdType | null;
      dockCode: string | null;
      arriveTime: string | null;
      loadingStartTime: string | null;
      loadingFinishTime: string | null;
      leaveTime: string | null;
      wmsReadyStatus: string | null;
      wmsReadyTime: string | null;
      exceptionFlag: number | null;
      exceptionReason: string | null;
      remark: string | null;
      createTime: string | null;
      positionCode: string | null;
      zoneCode: string | null;
      zoneName: string | null;
    };

    type TrailerResourceList = CommonType.PaginatingData<TrailerResource>;

    type TrailerResourceSearchParams = CommonType.PaginatingQueryRecord & {
      warehouseId?: CommonType.IdType | null;
      companyId?: CommonType.IdType | null;
      trailerNo?: string | null;
      plateNo?: string | null;
      vehicleSource?: string | null;
      trailerStatus?: string | null;
      wmsReadyStatus?: string | null;
    };

    type TrailerResourceOperate = {
      id?: CommonType.IdType;
      warehouseId: CommonType.IdType;
      companyId?: CommonType.IdType | null;
      trailerNo?: string | null;
      tractorNo?: string | null;
      plateNo?: string | null;
      driverName?: string | null;
      driverPhone?: string | null;
      vehicleSource: string;
      supplierId?: CommonType.IdType | null;
      supplierName?: string | null;
      relatedOrderNo?: string | null;
      bizRootId?: CommonType.IdType | null;
      remark?: string | null;
    };

    // ─── 院内任务 ─────────────────────────────────────────────

    type InternalTask = {
      id: CommonType.IdType;
      tenantId?: string | null;
      warehouseId: CommonType.IdType | null;
      taskNo: string;
      parentYardTaskId: CommonType.IdType | null;
      parentYardTaskNo: string | null;
      internalTaskType: string;
      objectType: string;
      objectId: CommonType.IdType | null;
      objectNo: string | null;
      fromPositionId: CommonType.IdType | null;
      fromPositionCode: string | null;
      toPositionId: CommonType.IdType | null;
      toPositionCode: string | null;
      toDockId: CommonType.IdType | null;
      toDockCode: string | null;
      executorType: string | null;
      executorId: CommonType.IdType | null;
      executorName: string | null;
      taskStatus: string;
      priority: number | null;
      assignTime: string | null;
      acceptTime: string | null;
      startTime: string | null;
      finishTime: string | null;
      deadlineTime: string | null;
      failReason: string | null;
      remark: string | null;
      createTime: string | null;
    };

    type InternalTaskList = CommonType.PaginatingData<InternalTask>;

    type InternalTaskSearchParams = CommonType.PaginatingQueryRecord & {
      warehouseId?: CommonType.IdType | null;
      internalTaskType?: string | null;
      taskStatus?: string | null;
      objectNo?: string | null;
      executorName?: string | null;
      parentYardTaskId?: CommonType.IdType | null;
    };

    type InternalTaskCreate = {
      warehouseId: CommonType.IdType;
      internalTaskType: string;
      objectType: string;
      objectId?: CommonType.IdType | null;
      objectNo?: string | null;
      parentYardTaskId?: CommonType.IdType | null;
      fromPositionId?: CommonType.IdType | null;
      toPositionId?: CommonType.IdType | null;
      toDockId?: CommonType.IdType | null;
      priority?: number | null;
      remark?: string | null;
    };

    type InternalTaskAssign = {
      id: CommonType.IdType;
      executorType: string;
      executorId?: CommonType.IdType | null;
      executorName?: string | null;
    };

    type InternalTaskBoardColumn = {
      status: string;
      statusLabel: string;
      count: number;
      tasks: InternalTask[];
    };

    // ─── M7 月台管理（基础资料模块 yard_dock，权限前缀 yard:dock:*）───────────

    type Dock = {
      id: CommonType.IdType;
      dockCode: string;
      dockName: string;
      /** 位置类型：DOCK道口 / PARKING停车位 */
      locationType: string;
      warehouseId: CommonType.IdType | null;
      warehouseCode: string | null;
      warehouseName: string | null;
      businessTypeId: CommonType.IdType | null;
      businessTypeCode: string | null;
      businessTypeName: string | null;
      dockLocation: string | null;
      gridRow: number | null;
      gridCol: number | null;
      allowedVehicleTypes: string | null;
      appointmentSupported: number | null;
      maxConcurrent: number | null;
      dockStatus: string;
      enabledFlag: number | null;
      sortOrder: number | null;
      dispatchPriority: number | null;
      /** Dock类型：DEVANNING卸柜 / LOADING装车 / MIXED混用 */
      dockType: string | null;
      enableQueue: number | null;
      maxQueueCount: number | null;
      remark: string | null;
      createTime: string | null;
    };

    type DockList = CommonType.PaginatingData<Dock>;

    type DockSearchParams = CommonType.PaginatingQueryRecord & {
      warehouseId?: CommonType.IdType | null;
      dockCode?: string | null;
      dockType?: string | null;
      locationType?: string | null;
      dockStatus?: string | null;
      enabledFlag?: number | null;
    };

    type DockOperate = {
      id?: CommonType.IdType;
      dockCode: string;
      dockName: string;
      locationType: string;
      warehouseId: CommonType.IdType;
      businessTypeId: CommonType.IdType;
      dockLocation?: string | null;
      gridRow?: number | null;
      gridCol?: number | null;
      allowedVehicleTypes?: string | null;
      appointmentSupported?: number | null;
      maxConcurrent?: number | null;
      dockStatus?: string | null;
      enabledFlag?: number | null;
      sortOrder?: number | null;
      dispatchPriority?: number | null;
      dockType?: string | null;
      enableQueue?: number | null;
      maxQueueCount?: number | null;
      remark?: string | null;
    };

    // ─── M2 门卫签到 ───────────────────────────────────────────

    type CheckIn = {
      id: CommonType.IdType;
      warehouseId: CommonType.IdType | null;
      checkInType: string | null;
      aptId: CommonType.IdType | null;
      aptNo: string | null;
      yardTaskId: CommonType.IdType | null;
      yardTaskNo: string | null;
      containerResourceId: CommonType.IdType | null;
      trailerResourceId: CommonType.IdType | null;
      plateNo: string;
      driverName: string | null;
      driverPhone: string | null;
      idCardNo: string | null;
      containerNo: string | null;
      trailerNo: string | null;
      vehicleSource: string | null;
      taskType: string | null;
      checkResult: string;
      rejectReason: string | null;
      matchType: string;
      checkInTime: string | null;
      checkOutTime: string | null;
      stayMinutes: number | null;
      operatorId: CommonType.IdType | null;
      operatorName: string | null;
      remark: string | null;
      photoUrls: string | null;
      receiptNo: string | null;
      checkinSource: string | null;
      positionId: CommonType.IdType | null;
      positionCode: string | null;
      omsMismatchFlag: number | null;
      omsMismatchFields: string | null;
      createTime: string | null;
    };

    type CheckInReceipt = {
      receiptNo: string | null;
      warehouseName: string | null;
      checkInType: string | null;
      plateNo: string | null;
      driverName: string | null;
      containerNo: string | null;
      trailerNo: string | null;
      aptNo: string | null;
      checkResult: string | null;
      checkInTime: string | null;
      operatorName: string | null;
    };

    type CheckInList = CommonType.PaginatingData<CheckIn>;

    type CheckInSearchParams = CommonType.PaginatingQueryRecord & {
      warehouseId?: CommonType.IdType | null;
      checkInType?: string | null;
      plateNo?: string | null;
      driverName?: string | null;
      checkResult?: string | null;
      beginTime?: string | null;
      endTime?: string | null;
    };

    /** 门岗统一 Check-in 参数 */
    type UnifiedCheckInParams = {
      warehouseId: CommonType.IdType;
      plateNo?: string | null;
      containerNo?: string | null;
      trailerNo?: string | null;
      loadingNo?: string | null;
      driverName?: string | null;
      driverPhone?: string | null;
      idCardNo?: string | null;
      vehicleSource?: string | null;
      positionCode?: string | null;
      photoUrls?: string | null;
      remark?: string | null;
    };

    /** 司机自助 Check-in 参数（H5 公开接口） */
    type DriverSelfCheckInParams = {
      tenantId: string;
      warehouseId: CommonType.IdType;
      objectNo: string;
      positionCode: string;
      driverPhone: string;
      driverName?: string | null;
      photoUrls?: string | null;
    };

    /** 司机自助 Check-in 结果 */
    type DriverSelfCheckInResult = {
      success: boolean;
      message: string;
      yardTaskNo: string | null;
      positionCode: string | null;
      objectNo: string | null;
    };

    /** 停车位（H5 下拉用） */
    type ParkingSlot = {
      id: CommonType.IdType;
      dockCode: string;
      dockName: string;
      zoneCode: string | null;
      dockStatus: string;
    };

    // ─── 装车司机 Check-in（公开 H5） ─────────────────────────────────

    /** 派送明细行 */
    type TrailerDispatchItem = {
      pcNo: string;
      booker: string | null;
      bookedTime: string | null;
      fromWarehouse: string | null;
      destination: string | null;
      palletCount: number | null;
      weight: number | null;
      loadingType: string | null;
      boxCount: number | null;
      priority: number | null;
      cbm: number | null;
    };

    /** 按提货号查询结果（公开接口） */
    type TrailerCheckinLookup = {
      pickupNo: string;
      truckRouteNo: string | null;
      driverPhone: string | null;
      driverLicenseNo: string | null;
      trailerNo: string | null;
      scheduledTime: string | null;
      status: string;
      statusLabel: string;
      dispatchItems: TrailerDispatchItem[];
    };

    /** 装车司机 Check-in 提交参数（公开接口） */
    type TrailerCheckinSubmitParams = {
      pickupNo: string;
      driverPhone: string;
      driverLicenseNo: string;
      trailerNo: string;
    };

    /** 装车司机 Check-in 提交结果 */
    type TrailerCheckinSubmitResult = {
      success: boolean;
      message: string;
      checkInNo: string | null;
    };

    type InYard = {
      objectType: string;
      resourceId: CommonType.IdType;
      warehouseId: CommonType.IdType | null;
      plateNo: string | null;
      trailerNo: string | null;
      containerNo: string | null;
      vehicleSource: string | null;
      currentStatus: string;
      currentArea: string;
      areaLabel: string | null;
      gateInTime: string | null;
      stayMinutes: number | null;
      relatedOrderNo: string | null;
      relatedTaskId: CommonType.IdType | null;
      driverName: string | null;
      driverPhone: string | null;
      exceptionFlag: number | null;
      exceptionReason: string | null;
    };

    type InYardList = CommonType.PaginatingData<InYard>;

    type InYardSearchParams = CommonType.PaginatingQueryRecord & {
      warehouseId?: CommonType.IdType | null;
      objectType?: string | null;
      keyword?: string | null;
      currentArea?: string | null;
    };

    type CheckOut = {
      checkOutResult: string;
      rejectReason: string | null;
      objectType: string | null;
      resourceId: CommonType.IdType | null;
      warehouseId: CommonType.IdType | null;
      plateNo: string | null;
      trailerNo: string | null;
      containerNo: string | null;
      vehicleSource: string | null;
      currentStatus: string | null;
      currentArea: string | null;
      areaLabel: string | null;
      gateInTime: string | null;
      gateOutTime: string | null;
      stayMinutes: number | null;
      gateInPlateNo: string | null;
      gateInDriverName: string | null;
      gateInDriverPhone: string | null;
      gateInIdCardNo: string | null;
      checkOutPlateNo: string | null;
      checkOutDriverName: string | null;
      checkOutDriverPhone: string | null;
      checkOutIdCardNo: string | null;
      yardTaskId: CommonType.IdType | null;
      yardTaskNo: string | null;
      checkInId: CommonType.IdType | null;
      openInternalTaskId: CommonType.IdType | null;
      openInternalTaskNo: string | null;
      openInternalTaskType: string | null;
      openInternalTaskStatus: string | null;
      openInternalTaskTargetCode: string | null;
    };

    type CheckOutParams = {
      warehouseId: CommonType.IdType;
      keyword: string;
      confirmed?: boolean;
      plateNo?: string | null;
      driverName?: string | null;
      driverPhone?: string | null;
      idCardNo?: string | null;
      photoUrls?: string | null;
      remark?: string | null;
    };

    // ─── 园区盘点 ─────────────────────────────────────────────

    type YardInventoryTask = {
      id: CommonType.IdType;
      warehouseId: CommonType.IdType | null;
      warehouseName: string | null;
      inventoryNo: string;
      inventoryType: string;
      zoneId: CommonType.IdType | null;
      zoneCode: string | null;
      zoneName: string | null;
      expectedCount: number;
      actualCount: number;
      diffCount: number;
      status: string;
      startTime: string | null;
      finishTime: string | null;
      operatorId: CommonType.IdType | null;
      operatorName: string | null;
      remark: string | null;
      createTime: string | null;
      items?: YardInventoryItem[];
    };

    type YardInventoryItem = {
      id: CommonType.IdType;
      inventoryId: CommonType.IdType;
      objectType: string;
      objectNo: string;
      systemPositionId: CommonType.IdType | null;
      systemPositionCode: string | null;
      actualPositionId: CommonType.IdType | null;
      actualPositionCode: string | null;
      scanStatus: string;
      diffType: string | null;
      photoUrls: string | null;
      remark: string | null;
      scanTime: string | null;
      createTime: string | null;
    };

    type YardInventoryList = CommonType.PaginatingData<YardInventoryTask>;

    type YardInventorySearchParams = CommonType.PaginatingQueryRecord & {
      warehouseId?: CommonType.IdType | null;
      inventoryNo?: string | null;
      inventoryType?: string | null;
      status?: string | null;
      zoneId?: CommonType.IdType | null;
    };

    type YardInventoryCreate = {
      warehouseId: CommonType.IdType;
      inventoryType: string;
      zoneId?: CommonType.IdType | null;
      objectNos?: string[];
      remark?: string | null;
    };

    type YardInventoryScan = {
      inventoryId: CommonType.IdType;
      objectNo: string;
      objectType?: string | null;
      actualPositionId?: CommonType.IdType | null;
      actualPositionCode?: string | null;
      photoUrls?: string | null;
      remark?: string | null;
    };

  }
}
