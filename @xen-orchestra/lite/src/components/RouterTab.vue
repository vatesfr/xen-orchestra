<template>
  <RouterLink v-slot="{ isActive, href }" :to custom>
    <UiTab
      :selected="isActive"
      :disabled="isDisabled"
      :href="isDisabled ? undefined : href"
      :tag="isDisabled ? undefined : 'a'"
    >
      <slot />
    </UiTab>
  </RouterLink>
</template>

<script lang="ts" setup>
import UiTab from '@core/components/ui/tab/UiTab.vue'
import { useContext } from '@core/composables/context.composable'
import { DisabledContext } from '@core/context'
import type { RouteLocationRaw } from 'vue-router'

const props = withDefaults(
  defineProps<{
    to: RouteLocationRaw
    disabled?: boolean
  }>(),
  { disabled: undefined }
)

const isDisabled = useContext(DisabledContext, () => props.disabled)
</script>
