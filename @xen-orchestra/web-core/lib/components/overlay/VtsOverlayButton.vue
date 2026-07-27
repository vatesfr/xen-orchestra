<template>
  <UiButton :accent="buttonAccent" :busy="isBusy" :disabled="isDisabled" :variant size="medium" @click="trigger">
    <slot />
  </UiButton>
</template>

<script lang="ts" setup>
import UiButton, { type ButtonVariant } from '@core/components/ui/button/UiButton.vue'
import { useMapper } from '@core/packages/mapper'
import { useOverlayTrigger } from '@core/packages/overlay/use-overlay-trigger.ts'
import { IK_OVERLAY_ACCENT } from '@core/utils/injection-keys.util.ts'
import { inject } from 'vue'

defineProps<{
  variant: ButtonVariant
}>()

defineSlots<{
  default(): any
}>()

const { isBusy, isDisabled, trigger } = useOverlayTrigger()

const overlayAccent = inject(IK_OVERLAY_ACCENT, undefined)

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
