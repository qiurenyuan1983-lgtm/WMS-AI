import type { ThemeVisualConfig } from '../shared/theme-visual-config';

export interface ThemeEditorModel {
  themeId?: CommonType.IdType;
  themeName: string;
  themeCode: string;
  remark: string;
  applicablePorts: string[];
  applicableWarehouses: string[];
  applicableAccounts: string;
  applicableRoles: string[];
  isDefault: Api.Common.YesOrNoStatus;
  status: Api.Common.EnableStatus;
  publishStatus: string;
  version: string;
  createTime?: string;
  updateTime?: string;
  visual: ThemeVisualConfig;
}
