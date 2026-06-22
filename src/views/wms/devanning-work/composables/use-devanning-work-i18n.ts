import { computed, ref } from 'vue';

export type DevanningWorkLocale = 'zh' | 'en' | 'es';

const STORAGE_KEY = 'devanning-work-locale';

type MessageKey =
  | 'langZh'
  | 'langEn'
  | 'langEs'
  | 'dock'
  | 'startAt'
  | 'finishAt'
  | 'bluetooth'
  | 'palletHistory'
  | 'startWork'
  | 'completeWork'
  | 'workFinishedTag'
  | 'backToTasks'
  | 'scanReceive'
  | 'scanPlaceholder'
  | 'receiveProgress'
  | 'boxesUnit'
  | 'selectDestGroup'
  | 'received'
  | 'noSessionData'
  | 'workFinishedWarning'
  | 'startedSuccess'
  | 'completedSuccess'
  | 'scanNoGroup'
  | 'palletRecognized'
  | 'scanRecognized'
  | 'labelEntryTitle'
  | 'boxScanDetail'
  | 'scanTime'
  | 'scanCodeCol'
  | 'groupCol'
  | 'orderCol'
  | 'qtyCol'
  | 'noScanRecords'
  | 'selectGroupHint'
  | 'boxScanSuccess'
  | 'scannedInGroup'
  | 'showAllScans'
  | 'manualGroupEntry'
  | 'destLabel'
  | 'selectDestFirst'
  | 'scanGroupMismatch'
  | 'recommendedLocations'
  | 'noRecommendedLocation';

const MESSAGES: Record<DevanningWorkLocale, Record<MessageKey, string>> = {
  zh: {
    langZh: '中文',
    langEn: 'EN',
    langEs: 'ES',
    dock: 'Dock',
    startAt: '开始',
    finishAt: '完成',
    bluetooth: '蓝牙连接',
    palletHistory: '板贴历史',
    startWork: '开始拆柜',
    completeWork: '拆柜完成',
    workFinishedTag: '已拆柜完成',
    backToTasks: '返回任务',
    scanReceive: '扫码收货',
    scanPlaceholder: '扫描箱唛 / 唛头条码，每扫一箱自动收货并关联分组',
    receiveProgress: '收货进度',
    boxesUnit: '箱',
    selectDestGroup: '选择目的地分组',
    received: '已收',
    noSessionData: '未找到作业数据',
    workFinishedWarning: '拆柜已完成',
    startedSuccess: '已开始拆柜',
    completedSuccess: '拆柜已完成',
    scanNoGroup: '未识别到对应分组',
    palletRecognized: '已识别：卡板 {code} → {group}',
    scanRecognized: '已识别：{remark} → {group}',
    labelEntryTitle: '录入板贴 · {group}',
    boxScanDetail: '单箱扫描明细',
    scanTime: '扫描时间',
    scanCodeCol: '箱唛/条码',
    groupCol: '目的地分组',
    orderCol: '订单号',
    qtyCol: '数量',
    noScanRecords: '暂无扫描记录，请扫描箱唛',
    selectGroupHint: '当前目的地独立计数，不可与其他目的地混扫',
    boxScanSuccess: '已收货 1 箱 → {group}',
    scannedInGroup: '本组已扫 {count} 箱',
    showAllScans: '显示全部分组',
    manualGroupEntry: '录入板贴',
    destLabel: '目的地',
    selectDestFirst: '请点击右侧目的地录入板贴',
    scanGroupMismatch: '该箱唛不属于当前目的地，无法添加',
    recommendedLocations: '预推荐库位',
    noRecommendedLocation: '待规则匹配'
  },
  en: {
    langZh: '中文',
    langEn: 'EN',
    langEs: 'ES',
    dock: 'Dock',
    startAt: 'Started',
    finishAt: 'Finished',
    bluetooth: 'Bluetooth',
    palletHistory: 'Label History',
    startWork: 'Start Devanning',
    completeWork: 'Complete',
    workFinishedTag: 'Completed',
    backToTasks: 'Back',
    scanReceive: 'Scan to Receive',
    scanPlaceholder: 'Scan carton label, one scan = one carton received',
    receiveProgress: 'Receiving Progress',
    boxesUnit: 'ctns',
    selectDestGroup: 'Select Destination Group',
    received: 'Rcvd',
    noSessionData: 'No session data',
    workFinishedWarning: 'Devanning already completed',
    startedSuccess: 'Devanning started',
    completedSuccess: 'Devanning completed',
    scanNoGroup: 'Group not recognized',
    palletRecognized: 'Pallet {code} → {group}',
    scanRecognized: '{remark} → {group}',
    labelEntryTitle: 'Pallet Label · {group}',
    boxScanDetail: 'Carton Scan Log',
    scanTime: 'Time',
    scanCodeCol: 'Barcode',
    groupCol: 'Group',
    orderCol: 'Order',
    qtyCol: 'Qty',
    noScanRecords: 'No scans yet',
    selectGroupHint: 'Each destination is scanned separately; do not mix',
    boxScanSuccess: 'Received 1 ctn → {group}',
    scannedInGroup: '{count} ctns in group',
    showAllScans: 'Show all groups',
    manualGroupEntry: 'Pallet label',
    destLabel: 'Dest.',
    selectDestFirst: 'Select destination on the right',
    scanGroupMismatch: 'Carton does not belong to current destination',
    recommendedLocations: 'Suggested loc.',
    noRecommendedLocation: 'Pending rule match'
  },
  es: {
    langZh: '中文',
    langEn: 'EN',
    langEs: 'ES',
    dock: 'Muelle',
    startAt: 'Inicio',
    finishAt: 'Fin',
    bluetooth: 'Bluetooth',
    palletHistory: 'Historial',
    startWork: 'Iniciar',
    completeWork: 'Finalizar',
    workFinishedTag: 'Completado',
    backToTasks: 'Volver',
    scanReceive: 'Escanear',
    scanPlaceholder: 'Escanee etiqueta de caja, 1 escaneo = 1 caja',
    receiveProgress: 'Progreso',
    boxesUnit: 'cajas',
    selectDestGroup: 'Grupo destino',
    received: 'Recib.',
    noSessionData: 'Sin datos',
    workFinishedWarning: 'Desconsolidación completada',
    startedSuccess: 'Desconsolidación iniciada',
    completedSuccess: 'Desconsolidación completada',
    scanNoGroup: 'Grupo no reconocido',
    palletRecognized: 'Palé {code} → {group}',
    scanRecognized: '{remark} → {group}',
    labelEntryTitle: 'Etiqueta · {group}',
    boxScanDetail: 'Detalle de escaneo',
    scanTime: 'Hora',
    scanCodeCol: 'Código',
    groupCol: 'Grupo',
    orderCol: 'Pedido',
    qtyCol: 'Cant.',
    noScanRecords: 'Sin escaneos',
    selectGroupHint: 'Cada destino se escanea por separado',
    boxScanSuccess: '1 caja → {group}',
    scannedInGroup: '{count} cajas en grupo',
    showAllScans: 'Todos los grupos',
    manualGroupEntry: 'Etiqueta palé',
    destLabel: 'Destino',
    selectDestFirst: 'Seleccione destino a la derecha',
    scanGroupMismatch: 'La caja no pertenece al destino actual',
    recommendedLocations: 'Ubic. sugerida',
    noRecommendedLocation: 'Pendiente de regla'
  }
};

export const DEVANNING_WORK_LOCALE_OPTIONS: Array<{ value: DevanningWorkLocale; labelKey: MessageKey }> = [
  { value: 'zh', labelKey: 'langZh' },
  { value: 'en', labelKey: 'langEn' },
  { value: 'es', labelKey: 'langEs' }
];

function readStoredLocale(): DevanningWorkLocale {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'es' || stored === 'zh') return stored;
  return 'zh';
}

export function useDevanningWorkI18n() {
  const locale = ref<DevanningWorkLocale>(readStoredLocale());

  function setLocale(next: DevanningWorkLocale) {
    locale.value = next;
    localStorage.setItem(STORAGE_KEY, next);
  }

  function t(key: MessageKey, params?: Record<string, string | number>) {
    let text = MESSAGES[locale.value][key] ?? MESSAGES.zh[key];
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  }

  const localeLabel = computed(() => DEVANNING_WORK_LOCALE_OPTIONS.find(o => o.value === locale.value)?.labelKey || 'langZh');

  return { locale, setLocale, t, localeLabel, DEVANNING_WORK_LOCALE_OPTIONS };
}
