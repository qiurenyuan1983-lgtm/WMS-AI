import { defu } from 'defu';
import { useThemeStore } from '@/store/modules/theme';
import { themeSettings } from '@/theme/settings';
import {
  applyCrystalThemeFromConfig,
  clearCrystalTheme,
  isCrystalThemeJson,
  parseCrystalThemePreset
} from '@/theme/crystal';
import { sessionStg } from '@/utils/storage';
import { parseVisualConfig, type ThemeVisualConfig } from '@/views/system/theme-config/shared/theme-visual-config';

type ThemePresetPayload = Partial<App.Theme.ThemeSetting> & {
  naiveui?: App.Theme.NaiveUIThemeOverride;
};

export function parseThemeConfigJson(configJson?: string | null): ThemePresetPayload {
  const visual = parseVisualConfig(configJson);
  if (!configJson?.trim()) return {};
  try {
    const raw = JSON.parse(configJson) as ThemePresetPayload & ThemeVisualConfig;
    if (raw.themeScheme || raw.themeColor) {
      return {
        themeScheme: visual.themeScheme,
        themeColor: visual.colors.primary,
        themeRadius: visual.components.cardRadius,
        layout: { mode: visual.layoutMode, scrollMode: 'content' },
        tab: { ...themeSettings.tab, visible: visual.tabVisible },
        watermark: {
          ...themeSettings.watermark,
          visible: visual.watermarkVisible,
          text: visual.watermarkText
        }
      };
    }
    return raw as ThemePresetPayload;
  } catch {
    return {};
  }
}

/** 将主题配置应用到当前会话 */
export function applyThemeConfig(configJson?: string | null) {
  const preset = parseThemeConfigJson(configJson);
  const mergedPreset = defu(preset, themeSettings);
  const themeStore = useThemeStore();
  const { themeScheme, grayscale, colourWeakness, layout, watermark, naiveui, ...rest } = mergedPreset;

  themeStore.setThemeScheme(themeScheme);
  themeStore.setGrayscale(grayscale);
  themeStore.setColourWeakness(colourWeakness);
  themeStore.setThemeLayout(layout.mode);
  themeStore.setWatermarkEnableUserName(watermark.enableUserName);
  themeStore.setWatermarkEnableTime(watermark.enableTime);

  Object.assign(themeStore, {
    ...rest,
    layout: { ...themeStore.layout, scrollMode: layout.scrollMode },
    page: { ...rest.page },
    header: { ...rest.header },
    tab: { ...rest.tab },
    sider: { ...rest.sider },
    footer: { ...rest.footer },
    watermark: { ...watermark },
    tokens: { ...rest.tokens }
  });

  themeStore.setNaiveThemeOverrides(naiveui);
}

export function buildThemeConfigJson(params: {
  themeScheme: UnionKey.ThemeScheme;
  themeColor: string;
  layoutMode: UnionKey.ThemeLayoutMode;
  themeRadius: number;
  tabVisible: Api.Common.VisibleStatus;
  watermarkVisible: Api.Common.VisibleStatus;
  watermarkText: string;
}): string {
  const visual = parseVisualConfig(null);
  visual.themeScheme = params.themeScheme;
  visual.themeColor = params.themeColor;
  visual.themeRadius = params.themeRadius;
  visual.layoutMode = params.layoutMode;
  visual.tabVisible = params.tabVisible === '0';
  visual.watermarkVisible = params.watermarkVisible === '0';
  visual.watermarkText = params.watermarkText;
  visual.colors.primary = params.themeColor;
  visual.components.cardRadius = params.themeRadius;
  return JSON.stringify(visual, null, 2);
}

export function applyVisualConfigToSession(config: ThemeVisualConfig) {
  applyThemeConfig(JSON.stringify(config));
}
