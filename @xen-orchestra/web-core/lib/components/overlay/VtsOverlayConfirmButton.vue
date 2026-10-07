<template>
  <VtsOverlayButton
    variant="primary"
    :disabled
    :type="onClick ? 'button' : 'submit'"
    v-on="onClick ? { click: () => emit('click') } : {}"
  >
    <slot />
  </VtsOverlayButton>
</template>

<script lang="ts" setup>
import VtsOverlayButton from '@core/components/overlay/VtsOverlayButton.vue'

const { onClick, disabled } = defineProps<{
  onClick?: () => void
  disabled?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()

defineSlots<{
  default(): any
}>()
</script>
