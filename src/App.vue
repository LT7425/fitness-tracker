<template>
  <n-config-provider>
    <n-layout>
      <n-layout-header bordered>
        <n-space justify="space-between" align="center" style="padding: 0 20px; height: 60px;">
          <n-h2 style="margin: 0;">运动打卡激励平台</n-h2>
          <Auth />
        </n-space>
      </n-layout-header>

      <n-layout has-sider>
        <n-layout-sider bordered width="200">
          <n-menu :options="menuOptions" />
        </n-layout-sider>

        <n-layout-content style="padding: 20px; min-height: calc(100vh - 60px);">
          <router-view />
        </n-layout-content>
      </n-layout>
    </n-layout>
  </n-config-provider>
</template>

<script setup>
import { h, computed } from 'vue'
import { NIcon } from 'naive-ui'
import { RouterLink, useRoute } from 'vue-router'
import {
  HomeOutline,
  ListOutline,
  TrophyOutline
} from '@vicons/ionicons5'

const route = useRoute()

function renderIcon(icon) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const menuOptions = computed(() => [
  {
    label: () => h(RouterLink, { to: '/' }, { default: () => '首页' }),
    key: 'home',
    icon: renderIcon(HomeOutline)
  },
  {
    label: () => h(RouterLink, { to: '/history' }, { default: () => '历史记录' }),
    key: 'history',
    icon: renderIcon(ListOutline)
  },
  {
    label: () => h(RouterLink, { to: '/rewards' }, { default: () => '奖励系统' }),
    key: 'rewards',
    icon: renderIcon(TrophyOutline)
  }
])
</script>