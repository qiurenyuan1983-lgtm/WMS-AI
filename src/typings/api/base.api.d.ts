/**
 * Namespace Api
 *
 * All backend api type
 */
declare namespace Api {
  /**
   * namespace Base
   *
   * backend api module: "Base" — 基础资料
   */
  namespace Base {
    // ========================= 国家管理 =========================

    type Country = Common.CommonRecord<{
      id: CommonType.IdType;
      tenantId: string;
      /** 国家代码（ISO 3166-1 alpha-2） */
      code: string;
      /** 英文名称 */
      nameEn: string;
      /** 国际电话区号 */
      phoneCode: string | null;
      /** 默认货币代码 */
      currencyCode: string | null;
      /** 默认时区 */
      timezoneDefault: string | null;
      /** 是否已开通（1=是，0=否） */
      isActive: number;
      /** 排序 */
      sortOrder: number;
    }>;

    type CountrySearchParams = CommonType.RecordNullable<
      Pick<Country, 'code' | 'nameEn' | 'isActive'> & Api.Common.CommonSearchParams
    >;

    type CountryOperateParams = CommonType.RecordNullable<
      Pick<Country, 'id' | 'code' | 'nameEn' | 'phoneCode' | 'currencyCode' | 'timezoneDefault' | 'isActive' | 'sortOrder'>
    >;

    type CountryList = Api.Common.PaginatingQueryRecord<Country>;

    // ========================= 币种管理 =========================

    type Currency = Common.CommonRecord<{
      id: CommonType.IdType;
      tenantId: string;
      /** ISO 4217 货币代码，如 USD/EUR/CNY */
      code: string;
      /** 英文名称 */
      nameEn: string;
      /** 货币符号，如 $ / € / ¥ */
      symbol: string;
      /** 小数位数（日元=0，美元=2） */
      decimalPlaces: number;
      /** 是否基准货币（1=是，0=否） */
      isBase: number;
      /** 状态（0=正常，1=禁用） */
      status: string;
      /** 排序 */
      sortOrder: number;
    }>;

    type CurrencySearchParams = CommonType.RecordNullable<
      Pick<Currency, 'code' | 'status'> & Api.Common.CommonSearchParams
    >;

    type CurrencyOperateParams = CommonType.RecordNullable<
      Pick<Currency, 'id' | 'code' | 'nameEn' | 'symbol' | 'decimalPlaces' | 'isBase' | 'status' | 'sortOrder'>
    >;

    type CurrencyList = Api.Common.PaginatingQueryRecord<Currency>;

    // ========================= 汇率配置 =========================

    type ExchangeRate = Common.CommonRecord<{
      id: CommonType.IdType;
      tenantId: string;
      /** 源货币代码 */
      fromCurrency: string;
      /** 目标货币代码 */
      toCurrency: string;
      /** 汇率，最多6位小数 */
      rate: number;
      /** 生效日期（yyyy-MM-dd） */
      effectiveDate: string;
      /** 失效日期（null=当前有效） */
      expiredDate: string | null;
      /** 是否当前有效（1=是，0=历史） */
      isCurrent: number;
      /** 备注 */
      remark: string | null;
    }>;

    type ExchangeRateSearchParams = CommonType.RecordNullable<
      Pick<ExchangeRate, 'fromCurrency' | 'toCurrency'> & Api.Common.CommonSearchParams & {
        params?: Record<string, unknown>;
      }
    >;

    /** 新增汇率参数 */
    type ExchangeRateOperateParams = CommonType.RecordNullable<
      Pick<ExchangeRate, 'id' | 'fromCurrency' | 'toCurrency' | 'rate' | 'effectiveDate' | 'remark'>
    >;

    /** 编辑汇率参数（仅允许修改 rate / remark） */
    type ExchangeRateEditParams = CommonType.RecordNullable<
      Pick<ExchangeRate, 'id' | 'rate' | 'remark'>
    >;

    type ExchangeRateList = Api.Common.PaginatingQueryRecord<ExchangeRate>;

    // ========================= 城市管理 =========================

    type City = Common.CommonRecord<{
      id: CommonType.IdType;
      tenantId: string;
      /** 国家代码 */
      countryCode: string;
      /** 州/省代码 */
      stateCode: string;
      /** 城市英文名称 */
      nameEn: string;
      /** 状态（0=正常，1=禁用） */
      status: string;
    }>;

    type CitySearchParams = CommonType.RecordNullable<
      Pick<City, 'countryCode' | 'stateCode' | 'nameEn' | 'status'> & Api.Common.CommonSearchParams
    >;

    type CityOperateParams = CommonType.RecordNullable<
      Pick<City, 'id' | 'countryCode' | 'stateCode' | 'nameEn' | 'status'>
    >;

    type CityList = Api.Common.PaginatingQueryRecord<City>;

    // ========================= 邮编库 =========================

    type ZipCode = Common.CommonRecord<{
      id: CommonType.IdType;
      tenantId: string;
      /** 国家代码 */
      countryCode: string;
      /** 州/省代码 */
      stateCode: string;
      /** 城市名称（冗余，自动补全用） */
      cityName: string;
      /** 邮编 */
      zip: string;
    }>;

    type ZipCodeSearchParams = CommonType.RecordNullable<
      Pick<ZipCode, 'countryCode' | 'stateCode' | 'zip' | 'cityName'> & Api.Common.CommonSearchParams
    >;

    type ZipCodeOperateParams = CommonType.RecordNullable<
      Pick<ZipCode, 'id' | 'countryCode' | 'stateCode' | 'cityName' | 'zip'>
    >;

    type ZipCodeList = Api.Common.PaginatingQueryRecord<ZipCode>;

    /** 邮编自动补全返回 */
    type ZipCodeAutocomplete = {
      stateCode: string;
      cityName: string;
    } | null;

    // ========================= 州/省管理 =========================

    type StateProvince = Common.CommonRecord<{
      id: CommonType.IdType;
      tenantId: string;
      /** 所属国家代码 */
      countryCode: string;
      /** 州/省代码 */
      code: string;
      /** 英文名称 */
      nameEn: string;
      /** 排序 */
      sortOrder: number;
      /** 状态（0=正常，1=禁用） */
      status: string;
    }>;

    type StateProvinceSearchParams = CommonType.RecordNullable<
      Pick<StateProvince, 'countryCode' | 'code' | 'nameEn' | 'status'> & Api.Common.CommonSearchParams
    >;

    type StateProvinceOperateParams = CommonType.RecordNullable<
      Pick<StateProvince, 'id' | 'countryCode' | 'code' | 'nameEn' | 'sortOrder' | 'status'>
    >;

    type StateProvinceList = Api.Common.PaginatingQueryRecord<StateProvince>;

    // ========================= 时区管理 =========================

    type Timezone = Common.CommonRecord<{
      id: CommonType.IdType;
      tenantId: string;
      /** 时区代码（IANA 标准，如 America/New_York） */
      tzCode: string;
      /** 英文名称 */
      nameEn: string;
      /** UTC 偏移量，如 UTC+08:00 */
      utcOffset: string;
      /** 国家代码 */
      countryCode: string | null;
      /** 是否夏令时（1=是，0=否） */
      isDst: number | null;
      /** 状态（0=正常，1=禁用） */
      status: string;
      /** 排序 */
      sortOrder: number;
    }>;

    type TimezoneSearchParams = CommonType.RecordNullable<
      Pick<Timezone, 'tzCode' | 'nameEn' | 'countryCode' | 'status'> & Api.Common.CommonSearchParams
    >;

    type TimezoneOperateParams = CommonType.RecordNullable<
      Pick<Timezone, 'id' | 'tzCode' | 'nameEn' | 'utcOffset' | 'countryCode' | 'isDst' | 'status' | 'sortOrder'>
    >;

    type TimezoneList = Api.Common.PaginatingQueryRecord<Timezone>;

    // ========================= 港口管理 =========================

    type Port = Common.CommonRecord<{
      id: CommonType.IdType;
      tenantId: string;
      /** 港口代码（UN/LOCODE，如 CNSHA） */
      portCode: string;
      /** 英文名称 */
      nameEn: string;
      /** 国家代码 */
      countryCode: string;
      /** 州/省代码 */
      stateCode: string | null;
      /** 城市 */
      city: string | null;
      /** 港口类型（1=海港，2=空港，3=内陆港） */
      portType: number;
      /** 时区 */
      timezone: string | null;
      /** 集装箱查询URL */
      containerQueryUrl: string | null;
      /** 状态（0=正常，1=禁用） */
      status: string;
      /** 排序 */
      sortOrder: number;
      /** 备注 */
      remark: string | null;
    }>;

    type PortSearchParams = CommonType.RecordNullable<
      Pick<Port, 'portCode' | 'nameEn' | 'countryCode' | 'portType' | 'status'> & Api.Common.CommonSearchParams
    >;

    type PortOperateParams = CommonType.RecordNullable<
      Pick<Port, 'id' | 'portCode' | 'nameEn' | 'countryCode' | 'stateCode' | 'city' | 'portType' | 'timezone' | 'containerQueryUrl' | 'status' | 'sortOrder' | 'remark'>
    >;

    type PortList = Api.Common.PaginatingQueryRecord<Port>;

    // ========================= 码头管理 =========================

    type Terminal = Common.CommonRecord<{
      id: CommonType.IdType;
      tenantId: string;
      /** 码头代码 */
      terminalCode: string;
      /** 码头名称 */
      terminalName: string;
      /** 英文名称 */
      terminalNameEn: string | null;
      /** 所属港口ID */
      portId: CommonType.IdType;
      /** 所属港口代码 */
      portCode: string | null;
      /** 所属港口名称 */
      portName: string | null;
      /** 国家 */
      countryCode: string | null;
      /** 州/省 */
      stateCode: string | null;
      /** 城市 */
      city: string | null;
      /** 地址 */
      address: string | null;
      /** 联系电话 */
      contactPhone: string | null;
      /** 联系邮箱 */
      contactEmail: string | null;
      /** 官网 */
      website: string | null;
      /** 是否支持预约 */
      appointmentSupported: number;
      /** 默认预约方式 */
      defaultAppointmentMethod: string | null;
      /** 默认放行方式 */
      defaultReleaseMethod: string | null;
      /** 时区 */
      timezone: string | null;
      /** 状态（0=启用，1=停用） */
      status: string;
      /** 备注 */
      remark: string | null;
    }>;

    type TerminalSearchParams = CommonType.RecordNullable<
      Pick<Terminal, 'terminalCode' | 'terminalName' | 'portId' | 'defaultReleaseMethod' | 'appointmentSupported' | 'status'> & Api.Common.CommonSearchParams
    >;

    type TerminalOperateParams = CommonType.RecordNullable<
      Pick<Terminal, 'id' | 'terminalCode' | 'terminalName' | 'terminalNameEn' | 'portId' | 'portCode' | 'portName' | 'countryCode' | 'stateCode' | 'city' | 'address' | 'contactPhone' | 'contactEmail' | 'website' | 'appointmentSupported' | 'defaultAppointmentMethod' | 'defaultReleaseMethod' | 'timezone' | 'status' | 'remark'>
    >;

    type TerminalList = Api.Common.PaginatingQueryRecord<Terminal>;

    // ========================= 船司管理 =========================

    type ShippingLine = Common.CommonRecord<{
      id: CommonType.IdType;
      tenantId: string;
      /** SCAC 代码，如 MSCU/COSU */
      code: string;
      shippingLineCode?: string | null;
      /** 英文全称 */
      nameEn: string;
      shippingLineName?: string | null;
      /** 常用简称，如 MSC/COSCO */
      nameAbbr: string | null;
      /** 注册国家代码 */
      countryCode: string | null;
      /** 联系邮箱 */
      contactEmail: string | null;
      /** 联系电话 */
      contactPhone: string | null;
      /** 官网 */
      website: string | null;
      /** 追踪URL（含 {container_no} 占位符） */
      trackingUrl: string | null;
      /** 状态（0=正常，1=禁用） */
      status: string;
      /** 排序 */
      sortOrder: number;
      /** 备注 */
      remark: string | null;
    }>;

    type ShippingLineSearchParams = CommonType.RecordNullable<
      Pick<ShippingLine, 'code' | 'nameEn' | 'nameAbbr' | 'status'> & Api.Common.CommonSearchParams
    >;

    type ShippingLineOperateParams = CommonType.RecordNullable<
      Pick<ShippingLine, 'id' | 'code' | 'nameEn' | 'nameAbbr' | 'countryCode' | 'contactEmail' | 'contactPhone' | 'website' | 'trackingUrl' | 'status' | 'sortOrder' | 'remark'>
    >;

    type ShippingLineList = Api.Common.PaginatingQueryRecord<ShippingLine>;

    // ========================= 航线管理 =========================

    type ShippingRoute = Common.CommonRecord<{
      id: CommonType.IdType;
      tenantId: string;
      routeCode: string;
      routeName: string;
      routeNameEn: string | null;
      shippingLineId: CommonType.IdType | null;
      shippingLineCode: string | null;
      shippingLineName: string | null;
      originPortId: CommonType.IdType | null;
      originPortCode: string | null;
      originPortName: string | null;
      destinationPortId: CommonType.IdType | null;
      destinationPortCode: string | null;
      destinationPortName: string | null;
      defaultTransitDays: number | null;
      routeType: string | null;
      referenceMinDays: number | null;
      referenceAvgDays: number | null;
      referenceMaxDays: number | null;
      referenceFreight: number | null;
      status: string;
      remark: string | null;
    }>;

    type ShippingRouteSearchParams = CommonType.RecordNullable<
      Pick<ShippingRoute, 'routeCode' | 'routeName' | 'shippingLineId' | 'originPortId' | 'destinationPortId' | 'status'> & Api.Common.CommonSearchParams
    >;

    type ShippingRouteOperateParams = CommonType.RecordNullable<
      Pick<ShippingRoute, 'id' | 'routeCode' | 'routeName' | 'routeNameEn' | 'shippingLineId' | 'shippingLineCode' | 'shippingLineName' | 'originPortId' | 'originPortCode' | 'originPortName' | 'destinationPortId' | 'destinationPortCode' | 'destinationPortName' | 'defaultTransitDays' | 'routeType' | 'referenceMinDays' | 'referenceAvgDays' | 'referenceMaxDays' | 'referenceFreight' | 'status' | 'remark'>
    >;

    type ShippingRouteList = Api.Common.PaginatingQueryRecord<ShippingRoute>;

    // ========================= 船舶管理 =========================

    type Vessel = Common.CommonRecord<{
      id: CommonType.IdType;
      tenantId: string;
      vesselCode: string;
      vesselName: string;
      vesselNameEn: string | null;
      imoNo: string | null;
      mmsi: string | null;
      callSign: string | null;
      shippingLineId: CommonType.IdType;
      shippingLineCode: string | null;
      shippingLineName: string | null;
      vesselType: string | null;
      capacityTeu: number | null;
      lengthM: number | null;
      widthM: number | null;
      buildYear: number | null;
      flagCountry: string | null;
      status: string;
      remark: string | null;
    }>;

    type VesselSearchParams = CommonType.RecordNullable<
      Pick<Vessel, 'vesselCode' | 'vesselName' | 'vesselNameEn' | 'imoNo' | 'shippingLineId' | 'vesselType' | 'status'> &
        Api.Common.CommonSearchParams & {
          keyword?: string | null;
        }
    >;

    type VesselOperateParams = CommonType.RecordNullable<
      Pick<
        Vessel,
        | 'id'
        | 'vesselCode'
        | 'vesselName'
        | 'vesselNameEn'
        | 'imoNo'
        | 'mmsi'
        | 'callSign'
        | 'shippingLineId'
        | 'shippingLineCode'
        | 'shippingLineName'
        | 'vesselType'
        | 'capacityTeu'
        | 'lengthM'
        | 'widthM'
        | 'buildYear'
        | 'flagCountry'
        | 'status'
        | 'remark'
      >
    >;

    type VesselList = Api.Common.PaginatingQueryRecord<Vessel>;

    // ========================= 平台管理 =========================

    type Platform = Common.CommonRecord<{
      id: CommonType.IdType;
      tenantId: string;
      /** 平台代码（如 AMAZON/WALMART） */
      code: string;
      /** 平台英文名称 */
      nameEn: string;
      /** 平台类型（字典：PLATFORM_TYPE） */
      typeCode: string;
      /** Logo 图片 OSS ID */
      logoOssId: number | null;
      /** Logo 图片 URL */
      logoUrl: string | null;
      /** 地址格式配置（JSON，预留） */
      addressFormat: string | null;
      /** API 对接参数（JSON，预留） */
      apiConfig: string | null;
      /** 状态（0=正常，1=禁用） */
      status: string;
      /** 排序 */
      sortOrder: number;
      /** 备注 */
      remark: string | null;
    }>;

    type PlatformSearchParams = CommonType.RecordNullable<
      Pick<Platform, 'nameEn' | 'typeCode' | 'status'> & Api.Common.CommonSearchParams
    >;

    type PlatformOperateParams = CommonType.RecordNullable<
      Pick<Platform, 'id' | 'code' | 'nameEn' | 'typeCode' | 'logoOssId' | 'logoUrl' | 'status' | 'sortOrder' | 'remark'>
    >;

    type PlatformList = Api.Common.PaginatingQueryRecord<Platform>;

    // ========================= 平台地址库 =========================

    type PlatformAddress = Common.CommonRecord<{
      id: CommonType.IdType;
      tenantId: string;
      /** 所属平台ID */
      platformId: CommonType.IdType;
      /** 所属平台名称（前端展示用） */
      platformName: string | null;
      /** 地址编码（如 ONT8/LAX9） */
      addressCode: string;
      /** 地址类型（1=FBA仓库，2=门店，3=配送中心，4=其他） */
      addressType: number;
      /** 地址名称英文 */
      nameEn: string;
      /** 国家代码 */
      countryCode: string;
      /** 州/省代码 */
      stateCode: string | null;
      /** 城市 */
      city: string | null;
      /** 地址行1 */
      addressLine1: string;
      /** 地址行2 */
      addressLine2: string | null;
      /** 邮编 */
      zipCode: string | null;
      /** 单板CBM */
      unitPalletCbm: number | null;
      /** 联系人 */
      contactName: string | null;
      /** 联系电话 */
      contactPhone: string | null;
      /** 最后核验时间 */
      lastVerifiedAt: string | null;
      /** 状态（0=正常，1=禁用） */
      status: string;
      /** 备注 */
      remark: string | null;
    }>;

    type PlatformAddressSearchParams = CommonType.RecordNullable<
      Pick<PlatformAddress, 'platformId' | 'addressType' | 'countryCode' | 'stateCode' | 'status'> &
        Api.Common.CommonSearchParams & {
          keyword?: string | null;
        }
    >;

    type PlatformAddressOperateParams = CommonType.RecordNullable<
      Pick<
        PlatformAddress,
        | 'id'
        | 'platformId'
        | 'addressCode'
        | 'addressType'
        | 'nameEn'
        | 'countryCode'
        | 'stateCode'
        | 'city'
        | 'addressLine1'
        | 'addressLine2'
        | 'zipCode'
        | 'unitPalletCbm'
        | 'contactName'
        | 'contactPhone'
        | 'status'
        | 'remark'
      >
    >;

    type PlatformAddressList = Api.Common.PaginatingQueryRecord<PlatformAddress>;

    /** 平台地址变更记录 */
    type PlatformAddressChangeLog = {
      id: CommonType.IdType;
      platformAddressId: CommonType.IdType;
      /** 变更类型：CREATE / UPDATE / DISABLE */
      changeType: string;
      beforeValue: string | null;
      afterValue: string | null;
      changeReason: string | null;
      operatorId: CommonType.IdType;
      operatorName: string;
      createTime: string;
    };

    // ========================= 费项管理 =========================

    type FeeItem = Common.CommonRecord<{
      id: CommonType.IdType;
      tenantId: string;
      /** 费项编码（租户内唯一，新增后不可修改） */
      feeCode: string;
      /** 费项名称 */
      feeName: string;
      /** 费项类别（字典：fee_category） */
      feeCategory: string;
      /** 业务阶段（字典：fee_business_stage） */
      businessStage: string;
      /** 业务类型（字典：fulfillment_type，null=通用） */
      businessType: string | null;
      /** 是否系统预设（0=否，1=是） */
      isSystem: number;
      /** 是否出账单（0=否，1=是） */
      isBillable: number;
      /** 费项说明 */
      description: string | null;
      /** 状态（0=正常，1=禁用） */
      status: string;
      /** 排序 */
      sortOrder: number;
      /** 备注 */
      remark: string | null;
    }>;

    type FeeItemSearchParams = CommonType.RecordNullable<
      Pick<FeeItem, 'feeCategory' | 'businessStage' | 'businessType' | 'status'> &
        Api.Common.CommonSearchParams & { keyword?: string | null }
    >;

    type FeeItemOperateParams = CommonType.RecordNullable<
      Pick<FeeItem, 'id' | 'feeCode' | 'feeName' | 'feeCategory' | 'businessStage' | 'businessType' | 'isBillable' | 'description' | 'status' | 'sortOrder' | 'remark'>
    >;

    type FeeItemList = Api.Common.PaginatingQueryRecord<FeeItem>;

    // ========================= 渠道管理 =========================

    type Channel = Common.CommonRecord<{
      id: CommonType.IdType;
      tenantId: string;
      channelCode: string;
      channelName: string;
      channelType: string;
      containerMode: string | null;
      priority: number;
      sortOrder: number;
      status: string;
      remark: string | null;
    }>;

    type ChannelSearchParams = CommonType.RecordNullable<
      Pick<Channel, 'channelType' | 'containerMode' | 'status'> &
        Api.Common.CommonSearchParams & { keyword?: string | null }
    >;

    type ChannelOperateParams = CommonType.RecordNullable<
      Pick<Channel, 'id' | 'channelCode' | 'channelName' | 'channelType' | 'containerMode' | 'priority' | 'sortOrder' | 'status' | 'remark'>
    >;

    type ChannelList = Api.Common.PaginatingQueryRecord<Channel>;

    // ========================= 业务类型管理 =========================

    type BusinessType = Common.CommonRecord<{
      id: CommonType.IdType;
      tenantId: string;
      businessTypeCode: string;
      businessTypeName: string;
      businessCategory: string;
      operationFlowType: string | null;
      receiveRequired: string;
      inboundRequired: string;
      putawayRequired: string;
      storageRequired: string;
      pickingRequired: string;
      outboundRequired: string;
      deliveryRequired: string;
      appointmentRequired: string;
      vasSupported: string;
      sortingStrategy: string | null;
      sortingField: string | null;
      sortOrder: number;
      status: string;
      remark: string | null;
    }>;

    type BusinessTypeSearchParams = CommonType.RecordNullable<
      Pick<BusinessType, 'businessCategory' | 'operationFlowType' | 'status'> &
        Api.Common.CommonSearchParams & { keyword?: string | null }
    >;

    type BusinessTypeOperateParams = CommonType.RecordNullable<
      Pick<
        BusinessType,
        | 'id' | 'businessTypeCode' | 'businessTypeName' | 'businessCategory' | 'operationFlowType'
        | 'receiveRequired' | 'inboundRequired' | 'putawayRequired' | 'storageRequired'
        | 'pickingRequired' | 'outboundRequired' | 'deliveryRequired' | 'appointmentRequired'
        | 'vasSupported' | 'sortingStrategy' | 'sortingField' | 'sortOrder' | 'status' | 'remark'
      >
    >;

    type BusinessTypeList = Api.Common.PaginatingQueryRecord<BusinessType>;

    // ========================= 增值服务管理 =========================

    type ValueAddedService = Common.CommonRecord<{
      id: CommonType.IdType;
      tenantId: string;
      serviceCode: string;
      serviceName: string;
      serviceCategory: string;
      billingMode: string | null;
      chargeableFlag: string;
      operationRequired: string;
      pdaOperationFlag: string;
      photoRequired: string;
      qcRequired: string;
      supportBatchOperation: string;
      defaultSelected: string;
      priority: number;
      sortOrder: number;
      status: string;
      remark: string | null;
    }>;

    type ValueAddedServiceSearchParams = CommonType.RecordNullable<
      Pick<ValueAddedService, 'serviceCategory' | 'chargeableFlag' | 'operationRequired' | 'status'> &
        Api.Common.CommonSearchParams & { keyword?: string | null }
    >;

    type ValueAddedServiceOperateParams = CommonType.RecordNullable<
      Pick<
        ValueAddedService,
        | 'id' | 'serviceCode' | 'serviceName' | 'serviceCategory' | 'billingMode'
        | 'chargeableFlag' | 'operationRequired' | 'pdaOperationFlag' | 'photoRequired'
        | 'qcRequired' | 'supportBatchOperation' | 'defaultSelected' | 'priority' | 'sortOrder' | 'status' | 'remark'
      >
    >;

    type ValueAddedServiceList = Api.Common.PaginatingQueryRecord<ValueAddedService>;

    // ========================= 主体管理 =========================

    type MdmCompany = Common.CommonRecord<{
      id: CommonType.IdType;
      tenantId: string;
      /** 主体编码（租户内唯一，新增后不可修改） */
      companyCode: string;
      /** 主体名称 */
      companyName: string;
      /** 国家代码 */
      countryCode: string;
      /** 注册地址 */
      registeredAddr: string | null;
      /** 税号 */
      taxNo: string | null;
      /** 是否VAT注册（0=否，1=是） */
      vatRegistered: number;
      /** 开票抬头 */
      invoiceTitle: string | null;
      /** 开票税号 */
      invoiceTaxNo: string | null;
      /** 开票银行 */
      invoiceBankName: string | null;
      /** 开票行账号（脱敏显示） */
      bankAccountMasked: string | null;
      /** 银行名称 */
      bankName: string | null;
      /** 银行账号（加密存储） */
      bankAccountNo: string | null;
      /** SWIFT代码 */
      swiftCode: string | null;
      /** 收款人 */
      beneficiary: string | null;
      /** 结算货币代码 */
      currencyCode: string;
      /** 时区 */
      timezone: string;
      /** 营业执照等文件（JSON数组，OSS URL） */
      licenseFiles: string | null;
      /** 状态（0=启用，1=停用） */
      status: string;
      /** 备注 */
      remark: string | null;
    }>;

    type MdmCompanySearchParams = CommonType.RecordNullable<
      Pick<MdmCompany, 'companyCode' | 'companyName' | 'countryCode' | 'status'> &
        Api.Common.CommonSearchParams
    >;

    type MdmCompanyOperateParams = CommonType.RecordNullable<
      Pick<
        MdmCompany,
        | 'id' | 'companyCode' | 'companyName' | 'countryCode' | 'registeredAddr'
        | 'taxNo' | 'vatRegistered' | 'invoiceTitle' | 'invoiceTaxNo' | 'invoiceBankName'
        | 'bankAccountMasked' | 'bankName' | 'bankAccountNo' | 'swiftCode' | 'beneficiary'
        | 'currencyCode' | 'timezone' | 'licenseFiles' | 'status' | 'remark'
      >
    >;

    type MdmCompanyList = Api.Common.PaginatingQueryRecord<MdmCompany>;

    // ========================= 仓库管理 =========================

    type MdmWarehouse = Common.CommonRecord<{
      id: CommonType.IdType;
      tenantId: string;
      /** 所属主体ID */
      companyId: CommonType.IdType;
      /** 所属主体名称（前端展示用） */
      companyName: string | null;
      /** 仓库编码（租户内唯一，如 LA01/NJ01） */
      warehouseCode: string;
      /** 仓库名称 */
      warehouseName: string;
      /** 仓库类型（字典：warehouse_type：SELF_OP/PARTNER/TRANSIT/CUSTOMER） */
      warehouseType: string;
      /** 国家代码 */
      countryCode: string;
      /** 州/省代码 */
      stateCode: string | null;
      /** 城市 */
      city: string | null;
      /** 详细地址 */
      address: string | null;
      /** 邮编 */
      zipCode: string | null;
      /** 时区 */
      timezone: string | null;
      /** 结算货币代码 */
      currencyCode: string | null;
      /** 联系人 */
      contactName: string | null;
      /** 联系电话 */
      contactPhone: string | null;
      /** 是否保税仓（0=否，1=是） */
      isBonded: number;
      /** 运营开始时间（HH:mm） */
      operationStartTime: string | null;
      /** 运营结束时间（HH:mm） */
      operationEndTime: string | null;
      /** 支持卸柜（0=否，1=是） */
      supportUnloading: number;
      /** 支持一件代发 */
      supportDropship: number;
      /** 支持转运 */
      supportTransit: number;
      /** 支持调拨 */
      supportTransfer: number;
      /** 支持FBA头程 */
      supportFba: number;
      /** 支持自提 */
      supportSelfPickup: number;
      /** 支持预约 */
      supportAppointment: number;
      /** 最大容量(CBM) */
      maxCapacityCbm: number | null;
      /** 日卸柜量(柜) */
      dailyUnloadingCap: number | null;
      /** 日出库量(单) */
      dailyOutboundCap: number | null;
      /** 月台数 */
      dockCount: number | null;
      /** 仓门数 */
      doorCount: number | null;
      /** 叉车数 */
      forkliftCount: number | null;
      /** 是否启用PDA（0=否，1=是） */
      pdaEnabled: number;
      /** 是否启用API对接 */
      apiEnabled: number;
      /** API配置（JSON，预留） */
      apiConfig: string | null;
      /** 状态（0=启用，1=停用） */
      status: string;
      /** 备注 */
      remark: string | null;
    }>;

    type MdmWarehouseSearchParams = CommonType.RecordNullable<
      Pick<MdmWarehouse, 'companyId' | 'warehouseCode' | 'warehouseName' | 'warehouseType' | 'countryCode' | 'status'> &
        Api.Common.CommonSearchParams
    >;

    type MdmWarehouseOperateParams = CommonType.RecordNullable<
      Pick<
        MdmWarehouse,
        | 'id' | 'companyId' | 'warehouseCode' | 'warehouseName' | 'warehouseType'
        | 'countryCode' | 'stateCode' | 'city' | 'address' | 'zipCode' | 'timezone' | 'currencyCode'
        | 'contactName' | 'contactPhone' | 'isBonded'
        | 'operationStartTime' | 'operationEndTime'
        | 'supportUnloading' | 'supportDropship' | 'supportTransit' | 'supportTransfer'
        | 'supportFba' | 'supportSelfPickup' | 'supportAppointment'
        | 'maxCapacityCbm' | 'dailyUnloadingCap' | 'dailyOutboundCap'
        | 'dockCount' | 'doorCount' | 'forkliftCount'
        | 'pdaEnabled' | 'apiEnabled' | 'apiConfig'
        | 'status' | 'remark'
      >
    >;

    type MdmWarehouseList = Api.Common.PaginatingQueryRecord<MdmWarehouse>;

    // ========================= SKU管理 =========================

    type MdmSku = Common.CommonRecord<{
      id: CommonType.IdType;
      tenantId: string;
      /** 所属客户ID */
      clientId: CommonType.IdType;
      /** 所属客户名称（前端展示用） */
      clientName: string | null;
      /** SKU编码（客户内唯一） */
      skuCode: string;
      /** SKU名称（中文） */
      skuName: string;
      /** SKU名称（英文） */
      skuNameEn: string | null;
      /** 条形码 */
      barcode: string | null;
      /** 品牌 */
      brand: string | null;
      /** 型号 */
      model: string | null;
      /** 颜色 */
      color: string | null;
      /** 尺寸规格 */
      sizeSpec: string | null;
      /** 计量单位 */
      unit: string;
      /** 长(cm) */
      lengthCm: number | null;
      /** 宽(cm) */
      widthCm: number | null;
      /** 高(cm) */
      heightCm: number | null;
      /** 重量(kg) */
      weightKg: number | null;
      /** 体积(CBM，自动计算) */
      volumeCbm: number | null;
      /** 外箱长(cm) */
      packageLengthCm: number | null;
      /** 外箱宽(cm) */
      packageWidthCm: number | null;
      /** 外箱高(cm) */
      packageHeightCm: number | null;
      /** 外箱重(kg) */
      packageWeightKg: number | null;
      /** 易碎 */
      isFragile: number;
      /** 液体 */
      isLiquid: number;
      /** 含电池 */
      isBattery: number;
      /** 带磁 */
      isMagnetic: number;
      /** 危险品 */
      isDangerous: number;
      /** 超大件 */
      isOversize: number;
      /** 默认包装规格ID */
      defaultPkgId: CommonType.IdType | null;
      /** 默认作业费项（JSON数组，如 ["LABEL_FEE","QC_CHECK"]） */
      defaultFeeCodes: string | null;
      /** 申报品名（中文） */
      declaredNameCn: string | null;
      /** 申报品名（英文） */
      declaredNameEn: string | null;
      /** HS编码 */
      hsCode: string | null;
      /** 申报价值 */
      declaredValue: number | null;
      /** 申报货币 */
      declaredCurrency: string | null;
      /** 原产国代码 */
      originCountryCode: string | null;
      /** 商品图片URL */
      imageUrl: string | null;
      /** 状态（0=正常，1=禁用） */
      status: string;
      /** 备注 */
      remark: string | null;
    }>;

    type MdmSkuSearchParams = CommonType.RecordNullable<
      Pick<MdmSku, 'clientId' | 'skuCode' | 'skuName' | 'barcode' | 'brand' | 'status'> &
        Api.Common.CommonSearchParams & { keyword?: string | null }
    >;

    type MdmSkuOperateParams = CommonType.RecordNullable<
      Pick<
        MdmSku,
        | 'id' | 'clientId' | 'skuCode' | 'skuName' | 'skuNameEn' | 'barcode'
        | 'brand' | 'model' | 'color' | 'sizeSpec' | 'unit'
        | 'lengthCm' | 'widthCm' | 'heightCm' | 'weightKg'
        | 'packageLengthCm' | 'packageWidthCm' | 'packageHeightCm' | 'packageWeightKg'
        | 'isFragile' | 'isLiquid' | 'isBattery' | 'isMagnetic' | 'isDangerous' | 'isOversize'
        | 'defaultPkgId' | 'defaultFeeCodes'
        | 'declaredNameCn' | 'declaredNameEn' | 'hsCode' | 'declaredValue' | 'declaredCurrency'
        | 'originCountryCode' | 'imageUrl' | 'status' | 'remark'
      >
    >;

    type MdmSkuList = Api.Common.PaginatingQueryRecord<MdmSku>;
  }
}
