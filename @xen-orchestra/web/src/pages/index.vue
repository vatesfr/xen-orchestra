<template>
  <div>
    <MainHeader />
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import MainHeader from '@/components/main/MainHeader.vue'

definePage({
  name: '/',
  redirect: () => `/dashboard`,
})
</script>
