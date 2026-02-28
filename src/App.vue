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
</template>

<script setup>
import RotatingNavigation from './components/RotatingNavigation.vue'
</script>