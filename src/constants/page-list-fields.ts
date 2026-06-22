/** 列表页字段注册表：系统菜单「字段显示」与业务规则条件组合共用 */

export type PageListField = { label: string; key: string };

export const DEFAULT_LIST_FIELDS: PageListField[] = [
  { label: '编码', key: 'code' },
  { label: '名称', key: 'name' },
  { label: '状态', key: 'status' },
  { label: '备注', key: 'remark' },
  { label: '创建时间', key: 'createTime' }
];

/** 与对应列表页表格列 key / title 对齐 */
export const ROUTE_LIST_FIELDS: Record<string, PageListField[]> = {
  system_user: [
    { label: '用户名称', key: 'userName' },
    { label: '用户昵称', key: 'nickName' },
    { label: '部门', key: 'deptName' },
    { label: '手机号', key: 'phonenumber' },
    { label: '状态', key: 'status' }
  ],
  system_role: [
    { label: '角色名称', key: 'roleName' },
    { label: '权限字符', key: 'roleKey' },
    { label: '显示顺序', key: 'roleSort' },
    { label: '状态', key: 'status' }
  ],
  base_warehouse: [
    { label: '仓库编码', key: 'warehouseCode' },
    { label: '仓库名称', key: 'warehouseName' },
    { label: '仓库类型', key: 'warehouseType' },
    { label: '所属主体', key: 'companyName' }
  ],
  wms_zone: [
    { label: '库区编码', key: 'zoneCode' },
    { label: '库区名称', key: 'zoneName' },
    { label: '库区类型', key: 'zoneType' },
    { label: '所属仓库', key: 'warehouseName' }
  ],
  wms_location: [
    { label: '库位编码', key: 'locationCode' },
    { label: '所属库区', key: 'zoneName' },
    { label: '行', key: 'rowNo' },
    { label: '列', key: 'colNo' },
    { label: '容量', key: 'capacity' },
    { label: '状态', key: 'status' }
  ],
  'oms_container-order': [
    { label: '柜号', key: 'containerNo' },
    { label: '工作单号', key: 'containerOrderNo' },
    { label: '订单来源', key: 'orderSource' },
    { label: '主体', key: 'companyName' },
    { label: '客户', key: 'customerName' },
    { label: '渠道', key: 'channelName' },
    { label: '负责人', key: 'ownerUserName' },
    { label: '客服', key: 'customerServiceName' },
    { label: '船公司', key: 'shippingLineName' },
    { label: '柜型', key: 'containerType' },
    { label: '封条号', key: 'sealNo' },
    { label: '船名', key: 'vesselName' },
    { label: '航次', key: 'voyageNo' },
    { label: 'MBL', key: 'mblNo' },
    { label: 'HBL', key: 'hblNo' },
    { label: '卸货港', key: 'dischargePortName' },
    { label: '码头', key: 'terminalName' },
    { label: 'ETA', key: 'eta' },
    { label: 'ATA', key: 'ata' },
    { label: '海柜状态', key: 'containerStatus' },
    { label: '码头释放', key: 'terminalReleaseStatus' },
    { label: '查验状态', key: 'examStatus' },
    { label: '入库仓库', key: 'warehouseName' },
    { label: '提柜LFD', key: 'pickupLfd' },
    { label: '还柜LFD', key: 'emptyReturnLfd' },
    { label: '查验类型', key: 'examType' },
    { label: '查验备注', key: 'examRemark' },
    { label: '提柜供应商', key: 'drayageVendorName' },
    { label: '提柜预约号', key: 'pickupAppointmentNo' },
    { label: '提柜预约时间', key: 'pickupAppointmentTime' },
    { label: '实际提柜时间', key: 'actualPickupTime' },
    { label: '提柜备注', key: 'pickupRemark' },
    { label: '预计到仓', key: 'expectedArrivalTime' },
    { label: '实际到仓', key: 'actualArrivalTime' },
    { label: '海柜Location', key: 'containerLocation' },
    { label: '到仓备注', key: 'arrivalRemark' },
    { label: '预计拆柜', key: 'expectedDevanningTime' },
    { label: '开始拆柜', key: 'devanningStartTime' },
    { label: '拆柜完成', key: 'devanningFinishTime' },
    { label: '拆柜方式', key: 'devanningMethod' },
    { label: '装载类型', key: 'loadingType' },
    { label: '拆柜备注', key: 'devanningRemark' },
    { label: '还柜地点', key: 'emptyReturnLocation' },
    { label: '还柜时间', key: 'emptyReturnTime' },
    { label: '预排车数', key: 'prePlanTruckQty' },
    { label: '预排方数', key: 'prePlanCbm' },
    { label: '总箱数', key: 'totalCartonQty' },
    { label: '总板数', key: 'totalPalletQty' },
    { label: '总重量KG', key: 'totalWeight' },
    { label: '总方数CBM', key: 'totalCbm' },
    { label: '海柜异常', key: 'containerExceptionFlag' },
    { label: '下游异常', key: 'downstreamExceptionFlag' },
    { label: '附件', key: 'attachmentCount' },
    { label: 'DO', key: 'doAttachmentCount' }
  ],
  'oms_cargo-order': [
    { label: '订单号', key: 'orderNo' },
    { label: '客户', key: 'customerName' },
    { label: '仓库代码', key: 'platformWarehouseCode' },
    { label: '入库仓库', key: 'inboundWarehouseName' },
    { label: '履约状态', key: 'fulfillmentStatus' },
    { label: '预出单状态', key: 'preOutboundStatus' },
    { label: '出库单状态', key: 'outboundOrderStatus' },
    { label: '异常标记', key: 'exceptionFlag' },
    { label: '暂扣标记', key: 'holdFlag' },
    { label: '暂扣状态', key: 'holdStatus' },
    { label: '预约号', key: 'appointmentNo' },
    { label: '地址类型', key: 'addressType' },
    { label: '分组编码', key: 'groupCode' },
    { label: '快递承运商', key: 'parcelCarrierName' },
    { label: '预报箱数', key: 'declaredCartonQty' },
    { label: '预报板数', key: 'declaredPalletQty' },
    { label: '平台', key: 'platformName' },
    { label: '供应商', key: 'supplierName' },
    { label: '状态', key: 'status' }
  ],
  'oms_order-workbench': [
    { label: '已排除', key: 'excluded' },
    { label: '工作台状态', key: 'status' },
    { label: '车次号', key: 'generated_trip_no' },
    { label: '订单池', key: 'pool' }
  ]
};

export function getPageListFields(routeName: string): PageListField[] {
  return ROUTE_LIST_FIELDS[routeName] ?? DEFAULT_LIST_FIELDS;
}
