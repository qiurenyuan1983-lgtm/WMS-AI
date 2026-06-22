declare namespace Api {
  namespace Tms {
    type TripDeadlineRiskLevel = 'NORMAL' | 'NEAR' | 'URGENT' | 'OVERDUE';

    type TripDeadlineFields = {
      distanceMiles: number;
      estimatedTravelMinutes: number;
      trafficBufferMinutes: number;
      exitCheckMinutes: number;
      sealSignMinutes: number;
      loadingMethod: string;
      estimatedLoadingMinutes: number;
      latestFinishTime: string | null;
      latestStartLoadingTime: string | null;
      remainingMinutes: number | null;
      deadlineRiskLevel: TripDeadlineRiskLevel;
      dispatchPriorityScore?: number;
    };

    type TripStatus =
      | 'PENDING_DISPATCH'
      | 'PRE_TRIP'
      | 'PENDING_MANUAL'
      | 'CONFIRMED'
      | 'PENDING_CHECKIN'
      | 'CHECKED_IN'
      | 'QUEUING'
      | 'LOADING'
      | 'DEPARTED'
      | 'IN_TRANSIT'
      | 'ARRIVED'
      | 'SIGNED'
      | 'PENDING_SETTLEMENT'
      | 'SETTLED'
      | 'EXCEPTION'
      | 'CANCELLED';

    type TripOrder = TripDeadlineFields & {
      id: number;
      tripNo: string;
      omsOrderNo: string;
      orderType: string;
      orderTypeLabel: string;
      customerName: string;
      originWarehouse: string;
      destination: string;
      appointmentTime: string | null;
      palletQty: number;
      cartonQty: number;
      carrierName: string | null;
      driverName: string | null;
      plateNo: string | null;
      dockNo: string | null;
      vehicleType: string | null;
      status: TripStatus;
      hasException: boolean;
      createTime: string;
      remark: string | null;
    };

    type TripLog = {
      id: number;
      time: string;
      operator: string;
      action: string;
      status: string;
    };

    type TripCargoItem = {
      id: number;
      cargoOrderId: number;
      cargoOrderNo: string;
      customerName: string;
      destination: string;
      appointmentNo: string | null;
      orderType?: string | null;
      palletQty: number;
      cartonQty: number;
    };

    type TripAvailableOrder = {
      id: number;
      cargoOrderNo: string;
      customerName: string;
      destination: string;
      appointmentNo: string | null;
      originWarehouse: string;
      orderType: string;
      orderTypeLabel: string;
      palletQty: number;
      cartonQty: number;
    };

    type TripDetail = TripOrder & {
      isaNo: string | null;
      weightLbs: number | null;
      supplierName: string | null;
      loadingProgress: string | null;
      contactName: string | null;
      contactPhone: string | null;
      cargoItems: TripCargoItem[];
      logs: TripLog[];
    };

    type TripAvailableOrderList = Common.PaginatingQueryRecord<TripAvailableOrder>;

    type AddTripCargoPayload = {
      orderIds: number[];
    };

    type AddTripCargoResult = {
      success: boolean;
      message: string;
      addedCount: number;
      data?: TripDetail;
    };

    type TripOrderSearchParams = Common.CommonSearchParams &
      CommonType.RecordNullable<{
        status: string;
        orderType: string;
        originWarehouse: string;
        keyword: string;
      }>;

    type TripOrderList = Common.PaginatingQueryRecord<TripOrder>;
    type TripStatusCount = Record<string, number>;

    type ActionResult = {
      success: boolean;
      message: string;
      data?: TripOrder;
    };

    type Overview = {
      pendingDispatch: number;
      pendingManual: number;
      inTransit: number;
      signed: number;
      exception: number;
      pendingSettlement: number;
      todayDepart: number;
      dockLoading: number;
      recentLogs: TmsLog[];
    };

    type DispatchWorkbenchStatus =
      | 'PENDING_DISPATCH'
      | 'RECOMMENDED'
      | 'PENDING_MANUAL'
      | 'CONFIRMED'
      | 'DOCK_ASSIGNED'
      | 'DRIVER_ASSIGNED'
      | 'VEHICLE_ASSIGNED'
      | 'SUPPLIER_ASSIGNED'
      | 'WMS_PUSHED'
      | 'DRIVER_PUSHED'
      | 'DRIVER_ACCEPTED'
      | 'CHECKED_IN'
      | 'LOADING'
      | 'DEPARTED'
      | 'COMPLETED'
      | 'EXCEPTION'
      | 'CANCELLED';

    type DispatchPoolOrder = TripDeadlineFields & {
      id: number;
      orderNo: string;
      omsOrderNo: string;
      tripNo: string | null;
      customerName: string;
      platform: string;
      destination: string;
      originWarehouse: string;
      appointmentTime: string;
      palletQty: number;
      cartonQty: number;
      status: DispatchWorkbenchStatus;
      holdFlag: boolean;
      exceptionFlag: boolean;
      cargoReady: boolean;
      inventoryAvailable: boolean;
      planId: number | null;
      routeDirection: string | null;
      dispatchPriorityScore?: number;
    };

    type DispatchPoolList = Common.PaginatingQueryRecord<DispatchPoolOrder>;

    type DispatchPlan = TripDeadlineFields & {
      id: number;
      planNo: string;
      tripNo: string | null;
      destination: string;
      route: string;
      orderCount: number;
      palletQty: number;
      cartonQty: number;
      appointmentTime: string;
      vehicleType: string;
      carrierName: string;
      dockNo: string;
      driverName: string;
      plateNo: string;
      estimatedCost: number;
      loadRate: number;
      onTimeRisk: TripDeadlineRiskLevel;
      score: number;
      status: string;
      orderIds: number[];
      confirmed: boolean;
      wmsPushed: boolean;
      driverPushed: boolean;
      dispatchPriorityScore?: number;
    };

    type DispatchLog = {
      id: number;
      time: string;
      operator: string;
      action: string;
      target: string;
      detail: string;
      level: 'info' | 'success' | 'warning' | 'error';
    };

    type DispatchTripDetail = {
      id: number;
      sourceType: 'plan' | 'order';
      tripNo: string | null;
      planNo: string | null;
      status: string;
      statusLabel: string;
      destination: string;
      originWarehouse: string;
      appointmentTime: string | null;
      customerSummary: string;
      orderCount: number;
      palletQty: number;
      cartonQty: number;
      vehicleType: string | null;
      dockNo: string | null;
      driverName: string | null;
      driverPhone: string | null;
      plateNo: string | null;
      carrierName: string | null;
      route: string | null;
      estimatedCost: number | null;
      loadRate: number | null;
      deadline: TripDeadlineFields;
      orders: DispatchPoolOrder[];
      cargoItems: TripCargoItem[];
      pushRecords: { type: string; time: string; operator: string; result: string }[];
      operationLogs: DispatchLog[];
    };

    type DispatchActionResult = {
      success: boolean;
      message: string;
      plan?: DispatchPlan;
      plans?: DispatchPlan[];
    };

    type Driver = {
      id: number;
      driverName: string;
      phone: string;
      supplierName: string;
      licenseNo: string;
      status: string;
      statusLabel: string;
      currentTripNo: string | null;
      gpsOnline: boolean;
      checkinTime: string | null;
      onTimeRate: number;
      exceptionRate: number;
    };

    type Vehicle = {
      id: number;
      plateNo: string;
      vehicleType: string;
      maxPallet: number;
      maxWeightLbs: number;
      supplierName: string;
      status: string;
      statusLabel: string;
      insuranceExpiry: string;
      registrationExpiry: string;
      currentDriver: string | null;
      currentTripNo: string | null;
    };

    type DockSlot = TripDeadlineFields & {
      id: number;
      dockNo: string;
      status: string;
      appointmentTime?: string | null;
      originWarehouse?: string | null;
      cartonQty?: number;
      tripNo: string | null;
      driverName: string | null;
      plateNo: string | null;
      destination: string | null;
      palletQty: number;
      loadedPallet: number;
      exceptionNote: string | null;
      etaDepart: string | null;
    };

    type PodRecord = {
      id: number;
      tripNo: string;
      omsOrderNo: string;
      destination: string;
      deliveredTime: string | null;
      receiver: string | null;
      uploadSource: string;
      auditStatus: string;
      auditStatusLabel: string;
      fileName: string | null;
      createTime: string;
    };

    type FreightRecord = {
      id: number;
      tripNo: string;
      supplierName: string;
      linehaul: number;
      accessorial: number;
      insurance: number;
      otherFee: number;
      totalFee: number;
      payStatus: string;
      payStatusLabel: string;
      invoiceNo: string | null;
    };

    type Supplier = {
      id: number;
      supplierName: string;
      supplierType: string;
      contactName: string;
      phone: string;
      email: string;
      serviceArea: string;
      onTimeRate: number;
      exceptionRate: number;
      status: string;
    };

    type Exception = {
      id: number;
      tripNo: string;
      exceptionType: string;
      severity: string;
      description: string;
      status: string;
      statusLabel: string;
      createTime: string;
      handler: string | null;
    };

    type TmsLog = {
      id: number;
      module: string;
      tripNo: string | null;
      operator: string;
      action: string;
      detail: string;
      createTime: string;
    };

    type DriverList = Common.PaginatingQueryRecord<Driver>;
    type VehicleList = Common.PaginatingQueryRecord<Vehicle>;
    type PodList = Common.PaginatingQueryRecord<PodRecord>;
    type FreightList = Common.PaginatingQueryRecord<FreightRecord>;
    type SupplierList = Common.PaginatingQueryRecord<Supplier>;
    type ExceptionList = Common.PaginatingQueryRecord<Exception>;
    type LogList = Common.PaginatingQueryRecord<TmsLog>;

    type SupplierTaskType =
      | 'container_pickup'
      | 'warehouse_load_checkin'
      | 'delivery_appointment_checkin'
      | 'customer_pickup'
      | 'return_flow';

    type SupplierTaskStatus =
      | 'PENDING_DISPATCH'
      | 'PENDING_ACCEPT'
      | 'ACCEPTED'
      | 'IN_TRANSIT'
      | 'ARRIVED'
      | 'CHECKED_IN'
      | 'WAITING'
      | 'EXECUTING'
      | 'COMPLETED'
      | 'EXCEPTION'
      | 'CLOSED';

    type SupplierTaskRow = {
      id: number;
      taskNo: string;
      taskType: SupplierTaskType;
      supplierId: number | null;
      supplierName: string | null;
      driverId: number | null;
      driverName: string | null;
      driverPhone: string | null;
      vehicleNo: string | null;
      relatedContainerNo: string | null;
      relatedTripNo: string | null;
      relatedOrderNo: string | null;
      appointmentNo: string | null;
      taskStatus: SupplierTaskStatus;
      gpsStatus: string;
      checkinStatus: string;
      bolUploadStatus: string;
      podUploadStatus: string;
      exceptionFlag: boolean;
      plannedTime: string | null;
      actualTime: string | null;
      eta: string | null;
      remark: string | null;
      sourceType: 'container_order' | 'trip' | 'order' | null;
      sourceId: CommonType.IdType | null;
    };

    type SupplierTaskList = Common.PaginatingQueryRecord<SupplierTaskRow>;

    type SupplierTaskSearchParams = CommonType.RecordNullable<{
      pageNum: number;
      pageSize: number;
      keyword: string;
      taskType: SupplierTaskType | '';
      taskStatus: SupplierTaskStatus | '';
      supplierName: string;
      exceptionFlag: boolean;
    }>;

    type SupplierTaskSummary = {
      todayTotal: number;
      pendingAccept: number;
      inProgress: number;
      checkedIn: number;
      exception: number;
      pendingBol: number;
      pendingPod: number;
    };

    type SupplierTaskStatusCount = {
      typeMap: Record<string, number>;
      statusMap: Record<string, number>;
      total: number;
    };
  }
}
