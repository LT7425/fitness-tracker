<template>
  <n-card title="奖励系统">
    <n-statistic label="小奖励" :value="store.rewards.small" />
    <n-statistic label="中级奖励" :value="store.rewards.medium" />
    <n-statistic label="高级奖励" :value="store.rewards.large" />

    <n-button @click="exchange" style="margin-top: 20px;">
      用3个小奖励兑换1个中级奖励
    </n-button>
  </n-card>
</template>

<script setup>
import { useAppStore } from '@/stores/app-store';

const store = useAppStore();

const exchange = () => {
  store.exchangeRewards('small', 'medium');
};
</script>