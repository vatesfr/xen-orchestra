<template>
  <VtsIcon :accent="color" :icon class="vts-backup-state" />
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faCheckCircle, faCircleMinus, faCircleXmark } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

export type BackupState = 'success' | 'failure' | 'partial'

type Props = {
  state: BackupState
}

const props = defineProps<Props>()

const states: Record<Props['state'], { icon: IconDefinition; color: 'success' | 'warning' | 'danger' }> = {
  success: { icon: faCheckCircle, color: 'success' },
  partial: { icon: faCircleMinus, color: 'warning' },
  failure: { icon: faCircleXmark, color: 'danger' },
}

const icon = computed(() => states[props.state].icon)
const color = computed(() => states[props.state].color)
</script>

<style lang="postcss" scoped>
.vts-backup-state {
  font-size: 1rem;
}
</style>
