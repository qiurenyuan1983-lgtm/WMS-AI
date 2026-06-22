export type PhoneCountryOption = {
  label: string;
  value: string;
  countryCode: string;
  pattern: RegExp;
  maxLength: number;
  placeholder: string;
};

/** 常用国家/地区电话区号（原型演示） */
export const PHONE_COUNTRY_OPTIONS: PhoneCountryOption[] = [
  {
    label: '中国 +86',
    value: '+86',
    countryCode: 'CN',
    pattern: /^1\d{10}$/,
    maxLength: 11,
    placeholder: '请输入 11 位手机号'
  },
  {
    label: '美国 +1',
    value: '+1',
    countryCode: 'US',
    pattern: /^\d{10}$/,
    maxLength: 10,
    placeholder: '请输入 10 位号码'
  },
  {
    label: '香港 +852',
    value: '+852',
    countryCode: 'HK',
    pattern: /^[5689]\d{7}$/,
    maxLength: 8,
    placeholder: '请输入 8 位号码'
  },
  {
    label: '台湾 +886',
    value: '+886',
    countryCode: 'TW',
    pattern: /^9\d{8}$/,
    maxLength: 9,
    placeholder: '请输入 9 位手机号'
  },
  {
    label: '新加坡 +65',
    value: '+65',
    countryCode: 'SG',
    pattern: /^[89]\d{7}$/,
    maxLength: 8,
    placeholder: '请输入 8 位号码'
  },
  {
    label: '英国 +44',
    value: '+44',
    countryCode: 'GB',
    pattern: /^7\d{9}$/,
    maxLength: 10,
    placeholder: '请输入 10 位号码'
  },
  {
    label: '日本 +81',
    value: '+81',
    countryCode: 'JP',
    pattern: /^[789]0\d{8}$/,
    maxLength: 11,
    placeholder: '请输入手机号'
  },
  {
    label: '韩国 +82',
    value: '+82',
    countryCode: 'KR',
    pattern: /^1\d{8,9}$/,
    maxLength: 10,
    placeholder: '请输入手机号'
  },
  {
    label: '马来西亚 +60',
    value: '+60',
    countryCode: 'MY',
    pattern: /^1\d{8,9}$/,
    maxLength: 10,
    placeholder: '请输入手机号'
  },
  {
    label: '澳大利亚 +61',
    value: '+61',
    countryCode: 'AU',
    pattern: /^4\d{8}$/,
    maxLength: 9,
    placeholder: '请输入 9 位号码'
  }
];

export const DEFAULT_PHONE_COUNTRY_CODE = '+86';

export function getPhoneCountryOption(code?: string | null) {
  return PHONE_COUNTRY_OPTIONS.find(item => item.value === code) ?? PHONE_COUNTRY_OPTIONS[0];
}
