import { createApp } from 'vue';
import './plugins/assets';
import { setupVueRootValidator } from 'vite-plugin-vue-transition-root-validator/client';
import { setupAppVersionNotification, setupDayjs, setupIconifyOffline, setupLoading, setupNProgress } from './plugins';
import { setupStore } from './store';
import { installRouter, router } from './router';
import { getLocale, setupI18n } from './locales';
import App from './App.vue';

function showBootstrapError(error: unknown) {
  const app = document.getElementById('app');
  const message = error instanceof Error ? error.message : String(error);
  // eslint-disable-next-line no-console
  console.error('[bootstrap]', error);
  if (app) {
    app.innerHTML = `<div style="padding:24px;font-family:system-ui,sans-serif;color:#c0341d"><h2>应用启动失败</h2><pre style="white-space:pre-wrap">${message}</pre></div>`;
  }
}

async function setupApp() {
  setupLoading();

  setupNProgress();

  setupIconifyOffline();

  setupDayjs();

  const app = createApp(App);

  setupStore(app);

  setupI18n(app);

  installRouter(app);

  app.mount('#app');

  await router.isReady();

  setupAppVersionNotification();

  setupVueRootValidator(app, {
    lang: getLocale() === 'zh-CN' ? 'zh' : 'en'
  });
}

setupApp().catch(showBootstrapError);
