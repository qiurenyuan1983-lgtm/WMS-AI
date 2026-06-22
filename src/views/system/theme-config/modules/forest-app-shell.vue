<script setup lang="ts">
import { ref } from 'vue';
import ForestAppHeader from './forest-app-header.vue';
import ForestSideMenu from './forest-side-menu.vue';

defineOptions({ name: 'ForestAppShell' });

const collapsed = ref(false);
</script>

<template>
  <div class="forest-app-shell">
    <ForestAppHeader v-model:collapsed="collapsed" />
    <div class="forest-body">
      <ForestSideMenu :collapsed="collapsed" />
      <main class="forest-main">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.forest-app-shell {
  position: fixed;
  inset: 0;
  z-index: 1000;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(135deg, #eef7ff 0%, #f8fbff 45%, #eaf4ff 100%);
}

.forest-body {
  flex: 1;
  display: flex;
  min-height: 0;
}

.forest-main {
  flex: 1;
  min-width: 0;
  overflow: auto;
  padding: 16px 18px 20px;
}
</style>
