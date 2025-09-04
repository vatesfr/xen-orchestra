<template>
  <VtsModalButton variant="primary" :type="onClick ? 'button' : 'submit'" @click="emit('click')">
    <slot />
  </VtsModalButton>
</template>

<script lang="ts" setup>
import VtsModalButton from '@core/components/modal/VtsModalButton.vue'

const { onClick } = defineProps<{
  onClick?: () => void
}>()

const emit = defineEmits<{
  click: []
}>()

defineSlots<{
  default(): any
}>()
</script>
