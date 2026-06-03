declare namespace Api {
  namespace Yard {
    type Dock = Common.CommonRecord<{
      id: CommonType.IdType;
      tenantId: string;
      dockCode: string;
      dockName: string;
      locationType: string;
      warehouseId: CommonType.IdType;
      warehouseCode: string | null;
      warehouseName: string | null;
      businessTypeId: CommonType.IdType | null;
      businessTypeCode: string | null;
      businessTypeName: string | null;
      dockLocation: string | null;
      gridRow: number | null;
      gridCol: number | null;
      allowedVehicleTypes: string | null;
      appointmentSupported: number;
      maxConcurrent: number | null;
      dockStatus: string;
      enabledFlag: number;
      sortOrder: number | null;
      dispatchPriority: number | null;
      zoneId: CommonType.IdType | null;
      zoneCode: string | null;
      occupiedObjectNo: string | null;
      /** Dock类型：DEVANNING拆柜专用 / LOADING装车专用 / MIXED_DOCK通用 */
      dockType: string | null;
      enableQueue: number | null;
      maxQueueCount: number | null;
      remark: string | null;
    }>;

    type DockSearchParams = CommonType.RecordNullable<
      Pick<
        Dock,
        'dockCode' | 'dockName' | 'warehouseId' | 'locationType' | 'businessTypeId' | 'dockLocation' | 'dockStatus' | 'enabledFlag'
      > &
        Api.Common.CommonSearchParams
    >;

    type DockOperateParams = CommonType.RecordNullable<
      Pick<
        Dock,
        | 'id'
        | 'dockCode'
        | 'dockName'
        | 'locationType'
        | 'warehouseId'
        | 'warehouseCode'
        | 'warehouseName'
        | 'businessTypeId'
        | 'businessTypeCode'
        | 'businessTypeName'
        | 'dockLocation'
        | 'gridRow'
        | 'gridCol'
        | 'allowedVehicleTypes'
        | 'appointmentSupported'
        | 'maxConcurrent'
        | 'dockStatus'
        | 'enabledFlag'
        | 'sortOrder'
        | 'dispatchPriority'
        | 'zoneId'
        | 'zoneCode'
        | 'dockType'
        | 'enableQueue'
        | 'maxQueueCount'
        | 'remark'
      >
    >;

    type DockList = Api.Common.PaginatingQueryRecord<Dock>;

    type Zone = Common.CommonRecord<{
      id: CommonType.IdType;
      warehouseId: CommonType.IdType;
      zoneCode: string;
      zoneName: string;
      zoneType: string;
      sortOrder: number | null;
      remark: string | null;
    }>;

    type ZoneSearchParams = CommonType.RecordNullable<
      Pick<Zone, 'warehouseId' | 'zoneCode' | 'zoneName' | 'zoneType'> & Api.Common.CommonSearchParams
    >;

    type ZoneOperateParams = CommonType.RecordNullable<
      Pick<Zone, 'id' | 'warehouseId' | 'zoneCode' | 'zoneName' | 'zoneType' | 'sortOrder' | 'remark'>
    >;

    type ZoneList = Api.Common.PaginatingQueryRecord<Zone>;
  }
}
