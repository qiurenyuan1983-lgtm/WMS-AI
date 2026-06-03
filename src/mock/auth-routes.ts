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
        activeMenu: hiddenNames.includes(r.name) ? (menuActiveKey as RouteMeta['activeMenu']) : r.meta?.activeMenu,
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
      menuGroup(
        'base_goods',
        '/base/goods',
        { i18nKey: 'route.base_goods', icon: 'mdi:package-variant' },
        ['base_sku'],
        2
      ),
      menuGroup(
        'base_platform-group',
        '/base/platform-group',
        { i18nKey: 'route.base_platform-group', icon: 'mdi:store-outline' },
        ['base_platform', 'base_platform-address'],
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
      )
    ],
    10
  );
}

const WMS_HIDDEN_MENU = [
  'wms_devanning-order-detail',
  'wms_devanning-work-exec',
  'wms_inbound-task',
  'wms_putaway-pda',
  'wms_vas-work',
  'wms_stock-prep-exec',
  'wms_outbound-exec',
  'wms_outbound-loading',
  'pda_business',
  'pda_inbound',
  'pda_outbound',
  'pda_task'
];

/** WMS: PRD V1.0 prototype menu (sys_menu 6000+) */
function buildWmsRoutes(): ElegantRoute {
  return moduleShell(
    'wms',
    '/wms',
    { i18nKey: 'route.wms', icon: 'carbon:warehouse' },
    [
      menuGroup(
        'wms_devanning-group',
        '/wms/devanning-group',
        { i18nKey: 'route.wms_devanning-group', icon: 'mdi:crane' },
        ['wms_devanning-order', 'wms_devanning-work', 'wms_devanning-dock-qr'],
        1,
        WMS_HIDDEN_MENU
      ),
      menuGroup(
        'wms_inbound-group',
        '/wms/inbound-group',
        { i18nKey: 'route.wms_inbound-group', icon: 'mdi:package-down' },
        ['wms_inbound-order'],
        2,
        WMS_HIDDEN_MENU
      ),
      menuGroup(
        'wms_putaway-group',
        '/wms/putaway-group',
        { i18nKey: 'route.wms_putaway-group', icon: 'mdi:arrow-up-bold-box' },
        ['wms_putaway-task', 'wms_putaway-pda'],
        3,
        WMS_HIDDEN_MENU
      ),
      menuGroup(
        'wms_operation-group',
        '/wms/operation-group',
        { i18nKey: 'route.wms_operation-group', icon: 'mdi:clipboard-text-play' },
        ['wms_operation-order'],
        4
      ),
      menuGroup(
        'wms_vas-group',
        '/wms/vas-group',
        { i18nKey: 'route.wms_vas-group', icon: 'mdi:star-circle' },
        ['wms_vas-task'],
        5,
        WMS_HIDDEN_MENU
      ),
      menuGroup(
        'wms_stock-prep-group',
        '/wms/stock-prep-group',
        { i18nKey: 'route.wms_stock-prep-group', icon: 'mdi:cart-arrow-right' },
        ['wms_stock-prep-order'],
        6,
        WMS_HIDDEN_MENU
      ),
      menuGroup(
        'wms_outbound-group',
        '/wms/outbound-group',
        { i18nKey: 'route.wms_outbound-group', icon: 'mdi:truck-delivery' },
        ['wms_outbound-order', 'wms_outbound-exec', 'wms_outbound-loading', 'wms_pallet-outbound'],
        7,
        WMS_HIDDEN_MENU
      ),
      menuGroup(
        'wms_inventory-group',
        '/wms/inventory-group',
        { i18nKey: 'route.wms_inventory-group', icon: 'ep:box' },
        ['wms_inventory', 'wms_pallet', 'wms_inventory-lock', 'wms_inventory-transaction', 'wms_inventory-visualization'],
        8
      ),
      menuGroup(
        'wms_warehouse-data',
        '/wms/warehouse-data',
        { i18nKey: 'route.wms_warehouse-data', icon: 'ep:office-building' },
        ['wms_zone', 'wms_location'],
        9
      )
    ],
    30
  );
}

/** PDA prototype shell */
function buildPdaRoutes(): ElegantRoute {
  return {
    name: 'pda',
    path: '/pda',
    component: 'layout.base',
    meta: { i18nKey: 'route.pda', icon: 'mdi:cellphone', order: 35 },
    children: [
      cloneRoute(findRoute('pda_home')!, { order: 1 }),
      cloneRoute(findRoute('pda_task')!, { order: 2, hideInMenu: true })
    ]
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
          'oms_container-order',
          'oms_cargo-order',
          'oms_platform-appointment',
          'oms_pre-outbound',
          'oms_outbound-order',
          'oms_outbound-pool'
        ],
        1
      ),
      menuGroup(
        'oms_plan',
        '/oms/plan',
        { i18nKey: 'route.oms_plan', icon: 'mdi:calendar-import' },
        ['oms_inbound-plan'],
        2
      ),
      menuGroup(
        'oms_config',
        '/oms/config',
        { i18nKey: 'route.oms_config', icon: 'mdi:tune-variant' },
        ['oms_cargo-grouping-rule'],
        3
      )
    ],
    20
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
        ['yms_dispatch', 'yms_task', 'yms_devanning', 'yms_loading'],
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

const PROTOTYPE_MODULE_NAMES = new Set(['wms', 'oms', 'yms', 'yard', 'base', 'pda']);

/** Prototype auth routes: backend-aligned menu tree for business modules */
export function buildPrototypeAuthRoutes(): ElegantRoute[] {
  const businessModules = [
    buildBaseRoutes(),
    buildOmsRoutes(),
    buildWmsRoutes(),
    buildYmsRoutes(),
    buildPdaRoutes()
  ];
  const others = generatedRoutes.filter(r => !PROTOTYPE_MODULE_NAMES.has(r.name));
  return [...others, ...businessModules];
}
