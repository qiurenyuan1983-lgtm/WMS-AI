import type { RouteKey } from '@elegant-router/types';

/** YMS 页面路由名（与 component 推导的 name 一致，菜单分组后仍稳定） */
export const YMS_ROUTE = {
  overview: 'yms_overview',
  dispatch: 'yms_dispatch',
  dispatchDetail: 'yms_dispatch-detail',
  dispatchCreate: 'yms_dispatch-create',
  task: 'yms_task',
  devanning: 'yms_devanning',
  loading: 'yms_loading',
  gateInYard: 'yms_gate-in-yard',
  gateCheckin: 'yms_gate-checkin',
  h5TaskExecute: 'yms_h5-task-execute',
  h5TrailerCheckin: 'yms_h5-trailer-checkin'
} as const satisfies Record<string, RouteKey>;

export function ymsTo(name: RouteKey, query?: Record<string, string | number>) {
  if (!query) return { name };
  const q = Object.fromEntries(Object.entries(query).map(([k, v]) => [k, String(v)]));
  return { name, query: q };
}
