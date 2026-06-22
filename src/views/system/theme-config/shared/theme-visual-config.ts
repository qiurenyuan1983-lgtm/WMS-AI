/** 主题视觉配置（存于 configJson） */
export interface ThemeVisualConfig {
  basic: {
    themeStyle: string;
    pageRadius: string;
    shadowEffect: string;
    opacity: number;
    glassEffect: boolean;
    animation: boolean;
    density: string;
    description: string;
  };
  colors: {
    primary: string;
    secondary: string;
    background: string;
    menuBg: string;
    headerBg: string;
    buttonPrimary: string;
    buttonSecondary: string;
    buttonDanger: string;
    tableHeader: string;
    selected: string;
    warning: string;
    error: string;
    success: string;
  };
  background: {
    type: string;
    color: string;
    gradientDirection: string;
    imageUrl: string;
    opacity: number;
    blur: boolean;
    fixed: boolean;
  };
  login: {
    logo: string;
    bgImage: string;
    title: string;
    subtitle: string;
    boxStyle: string;
    buttonColor: string;
    copyright: string;
  };
  menu: {
    style: string;
    width: string;
    iconStyle: string;
    collapseMode: string;
    headerHeight: number;
    breadcrumb: boolean;
    tabs: boolean;
    highlightColor: string;
  };
  components: {
    cardBg: string;
    cardRadius: number;
    cardShadow: string;
    cardBorder: string;
    cardGap: string;
    tableHeaderBg: string;
    tableBorder: boolean;
    tableHover: boolean;
    tableStripe: boolean;
    tableRowHeight: string;
    tableFixedHeader: boolean;
    buttonRadius: string;
    buttonShadow: boolean;
    buttonAnimation: boolean;
    modalBg: string;
    modalMask: string;
    modalRadius: string;
    modalShadow: boolean;
    modalAnimation: string;
  };
  dashboard: {
    bg: string;
    cardStyle: string;
    chartColors: string;
    fontStyle: string;
    refreshInterval: number;
    fullscreen: boolean;
    boards: string[];
  };
  supplierPortal: {
    logo: string;
    bg: string;
    primaryColor: string;
    showBrand: boolean;
    allowCustom: boolean;
  };
  pda: {
    fontSize: string;
    buttonSize: string;
    highContrast: boolean;
    nightMode: boolean;
    scanColor: string;
    errorColor: string;
    successColor: string;
  };
  scope: {
    wholeSystem: boolean;
    supplierPortal: boolean;
    pda: boolean;
    driverApp: boolean;
    warehouseSpecific: boolean;
    accountSpecific: boolean;
  };
  /** 兼容 Soybean 主题抽屉 */
  themeScheme: UnionKey.ThemeScheme;
  themeColor: string;
  themeRadius: number;
  layoutMode: UnionKey.ThemeLayoutMode;
  tabVisible: boolean;
  watermarkVisible: boolean;
  watermarkText: string;
}

export const PORT_OPTIONS = [
  { label: 'PC / Web', value: 'BACKEND' },
  { label: '供应商门户', value: 'SUPPLIER' },
  { label: 'PDA', value: 'PDA' },
  { label: '司机端', value: 'DRIVER' }
];

export const WAREHOUSE_OPTIONS = [
  { label: '洛杉矶仓（华东）', value: 'LA' },
  { label: '达拉斯仓（华南）', value: 'DAL' },
  { label: '萨凡纳仓', value: 'SAV' },
  { label: '新泽西仓', value: 'NJ' },
  { label: '德国仓', value: 'DE' }
];

export const ROLE_OPTIONS = [
  { label: '系统管理员', value: 'ADMIN' },
  { label: '仓库管理员', value: 'WH' },
  { label: '操作员', value: 'OPERATOR' },
  { label: '客服', value: 'CS' },
  { label: '财务', value: 'FIN' },
  { label: '供应商', value: 'SUPPLIER' },
  { label: '司机', value: 'DRIVER' }
];

export const STYLE_OPTIONS = [
  { label: '简约', value: 'MINIMAL' },
  { label: '科技', value: 'TECH' },
  { label: '水晶玻璃', value: 'GLASS' },
  { label: '商务', value: 'BUSINESS' },
  { label: '深色', value: 'DARK' },
  { label: '浅色', value: 'LIGHT' }
];

export const ACCOUNT_SCOPE_OPTIONS = [
  { label: '全部账号', value: 'ALL' },
  { label: '指定客户', value: 'CUSTOMER' },
  { label: '指定供应商', value: 'SUPPLIER' }
];

export function createDefaultVisualConfig(partial?: Partial<ThemeVisualConfig>): ThemeVisualConfig {
  const base: ThemeVisualConfig = {
    basic: {
      themeStyle: 'GLASS',
      pageRadius: 'MEDIUM',
      shadowEffect: 'GLASS',
      opacity: 85,
      glassEffect: true,
      animation: true,
      density: 'STANDARD',
      description: ''
    },
    colors: {
      primary: '#1890ff',
      secondary: '#58b8ff',
      background: '#eef4fb',
      menuBg: '#0e1a2b',
      headerBg: '#ffffff',
      buttonPrimary: '#1890ff',
      buttonSecondary: '#f0f2f5',
      buttonDanger: '#ff4d4f',
      tableHeader: '#f5f8fc',
      selected: '#1890ff',
      warning: '#faad14',
      error: '#ff4d4f',
      success: '#52c41a'
    },
    background: {
      type: 'GRADIENT',
      color: '#eef4fb',
      gradientDirection: 'TO_BOTTOM',
      imageUrl: '',
      opacity: 85,
      blur: true,
      fixed: true
    },
    login: {
      logo: '',
      bgImage: '',
      title: 'FOREST AI WMS',
      subtitle: '海外仓智能运营系统',
      boxStyle: 'GLASS',
      buttonColor: 'THEME',
      copyright: '© 2026 Demo Logistics'
    },
    menu: {
      style: 'LEFT',
      width: 'STANDARD',
      iconStyle: 'LINE',
      collapseMode: 'AUTO',
      headerHeight: 56,
      breadcrumb: true,
      tabs: true,
      highlightColor: '#1890ff'
    },
    components: {
      cardBg: 'GLASS',
      cardRadius: 12,
      cardShadow: 'LIGHT',
      cardBorder: 'NONE',
      cardGap: 'STANDARD',
      tableHeaderBg: 'LIGHT_BLUE',
      tableBorder: true,
      tableHover: true,
      tableStripe: false,
      tableRowHeight: 'STANDARD',
      tableFixedHeader: true,
      buttonRadius: 'MEDIUM',
      buttonShadow: false,
      buttonAnimation: true,
      modalBg: 'WHITE',
      modalMask: 'DARK',
      modalRadius: 'STANDARD',
      modalShadow: true,
      modalAnimation: 'FADE'
    },
    dashboard: {
      bg: 'DEEP_BLUE',
      cardStyle: 'GLOW',
      chartColors: 'BLUE_GREEN',
      fontStyle: 'TECH',
      refreshInterval: 60,
      fullscreen: true,
      boards: ['OPS', 'INBOUND', 'OUTBOUND', 'INVENTORY']
    },
    supplierPortal: {
      logo: '',
      bg: 'LIGHT',
      primaryColor: '#1890ff',
      showBrand: true,
      allowCustom: false
    },
    pda: {
      fontSize: 'LARGE',
      buttonSize: 'LARGE',
      highContrast: true,
      nightMode: false,
      scanColor: '#1890ff',
      errorColor: '#ff4d4f',
      successColor: '#52c41a'
    },
    scope: {
      wholeSystem: true,
      supplierPortal: true,
      pda: true,
      driverApp: true,
      warehouseSpecific: false,
      accountSpecific: false
    },
    themeScheme: 'light',
    themeColor: '#1890ff',
    themeRadius: 8,
    layoutMode: 'vertical',
    tabVisible: true,
    watermarkVisible: false,
    watermarkText: 'WMS'
  };
  return { ...base, ...partial, basic: { ...base.basic, ...partial?.basic }, colors: { ...base.colors, ...partial?.colors } };
}

export const THEME_PRESETS: Record<string, Partial<ThemeVisualConfig>> = {
  GLASS_HD: {
    basic: { themeStyle: 'GLASS', glassEffect: true, shadowEffect: 'GLASS', description: 'HD水晶玻璃风格' },
    colors: {
      primary: '#1890ff',
      secondary: '#eef2f7',
      background: '#eef4fb',
      menuBg: 'rgba(255,255,255,0.65)',
      headerBg: 'rgba(255,255,255,0.85)'
    },
    background: { type: 'GRADIENT', opacity: 85, blur: true },
    login: { boxStyle: 'GLASS', title: 'FOREST AI WMS', subtitle: '海外仓智能运营系统' },
    components: { cardBg: 'GLASS', cardRadius: 12, cardShadow: 'LIGHT' }
  },
  SKY_BLUE: {
    basic: { themeStyle: 'LIGHT', glassEffect: false, description: '天空蓝主题' },
    colors: {
      primary: '#1890ff',
      background: '#e6f4ff',
      menuBg: '#ffffff',
      headerBg: '#ffffff'
    },
    background: { type: 'SOLID', color: '#e6f4ff', opacity: 100, blur: false },
    components: { cardBg: 'WHITE', cardRadius: 8 }
  },
  SILVER_GRAY: {
    basic: { themeStyle: 'BUSINESS', glassEffect: false, description: '银灰渐变商务风' },
    colors: {
      primary: '#595959',
      secondary: '#f0f0f0',
      background: '#f5f5f5',
      menuBg: '#fafafa',
      headerBg: '#ffffff'
    },
    background: { type: 'GRADIENT', color: '#f5f5f5', gradientDirection: 'TO_RIGHT', opacity: 100 },
    components: { cardBg: 'WHITE', cardRadius: 6, cardShadow: 'LIGHT' }
  }
};

export function parseVisualConfig(json?: string | null): ThemeVisualConfig {
  if (!json?.trim()) return createDefaultVisualConfig();
  try {
    const parsed = JSON.parse(json) as Partial<ThemeVisualConfig>;
    return createDefaultVisualConfig(parsed);
  } catch {
    return createDefaultVisualConfig();
  }
}

export function serializeVisualConfig(config: ThemeVisualConfig): string {
  return JSON.stringify(config, null, 2);
}

export function visualConfigToLegacySummary(config: ThemeVisualConfig) {
  return {
    themeScheme: config.themeScheme,
    themeColor: config.colors.primary,
    themeRadius: config.components.cardRadius,
    layoutMode: config.layoutMode,
    tabVisible: config.tabVisible ? ('0' as const) : ('1' as const),
    watermarkVisible: config.watermarkVisible ? ('0' as const) : ('1' as const),
    watermarkText: config.watermarkText
  };
}
