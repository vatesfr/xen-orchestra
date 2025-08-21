<template>
  <VtsIcon :name="icon" size="medium" class="power-state-icon" />
</template>

<script lang="ts" setup>
import { VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums'
import type { IconName } from '@core/icons'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { VM_POWER_STATE } from '@vates/types'
import { computed } from 'vue'

const props = defineProps<{
  state: VM_POWER_STATE
}>()

const icons: Record<VM_POWER_STATE, IconName> = {
  [VM_POWER_STATE.RUNNING]: 'legacy:running',
  [VM_POWER_STATE.PAUSED]: 'legacy:paused',
  [VM_POWER_STATE.SUSPENDED]: 'legacy:suspended',
  [VM_POWER_STATE.HALTED]: 'legacy:halted',
}

const icon = computed(() => icons[props.state])
</script>
