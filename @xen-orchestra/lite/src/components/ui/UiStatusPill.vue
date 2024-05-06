<template>
  <UiIcon :color :icon class="status-pill" />
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import { computed } from 'vue'
import { faCheckCircle, faCircleMinus, faCircleXmark } from '@fortawesome/free-solid-svg-icons'
import type { Color } from '@/types'

const props = defineProps<{
  state: 'success' | 'partial' | 'failure'
}>()

const states = {
  success: { icon: faCheckCircle, color: 'success' },
  partial: { icon: faCircleMinus, color: 'warning' },
  failure: { icon: faCircleXmark, color: 'error' },
}

const icon = computed(() => states[props.state].icon)
const color = computed(() => states[props.state].color as Color)
</script>

<style scoped lang="postcss">
.status-pill {
  font-size: 1rem;
}
  color: var(--icon-color);

  &.error {
    --icon-color: var(--color-red-base);
  }
  &.warning {
    --icon-color: var(--color-orange-base);
  }
  &.success {
    --icon-color: var(--color-green-base);
  }
}
</style>
