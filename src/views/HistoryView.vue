<template>
  <n-card title="历史记录">
    <n-list>
      <n-list-item v-for="record in store.records" :key="record.date">
        {{ record.date }} - {{ record.activityType === 'cycling' ? '骑行' : '走路' }} - {{ record.duration }}分钟
      </n-list-item>
    </n-list>
  </n-card>
</template>

<script setup>
import { useAppStore } from '@/stores/app-store';

const store = useAppStore();
</script>