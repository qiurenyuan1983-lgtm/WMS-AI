import type { RouteComponent } from 'vue-router';
import type { LastLevelRouteKey, RouteLayout } from '@elegant-router/types';
import { layouts as generatedLayouts, views as generatedViews } from './imports';
import { persistentViews } from '../persistent-routes';

export const layouts = generatedLayouts as Record<RouteLayout, RouteComponent | (() => Promise<RouteComponent>)>;

export const views = {
  ...generatedViews,
  ...persistentViews
} as Record<LastLevelRouteKey, RouteComponent | (() => Promise<RouteComponent>)>;
