<script setup lang="ts">
import { PORT_OPTIONS, WAREHOUSE_OPTIONS } from '../shared/theme-visual-config';

defineOptions({ name: 'ThemeSearchForm' });

const searchParams = defineModel<Api.System.ThemeConfigSearchParams>('searchParams', { required: true });

interface Emits {
  (e: 'search'): void;
  (e: 'reset'): void;
}

defineEmits<Emits>();
</script>

<template>
  <div class="forest-filter-box">
    <NCollapse default-expanded-names="['search']"><NCollapseItem title="搜索" name="search"><NForm label-placement="left" size="small" class="theme-search-form">
      <div class="filter-row">
        <NFormItem label="主题名称">
          <NInput
            v-model:value="searchParams.themeName"
            clearable
            placeholder="请输入主题名称"
            class="filter-input"
            @keyup.enter="$emit('search')"
          />
        </NFormItem>
        <NFormItem label="适用端口">
          <NSelect
            v-model:value="searchParams.applicablePorts"
            clearable
            placeholder="请选择端口"
            class="filter-select"
            :options="PORT_OPTIONS"
          />
        </NFormItem>
        <NFormItem label="适用仓库">
          <NSelect
            v-model:value="searchParams.applicableWarehouses"
            clearable
            placeholder="请选择仓库"
            class="filter-select"
            :options="WAREHOUSE_OPTIONS"
          />
        </NFormItem>
      </div>
      <div class="filter-row filter-row-bottom">
        <NFormItem label="状态">
          <NSelect
            v-model:value="searchParams.status"
            clearable
            placeholder="全部状态"
            class="filter-select-sm"
            :options="[
              { label: '启用', value: '0' },
              { label: '停用', value: '1' }
            ]"
          />
        </NFormItem>
        <div class="filter-actions">
          <NButton class="forest-glass-btn" @click="$emit('reset')">重置</NButton>
          <NButton type="primary" class="forest-primary-btn" @click="$emit('search')">搜索</NButton>
        </div>
      </div>
    </NForm></NCollapseItem></NCollapse>
  </div>
</template>

<style scoped lang="scss">
.theme-search-form {
  :deep(.n-form-item) {
    margin-bottom: 0;
  }

  :deep(.n-form-item-label) {
    padding-right: 8px;
  }
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;

  & + & {
    margin-top: 10px;
  }
}

.filter-row-bottom {
  justify-content: space-between;
}

.filter-input {
  width: 140px;
}

.filter-select {
  width: 130px;
}

.filter-select-sm {
  width: 110px;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
</style>
