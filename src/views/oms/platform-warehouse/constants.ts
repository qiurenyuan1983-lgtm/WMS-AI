export const STATUS_OPTIONS = [
  { label: '启用', value: '0' },
  { label: '停用', value: '1' }
];

export const COUNTRY_OPTIONS = [
  { label: 'US 美国', value: 'US', name: '美国' },
  { label: 'CA 加拿大', value: 'CA', name: '加拿大' },
  { label: 'MX 墨西哥', value: 'MX', name: '墨西哥' }
];

export function countryLabel(code?: string | null, name?: string | null) {
  if (!code) return '—';
  const opt = COUNTRY_OPTIONS.find(o => o.value === code);
  return opt ? opt.label : name ? `${code} ${name}` : code;
}

export function statusTagType(status?: string | null): 'success' | 'warning' | 'default' {
  if (status === '0') return 'success';
  if (status === '1') return 'warning';
  return 'default';
}

export function statusLabel(status?: string | null) {
  return STATUS_OPTIONS.find(o => o.value === status)?.label || status || '—';
}
