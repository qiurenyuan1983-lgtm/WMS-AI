/** 多币种金额格式化（门户展示） */
export function formatMoney(amount: number, currency = 'USD'): Api.Portal.MoneyValue {
  const locales: Record<string, string> = {
    USD: 'en-US',
    CNY: 'zh-CN',
    EUR: 'de-DE'
  };
  const locale = locales[currency] || 'en-US';
  const display = new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  return { amount, currency, display };
}
