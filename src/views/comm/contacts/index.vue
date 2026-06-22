<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { NButton, NCard, NEmpty, NTree } from 'naive-ui';
import { fetchGetContactTree } from '@/service/api/comm';

defineOptions({ name: 'CommContacts' });

const tree = ref<Api.Comm.ContactNode[]>([]);
const selected = ref<Api.Comm.ContactNode | null>(null);

onMounted(async () => {
  const { data } = await fetchGetContactTree();
  tree.value = data ?? [];
});

function proto(msg: string) {
  window.$message?.info(`[原型] ${msg}`);
}

function findPerson(nodes: Api.Comm.ContactNode[], key: string): Api.Comm.ContactNode | null {
  for (const node of nodes) {
    if (node.key === key && node.type === 'person') return node;
    if (node.children?.length) {
      const found = findPerson(node.children, key);
      if (found) return found;
    }
  }
  return null;
}

function onSelect(keys: Array<string | number>) {
  const key = String(keys[0] ?? '');
  selected.value = key ? findPerson(tree.value, key) : null;
}
</script>

<template>
  <div class="min-h-500px flex gap-16px overflow-hidden">
    <NCard title="通讯录" size="small" class="w-320px flex-shrink-0 card-wrapper">
      <NTree
        block-line
        selectable
        :data="tree as any"
        key-field="key"
        label-field="label"
        children-field="children"
        @update:selected-keys="onSelect"
      />
    </NCard>
    <NCard title="联系人详情" size="small" class="flex-1 card-wrapper">
      <template v-if="selected">
        <div class="text-18px font-semibold mb-12px">{{ selected.label }}</div>
        <p v-if="selected.title" class="text-sm text-gray-500">岗位：{{ selected.title }}</p>
        <p v-if="selected.company" class="text-sm text-gray-500">公司：{{ selected.company }}</p>
        <p v-if="selected.phone" class="text-sm text-gray-500">手机：{{ selected.phone }}</p>
        <p v-if="selected.email" class="text-sm text-gray-500">邮箱：{{ selected.email }}</p>
        <div class="mt-16px flex gap-8px">
          <NButton type="primary" size="small" @click="proto('发消息')">发消息</NButton>
          <NButton size="small" @click="proto('语音通话')">语音通话</NButton>
          <NButton size="small" @click="proto('视频通话')">视频通话</NButton>
        </div>
      </template>
      <NEmpty v-else description="选择联系人查看详情" />
    </NCard>
  </div>
</template>
