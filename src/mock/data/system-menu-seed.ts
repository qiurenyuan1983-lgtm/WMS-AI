import type { ElegantRoute } from '@elegant-router/types';
import { DEFAULT_LIST_FIELDS, ROUTE_LIST_FIELDS } from '@/constants/page-list-fields';
import { buildPrototypeAuthRoutes } from '@/mock/auth-routes';

type RouteNode = ElegantRoute & { children?: RouteNode[] };

const NOW = '2026-06-01 10:00:00';

const SKIP_ROUTE_NAMES = new Set(['403', '404', '500', 'login', 'iframe-page', 'user-center']);

const BUTTON_ACTIONS = [
  { label: '查询', action: 'list' },
  { label: '新增', action: 'add' },
  { label: '修改', action: 'edit' },
  { label: '删除', action: 'remove' },
  { label: '导出', action: 'export' },
  { label: '导入', action: 'import' }
] as const;

const MODULE_ID_START: Record<string, number> = {
  system: 2000,
  monitor: 2800,
  home: 2900,
  base: 3000,
  oms: 4000,
  comm: 4700,
  yms: 5000,
  wms: 6000,
  yard: 6800,
  pda: 7000,
  print: 7500,
  tool: 8200,
  about: 9800
};

const moduleCounters: Record<string, number> = {};

function nextMenuId(module: string): number {
  if (moduleCounters[module] === undefined) {
    moduleCounters[module] = MODULE_ID_START[module] ?? 9000;
  }
  const id = moduleCounters[module];
  moduleCounters[module] = id + 1;
  return id;
}

function routeNameToPermPrefix(routeName: string): string {
  const under = routeName.indexOf('_');
  if (under <= 0) return routeName;
  return `${routeName.slice(0, under)}:${routeName.slice(under + 1)}`;
}

function resolvePath(route: RouteNode): string {
  const parts = route.path.split('/').filter(Boolean);
  return parts[parts.length - 1] || route.path;
}

function resolveComponent(route: RouteNode, isLeaf: boolean): string {
  const comp = String(route.component || '');
  if (!isLeaf) return comp.includes('ParentView') ? 'ParentView' : 'Layout';
  if (comp.startsWith('view.')) {
    return `${comp.replace('view.', '').replace(/_/g, '/').replace(/-/g, '/')}/index`;
  }
  return comp || 'ParentView';
}

function createBaseRow(
  partial: {
    menuId: number;
    parentId: CommonType.IdType;
    menuName: string;
    menuType: Api.System.MenuType;
    orderNum: number;
    path: string;
    component: string;
    module: string;
    icon?: string;
    visible?: Api.Common.VisibleStatus;
    perms?: string;
    remark?: string;
  }
): Api.System.Menu {
  const { module, ...rest } = partial;
  return {
    isFrame: '1',
    isCache: '0',
    queryParam: '',
    visible: partial.visible ?? '0',
    status: '0',
    perms: partial.perms ?? '',
    icon: partial.icon ?? 'mdi:file-outline',
    parentName: '',
    remark: partial.remark ?? `module:${module}`,
    menuNameEn: '',
    menuCode: '',
    permName: '',
    permType: partial.menuType === 'F' ? 'button' : 'menu',
    highRisk: false,
    needConfirm: false,
    auditLog: partial.menuType === 'F',
    applicablePorts: 'BACKEND',
    applicableWarehouses: '',
    applicableRoles: '',
    applicableTenants: '',
    affixTab: false,
    openMode: 'self',
    createBy: 'admin',
    updateBy: 'admin',
    createTime: NOW,
    updateTime: NOW,
    children: [],
    ...rest
  };
}

function appendMenuPermissions(flat: Api.System.Menu[], parentMenuId: number, routeName: string, module: string) {
  const permPrefix = routeNameToPermPrefix(routeName);

  BUTTON_ACTIONS.forEach((btn, index) => {
    flat.push(
      createBaseRow({
        menuId: nextMenuId(module),
        parentId: parentMenuId,
        menuName: btn.label,
        menuType: 'F',
        orderNum: index + 1,
        path: '',
        component: '',
        perms: `${permPrefix}:${btn.action}`,
        icon: 'mdi:gesture-tap-button',
        visible: '0',
        remark: `btn_perm|module:${module}`,
        module
      })
    );
  });

  const fieldGroupId = nextMenuId(module);
  flat.push(
    createBaseRow({
      menuId: fieldGroupId,
      parentId: parentMenuId,
      menuName: '字段显示',
      menuType: 'M',
      orderNum: 90,
      path: 'fields',
      component: 'ParentView',
      icon: 'mdi:table-column',
      visible: '1',
      remark: `field_group|module:${module}`,
      module
    })
  );

  const fields = ROUTE_LIST_FIELDS[routeName] ?? DEFAULT_LIST_FIELDS;
  fields.forEach((field, index) => {
    flat.push(
      createBaseRow({
        menuId: nextMenuId(module),
        parentId: fieldGroupId,
        menuName: field.label,
        menuType: 'F',
        orderNum: index + 1,
        path: '',
        component: '',
        perms: `${permPrefix}:field:${field.key}`,
        icon: 'mdi:table-column',
        visible: '0',
        remark: `field_perm|module:${module}`,
        module
      })
    );
  });
}

function walkRoutes(routes: RouteNode[], parentId: CommonType.IdType, module: string, flat: Api.System.Menu[]) {
  routes.forEach((route, index) => {
    const routeName = String(route.name);
    if (SKIP_ROUTE_NAMES.has(routeName) || route.meta?.constant) return;

    const isLeaf = !route.children?.length;
    const menuId = nextMenuId(module);
    const i18nKey = route.meta?.i18nKey ?? `route.${routeName}`;
    const menuType: Api.System.MenuType = isLeaf ? 'C' : 'M';
    const visible: Api.Common.VisibleStatus = route.meta?.hideInMenu ? '1' : '0';

    flat.push(
      createBaseRow({
        menuId,
        parentId,
        menuName: i18nKey,
        menuType,
        orderNum: route.meta?.order ?? index + 1,
        path: resolvePath(route),
        component: resolveComponent(route, isLeaf),
        icon: String(route.meta?.icon || 'mdi:folder-outline'),
        visible,
        module
      })
    );

    if (route.children?.length) {
      walkRoutes(route.children, menuId, module, flat);
      return;
    }

    if (menuType === 'C') {
      appendMenuPermissions(flat, menuId, routeName, module);
    }
  });
}

/** 从静态路由树生成完整菜单（含功能按钮 + 字段显示） */
export function buildSystemMenuFlat(): Api.System.Menu[] {
  Object.keys(moduleCounters).forEach(key => {
    delete moduleCounters[key];
  });

  const flat: Api.System.Menu[] = [];
  const roots = buildPrototypeAuthRoutes() as RouteNode[];

  roots.forEach(root => {
    const module = String(root.name);
    const rootId = nextMenuId(module);
    const i18nKey = root.meta?.i18nKey ?? `route.${module}`;

    flat.push(
      createBaseRow({
        menuId: rootId,
        parentId: 0,
        menuName: i18nKey,
        menuType: 'M',
        orderNum: root.meta?.order ?? 1,
        path: resolvePath(root),
        component: 'Layout',
        icon: String(root.meta?.icon || 'mdi:folder-outline'),
        module
      })
    );

    if (root.children?.length) {
      walkRoutes(root.children, rootId, module, flat);
    }
  });

  return flat;
}

export function getAllSystemMenuIds(flat: Api.System.Menu[] = buildSystemMenuFlat()): number[] {
  return flat.map(item => Number(item.menuId));
}

export function getSystemMenuIdsByModules(
  modules: string[],
  flat: Api.System.Menu[] = buildSystemMenuFlat()
): number[] {
  const moduleSet = new Set(modules);
  return flat
    .filter(item => {
      const remark = String(item.remark || '');
      return modules.some(mod => remark.includes(`module:${mod}`) || item.menuName === `route.${mod}`);
    })
    .map(item => Number(item.menuId));
}
