<script setup lang="ts">

import { computed } from 'vue';

import { ACCOUNT_TYPE_OPTIONS, MOCK_ORG_SCOPE } from '@/mock/data/user-workbench-constants';



defineOptions({ name: 'UserWorkbenchSearch' });



export interface UserWorkbenchSearchModel {

  keyword: string | null;

  deptId: CommonType.IdType | null;

  warehouseId: CommonType.IdType | null;

  roleId: CommonType.IdType | null;

  accountType: string | null;

  status: Api.Common.EnableStatus | null;

}



interface Props {

  roleOptions?: CommonType.Option[];

}



interface Emits {

  (e: 'search'): void;

  (e: 'reset'): void;

}



withDefaults(defineProps<Props>(), {

  roleOptions: () => []

});



const emit = defineEmits<Emits>();



const model = defineModel<UserWorkbenchSearchModel>('model', { required: true });



const warehouseOptions = computed(() =>

  MOCK_ORG_SCOPE.warehouses.map(w => ({ label: w.warehouseName, value: w.warehouseId }))

);



function reset() {

  model.value.keyword = null;

  model.value.warehouseId = null;

  model.value.roleId = null;

  model.value.accountType = null;

  model.value.status = null;

  emit('reset');

}



function search() {

  emit('search');

}

</script>



<template>

  <NCard :bordered="false" size="small" class="card-wrapper shrink-0">

    <div class="flex flex-wrap items-center gap-12px">

      <NInput

        v-model:value="model.keyword"

        clearable

        class="w-220px"

        placeholder="用户名 / 手机 / 邮箱"

        @keyup.enter="search"

      />

      <NSelect

        v-model:value="model.warehouseId"

        clearable

        class="w-160px"

        placeholder="所属仓库"

        :options="warehouseOptions"

      />

      <NSelect v-model:value="model.roleId" clearable class="w-140px" placeholder="角色" :options="roleOptions" />

      <NSelect

        v-model:value="model.accountType"

        clearable

        class="w-140px"

        placeholder="账号类型"

        :options="ACCOUNT_TYPE_OPTIONS"

      />

      <DictSelect

        v-model:value="model.status"

        clearable

        class="w-120px"

        placeholder="状态"

        dict-code="sys_normal_disable"

      />

      <NSpace>

        <NButton type="primary" @click="search">

          <template #icon>

            <icon-ic-round-search class="text-icon" />

          </template>

          搜索

        </NButton>

        <NButton @click="reset">

          <template #icon>

            <icon-ic-round-refresh class="text-icon" />

          </template>

          重置

        </NButton>

      </NSpace>

    </div>

  </NCard>

</template>


