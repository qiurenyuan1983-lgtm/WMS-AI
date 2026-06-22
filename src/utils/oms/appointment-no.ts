type AppointmentNoContext = {
  platformName?: string | null;
  orderType?: string | null;
};

export function isAmazonPlatform(ctx?: AppointmentNoContext): boolean {
  const platform = (ctx?.platformName ?? '').toLowerCase();
  return platform.includes('amazon') || ctx?.orderType === 'AMAZON';
}

/** 亚马逊订单预约号统一以 ISA 开头展示 */
export function formatAppointmentNo(
  appointmentNo: string | null | undefined,
  ctx?: AppointmentNoContext
): string {
  if (!appointmentNo) return '';
  if (/^ISA/i.test(appointmentNo)) return appointmentNo;
  if (!isAmazonPlatform(ctx)) return appointmentNo;
  const suffix = appointmentNo.replace(/^APT-/i, '');
  return `ISA-${suffix}`;
}

export function displayAppointmentNo(
  appointmentNo: string | null | undefined,
  ctx?: AppointmentNoContext,
  fallback = '--'
): string {
  if (!appointmentNo) return fallback;
  return formatAppointmentNo(appointmentNo, ctx) || fallback;
}
