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

/** TMS 供应商协同：视图在 views/tms/supplier*，路由名与路径挂在 TMS 下 */
export const TMS_SUPPLIER_PERSISTENT_CHILD_ROUTES: ElegantRoute[] = [
  {
    name: 'tms_supplier-task',
    path: '/tms/supplier-task',
    component: 'view.tms_supplier-task',
    meta: { title: 'tms_supplier-task', i18nKey: 'route.tms_supplier-task' }
  },
  {
    name: 'tms_supplier-drayage',
    path: '/tms/supplier/drayage',
    component: 'view.tms_supplier-drayage',
    meta: { title: 'tms_supplier-drayage', i18nKey: 'route.tms_supplier-drayage' }
  },
  {
    name: 'tms_supplier-linehaul',
    path: '/tms/supplier/linehaul',
    component: 'view.tms_supplier-linehaul',
    meta: { title: 'tms_supplier-linehaul', i18nKey: 'route.tms_supplier-linehaul' }
  },
  {
    name: 'tms_supplier-ltl',
    path: '/tms/supplier/ltl',
    component: 'view.tms_supplier-ltl',
    meta: { title: 'tms_supplier-ltl', i18nKey: 'route.tms_supplier-ltl' }
  },
  {
    name: 'tms_supplier-devanning-loading',
    path: '/tms/supplier/devanning-loading',
    component: 'view.tms_supplier-devanning-loading',
    meta: {
      title: 'tms_supplier-devanning-loading',
      i18nKey: 'route.tms_supplier-devanning-loading'
    }
  },
  {
    name: 'tms_supplier-quote',
    path: '/tms/supplier/quote',
    component: 'view.tms_supplier-quote',
    meta: { title: 'tms_supplier-quote', i18nKey: 'route.tms_supplier-quote' }
  },
  {
    name: 'tms_supplier-account',
    path: '/tms/supplier/account',
    component: 'view.tms_supplier-account',
    meta: { title: 'tms_supplier-account', i18nKey: 'route.tms_supplier-account' }
  },
  {
    name: 'tms_supplier-bill',
    path: '/tms/supplier/bill',
    component: 'view.tms_supplier-bill',
    meta: { title: 'tms_supplier-bill', i18nKey: 'route.tms_supplier-bill' }
  },
  {
    name: 'tms_supplier-fleet',
    path: '/tms/supplier/fleet',
    component: 'view.tms_supplier-fleet',
    meta: { title: 'tms_supplier-fleet', i18nKey: 'route.tms_supplier-fleet' }
  },
  {
    name: 'tms_supplier-kpi',
    path: '/tms/supplier/kpi',
    component: 'view.tms_supplier-kpi',
    meta: { title: 'tms_supplier-kpi', i18nKey: 'route.tms_supplier-kpi' }
  }
];

const TMS_SUPPLIER_LEGACY_OMS_NAMES = new Set([
  'oms_supplier-drayage',
  'oms_supplier-container-op',
  'oms_supplier-linehaul',
  'oms_supplier-ltl',
  'oms_supplier-devanning-loading',
  'oms_supplier-quote',
  'oms_supplier-account',
  'oms_supplier-bill',
  'oms_supplier-fleet',
  'oms_supplier-kpi'
]);

export const PERSISTENT_ROUTE_PATHS = {
  'wms_devanning-work-exec': '/wms/devanning-work-exec',
  ...Object.fromEntries(TMS_SUPPLIER_PERSISTENT_CHILD_ROUTES.map(r => [r.name, r.path]))
} as const;

export const persistentViews: Record<string, RouteComponent | (() => Promise<RouteComponent>)> = {
  'wms_devanning-work-exec': () => import('@/views/wms/devanning-work-exec/index.vue'),
  'tms_supplier-task': () => import('@/views/tms/supplier-task/index.vue'),
  'tms_supplier-drayage': () => import('@/views/tms/supplier/drayage/index.vue'),
  'tms_supplier-linehaul': () => import('@/views/tms/supplier/linehaul/index.vue'),
  'tms_supplier-ltl': () => import('@/views/tms/supplier/ltl/index.vue'),
  'tms_supplier-devanning-loading': () => import('@/views/tms/supplier/devanning-loading/index.vue'),
  'tms_supplier-quote': () => import('@/views/tms/supplier/quote/index.vue'),
  'tms_supplier-account': () => import('@/views/tms/supplier/account/index.vue'),
  'tms_supplier-bill': () => import('@/views/tms/supplier/bill/index.vue'),
  'tms_supplier-fleet': () => import('@/views/tms/supplier/fleet/index.vue'),
  'tms_supplier-kpi': () => import('@/views/tms/supplier/kpi/index.vue')
};

function mergeModuleChildren(
  route: ElegantRoute,
  moduleName: string,
  extras: ElegantRoute[],
  filterNames?: Set<string>
): ElegantRoute {
  if (route.name !== moduleName) return route;
  let children = [...(route.children ?? [])];
  if (filterNames?.size) {
    children = children.filter(child => !filterNames.has(String(child.name)));
  }
  for (const extra of extras) {
    if (!children.some(child => child.name === extra.name)) {
      children.push(extra);
    }
  }
  return { ...route, children };
}

export function mergePersistentChildRoutes(routes: ElegantRoute[]): ElegantRoute[] {
  return routes.map(route => {
    if (route.name === 'wms') {
      return mergeModuleChildren(route, 'wms', WMS_PERSISTENT_CHILD_ROUTES);
    }
    if (route.name === 'tms') {
      return mergeModuleChildren(route, 'tms', TMS_SUPPLIER_PERSISTENT_CHILD_ROUTES);
    }
    if (route.name === 'oms') {
      return mergeModuleChildren(route, 'oms', [], TMS_SUPPLIER_LEGACY_OMS_NAMES);
    }
    return route;
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
