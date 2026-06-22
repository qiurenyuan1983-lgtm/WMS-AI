declare namespace Api {
  namespace Print {
    type TemplateType =
      | 'pallet_label'
      | 'devanning'
      | 'bol'
      | 'report'
      | 'invoice'
      | 'carton'
      | 'location'
      | 'custom';

    type TemplateStatus = 'draft' | 'testing' | 'pending_approval' | 'published' | 'disabled' | 'archived';

    type PalletScopeType = 'all' | 'destination' | 'platform';

    type TaskStatus = 'pending' | 'printing' | 'completed' | 'failed';

    type DocType = 'pallet_label' | 'devanning' | 'bol' | 'invoice' | 'report' | 'location' | 'carton' | 'custom';

    type InvoiceSubtype = 'sea_container' | 'truck_delivery' | 'devanning' | 'loading' | 'custom_fee';

    type PrintTemplate = Common.CommonRecord<{
      id: CommonType.IdType;
      templateCode: string;
      templateName: string;
      templateType: TemplateType;
      invoiceSubtype: InvoiceSubtype | null;
      warehouseName: string | null;
      customerName: string | null;
      paperSize: string | null;
      orientation: 'portrait' | 'landscape' | null;
      version: number;
      status: TemplateStatus;
      useCount: number;
      publisherName: string | null;
      publishTime: string | null;
      remark: string | null;
      /** 卡板贴：适用范围类型（全部 / 目的地 / 平台） */
      palletScopeType?: PalletScopeType | null;
      /** 卡板贴：选中的目的地或平台编码（多选） */
      palletScopeValues?: string[] | null;
    }>;

    type PrintTask = Common.CommonRecord<{
      id: CommonType.IdType;
      taskNo: string;
      docType: DocType;
      sourceNo: string;
      templateName: string;
      printQty: number;
      printerName: string | null;
      creatorName: string;
      status: TaskStatus;
      failReason: string | null;
      reprintCount: number;
    }>;

    type PrintRecord = Common.CommonRecord<{
      id: CommonType.IdType;
      printTime: string;
      printUser: string;
      templateName: string;
      docType: DocType;
      sourceNo: string;
      printQty: number;
      printerName: string;
      isReprint: boolean;
      reprintReason: string | null;
      result: 'success' | 'failed';
      pdfUrl: string | null;
    }>;

    type Printer = Common.CommonRecord<{
      id: CommonType.IdType;
      printerCode: string;
      printerName: string;
      warehouseName: string;
      zoneName: string | null;
      deviceType: string;
      ipAddress: string;
      defaultPaper: string;
      onlineStatus: 'online' | 'offline' | 'error';
      defaultTemplateName: string | null;
      lastPrintTime: string | null;
      bindScene: string | null;
      abnormalStatus: string | null;
    }>;

    type TemplateVersion = Common.CommonRecord<{
      id: CommonType.IdType;
      templateCode: string;
      templateName: string;
      templateType: TemplateType;
      version: number;
      status: TemplateStatus;
      publisherName: string | null;
      effectiveTime: string | null;
      warehouseNames: string | null;
      customerNames: string | null;
      useCount: number;
    }>;

    type PrintRuleTrigger =
      | 'DEVANNING_PALLET_COMPLETE'
      | 'DEVANNING_COMPLETE'
      | 'OUTBOUND_LOAD_COMPLETE'
      | 'BATCH_PALLET_LABEL'
      | 'MANUAL_REPRINT';

    type PrintRuleMode = 'preview' | 'direct';

    type PrintRule = Common.CommonRecord<{
      id: CommonType.IdType;
      ruleCode: string;
      ruleName: string;
      docType: DocType;
      triggerEvent: PrintRuleTrigger;
      conditionSummary: string;
      templateId: CommonType.IdType;
      templateCode: string;
      templateName: string;
      paperSize: string | null;
      printQty: number;
      printMode: PrintRuleMode;
      printerId: CommonType.IdType | null;
      printerName: string | null;
      /** 拆柜目的地分组（如 FedEx-LAX） */
      groupCodes: string[] | null;
      /** 与模板适用范围对齐 */
      palletScopeType: PalletScopeType | null;
      palletScopeValues: string[] | null;
      priority: number;
      status: 'enabled' | 'disabled';
      hitCount: number;
    }>;

    type PrintRuleMatchContext = {
      docType: DocType;
      triggerEvent: PrintRuleTrigger;
      groupCode?: string | null;
      customerName?: string | null;
      highValue?: boolean;
      platformName?: string | null;
    };

    type PrintRuleMatchResult = {
      rule: PrintRule;
      template: PrintTemplate;
      printer: Printer | null;
    };

    type SavePrintRulePayload = {
      id?: CommonType.IdType | null;
      ruleName: string;
      docType: DocType;
      triggerEvent: PrintRuleTrigger;
      templateId: CommonType.IdType;
      printerId: CommonType.IdType | null;
      printQty: number;
      printMode: PrintRuleMode;
      groupCodes: string[];
      palletScopeType: PalletScopeType;
      palletScopeValues: string[];
      priority: number;
      status: 'enabled' | 'disabled';
    };

    type WorkbenchStats = {
      pendingToday: number;
      printedToday: number;
      failedToday: number;
      onlinePrinters: number;
      totalPrinters: number;
      recentTemplates: Array<{ id: CommonType.IdType; name: string; type: TemplateType; useCount: number }>;
      recentRecords: PrintRecord[];
      printerStatus: Array<{ name: string; onlineStatus: Printer['onlineStatus']; warehouseName: string }>;
      alerts: Array<{ level: 'warning' | 'error'; message: string; time: string }>;
    };

    type TemplateSearchParams = CommonType.RecordNullable<
      Pick<
        PrintTemplate,
        'templateName' | 'templateType' | 'status' | 'customerName' | 'invoiceSubtype' | 'palletScopeType'
      > & {
        /** 筛选：命中任一目的地/平台 */
        palletScopeValue?: string | null;
      } & Api.Common.CommonSearchParams
    >;

    type TaskSearchParams = CommonType.RecordNullable<
      Pick<PrintTask, 'taskNo' | 'docType' | 'status' | 'sourceNo'> & Api.Common.CommonSearchParams
    >;

    type RecordSearchParams = CommonType.RecordNullable<
      Pick<PrintRecord, 'sourceNo' | 'docType' | 'printUser' | 'result'> & Api.Common.CommonSearchParams
    >;

    type PrinterSearchParams = CommonType.RecordNullable<
      Pick<Printer, 'printerName' | 'warehouseName' | 'onlineStatus' | 'deviceType'> & Api.Common.CommonSearchParams
    >;

    type VersionSearchParams = CommonType.RecordNullable<
      Pick<TemplateVersion, 'templateName' | 'templateType' | 'status'> & Api.Common.CommonSearchParams
    >;

    type RuleSearchParams = CommonType.RecordNullable<
      Pick<PrintRule, 'ruleName' | 'docType' | 'status'> & Api.Common.CommonSearchParams
    >;

    type PublishTemplatePayload = {
      templateId: CommonType.IdType;
      elements: unknown[];
      paperSize: string;
      orientation: 'portrait' | 'landscape';
      publisherName?: string | null;
    };

    type SubmitTemplateTestPayload = {
      templateId: CommonType.IdType;
      elements: unknown[];
      paperSize: string;
      orientation: 'portrait' | 'landscape';
      submitterName?: string | null;
    };
  }
}
