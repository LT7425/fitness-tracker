<template>
  <div>
    <n-card title="今日打卡" v-if="isAuthenticated">
      <RecordForm />
    </n-card>

    <n-card title="本月统计" style="margin-top: 20px;" v-if="isAuthenticated">
      <StatsCard />
    </n-card>

    <n-card v-else title="欢迎使用">
      <p>请先登录以开始记录您的运动数据</p>
    </n-card>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAppStore } from '@/stores/app-store'; // 修改这里

const store = useAppStore();
console.log(store);
const isAuthenticated = computed(() => store.isAuthenticated);
</script>