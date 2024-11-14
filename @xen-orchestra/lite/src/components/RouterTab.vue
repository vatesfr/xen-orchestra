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
import { useDisabled } from '@core/composables/disabled.composable'
import type { RouteLocationRaw } from 'vue-router'

const props = defineProps<{
  to: RouteLocationRaw
  disabled?: boolean
}>()

const isDisabled = useDisabled(() => props.disabled)
</script>
