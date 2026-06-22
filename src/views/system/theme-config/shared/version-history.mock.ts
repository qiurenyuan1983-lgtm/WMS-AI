export interface ThemeVersionRecord {
  id: number;
  version: string;
  operator: string;
  action: string;
  time: string;
  remark: string;
}

export const MOCK_THEME_VERSION_HISTORY: ThemeVersionRecord[] = [
  { id: 1, version: 'V1.2.0', operator: 'admin', action: '发布', time: '2024-05-20 14:30', remark: '优化毛玻璃透明度与菜单高亮' },
  { id: 2, version: 'V1.1.0', operator: 'admin', action: '草稿', time: '2024-05-19 10:15', remark: '调整主色与按钮圆角' },
  { id: 3, version: 'V1.0.0', operator: 'admin', action: '发布', time: '2024-05-18 09:22', remark: '初始版本' }
];
