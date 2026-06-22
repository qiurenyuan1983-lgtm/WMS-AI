import { watch } from 'vue';
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router';
import { isValidBusinessKey, resolveTaskType } from './business-config';

/** PDA 路由 biz / taskType 参数兜底 */
export function usePdaBizGuard(route: RouteLocationNormalizedLoaded, router: Router, options?: { fixTaskType?: boolean }) {
  watch(
    () => [route.query.biz, route.query.taskType] as const,
    ([biz, taskType]) => {
      const bizStr = String(biz || '');
      if (bizStr && !isValidBusinessKey(bizStr)) {
        router.replace({ name: 'pda_home' });
        return;
      }
      if (options?.fixTaskType && taskType) {
        const resolved = resolveTaskType(String(taskType));
        if (resolved !== String(taskType)) {
          router.replace({ query: { ...route.query, taskType: resolved } });
        }
      }
    },
    { immediate: true }
  );
}
