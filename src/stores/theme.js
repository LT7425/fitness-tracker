import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useThemeStore = defineStore('theme', () => {
  // 从localStorage加载主题设置
  const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('appTheme') : null;
  const isDark = ref(savedTheme === 'dark');

  // 切换主题
  function toggleTheme() {
    isDark.value = !isDark.value;
    if (typeof window !== 'undefined') {
      localStorage.setItem('appTheme', isDark.value ? 'dark' : 'light');
    }
    applyTheme();
  }

  // 应用主题到DOM
  function applyTheme() {
    if (typeof window !== 'undefined' && document && document.body) {
      if (isDark.value) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    }
  }

  // 初始化主题
  function initTheme() {
    applyTheme();
  }

  return {
    isDark,
    toggleTheme,
    initTheme
  };
});
