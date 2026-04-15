<template>
  <UiButton accent="brand" :busy="drawer?.isBusy.value" :variant size="medium">
    <slot />
  </UiButton>
</template>

<script lang="ts" setup>
import UiButton, { type ButtonVariant } from '@core/components/ui/button/UiButton.vue'
import { IK_DRAWER } from '@core/packages/drawer/types.ts'
import { inject } from 'vue'

defineProps<{
  variant: ButtonVariant
}>()

defineSlots<{
  default(): any
}>()

const drawer = inject(IK_DRAWER)
</script>
