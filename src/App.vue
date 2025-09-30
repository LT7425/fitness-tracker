<template>
   <RotatingNavigation>
     <template #moduleBlock>
      <KeepAlive>
        <router-view />
      </KeepAlive>
     </template>
   </RotatingNavigation>
</template>

<script setup>
import RotatingNavigation from './components/RotatingNavigation.vue'
</script>