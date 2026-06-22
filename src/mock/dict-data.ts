type DictItem = { label: string; value: string; listClass?: string };

function build(dictType: string, items: DictItem[], startCode = 1): Api.System.DictData[] {
  const now = '2026-01-01 00:00:00';
  return items.map((item, index) => ({
    dictCode: startCode + index,
    dictSort: index + 1,
    dictLabel: item.label,
    dictValue: item.value,
    dictType,
    cssClass: '',
    listClass: (item.listClass || 'default') as NaiveUI.ThemeColor,
    isDefault: index === 0 ? 'Y' : 'N',
    remark: '',
    createBy: 'admin',
    createTime: now,
    updateBy: 'admin',
    updateTime: now
  }));
}

const DICT_DEFINITIONS: Record<string, DictItem[]> = {
  sys_normal_disable: [
    { label: "正常", value: '0', listClass: 'success' },
    { label: "停用", value: '1', listClass: 'danger' },
  ],
  sys_user_sex: [
    { label: "男", value: '0' },
    { label: "女", value: '1' },
    { label: "未知", value: '2' },
  ],
  sys_yes_no: [
    { label: "是", value: 'Y', listClass: 'success' },
    { label: "否", value: 'N', listClass: 'danger' },
  ],
  sys_show_hide: [
    { label: "显示", value: '0', listClass: 'success' },
    { label: "隐藏", value: '1', listClass: 'danger' },
  ],
  sys_notice_type: [
    { label: "通知", value: '1' },
    { label: "公告", value: '2' },
  ],
  sys_grant_type: [
    { label: "密码模式", value: 'password' },
    { label: "客户端模式", value: 'client_credentials' },
  ],
  sys_device_type: [
    { label: "PC", value: 'pc' },
    { label: "移动端", value: 'mobile' },
  ],
  sys_common_status: [
    { label: "成功", value: '0', listClass: 'success' },
    { label: "失败", value: '1', listClass: 'danger' },
  ],
  sys_oper_type: [
    { label: "其它", value: '0' },
    { label: "新增", value: '1' },
    { label: "修改", value: '2' },
    { label: "删除", value: '3' },
  ],
  wms_zone_type: [
    { label: "快递区", value: 'EXPRESS', listClass: 'info' },
    { label: "暂存区", value: 'TEMP', listClass: 'success' },
    { label: "私仓库区", value: 'PRIVATE', listClass: 'warning' },
    { label: "大货库区", value: 'BULK', listClass: 'warning' },
    { label: "FBA常规库区", value: 'FBA', listClass: 'info' },
    { label: "异常区", value: 'EXCEPTION', listClass: 'error' },
  ],
  wms_zone_status: [
    { label: "启用", value: 'ENABLED', listClass: 'success' },
    { label: "停用", value: 'DISABLED', listClass: 'default' },
  ],
  wms_storage_method: [
    { label: "地堆", value: 'FLOOR', listClass: 'info' },
    { label: "货架", value: 'RACK', listClass: 'success' },
  ],
  wms_location_status: [
    { label: '空闲', value: 'EMPTY', listClass: 'success' },
    { label: '部分占用', value: 'PARTIAL', listClass: 'info' },
    { label: '已满', value: 'FULL', listClass: 'warning' },
    { label: '锁定', value: 'LOCKED', listClass: 'warning' },
    { label: '禁用', value: 'DISABLED', listClass: 'default' },
    { label: '维修', value: 'MAINTENANCE', listClass: 'default' },
    { label: '异常', value: 'ABNORMAL', listClass: 'error' },
    { label: '预占用', value: 'PRE_OCCUPIED', listClass: 'primary' },
    { label: '待清理', value: 'PENDING_CLEAN', listClass: 'error' }
  ],
  wms_location_purpose: [
    { label: '通用存储', value: 'GENERAL', listClass: 'default' },
    { label: 'FBA 备货', value: 'FBA', listClass: 'primary' },
    { label: '私仓暂存', value: 'PRIVATE', listClass: 'info' },
    { label: '贵品区', value: 'PREMIUM', listClass: 'warning' },
    { label: '尾板散货', value: 'TAIL', listClass: 'success' },
    { label: '快进快出', value: 'EXPRESS', listClass: 'error' },
    { label: '暂扣中转', value: 'HOLD', listClass: 'warning' }
  ],
  wms_inventory_status: [
    { label: "在库", value: 'IN_STOCK', listClass: 'success' },
    { label: "部分出库", value: 'PARTIAL_OUT', listClass: 'warning' },
    { label: "已出清", value: 'DEPLETED', listClass: 'default' },
    { label: "冻结", value: 'HOLD', listClass: 'error' },
  ],
  wms_pallet_status: [
    { label: "在库", value: 'IN_STOCK', listClass: 'success' },
    { label: "待出库", value: 'PRE_OUTBOUND', listClass: 'info' },
    { label: "已出库", value: 'OUTBOUND', listClass: 'default' },
    { label: "HOLD", value: 'HOLD', listClass: 'warning' },
  ],
  wms_pallet_type: [
    { label: "普通", value: 'NORMAL', listClass: 'info' },
    { label: "退货", value: 'RETURN', listClass: 'warning' },
  ],
  wms_inventory_lock_status: [
    { label: "已锁定", value: 'LOCKED', listClass: 'warning' },
    { label: "已释放", value: 'RELEASED', listClass: 'default' },
    { label: "已消耗", value: 'CONSUMED', listClass: 'success' },
  ],
  wms_inventory_transaction_type: [
    { label: "收货", value: 'RECEIVE', listClass: 'success' },
    { label: "打板", value: 'PALLETIZE', listClass: 'info' },
    { label: "上架", value: 'PUTAWAY', listClass: 'info' },
    { label: "移库", value: 'MOVE', listClass: 'info' },
    { label: "锁定", value: 'LOCK', listClass: 'warning' },
    { label: "释放", value: 'UNLOCK', listClass: 'default' },
    { label: "出库", value: 'OUTBOUND', listClass: 'success' },
    { label: "盘点", value: 'COUNT', listClass: 'warning' },
    { label: "调整", value: 'ADJUST', listClass: 'warning' },
    { label: "异常", value: 'EXCEPTION', listClass: 'error' },
  ],
  wms_devanning_method: [
    { label: '人工', value: 'MANUAL' },
    { label: '叉车', value: 'FORKLIFT', listClass: 'info' },
    { label: '机械', value: 'MACHINE', listClass: 'primary' }
  ],
  wms_devanning_status: [
    { label: '未提柜', value: 'UNPICKEDUP' },
    { label: '已提柜', value: 'PICKEDUP', listClass: 'info' },
    { label: '已到仓', value: 'ARRIVED', listClass: 'processing' },
    { label: '拆柜中', value: 'DEVANNING', listClass: 'warning' },
    { label: '拆柜完成', value: 'DEVANNED', listClass: 'success' },
    { label: '异常', value: 'EXCEPTION', listClass: 'error' },
    { label: '取消', value: 'CANCELLED' }
  ],
  wms_timeliness_level: [
    { label: 'A级', value: 'A', listClass: 'error' },
    { label: 'B级', value: 'B', listClass: 'warning' },
    { label: 'C级', value: 'C', listClass: 'default' }
  ],
  wms_devanning_operation_status: [
    { label: '已打拆柜单', value: 'ORDER_PRINTED', listClass: 'success' },
    { label: '未打拆柜单', value: 'NOT_PRINTED', listClass: 'default' }
  ],
  oms_timeliness_level: [
    { label: 'T（第一等级）', value: 'T', listClass: 'error' },
    { label: 'K（第二等级）', value: 'K', listClass: 'warning' },
    { label: '普船（第三等级）', value: 'NORMAL_SHIP', listClass: 'default' }
  ],
  oms_address_type: [
    { label: "平台仓", value: 'PLATFORM_WH' },
    { label: "私仓", value: 'PRIVATE' },
    { label: "商业地址", value: 'COMMERCIAL' },
  ],
  oms_inbound_outbound_status: [
    { label: '未出库', value: 'NOT_OUTBOUND', listClass: 'default' },
    { label: '已出库', value: 'OUTBOUND', listClass: 'success' }
  ],
  oms_parcel_carrier: [
    { label: "UPS", value: 'UPS', listClass: 'primary' },
    { label: "FedEx", value: 'FedEx', listClass: 'info' },
    { label: "USPS", value: 'USPS', listClass: 'success' },
    { label: "DHL", value: 'DHL', listClass: 'warning' },
    { label: "OnTrac", value: 'OnTrac' },
    { label: "LaserShip", value: 'LaserShip' },
    { label: "Amazon Shipping", value: 'Amazon Shipping' },
  ],
  oms_platform_appointment_status: [
    { label: '未使用', value: 'UNUSED' },
    { label: '已使用', value: 'USED', listClass: 'info' },
    { label: '已交仓', value: 'DELIVERED', listClass: 'success' },
    { label: '已取消', value: 'CANCELLED', listClass: 'default' }
  ],
  oms_platform_appointment_type: [
    { label: 'FBA送仓', value: 'FBA_DELIVERY', listClass: 'primary' },
    { label: '转运', value: 'TRANSFER', listClass: 'info' },
    { label: '提空', value: 'EMPTY_PICKUP', listClass: 'warning' }
  ],
  oms_platform_appointment_tag: [
    { label: '推约', value: 'PUSH_APPOINTMENT', listClass: 'warning' },
    { label: '删约', value: 'DELETE_APPOINTMENT', listClass: 'error' },
    { label: '平台删约', value: 'PLATFORM_DELETE', listClass: 'default' }
  ],
  oms_supplier_type: [
    { label: '提柜供应商', value: 'DRAYAGE', listClass: 'info' },
    { label: '卡派供应商', value: 'LINEHAUL', listClass: 'primary' },
    { label: 'LTL供应商', value: 'LTL', listClass: 'success' },
    { label: '拆柜/装车供应商', value: 'DEVANNING_LOADING', listClass: 'warning' }
  ],
  oms_supplier_status: [
    { label: '启用', value: 'ENABLED', listClass: 'success' },
    { label: '停用', value: 'DISABLED', listClass: 'default' }
  ],
  oms_supplier_bill_status: [
    { label: '草稿', value: 'DRAFT', listClass: 'default' },
    { label: '供应商已确认', value: 'SUPPLIER_CONFIRMED', listClass: 'info' },
    { label: '待审核', value: 'PENDING_AUDIT', listClass: 'warning' },
    { label: '仓库已确认', value: 'WAREHOUSE_CONFIRMED', listClass: 'info' },
    { label: '财务已审核', value: 'FINANCE_APPROVED', listClass: 'success' },
    { label: '已付款', value: 'PAID', listClass: 'success' },
    { label: '已驳回', value: 'REJECTED', listClass: 'error' }
  ],
  oms_supplier_equipment_type: [
    { label: '叉车', value: 'FORKLIFT' },
    { label: 'PDA', value: 'PDA' },
    { label: '打印机', value: 'PRINTER' },
    { label: '触摸屏', value: 'TOUCH_SCREEN' }
  ],
  oms_supplier_equipment_status: [
    { label: '空闲', value: 'IDLE', listClass: 'success' },
    { label: '使用中', value: 'IN_USE', listClass: 'warning' },
    { label: '维修中', value: 'MAINTENANCE', listClass: 'error' },
    { label: '已报废', value: 'RETIRED', listClass: 'default' }
  ],
  oms_devanning_method: [
    { label: "人工拆柜", value: 'MANUAL' },
    { label: "叉车拆柜", value: 'FORKLIFT' },
    { label: "流水线拆柜", value: 'CONVEYOR' },
    { label: "混合拆柜", value: 'MIXED' },
  ],
  oms_loading_type: [
    { label: "散装", value: 'FLOOR' },
    { label: "打板", value: 'PALLET' },
    { label: "混装", value: 'MIXED' },
  ],
  oms_container_hold_type: [
    { label: "海关Hold", value: 'CUSTOMS', listClass: 'error' },
    { label: "船公司Hold", value: 'CARRIER', listClass: 'warning' },
    { label: "码头Hold", value: 'TERMINAL', listClass: 'warning' },
    { label: "费用Hold", value: 'FEE' },
  ],
  oms_container_exam_type: [
    { label: "X-Ray", value: 'X_RAY' },
    { label: "Tailgate", value: 'TAILGATE' },
    { label: "Intensive", value: 'INTENSIVE', listClass: 'warning' },
    { label: "CES", value: 'CES' },
  ],
  oms_container_operation_status: [
    { label: '已提柜', value: 'PICKED_UP', listClass: 'warning' },
    { label: '已到仓', value: 'ARRIVED_WAREHOUSE', listClass: 'success' },
    { label: '安排DOCK', value: 'DOCK_SCHEDULED', listClass: 'info' },
    { label: '待上DOCK', value: 'PENDING_DOCK', listClass: 'warning' },
    { label: '拆柜中', value: 'DEVANNING', listClass: 'warning' },
    { label: '拆柜完成', value: 'DEVANNED', listClass: 'success' }
  ],
  oms_cargo_operation_status: [
    { label: '已入库', value: 'INBOUNDED', listClass: 'success' },
    { label: '已生成车次', value: 'TRIP_GENERATED', listClass: 'info' },
    { label: '已安排派送供应商', value: 'SUPPLIER_DISPATCHED', listClass: 'success' }
  ],
  oms_outbound_operation_status: [
    { label: '已登记', value: 'REGISTERED' },
    { label: '出库中', value: 'OUTBOUNDING', listClass: 'warning' },
    { label: '出库完成', value: 'OUTBOUND_COMPLETED', listClass: 'success' }
  ],
  oms_cargo_fulfillment_status: [
    { label: "待接单", value: 'PENDING_ACCEPT' },
    { label: "已接单", value: 'ACCEPTED', listClass: 'info' },
    { label: "在途", value: 'IN_TRANSIT', listClass: 'info' },
    { label: "已到港", value: 'ARRIVED_PORT', listClass: 'warning' },
    { label: "已提柜", value: 'PICKED_UP', listClass: 'warning' },
    { label: "已到仓", value: 'ARRIVED_WAREHOUSE', listClass: 'warning' },
    { label: "拆柜中", value: 'DEVANNING', listClass: 'warning' },
    { label: "拆柜完成", value: 'DEVANNED', listClass: 'warning' },
    { label: "已入库", value: 'INBOUNDED', listClass: 'success' },
    { label: "已排车次", value: 'OUTBOUND_ORDERED', listClass: 'success' },
    { label: "已预约派送", value: 'DELIVERY_APPOINTED', listClass: 'success' },
    { label: "已出库", value: 'OUTBOUNDED', listClass: 'success' },
    { label: "派送中", value: 'DELIVERING', listClass: 'primary' },
    { label: "已签收", value: 'DELIVERED', listClass: 'success' },
    { label: "POD已回传", value: 'POD_UPLOADED', listClass: 'success' },
    { label: "已出账单", value: 'BILLED', listClass: 'success' },
    { label: "已完成", value: 'COMPLETED', listClass: 'success' },
    { label: "异常中", value: 'EXCEPTION', listClass: 'error' },
    { label: "已取消", value: 'CANCELLED' },
  ],
  oms_cargo_billing_status: [
    { label: "未出账单", value: 'UNBILLED' },
    { label: "已出账单", value: 'BILLED', listClass: 'success' },
    { label: "已作废", value: 'VOIDED', listClass: 'default' },
  ],
  oms_attachment_type: [
    { label: "DO", value: 'DO', listClass: 'primary' },
    { label: "BOL/提单", value: 'BOL' },
    { label: "POD", value: 'POD', listClass: 'success' },
    { label: "发票", value: 'INVOICE' },
    { label: "异常图片", value: 'EXCEPTION_IMAGE', listClass: 'error' },
    { label: "客户文件", value: 'CUSTOMER_FILE', listClass: 'info' },
    { label: "其他", value: 'OTHER' },
  ],
  oms_cargo_grouping_rule_status: [
    { label: "启用", value: 'ENABLED', listClass: 'success' },
    { label: "停用", value: 'DISABLED', listClass: 'danger' },
  ],
  oms_business_rule_category: [
    { label: '订单规则', value: 'ORDER', listClass: 'primary' },
    { label: '入库与拆柜', value: 'INBOUND_DEVANNING', listClass: 'info' },
    { label: '库位推荐', value: 'LOCATION', listClass: 'success' },
    { label: '调度与车次', value: 'DISPATCH', listClass: 'warning' },
    { label: '出库与装车', value: 'OUTBOUND', listClass: 'error' },
    { label: '异常与预警', value: 'EXCEPTION_ALERT', listClass: 'error' },
    { label: '费用与账单', value: 'FEE_BILL', listClass: 'default' },
    { label: '通知与任务', value: 'NOTIFY_TASK', listClass: 'info' }
  ],
  oms_business_rule_status: [
    { label: '启用', value: 'enabled', listClass: 'success' },
    { label: '停用', value: 'disabled', listClass: 'default' },
    { label: '草稿', value: 'draft', listClass: 'warning' }
  ],
  oms_business_rule_priority_tier: [
    { label: 'P0 禁止/安全', value: 'P0', listClass: 'error' },
    { label: 'P1 客户强制', value: 'P1', listClass: 'warning' },
    { label: 'P2 业务强制', value: 'P2', listClass: 'warning' },
    { label: 'P3 仓库运营', value: 'P3', listClass: 'info' },
    { label: 'P4 效率推荐', value: 'P4', listClass: 'primary' },
    { label: 'P5 普通提醒', value: 'P5', listClass: 'default' }
  ],
  oms_business_rule_action_level: [
    { label: '提示', value: 'HINT', listClass: 'default' },
    { label: '预警', value: 'WARN', listClass: 'warning' },
    { label: '强提醒', value: 'STRONG_WARN', listClass: 'warning' },
    { label: '阻止', value: 'BLOCK', listClass: 'error' },
    { label: '自动执行', value: 'AUTO', listClass: 'success' }
  ],
  oms_business_rule_conflict_strategy: [
    { label: '首条命中', value: 'FIRST_MATCH' },
    { label: '禁止优先', value: 'FIRST_BLOCK_WINS' },
    { label: '非阻止全部执行', value: 'ALL_NON_BLOCK' },
    { label: '需人工确认', value: 'MANUAL_CONFIRM' }
  ],
  oms_approval_flow_category: [
    { label: '费用审批流', value: 'FEE', listClass: 'primary' },
    { label: '供应商账单审批流', value: 'SUPPLIER_BILL', listClass: 'info' },
    { label: '异常赔付审批流', value: 'EXCEPTION_COMPENSATION', listClass: 'warning' },
    { label: '操作调整审批流', value: 'OPERATION_ADJUSTMENT', listClass: 'success' },
    { label: '权限变更审批流', value: 'PERMISSION_CHANGE', listClass: 'error' },
    { label: '价格修改审批流', value: 'PRICE_MODIFY', listClass: 'warning' },
    { label: '删除数据审批流', value: 'DATA_DELETE', listClass: 'error' },
    { label: '临时授权审批流', value: 'TEMP_AUTH', listClass: 'info' }
  ],
  oms_approval_flow_status: [
    { label: '启用', value: 'enabled', listClass: 'success' },
    { label: '停用', value: 'disabled', listClass: 'default' },
    { label: '草稿', value: 'draft', listClass: 'warning' }
  ],
  print_template_type: [
    { label: '卡板贴', value: 'pallet_label', listClass: 'primary' },
    { label: '拆柜单', value: 'devanning', listClass: 'info' },
    { label: 'BOL提单', value: 'bol', listClass: 'primary' },
    { label: '报表', value: 'report', listClass: 'success' },
    { label: '发票', value: 'invoice', listClass: 'warning' },
    { label: '箱贴', value: 'carton', listClass: 'default' },
    { label: '库位标签', value: 'location', listClass: 'info' },
    { label: '自定义单据', value: 'custom', listClass: 'default' }
  ],
  print_template_status: [
    { label: '草稿', value: 'draft', listClass: 'default' },
    { label: '测试中', value: 'testing', listClass: 'warning' },
    { label: '待审批', value: 'pending_approval', listClass: 'warning' },
    { label: '已发布', value: 'published', listClass: 'success' },
    { label: '已停用', value: 'disabled', listClass: 'error' },
    { label: '已归档', value: 'archived', listClass: 'default' }
  ],
  print_task_status: [
    { label: '待打印', value: 'pending', listClass: 'warning' },
    { label: '打印中', value: 'printing', listClass: 'info' },
    { label: '已完成', value: 'completed', listClass: 'success' },
    { label: '失败', value: 'failed', listClass: 'error' }
  ],
  print_doc_type: [
    { label: '卡板贴', value: 'pallet_label', listClass: 'primary' },
    { label: '拆柜单', value: 'devanning', listClass: 'info' },
    { label: 'BOL提单', value: 'bol', listClass: 'primary' },
    { label: '发票', value: 'invoice', listClass: 'warning' },
    { label: '报表', value: 'report', listClass: 'success' },
    { label: '库位标签', value: 'location', listClass: 'info' },
    { label: '箱贴', value: 'carton', listClass: 'default' },
    { label: '自定义', value: 'custom', listClass: 'default' }
  ],
  print_printer_type: [
    { label: 'A4 打印机', value: 'a4' },
    { label: '标签打印机', value: 'label' },
    { label: '热敏打印机', value: 'thermal' },
    { label: '条码打印机', value: 'barcode' },
    { label: '工业打印机', value: 'industrial' }
  ],
  print_printer_online: [
    { label: '在线', value: 'online', listClass: 'success' },
    { label: '离线', value: 'offline', listClass: 'default' },
    { label: '异常', value: 'error', listClass: 'error' }
  ],
  print_record_result: [
    { label: '成功', value: 'success', listClass: 'success' },
    { label: '失败', value: 'failed', listClass: 'error' }
  ],
  print_invoice_subtype: [
    { label: '海柜费用发票', value: 'sea_container', listClass: 'primary' },
    { label: '卡车派送费用发票', value: 'truck_delivery', listClass: 'info' },
    { label: '拆柜费用发票', value: 'devanning', listClass: 'warning' },
    { label: '装车费用发票', value: 'loading', listClass: 'success' },
    { label: '自定义费用发票', value: 'custom_fee', listClass: 'default' }
  ],
  yms_zone_type: [
    { label: "集装箱区", value: 'CONTAINER' },
    { label: "卡车区", value: 'TRUCK' },
    { label: "自提区", value: 'SELF_PICKUP' },
    { label: "停车区", value: 'PARKING' },
  ],
  yms_task_type: [
    { label: "拆柜", value: 'DEVANNING' },
    { label: "派送装车", value: 'DELIVERY_LOADING' },
    { label: "调拨装车", value: 'TRANSFER_LOADING' },
    { label: "提货装车", value: 'PICKUP_LOADING' },
    { label: "退货装车", value: 'RETURN_LOADING' },
    { label: "院内搬运", value: 'INTERNAL_MOVE' },
    { label: "园区盘点", value: 'YARD_INVENTORY' },
  ],
  yms_internal_task_type: [
    { label: "集装箱上口", value: 'CONTAINER_TO_DOCK' },
    { label: "集装箱下口", value: 'CONTAINER_OFF_DOCK' },
    { label: "车厢上口", value: 'TRAILER_TO_DOCK' },
    { label: "车厢下口", value: 'TRAILER_OFF_DOCK' },
    { label: "院内搬箱", value: 'CONTAINER_MOVE' },
    { label: "院内搬车厢", value: 'TRAILER_MOVE' },
    { label: "空柜还箱", value: 'EMPTY_CONTAINER_RETURN' },
    { label: "园区盘点", value: 'YARD_INVENTORY_SCAN' },
  ],
  yms_internal_task_status: [
    { label: "待分配", value: 'PENDING' },
    { label: "已分配", value: 'ASSIGNED', listClass: 'info' },
    { label: "已接单", value: 'ACCEPTED', listClass: 'warning' },
    { label: "执行中", value: 'IN_PROGRESS', listClass: 'primary' },
    { label: "已完成", value: 'COMPLETED', listClass: 'success' },
    { label: "失败", value: 'FAILED', listClass: 'error' },
    { label: "已取消", value: 'CANCELLED' },
  ],
  yms_trailer_status: [
    { label: "预计到场", value: 'EXPECTED_ARRIVAL' },
    { label: "空车已到", value: 'ARRIVED_EMPTY', listClass: 'info' },
    { label: "等待装车", value: 'WAIT_LOADING', listClass: 'warning' },
    { label: "在口位", value: 'ON_DOCK', listClass: 'primary' },
    { label: "装车中", value: 'LOADING', listClass: 'primary' },
    { label: "装车完成", value: 'LOADED', listClass: 'success' },
    { label: "等待提走", value: 'WAIT_PICKUP', listClass: 'warning' },
    { label: "已离场", value: 'LEFT_YARD', listClass: 'default' },
    { label: "异常", value: 'EXCEPTION', listClass: 'error' },
  ],
  yms_vehicle_source: [
    { label: "供应商车辆", value: 'SUPPLIER_TRUCK' },
    { label: "租赁车厢", value: 'RENTED_TRAILER' },
    { label: "自有车厢", value: 'OWN_TRAILER' },
    { label: "临时车辆", value: 'TEMP_TRUCK' },
  ],
  yms_container_status: [
    { label: "预计到场", value: 'EXPECTED_ARRIVAL' },
    { label: "在途", value: 'IN_TRANSIT', listClass: 'info' },
    { label: "已到园区", value: 'ARRIVED', listClass: 'primary' },
    { label: "已放箱", value: 'DROPPED', listClass: 'warning' },
    { label: "等待拆柜", value: 'WAIT_DEVANNING', listClass: 'warning' },
    { label: "在口位", value: 'ON_DOCK', listClass: 'primary' },
    { label: "拆柜中", value: 'DEVANNING', listClass: 'primary' },
    { label: "拆柜完成", value: 'DEVANNED', listClass: 'success' },
    { label: "空柜待还", value: 'EMPTY_WAIT_RETURN', listClass: 'warning' },
    { label: "已还箱", value: 'RETURNED', listClass: 'success' },
    { label: "已离园", value: 'LEFT_YARD', listClass: 'default' },
    { label: "异常", value: 'EXCEPTION', listClass: 'error' },
  ],
  yms_position_type: [
    { label: "集装箱位", value: 'CONTAINER_SLOT' },
    { label: "空柜位", value: 'EMPTY_CONTAINER_SLOT' },
    { label: "车厢位", value: 'TRAILER_SLOT' },
    { label: "临时等待位", value: 'WAITING_SLOT' },
    { label: "封锁位", value: 'BLOCKED_SLOT' },
  ],
  yms_position_status: [
    { label: "空闲", value: 'FREE', listClass: 'success' },
    { label: "占用中", value: 'OCCUPIED', listClass: 'primary' },
    { label: "已预占", value: 'RESERVED', listClass: 'warning' },
    { label: "禁用", value: 'DISABLED', listClass: 'default' },
  ],
  yms_inventory_type: [
    { label: "分区盘点", value: 'ZONE' },
    { label: "全园盘点", value: 'FULL' },
    { label: "指定列表", value: 'CONTAINER_LIST' },
  ],
  yms_inventory_status: [
    { label: "未开始", value: 'PENDING', listClass: 'default' },
    { label: "盘点中", value: 'IN_PROGRESS', listClass: 'warning' },
    { label: "已完成", value: 'COMPLETED', listClass: 'success' },
    { label: "有差异", value: 'DIFF_FOUND', listClass: 'warning' },
  ],
  yms_inventory_scan_status: [
    { label: "待扫", value: 'PENDING', listClass: 'default' },
    { label: "已扫", value: 'SCANNED', listClass: 'success' },
    { label: "缺失", value: 'MISSING', listClass: 'error' },
    { label: "多余", value: 'EXTRA', listClass: 'warning' },
  ],
  yms_inventory_diff_type: [
    { label: "缺失", value: 'MISSING', listClass: 'error' },
    { label: "多余", value: 'EXTRA', listClass: 'warning' },
    { label: "位置不符", value: 'POSITION_MISMATCH', listClass: 'warning' },
    { label: "状态不符", value: 'STATUS_MISMATCH', listClass: 'warning' },
  ],
  yard_zone_type: [
    { label: "集装箱区", value: 'CONTAINER' },
    { label: "卡车区", value: 'TRUCK' },
    { label: "自提区", value: 'SELF_PICKUP' },
    { label: "停车区", value: 'PARKING' },
  ],
  yard_location_type: [
    { label: "口位", value: 'DOCK', listClass: 'info' },
    { label: "停车位", value: 'PARKING' },
  ],
  yard_dock_location: [
    { label: "前院口位", value: 'FRONT_YARD_DOCK', listClass: 'success' },
    { label: "后院口位", value: 'BACK_YARD_DOCK', listClass: 'info' },
    { label: "前院停车位", value: 'FRONT_YARD_PARKING', listClass: 'warning' },
    { label: "后院停车位", value: 'BACK_YARD_PARKING' },
  ],
  wms_outbound_direction: [
    { label: '派送', value: 'DELIVERY' },
    { label: '调拨', value: 'TRANSFER' }
  ],
  wms_outbound_status: [
    { label: '已创建', value: 'CREATED' },
    { label: '已派发', value: 'DISPATCHED', listClass: 'info' },
    { label: '已出库', value: 'OUTBOUNDED', listClass: 'warning' },
    { label: '派送中', value: 'DELIVERING', listClass: 'primary' },
    { label: '已送达', value: 'DELIVERED', listClass: 'success' },
    { label: '已完成', value: 'COMPLETED', listClass: 'success' },
    { label: '已取消', value: 'CANCELLED' }
  ],
  wms_inbound_status: [
    { label: '待入库', value: 'PENDING' }
  ],
  wms_putaway_mode: [
    { label: '单板', value: 'SINGLE' },
    { label: '批量', value: 'BATCH', listClass: 'primary' }
  ],
  wms_putaway_status: [
    { label: '待上架', value: 'PENDING' },
    { label: '已分配', value: 'ASSIGNED', listClass: 'info' },
    { label: '上架中', value: 'IN_PROGRESS', listClass: 'warning' },
    { label: '已完成', value: 'COMPLETED', listClass: 'success' }
  ],
  wms_operation_type: [
    { label: "换标", value: 'RELABEL' },
    { label: "贴标", value: 'LABEL' },
    { label: "拍照", value: 'PHOTO' },
    { label: "质检", value: 'QC' },
    { label: "组套", value: 'KIT' },
    { label: "重包装", value: 'REPACK' },
    { label: "拆包", value: 'UNPACK' }
  ],
  wms_operation_status: [
    { label: "已创建", value: 'CREATED' },
    { label: "执行中", value: 'IN_PROGRESS', listClass: 'warning' },
    { label: "已完成", value: 'COMPLETED', listClass: 'success' },
    { label: "已取消", value: 'CANCELLED' }
  ],
  wms_vas_type: [
    { label: "贴标", value: 'LABEL' },
    { label: "重包装", value: 'REPACK' },
    { label: "拍照", value: 'PHOTO' }
  ],
  wms_vas_status: [
    { label: "待作业", value: 'PENDING' },
    { label: "作业中", value: 'WORKING', listClass: 'warning' },
    { label: "已完成", value: 'COMPLETED', listClass: 'success' }
  ],
  wms_stock_prep_status: [
    { label: "已创建", value: 'CREATED' },
    { label: "备货中", value: 'PREPARING', listClass: 'warning' },
    { label: "已完成", value: 'COMPLETED', listClass: 'success' }
  ]
};

const MOCK_DICT_MAP: Record<string, Api.System.DictData[]> = Object.fromEntries(
  Object.entries(DICT_DEFINITIONS).map(([type, items]) => [type, build(type, items)])
);

export function getMockDictByType(dictType: string): Api.System.DictData[] {
  if (MOCK_DICT_MAP[dictType]) {
    return MOCK_DICT_MAP[dictType];
  }
  return build(dictType, [
    { label: '选项一', value: 'OPTION_1' },
    { label: '选项二', value: 'OPTION_2' },
    { label: '选项三', value: 'OPTION_3' }
  ]);
}

export function getAllMockDictTypes(): string[] {
  return Object.keys(MOCK_DICT_MAP);
}
