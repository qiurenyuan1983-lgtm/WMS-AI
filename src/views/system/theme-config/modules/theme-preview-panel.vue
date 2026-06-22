<script setup lang="tsx">
import { computed } from 'vue';
import type { ThemeVisualConfig } from '../shared/theme-visual-config';

defineOptions({ name: 'ThemePreviewPanel' });

const props = defineProps<{
  visual: ThemeVisualConfig;
  compact?: boolean;
}>();

const primary = computed(() => props.visual.colors.primary);
const secondary = computed(() => props.visual.colors.secondary || '#58B8FF');
const bg = computed(() => props.visual.colors.background);
const cardBg = computed(() =>
  props.visual.components.cardBg === 'GLASS' ? 'rgba(255,255,255,0.72)' : '#ffffff'
);
const buttonRadius = computed(() => {
  const map: Record<string, string> = { SMALL: '4px', MEDIUM: '8px', LARGE: '12px' };
  return map[props.visual.components.buttonRadius] || '8px';
});
</script>

<template>
  <div class="theme-preview-panel" :class="{ compact }">
    <div class="preview-header">
      <span class="preview-title">实时预览</span>
      <span class="preview-hint">登录页、后台框架等；不含操作数据看板</span>
      <slot name="extra" />
    </div>

    <div class="preview-single">
      <div class="preview-block">
        <div class="preview-label">登录页预览</div>
        <div
          class="preview-login"
          :style="{ background: `linear-gradient(160deg, ${bg} 0%, ${secondary}55 50%, ${primary}33 100%)` }"
        >
          <div class="cloud cloud-1" />
          <div class="cloud cloud-2" />
          <div
            class="login-card"
            :style="{
              background: cardBg,
              backdropFilter: visual.basic.glassEffect ? 'blur(12px)' : 'none',
              borderRadius: buttonRadius
            }"
          >
            <div class="login-logo" :style="{ color: primary }">{{ visual.login.title || 'FOREST AI WMS' }}</div>
            <div class="login-input" />
            <div class="login-input" />
            <div class="login-btn" :style="{ background: primary, borderRadius: buttonRadius }">登录</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.preview-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  margin-bottom: 10px;
}

.preview-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
}

.preview-hint {
  font-size: 12px;
  color: #6b7a90;
}

.preview-header :deep(.n-button) {
  margin-left: auto;
}

.preview-single {
  max-width: 420px;
}

.preview-block {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #dcebfa;
  background: rgba(255, 255, 255, 0.6);
}

.preview-label {
  padding: 6px 10px;
  font-size: 11px;
  color: #6b7a90;
  background: rgba(255, 255, 255, 0.8);
  border-bottom: 1px solid #dcebfa;
}

.preview-login {
  position: relative;
  height: 180px;
  padding: 12px;
  overflow: hidden;
}

.cloud {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  filter: blur(8px);
}

.cloud-1 {
  width: 60px;
  height: 24px;
  top: 20px;
  left: 10px;
}

.cloud-2 {
  width: 40px;
  height: 16px;
  top: 40px;
  right: 20px;
}

.login-card {
  position: relative;
  z-index: 1;
  margin: 16px auto 0;
  max-width: 160px;
  padding: 14px 12px;
  box-shadow: 0 8px 24px rgba(24, 144, 255, 0.12);
}

.login-logo {
  font-size: 11px;
  font-weight: 700;
  text-align: center;
}

.login-input {
  height: 16px;
  margin-top: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #dcebfa;
}

.login-btn {
  margin-top: 10px;
  height: 22px;
  font-size: 10px;
  color: #fff;
  text-align: center;
  line-height: 22px;
}
</style>
