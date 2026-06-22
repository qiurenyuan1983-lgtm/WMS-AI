<script setup lang="ts">
import { NAvatar, NCard, NGi, NGrid, NSpace, NTag } from 'naive-ui';

defineProps<{
  contacts: Api.Portal.AssignedContact[];
}>();
</script>

<template>
  <NGrid :cols="2" :x-gap="12" responsive="screen" item-responsive>
    <NGi v-for="c in contacts" :key="c.id" span="2 m:1">
      <NCard size="small" class="contact-card">
        <div class="contact-card__body">
          <NAvatar round size="medium" :style="{ background: c.role === '客服' ? '#2080f0' : '#7c3aed' }">
            {{ c.role.slice(0, 1) }}
          </NAvatar>
          <div class="contact-card__info">
            <div class="contact-card__name">
              {{ c.name }}
              <NTag size="tiny" :type="c.online ? 'success' : 'default'">{{ c.online ? '在线' : '离线' }}</NTag>
            </div>
            <div class="contact-card__title">{{ c.title }}</div>
            <NSpace size="small" class="contact-card__meta">
              <span>{{ c.phone }}</span>
              <span>{{ c.email }}</span>
            </NSpace>
          </div>
        </div>
      </NCard>
    </NGi>
  </NGrid>
</template>

<style scoped>
.contact-card__body {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.contact-card__info {
  flex: 1;
  min-width: 0;
}
.contact-card__name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.contact-card__title {
  font-size: 12px;
  color: var(--n-text-color-3);
  margin-top: 2px;
}
.contact-card__meta {
  margin-top: 6px;
  font-size: 12px;
  color: var(--n-text-color-2);
}
</style>
