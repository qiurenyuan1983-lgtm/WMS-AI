import { handleTree } from '@/utils/common';
import { getMenuFlat, MOCK_ROLE_MENUS } from '@/mock/data/system';

/** 与系统菜单管理页一致：递归排除按钮类型 F */
export function filterNavigationMenuNodes(nodes: Api.System.MenuList): Api.System.MenuList {
  return nodes
    .filter(node => node.menuType !== 'F')
    .map(node => ({
      ...node,
      id: node.menuId ?? node.id,
      label: node.menuName ?? node.label,
      children: node.children?.length ? filterNavigationMenuNodes(node.children) : undefined
    })) as Api.System.MenuList;
}

/** 基于菜单树下拉数据构建导航菜单树（与系统菜单管理内容一致） */
export function buildSystemNavigationMenuTreeFromSelect(menuTree: Api.System.MenuList) {
  return [
    {
      menuId: 0,
      id: 0,
      menuName: '根目录',
      label: '根目录',
      icon: 'material-symbols:home-outline-rounded',
      children: filterNavigationMenuNodes(menuTree)
    }
  ] as Api.System.MenuList;
}

/** 基于扁平菜单列表构建（兼容 list 接口） */
export function buildSystemNavigationMenuTree(flatOrTree: Api.System.Menu[]) {
  const { tree } = handleTree(flatOrTree, {
    idField: 'menuId',
    filterFn: item => item.menuType !== 'F'
  });
  return buildSystemNavigationMenuTreeFromSelect(
    tree.map(node => ({
      ...node,
      id: node.menuId,
      label: node.menuName,
      children: node.children
    })) as Api.System.MenuList
  );
}

function collectRoleMenuIds(roleIds: CommonType.IdType[]) {
  const result = new Set<number>();
  roleIds.forEach(roleId => {
    (MOCK_ROLE_MENUS[Number(roleId)] || []).forEach(menuId => result.add(Number(menuId)));
  });
  return result;
}

/** 用户已授权的目录/菜单（M、C） */
export function getUserNavigationMenuCheckedKeys(roleIds: CommonType.IdType[]) {
  const menuFlat = getMenuFlat();
  const navigableIds = new Set(
    menuFlat.filter(item => item.menuType === 'M' || item.menuType === 'C').map(item => Number(item.menuId))
  );
  return [...collectRoleMenuIds(roleIds)].filter(id => navigableIds.has(id));
}

/** 用户已授权的按钮（F + btn_perm） */
export function getUserButtonMenuCheckedKeys(roleIds: CommonType.IdType[]) {
  const menuFlat = getMenuFlat();
  const buttonIds = new Set(
    menuFlat.filter(item => item.menuType === 'F' && String(item.remark || '').includes('btn_perm')).map(item =>
      Number(item.menuId)
    )
  );
  return [...collectRoleMenuIds(roleIds)].filter(id => buttonIds.has(id));
}

/** 包装角色菜单树（含功能/字段权限）供 MenuTree permission-mode 使用 */
export function wrapRoleMenuTree(menus: Api.System.MenuList) {
  if (menus.length === 1 && Number(menus[0]?.id) === 0) return menus;
  return [
    {
      id: 0,
      menuId: 0,
      label: '根目录',
      menuName: '根目录',
      icon: 'material-symbols:home-outline-rounded',
      children: menus
    }
  ] as Api.System.MenuList;
}
