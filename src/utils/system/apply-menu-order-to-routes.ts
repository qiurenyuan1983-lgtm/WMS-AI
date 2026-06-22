import type { ElegantRoute } from '@elegant-router/types';

/** 从扁平菜单构建 i18nKey → orderNum 映射（仅目录/页面） */
export function buildMenuOrderMap(flat: Api.System.Menu[]): Map<string, number> {
  const map = new Map<string, number>();
  flat
    .filter(item => item.menuType === 'M' || item.menuType === 'C')
    .forEach(item => {
      if (item.menuName) {
        map.set(item.menuName, item.orderNum ?? 0);
      }
    });
  return map;
}

/** 用菜单管理中的 orderNum 覆盖静态路由 meta.order（方案 B） */
export function applyMenuOrderToRoutes(routes: ElegantRoute[], orderMap: Map<string, number>): ElegantRoute[] {
  return routes.map(route => {
    const i18nKey = route.meta?.i18nKey;
    const mappedOrder = i18nKey && orderMap.has(i18nKey) ? orderMap.get(i18nKey) : undefined;
    const children = route.children?.length ? applyMenuOrderToRoutes(route.children, orderMap) : route.children;

    return {
      ...route,
      meta: {
        ...route.meta,
        order: mappedOrder ?? route.meta?.order
      },
      children
    };
  });
}
