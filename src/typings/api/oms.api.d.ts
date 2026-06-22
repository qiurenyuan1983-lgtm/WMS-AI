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
      /** 推荐 DW 时间区间，如 2026/06/28-2026/06/30 */
      recommendedDwTime?: string | null;
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
      /** 海柜操作状态：已提柜 / 已到仓 / 安排DOCK / 待上DOCK / 拆柜中 / 拆柜完成 */
      operationStatus?: string | null;
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
      transferOutboundWarehouseCode: string | null;
      orderSubType?: CargoOrderSubType | string | null;
      channelCode?: string | null;
      peerCustomerName?: string | null;
      carriageNo?: string | null;
      deliveryMode?: LoosePalletDeliveryMode | string | null;
      deliveryAppointmentTime?: string | null;
      loosePalletLabels?: LoosePalletLabelItem[] | null;
      palletLabelPrinted?: boolean | null;
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
      preLocation: string | null;
      actualInboundLocation: string | null;
      deliveryLfd: string | null;
      appointmentNo?: string | null;
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

    // ======================== 订单（新主线模块）========================

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

    type LoosePalletDeliveryMode = 'SELF_PICKUP' | 'DOOR_DELIVERY';

    type CargoOrderSubType = 'STANDARD' | 'LOOSE_PALLET';

    type LoosePalletLabelItem = {
      id?: CommonType.IdType | null;
      palletNo: string;
      cargoOrderNo?: string | null;
      groupCode?: string | null;
      carriageNo?: string | null;
      boxQty?: number | null;
      weightKg?: number | null;
      cbm?: number | null;
      items?: Array<{
        cargoOrderNo?: string;
        receiveQty?: number;
        receiveUnitLabel?: string;
        boxQty?: number;
      }>;
    };

    type LoosePalletOrderOperateParams = {
      peerCustomerName: string;
      carriageNo: string;
      declaredPalletQty: number;
      deliveryMode: LoosePalletDeliveryMode;
      deliveryAppointmentTime: string;
      groupCode?: string | null;
      platformWarehouseCode?: string | null;
      contactName?: string | null;
      contactPhone?: string | null;
      addressLine1?: string | null;
      city?: string | null;
      state?: string | null;
      zipCode?: string | null;
      remark?: string | null;
    };

    type NewCargoOrder = Common.CommonRecord<{
      id: CommonType.IdType;
      bizRootId?: CommonType.IdType | null;
      companyId?: CommonType.IdType | null;

      cargoOrderNo: string;
      externalOrderNo?: string | null;
      orderSource?: string | null;
      orderSubType?: CargoOrderSubType | string | null;
      channelCode?: string | null;
      peerCustomerName?: string | null;
      carriageNo?: string | null;
      deliveryMode?: LoosePalletDeliveryMode | string | null;
      deliveryAppointmentTime?: string | null;
      loosePalletLabels?: LoosePalletLabelItem[] | null;
      palletLabelPrinted?: boolean | null;

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
      /** 时效等级：T 第一等级 / K 第二等级 / NORMAL_SHIP 普船第三等级 */
      timelinessLevel?: string | null;
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
      appointmentNo?: string | null;
      followUpRemark?: string | null;
      remark?: string | null;

      parcelCarrierName?: string | null;
      parcelTrackingNo?: string | null;

      transferFlag?: number | null;
      transferWarehouseCode?: string | null;
      transferOutboundWarehouseCode?: string | null;

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
      /** 订单操作状态：已入库 / 已生成车次 / 已安排派送供应商 */
      operationStatus?: string | null;
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
      | 'externalOrderNo'
      | 'appointmentNo';

    type NewCargoOrderSearchParams = CommonType.RecordNullable<{
      keywordField?: CargoOrderKeywordField | null;
      keyword?: string | null;
      cargoOrderNo?: string | null;
      externalOrderNo?: string | null;
      appointmentNo?: string | null;
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
      carriageNo?: string | null;
      orderSubType?: CargoOrderSubType | string | null;
      fulfillmentStatus?: string | null;
      operationStatus?: string | null;
      billingStatus?: string | null;
      preOutboundStatus?: string | null;
      outboundOrderStatus?: string | null;
      podStatus?: string | null;
      exceptionFlag?: string | null;
      transferFlag?: string | null;
      transferOutboundWarehouseCode?: string | null;
      /** 同时匹配仓库代码与转仓代码 */
      warehouseOrTransferCode?: string | null;
      holdStatus?: string | null;
      timelinessLevel?: string | null;
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
      timelinessLevel?: string | null;
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
      transferOutboundWarehouseCode?: string | null;
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

    /** 海柜场景下关联订单表单（与订单详情字段对齐） */
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
      appointmentType?: string | null;
      deliveryCost?: number | null;
      supplierId?: CommonType.IdType | null;
      supplierQuoteId?: CommonType.IdType | null;
      supplierName?: string | null;
      recommendedSupplierId?: CommonType.IdType | null;
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
      supplierId?: CommonType.IdType | null;
      supplierName?: string | null;
      supplierQuoteId?: CommonType.IdType | null;
      deliveryCost?: number | null;
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
      /** 出库操作状态：已登记 / 出库中 / 出库完成 */
      operationStatus?: string | null;
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
      customerName?: string | null;
      destination?: string | null;
      appointmentNo?: string | null;
      platformName?: string | null;
      actualCartonQty?: number | null;
      actualPalletQty?: number | null;
      actualWeight?: number | null;
      actualCbm?: number | null;
    };

    type OutboundAvailableOrder = {
      id: CommonType.IdType;
      cargoOrderNo: string;
      customerName: string;
      destination: string;
      appointmentNo: string | null;
      platformName: string | null;
      transferWarehouseCode: string | null;
      deliveryFee: number | null;
      actualCartonQty: number;
      actualPalletQty: number;
    };

    type OutboundAvailableOrderList = Api.Common.PaginatingQueryRecord<OutboundAvailableOrder>;

    type AddOutboundCargoResult = {
      success: boolean;
      message: string;
      addedCount: number;
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
        operationStatus?: string | null;
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

    // ======================== 业务规则中心 ========================

    type BusinessRuleCategory =
      | 'ORDER'
      | 'INBOUND_DEVANNING'
      | 'LOCATION'
      | 'DISPATCH'
      | 'OUTBOUND'
      | 'EXCEPTION_ALERT'
      | 'FEE_BILL'
      | 'NOTIFY_TASK';

    type BusinessRuleStatus = 'enabled' | 'disabled' | 'draft';

    type BusinessRulePriorityTier = 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5';

    type BusinessRuleActionLevel = 'HINT' | 'WARN' | 'STRONG_WARN' | 'BLOCK' | 'AUTO';

    type BusinessRuleConflictStrategy =
      | 'FIRST_MATCH'
      | 'FIRST_BLOCK_WINS'
      | 'ALL_NON_BLOCK'
      | 'MANUAL_CONFIRM';

    type BusinessRuleCondition = {
      field: string;
      op: string;
      value?: string | number | Array<string | number> | null;
    };

    type BusinessRuleConditionConfig = {
      logic?: 'AND' | 'OR';
      conditions?: BusinessRuleCondition[];
    };

    type BusinessRuleAction = {
      level: BusinessRuleActionLevel;
      type: string;
      message?: string | null;
      notifyTargets?: string[] | null;
      /** 命中后跳转或展示的执行菜单页面（路由名） */
      execMenuPage?: string | null;
      params?: Record<string, unknown> | null;
    };

    type BusinessRule = {
      id: CommonType.IdType;
      ruleCode: string;
      ruleName: string;
      category: BusinessRuleCategory;
      warehouseIds: string | null;
      warehouseName: string | null;
      customerScope: string | null;
      bizTypeScope: string | null;
      triggerEvent: string | null;
      conditionConfig: string;
      actionsConfig: string;
      priorityTier: BusinessRulePriorityTier;
      priority: number;
      conflictStrategy: BusinessRuleConflictStrategy;
      effectiveStart: string | null;
      effectiveEnd: string | null;
      status: BusinessRuleStatus;
      version: number | null;
      approverName: string | null;
      creatorName: string | null;
      hitCount: number | null;
      hitSuccessRate: number | null;
      exceptionCount: number | null;
      remark: string | null;
      createTime: string | null;
      updateTime: string | null;
    };

    type BusinessRuleOperateParams = CommonType.RecordNullable<{
      id?: CommonType.IdType;
      ruleCode?: string | null;
      ruleName: string;
      category: BusinessRuleCategory;
      warehouseIds: string;
      warehouseNames?: string | null;
      customerScope?: string | null;
      bizTypeScope?: string | null;
      triggerEvent?: string | null;
      conditionConfig: string;
      actionsConfig: string;
      priorityTier?: BusinessRulePriorityTier | null;
      priority?: number | null;
      conflictStrategy?: BusinessRuleConflictStrategy | null;
      effectiveStart?: string | null;
      effectiveEnd?: string | null;
      status?: BusinessRuleStatus | null;
      version?: number | null;
      remark?: string | null;
    }>;

    type BusinessRuleSearchParams = CommonType.RecordNullable<
      {
        category?: BusinessRuleCategory | null;
        warehouseId?: CommonType.IdType | null;
        triggerEvent?: string | null;
        ruleName?: string | null;
        ruleCode?: string | null;
        status?: BusinessRuleStatus | null;
        priorityTier?: BusinessRulePriorityTier | null;
      } & Api.Common.CommonSearchParams
    >;

    type BusinessRuleList = Api.Common.PaginatingQueryRecord<BusinessRule>;

    type BusinessRuleTestDraft = {
      ruleName?: string | null;
      triggerEvent?: string | null;
      conditionConfig: string;
      actionsConfig: string;
      priority?: number | null;
      conflictStrategy?: BusinessRuleConflictStrategy | null;
    };

    type BusinessRuleTestParams = {
      ruleId?: CommonType.IdType | null;
      triggerEvent?: string | null;
      context?: Record<string, unknown> | null;
      /** 编辑态试算：使用当前表单配置，无需先保存 */
      draft?: BusinessRuleTestDraft | null;
    };

    type BusinessRuleTestResult = {
      matched: boolean;
      verified?: boolean;
      ruleId?: CommonType.IdType | null;
      ruleCode?: string | null;
      ruleName?: string | null;
      priorityTier?: BusinessRulePriorityTier | null;
      finalDecision?: BusinessRuleActionLevel | null;
      actions?: BusinessRuleAction[];
      message?: string | null;
      conditionDetails?: Array<{
        field: string;
        fieldValue?: unknown;
        op: string;
        expectedValue?: unknown;
        hit: boolean;
      }>;
      conflictNotes?: string[] | null;
    };

    // ======================== 审批流配置 ========================

    type ApprovalFlowCategory =
      | 'FEE'
      | 'SUPPLIER_BILL'
      | 'EXCEPTION_COMPENSATION'
      | 'OPERATION_ADJUSTMENT'
      | 'PERMISSION_CHANGE'
      | 'PRICE_MODIFY'
      | 'DATA_DELETE'
      | 'TEMP_AUTH';

    type ApprovalFlowStatus = 'enabled' | 'disabled' | 'draft';

    type ApprovalNodeType = 'ROLE' | 'USER' | 'DEPT_HEAD' | 'SUPERVISOR';

    type ApprovalMode = 'ANY' | 'ALL';

    type ApprovalFlowNode = {
      stepNo: number;
      nodeName: string;
      nodeType: ApprovalNodeType;
      approverIds?: string | null;
      approverNames: string;
      approveMode: ApprovalMode;
      timeoutHours?: number | null;
      autoPass?: boolean | null;
    };

    type ApprovalFlow = {
      id: CommonType.IdType;
      flowCode: string;
      flowName: string;
      category: ApprovalFlowCategory;
      warehouseIds?: string | null;
      warehouseName?: string | null;
      triggerDesc: string;
      triggerConfig?: string | null;
      nodesConfig: string;
      nodeSummary: string;
      version: number;
      status: ApprovalFlowStatus;
      remark?: string | null;
      creatorName?: string | null;
      updateByName?: string | null;
      createTime: string;
      updateTime: string;
    };

    type ApprovalFlowOperateParams = CommonType.RecordNullable<{
      id?: CommonType.IdType | null;
      flowCode?: string | null;
      flowName?: string | null;
      category?: ApprovalFlowCategory | null;
      warehouseIds?: string | null;
      warehouseName?: string | null;
      triggerDesc?: string | null;
      triggerConfig?: string | null;
      nodesConfig?: string | null;
      status?: ApprovalFlowStatus | null;
      remark?: string | null;
    }>;

    type ApprovalFlowSearchParams = CommonType.RecordNullable<
      Pick<Api.Common.PaginatingCommonParams, 'pageNum' | 'pageSize'> & {
        category?: ApprovalFlowCategory | null;
        flowName?: string | null;
        status?: ApprovalFlowStatus | null;
        warehouseId?: CommonType.IdType | null;
      }
    >;

    type ApprovalFlowList = Api.Common.PaginatingQueryRecord<ApprovalFlow>;

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
      outboundStatus?: string | null;
      deliveryMethod?: string | null;
      holdFlag?: string | null;
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
      containerNo: string | null;
      channelName: string | null;
      customerName: string | null;
      eta: string | null;
      totalCbm: number | null;
      totalCartonQty: number | null;
      totalWeight: number | null;
      remark: string | null;
      createTime: string | null;
      updateTime: string | null;
      /** 基础资料 */
      mblNo: string | null;
      containerStatusLabel: string | null;
      devanningFinishTime: string | null;
      expectedDevanningTime: string | null;
      warehouseName: string | null;
      orderLevel: string | null;
      devanningStatusLabel: string | null;
      queueNo: string | null;
      dockCode: string | null;
      driverPhone: string | null;
      cargoQty: number | null;
      cargoWeight: number | null;
      devanningRoundNo: number | null;
      attachmentCount: number | null;
      attachments: { name: string; type?: string | null }[] | null;
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
      platformName?: string | null;
      platformWarehouseCode?: string | null;
      addressType?: string | null;
      deliveryMethod?: string | null;
      holdFlag?: string | null;
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

    type PlatformAppointmentStatus = 'UNUSED' | 'USED' | 'DELIVERED' | 'CANCELLED';

    type PlatformAppointment = Common.CommonRecord<{
      id: CommonType.IdType;
      platformName: string;
      warehouseCode: string;
      appointmentNo: string;
      appointmentTime: string;
      appointmentType: string;
      status: PlatformAppointmentStatus;
      remark: string | null;
      tagCodes: string[];
      existingCargoCbm: number;
      outboundOrderNo: string | null;
      preOutboundNo: string | null;
    }>;

    type PlatformAppointmentTimeFilterField =
      | 'EXPECTED_ARRIVAL'
      | 'ETA'
      | 'PICKUP_APPOINTMENT'
      | 'AVAILABLE'
      | 'PICKUP'
      | 'ACTUAL_ARRIVAL';

    type PlatformAppointmentPreOutboundFilter = {
      timeField: PlatformAppointmentTimeFilterField;
      timeStart: number;
      timeEnd: number;
      includeInbounded: boolean;
    };

    type PlatformAppointmentInboundLine = {
      id: CommonType.IdType;
      cargoOrderNo: string;
      containerNo: string;
      palletNo: string;
      storageLocation: string;
      pieceQty: number;
      weight: number;
      cbm: number;
      readiness?: 'INBOUNDED' | 'PENDING';
    };

    type PlatformAppointmentCreateOutboundResult = {
      outboundOrderNo: string;
      appointment: PlatformAppointment;
    };

    type PlatformAppointmentCreatePreOutboundResult = {
      preOutboundNo: string;
      appointment: PlatformAppointment;
    };

    type PlatformAppointmentSearchParams = CommonType.RecordNullable<
      {
        keyword?: string | null;
        status?: PlatformAppointmentStatus | string | null;
        platformName?: string | null;
        warehouseCode?: string | null;
        appointmentType?: string | null;
      } & Api.Common.CommonSearchParams
    >;

    type PlatformAppointmentList = Api.Common.PaginatingQueryRecord<PlatformAppointment>;

    type PlatformAppointmentStatusCount = {
      total: number;
      UNUSED: number;
      USED: number;
      DELIVERED: number;
      CANCELLED: number;
    };

    type PlatformAppointmentOperateParams = {
      platformName: string;
      warehouseCode: string;
      appointmentNo?: string | null;
      appointmentTime: string;
      appointmentType: string;
      remark?: string | null;
      tagCodes?: string[];
      existingCargoCbm?: number | null;
    };

    // ─── 订单工作台 ─────────────────────────────────────────

    type OrderWorkbenchPool = 'PLATFORM' | 'LTL' | 'LOCAL' | 'EXPRESS';
    type OrderWorkbenchStatus =
      | 'PENDING_APPT'
      | 'PRE_TRIP'
      | 'PENDING_MANUAL'
      | 'PENDING_CARGO'
      | 'PENDING_CUSTOMER'
      | 'GENERATED'
      | 'ABNORMAL';

    type OrderWorkbenchRow = {
      id: CommonType.IdType;
      orderNo: string;
      pool: OrderWorkbenchPool;
      orderTypeLabel: string;
      customerName: string;
      platform: string | null;
      destination: string;
      isaNo: string | null;
      dwTime: string | null;
      appointmentTime: string | null;
      appointmentType: string | null;
      palletQty: number;
      cartonQty: number;
      weightLbs: number | null;
      weightKg: number | null;
      volumeCbm: number | null;
      palletSize: string | null;
      operationStatus?: string | null;
      timelinessLevel?: string | null;
      status: OrderWorkbenchStatus;
      preTripNo: string | null;
      generatedTripNo?: string | null;
      dockNo: string | null;
      supplierName: string | null;
      customerConfirmed: boolean;
      cargoCount: number;
      workflowStep: number;
      createTime: string;
      remark: string | null;
    };

    type OrderWorkbenchCargoItem = {
      id: CommonType.IdType;
      palletNo: string;
      cargoName: string;
      cartonQty: number;
      palletQty: number;
      weightLbs: number;
      volumeCbm: number;
      locationCode: string;
      status: string;
    };

    type OrderWorkbenchLog = {
      id: CommonType.IdType;
      time: string;
      operator: string;
      action: string;
      status: string;
    };

    type LtlSupplierCandidate = {
      supplierId: number;
      supplierName: string;
      orderPortalUrl: string | null;
      recommendTag: string | null;
      serviceRating: number;
      onTimeRate: number;
      quoteAmount: number;
      leadTimeDays: number;
      serviceArea: string;
      liftgateFee: number;
      insuranceFee: number;
      totalAmount: number;
      hasApi: boolean;
      exceptionRate: number;
      matchScore: number;
      matchReason: string;
      recommended: boolean;
    };

    type LtlCostBreakdown = {
      linehaul: number;
      liftgate: number;
      insurance: number;
      other: number;
      total: number;
    };

    type LtlConsigneeInfo = {
      companyName: string;
      address: string;
      contactName: string;
      contactPhone: string;
      addressType: string;
      needAppointment: boolean;
      needLiftgate: boolean;
      residential: boolean;
      limitedAccess: boolean;
      receivingHours: string;
    };

    type LtlOrderExtension = {
      originWarehouse: string | null;
      orderSource: string | null;
      orderSourceLabel: string | null;
      cargoType: string | null;
      urgency: string | null;
      zipCode: string | null;
      consignee: LtlConsigneeInfo | null;
      supplierCandidates: LtlSupplierCandidate[];
      selectedSupplierId: number | null;
      costBreakdown: LtlCostBreakdown | null;
      orderMethod: 'API' | 'RPA' | 'MANUAL' | null;
      supplierOrderPlaced: boolean;
      bolNo: string | null;
      pickupTime: string | null;
      estimatedDelivery: string | null;
      supplierOrderMessage: string | null;
    };

    type LocalEmailRecord = {
      id: number;
      subject: string;
      recipient: string;
      sentTime: string | null;
      status: string;
    };

    type LocalPreTripInfo = {
      preTripNo: string;
      vehicleType: string;
      palletQty: number;
      weightLbs: number;
      volumeCbm: number;
      dockNo: string;
      estDepartTime: string | null;
      estArrivalTime: string | null;
    };

    type LocalOrderExtension = {
      outboundMethod: string;
      specialRequirements: string | null;
      deliveryAddress: string;
      deliveryContact: string;
      deliveryPhone: string;
      needAppointment: boolean;
      customerConfirmSummary: string | null;
      customerConfirmTime: string | null;
      emailRecords: LocalEmailRecord[];
      preTrip: LocalPreTripInfo | null;
    };

    type OrderWorkbenchDetail = OrderWorkbenchRow & {
      contactName: string | null;
      contactPhone: string | null;
      warehouseAddress: string | null;
      loadingMethod: string | null;
      vehicleType: string | null;
      driverName: string | null;
      plateNo: string | null;
      supplierQuote: string | null;
      supplierProNo: string | null;
      emailSentTime: string | null;
      emailConfirmTime: string | null;
      cargoItems: OrderWorkbenchCargoItem[];
      logs: OrderWorkbenchLog[];
      ltl?: LtlOrderExtension | null;
      local?: LocalOrderExtension | null;
    };

    type OrderWorkbenchStats = {
      pendingGenerate: number;
      preTrip: number;
      pendingManual: number;
      pendingCustomer: number;
      generated: number;
      abnormal: number;
      poolCounts: Record<string, number>;
      tabCounts: Record<string, number>;
    };

    type OrderWorkbenchSearchParams = CommonType.RecordNullable<
      Api.Common.CommonSearchParams & {
        pool?: string | null;
        tab?: string | null;
        status?: string | null;
        orderType?: string | null;
        customerName?: string | null;
        platform?: string | null;
        destination?: string | null;
        orderNo?: string | null;
        isaNo?: string | null;
        dwTime?: string | null;
      }
    >;

    type OrderWorkbenchList = Api.Common.PaginatingQueryRecord<OrderWorkbenchRow>;
    type LtlGenerateTripPreview = {
      tripNo: string;
      orderNo: string;
      supplierName: string;
      palletQty: number;
    };

    type OrderWorkbenchActionResult = {
      success: boolean;
      message: string;
      row?: OrderWorkbenchRow;
      portalUrl?: string | null;
      tripOrderPreview?: LtlGenerateTripPreview | null;
    };
    type OrderWorkbenchBatchResult = { success: boolean; message: string; count: number };

    type OrderWorkbenchBatchGenerateTripPreview = {
      tripNo: string;
      pool: OrderWorkbenchPool;
      orderNos: string[];
      totalPalletQty: number;
      totalCartonQty: number;
      destination: string;
      supplierName?: string | null;
      platform?: string | null;
    };

    type OrderWorkbenchBatchGenerateTripParams = {
      supplierId?: CommonType.IdType | null;
      supplierQuoteId?: CommonType.IdType | null;
      deliveryCost?: number | null;
      appointmentId?: number | null;
      appointmentNo?: string | null;
      loadingType?: 'PALLET' | 'FLOOR' | null;
      pickupTime?: string | null;
      appointmentTime?: string | null;
    };

    type OrderWorkbenchBatchGenerateTripResult = {
      success: boolean;
      message: string;
      tripNo?: string | null;
      orderNos?: string[];
      count?: number;
      totalPalletQty?: number;
      pool?: OrderWorkbenchPool | null;
    };

    // ─── 供应商管理 ─────────────────────────────────────────

    type SupplierType = 'DRAYAGE' | 'LINEHAUL' | 'LTL' | 'DEVANNING_LOADING';
    type SupplierStatus = 'ENABLED' | 'DISABLED';
    type SupplierBillStatus = 'DRAFT' | 'SUPPLIER_CONFIRMED' | 'PENDING_AUDIT' | 'WAREHOUSE_CONFIRMED' | 'FINANCE_APPROVED' | 'PAID' | 'REJECTED';

    type Supplier = {
      id: CommonType.IdType;
      supplierCode: string;
      supplierName: string;
      supplierType: SupplierType;
      contactName: string | null;
      contactPhone: string | null;
      contactEmail: string | null;
      serviceRegion: string | null;
      serviceTerminals: string | null;
      scacCode: string | null;
      dotNo: string | null;
      mcNo: string | null;
      insuranceInfo: string | null;
      contractExpireDate: string | null;
      paymentTerms: string | null;
      status: SupplierStatus;
      score: number | null;
      warehouseNames: string | null;
      orderPortalUrl?: string | null;
      remark: string | null;
      createTime: string | null;
    };

    type SupplierList = CommonType.PaginatingData<Supplier>;

    type SupplierSearchParams = CommonType.RecordNullable<{
      keyword?: string | null;
      supplierType?: SupplierType | string | null;
      status?: SupplierStatus | string | null;
    } & Api.Common.CommonSearchParams>;

    type SupplierQuote = {
      id: CommonType.IdType;
      supplierId: CommonType.IdType;
      supplierName: string;
      supplierType: SupplierType;
      feeType: string;
      feeTypeLabel: string;
      terminalCode: string | null;
      warehouseName: string | null;
      containerType: string | null;
      destination: string | null;
      unitPrice: number;
      currency: string;
      effectiveFrom: string;
      effectiveTo: string | null;
      status: string;
      versionNo: string;
      remark: string | null;
    };

    type SupplierQuoteList = CommonType.PaginatingData<SupplierQuote>;

    type SupplierQuoteSearchParams = CommonType.RecordNullable<{
      keyword?: string | null;
      supplierType?: SupplierType | string | null;
      supplierId?: CommonType.IdType | null;
      status?: string | null;
    } & Api.Common.CommonSearchParams>;

    type SupplierQuoteRecommendParams = CommonType.RecordNullable<{
      destination?: string | null;
      warehouseName?: string | null;
      transportType?: string | null;
      loadingType?: string | null;
    }>;

    type SupplierQuoteRecommendCandidate = {
      supplierId: CommonType.IdType;
      supplierName: string;
      quoteId: CommonType.IdType;
      feeTypeLabel: string;
      unitPrice: number;
      currency: string;
      matchReason: string;
      recommended: boolean;
    };

    type SupplierQuoteRecommendResult = {
      recommendedSupplierId: CommonType.IdType | null;
      recommendedQuoteId: CommonType.IdType | null;
      recommendedSupplierName: string | null;
      unitPrice: number | null;
      currency: string | null;
      matchReason: string | null;
      candidates: SupplierQuoteRecommendCandidate[];
    };

    type SupplierAccount = {
      id: CommonType.IdType;
      supplierId: CommonType.IdType;
      supplierName: string;
      loginName: string;
      contactName: string | null;
      contactPhone: string | null;
      roleCodes: string;
      status: SupplierStatus;
      lastLoginTime: string | null;
      createTime: string | null;
    };

    type SupplierAccountList = CommonType.PaginatingData<SupplierAccount>;

    type SupplierAccountSearchParams = CommonType.RecordNullable<{
      keyword?: string | null;
      supplierId?: CommonType.IdType | null;
      status?: SupplierStatus | string | null;
    } & Api.Common.CommonSearchParams>;

    type SupplierContainerFeeAuditStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

    type SupplierContainerFeeBundle = {
      pickupFee: number | null;
      detentionFee: number | null;
      chassisFee: number | null;
      portFee: number | null;
      exceptionFee: number | null;
      emptyReturnFee: number | null;
      otherFee: number | null;
      feeRemark: string | null;
      feeTotal: number | null;
      auditStatus: SupplierContainerFeeAuditStatus;
      auditRemark: string | null;
      auditTime: string | null;
      auditorName: string | null;
      submitTime: string | null;
      submitterName: string | null;
    };

    type SupplierContainerOpRow = ContainerOrder & {
      feeAuditStatus?: SupplierContainerFeeAuditStatus | string | null;
      feeTotal?: number | null;
      lastSupplierSyncTime?: string | null;
    };

    type SupplierContainerOpDetail = ContainerOrder & {
      supplierFee: SupplierContainerFeeBundle;
    };

    type SupplierContainerOpList = CommonType.PaginatingData<SupplierContainerOpRow>;

    type SupplierContainerOpSearchParams = CommonType.RecordNullable<{
      keyword?: string | null;
      containerNo?: string | null;
      drayageVendorId?: CommonType.IdType | null;
      containerStatus?: string | null;
      feeAuditStatus?: SupplierContainerFeeAuditStatus | string | null;
    } & Api.Common.CommonSearchParams>;

    type SupplierContainerOpSyncParams = CommonType.RecordNullable<
      Pick<
        ContainerOrder,
        | 'id'
        | 'containerNo'
        | 'containerType'
        | 'sealNo'
        | 'vesselName'
        | 'voyageNo'
        | 'mblNo'
        | 'hblNo'
        | 'terminalName'
        | 'eta'
        | 'ata'
        | 'pickupLfd'
        | 'emptyReturnLfd'
        | 'terminalReleaseStatus'
        | 'remark'
        | 'pickupAppointmentNo'
        | 'pickupAppointmentTime'
        | 'actualPickupTime'
        | 'pickupRemark'
        | 'expectedArrivalTime'
        | 'requiredArrivalTime'
        | 'actualArrivalTime'
        | 'containerLocation'
        | 'arrivalRemark'
        | 'expectedDevanningTime'
        | 'devanningAppointmentTime'
        | 'devanningStartTime'
        | 'devanningFinishTime'
        | 'devanningMethod'
        | 'loadingType'
        | 'devanningRemark'
        | 'emptyReturnLocation'
        | 'emptyReturnAppointmentNo'
        | 'emptyReturnTime'
        | 'emptyReturnStatus'
        | 'emptyReturnRemark'
      > & {
        syncRemark?: string | null;
      }
    >;

    type SupplierContainerFeeSaveParams = CommonType.RecordNullable<{
      containerOrderId?: CommonType.IdType | null;
      id?: CommonType.IdType | null;
      pickupFee?: number | null;
      detentionFee?: number | null;
      chassisFee?: number | null;
      portFee?: number | null;
      exceptionFee?: number | null;
      emptyReturnFee?: number | null;
      otherFee?: number | null;
      feeRemark?: string | null;
      submitterName?: string | null;
    }>;

    type SupplierContainerFeeAuditParams = {
      containerOrderId?: CommonType.IdType | null;
      id?: CommonType.IdType | null;
      auditStatus: 'APPROVED' | 'REJECTED';
      auditRemark?: string | null;
      auditorName?: string | null;
    };

    type SupplierBill = {
      id: CommonType.IdType;
      billNo: string;
      supplierId: CommonType.IdType;
      supplierName: string;
      supplierType: SupplierType;
      sourceTaskNo: string | null;
      sourceRefNo: string | null;
      billAmount: number;
      currency: string;
      billStatus: SupplierBillStatus;
      submitTime: string | null;
      auditTime: string | null;
      remark: string | null;
    };

    type SupplierBillList = CommonType.PaginatingData<SupplierBill>;

    type SupplierBillSearchParams = CommonType.RecordNullable<{
      keyword?: string | null;
      supplierType?: SupplierType | string | null;
      billStatus?: SupplierBillStatus | string | null;
    } & Api.Common.CommonSearchParams>;

    type SupplierVehicle = {
      id: CommonType.IdType;
      supplierId: CommonType.IdType;
      supplierName: string;
      plateNo: string;
      vehicleType: string;
      vehicleSize: string | null;
      maxWeightLbs: number | null;
      insuranceExpireDate: string | null;
      driverName: string | null;
      gpsDeviceNo: string | null;
      vehicleStatus: string;
      annualInspectionDate: string | null;
    };

    type SupplierVehicleList = CommonType.PaginatingData<SupplierVehicle>;

    type SupplierDriver = {
      id: CommonType.IdType;
      supplierId: CommonType.IdType;
      supplierName: string;
      driverName: string;
      driverPhone: string | null;
      licenseNo: string | null;
      boundPlateNo: string | null;
      status: string;
      gpsOnline: number;
    };

    type SupplierDriverList = CommonType.PaginatingData<SupplierDriver>;

    type SupplierEquipment = {
      id: CommonType.IdType;
      supplierId: CommonType.IdType;
      supplierName: string;
      equipmentType: string;
      equipmentNo: string;
      assigneeName: string | null;
      assignTime: string | null;
      returnTime: string | null;
      relatedTaskNo: string | null;
      equipmentStatus: string;
      damageFlag: number;
      remark: string | null;
    };

    type SupplierEquipmentList = CommonType.PaginatingData<SupplierEquipment>;

    type SupplierFleetSearchParams = CommonType.RecordNullable<{
      keyword?: string | null;
      supplierId?: CommonType.IdType | null;
      equipmentType?: string | null;
    } & Api.Common.CommonSearchParams>;

    type SupplierKpiRow = {
      id: CommonType.IdType;
      supplierId: CommonType.IdType;
      supplierName: string;
      supplierType: SupplierType;
      statMonth: string;
      warehouseName: string | null;
      onTimePickupRate?: number | null;
      onTimeReturnRate?: number | null;
      gpsOnlineRate?: number | null;
      onTimeArrivalRate?: number | null;
      onTimeDeliveryRate?: number | null;
      podUploadRate?: number | null;
      checkInPassRate?: number | null;
      rejectRate?: number | null;
      onTimeFinishRate?: number | null;
      devanningEfficiency?: number | null;
      loadingEfficiency?: number | null;
      siteExceptionRate?: number | null;
      equipmentDamageRate?: number | null;
      reworkRate?: number | null;
      exceptionRate?: number | null;
      billAccuracyRate?: number | null;
      score: number | null;
    };

    type SupplierKpiList = CommonType.PaginatingData<SupplierKpiRow>;

    type SupplierKpiSearchParams = CommonType.RecordNullable<{
      keyword?: string | null;
      supplierType?: SupplierType | string | null;
      statMonth?: string | null;
    } & Api.Common.CommonSearchParams>;

    type SupplierKpiSummary = {
      totalSuppliers: number;
      drayageCount: number;
      linehaulCount: number;
      devanningLoadingCount: number;
      pendingBills: number;
      avgScore: number;
    };

    // ======================== 库区规则（入库配置规则） ========================

    type ZoneRuleDeliveryMethod = 'PRIVATE_WH' | 'TRUCK' | 'DROPSHIP' | 'HOLD_TRANSFER' | 'ANY';

    type ZoneRulePlatform = 'ANY' | 'AMAZON' | 'WALMART' | 'TARGET';

    type ZoneRuleTargetType = 'ZONE' | 'LOCATION' | 'ZONE_TYPE' | 'STORAGE_METHOD';

    type ZoneRuleConditionLogic = 'AND' | 'OR';

    type ZoneRuleCondition = {
      priority: number;
      deliveryMethod: string;
      platform?: string | null;
      platformCode?: string | null;
    };

    type ZoneRule = {
      id: CommonType.IdType;
      warehouseId?: CommonType.IdType | null;
      warehouseName?: string | null;
      targetType?: ZoneRuleTargetType | null;
      conditionLogic?: ZoneRuleConditionLogic | null;
      conditions?: ZoneRuleCondition[] | null;
      zoneNames: string;
      locationNos: string;
      zoneType?: string | null;
      storageMethod?: string | null;
      priority: number;
      deliveryMethod: ZoneRuleDeliveryMethod | string;
      platform: ZoneRulePlatform | string;
      platformCode?: string | null;
      remark?: string | null;
      createTime?: string | null;
      updateTime?: string | null;
    };

    type ZoneRuleList = Api.Common.PaginatingQueryRecord<ZoneRule>;

    type ZoneRuleSearchParams = CommonType.RecordNullable<
      {
        zoneName?: string | null;
        locationNo?: string | null;
        zoneType?: string | null;
        storageMethod?: string | null;
        deliveryMethod?: string | null;
        platform?: string | null;
        platformCode?: string | null;
      } & Api.Common.CommonSearchParams
    >;

    type ZoneRuleOperateParams = {
      targetType: ZoneRuleTargetType;
      conditionLogic: ZoneRuleConditionLogic;
      conditions: ZoneRuleCondition[];
      zoneNames: string;
      locationNos: string;
      zoneType?: string | null;
      storageMethod?: string | null;
      priority: number;
      deliveryMethod: string;
      platform: string;
      platformCode?: string | null;
      remark?: string | null;
    };

    type ZoneRuleFallbackParams = {
      zoneNames: string;
      locationNos: string;
      remark?: string | null;
    };

    // ======================== 平台仓库管理 ========================

    type PlatformEntity = Common.CommonRecord<{
      platformName: string;
      platformCode: string;
      status: string;
      warehouseCount: number;
      remark?: string | null;
    }>;

    type PlatformWarehouse = Common.CommonRecord<{
      platformId: CommonType.IdType;
      platformCode: string;
      warehouseCode: string;
      warehouseName: string;
      countryCode: string;
      countryName: string;
      address: string;
      zipCode: string;
      cbmPerPallet: number;
      status: string;
    }>;

    type PlatformList = { rows: PlatformEntity[]; total: number };

    type PlatformWarehouseList = Api.Common.PaginatingQueryRecord<PlatformWarehouse>;

    type PlatformSearchParams = CommonType.RecordNullable<{
      keyword?: string | null;
      status?: string | null;
    }>;

    type PlatformWarehouseSearchParams = CommonType.RecordNullable<
      Pick<PlatformWarehouse, 'platformId' | 'status' | 'countryCode'> & {
        keyword?: string | null;
        pageNum?: number;
        pageSize?: number;
      }
    >;

    type PlatformOperateParams = CommonType.RecordNullable<
      Pick<PlatformEntity, 'platformName' | 'platformCode' | 'status' | 'remark'>
    >;

    type PlatformWarehouseOperateParams = CommonType.RecordNullable<
      Pick<
        PlatformWarehouse,
        | 'platformId'
        | 'warehouseCode'
        | 'warehouseName'
        | 'countryCode'
        | 'countryName'
        | 'address'
        | 'zipCode'
        | 'cbmPerPallet'
        | 'status'
      >
    >;

    // ======================== 自动车次推荐 ========================

    type TripRecommendAppointmentType = 'FLOOR' | 'PALLET';
    type TripRecommendSummaryAppointmentType = TripRecommendAppointmentType | 'MIXED';

    type TripRecommendStats = {
      operableOrderCount: number;
      operablePalletQty: number;
      operableCbm: number;
      operableWeightKg: number;
      matchableTripCount: number;
      floorGenerable: number;
      palletGenerable: number;
      generatedTripCount: number;
      inoperableOrderCount: number;
    };

    type TripRecommendSummaryRow = {
      id: string;
      platform: string;
      destination: string;
      appointmentNo: string;
      appointmentType: TripRecommendSummaryAppointmentType;
      appointmentTime: string;
      operableOrderCount: number;
      totalPalletQty: number;
      totalCartonQty: number;
      totalCbm: number;
      totalWeightKg: number;
      matchableTripCount: number;
      recommendRule: string;
      recommendStatus: 'READY' | 'PARTIAL' | 'BLOCKED' | 'GENERATED';
      recommendStatusLabel: string;
      tripGenerated: boolean;
      generatedTripNo?: string | null;
    };

    type TripRecommendOrderLine = {
      id: number;
      orderNo: string;
      customerOrderNo?: string | null;
      customerName: string;
      platform: string;
      destination: string;
      appointmentNo: string;
      appointmentType: TripRecommendAppointmentType;
      appointmentTime: string;
      containerNo?: string | null;
      palletQty: number;
      cartonQty: number;
      cbm: number;
      weightKg: number;
      inventoryStatus: string;
      cargoStatus: string;
      feeStatus: string;
      holdFlag: boolean;
      exceptionFlag: boolean;
      inventoryLocked: boolean;
      tripGenerated: boolean;
      operationStatus: string;
      warehouseName?: string | null;
      palletNo?: string | null;
      sku?: string | null;
      fbaShipmentId?: string | null;
      referenceId?: string | null;
      poNumber?: string | null;
    };

    type TripRecommendLoadPreview = {
      selectedOrderCount: number;
      selectedPalletQty: number;
      selectedCartonQty: number;
      selectedCbm: number;
      targetCbm: number;
      selectedWeightKg: number;
      maxWeightKg: number;
      loadRate: number;
      weightUsageRate: number;
      ruleStatus: 'OK' | 'UNDER' | 'OVER_CBM' | 'OVER_WEIGHT' | 'EMPTY';
      ruleStatusLabel: string;
    };

    type TripRecommendGroupContext = {
      platform: string;
      destination: string;
      appointmentNo: string;
      appointmentType: TripRecommendSummaryAppointmentType;
      appointmentTime: string;
      recommendRule: string;
    };

    type TripRecommendSearchParams = CommonType.RecordNullable<{
      keyword?: string | null;
      platform?: string | null;
      destination?: string | null;
      appointmentNo?: string | null;
      appointmentType?: TripRecommendAppointmentType | null;
      customerName?: string | null;
      warehouseName?: string | null;
      inventoryStatus?: string | null;
      cargoStatus?: string | null;
      holdFlag?: string | null;
      exceptionFlag?: string | null;
      tripGenerated?: string | null;
      appointmentTimeStart?: string | null;
      appointmentTimeEnd?: string | null;
      showGenerated?: boolean | string | null;
      groupId?: string | null;
      pageNum?: number;
      pageSize?: number;
    }>;

    type TripRecommendSummaryList = Api.Common.PaginatingQueryRecord<TripRecommendSummaryRow>;

    type TripRecommendOrdersResult = {
      rows: TripRecommendOrderLine[];
      defaultSelectedIds: number[];
      groupContext?: TripRecommendGroupContext | null;
      loadPreview?: TripRecommendLoadPreview | null;
    };

    type TripRecommendGenerateParams = {
      groupId: string;
      orderIds: number[];
    };

    type TripRecommendGenerateResult = {
      success: boolean;
      message: string;
      tripNo?: string;
      orderCount?: number;
      loadPreview?: TripRecommendLoadPreview | null;
    };
  }
}
