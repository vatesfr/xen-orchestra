<template>
  <UiIcon :class="className" :icon class="power-state-icon" />
</template>

<script lang="ts" setup>
import UiIcon from '@/components/ui/icon/UiIcon.vue'
import { VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums'
import { faMoon, faPause, faPlay, faQuestion, faStop } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<{
  state: VM_POWER_STATE
}>()

const icons = {
  [VM_POWER_STATE.RUNNING]: faPlay,
  [VM_POWER_STATE.PAUSED]: faPause,
  [VM_POWER_STATE.SUSPENDED]: faMoon,
  [VM_POWER_STATE.HALTED]: faStop,
}

const icon = computed(() => icons[props.state] ?? faQuestion)

const className = computed(() => `state-${props.state.toLocaleLowerCase()}`)
</script>

<style lang="postcss" scoped>
.power-state-icon {
  color: var(--color-brand-txt-item);

  &.state-running {
    color: var(--color-success-item-base);
  }

  &.state-paused {
    color: var(--color-neutral-txt-secondary);
  }

  &.state-suspended {
    color: var(--color-brand-txt-hover);
  }

  &.state-halted {
    color: var(--color-danger-item-base);
  }
}
</style>
