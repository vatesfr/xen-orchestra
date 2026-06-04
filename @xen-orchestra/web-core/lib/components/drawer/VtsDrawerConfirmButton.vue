<template>
  <VtsDrawerButton variant="primary" @click="handleClick()">
    <slot />
  </VtsDrawerButton>
</template>

<script lang="ts" setup>
import VtsDrawerButton from '@core/components/drawer/VtsDrawerButton.vue'
import { IK_DRAWER } from '@core/packages/drawer/types.ts'
import { inject } from 'vue'

const { onClick } = defineProps<{
  onClick?: () => void
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
