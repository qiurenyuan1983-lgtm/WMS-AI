<script setup lang="ts">
import { computed } from 'vue';
import type { Component } from 'vue';
import { loginModuleRecord } from '@/constants/app';
import { useAppStore } from '@/store/modules/app';
import { useThemeStore } from '@/store/modules/theme';
import loginBg from '@/assets/imgs/login-warehouse-bg.png';
import PwdLogin from './modules/pwd-login.vue';
import CodeLogin from './modules/code-login.vue';
import Register from './modules/register.vue';
import ResetPwd from './modules/reset-pwd.vue';
import BindWechat from './modules/bind-wechat.vue';

interface Props {
  module?: UnionKey.LoginModule;
}

const props = defineProps<Props>();

const appStore = useAppStore();
const themeStore = useThemeStore();

interface LoginModule {
  label: App.I18n.I18nKey;
  component: Component;
}

const moduleMap: Record<UnionKey.LoginModule, LoginModule> = {
  'pwd-login': { label: loginModuleRecord['pwd-login'], component: PwdLogin },
  'code-login': { label: loginModuleRecord['code-login'], component: CodeLogin },
  register: { label: loginModuleRecord.register, component: Register },
  'reset-pwd': { label: loginModuleRecord['reset-pwd'], component: ResetPwd },
  'bind-wechat': { label: loginModuleRecord['bind-wechat'], component: BindWechat }
};

const activeModule = computed(() => moduleMap[props.module || 'pwd-login']);

const showBrandPanel = computed(() => props.module === 'pwd-login' || !props.module);
</script>

<template>
  <div class="forest-login">
    <img class="forest-login-bg" :src="loginBg" alt="" />

    <div class="forest-login-overlay" />

    <header class="forest-login-topbar">
      <div class="forest-login-tools">
        <ThemeSchemaSwitch
          :theme-schema="themeStore.themeScheme"
          :show-tooltip="false"
          class="forest-login-tool-btn"
          @switch="themeStore.toggleThemeScheme"
        />
        <LangSwitch
          v-if="themeStore.header.multilingual.visible"
          :lang="appStore.locale"
          :lang-options="appStore.localeOptions"
          :show-tooltip="false"
          class="forest-login-tool-btn"
          @change-lang="appStore.changeLocale"
        />
      </div>
    </header>

    <main class="forest-login-main">
      <section class="forest-login-card">
        <div v-if="showBrandPanel" class="forest-login-card-brand">
          <span class="forest-login-card-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
              <path
                d="M12 3L2 9v12h7v-7h6v7h7V9L12 3zm0 2.2l6.5 4.3H5.5L12 5.2zM11 11h2v7h-2v-7z"
              />
            </svg>
          </span>
          <div>
            <h1 class="forest-login-card-title">FOREST</h1>
            <p class="forest-login-card-subtitle">大牛仓 AI 智能仓库系统</p>
          </div>
        </div>

        <Transition :name="themeStore.page.animateMode" mode="out-in" appear>
          <component :is="activeModule.component" />
        </Transition>
      </section>
    </main>
  </div>
</template>

<style scoped>
.forest-login {
  position: relative;
  min-height: 100vh;
  overflow: auto;
  color: #fff;
}

.forest-login-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
}

.forest-login-overlay {
  position: fixed;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    90deg,
    rgba(8, 24, 48, 0.82) 0%,
    rgba(8, 24, 48, 0.45) 38%,
    rgba(8, 24, 48, 0.18) 100%
  );
  pointer-events: none;
}

.forest-login-topbar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 24px 32px;
}

.forest-login-tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.forest-login-tool-btn {
  color: rgba(255, 255, 255, 0.92) !important;
  font-size: 20px;
}

.forest-login-main {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  min-height: calc(100vh - 82px);
  padding: 24px clamp(20px, 5vw, 72px) 48px;
}

.forest-login-card {
  flex-shrink: 0;
  width: min(420px, 100%);
  padding: 28px 28px 24px;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(18px);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.28);
}

.forest-login-card-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}

.forest-login-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2dd4bf, #0ea5e9);
  color: #fff;
  flex-shrink: 0;
}

.forest-login-card-title {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 0.06em;
  line-height: 1.1;
  color: #fff;
}

.forest-login-card-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.82);
}

@media (max-width: 480px) {
  .forest-login-topbar {
    padding: 16px 18px;
  }

  .forest-login-main {
    padding: 12px 16px 32px;
  }

  .forest-login-card {
    padding: 22px 18px 18px;
    border-radius: 22px;
  }
}
</style>
