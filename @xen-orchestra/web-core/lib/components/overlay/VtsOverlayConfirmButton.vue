<template>
  <VtsOverlayButton
    variant="primary"
    :type="onClick ? 'button' : 'submit'"
    v-on="onClick ? { click: () => emit('click') } : {}"
  >
    <slot />
  </VtsOverlayButton>
</template>

<script lang="ts" setup>
import VtsOverlayButton from '@core/components/overlay/VtsOverlayButton.vue'

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
