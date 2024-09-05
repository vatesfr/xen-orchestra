<!-- v1.0 -->
<template>
  <UiIcon :color :icon class="backup-state" />
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import type { BackupState } from '@core/types/backup.type'
import type { Color } from '@core/types/color.type'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faCheckCircle, faCircleMinus, faCircleXmark } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

type Props = {
  state: BackupState
}

const props = defineProps<Props>()

const states: Record<Props['state'], { icon: IconDefinition; color: Color }> = {
  success: { icon: faCheckCircle, color: 'success' },
  partial: { icon: faCircleMinus, color: 'warning' },
  failure: { icon: faCircleXmark, color: 'error' },
}

const icon = computed(() => states[props.state].icon)
const color = computed(() => states[props.state].color)
</script>

<style lang="postcss" scoped>
.backup-state {
  font-size: 1rem;
}
</style>
