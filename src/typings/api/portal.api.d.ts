declare namespace Api {
  namespace Portal {
    type AssignedContact = {
      id: string;
      role: '客服' | '调度';
      name: string;
      phone: string;
      email: string;
      online: boolean;
      title: string;
    };

    type CommCategory =
      | 'ORDER'
      | 'FEE'
      | 'FILE'
      | 'DELIVERY_TIME'
      | 'EXCEPTION_REPLY'
      | 'SYSTEM';

    type CommInitiateType =
      | 'ORDER_INQUIRY'
      | 'APPOINTMENT_INQUIRY'
      | 'FEE_INQUIRY'
      | 'FILE_SUPPLEMENT'
      | 'DELIVERY_TIME_CONFIRM'
      | 'OTHER';

    type PortalConversation = {
      id: string;
      category: CommCategory;
      title: string;
      contactId: string;
      contactName: string;
      contactRole: '客服' | '调度';
      orderNo: string | null;
      customerOrderNo: string | null;
      lastMessage: string;
      lastTime: string;
      unreadCount: number;
    };

    type PortalMessage = {
      id: string;
      conversationId: string;
      senderName: string;
      senderRole: string;
      isSelf: boolean;
      content: string;
      time: string;
      type: 'text' | 'image' | 'file' | 'system';
    };

    type PortalBizContext = {
      conversationId: string;
      orderNo: string | null;
      orderFields: Array<{ label: string; value: string }>;
      feeFields: Array<{ label: string; value: string }>;
      fileFields: Array<{ label: string; value: string }>;
      exceptionFields: Array<{ label: string; value: string }>;
    };

    type PortalOrderChannel =
      | 'AMAZON'
      | 'COMMERCIAL_PLATFORM'
      | 'PRIVATE_ADDRESS'
      | 'DROPSHIP'
      | 'TRANSFER';

    type MoneyValue = {
      amount: number;
      currency: string;
      display: string;
    };

    type WarehouseOption = {
      id: number;
      code: string;
      name: string;
      timezone: string;
      defaultCurrency: string;
    };

    type PortalCargoPalletLine = {
      palletNo: string;
      locationCode: string;
      palletQty: number;
    };

    type PortalOrderOption = {
      id: number;
      orderNo: string;
      customerOrderNo: string;
      destination: string;
      status: string;
      orderChannel: PortalOrderChannel;
      containerNo?: string | null;
      warehouseId?: number | null;
      warehouseCode?: string | null;
      locationSummary?: string | null;
      palletLines?: PortalCargoPalletLine[];
      /** 时效等级：T / K / NORMAL_SHIP */
      timelinessLevel?: string | null;
      /** 列表展示：FBA Shipment ID / SKU 汇总 */
      fbaSku?: string | null;
    };

    type PortalOrderOperationLog = {
      time: string;
      operator: string;
      action: string;
      remark?: string | null;
    };

    type PortalOrderDetail = PortalOrderOption & {
      contactName?: string | null;
      contactPhone?: string | null;
      remark?: string | null;
      operationLogs?: PortalOrderOperationLog[];
    };

    type DashboardOverview = {
      warehouseId: number;
      currency: string;
      order: {
        todayTotal: number;
        pending: number;
        shipped: number;
        completed: number;
        exception: number;
        todayStatus: Array<{ label: string; count: number }>;
      };
      inventory: {
        skuTotal: number;
        totalQty: number;
        availableQty: number;
        reservedQty: number;
        outOfStockSku: number;
        stats: { skuTotal: number; onHandQty: number; availableQty: number; lockedQty: number; damagedQty: number };
        lowStockAlerts: Array<{ sku: string; productName: string; currentQty: number; safetyQty: number }>;
      };
      inTransit: {
        expectedArrivalQty: number;
        containerInTransit: number;
        pendingDevanning: number;
        pendingPutaway: number;
        mapItems: Array<{
          id: number;
          refNo: string;
          route: string;
          gpsStatus: string;
          eta: string | null;
          statusLabel: string;
        }>;
      };
      finance: {
        monthlyStorage: MoneyValue;
        monthlyOperation: MoneyValue;
        pendingPayment: MoneyValue;
        accountBalance: MoneyValue;
        monthTotal: MoneyValue;
        feeBreakdown: Array<{ label: string; amount: MoneyValue }>;
      };
      asn: {
        statusRows: Array<{ status: string; label: string; count: number }>;
        recentAsn: string[];
      };
      shipment: {
        statusRows: Array<{ status: string; label: string; count: number }>;
        recentRows: Array<{ shipmentNo: string; tracking: string; carrier: string; shipTime: string }>;
      };
      notifications: Array<{ id: number; type: string; title: string; content: string; time: string }>;
      kpi: {
        onTimeRate: number;
        inventoryAccuracy: number;
        inboundHours: number;
        outboundHours: number;
        exceptionHours: number;
      };
      orderTrend: Array<{ date: string; orderCount: number }>;
    };

    type PortalContainerSummary = {
      id: number;
      containerNo: string;
      warehouseId: number;
      warehouseCode: string;
      loadingType: string;
      cargoCount: number;
      channelBreakdown: Array<{ channel: PortalOrderChannel; count: number }>;
      status: string;
      eta: string | null;
    };

    type PortalContainerCargoLine = {
      orderNo: string;
      customerOrderNo: string;
      orderChannel: PortalOrderChannel;
      destination: string;
      palletQty: number;
      locationSummary: string;
      status: string;
    };

    type PortalContainerDetail = PortalContainerSummary & {
      cargoLines: PortalContainerCargoLine[];
    };

    type PortalTransferInstruction = {
      id: number;
      instructionNo: string;
      orderNo: string;
      customerOrderNo: string;
      operationType: string;
      operationTypeLabel: string;
      status: string;
      statusLabel: string;
      submitTime: string;
      remark: string | null;
      attachmentCount: number;
      progressSteps: Array<{ title: string; time: string; status: 'done' | 'current' | 'pending' }>;
    };

    type SubmitTransferInstructionPayload = {
      orderNo: string;
      operationType: string;
      remark?: string;
      attachmentNames?: string[];
    };

    type SubmitTransferInstructionResult = {
      success: boolean;
      message: string;
      instructionNo?: string;
    };

    type AlertConfig = {
      emailEnabled: boolean;
      wechatEnabled: boolean;
      systemMessageEnabled: boolean;
      safetyStockEnabled: boolean;
      defaultCurrency: string;
      displayCurrency: string;
    };

    type PortalFeeConfirmStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';

    type PortalFeeConfirmItem = {
      id: number;
      feeNo: string;
      feeType: string;
      feeTypeLabel: string;
      orderNo: string | null;
      containerNo: string | null;
      warehouseCode: string;
      period: string;
      amount: MoneyValue;
      status: PortalFeeConfirmStatus;
      statusLabel: string;
      submitTime: string;
      remark: string | null;
    };

    type PortalFeeConfirmDetail = PortalFeeConfirmItem & {
      lines: Array<{ label: string; value: string }>;
      breakdown: Array<{ item: string; qty: string; unitPrice: string; amount: MoneyValue }>;
    };

    type PortalBillStatus = 'PENDING_PAY' | 'PAID' | 'OVERDUE';

    type PortalBill = {
      id: number;
      billNo: string;
      billMonth: string;
      warehouseCode: string;
      status: PortalBillStatus;
      statusLabel: string;
      totalAmount: MoneyValue;
      paidAmount: MoneyValue;
      dueDate: string;
      issueDate: string;
    };

    type PortalBillDetail = PortalBill & {
      feeBreakdown: Array<{ label: string; amount: MoneyValue }>;
      paymentHistory: Array<{ time: string; amount: string; method: string }>;
    };

    type PortalFileType = 'POD' | 'INVOICE' | 'LABEL' | 'BOL' | 'EXCEPTION' | 'OTHER';

    type PortalFile = {
      id: number;
      fileName: string;
      fileType: PortalFileType;
      fileTypeLabel: string;
      orderNo: string | null;
      containerNo: string | null;
      exceptionNo: string | null;
      uploadBy: string;
      uploadTime: string;
      fileSize: string;
      source: 'SYSTEM' | 'CUSTOMER';
    };

    type UploadPortalFilePayload = {
      fileName: string;
      fileType?: PortalFileType;
      orderNo?: string;
      containerNo?: string;
      exceptionNo?: string;
      fileSize?: string;
    };

    type PortalInventorySku = {
      sku: string;
      productName: string;
      warehouseCode: string;
      onHandQty: number;
      availableQty: number;
      reservedQty: number;
      safetyQty: number;
      locationSummary: string;
      lowStock: boolean;
    };

    type PortalAsnRow = {
      id: number;
      asnNo: string;
      warehouseCode: string;
      containerNo: string | null;
      status: string;
      statusLabel: string;
      expectedQty: number;
      arrivedTime: string | null;
      createTime: string;
    };

    type PortalShipmentRow = {
      id: number;
      shipmentNo: string;
      orderNo: string;
      warehouseCode: string;
      status: string;
      statusLabel: string;
      carrier: string;
      tracking: string | null;
      shipTime: string | null;
    };

    type PortalInTransitDetail = {
      id: number;
      refNo: string;
      refType: 'TRUCK' | 'CONTAINER';
      route: string;
      gpsStatus: string;
      gpsStatusLabel: string;
      eta: string | null;
      statusLabel: string;
      relatedOrders: string[];
      lastLocation: string;
      driverName?: string | null;
    };

    type PortalTransferAttachment = {
      id: number;
      fileName: string;
      fileSize: string;
      uploadTime: string;
    };

    type PortalTransferInstructionDetail = PortalTransferInstruction & {
      attachments: PortalTransferAttachment[];
    };

    type PortalOrderList = Common.PaginatingQueryRecord<PortalOrderOption>;

    type CreateConversationPayload = {
      commType: CommInitiateType;
      orderId: number;
      contactId: string;
      initialMessage?: string;
    };

    type CustomerExceptionStatus = 'PENDING_VIEW' | 'PENDING_CONFIRM' | 'PROCESSING' | 'COMPLETED' | 'CLOSED';

    type PortalException = {
      id: number;
      exceptionNo: string;
      orderNo: string;
      customerOrderNo: string;
      exceptionType: string;
      customerStatus: CustomerExceptionStatus;
      pushedBy: string;
      pushedTime: string;
      needCustomerConfirm: boolean;
      replyDeadline: string | null;
      customerVisibleDesc: string;
      occurredTime: string;
      images: string[];
    };

    type PortalExceptionDetail = PortalException & {
      progressSteps: Array<{ title: string; time: string; status: 'done' | 'current' | 'pending' }>;
      csReplies: Array<{ time: string; operator: string; content: string }>;
      customerReplies: Array<{ time: string; content: string }>;
      confirmItems: string[];
      commRecords: Array<{ time: string; content: string; from: string }>;
    };

    type SubmitFeedbackPayload = {
      orderNo?: string;
      description: string;
      images?: string[];
    };

    type ExceptionActionPayload = {
      action: 'reply' | 'confirm_plan' | 'fee_question' | 'close_confirm';
      content?: string;
    };

    type PortalExceptionList = Common.PaginatingQueryRecord<PortalException>;

    type SubmitPortalOrderPayload = {
      orderChannel: PortalOrderChannel;
      customerOrderNo: string;
      /** 跟海柜混装时填写；代发/在库中转可为空 */
      containerNo?: string | null;
      destination?: string;
      timelinessLevel?: string;
      cartonQty?: number;
      palletQty?: number;
      remark?: string;
      /** 私址 */
      recipientName?: string;
      addressLine1?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      /** 代发 */
      skuCode?: string;
      shipQty?: number;
      /** 平台 */
      platform?: string;
    };

    type SubmitPortalOrderResult = {
      success: boolean;
      message: string;
      cargoOrderNo?: string;
      shippingMark?: string;
    };
  }
}
