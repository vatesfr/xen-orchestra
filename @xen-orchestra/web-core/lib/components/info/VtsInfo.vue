<!-- v2 -->
<template>
  <div class="vts-info">
    <VtsIcon :accent="accent" class="icon" :icon="faCircle" :overlay-icon="icon" />
    <p class="message"><slot /></p>
  </div>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import {
  faCheck,
  faCircle,
  faExclamation,
  faInfo,
  faXmark,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

type Props = {
  accent: 'brand' | 'success' | 'warning' | 'danger'
}

const props = defineProps<Props>()

defineSlots<{
  default(): any
}>()

const iconByAccent: Record<Props['accent'], IconDefinition> = {
  brand: faInfo,
  success: faCheck,
  warning: faExclamation,
  danger: faXmark,
}

const icon = computed(() => iconByAccent[props.accent])
</script>

<style lang="postcss" scoped>
.vts-info {
  align-items: start;
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
