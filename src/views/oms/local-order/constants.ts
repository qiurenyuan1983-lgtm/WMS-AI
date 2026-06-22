export const LOCAL_WORKFLOW_STEPS = [
  '\u5ba2\u6237\u786e\u8ba4',
  '\u751f\u6210\u9884\u8f66\u6b21',
  '\u6dfb\u52a0\u8d27\u7269',
  '\u751f\u6210\u6b63\u5f0f\u8ba2\u5355'
] as const;

export const LOCAL_OPERATION_GUIDE = [
  '\u5ba2\u6237\u901a\u8fc7\u90ae\u4ef6\u786e\u8ba4\u51fa\u5e93',
  '\u7cfb\u7edf\u81ea\u52a8\u751f\u6210\u9884\u8f66\u6b21\u53f7\u3001\u8f66\u578b\u3001DOCK',
  '\u5173\u8054\u5b9e\u9645\u51fa\u5e93\u8d27\u7269\u660e\u7ec6',
  '\u751f\u6210\u6b63\u5f0f OMS \u8ba2\u5355'
] as const;

export type LocalOrderAction =
  | 'autoPreTrip'
  | 'addCargo'
  | 'generateOrder'
  | 'sendCustomerEmail'
  | 'markAbnormal'
  | 'cancel';
