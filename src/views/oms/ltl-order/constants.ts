export const LTL_WORKFLOW_STEPS = [
  '预订单已生成',
  '选择供应商',
  '供应商下单',
  '人工确认',
  '添加货物',
  '生成正式订单',
  '推送WMS'
] as const;

export const LTL_ORDER_SOURCE_OPTIONS = [
  { label: '\u5ba2\u6237\u4e0b\u5355', value: 'CUSTOMER' },
  { label: '\u5ba2\u670d\u5bfc\u5165', value: 'IMPORT' },
  { label: '\u90ae\u4ef6\u8bc6\u522b', value: 'EMAIL' },
  { label: 'API\u540c\u6b65', value: 'API' },
  { label: '\u4eba\u5de5\u521b\u5efa', value: 'MANUAL' }
];

export const LTL_ORDER_METHOD_OPTIONS = [
  { label: 'API\u81ea\u52a8\u4e0b\u5355', value: 'API' },
  { label: '\u7f51\u9875\u81ea\u52a8\u4e0b\u5355 (RPA)', value: 'RPA' },
  { label: '\u4eba\u5de5\u8f85\u52a9\u4e0b\u5355', value: 'MANUAL' }
];

export type LtlOrderAction =
  | 'autoMatchSupplier'
  | 'placeSupplierOrder'
  | 'generateOrder'
  | 'manualConfirm'
  | 'addCargo'
  | 'rematchSupplier'
  | 'markAbnormal'
  | 'cancel';
