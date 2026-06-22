import type { RouteKey, RouteMap, RoutePath } from '@elegant-router/types';
import { PERSISTENT_ROUTE_PATHS } from '../persistent-routes';
import { getRouteName as getGeneratedRouteName, getRoutePath as getGeneratedRoutePath } from './transform';

/** 合并持久化路由路径（如 TMS 供应商 /tms/supplier/*） */
export function getRoutePath<T extends RouteKey>(name: T) {
  const persistent = PERSISTENT_ROUTE_PATHS[name as keyof typeof PERSISTENT_ROUTE_PATHS];
  if (persistent) return persistent as RouteMap[T];
  return getGeneratedRoutePath(name);
}

export function getRouteName(path: RoutePath) {
  const persistentEntry = Object.entries(PERSISTENT_ROUTE_PATHS).find(([, routePath]) => routePath === path);
  if (persistentEntry) return persistentEntry[0] as RouteKey;
  return getGeneratedRouteName(path);
}
