<template>
  <RouterLink v-slot="{ isActive, href }" :to custom>
    <UiTabItem
      :active="isActive"
      :disabled="isDisabled"
      :href="isDisabled ? undefined : href"
      :tag="isDisabled ? undefined : 'a'"
    >
      <slot />
    </UiTabItem>
  </RouterLink>
</template>

<script lang="ts" setup>
import UiTabItem from '@core/components/ui/tab-item/UiTabItem.vue'
import { useDisabled } from '@core/composables/disabled.composable.ts'
import type { RouteLocationRaw } from 'vue-router'

const props = defineProps<{
  to: RouteLocationRaw
  disabled?: boolean
}>()

const isDisabled = useDisabled(() => props.disabled)
</script>
