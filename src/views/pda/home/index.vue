<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import PdaPhoneShell from '@/components/pda/PdaPhoneShell.vue';
import { fetchPdaHomeSummary } from '@/service/api/pda';
import { useAuthStore } from '@/store/modules/auth';
import { useRouterPush } from '@/hooks/common/router';
import { sessionStg } from '@/utils/storage';
import { applyModuleBadges, type BusinessKey } from '../shared/business-config';
import { usePdaHomeLocale, type PdaHomeLang } from '../shared/pda-home-locale';

defineOptions({ name: 'PdaHome' });

const router = useRouter();
const authStore = useAuthStore();
const { toLogin } = useRouterPush(false);
const { lang, t, applyLang, langOptions } = usePdaHomeLocale();

const loading = ref(false);
const summary = ref<Api.Pda.HomeSummary | null>(null);

const displayName = computed(() => summary.value?.displayName ?? '原型管理员');
const warehouseName = computed(() => summary.value?.warehouseName ?? '美西二号仓');
const notifyCount = computed(() => summary.value?.notifyCount ?? 0);
const businessGroups = computed(() => summary.value?.businessGroups ?? []);
const performance = computed(() => summary.value?.performance);

const moreMenuOpen = ref(false);
const bluetoothConnected = ref(sessionStg.get('pdaBluetoothConnected') === 'Y');

async function loadSummary() {
  loading.value = true;
  const { data, error } = await fetchPdaHomeSummary();
  loading.value = false;
  if (!error && data) {
    summary.value = data;
    data.businessGroups.forEach(g => {
      const badges: Record<string, number> = {};
      g.modules.forEach(m => {
        badges[m.key] = m.badge;
      });
      applyModuleBadges(g.key as BusinessKey, badges);
    });
  }
}

function goBack() {
  router.push({ name: 'home' });
}

function openBusiness(key: BusinessKey) {
  router.push({ name: 'pda_business', query: { biz: key } });
}

function switchWarehouse() {
  window.$message?.info(t.value.switchWarehouse);
}

function openPerformanceDetail() {
  window.$message?.info(t.value.perfDetailToast);
}

function getGroupPending(group: Api.Pda.BusinessGroupSummary) {
  return group.modules.reduce((sum, m) => sum + (m.badge > 0 ? m.badge : 0), 0);
}

function toggleMoreMenu() {
  moreMenuOpen.value = !moreMenuOpen.value;
}

function closeMoreMenu() {
  moreMenuOpen.value = false;
}

function selectLang(next: PdaHomeLang) {
  applyLang(next);
}

async function handleAccountLogin() {
  closeMoreMenu();
  window.$message?.info(t.value.accountLoginToast);
  await authStore.logout();
  await toLogin('pwd-login', '/pda/home');
}

function toggleBluetooth() {
  bluetoothConnected.value = !bluetoothConnected.value;
  sessionStg.set('pdaBluetoothConnected', bluetoothConnected.value ? 'Y' : 'N');
  window.$message?.success(bluetoothConnected.value ? t.value.moreBluetoothOn : t.value.moreBluetoothOff);
  closeMoreMenu();
}

function onDocClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest('.pda-more-wrap')) closeMoreMenu();
}

onMounted(() => {
  loadSummary();
  document.addEventListener('click', onDocClick);
});

onUnmounted(() => {
  document.removeEventListener('click', onDocClick);
});
</script>

<template>
  <PdaPhoneShell>
    <div class="pda-app">
      <header class="pda-header">
        <button type="button" class="pda-back" @click="goBack">
          <span class="pda-back-arrow">&larr;</span>
          {{ t.back }}
        </button>
        <div class="pda-user-row">
          <span class="pda-user-name">{{ displayName }}</span>
          <span class="pda-notify">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
              <path
                d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5S10 3.17 10 4v.68C7.14 5.36 5.5 7.92 5.5 11v5l-2 2v1h17v-1l-2-2z"
              />
            </svg>
            <em v-if="notifyCount" class="pda-badge">{{ notifyCount }}</em>
          </span>
          <div class="pda-more-wrap">
            <button
              type="button"
              class="pda-more"
              :class="{ active: moreMenuOpen }"
              aria-label="more"
              @click.stop="toggleMoreMenu"
            >
              ...
            </button>
            <div v-if="moreMenuOpen" class="pda-more-menu" @click.stop>
              <p class="pda-more-menu-title">{{ t.moreLanguage }}</p>
              <button
                v-for="opt in langOptions"
                :key="opt.key"
                type="button"
                class="pda-more-menu-item"
                :class="{ selected: lang === opt.key }"
                @click="selectLang(opt.key)"
              >
                <span>{{ opt.label }}</span>
                <span v-if="lang === opt.key" class="pda-more-check">✓</span>
              </button>
              <div class="pda-more-divider" />
              <button type="button" class="pda-more-menu-item" @click="handleAccountLogin">
                <span class="pda-more-menu-icon" aria-hidden="true">👤</span>
                <span>{{ t.moreAccount }}</span>
              </button>
              <button type="button" class="pda-more-menu-item" @click="toggleBluetooth">
                <span class="pda-more-menu-icon" aria-hidden="true">📶</span>
                <span>{{ bluetoothConnected ? t.moreBluetoothDisconnect : t.moreBluetoothConnect }}</span>
                <span v-if="bluetoothConnected" class="pda-more-bt-on">ON</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <section class="pda-warehouse" @click="switchWarehouse">
        <span class="pda-warehouse-label">{{ t.currentWarehouse }}</span>
        <span class="pda-warehouse-name">{{ warehouseName }}</span>
      </section>

      <section class="pda-biz-section">
        <h2 class="pda-section-title">{{ t.selectBusiness }}</h2>
        <div v-if="loading" class="pda-loading">{{ t.loading }}</div>
        <div v-else class="pda-biz-list">
          <button
            v-for="group in businessGroups"
            :key="group.key"
            type="button"
            class="pda-biz-entry"
            :style="{ '--entry-accent': group.accent }"
            @click="openBusiness(group.key as BusinessKey)"
          >
            <span class="pda-biz-entry-icon">{{ group.icon }}</span>
            <span class="pda-biz-entry-body">
              <span class="pda-biz-entry-label">{{ group.label }}</span>
              <span class="pda-biz-entry-desc">{{ group.desc }}</span>
            </span>
            <span class="pda-biz-entry-meta">
              <em class="pda-biz-entry-pending">{{ getGroupPending(group) }} {{ t.pending }}</em>
              <span class="pda-biz-entry-arrow">&rsaquo;</span>
            </span>
          </button>
        </div>
      </section>

      <section v-if="performance" class="pda-perf" @click="openPerformanceDetail">
        <div class="pda-perf-head">
          <div>
            <h3 class="pda-perf-title">{{ t.perfTitle }}</h3>
            <p class="pda-perf-sub">{{ performance.dateLabel }} · {{ performance.shift }}</p>
          </div>
          <span class="pda-perf-rank">
            {{ t.rank }} <strong>{{ performance.rank.position }}</strong>/{{ performance.rank.total }}
            <em class="pda-perf-trend">{{ performance.rank.trend }}</em>
          </span>
        </div>

        <div class="pda-perf-summary">
          <div v-for="item in performance.summary" :key="item.key" class="pda-perf-stat">
            <span class="pda-perf-stat-val" :style="{ color: item.color }">{{ item.value }}</span>
            <span class="pda-perf-stat-unit">{{ item.unit === '单' ? t.unitOrder : item.unit }}</span>
            <span class="pda-perf-stat-label">{{ item.label }}</span>
          </div>
        </div>

        <div class="pda-perf-metrics">
          <span v-for="m in performance.metrics" :key="m.label" class="pda-perf-chip">
            {{ m.label }} <strong>{{ m.value }}</strong>
          </span>
        </div>

        <div class="pda-perf-score">
          <span>{{ t.perfScore }}</span>
          <strong>{{ performance.rank.score }}</strong>
          <span class="pda-perf-link">{{ t.perfDetail }} &rsaquo;</span>
        </div>
      </section>
    </div>
  </PdaPhoneShell>
</template>

<style scoped>
.pda-app {
  min-height: 100%;
  padding: 4px 12px 16px;
  background: linear-gradient(165deg, #8f7ff5 0%, #7568eb 38%, #6a5fe0 100%);
  color: #fff;
  box-sizing: border-box;
}

.pda-header {
  margin-bottom: 12px;
}

.pda-back {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.95);
  font-size: 13px;
  cursor: pointer;
}

.pda-back-arrow {
  font-size: 16px;
}

.pda-user-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.pda-user-name {
  font-size: 20px;
  font-weight: 700;
  margin-right: auto;
}

.pda-notify {
  position: relative;
  display: flex;
  align-items: center;
}

.pda-badge {
  position: absolute;
  top: -5px;
  right: -7px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: #ff3b30;
  color: #fff;
  font-size: 10px;
  font-style: normal;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
}

.pda-more-wrap {
  position: relative;
}

.pda-more {
  width: 32px;
  height: 26px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  font-size: 16px;
  cursor: pointer;
}

.pda-more.active {
  background: rgba(255, 255, 255, 0.32);
}

.pda-more-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 30;
  min-width: 168px;
  padding: 8px 0;
  border-radius: 10px;
  background: #fff;
  color: #1f2937;
  box-shadow: 0 8px 24px rgba(30, 20, 80, 0.22);
}

.pda-more-menu-title {
  margin: 0;
  padding: 4px 14px 6px;
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.pda-more-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  border: none;
  background: transparent;
  color: #111827;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}

.pda-more-menu-item:active,
.pda-more-menu-item.selected {
  background: #f3f4f6;
}

.pda-more-check {
  margin-left: auto;
  font-size: 13px;
  font-weight: 700;
  color: #5b54d8;
}

.pda-more-divider {
  height: 1px;
  margin: 4px 10px;
  background: #e5e7eb;
}

.pda-more-menu-icon {
  width: 18px;
  text-align: center;
  font-size: 14px;
}

.pda-more-bt-on {
  margin-left: auto;
  padding: 1px 6px;
  border-radius: 4px;
  background: #dcfce7;
  color: #16a34a;
  font-size: 10px;
  font-weight: 700;
}

.pda-warehouse {
  margin-bottom: 14px;
  cursor: pointer;
}

.pda-warehouse-label {
  display: block;
  font-size: 12px;
  opacity: 0.88;
  margin-bottom: 2px;
}

.pda-warehouse-name {
  font-size: 17px;
  font-weight: 700;
  color: #b8f0ff;
}

.pda-biz-section {
  margin-bottom: 12px;
}

.pda-section-title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 700;
}

.pda-loading {
  padding: 20px;
  text-align: center;
  font-size: 13px;
  opacity: 0.85;
}

.pda-biz-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pda-biz-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 12px;
  border: none;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 3px 12px rgba(50, 40, 120, 0.16);
  cursor: pointer;
  text-align: left;
}

.pda-biz-entry:active {
  transform: scale(0.98);
}

.pda-biz-entry-icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: color-mix(in srgb, var(--entry-accent) 12%, #fff);
  font-size: 24px;
}

.pda-biz-entry-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pda-biz-entry-label {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
}

.pda-biz-entry-desc {
  font-size: 11px;
  color: #6b7280;
}

.pda-biz-entry-meta {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.pda-biz-entry-pending {
  font-style: normal;
  font-size: 11px;
  font-weight: 600;
  color: var(--entry-accent);
}

.pda-biz-entry-arrow {
  font-size: 20px;
  line-height: 1;
  color: #9ca3af;
}

.pda-perf {
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  color: #1f2937;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(40, 30, 100, 0.18);
}

.pda-perf-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.pda-perf-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.pda-perf-sub {
  margin: 2px 0 0;
  font-size: 10px;
  color: #6b7280;
}

.pda-perf-rank {
  flex-shrink: 0;
  font-size: 11px;
  color: #6b7280;
}

.pda-perf-rank strong {
  font-size: 16px;
  color: #5b54d8;
}

.pda-perf-trend {
  margin-left: 4px;
  font-style: normal;
  font-size: 10px;
  font-weight: 700;
  color: #34c759;
}

.pda-perf-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-bottom: 10px;
}

.pda-perf-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  border-radius: 8px;
  background: #f3f4f6;
}

.pda-perf-stat-val {
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
}

.pda-perf-stat-unit {
  font-size: 10px;
  color: #9ca3af;
  margin-top: 1px;
}

.pda-perf-stat-label {
  margin-top: 4px;
  font-size: 10px;
  color: #6b7280;
}

.pda-perf-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.pda-perf-chip {
  padding: 4px 8px;
  border-radius: 6px;
  background: #eef2ff;
  font-size: 10px;
  color: #4b5563;
}

.pda-perf-chip strong {
  margin-left: 2px;
  color: #3730a3;
}

.pda-perf-score {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
  font-size: 12px;
  color: #6b7280;
}

.pda-perf-score strong {
  font-size: 22px;
  font-weight: 800;
  color: #5b54d8;
}

.pda-perf-link {
  margin-left: auto;
  font-size: 11px;
  color: #5b54d8;
  font-weight: 600;
}
</style>
