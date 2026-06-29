<template>
  <UiButton :accent :busy="drawer?.isBusy.value" :variant size="medium">
    <slot />
  </UiButton>
</template>

<script lang="ts" setup>
import UiButton, { type ButtonAccent, type ButtonVariant } from '@core/components/ui/button/UiButton.vue'
import { IK_DRAWER } from '@core/packages/drawer/types.ts'
import { inject } from 'vue'

const { accent = 'brand' } = defineProps<{
  variant: ButtonVariant
  accent?: ButtonAccent
}>()

defineSlots<{
  default(): any
}>()

const drawer = inject(IK_DRAWER)
</script>
