<template>
  <VtsDrawerButton variant="primary" :disabled @click="handleClick()">
    <slot />
  </VtsDrawerButton>
</template>

<script lang="ts" setup>
import VtsDrawerButton from '@core/components/drawer/VtsDrawerButton.vue'
import { IK_DRAWER } from '@core/packages/drawer/types.ts'
import { inject } from 'vue'

const { onClick } = defineProps<{
  onClick?: () => void
  disabled?: boolean
}>()

defineSlots<{
  default(): any
}>()

const drawer = inject(IK_DRAWER)

function handleClick() {
  if (onClick) {
    onClick()
    return
  }

  drawer?.value.onConfirm()
}
</script>
