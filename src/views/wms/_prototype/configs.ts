/** PRD V1.0 仓库模块列表页原型配置（Mock 用） */

export type PrototypeSearchField = {
  key: string;
  label: string;
  type?: 'input' | 'select';
  options?: Array<{ label: string; value: string }>;
};

export type PrototypeColumn = {
  key: string;
  title: string;
  width?: number;
  dictKey?: string;
  tag?: boolean;
  format?: 'comma-tags';
};

export type PrototypeListConfig = {
  title: string;
  mockKey: string;
  searchFields: PrototypeSearchField[];
  columns: PrototypeColumn[];
  toolbarButtons?: string[];
  rowButtons?: string[];
  statusDict?: string;
};

export const PROTOTYPE_LIST_CONFIGS: Record<string, PrototypeListConfig> = {
  'inbound-order': {
    title: '\u5165\u5e93\u5355\u5217\u8868\uff08\u6309\u5361\u677f\uff09',
    mockKey: 'inbound-order',
    statusDict: 'wms_inbound_status',
    searchFields: [
      { key: 'palletNo', label: '\u6258\u76d8\u53f7' },
      { key: 'inboundNo', label: '\u5165\u5e93\u6279\u6b21' },
      { key: 'containerNo', label: '\u67dc\u53f7' },
      { key: 'groupCode', label: '\u5206\u7ec4' },
      { key: 'customerName', label: '\u5ba2\u6237' },
      { key: 'status', label: '\u72b6\u6001', type: 'select', options: [] }
    ],
    columns: [
      { key: 'palletNo', title: '\u6258\u76d8\u53f7', width: 150 },
      { key: 'inboundNo', title: '\u5165\u5e93\u6279\u6b21', width: 140 },
      { key: 'containerNo', title: '\u67dc\u53f7', width: 130 },
      { key: 'groupCode', title: '\u5206\u7ec4', width: 100 },
      { key: 'customerName', title: '\u5ba2\u6237', width: 110 },
      { key: 'boxQty', title: '\u7bb1\u6570', width: 72 },
      { key: 'recommendLocation', title: '\u63a8\u8350\u5e93\u4f4d', width: 100 },
      { key: 'status', title: '\u72b6\u6001', width: 100, dictKey: 'wms_inbound_status', tag: true },
      { key: 'createTime', title: '\u521b\u5efa\u65f6\u95f4', width: 160 }
    ],
    toolbarButtons: ['\u5bfc\u51fa'],
    rowButtons: ['\u5361\u677f\u5165\u5e93', '\u67e5\u770b']
  },
  'putaway-task': {
    title: '\u4e0a\u67b6\u4efb\u52a1\u5217\u8868',
    mockKey: 'putaway-task',
    statusDict: 'wms_putaway_status',
    searchFields: [
      { key: 'taskNo', label: '\u4efb\u52a1\u53f7' },
      { key: 'containerNo', label: '\u67dc\u53f7' },
      { key: 'customerName', label: '\u5ba2\u6237' },
      { key: 'status', label: '\u72b6\u6001', type: 'select', options: [] }
    ],
    columns: [
      { key: 'taskNo', title: '\u4efb\u52a1\u53f7', width: 140 },
      { key: 'containerNo', title: '\u67dc\u53f7', width: 130 },
      { key: 'customerName', title: '\u5ba2\u6237', width: 110 },
      { key: 'palletQty', title: '\u5361\u677f\u6570', width: 72 },
      { key: 'palletNos', title: '\u5f85\u4e0a\u67b6\u5361\u677f', width: 200, format: 'comma-tags' },
      { key: 'recommendLocation', title: '\u63a8\u8350\u5e93\u4f4d', width: 100 },
      { key: 'putawayMode', title: '\u6a21\u5f0f', width: 80, dictKey: 'wms_putaway_mode', tag: true },
      { key: 'status', title: '\u72b6\u6001', width: 100, dictKey: 'wms_putaway_status', tag: true },
      { key: 'createTime', title: '\u521b\u5efa\u65f6\u95f4', width: 160 }
    ],
    toolbarButtons: ['\u5206\u914d\u4efb\u52a1', '\u5bfc\u51fa'],
    rowButtons: ['\u6279\u91cf\u4e0a\u67b6', '\u67e5\u770b']
  },
  'operation-order': {
    title: '\u64cd\u4f5c\u6307\u4ee4\u5355\u5217\u8868',
    mockKey: 'operation-order',
    statusDict: 'wms_operation_status',
    searchFields: [
      { key: 'orderNo', label: '\u6307\u4ee4\u5355\u53f7' },
      { key: 'containerNo', label: '\u67dc\u53f7' },
      { key: 'cargoOrderNo', label: '\u8ba2\u5355\u53f7' },
      { key: 'containerWorkOrderNo', label: '\u5de5\u4f5c\u5355\u53f7' },
      { key: 'customerName', label: '\u5ba2\u6237' },
      { key: 'operationType', label: '\u64cd\u4f5c\u7c7b\u578b', type: 'select', options: [] },
      { key: 'status', label: '\u72b6\u6001', type: 'select', options: [] }
    ],
    columns: [
      { key: 'orderNo', title: '\u6307\u4ee4\u5355\u53f7', width: 140 },
      { key: 'containerNo', title: '\u67dc\u53f7', width: 130 },
      { key: 'cargoOrderNo', title: '\u8ba2\u5355\u53f7', width: 140 },
      { key: 'containerWorkOrderNo', title: '\u5de5\u4f5c\u5355\u53f7', width: 140 },
      { key: 'customerName', title: '\u5ba2\u6237', width: 110 },
      { key: 'operationType', title: '\u64cd\u4f5c\u7c7b\u578b', width: 110, dictKey: 'wms_operation_type', tag: true },
      { key: 'qty', title: '\u6570\u91cf', width: 80 },
      { key: 'status', title: '\u72b6\u6001', width: 100, dictKey: 'wms_operation_status', tag: true },
      { key: 'createTime', title: '\u521b\u5efa\u65f6\u95f4', width: 160 }
    ],
    toolbarButtons: ['\u67e5\u770b', '\u521b\u5efa\u4efb\u52a1', '\u53d6\u6d88', '\u5bfc\u51fa'],
    rowButtons: ['\u67e5\u770b', '\u521b\u5efa\u4efb\u52a1']
  },
  'vas-task': {
    title: '\u589e\u503c\u670d\u52a1\u4efb\u52a1\u5217\u8868',
    mockKey: 'vas-task',
    statusDict: 'wms_vas_status',
    searchFields: [
      { key: 'taskNo', label: '\u4efb\u52a1\u53f7' },
      { key: 'operationOrderNo', label: '\u6307\u4ee4\u5355\u53f7' },
      { key: 'cargoOrderNo', label: '\u8ba2\u5355\u53f7' },
      { key: 'customerName', label: '\u5ba2\u6237' },
      { key: 'serviceType', label: '\u670d\u52a1\u7c7b\u578b', type: 'select', options: [] },
      { key: 'status', label: '\u72b6\u6001', type: 'select', options: [] }
    ],
    columns: [
      { key: 'taskNo', title: '\u4efb\u52a1\u53f7', width: 140 },
      { key: 'operationOrderNo', title: '\u6307\u4ee4\u5355\u53f7', width: 140 },
      { key: 'cargoOrderNo', title: '\u8ba2\u5355\u53f7', width: 140 },
      { key: 'customerName', title: '\u5ba2\u6237', width: 110 },
      { key: 'serviceType', title: '\u670d\u52a1\u7c7b\u578b', width: 110, dictKey: 'wms_vas_type', tag: true },
      { key: 'qty', title: '\u6570\u91cf', width: 80 },
      { key: 'status', title: '\u72b6\u6001', width: 100, dictKey: 'wms_vas_status', tag: true },
      { key: 'createTime', title: '\u521b\u5efa\u65f6\u95f4', width: 160 }
    ],
    toolbarButtons: ['\u67e5\u770b', '\u5f00\u59cb\u4f5c\u4e1a', '\u5b8c\u6210\u4f5c\u4e1a'],
    rowButtons: ['\u67e5\u770b', '\u5f00\u59cb\u4f5c\u4e1a']
  },
  'stock-prep-order': {
    title: '\u5907\u8d27\u5355\u5217\u8868',
    mockKey: 'stock-prep-order',
    statusDict: 'wms_stock_prep_status',
    searchFields: [
      { key: 'orderNo', label: '\u5907\u8d27\u5355\u53f7' },
      { key: 'outboundOrderNo', label: '\u51fa\u5e93\u5355\u53f7' },
      { key: 'customerName', label: '\u5ba2\u6237' },
      { key: 'status', label: '\u72b6\u6001', type: 'select', options: [] }
    ],
    columns: [
      { key: 'orderNo', title: '\u5907\u8d27\u5355\u53f7', width: 140 },
      { key: 'outboundOrderNo', title: '\u51fa\u5e93\u5355\u53f7', width: 140 },
      { key: 'customerName', title: '\u5ba2\u6237', width: 110 },
      { key: 'palletQty', title: '\u6258\u76d8\u6570', width: 80 },
      { key: 'status', title: '\u72b6\u6001', width: 100, dictKey: 'wms_stock_prep_status', tag: true },
      { key: 'createTime', title: '\u521b\u5efa\u65f6\u95f4', width: 160 }
    ],
    toolbarButtons: ['\u5bfc\u51fa'],
    rowButtons: ['\u5907\u8d27\u6267\u884c', '\u67e5\u770b']
  },
  'outbound-order': {
    title: '\u51fa\u5e93\u5355\u5217\u8868',
    mockKey: 'outbound-order',
    statusDict: 'wms_outbound_status',
    searchFields: [
      { key: 'outboundOrderNo', label: '\u51fa\u5e93\u5355\u53f7' },
      { key: 'customerName', label: '\u5ba2\u6237' },
      { key: 'outboundType', label: '\u51fa\u5e93\u7c7b\u578b', type: 'select', options: [] },
      { key: 'status', label: '\u72b6\u6001', type: 'select', options: [] }
    ],
    columns: [
      { key: 'outboundOrderNo', title: '\u51fa\u5e93\u5355\u53f7', width: 160 },
      { key: 'customerName', title: '\u5ba2\u6237', width: 120 },
      { key: 'outboundType', title: '\u51fa\u5e93\u7c7b\u578b', width: 100, dictKey: 'wms_outbound_direction', tag: true },
      { key: 'palletQty', title: '\u677f\u6570', width: 80 },
      { key: 'boxQty', title: '\u7bb1\u6570', width: 80 },
      { key: 'status', title: '\u72b6\u6001', width: 110, dictKey: 'wms_outbound_status', tag: true },
      { key: 'createTime', title: '\u521b\u5efa\u65f6\u95f4', width: 160 }
    ],
    toolbarButtons: ['\u67e5\u770b', '\u521b\u5efa\u5907\u8d27', '\u521b\u5efa\u51fa\u5e93\u4efb\u52a1', '\u5bfc\u51fa'],
    rowButtons: ['\u67e5\u770b', '\u51fa\u5e93\u6267\u884c']
  }
};
