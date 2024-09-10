<!-- v1.0 -->
<template>
  <UiIcon :class="className" :icon="icon" class="power-state-icon" />
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import type { POWER_STATE } from '@core/types/power-state.type'
import { faMoon, faPause, faPlay, faStop } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<{
  state: POWER_STATE
}>()

const icons = {
  running: faPlay,
  paused: faPause,
  suspended: faMoon,
  halted: faStop,
}

const icon = computed(() => icons[props.state])

const className = computed(() => `state-${props.state}`)
</script>

<style lang="postcss" scoped>
.power-state-icon {
  &.state-suspended {
    color: var(--color-normal-txt-item);
  }

  &.state-running {
    color: var(--color-success-txt-base);
  }

  &.state-paused {
    color: var(--color-normal-item-active);
  }

  &.state-halted {
    color: var(--color-danger-txt-base);
  }
}
</style>
