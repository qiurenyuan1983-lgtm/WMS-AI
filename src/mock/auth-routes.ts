import type { ElegantRoute } from '@elegant-router/types';
import { generatedRoutes } from '@/router/elegant/routes';
import { findRouteInTree, getRoutesWithPersistentChildren } from '@/router/persistent-routes';

type RouteMeta = ElegantRoute['meta'];

function findRoute(name: string, routes: ElegantRoute[] = getRoutesWithPersistentChildren(generatedRoutes)): ElegantRoute | undefined {
  return findRouteInTree(name, routes);
}

function cloneRoute(route: ElegantRoute, extraMeta?: Partial<RouteMeta>): ElegantRoute {
  return {
    ...route,
    meta: { ...route.meta, ...extraMeta },
    children: route.children?.map(c => cloneRoute(c))
  };
}

function menuGroup(
  name: string,
  path: string,
  meta: RouteMeta,
  childNames: string[],
  order?: number,
  hiddenNames: string[] = []
): ElegantRoute {
  // hiddenNames ????????????? Tab ??�?????�?
  const allChildNames = [...childNames, ...hiddenNames.filter(n => !childNames.includes(n))];
  const menuActiveKey = childNames[0];

  const children = allChildNames
    .map(n => findRoute(n))
    .filter((r): r is ElegantRoute => Boolean(r))
    .map((r, index) =>
      cloneRoute(r, {
        order: r.meta?.order ?? index + 1,
        hideInMenu: hiddenNames.includes(r.name) ? true : r.meta?.hideInMenu,
        activeMenu: hiddenNames.includes(r.name)
          ? resolveHiddenActiveMenu(String(r.name), menuActiveKey)
          : r.meta?.activeMenu,
        multiTab: r.name === 'wms_devanning-order-detail' ? true : r.meta?.multiTab
      })
    );

  return {
    name,
    path,
    component: 'ParentView',
    meta: { ...meta, order: order ?? meta?.order },
    children
  };
}

function moduleShell(
  name: string,
  path: string,
  meta: RouteMeta,
  groups: ElegantRoute[],
  order: number
): ElegantRoute {
  const base = findRoute(name);
  return {
    name,
    path,
    component: base?.component ?? 'layout.base',
    meta: {
      ...base?.meta,
      ...meta,
      order
    },
    children: groups
  };
}

/** BASE (sys_menu 2000, base_all_basic_data + patches) */
function buildBaseRoutes(): ElegantRoute {
  return moduleShell(
    'base',
    '/base',
    { i18nKey: 'route.base', icon: 'mdi:database-cog-outline' },
    [
      menuGroup(
        'base_organization',
        '/base/organization',
        { i18nKey: 'route.base_organization', icon: 'mdi:office-building-outline' },
        ['base_company', 'base_warehouse'],
        1
      ),
      buildWmsWarehouseDataMenuGroup(2),
      menuGroup(
        'base_platform-group',
        '/base/platform-group',
        { i18nKey: 'route.base_platform-group', icon: 'mdi:store-outline' },
        ['oms_platform-warehouse'],
        3
      ),
      menuGroup(
        'base_business-data',
        '/base/business-data',
        { i18nKey: 'route.base_business-data', icon: 'mdi:briefcase-outline' },
        ['base_channel', 'base_business-type', 'base_value-added-service'],
        4
      ),
      menuGroup(
        'base_geo',
        '/base/geo',
        { i18nKey: 'route.base_geo', icon: 'mdi:earth' },
        ['base_country', 'base_state-province', 'base_city', 'base_timezone', 'base_zip-code'],
        5
      ),
      menuGroup(
        'base_finance',
        '/base/finance',
        { i18nKey: 'route.base_finance', icon: 'mdi:currency-usd' },
        ['base_currency', 'base_exchange-rate', 'base_fee-item'],
        6
      ),
      menuGroup(
        'base_logistics',
        '/base/logistics',
        { i18nKey: 'route.base_logistics', icon: 'mdi:ferry' },
        [
          'base_port',
          'base_terminal',
          'base_shipping-line',
          'base_shipping-route',
          'base_vessel'
        ],
        7
      ),
      menuGroup(
        'base_yard',
        '/base/yard-group',
        { i18nKey: 'route.base_yard', icon: 'mdi:map-marker-radius' },
        ['yard_dock', 'yard_zone'],
        8
      ),
      buildOmsConfigRoutes(9),
      buildPrintMenuGroup(10)
    ],
    87
  );
}

const WMS_HIDDEN_MENU = [
  'wms_devanning-order',
  'wms_devanning-order-detail',
  'wms_devanning-work-exec',
  'wms_stock-prep-exec',
  'wms_outbound-exec',
  'wms_outbound-loading',
  'wms_outbound-order',
  'pda_business',
  'pda_inbound',
  'pda_outbound',
  'pda_devanning',
  'pda_task'
];

const OMS_TRIP_HIDDEN = ['oms_trip-order-detail', 'oms_ltl-order-detail', 'oms_local-order-detail', 'wms_outbound-exec'];

function resolveHiddenActiveMenu(routeName: string, menuActiveKey: string): RouteMeta['activeMenu'] {
  if (routeName === 'oms_trip-order-detail') return 'oms_outbound-order';
  if (routeName === 'oms_ltl-order-detail') return 'oms_order-workbench';
  if (routeName === 'oms_local-order-detail') return 'oms_order-workbench';
  if (routeName === 'wms_outbound-exec') return 'wms_outbound-loading';
  if (routeName === 'print_designer') return menuActiveKey as RouteMeta['activeMenu'];
  return menuActiveKey as RouteMeta['activeMenu'];
}

/** WMS: PRD V1.0 prototype menu (sys_menu 6000+) */
function buildWmsRoutes(): ElegantRoute {
  return moduleShell(
    'wms',
    '/wms',
    { i18nKey: 'route.wms', icon: 'mdi:package-variant-closed' },
    [
      menuGroup(
        'wms_devanning-group',
        '/wms/devanning-group',
        { i18nKey: 'route.wms_devanning-group', icon: 'mdi:crane' },
        ['yms_devanning', 'wms_devanning-dock-qr', 'wms_devanning-work'],
        1,
        [...WMS_HIDDEN_MENU, 'yms_dispatch-detail', 'yms_dispatch-create']
      ),
      menuGroup(
        'wms_stock-prep-group',
        '/wms/stock-prep-group',
        { i18nKey: 'route.wms_stock-prep-group', icon: 'mdi:cart-arrow-right' },
        ['wms_stock-prep-order'],
        2,
        WMS_HIDDEN_MENU
      ),
      menuGroup(
        'wms_outbound-mgmt',
        '/wms/outbound-mgmt',
        { i18nKey: 'route.wms_outbound-mgmt', icon: 'mdi:truck-delivery' },
        ['wms_trip-outbound-plan', 'wms_driver-checkin', 'wms_dock-auto-schedule'],
        3,
        WMS_HIDDEN_MENU
      ),
      menuGroup(
        'wms_outbound-group',
        '/wms/outbound-group',
        { i18nKey: 'route.wms_outbound-group', icon: 'mdi:truck-delivery', hideInMenu: true },
        ['wms_pallet-outbound'],
        31,
        [...WMS_HIDDEN_MENU, 'yms_dispatch-detail', 'yms_dispatch-create', 'yms_loading']
      ),
      menuGroup(
        'wms_inventory-group',
        '/wms/inventory-group',
        { i18nKey: 'route.wms_inventory-group', icon: 'ep:box' },
        ['wms_pallet', 'wms_inventory-visualization'],
        4
      ),
      menuGroup(
        'wms_transit-group',
        '/wms/transit-group',
        { i18nKey: 'route.wms_transit-group', icon: 'mdi:swap-horizontal' },
        ['wms_transfer-workbench'],
        5
      )
    ],
    30
  );
}

/** 库位设置（挂基础数据菜单下，路由仍 /wms/*） */
function buildWmsWarehouseDataMenuGroup(order = 2): ElegantRoute {
  return menuGroup(
    'wms_warehouse-data',
    '/base/warehouse-data',
    { i18nKey: 'route.wms_warehouse-data', icon: 'ep:office-building' },
    ['wms_zone', 'wms_location'],
    order
  );
}

/** 打印中心（挂基础数据菜单下，路由仍 /print/*） */
function buildPrintMenuGroup(order = 10): ElegantRoute {
  return {
    name: 'print',
    path: '/print',
    component: 'ParentView',
    meta: { i18nKey: 'route.print', icon: 'mdi:printer-outline', order },
    children: [
      ...cloneMenuRoutes([['print_workbench', 1]]),
      menuGroup(
        'print_template',
        '/print/template',
        { i18nKey: 'route.print_template', icon: 'mdi:file-document-multiple-outline' },
        [
          'print_template-pallet-label',
          'print_template-devanning',
          'print_template-bol',
          'print_template-report',
          'print_template-invoice',
          'print_template-carton',
          'print_template-location',
          'print_template-custom'
        ],
        2,
        ['print_designer']
      ),
      ...cloneMenuRoutes([
        ['print_template-version', 3],
        ['print_rule', 4],
        ['print_permission', 5]
      ])
    ]
  };
}

/** 智能员工中心 */
function buildIecRoutes(): ElegantRoute {
  const childNames = [
    'iec_dashboard',
    'iec_role-config',
    'iec_auto-flow',
    'iec_rpa',
    'iec_task-queue',
    'iec_takeover',
    'iec_execution-log',
    'iec_credential',
    'iec_performance'
  ];
  const children = childNames
    .map(n => findRoute(n))
    .filter((r): r is ElegantRoute => Boolean(r))
    .map((r, index) => cloneRoute(r, { order: index + 1 }));

  return {
    name: 'iec',
    path: '/iec',
    component: 'layout.base',
    meta: {
      title: 'iec',
      i18nKey: 'route.iec',
      icon: 'mdi:robot-outline',
      order: 4
    },
    children
  };
}

/** Comm Center */
function buildCommRoutes(): ElegantRoute {
  return {
    name: 'comm',
    path: '/comm',
    component: 'layout.base',
    meta: { title: 'comm', i18nKey: 'route.comm', icon: 'mdi:chat-outline', order: 1 },
    children: cloneMenuRoutes([
      ['comm_message', 1],
      ['comm_settings', 2]
    ])
  };
}

/** 客户门户 */
function cloneMenuRoute(name: string, order: number, extraMeta?: Partial<RouteMeta>): ElegantRoute | null {
  const route = findRoute(name);
  if (!route) {
    // eslint-disable-next-line no-console
    console.warn(`[auth-routes] route not found: ${name}`);
    return null;
  }
  return cloneRoute(route, { order, ...extraMeta });
}

function cloneMenuRoutes(entries: Array<[string, number, Partial<RouteMeta>?]>): ElegantRoute[] {
  return entries
    .map(([name, order, extraMeta]) => cloneMenuRoute(name, order, extraMeta))
    .filter((r): r is ElegantRoute => Boolean(r));
}

function buildPortalRoutes(): ElegantRoute {
  const portalChildren = [
    cloneMenuRoute('portal_home', 1),
    cloneMenuRoute('portal_order-create', 2),
    cloneMenuRoute('portal_orders', 3),
    cloneMenuRoute('portal_inventory', 4),
    cloneMenuRoute('portal_in-transit', 5),
    cloneMenuRoute('portal_containers', 6),
    cloneMenuRoute('portal_transfer-ops', 7),
    cloneMenuRoute('portal_fee-confirm', 8),
    cloneMenuRoute('portal_bill', 9),
    cloneMenuRoute('portal_files', 10),
    cloneMenuRoute('portal_comm', 11),
    cloneMenuRoute('portal_exception', 12),
    cloneMenuRoute('portal_settings', 13)
  ].filter((r): r is ElegantRoute => Boolean(r));

  return {
    name: 'portal',
    path: '/portal',
    component: 'layout.base',
    meta: { title: 'portal', i18nKey: 'route.portal', icon: 'mdi:account-circle-outline', order: 2 },
    children: portalChildren
  };
}

/** PDA prototype shell */
function buildPdaRoutes(): ElegantRoute {
  return {
    name: 'pda',
    path: '/pda',
    component: 'layout.base',
    meta: { i18nKey: 'route.pda', icon: 'mdi:cellphone', order: 35 },
    children: [
      ...cloneMenuRoutes([['pda_home', 1]]),
      ...cloneMenuRoutes([
        ['pda_business', 2, { hideInMenu: true }],
        ['pda_inbound', 99, { hideInMenu: true }],
        ['pda_outbound', 99, { hideInMenu: true }],
        ['pda_devanning', 99, { hideInMenu: true }],
        ['pda_task', 3, { hideInMenu: true }]
      ])
    ]
  };
}

/** 规则中心（挂基础数据菜单下，路由仍 /oms/*） */
function buildOmsConfigRoutes(order = 9): ElegantRoute {
  const childNames = ['oms_zone-rule', 'oms_business-rule', 'oms_cargo-grouping-rule', 'oms_approval-flow'];
  const children = childNames
    .map((name, index) => {
      const route = findRoute(name);
      if (!route) return null;
      return cloneRoute(route, { order: index + 1 });
    })
    .filter((r): r is ElegantRoute => Boolean(r));

  return {
    name: 'oms_config',
    path: '/oms/config',
    component: 'ParentView',
    meta: { i18nKey: 'route.oms_config', icon: 'mdi:tune-variant', order },
    children
  };
}

/** OMS (sys_menu 3000) */
function buildOmsRoutes(): ElegantRoute {
  return moduleShell(
    'oms',
    '/oms',
    { i18nKey: 'route.oms', icon: 'ant-design:appstore-outlined' },
    [
      menuGroup(
        'oms_order',
        '/oms/order',
        { i18nKey: 'route.oms_order', icon: 'mdi:clipboard-list-outline' },
        [
          'oms_order-workbench',
          'oms_ltl-order',
          'oms_local-order',
          'oms_platform-order',
          'oms_container-order',
          'oms_cargo-order',
          'oms_platform-appointment',
          'oms_trip-recommend',
          'oms_outbound-order'
        ],
        1,
        OMS_TRIP_HIDDEN
      )
    ],
    20
  );
}

/** TMS 供应商管理（路由 /tms/supplier/*） */
function buildTmsSupplierMenuGroup(order = 7): ElegantRoute {
  return menuGroup(
    'tms_supplier',
    '/tms/supplier',
    { i18nKey: 'route.tms_supplier', title: 'tms_supplier', icon: 'mdi:truck-check-outline' },
    [
      'tms_supplier-task',
      'tms_supplier-drayage',
      'tms_supplier-linehaul',
      'tms_supplier-ltl',
      'tms_supplier-devanning-loading',
      'tms_supplier-quote',
      'tms_supplier-account',
      'tms_supplier-bill',
      'tms_supplier-fleet',
      'tms_supplier-kpi'
    ],
    order
  );
}

const YMS_HIDDEN_MENU = [
  'yms_dispatch-detail',
  'yms_dispatch-create',
  'yms_h5-driver-checkin',
  'yms_h5-trailer-checkin',
  'yms_h5-task-execute',
  'yms_gate-driver-qr',
  'yms_gate'
];

const TMS_HIDDEN_MENU = ['tms_home'];

/** TMS 运输管理系统 */
function buildTmsRoutes(): ElegantRoute {
  const menuActiveKey = 'tms_dispatch';

  function cloneTmsMenuRoute(name: string, order: number): ElegantRoute | null {
    const route = findRoute(name);
    if (!route) return null;
    return cloneRoute(route, {
      order,
      hideInMenu: TMS_HIDDEN_MENU.includes(route.name) ? true : route.meta?.hideInMenu,
      activeMenu: TMS_HIDDEN_MENU.includes(route.name)
        ? resolveHiddenActiveMenu(String(route.name), menuActiveKey)
        : route.meta?.activeMenu
    });
  }

  const children = [
    cloneTmsMenuRoute('tms_dispatch', 1),
    cloneTmsMenuRoute('tms_driver', 2),
    cloneTmsMenuRoute('tms_vehicle', 3),
    cloneTmsMenuRoute('tms_dock-board', 4),
    cloneTmsMenuRoute('tms_pod', 5),
    cloneTmsMenuRoute('tms_freight-settlement', 6),
    buildTmsSupplierMenuGroup(7),
    cloneTmsMenuRoute('tms_exception', 8),
    cloneTmsMenuRoute('tms_log', 9),
    cloneTmsMenuRoute('tms_home', 99)
  ].filter((r): r is ElegantRoute => Boolean(r));

  return moduleShell(
    'tms',
    '/tms',
    { title: 'tms', i18nKey: 'route.tms', icon: 'mdi:truck-delivery-outline' },
    children,
    21
  );
}

/** YMS (sys_menu 5000 + menu groups) */
function buildYmsRoutes(): ElegantRoute {
  return moduleShell(
    'yms',
    '/yms',
    { i18nKey: 'route.yms', icon: 'mdi:warehouse' },
    [
      menuGroup(
        'yms_monitor',
        '/yms/monitor',
        { i18nKey: 'route.yms_monitor', icon: 'mdi:view-dashboard-outline' },
        ['yms_overview'],
        1
      ),
      menuGroup(
        'yms_dispatch-work',
        '/yms/dispatch-work',
        { i18nKey: 'route.yms_dispatch-work', icon: 'mdi:truck-cargo-container' },
        ['yms_dispatch', 'yms_task'],
        2,
        YMS_HIDDEN_MENU
      ),
      menuGroup(
        'yms_gate-work',
        '/yms/gate-work',
        { i18nKey: 'route.yms_gate-work', icon: 'mdi:gate' },
        ['yms_gate-checkin', 'yms_gate-check-out', 'yms_gate-in-yard', 'yms_gate-trailer-link'],
        3,
        YMS_HIDDEN_MENU
      ),
      menuGroup(
        'yms_yard-resource',
        '/yms/yard-resource',
        { i18nKey: 'route.yms_yard-resource', icon: 'mdi:container' },
        ['yms_container', 'yms_trailer', 'yms_zone'],
        5,
        ['yms_yard-position']
      ),
      menuGroup(
        'yms_yard-operation',
        '/yms/yard-operation',
        { i18nKey: 'route.yms_yard-operation', icon: 'mdi:forklift' },
        ['yms_internal-task'],
        6,
        YMS_HIDDEN_MENU
      ),
      menuGroup(
        'yms_exception-audit',
        '/yms/exception-audit',
        { i18nKey: 'route.yms_exception-audit', icon: 'mdi:clipboard-check-outline' },
        ['yms_yard-inventory'],
        8
      )
    ],
    50
  );
}

const PROTOTYPE_MODULE_NAMES = new Set(['wms', 'oms', 'tms', 'yms', 'yard', 'base', 'pda', 'print', 'comm', 'iec', 'portal']);
/** 原型模式下不展示的框架内置菜单 */
const PROTOTYPE_HIDDEN_MENU_NAMES = new Set(['demo', 'tool']);

/** 系统监控（排在侧边栏底部） */
function buildMonitorRoutes(): ElegantRoute | null {
  const monitor = findRoute('monitor');
  if (!monitor) {
    // eslint-disable-next-line no-console
    console.warn('[auth-routes] route not found: monitor');
    return null;
  }
  return cloneRoute(monitor, {
    meta: {
      ...monitor.meta,
      order: 86,
      icon: monitor.meta?.icon || 'mdi:monitor-eye'
    }
  });
}

/** 系统管理（分组菜单，便于原型演示） */
function buildSystemRoutes(): ElegantRoute {
  return moduleShell(
    'system',
    '/system',
    { i18nKey: 'route.system', icon: 'mdi:cog-outline', order: 88 },
    [
      menuGroup(
        'system_user-group',
        '/system/user-group',
        { i18nKey: 'route.system_user-group', icon: 'mdi:account-cog-outline' },
        ['system_user', 'system_role', 'system_dept', 'system_post'],
        1
      ),
      menuGroup(
        'system_config-group',
        '/system/config-group',
        { i18nKey: 'route.system_config-group', icon: 'mdi:tune-vertical-variant' },
        // 菜单管理(system_menu) 固定在本分组下，不拆为侧边栏独立一级
        ['system_menu', 'system_dict', 'system_config', 'system_theme-config', 'system_notice'],
        2
      ),
      menuGroup(
        'system_tenant-group',
        '/system/tenant-group',
        { i18nKey: 'route.system_tenant-group', icon: 'mdi:domain' },
        ['system_tenant', 'system_tenant-package'],
        3
      ),
      menuGroup(
        'system_resource-group',
        '/system/resource-group',
        { i18nKey: 'route.system_resource-group', icon: 'mdi:folder-cog-outline' },
        ['system_client', 'system_oss'],
        4,
        ['system_oss-config']
      )
    ],
    88
  );
}

let cachedPrototypeAuthRoutes: ElegantRoute[] | null = null;

/** Prototype auth routes: backend-aligned menu tree for business modules */
export function buildPrototypeAuthRoutes(): ElegantRoute[] {
  if (cachedPrototypeAuthRoutes) {
    return cachedPrototypeAuthRoutes;
  }

  const comm = buildCommRoutes();
  const portal = buildPortalRoutes();
  const iec = buildIecRoutes();
  const businessModules = [
    buildOmsRoutes(),
    buildTmsRoutes(),
    buildWmsRoutes(),
    buildYmsRoutes(),
    buildPdaRoutes()
  ];
  const adminModules = [buildMonitorRoutes(), buildBaseRoutes(), buildSystemRoutes()].filter(
    (r): r is ElegantRoute => Boolean(r)
  );
  const others = generatedRoutes
    .filter(
      r =>
        !PROTOTYPE_MODULE_NAMES.has(r.name) &&
        !PROTOTYPE_HIDDEN_MENU_NAMES.has(r.name) &&
        r.name !== 'system' &&
        r.name !== 'monitor'
    )
    .map(r => (r.name === 'home' ? cloneRoute(r, { order: 2 }) : r));

  cachedPrototypeAuthRoutes = [comm, portal, iec, ...others, ...businessModules, ...adminModules];
  return cachedPrototypeAuthRoutes;
}

/** 菜单管理保存排序后刷新侧边栏路由缓存 */
export function invalidatePrototypeAuthRoutesCache() {
  cachedPrototypeAuthRoutes = null;
}
