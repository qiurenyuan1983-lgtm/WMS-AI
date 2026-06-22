<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ACCOUNT_TYPE_OPTIONS, MOCK_ORG_SCOPE } from '@/mock/data/user-workbench-constants';



export type OrgSidebarTab = 'dept' | 'warehouse' | 'post' | 'accountType';



interface Props {

  deptData?: Api.Common.CommonTreeRecord;

  postOptions?: CommonType.Option[];

  optionsLoading?: boolean;

}



interface Emits {

  (e: 'select', payload: { tab: OrgSidebarTab; key: string | null }): void;

}



const props = withDefaults(defineProps<Props>(), {

  deptData: () => [],

  postOptions: () => [],

  optionsLoading: false

});



const emit = defineEmits<Emits>();



const activeTab = ref<OrgSidebarTab>('dept');

const pattern = ref('');

const selectedKey = ref<string | null>(null);

const expandedKeys = ref<CommonType.IdType[]>([100]);



const tabs: { key: OrgSidebarTab; label: string }[] = [

  { key: 'dept', label: '组织架构' },

  { key: 'warehouse', label: '仓库' },

  { key: 'post', label: '岗位' },

  { key: 'accountType', label: '账号类型' }

];



const warehouseTree = computed(() =>

  MOCK_ORG_SCOPE.warehouses.map(w => ({

    key: String(w.warehouseId),

    label: w.warehouseName,

    id: w.warehouseId

  }))

);



const accountTypeTree = computed(() =>

  ACCOUNT_TYPE_OPTIONS.map(o => ({

    key: o.value,

    label: o.label,

    id: o.value

  }))

);



const postTree = computed(() =>

  props.postOptions.map(p => ({

    key: String(p.value),

    label: p.label,

    id: p.value

  }))

);



const currentTreeData = computed(() => {

  if (activeTab.value === 'dept') return props.deptData;

  if (activeTab.value === 'warehouse') return warehouseTree.value;

  if (activeTab.value === 'post') return postTree.value;

  return accountTypeTree.value;

});



watch(activeTab, () => {

  selectedKey.value = null;

  emit('select', { tab: activeTab.value, key: null });

});



function handleSelect(keys: string[]) {

  selectedKey.value = keys.length ? keys[0] : null;

  emit('select', { tab: activeTab.value, key: selectedKey.value });

}



function handleNewDept() {

  window.$message?.info('原型：新建部门');

}



function handleEditDept() {

  window.$message?.info('原型：编辑部门');

}

</script>



<template>

  <NCard :bordered="false" size="small" class="org-sidebar card-wrapper h-full w-240px shrink-0">

    <NTabs v-model:value="activeTab" type="segment" size="small" class="mb-8px">

      <NTabPane v-for="tab in tabs" :key="tab.key" :name="tab.key" :tab="tab.label" />

    </NTabs>

    <NInput v-model:value="pattern" clearable size="small" placeholder="关键字搜索" class="mb-8px" />

    <NSpin :show="optionsLoading && activeTab === 'dept'" class="tree-wrap">

      <NTree

        :selected-keys="selectedKey ? [selectedKey] : []"

        :expanded-keys="activeTab === 'dept' ? expandedKeys : []"

        block-node

        show-line

        :data="currentTreeData as []"

        :pattern="pattern"

        :show-irrelevant-nodes="false"

        key-field="id"

        label-field="label"

        virtual-scroll

        class="org-tree"

        @update:selected-keys="handleSelect"

      >

        <template #empty>

          <NEmpty description="暂无数据" class="min-h-120px justify-center" />

        </template>

      </NTree>

    </NSpin>

    <div v-if="activeTab === 'dept'" class="mt-8px flex gap-8px">

      <NButton size="small" type="primary" ghost block @click="handleNewDept">新建部门</NButton>

      <NButton size="small" block @click="handleEditDept">编辑</NButton>

    </div>

  </NCard>

</template>



<style scoped lang="scss">

.org-sidebar {

  display: flex;

  flex-direction: column;

  min-height: 0;

}



.tree-wrap {

  flex: 1;

  min-height: 0;



  :deep(.n-spin-content) {

    height: 100%;

  }

}



.org-tree {

  height: calc(100vh - 340px);

  min-height: 200px;

}

</style>


