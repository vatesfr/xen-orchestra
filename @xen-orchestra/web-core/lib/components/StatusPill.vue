<template>
  <UiIcon :color :icon class="status-pill" />
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import { computed } from 'vue'
import { faCheckCircle, faCircleMinus, faCircleXmark } from '@fortawesome/free-solid-svg-icons'
import type { Color } from '@core/types/color.type'

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

<style lang="postcss" scoped>
.status-pill {
  font-size: 1rem;
}
</style>
