<template>
  <UiButton :accent="buttonAccent" :busy="overlay?.isBusy.value" :variant size="medium">
    <slot />
  </UiButton>
</template>

<script lang="ts" setup>
import UiButton, { type ButtonVariant } from '@core/components/ui/button/UiButton.vue'
import { useMapper } from '@core/packages/mapper'
import { IK_OVERLAY } from '@core/packages/overlay/types.ts'
import { IK_OVERLAY_ACCENT } from '@core/utils/injection-keys.util.ts'
import { inject } from 'vue'

defineProps<{
  variant: ButtonVariant
}>()

defineSlots<{
  default(): any
}>()

const overlay = inject(IK_OVERLAY)

const overlayAccent = inject(IK_OVERLAY_ACCENT)

const buttonAccent = useMapper(
  () => overlayAccent?.value,
  {
    info: 'brand',
    warning: 'warning',
    danger: 'danger',
  },
  'info'
)
</script>
