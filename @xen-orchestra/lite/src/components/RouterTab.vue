<template>
  <RouterLink v-slot="{ isActive, href }" :to custom>
    <TabItem
      :active="isActive"
      :disabled="isDisabled"
      :href="isDisabled ? undefined : href"
      :tag="isDisabled ? undefined : 'a'"
    >
      <slot />
    </TabItem>
  </RouterLink>
</template>

<script lang="ts" setup>
import TabItem from '@core/components/tab/TabItem.vue'
import { useContext } from '@core/composables/context.composable'
import { DisabledContext } from '@core/context'
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  to: RouteLocationRaw
  disabled?: boolean
}>()
</script>
