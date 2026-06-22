import type { Crystal3DThemeConfig } from './types';
import { buildCrystalCssVars } from './css-vars';
import { buildCrystalNaiveOverrides } from './naive-overrides';
import { CRYSTAL_3D_BLUE, CRYSTAL_THEME_REGISTRY } from './presets/crystal-3d-blue';
import { themeSettings } from '@/theme/settings';

const CRYSTAL_ATTR = 'data-crystal-theme';
const CRYSTAL_STYLE_ID = 'crystal-theme-vars';
const CRYSTAL_CLASS = 'crystal-theme-active';

type ThemePresetPayload = Partial<App.Theme.ThemeSetting> & {
  naiveui?: App.Theme.NaiveUIThemeOverride;
};

function isCrystalRaw(raw: unknown): raw is Crystal3DThemeConfig {
  if (!raw || typeof raw !== 'object') return false;
  const obj = raw as Record<string, unknown>;
  return (
    obj.themeType === '3d-glassmorphism' ||
    obj.themeId === 'crystal-3d-blue' ||
    (typeof obj.crystal3d === 'object' && obj.crystal3d !== null)
  );
}

/** 从 configJson 中解析水晶主题 */
export function extractCrystalConfig(json?: string | null): Crystal3DThemeConfig | null {
  if (!json?.trim()) return null;
  try {
    const raw = JSON.parse(json) as Record<string, unknown>;
    if (raw.crystal3d && typeof raw.crystal3d === 'object') {
      return { ...CRYSTAL_3D_BLUE, ...(raw.crystal3d as Crystal3DThemeConfig) };
    }
    if (isCrystalRaw(raw)) {
      return { ...CRYSTAL_3D_BLUE, ...(raw as Crystal3DThemeConfig) };
    }
  } catch {
    return null;
  }
  return null;
}

export function isCrystalThemeJson(json?: string | null): boolean {
  return extractCrystalConfig(json) !== null;
}

export function getCrystalPreset(themeId: string): Crystal3DThemeConfig | null {
  return CRYSTAL_THEME_REGISTRY[themeId] ?? null;
}

function injectCrystalCssVars(config: Crystal3DThemeConfig) {
  const vars = buildCrystalCssVars(config);
  const cssText = `:root { ${Object.entries(vars)
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ')} }`;

  let style = document.querySelector<HTMLStyleElement>(`#${CRYSTAL_STYLE_ID}`);
  if (!style) {
    style = document.createElement('style');
    style.id = CRYSTAL_STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = cssText;
}

/** 应用水晶主题 DOM 标记与 CSS 变量 */
export function applyCrystalTheme(config: Crystal3DThemeConfig) {
  const html = document.documentElement;
  html.setAttribute(CRYSTAL_ATTR, config.themeId);
  html.classList.add(CRYSTAL_CLASS);
  injectCrystalCssVars(config);
}

/** 移除水晶主题 */
export function clearCrystalTheme() {
  document.documentElement.removeAttribute(CRYSTAL_ATTR);
  document.documentElement.classList.remove(CRYSTAL_CLASS);
  document.querySelector(`#${CRYSTAL_STYLE_ID}`)?.remove();
}

/** 水晶主题 → Soybean 主题预设（供 theme store 使用） */
export function crystalConfigToThemePreset(config: Crystal3DThemeConfig): ThemePresetPayload {
  const radius = Number.parseInt(config.designTokens.radiusMedium.replace('px', ''), 10) || 14;
  return {
    themeScheme: config.mode === 'dark' ? 'dark' : 'light',
    themeColor: config.designTokens.primaryColor,
    themeRadius: radius,
    layout: {
      mode: 'vertical',
      scrollMode: 'content'
    },
    header: {
      ...themeSettings.header,
      height: config.layout.header.height
    },
    sider: {
      ...themeSettings.sider,
      inverted: true,
      width: config.layout.sidebar.width,
      collapsedWidth: config.layout.sidebar.collapsedWidth
    },
    tab: {
      ...themeSettings.tab,
      visible: true
    },
    otherColor: {
      info: config.designTokens.infoColor,
      success: config.designTokens.successColor,
      warning: config.designTokens.warningColor,
      error: config.designTokens.dangerColor
    },
    naiveui: buildCrystalNaiveOverrides(config)
  };
}

/** 从 configJson 解析并返回 Soybean 预设（含 naive 覆盖） */
export function parseCrystalThemePreset(json?: string | null): ThemePresetPayload | null {
  const crystal = extractCrystalConfig(json);
  if (!crystal) return null;
  return crystalConfigToThemePreset(crystal);
}

/** 应用水晶主题（configJson 入口） */
export function applyCrystalThemeFromConfig(json?: string | null) {
  const crystal = extractCrystalConfig(json);
  if (!crystal) {
    clearCrystalTheme();
    return null;
  }
  applyCrystalTheme(crystal);
  return crystal;
}
