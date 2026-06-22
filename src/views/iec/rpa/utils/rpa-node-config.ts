const FAILURE_OPTIONS: Array<{ label: string; value: Api.Iec.RpaFailureAction }> = [
  { label: '自动重试', value: 'RETRY' },
  { label: '转人工接管', value: 'MANUAL_TAKEOVER' },
  { label: '跳过本步', value: 'SKIP' },
  { label: '终止流程', value: 'ABORT' }
];

const CONDITION_OPERATORS = [
  { label: '等于', value: 'eq' },
  { label: '不等于', value: 'ne' },
  { label: '包含', value: 'contains' },
  { label: '大于', value: 'gt' },
  { label: '小于', value: 'lt' },
  { label: '为空', value: 'empty' }
];

const DEFAULT_MAPPINGS: Record<Api.Iec.RpaNodeType, Array<{ source: string; target: string }>> = {
  READ_ORDER: [
    { source: 'omsOrderNo', target: 'orderNo' },
    { source: 'destination', target: 'dest' }
  ],
  QUERY_INVENTORY: [
    { source: 'skuCode', target: 'sku' },
    { source: 'warehouseCode', target: 'wh' }
  ],
  CONDITION: [{ source: 'order.status', target: 'status' }],
  SEND_EMAIL: [
    { source: 'contactEmail', target: 'to' },
    { source: 'mailTemplate', target: 'template' }
  ],
  OPEN_WEB: [{ source: 'portalUrl', target: 'url' }],
  FILL_FORM: [
    { source: 'order.palletQty', target: 'palletQty' },
    { source: 'order.weight', target: 'weight' }
  ],
  CLICK_BUTTON: [{ source: 'submitSelector', target: 'selector' }],
  GET_RESULT: [{ source: 'proNo', target: 'result.proNo' }],
  CREATE_TASK: [
    { source: 'taskType', target: 'type' },
    { source: 'relatedDocNo', target: 'docNo' }
  ],
  MANUAL_CONFIRM: [{ source: 'confirmReason', target: 'reason' }]
};

export function createDefaultNodeConfig(type: Api.Iec.RpaNodeType): Api.Iec.RpaNodeConfig {
  const takeoverByType: Partial<Record<Api.Iec.RpaNodeType, string>> = {
    MANUAL_CONFIRM: '采购主管',
    FILL_FORM: '运营主管',
    OPEN_WEB: 'IT运维'
  };
  return {
    fieldMappings: (DEFAULT_MAPPINGS[type] ?? [{ source: '', target: '' }]).map(m => ({ ...m })),
    conditionField: type === 'CONDITION' ? 'order.status' : '',
    conditionOperator: 'eq',
    conditionValue: type === 'CONDITION' ? 'PENDING' : '',
    onFailure: type === 'MANUAL_CONFIRM' ? 'MANUAL_TAKEOVER' : 'RETRY',
    retryTimes: 2,
    takeoverOwner: takeoverByType[type] ?? '运营主管'
  };
}

/** 兼容旧版扁平 config */
export function normalizeRpaNodeConfig(
  raw: Partial<Api.Iec.RpaNodeConfig> | Record<string, string> | undefined,
  type: Api.Iec.RpaNodeType
): Api.Iec.RpaNodeConfig {
  const base = createDefaultNodeConfig(type);
  if (!raw) return base;
  if ('fieldMappings' in raw && Array.isArray(raw.fieldMappings)) {
    return {
      fieldMappings: raw.fieldMappings.length ? raw.fieldMappings.map(m => ({ ...m })) : base.fieldMappings,
      conditionField: raw.conditionField ?? base.conditionField,
      conditionOperator: raw.conditionOperator ?? base.conditionOperator,
      conditionValue: raw.conditionValue ?? base.conditionValue,
      onFailure: raw.onFailure ?? base.onFailure,
      retryTimes: raw.retryTimes ?? base.retryTimes,
      takeoverOwner: raw.takeoverOwner ?? base.takeoverOwner
    };
  }
  const legacy = raw as Record<string, string>;
  const mappings = Object.entries(legacy).map(([source, target]) => ({ source, target: String(target) }));
  return {
    ...base,
    fieldMappings: mappings.length ? mappings : base.fieldMappings
  };
}

export { FAILURE_OPTIONS, CONDITION_OPERATORS };
