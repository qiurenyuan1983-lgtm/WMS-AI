import { mockPage, nextId } from '../utils';
import {
  THEME_PRESETS,
  createDefaultVisualConfig,
  parseVisualConfig,
  serializeVisualConfig,
  visualConfigToLegacySummary,
  type ThemeVisualConfig
} from '@/views/system/theme-config/shared/theme-visual-config';

const NOW = '2026-06-03 10:00:00';

function buildConfigJson(presetKey?: keyof typeof THEME_PRESETS, override?: Partial<ThemeVisualConfig>) {
  const base = createDefaultVisualConfig(presetKey ? THEME_PRESETS[presetKey] : undefined);
  const merged = override ? { ...base, ...override, colors: { ...base.colors, ...override.colors } } : base;
  return serializeVisualConfig(merged);
}

function row(
  input: Omit<Api.System.ThemeConfig, 'createTime' | 'updateTime' | 'createBy' | 'updateBy' | 'configJson'> & {
    createTime?: string;
    updateTime?: string;
    createBy?: string;
    updateBy?: string;
    configJson?: string;
    presetKey?: keyof typeof THEME_PRESETS;
  }
) {
  const configJson = input.configJson || buildConfigJson(input.presetKey);
  const visual = parseVisualConfig(configJson);
  const summary = visualConfigToLegacySummary(visual);
  const time = input.updateTime || input.createTime || NOW;
  return {
    ...input,
    ...summary,
    createBy: input.createBy ?? 'admin',
    updateBy: input.updateBy ?? 'admin',
    configJson,
    createTime: input.createTime || NOW,
    updateTime: time
  } satisfies Api.System.ThemeConfig;
}

export let MOCK_THEME_CONFIGS: Api.System.ThemeConfig[] = [
  row({
    themeId: 880001,
    themeName: 'HD\u6c34\u6676\u73bb\u7483',
    themeCode: 'THEME-HD',
    themeScheme: 'light',
    themeColor: '#1890ff',
    layoutMode: 'vertical',
    themeRadius: 12,
    tabVisible: '0',
    watermarkVisible: '1',
    watermarkText: 'FOREST AI WMS',
    isDefault: 'Y',
    status: '0',
    version: 'V1.2.0',
    publishStatus: 'PUBLISHED',
    themeStyle: 'GLASS',
    applicablePorts: 'BACKEND,SUPPLIER,PDA,DRIVER',
    applicableWarehouses: 'LA,DAL,SAV,NJ,DE',
    applicableAccounts: 'ALL',
    applicableRoles: 'ADMIN,WH,OPERATOR',
    remark: 'HD\u6c34\u6676\u73bb\u7483\u98ce\u683c',
    createTime: '2024-05-20 14:30:00',
    updateTime: '2024-05-20 14:30:00',
    presetKey: 'GLASS_HD'
  }),
  row({
    themeId: 880002,
    themeName: '\u5929\u7a7a\u6de1\u84dd',
    themeCode: 'THEME-SKY',
    themeScheme: 'light',
    themeColor: '#1890ff',
    layoutMode: 'vertical',
    themeRadius: 8,
    tabVisible: '0',
    watermarkVisible: '1',
    watermarkText: 'WMS',
    isDefault: 'N',
    status: '0',
    version: 'V1.2.0',
    publishStatus: 'PUBLISHED',
    themeStyle: 'LIGHT',
    applicablePorts: 'BACKEND,PDA',
    applicableWarehouses: 'LA,DAL,SAV,NJ,DE',
    applicableAccounts: 'ALL',
    applicableRoles: 'ADMIN,WH,OPERATOR',
    remark: '\u5929\u7a7a\u6de1\u84dd\u4e3b\u9898',
    createTime: '2024-05-18 09:22:00',
    updateTime: '2024-05-18 09:22:00',
    presetKey: 'SKY_BLUE'
  }),
  row({
    themeId: 880003,
    themeName: '\u94f6\u7070\u6e10\u53d8',
    themeCode: 'THEME-SILVER',
    themeScheme: 'light',
    themeColor: '#595959',
    layoutMode: 'vertical',
    themeRadius: 6,
    tabVisible: '0',
    watermarkVisible: '1',
    watermarkText: '',
    isDefault: 'N',
    status: '0',
    version: 'V1.0.0',
    publishStatus: 'PUBLISHED',
    themeStyle: 'BUSINESS',
    applicablePorts: 'BACKEND,SUPPLIER',
    applicableWarehouses: 'NJ,DE',
    applicableAccounts: 'CUSTOMER',
    applicableRoles: 'ADMIN,FIN',
    remark: '\u94f6\u7070\u6e10\u53d8\u5546\u52a1\u98ce',
    createTime: '2024-05-15 16:45:00',
    updateTime: '2024-05-15 16:45:00',
    presetKey: 'SILVER_GRAY'
  })
];

function filterRows(rows: Api.System.ThemeConfig[], params?: Record<string, any>) {
  let list = [...rows];
  if (params?.themeName) {
    const k = String(params.themeName).toLowerCase();
    list = list.filter(r => r.themeName.toLowerCase().includes(k));
  }
  if (params?.themeCode) {
    const k = String(params.themeCode).toLowerCase();
    list = list.filter(r => r.themeCode.toLowerCase().includes(k));
  }
  if (params?.themeScheme) list = list.filter(r => r.themeScheme === params.themeScheme);
  if (params?.status) list = list.filter(r => r.status === params.status);
  if (params?.isDefault) list = list.filter(r => r.isDefault === params.isDefault);
  if (params?.applicablePorts) {
    const k = String(params.applicablePorts);
    list = list.filter(r => String(r.applicablePorts || '').includes(k));
  }
  if (params?.applicableWarehouses) {
    const k = String(params.applicableWarehouses);
    list = list.filter(r => String(r.applicableWarehouses || '').includes(k));
  }
  return list;
}

export function getThemeConfigList(params?: Record<string, any>) {
  return mockPage(filterRows(MOCK_THEME_CONFIGS, params), params);
}

export function getThemeConfigDetail(themeId: CommonType.IdType) {
  return MOCK_THEME_CONFIGS.find(r => String(r.themeId) === String(themeId)) ?? null;
}

export function getDefaultThemeConfig() {
  return MOCK_THEME_CONFIGS.find(r => r.isDefault === 'Y' && r.status === '0') ?? MOCK_THEME_CONFIGS[0];
}

function syncFromPayload(data: Api.System.ThemeConfigOperateParams) {
  if (!data.configJson) return;
  const visual = parseVisualConfig(data.configJson);
  const summary = visualConfigToLegacySummary(visual);
  Object.assign(data, summary);
  data.themeStyle = data.themeStyle || visual.basic.themeStyle;
}

export function createThemeConfig(data: Api.System.ThemeConfigOperateParams) {
  if (!data.configJson) {
    data.configJson = buildConfigJson(undefined, {
      themeScheme: data.themeScheme || 'light',
      colors: { primary: data.themeColor || '#1890ff' },
      layoutMode: data.layoutMode || 'vertical'
    });
  }
  syncFromPayload(data);
  const themeId = nextId();
  const item = row({
    themeId,
    themeName: data.themeName!,
    themeCode: data.themeCode!,
    themeScheme: data.themeScheme || 'light',
    themeColor: data.themeColor || '#1890ff',
    layoutMode: data.layoutMode || 'vertical',
    themeRadius: data.themeRadius ?? 8,
    tabVisible: data.tabVisible || '0',
    watermarkVisible: data.watermarkVisible || '1',
    watermarkText: data.watermarkText || '',
    isDefault: data.isDefault || 'N',
    status: data.status || '0',
    version: data.version || '1.0.0',
    configJson: data.configJson,
    remark: data.remark ?? null,
    applicablePorts: data.applicablePorts ?? 'BACKEND',
    applicableWarehouses: data.applicableWarehouses ?? 'ALL',
    applicableAccounts: data.applicableAccounts ?? 'ALL',
    applicableRoles: data.applicableRoles ?? 'ADMIN',
    themeStyle: data.themeStyle ?? 'LIGHT',
    publishStatus: data.publishStatus ?? 'DRAFT'
  });
  if (item.isDefault === 'Y') clearDefaultExcept(themeId);
  MOCK_THEME_CONFIGS.unshift(item);
  return item;
}

export function updateThemeConfig(data: Api.System.ThemeConfigOperateParams) {
  const idx = MOCK_THEME_CONFIGS.findIndex(r => String(r.themeId) === String(data.themeId));
  if (idx < 0) return null;
  syncFromPayload(data);
  MOCK_THEME_CONFIGS[idx] = {
    ...MOCK_THEME_CONFIGS[idx],
    ...data,
    updateTime: NOW,
    updateBy: 'admin'
  } as Api.System.ThemeConfig;
  if (MOCK_THEME_CONFIGS[idx].isDefault === 'Y') clearDefaultExcept(data.themeId!);
  return MOCK_THEME_CONFIGS[idx];
}

export function deleteThemeConfigs(ids: string) {
  const idSet = new Set(ids.split(','));
  MOCK_THEME_CONFIGS = MOCK_THEME_CONFIGS.filter(r => !idSet.has(String(r.themeId)));
}

function clearDefaultExcept(themeId: CommonType.IdType) {
  MOCK_THEME_CONFIGS.forEach(r => {
    if (String(r.themeId) !== String(themeId)) r.isDefault = 'N';
  });
}

export function setDefaultThemeConfig(themeId: CommonType.IdType) {
  clearDefaultExcept(themeId);
  const rowItem = MOCK_THEME_CONFIGS.find(r => String(r.themeId) === String(themeId));
  if (rowItem) rowItem.isDefault = 'Y';
  return rowItem;
}

export function copyThemeConfig(themeId: CommonType.IdType) {
  const source = getThemeConfigDetail(themeId);
  if (!source) return null;
  return createThemeConfig({
    themeName: `${source.themeName}\u526f\u672c`,
    themeCode: `${source.themeCode}_COPY`,
    configJson: source.configJson,
    themeScheme: source.themeScheme,
    themeColor: source.themeColor,
    layoutMode: source.layoutMode,
    themeRadius: source.themeRadius,
    tabVisible: source.tabVisible,
    watermarkVisible: source.watermarkVisible,
    watermarkText: source.watermarkText,
    isDefault: 'N',
    status: '0',
    version: '1.0.0',
    remark: source.remark,
    applicablePorts: source.applicablePorts,
    applicableWarehouses: source.applicableWarehouses,
    applicableAccounts: source.applicableAccounts,
    applicableRoles: source.applicableRoles,
    themeStyle: source.themeStyle,
    publishStatus: 'DRAFT'
  });
}

export function batchUpdateThemeStatus(themeIds: CommonType.IdType[], status: Api.Common.EnableStatus) {
  const idSet = new Set(themeIds.map(String));
  MOCK_THEME_CONFIGS.forEach(r => {
    if (idSet.has(String(r.themeId))) r.status = status;
  });
  return true;
}

export function publishThemeConfig(data: Api.System.ThemeConfigOperateParams) {
  let item = data.themeId ? updateThemeConfig({ ...data, publishStatus: 'PUBLISHED', status: '0' }) : createThemeConfig({ ...data, publishStatus: 'PUBLISHED', status: '0' });
  if (!item) return null;
  item.publishStatus = 'PUBLISHED';
  item.status = '0';
  item.version = bumpVersion(item.version);
  item.updateTime = NOW;
  return item;
}

export function saveThemeDraft(data: Api.System.ThemeConfigOperateParams) {
  data.publishStatus = 'DRAFT';
  if (data.themeId) return updateThemeConfig(data);
  return createThemeConfig(data);
}

function bumpVersion(version: string) {
  const parts = version.split('.').map(Number);
  if (parts.length === 3) {
    parts[2] += 1;
    return parts.join('.');
  }
  return version;
}
