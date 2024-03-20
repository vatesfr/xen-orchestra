<template>
  <RouterLink v-slot="{ isActive, href }" :to custom>
    <TabItem :active="isActive" :disabled :href="disabled ? undefined : href" :tag="disabled ? undefined : 'a'">
      <slot />
    </TabItem>
  </RouterLink>
</template>

<script lang="ts" setup>
import TabItem from '@core/components/tab/TabItem.vue'
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  to: RouteLocationRaw
  disabled?: boolean
}>()
</script>
