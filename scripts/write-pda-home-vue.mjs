/**
 * PDA home inside iPhone shell ?? UTF-8 via \u escapes in Node only.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/views/pda/home/index.vue');

const T = {
  back: '\u8fd4\u56de\u7269\u6d41\u7ba1\u7406\u7cfb\u7edf',
  warehouse: '\u5f53\u524d\u4ed3\u5e93',
  warehouseName: '\u7f8e\u897f\u4e8c\u53f7\u4ed3',
  proto: '\u539f\u578b',
  switchWh: '\u5207\u6362\u4ed3\u5e93',
  receive: '\u6536\u8d27',
  inbound: '\u5165\u5e93',
  putaway: '\u4e0a\u67b6',
  pick: '\u62e3\u8d27',
  locationMove: '\u5e93\u4f4d\u53d8\u66f4',
  mergePallet: '\u5408\u677f',
  splitPallet: '\u62c6\u677f',
  operation: '\u6307\u4ee4\u64cd\u4f5c'
};

const content = `<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/store/modules/auth';
import PdaPhoneShell from '@/components/pda/PdaPhoneShell.vue';

defineOptions({ name: 'PdaHome' });

const router = useRouter();
const authStore = useAuthStore();
const { userInfo } = storeToRefs(authStore);

const displayName = computed(
  () => userInfo.value.user?.nickName || userInfo.value.user?.userName || 'ALEX'
);

type PdaModule = {
  key: string;
  label: string;
  badge: number;
  icon: string;
  route: string;
  query?: Record<string, string>;
};

const modules: PdaModule[] = [
  { key: 'receive', label: '${T.receive}', badge: 2, icon: '\\uD83D\\uDCE5', route: 'pda_task', query: { taskType: 'receive' } },
  { key: 'inbound', label: '${T.inbound}', badge: 5, icon: '\\uD83D\\uDCE6', route: 'wms_inbound-task', query: { palletNo: 'PLT-IN-2026-001' } },
  { key: 'putaway', label: '${T.putaway}', badge: 22, icon: '\\u2B06\\uFE0F', route: 'wms_putaway-pda', query: { taskNo: 'PT-2026-0001', mode: 'BATCH' } },
  { key: 'pick', label: '${T.pick}', badge: 18, icon: '\\uD83D\\uDCCB', route: 'wms_outbound-exec' },
  { key: 'location-move', label: '${T.locationMove}', badge: 3, icon: '\\uD83D\\uDD04', route: 'pda_task', query: { taskType: 'move' } },
  { key: 'merge-pallet', label: '${T.mergePallet}', badge: 6, icon: '\\uD83D\\uDD17', route: 'pda_task', query: { taskType: 'merge' } },
  { key: 'split-pallet', label: '${T.splitPallet}', badge: 8, icon: '\\u2702\\uFE0F', route: 'pda_task', query: { taskType: 'split' } },
  { key: 'operation', label: '${T.operation}', badge: 7, icon: '\\uD83D\\uDCDD', route: 'pda_task', query: { taskType: 'operation' } }
];

const notifyCount = 4;

function goBack() {
  router.push({ name: 'home' });
}

function openModule(item: PdaModule) {
  router.push({ name: item.route as any, query: item.query });
}

function switchWarehouse() {
  window.$message?.info('[${T.proto}] ${T.switchWh}');
}
</script>

<template>
  <PdaPhoneShell>
    <div class="pda-app">
      <header class="pda-header">
        <button type="button" class="pda-back" @click="goBack">
          <span class="pda-back-arrow">&larr;</span>
          ${T.back}
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
          <button type="button" class="pda-more" aria-label="more">...</button>
        </div>
      </header>

      <section class="pda-warehouse" @click="switchWarehouse">
        <span class="pda-warehouse-label">${T.warehouse}</span>
        <span class="pda-warehouse-name">${T.warehouseName}</span>
      </section>

      <main class="pda-grid">
        <button
          v-for="item in modules"
          :key="item.key"
          type="button"
          class="pda-card"
          @click="openModule(item)"
        >
          <em v-if="item.badge" class="pda-card-badge">{{ item.badge > 99 ? '99+' : item.badge }}</em>
          <span class="pda-card-icon">{{ item.icon }}</span>
          <span class="pda-card-label">{{ item.label }}</span>
        </button>
      </main>
    </div>
  </PdaPhoneShell>
</template>

<style scoped>
.pda-app {
  min-height: 100%;
  padding: 4px 12px 20px;
  background: linear-gradient(165deg, #8f7ff5 0%, #7568eb 38%, #6a5fe0 100%);
  color: #fff;
  box-sizing: border-box;
}

.pda-header {
  margin-bottom: 14px;
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
  margin-top: 12px;
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

.pda-warehouse {
  margin-bottom: 14px;
  cursor: pointer;
}

.pda-warehouse-label {
  display: block;
  font-size: 13px;
  opacity: 0.88;
  margin-bottom: 2px;
}

.pda-warehouse-name {
  font-size: 18px;
  font-weight: 700;
  color: #b8f0ff;
}

.pda-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding-bottom: 8px;
}

.pda-card {
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

.pda-card:active {
  transform: scale(0.97);
}

.pda-card-badge {
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

.pda-card-icon {
  font-size: 32px;
  line-height: 1;
  margin-bottom: 6px;
}

.pda-card-label {
  font-size: 13px;
  font-weight: 600;
  color: #2c2c2c;
  text-align: center;
  line-height: 1.25;
}
</style>
`;

fs.writeFileSync(file, content, 'utf8');
console.log('wrote pda home + iphone shell');
