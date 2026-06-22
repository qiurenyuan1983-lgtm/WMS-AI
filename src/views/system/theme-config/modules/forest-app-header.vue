<script setup lang="ts">
import { useRouter } from 'vue-router';

defineOptions({ name: 'ForestAppHeader' });

const router = useRouter();
const collapsed = defineModel<boolean>('collapsed', { default: false });

function goBack() {
  router.push('/home');
}
</script>

<template>
  <header class="forest-header">
    <div class="header-left">
      <NButton quaternary circle class="collapse-btn" @click="collapsed = !collapsed">
        <template #icon>
          <icon-material-symbols-menu class="text-18px" />
        </template>
      </NButton>
      <NButton size="small" quaternary class="back-btn" @click="goBack">返回系统</NButton>
      <div class="logo-wrap">
        <span class="logo-icon">F</span>
        <span class="logo-text">FOREST AI WMS</span>
      </div>
    </div>

    <div class="header-search">
      <NInput round clearable placeholder="搜索功能、菜单或数据...">
        <template #prefix>
          <icon-ic-round-search class="text-16px text-#6b7a90" />
        </template>
      </NInput>
    </div>

    <div class="header-right">
      <NBadge :value="12" :max="99">
        <NButton quaternary circle>
          <template #icon>
            <icon-material-symbols-notifications-outline class="text-18px" />
          </template>
        </NButton>
      </NBadge>
      <NBadge :value="5" :max="99">
        <NButton quaternary circle>
          <template #icon>
            <icon-material-symbols-mail-outline class="text-18px" />
          </template>
        </NButton>
      </NBadge>
      <NButton quaternary circle>
        <template #icon>
          <icon-material-symbols-fullscreen class="text-18px" />
        </template>
      </NButton>
      <span class="lang-text">简体中文</span>
      <NAvatar round size="small" class="user-avatar">管</NAvatar>
      <span class="user-name">系统管理员</span>
      <icon-material-symbols-keyboard-arrow-down class="text-16px text-#6b7a90" />
    </div>
  </header>
</template>

<style scoped lang="scss">
.forest-header {
  height: 64px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 20px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #dcebfa;
  box-shadow: 0 2px 12px rgba(24, 144, 255, 0.06);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.logo-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #1890ff, #58b8ff);
  color: #fff;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  color: #1f2d3d;
  white-space: nowrap;
}

.header-search {
  flex: 1;
  max-width: 420px;
  min-width: 180px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  flex-shrink: 0;
}

.lang-text,
.user-name {
  font-size: 13px;
  color: #1f2d3d;
}

.user-avatar {
  background: #1890ff;
  color: #fff;
}

@media (max-width: 1200px) {
  .header-search {
    display: none;
  }
  .lang-text,
  .user-name {
    display: none;
  }
}
</style>
