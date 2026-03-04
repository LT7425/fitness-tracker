<template>
  <n-message-provider>
    <n-notification-provider>
      <RotatingNavigation>
        <template #moduleBlock>
          <KeepAlive>
            <router-view />
          </KeepAlive>
        </template>
      </RotatingNavigation>
    </n-notification-provider>
  </n-message-provider>
  
  <!-- 全局主题切换按钮 -->
  <button class="theme-toggle" @click="themeStore.toggleTheme">
    <i :class="themeStore.isDark ? 'fas fa-sun' : 'fas fa-moon'"></i>
  </button>
</template>

<script setup>
import { onMounted } from 'vue';
import RotatingNavigation from './components/RotatingNavigation.vue';
import { useThemeStore } from './stores/theme';

const themeStore = useThemeStore();

// 初始化主题
onMounted(() => {
  themeStore.initTheme();
});
</script>

<style>
.theme-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #333;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-toggle:hover {
  background: rgba(0, 0, 0, 0.2);
  transform: scale(1.1);
}

/* 深色主题下的按钮样式 */
.dark-theme .theme-toggle {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  color: #e5e7eb;
}

.dark-theme .theme-toggle:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>