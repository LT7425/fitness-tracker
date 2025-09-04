<template>
  <div>
    <n-button
        v-if="!isAuthenticated"
        type="primary"
        @click="login"
        :loading="isLoading"
    >
      开始使用
    </n-button>
    <n-button v-else type="error" @click="logout">退出</n-button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAppStore } from '@/stores/app-store';

const store = useAppStore();
const isAuthenticated = computed(() => store.isAuthenticated);
const isLoading = computed(() => store.isLoading);

const login = () => {
  store.initApp();
};

const logout = () => {
  // 这里暂时简单处理，实际可以清空数据
  window.location.reload();
};
</script>