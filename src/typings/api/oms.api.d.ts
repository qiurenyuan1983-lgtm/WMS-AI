declare namespace Api {
  namespace Oms {
    type ContainerOrder = Common.CommonRecord<{
      id: CommonType.IdType;
      companyId: CommonType.IdType;
      companyName: string | null;
      customerId: CommonType.IdType;
      customerName: string;
      channelId: CommonType.IdType | null;
      channelName: string | null;
      businessTypeId: CommonType.IdType | null;
      businessTypeName: string | null;
      ownerUserId: CommonType.IdType | null;
      ownerUserName: string | null;
      customerServiceId: CommonType.IdType | null;
      customerServiceName: string | null;
      warehouseId: CommonType.IdType;
      warehouseName: string | null;
      inboundWarehouseName: string | null;
      containerOrderNo: string;
      orderSource: string | null;
      containerNo: string;
      containerType: string;
      sealNo: string | null;
      shippingLineId: CommonType.IdType | null;
      shippingLineName: string | null;
      vesselName: string | null;
      voyageNo: string | null;
      routeCode: string | null;
      mblNo: string | null;
      hblNo: string | null;
      dischargePortId: CommonType.IdType | null;
      dischargePortName: string | null;
      terminalId: CommonType.IdType | null;
      terminalName: string | null;
      eta: string | null;
      ata: string | null;
      pickupLfd: string | null;
      emptyReturnLfd: string | null;
      availableTime: string | null;
      terminalReleaseStatus: string;
      holdFlag?: number;
      holdTypes: string | null;
      holdRemark: string | null;
      examStatus: string;
      examFlag?: number;
      examTypes: string | null;
      examType: string | null;
      examRemark: string | null;
      drayageVendorId: CommonType.IdType | null;
      drayageVendorName: string | null;
      pickupAppointmentNo: string | null;
      pickupAppointmentTime: string | null;
      actualPickupTime: string | null;
      pickupRemark: string | null;
      expectedArrivalTime: string | null;
      requiredArrivalTime: string | null;
      actualArrivalTime: string | null;
      containerLocation: string | null;
      arrivalRemark: string | null;
      devanningNo: string | null;
      devanningOrderNo: string | null;
      devanningWarehouseId: CommonType.IdType | null;
      expectedDevanningTime: string | null;
      devanningAppointmentTime: string | null;
      devanningMethod: string | null;
      loadingType: string | null;
      sortingMethod: string | null;
      devanningStartTime: string | null;
      devanningFinishTime: string | null;
      devanningRemark: string | null;
      emptyReturnLocation: string | null;
      emptyReturnAppointmentNo: string | null;
      emptyReturnTime: string | null;
      emptyReturnStatus: string | null;
      emptyReturnRemark: string | null;
      prePlanTruckQty: number | null;
      prePlanPalletQty: number | null;
      prePlanCbm: number | null;
      totalCartonQty: number | null;
      totalPalletQty: number | null;
      totalWeight: number | null;
      totalCbm: number | null;
      containerExceptionFlag: number;
      containerExceptionType: string | null;
      containerExceptionCount: number;
      downstreamExceptionFlag: number;
      downstreamExceptionCount: number;
      attachmentCount: number;
      doAttachmentCount: number;
      latestAttachmentTime: string | null;
      latestDoUploadTime: string | null;
      containerStatus: string;
      internalRemark: string | null;
      status: string;
      remark: string | null;
      cargoOrders: CargoOrder[];
      traces: ContainerOrderTrace[];
    }>;

    type CargoOrder = Common.CommonRecord<{
      id: CommonType.IdType;
      bizRootId: CommonType.IdType;
      companyId: CommonType.IdType;
      warehouseId: CommonType.IdType;
      containerOrderId: CommonType.IdType;
      containerOrderNo: string;
      containerNo: string;
      cargoOrderNo: string;
      externalOrderNo: string | null;
      customerId: CommonType.IdType;
      customerName: string;
      channelId: CommonType.IdType | null;
      businessTypeId: CommonType.IdType | null;
      platformCode: string | null;
      platformName: string | null;
      addressType: string | null;
      warehouseCode: string | null;
      platformWarehouseCode: string | null;
      groupCode: string | null;
      inboundWarehouseName: string | null;
      customerServiceId: CommonType.IdType | null;
      customerServiceName: string | null;
      fulfillmentStatus: string;
      billingStatus: string;
      preOutboundStatus: string;
      exceptionFlag: number | null;
      exceptionCount: number | null;
      holdFlag: number | null;
      holdStatus: string | null;
      holdType: string | null;
      holdReason: string | null;
      holdTime: string | null;
      releaseTime: string | null;
      transferFlag: number | null;
      transferWarehouseCode: string | null;
      forecastQtyUnit: string | null;
      outboundBatchNo: string | null;
      consigneeName: string | null;
      addressLine1: string | null;
      addressLine2: string | null;
      city: string | null;
      state: string | null;
      zipCode: string | null;
      country: string | null;
      contactName: string | null;
      contactPhone: string | null;
      contactEmail: string | null;
      shipmentCodes: string | null;
      poNos: string | null;
      marks: string | null;
      cargoQty: number | null;
      expectedBoxQty: number | null;
      expectedPalletQty: number | null;
      expectedWeight: number | null;
      expectedCbm: number | null;
      declaredCartonQty: number | null;
      declaredPalletQty: number | null;
      declaredWeight: number | null;
      declaredCbm: number | null;
      earliestDwTime: string | null;
      eta: string | null;
      actualInboundTime: string | null;
      deliveryLfd: string | null;
      remark: string | null;
      followUpRemark: string | null;
      customerRemark: string | null;
      internalRemark: string | null;
      shipments: CargoOrderShipment[];
    }>;

    type CargoOrderShipment = {
      id?: CommonType.IdType | null;
      cargoOrderId?: CommonType.IdType | null;
      /** 后端字段 */
      shipmentNo?: string | null;
      shippingMark?: string | null;
      cartonQty?: number | null;
      palletQty?: number | null;
      weight?: number | null;
      cbm?: number | null;
      /** 兼容旧前端字段 */
      shipmentCode?: string | null;
      poNo?: string | null;
      mark?: string | null;
      skuSummary?: string | null;
      expectedQty?: number | null;
      expectedBoxQty?: number | null;
      expectedWeight?: number | null;
      expectedCbm?: number | null;
      dwTime?: string | null;
      remark?: string | null;
      skuItems?: CargoOrderSkuItem[];
    };

    type CargoOrderShipmentItem = {
      id?: CommonType.IdType | null;
      shipmentNo?: string | null;
      poNo?: string | null;
      shippingMark?: string | null;
      cartonQty?: number | null;
      palletQty?: number | null;
      weight?: number | null;
      cbm?: number | null;
      dwTime?: string | null;
      remark?: string | null;
      skuItems?: CargoOrderSkuItem[];
    };

    type ContainerOrderTrace = {
      id: CommonType.IdType;
      statusFrom: string | null;
      statusTo: string;
      action: string;
      actionDesc: string | null;
      operatorName: string | null;
      remark: string | null;
      createTime: string;
    };

    type ContainerOrderSearchParams = CommonType.RecordNullable<
      Pick<
        ContainerOrder,
        | 'containerOrderNo'
        | 'containerNo'
        | 'companyId'
        | 'customerId'
        | 'customerName'
        | 'orderSource'
        | 'channelId'
        | 'businessTypeId'
        | 'ownerUserName'
        | 'customerServiceName'
        | 'warehouseId'
        | 'shippingLineId'
        | 'shippingLineName'
        | 'containerType'
        | 'sealNo'
        | 'vesselName'
        | 'voyageNo'
        | 'routeCode'
        | 'mblNo'
        | 'hblNo'
        | 'dischargePortName'
        | 'terminalName'
        | 'containerStatus'
        | 'terminalReleaseStatus'
        | 'examStatus'
        | 'examType'
        | 'examRemark'
        | 'drayageVendorName'
        | 'pickupAppointmentNo'
        | 'pickupRemark'
        | 'containerLocation'
        | 'arrivalRemark'
        | 'devanningNo'
        | 'devanningMethod'
        | 'loadingType'
        | 'sortingMethod'
        | 'devanningRemark'
        | 'emptyReturnLocation'
        | 'emptyReturnRemark'
        | 'containerExceptionFlag'
        | 'containerExceptionType'
        | 'downstreamExceptionFlag'
      > &
        Api.Common.CommonSearchParams & {
          keyword?: string | null;
          beginEta?: string | null;
          endEta?: string | null;
          beginPickupLfd?: string | null;
          endPickupLfd?: string | null;
          beginEmptyReturnLfd?: string | null;
          endEmptyReturnLfd?: string | null;
          beginAta?: string | null;
          endAta?: string | null;
          beginActualPickupTime?: string | null;
          endActualPickupTime?: string | null;
          beginExpectedArrivalTime?: string | null;
          endExpectedArrivalTime?: string | null;
          beginActualArrivalTime?: string | null;
          endActualArrivalTime?: string | null;
          beginExpectedDevanningTime?: string | null;
          endExpectedDevanningTime?: string | null;
          beginDevanningStartTime?: string | null;
          endDevanningStartTime?: string | null;
          beginDevanningFinishTime?: string | null;
          endDevanningFinishTime?: string | null;
          beginEmptyReturnTime?: string | null;
          endEmptyReturnTime?: string | null;
        }
    >;

    type ContainerOrderOperateParams = CommonType.RecordNullable<
      Pick<
        ContainerOrder,
        | 'id'
        | 'containerOrderNo'
        | 'companyId'
        | 'customerId'
        | 'customerName'
        | 'channelId'
        | 'businessTypeId'
        | 'ownerUserId'
        | 'ownerUserName'
        | 'customerServiceId'
        | 'customerServiceName'
        | 'warehouseId'
        | 'inboundWarehouseName'
        | 'containerNo'
        | 'orderSource'
        | 'containerType'
        | 'sealNo'
        | 'shippingLineId'
        | 'shippingLineName'
        | 'vesselName'
        | 'voyageNo'
        | 'routeCode'
        | 'mblNo'
        | 'hblNo'
        | 'dischargePortId'
        | 'dischargePortName'
        | 'terminalId'
        | 'terminalName'
        | 'eta'
        | 'ata'
        | 'pickupLfd'
        | 'emptyReturnLfd'
        | 'availableTime'
        | 'terminalReleaseStatus'
        | 'examStatus'
        | 'examTypes'
        | 'examType'
        | 'examRemark'
        | 'drayageVendorId'
        | 'drayageVendorName'
        | 'pickupAppointmentNo'
        | 'pickupAppointmentTime'
        | 'actualPickupTime'
        | 'pickupRemark'
        | 'expectedArrivalTime'
        | 'requiredArrivalTime'
        | 'actualArrivalTime'
        | 'containerLocation'
        | 'arrivalRemark'
        | 'devanningNo'
        | 'devanningMethod'
        | 'expectedDevanningTime'
        | 'devanningAppointmentTime'
        | 'devanningStartTime'
        | 'devanningFinishTime'
        | 'loadingType'
        | 'sortingMethod'
        | 'devanningRemark'
        | 'emptyReturnLocation'
        | 'emptyReturnAppointmentNo'
        | 'emptyReturnTime'
        | 'emptyReturnRemark'
        | 'containerStatus'
        | 'internalRemark'
        | 'status'
        | 'remark'
      > & {
        cargoOrders: NewCargoOrderOperateParams[];
      }
    >;

    type ContainerOrderStatusParams = {
      targetStatus: string;
      remark?: string | null;
    };

    type ContainerOrderList = Api.Common.PaginatingQueryRecord<ContainerOrder>;

    // ======================== 货物订单（新主线模块）========================

    type CargoOrderShipmentItem = {
      id?: CommonType.IdType | null;
      cargoOrderId?: CommonType.IdType | null;
      bizRootId?: CommonType.IdType | null;
      shipmentNo: string;
      poNo?: string | null;
      shippingMark?: string | null;
      cartonQty?: number | null;
      palletQty?: number | null;
      weight?: number | null;
      cbm?: number | null;
      dwTime?: string | null;
      remark?: string | null;
      createTime?: string | null;
      skuItems?: CargoOrderSkuItem[];
    };

    type CargoOrderSkuItem = {
      id?: CommonType.IdType | null;
      cargoOrderId?: CommonType.IdType | null;
      shipmentId?: CommonType.IdType | null;
      shipmentNo?: string | null;
      poNo?: string | null;
      shippingMark?: string | null;
      sku?: string | null;
      fnsku?: string | null;
      productName?: string | null;
      qty?: number | null;
      cartonQty?: number | null;
      weight?: number | null;
      cbm?: number | null;
      remark?: string | null;
      createTime?: string | null;
    };

    type CargoOrderNodeTrace = {
      id: CommonType.IdType;
      cargoOrderId: CommonType.IdType;
      bizRootId?: CommonType.IdType | null;
      nodeCode: string;
      nodeName?: string | null;
      nodeStatus: string;
      statusFrom?: string | null;
      statusTo?: string | null;
      action?: string | null;
      actualTime?: string | null;
      sourceType?: string | null;
      sourceOrderNo?: string | null;
      operatorId?: CommonType.IdType | null;
      operatorName?: string | null;
      remark?: string | null;
      createTime: string;
    };

    type NewCargoOrder = Common.CommonRecord<{
      id: CommonType.IdType;
      bizRootId?: CommonType.IdType | null;
      companyId?: CommonType.IdType | null;

      cargoOrderNo: string;
      externalOrderNo?: string | null;
      orderSource?: string | null;

      customerId?: CommonType.IdType | null;
      customerName?: string | null;
      businessTypeId?: CommonType.IdType | null;
      businessTypeName?: string | null;
      channelId?: CommonType.IdType | null;
      channelName?: string | null;
      platformId?: CommonType.IdType | null;
      platformName?: string | null;
      customerServiceId?: CommonType.IdType | null;
      customerServiceName?: string | null;
      orderTag?: string | null;
      orderTagName?: string | null;
      dispatchRemark?: string | null;
      storageLocation?: string | null;

      containerOrderId?: CommonType.IdType | null;
      containerNo?: string | null;
      inboundWarehouseId?: CommonType.IdType | null;
      inboundWarehouseName?: string | null;

      addressType?: string | null;
      platformWarehouseCode?: string | null;
      groupCode?: string | null;
      consigneeName?: string | null;
      addressLine1?: string | null;
      addressLine2?: string | null;
      city?: string | null;
      state?: string | null;
      zipCode?: string | null;
      country?: string | null;
      contactName?: string | null;
      contactPhone?: string | null;
      contactEmail?: string | null;

      shipmentCodes?: string | null;
      poNos?: string | null;
      marks?: string | null;
      holdFlag?: number | null;
      holdStatus?: string | null;
      holdType?: string | null;
      holdReason?: string | null;
      holdTime?: string | null;
      releaseTime?: string | null;
      holdRemark?: string | null;
      deliveryLfd?: string | null;
      followUpRemark?: string | null;
      remark?: string | null;

      parcelCarrierName?: string | null;
      parcelTrackingNo?: string | null;

      transferFlag?: number | null;
      transferWarehouseCode?: string | null;

      declaredCartonQty?: number | null;
      declaredPieceQty?: number | null;
      declaredWeight?: number | null;
      declaredCbm?: number | null;

      actualCartonQty?: number | null;
      actualPalletQty?: number | null;
      actualPieceQty?: number | null;
      actualWeight?: number | null;
      actualCbm?: number | null;

      weightUnit?: string | null;
      volumeUnit?: string | null;

      preOutboundFlag?: number | null;
      preOutboundNo?: string | null;
      preOutboundStatus: string;
      preOutboundTime?: string | null;
      preOutboundConvertTime?: string | null;
      outboundBatchNo?: string | null;
      outboundOrderStatus: string;
      outboundOrderTime?: string | null;

      orderStatus: string;
      fulfillmentStatus: string;
      appointmentStatus: string;
      podStatus: string;
      billingStatus: string;

      earliestDwTime?: string | null;
      eta?: string | null;
      ata?: string | null;
      actualPickupTime?: string | null;
      actualArrivalTime?: string | null;
      devanningFinishTime?: string | null;
      actualInboundTime?: string | null;
      deliveryAppointmentTime?: string | null;
      actualOutboundTime?: string | null;
      signedTime?: string | null;
      podUploadTime?: string | null;
      billingTime?: string | null;
      completedTime?: string | null;

      exceptionFlag: number;
      exceptionCount: number;

      parentOrderId?: CommonType.IdType | null;
      parentOrderNo?: string | null;
      rootOrderId?: CommonType.IdType | null;
      rootOrderNo?: string | null;
      splitFlag?: number | null;
      splitRole?: string | null;
      splitStatus?: string | null;
      splitGroupNo?: string | null;
      childOrderCount?: number | null;
      splitSource?: string | null;
      customerVisibleFlag?: number | null;
      attachmentCount?: number | null;
      podAttachmentCount?: number | null;
      exceptionAttachmentCount?: number | null;
      latestAttachmentTime?: string | null;

      customerRemark?: string | null;
      internalRemark?: string | null;
      operationRemark?: string | null;
      followUpRemark?: string | null;
      remark?: string | null;

      forecastQtyUnit?: 'BY_CARTON' | 'BY_PALLET' | string | null;
      declaredPalletQty?: number | null;

      shipments: CargoOrderShipmentItem[];
      nodeTraces: CargoOrderNodeTrace[];
    }>;

    type CargoOrderKeywordField =
      | 'cargoOrderNo'
      | 'mark'
      | 'shipmentCode'
      | 'poNo'
      | 'externalOrderNo';

    type NewCargoOrderSearchParams = CommonType.RecordNullable<{
      keywordField?: CargoOrderKeywordField | null;
      keyword?: string | null;
      cargoOrderNo?: string | null;
      externalOrderNo?: string | null;
      customerId?: CommonType.IdType | null;
      customerName?: string | null;
      /** 高级筛选多选时为逗号分隔 ID */
      businessTypeId?: string | null;
      channelId?: string | null;
      platformId?: string | null;
      customerServiceId?: string | null;
      inboundWarehouseId?: string | null;
      orderSource?: string | null;
      addressType?: string | null;
      platformWarehouseCode?: string | null;
      groupCode?: string | null;
      city?: string | null;
      state?: string | null;
      zipCode?: string | null;
      containerNo?: string | null;
      fulfillmentStatus?: string | null;
      billingStatus?: string | null;
      preOutboundStatus?: string | null;
      outboundOrderStatus?: string | null;
      podStatus?: string | null;
      exceptionFlag?: string | null;
      transferFlag?: string | null;
      parcelCarrierName?: string | null;
      parcelTrackingNo?: string | null;
      outboundBatchNo?: string | null;
      beginEarliestDwTime?: string | null;
      endEarliestDwTime?: string | null;
      beginEta?: string | null;
      endEta?: string | null;
      beginAta?: string | null;
      endAta?: string | null;
      beginActualArrivalTime?: string | null;
      endActualArrivalTime?: string | null;
      beginActualInboundTime?: string | null;
      endActualInboundTime?: string | null;
      beginDeliveryAppointmentTime?: string | null;
      endDeliveryAppointmentTime?: string | null;
      beginActualOutboundTime?: string | null;
      endActualOutboundTime?: string | null;
      beginSignedTime?: string | null;
      endSignedTime?: string | null;
      beginCreateTime?: string | null;
      endCreateTime?: string | null;
    } & Api.Common.CommonSearchParams>;

    type NewCargoOrderOperateParams = CommonType.RecordNullable<{
      id?: CommonType.IdType | null;
      cargoOrderNo?: string | null;
      externalOrderNo?: string | null;
      orderSource?: string | null;
      customerId?: CommonType.IdType | null;
      customerName?: string | null;
      businessTypeId?: CommonType.IdType | null;
      businessTypeName?: string | null;
      channelId?: CommonType.IdType | null;
      channelName?: string | null;
      platformId?: CommonType.IdType | null;
      platformName?: string | null;
      customerServiceId?: CommonType.IdType | null;
      customerServiceName?: string | null;
      inboundWarehouseId?: CommonType.IdType | null;
      inboundWarehouseName?: string | null;
      addressType?: string | null;
      platformWarehouseCode?: string | null;
      consigneeName?: string | null;
      addressLine1?: string | null;
      addressLine2?: string | null;
      city?: string | null;
      state?: string | null;
      zipCode?: string | null;
      country?: string | null;
      contactName?: string | null;
      contactPhone?: string | null;
      contactEmail?: string | null;
      parcelCarrierName?: string | null;
      parcelTrackingNo?: string | null;
      transferFlag?: number | null;
      transferWarehouseCode?: string | null;
      forecastQtyUnit?: 'BY_CARTON' | 'BY_PALLET' | string | null;
      declaredCartonQty?: number | null;
      declaredPalletQty?: number | null;
      declaredPieceQty?: number | null;
      declaredWeight?: number | null;
      declaredCbm?: number | null;
      weightUnit?: string | null;
      volumeUnit?: string | null;
      eta?: string | null;
      ata?: string | null;
      customerRemark?: string | null;
      internalRemark?: string | null;
      operationRemark?: string | null;
      followUpRemark?: string | null;
      remark?: string | null;
      shipments?: CargoOrderShipmentItem[];
    }>;

    /** 海柜场景下关联货物订单表单（与货物订单详情字段对齐） */
    type ContainerCargoOrderForm = NewCargoOrderOperateParams;

    type CargoOrderOperateParams = NewCargoOrderOperateParams;

    type NewCargoOrderList = Api.Common.PaginatingQueryRecord<NewCargoOrder>;

    type BizAttachment = Common.CommonRecord<{
      id: CommonType.IdType;
      bizRootId?: CommonType.IdType | null;
      targetType: string;
      targetId: CommonType.IdType;
      targetNo: string;
      attachmentType: string;
      fileName: string;
      fileUrl: string;
      fileSize?: number | null;
      fileExt?: string | null;
      mimeType?: string | null;
      customerVisibleFlag: number;
      internalVisibleFlag: number;
      uploadUserId?: CommonType.IdType | null;
      uploadUserName?: string | null;
      uploadTime?: string | null;
      remark?: string | null;
    }>;

    type BizAttachmentOperateParams = CommonType.RecordNullable<{
      attachmentType: string;
      fileName: string;
      fileUrl: string;
      fileSize?: number | null;
      fileExt?: string | null;
      mimeType?: string | null;
      customerVisibleFlag?: number | null;
      internalVisibleFlag?: number | null;
      remark?: string | null;
    }>;

    type OutboundReadiness = 'NOT_INBOUNDED' | 'DEVANNING' | 'INBOUNDED';
    type OutboundDirection = 'DELIVERY' | 'TRANSFER' | (string & {});

    type OutboundPoolSearchParams = CommonType.RecordNullable<
      {
        keyword?: string | null;
        cargoOrderNo?: string | null;
        customerName?: string | null;
        containerNo?: string | null;
        shipmentCodes?: string | null;
        platformWarehouseCode?: string | null;
        groupCode?: string | null;
        channelName?: string | null;
        businessTypeName?: string | null;
        addressType?: string | null;
        readiness?: OutboundReadiness | null;
        city?: string | null;
        state?: string | null;
        zipCode?: string | null;
        transferFlag?: number | null;
        overdueDeliveryLfd?: boolean | null;
        overdueDw?: boolean | null;
        beginCreateTime?: string | null;
        endCreateTime?: string | null;
        beginDeliveryLfd?: string | null;
        endDeliveryLfd?: string | null;
        beginEarliestDwTime?: string | null;
        endEarliestDwTime?: string | null;
      } & Api.Common.CommonSearchParams
    >;

    type OutboundPoolStats = {
      totalCount: number;
      notInboundedCount: number;
      devanningCount: number;
      inboundedCount: number;
      overdueDeliveryLfdCount: number;
      overdueDwCount: number;
      inTransitCbm: number;
      devanningCbm: number;
      inboundedCbm: number;
      totalCbm: number;
    };

    type OutboundCreateParams = CommonType.RecordNullable<{
      cargoOrderId?: CommonType.IdType | null;
      cargoOrderIds?: CommonType.IdType[];
      outboundDirection?: OutboundDirection | null;
      outboundWarehouseId?: CommonType.IdType | null;
      outboundWarehouseName?: string | null;
      transferInWarehouseId?: CommonType.IdType | null;
      deliveryMethod?: string | null;
      appointmentStatus?: string | null;
      appointmentNo?: string | null;
      appointmentTime?: number | string | null;
      deliveryTruck?: string | null;
      loadingType?: string | null;
      transportType?: string | null;
      deliveryTag?: string | null;
      destination?: string | null;
      followRecord?: string | null;
      transferReason?: string | null;
      transferMethod?: string | null;
      transferFlag?: number | null;
      transferWarehouseCode?: string | null;
      remark?: string | null;
    }>;

    type PreOutbound = Common.CommonRecord<{
      id: CommonType.IdType;
      bizRootId?: CommonType.IdType | null;
      cargoOrderId: CommonType.IdType;
      cargoOrderNo: string;
      preOutboundNo: string;
      preOutboundStatus: string;
      outboundDirection: OutboundDirection;
      outboundWarehouseId?: CommonType.IdType | null;
      outboundWarehouseName?: string | null;
      customerName?: string | null;
      containerNo?: string | null;
      shipmentCodes?: string | null;
      declaredCartonQty?: number | null;
      declaredPalletQty?: number | null;
      declaredWeight?: number | null;
      declaredCbm?: number | null;
      actualCartonQty?: number | null;
      actualPalletQty?: number | null;
      actualWeight?: number | null;
      actualCbm?: number | null;
      earliestDwTime?: string | null;
      deliveryLfd?: string | null;
      readyTime?: string | null;
      convertedTime?: string | null;
      outboundOrderNo?: string | null;
      appointmentNo?: string | null;
      appointmentTime?: string | null;
      deliveryTruck?: string | null;
      loadingType?: string | null;
      transportType?: string | null;
      deliveryTag?: string | null;
      destination?: string | null;
      deliveryMethod?: string | null;
      followRecord?: string | null;
      remark?: string | null;
    }>;

    type PreOutboundSearchParams = CommonType.RecordNullable<
      {
        keyword?: string | null;
        preOutboundStatus?: string | null;
        outboundDirection?: OutboundDirection | null;
        outboundWarehouseId?: CommonType.IdType | null;
        customerName?: string | null;
      } & Api.Common.CommonSearchParams
    >;

    type PreOutboundList = Api.Common.PaginatingQueryRecord<PreOutbound>;

    type PreOutboundItem = {
      id: CommonType.IdType;
      preOutboundId: CommonType.IdType;
      preOutboundNo: string;
      cargoOrderId: CommonType.IdType;
      cargoOrderNo: string;
      containerNo?: string | null;
      shipmentCodes?: string | null;
      poNos?: string | null;
      platformWarehouseCode?: string | null;
      groupCode?: string | null;
      readiness?: Api.Oms.OutboundReadiness | null;
      fulfillmentStatus?: string | null;
      declaredCartonQty?: number | null;
      actualCartonQty?: number | null;
      declaredPalletQty?: number | null;
      actualPalletQty?: number | null;
      actualWeight?: number | null;
      actualCbm?: number | null;
    };

    type PreOutboundUpdateParams = CommonType.RecordNullable<{
      outboundDirection?: OutboundDirection | null;
      appointmentNo?: string | null;
      appointmentTime?: number | string | null;
      deliveryTruck?: string | null;
      loadingType?: string | null;
      transportType?: string | null;
      deliveryTag?: string | null;
      followRecord?: string | null;
      remark?: string | null;
    }>;

    type OutboundOrder = Common.CommonRecord<{
      id: CommonType.IdType;
      bizRootId?: CommonType.IdType | null;
      cargoOrderId?: CommonType.IdType | null;
      cargoOrderNo?: string | null;
      cargoOrderCount?: number | null;
      preOutboundId?: CommonType.IdType | null;
      preOutboundNo?: string | null;
      outboundOrderNo: string;
      outboundStatus: string;
      outboundDirection: OutboundDirection;
      outboundWarehouseId?: CommonType.IdType | null;
      outboundWarehouseName?: string | null;
      customerName?: string | null;
      containerNo?: string | null;
      shipmentCodes?: string | null;
      actualCartonQty?: number | null;
      actualPalletQty?: number | null;
      actualWeight?: number | null;
      actualCbm?: number | null;
      deliveryMethod?: string | null;
      appointmentStatus?: string | null;
      appointmentTime?: string | null;
      deliveryLfd?: string | null;
      contactName?: string | null;
      contactPhone?: string | null;
      contactEmail?: string | null;
      addressLine1?: string | null;
      addressLine2?: string | null;
      city?: string | null;
      state?: string | null;
      zipCode?: string | null;
      country?: string | null;
      transferInWarehouseId?: CommonType.IdType | null;
      transferMethod?: string | null;
      transferReason?: string | null;
      carrier?: string | null;
      trackingNo?: string | null;
      actualOutboundTime?: string | null;
      actualArrivalTime?: string | null;
      actualSignedTime?: string | null;
      podStatus?: string | null;
      podUploadTime?: string | null;
      completedTime?: string | null;
      dispatchRemark?: string | null;
      operationRemark?: string | null;
      remark?: string | null;
    }>;

    type OutboundOrderItem = {
      id: CommonType.IdType;
      outboundOrderId: CommonType.IdType;
      outboundOrderNo: string;
      cargoOrderId: CommonType.IdType;
      cargoOrderNo: string;
      actualCartonQty?: number | null;
      actualPalletQty?: number | null;
      actualWeight?: number | null;
      actualCbm?: number | null;
    };

    type OutboundOrderSearchParams = CommonType.RecordNullable<
      {
        keyword?: string | null;
        keywordField?: string | null;
        outboundOrderNo?: string | null;
        preOutboundNo?: string | null;
        cargoOrderNo?: string | null;
        containerNo?: string | null;
        shipmentCodes?: string | null;
        outboundStatus?: string | null;
        outboundDirection?: OutboundDirection | null;
        outboundWarehouseId?: CommonType.IdType | null;
        outboundWarehouseName?: string | null;
        customerName?: string | null;
        appointmentStatus?: string | null;
        podStatus?: string | null;
      } & Api.Common.CommonSearchParams
    >;

    type OutboundOrderList = Api.Common.PaginatingQueryRecord<OutboundOrder>;

    type CargoOrderHoldParams = {
      holdType: string;
      holdReason: string;
      remark?: string | null;
    };

    type CargoOrderReleaseParams = {
      releaseReason: string;
      remark?: string | null;
    };

    type CargoOrderSplitParams = {
      splitSource: 'CUSTOMER' | 'INTERNAL';
      customerVisibleFlag: number;
      splitRequestedBy?: string | null;
      customerSplitReason?: string | null;
      internalSplitReason?: string | null;
      splitMode?: string | null;
      remark?: string | null;
      children: Array<{
        cargoOrderNoSuffix?: string | null;
        shipmentIds?: CommonType.IdType[];
        cartonQty?: number | null;
        weight?: number | null;
        cbm?: number | null;
        holdFlag?: number | null;
        holdReason?: string | null;
        customerVisibleFlag?: number | null;
        remark?: string | null;
      }>;
    };

    type CargoOrderMergeBackParams = {
      rootCargoOrderId: CommonType.IdType;
      childCargoOrderIds: CommonType.IdType[];
      mergeBackReason: string;
      mergeBackType?: string | null;
    };

    type CargoGroupingRuleStatus = 'enabled' | 'disabled';

    type CargoGroupingFieldMeta = {
      id: CommonType.IdType;
      tableAlias: 'order' | 'shipment' | string;
      fieldName: string;
      displayName: string;
      dataType: 'STRING' | 'NUMBER' | 'DATE' | 'ENUM' | 'REF' | string;
      enumCode?: string | null;
      refType?: string | null;
      canBeCondition?: number | null;
      canBeGroupKey?: number | null;
      sortOrder?: number | null;
      enabled?: number | null;
      remark?: string | null;
    };

    type CargoGroupingFieldMetaSearchParams = CommonType.RecordNullable<{
      tableAlias?: string | null;
      fieldName?: string | null;
      displayName?: string | null;
      canBeCondition?: number | null;
      canBeGroupKey?: number | null;
      enabled?: number | null;
    }>;

    type CargoGroupingRuleCondition = {
      field: string;
      op: string;
      value?: string | number | Array<string | number> | null;
    };

    type CargoGroupingRuleConditionConfig = {
      mode: 'VALUE_MATCH' | 'EXPRESSION';
      logic?: 'AND' | 'OR';
      conditions?: CargoGroupingRuleCondition[];
      expression?: string | null;
    };

    type CargoGroupingRuleGroupKeyConfig = {
      separator?: string;
      fields: Array<{ field: string; alias?: string | null }>;
    };

    type CargoGroupingRule = {
      id: CommonType.IdType;
      warehouseName?: string | null;
      warehouseIds?: string | null;
      ruleName: string;
      conditionConfig: string;
      groupKeyConfig: string;
      priority: number;
      isDefault: number;
      status: CargoGroupingRuleStatus;
      version?: number | null;
      remark?: string | null;
      createTime?: string | null;
      updateTime?: string | null;
    };

    type CargoGroupingRuleOperateParams = CommonType.RecordNullable<{
      id?: CommonType.IdType;
      warehouseIds: string;
      warehouseNames?: string | null;
      ruleName: string;
      conditionConfig: string;
      groupKeyConfig: string;
      priority?: number | null;
      isDefault?: number | null;
      status?: CargoGroupingRuleStatus | null;
      version?: number | null;
      remark?: string | null;
    }>;

    type CargoGroupingRuleSearchParams = CommonType.RecordNullable<
      {
        warehouseId?: CommonType.IdType | null;
        warehouseName?: string | null;
        ruleName?: string | null;
        status?: CargoGroupingRuleStatus | null;
      } & Api.Common.CommonSearchParams
    >;

    type CargoGroupingRuleList = Api.Common.PaginatingQueryRecord<CargoGroupingRule>;

    type CargoGroupingRulePriorityParams = {
      id: CommonType.IdType;
      priority: number;
    };

    type CargoGroupingRuleTestParams = {
      warehouseId: CommonType.IdType;
      cargoOrderId?: CommonType.IdType | null;
      shipmentId?: CommonType.IdType | null;
      orderContext?: string | null;
      shipmentContext?: string | null;
    };

    type CargoGroupingRuleTestResult = {
      matched: boolean;
      ruleId?: CommonType.IdType | null;
      ruleName?: string | null;
      priority?: number | null;
      isDefault?: number | null;
      groupKey?: string | null;
      message?: string | null;
      conditionDetails?: Array<{
        field: string;
        fieldValue?: unknown;
        op: string;
        expectedValue?: unknown;
        hit: boolean;
      }>;
    };

    // ======================== 入库计划 ========================

    type InboundPlanStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled';

    type InboundPlanItem = {
      id: CommonType.IdType;
      planId: CommonType.IdType;
      cargoOrderId: CommonType.IdType;
      shipmentId: CommonType.IdType;
      groupCode: string | null;
      preLocation: string | null;
      cargoOrderNo: string | null;
      businessTypeName: string | null;
      platformName: string | null;
      addressType: string | null;
      orderStatus: string | null;
      shipmentNo: string | null;
      poNo: string | null;
      shippingMark: string | null;
      platformWarehouseCode: string | null;
      cartonQty: number | null;
      weight: number | null;
      cbm: number | null;
      palletQty: number | null;
    };

    type InboundPlanGroup = {
      groupCode: string | null;
      totalCbm: number | null;
      totalCartonQty: number | null;
      totalWeight: number | null;
      itemCount: number;
      expectedPalletQty: number | null;
      items: InboundPlanItem[];
    };

    type InboundPlan = {
      id: CommonType.IdType;
      planNo: string;
      status: InboundPlanStatus;
      warehouseId: CommonType.IdType;
      containerOrderId: CommonType.IdType;
      containerOrderNo: string | null;
      channelName: string | null;
      customerName: string | null;
      eta: string | null;
      totalCbm: number | null;
      totalCartonQty: number | null;
      totalWeight: number | null;
      remark: string | null;
      createTime: string | null;
      updateTime: string | null;
      groups: InboundPlanGroup[];
    };

    type InboundPlanSearchParams = CommonType.RecordNullable<{
      warehouseId?: CommonType.IdType | null;
      containerOrderId?: CommonType.IdType | null;
      planNo?: string | null;
      status?: InboundPlanStatus | null;
    } & Api.Common.CommonSearchParams>;

    type InboundPlanList = Api.Common.PaginatingQueryRecord<InboundPlan>;

    type InboundPlanItemUpdateParams = {
      id: CommonType.IdType;
      groupCode?: string | null;
      preLocation?: string | null;
    };

    type InboundPlanItemPreview = {
      itemId: CommonType.IdType;
      cargoOrderNo: string;
      shipmentNo: string;
      currentGroupCode: string | null;
      proposedGroupCode: string | null;
      changed: boolean;
    };

    type InboundPlanSaveGroupParams = {
      itemId: CommonType.IdType;
      groupCode: string | null;
    };
  }
}
