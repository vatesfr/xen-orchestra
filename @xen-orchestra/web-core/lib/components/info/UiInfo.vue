<!-- v2 -->
<template>
  <div class="vts-ui-info">
    <UiIcon class="icon" :color :icon />
    <p class="message"><slot /></p>
  </div>
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import type { IconColor } from '@core/types/color.type'
import {
  faCheckCircle,
  faExclamationCircle,
  faInfoCircle,
  faXmarkCircle,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

type Props = {
  status: 'info' | 'success' | 'warning' | 'danger'
}
const props = defineProps<Props>()

const states: Record<Props['status'], { icon: IconDefinition; color: IconColor }> = {
  info: { icon: faInfoCircle, color: 'normal' },
  success: { icon: faCheckCircle, color: 'success' },
  warning: { icon: faExclamationCircle, color: 'warning' },
  danger: { icon: faXmarkCircle, color: 'danger' },
}

const icon = computed(() => states[props.status].icon)
const color = computed(() => states[props.status].color)
</script>

<style lang="postcss" scoped>
.vts-ui-info {
  align-items: center;
  display: flex;
  gap: 0.8rem;
}

.icon {
  font-size: 1.6rem;
}

.message {
  font-size: 1.2rem;
}
</style>
