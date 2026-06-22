<script setup lang="ts">
import { computed, ref } from 'vue';

defineOptions({ name: 'ForestSideMenu' });

interface Props {
  collapsed?: boolean;
}

const props = withDefaults(defineProps<Props>(), { collapsed: false });

const openKeys = ref(['system-settings']);

interface MenuNode {
  key: string;
  label: string;
  icon?: string;
  children?: MenuNode[];
}

const menuTree: MenuNode[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'material-symbols:dashboard-outline' },
  { key: 'order', label: '订单管理', icon: 'material-symbols:receipt-long-outline' },
  { key: 'inventory', label: '库存管理', icon: 'material-symbols:inventory-2-outline' },
  { key: 'vehicle', label: '车次管理', icon: 'material-symbols:local-shipping-outline' },
  { key: 'supplier', label: '供应商门户', icon: 'material-symbols:storefront-outline' },
  { key: 'print', label: '打印中心', icon: 'material-symbols:print-outline' },
  { key: 'kanban', label: '看板中心', icon: 'material-symbols:monitor-outline' },
  {
    key: 'system-settings',
    label: '系统设置',
    icon: 'material-symbols:settings-outline',
    children: [
      { key: 'base-info', label: '基础信息管理' },
      { key: 'user-role', label: '用户与角色管理' },
      { key: 'org', label: '组织架构管理' },
      { key: 'permission', label: '权限管理' },
      { key: 'params', label: '系统参数配置' },
      { key: 'theme-config', label: '主题配置管理' },
      { key: 'notice-template', label: '通知模板管理' },
      { key: 'log', label: '日志管理' },
      { key: 'dict', label: '数据字典管理' },
      { key: 'api', label: '接口管理' }
    ]
  }
];

const activeKey = ref('theme-config');

const flatItems = computed(() => {
  const items: { key: string; label: string; icon?: string; level: number; parent?: string }[] = [];
  menuTree.forEach(node => {
    if (node.children?.length) {
      items.push({ key: node.key, label: node.label, icon: node.icon, level: 0 });
      if (!props.collapsed) {
        node.children.forEach(child => items.push({ key: child.key, label: child.label, level: 1, parent: node.key }));
      }
    } else {
      items.push({ key: node.key, label: node.label, icon: node.icon, level: 0 });
    }
  });
  return items;
});

function isVisible(item: (typeof flatItems.value)[number]) {
  if (item.level === 0) return true;
  return !props.collapsed && openKeys.value.includes(item.parent || '');
}

function toggleGroup(key: string) {
  if (openKeys.value.includes(key)) openKeys.value = openKeys.value.filter(k => k !== key);
  else openKeys.value.push(key);
}
</script>

<template>
  <aside class="forest-sidebar" :class="{ collapsed }">
    <div class="menu-scroll">
      <template v-for="item in flatItems" :key="item.key">
        <div
          v-if="isVisible(item)"
          class="menu-item"
          :class="{
            active: activeKey === item.key,
            'is-child': item.level === 1,
            'is-group': item.key === 'system-settings' && item.level === 0
          }"
          @click="item.key === 'system-settings' && item.level === 0 ? toggleGroup(item.key) : (activeKey = item.key)"
        >
          <SvgIcon v-if="item.icon" :icon="item.icon" class="menu-icon" />
          <span v-if="!collapsed" class="menu-label">{{ item.label }}</span>
          <icon-material-symbols-expand-more
            v-if="!collapsed && item.key === 'system-settings' && item.level === 0"
            class="expand-icon"
            :class="{ open: openKeys.includes('system-settings') }"
          />
        </div>
      </template>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.forest-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: linear-gradient(180deg, #2f80ed 0%, #1e6fd9 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  transition: width 0.2s;

  &.collapsed {
    width: 64px;
  }
}

.menu-scroll {
  flex: 1;
  overflow: auto;
  padding: 12px 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 4px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }

  &.active {
    background: rgba(255, 255, 255, 0.22);
    font-weight: 600;
  }

  &.is-child {
    padding-left: 38px;
    font-size: 13px;
  }
}

.menu-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.menu-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.expand-icon {
  transition: transform 0.2s;
  &.open {
    transform: rotate(180deg);
  }
}

.collapsed .menu-label,
.collapsed .expand-icon {
  display: none;
}
</style>
