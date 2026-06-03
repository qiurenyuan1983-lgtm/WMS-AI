import type { ElegantRoute } from '@elegant-router/types';
import type { RouteComponent } from 'vue-router';

/**
 * Prototype routes that must survive elegant-router regeneration.
 * Keep execute/work pages here when the view lives outside the default scan path.
 */
export const WMS_PERSISTENT_CHILD_ROUTES: ElegantRoute[] = [
  {
    name: 'wms_devanning-work-exec',
    path: '/wms/devanning-work-exec',
    component: 'view.wms_devanning-work-exec',
    meta: {
      title: 'wms_devanning-work-exec',
      i18nKey: 'route.wms_devanning-work-exec',
      hideInMenu: true,
      activeMenu: 'wms_devanning-work',
      multiTab: true
    }
  }
];

export const PERSISTENT_ROUTE_PATHS = {
  'wms_devanning-work-exec': '/wms/devanning-work-exec'
} as const;

export const persistentViews: Record<string, RouteComponent | (() => Promise<RouteComponent>)> = {
  'wms_devanning-work-exec': () => import('@/views/wms/devanning-work-exec/index.vue')
};

export function mergePersistentChildRoutes(routes: ElegantRoute[]): ElegantRoute[] {
  return routes.map(route => {
    if (route.name !== 'wms') return route;
    const children = [...(route.children ?? [])];
    for (const extra of WMS_PERSISTENT_CHILD_ROUTES) {
      if (!children.some(child => child.name === extra.name)) {
        children.push(extra);
      }
    }
    return { ...route, children };
  });
}

export function getRoutesWithPersistentChildren(routes: ElegantRoute[]): ElegantRoute[] {
  return mergePersistentChildRoutes(routes);
}

export function findRouteInTree(name: string, routes: ElegantRoute[]): ElegantRoute | undefined {
  for (const route of routes) {
    if (route.name === name) return route;
    if (route.children?.length) {
      const found = findRouteInTree(name, route.children);
      if (found) return found;
    }
  }
  return undefined;
}
