<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PdaPhoneShell from '@/components/pda/PdaPhoneShell.vue';
import { fetchPdaBusinessModules } from '@/service/api/pda';
import {
  applyModuleBadges,
  getBusinessGroup,
  getBusinessPendingTotal,
  isValidBusinessKey,
  type BusinessKey,
  type PdaModule
} from '../shared/business-config';

defineOptions({ name: 'PdaBusiness' });

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const modules = ref<PdaModule[]>([]);

const bizKey = computed(() => String(route.query.biz || 'transfer') as BusinessKey);
const business = computed(() => getBusinessGroup(bizKey.value));
const pendingTotal = computed(() => (business.value ? getBusinessPendingTotal(business.value) : 0));

watch(
  bizKey,
  key => {
    if (!isValidBusinessKey(key)) {
      router.replace({ name: 'pda_home' });
    }
  },
  { immediate: true }
);

async function loadModules() {
  if (!isValidBusinessKey(bizKey.value)) return;
  loading.value = true;
  const { data, error } = await fetchPdaBusinessModules(bizKey.value);
  loading.value = false;
  if (!error && data) {
    const badges: Record<string, number> = {};
    data.modules.forEach(m => {
      badges[m.key] = m.badge;
    });
    applyModuleBadges(bizKey.value, badges);
    modules.value = business.value?.modules ?? data.modules;
  } else if (business.value) {
    modules.value = business.value.modules;
  }
}

watch(bizKey, () => loadModules(), { immediate: true });

function goHome() {
  router.push({ name: 'pda_home' });
}

function openModule(item: PdaModule) {
  router.push({ name: item.route as any, query: item.query });
}
</script>

<template>
  <PdaPhoneShell>
    <div v-if="business" class="pda-biz-app" :style="{ '--biz-accent': business.accent }">
      <header class="pda-biz-header">
        <button type="button" class="pda-biz-back" @click="goHome">&larr; 返回业务首页</button>
        <div class="pda-biz-title-row">
          <span class="pda-biz-icon">{{ business.icon }}</span>
          <div>
            <h1 class="pda-biz-title">{{ business.label }}</h1>
            <p class="pda-biz-desc">{{ business.desc }}</p>
          </div>
          <span class="pda-biz-pending">待办 {{ pendingTotal }}</span>
        </div>
      </header>

      <main class="pda-biz-main">
        <p class="pda-biz-hint">选择作业类型进入操作</p>
        <div v-if="loading" class="pda-biz-loading">加载中...</div>
        <div v-else class="pda-biz-grid">
          <button
            v-for="item in modules"
            :key="item.key"
            type="button"
            class="pda-biz-card"
            @click="openModule(item)"
          >
            <em v-if="item.badge > 0" class="pda-biz-badge">{{ item.badge > 99 ? '99+' : item.badge }}</em>
            <span class="pda-biz-card-icon">{{ item.icon }}</span>
            <span class="pda-biz-card-label">{{ item.label }}</span>
          </button>
        </div>
      </main>
    </div>
  </PdaPhoneShell>
</template>

<style scoped>
.pda-biz-app {
  min-height: 100%;
  padding: 4px 12px 20px;
  background: linear-gradient(165deg, #8f7ff5 0%, #7568eb 38%, #6a5fe0 100%);
  color: #fff;
  box-sizing: border-box;
}

.pda-biz-header {
  margin-bottom: 14px;
}

.pda-biz-back {
  padding: 0;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
  cursor: pointer;
}

.pda-biz-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}

.pda-biz-icon {
  font-size: 36px;
  line-height: 1;
}

.pda-biz-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.pda-biz-desc {
  margin: 2px 0 0;
  font-size: 12px;
  opacity: 0.85;
}

.pda-biz-pending {
  margin-left: auto;
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  font-size: 11px;
  font-weight: 600;
}

.pda-biz-hint {
  margin: 0 0 10px;
  font-size: 12px;
  opacity: 0.88;
}

.pda-biz-loading {
  padding: 24px;
  text-align: center;
  font-size: 13px;
}

.pda-biz-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.pda-biz-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 96px;
  padding: 12px 8px 10px;
  border: none;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 3px 10px rgba(50, 40, 120, 0.15);
  cursor: pointer;
}

.pda-biz-card:active {
  transform: scale(0.97);
}

.pda-biz-badge {
  position: absolute;
  top: 6px;
  right: 8px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 10px;
  background: #ff3b30;
  color: #fff;
  font-size: 11px;
  font-style: normal;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
}

.pda-biz-card-icon {
  font-size: 32px;
  line-height: 1;
  margin-bottom: 6px;
}

.pda-biz-card-label {
  font-size: 13px;
  font-weight: 600;
  color: #2c2c2c;
  text-align: center;
  line-height: 1.25;
}
</style>
