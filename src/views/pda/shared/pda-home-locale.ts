import { computed, ref } from 'vue';
import { useAppStore } from '@/store/modules/app';
import { sessionStg } from '@/utils/storage';

export type PdaHomeLang = 'zh-CN' | 'en-US' | 'es-ES';

const STORAGE_KEY = 'pdaHomeLang';

export const PDA_HOME_LANG_OPTIONS: { key: PdaHomeLang; label: string }[] = [
  { key: 'zh-CN', label: '中文' },
  { key: 'en-US', label: 'English' },
  { key: 'es-ES', label: 'Español' }
];

const MESSAGES: Record<PdaHomeLang, Record<string, string>> = {
  'zh-CN': {
    back: '返回物流管理系统',
    currentWarehouse: '当前仓库',
    selectBusiness: '选择业务',
    loading: '加载中...',
    pending: '待办',
    perfTitle: '个人绩效看板',
    perfDetail: '查看详情',
    perfScore: '综合得分',
    rank: '排名',
    switchWarehouse: '[原型] 切换仓库',
    perfDetailToast: '[原型] 个人绩效详情',
    moreLanguage: '语言',
    moreAccount: '账号登录',
    moreBluetoothConnect: '连接蓝牙',
    moreBluetoothDisconnect: '断开蓝牙',
    moreBluetoothOn: '蓝牙已连接（扫描枪）',
    moreBluetoothOff: '蓝牙已断开',
    moreLangChanged: '已切换为中文',
    accountLoginToast: '请重新登录账号',
    unitOrder: '单'
  },
  'en-US': {
    back: 'Back to WMS',
    currentWarehouse: 'Current warehouse',
    selectBusiness: 'Select business',
    loading: 'Loading...',
    pending: 'pending',
    perfTitle: 'My performance',
    perfDetail: 'View details',
    perfScore: 'Overall score',
    rank: 'Rank',
    switchWarehouse: '[Proto] Switch warehouse',
    perfDetailToast: '[Proto] Performance details',
    moreLanguage: 'Language',
    moreAccount: 'Account login',
    moreBluetoothConnect: 'Connect Bluetooth',
    moreBluetoothDisconnect: 'Disconnect Bluetooth',
    moreBluetoothOn: 'Bluetooth connected (scanner)',
    moreBluetoothOff: 'Bluetooth disconnected',
    moreLangChanged: 'Switched to English',
    accountLoginToast: 'Please sign in again',
    unitOrder: 'orders'
  },
  'es-ES': {
    back: 'Volver al WMS',
    currentWarehouse: 'Almacén actual',
    selectBusiness: 'Seleccionar negocio',
    loading: 'Cargando...',
    pending: 'pendiente',
    perfTitle: 'Mi rendimiento',
    perfDetail: 'Ver detalles',
    perfScore: 'Puntuación',
    rank: 'Rango',
    switchWarehouse: '[Proto] Cambiar almacén',
    perfDetailToast: '[Proto] Detalle de rendimiento',
    moreLanguage: 'Idioma',
    moreAccount: 'Iniciar sesión',
    moreBluetoothConnect: 'Conectar Bluetooth',
    moreBluetoothDisconnect: 'Desconectar Bluetooth',
    moreBluetoothOn: 'Bluetooth conectado (escáner)',
    moreBluetoothOff: 'Bluetooth desconectado',
    moreLangChanged: 'Cambiado a español',
    accountLoginToast: 'Inicie sesión de nuevo',
    unitOrder: 'pedidos'
  }
};

function readStoredLang(): PdaHomeLang {
  const stored = sessionStg.get('pdaHomeLang');
  if (stored === 'en-US' || stored === 'es-ES' || stored === 'zh-CN') return stored;
  return 'zh-CN';
}

export function usePdaHomeLocale() {
  const appStore = useAppStore();
  const lang = ref<PdaHomeLang>(readStoredLang());

  const t = computed(() => MESSAGES[lang.value]);

  function applyLang(next: PdaHomeLang) {
    lang.value = next;
    sessionStg.set('pdaHomeLang', next);
    if (next === 'zh-CN' || next === 'en-US') {
      appStore.changeLocale(next);
    }
    window.$message?.success(MESSAGES[next].moreLangChanged);
  }

  return { lang, t, applyLang, langOptions: PDA_HOME_LANG_OPTIONS };
}
