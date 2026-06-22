<script setup lang="tsx">
import { NCard, NDataTable, NTag } from 'naive-ui';
import { PRINT_ROLE_PERMISSIONS } from '../constants';

defineOptions({ name: 'PrintPermission' });

const columns = [
  { key: 'role', title: '角色', width: 120 },
  { key: 'roleCode', title: '角色编码', width: 130 },
  {
    key: 'permissions',
    title: '打印权限',
    render: (row: (typeof PRINT_ROLE_PERMISSIONS)[number]) => (
      <div class="flex flex-wrap gap-6px">
        {row.permissions.map(p => (
          <NTag key={p} size="small" type="info">
            {p}
          </NTag>
        ))}
      </div>
    )
  }
];
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-auto">
    <NCard title="打印权限配置" :bordered="false" size="small" class="card-wrapper">
      <template #header-extra>
        <span class="text-xs text-gray-500">与系统角色权限联动 · 原型为权限矩阵示意</span>
      </template>
      <NDataTable :columns="columns" :data="PRINT_ROLE_PERMISSIONS" :pagination="false" size="small" />
    </NCard>

    <NCard title="权限说明" size="small" :bordered="false">
      <ul class="list-disc pl-20px text-sm space-y-8px text-gray-600 dark:text-gray-400">
        <li>模板设计、发布、回滚需对应角色审批，不可直接覆盖已发布版本。</li>
        <li>费用发票打印与下载受财务与客户授权范围控制。</li>
        <li>重新打印需记录原因，仓库主管可审核异常打印。</li>
        <li>供应商/客户仅可访问授权范围内的发票与账单 PDF。</li>
      </ul>
    </NCard>
  </div>
</template>
