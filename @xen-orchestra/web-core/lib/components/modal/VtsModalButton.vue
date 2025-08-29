<template>
  <UiButton :accent="buttonAccent" :busy="modal?.isBusy.value" :variant size="medium">
    <slot />
  </UiButton>
</template>

<script lang="ts" setup>
import UiButton, { type ButtonVariant } from '@core/components/ui/button/UiButton.vue'
import { useMapper } from '@core/packages/mapper'
import { IK_MODAL } from '@core/packages/modal/types.ts'
import { IK_MODAL_ACCENT } from '@core/utils/injection-keys.util.ts'
import { inject } from 'vue'

defineProps<{
  variant: ButtonVariant
}>()

const modal = inject(IK_MODAL)

const modalAccent = inject(IK_MODAL_ACCENT)

const buttonAccent = useMapper(
  () => modalAccent?.value,
  {
    success: 'brand',
    info: 'brand',
    warning: 'warning',
    danger: 'danger',
  },
  'info'
)
</script>
