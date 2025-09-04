<template>
  <div>
    <n-statistic label="本月运动天数" :value="stats.totalDays" />
    <n-statistic label="达标天数" :value="stats.qualifiedDays" />
    <n-statistic label="有效次数" :value="stats.validCount" />
    <n-statistic label="奖励次数" :value="stats.rewardCount" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAppStore } from '@/stores/app-store';
import { calculateRewards } from '@/utils/calculator';

const store = useAppStore();

const stats = computed(() => {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  return calculateRewards(store.records, currentMonth);
});
</script>