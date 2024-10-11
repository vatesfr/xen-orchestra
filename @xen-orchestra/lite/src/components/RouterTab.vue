<template>
  <RouterLink v-slot="{ isActive, href }" :to custom>
    <VtsTabItem
      :selected="isActive"
      :disabled="isDisabled"
      :href="isDisabled ? undefined : href"
      :tag="isDisabled ? undefined : 'a'"
    >
      <slot />
    </VtsTabItem>
  </RouterLink>
</template>

<script lang="ts" setup>
import VtsTabItem from '@core/components/tab/VtsTabItem.vue'
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
