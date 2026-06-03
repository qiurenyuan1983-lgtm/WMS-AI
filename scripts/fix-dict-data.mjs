import fs from 'fs';
import path from 'path';

const fp = path.resolve('src/mock/dict-data.ts');
let content = fs.readFileSync(fp, 'utf8');

const LABELS = {
  sys_normal_disable: { '0': '\u6b63\u5e38', '1': '\u505c\u7528' },
  sys_user_sex: { '0': '\u7537', '1': '\u5973', '2': '\u672a\u77e5' },
  sys_yes_no: { Y: '\u662f', N: '\u5426' },
  sys_show_hide: { '0': '\u663e\u793a', '1': '\u9690\u85cf' },
  sys_notice_type: { '1': '\u901a\u77e5', '2': '\u516c\u544a' },
  sys_grant_type: { password: '\u5bc6\u7801\u6a21\u5f0f', client_credentials: '\u5ba2\u6237\u7aef\u6a21\u5f0f' },
  sys_device_type: { pc: 'PC', mobile: '\u79fb\u52a8\u7aef' },
  sys_common_status: { '0': '\u6210\u529f', '1': '\u5931\u8d25' },
  sys_oper_type: {
    '0': '\u5176\u5b83',
    '1': '\u65b0\u589e',
    '2': '\u4fee\u6539',
    '3': '\u5220\u9664'
  },
  wms_zone_type: {
    EXPRESS: '\u5feb\u9012\u533a',
    TEMP: '\u6682\u5b58\u533a',
    PRIVATE: '\u79c1\u8d27\u5e93\u533a',
    EXCEPTION: '\u5f02\u5e38\u533a'
  },
  wms_zone_status: { ENABLED: '\u542f\u7528', DISABLED: '\u505c\u7528' },
  wms_storage_method: { FLOOR: '\u5730\u9762', RACK: '\u8d27\u67b6' },
  wms_location_status: { NORMAL: '\u6b63\u5e38', DISABLED: '\u505c\u7528', LOCKED: '\u9501\u5b9a' },
  wms_inventory_status: {
    IN_STOCK: '\u5728\u5e93',
    PARTIAL_OUT: '\u90e8\u5206\u51fa\u5e93',
    DEPLETED: '\u5df2\u51fa\u6e05',
    HOLD: '\u51bb\u7ed3'
  },
  wms_pallet_status: {
    IN_STOCK: '\u5728\u5e93',
    PRE_OUTBOUND: '\u5f85\u51fa\u5e93',
    OUTBOUND: '\u5df2\u51fa\u5e93',
    HOLD: 'HOLD'
  },
  wms_pallet_type: { NORMAL: '\u666e\u901a', RETURN: '\u9000\u8d27' },
  wms_inventory_lock_status: {
    LOCKED: '\u5df2\u9501\u5b9a',
    RELEASED: '\u5df2\u91ca\u653e',
    CONSUMED: '\u5df2\u6d88\u8017'
  },
  wms_inventory_transaction_type: {
    RECEIVE: '\u6536\u8d27',
    PALLETIZE: '\u6253\u677f',
    PUTAWAY: '\u4e0a\u67b6',
    MOVE: '\u79fb\u5e93',
    LOCK: '\u9501\u5b9a',
    UNLOCK: '\u91ca\u653e',
    OUTBOUND: '\u51fa\u5e93',
    COUNT: '\u76d8\u70b9',
    ADJUST: '\u8c03\u6574',
    EXCEPTION: '\u5f02\u5e38'
  },
  wms_devanning_method: { MANUAL: '\u4eba\u5de5', FORKLIFT: '\u53c9\u8f66', MACHINE: '\u673a\u68b0' },
  wms_devanning_status: {
    UNPICKEDUP: '\u672a\u63d0\u67dc',
    PICKEDUP: '\u5df2\u63d0\u67dc',
    ARRIVED: '\u5df2\u5230\u4ed3',
    DEVANNING: '\u62c6\u67dc\u4e2d',
    DEVANNED: '\u62c6\u67dc\u5b8c\u6210',
    EXCEPTION: '\u5f02\u5e38',
    CANCELLED: '\u53d6\u6d88'
  },
  oms_address_type: {
    PLATFORM_WH: '\u5e73\u53f0\u4ed3',
    PRIVATE: '\u79c1\u4ed3',
    COMMERCIAL: '\u5546\u4e1a\u5730\u5740'
  },
  oms_parcel_carrier: {
    UPS: 'UPS',
    FedEx: 'FedEx',
    USPS: 'USPS',
    DHL: 'DHL',
    OnTrac: 'OnTrac',
    LaserShip: 'LaserShip',
    'Amazon Shipping': 'Amazon Shipping'
  },
  oms_devanning_method: {
    MANUAL: '\u4eba\u5de5\u62c6\u67dc',
    FORKLIFT: '\u53c9\u8f66\u62c6\u67dc',
    CONVEYOR: '\u6d41\u6c34\u7ebf\u62c6\u67dc',
    MIXED: '\u6df7\u5408\u62c6\u67dc'
  },
  oms_loading_type: { FLOOR: '\u6563\u88c5', PALLET: '\u6253\u677f', MIXED: '\u6df7\u88c5' },
  oms_container_hold_type: {
    CUSTOMS: '\u6d77\u5173Hold',
    CARRIER: '\u8239\u516c\u53f8Hold',
    TERMINAL: '\u7801\u5934Hold',
    FEE: '\u8d39\u7528Hold'
  },
  oms_container_exam_type: {
    X_RAY: 'X-Ray',
    TAILGATE: 'Tailgate',
    INTENSIVE: 'Intensive',
    CES: 'CES'
  },
  oms_cargo_fulfillment_status: {
    PENDING_ACCEPT: '\u5f85\u63a5\u5355',
    ACCEPTED: '\u5df2\u63a5\u5355',
    IN_TRANSIT: '\u5728\u9014',
    ARRIVED_PORT: '\u5df2\u5230\u6e2f',
    PICKED_UP: '\u5df2\u63d0\u67dc',
    ARRIVED_WAREHOUSE: '\u5df2\u5230\u4ed3',
    DEVANNING: '\u62c6\u67dc\u4e2d',
    DEVANNED: '\u62c6\u67dc\u5b8c\u6210',
    INBOUNDED: '\u5df2\u5165\u5e93',
    OUTBOUND_ORDERED: '\u5df2\u51fa\u5e93\u5355',
    DELIVERY_APPOINTED: '\u5df2\u9884\u7ea6\u6d3e\u9001',
    OUTBOUNDED: '\u5df2\u51fa\u5e93',
    DELIVERING: '\u6d3e\u9001\u4e2d',
    DELIVERED: '\u5df2\u7b7e\u6536',
    POD_UPLOADED: 'POD\u5df2\u56de\u4f20',
    BILLED: '\u5df2\u51fa\u8d26\u5355',
    COMPLETED: '\u5df2\u5b8c\u6210',
    EXCEPTION: '\u5f02\u5e38\u4e2d',
    CANCELLED: '\u5df2\u53d6\u6d88'
  },
  oms_cargo_billing_status: {
    UNBILLED: '\u672a\u51fa\u8d26\u5355',
    BILLED: '\u5df2\u51fa\u8d26\u5355',
    VOIDED: '\u5df2\u4f5c\u5e9f'
  },
  oms_attachment_type: {
    DO: 'DO',
    BOL: 'BOL/\u63d0\u5355',
    POD: 'POD',
    INVOICE: '\u53d1\u7968',
    EXCEPTION_IMAGE: '\u5f02\u5e38\u56fe\u7247',
    CUSTOMER_FILE: '\u5ba2\u6237\u6587\u4ef6',
    OTHER: '\u5176\u4ed6'
  },
  oms_cargo_grouping_rule_status: { ENABLED: '\u542f\u7528', DISABLED: '\u505c\u7528' },
  yms_zone_type: {
    CONTAINER: '\u96c6\u88c5\u7bb1\u533a',
    TRUCK: '\u5361\u8f66\u533a',
    SELF_PICKUP: '\u81ea\u63d0\u533a',
    PARKING: '\u505c\u8f66\u533a'
  },
  yms_task_type: {
    DEVANNING: '\u62c6\u67dc',
    DELIVERY_LOADING: '\u6d3e\u9001\u88c5\u8f66',
    TRANSFER_LOADING: '\u8c03\u62e8\u88c5\u8f66',
    PICKUP_LOADING: '\u63d0\u8d27\u88c5\u8f66',
    RETURN_LOADING: '\u9000\u8d27\u88c5\u8f66',
    INTERNAL_MOVE: '\u9662\u5185\u642c\u8fd0',
    YARD_INVENTORY: '\u56ed\u533a\u76d8\u70b9'
  },
  yms_internal_task_type: {
    CONTAINER_TO_DOCK: '\u96c6\u88c5\u7bb1\u4e0a\u53e3',
    CONTAINER_OFF_DOCK: '\u96c6\u88c5\u7bb1\u4e0b\u53e3',
    TRAILER_TO_DOCK: '\u8f66\u53a2\u4e0a\u53e3',
    TRAILER_OFF_DOCK: '\u8f66\u53a2\u4e0b\u53e3',
    CONTAINER_MOVE: '\u9662\u5185\u642c\u7bb1',
    TRAILER_MOVE: '\u9662\u5185\u642c\u8f66\u53a2',
    EMPTY_CONTAINER_RETURN: '\u7a7a\u67dc\u8fd8\u7bb1',
    YARD_INVENTORY_SCAN: '\u56ed\u533a\u76d8\u70b9'
  },
  yms_internal_task_status: {
    PENDING: '\u5f85\u5206\u914d',
    ASSIGNED: '\u5df2\u5206\u914d',
    ACCEPTED: '\u5df2\u63a5\u5355',
    IN_PROGRESS: '\u6267\u884c\u4e2d',
    COMPLETED: '\u5df2\u5b8c\u6210',
    FAILED: '\u5931\u8d25',
    CANCELLED: '\u5df2\u53d6\u6d88'
  },
  yms_trailer_status: {
    EXPECTED_ARRIVAL: '\u9884\u8ba1\u5230\u573a',
    ARRIVED_EMPTY: '\u7a7a\u8f66\u5df2\u5230',
    WAIT_LOADING: '\u7b49\u5f85\u88c5\u8f66',
    ON_DOCK: '\u5728\u53e3\u4f4d',
    LOADING: '\u88c5\u8f66\u4e2d',
    LOADED: '\u88c5\u8f66\u5b8c\u6210',
    WAIT_PICKUP: '\u7b49\u5f85\u63d0\u8d70',
    LEFT_YARD: '\u5df2\u79bb\u573a',
    EXCEPTION: '\u5f02\u5e38'
  },
  yms_vehicle_source: {
    SUPPLIER_TRUCK: '\u4f9b\u5e94\u5546\u8f66\u8f86',
    RENTED_TRAILER: '\u79df\u8d41\u8f66\u53a2',
    OWN_TRAILER: '\u81ea\u6709\u8f66\u53a2',
    TEMP_TRUCK: '\u4e34\u65f6\u8f66\u8f86'
  },
  yms_container_status: {
    EXPECTED_ARRIVAL: '\u9884\u8ba1\u5230\u573a',
    IN_TRANSIT: '\u5728\u9014',
    ARRIVED: '\u5df2\u5230\u56ed\u533a',
    DROPPED: '\u5df2\u653e\u7bb1',
    WAIT_DEVANNING: '\u7b49\u5f85\u62c6\u67dc',
    ON_DOCK: '\u5728\u53e3\u4f4d',
    DEVANNING: '\u62c6\u67dc\u4e2d',
    DEVANNED: '\u62c6\u67dc\u5b8c\u6210',
    EMPTY_WAIT_RETURN: '\u7a7a\u67dc\u5f85\u8fd8',
    RETURNED: '\u5df2\u8fd8\u7bb1',
    LEFT_YARD: '\u5df2\u79bb\u56ed',
    EXCEPTION: '\u5f02\u5e38'
  },
  yms_position_type: {
    CONTAINER_SLOT: '\u96c6\u88c5\u7bb1\u4f4d',
    EMPTY_CONTAINER_SLOT: '\u7a7a\u67dc\u4f4d',
    TRAILER_SLOT: '\u8f66\u53a2\u4f4d',
    WAITING_SLOT: '\u4e34\u65f6\u7b49\u5f85\u4f4d',
    BLOCKED_SLOT: '\u5c01\u9501\u4f4d'
  },
  yms_position_status: {
    FREE: '\u7a7a\u95f2',
    OCCUPIED: '\u5360\u7528\u4e2d',
    RESERVED: '\u5df2\u9884\u5360',
    DISABLED: '\u7981\u7528'
  },
  yms_inventory_type: {
    ZONE: '\u5206\u533a\u76d8\u70b9',
    FULL: '\u5168\u56ed\u76d8\u70b9',
    CONTAINER_LIST: '\u6307\u5b9a\u5217\u8868'
  },
  yms_inventory_status: {
    PENDING: '\u672a\u5f00\u59cb',
    IN_PROGRESS: '\u76d8\u70b9\u4e2d',
    COMPLETED: '\u5df2\u5b8c\u6210',
    DIFF_FOUND: '\u6709\u5dee\u5f02'
  },
  yms_inventory_scan_status: {
    PENDING: '\u5f85\u626b',
    SCANNED: '\u5df2\u626b',
    MISSING: '\u7f3a\u5931',
    EXTRA: '\u591a\u4f59'
  },
  yms_inventory_diff_type: {
    MISSING: '\u7f3a\u5931',
    EXTRA: '\u591a\u4f59',
    POSITION_MISMATCH: '\u4f4d\u7f6e\u4e0d\u7b26',
    STATUS_MISMATCH: '\u72b6\u6001\u4e0d\u7b26'
  },
  yard_zone_type: {
    CONTAINER: '\u96c6\u88c5\u7bb1\u533a',
    TRUCK: '\u5361\u8f66\u533a',
    SELF_PICKUP: '\u81ea\u63d0\u533a',
    PARKING: '\u505c\u8f66\u533a'
  },
  yard_location_type: { DOCK: '\u53e3\u4f4d', PARKING: '\u505c\u8f66\u4f4d' },
  yard_dock_location: {
    FRONT_YARD_DOCK: '\u524d\u9662\u53e3\u4f4d',
    BACK_YARD_DOCK: '\u540e\u9662\u53e3\u4f4d',
    FRONT_YARD_PARKING: '\u524d\u9662\u505c\u8f66\u4f4d',
    BACK_YARD_PARKING: '\u540e\u9662\u505c\u8f66\u4f4d'
  },
  wms_outbound_direction: { DELIVERY: '\u6d3e\u9001', TRANSFER: '\u8c03\u62e8' },
  wms_outbound_status: {
    CREATED: '\u5df2\u521b\u5efa',
    DISPATCHED: '\u5df2\u6d3e\u53d1',
    OUTBOUNDED: '\u5df2\u51fa\u5e93',
    DELIVERING: '\u6d3e\u9001\u4e2d',
    DELIVERED: '\u5df2\u9001\u8fbe',
    COMPLETED: '\u5df2\u5b8c\u6210',
    CANCELLED: '\u5df2\u53d6\u6d88'
  },
  wms_inbound_status: {
    PENDING: '\u5f85\u5165\u5e93',
    IN_PROGRESS: '\u5165\u5e93\u4e2d',
    COMPLETED: '\u5df2\u5165\u5e93'
  },
  wms_putaway_mode: { SINGLE: '\u5355\u677f', BATCH: '\u6279\u91cf' },
  wms_putaway_status: {
    PENDING: '\u5f85\u4e0a\u67b6',
    ASSIGNED: '\u5df2\u5206\u914d',
    IN_PROGRESS: '\u4e0a\u67b6\u4e2d',
    COMPLETED: '\u5df2\u5b8c\u6210'
  },
  wms_operation_type: {
    RELABEL: '\u6362\u6807',
    LABEL: '\u8d34\u6807',
    PHOTO: '\u62cd\u7167',
    QC: '\u8d28\u68c0',
    KIT: '\u7ec4\u5957',
    REPACK: '\u91cd\u5305\u88c5',
    UNPACK: '\u62c6\u5305'
  },
  wms_operation_status: {
    CREATED: '\u5df2\u521b\u5efa',
    IN_PROGRESS: '\u6267\u884c\u4e2d',
    COMPLETED: '\u5df2\u5b8c\u6210',
    CANCELLED: '\u5df2\u53d6\u6d88'
  },
  wms_vas_type: { LABEL: '\u8d34\u6807', REPACK: '\u91cd\u5305\u88c5', PHOTO: '\u62cd\u7167' },
  wms_vas_status: {
    PENDING: '\u5f85\u4f5c\u4e1a',
    WORKING: '\u4f5c\u4e1a\u4e2d',
    COMPLETED: '\u5df2\u5b8c\u6210'
  },
  wms_stock_prep_status: {
    CREATED: '\u5df2\u521b\u5efa',
    PREPARING: '\u5907\u8d27\u4e2d',
    COMPLETED: '\u5df2\u5b8c\u6210'
  }
};

// fix typo in ADJUST label
LABELS.wms_inventory_transaction_type.ADJUST = '\u8c03\u6574';

let currentType = null;
const lines = content.split(/\r?\n/);
const out = lines.map(line => {
  const typeMatch = line.match(/^  ([\w-]+): \[/);
  if (typeMatch) currentType = typeMatch[1];

  const itemMatch = line.match(/^(\s*\{ label: )(?:"[^"]*"|'[^']*')(, value: '([^']+)')/);
  if (itemMatch && currentType && LABELS[currentType]?.[itemMatch[3]] !== undefined) {
    const label = LABELS[currentType][itemMatch[3]];
    const quote = line.includes('"') ? '"' : "'";
    return `${itemMatch[1]}${quote}${label}${quote}${itemMatch[2]}${line.slice(itemMatch[0].length)}`.replace(
      /^(\s*\{ label: "[^"]*", value: '[^']+')/,
      `${itemMatch[1]}"${label}"${itemMatch[2]}`
    );
  }

  // simpler replace for standard pattern
  const m = line.match(/^(\s*\{ label: )"([^"]*)"(, value: '([^']+)')/);
  if (m && currentType && LABELS[currentType]?.[m[4]]) {
    return `${m[1]}"${LABELS[currentType][m[4]]}"${m[3]}${line.slice(m[0].length)}`;
  }

  const m2 = line.match(/^(\s*\{ label: )'([^']*)'(, value: '([^']+)')/);
  if (m2 && currentType && LABELS[currentType]?.[m2[4]]) {
    return `${m2[1]}'${LABELS[currentType][m2[4]]}'${m2[3]}${line.slice(m2[0].length)}`;
  }

  // fallback default options at bottom
  if (line.includes("label: '") && line.includes('OPTION_')) {
    return line
      .replace("'OPTION_1'", "'OPTION_1'")
      .replace(/label: '[^']*', value: 'OPTION_1'/, "label: '\u9009\u9879\u4e00', value: 'OPTION_1'")
      .replace(/label: '[^']*', value: 'OPTION_2'/, "label: '\u9009\u9879\u4e8c', value: 'OPTION_2'")
      .replace(/label: '[^']*', value: 'OPTION_3'/, "label: '\u9009\u9879\u4e09', value: 'OPTION_3'");
  }

  return line.replace(/[\uFFFD]/g, '');
});

content = out.join('\n');

// second pass: replace any remaining bad labels using regex on value
let current = null;
content = content
  .split(/\r?\n/)
  .map(line => {
    const t = line.match(/^  ([\w-]+): \[/);
    if (t) current = t[1];
    const m = line.match(/^(\s*\{ label: )"([^"]*)"(, value: '([^']+)')/);
    if (m && current && LABELS[current]?.[m[4]]) {
      return `${m[1]}"${LABELS[current][m[4]]}"${m[3]}${line.slice(m[0].length)}`;
    }
    const m2 = line.match(/^(\s*\{ label: )'([^']*)'(, value: '([^']+)')/);
    if (m2 && current && LABELS[current]?.[m2[4]]) {
      return `${m2[1]}'${LABELS[current][m2[4]]}'${m2[3]}${line.slice(m2[0].length)}`;
    }
    return line;
  })
  .join('\n');

fs.writeFileSync(fp, content, 'utf8');
console.log('dict-data.ts labels fixed');

const remain = (content.match(/[\uFFFD]|\?{3,}/g) || []).length;
console.log('remaining bad chars:', remain);
