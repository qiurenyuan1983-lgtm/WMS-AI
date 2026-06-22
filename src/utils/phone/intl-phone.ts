import {
  DEFAULT_PHONE_COUNTRY_CODE,
  PHONE_COUNTRY_OPTIONS,
  getPhoneCountryOption
} from '@/constants/phone-country';

export type IntlPhoneParts = {
  phoneCountryCode: string;
  phonenumber: string;
};

export function normalizePhoneDigits(value?: string | null) {
  return String(value || '').replace(/\D/g, '');
}

/** 拆分存量手机号（兼容仅 phonenumber 字段） */
export function splitIntlPhone(
  phonenumber?: string | null,
  phoneCountryCode?: string | null
): IntlPhoneParts {
  if (phoneCountryCode) {
    return {
      phoneCountryCode,
      phonenumber: normalizePhoneDigits(phonenumber)
    };
  }

  const raw = String(phonenumber || '').trim();
  if (!raw) {
    return { phoneCountryCode: DEFAULT_PHONE_COUNTRY_CODE, phonenumber: '' };
  }

  if (raw.startsWith('+')) {
    const sorted = [...PHONE_COUNTRY_OPTIONS].sort((a, b) => b.value.length - a.value.length);
    for (const option of sorted) {
      if (raw.startsWith(option.value)) {
        return {
          phoneCountryCode: option.value,
          phonenumber: normalizePhoneDigits(raw.slice(option.value.length))
        };
      }
    }
  }

  const digits = normalizePhoneDigits(raw);
  if (/^1\d{10}$/.test(digits)) {
    return { phoneCountryCode: '+86', phonenumber: digits };
  }

  return { phoneCountryCode: DEFAULT_PHONE_COUNTRY_CODE, phonenumber: digits };
}

export function formatIntlPhoneDisplay(phoneCountryCode?: string | null, phonenumber?: string | null) {
  const parts = splitIntlPhone(phonenumber, phoneCountryCode);
  if (!parts.phonenumber) return '';
  return `${parts.phoneCountryCode} ${parts.phonenumber}`;
}

export function validateIntlPhone(phoneCountryCode?: string | null, phonenumber?: string | null) {
  const digits = normalizePhoneDigits(phonenumber);
  if (!digits) return true;
  const option = getPhoneCountryOption(phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE);
  return option.pattern.test(digits);
}

export function createIntlPhoneRule(
  getCountryCode: () => string | null | undefined,
  message = '手机号格式不正确'
): App.Global.FormRule {
  return {
    trigger: ['input', 'blur'],
    validator: (_rule, value: string) => {
      const digits = normalizePhoneDigits(value);
      if (!digits) return true;
      if (!validateIntlPhone(getCountryCode(), digits)) {
        return new Error(message);
      }
      return true;
    }
  };
}

/** 关键词匹配（含区号与完整号码） */
export function matchIntlPhoneKeyword(
  phonenumber?: string | null,
  phoneCountryCode?: string | null,
  keyword?: string | null
) {
  const kw = String(keyword || '').trim().toLowerCase();
  if (!kw) return true;
  const parts = splitIntlPhone(phonenumber, phoneCountryCode);
  const display = formatIntlPhoneDisplay(parts.phoneCountryCode, parts.phonenumber).toLowerCase();
  const compact = `${parts.phoneCountryCode}${parts.phonenumber}`.toLowerCase();
  return display.includes(kw) || compact.includes(kw) || parts.phonenumber.includes(kw);
}
