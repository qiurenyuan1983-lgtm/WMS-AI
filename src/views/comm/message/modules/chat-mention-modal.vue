<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { NAvatar, NButton, NEmpty, NInput, NModal, NSpace } from 'naive-ui';
import { POPUP_TO_BODY } from '@/constants/naive-popup';
import { fetchGetContactTree } from '@/service/api/comm';
import { flattenContactPersons } from '../utils/contact-helpers';

const visible = defineModel<boolean>('visible', { default: false });

const emit = defineEmits<{
  (e: 'select', payload: { name: string; key: string; title?: string }): void;
}>();

const keyword = ref('');
const persons = ref<ReturnType<typeof flattenContactPersons>>([]);

const filteredPersons = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  if (!q) return persons.value;
  return persons.value.filter(
    person =>
      person.label.toLowerCase().includes(q) ||
      person.deptPath.toLowerCase().includes(q) ||
      person.title?.toLowerCase().includes(q) ||
      person.company?.toLowerCase().includes(q)
  );
});

onMounted(async () => {
  const { data } = await fetchGetContactTree();
  persons.value = flattenContactPersons(data ?? []);
});

function handleSelect(person: (typeof persons.value)[number]) {
  emit('select', { name: person.label, key: person.key, title: person.title });
  visible.value = false;
  keyword.value = '';
}
</script>

<template>
  <NModal v-model:show="visible" preset="card" title="@ 提及联系人" class="w-480px" :to="POPUP_TO_BODY">
    <NInput v-model:value="keyword" clearable placeholder="搜索联系人、部门、职位" class="mb-12px" />
    <div class="mention-list">
      <NEmpty v-if="!filteredPersons.length" description="未找到联系人" class="py-24px" />
      <div
        v-for="person in filteredPersons"
        :key="person.key"
        class="mention-item"
        @click="handleSelect(person)"
      >
        <NAvatar round size="small" class="bg-#2563eb text-white">{{ person.label.slice(0, 1) }}</NAvatar>
        <div class="flex-1 min-w-0">
          <div class="text-13px font-medium">{{ person.label }}</div>
          <div class="text-12px text-#6b7280 truncate">
            {{ person.title || '联系人' }} · {{ person.deptPath }}
          </div>
        </div>
        <NButton size="tiny" type="primary" ghost>@TA</NButton>
      </div>
    </div>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">关闭</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.mention-list {
  max-height: 360px;
  overflow-y: auto;
}

.mention-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px;
  border-radius: 8px;
  cursor: pointer;
}

.mention-item:hover {
  background: #f3f4f6;
}
</style>
